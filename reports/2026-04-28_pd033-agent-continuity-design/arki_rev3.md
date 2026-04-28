---
role: arki
session: session_123
topic: topic_121
topicSlug: pd033-agent-continuity-design
turnId: 3
invocationMode: subagent
grade: A
executionPlanMode: plan
date: 2026-04-28
rev: 3
recallReason: post-master
splitReason: "Master 한단계 더 압박 — self-audit round 2"
---

# Arki — 자기감사 라운드 2 (rev2 권고 까기)

Arki입니다. Master "한단계 더 들여다보면" 압박은 페르소나 §self-score `aud_rcl` 정의 그대로 — 2~3차 감사 수용 의무. rev2 단일 권고를 옹호하지 않고 6개 축으로 까서, **rev2 그대로가 아니라 미니멀 안으로 권고 수정**합니다.

본 호출 자체가 결정적 증거 1건을 추가로 제공했습니다 — 메인이 SendMessage 툴을 deferred 목록에서도 못 찾음(`No matching deferred tools found`) = SendMessage가 환경에 부재. 즉 A1-α는 fiction. 그리고 본 호출이 rev1·rev2를 명시 Read해야 작동함 = K2 자기증명.

---

## Audit Axis 1: dispatch_template.md 단일 출처 가정 — **결함 발견**

**rev2 가정**: `memory/shared/dispatch_template.md` 신설 → 메인이 매 호출 prompt 작성 시 참조.

**까기**:
1. 본 호출이 그 파일 부재 상태에서도 작동 — 메인이 직접 prompt에 박제(호출 메타데이터·WRITE_PATH·frontmatter·이전 발언 경로·금지어·self-score 계약 모두). **즉 dispatch_template.md 신설은 "작동을 가능하게 하는 인프라"가 아니라 "현재 인라인된 prompt 골격을 외부 파일로 이전"일 뿐**.
2. **단일 출처가 정말 단일이 되려면 메인이 매 호출 그 파일을 Read해서 prompt에 inject해야 함**. 그 매 호출 Read를 강제하는 인프라는 무엇? rev2는 "메인 prompt 첫 줄에 dispatch_template.md 준수 필수"라 적었으나 **그 첫 줄 자체를 누가 매번 박는가**가 본질 문제(K4 §1.2). → 회귀 발생.
3. 동기화 모델 모호: dispatch_template.md 변경 시 (a) 메인 인스턴스 prompt에 그 변경이 반영되려면 메인이 매 호출 Read, (b) 정적 복붙이면 변경이 무력. rev2는 (a)/(b) 미명시.

**더 나은 대안**:
- **Option α (강력)**: PreToolUse(Task) hook 신규 — Agent tool 호출 직전 hook가 stdin으로 받은 `tool_input.prompt`에 표준 dispatch 블록 prepend → exec. **이게 강제력을 코드 레벨로 박제**. 단일 출처는 hook 본문 또는 hook이 읽는 1개 파일.
- **Option β (미니멀)**: dispatch_template.md를 짓지 않음. CLAUDE.md "## Subagent Dispatch Contract" 섹션 신설 — Operating Protocol 내. 메인은 어차피 CLAUDE.md를 매 세션 시작 시 인지. 신규 파일 0.

**결함 명시**: rev2의 dispatch_template.md 단독안은 *강제력 인프라 누락*. PreToolUse hook 또는 CLAUDE.md 섹션 둘 중 하나가 동반되지 않으면 형식적 박제.

---

## Audit Axis 2: Tier 3 temp 실효성 — **결함 발견**

**rev2 가정**: `memory/sessions/temp/{sessionId}/{role}.jsonl` 신설 + inject N=3 cap + 토픽 종료 시 raw 폐기 + 7일 archive + finalize 후보 추출.

