---
role: external-skill-only
turnId: 6
phase: experiment-m3
sessionId: session_246
topicId: topic_206
date: 2026-05-13
mode: M3
---

# Tech Debt Audit — scripts/lib/topic-status.ts

Analysis target: 100 LOC, single-file utility module exporting `updateTopicStatus`. The audit follows standard technical-debt SOP across six categories.

---

## 1. Tech Debt Inventory

| # | Item | Location (line) | Category | Severity |
|---|---|---|---|---|
| TD-01 | Synchronous file I/O (`readFileSync`/`writeFileSync`) blocks event loop; no async variant offered | L64, L74, L90, L93 | Architecture | Medium |
| TD-02 | No file locking or atomic write — concurrent invocations can corrupt JSON | L64-74, L90-93 | Architecture | High |
| TD-03 | Non-atomic write (write directly to target path, no temp-file + rename) — partial write on crash leaves invalid JSON | L74, L93 | Architecture | High |
| TD-04 | Weak typing: `data: { topics: Record<string, unknown>[] }` and `meta: Record<string, unknown>` — defeats type safety at the I/O boundary | L65, L91 | Type | Medium |
| TD-05 | Untyped `patch: Record<string, unknown>` accepts arbitrary fields via spread — silently allows typos | L56 | Type | Medium |
| TD-06 | No runtime validation of file contents against `TopicStatus` / `TopicPhase` enums after parsing | L65, L91 | Test | Medium |
| TD-07 | `JSON.parse` errors caught generically; user receives `(e as Error).message` with no context about which file/line failed | L76-78, L95-97 | Code | Low |
| TD-08 | Magic string paths hardcoded inline (`'memory'`, `'shared'`, `'topic_index.json'`, `'topics'`, `'topic_meta.json'`) — no constants/config | L59, L82 | Code | Low |
| TD-09 | `today` computed via `new Date().toISOString().slice(0, 10)` — not injectable, breaks deterministic testing | L55 | Test | Medium |
| TD-10 | Function signature mixes side effects (fs I/O) with pure logic; no dependency injection for `fs` | entire function | Test | Medium |
| TD-11 | `Object.assign(topic, patch)` mutates parsed object in place — no immutability guard | L73, L92 | Code | Low |
| TD-12 | Linear search `data.topics.find(...)` is O(n) per call — no index/map | L66 | Code | Low |
| TD-13 | No unit tests referenced or co-located (`*.test.ts` absent) | n/a | Test | High |
| TD-14 | No JSDoc on `TopicStatus`, `TopicPhase`, `UpdateResult` exported types — public API undocumented | L15-40 | Doc | Low |
| TD-15 | Inconsistent error handling: SOT failure returns early, mirror failure does not (returns with `sotUpdated:true, mirrorUpdated:false`) — caller must inspect `warnings` to detect partial failure | L76-78 vs L95-97 | Code | Medium |
| TD-16 | `warnings: string[]` as error channel — unstructured; consumers cannot programmatically distinguish failure modes | L39, L54 | Code | Medium |
| TD-17 | No file existence check on `indexPath` (only on `metaPath`) — inconsistent defensive coding | L84 vs L64 | Code | Low |
| TD-18 | `JSON.stringify(..., null, 2)` hardcoded — no formatting option | L74, L93 | Code | Low |
| TD-19 | No backup/rollback of SOT before write — write failure mid-stream loses prior content | L74 | Architecture | High |
| TD-20 | No dependency declarations visible (Node `fs`/`path` only — fine, but no version pinning evident in module) | L12-13 | Dependency | Low |

**Total: 20 items.** Debt density ≈ **200 issues per KLOC** (20 / 0.1 KLOC).

---

## 2. Categorization

| Category | Count | Items |
|---|---|---|
| **Architecture** | 4 | TD-01, TD-02, TD-03, TD-19 |
| **Code** | 8 | TD-07, TD-08, TD-11, TD-12, TD-15, TD-16, TD-17, TD-18 |
| **Test** | 4 | TD-06, TD-09, TD-10, TD-13 |
| **Type** | 2 | TD-04, TD-05 |
| **Doc** | 1 | TD-14 |
| **Dependency** | 1 | TD-20 |

