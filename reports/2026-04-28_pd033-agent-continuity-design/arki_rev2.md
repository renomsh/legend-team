---
role: arki
session: session_123
topic: topic_121
topicSlug: pd033-agent-continuity-design
turnId: 2
invocationMode: subagent
grade: A
executionPlanMode: plan
date: 2026-04-28
rev: 2
---

# Arki — 3-Tier 메모리 모델 정식 정리 (PD-033 / 044 / 043 묶음)

Arki입니다. Master reframing — 페르소나(간략 성향) / 캐릭터(장기 기억) / temp(단기 기억) 3-tier — 은 1차 발언 옵션 1·2 분기를 폐기시키는 상위 모델입니다. 인간 인지(작업/단기/장기 기억) 정합. 1차 발언 옵션 2의 "박제 위치 분리"가 이 3-tier 안에서 자연스럽게 해소됩니다. 단일 강한 권고로 정리합니다.

---

## Section 1. 폴더·파일 명명·배치 (단일 권고)

### 1.1 권고 디렉토리 트리

```
memory/
├── roles/
│   ├── personas/                          # Tier 1 — 페르소나 (정체성·성향)
│   │   ├── role-ace.md                    # 슬림화: 정체성·말투·자기소개 제약·레퍼런스 인물
│   │   ├── role-arki.md
│   │   ├── role-fin.md
│   │   ├── role-riki.md
│   │   ├── role-edi.md
│   │   ├── role-dev.md
│   │   ├── role-nova.md
│   │   └── role-vera.md
│   │
│   ├── characters/                        # Tier 2 — 장기 기억 (NEW, JSON 유지)
│   │   ├── ace_memory.json                # 현 memory/roles/ace_memory.json 이동
│   │   ├── arki_memory.json
│   │   ├── fin_memory.json
│   │   ├── riki_memory.json
│   │   ├── edi_memory.json
│   │   ├── dev_memory.json
│   │   ├── nova_memory.json
│   │   └── vera_memory.json
│   │
│   └── (legacy *_memory.json 위치)        # 마이그레이션 완료 후 제거
│
├── sessions/
│   ├── current_session.json
│   ├── session_index.json
│   └── temp/                              # Tier 3 — 단기 기억 (NEW, FIFO)
│       └── {sessionId}/
│           ├── ace.jsonl                  # turn별 1줄 append
│           ├── arki.jsonl
│           └── ...                        # 발언한 역할만 생성
│
└── shared/
    ├── ... (기존 파일들)
    └── dispatch_template.md               # 메인 dispatch 표준 prompt (NEW)
```

### 1.2 명명 규칙 정리

| Tier | 위치 | 파일명 | 형식 | 갱신 시점 |
|---|---|---|---|---|
| 1 | `memory/roles/personas/` | `role-{role}.md` (기존 유지) | Markdown 자연어 | 정체성·말투 변경 시 (드물게) |
| 2 | `memory/roles/characters/` | `{role}_memory.json` (현 위치에서 이동) | JSON 구조화 | 세션 종료 시 누적 학습 박제 |
| 3 | `memory/sessions/temp/{sessionId}/` | `{role}.jsonl` | JSON Lines (turn당 1줄) | 서브 발언 직후 append |
| dispatch | `memory/shared/` | `dispatch_template.md` | Markdown | 발언 구조·write 계약·self-score 규칙 변경 시 |

**핵심 결정**: Tier 3은 `memory/sessions/temp/{sessionId}/{role}.jsonl` JSON Lines 단일 파일 — turn당 1줄 append. 같은 turnIdx 충돌은 mtime + nanoTimestamp로 회피. 토픽 구분은 entry 안의 `topicId` 필드로.

### 1.3 짓지 않음 검토 (Hickey 의무)

대안: Tier 3을 `topics/{topicId}/session_contributions/{sessionId}.md`로 갈음.
- (−) 토픽 단위 — session 진행 중 read는 가능하나 *역할별·turn별* index가 자연어 안에 묻혀 있어 메인이 매번 파싱 필요. JSON Lines가 본 목적(직전 N turn 빠른 inject)에 단순.
- 결론: Tier 3 신설 정당. session_contributions와 직교(다른 grain).

