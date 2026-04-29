---
role: riki
session: session_142
topic: topic_131
date: 2026-04-29
turnId: 2
invocationMode: subagent
rev: 2
accessed_assets:
  - reports/2026-04-29_big-bang-legend-nexus-p2-1of3/arki_rev2.md
  - .claude/hooks/pre-tool-use-task.js
  - memory/shared/decision_ledger.json (D-115·D-119·D-122~D-125)
  - memory/roles/personas/role-riki.md
---

# Riki — Arki rev2 적대적 감사 + 2축 권고 (s142, rev2)

## 결론 (1줄)

Arki rev2는 권한 매트릭스·우회 차단·외부 anchor 3건 모두 합격선이지만, **D4 보장 한계 자백(§3.3 caveat)이 본 세션 deliverable 채택을 가로막을 수 없다는 회피 논리**와 **Sage 영수증 화이트리스트(§8 잔존 caveat)** 2건이 진짜 적대적 리스크. 나머지는 mitigation 충분 또는 곁가지로 기각.

---

## 1. R-N 적대적 감사

### 🔴 R-1. 자기참조 paradox 미해결 — hook 코드 자체가 prime directive 신뢰 대상

**원문 인용 (Arki §3.2):**
> hook이 `subagent_type === 'role-sage'` AND marker 일치 둘 다 요구로 강화 (Riki R-1 자기참조 paradox 회피용)

**파손 범위:** `subagent_type`도 `prompt`도 모두 main thread가 작성한 toolInput에서 옴. main이 양쪽 모두 위조 가능 → AND 조건은 위조 비용을 2배로 올릴 뿐 paradox 해소 아님. D2(도구 description 거짓 전제) 위배 — Arki는 hook 자체의 진실성을 무비판 가정.

**mitigation:**
- (a) tool 호출 invoker(Claude main thread)는 hook의 입력을 위조할 동기가 약함 — 본인이 호출하는데 self-deceive할 이유 없음. 진짜 위협 모델은 *컨텍스트 오염을 통한 main thread 설득* (D4). 이 경우 AND 조건은 무력화됨.
- (b) PostToolUse(Task) hook이 turns 박제 직후 재검증 (Arki §3.2 4번째 행) — 이건 유효. 사후 격리 가능.
- (c) 본 세션은 "완전 paradox 해소"를 deliverable에서 제외. 정직 자백 박제만으로 충분 (PD-052 동형 사례).

**fallback:** R-1 미해결을 D-126 caveat 본문에 명시 + 후속 토픽으로 분리. 본 세션 G3 dry-run 통과 기준은 "정상 호출 false-positive 0건"으로만 한정.

---

### 🔴 R-2. permissionDecision 부재 회피 논리가 "마커 prepend만으로 D4 충분"으로 슬쩍 격하

**원문 인용 (Arki §3.3):**
> 마커 prepend만으로도 LLM이 reject하도록 페르소나 본문에 "SAGE_ISOLATION_VIOLATION 마커 발견 시 즉시 발화 거부" 박제 (D4 정신, 그러나 D4는 코드 박제 우선 — 한계 인정).

**파손 범위:** D4 prime directive 본문은 *"enforcement는 코드(hook, validator, NCL violation flag)에 박제하고 모델 자율 판단에 의존하지 않는다"* (CLAUDE.md). Arki는 한계 인정으로 면책된 듯 쓰지만 — **마커 prepend는 모델 자율 판단 의존 그 자체**. 페르소나 본문에 "거부하라"는 박제는 D4 위반의 표준 사례. 이 caveat가 박제되지 않으면 D-126이 D-122의 prime directive를 무력화.

**mitigation:**
- (a) **별도 hook (`pre-tool-use-task-sage-gate.js`) 분리는 본 세션 deliverable에 포함 강행** — Arki §10에서 "G (또는 별도 hook 분리)"로 선택지 제시했으나, R-2 위협 강도 고려 시 **별도 hook 신설로 동결**. permissionDecision 미가용 환경에서도 별도 hook은 process.exit(2) + stderr write로 차단 가능 (현 hook v3 기본 패턴 참조).
- (b) 마커 prepend는 **보조** 층으로만 잔존. "충분"이라는 표현 본문 삭제 의무.
- (c) D-126 박제 시 "현 시점 D4 보장은 coverage 80% 수준, 잔존 20%는 후속 토픽"을 명시 — 정직 자백.

**fallback:** R-2 미수용 시 본 세션 G3 dry-run을 "Sage 격리 차단" 항목 미포함으로 축소하고 spc_lck 보류. Arki 한계 자백을 그대로 박제하면 D-122 prime directive 자기충실성이 즉시 깨짐.

---

### 🟡 R-3. dispatch_config.json `ace_reject_window_turns: 1` — Ace 1턴 reject 권한 vs D-124 ackReason 50자 충돌

