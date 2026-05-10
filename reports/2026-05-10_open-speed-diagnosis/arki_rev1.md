---
topic: topic_194
topic_slug: open-speed-diagnosis
title: /open 명령 속도 병목 분석 및 단축 방안
role: arki
phase: analysis
revision: 1
date: 2026-05-10
report_status: draft
session_status: open
turnId: 1
invocationMode: subagent
accessed_assets:
  - .claude/commands/open.md
  - .claude/settings.json
  - .claude/hooks/user-prompt-submit-master-first.js
  - .claude/hooks/user-prompt-submit-skill-recommend.js
  - .claude/hooks/pre-tool-use-task.js
  - scripts/load-context-briefs.ts
  - scripts/create-topic.ts
  - scripts/check-topic-lifecycle.ts
  - scripts/check-context-brief-anchors.ts
  - memory/sessions/session_index.json
  - memory/shared/topic_index.json
  - memory/shared/system_state.json
---

# Arki — /open 명령 속도 병목 분석

## 1. 기술적 성립 여부 — /open 체인 실측 분해

### 현재 /open 실행 체인 (순차 실행)

```
Master → /open → UserPromptSubmit hooks (병렬, ~80ms)
                → Claude LLM 추론 시작
                   ├─ Read: current_session.json (~1ms)
                   ├─ Read: system_state.json (~1ms)
                   ├─ Read: nexus_memory_open.json (~1ms)
                   ├─ Bash: npx ts-node scripts/load-context-briefs.ts [★병목]
                   │         └─ 내부 import: check-topic-lifecycle.ts
                   │         └─ 내부 import: check-context-brief-anchors.ts
                   │         = 3,000~4,300ms (매 실행마다 ts-node cold start)
                   ├─ Read: session_index.json (378KB → Claude 컨텍스트 로드) [★병목]
                   ├─ Read: topic_index.json (136KB → Claude 컨텍스트 로드) [★병목]
                   ├─ (분기 B) Bash: npx ts-node scripts/create-topic.ts [★병목]
                   │         = 3,400~3,500ms
                   └─ Claude 응답 생성 (~40-50초)
```

### 실측 수치 (2026-05-10)

| 단계 | 현재 소요 | 비고 |
|---|---|---|
| UserPromptSubmit hooks | ~80ms | node.js 직접 실행, 병렬 |
| 파일 Read (JSON 소형) | ~5ms | current_session, system_state |
| session_index.json 로드 | ~3ms I/O + **컨텍스트 비용** | 378KB, Claude 컨텍스트 직접 로드 |
| topic_index.json 로드 | ~3ms I/O + **컨텍스트 비용** | 136KB, Claude 컨텍스트 직접 로드 |
| `npx ts-node load-context-briefs` | **3,000~4,300ms** | subprocess cold start 포함 |
| `npx ts-node create-topic` | **3,400~3,500ms** | 신규 토픽 시에만 |
| Claude LLM 추론 | ~40~50초 | **지배적 병목** |

### 중요 발견: in-process require가 267ms

동일한 load-context-briefs 작업을 `ts-node.register()` + `require()` in-process로 실행하면:
- `load-context-briefs` 최초: **267ms** (subprocess 대비 ~12배 빠름)
- 추가 모듈 (check-topic-lifecycle): **88ms**
- 추가 모듈 (check-context-brief-anchors): **19ms**
- 합계: **~374ms** vs subprocess 6,456ms

---

## 2. 프로토콜 호환성 — 기존 시스템 충돌 지점

### 충돌 지점 A: session_index.json (378KB) 전체 로드
- open.md step 4: "다음 sessionId"를 위해 session_index 읽음
- 실제 필요 정보: `sessions` 배열 마지막 항목의 sessionId (1개 값)
- 378KB가 Claude 컨텍스트에 통째로 로드 → LLM 추론 비용 증가
- session_232까지 227개 세션 누적 → 세션마다 ~1.7KB 추가 증가

### 충돌 지점 B: topic_index.json (136KB) 전체 로드
- open.md step 3, 7에서 참조
- 실제 필요: openTopics (6개), 신규 토픽 시 topics 배열 전체
- 136KB도 컨텍스트 로드

### 충돌 지점 C: npx ts-node subprocess × 2 (신규 토픽)
- `load-context-briefs.ts`: subprocess 매번 ts-node cold start (~1,300ms overhead)
- `create-topic.ts`: 추가 subprocess cold start (~1,300ms overhead)
- 두 subprocess 합산 pure overhead: ~2,600ms
- 신규 토픽 시 두 번 실행 = 총 ~7초 순수 subprocess 비용

