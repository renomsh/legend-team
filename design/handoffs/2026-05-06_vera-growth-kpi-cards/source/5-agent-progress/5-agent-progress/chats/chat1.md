# # Agent Progress Wireframes

## Approach 1: Vertical Timeline (Connected States)

```
┌─────────────────────────

_Started 2026-05-06 04:12 UTC_

---

## User

Create wireframe explorations for a dark-theme Agent Progress list (§5 of a Growth Board dashboard).

CURRENT TOKENS:
- Background: #0B0B0D  Panel: #111115  Border: #26262D
- Text primary: #F5F5F7  Text meta: #82828C  Text muted: #52525C
- ok (done): #10B981  warn (skipped): #F59E0B
- Role colors: JOBS=#FB923C, ACE=#9F75F8, ARKI=#38BDF8, FIN=#34D399, RIKI=#F87171, NOVA=#E879F9, VERA=#F472B6, EDI=#94A3B8

AGENT ROW CONTENT (fixed — always include all):
- Role dot (6px, role color when done, muted when pending)
- Role label (e.g. "Ace", "Arki", "Jobs")
- Status badge: DONE (green pill), PENDING (gray pill), SKIPPED (amber pill, row dimmed)
- Left accent: 3px role-color stripe when done, muted when pending/skipped

EXAMPLE STATE (8 agents, mixed):
- Jobs → DONE
- Ace → DONE
- Arki → DONE
- Fin → PENDING
- Riki → PENDING
- Nova → SKIPPED (dimmed, 45% opacity)
- Vera → DONE
- Edi → PENDING

CONTEXT:
- Sits inside the "Current Session" panel, below session meta cards
- Width: full container width (not grid — single column list)
- Above it: §1 Axis Pulse (3 KPI cards) + §2 Role Cards (6 cards with left-rail accent)
- Should feel like a timeline / checklist, not a table

Give me 3-4 distinctly different approaches:
- Vary how progress is communicated visually (row style, timeline, step indicator, compact vs airy)
- Keep the DONE/PENDING/SKIPPED states clearly distinguishable
- Include a decision matrix at the end with a recommendation

## Assistant

I'll explore the design system first, then sketch out distinctly different approaches.

_[tool: list_files]_

_[tool: list_files]_

Design system folder is empty — I'll proceed using only the tokens you provided. Let me build wireframes.

_[tool: update_todos]_

Plan: 4 approaches, side-by-side on a single page, sketchy/low-fi but rendering the actual dark tokens so the user can judge.

- **A. Stacked List** — straight rows, left accent stripe, status pill on right (the "by-the-book" baseline).
- **B. Vertical Timeline** — connected dots down a rail, role on left, status hangs off right; agents read as sequential steps.
- **C. Stepper Bar + Detail** — horizontal step indicator at top (8 nodes), expanded detail rows below; progress is felt at a glance.
- **D. Dense Grid Checklist** — two-column compact checkboxes, very airy negative space, monospace numerals. Optimized for "scan whole list in 1 second."

Decision matrix at bottom + tweaks for density and animated pending pulse.

_[tool: write_file]_

_[tool: done]_

Four approaches on a single sketchbook page, each rendering the actual dark tokens inside a hand-drawn frame:

- **A · Stacked List** — left accent stripe + right pill (baseline, settings-page feel)
- **B · Vertical Timeline** — connected nodes, filled checks, dashed for skipped (sequential)
- **C · Stepper + Detail** — 8-node bar on top, 2-col detail below (at-a-glance %)
- **D · Dense Checklist** — monospace 2-col, smallest footprint (compact)

Decision matrix scores them across at-a-glance %, state distinguishability, sequential sense, vertical cost, scaling, and "checklist not table" fit.

**Recommendation: B (Timeline) as default, D (Dense) as a compact toggle.** B best fits the "timeline/checklist not table" brief; D covers the vertical-cost gap when §1+§2 above are already heavy.

_[tool: fork_verifier_agent]_

Ready for your call on which direction to push further — happy to flesh out B with live-state animation, or merge B+D into a single tweakable component.

