---
topicId: topic_174
role: vera
rev: 4
turnId: 5
invocationMode: subagent
createdAt: 2026-05-06
title: "Axis Pulse spark-as-background 구현 완료 (시안 #3)"
---

# Vera — Axis Pulse Spark-as-Background 구현 (rev4)

## 구현 요약

Claude Design 시안 #3 "Spark-as-background" 를 `app/growth.html` 에 적용 완료.

## 변경 내용

### 1. SVG 그라디언트 defs (`<body>` 직후 hidden SVG)

6개 linearGradient 정의:
- 스트로크 그라디언트 3종 (`gx-l1/l2/l3`) — 수평, 각 축 색상
- 면적 채우기 그라디언트 3종 (`gxf-l1/l2/l3`) — 수직, opacity 0.35→0

### 2. CSS 교체 (page-local `<style>`)

구 클래스 제거:
- `.axis-spark`, `.axis-spark svg`, `.axis-spark-meta`, `.axis-spark-trend`

신규 클래스:
- `.axis-card` — `padding-bottom: 94px` 추가 (spark-bg 78px + point-labels 공간)
- `.axis-spark-bg` — `position:absolute; left:0; right:0; bottom:0; height:78px`
- `.axis-point-labels` — 하단 고정, `z-index:2`, `all / recent10 / recent3` 레이블
- `.axis-trend-chip` — 헤더 우측 chip, `.up`(#4ade80) / `.down`(#f87171) / `.flat`(var(--text-3))
- `.axis-card-header` — tag + trend chip flex row
- `.axis-kpi-block` — `z-index:2`, KPI 숫자와 meta 컨테이너

### 3. HTML 구조 교체 (3개 axis-card)

구조:
```
axis-card-header (tag | trend-chip)
axis-name
axis-kpi-block (axis-val | axis-meta)
axis-point-labels (all | recent10 | recent3)
[axis-spark-bg SVG — JS 동적 삽입]
```

### 4. JS `buildAxisSparkSVG` 교체

- viewBox `0 0 300 78` (구: `0 0 300 40`)
- area-fill path + polyline (구: polyline + circles + text labels)
- `stroke="url(#gx-l*)"`, `fill="url(#gxf-l*)"`
- `preserveAspectRatio="none"` — 카드 너비에 자동 맞춤
- `vector-effect="non-scaling-stroke"` — stroke-width 1.6px 일정 유지
- P3 hasData 정책 보존: 유효 포인트 < 2이면 null 반환

### 5. JS `renderAxis` 수정

- 기존 `sparkId` div 래퍼 방식 제거
- `.axis-spark-bg` 요소 직접 교체 (`card.querySelector` + `insertAdjacentHTML`)
- trend chip: `document.getElementById('axisTrend-' + axis)` 직접 업데이트

## 제약 준수 확인

- [x] tokens.css `:root{}` 재정의 없음 (drift 0)
- [x] 신규 CSS 변수 선언 없음
- [x] JS fetch 경로 변경 없음
- [x] P3 hasData 정책 보존 (유효 포인트 < 2 → SVG 미삽입, chip → '—')
- [x] `--c-ace` ALARM 미사용
- [x] 기존 `axis-val`, `axis-meta` ID 유지

## 브라우저 검증 결과 (preview eval)

```json
{
  "gradientDefsPresent": true,
  "cards": [
    { "axis": "quality",              "hasSparkBg": true, "hasTrendChip": true, "trendText": "→ -0.2",  "paddingBottom": "94px" },
    { "axis": "judgment-consistency", "hasSparkBg": true, "hasTrendChip": true, "trendText": "↓ -23.4", "paddingBottom": "94px" },
    { "axis": "execution-transfer",   "hasSparkBg": true, "hasTrendChip": true, "trendText": "↓ -6.9",  "paddingBottom": "94px" }
  ]
}
```

빌드: `node scripts/build.js` 통과. dist/ 반영 완료.

[ROLE:vera]
# self-scores
tk_drf0: Y
spc_cpl: 0.98
tk_cns: 5
