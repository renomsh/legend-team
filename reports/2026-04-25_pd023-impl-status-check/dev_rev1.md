---
topic: PD-023 구현 점검
session: session_100
role: dev
phase: implementation
revision: 1
date: 2026-04-25
report_status: approved
session_status: closed
accessed_assets:
  - role_registry.json
  - metrics_registry.json
  - self-scores-schema.ts
---

# Dev rev1 — Quick-win 2파일 구현 + 검증

## 변경 파일

- `scripts/batch-score-helper.ts` (152줄, 신규)
  - 대화형 CLI. role × shortKey × score 입력 → self_scores.jsonl append.
  - `--help` / `--dry-run` 지원.
  - atomic write (tmp → rename), append 직전 confirm.
  - role_registry.json + metrics_registry.json 동적 로드.

- `scripts/validate-self-scores.ts` (131줄, 신규)
  - Ajv schema 검증 + orphan(미등록 역할/메트릭) 검출 + scale 위반(0~100 범위) 검사.
  - exit 0/1 명시.

- `scripts/lib/` 무수정.

## 런타임 검증

```
$ npx ts-node scripts/validate-self-scores.ts
total=70 valid=70 orphan=0 scaleViolation=0 schemaFail=0
exit 0
```

회귀 smoke: scripts/lib/ 무수정 → 기존 hook chain 영향 없음. PASS.

## PD-035 상관

8/8 persona 파일에 yaml-block instruction mention 확인 — C7 done 처리 근거.

## Hard-coding 점검

config 원천: role_registry.json + metrics_registry.json 동적 로드. callable export 함수 구조 (validate / appendScore).
