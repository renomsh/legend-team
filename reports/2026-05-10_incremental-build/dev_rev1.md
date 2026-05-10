---
role: dev
turnId: 2
invocationMode: subagent
date: 2026-05-10
topic: incremental-build
accessed_assets:
  - file: scripts/build.js
    scope: full read before modification
---

# Dev — build.js 증분 빌드 구현

## 무엇을 만들었는지

`scripts/build.js`를 git diff 기반 증분 빌드 방식으로 개선.

### 추가된 함수

| 함수 | 역할 |
|---|---|
| `getGitChangedFiles()` | `git diff --name-status HEAD~1 HEAD` 파싱 → `{changed[], deleted[]}`. rename 처리 포함. git 불가 시 null 반환 |
| `distIsValid()` | dist/ 존재·비어있지 않음 확인 → full build 트리거 판단 |
| `srcPathToDistPath(repoRel)` | 레포 상대 경로 → dist/ 절대 경로 매핑. LEGACY_TOP_DIRS 제외 |
| `incrementalSync(changed, deleted)` | 변경 파일만 copyFileSync, 삭제 파일은 dist/에서 rmSync |
| `removeEmptyDirs(dir)` | 삭제 후 빈 디렉터리 정리 |
| `fullBuildApp()` | 기존 app/ 전체 복사 로직 분리 |
| `fullBuildDataSources()` | 기존 DATA_SOURCES 전체 복사 로직 분리 |
| `generatePublishedArtifacts()` | topics_manifest.json + decisions_summary.json 항상 재생성 |

### 빌드 모드 결정 트리

```
dist/ 없거나 비어있음?  OR  --full 플래그?
  → Full build (dist/ 정리 후 전체 복사)
  
dist/ 있음?
  → git diff 변경 파일 목록 추출
    → git 불가 시 full build fallback
    → app/ + DATA_SOURCES 경로에 해당하는 변경만 증분 복사
    → 삭제 파일은 dist/에서 제거
    → app/partials/ 변경 시 전체 HTML re-apply
    → data/ 생성 아티팩트 (manifest.json, topics_manifest, decisions_summary) 항상 재생성
```

## 실행 증거

### 케이스 1: Full build (dist/ 없음)
```
[build] Full build (dist/ absent or empty)...
[build] Copied app/ source files (full)
[build] Applied partials: 1 loaded (sidebar), 9 markers replaced, 0 missing
[build] Copied memory/ → data/memory/ (98 files)
[build] Copied reports/ → data/reports/ (769 files)
[build] Copied logs/ → data/logs/ (10 files)
[build] Generated data/manifest.json
[build] Generated data/published/topics_manifest.json (191 topics)
[build] Generated data/published/decisions_summary.json (180 decisions)
[build] Done (full). dist/ ready with 877 data files + published/ artifacts.
```

### 케이스 2: Incremental build (dist/ 있음)
```
[build] Incremental build. Changed: 5, Deleted: 0
[build] Incremental sync: 3 copied, 0 deleted, 0 skipped (unmanaged paths)
[build] Regenerated data/manifest.json
[build] Generated data/published/topics_manifest.json (191 topics)
[build] Generated data/published/decisions_summary.json (180 decisions)
[build] Done (incremental). dist/ synced. 877 data files total + published/ artifacts.
```
- Changed 5개 중 3개만 copy(나머지 2개는 scripts/ 등 unmanaged 경로 → skip 정상)
- data/ 아티팩트는 항상 재생성 확인

### 케이스 3: --full 플래그 강제
```
[build] Full build (--full flag)...
[build] Cleaned dist/
... (전체 복사 정상)
```

## Riki 감사 조건 준수 확인

| 조건 | 처리 방식 |
|---|---|
| data/ 하위 항상 재생성 | `generatePublishedArtifacts()` 항상 호출, `manifest.json` 항상 재생성 |
| app/·memory/·reports/·logs/ 증분 | git diff 경로 필터 후 `incrementalSync()` |
| 첫 빌드·dist/ 없음 → full fallback | `distIsValid()` false → full build |
| 신규 파일 처리 | changed[] 에 포함 → copyFileSync |
| 삭제 파일 처리 | deleted[] → dist/ rmSync + removeEmptyDirs |
| rename 처리 | git status R100 파싱 → old=deleted, new=changed |

[ROLE:dev]
# self-scores
rt_cov: 1.00
gt_pas: 1.00
hc_rt: 0.00
spc_drf: 0