---

## Section 2. 각 Tier 내용 정의 (필드·스키마)

### 2.1 Tier 1 — 페르소나 (슬림화, .md)

**남기는 것**:
- 역할 정체성 1~2문장
- 페르소나 모델(예: Rich Hickey)·스타일
- 절대 금지(아름다운 구조 유혹·과잉 추상화·D-017 금지어)
- 자기소개 제약(F-013)
- 레퍼런스 인물(사고 모델로만)

**빠지는 것 → 갈 곳 (단일 권고)**:
| 현 페르소나 블록 | 새 위치 | 이유 |
|---|---|---|
| "발언 구조" (구조 분석 단계 1~4 등) | `dispatch_template.md`의 "역할별 발언 구조" 표 | 정책이지 정체성 아님 |
| "Write 계약" (WRITE_PATH·frontmatter·turnId 의무) | `dispatch_template.md`의 "공통 Write 계약" | 8역할 동일 — DRY |
| "Self-Score YAML 출력 계약" + 본 역할 지표 표 | `dispatch_template.md` "self-score 규칙" + 캐릭터 JSON `signatureMetrics[]` | 지표 정의 단일 출처 D-092 정합 |
| "컨텍스트 활용 지시" (X.json Read 권장 등) | `dispatch_template.md` "Tier 2/3 read 절차" | 메인 책임 |
| "원칙" (실현 가능성 > 미학 등) | 페르소나에 1~2줄만 잔존 (정체성 색채) | 일부는 정체성 — 분리 1줄 |

**슬림화 후 페르소나 길이 추정**: 현 85~105줄 → 30~40줄 (≈60% 축소)

### 2.2 Tier 2 — 캐릭터 / 장기 기억 (JSON 유지)

**스키마**:
```json
{
  "role": "arki",
  "version": "2.0",
  "responsibilities": ["구조 설계", "실행계획", ...],
  "signatureMetrics": [
    {"shortKey": "aud_rcl", "type": "core", "weight": 0.50, "scale": "Y/N"},
    ...
  ],
  "selfAuditRules": [
    "다축 검증 의무 (코드·hook·페르소나·feedback)",
    "mitigation+fallback 병기 의무",
    "짓지 않음 옵션 검토",
    ...
  ],
  "patterns": [
    {"id": "P-001", "context": "...", "lesson": "...", "session": "session_xxx"},
    ...
  ],
  "findingsArchive": [
    {"id": "F-NNN", "topic": "topic_xxx", "summary": "...", "session": "session_xxx", "ts": "..."}
  ],
  "hitRate": {"recent10": 0.7, "recent50": 0.65},
  "lastUpdated": "session_123"
}
```

**갱신 주체·주기**: 세션 종료 시 `session-end-finalize.js`가 해당 세션 turns[]에서 신규 finding/pattern을 후보 추출 → Edi가 캐릭터 JSON에 append 박제. 자가평가 단순화(D-092)와 정합 — 자동 게이트 폐기.

### 2.3 Tier 3 — temp / 단기 기억 (JSON Lines)

**한 줄 entry 스키마**:
```json
{"sessionId":"session_123","topicId":"topic_121","role":"arki","turnIdx":2,"ts":"2026-04-28T...","summary":"옵션2 권고","findings":["F-NNN"],"keyDecisions":["박제 경로 분리"],"nextHandoff":"Fin contamination 감사 + 비용 평가"}
```

**필드 정의**:
- `sessionId` `topicId` `role` `turnIdx` — primary key 4튜플
- `ts` — ISO timestamp (race tie-break)
- `summary` — 200자 이내 핵심 1줄. 메인이 다음 호출 inject 시 첫 줄
- `findings[]` — 본 turn에서 박제·발견한 F-NNN id 배열 (캐릭터 archive와 link)
- `keyDecisions[]` — 본 turn 결정점 (선택)
- `nextHandoff` — 다음 발언자에게 넘길 한 줄 (선택)

