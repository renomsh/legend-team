---
role: vera
session: session_176
topic: topic_152
turnId: 0
phase: design-spec
date: 2026-05-03
---

# Vera — COPD Figure 1 (CONSORT) 디자인 권고 rev1

## 1. 진단 (5개)

1. **시각적 위계 부재** — 모든 박스가 동일 weight/size. "n=2,474 stable COPD"가 분석 모집단인데 우측 exclusion 박스와 시각 가중치가 같음 → 데이터 흐름 한눈에 안 잡힘.
2. **High vs Low-risk 대비 부족** — n=315 vs n=2,159 (약 6.9배 차)인데 두 박스가 동일 size·동일 색. clinical 정합성 부재.
3. **Exclusion 분기 비대칭 부유** — 우측에 라벨 없이 떠 있어 "제외 사유"인지 "병렬 코호트"인지 즉시 안 읽힘. CONSORT 표준은 좌측 main flow + 우측 excluded 명시 라벨.
4. **타이포 단일 weight** — Title/n/Label 구분 없음. 숫자(n=2,474)가 본문과 동일 weight라 핵심 정보 시인성 낮음.
5. **Connector 정합성 거침** — 화살표 head·정렬·gap 일관성 부족.

## 2. 디자인 시스템 spec

### Color palette (ERJ 흑백 호환)

| 역할 | Hex | Grayscale | 용도 |
|---|---|---|---|
| Neutral box (A·B) | `#F4F6F8` fill / `#1F2937` border 1pt | 95% / 20% | 모집단·중간 코호트 |
| High-risk (C) | `#1F2937` fill / white text | 20% (검정) | COTE high — 강조 |
| Low-risk (D) | `#FFFFFF` fill / `#1F2937` border 1.5pt | 100% / 20% | COTE low — 대조 |
| Exclusion frame | `#9CA3AF` border dashed 0.5pt | 60% dashed | 제외 영역 |
| Connector | `#1F2937` 0.75pt | 20% | 흐름선 |

→ 컬러 게재료 회피 시 **High-risk solid black + Low-risk white**의 흑백 only도 동일 위계 성립 (권고 fallback).

### Typography (Helvetica/Arial)

| 단계 | family · weight · size |
|---|---|
| Title (box 헤더) | Helvetica Bold 9pt |
| Number `n=` | Helvetica Bold 10pt (가장 큼 — 핵심 정보) |
| Label (descriptor) | Helvetica Regular 8pt |
| Note (exclusion 사유) | Helvetica Regular 7pt, line-height 1.35 |

FEV₁/FVC subscript, italic 금지.

### Spacing & Layout (double column 180mm)

- Box 폭: A·B = 75mm, C·D = 60mm
- Inter-box vertical gap: 12mm
- Branch horizontal offset (C↔D): 80mm 중심간
- Box padding: 4mm × 5mm
- Exclusion frame: B 우측 12mm gap, 폭 60mm

### Component spec

- **Box**: border-radius 2pt, border 1pt (C는 fill solid), no shadow, no gradient (흑백 변환 안정성).
- **Arrow**: 0.75pt stem, 단순 triangle head (open head 금지), solid (main flow) / dashed 0.5pt (exclusion 분기).
- **Exclusion frame**: dashed rectangle, 헤더 "Excluded (n=205)" 합산 박제로 흐름 정합성 강화.

### Visual hierarchy

C(High-risk)는 solid dark fill로 시선 anchor, D(Low-risk)는 outline-only. **Box size 동일 유지** (n 차이를 size로 표현하면 통계적 혼동 — clinical figure 금기). 차이는 fill weight로만.

## 3. 구현 가이드

**도구: Inkscape (SVG vector) 1택**
- 사유: ERJ는 vector(EPS/PDF) 선호. Inkscape는 SVG→EPS/PDF 무손실 export, 격자 snap 정확. matplotlib patches 기반 CONSORT는 코드 비대(150+줄), Illustrator는 라이선스, Figma는 EPS export 불가.

**SVG sample (Box B + arrow + High-risk box)**

```svg
<g font-family="Helvetica" fill="#1F2937">
  <rect x="60" y="120" width="284" height="48" rx="2"
        fill="#F4F6F8" stroke="#1F2937" stroke-width="1"/>
  <text x="202" y="142" font-size="9" font-weight="700"
        text-anchor="middle">Stable COPD cohort</text>
  <text x="202" y="158" font-size="10" font-weight="700"
        text-anchor="middle">n = 2,474</text>
  <line x1="202" y1="168" x2="202" y2="200"
        stroke="#1F2937" stroke-width="0.75"/>
  <polygon points="198,198 206,198 202,206" fill="#1F2937"/>
  <rect x="80" y="210" width="227" height="48" rx="2"
        fill="#1F2937"/>
  <text x="193" y="232" font-size="9" font-weight="700"
        fill="#FFFFFF" text-anchor="middle">High-risk COTE</text>
  <text x="193" y="248" font-size="10" font-weight="700"
        fill="#FFFFFF" text-anchor="middle">n = 315</text>
</g>
```

**산출 포맷**: ① EPS vector (primary) ② PDF vector (preview) ③ TIFF 600dpi raster (fallback)

## 4. Risk · trade-off

1. **컬러 게재료** — ERJ online은 컬러 무료, print 컬러는 추가 비용 가능. → **권고: 흑백 only 디자인 확정** (위 palette는 이미 흑백 정합). 컬러 비용 0.
2. **흑백 변환 정보 손실** — fill weight로만 High/Low 구분 시 저시력 독자 가독성. → mitigation: C 박스 좌상단 작은 "▲ High-risk" 마커(7pt) redundancy 추가.
3. **리뷰어 단순성 선호** — ERJ 보수적, 과한 디자인 시 "non-standard CONSORT" 지적 가능. → mitigation: CONSORT 2010 표준 구조 100% 유지, 변경은 weight·typography·spacing 한정. shadow·gradient 배제.

---

```yaml
selfScores:
  systemConsistency: 82
  componentReusability: 78
  visualHierarchyClarity: 88
```
