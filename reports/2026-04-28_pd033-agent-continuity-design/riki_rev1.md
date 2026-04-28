---
role: riki
session: session_123
topic: topic_121
topicSlug: pd033-agent-continuity-design
turnId: 6
invocationMode: subagent
grade: A
date: 2026-04-28
rev: 1
---

# Riki — Ace rev3 5축 권고 직격 검증 (Master 질문: "방향 잘 잡은거야?")

Riki입니다. Master가 "Ace 방향성"을 묻습니다. 일치 추구 안 합니다. 5축을 코드·hook·파일시스템 4축으로 직접 실측한 뒤, 진짜 리스크만 박제합니다. 결론부터: **방향은 대체로 잡혔으나 C3-γ "토픽 layer = turn_log.jsonl + context_brief.md 재활용"은 본 토픽 자기증명에서 즉시 깨집니다.** 리스크 3건만 박습니다.

---

## 실측 (원문 정독·근거 의무)

코드와 파일시스템 직접 확인 결과 4건 박제:

1. **본 토픽 `topics/topic_121/` 디렉토리에 turn_log.jsonl 부재 + context_brief.md 부재** — `ls topics/topic_121/`는 `agenda.md / debate_log.json / decisions.json / master_feedback.json / open_issues.json / revision_history.json / speculative_options.json / topic_meta.json` 8개만. `/open` skill이 생성하지 않음. **C3-γ 토픽 layer 자동 read 대상이 본 토픽엔 처음부터 없음**.
2. **turn_log.jsonl은 수동 스크립트 `scripts/write-turn-log.ts`로만 작성** — PostToolUse hook(`post-tool-use-task.js`)·session-end-finalize.js 어디에도 `writeTurnLog`/`turn_log` 호출 없음(grep 결과 0건). 즉 *자동 작성 인프라 부재*.
3. **session_contributions/.md도 수동 — `write-session-contribution.ts`** — 토픽 종료 시 수동 호출 또는 close skill에서만 트리거. 토픽 진행 *중*엔 작성되지 않음.
4. **PreToolUse hook이 settings.json·settings.local.json 어디에도 등록 0** — `grep PreToolUse settings*`는 빈 결과. PostToolUse(Task)만 등록됨. K6 기능 *spec 가용성*과 별개로 *현재 환경에 PreToolUse hook 자체가 없음*. K6 채택은 "신설"이지 "기존 활용"이 아님.

---

## 🔴 R-1. C3-γ 토픽 layer 자동 read 대상 자체가 본 토픽에 부재 — 자기증명 즉시 실패

**Ace rev3 인용 (Sec 3 C3-γ)**:
> "기존 인프라 100% 재활용 — turn_log.jsonl(인덱스) + context_brief.md(서사 맥락) + role 필터 reports/"

**실패 시 파손 범위**:
- 본 토픽 `topics/topic_121/` 실측 결과 turn_log.jsonl과 context_brief.md *둘 다 부재*. PreToolUse hook이 K6/K7 모두 충족해도 **read 대상 파일이 없으면 토픽 layer는 빈 출력**.
- 본 토픽이 다음 세션으로 이어지면 (Ace rev3 비전 정정 — 토픽은 여러 세션에 걸칠 수 있음) 다음 세션 첫 호출은 토픽 layer로 *현재 세션의 6개 reports/ 발언을 인지 못함*. 세션 layer는 새 sessionId로 시작하므로 비어있음. **이중 누락**.
- 즉 Ace rev3가 PD-033 resolveCondition을 본 토픽으로 닫으려는 권고 자체가 — *본 토픽 진행 중에 검증 불가능*. `Phase 3B 토픽 layer dry-run` 게이트가 빈 파일에서 통과 판정하면 false-positive.