**한계량 (B1 결정)**: **session 단위 별도 cap 없음 + 토픽 종료 시 폐기 + inject scope에서 "직전 N=3 turn"만 cap**.
- 디스크: session 100 turn × 200자 ≈ 20KB → 무시
- 토픽 종료 시 해당 session/{role}.jsonl에서 그 topicId entry는 캐릭터 patterns로 승격 후보만 유지하고 raw entry 폐기 (Phase로 분리)
- 메인 prompt inject 비대화 방지 위해 *inject 시점*에서 "최근 N=3 같은 role+topic turn"만 selector

**FIFO 만료 정책**: session 종료 finalize에서 7일 이상 경과 session의 temp/ 디렉토리 archive 또는 삭제.

### 2.4 Dispatch 표준 prompt (`memory/shared/dispatch_template.md`)

**구성 블록 (메인이 매 호출 system prompt 작성 시 참조)**:
1. **호출 메타데이터** — session/topic/topicSlug/grade/turnIdx/WRITE_PATH/frontmatter
2. **Tier read 절차**:
   - "(필수) 페르소나 `memory/roles/personas/role-{role}.md` Read"
   - "(필수) 캐릭터 `memory/roles/characters/{role}_memory.json` Read — signatureMetrics·selfAuditRules·patterns 인지"
   - "(조건부) temp `memory/sessions/temp/{sessionId}/{role}.jsonl` 마지막 N=3줄 Read — 같은 topicId 우선"
3. **역할별 발언 구조** — 8역할 표 (현 페르소나에서 이전된 발언 단계)
4. **공통 Write 계약** — WRITE_PATH 저장, 첫 줄 `{ROLE}_WRITE_DONE:`, frontmatter (turnId/invocationMode/role/session/topic), Tier 3 append (1줄 jsonl)
5. **공통 Self-Score 규칙** — YAML 블록 본문 말미, 캐릭터 JSON signatureMetrics 정의 따름
6. **공통 inject scope** (역할별 차등):
   - Ace = session 누적 + 모든 역할 Tier 3 마지막 1줄씩
   - Arki/Riki/Fin = 같은 topicId 자기 마지막 N=3 + Ace 마지막 turn
   - Edi/Dev = 직전 turn (모든 역할) 마지막 1줄
   - Nova = inject 없음 (의외성 보존)

---

## Section 3. 결정축 B1~B4 단일 권고

### B1. temp 한계량 — **단일 cap 없음 + inject 시점 N=3 cap + 토픽 종료 시 raw 폐기**
- 디스크는 무시 가능 (session 100 turn ≈ 20KB)
- 메인 prompt 폭증 방지는 *inject scope*에서 처리: 같은 role+topic 마지막 3 turn
- 토픽 종료 시 캐릭터 patterns 승격 후보만 추출, raw jsonl entry는 폐기
- 7일 경과 session/ 디렉토리 자동 archive (FIFO)
- 근거: 단일 N turn cap은 다양한 토픽 길이에 부적합. inject scope만 관리.

### B2. 승격 기준·주체 — **세션 종료 finalize 자동 후보 추출 + Edi 일괄 검토 박제 + Master 명시 거부 시 보류**
- finalize hook이 turns[]에서 다음 신호 매칭 시 "캐릭터 승격 후보" 박제: (a) F-NNN 신규 박제, (b) D-NNN 직접 기여, (c) Master 피드백 인용·수용
- Edi가 세션 종료 산출물에 "캐릭터 승격 후보" 섹션 포함 → Master 무응답 = 승인(저마찰 자율성)
- Master 명시 거부 시 그 turn은 patterns 미박제, raw temp만 7일 후 폐기
- 근거: 자동만 → 노이즈, 수동만 → 누락. finalize 후보 추출 + Edi 일괄 + 저마찰 무응답 승인이 단순 + 통제 양립.

