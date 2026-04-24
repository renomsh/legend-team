---
session: session_097
topic: PD-030 PD 자동 전이 훅 확장 — children/git/교차검증/Step 0 재판정
role: arki
rev: 1
date: 2026-04-25
phase: design
---

# Arki — 구조 설계

## 수정 파일

| 파일 | 변경 내용 |
|---|---|
| `scripts/lib/topic-lifecycle.ts` | `GitEvidenceEntry` 인터페이스 + `scanGitLog()` 함수 export |
| `scripts/resolve-pending-deferrals.ts` | git 스캔 호출, 콘솔 출력 섹션, --apply upsert 로직 |

## git 매칭 알고리즘

- 정규식: `/\bPD-\d{3}\b/gi`
- `git log --oneline --all --since="6 months ago"`
- execSync: `cwd: ROOT`, `timeout: 10000`, `stdio: ['pipe','pipe','pipe']`
- commitType: `session-end` (`/^session[_ ]?end:/i`) vs `implementation`
- false-positive: 제외 없음 — Master 직접 판단. commitType 태그로 구분.

## 출력 포맷

```
→ [git-evidence] PD-ID 매칭 커밋 발견:
  ⚠ PD-NNN: N건 발견
      {hash} "{message}" [{commitType}]
    → 구현 확인 권장 / 구현 커밋 없음
```

## --apply 갱신 구조

- `gitEvidence: [{commit, message, commitType, scannedAt}]` — hash upsert
- `gitEvidenceLastScanned`: 최신 스캔 타임스탬프
- gitEvidence 없는 PD: 필드 생략

## Phase 분해

P0(타입 정의) → P1(git 스캔 함수) → P2(출력 통합) → P3(--apply 갱신) → P4(검증)

## 검증 게이트

| Phase | 기준 |
|---|---|
| P0 | GitEvidenceEntry export + tsc clean |
| P1 | scanGitLog() 실행 → Map 반환 |
| P2 | dry-run 시 [git-evidence] 섹션 출력 |
| P3 | --apply 시 gitEvidence 필드 삽입 |
| P4 | dry-run 파일 무변경, --apply gitEvidence 삽입 |