**원문 인용 (Arki §4):**
> `natural_language_suggest_only` — Nexus가 키워드 매칭 시 **suggest only**, Ace가 1턴 reject 권한
> `ace_reject_window_turns: 1`

**파손 범위:** D-124는 Ace ack 시 ackReason 50자 + escalateAceAcksWithTTL 강제. 그런데 본 필드는 *reject* 권한이라 ack 경로 미적용. Ace가 자연어 트리거 reject를 ackReason 없이 1턴 안에 silent dismiss 가능 → D-124 R-3 silent dismiss 누수 경로 재개. echo chamber(s139) 회귀 위험.

**mitigation:** dispatch_config 스키마에 `ace_reject_requires_reason: true` + `min_reason_chars: 50` 박제. reject 사유도 ackReason과 동등 박제. session-end-finalize.js에서 reject log도 escalate 대상.

**fallback:** `ace_reject_window_turns` 필드 자체 폐기. Nexus suggest는 Master 직접 응답으로만 진행 차단/허용 결정.

---

### 🟡 R-4. Phase 의존 그래프 G3 dry-run의 "정상 호출 false-positive 0건" 기준 불명확

**원문 인용 (Arki §6 G3):**
> hook 변경 후 dry-run 4-step (① 일반 역할 호출 정상 ② Sage 단독 세션 통과 ③ Sage + 다른 역할 동석 시 마커/reject ④ same-session에 sage 진입 후 다른 역할 reject)

**파손 범위:** ③·④에서 reject 기대인데 R-2 mitigation 미적용 시 **reject 자체가 일어나지 않음** (마커 prepend만으론 reject 아님 — LLM 자율 판단). dry-run "통과" 판정 자체가 모델 자율 판단 의존 → 메타 D4 위반.

**mitigation:** dry-run 검증을 **stdout/log 검사**로만 판정. "마커 prepend 발생 + log phase=gate-triggered 기록"이 통과 기준. LLM 발언 내용으로 판정 금지. 별도 hook 분리(R-2 mitigation a) 시 process exit code로 검증.

**fallback:** G3 dry-run 4-step 중 ③·④는 "수동 Master 검증"으로 격하 + 자동 검증은 ①·②만.

---

### 🟡 R-5. Sage 영수증 special path 화이트리스트 — Arki §8 잔존 caveat가 후속 토픽 분리로 처리됐으나 본 세션 동결 spec과 충돌

**원문 인용 (Arki §8 1차):**
> Sage 영수증은 special path로 허용(`actor: 'sage', kind: 'meta-analysis'`). NCL append hook(P4)에서 화이트리스트.

**파손 범위:** D-115 NCL 4항목은 모든 영수증 동일 schema 강제. Sage special path는 schema fork → "영수증 형식 다중화" 시작. 본 세션에서 동결 안 하면 P4(NCL hook 신설 토픽)에서 ad-hoc 결정. D-119 Zero "violation flag direct read 차단"과 정합성도 미검증.

**mitigation:** 본 세션 dispatch_config.json 스키마에 `sage.ncl_emission: { allowed: false, exception: null }` 박제. 즉 **Sage NCL 영수증 produce 금지 동결** (Master 4문답 "NCL 평가 미관여" 강화). Sage 자기 발언은 self-scores YAML만으로 추적, NCL append 면제. 후속 P4 토픽에서 변경 시 D-126 supersede 명시.

**fallback:** spec 미동결 → P4 토픽 진입 전 본 결정 보류. spc_lck=N 강제.

---

### 🟢 (기각) R-x 후보. 권한 매트릭스 escalate 4축 redundancy

Arki §2 escalate 4축 중복은 의도된 redundancy. NIST SP 800-160 Defense in Depth 정합. **반대를 위한 반대 금지(메모리)** — 결정에 영향 없는 곁가지 폐기.

### 🟢 (기각) R-y 후보. 외부 anchor 3건 인용 적정성

NIST RBAC SoD / NIST SP 800-160 / Goodhart 모두 본문 주장과 정합. anchor governance 검증은 Edi 책임(D-125) — Riki 영역 외.

### 🟢 (기각) R-z 후보. Deliverable 6파일 의존 그래프 순환

Phase 1→2→3→4 단방향, 순환 없음. 검증 통과.

---

## 2. Master 2축 단일 권고

### 축 A: Sage = "정합성 검증" 단일 권고

**근거:**
- D-092(자가평가 단순화) 단일 출처 = self-scores YAML + metrics_registry. Sage가 "평가 대체"로 가면 자가채점 폐기 → D-092 거꾸로 감김.
- Goodhart's Law (Strathern 1997 정식화, Strathern M., "Improving ratings: audit in the British University system", *European Review* 5:305–321) — Sage 점수가 dispatch 가중치에 자동 반영되면 페르소나 점수 게이밍. **외부 anchor #1**.
- Top 0.1% 자가평가 신뢰(메모리: feedback_self_assessment_top_01pct_trust). 자가채점 자체가 가치 산출원, Sage는 cross-check 보조.
- D-060(성장 정의 토픽 누적 학습) 정합 — Sage는 누적 read-only 분석가, 채점자 아님.
- "어중간한 절충안 금지"(메모리: feedback_no_middle_ground) — Master 답변 4번 "정합성 cross-check"이 명시. 그대로 단일안.

