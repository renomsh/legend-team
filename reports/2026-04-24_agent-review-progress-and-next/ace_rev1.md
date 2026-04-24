---
role: ace
session: session_092
topic: topic_097
rev: 1
phase: framing
turnId: 0
invocationMode: subagent
---

# Ace 프레이밍 — topic_097 "A Agent review"

## Step 0. 토픽 생명주기 판정

- **topicType**: `framing`
- **parentTopicId 후보**: topic_096 (session_091의 D-067~D-070 박제). 이번 토픽은 그 결정의 정착도 점검 + 후속 액션 식별이므로 implementation이 아니라 framing으로 잡습니다. topic_096과 형제 관계에 가깝습니다.
- **Grade 의도 확인**: Master가 "에이스 a 기준"으로 명시. Grade A 채택. opus-dispatcher 통한 Opus 서브 위임이 정합.

## Step 1. 토픽 정의

**핵심 질문 1문장**: session_091이 박제한 4개 결정(D-067~D-070)·누적 12 PD·suspended 토픽 3건이라는 세 갈래 부채 중, 다음 한 세션에서 가장 먼저 해소해야 할 단일 병목은 무엇인가.

**배경**:
- session_091은 "역할 구분 baseline 양자 충족"을 D-067로 박제했지만 자기 세션부터 dual-satisfaction-violation 9건을 gaps에 누적. 결정과 실측이 따로 놀고 있습니다.
- Main이 이번 세션 발견한 신호: `.claude/agents/role-{ace,arki,fin,riki}.md` 4개 정의가 **harness 레벨에서 등록되지 않음**. Agent 툴 dispatcher가 인식하는 subagent_type 목록에 없습니다. 즉 D-058 opus-dispatcher 스킬이 가정한 "역할 서브에이전트" 인프라의 Structural 층이 사실상 비어있습니다.
- 이는 session_091 dual-sat 9건의 직접 원인 후보입니다. enforcement 3층(Schema+Hook+Structural) 중 Structural이 비어있으니 Schema·Hook이 검증할 대상 자체가 없는 상태.
- 동시에 PD 12건 중 11건이 stale, suspended 토픽 3건이 묵혀 있어 시스템 부채는 별개로 누적 중.

## Step 2. 결정 축

### 축 1. Review 범위 — (a) 결과물 / (b) 시스템 부채 / (c) 에이전트 인프라 / (d) 합집합 [최우선]

**옵션**:
- (a) D-067~D-070 정착도 점검 (dual-sat 9건 원인 규명)
- (b) PD 12건 + suspended 토픽 3건 정리
- (c) role-*.md 4개 정의의 등록·품질·갱신 (Main 발견 직격)
- (d) 합집합

**Ace 강한 의견**: **(c) 단독, 그 다음 (a) 자연 흡수**.

근거:
1. Main 발견이 사실이면 (c)는 (a)의 root cause입니다. (a)를 먼저 파면 증상만 추적하다 끝납니다. Structural 층이 비어있는 한 어떤 enforcement도 자기기만입니다.
2. (b)는 시급성 낮음. PD 11건이 stale인 상태가 이미 1주 이상 유지된 정상 상태이고, 이번 세션에서 풀어야 할 외부 압력 없음. 측정 위한 측정 회피 원칙(MEMORY) 적용.
3. (d) 합집합은 어중간한 절충. 슬롯 분산 → Master 좌절 패턴(F-revert) 위험.

### 축 2. (c) 채택 시 첫 검증 지점

**옵션**:
- (c-1) Agent 툴이 실제로 어떤 subagent_type을 인식하는지 harness 호출 1회로 직접 측정
- (c-2) `.claude/agents/role-*.md` frontmatter·등록 메커니즘 문서 조사 먼저
- (c-3) session_091 7회 Agent 호출 로그를 reverse-engineering — 실제로 어떤 모델·어떤 subagent로 떨어졌는지