### 충돌 지점 D: LLM 추론이 모든 컨텍스트 로드 후 시작
- hook은 UserPromptSubmit 시점에 실행되지만
- LLM 추론 자체는 Claude Code 내부 처리 방식에 종속
- 514KB 컨텍스트(파일 읽기 누적)가 클수록 추론 시작 지연

---

## 3. 설계 옵션 (3개)

### 옵션 A: npx ts-node → pre-compiled JS 전환
**방식**: `tsc --watch` 또는 CI 단계에서 `scripts/dist/` 빌드. 런타임에 `node scripts/dist/load-context-briefs.js` 호출.

- 장: subprocess cold start ~3,000ms → ~50ms. 가장 큰 단일 개선.
- 단: 빌드 단계 추가 (tsc watch or pre-build). scripts 수정 시 빌드 잊으면 구버전 실행.

### 옵션 B: open.md 체크리스트 단계 경량화 (추출 + 캐시)
**방식**: `system_state.json`에 `nextSessionId` 필드를 미리 박제 (session-end-finalize.js가 close 시 갱신). session_index.json Read 제거. topic_index 대신 `openTopics[]` subset만 별도 파일로 분리.

- 장: LLM 컨텍스트 로드 -514KB → 약 -370KB. session_index.json Read 제거.
- 단: session-end-finalize.js 수정 필요. nextSessionId 필드 유지 책임 추가.

### 옵션 C: load-context-briefs를 UserPromptSubmit hook으로 이동 (병렬 pre-warm)
**방식**: UserPromptSubmit hook에서 `/open` 감지 시 `node scripts/dist/load-context-briefs.js`를 background 실행. LLM 추론 시작과 동시에 결과 파일 생성. Claude가 Bash 실행 시 파일을 Read만 하면 됨.

- 장: ts-node subprocess 비용이 LLM 추론과 overlap → 체감 속도 0ms.
- 단: `/open` 여부를 UserPromptSubmit 시점에 정확히 감지해야 함. hook 실패 시 silent fallback 필요.

**권고: A + B 조합 (C는 보조)**
- A (pre-compiled JS)가 가장 큰 단일 개선 (~3,000ms 절감). 즉시 적용 가능.
- B (nextSessionId 박제 + 대형 파일 Read 제거)가 LLM 컨텍스트 비용 절감.
- C는 A 완료 후 추가 최적화 시 검토.

---

## 4. 경계 조건 — 설계가 깨지는 조건

- **옵션 A 위험**: `scripts/` 수정 후 `dist/` 빌드 누락 시 구버전 실행. → `package.json` prepublish 스크립트 또는 파일 변경 감시 필요.
- **옵션 B 위험**: session-end-finalize.js가 close 없이 비정상 종료 시 nextSessionId stale. → fallback: nextSessionId 없으면 session_index 마지막 항목에서 계산.
- **옵션 C 위험**: `/open` 아닌 명령에서 hook이 오발동 시 불필요한 파일 생성. → prompt 앞 3글자 `/op` 매칭으로 충분히 제한 가능.
- **공통 경계**: LLM 추론 시간 자체(~40-50초)는 코드 변경으로 단축 불가. 타겟 "30초 이하"는 LLM 추론이 현재 속도 유지를 전제.

---

## 자기감사 (1차)

**structuration 축 (3지점)**
1. open.md와 실제 hook 체인이 분리된 두 흐름 — open.md는 Claude 지시문, hooks는 node.js 실행. 혼동 없음. NICE
2. session_index.json nextSessionId 미존재 → Claude가 배열 scan으로 계산. 숨겨진 비용. MUST_NOW (옵션 B로 해결)
3. load-context-briefs가 3개 모듈을 in-process import하는 구조는 올바름. subprocess가 문제. MUST_NOW (옵션 A로 해결)

**hardcoding 축 (3지점)**
1. MAX_CHARS_PER_REPORT=6000, TOTAL_CAP_CHARS=80000 — pre-tool-use-task.js 하드코딩. 지금 토픽 범위 외. DEFER
2. open.md의 `npx ts-node` 호출이 hardcode — A 채택 시 `node scripts/dist/` 로 교체 필요. MUST_NOW
3. UserPromptSubmit hook timeout 1500ms hardcode — 충분함. NICE

**efficiency 축 (3지점)**
1. session_index.json 378KB를 매번 전체 로드: 최신 sessionId 1개를 위해 낭비. MUST_NOW (옵션 B)
2. topic_index.json 136KB 전체 로드: open 시 필요한 것은 openTopics 6개. 나머지 185개 불필요. SHOULD
3. 3개 ts-node subprocess가 각각 Node.js + TypeScript 컴파일러 초기화: MUST_NOW (옵션 A)

