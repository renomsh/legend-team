---
role: riki
turnId: 1
sessionId: session_233
topicId: topic_196
invocationMode: subagent
---

# Riki rev1 — Agent dispatch 단축 옵션 적대적 감사

Master, Riki입니다. Arki rev1 5개 옵션(Opt-4 기각 후) 적대적 감사. 시스템 인용 기반, 구체 시나리오만. mitigation은 식별 가능한 경우 병기.

---

## 0. 종합 결론 (3줄)

1. **Opt-1 (hook 통합)**: 절감 명확하지만 Sage gate가 `process.exit(2)` hard block 메커니즘을 hook 단위 종료에 의존 — 모듈 통합 시 우선순위·blocking 시점 변경이 D-128 격리를 무력화할 구체 시나리오 존재. **검증 후**로 강등 권고.
2. **Opt-5 (PostToolUse 비동기화)**: 단순 race 우려가 아니라 D-169 nexus 모드의 `pending_turns_{sid}.jsonl` 중심 turn 박제 시퀀스를 깨뜨리는 결정적 시나리오 식별. **즉시 기각** 동의 (Arki 결론 보강).
3. **모든 옵션의 공통 결정 차단 항목**: B 단계(pre-hook) 실측치 부재. `SPIKE_R6_LOG`는 post-hook에만 존재(`post-tool-use-task.js` L296). pre-hook instrumentation 없이 Opt-1·Opt-2 절감 추정은 검증 불가 — **결정 전 1주 데이터 수집 필수**.

---

## 1. Opt-1 — PreToolUse hook 3개 → 1개 통합

### A. 실패 모드

#### 🔴 R-1. Sage exclusive isolation 무력화 (D-128)
**구체 시나리오**: 현재 `pre-tool-use-task-sage-gate.js`는 같은 세션에 다른 페르소나 turn이 1건이라도 있으면 Sage 호출을 `process.exit(2)`로 hard block (L96-99, L164-179). 통합 hook으로 sage-gate 모듈 + persona-inject 모듈을 합치면, sage-gate 모듈이 먼저 실행되어 `process.exit(2)` 호출 시 **이미 persona-inject 모듈에서 disk read·log append가 일부 진행된 상태에서 종료**. 더 큰 위험은 모듈 합성 시 try/catch 격리 패턴(Arki mitigation)이 들어가면, sage-gate의 `exit(2)`가 try/catch에 잡혀 `exit(0)`로 squash → **D-128 격리가 silent하게 깨짐**.

**근거**: sage-gate.js L96-99 — `function reject() { ... process.exit(2); }`, L185-188 — 외부 catch는 silent pass(`exit(0)`)로 설계됨. Arki mitigation "try/catch 모듈별 격리 + silent pass"는 **sage-gate의 hard block 의도와 직접 충돌**.

**완화 조건**: 모듈 통합 시 sage-gate를 try/catch **밖**에 별도 단계로 두고 `exit(2)` 직접 노출. 단 이렇게 하면 "hook 1개 통합" 이점의 일부 상실.

#### 🟡 R-2. master-first warn-only가 BLOCK으로 격상되는 잠재 회귀
**구체 시나리오**: `pre-tool-use-task-master-first.js` L11 명시 — "**warn-only mode**, 항상 exit 0". 통합 hook의 공통 에러 핸들러가 모듈 결과를 종합 판정하는 로직을 넣으면(예: "any module returned warn → exit 2"), master-first warn이 hard block으로 무의식 격상. **D-129 정책 위반.**

**근거**: master-first.js L146 명시 `// warn-only — always pass`.

**완화 조건**: 통합 시 모듈 반환 계약을 `{exitCode, stderr}`로 명시하고 종합 시 `Math.max(0, ...)` 대신 모듈별 exitCode 보존. 그러나 이 자체가 "단순 통합"의 단순함을 잃게 함.

### B. 가정 감사

- Arki "Node cold-start ×3 (각 ~50-150ms) → 200~600ms 합계" — **검증 불가**. pre-hook에 spike 없음. PowerShell·Windows 환경에서 Node spawn cost는 macOS 일반치보다 큰 경향(VM 인스턴스 가설)이 있으나 이 시스템 실측 0건. **반증 시나리오**: 만약 실측 cold-start가 ×3 합계 80ms 수준이라면 Opt-1 절감 자체가 noise 수준 → 위 R-1·R-2 위험 대비 ROI 음(-).
- "통합 시 우선순위 충돌"을 Arki도 검토 포인트로 언급 — Riki는 이를 **검증 포인트가 아니라 결정 차단 사유**로 격상. 위 R-1 시나리오 구체화.

