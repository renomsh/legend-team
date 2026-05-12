---
role: arki
session: session_242
topic: topic_204
topicSlug: nexus-architecture-audit
date: 2026-05-12
rev: 1
---

# Arki — 레전드 넥서스 아키텍처 구조 감사

## A. 핵심 판정: **보완** [T3/A1/O3]

재설계 아님. 코어 추상(역할·등급·라이프사이클·SOT-mirror)은 일관. 운영 레이어(특히 `session-end-finalize.js`)에 31개 함수가 단일 파일에 누적되어 SRP 침범 [T4/A0/O5]. 페르소나·정책·CLAUDE.md·dispatch_config 간 단일 출처 원칙은 `rules.edi`처럼 "박제만 하고 hook은 read 안 함" 패턴이 박혀있음.

## B. 구조상 가장 위험한 3개 지점

### B1. `session-end-finalize.js` 단일 파일 비대화 (1894줄 / 31 함수) [T4/A1/O5]
- D-070·D-101·D-124·D-130·D-131·D-138·D-140·D-169·PD-052·PD-053·PD-064·PD-070·PD-071 등 13+개 결정이 한 파일 인라인
- `writeJson(sess)` 22회 호출. 부분 실패 시 멱등성 가드는 `sess.finalizedAt` 하나뿐 (L1845) → silent corruption 가능
- 반례 확인: hook 자체는 catch-all로 `process.exit(0)` 보장(L1889). 체인 중단은 막지만 **부분 박제 상태는 detection 불가**
- 수정안: `.claude/hooks/lib/finalize/` 디렉토리로 함수군 분리 — 5 모듈 + orchestrator(~200줄)

### B2. `auto-push.js` 머지 충돌 보호의 비대칭 [T4/A1/O5]
- `.gitattributes`에 `merge=ours` 9종 — 모두 mirror/캐시
- `decision_ledger.json`·`topic_index.json` 같은 SOT까지 merge=ours로 박혀있음 (L11~12)
- 두 워크트리가 같은 D-NNN을 동시 박제하면 나중 머지 워크트리의 ours 채택으로 첫 워크트리 결정 소실 가능
- 수정안: SOT는 merge=ours 제외하고 별도 머지 드라이버 또는 append-only JSONL

### B3. dispatch_config의 "박제만" 패턴 (enforcement 단절) [T4/A2/O5]
- `dispatch_config.json` L7 코멘트 명시 — `rules.edi`는 hook이 read하지 않음
- D2(도구 설명 거짓 전제) Prime Directive 정면 위반
- 실제 enforcement는 finalize.js L1031에 하드코딩
- 수정안: `lib/dispatch-config-evaluator.js` 신설 — config read enforcement 또는 rules.edi 키 자체 삭제

## C. 지금 안 고치면 누적 손상

### C1. CLAUDE.md decision-ID 점착성 [T4/A1/O3]
- 75 D-refs / 314줄. 1ref/4줄 (Riki 정정: 실측 41 unique, 1ref/7.6줄)
- CLAUDE.md 자체가 변경되면 무조건 structural bump → 매 세션 +0.1 cap 도달
- 수정: 결정 인용 감축 + section-hash 기반 bump 룰

### C2. session-end-finalize.js와 settings.json 사이 hook 누락 [T4/A1/O5]
- SessionEnd는 `auto-push.js` 단일 entry
- `session-end-tokens.js`·`session-end-finalize.js`는 settings.json에 직접 등록 안 됨 — 간접 호출
- 한 단계 실패 시 finalize/transcript 박제 미발생 → 다음 세션 시작 시 감지 불가
- 수정: settings.json에 4 entry 분리 또는 auto-push 내부 try/catch 격리

### C3. PD 14건 resolved + 9건 open — resolveCondition 부재 다수 [T4/A1/O3]
- open 9건 중 다수 title·priority·resolveCondition 누락 → 자동 transition 매칭 불가 → 무한 stale

## D. 과설계·중복

- **D1.** versionBump 4-함수 6-분기 (detect/apply/check/skip-flag)
- **D2.** inline-role-header 검증과 auditRoleImpersonation 신호 중복
- **D3.** master-first hook 3중(UserPromptSubmit + PreToolUse Task + state/config 2 JSON)

## E. 삭제 가능

- **E1.** `backfill-*` 8건 (1회용 마이그레이션) → `scripts/_archived/migrations/`
- **E2.** `.gitattributes`의 `dist/**` merge=ours — `.gitignore`가 정상
- **E3.** `spike-k6-pretool-task-mutation.js` (settings.json 미등록 dead code 추정)

## F. 반드시 보존

- **F1.** Prime Directive D1~D4 + `validate-prime-directive.ts` hook
- **F2.** SOT-mirror 이원화 (`updateTopicStatus()` 단일 헬퍼)
- **F3.** D-187 main-branch protection (B2 부분만 수정)
- **F4.** dispatch_config 7키 SOT
- **F5.** turns[] 단일 원천 (D-048)
- **F6.** Grade S/A/B/C + 2축 패턴

## G. 리팩토링 우선순위 5

| 순위 | 작업 | 영향 |
|---|---|---|
| **G1** | finalize.js 분해 — `lib/finalize/{turns,session-index,gaps,version-bump,propagation}.js` 5 모듈 + orchestrator | HIGH |
| **G2** | `.gitattributes` SOT 제거 (L11~12) + append-only JSONL 또는 custom merge driver | HIGH |
| **G3** | dispatch_config enforcement 일치 — `lib/dispatch-config-evaluator.js` 신설 | MED |
| **G4** | CLAUDE.md 결정 인용 감축 (75 → ~20) | MED |
| **G5** | PD 위생화 + PD-087 즉시 fix | LOW-MED |

## 메타·불확실 영역 (D-185 자가 검증 한계)

- 읽은 파일 ~18개, 발견 이슈 12건 (HIGH 2 / MED 5 / LOW 5)
- 미검증: compute-dashboard.ts 내부, pre-tool-use-task.js fire 결과, master-first 3중 dead path
- 최대 [T4] — 독립 재현([T5])은 Riki 영역

## 다음 호출 권고
1. Riki (적출 검증) — B2 SOT 머지 충돌 재현 검증
2. Fin (비용 정합) — G1 분해 ROI
3. Zero (정제) — E1·E3 dead-code 삭제