**extensibility 축 (3지점)**
1. 세션 증가에 따라 session_index.json 크기 선형 증가 → 100세션 후 160KB 추가 예상. MUST_BY_N=30
2. open 토픽 증가에 따라 context_brief 읽기 시간 선형 증가 — 현재 4개, 위험 아님. NICE
3. hooks에 /open 감지 로직 추가 시 기존 master-first hook과 역할 분리 명확해야 함. SHOULD

**2차 감사** (scope drift 체크):
원래 토픽 정의 = "/open 속도 분석 + 단축 방안". 본 분석이 구현 계획까지 포함하는데 옵션 수준으로 제한됨. 구현 코드 작성은 Dev 영역. scope 적절.

**3차 감사 (종료 기준 체크)**:
- 발견 1개 이하 달성: NICE/DEFER만 남음. ✓
- Master/Ace 승인 대기

---

## 구조적 실행계획 (executionPlanMode=plan)

### Phase 분해

**Phase 1 — pre-compiled JS 빌드 (옵션 A)**
- `tsconfig.scripts.json` (별도 빌드 config) 작성: `"outDir": "scripts/dist"`, `"rootDir": "scripts"`
- `package.json`에 `"build:scripts": "tsc -p tsconfig.scripts.json"` 추가
- open.md `npx ts-node scripts/load-context-briefs.ts` → `node scripts/dist/load-context-briefs.js` 교체
- create-topic 마찬가지 교체

**Phase 2 — nextSessionId 박제 (옵션 B-1)**
- `session-end-finalize.js`에서 close 시점에 `system_state.nextSessionId = "session_NNN"` 기록
- open.md step 4에서 session_index.json Read 제거 → system_state.nextSessionId 직접 참조
- fallback: nextSessionId 없으면 session_index 마지막 항목 +1

**Phase 3 — openTopics 경량 파일 분리 (옵션 B-2, 선택)**
- `memory/shared/open_topics_brief.json` — openTopics[]만 담은 5KB 파일
- session-end-finalize.js가 close 시 재생성
- open.md step 3에서 topic_index.json 대신 이 파일 Read

### 의존 그래프

```
Phase 1 완료
    → tsconfig.scripts.json + package.json 빌드 스크립트 검증
    → open.md 수정 (npx ts-node → node dist/)
    → create-topic 경로 수정

Phase 1 완료 후 → Phase 2 진입 가능
Phase 2 완료 후 → Phase 3 진입 가능 (Phase 3은 optional)
```

### 검증 게이트

- G1: `npm run build:scripts` 빌드 성공 + `node scripts/dist/load-context-briefs.js` 실행 < 200ms
- G2: `/open` 실행 시 npx ts-node Bash 호출 없음 (logs 확인)
- G3: Phase 2 후 session_index.json Read 호출 없음 (open.md 체크리스트 실행 로그)
- G4: 전체 /open → 첫 Claude 응답 시간 측정 < 30초

### 롤백 경로

- Phase 1 롤백: open.md `node scripts/dist/` → `npx ts-node scripts/` 원복. dist/ 삭제.
- Phase 2 롤백: system_state.nextSessionId 필드 무시 → session_index.json fallback (자동).
- Phase 3 롤백: open_topics_brief.json 읽기 실패 → topic_index.json fallback.

### 전제

- scripts/에 TypeScript 컴파일 오류 없음 (현재 확인: `ignoreDeprecations: '6.0'` 필요)
- tsconfig.json의 `moduleResolution: node` 호환 옵션 별도 설정 필요
- session-end-finalize.js 수정 시 기존 close 체인 테스트 필요

### 중단 조건

- Phase 1: tsc 빌드가 scripts/ 내 TypeScript 오류로 실패 → 오류 수정 후 재진행 (차단 아님)
- Phase 2: session-end-finalize.js 수정이 close 체인에 side effect → rollback + Nexus 보고

---

## 핵심 결론

**LLM 추론(~40-50초)이 지배적 병목이며 코드로 단축 불가.**

코드 레벨 최적화로 단축 가능한 구간:
1. `npx ts-node subprocess` × 2 = **~6,000ms** → pre-compiled JS로 **~100ms** (Phase 1, MUST_NOW)
2. `session_index.json` 378KB 컨텍스트 로드 = LLM 추론 비용 증가 → nextSessionId 박제로 제거 (Phase 2, MUST_NOW)
3. `topic_index.json` 136KB → 선택적 최적화 (Phase 3, SHOULD)

**현실적 목표**: 코드 최적화로 단축 가능한 구간은 ~6초. "30초 이하"는 LLM 추론 자체가 현재 대비 개선되어야 달성 가능. 코드 최적화 후 체감 목표 = **가능한 한 Claude 첫 출력까지 불필요한 대기 제거**.