**까기**:
1. **inject N=3은 본 호출 케이스에 불충분 가능**. 본 호출은 직전 turn 2개(arki rev1·rev2)만 명시 read. 3차 감사라 2개로 충분했으나, 4~5차 감사가 필요한 토픽이면 N=3이 부족. **고정 N cap 자체가 자의적** — *토픽 종료까지 같은 role 모든 turn을 inject*가 단순.
2. **저장 대상 모호**: rev2가 "summary 200자 이내 + findings[] + keyDecisions[] + nextHandoff"라 적었으나 **본 호출이 필요로 한 건 직전 발언의 *전문 read*** (옵션 1·2 권고 비교, B1~B4 단일 권고 검증). 200자 summary로는 자기감사 불가.
3. **토픽 종료 시 raw 폐기 + 7일 archive**: archive와 Tier 2 캐릭터 박제와 grain 중복. **이미 `topics/{id}/turn_log.jsonl`이 토픽 archive 역할** (실측: topic_063·064에 backfill 데이터 존재 — 단 활용은 미약). 둘 다 jsonl인데 grain만 다른 게 정당화될까? 검증 부족.
4. **finalize 자동 후보 추출 algo 미정의**: rev2가 "(a) F-NNN 신규, (b) D-NNN 직접 기여, (c) Master 피드백 인용·수용"이라 적었으나 — 그 매칭 algo는 키워드? regex? LLM call? 실측 가능성 미확인.

**더 나은 대안**:
- **Option α**: Tier 3 신설 안 함. 메인 dispatch prompt에 `reports/{date}_{slug}/{role}_rev{n}.md` 직전 N개 경로 자동 inject. **본 호출이 정확히 그 패턴** — 이미 작동. 신규 인프라 0.
- **Option β**: `topics/{id}/session_contributions/{sessionId}.md` (PD-020c)와 `topics/{id}/turn_log.jsonl` 재활용 — 둘 다 실존 인프라(topic_113 4개 sample 확인). turn_log.jsonl은 turn 단위 grain, session_contributions는 session 단위 자연어 요약 — Tier 3과 동일 역할.

**결함 명시**: Tier 3 신설은 **기존 인프라(reports/ + session_contributions/ + turn_log.jsonl) 무시한 채 같은 grain의 4번째 자산을 신설**하는 것. 짓지 않음 옵션 검토 부실.

---

## Audit Axis 3: 페르소나 60% 슬림화 ROI — **결함 발견 (slight)**

**rev2 가정**: 정책 본문(발언 구조·Write 계약·Self-Score 계약·컨텍스트 활용) 전부 dispatch_template.md로 이전 → 페르소나 ~30줄 (현 85줄에서 60% 축소).

**까기 (실측)**:
- 현재 페르소나 8개 합 739줄 (실측 — arki 85, ace 105, edi 102, dev 101, fin 85, riki 86, nova 85, vera 90)
- arki 정책 분량: 발언 구조 20줄 + 컨텍스트 활용 5줄 + Write 계약 13줄 + Self-Score 24줄 + 원칙 7줄 = 69줄 정책 / 16줄 정체성
- 슬림화하면 정체성 16줄 + 페르소나 메타 1~2줄 = ~20줄. 60%가 아니라 **76% 축소 가능**

**그러나 ROI 의문**:
1. **메인 prompt 부피 trade-off**: 정책이 페르소나에서 빠지면 dispatch_template.md(또는 CLAUDE.md 섹션)에 들어감. 메인이 매 호출 그것을 read+inject = 메인 prompt에 같은 분량이 박힘. **순 부피 절감 0**. 페르소나는 한 번 read, dispatch는 매번 read — **오히려 중복 read 증가**.
2. **정체성 색채 손실 위험**: rev2 R1 mitigation으로 "정체성·말투·금지어는 잔존"이라 적었으나, 실제로는 "발언 구조"(Section 분해 패턴)도 역할 색채의 일부. arki의 "구조 분석 단계 1~4" 같은 흐름이 페르소나에서 빠지면 톤이 평탄화.
3. **자기소개 제약 + 금지어 + 페르소나 모델만 잔존하는 30줄 페르소나**가 *서브 입장에서 의미 있는 self-context*를 제공할까? 발언 구조 없이 자기 정체성만으론 페르소나 자동 inject가 강제되어도 **무엇을 어떻게 할지 모름**.

