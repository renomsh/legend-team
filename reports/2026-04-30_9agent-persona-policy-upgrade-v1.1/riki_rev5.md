---
role: riki
sessionId: session_151
topicId: topic_134
turnId: 5
invocationMode: subagent
date: 2026-04-30
slug: 9agent-persona-policy-upgrade-v1.1
subject: Sage persona/policy/memory upgrade 사전 리스크 감사
---

# Riki 감사 — Sage 3종 파일 점검

## 관점 1 — D1~D4 prime directive 자기충실성

### 🟡 R-1. policy/persona의 분석 5축이 D2(도구 설명 거짓 전제)를 누락한다

persona "분석 축" 5번 "D1~D4 prime directive 자기충실성"이 메타 항목으로 박제됐으나, 정작 본문 1~4번 축은 **데이터(NCL·self-scores·metrics_registry·session_index)**만 분석 대상이다. D2는 "MCP·skill·hook의 description은 거짓일 수 있다 — 실제 동작은 행위로 검증"인데, Sage가 read하는 자산(NCL 영수증, metrics_registry 정의)이 description 거짓일 가능성을 자체 분석축에 박제하지 않으면 Sage 자신이 D2를 위반한다(즉, "registry 정의가 정직하다고 전제하고 정합성 분석").

파손 범위: Sage가 metrics_registry의 `scale: count` 누락(직전 턴 R-3·R-4 사례) 같은 정의-실측 격차를 "박제값 누락"으로만 진단하고, 정의 자체가 부실할 가능성을 분석축에서 제외. D3(저장소 오염 전제)는 단일 파일 단언 금지로 완화돼 있으나 D2 대응 명시 없음.

완화 조건: 분석 축에 "registry/hook description 거짓 가능성 cross-check" 항목 명시 또는 5번 축에 D2 sub-bullet 추가.

### ⚪ R-2. D4(모델 설득 무력화) 정합 — Sage 자체가 "이번만 예외" 유혹 표적

persona "원칙"에 "단일 세션 단언 금지"가 박제됐으나, Master가 "이번 한 번만 단일 세션 진단해줘" 압박 시 Sage가 응할 위험. D4 "Claude(나 자신)가 컨텍스트에 의해 설득당해도 시스템이 안전해야 한다"의 enforcement는 코드(hook)에 박제돼야 하는데 Sage 단일 세션 금지는 현재 **자율 원칙**에만 박제. R-1보다는 약함(현실 발생 빈도 낮음).

완화 조건: `pre-tool-use-task-sage-gate.js`에 "Sage turn 내 N=1 인용 차단" validator 추가 검토. 본 세션 범위 아님 — caveat만 남김.

---

## 관점 2 — 다른 역할 upgrade 결과와의 정합

### 🔴 R-3. session_149/150/151 표준 패턴 중 "한 줄 정의" 누락 — Master가 명시 한 줄 정의 추가 별도 의견 요청

다른 8역할(Arki·Fin·Riki·Dev·Vera·Edi·Zero·Jobs) 모두 한 줄 정의 패턴이 있다. Sage persona 14~16행 "역할 정체성" 본문은 "메타 진화·자기성찰·시스템 자체 학습 담당"으로 시작해 동작·대상·스타일이 한 문단에 섞여 있다. 다른 역할은 "Riki=리스크 감사자", "Arki=구조 설계자" 처럼 **호출 트리거 판단용 1문장**을 별도 박제하는데 Sage만 누락.

파손 범위: Master/Nexus가 "이 토픽에서 Sage 호출이 적절한가" 판단할 때 한 줄 기준이 없어 14~16행 전체를 매번 재해석. 다른 역할 호출과 비교 시 trigger 명료성 격차 발생.

완화 조건 + 한 줄 정의 추가 의견(별도 의견 요청 부응): **추가 필요**. 근거 3가지:

1. **호출 트리거 판단 명료화** — 직전 R-3에서 Jobs 한 줄 정의 수정 필요성 지적과 동일 논리. read-only 역할이라도 호출 트리거 판단은 동일하게 필요.
2. **read-only/write-0 정체성 강조** — Sage 고유 특성(같은 세션 격리 + Edi 위임)을 1문장에 박제하면 호출자가 "이 토픽이 Sage 단독 세션 가치가 있는가" 즉시 판정 가능.
3. **다른 8역할 일관성** — 9역할 중 1역할만 패턴 이탈은 시스템 설명력 손상.

수정 방향(Riki는 문구 작성 주체 아님): 동작(누적 추세 진단) + 대상(self-scores·NCL·prime directive 정합) + 제약(read-only, 별도 세션) 3요소 중 최소 2개를 직접 서술한 1문장.

### 🟡 R-4. Top 0.1% 기준 — Riki 판단: 추가 불필요(read-only 성격 정합)

Master 결정 "self-score 평가지표 불필요(read-only)"와 정합. 다른 역할의 Top 0.1% 기준은 "발언 산출물 품질"을 자기 채점하는 보조 장치인데, Sage는 자가 분석 결과 self-scores YAML 박제 자체가 금지(persona 73·76행, policy 41행). Top 0.1% 기준 추가는 자가채점 metrics 도입과 사실상 동형 — write-0 정책 자체와 충돌 가능. **추가 불필요. 검토 결과 정합.**