**Mitigation**:
- Phase 1 G1에 K7' 신규 게이트 추가: "**해당 토픽 디렉토리에 turn_log.jsonl·context_brief.md가 자동 생성되도록 hook chain 보강**" (write-turn-log를 PostToolUse(Task) hook에 통합 호출 또는 새 hook). 즉 신설 인프라 = PreToolUse hook 1개 *+ PostToolUse hook 확장* — Ace rev3가 "신설 인프라 = PreToolUse hook 1개만"이라 한 것은 부분 거짓.
- 또는 토픽 layer 옵션을 C3-γ → C3-α' "reports/ glob"로 fallback: `reports/{*_topicSlug}/{role}_rev*.md` glob으로 토픽 단위 inject. 본 토픽 reports/ 디렉토리는 실존(`reports/2026-04-28_pd033-agent-continuity-design/` 6개 파일 실측). 단 토픽 slug에 날짜 prefix가 붙어 있어 N세션이면 N개 디렉토리로 분기 — glob 패턴 정의 필요.

**Fallback**:
- C3-γ가 K7' 게이트 실패 시 토픽 layer는 본 토픽에서 *부분 작동만* 인정 + 다음 세션부터 정식 작동(turn_log 생성 활성화 후). 본 세션은 reports/ glob 임시 fallback. 결정 박제 시 이 한계 명시.

---

## 🟡 R-2. K6 falsification probe 결과가 부정 시 5축 권고 전체 붕괴 + Ace rev3가 fallback 부재

**Ace rev3 인용 (Sec 6)**:
> "중단 조건: K6 미허용이면 PreToolUse hook 별도 PD 분기 + 본 토픽은 C1-β fallback으로 종결"

**실패 시 파손 범위**:
- C1-β는 ace rev2에서 *이미 부결 처리* — "메인 휘발성 의존, 비전 정면 충돌". rev3가 C1-β를 fallback이라 적었지만 *비전 위반 fallback*. 즉 K6 부정 시 **본 토픽이 비전 충족 결정 박제 0건으로 닫힘** — Master 비전 미해소. PD-033 미결 잠복 재현(D-071 fiction 패턴).
- K6 spec 검증 시점이 Phase 1 — 본 세션 안에서 spec 미허용으로 판정 시 본 세션 결정 박제 자체가 차단됨(D-072 falsification probe 게이트). **본 세션이 결정 0으로 종료될 가능성 존재**. Master 비전 게이트의 직접 비용.
- 추가: PreToolUse hook은 settings.json 미등록 — Claude Code spec이 PreToolUse를 *지원해도* 본 환경에서 실제 작동하는지는 신규 등록 + 1회 실행 검증 필요. spec 가용성 ≠ 실환경 작동.

**Mitigation**:
- Phase 1에 K6 spec 확인을 *2단으로* 분리: (a) Claude Code 공식 spec 문서 search 또는 hook protocol 확인 (정적), (b) 실제 hook 등록 + 더미 prompt mutation test (동적). (a) 통과해도 (b) 미통과 시 fallback.
- C1-β를 "비전 위반 fallback"이 아니라 "**비전 미충족 + 잠복 박제**"로 명시 처리: 즉 본 토픽 종결 시 결정 박제는 하되 PD-033은 *partial-resolved*로 표기. PreToolUse hook 활성화 별도 PD로 분기.

**Fallback**:
- 본 세션 안에 (a)+(b) 모두 통과 못하면 본 토픽을 *재오픈 가능* 상태로 종결 + PD-NNN 신규 박제("PreToolUse hook 환경 도입"). 비전 미충족이지만 *잠복 회피*.

---

## 🟡 R-3. PreToolUse hook은 본 호출 *지금 이 순간*에 작동 안 함 — 본 호출 자기증명 가짜

**Ace rev3 인용 (Sec 3 C1-α)**:
> "PreToolUse(Task) hook이 prompt에 자동 prepend... 본 호출 자체가 시연"

