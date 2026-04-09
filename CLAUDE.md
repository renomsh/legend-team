# CLAUDE.md

This project is a memory-first, topic-based strategy system.

Rules:
- Never start from UI
- Never generate JSX, React pages, dashboards, or mockups first
- Preserve structured topic state and revision history
- Master feedback is authoritative — take it literally. Do not over-interpret. When unclear, ask Master for clarification.
- Keep role separation: ace, arki, fin, riki, editor, nova
- Nova is optional and speculative unless explicitly promoted
- Prefer explicit, inspectable, file-based structure
- Use Node.js + TypeScript + file-based JSON/Markdown storage
- Keep outputs revisionable and re-openable
- Do not overwrite prior decisions or reports silently
- Before designing structure or architecture, first confirm the scope and goal of the work. Work definition precedes structural design.

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
- Ace focuses on framing, sequencing, and synthesis — not direct answers. Ace orchestrates; does not respond as a general assistant.

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
4. Read `memory/roles/{role}_memory.json` for roles expected to speak — load prior patterns and findings
5. Read `memory/shared/project_charter.json` — confirm charter version matches `config/project.json`. If mismatch, flag before proceeding.
6. Update `current_session.json` with new session ID and topic if starting fresh

**Session End checklist:**
1. Save all agent outputs to `reports/{YYYY-MM-DD}_{topic-slug}/{role}_rev{n}.md`
2. Append new decisions to `memory/shared/decision_ledger.json`
3. Update `memory/shared/topic_index.json` with topic status change
4. Update `memory/sessions/current_session.json` — set status to "closed", record closedAt
5. Append master feedback to `memory/master/master_feedback_log.json` if any was given
6. Update `memory/roles/{role}_memory.json` for roles that spoke — record new patterns, findings, or structural learnings. Roles that did not speak may be skipped (not a gap).
7. Log session event to `logs/app.log` via `ts-node scripts/session-log.ts end <topic-slug>`
8. Auto-push to GitHub: `node scripts/auto-push.js "session end: <topic-slug>"` (D-008)

**If any checklist item is skipped, note it as a gap in `memory/sessions/current_session.json`.**

### Asset Protocols (v0.4.0, D-012)

**evidence_index.json 운용 규칙:**
- 기록 주체: 주로 Riki(리스크), Arki(구조 진단), 세션 정비 시 운영자
- 기록 시점: 역할 발언 중 핵심 발견(finding)이 있을 때. 세션 종료 후 소급 기록도 허용
- 필수 필드: id (E-NNN), date, topic, type, source, finding, status
- type 값: structural-diagnosis | principle-violation | risk | assumption | data-error | operational-gap | legacy-ambiguity
- status 값: open | resolved-{context} | accepted-residual-risk
- 삭제 금지: status를 변경하되 엔트리를 삭제하지 않음
- 스크립트: `ts-node scripts/log-evidence.ts` 사용 가능 (수동 기록도 허용)

**glossary.json 운용 규칙:**
- 기록 주체: 모든 역할. 새 용어를 처음 사용하거나 정의가 필요할 때 추가
- 필수 필드: term, definition, addedBy, date
- 갱신: 정의가 변경되면 기존 엔트리를 업데이트 (덮어쓰기 허용 — glossary는 최신 정의가 canonical)
- 삭제: 더 이상 사용하지 않는 용어는 삭제 가능
- 용어는 한국어 우선, 영어 병기 허용

**master_feedback_log.json 운용 규칙 (v0.5.0):**
- status 값: pending | in-progress | resolved
- 갱신 주체: Claude Code가 세션 종료 시 자동 판정 (토픽 상태 및 구현 증거 기준)
- statusNote: 이행 상태에 대한 간단한 설명
- 삭제 금지: status를 변경하되 엔트리를 삭제하지 않음

### Script Status (v0.4.0)

**Active:**
- `session-log.ts` — 세션 시작/종료 + 체크리스트 검증 (H-01)
- `validate-output.ts` — 리포트 frontmatter 검증
- `auto-push.js` — 세션 종료 시 git push (D-008)
- `build.js` — CF Pages 빌드 (canonical)

**Utility:**
- `create-topic.ts`, `apply-feedback.ts`, `log-evidence.ts` — 사용 가능

**Deprecated:**
- `run-debate.ts` — debate_log.json 기반, 사용 중지 (session_005)
- `generate-dashboard.ts` — build.js로 대체 (session_007)
- `build-report.ts` — run-debate.ts 의존, 사용 중지 (session_007)