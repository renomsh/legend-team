---
session: session_097
topic: PD-030 PD 자동 전이 훅 확장 — children/git/교차검증/Step 0 재판정
role: dev
rev: 1
date: 2026-04-25
phase: implementation
---

# Dev — 구현 결과

## 수정 파일

### `scripts/lib/topic-lifecycle.ts`
- `GitEvidenceEntry` 인터페이스 추가 (`commit`, `message`, `commitType`, `scannedAt`)
- `scanGitLog(root: string): Map<string, GitEvidenceEntry[]>` 함수 추가
  - `git log --oneline --all --since="6 months ago"` 실행
  - execSync: cwd=root, timeout=10000, stdio=['pipe','pipe','pipe']
  - PD-NNN 정규식 매칭, commitType 분류
  - 실패 시 빈 Map 반환 (warn 출력)

### `scripts/resolve-pending-deferrals.ts`
- import에 `scanGitLog`, `GitEvidenceEntry` 추가
- PD 인터페이스에 `gitEvidence?`, `gitEvidenceLastScanned?` 추가
- main() 내: git 스캔 호출 + pending PD 대상 gitEvidence 수집
- 콘솔 출력: `[git-evidence]` 섹션 — implementation 0건 PD 구분 처리
- --apply 분기: hash 기준 upsert 로직

### `.claude/commands/open.md`
- Grade B → L2 (`ace-framing` 스킬 전체) 충돌 수정 (62행)

## 검증 결과

```
→ [git-evidence] PD-ID 매칭 커밋 발견:
  ⚠ PD-023: 1건 발견
      055ffe6 "session_094 close: PD-023 resume — ..." [implementation]
    → 구현 확인 권장 (suggest only, auto-apply 아님)
  ⚠ PD-035: 1건 발견 ...
  ⚠ PD-039: 1건 발견 ...
```

- TypeScript 컴파일: 기존 pre-existing 에러 4건만, 신규 에러 없음
- git evidence 없는 PD: 섹션 미출력 확인
- PD-030 자기 언급 없음: git-evidence 섹션에 미포함 (R-4 자동 회피)
