---
sessionId: session_137
topicId: topic_126
role: ace
rev: 1
date: 2026-04-29
turnId: 0
invocationMode: subagent
---

# Ace 프레이밍 — session_137

## Step 0. 토픽 생명주기 판정

- **topicType**: `standalone` (기존 선언 유지)
- **parentTopicId**: null
- **판정**: topic_126 재오픈. framing 수준은 L2 (실행 지향). 신규 판정 없음.

---

## Step 0b. PD 교차검증

| PD | 상태 | 실제 동작 검증 |
|---|---|---|
| PD-023 (self-scores MVP) | resolved | `finalize-self-scores.ts` 존재·연결 확인. 단, 입력 소스(turns[].selfScores 또는 transcript YAML) 실제 기입 여부 미검증 |
| PD-035 (페르소나 yaml-block 편입) | resolved | `role-ace.md` 등 self-scores 블록 정의 존재. 단, 서브에이전트가 실제 출력하는지 미검증 |
| PD-052 (역할 사칭 차단 hook) | resolved | post-tool-use 존재. 단, self-scores 검증과 교차 여부 미확인 |

**핵심 gap**: PD는 resolved이지만 **end-to-end 실제 출력 → 파싱 → 적재 흐름**이 검증된 적 없음.

---

## 1. 토픽 정의 (What)

**핵심 질문**: hook이 페르소나를 정상 inject하는 지금, 서브에이전트가 실제로 `# self-scores` YAML 블록을 출력하고 있는가? 출력한다면 `finalize-self-scores.ts`가 그것을 올바르게 파싱·적재하는가?

**배경**: session_128 진단에서 실패 지점은 "[A] 서브에이전트 `# self-scores` 미출력"이었다. 이후 pre-tool-use-task.js v3가 구현되어 페르소나 3층 inject가 완료됐다. 로그 확인 결과 v3-persona phase로 정상 mutate 중. 그러나 inject ≠ 출력 ≠ 적재. 세 단계 각각 독립 검증이 필요하다.

---

## 2. 결정 축 (Decision Axes)

**축 1. 검증 방식**: 실제 서브에이전트 호출 테스트 vs 로그/기존 산출물 정적 분석
- 좌극단: 지금 즉시 테스트 서브에이전트 호출 → 가장 빠른 실증. 비용: 1회 토큰.
- 우극단: 로그와 코드만 분석 → 리스크: 놓친 경로 있을 수 있음.
- 권고: **실제 호출 테스트 우선**. 로그 분석은 보조.

**축 2. 파싱 소스 우선순위**: `turns[].selfScores` vs transcript YAML block
- `finalize-self-scores.ts`는 두 경로를 모두 지원. 어느 경로가 실제 동작하는지 Master 결정 필요 없음 — Dev 코드 검증으로 판정 가능.

---

## 3. 범위 경계 (Scope In / Out)

**In**:
- hook inject 검증 (현재 v3-persona phase 정상 여부 확인)
- 서브에이전트 `# self-scores` YAML 블록 실제 출력 여부 검증
- `finalize-self-scores.ts` 파싱 로직 — YAML block vs turns[].selfScores 경로 중 실제 작동 경로 확인
- `memory/growth/self_scores.jsonl` 실제 적재 데이터 확인

**Out**:
- `compute-dashboard.ts` 집계 로직 (별도 토픽 또는 후속 세션)
- 역할별 지표 키 재정의·재설계 (D-092 결정 사항, 현 세션 건드리지 않음)
- UI 표시 오류 (데이터 적재 확인 후 별도)

---

## 4. 핵심 전제

- 🔴 **전제 1**: `pre-tool-use-task.js v3`가 실제로 서브에이전트 prompt에 `## self-scores` YAML 블록 작성 지시를 포함시키고 있다.
  - 검증 근거: 로그에서 `mutate-v3-persona` phase 확인됨 + `personaMarkers: []` (에러 없음). 그러나 inject 내용에 실제로 self-scores 작성 지시가 있는지는 코드 내 `composeInjection` 출력값 확인 필요.
- 🔴 **전제 2**: `finalize-self-scores.ts`가 올바른 소스에서 YAML block을 파싱하고 있다.
  - transcript 경로와 turns[] 경로 중 실제로 채워지는 쪽이 어디인지 확인 필요.
- **전제 3**: `memory/growth/metrics_registry.json`이 최신 shortKey를 포함하고 있다. (D-092 SOT)

---

## 5. 실행계획 모드 선언

`executionPlanMode: plan`

3단계 순서:
1. **Dev** — 코드 + 로그 점검. inject 내용 확인, 파싱 경로 추적, self_scores.jsonl 실제 데이터 확인.
2. **Riki** — 파이프라인 각 단계 실패 경로 감사. Dev 발견 사항 기반 고위험 gap 식별.
3. **Ace 종합** — Dev + Riki 합성. 수정 범위·우선순위 단일 권고.

Arki, Fin 이번 세션 스킵. 구조 재설계가 아닌 검증·수정 세션이므로.

---

## 6. 역할 호출 설계

### Dev 호출

**질문 범위**:
1. `buildPersonaLayer`가 반환하는 `content`를 실제로 확인. `# self-scores` 작성 지시가 포함되는가?
   - 확인 경로: `memory/roles/policies/role-ace.md` 내 self-scores 섹션 + `_common.md`의 Self-Score YAML 출력 계약 섹션
2. 최근 세션 서브에이전트 발언에 `# self-scores` 블록이 실제로 존재하는가?
   - 확인 경로: `reports/2026-04-28_*` 또는 `reports/2026-04-29_*` 각 역할 rev.md
3. `memory/growth/self_scores.jsonl` 최근 기록이 존재하는가? 마지막 적재 ts 확인.
4. `finalize-self-scores.ts`의 입력 소스 — transcript 경로가 실제로 넘어오는가?

**함정 사전 고지**: hook이 inject했다는 것과, 서브에이전트가 그 지시를 따랐다는 것은 별개다. Dev는 "inject 성공" 로그를 보고 "출력 성공"으로 단정하지 말 것.

### Riki 호출 (Dev 발언 후)

**질문 범위**:
1. 파이프라인 4단계 각각의 **조용한 실패** 경로: inject 되었지만 서브가 무시, YAML block 있지만 파싱 미스, 파싱 됐지만 registry 미매핑, 적재 됐지만 compute가 0으로 처리.
2. `finalize-self-scores.ts` 실행 시점 — hook chain에서 호출되는가? 언제?
3. Dev가 발견한 gap에서 재발 위험 있는 경로 집중.

**함정 사전 고지**: Riki는 Dev 발견 사항을 전제로 한다. Dev 발언 없이 추상적 리스크 나열하지 말 것. 실제 코드·로그 인용 기반으로만.

---

```yaml
# self-scores
rfrm_trg: Y
ctx_car: 0.92
orc_hit: 0.85
mst_fr: 0.90
ang_nov: 2
```
