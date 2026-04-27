---
role: dev
turnId: 0
invocationMode: subagent
topic: pd-039-close-skill-natural-language
date: 2026-04-28
accessed_assets:
  - file: .claude/commands/close.md
    scope: command-spec
  - file: .claude/settings.json
    scope: hooks-config
  - file: scripts/auto-push.js
    scope: argv-default
  - file: memory/sessions/session_index.json
    scope: oneLineSummary-richness
  - file: git log --oneline -30
    scope: commit-message-distribution
---

# Dev — PD-039 close skill 자연어 발동 실측

## 결론 (Y/N)

**Y, 부분 발동.** 자연어 종료 시 close.md(commands/)가 LLM 컨텍스트에 자동 주입되지는 **않지만**, CLAUDE.md L6 자율 호출 지침 + 직전 세션 패턴 학습이 결합되어 LLM이 14단계 중 "데이터 박제 단계"는 자력 수행. **하드 자동화는 hook chain만**, slug 메시지·oneLineSummary는 LLM 자율 영역.

## 메커니즘 분리 (3축 실측)

### 축1 — `.claude/commands/` vs `.claude/skills/`
- `commands/close.md` (commands/, 3 files: ace-framing/close/open) — **명시 슬래시 호출 전용**. 자동 컨텍스트 주입 없음.
- `skills/` (10개) — system-reminder의 available-skills 목록에 노출 + LLM 자율 호출 가능.
- 따라서 자연어 "닫아줘" 시 close.md 본문은 LLM 컨텍스트에 **자동 로드되지 않음**. LLM이 메모리/CLAUDE.md L6 + 학습된 14단계 패턴으로 모사.

### 축2 — Hook chain은 자동 (단 결과는 다름)
`.claude/settings.json:14-15`:
```
"command": "node scripts/auto-push.js \"session end: auto\""
```
SessionEnd hook은 무조건 발동. 하지만 LLM이 마지막에 close.md 14단계의 `node scripts/auto-push.js "session end: <topic-slug>"`를 **자력 실행**했는지 여부에 따라 commit 메시지가 갈림.

### 축3 — git log 분포 = 두 경로 결과 차이표
| 패턴 | 메시지 | 경로 | 빈도(최근 30) |
|---|---|---|---|
| LLM이 14단계 자력 수행 | `session end: <slug>` 또는 `(session_NNN)` 부속 | 자율 발동 성공 | 27/30 |
| LLM이 14단계 누락 → SessionEnd hook 디폴트만 | `session end: auto` (settings.json 하드코딩) | hook fallback | 3/30 (af41e55, 8a771f5, 1086a41) |

`auto-push.js:93` `process.argv[2] || "session update: {date}"` — 디폴트는 "session update", 따라서 "session end: auto"는 **settings.json이 박은 인자**다. 즉 LLM 14단계 미수행 시 hook이 fallback으로 commit만 박음.

### 축4 — Arki F-118e 매핑
session_110/115 빈 껍데기 의심은 **잘못된 진단**. session_index.json:4663,4839 모두 풍부한 oneLineSummary 박제됨 (CSS §7~§10 단일화 / Build Freshness 제거+역할색상 동기화). LLM 자율 호출 경로가 작동한 증거. F-118e는 코드 경로만 본 한계.

## 슬래시 vs 자연어 산출물 차이

| 항목 | `/close` 명시 | 자연어 "닫아줘" |
|---|---|---|
| close.md 컨텍스트 주입 | ✅ 강제 | ❌ 자동 안 됨 |
| 14단계 LLM 수행 | ✅ 거의 100% | △ CLAUDE.md 학습 의존 ~90% |
| oneLineSummary 박제 | ✅ | ✅ (실측 확인) |
| Hook chain | ✅ | ✅ (settings.json 하드) |
| commit 메시지 slug | ✅ | △ 누락 시 "session end: auto" |

## Master 질문 직답
> "스킬이 발동되는지"

**commands/close.md 자체는 자연어로 발동 안 됨** (commands는 슬래시 전용). 그러나 **CLAUDE.md L6 + 학습 패턴이 functional substitute**로 작동하여 14단계 대부분을 LLM이 자력 수행. 3/30 fallback 사례는 LLM이 14단계 마지막 push step을 누락하고 hook이 받아낸 흔적 = 부분 실패의 실증.

권고: close.md를 commands/ → skills/ 로 옮기면 자연어 자동 호출 가능성 강화 (system-reminder skill 목록에 등재됨).

```yaml
# self-scores
rt_cov: 0.85
gt_pas: 0.90
hc_rt: 0.05
spc_drf: 0
```
