---
role: arki
turnId: 0
sessionId: session_233
topicId: topic_196
---

# Arki rev1 — Agent 호출 시간 단축 구조 분해

Master, Arki입니다. dispatch 지연을 1회 호출 단위로 분해하고 단축 옵션을 제시합니다.

---

## 1. 병목 분해 (Mechanical breakdown)

Nexus가 Task/Agent 툴을 1회 호출할 때 직렬로 발생하는 단계. 각 단계 비중은 추정. 측정 인프라(`SPIKE_R6_LOG` 환경변수 instrumentation이 `post-tool-use-task.js` L296에 이미 있음 — pre-hook에는 없음)가 있으므로 실측 가능.

| # | 단계 | 위치/근거 | 추정 비중 | 비고 |
|---|---|---|---|---|
| A | Nexus prompt 구성 | Main 모델이 system_prompt에 ROLE 마커·context briefing 직접 작성 | **3~7%** | 텍스트 길이에 비례. 본 호출 originalPromptLen=2029자 |
| B | PreToolUse hook chain (3개 직렬) | `.claude/settings.json` L41-58: `pre-tool-use-task.js`(29KB) → `pre-tool-use-task-sage-gate.js`(8.6KB) → `pre-tool-use-task-master-first.js`(6KB) | **15~25%** | Node cold-start ×3 (각 ~50-150ms) + I/O. **추측: 200~600ms 합계** |
| B-1 | persona compose (3층 read) | `pre-tool-use-task.js` L163-199: `_common.md`(3.4KB) + `policies/role-arki.md`(2.4KB) + `personas/role-arki.md`(1.3KB) = **7.1KB** disk read | <50ms | 안정적 |
| B-2 | session layer build | L319-377: 모든 turns의 보고서 파일 disk read + truncate (turn당 최대 6KB) | turns ↑ 시 선형 ↑ | 본 세션 turns=0이라 무시. 후반 세션 5~10 turns ×6KB = 30~60KB read |
| B-3 | topic layer build | L384-446: `topics/{tid}/session_contributions/*_edi_report.md` 전부 read (Edi당 최대 8KB) | 토픽 누적 세션 ↑ 시 선형 ↑ | 본 토픽=신규 → 0. 누적 토픽은 N×8KB |
| B-4 | transition gate / blind-parallel marker | L283-313, L461-493: `topic_index.json` read + grade/topicType 분기 | <20ms | 무시 |
| C | Task tool RPC + 서브에이전트 컨텍스트 부트스트랩 | Claude Code 내부. 시스템 프롬프트 + CLAUDE.md(추정 30~50KB) + skill index(150+ skill, deferred 제외도 다수) + MCP server 등록 | **40~60%** | **단일 최대 병목 추정.** Master 체감 지연의 주범. CLAUDE.md 본 worktree=약 25KB+ (project) + global instructions ~10KB |
| D | 모델 첫 토큰 latency (서브에이전트) | Anthropic API. opus = sonnet 대비 ~1.5~2× | **20~35%** | persona가 opus 모델 지정 (`personas/role-arki.md` frontmatter `model: opus`). dev/zero/edi 등 대부분도 opus 추정 |
| E | 서브에이전트 자체 작업 | Read·Grep·Bash·Write — 역할마다 다름 | 가변 | 본 토픽 외 |
| F | 결과 직렬화·반환 + Nexus 재진입 | Claude Code 내부 | <5% | 무시 |
| G | PostToolUse(Task) hook | `post-tool-use-task.js`(21KB): turns push, frontmatter patch, turn_log, gap 검사 | **3~5%** | I/O 위주. 100~250ms 추정 |

### 비중 합계 검증
A(5) + B(20) + C(50) + D(27) + F(3) + G(5) ≈ 110% — 단계 간 약간의 병렬·중첩 가정. 핵심: **C(부트스트랩) + D(첫 토큰)** 이 70~85%.

### 1회 호출 누적 inject 크기 (실측)
log 마지막 줄: arki 호출 시 `injectionLen=4631 mutatedPromptLen=6660`. 후반 세션 Edi 호출은 `injectionLen=13242` (session_232 마지막). 즉 페르소나(7KB) + 토픽 Edi 누적(최대 8KB) + 세션 turns(증가) = mutatedPrompt가 세션 후반 **15KB+**까지 부푼다. 이는 D(첫 토큰 latency)에 직접 가산.

### 추측·미검증 표시
- B의 200~600ms: Node spawn cost는 추정. 실측 수단 없음 (pre-hook에 `SPIKE_R6_LOG` 미적용).
- C의 40~60%: 서브에이전트 시스템 프롬프트 크기·MCP 로드 비용은 Claude Code 내부 비공개. 추정.
- D의 모델 모드별 차: opus vs sonnet 일반론. 본 시스템 실측 없음.

---

## 2. 단축 옵션

