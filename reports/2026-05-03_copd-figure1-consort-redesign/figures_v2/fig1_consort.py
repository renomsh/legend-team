"""Fig 1 — CONSORT cohort flowchart (Vera rev1 spec).
Output: Fig1_CONSORT.eps + .pdf + .png (300dpi)
Data: 2,679 → 2,474 stable COPD → High-risk COTE n=315 / Low-risk COTE n=2,159
      Excluded: 168 post-BDR FEV1/FVC ≥70% + 37 no baseline HIRA enrollment
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
    "pdf.fonttype": 42,
    "ps.fonttype": 42,
})

# canvas: 180mm × 110mm (double column)
fig, ax = plt.subplots(figsize=(180/25.4, 110/25.4))
ax.set_xlim(0, 180); ax.set_ylim(0, 110)
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

# Box A — top, neutral fill
A_x, A_y, A_w, A_h = 15, 82, 75, 22
draw_box(A_x, A_y, A_w, A_h, fill=SURFACE, border=INK, lw=1.0)
draw_text(A_x + A_w/2, A_y + 17, "Patients with matched", 8, "normal")
draw_text(A_x + A_w/2, A_y + 13, "KOCOSS–HIRA data 2012–2021", 8, "normal")
draw_text(A_x + A_w/2, A_y + 5, "n = 2,679", 10, "bold")

# Box B — middle, neutral fill
B_x, B_y, B_w, B_h = 15, 52, 75, 18
draw_box(B_x, B_y, B_w, B_h, fill=SURFACE, border=INK, lw=1.0)
draw_text(B_x + B_w/2, B_y + 12, "Stable COPD cohort", 9, "bold")
draw_text(B_x + B_w/2, B_y + 4, "n = 2,474", 10, "bold")

# Arrow A → B (main flow)
draw_arrow(A_x + A_w/2, A_y, B_x + B_w/2, B_y + B_h, lw=0.75)

# Excluded frame — dashed, right of main flow
EX_x, EX_y, EX_w, EX_h = 105, 70, 67, 22
ex_rect = Rectangle((EX_x, EX_y), EX_w, EX_h,
                     facecolor="none", edgecolor=MUTE,
                     linewidth=0.5, linestyle=(0, (3, 2)))
ax.add_patch(ex_rect)
draw_text(EX_x + 3, EX_y + 17, "Excluded (n = 205)", 8, "bold", ha="left")
draw_text(EX_x + 3, EX_y + 10,
          "•  168: post-BDR FEV$_1$/FVC ≥ 70%", 7, "normal", ha="left")
draw_text(EX_x + 3, EX_y + 4,
          "•  37: no baseline HIRA enrollment", 7, "normal", ha="left")

# Arrow from main flow (right of A→B mid) to exclusion frame
mid_y = (A_y + B_y + B_h) / 2
draw_arrow(A_x + A_w, mid_y, EX_x, EX_y + EX_h/2, lw=0.5, dashed=True)
draw_text((A_x + A_w + EX_x)/2, mid_y + 2.5, "excluded", 7, "normal", color=INK)

# Bottom branches — C (High-risk) solid dark, D (Low-risk) outline
C_x, C_y, C_w, C_h = 12, 12, 60, 22
D_x, D_y, D_w, D_h = 80, 12, 60, 22

# High-risk solid
draw_box(C_x, C_y, C_w, C_h, fill=INK, border=INK, lw=1.0)
draw_text(C_x + 3, C_y + 17, "▲ High-risk", 7, "bold", color=PAPER, ha="left")
draw_text(C_x + C_w/2, C_y + 11, "High-risk COTE group", 9, "bold", color=PAPER)
draw_text(C_x + C_w/2, C_y + 4, "n = 315", 10, "bold", color=PAPER)

# Low-risk outline (border 1.5pt)
draw_box(D_x, D_y, D_w, D_h, fill=PAPER, border=INK, lw=1.5)
draw_text(D_x + D_w/2, D_y + 14, "Low-risk COTE group", 9, "bold")
draw_text(D_x + D_w/2, D_y + 5, "n = 2,159", 10, "bold")

# Branching arrows from B
b_bot_mid = (B_x + B_w/2, B_y)
draw_arrow(b_bot_mid[0], b_bot_mid[1], C_x + C_w/2, C_y + C_h, lw=0.75)
draw_arrow(b_bot_mid[0], b_bot_mid[1], D_x + D_w/2, D_y + D_h, lw=0.75)

plt.tight_layout(pad=0.5)
out = "reports/2026-05-03_copd-figure1-consort-redesign/figures_v2/Fig1_CONSORT_v2"
plt.savefig(f"{out}.eps", format="eps", bbox_inches="tight")
plt.savefig(f"{out}.pdf", format="pdf", bbox_inches="tight")
plt.savefig(f"{out}.png", format="png", dpi=300, bbox_inches="tight")
print(f"WROTE: {out}.{{eps,pdf,png}}")