Heaviest categories: **Code (40%)** and **Architecture (20%)**. Architecture items carry the highest severity.

---

## 3. Prioritization Matrix

|  | **Effort: Low** | **Effort: Med** | **Effort: High** |
|---|---|---|---|
| **Impact: High** | TD-13 (add tests) | TD-02 (file locking), TD-03 (atomic write), TD-19 (backup/rollback) | — |
| **Impact: Med** | TD-04, TD-05, TD-15, TD-16 | TD-01 (async I/O), TD-06 (runtime validation), TD-09 (clock injection), TD-10 (DI) | — |
| **Impact: Low** | TD-07, TD-08, TD-11, TD-14, TD-17, TD-18 | TD-12 (indexing) | TD-20 |

---

## 4. Quick Wins (High Impact × Low Effort)

1. **TD-13 — Add unit tests.** No tests exist for a SOT-mutating utility. Even a minimal suite covering happy path + missing-topic + missing-mirror + malformed JSON would catch most regressions. Estimated effort: **0.5 day**.
2. **TD-04 / TD-05 — Tighten types.** Replace `Record<string, unknown>` with a `TopicRecord` interface; restrict `patch` to keys of `TopicStatusUpdate ∪ { lastUpdated: string }`. Estimated effort: **2 hours**.
3. **TD-15 / TD-16 — Structured result.** Return a discriminated union (`{ ok: true } | { ok: false, code: 'SOT_NOT_FOUND' | 'SOT_WRITE_FAIL' | 'MIRROR_WRITE_FAIL', detail }`) instead of free-form `warnings[]`. Estimated effort: **3 hours**.

---

## 5. Refactoring Roadmap

### Phase 1 — Stabilize (Week 1, ~1.5 days)

- TD-13: Unit test scaffold (jest/vitest) with fixtures for `topic_index.json` and `topic_meta.json`.
- TD-04 / TD-05: Introduce `TopicRecord` interface and constrained `patch` type.
- TD-15 / TD-16: Replace `warnings[]` with structured `Result` type.
- TD-07: Wrap parse errors with file path context.

**Exit criteria**: >80% line coverage on `updateTopicStatus`, type-safe public API.

### Phase 2 — Harden I/O (Week 2, ~2 days)

- TD-03: Atomic write via temp file + `fs.renameSync` (or `fs.rename` if async adopted).
- TD-19: Pre-write backup copy of SOT to `.bak`; restore on mid-stream failure.
- TD-02: Advisory lock file (e.g., `topic_index.json.lock`) with stale-lock timeout.
- TD-06: Runtime schema validation (zod or ajv) on parsed JSON before mutation.

**Exit criteria**: Crash-injection test (kill process during write) leaves SOT in a consistent state.

### Phase 3 — Modernize (Week 3, ~1 day)

- TD-01: Provide `updateTopicStatusAsync` variant using `fs/promises`.
- TD-09 / TD-10: Inject `clock` and `fs` dependencies for deterministic testing.
- TD-08: Extract path constants to a shared `paths.ts` module.
- TD-11, TD-12, TD-14, TD-17, TD-18: Cleanup pass — immutability, indexing helper, JSDoc, defensive checks, formatter option.

**Exit criteria**: 100% public-API JSDoc, async path available, no hardcoded literals.

### Out of scope for this roadmap

- TD-20 (dependency versioning) — handled at repo level, not module level.

---

## 6. Metrics

| Metric | Value | Notes |
|---|---|---|
| LOC (non-blank, non-comment) | ~75 | of 100 total |
| Debt density | **200 issues / KLOC** | 20 issues over 0.1 KLOC |
| Cyclomatic complexity (estimated) | **5** for `updateTopicStatus` | 3 try/catch + 2 early returns |
| Type coverage (estimated) | **~60%** | Public API typed, internal data shapes use `Record<string, unknown>` |
| Test coverage | **0%** | no `*.test.ts` co-located |
| High-severity items | **4** (TD-02, TD-03, TD-13, TD-19) | All concurrency / durability / verification gaps |
| Estimated remediation effort | **~4.5 person-days** | Phases 1+2+3 combined |

Note: effort and complexity figures are SOP estimates from static reading of the module only; actual values depend on test-runner choice, repo conventions for path constants, and whether async migration cascades to callers.
