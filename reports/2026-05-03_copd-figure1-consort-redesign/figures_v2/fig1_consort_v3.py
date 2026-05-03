"""Fig 1 v3 — CONSORT cohort flowchart for the present mediation study.
Output: Fig1_CONSORT_v3.eps + .pdf + .png

Source: cohort_flow.json (본 연구 GEE Model 3 analytic set 기반)
- 3,228 KOCOSS recruited (2012–2021)
- Excluded 290 (non-COPD phenotype + missing) + 27 (age<40) + 199 (military/housewife/unemployed) = 516
- 2,712 canonical baseline COPD cohort
- 1,352 TE analytic set (Y1 exacerbation available, events=124)
- 850 NIE analytic set (SGRQ Symptoms mediator complete) — PRIMARY mediation result

COTE 무관. ICMJE non-overlap 정합 (sister paper와 분리).
"""
import matplotlib.pyplot as plt
import matplotlib.patches as mpatches
from matplotlib.patches import FancyArrowPatch, Rectangle

INK = "#1F2937"
SURFACE = "#F4F6F8"
PAPER = "#FFFFFF"
MUTE = "#9CA3AF"

plt.rcParams.update({
    "font.family": "Helvetica",
    "font.sans-serif": ["Helvetica", "Arial"],
    "pdf.fonttype": 42, "ps.fonttype": 42,
})

fig, ax = plt.subplots(figsize=(180/25.4, 115/25.4))
ax.set_xlim(0, 180); ax.set_ylim(0, 115)
ax.axis("off")

def draw_box(x, y, w, h, fill=PAPER, border=INK, lw=1.0, radius=2):
    box = mpatches.FancyBboxPatch((x, y), w, h,
                                   boxstyle=f"round,pad=0,rounding_size={radius}",
                                   facecolor=fill, edgecolor=border, linewidth=lw)
    ax.add_patch(box)

def draw_text(x, y, txt, size, weight="normal", color=INK, ha="center", va="center"):
    ax.text(x, y, txt, fontsize=size, fontweight=weight, color=color,
            ha=ha, va=va, family="Helvetica")

def draw_arrow(x1, y1, x2, y2, lw=0.75, dashed=False):
    style = "-" if not dashed else (0, (3, 2))
    arr = FancyArrowPatch((x1, y1), (x2, y2),
                          arrowstyle="-|>", mutation_scale=8,
                          color=INK, linewidth=lw, linestyle=style)
    ax.add_patch(arr)

# Box A — top: source recruitment
A_x, A_y, A_w, A_h = 15, 88, 75, 22
draw_box(A_x, A_y, A_w, A_h, fill=SURFACE, border=INK, lw=1.0)
draw_text(A_x + A_w/2, A_y + 17, "KOCOSS prospective cohort", 8, "normal")
draw_text(A_x + A_w/2, A_y + 13, "recruited 2012–2021", 8, "normal")
draw_text(A_x + A_w/2, A_y + 5, "n = 3,228", 10, "bold")

# Box B — middle: canonical baseline
B_x, B_y, B_w, B_h = 15, 56, 75, 24
draw_box(B_x, B_y, B_w, B_h, fill=SURFACE, border=INK, lw=1.0)
draw_text(B_x + B_w/2, B_y + 19, "Canonical baseline", 9, "bold")
draw_text(B_x + B_w/2, B_y + 14, "stable COPD cohort", 8, "normal")
draw_text(B_x + B_w/2, B_y + 5, "n = 2,712", 10, "bold")

# Arrow A → B
draw_arrow(A_x + A_w/2, A_y, B_x + B_w/2, B_y + B_h, lw=0.75)

# Excluded frame — dashed, right of A→B
EX_x, EX_y, EX_w, EX_h = 105, 66, 67, 36
ex_rect = Rectangle((EX_x, EX_y), EX_w, EX_h,
                     facecolor="none", edgecolor=MUTE,
                     linewidth=0.5, linestyle=(0, (3, 2)))
ax.add_patch(ex_rect)
draw_text(EX_x + 3, EX_y + 31, "Excluded (n = 516)", 8, "bold", ha="left")
draw_text(EX_x + 3, EX_y + 24,
          "•  290: non-COPD phenotype / missing", 7, "normal", ha="left")
draw_text(EX_x + 3, EX_y + 18,
          "•  27: age < 40 years", 7, "normal", ha="left")
draw_text(EX_x + 3, EX_y + 12,
          "•  199: military / housewife /", 7, "normal", ha="left")
draw_text(EX_x + 3, EX_y + 6,
          "    unemployed (occupation)", 7, "normal", ha="left")

# Arrow main flow → exclusion frame
mid_y = (A_y + B_y + B_h) / 2
draw_arrow(A_x + A_w, mid_y, EX_x, EX_y + EX_h/2, lw=0.5, dashed=True)
draw_text((A_x + A_w + EX_x)/2, mid_y + 2.5, "excluded", 7, "normal", color=INK)

# Bottom branches:
#   Left  = TE analytic set (supportive, outline box)
#   Right = NIE analytic set (PRIMARY, solid dark)
C_x, C_y, C_w, C_h = 12, 10, 65, 28
D_x, D_y, D_w, D_h = 84, 10, 65, 28

# TE analytic set — outline (Low-emphasis comparator)
draw_box(C_x, C_y, C_w, C_h, fill=PAPER, border=INK, lw=1.5)
draw_text(C_x + C_w/2, C_y + 22, "Total Effect analytic set", 9, "bold")
draw_text(C_x + C_w/2, C_y + 16, "Y1 exacerbation available", 8, "normal")
draw_text(C_x + C_w/2, C_y + 9, "n = 1,352", 10, "bold")
draw_text(C_x + C_w/2, C_y + 3, "(events = 124, 9.2%)", 7, "normal")

# NIE analytic set — solid dark (PRIMARY)
draw_box(D_x, D_y, D_w, D_h, fill=INK, border=INK, lw=1.0)
draw_text(D_x + 3, D_y + 23, "▲ Primary", 7, "bold", color=PAPER, ha="left")
draw_text(D_x + D_w/2, D_y + 17, "NIE analytic set", 9, "bold", color=PAPER)
draw_text(D_x + D_w/2, D_y + 12, "SGRQ Symptoms complete", 7, "normal", color=PAPER)
draw_text(D_x + D_w/2, D_y + 5, "n = 850", 10, "bold", color=PAPER)

# Branching arrows from B
b_bot_mid = (B_x + B_w/2, B_y)
draw_arrow(b_bot_mid[0], b_bot_mid[1], C_x + C_w/2, C_y + C_h, lw=0.75)
draw_arrow(b_bot_mid[0], b_bot_mid[1], D_x + D_w/2, D_y + D_h, lw=0.75)

plt.tight_layout(pad=0.5)
out = "reports/2026-05-03_copd-figure1-consort-redesign/figures_v2/Fig1_CONSORT_v3"
plt.savefig(f"{out}.eps", format="eps", bbox_inches="tight")
plt.savefig(f"{out}.pdf", format="pdf", bbox_inches="tight")
plt.savefig(f"{out}.png", format="png", dpi=300, bbox_inches="tight")
print(f"WROTE: {out}.{{eps,pdf,png}}")