### Opt-1. PreToolUse hook 3개 → 1개로 통합 (Node spawn 감축)
- **Lever**: 3개 별도 .js 파일 직렬 spawn → 단일 hook.js 내에서 sage-gate / master-first / persona-inject 모듈 require. settings.json hooks 항목도 1줄.
- **예상 절감**: B 단계 200~600ms 추정 중 **40~60%** (Node cold-start 2회 절감). 호출당 100~300ms.
- **난이도**: **S**. 각 hook이 stdin/stdout JSON protocol 준수 — 내부 함수 합성만 필요.
- **트레이드오프**: hook 파일 단일 책임 위배(F-013 스타일). 한 hook 버그 시 3 기능 동반 차단. mitigation: `try/catch` 모듈별 격리 + `silent pass` (현 hook 패턴과 동일).
- **Riki 검토 포인트**: 통합 시 master-first hook의 BLOCK 응답이 sage-gate 결과를 덮어쓰는 우선순위 충돌 가능성.

### Opt-2. 페르소나 layer 빌드 결과 캐시 (cold load 1회)
- **Lever**: `_common.md` + `policies/role-{r}.md` + `personas/role-{r}.md` 합성 결과를 `memory/cache/persona-{r}.txt`로 빌드. mtime 체크 후 stale일 때만 재합성. hook은 캐시 read 1번.
- **예상 절감**: B-1 단계 50ms를 ~5ms로 (3 파일 read → 1 파일 read). 호출당 절감 작음(~30ms) — 누적 가치는 Long horizon (수만 호출 시 분 단위).
- **난이도**: **S**. invalidation은 정책/페르소나 파일 mtime 비교.
- **트레이드오프**: 캐시 stale 위험 (정책 수정 후 즉시 반영 안 됨). mitigation: mtime 비교 + 실패 시 fallback.
- **Riki 검토 포인트**: `_common.md` 변경이 cascade로 11개 캐시 무효화 — 동시성 문제. 단일 빌드 스크립트 직렬화로 해결.

### Opt-3. session/topic layer payload 절삭 강화
- **Lever**: 현재 cap=80KB, per-report=6KB(Edi 8KB). cap을 40KB로 낮추고 per-report를 3KB로 줄임. 또는 직전 N=3 turns만 inject (현재는 전체).
- **예상 절감**: D(첫 토큰 latency) 단계가 prompt 길이에 ~선형 비례. 본 세션 후반 mutatedPrompt 15KB → 8KB로 줄이면 D 단계 **30~40%** 절감 (추측). 전체 호출 시간 **~10~15%** 절감.
- **난이도**: **S**. `pre-tool-use-task.js` L34-36 상수 변경.
- **트레이드오프**: 이전 발언자 컨텍스트 손실 → 서브에이전트가 Read 도구로 보충 read → 서브에이전트 자체 시간(E) 증가로 상쇄 가능. **단순 cap 감축은 함정.** 핵심은 "필요한 것만" 선별.
- **Riki 검토 포인트**: 컨텍스트 손실로 인한 중복·충돌 발언 비율 측정 필요. 현재 측정 인프라 없음.

### Opt-4. 역할 모델 다운그레이드 (opus → sonnet 선택적)
- **Lever**: `personas/role-{r}.md` frontmatter `model: opus` → 단순 역할(edi: 컴파일 only)은 `sonnet` 또는 `haiku`로 다운. arki/ace/zero(판단 무거움)는 opus 유지.
- **예상 절감**: D 단계가 모델 ladder에 비례. opus → sonnet은 첫 토큰 latency **~30~50%** 단축 (Anthropic 일반치, 본 시스템 실측 미보유). edi가 호출당 2~3회 발동되므로 세션 평균 **15~25%** 절감.
- **난이도**: **M**. 역할별 권장 모델 매트릭스 + Master 승인 필요. 품질 회귀 측정 필요.
- **트레이드오프**: edi 컴파일 품질·D-130 versionBump 추론·anchor governance 정확도 저하 위험. mitigation: Edi sonnet pilot (1주) → 회귀 발견 시 opus 복귀 fallback.
- **Riki 검토 포인트**: edi가 단순 컴파일만 하지 않음 — versionBump 추론·gap 검출 등 판단 포함. 다운그레이드 시 미검출 gap 누적 위험.

### Opt-5. PostToolUse hook을 백그라운드화 (fire-and-forget)
- **Lever**: `post-tool-use-task.js`의 turn push / frontmatter patch / turn_log / gap 검사를 동기 → 비동기 큐에 위임. hook 본체는 즉시 exit(0).
- **예상 절감**: G 단계 100~250ms 제거. 호출당 **3~5%**.
- **난이도**: **M**. Claude Code hook protocol이 PostToolUse 완료를 다음 step의 게이트로 쓰는지 검증 필요. 동기성 깨면 turn idx race condition (이미 SPIKE_R6 instrumentation이 race 의심으로 추가됨, L293).
- **트레이드오프**: turn idx 일관성 / frontmatter patch 시점 / Nexus 재진입 시 turns[] 미반영. **race 위험 큼.** 현 D-169 nexus 모드와 충돌 가능.
- **Riki 검토 포인트**: spike-k6-pretool-task-mutation.js 존재 자체가 race 우려를 시사. 비동기화는 race 확대.

