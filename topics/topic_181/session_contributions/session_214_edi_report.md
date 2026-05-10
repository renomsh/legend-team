---
session: session_214
topic: topic_181
topicSlug: pd-skill-bug-fix
grade: B
role: edi
rev: 1
date: 2026-05-08
---

# Edi — session_214 (PD스킬 버그 수정)

## 세션 요약

`/pd list` 실행 시 PD-057이 출력되지 않는 버그 수정. 근본 원인 2건 확정 후 수정.

## 근본 원인

| # | 원인 | 경위 |
|---|---|---|
| 1 | `manage-pd.ts` git 미포함 | session_213 워크트리에서 생성·검증 완료 선언했으나 commit `56dd2e1`에 파일 누락 |
| 2 | PD-057 `pending_deferrals.json` 미포함 | 파일 신설(session_208) 시 기존 PD는 의도적 제외 → 어떤 경로로도 조회 불가 |

## 구현 완료

1. **`scripts/manage-pd.ts` 신규 생성**
   - SOT: `memory/shared/pending_deferrals.json`
   - `list` / `add` / `rm` CRUD
   - `add` 시 `current_session.json.pendingDeferralsAdded` 자동 추적

2. **`pending_deferrals.json` PD-057 migrate**
   - `system_state.json.pendingDeferrals` → `pending_deferrals.json.items`로 이전
   - 파일 note 갱신: "이후 모든 PD 등록·조회는 본 파일 단일 경유"

3. **`verification-before-completion` 스킬 업데이트**
   - obra/superpowers TDD 원칙 흡수: "테스트 없이 작성한 코드는 존재하지 않는 것과 같다"
   - 검증 프로세스 1단계 추가 (테스트 선행)
   - 합리화 항목 2개 추가

## PD 변동

| ID | 동작 | 내용 |
|---|---|---|
| PD-057 | migrate | pending_deferrals.json으로 이전 |
| PD-068 | 신규 | 프롬프트 입력 시 스킬을 훅으로 자동 발동 구현 (session_213 원의) |
| PD-069 | 신규 | 병행세션 병행토픽 시스템 검토 caseB |

## 검증

- `npx ts-node scripts/manage-pd.ts list` → PD-057·PD-068·PD-069 정상 출력 ✅
- `add` / `rm` 동작 확인 ✅
- `tsc --noEmit` (TypeScript 컴파일) — manage-pd.ts 포함 오류 없음

## Gap

- session_213 PD-058/059 ID 충돌 정리 → PD-068 등록 (별도 처리)
