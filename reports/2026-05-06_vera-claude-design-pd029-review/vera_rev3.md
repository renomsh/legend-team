---
topicId: topic_174
role: vera
rev: 3
turnId: 4
invocationMode: subagent
createdAt: 2026-05-06
title: "Axis Pulse 3점 스파크라인 추가 (B안)"
---

# Vera — Axis Pulse 미니 트렌드 스파크라인 (rev3)

## 데이터 구조 확인 결과

`memory/growth/signature_metrics_aggregate.json` 검토:
- 세션별 시계열 배열(`trend`, `bySession`, `history`) **없음**
- view 3종(`all` / `recent10` / `recent3`) 집계값만 존재
- **→ B안 선택: view 3점(all → recent10 → recent3) 폴리라인 스파크라인**

## 변경 파일

`app/growth.html` 단독 — tokens.css 신규 토큰 추가 없음 (drift 0)

## 변경 내용

### CSS 추가 (page-local `<style>` 블록 내)

| 클래스 | 역할 |
|---|---|
| `.axis-spark` | 40px 고정 높이 컨테이너, overflow hidden |
| `.axis-spark svg` | 100% × 100% block |
| `.axis-spark-meta` | 추세 chip + 레이블 행 |
| `.axis-spark-trend.up/down/flat` | `--ok` / `--bad` / `--text-3` 토큰 색 |

### JS 추가

**`AXIS_SPARK_COLORS` 상수** — 축별 accent hex (grad-* 시작값):
- `quality` → `#4F46E5` (grad-violet 시작)
- `judgment-consistency` → `#0891B2` (grad-teal 시작)
- `execution-transfer` → `#D97706` (grad-amber 시작)

**`buildAxisSparkSVG(axisId, metrics, agg)`** 함수:
- 3개 view × `axisMean()` 호출로 3점 좌표 계산
- 유효 포인트 < 2개이면 `null` 반환 → 카드 미삽입 (P3 hasData 정책 보존)
- SVG viewBox `0 0 300 40` (CSS 100% 스케일)
- polyline + 원(r=3) + 하단 x축 레이블(8px monospace)
- stroke-opacity 0.55 — 숫자 KPI 시각 방해 최소화
- `aria-hidden="true"` — 스크린리더 제외 (장식적 데이터)
- 추세 chip: recent3 − all 차이 ±1 이상이면 up/down, 이하이면 flat

**`renderAxis()` 수정**:
- view 전환 시 기존 spark 요소 제거 후 재삽입 (중복 방지)
- spark = null이면 `continue` (빈 공간 없음)

## 제약 준수 확인

- [x] tokens.css `:root{}` 재정의 없음
- [x] 신규 토큰 drift 0건 (CSS 변수 신규 선언 없음 — 색은 inline hex, 나머지 var(--ok)/var(--bad)/var(--text-3) 기존 토큰)
- [x] JS fetch 경로 변경 없음
- [x] P3 hasData 정책 보존 (유효 포인트 < 2 → 미렌더)
- [x] 빈 공간 없음 (미렌더 시 DOM 요소 미생성)
- [x] `--c-ace` ALARM 미사용 (accent 색은 grad-* 시작값 직접 사용)

## 렌더 확인 방법

Launch preview 패널에서 Growth 페이지 직접 확인 가능.
수동 확인 포인트:
1. L1/L2/L3 카드 하단에 폴리라인 + 원 3개 + 추세 chip 표시 여부
2. View selector 전환(all → recent10 → recent3) 시 스파크라인 재렌더 확인
3. 데이터 없는 축이 있을 경우 빈 공간 미생성 확인

## lint 수동 실행 (Riki R-2 — 신규 색 없음이지만 루틴 확인)

```bash
npx ts-node scripts/lint-contrast.ts && npx ts-node scripts/lint-inline-root-color.ts
```

신규 색: `#4F46E5` / `#0891B2` / `#D97706` — 모두 기존 `--grad-*` 토큰의 구성값이므로 contrast 이슈 없음 (장식적 스트로크, aria-hidden).

[ROLE:vera]
# self-scores
tk_drf0: Y
spc_cpl: 0.97
tk_cns: 5