**실패 시 파손 범위**:
- 본 호출의 prompt는 *메인이 인라인으로 박은 것*이다. PreToolUse hook은 settings.json 미등록 → 작동 0. 즉 메인이 직접 "직전 발언 6개 경로 + 페르소나 read 의무 + WRITE_PATH + frontmatter"를 inline prepend. **Ace rev1 시점부터 줄곧 메인 휘발성에 의존해 작동 중** — 그것이 *현재의 표준*임.
- Ace rev3가 "본 호출 자체가 미니멀 안 작동 증거"라 한 것은 사실관계상 옳음 — 단 그 메커니즘은 *PreToolUse hook이 아님*. Ace rev2/rev3가 시연하는 것은 *메인 prompt 직접 박제 패턴*이지 hook 강제가 아니다. **Master 비전 "자동·시스템적"의 증거가 아님**.
- 즉 본 호출이 정상 작동했다는 것이 PreToolUse hook 채택을 정당화하지 않음. 오히려 *현재 메인이 인라인 박는 패턴이 동작한다*는 사실은 C1-α 채택의 *반대 근거*로도 해석 가능 — Hickey 짓지않음 옵션.
- 단 메인이 이번엔 박았지만 *다음 호출은 박을지 알 수 없음*이라는 비전 핵심은 유효 → C1-α는 여전히 권고 정합. 그러나 *증거 prov venance*가 잘못 박혀 있음.

**Mitigation**:
- Ace rev4(spec 정식화) 시 "본 호출이 PreToolUse hook 시연 증거"라는 잘못된 prov잘못된 표현 정정. 정확한 표현: "*메인 인라인 prepend가 본 호출에서 작동했고, 동일 prepend를 PreToolUse hook으로 코드 강제하면 메인 휘발성을 차단한다*".
- Phase 1 K6 게이트 통과 시 **본 호출 prompt를 hook 등록 후 재현 시도**해 *동일 입력 → 동일 출력*이 성립하는지 확인. 그러면 진짜 시연이 됨.

**Fallback**:
- prov잘못 잘못된 표현이 결정 박제 본문에 그대로 남으면 다음 세션이 C1-α 채택을 *과거 작동 증거에 기반*해 신뢰함 — 본 호출이 사실은 hook 부재 상태였다는 것이 발견되면 신뢰 손실. 결정 박제 직전 prov 표현 정정 의무.

---

## 기각한 곁가지 의도적 제외 (페르소나 §원칙)

다음 항목은 *결정에 영향이 약하거나 Ace/Arki가 이미 다룸*. 의도적 제외:

- **scratchpad write race condition** (Arki rev2 R3): Tier 3 신설 부결로 자동 소멸. 중복 박제 회피.
- **summary 200자 cap 부족** (Arki rev3 Axis 2): 이미 Ace rev3이 C2-α "전문 read"로 채택해 결착됨. 재박제 = 개수 채우기.
- **페르소나 슬림화 색채 손실** (Arki rev2 R1, rev3 Axis 3): C4-γ 폐기로 자동 소멸. 결착됨.
- **K8 system prepend 가용성**: Ace rev3 Sec 5에서 ⚠️로 이미 명시. K6 충족 시 K8은 차선만 잃음 — 본 토픽 결정 영향 없음. 중복 회피.
- **dispatch_template.md 강제력 부재** (Arki rev3 Axis 1): rev2 안이 부결되어 자연 해소. 재박제 무의미.
- **Hook 실패 모드 silent** (메인 prompt 함정 사전 고지 #7): R-2 mitigation에 흡수됨. 별도 R 박제 필요 없음 — 개수 채우기 회피.
- **role 필터 inject scope vs Master 비전 ("회의 = 모두 read")**: 메인 prompt 함정 사전 고지 #6. 검토 결과 — Ace rev3 C3-γ "role 필터링으로 prompt 부풀림 방지"가 비전 위반 가능성 있으나 *prompt 토큰 비용 vs 비전 직역* trade-off는 Ace rev1 inject scope 차등안의 합리적 정착이고 Master 비전이 "*모든 발언을 모든 호출에 inject*"라고 명시하지 않음("**서로의 내용을 알아야 한다**"는 비전은 *접근 가능성*이지 *매 호출 prompt 박제*가 아님). 결정 영향 없음 — *반대를 위한 반대* 함정 회피.
- **본 토픽 자기증명 (메인 prompt #8)**: R-3에 흡수.
- **Arki rev3 미니멀 안의 "신설 0건" 비전 위반 (메인 prompt #10)**: Ace rev3가 이미 명시 폐기. 중복.

---

## Ace 방향성 최종 판정

**부분 결함**.

근거 3가지:

1. **방향 자체는 잡혔다** — C1-α PreToolUse hook 코드 강제 + C2-γ 양축 inject + C4-α 세션 layer = `current_session.turns[]` + reports/ + C5-α 토픽 보존은 Master 비전 "토픽 영속·세션 동기·자동·둘 다" 직역. 5축 구조 자체가 비전 정합.
2. **그러나 C3-γ는 자기증명 즉시 실패** (R-1) — 본 토픽 turn_log/context_brief 부재. "기존 인프라 100% 재활용"이라는 표현은 사실 거짓이고, *기존 인프라가 본 토픽엔 아직 활성화되지 않았음*. Ace rev3가 부분 자가 환각 — Arki rev3 미니멀 안의 "신설 0" 환각을 부분적으로 인수.
3. **그리고 K6 fallback이 비전 위반** (R-2) — C1-β를 fallback이라 적었지만 비전 위반 fallback. 본 세션이 결정 0으로 닫힐 가능성 미준비.

→ **권고**: Ace rev4 spec 정식화 직전에 (a) C3-γ 인프라 보강 1건 추가(turn_log 자동 생성 hook chain) 또는 fallback C3-α' reports/ glob 분기 명시, (b) K6 부정 시 처리 정정(C1-β 부결, partial-resolved + PD 분기), (c) 본 호출 prov 표현 정정. 3건 보강하면 방향 그대로 진행 가능.

---

## 메인 보고용 요약

- 실측 결과 **본 토픽 `topics/topic_121/`에 turn_log.jsonl·context_brief.md 둘 다 부재** — Ace rev3 C3-γ "기존 인프라 100% 재활용"은 *본 토픽 자기증명에서 즉시 실패* (R-1).
- turn_log.jsonl은 수동 스크립트(`scripts/write-turn-log.ts`)로만 작성. PostToolUse hook은 current_session.turns[]만 update — turn_log.jsonl 자동 작성 인프라 *부재* 실측. C3-γ는 신설 1건이지 0건 아님.
- **PreToolUse hook은 settings.json 미등록** — Ace rev3가 "본 호출 자체가 미니멀 안 시연"이라 한 prov 표현 정정 필요. 본 호출은 *메인 인라인 prepend*로 작동했지 hook가 아님(R-3).
- K6 부정 시 fallback C1-β는 비전 위반 fallback — 본 세션이 결정 0으로 닫힐 가능성 (R-2).
- **방향 판정: 부분 결함**. 5축 구조 자체는 비전 정합이나 C3-γ 인프라 보강 1건 추가 또는 reports/ glob fallback 명시 + K6 fallback 정정 + 본 호출 prov 표현 정정 3건 필요. 보강 후 진행 가능.
- Master 추가 결정 필요 0건 (Riki는 결정 보좌, 결정 자체는 Ace/Master 영역).

---

```yaml
# self-scores
crt_rcl: Y
cr_val: 4
prd_rej: Y
fp_rt: 0.20
```

**다음 발언자 추천**: Ace rev4 (보강 3건 반영한 spec 정식화) — Master 무응답 시 자동 진행. Master 명시 개입 시 그쪽 우선.
