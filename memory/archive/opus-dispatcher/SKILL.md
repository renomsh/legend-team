---
name: opus-dispatcher
description: Use when Grade A or S topic is open and role sub-agents (Ace, Arki, Fin, Riki) need to be dispatched as Opus sub-agents from a Sonnet main session. Replaces the old auto-model-switch skill. Grade S uses Opus main. Grade A/B/C uses Sonnet main.
---

# Opus Dispatcher

## 개요

메인(Sonnet)이 오케스트레이터로 유지되며, 역할 발언(Ace·Arki·Fin·Riki)을 Opus 서브에이전트로 위임한다.
**모든 가변값은 `memory/shared/dispatch_config.json`에서 읽는다. 스킬 본문에 모델명·역할 목록·임계값 하드코딩 금지.**

## 언제 사용하는가

**사용:**
- Grade A/S 토픽 오픈 후 역할 순서가 시작될 때
- `dispatch_config.json → gradePolicies[grade].dispatchSubs = true`인 경우

**사용하지 말 것:**
- Grade B/C (`dispatchSubs: false`) — 메인이 직접 역할 수행
- Grade S — `gradePolicies.S.mainModel = "opus"` → 메인 자체가 Opus이므로 서브화 불필요, 메인 직접 수행
- `dispatchMode: "monolithic"` 플래그 시 — 즉시 기존 방식으로 복귀

## 핵심 패턴

### Step 0. 설정 로드
```
config = Read("memory/shared/dispatch_config.json")
policy = config.gradePolicies[currentGrade]

if not policy.dispatchSubs:
    → 메인 직접 역할 수행 (이 스킬 종료)

if currentSession.dispatchMode == "monolithic":
    → 메인 직접 역할 수행 (이 스킬 종료)
```

### Step 1. 컨텍스트 패키지 구성 (`buildContextPackage`)

각 서브 호출 전 아래 레이어를 조립. 총 예산: `config.contextLayers.totalBudgetTokens`.

```
[FIXED 레이어] (~3k 토큰)
  CLAUDE.md에서 핵심 섹션 발췌:
  - Operating Protocol (역할 정의·발언 순서·Master Intervention)
  - Schedule-on-Demand 원칙 (금지어 리스트)
  상한: config.contextLayers.fixed.maxTokens

[FRAMING 레이어] (~5k 토큰)
  Ace 프레이밍 발언 파일 인라인
  (config.contextLayers.dynamic.framingMaxTokens 초과 시 파일 경로만)

[PREVIOUS_ROLES 레이어]
  mode = config.contextLayers.dynamic.previousRolesMode
  "file-path-list": "다음 파일을 Read하여 참조하라: {경로 목록}"  ← 기본값
  "inline": 파일 내용 직접 주입 (예산 여유 시만)

[ROLE_MEMORY 레이어]
  mode = config.contextLayers.dynamic.roleMemoryMode
  "file-path-ref": "memory/roles/{role}_memory.json 을 Read하라" ← 기본값

[WRITE_CONTRACT 레이어]
  WRITE_PATH: {buildReportPath(role, session, config)}
  "발언 완료 후 위 경로에 파일을 저장하고
   응답 첫 줄에 {ROLE}_WRITE_DONE: {경로} 를 포함하라"
```

**예산 초과 시 자동 강등**: `previousRolesMode`를 `file-path-list`로 전환 → 인라인 포기.

### Step 2. 경로 생성 (`buildReportPath`)

```
template = config.filePaths.reportTemplate
// "reports/{date}_{slug}/{role}_rev{n}.md"

date = session.startedAt 앞 10자리
slug = session.topicSlug
role = 호출 역할명
n    = 해당 경로에 기존 rev 파일 수 + 1
```

### Step 3. 서브에이전트 호출

```
agentFile = config.roleSubAgentFiles[role]
// → ".claude/agents/role-arki.md" 등

Agent(
  subagent_type: agentFile에서 파생된 역할 이름,
  model: config.models.agentToolAliases[policy.subModel],
  prompt: contextPackage
)
```

Ace 종합검토는 `config.skillInjectionRoles`에 포함 → 컨텍스트 패키지에 ace-framing 스킬 본문 추가 주입.

### Step 4. 결과 수신 및 turns[] 기록

```
응답 첫 줄에서 {ROLE}_WRITE_DONE: {경로} 확인
→ 경로 유효성 검증 (파일 존재 확인)
→ turns[] 항목 기록 (role, turnIdx, phase, recallReason)
→ 실패 시: 메인이 직접 파일화 후 turns[] 기록
```

### Step 5. 재호출 관리

```
recallCount[role] += 1
if recallCount[role] > config.guardrails.maxSubRecallsPerSession:
    → 경고 로그 출력
    → Ace에게 판단 요청 ("재호출 상한 초과 — 계속할까요?")
```

재호출 시 컨텍스트 패키지에 추가:
- `recallReason` (post-master / post-intervention / phase-transition)
- 이전 해당 역할 발언 파일 경로

## Grade × 모델 정책 (dispatch_config.json 기준)

> **이 테이블은 참조용 스냅샷. 실제 적용값은 항상 dispatch_config.json을 Read하여 확인.**

| Grade | 메인 | 서브 발언 | dispatchSubs |
|---|---|---|---|
| S | opus | opus | false (메인=Opus이므로 직접 수행) |
| A | sonnet | opus | **true** |
| B | sonnet | sonnet | false |
| C | sonnet | — | false |

## 롤백 플래그

`current_session.json`에 `dispatchMode: "monolithic"` 추가 시 이 스킬 즉시 비활성화.
메인이 Opus로 전환되지 않은 경우 → `/model claude-opus-4-7` 안내 후 진행.

## 가드레일 (dispatch_config.json → guardrails 참조)

- 서브 재호출 상한: `guardrails.maxSubRecallsPerSession`
- 비용 절감률 < `guardrails.rollbackTriggers.costSavingsBelowPct`% → monolithic 전환 제안
- Master 신호 미감지 `guardrails.rollbackTriggers.masterSignalMissCount`회 / `masterSignalWindowSessions`세션 → Ace 종합검토 메인 직접 수행 전환

## 흔한 실수

| 실수 | 수정 |
|---|---|
| 서브 호출 전 컨텍스트 빌더 생략 | Step 1 반드시 선행. 빈 프롬프트로 서브 호출 금지. |
| Ace 종합검토에 스킬 미주입 | `skillInjectionRoles` 확인 후 ace-framing 본문 추가. |
| Grade S에 Sonnet 메인 적용 | `gradePolicies.S.mainModel = "opus"` — `/model claude-opus-4-7` 안내. |
| 모델 이름 스킬 본문에 직접 작성 | dispatch_config.json Read 후 alias 참조만. |
| write 계약 확인 없이 turns[] 기록 | `{ROLE}_WRITE_DONE` 확인 후 기록. 미확인 시 파일 존재 검사. |
| 재호출 횟수 추적 누락 | `recallCount[role]` 매 호출 시 증가. |