**더 나은 대안**:
- **Option α**: 페르소나 슬림화 안 함. dispatch_template은 *호출 메타데이터·turnIdx·write path·이전 발언 inject*만 담당. 정책 박제 분리 효과 = 0이지만, **실호출 비용 절감 = 0이고 색채 보존 = +**.
- **Option β**: 페르소나에 frontmatter `import: dispatch-contract.md`를 두고 import 시점에 메인이 합쳐 read. *위치 이동* 효과는 있으나 신규 인프라(import resolver) 필요 — 비용 음수.

**결함 명시**: 슬림화 자체의 ROI는 **위치 이동에 가깝고 실질 부피 절감 0**. 정체성 색채 손실 위험만 부담. 페르소나 그대로 두는 게 단순.

---

## Audit Axis 4: 메인 dispatch가 Tier 3 inject 가능한가 — **결함 발견 (큰 것)**

**rev2 가정**: 메인이 매 호출에 Tier 3 read → prompt inject.

**까기 (메타 레벨)**:
1. **메인 자체도 컨텍스트 압축·세션 분기 가능**. 본 환경 system 메시지에 명시: "context limits에 따라 prior messages 자동 압축". 메인이 1세션 30 turn 진행 후 압축되면 — 이전 turn에서 박은 dispatch_template.md 인지를 잃을 수 있음. 메인의 메모리도 신뢰 불가.
2. **파일 시스템 read는 OK** — 매번 파일을 read하면 메인 컨텍스트에 무관하게 동작. 그러나 *그 read 명령을 누가 박는가*가 문제. 메인 prompt에 박혀있으면 메인 압축 시 손실 — **재귀적 K4 문제**.
3. 즉 rev2의 "메인이 단일 출처로 dispatch_template를 읽음" 모델은 **메인이 그 파일을 매번 읽으라는 명령을 어떻게 받는가**의 답을 안 함. → 원점 회귀.

**더 나은 대안 (강력)**:
- **PreToolUse(Task) hook**: Agent tool 호출 직전 hook가 발동, `tool_input.prompt`를 가로채서 표준 dispatch 블록 prepend, exec. **메인 컨텍스트와 무관하게 코드 레벨 강제**.
  - 입력: Claude Code hook protocol — stdin에 `{tool_name, tool_input, ...}` JSON
  - 처리: tool_name === "Task"이고 subagent_type이 `role-{role}`이면, prompt 첫 부분에 dispatch 표준 블록 prepend
  - 효과: 메인이 prompt에 dispatch 표준 박제 망각해도 hook가 보강. 페르소나/캐릭터 read 명령도 hook에서 박을 수 있음
- 단, PreToolUse hook이 prompt 수정을 허용하는지 Claude Code spec 확인 필요. 미허용이면 해당 옵션 무력 → CLAUDE.md 섹션 + 메인 prompt 의무 명시로 fallback.

**결함 명시**: rev2는 **메인의 인지 신뢰성을 암묵 가정**. PreToolUse hook 또는 그 동등 강제 인프라 없이는 dispatch_template.md는 형식적 박제. **이게 본 자기감사의 가장 큰 발견**.

---

## Audit Axis 5: PD-043 사칭 hook 통합 — **결함 발견 (구체화 부족)**

**rev2 가정**: PD-043을 "Tier와 직교"로 분류. Phase 6에 hook 1개 추가, false positive 시 warning만.