### C. 권고 재분류
- Arki: 즉시 적용 → **Riki: 검증 후 적용 (조건부)**
- 조건: (1) pre-hook 실측 데이터 1주 수집해 절감폭 확정 (2) sage-gate hard block을 try/catch 밖 별도 단계로 분리하는 통합 설계 박제

### D. 결정 차단 항목 (Opt-1)
- **B-1**: pre-hook에 SPIKE_R6_LOG 등가 instrumentation 추가, 100 호출 데이터 수집
- **B-2**: sage-gate 차단 메커니즘이 통합 후에도 동일하게 작동하는지 unit test (sage 호출 + 다른 role turn 존재 시 exit(2) 보존)

---

## 2. Opt-2 — 페르소나 layer 빌드 결과 캐시

### A. 실패 모드

#### 🟡 R-3. `_common.md` 갱신과 hook 호출 race
**구체 시나리오**: Master가 `memory/roles/policies/_common.md`를 수정한 직후, 캐시 빌드 스크립트가 아직 11개 persona 캐시를 모두 재생성하지 못한 상태에서 hook이 호출됨 → 일부 역할은 새 정책, 일부는 stale 정책으로 발언. 정책 변경이 정확히 "변경 의도 검증 세션" 동안 일어나면 **변경 효과를 측정하는 그 세션이 stale 캐시를 보고 있어 측정 자체가 오염**.

**근거**: `_common.md` 변경 cascade는 Arki도 검토 포인트로 언급. mitigation "단일 빌드 스크립트 직렬화"는 hook의 read 시점과 빌드 시점의 race를 해결하지 못함 — read 시점 mtime 비교만 fallback.

**완화 조건**: hook이 read 시 `_common.md.mtime > cache.mtime` 체크 후 stale면 즉시 inline 재합성(원래 경로). 즉 캐시는 best-effort. 이 패턴 박제하면 R-3 해결 + 절감 대부분 유지.

### B. 가정 감사
- Arki "B-1 50ms → 5ms" — 합리적 범위. 단 Arki 자신이 절감폭을 "호출당 ~30ms" "누적 가치는 long horizon"으로 명시 → **세션 단위 체감 효과 거의 없음**. ROI는 시스템 전체 호출 수 누적에서만 의미.
- "수만 호출 시 분 단위" — 본 시스템 호출 빈도 실측 부재. session_233 기준 turns 수·일평균 호출수 카운트 안 됨.

### C. 권고 재분류
- Arki: 검증 후 적용 → **Riki: 검증 후 적용 (유지)**. 단 R-3 mitigation(mtime fallback inline 재합성) 설계 박제 조건.

### D. 결정 차단 항목 (Opt-2)
- 일평균 Agent dispatch 호출수 실측. 100 미만이면 Opt-2 무용(절감 < 측정 noise).

---

## 3. Opt-3 — session/topic layer payload 절삭 강화

### A. 실패 모드

#### 🟡 R-4. 컨텍스트 손실로 서브가 Read 도구로 보충 → E 단계 증가
**구체 시나리오 (Arki도 인지)**: cap 80KB → 40KB로 줄이면 후반 세션·누적 토픽에서 inject 잘리는 경우 발생. 서브에이전트가 잘린 부분을 Read 도구로 보충하면 **E 단계(서브 자체 작업)가 증가**. 본 Riki 호출 자체가 케이스 — Arki 보고서가 hook context에서 "[이하 생략]" 잘려서 Riki가 Read를 추가 호출함(L83-87 추정). 이때 발생하는 추가 latency는 D 단계 절감을 상쇄할 수 있음.

**근거**: 본 호출 hook context의 "... [이하 생략 — reports/2026-05-10_agent-dispatch-speed/arki_rev1.md 전문은 Read 도구로 확인]" 메시지가 실제로 보임 (`pre-tool-use-task.js` L72 truncate 함수 출력). 즉 **현 cap에서도 이미 truncation 발생 중** → cap 더 줄이면 보충 Read 빈도 증가.

**완화 조건**: cap 감축 전 "직전 N=3 turns만 inject" 변형(Arki도 대안으로 언급)이 본질에 더 가까움. cap은 안전망, selection이 본질.