### Opt-6. 직렬 호출 → 병렬 호출 (역할 독립 시)
- **Lever**: arki·riki·fin 등 서로 무관한 분석을 한 메시지에서 병렬 dispatch (skill `dispatching-parallel-agents` 이미 존재). 현재는 Master가 의식적으로 쓸 때만.
- **예상 절감**: 직렬 3 호출 = 3×T → 병렬 = 1×T. 세션 총 시간 **40~60%** 단축 (호출 자체 시간이 아니라 wall-clock 시간).
- **난이도**: **S** (skill 존재). 단 Nexus가 자동 판정해야 — orchestration 정책 변경 필요.
- **트레이드오프**: 의존 관계 있는 역할(arki → dev) 잘못 병렬화 시 dev가 arki 결과 못 봄. mitigation: 역할 의존 그래프 명시 (CLAUDE.md §Speaking order는 직렬 default).
- **Riki 검토 포인트**: blind-parallel phase는 이미 hook이 격리 강제 — 그 외 phase의 병렬 안전성 매트릭스 없음.

---

## 3. 권고 우선순위

### 즉시 적용 (Opt-1, Opt-3 일부)
- **Opt-1 (hook 통합)**: 절감 명확 / 난이도 S / 부작용 격리 가능. 단일 최적해.
- **Opt-3 부분 적용**: cap 80KB → 40KB는 보수적 변경. per-report 절삭은 보류 (Riki 검토).

근거 1줄: 둘 다 prompt 길이/spawn cost 양 축에서 정량 절감, 회귀 reversible.

### 검증 후 적용 (Opt-2, Opt-4, Opt-6)
- **Opt-2 (persona cache)**: 절감 작지만 누적 가치. 캐시 invalidation 버그 가능성 → 1주 dry-run.
- **Opt-4 (model 다운그레이드)**: 잠재 절감 최대지만 품질 회귀 위험. edi pilot 후 결정.
- **Opt-6 (병렬 dispatch)**: 정책·orchestration 변경 동반. 역할 의존 그래프 박제 후.

근거 1줄: 절감 잠재력 크나 측정·롤백 절차 선행 필요.

### 기각 (Opt-5)
- **Opt-5 (PostToolUse 비동기)**: race 위험이 G 단계 절감(3~5%)을 초과. 본 worktree에 spike 파일이 이미 race 우려를 박제 중.

근거 1줄: 절감 vs 일관성 손상의 ROI가 음(-).

---

## 자기 감사 (1차)

### structuration
- 병목 단계 A~G가 서로 중첩(B-1 안에 disk I/O, D 안에 prompt parse)인데 % 합계 110%로 표시 — 직렬 가정 불철저. **MUST_BY_N=10**: 다음 rev에서 직렬/병렬 명시.
- Opt-1과 Opt-2가 모두 B 단계 건드림 — 동시 적용 시 절감 중복 계산 가능. **MUST_NOW**: 권고 시 "Opt-1 단독 vs Opt-1+Opt-2" 분리 표기 누락.
- 측정 인프라(SPIKE_R6_LOG) 언급만 하고 활용 절차 미제시. **SHOULD**: pre-hook에도 instrumentation 추가 → 실측 → 추정 교체.

### hardcoding
- `MAX_CHARS_PER_REPORT=6000` / `TOTAL_CAP_CHARS=80000` 상수가 hook 파일 직접 박제. dispatch_config.json으로 외부화 가능. **SHOULD**.
- 페르소나 3층 경로 hardcoded(L168, 178, 188). 한 군데서 정의 1번이 자연. **NICE**.
- model: opus 박제가 11개 persona 파일에 흩어짐. **MUST_BY_N=30**: model registry 단일 출처.

### efficiency
- `pre-tool-use-task.js` 매 호출마다 11개 persona·정책 파일 disk read — Opt-2에서 다룸.
- `buildSessionLayer` L344에서 turn마다 `findLatestReport` 호출 → 각각 dir scan. turns N개면 O(N²). **MUST_BY_N=10** turns ≥ 10 도달 시.
- Edi 호출 시 모든 이전 Edi report read — 누적 토픽에서 O(세션수). **MUST_BY_N=10**.

### extensibility
- hook chain 3개를 1개로 합치면(Opt-1) 추후 hook 추가 비용 ↑. 모듈화로 상쇄 가능. No issue at this dimension if 모듈 분리 유지.
- Opt-4 model registry는 자연스러운 확장 지점.

---

## 종료 의견

**spec 동결**: N (rev1, Riki 검토 후 rev2 예정)
**감사 라운드**: 1
**scope drift**: 없음 — 본 토픽 정의(dispatch 속도) 내 유지

```json
{"selfScores": {"str_fd": 4, "sa_rnd": 1, "spc_lck": "N", "aud_rcl": 0.6}}
```

ARKI_WRITE_DONE: reports/2026-05-10_agent-dispatch-speed/arki_rev1.md

[ROLE:arki]
# self-scores
str_fd: 4
sa_rnd: 1
spc_lck: N
aud_rcl: 0.6
