# AGENTS.md

Minimal Codex operating guide for `legend-team`.

## Project Axis

Legend-Team is a memory-first, topic-based strategy system.

- Use Node.js + TypeScript + file-based JSON/Markdown storage.
- Treat `memory/` and `reports/` as the authoritative project state.
- Keep role separation: Ace, Arki, Fin, Riki, Editor. Nova is optional and only invoked when Master explicitly asks.
- Preserve structured topic state, revision history, and prior decisions.
- Do not silently overwrite decisions, reports, or memory files.

## Hard Rules

- Do not start from UI.
- Do not generate JSX, React pages, dashboards, or mockups first.
- `app/` is a read-only static viewer for file-based outputs.
- Read interactions in `app/` are allowed; write interactions are not.
- All data changes must be explicit, inspectable, and file-based.
- Before designing structure or architecture, first confirm the scope and goal of the work.

## Session Start

Read these files before acting on a topic:

1. `memory/sessions/current_session.json`
2. `memory/shared/topic_index.json`
3. `memory/shared/decision_ledger.json`
4. `memory/shared/project_charter.json`
5. Relevant `memory/roles/{role}_memory.json` files for roles expected to speak

If `memory/shared/project_charter.json` and `config/project.json` disagree, flag the mismatch before proceeding.

## Role Order

Default speaking order:

1. Ace: framing, decision axes, scope, assumptions
2. Arki: structure, dependencies, design constraints
3. Fin: cost, return profile, resource evaluation
4. Riki: failure modes, assumption audit, contradictions
5. Ace: comprehensive review and final recommendation
6. Editor: artifact compilation and formatting only

Nova speaks only when Master explicitly requests it, after Riki and before Editor.

## Session End

When closing a session:

1. Save role outputs to `reports/{YYYY-MM-DD}_{topic-slug}/{role}_rev{n}.md`.
2. Append new decisions to `memory/shared/decision_ledger.json`.
3. Update `memory/shared/topic_index.json`.
4. Update `memory/sessions/current_session.json` with closed status and gaps, if any.
5. Append Master feedback to `memory/master/master_feedback_log.json`, if any.
6. Update relevant role memory files.
7. Run `npm run session:end -- <topic-slug>` when appropriate.
8. Run `node scripts/auto-push.js "session end: <topic-slug>"` only when Master wants the session pushed.

If any checklist item is skipped, record the gap in `memory/sessions/current_session.json`.

## Useful Commands

- `npm run create-topic`
- `npm run session:start`
- `npm run session:end`
- `npm run feedback`
- `npm run validate`
- `npm run evidence`
- `npm run build`
