---
session: session_047
topic: "Phase 2 — CLAUDE.md turn push 규칙 추가 + session-end-finalize.js 검증 + validate-session-turns.ts 신설"
topicSlug: phase2-turn-push-validate
topicId: topic_050
date: 2026-04-20
grade: B
roles: [ace, dev]
decisions: []
status: completed
---

# Phase 2 — Turn Push 규칙·Finalize 검증·Validate 신설

## 세션 요약

D-048 Phase 2 구현 세션. 3개 산출물 완성 + Master 피드백(검증 기본값·하드코딩 금지)으로 추가 보완.

---

## 산출물 1: CLAUDE.md — Turn Push Protocol (C1) 추가

`### Turn Push Protocol (C1) (D-048, 2026-04-20)` 섹션 신설.

- 위치: Nova Protocol 다음, Session Protocol 앞
- 기록 주체·필수/선택 필드·분리/병합 4조건·C2 체인 명문화
- Script Status v0.4.0 → v0.5.0 갱신 (Hook Chain 상세 문서화)

---

## 산출물 2: session-end-finalize.js 검증 및 보완

**검증 결과:** `auto-push.js` 내부 `runHookChain()`을 통해 이미 정상 호출 중 (settings.json 별도 등록 불필요).

**추가된 전파 필드 (D-048 Turn[] 스키마):**
- `turns` — Turn[] 배열
- `plannedSequence` — 선언 역할 순서
- `grade` — 세션 등급
- `legacy` — true이면 집계 배제

**환경변수 오버라이드 추가 (테스트 가능):**
- `FINALIZE_CURRENT_SESSION` — current_session.json 경로 재지정
- `FINALIZE_SESSION_INDEX` — session_index.json 경로 재지정

**검증:** 픽스처(turns 2개, grade B) → finalize 실행 → session_index 출력 확인. turns·grade·plannedSequence 모두 정확 전파.

---

## 산출물 3: validate-session-turns.ts 신설

**경로:** `scripts/validate-session-turns.ts`

**CLI 사용:**
```bash
npx ts-node scripts/validate-session-turns.ts              # current_session
npx ts-node scripts/validate-session-turns.ts session_047  # 특정 세션
npx ts-node scripts/validate-session-turns.ts --all        # 전체 (45개 통과)
```

**Callable export:**
```typescript
import { validateTurns, ValidationResult } from './scripts/validate-session-turns';
const result = validateTurns(sessionId, turns, legacy, validPhases);
```

**검증 케이스:**
| 입력 | 결과 |
|---|---|
| 잘못된 phase | ERROR (catalog 나열) |
| turnIdx 불일치 | WARN |
| 잘못된 recallReason | ERROR |
| 정상 입력 | ok: true |
| legacy: true | WARN + 스킵 |

---

## 보완 (Master 피드백: 검증 기본값 + 하드코딩 금지)

| 파일 | 변경 |
|---|---|
| `turn-types.ts` | `VALID_RECALL_REASONS` const 배열 export |
| `validate-session-turns.ts` | VALID_PHASES → phase_catalog.json 런타임 로드 |
| `validate-session-turns.ts` | `require.main` 가드 추가 (import 시 main() 미실행) |
| `validate-session-turns.ts` | `validateTurns()` export → programmatic 호출 가능 |
| `session-end-finalize.js` | 환경변수 오버라이드 추가 (테스트 가능) |

---

## 피드백 기록

- **Dev 검증 기본값:** 구현 후 런타임 검증 필수 (tsc 통과만으로 충분하지 않음)
- **하드코딩 금지:** config 원천(JSON)이 있으면 런타임 로드. export 함수로 callable 구조. Arki 설계 시에도 원천 지정 포함.