### B3. 페르소나 슬림화 범위 — **정책 본문 전부 `dispatch_template.md`로 이전 + 페르소나는 정체성·금지어·자기소개 제약만**
- 발언 구조·Write 계약·Self-Score 계약 → dispatch_template.md
- 컨텍스트 활용 지시 → dispatch_template.md (Tier read 절차)
- 원칙(실현 가능성 > 미학 등) → 1~2줄만 페르소나에 잔존 (정체성)
- 근거: K4 §1.2 (페르소나 자동 inject 인프라 부재)가 1차 발언에서 확인됨. 메인 prompt가 canonical → dispatch_template.md가 자연스러운 single source. 페르소나 비대화 60% 축소.

### B4. Tier 2 포맷 — **JSON 유지 (자연어 .md 전환 X)**
- 현 `_memory.json` 그대로 `characters/` 이동만
- 이유: signatureMetrics·hitRate·patterns id·findings archive는 *기계 가독* 필요. D-092 자가평가 단순화는 "지표 정의 단일 출처"를 강제 — JSON이 적합.
- 자연어 .md는 패턴 추출·hitRate 계산이 ad-hoc 파싱 부담. ROI 음수.
- 근거: B4를 .md로 가면 finalize hook이 후보 추출 못함 → B2 자동화 무력화.

---

## Section 4. 기존 시스템과 충돌·마이그레이션

### 4.1 영향 매트릭스

| # | 기존 자산 | 영향 | 처리 |
|---|---|---|---|
| 1 | `memory/roles/{role}_memory.json` 8개 | Tier 2로 이동 | `memory/roles/characters/` 신설 + git mv. 본문 수정 0 |
| 2 | `memory/roles/personas/role-*.md` 8개 (총 739줄) | 60% 슬림화 | 본 토픽 Phase 3에서 일괄. 정책 블록 dispatch_template.md로 이전 |
| 3 | `topics/{id}/session_contributions/{session}.md` (PD-020b/c) | 토픽 단위 자연어 누적 — 직교 | 변경 없음. Tier 3 jsonl과 다른 grain |
| 4 | `topics/{id}/turn_log.jsonl` | turn 단위 jsonl — Tier 3과 grain 동일 | **검토 필요**: turn_log.jsonl을 Tier 3과 통합할지. 결정: turn_log.jsonl은 *토픽 archive*용 (영구), Tier 3은 *세션 ephemeral*. **둘 다 유지** — turn_log.jsonl이 토픽 종료 시 raw temp의 영구 보존본 역할. finalize에서 temp/ → turn_log.jsonl로 archive |
| 5 | `topics/{id}/context_brief.md` | 토픽 누적 brief | 변경 없음 |
| 6 | `.claude/hooks/session-end-finalize.js` (484줄) | Tier 3 → Tier 2 승격 후보 추출 + temp/ archive 로직 추가 | Phase 5에서 함수 1~2개 추가. 기존 turns→session_index 전파는 그대로 |
| 7 | `.claude/hooks/session-end-tokens.js` | 영향 없음 | — |
| 8 | `scripts/auto-push.js` | hook chain 변경 없음 | — |
| 9 | `compile-metrics-registry.ts` (D-092) | `memory/roles/characters/` 경로로 입력 path 변경 | Phase 3 path 1줄 수정 |
| 10 | `scripts/lib/turn-types.ts` | Turn 인터페이스에 `tempRef?: string` 1필드 선택 추가 (선택) | 인터페이스 호환 위해 optional |

### 4.2 마이그레이션 의존 그래프

