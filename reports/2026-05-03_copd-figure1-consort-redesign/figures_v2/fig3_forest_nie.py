"""Fig 3 — NIE forest plot, sensitivity sweep (Vera rev2 spec, v2-fix).
Output: Fig3_forest_NIE_v2.eps + .pdf + .png
Fix: Primary 맨 위, x tick 단순화(1.0/1.2/1.5), spine 정리, OR 텍스트 위치.
Data sources:
  - table4_sensitivity_v2.json: Primary, S1, S2, S5, S7
  - S3_ignorability_sensitivity.json: Bias-adjusted R=1.10
  - S4_gold12_subcohort.json: S4
  - S8: transcribed from original image (no separate JSON for NIE)
"""
import matplotlib.pyplot as plt

INK = "#1F2937"
MUTE = "#9CA3AF"
PAPER = "#FFFFFF"

plt.rcParams.update({
    "font.family": "Helvetica",
    "font.sans-serif": ["Helvetica", "Arial"],
    "pdf.fonttype": 42, "ps.fonttype": 42,
})

# (label, OR, CI_lo, CI_hi, marker_type)
ROWS = [
    ("Primary (n=850)",                 1.122, 1.03, 1.27, "primary"),
    ("Bias-adjusted (R=1.10)",          1.113, 1.02, 1.26, "bias"),
    ("S1: FEV$_1$ unadjusted (n=891)",  1.162, 1.06, 1.32, "sens"),
    ("S2: + Charlson (n=724)",          1.073, 0.98, 1.21, "sens"),
    ("S3: Ignorability sweep (E=1.49)", 1.122, 1.03, 1.27, "sens"),
    ("S4: GOLD 1–2 sub (n=605)",        1.197, 1.06, 1.39, "sens"),
    ("S5: COPD-only (n=750)",           1.130, 1.03, 1.27, "sens"),
    ("S7: IPW missingness",             1.132, 1.03, 1.28, "sens"),
    ("S8: Job-NaN excluded (MAR)",      1.120, 1.02, 1.26, "sens"),
]

# group by marker_type for visual gaps
def group_of(mt):
    return {"primary": 0, "bias": 1, "sens": 2}[mt]

# y positions: Primary on top (largest y), gap between groups
GROUP_GAP = 0.6
y_positions = []
prev_grp = None
y = 0
for _, _, _, _, mt in ROWS:
    grp = group_of(mt)
    if prev_grp is not None and grp != prev_grp:
        y -= GROUP_GAP
    y_positions.append(y)
    y -= 1
    prev_grp = grp
# Now Primary y=0, others negative. Shift so all positive with Primary on top.
y_min = min(y_positions)
y_positions = [yp - y_min for yp in y_positions]
# After shift: S8 is at 0, Primary is at max — but matplotlib y increases upward,
# so Primary (largest y) renders on TOP naturally. No invert.

fig, ax = plt.subplots(figsize=(95/25.4, 100/25.4))

OR_TXT_X = 1.58  # right-side OR text x position

MARKER, MS, LW = "o", 6, 0.6  # unified across all rows
for (label, or_, lo, hi, mtype), yp in zip(ROWS, y_positions):
    fill = INK if mtype == "primary" else PAPER  # Primary solid, others hollow
    ax.plot([lo, hi], [yp, yp], color=INK, linewidth=LW, solid_capstyle="butt", zorder=2)
    ax.plot(or_, yp, marker=MARKER, markersize=MS,
            markerfacecolor=fill, markeredgecolor=INK,
            markeredgewidth=0.6, zorder=3)
    txt_weight = "bold" if mtype == "primary" else "normal"
    ax.text(OR_TXT_X, yp, f"{or_:.2f} ({lo:.2f}–{hi:.2f})",
            fontsize=7, fontweight=txt_weight, va="center", ha="left",
            color=INK, clip_on=False)

# Reference line at OR=1.0
ax.axvline(1.0, color=MUTE, linestyle=(0, (3, 2)), linewidth=0.5, zorder=1)

# Y axis labels — Primary bold
ax.set_yticks(y_positions)
ax.set_yticklabels([r[0] for r in ROWS], fontsize=8)
for tick, (_, _, _, _, mt) in zip(ax.get_yticklabels(), ROWS):
    if mt == "primary":
        tick.set_fontweight("bold")

# X axis — simplified ticks (drop 0.9 to avoid overlap with 1.0)
ax.set_xlim(0.92, 1.55)
ax.set_xticks([1.0, 1.2, 1.4])
ax.set_xticklabels(["1.0", "1.2", "1.4"], fontsize=7)
ax.set_xlabel("NIE Odds Ratio (95% CI)", fontsize=8, labelpad=4)

# Cosmetics
for spine in ("top", "right", "left"):
    ax.spines[spine].set_visible(False)
ax.spines["bottom"].set_color(INK)
ax.spines["bottom"].set_linewidth(0.5)
ax.spines["bottom"].set_position(("outward", 4))
ax.tick_params(axis="x", colors=INK, length=2, width=0.5, pad=2)
ax.tick_params(axis="y", length=0)
ax.set_ylim(min(y_positions) - 0.7, max(y_positions) + 0.7)

# leave space on right for OR text (extends past x=1.55)
plt.subplots_adjust(left=0.34, right=0.78, top=0.97, bottom=0.10)

out = "reports/2026-05-03_copd-figure1-consort-redesign/figures_v2/Fig3_forest_NIE_v2"
plt.savefig(f"{out}.eps", format="eps", bbox_inches="tight")
plt.savefig(f"{out}.pdf", format="pdf", bbox_inches="tight")
plt.savefig(f"{out}.png", format="png", dpi=300, bbox_inches="tight")
print(f"WROTE: {out}.{{eps,pdf,png}}")
