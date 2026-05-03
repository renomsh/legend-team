"""Fig 2 — Follow-up window sweep (본 연구 데이터, COTE 무관).
Output: Fig2_followup_sweep_v2.eps + .pdf + .png

본 연구 핵심: education effect (Low vs High, Model 3 GEE) → exacerbation,
mediation through SGRQ Symptoms (NIE), 시간 window 5개에서 robustness.

Data source: C:/Projects/COPD/ERJ_submission_2026-05-03/Code_data_for_DOI/outputs/followup_sweep.json
Spec: Vera rev2 — 2-panel forest, Helvetica, 5-color token, 흑백 only.
"""
import matplotlib.pyplot as plt

INK = "#1F2937"
MUTE = "#9CA3AF"
PAPER = "#FFFFFF"
SURFACE = "#F4F6F8"

plt.rcParams.update({
    "font.family": "Helvetica",
    "font.sans-serif": ["Helvetica", "Arial"],
    "pdf.fonttype": 42, "ps.fonttype": 42,
})

# (window, TE_OR, TE_lo, TE_hi, TE_p, NIE_OR, NIE_lo, NIE_hi, n_TE, events)
ROWS = [
    ("Y1 (primary)", 1.711, 0.77, 3.82, 0.1905,  1.122, 1.026, 1.273, 1352, 124),
    ("Y1–Y2",        1.582, 0.90, 2.78, 0.1114,  1.071, 1.005, 1.174, 1472, 205),
    ("Y1–Y3",        1.806, 1.09, 3.00, 0.0227,  1.056, 0.987, 1.136, 1506, 262),
    ("Y1–Y4",        1.520, 0.92, 2.51, None,    1.058, 1.000, 1.140, 1520, 295),
    ("Y1–Y5",        1.600, 0.94, 2.71, None,    1.066, 1.000, 1.150, 1525, 310),
]

# y positions: Primary 맨 위
y_positions = list(range(len(ROWS)))[::-1]  # 4,3,2,1,0 → Primary at top

fig, (axL, axR) = plt.subplots(1, 2, figsize=(190/25.4, 95/25.4),
                                gridspec_kw={"width_ratios": [1, 1], "wspace": 1.6})

def draw_panel(ax, idx_or, idx_lo, idx_hi, xlim, xticks, xtitle, log_scale=False):
    for r, yp in zip(ROWS, y_positions):
        or_, lo, hi = r[idx_or], r[idx_lo], r[idx_hi]
        is_primary = (r[0] == "Y1 (primary)")
        # CI bar
        ax.plot([lo, hi], [yp, yp], color=INK,
                linewidth=1.0 if is_primary else 0.6, solid_capstyle="butt", zorder=2)
        # marker
        if is_primary:
            ax.plot(or_, yp, marker="D", markersize=9,
                    markerfacecolor=INK, markeredgecolor=INK,
                    markeredgewidth=0.6, zorder=3)
        else:
            ax.plot(or_, yp, marker="o", markersize=5,
                    markerfacecolor=PAPER, markeredgecolor=INK,
                    markeredgewidth=0.6, zorder=3)
        # right-side numeric — placed in axes coords just past right spine
        weight = "bold" if is_primary else "normal"
        ax.text(1.04, yp, f"{or_:.2f} ({lo:.2f}–{hi:.2f})",
                transform=ax.get_yaxis_transform(),
                fontsize=7, fontweight=weight, va="center", ha="left",
                color=INK, clip_on=False)

    # Reference line at OR=1.0
    ax.axvline(1.0, color=MUTE, linestyle=(0, (3, 2)), linewidth=0.5, zorder=1)

    # Y axis
    ax.set_yticks(y_positions)
    ax.set_yticklabels([r[0] for r in ROWS], fontsize=8)
    for tick, r in zip(ax.get_yticklabels(), ROWS):
        if r[0] == "Y1 (primary)":
            tick.set_fontweight("bold")

    # X axis
    if log_scale:
        ax.set_xscale("log")
        ax.minorticks_off()
    ax.set_xlim(xlim)
    ax.set_xticks(xticks)
    ax.set_xticklabels([str(t) for t in xticks], fontsize=7)
    ax.set_xlabel(xtitle, fontsize=8, labelpad=4)

    # Cosmetics
    for spine in ("top", "right", "left"):
        ax.spines[spine].set_visible(False)
    ax.spines["bottom"].set_color(INK)
    ax.spines["bottom"].set_linewidth(0.5)
    ax.spines["bottom"].set_position(("outward", 4))
    ax.tick_params(axis="x", colors=INK, length=2, width=0.5, pad=2)
    ax.tick_params(axis="y", length=0)
    ax.set_ylim(min(y_positions) - 0.7, max(y_positions) + 0.7)

# Left panel — Total Effect (log scale, wide range)
draw_panel(axL, idx_or=1, idx_lo=2, idx_hi=3,
           xlim=(0.6, 4.5), xticks=[0.7, 1.0, 1.5, 2.0, 3.0, 4.0],
           xtitle="Total Effect — OR (95% CI)\nLow vs High education, Model 3 (GEE)",
           log_scale=True)

# Right panel — Natural Indirect Effect (linear, narrow range)
draw_panel(axR, idx_or=5, idx_lo=6, idx_hi=7,
           xlim=(0.95, 1.32), xticks=[1.0, 1.1, 1.2, 1.3],
           xtitle="Natural Indirect Effect — OR (95% CI)\nvia SGRQ Symptoms",
           log_scale=False)

# Top section headers — positioned over each panel
axL_pos = axL.get_position()
axR_pos = axR.get_position()
fig.text((axL_pos.x0 + axL_pos.x1) / 2, 0.94,
         "Total effect of low education", fontsize=9, fontweight="bold",
         ha="center", color=INK)
fig.text((axR_pos.x0 + axR_pos.x1) / 2, 0.94,
         "Mediation via SGRQ Symptoms", fontsize=9, fontweight="bold",
         ha="center", color=INK)

out = "reports/2026-05-03_copd-figure1-consort-redesign/figures_v2/Fig2_followup_sweep_v2"
plt.savefig(f"{out}.eps", format="eps", bbox_inches="tight")
plt.savefig(f"{out}.pdf", format="pdf", bbox_inches="tight")
plt.savefig(f"{out}.png", format="png", dpi=300, bbox_inches="tight")
print(f"WROTE: {out}.{{eps,pdf,png}}")