**권고:** Sage = self-scores YAML 유지 + cross-check 전담. 평가 대체 옵션 폐기. dispatch_config `sage.scoring_role: "cross_check_only"` 박제.

**외부 anchor #1:** Strathern, M. (1997). "Improving ratings: audit in the British University system." *European Review* 5(3):305–321. Goodhart's Law 정식화 — 측정이 목표가 되면 측정 가치 상실.

---

### 축 B: 차단 hook (실시간 reject) 단일 권고 — **단, 별도 파일 분리**

**근거:**
- D4(모델 설득 무력화 전제) prime directive — 사후 격리(축 B-2)는 정의상 D4 위반. "이미 발화된 후 격리"는 모델 자율 판단으로 발화한 결과를 사후 청소하는 패턴 = D4가 막으려는 그것.
- R-2 mitigation (a)와 정합. permissionDecision 미가용은 별도 hook + process.exit(2) + stderr 패턴으로 우회 가능 (현 hook v3 패턴). false-positive 위험은 G3 dry-run으로 통제.
- 비용: 별도 hook 신설 1파일 + dispatch_config 스키마 1필드. Phase 3 deliverable 1건 추가만으로 D4 강도 유지.
- false-negative > false-positive trade-off — Sage exclusive 세션을 1번 놓치면 echo chamber 회귀 + NCL 평가 권한 누수. false-positive(정상 호출 reject)는 hook 비활성화로 즉시 회복 가능. **회복 비대칭** 고려 시 차단 우선.
- NIST SP 800-160 Vol.2 Defense in Depth — 단일 enforcement point 의존 금지. 차단 hook + 마커 prepend + 페르소나 본문 = 3중. **외부 anchor #2**.

**권고:** `.claude/hooks/pre-tool-use-task-sage-gate.js` 별도 신설. 본체 `pre-tool-use-task.js`는 미수정(R-3 false-positive 차단 + D-103 인프라 보호). gate hook은 process.exit(2) + stderr 메시지로 차단. permissionDecision 미가용 환경 호환.

**외부 anchor #2:** NIST SP 800-160 Vol.2 Rev.1 (Dec 2021), §3.2 "Defense in Depth" — multiple independent layers, single layer compromise tolerance.

---

## 3. 자기 한계 정직 박제 (PD-052 동형)

- 본 감사는 `.claude/hooks/pre-tool-use-task.js` 본체만 read. **별도 hook 분리(R-2 mitigation a) 가용성 검증 미수행** — process.exit(2) 패턴이 현 v3 환경에서 실제 차단되는지 dry-run 미실행. Dev turn 또는 후속 검증 필요.
- Goodhart's Law 인용은 Strathern 1997 보유 메모리 기반. 원문 페이지 직접 verification 미수행 — Edi anchor governance(D-125)에서 cross-check 위임.
- D-115·D-119·D-125 정합성 검토는 ledger 본문 직접 read 미수행, 본 세션 컨텍스트 prepend된 Edi s141 요약 의존. 적대적 컨텍스트 전제(D1) 위반 위험 정직 자백 — Edi turn에서 ledger 직접 cross-check 의무 박제 권고.
- R-1(자기참조 paradox)는 본 세션 deliverable에서 완전 해소 불가 — 후속 토픽 분리가 정직한 답. 본 감사가 "해결책 제시"로 보이면 안 됨.

---

## 4. 본 세션 적용 권고 요약

| 항목 | 권고 | 근거 R-N |
|---|---|---|
| Phase 3 deliverable G | **별도 hook 분리** 강행 (`pre-tool-use-task-sage-gate.js`) | R-2, R-4 |
| dispatch_config 스키마 | `ace_reject_requires_reason: true` + `sage.ncl_emission.allowed: false` + `sage.scoring_role: "cross_check_only"` 추가 | R-3, R-5, 축 A |
| D-126 본문 caveat | "R-1 자기참조 paradox 미해결, 후속 토픽 분리" 명시 | R-1 |
| G3 dry-run 기준 | log phase 검사로만 판정, LLM 발언 판정 금지 | R-4 |
| spc_lck | 위 4건 반영 후 Arki rev3에서 spc_lck=Y 가능 | — |

**CONDITIONAL PASS** — 위 4건 반영 시 본 세션 deliverable 6파일 진행 OK.

---

RIKI_WRITE_DONE: reports/2026-04-29_big-bang-legend-nexus-p2-1of3/riki_rev2.md

[ROLE:riki]
# self-scores
crt_rcl: Y
cr_val: 4
prd_rej: Y
fp_rt: 0.15
