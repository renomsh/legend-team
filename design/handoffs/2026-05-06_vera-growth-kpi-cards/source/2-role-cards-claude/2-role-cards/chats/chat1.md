# Dark Theme Role KPI Cards

_Started 2026-05-06 03:00 UTC_

---

## User

Create wireframe explorations for a dark-theme Role KPI card grid (6 cards: ACE/ARKI/RIKI/DEV/JOBS/VERA).

CURRENT TOKENS:
- Background: #0B0B0D  Panel: #111115  Border: #26262D
- Text primary: #F5F5F7  Text meta: #82828C  Text muted: #52525C
- Role colors: ACE=#9F75F8, ARKI=#38BDF8, RIKI=#F87171, DEV=#60A5FA, JOBS=#FB923C, VERA=#F472B6

CARD CONTENT (fixed — always include all):
- Eyebrow tag (role dot + "ACE", uppercase small, role color dot)
- Role display name (e.g. "Ace", bold heading)
- Metric label (e.g. "aud_rcl · quality", small muted)
- KPI number large (e.g. "40.0 /100", tabular-nums)
- Confidence / sample size (e.g. "n=2" or "CI95 [17, 63] · n=4", small muted)
- BASELINE badge (small pill, muted border)

LAYOUT:
- 3-column grid, equal width cards
- Dark theme only (#0B0B0D background)
- Each card uses its role accent color for visual identity

CONTEXT:
- These cards sit directly below the §1 Axis Pulse section (3 cards with 3px top accent stripe + spark-as-background gradient)
- The role cards should feel related but slightly lighter in visual weight

Give me 3-4 distinctly different approaches to card layout and emphasis. Include a decision matrix at the end.

## Assistant

I'll explore the design system first, then create wireframe explorations for the role cards.

_[tool: list_files]_

Empty design system — I'll work from the tokens you provided. Let me set up the wireframe exploration.

_[tool: update_todos]_

## Assistant

Thinking about 4 distinct approaches:

**A. Stripe** — top 3px accent stripe like §1 Axis Pulse (consistent w/ neighbor section, but you said "slightly lighter"). I'll do a thin LEFT rail instead — same DNA, lower weight.
**B. Dot-led** — pure typography, only the role dot carries color. Most restrained.
**C. Tinted panel** — card bg uses role color at ~6% alpha tint. Color-forward.
**D. Numeric-hero** — KPI number is the visual anchor, role color in the number itself. Data-forward.

Let me build it.

_[tool: write_file]_

_[tool: done]_

_[tool: fork_verifier_agent]_

Four wireframe approaches with the §1 ghost echo, full content slots, and a decision matrix recommending **A · Left rail** as the default.

- **A · Left rail** — 3px accent on left edge (mirrors §1's top stripe, lighter weight)
- **B · Dot-led** — color only in the dot, most restrained
- **C · Tinted panel** — role-color wash on the surface, heaviest
- **D · Numeric hero** — KPI set huge in role color

