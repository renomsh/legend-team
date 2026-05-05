---
role: arki
date: 2026-05-05
topic: close.md G3/G4 토큰 절감 후보 선정
turnId: 1
invocationMode: subagent
---

# Arki — close.md G3/G4 토큰 절감 후보 분석

## 현황 스냅샷

| Step | 파일 | LLM Read 여부 | 현재 규칙 | 절감 |
|---|---|---|---|---|
| Step 3 | decision_ledger.json | 금지 (G1) | 스냅샷 스크립트 | 48K tokens |
| Step 4 | topic_index.json | 금지 (G2) | updateTopicStatus() | 31K tokens |
| Step 6 | master_feedback_log.json | LLM 직접 Read | 없음 | 미적용 |
| Step 7 | {role}_memory.json | LLM 직접 Read | 없음 | 미적용 |
| Step 8 | session_index.json | 금지 (G5) | hook 전담 | 78K tokens |

---

## G3 선정 — master_feedback_log.json (Step 6)

| 항목 | 내용 |
|---|---|
| 파일명 | `memory/master/master_feedback_log.json` |
| 실측 크기 | 78,841 bytes / 133개 항목 / 추정 ~19,710 tokens |
| 현재 행위 | LLM이 전문 Read → 새 항목 Edit append |
| 대체 방안 | ①전문 Read 금지 ②새 피드백은 `npx ts-node scripts/apply-feedback.ts <topicId> close "<feedback>" "<directive>"` CLI 호출 ③pending 확인은 current_session.json.openMasterAlerts 참조(finalize hook escalate 결과) |
| 추정 절감 | ~19,710 tokens/세션 |
| 스크립트 신규 작성 | 불필요 (apply-feedback.ts 이미 존재) |
| Escape hatch | apply-feedback.ts 인수 누락 또는 복잡한 status 처리 시 LLM 직접 Edit 허용 |
| Mitigation | apply-feedback.ts의 status 하드코딩('applied') — pending 진입 필요 시 인수 옵션 확장 필요 |

---

## G4 선정 — {role}_memory.json (Step 7)

| 항목 | 내용 |
|---|---|
| 파일명 | `memory/roles/{role}_memory.json` |
| 실측 크기 | 전체 66,676 bytes / 세션 평균 2개 역할 ~6,000 tokens |
| 현재 행위 | LLM이 해당 역할 파일 전문 Read → 구조 파악 후 Edit |
| 대체 방안 | 전문 Read 금지. `lessonLog[]` 배열 append-only Edit 원칙. 형식: `{"session":"<id>","learning":"<text>"}` 끝에만 추가. 구조 수정 필요 시 escape hatch |
| 추정 절감 | ~3,000 tokens/역할 × 평균 2역할 = ~6,000 tokens/세션 |
| 스크립트 신규 작성 | 선택 (append-role-lesson.ts 10줄 내외) — 없어도 Edit 직접 append 가능 |
| Mitigation | append-only 시 중복 항목 가능 → finalize hook mtime 검증으로 커버. lessonLog 구조 없는 파일은 스킵 허용 |

---

## 기각 후보

| 파일 | 기각 이유 |
|---|---|
| current_session.json | 필수 Read. 세션 상태 없이 close 불가 |
| reports/ 디렉토리 탐색 | 스크립트 대체 시 복잡성 증가 |
| system_state.json | hook 자동 재계산. LLM Read 없음 |
| evidence_index.json / glossary.json | close.md에 Read 지시 없음 |

---

## 리스크

apply-feedback.ts CLI가 필수 인수 4개 중 누락 시 오류로 Step 6가 완전히 스킵될 수 있어 escape hatch 명시가 필수.

---

## Self-Scores

[ROLE:arki]
# self-scores
str_fd: 3
aud_rcl: 0.85
spc_lck: N
sa_rnd: 1
