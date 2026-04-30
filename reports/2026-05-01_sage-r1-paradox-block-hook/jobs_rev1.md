---
role: jobs
topic: topic_135
session: session_152
rev: 1
date: 2026-05-01
turnId: 2
invocationMode: subagent
parentTopicId: topic_131
grade: B
---

# Jobs — Sage R-1 결정 프레임 설계

JOBS_WRITE_DONE: reports/2026-05-01_sage-r1-paradox-block-hook/jobs_rev1.md

---

## §1 인지편향 적출

**편향 1: 보안극대화 편향 (Security Theater Bias) — Arki + Riki 공통**

"막을 수 있는 것은 최대한 막아야 한다"는 전제가 분석 전반에 깔려 있다. Phase 1~3를 순차 층위로 쌓는 구조 자체가 이 전제를 반영한다. 그러나 이 시스템의 실제 위협 모델은 **악의적 외부 공격자가 아니라 role 정책을 인식하지 못한 모델 자신**이다. 공격자 상정 프레임은 실제 위협 모델과 불일치.

**편향 2: 완결 편향 (Completeness Bias) — Arki**

Phase 3(PostToolUse 재검증 hook)는 "차단이 아닌 경보"인데도 별도 파일·hook 등록까지 권고한다. 차단 효과 없는 경보용 hook에 SRP 논거를 붙이는 것은 완결성을 위한 과설계다. Riki가 이를 기각한 것은 맞다.

**편향 3: 마커 위조 = 악의적 공격자 등치 (Frame Collapse) — Riki R-3**

이것이 이번 발언에서 가장 중요하게 짚어야 할 편향이다. 후술 §4에서 집중 처리.

---

## §2 결정축 단일화

**Master가 이 토픽에서 실제로 결정해야 하는 것은 하나다:**

> **Phase 2 마커↔subagent_type 불일치 시 — 차단(process.exit(2))인가, 경보(log only)인가?**

Phase 1(KNOWN_ROLES 추가)은 결정 사항이 아니다. Riki가 "BLOCK"으로 판정했고 Arki 실행계획도 Phase 1을 전제조건으로 명시했다. **즉시 수행**이며 Master 승인을 기다릴 이유 없다.

Phase 3는 Riki가 기각했고 Arki도 "선택적"으로 분류했다. **스코프 밖.**

Master가 결정해야 하는 것은 Phase 2 단 하나. 나머지는 구현팀 판단으로 충분하다.

---

## §3 범위 적출

**IN (해야 하는 것)**
- `post-tool-use-task.js` KNOWN_ROLES에 `sage`, `zero`, `vera`, `jobs` 추가 → 즉시
- sage-gate에 `## ROLE: sage` AND `subagent_type: role-sage` 이중 검증 추가
- Phase 2 불일치 시 동작 결정 (차단 vs 경보) — Master 결정 사항
- role-sage.md caveat에 "케이스 C는 hook 불가 — 정책 박제로 봉인" 명시

**OUT (하지 않아야 하는 것)**
- Phase 3 PostToolUse별도 hook 신설 — 차단 효과 없는 경보에 hook 파일 추가 불필요
- KNOWN_ROLES 상수 모듈화 — OI-4 DEFER 유지. 3파일 동기화 체크리스트 항목 삽입으로 충분
- dispatch_config `sage.self_analysis_target_allowed` 신설 — OI-2 불필요, prompt 내용 검사 false positive 高
- 케이스 C(컨텐츠 레벨 자기참조) hook 구현 시도 — LLM 판단 영역, hook 차단 불가

---

## §4 Riki R-3 검토 — 차단 vs 경보

**Riki의 프레임:** "마커 위조 = 악의적 호출 → 차단"

이 프레임의 전제를 짚어야 한다.

**실제 위협 모델 재확인**

이 시스템에서 마커 위조가 발생하는 경로는 두 가지다:

1. **외부 공격자가 의도적으로 위조** — D1 Prime Directive가 상정하는 악의적 입력
2. **모델 자신이 prompt 생성 시 마커와 subagent_type을 불일치 생성** — role 정책 인식 오류, 의도적 위조 아님

Sage 차단의 목적은 "같은 세션에 Sage + 다른 역할 공존 금지"(D-128)다. 외부 공격자가 sage-gate를 우회해서 얻는 이득은 무엇인가? **Sage 세션을 오염시켜 분석 신뢰도를 떨어뜨리는 것**이다. 그런데 이 공격이 성립하려면 이미 LLM이 Sage 역할을 수행하고 있는 상태여야 한다.

**핵심 판단**

마커 위조는 악의적 공격보다 **모델 생성 오류**에 가깝다. 이 경우:
- 차단(process.exit(2)) → 시스템이 멈춤. 정상 작업 불가.
- 경보(log only) → 불일치 기록되고 진행. Sage 발언 내용으로 실질 판단.

그러나 Riki의 결론 방향은 맞다. 단, 논거가 다르다:

"마커 위조 = 악의적 공격"이 아니라 **"이중 검증 불일치는 dispatch 규약 위반이며 dispatch 규약 위반 호출은 설계 오류다 — 설계 오류는 차단이 맞다."**

dispatch 규약(CLAUDE.md Agent dispatch §규약)에서 `## ROLE: sage` + `subagent_type: role-sage`는 정상 호출의 정의다. 한쪽이 불일치하는 호출은 **애초에 올바른 Sage 호출이 아니다**. 올바른 Sage 호출이 아닌 것을 차단하는 것은 보안 조치가 아니라 **계약 준수 강제**다.

이 프레임이면 경보 vs 차단 논쟁이 단순해진다:
- 계약에 맞지 않는 호출 → 차단
- 계약에 맞는 호출 → 통과

false positive 우려(Arki OI-1)는 "계약에 맞는 정상 Sage 호출이 불일치를 만드는 경로가 있는가"로 환원된다. dispatch 규약이 명확히 이중 일치를 정의하고 있다면 false positive는 규약 오류이므로 규약을 먼저 수정해야 한다.

**결론**: Riki 방향(차단) 지지. 논거는 "악의적 공격" 대신 "dispatch 계약 위반 = 차단"으로 교체 권고.

---

## 종합 — Master 결정 사항

단 하나:

> **Phase 2 이중 검증 불일치 시 → 차단(process.exit(2)) OR 경보(log only)?**

Jobs 권고: **차단.** dispatch 계약 위반 호출은 올바른 Sage 호출이 아니므로 통과시킬 근거 없음.

이 결정이 나면 Dev는 Phase 1 → Phase 2 순서로 즉시 구현 진입 가능.

---

[ROLE:jobs]
# self-scores
frm_clr: 5
foc_no: 4
bias_xtrc: 4
