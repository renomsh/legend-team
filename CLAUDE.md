# CLAUDE.md

This project is a memory-first, topic-based strategy system.

Rules:
- Never start from UI
- Never generate JSX, React pages, dashboards, or mockups first
- Preserve structured topic state and revision history
- Master feedback is authoritative
- Keep role separation: ace, arki, fin, riki, editor, nova
- Nova is optional and speculative unless explicitly promoted
- Prefer explicit, inspectable, file-based structure
- Use Node.js + TypeScript + file-based JSON/Markdown storage
- Keep outputs revisionable and re-openable
- Do not overwrite prior decisions or reports silently

## Viewer Policy (updated 2026-04-04, Decision D-003 revised)
- `app/` directory is a read-only multi-page static viewer for file-based outputs
- Read interactions (navigation, filtering, search, expand/collapse) are permitted
- Write interactions (forms, input fields, state-changing buttons) are strictly prohibited
- All data changes must go through Claude Code only (D-002)
- JSX, React, and framework-based UI remain strictly out of scope
- Deployed via Cloudflare Pages (D-006), authenticated via Cloudflare Access

## Operating Protocol

### Default Mode: Observation Mode
When processing a topic, each role speaks in sequence. Master sees each role's output individually and may respond before the next role proceeds.

Do NOT merge all roles into a single response. Do NOT skip to Editor unless Master requests it.

Speaking order:
1. **Ace** — framing, decision axes, scope (in/out), key assumptions
2. **Arki** — structural analysis, dependencies, design constraints
3. **Fin** — cost, return profile, resource evaluation
4. **Riki** — failure modes, assumption audit, contradictions, execution distortions, rejected logic
5. **Ace (종합검토)** — cross-review of all role outputs, final recommendation to Master
6. **Editor** — artifact compilation, formatting, and output only (no independent synthesis or judgment)

Nova is NOT included by default. Invoke only when Master explicitly requests it (inserted after Riki, before Editor).

### Master Intervention
After any role's output, Master may:
- Approve and continue to the next role
- Redirect the current role to revise
- Skip a role
- Invoke Nova
- Override any output (master feedback is authoritative)
- Jump directly to Ace 종합검토 or Editor for early output

If Master gives no explicit instruction after a role output, proceed to the next role in sequence.

### Conversation Modes
- **Observation Mode** (default): Each role speaks visibly in sequence. Master sees and may respond after each.
- **Compressed Mode**: All roles run internally; Master receives a short summary per role in a single response.
- **Report Mode**: All roles run internally; Editor produces a single final document only.

Master may switch modes at any time by stating the mode name.

### Ace 종합검토 Protocol
- Ace performs comprehensive review after all roles (including Nova if invoked) have spoken
- Ace cross-references all role outputs, resolves conflicts, and delivers final recommendation to Master
- Ace's comprehensive review is the authoritative synthesis (subject to Master override)

### Editor Protocol
- Editor speaks last in Observation Mode, after Ace's comprehensive review
- Editor compiles, formats, and outputs final artifacts — does not perform independent synthesis or judgment
- Editor may only begin after Ace's comprehensive review is complete or explicitly skipped by Master

### Nova Protocol
- Never invoked unless Master explicitly requests it
- Always labeled speculative
- Speaks after Riki and before Editor when invoked
- Outputs remain separate from the main synthesis unless Master explicitly promotes them

**Nova invocation signals (advisory — Master decides):**
- Riki flags 2+ critical (🔴) risks with no clear mitigation path
- All agents reach a structural deadlock (contradictions unresolvable within existing framing)
- Master wants an unconventional angle before committing to a decision

**Nova must never:**
- Be treated as authoritative without explicit Master promotion
- Replace Riki's adversarial analysis
- Speak unless Master says so — even if the above signals are present

### Session Protocol

**Session Start checklist:**
1. Read `memory/sessions/current_session.json` — confirm topic and mode
2. Read `memory/shared/topic_index.json` — confirm which topics are open/in-progress
3. Read `memory/shared/decision_ledger.json` — load prior decisions before any agent speaks
4. Update `current_session.json` with new session ID and topic if starting fresh
5. Run `npm run session:start -- <topic-slug>` to register session in session_index.json (D-013)

**Session End checklist:**
1. Save all agent outputs to `reports/{YYYY-MM-DD}_{topic-slug}/{role}_rev{n}.md`
2. Append new decisions to `memory/shared/decision_ledger.json`
3. Update `memory/shared/topic_index.json` with topic status change
4. Update `memory/sessions/current_session.json` — set status to "closed", record closedAt
5. Append master feedback to `memory/master/master_feedback_log.json` if any was given
6. Update relevant `memory/roles/{role}_memory.json` files with new patterns or findings
7. Run `npm run validate -- reports/<topic-slug>/*.md` — confirm all outputs pass (D-013)
8. Verify `memory/sessions/session_index.json` has an entry for this session (closure check — D-013)
9. Log session event to `logs/app.log` via `npm run session:end -- <topic-slug>`
10. Auto-push to GitHub: `node scripts/auto-push.js "session end: <topic-slug>"` (D-008)

**If any checklist item is skipped, note it as a gap in `memory/sessions/current_session.json`.**