**까기 (실측 검증)**:
1. **PostToolUse(Task) hook은 이미 존재** — `.claude/hooks/post-tool-use-task.js` (실측 확인). settings.json에 `PostToolUse → matcher: "Task"`로 등록됨. **이 hook가 turn 박제를 자동 처리** — 즉 turns[].role은 항상 진짜 Task tool_use에 매핑. **PD-043가 풀려는 "사칭" 시나리오 자체가 코드 레벨에서 차단되고 있음**.
2. 그렇다면 PD-043 추가 hook가 풀어야 할 진짜 시나리오는? — **Main inline 발언에서 "Arki:" "Fin:" 헤더로 가짜 역할 발언 작성하는 경우** (F-005 Ace relay 22세션 잠복 fiction). 이것은 turns[]에 없으므로 PostToolUse hook의 책임 범위 밖. 그러나 **turns[]에 없으면 finalize hook 검증으로 못 잡음** — 검출 대상은 *reports/* 디렉토리 마크다운에 누가 박았는가.
3. rev2는 "turns[].role ↔ 직전 Task tool_use 매칭"이라 적었으나 **이미 그게 PostToolUse hook가 하는 일**. 신설 hook가 없어도 OK. PD-043은 신설이 아니라 **finalize에 검증 함수 1개 추가**로 충분.

**더 나은 대안**:
- session-end-finalize.js에 신규 함수 `validateInlineRoleHeaders(reports)`: reports/{date}_{slug}/*.md 파일들 중 같은 turnIdx에 turns[] 매칭 entry가 있는지 cross-check. mismatch 시 gap 박제(차단 X). **신규 hook 0개, 기존 hook 함수 +1개**.

**결함 명시**: rev2는 PD-043을 신설 hook으로 분류. 실제로는 **기존 PostToolUse(Task) hook + finalize 함수 +1개**로 충분 — Phase 6 자체가 신설이 아니라 finalize 확장.

---

## Audit Axis 6 (보너스): 짓지 않음 옵션 재검토 — **미니멀 안 발굴**

rev2 신설 4건: Tier 1 슬림화 + Tier 2 이동 + Tier 3 신설 + dispatch_template 신설.

**미니멀 안 (Hickey 정합)**:
1. **Tier 1 페르소나**: 그대로 유지 (Axis 3 결과 — 슬림화 ROI 음수)
2. **Tier 2 캐릭터**: 그대로 유지 (`memory/roles/{role}_memory.json` 위치). git mv 안 함. compile-metrics-registry.ts path 수정 0
3. **Tier 3 temp**: 신설 안 함. 메인 dispatch prompt에 `reports/{date}_{slug}/{role}_rev{n}.md` 직전 N개 경로 inject. 본 호출이 그 패턴 정확히 시연
4. **dispatch_template.md**: 신설 안 함. 다음 둘 중 하나 채택:
   - (a) **CLAUDE.md "## Subagent Dispatch Contract" 섹션 신설** — Operating Protocol 내. 메인은 어차피 CLAUDE.md 인지
   - (b) **PreToolUse(Task) hook** 신규 — `.claude/hooks/pre-tool-use-task.js`로 dispatch 표준 블록 prepend. Claude Code hook spec이 PreToolUse prompt mutation을 허용하면 강력. 미허용이면 (a)로 fallback

**미니멀 안이 PD-033/043/044 모두 푸는가?**:
- PD-033 finding 승계: ✅ (메인 prompt에 reports/ 직전 N개 경로 inject — 본 호출 자체 시연)
- PD-043 사칭 검출: ✅ (PostToolUse hook 이미 존재 + finalize에 함수 1개 추가)
- PD-044 정책 단일 출처 박제: ⚠️ — CLAUDE.md 섹션 또는 PreToolUse hook 둘 중 하나 채택 필요. 페르소나 박제는 **그대로 유지** (자동 inject 인프라 부재라도 메인 prompt에서 매번 "페르소나 Read" 명시하면 작동 — 본 호출이 그 패턴)

**미니멀 안이 못 푸는 부분**: 토픽 종료 후 raw archive (Tier 3 7일 정책에 해당)는 **`topics/{id}/turn_log.jsonl`을 fully 활용**하면 됨. 현재 topic_063·064에만 backfill — 본 토픽 implement에서 활성화. 신규 인프라 0.

---

## 미니멀 안 vs rev2 안 비교표

| # | 항목 | rev2 안 | 미니멀 안 | 차이 |
|---|---|---|---|---|
| 1 | 페르소나 (Tier 1) | 60% 슬림화 | 그대로 | rev2: 색채 손실 위험 / 미니멀: 0 변경 |
| 2 | 역할 메모리 (Tier 2) | `characters/`로 이동 | 그대로 | rev2: git mv + compile-metrics path 수정 / 미니멀: 0 |
| 3 | turn 단기 기억 (Tier 3) | `memory/sessions/temp/` 신설 jsonl | reports/ + session_contributions/ + turn_log.jsonl 재활용 | rev2: 신규 디렉토리 + jsonl 스키마 + 7일 archive 정책 / 미니멀: 0 신설 |
| 4 | dispatch 표준 | `memory/shared/dispatch_template.md` 신설 | CLAUDE.md 섹션 또는 PreToolUse hook | rev2: 신규 파일 + 강제력 모호 / 미니멀: 기존 위치 + 강제력 코드 |
| 5 | PD-043 사칭 hook | 신설 hook | 기존 PostToolUse(Task) + finalize 함수 +1 | rev2: hook 1개 신설 / 미니멀: 0 신설 |
| 6 | PD-044 정책 박제 | dispatch_template.md로 이전 | CLAUDE.md 섹션 또는 PreToolUse hook | rev2: 페르소나 슬림화 동반 / 미니멀: 페르소나 + CLAUDE.md 양립 |
| 7 | finding 승계 메커니즘 | jsonl entry inject N=3 cap | reports/{rev}.md 직전 N개 경로 inject (가변) | rev2: summary 200자 cap → 자기감사 불가 / 미니멀: 전문 read 가능 |
| 8 | 신설 자산 | 4건 (Tier3 디렉토리 + jsonl 스키마 + dispatch_template + 사칭 hook) | 0~1건 (PreToolUse hook만, 또는 CLAUDE.md 섹션만) | 4 → 0~1 |
| 9 | 마이그레이션 | Phase 1~8 (8단계) | Phase 1~3 (3단계) | rev2: 8단계 / 미니멀: 3단계 |
| 10 | K4 §1.2 회귀 위험 | 잠복 (메인이 매 호출 dispatch_template.md read 강제 인프라 미정의) | 해소 (PreToolUse hook = 코드 강제, 또는 CLAUDE.md = 세션 시작 자동 인지) | 결정적 차이 |

---

## 재권고 (단일·강한 의견)

**미니멀 안으로 권고 수정**. rev2 안 기각.

근거 5가지:
1. **본 호출 자체가 미니멀 안 작동 증거** — reports/{rev}.md 직전 N개 경로 inject + 페르소나 Read 명시 inject + 메타데이터 inline 박제로 정상 작동. rev2가 풀려는 문제가 이미 풀려 있음.
2. **rev2의 dispatch_template.md는 강제력 인프라 누락** (Axis 1·4) — 메인이 매번 그 파일 read하라는 명령이 어디 박히는지 미정의. K4 §1.2 회귀.
3. **Tier 3 신설은 기존 3개 인프라(reports/·session_contributions/·turn_log.jsonl) 무시** (Axis 2). topic_113 session_contributions 4건 실증 + topic_063·064 turn_log.jsonl backfill 실존.
4. **페르소나 슬림화는 위치 이동에 가깝고 ROI 0** (Axis 3). 정체성 색채 손실 위험만 부담.
5. **PD-043은 기존 PostToolUse(Task) hook + finalize 함수 +1개로 충분** (Axis 5) — 신설 hook 불필요.

**미니멀 안 정의** (단일):

> PD-033/043/044 묶음 결정:
> 1. **finding 승계** = 메인 dispatch prompt가 `reports/{date}_{slug}/{role}_rev{n}.md` 직전 N개 경로를 명시 inject (본 호출 패턴 표준화). N은 토픽별 가변 — 메인이 같은 role 모든 turn 또는 직전 phase 경계까지.
> 2. **dispatch 표준 박제** = **CLAUDE.md "## Subagent Dispatch Contract" 섹션 신설** (default). 추가 강제 필요 시 PreToolUse(Task) hook 신규 — 단 Claude Code spec이 prompt mutation 허용 시. 미허용 시 CLAUDE.md 단독.
> 3. **PD-043 사칭 검출** = `session-end-finalize.js`에 함수 `validateInlineRoleHeaders(reports)` 추가. reports/ 마크다운의 role 헤더가 turns[]와 매칭되는지 cross-check. mismatch 시 gap 박제, 차단 X.
> 4. **PD-044 정책 단일 출처** = CLAUDE.md 섹션 (above #2) 또는 PreToolUse hook 본문. 페르소나는 그대로 유지.
> 5. **Tier 1/2 변경 0**. Tier 3 신설 0.
> 6. **활성화 대상 기존 인프라**: `topics/{id}/turn_log.jsonl` (현재 backfill만 있음 — 본 토픽에서 PostToolUse hook chain으로 자동 append 활성화). `topics/{id}/session_contributions/{sessionId}.md` (이미 작동, 변경 없음).

**Phase 분해** (3단계):

```
Phase 1 — Spec 동결 (CLAUDE.md 섹션 초안 + PreToolUse spec 확인)
  └→ Phase 2 — 박제 (CLAUDE.md 섹션 추가 + finalize 함수 +1 + turn_log.jsonl 자동 append 활성화)
        └→ Phase 3 — resolveCondition dry-run (Arki 4번째 호출이 본 발언 finding 인지 + reports/ inject 통과)
```

**의존 그래프**: Phase 1 → Phase 2 → Phase 3. PreToolUse hook 채택 여부는 Phase 1 G1에서 spec 확인 결과로 분기.

**검증 게이트**:
- G1: PreToolUse(Task) hook이 prompt mutation 허용하는지 spec 확인 (Claude Code 문서 또는 실측). 허용 시 채택, 미허용 시 CLAUDE.md 단독.
- G2: CLAUDE.md "## Subagent Dispatch Contract" 섹션 추가 후 다음 서브 호출에서 메인이 그 섹션 인지하는지 (gap 박제 0).
- G3: Arki 4번째 호출이 본 turn 3 finding(미니멀 안) 명시 인용.

**롤백**: Phase 2 G2 실패 시 PreToolUse hook 강제 채택. Phase 3 G3 실패 시 reports/ 경로 inject 표준화 보강 (메인 prompt 템플릿 추가 박제).

**중단 조건**: PreToolUse hook도 mutation 미허용이고 CLAUDE.md 섹션도 메인이 무시하는 경우 — 본 토픽 종결 + 별도 PD로 분리.

---

## Section: 함정 사전 고지 + Mitigation/Fallback (다축 검증 의무)

| # | 리스크 | 사전 신호 | Mitigation | Fallback |
|---|---|---|---|---|
| R1 | CLAUDE.md 섹션 추가 후 메인이 무시 (CLAUDE.md 자체가 너무 길어 일부 무시) | 다음 서브 호출 prompt에 dispatch 표준 박제 누락 | PreToolUse hook 강제 채택 | hook도 spec 미허용 시 별도 PD |
| R2 | reports/ 경로 inject N=직전 모든 turn으로 폭증 (토픽 30 turn 시 30개 경로) | 메인 prompt 토큰 inflation | 토픽 종료 시 reports/ → turn_log.jsonl summary로 압축 | inject scope를 "직전 phase 경계"로 cap |
| R3 | turn_log.jsonl 자동 append이 race condition (병렬 dispatch) | 같은 turnIdx 2회 entry | PostToolUse(Task) hook가 file lock 또는 nanoTimestamp suffix | finalize에서 dedupe |
| R4 | 미니멀 안의 PreToolUse hook이 spec 미허용 → CLAUDE.md 단독 = 강제력 약함 | 메인 망각 빈도 통계 | finalize hook가 dispatch 표준 누락 검출 시 gap 박제 + 다음 세션 시작 시 경보 | 누락 빈도 임계 시 PreToolUse hook 재시도 또는 별도 PD |
| R5 | PD-043 사칭 검출 함수가 false positive (메인 inline에서 정당한 역할 인용) | 지난 세션 reports에 fiction 0인데 mismatch 박제 | "## ROLE_NAME — ..." 헤더만 검사, 본문 인용("Arki가 말했다") 제외 | 검출 임계 raise (3회 연속 mismatch만 gap) |
| R6 | turn_log.jsonl 자동 append 활성화 후 디스크 누적 — session 100 토픽 시 | 토픽별 jsonl size 증가 | 토픽 종료 시 jsonl을 최종 1줄 summary로 압축 (결정·finding만) | 7일 후 archive |
| R7 | Master가 미니멀 안에 동의 안 하고 rev2 안 또는 다른 절충 | Master 명시 거부 | rev2 안 vs 미니멀 안 명시 대비 표 (위) 제공해 결정 보좌 | rev2 안으로 진행 시 K4 §1.2 회귀 미리 경보 박제 |

---

## 자기감사 라운드 2 자가 점검

1. **다축 검증**: Axis 1~6 모두 코드(post-tool-use-task.js 실측), hook(settings.json 실측), 기존 인프라(topic_113 session_contributions 실측·topic_063 turn_log.jsonl 실측), 페르소나(8개 줄수 실측), 본 호출 메타(SendMessage 부재 실측·메인 inject 패턴) 5축 점검 ✅
2. **금지어 v0**: `D+N일`/`N주차`/`MM/DD`/`담당자:`/`N시간`/`공수` 본 발언 0건. Phase 명만 사용 ✅
3. **mitigation+fallback 병기**: R1~R7 7건 모두 병기 ✅
4. **짓지 않음 옵션**: Axis 6 미니멀 안 = 짓지 않음의 본격 적용. rev2가 4건 신설 → 미니멀이 0~1건으로 축소 ✅
5. **Dev 양방향 협의**: PreToolUse hook spec 확인은 Phase 1 G1 게이트 — Dev 합의 필수 ✅
6. **단일 강한 권고** (`feedback_no_middle_ground`): 미니멀 안 단독, rev2 안 명시 기각 ✅
7. **본인 rev2 옹호 거부**: rev2를 Axis 1·2·3·4·5에서 모두 결함 명시 — `feedback_arki_self_audit_on_pressure` 정합 ✅

**rev2 → rev3 권고 변경 명시**: 본 자기감사가 *rev2를 까는* 라운드. Master 압박이 옳았음 — rev2가 *형식적 신설 4건*으로 비대화되어 있었고, Axis 4가 결정적(K4 §1.2 회귀 위험).

---

## Master 결정 필요 (1건만)

**미니멀 안 단독 채택 + Phase 1 G1으로 진입할지**.

- 미니멀 안 = (1) finding 승계 = reports/ 직전 N개 inject 표준화, (2) dispatch 박제 = CLAUDE.md 섹션 (default) 또는 PreToolUse hook (G1 결과 분기), (3) PD-043 = finalize 함수 +1, (4) 페르소나 그대로, (5) Tier 3 신설 0
- rev2 안 = 4건 신설, K4 §1.2 회귀 위험

무응답 = 미니멀 안 진행 (저마찰 무응답 승인).

---

## 메인 보고용 요약 (5줄)

- rev2 단일 권고를 6개 축으로 자기감사 — 결정적 결함 4건 발견. 가장 큰 건 Axis 4 (메인이 dispatch_template.md를 매 호출 read하게 강제하는 인프라 누락 = K4 §1.2 회귀).
- 본 호출이 미니믬 안 작동 증거 — SendMessage 부재 실측, 메인이 reports/{rev}.md 직전 경로 inject로 정상 작동, PostToolUse(Task) hook 이미 turn 박제 자동화, topic_113 session_contributions·topic_063 turn_log.jsonl 기존 인프라 실존.
- **권고 수정**: rev2 안 기각 → 미니멀 안 채택. 신설 자산 4건 → 0~1건. Phase 8단계 → 3단계.
- 미니멀 안: (1) reports/ 직전 N개 경로 inject 표준화 (2) CLAUDE.md "## Subagent Dispatch Contract" 섹션 신설 — 또는 PreToolUse(Task) hook (Phase 1 G1 spec 확인 분기) (3) finalize에 사칭 검출 함수 +1 (4) 페르소나 그대로 (5) Tier 3 신설 0.
- Master 단일 결정: 미니멀 안 채택 + Phase 1 G1 진입. 무응답=진행.

---

```yaml
# self-scores
aud_rcl: Y
str_fd: 5
spc_lck: N
sa_rnd: 2
```

**다음 발언자 추천**: Ace (rev2 vs rev3 권고 변경 검토 + Master 게이트 — 미니멀 안 spec 동결 여부 판정. Fin/Riki는 미니멀 안 spec 동결 후 검토)