**Ace 강한 의견**: **(c-1) → (c-3) → (c-2)**.

근거: 가설은 "harness 미등록"입니다. 가장 빠른 falsification은 실호출 1회. 문서 조사는 측정 후 재현·수정 단계에서. (c-3)는 dual-sat 9건이 어떻게 통과됐는지(통과한 게 맞는지) 검증.

### 축 3. session_091 결정의 운명

**옵션**:
- (3-1) D-067~D-070 유지, 추가 보완만
- (3-2) D-067 양자 충족 baseline의 cond_reportExists·cond_turnIdMatch 정의 재검토
- (3-3) D-067 자체 무효화·재정의

**Ace 강한 의견**: **(3-2) 유보, (c-1) 결과 후 결정**.

근거: 측정 전 결정 변경은 관성. dual-sat 9건의 실제 원인이 (i) Structural 공백인지 (ii) hook의 timing 문제인지 (iii) baseline 정의 자체의 모호성인지 분기됩니다. (c-1) 측정이 분기를 결정합니다.

### 축 4. PD·suspended 토픽 처리

**옵션**:
- (4-1) 이번 세션 In — 최소한 stale 11건 정리 라운드 추가
- (4-2) 이번 세션 Out — 별도 토픽으로 분리
- (4-3) 자동 종결 dry-run만 돌려 제안 받기

**Ace 강한 의견**: **(4-2) Out**. 이번 토픽은 (c) 단일 초점. PD 정리는 별도 A 토픽 또는 B 토픽으로. 단 (4-3) dry-run은 세션 종료 hook이 자동 수행하므로 부수 효과로 얻습니다.

## Step 3. 범위 In / Out

**In**:
- Agent 툴 subagent 등록 실태 측정 (1회 호출로 falsification)
- session_091 dual-sat 9건의 root cause 분류 (Structural / Hook / Schema)
- D-067 baseline 정의 보완 필요 여부 판정
- 다음 한 세션의 액션 1개 식별

**Out**:
- PD 11건 정리 (별도 토픽)
- suspended 토픽 3건 (topic_082/044/012) 재개 결정
- L5 페르소나 분리 (PD-032), Vera visual_regression (PD-034)
- 토픽 097 자체에서 Structural 공백을 코드 수준으로 메우는 implementation — 그건 후속 implementation 토픽의 영역

## Step 4. 핵심 가정

- 🔴 **가정 1**: Main이 보고한 "Agent 툴 dispatcher가 role-ace 등을 인식하지 못한다"가 실제 사실이다. 틀리면 토픽 전체 무효화 → (a) 또는 (b)로 회귀.
- 🔴 **가정 2**: session_091의 7회 Agent 호출이 박제된 reports/turnId·invocationMode가 실제 서브에이전트 격리 호출의 증거로 채택 가능하다. 만약 모두 general-purpose fallback 위 prompt 주입이었다면 D-067 baseline은 정의부터 재검토.
- **가정 3**: dual-sat 9건은 회피 가능한 결함이며 "운영상 허용 가능한 누락"이 아니다.
- **가정 4**: opus-dispatcher 스킬 자체는 살아있고, 등록 메커니즘만 누락된 상태다 (스킬 폐기가 아니라 인프라 보완).

## Step 5. executionPlanMode

`executionPlanMode: conditional`

근거: (c-1) 측정 결과에 따라 후속 액션이 분기합니다.
- 가정 1 참 → Arki 재호출 (Structural 보완 실행계획)
- 가정 1 거짓 → Riki·Ace 재프레이밍 (가설 수정)

선결정 후 실행계획 단계에서 Arki 재호출.

## Step 6. 역할 호출 설계

**다음 호출**: **Arki 단독**.