```
Phase 1 (spec 동결)
  └→ Phase 2 (디렉토리 신설 + dispatch_template.md 작성)
        ├→ Phase 3a (페르소나 슬림화 8개 일괄)
        ├→ Phase 3b (memory/roles/{role}_memory.json → characters/ git mv)
        └→ Phase 3c (compile-metrics-registry.ts path 1줄 수정)
              └→ Phase 4 (Tier 3 jsonl write 로직 — 페르소나 Continuity 블록 → dispatch_template으로 이전 + 메인 prompt가 매 호출 inject)
                    └→ Phase 5 (finalize hook 확장: 승격 후보 추출 + temp archive)
                          └→ Phase 6 (PD-043 사칭 hook — turns[].role ↔ Task tool_use)
                                └→ Phase 7 (resolveCondition dry-run: Arki 3회 호출 F-NNN 유지)
                                      └→ Phase 8 (Edi 컴파일·세션 종료)
```

### 4.3 자가평가 단순화 (D-092) 정합성 검증

D-092는 "지표 정의 단일 출처는 `memory/roles/{role}_memory.json[].metrics`". 본 권고에서 그 위치가 `memory/roles/characters/{role}_memory.json[].signatureMetrics`로 이동.

**정합 보장**:
- compile-metrics-registry.ts 입력 path 1줄 수정으로 출력은 동일(`memory/growth/metrics_registry.json`)
- 페르소나에 박혀있던 "본 역할 지표 (4건)" 표는 캐릭터 JSON signatureMetrics로 일원화 → *오히려 D-092 정합 강화*
- self-score YAML 블록 출력 계약은 dispatch_template.md에 일원화 → 8역할 일관

---

## Section 5. 짓지 않음 옵션 검토 (Rich Hickey 의무)

### 5.1 "Tier 3 신설하지 않고 turn_log.jsonl 재활용"
- (+) 신설 0
- (−) turn_log.jsonl은 *토픽* 단위 archive — session 진행 중 *역할별 직전 N turn* 검색에 매번 토픽 전체 스캔 필요. session 50 turn 시 read 비용 누적
- (−) topic_113 등 기존 인프라는 *토픽 archive* 목적 — session ephemeral과 grain 다름
- 결론: **기각**. Tier 3 신설 정당.

### 5.2 "Tier 2 자연어 .md 전환"
- (+) Master가 직접 읽기 편함
- (−) finalize hook 자동 추출 불가 → B2 자동화 무력화
- (−) signatureMetrics·hitRate·patterns id 기계 가독 손실 → D-092 정합 깨짐
- 결론: **기각**. JSON 유지.

### 5.3 "dispatch_template.md 신설 안 함, 페르소나에 정책 잔존"
- (+) 파일 1개 적음
- (−) 1차 발언 K4 §1.2: 페르소나 자동 inject 인프라 부재 — 정책이 페르소나에만 박혀있으면 메인이 매번 페르소나 Read 명시 지시해야 작동. 본 호출이 그 증거
- (−) 페르소나 비대화 — 8역할 × 50줄 정책 중복 = 400줄 중복
- 결론: **기각**. dispatch_template.md 신설 정당.

### 5.4 "PD-043 사칭 hook 짓지 않음"
- (+) 인프라 1개 적음
- (−) 22세션 fiction(F-005 Ace relay) 재발 시 검출 수단 부재
- (−) Phase 6에 작은 함수 1개 추가 — 비용 미미
- 결론: warning만 출력 (차단 X)으로 비용 최소화 + 유지.

---

## Section 6. 다축 검증 (feedback_arki_full_system_view 의무)

### (a) 페르소나 파일 8개 실제 슬림화 가능성 — 본문 점검 결과
- `role-arki.md` 85줄: "발언 구조"(20줄) + "컨텍스트 활용 지시"(5줄) + "Write 계약"(13줄) + "Self-Score" (24줄) + "원칙"(7줄) = 69줄이 정책. 정체성 16줄. **슬림화 후 ~30줄 가능**
- `role-ace.md` 105줄, `role-edi.md` 102줄, `role-dev.md` 101줄도 동일 패턴(40~70% 정책 비중) — 슬림화 효과 실측 확인
- `role-vera.md` 90줄도 동일 — 8개 모두 일관 슬림화 가능