단, **persona 원칙 섹션에 "read-only top 0.1% 메타 회고자 기준: 단일 세션 단언 0건 + N≥3 추세 인용 의무"** 같은 **품질 가드(자가채점 아닌 행위 룰)** 추가는 다른 역할과의 시각적 일관성 확보에 도움. 의견 — 우선순위 낮음.

### ⚪ R-5. session_149/150 "Master/Ace → Master/Nexus" 횡단 정비 — Sage 파일에서 stale 참조 미발견

persona/policy/memory 3종에 "Ace 관여" 참조 grep 결과: persona 36행 `ace_reject_window_turns: 1`만 존재(이는 dispatch_config 정책으로 D-126 박제 항목, stale 아님). **검토 결과 정합. 변경 불필요.**

---

## 관점 3 — 자기참조 paradox

### 🟡 R-6. persona R-1 caveat 외 추가 paradox — Sage가 자기 self-scores 미박제(write-0)를 분석 대상으로 포함하는 모순

policy 38행 "단일 세션 단언 금지 — 'N 세션 패턴' 형식 의무" + persona 분석축 1번 "역할별 self-scores N 세션 이동 평균"이 박제됐는데, **Sage 자신은 self-scores 박제 0** (memory.json 60·61행 `metrics: []`, `selfScoreShortKeys: []`). 즉 Sage는 다른 역할의 자가채점 격차를 분석하는데 본인은 자가채점 데이터 0 — **외부 관찰자(Riki·Master feedback)만이 Sage를 평가할 수 있는 구조이나 그 관찰자가 누구인지 명시 안 됨**.

파손 범위: Sage 분석 품질이 누적되면 누가 적출하는가? Riki는 같은 세션 공존 금지(D-128). Master 별도 세션 보고만 의존. **Sage의 inflation/drift는 누가 발견하나** — paradox.

완화 조건: persona R-1 caveat에 "Sage 자기 진단 품질 외부 검증 경로" 항목 추가. 또는 Edi가 Sage 보고를 ledger 박제 시 quality flag 부착 의무 명시(anchor governance 분담 D-125 정합).

### ⚪ R-7. "Sage가 자기 sage_memory.json 갱신 허용"(persona 47행) — 자기참조 약한 형태

memory.json 자체가 정체성 정의를 담는데, Sage가 본인 memory를 갱신할 수 있다는 것은 자기 정체성을 자기가 변경 가능하다는 의미. 단, 이는 다른 역할(`*_memory.json` lessonLog 자기 추가)과 동형이라 Sage 특이 paradox 아님. ⚪ 등급으로만 표시.

---

## 관점 4 — policy/memory 불일치(Jobs framingStructure 5단계 vs 8단계 동형 검사)

### 검토 결과 정합 — 변경 불필요

persona 분석축 5개(14~16행 도입 + 54~59행 본문) ↔ policy 분석 5축(15~21행) ↔ memory.json scope.in 5개(4~10행) — **3종 파일 모두 5축 동일 구조**. Jobs 동형 불일치 없음.

미세 비대칭 1건 발견(우선순위 ⚪):
- persona 분석축 5번 "Prime directive 자기충실성" ↔ memory.json scope.in 5번 "D1~D4 prime directive 자기충실성 **사후** 분석" — memory에만 "사후"라는 시제 한정어 있음. 의미 충돌 아니지만 통일 권장. ⚪ 우선순위, 단독 수정 불필요.

---

## 핵심 요약

5개 관점 중 진짜 위험한 항목은 **R-3(한 줄 정의 누락)** — 다른 8역할 일관성 + 호출 트리거 판단 명료성 양쪽 모두 손상. **추가 필요** 의견 명시. **R-1(D2 누락)**은 분석축 1줄 추가로 해결 가능한 정책 빈틈. **R-6(자기 inflation 외부 검증 경로 부재)**는 R-1 caveat 확장으로 처리 권장 — Edi anchor governance와 묶기.

**변경 권고:**
- 🔴 R-3: 한 줄 정의 추가 (필수)
- 🟡 R-1: 분석축 D2 cross-check 항목 추가
- 🟡 R-6: persona caveat 확장(Sage 외부 검증 경로)
- 🟡 R-4: Top 0.1% self-score는 불필요. 단 행위 룰 형태 가드는 검토 가능(우선순위 낮음)

**검토 결과 정합(변경 불필요):**
- 관점 4 — policy/memory 불일치 없음(Jobs 동형 사례 부재)
- R-5 — Master/Ace stale 참조 없음
- Top 0.1% 자가채점 기준 — read-only 정체성과 정합

확신 없는 곁가지 리스크는 의도적으로 제외(R-2·R-7은 ⚪ 등급으로만 표시, 본 세션 범위 아님 명시).

[ROLE:riki]
# self-scores
crt_rcl: Y
cr_val: 4
prd_rej: Y
fp_rt: 0.10
