---
role: vera
session: session_176
topic: topic_152
turnId: 1
phase: design-spec-3figure
date: 2026-05-03
---

# Vera — ERJ 3-Figure 통합 디자인 spec rev2

> Fig 1은 rev1 spec 유지. 본 rev2는 Fig 2·3 신규 + 3-figure 공통 시스템.
> ⚠ 파일명 swap: Fig1_DAG.jpg=실제 CONSORT flow / Fig2_cohort_flow.png=실제 forest grid. 본 spec은 실제 내용 기준.

## A. Figure 2 — 2×2 Forest Grid (CV IRR by COTE × Severity)

### A1. 진단 (4)
1. Panel header 위계 부재 — row/column label 동일 weight, 2×2 축 즉시 안 읽힘
2. X-axis 비균질 — 4 panel IRR 범위 다른데 tick 들쭉, 시각 비교 불가
3. 색·marker semantic 부재 — 7 conditions 동일, sig vs non-sig 동일 weight
4. Panel spacing 거침 — inter-panel gap이 padding과 비슷, 한 덩어리

### A2. Color & symbol palette

| 요소 | spec |
|---|---|
| Significant (CI excl 1.0) | dot fill `#1F2937` solid, CI bar 1.0pt |
| Non-significant | dot hollow border `#1F2937` 0.75pt, CI bar 0.5pt |
| Reference (IRR=1.0) | `#9CA3AF` dashed 0.5pt |
| Panel header bg | `#F4F6F8` strip 6mm |
| Text | `#1F2937` |

7 conditions 개별 색 금지(흑백 게재 붕괴). 위계는 sig solid/non-sig hollow 단축.

### A3. Typography & layout (180mm 2-col)
- 4 panel = 2×2, 각 80×55mm, gap 8mm 가로 / 10mm 세로
- Column header strip 상단 6mm, Helvetica Bold 9pt
- Row label 좌측 회전 90°, Bold 9pt
- Condition label 좌정렬 8pt, X-axis log scale 0.5/1/2/4 통일, tick 7pt
- IRR 수치 우측 7pt regular(sig는 bold)

### A4. Implementation — R ggplot2 + patchwork

```r
ggplot(df, aes(x=irr, y=fct_rev(condition))) +
  geom_vline(xintercept=1, linetype="dashed", color="#9CA3AF", linewidth=0.18) +
  geom_pointrange(aes(xmin=lo, xmax=hi, fill=sig),
                  shape=21, color="#1F2937", linewidth=0.35, size=0.4) +
  scale_fill_manual(values=c(sig="#1F2937", ns="#FFFFFF"), guide="none") +
  scale_x_log10(breaks=c(0.5,1,2,4)) +
  facet_grid(rows=vars(cote), cols=vars(severity), switch="y") +
  theme_classic(base_family="Helvetica", base_size=8) +
  theme(strip.background=element_rect(fill="#F4F6F8", color=NA),
        strip.text=element_text(face="bold", size=9),
        panel.spacing.x=unit(8,"mm"), panel.spacing.y=unit(10,"mm"))
ggsave("Fig2.eps", width=180, height=130, units="mm", device=cairo_ps)
```

## B. Figure 3 — Single Forest (NIE OR Sensitivity)

### B1. 진단 (3)
1. Primary vs Sensitivity 위계 약함 — 빨간 별만으론 부족
2. Reference 1.0 처리 약함 — gray dashed 옅음
3. Sensitivity 그룹화 부재 — Bias / S1~5 / S7~8 시각 그룹 없음

### B2. Color & symbol palette

| Row | Marker | Fill | CI bar |
|---|---|---|---|
| Primary | diamond ◆ 4mm | `#1F2937` solid | 1.0pt |
| Bias-adjusted | square ■ 3mm | `#1F2937` solid | 0.75pt |
| S1~S8 | circle ● 2.5mm | hollow | 0.5pt |
| Reference | — | — | dashed 0.5pt `#9CA3AF` (Fig2와 통일) |

빨간 별 ★ 폐기 — 흑백 정책. Primary 강조는 marker shape(diamond) + size + Bold label.
그룹별 5pt gap (Primary | Bias | S1–S5 | S7–S8).

### B3. Typography & layout (single column 85mm 권고)
9 row × 6mm + 그룹 gap 3×5mm + axis 15mm = 84mm
Row label 8pt Regular(Primary는 Bold), x tick linear 0.9/1.0/1.2/1.5 7pt, OR 수치 우측 7pt(Primary Bold).

### B4. Implementation — R ggplot2 (toolchain 통일)

```r
ggplot(df, aes(x=or, y=fct_rev(label))) +
  geom_vline(xintercept=1, linetype="dashed", color="#9CA3AF", linewidth=0.18) +
  geom_pointrange(aes(xmin=lo, xmax=hi, shape=type, fill=type, size=type),
                  color="#1F2937", linewidth=0.3) +
  scale_shape_manual(values=c(Primary=23, Bias=22, Sens=21)) +
  scale_fill_manual (values=c(Primary="#1F2937", Bias="#1F2937", Sens="#FFFFFF")) +
  scale_size_manual (values=c(Primary=0.55, Bias=0.45, Sens=0.35)) +
  scale_x_continuous(breaks=c(0.9,1.0,1.2,1.5), limits=c(0.85,1.55)) +
  facet_grid(rows=vars(grp), scales="free_y", space="free_y", switch="y") +
  theme_classic(base_family="Helvetica", base_size=8) +
  theme(strip.text.y.left=element_text(angle=0, face="bold", size=8),
        strip.background=element_blank(), legend.position="none",
        panel.spacing.y=unit(2,"mm"))
ggsave("Fig3.eps", width=85, height=84, units="mm", device=cairo_ps)
```

## C. 3-Figure 공통 Design System

**Color token (5)**
| Token | Hex | 용도 |
|---|---|---|
| `--ink-strong` | `#1F2937` | 강조 fill·border·text |
| `--ink-mute` | `#9CA3AF` | reference·exclusion·grid |
| `--surface` | `#F4F6F8` | panel header bg·중립 box |
| `--paper` | `#FFFFFF` | hollow marker·outline box |
| `--white-text` | `#FFFFFF` | dark fill 위 text |

**Line weight 격자**
0.5pt (reference·grid·non-sig CI) / 0.75pt (connector·main border·sig CI) / 1.0pt (box border·sig CI Fig2) / 1.5pt (emphasis outline)

**Cross-figure 정합 5원칙**
1. 모든 figure Helvetica 단일, EPS vector primary
2. 5 color token 외 신규 색 0건
3. 흑백 print 단독 위계 성립
4. sig=solid / non-sig=hollow / reference=dashed 약속 통일
5. 산출 3종: EPS / PDF / TIFF 600dpi

## D. Risk · Trade-off (3)

1. **Toolchain 분리** (Fig1 Inkscape / Fig2·3 R) — 폰트 subset mismatch risk → Adobe Distiller 단일 패스 또는 R `magick` EPS 통합 변환
2. **Hollow circle 가독성** — 저시력 reviewer 놓칠 위험 → 우측 IRR/OR 수치 sig=Bold redundancy
3. **Reference line dashed 통일 결정** — Fig3 단일 emphasis보다 cross-figure 일관성 우선 (rev2 최종 고정)

```yaml
selfScores:
  systemConsistency: 90
  componentReusability: 85
  visualHierarchyClarity: 88
```
