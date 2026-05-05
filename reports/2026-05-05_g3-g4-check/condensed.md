---
sessionId: session_197
topicId: topic_170
condensedBy: zero
date: 2026-05-05
sources:
  - reports/2026-05-05_close-g3-g4-candidates/arki_rev1.md
  - reports/20260505_close-token-opt-g3g4-riki/riki_rev01.md
  - reports/2026-05-05_close-g3-g4-impl/dev_rev1.md
---

# session_197 condensed — G3/G4 확인 (topic_170)

## 결정 요약

| 규칙 | 대상 파일 | 절감 추정 | 상태 |
|---|---|---|---|
| G3 | `master_feedback_log.json` (~78KB, ~19,710 tokens) | ~19,710 tokens/세션 | 박제 완료 |
| G4 | `{role}_memory.json` 전체 (~6,000 tokens/세션) | ~6,000 tokens/세션 | 박제 완료 |

## 역할별 핵심

### Arki
- **G3**: Step 6 — `apply-feedback.ts` CLI 위임. 인수 4개(topicId·phase·feedback·directive). escape hatch(인수 누락 시 직접 Edit 허용) 명시 필수.
- **G4**: Step 7 — `lessonLog[]` append-only Edit. 스크립트 신규 작성 불필요.
- 기각: `current_session.json`(필수), `reports/`(복잡성 증가), `system_state.json`(hook 자동 처리).

### Riki (리스크)
- 🔴 **R-1 (G3)**: apply-feedback.ts 인수 누락/shell 파싱 오류 시 피드백 미기록 + 감지 경로 차단. 완화: escape hatch + exit code 0 검사 close.md 명시.
- 🟡 **R-2 (G3)**: topicId 미전달 시 topic-level `master_feedback.json` 누락 → closure 검증 gap. 완화: close.md에 "첫 인수=topicId" 강제 명시.
- 🔴 **R-4 (G4)**: `lessonLog` 필드 미존재 역할(riki·sage·zero 등) append 실패. 완화: 전 역할 파일 사전 초기화 필수.
- 🟡 **R-5 (G4)**: 전문 Read 금지 시 중복 lesson 방지 불가. 허용 residual risk 처리.
- 기각: R-3(status 'applied' 불일치 — close 시점 맞음), R-6(절감 효과 의문 — 운용 문제, 정책 아님).

### Dev (구현 완료)
- G4 사전 작업: 역할 파일 11개 전수 검사. `lessonLog: []` 신규 추가 6개(ace·fin·riki·sage·vera·zero). dev_memory.json 비표준 키(`lessonLog_session032/046`) 정규화 완료.
- close.md Step 6(G3) 수정: CLI 위임 + topicId 첫 인수 강제 + exit code 검사 + escape hatch.
- close.md Step 7(G4) 수정: append-only Edit + escape hatch(위치 불명확 시 Read 허용).
- 검증 4/4 PASS: G3 grep PASS, G4 grep PASS, 11/11 lessonLog PASS, lessonLog_session* 0건.

## 변경 파일 목록

- `.claude/commands/close.md` — Step 6/7 G3/G4 박제
- `memory/roles/ace_memory.json` — lessonLog[] 추가
- `memory/roles/fin_memory.json` — lessonLog[] 추가
- `memory/roles/riki_memory.json` — lessonLog[] 추가
- `memory/roles/sage_memory.json` — lessonLog[] 추가
- `memory/roles/vera_memory.json` — lessonLog[] 추가
- `memory/roles/zero_memory.json` — lessonLog[] 추가
- `memory/roles/dev_memory.json` — lessonLog_session032/046 정규화

## 미해결 잔존 리스크

- R-1 escape hatch: close.md에 exit code 0 검사 지시 포함 여부 확인 필요 (Dev 보고 내 명시적 확인 없음)
- R-2: close.md topicId 첫 인수 강제 문구 실제 반영 확인 필요