### (b) hook chain 영향 — finalize/tokens/auto-push
- `session-end-tokens.js`: 영향 0 (transcript 파싱만)
- `session-end-finalize.js` (484줄): turns→session_index 전파 로직 유지 + 승격 후보 추출 함수 1~2개 신규 + temp/ archive 1개 추가. 기존 로직 회귀 없음
- `auto-push.js`: hook chain 순서 변경 없음
- compile-metrics-registry.ts: path 1줄 수정

### (c) memory feedback 정책 문서 — MEMORY.md 인덱스 + 주요 feedback md 정합
- `feedback_arki_full_system_view`: 본 발언 4축(코드·hook·페르소나·dispatch) 모두 점검 ✅
- `feedback_arki_risk_requires_mitigation`: Section 7 mitigation+fallback 병기 ✅
- `feedback_no_premature_topic_split`: 분화 권고 없음 — 본 토픽에서 결정+구현 완결 권고 (A4-α 유지) ✅
- `feedback_implementation_within_3_sessions`: Phase 1~8 단일 세션 범위 ✅
- `feedback_low_friction_no_redundant_gate`: B2 무응답=승인 정책 채택 ✅
- `feedback_no_middle_ground`: B1~B4 모두 단일 권고 ✅
- `feedback_dev_verify_and_callable`: Phase 7 resolveCondition dry-run 명시 ✅

### (d) 실호출 인프라 — 본 호출 Agent 툴 패턴
- 본 호출 system prompt가 "페르소나 원본 Read 의무" + "이전 발언 Read 명시" + "WRITE_PATH 명시" + "frontmatter 명시" 모두 메인 prompt에서 inject — **페르소나 자동 inject 부재가 다시 입증**
- 본 호출이 dispatch_template.md의 prototype과 사실상 동등 — 즉 본 권고는 *현재 메인이 매번 직접 박는 prompt 골격을 파일로 승격*하는 것. 신규 발명 0.

---

## Section 7. 함정 사전 고지 + Mitigation/Fallback

| # | 리스크 | 사전 신호 | Mitigation | Fallback |
|---|---|---|---|---|
| R1 | 페르소나 슬림화 시 정체성 색채 손실(역할 발언 톤 평탄화) | Master가 "발언이 색이 없다" 피드백 | 정체성·말투·금지어는 페르소나에 명시 잔존, 정책만 이전 | 슬림화 1역할 시범(arki) → Master 톤 검수 → 통과 시 8개 적용 |
| R2 | dispatch_template.md 신설 후 메인이 안 읽음 | 다음 세션 호출에서 Tier 3 jsonl 미작성 | 메인 호출 prompt 첫 줄에 "dispatch_template.md 준수 필수" 의무 / `.claude/skills/dispatching-parallel-agents/SKILL.md`에 link | `current_session.json`에 dispatch_template_version 필드 추가, finalize에서 mismatch 검증 |
| R3 | Tier 3 jsonl write race (병렬 dispatch 동일 sessionId/role) | 같은 turnIdx 2회 entry | append-only + ts nanoTimestamp + finalize 시 dedupe | 충돌 검출 시 양쪽 유지, 메인이 마지막 mtime read |
| R4 | Tier 2 마이그레이션 시 compile-metrics-registry.ts 경로 못 찾음 | 빌드 실패 | Phase 3c path 1줄 수정 + 기존 위치 symlink/wrapper 1세션 유지 | rollback: git mv 역수행, path 원복 |
| R5 | 토픽 종료 시 raw jsonl 폐기 후 finalize 후보 추출이 부정확 | 캐릭터 patterns에 노이즈 누적 | Edi 일괄 검토 + Master 무응답=승인 (B2 정책) | 후보 추출 false positive 시 Master 명시 거부 → 그 turn은 미박제 |
| R6 | 7일 archive 후 raw temp 영구 손실 위험 (디버깅 곤란) | 과거 fiction 재발 시 추적 불가 | turn_log.jsonl이 *토픽 단위 영구* archive 역할 — Tier 3 폐기 전 turn_log로 transfer 의무 | turn_log.jsonl 누락 시 신규 fiction → 별도 PD |
| R7 | dispatch_template.md가 페르소나 자동 inject 없는 상태에서 메인이 매번 prompt에 명시 inject 안 함 | 본 호출처럼 메인 prompt에 직접 박는 방식이 표준화 안 됨 | `.claude/hooks/`에 dispatch 시점 prompt 검증 hook 신규 — sub_agent 호출 시 dispatch_template_version 포함 검사 (PD-043과 묶음) | hook가 warning만 출력 → 차단 X (false positive 회피) |
| R8 | Tier 3 jsonl entry 키 정의가 8역할에서 일관성 없이 진화 | 메인이 새 필드 추가 시 8역할 한 번에 갱신 안 됨 | dispatch_template.md에 jsonl 스키마 단일 정의 + jsonschema 파일 1개 | schema 위반 entry는 finalize에서 gap 박제, runtime 차단 X |