**질문 범위**:
1. `.claude/agents/role-{ace,arki,fin,riki}.md` 4개 파일의 frontmatter·등록 요구사항을 Read.
2. Claude Code harness의 subagent 등록 규약을 문서·예시(claude-code-guide, Explore, Plan 등 실등록 에이전트)와 비교.
3. session_091 current_session.json + reports/2026-04-23_topic096-ace-arki-protocol/ 의 실제 호출 흔적을 검사. 박제된 invocationMode·turnId가 실호출 증거로 성립하는지 구조 검증.
4. 산출물: (i) 등록 누락이 사실인지 yes/no 단정, (ii) 사실이면 격차 위치 정확히 1~2줄, (iii) dual-sat 9건과의 인과 매핑.

**함정 사전 고지**:
- 🚨 **시간·공수·담당 추정 금지** — Arki 실행계획은 Phase 분해·게이트만. Fin이 감사.
- 🚨 **레거시 소급 금지** — 4개 .md 파일을 읽고 "이 파일들이 이미 표준이다"라고 가정 말 것. 등록되지 않은 .md는 의도일 뿐, 표준 아님.
- 🚨 **반대를 위한 반대 금지** — 등록 누락이 사실이 아니라면 즉시 그렇게 보고. 다른 결함 찾으러 가지 말 것.
- 🚨 **외부 앵커 1개 cross-check** (D-059) — Claude Code 공식 문서 또는 실등록 에이전트 정의를 1개 이상 비교 기준으로 인용.

**스킵·재호출 예고**:
- Fin: 이번 라운드 스킵. (c) 채택 시 자원·비용 결정 없음. 인프라 보완 결정 후 Arki 실행계획에 contamination 감사로만 재호출.
- Riki: Arki 진단 직후 호출. 가정 1·2 falsification 시도 + dual-sat 9건이 운영 허용 가능한지 반대 시나리오.
- Nova: 미호출. 확장가능성 토픽이 아닙니다.
- Edi: 종합검토 후 마지막.

## 첫 번째 결정 축 — Master 답변 요청

**Master, 가장 먼저 답해주실 것 1개**:

> Review 범위를 **(c) 에이전트 인프라 단독**으로 좁혀도 되겠습니까? Ace 의견은 (c) 단독입니다. PD·suspended 토픽은 별도 토픽으로 분리하고, 이번 세션은 "role-*.md 4개가 실제로 등록·동작하는지" 한 점에 집중합니다.

대안:
- "(d) 합집합으로 해" → Ace는 슬롯 분산 위험 보고 후 진행.
- "(b) PD 정리부터" → Structural 공백을 알면서 두는 비용 보고 후 진행.
- "에이전트 등록 문제 아니야, 너희가 잘못 봤어" → 가정 1 즉시 폐기, (a) 결과물 review로 전환.

## 자가 검토

- **빠진 축?** L5 페르소나 분리(PD-032)와의 연관성을 결정 축에 넣을지 고민했으나 Out으로 분리. 인프라 등록과 페르소나 분리는 결합도가 낮습니다 (등록은 harness, 분리는 .md 정의). 보완 필요 시 Master 지적 환영.
- **범위 초과?** (c) 단독 결정 후 implementation 토픽으로 분기시키는 구조이므로, 이번 framing 토픽 자체는 측정·진단·결정에서 멈춥니다. 수정 작업까지 포함하면 grade A 슬롯 초과.
- **추천 근거 강도**: (c) 우선 추천의 핵심 증거는 Main이 직접 발견한 "Available agents 목록에 role-* 부재". 이것이 사실이면 추천 강함. 만약 Main의 관찰이 부분적이거나 다른 dispatch 경로가 있다면 (Arki가 검증) 추천 자체 재고. 그래서 첫 결정 축에 "잘못 봤어" 옵션을 명시적으로 둠.
- **Relay 위반 위험**: 다음 호출은 Arki 단독. Arki 응답 후 Ace는 Riki 호출 결정 시점에서만 발언 (relay 아님, 다음 호출 결정).