#### 🟡 R-5. Edi에 대한 절삭은 위험
**구체 시나리오**: `pre-tool-use-task.js` L35 — `MAX_CHARS_PER_EDI = 8000`이 별도 상수. 이는 Edi가 "전체 종합" 책임 때문에 의도적으로 더 큼 (D-130 D-138 anchor governance, version_bump_confirm). per-report 절삭을 일률 3KB로 낮추면 Edi가 이전 역할 발언 핵심 누락한 채 박제 → versionBump·gap 검출 누락 위험. **D-138 enforcement 회귀.**

**완화 조건**: 절삭은 non-Edi 역할만, Edi 8KB 유지.

### B. 가정 감사
- Arki "D 단계 30~40% 절감 → 전체 10~15% 절감" — **추측 명시함**. prompt length와 첫 토큰 latency는 선형 관계 가정인데, Anthropic API 모델은 prefix caching 적용 시 비선형. opus prefix cache hit rate가 본 시스템에서 어떻게 동작하는지 실측 없음. **반증 시나리오**: cache hit이 잘 되고 있으면 prompt 절삭의 latency 절감 효과는 거의 0.

### C. 권고 재분류
- Arki: 즉시 적용 (cap 감축은 보수적) → **Riki: 즉시 적용은 단순 cap만, per-report 절삭은 검증 후 + Edi 예외 명시**

### D. 결정 차단 항목 (Opt-3)
- "직전 N turns만 inject" 변형이 더 본질적인지 평가. 이는 cap 감축과 다른 lever — Arki rev2에서 분리 평가 필요.

---

## 4. Opt-5 — PostToolUse hook 백그라운드화

### A. 실패 모드 — 결정적

#### 🔴 R-6. D-169 nexus 모드 turn 박제 시퀀스 파괴
**구체 시나리오**: `post-tool-use-task.js` L348-380 — turnPushMode가 'nexus'면 ②에서 `pending_turns_{sid}.jsonl` append 후 ③ turns[] 직접 push skip, Nexus가 다음 dispatch 전 pending을 read해 turns 정렬·flush. 이 시퀀스가 동기여야 **다음 PreToolUse(Task) hook이 진입하기 전에 pending 파일이 디스크에 보장**. 비동기화 시 Nexus가 다음 호출에서 pending 미반영 상태로 계속 dispatch → turn idx race / 중복 / 누락.

**근거**: SPIKE-R6 instrumentation 자체가 `post-tool-use-task.js` L293-310에 박제되어 race 의심 시점부터 데이터 수집 중. Arki도 이를 mitigation으로 언급. Riki 추가 발견: `dispatch_config.json` L133-140에 `path_policy.pending_turns_pattern` D-169 P7 박제 — pending_turns 파일 시스템이 SOT 단일 출처로 격상되어 **비동기화 시 SOT 일관성 직접 손상**.