---

## Section 8. 자기감사 1라운드 (자발 — feedback_arki_self_audit_on_pressure 정합)

1. **다축 검증** (4축 a/b/c/d 모두 ✅) — Section 6 완료
2. **mitigation+fallback 병기** — Section 7 8건 모두 병기 ✅
3. **금지어 v0** — `D+N일`/`N주차`/`MM/DD`/`담당자:`/`N시간`/`공수` 본 발언 0건. Phase 명만 사용 ✅
4. **짓지 않음 옵션** — Section 5 4개 시나리오 검토 ✅
5. **Dev 양방향 협의** — Phase 1 spec 동결 전 Master 수정 가능 명시 ✅
6. **단일 강한 권고** (feedback_no_middle_ground) — B1~B4 모두 단일 ✅
7. **3세션 이내 완결** — Phase 1~8 단일 세션 + 본 토픽 안에서 완결 ✅

**자가 점검 결함 1건**: Section 1.2의 `dispatch_template.md` 위치를 `memory/shared/`로 단정했음. `.claude/skills/`나 `agents/`도 후보. **Master에 위치 1줄 확인 필요** — 단 본 발언 권고는 `memory/shared/` 유지(정책 자산은 모두 그 디렉토리에 집결, role_registry/topic_lifecycle_rules 등 동위).

---

## Master 결정 필요 (1건만)

본 3-tier 권고 전체를 spec으로 동결하고 Phase 1로 진입할지. 단 다음 1개 위치 결정만 함께:
- `dispatch_template.md` 위치 = `memory/shared/dispatch_template.md` (Arki 권고) vs 다른 곳

무응답 = 권고 그대로 진행 (저마찰 무응답 승인 정합).

---

## 메인 보고용 요약 (3~5줄)

- 3-tier 모델 정식 정리: Tier1 페르소나(`memory/roles/personas/`, 60% 슬림) / Tier2 캐릭터(`memory/roles/characters/{role}_memory.json`, 현 위치 이동) / Tier3 temp(`memory/sessions/temp/{sessionId}/{role}.jsonl` 신설).
- 추가 신설 1: `memory/shared/dispatch_template.md` — 8역할 공통 발언구조·Write계약·Self-Score·Tier read 절차·inject scope 일원화.
- B1=토픽종료시 폐기+inject N=3 cap / B2=finalize 자동후보+Edi박제+Master무응답승인 / B3=정책 본문 전부 dispatch_template로 / B4=JSON 유지.
- 페르소나 자동 inject 부재(K4 §1.2)가 본 권고 정당화. dispatch_template.md가 메인 prompt single source가 되어 페르소나 비대화 회피 + D-092 정합 강화.
- Master 단일 결정 필요: spec 동결 + dispatch_template.md 위치 = `memory/shared/`. 무응답=진행.

---

```yaml
# self-scores
aud_rcl: Y
str_fd: 4
spc_lck: N
sa_rnd: 1
```

**다음 발언자 추천**: Fin (Section 5 실행계획 contamination 감사 + Tier 1/2/3 비재무 비용 평가 + 페르소나 슬림화 ROI)
