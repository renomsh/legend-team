# # Dark KPI Card Wireframe Explorations

## Approach 1: Vertical-Hierarchy (Label → Number → Sparkline)

_Started 2026-05-06 01:32 UTC_

---

## User

Create wireframe explorations for a dark-theme KPI card row (3 cards: L1/L2/L3 growth axes).
Show 3-5 distinct visual approaches so I can compare layout and emphasis axes.

CARDS (one-line data per card — do not redesign the data, only propose visual presentation):
- L1 · Quality: role quality score, 7 metrics averaged, example value 78.9/100
- L2 · Judgment Consistency: accuracy rate, 4 metrics, example value 56.7/100
- L3 · Execution Transfer: autonomy level, 3 metrics, example value 62.1/100

CURRENT TOKENS (reference — do not override):
- Background: #0B0B0D  Panel: #0B0B0D  Border: #26262D
- Text primary: #F5F5F7  Text meta: #82828C
- L1 accent gradient: #4F46E5 → #9333EA (violet)
- L2 accent gradient: #0891B2 → #14B8A6 (teal)
- L3 accent gradient: #D97706 → #F59E0B (amber)

CARD CONTENT (fixed — always include all):
- Eyebrow tag (e.g. "L1 · QUALITY", uppercase small)
- Axis name (e.g. "역할 품질", bold heading)
- Meta line (e.g. "7 / 7 metric · view=all", small muted)
- KPI number large (e.g. "78.9 /100", dominant, tabular-nums)
- Mini sparkline at bottom (3-point trend: all → recent10 → recent3)
- Trend chip (e.g. "→ -0.2  recent3 vs all")

REQUIREMENTS:
- Dark theme only (#0B0B0D background)
- Each card gets its axis accent color as a 3px top border stripe
- Sparkline uses axis accent color, subtle opacity
- 3 cards displayed side-by-side (equal width)
- Minimal, data-dense — no decoration beyond what serves legibility

Give me 3-5 distinctly different approaches to card layout and emphasis
(e.g. number-first vs label-first, sparkline position, accent usage, info density) —
do not commit to one. Side-by-side comparison with a decision-matrix card at the end.

## Assistant

I'll explore the design system first, then build wireframe explorations.

_[tool: list_files]_

Empty design system. I'll proceed with the tokens you provided and the Wireframe skill aesthetic — sketchy, low-fi, focused on structure.

_[tool: update_todos]_

_[tool: write_file]_

_[tool: done]_

_[tool: snip]_

_[tool: fork_verifier_agent]_

Five wireframe approaches are in `KPI Card Wireframes.html`:

1. **Number-first, maximal** — big KPI hero, spark as footnote
2. **Label-first, editorial** — title block + divider + number/spark baseline
3. **Spark-as-background** — sparkline area-fills the card behind the number
4. **Compact, side-by-side** — half-height; KPI left, spark right
5. **Data-dense / terminal** — mono, exposes metric breakdown inline

Plus a decision matrix at the bottom comparing emphasis, height, density, pros/cons, and a "pick by job" cheat-sheet.