#### 🔴 R-7. frontmatter turnId patch race
**구체 시나리오**: `post-tool-use-task.js` L280-287 — Edi/Riki 등의 reports/*_rev*.md frontmatter `turnId:` 정정. 비동기화 시 다음 hook이 들어와 새 turn 박제하는데 직전 patch 미완료 → frontmatter `turnId`가 잘못된 값으로 남아 `validate-session-turns.ts` 검증 실패 + finalize gap 박제.

**근거**: post-tool-use-task.js L280 line 직접.

### B. 가정 감사
- Arki "G 단계 100~250ms 제거, 절감 3~5%" — 절감 자체는 수치적으로 작음. 위 R-6·R-7 손상 비용 대비 명백히 음(-).

### C. 권고 재분류
- Arki: 기각 → **Riki: 기각 동의 (강화)**. "race 위험"이 아니라 "race가 SOT 손상으로 직결되는 결정적 시나리오 식별".

### D. 결정 차단 항목
- 없음 (기각 결정).

---

## 5. Opt-6 — 직렬 → 병렬 dispatch (역할 독립 시)

### A. 실패 모드

#### 🟡 R-8. Sage gate Case 3 false trigger
**구체 시나리오**: `sage-gate.js` L177-179 — Case 3은 "현 세션 turns에 sage 포함 시 다른 role 차단". 병렬 dispatch에서 sage 호출이 한 메시지 내 다른 역할과 함께 들어가면, hook 실행 순서에 따라 sage가 먼저 turns에 박제될 수 있음(post-hook race) → 동시 dispatch된 다른 역할이 Case 3에 걸려 silent하게 차단됨. **Sage 호출이 Master 인지 없이 다른 역할을 죽임.**

**근거**: sage-gate.js L160-179 + post-tool-use-task.js의 race instrumentation 존재.

**완화 조건**: 병렬 dispatch 정책 박제 시 "sage는 항상 단독 호출" 강제. 단 이는 D-128 정책 자체와 정합 — 별도 신설 부담 없음.

#### 🟡 R-9. dependencies 그래프 부재 시 잘못된 병렬화
**구체 시나리오 (Arki도 인지)**: arki → dev 의존이 있는데 병렬화하면 dev가 arki 결과 못 봄. Arki mitigation "역할 의존 그래프 박제"는 합리적이나, 현재 CLAUDE.md §Speaking order는 default scaffold이지 의존 그래프가 아님. Nexus가 자동 판정하려면 토픽 단위 의존 매트릭스 필요 — 이 자체가 별도 framing 토픽.

### B. 가정 감사
- "wall-clock 40~60% 단축" — 직렬 3 호출 ↔ 병렬 1 호출 단순 모델. Anthropic API rate limit / concurrent token 제약은 계정·티어별 다름. 본 시스템 실측 없음. **반증 시나리오**: rate limit hit 시 병렬이 직렬보다 느려질 수 있음.

### C. 권고 재분류
- Arki: 검증 후 적용 → **Riki: 검증 후 적용 (유지)**. 의존 그래프 박제는 별도 framing 토픽으로 분리 권고.

### D. 결정 차단 항목 (Opt-6)
- 의존 그래프 SOT 위치 결정 (CLAUDE.md? dispatch_config.json?). 본 토픽 범위 초과 가능성.

---

## 6. 권고 재분류 표

| Opt | Arki 분류 | Riki 분류 | 핵심 사유 |
|---|---|---|---|
| Opt-1 hook 통합 | 즉시 적용 | **검증 후 적용** | R-1 sage-gate hard block 무력화 시나리오 + B 단계 실측 부재 |
| Opt-2 persona cache | 검증 후 | 검증 후 (유지) | R-3 mtime fallback 설계 조건 부가 |
| Opt-3 payload 절삭 | 즉시 적용 | **부분 즉시 / 부분 검증 후** | cap 단순 감축만 즉시, per-report 절삭·Edi 예외는 검증 후 |
| Opt-5 PostToolUse 비동기 | 기각 | 기각 (강화) | R-6 D-169 nexus 모드 SOT 손상 결정적 시나리오 |
| Opt-6 병렬 dispatch | 검증 후 | 검증 후 (유지) | R-8 sage gate false trigger + 의존 그래프 별도 토픽 |

## 7. 공통 결정 차단 항목 (모든 Opt 적용 전)

1. **pre-hook instrumentation 추가** (가장 중요). post-tool-use-task.js의 SPIKE_R6_LOG 패턴(L293-310)을 pre-tool-use-task.js·sage-gate.js·master-first.js에도 적용. 환경변수 켰을 때만 동작 → 운영 영향 0. 1주 데이터 수집 후 B 단계 실측치 확정.
2. **prefix caching hit rate 측정**. Anthropic SDK가 cache 메타 반환하는지 확인. 미반환 시 D 단계 절감 추정 자체가 추측에 머묾.
3. **일평균 dispatch 호출수 카운트**. Opt-2 ROI 판정 기준.

이 3건은 모두 Schedule-on-Demand 위반 없음 (구조적 선후 표현만).

## 8. 자기 감사 (Riki filter)

- 실재성: R-1·R-6·R-7은 코드 줄 직접 인용, 실재. R-2는 "통합 시 잠재 격상" — 설계 의존이라 가설성. R-3·R-4·R-8은 시스템 인용 + 시나리오. R-5·R-9는 Arki 인지 항목 보강.
- 확신: 🔴 3건(R-1·R-6·R-7), 🟡 6건. Arki 결론과 불일치하는 신규 발견 = R-1(Opt-1 강등), R-6 SOT 손상 명시화.
- 기여도: Opt-1 강등·Opt-3 분리·공통 결정 차단 항목 신설이 Arki 결론에서 빠진 부분.
- 슬롯 미달이라 판정한 건 없음.

---

```json
{"selfScores": {"crt_rcl": 3, "cr_val": "Y", "prd_rej": "Y", "fp_rt": 0.15}}
```

RIKI_WRITE_DONE: reports/2026-05-10_agent-dispatch-speed/riki_rev1.md

[ROLE:riki]
# self-scores
crt_rcl: 3
cr_val: Y
prd_rej: Y
fp_rt: 0.15
