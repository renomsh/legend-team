---
role: dev
topic: Dashboard 개편 — Phase 3 G3 회귀 게이트 → Phase 5 G5 부분 출시
topicId: topic_109
session: session_106
date: 2026-04-26
rev: 1
phase: execution-plan
grade: A
---

# Dev — 1차 구현 리포트 (Turn 5): Pre-G3 블록

## P0: pixelmatch + pngjs 설치

```
npm install pixelmatch pngjs
npm install --save-dev @types/pngjs
```

결과: package.json dependencies 추가 완료. tsc --noEmit 통과.

## P1: vr-compare.ts 구현

`scripts/vr-compare.ts` 신규 작성.

핵심 스펙 (D-099 박제):
- `diff = diffPixelCount / (width × height)` — 비율 기반
- 임계값: `threshold = 0.02` (2%)
- 이미지 크기 불일치 → 즉시 FAIL (재캡처 요구)
- 라이브러리: pixelmatch (diffcount) + pngjs (PNG decode)

실행:
```bash
npx ts-node scripts/vr-compare.ts --mode=compare
```

결과: 24/24 PASS, max diff 0.05%

## P2: role-colors.js canonical 확립

`app/shared/role-colors.js` — 7개 역할 색상 변수 단일 정의. Vera §2 스펙 그대로 구현.

## P3~P7: inline :root{} 7파일 제거

제거 대상 확인 후 각 HTML에서 역할 색상 `:root{}` 인라인 블록 삭제, `<script src="shared/role-colors.js">` import 추가.

| 파일 | 처리 결과 |
|---|---|
| app/index.html | :root{} 제거 + import 추가 |
| app/dashboard-upgrade.html | :root{} 제거 + import 추가 |
| app/dashboard-ops.html | :root{} 제거 + import 추가 |
| app/records-topics.html | :root{} 제거 + import 추가 |
| app/growth.html | :root{} 제거 + import 추가 |
| app/reports.html | :root{} 제거 + import 추가 |

## PD-051 핀 정정 (D-099 연계)

`docs/vr-infra-spec.md` 갱신:
- Docker 이미지: `mcr.microsoft.com/playwright:v1.59.1-jammy` (v1.45.0 → v1.59.1)
- vr:capture 스크립트에 `--add-host=host.docker.internal:host-gateway` + `VR_BASE_URL` 환경변수 추가

docker pull 검증:
```
docker pull mcr.microsoft.com/playwright:v1.59.1-jammy
→ 성공
```

## G3-A 결과

```
npx ts-node scripts/lint-contrast.ts
→ 19/19 PASS
```

## G3-B 결과

```
npx ts-node scripts/vr-compare.ts --mode=compare
→ 24/24 PASS | max diff: 0.05%
```

## 검증 완료

- tsc --noEmit: 오류 0
- G3-A lint-contrast: 19/19 PASS
- G3-B vr-compare: 24/24 PASS (max 0.05%)
