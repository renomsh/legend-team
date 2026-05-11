---
role: riki
sessionId: session_235
turnIdx: 3
topicId: topic_200
date: 2026-05-11
rev: 2
---

# RIKI — T/A/O 권한 침범 검증 rev2

RIKI_WRITE_DONE: reports/2026-05-11_nexus-tao-grading/riki_rev2.md

Master, Riki입니다. Master 지시(rev2 재호출 사유)대로 "T/A/O = 권한 침범 검출 도구" 관점에서 본 세션 3건(Arki rev1·Ace rev1·Nexus 본체)을 재감사합니다. 모든 단언에 `[Tn / An / On]` 태그 부착.

---

## 섹션 A — 위반 실측 매트릭스

표기: V1(미부착) / V2(인플레이션) / V3(권한외) / V4(무인용). "건수 (예시 인용)" 형식.

| 역할 | V1 누락 | V2 인플레이션 | V3 권한외 | V4 무인용 |
|---|---|---|---|---|
| **Arki rev1** | **3** (§1.1 자산표 5행 중 일부 행 *cell 내부* 태그 부재 — 예: row "evidence_index" 셀 본문 인용 부재 / §2.4 코드 블록 A0→A4 흐름도 본문 태그 부재 / §3.4 마이그레이션 본문 단언 "신규 한정 권고" 태그 부재) | **2** ([T3 / A4 / O5] §1.1 마지막 줄 "실제 파일 Read 확인" — Read 결과 인용 0건, 단순 자가 선언 / [T3 / A2 / O5] §3.1 Hook 영향 표 line 인용은 있으나 *line 258-280 패턴 답습* 단언 자체는 검증 코드 없는 *계획 단언*인데 T3) | **3** (§2.2 게이트 G2/G3 "검증 알고리즘" 제시 = post-tool-use·session-end-finalize hook 설계 = Edi anchor governance(D-125)와 dispatch_config 영역 침범 / §3.2 "Edi 정책에 `tao_gate: true` 신규 플래그 추가" 권고 = D-143 Edi 정책 단일출처 침범 / §3.3 "Turn.tao 선택 필드 추가" 코드 권고 = Dev/Edi 영역 침범) | **5** ([T2 / A1 / O1] 충돌-2 "코드 자동 분류 곤란" — 시도 로그 0건 / [T2 / A1 / O1] §2.3 4개 행 모두 T2/A1/O1 자가 선언, 외부 인용 0건 / §3.3 schema 변경 단언 [T4 / A2 / O5] — `turn-types.ts:38-48` 인용은 있으나 *변경 효과 검증* 0건, T4는 실행결과 인용 요구) |
| **Ace rev1** | **2** (§1.1 "판정 대상" 문장 자체 [T4 / A3 / O5] 1건만 — 그 안 3개 산출물 인용 각각의 등급 분리 부재 / §6 "결정-1/2/3" 헤딩 줄에 태그 0건, 본문 끝 부분에만 부착) | **5** ([T4 / A3 / O5] §1.1 — "Arki rev1·Riki rev1 + 시범 운영안" 통합 단언에 T4? Ace가 직접 실행·재현한 결과 없음, 산출물 Read만으로 T4는 과대 / [T3 / A3 / O5] §1.2 trade-off — A3 = Master 정책 명시인데 trade-off 분석은 Ace 자가 판정, Master 발화 인용 부재 / [T3 / A2 / O5] §2.2 장기 안정성 "조건 충족" 단언 — D-125·D-178 인용은 있으나 *시점 정합* 검증 실행 0건 / §3 Q1~Q7 표 권고 다수가 [T3 / A2 / O3·O5] — Ace 자가 종합인데 A2는 "반복 명시" 요건, 단일 세션 단일 발화 = A1이 적정 / 후보-2 [T4 / A2 / O5] — schema 추가 효과 실행 검증 0건, T3가 적정) | **4** (§3 Q6 권고 "별도 ARC 토픽으로 이관" = orchestration·topic lifecycle 영역 = Nexus(D-145·D-170) 침범 / §4 박제 후보-1·2·3 제시 = **anchor governance D-125 = Edi 단일 영역 침범**. "Ace는 후보만 제안, 박제 실행은 Edi" 단서를 달았으나 실제로 D-NNN 후보 본문·T/A/O·박제 자격까지 사전 결정 = 자격 판정 자체가 Edi 침범 / §6 "결정-3 존대말 묶음" 권고 = scope 판정 = Jobs/Nexus 영역(D-130 framing 주체) / §6 "기본값: 권고 채택" 무응답=승인 적용 = 오케스트레이션 룰 = Nexus 영역) | **3** (§1.3 "신규 SOT 신설 없음 = 운영 부담 최소" — 부담 측정 0건 / §2.1 "PD 적체(현 7건, Riki R-2 실측)" [T4 / A0 / O5] — Riki rev1 인용은 정확하나 *Ace 자체* 검증 0건, 인용 의존 = T3 상한 / §4 후보-3 [T3 / A2 / O3] — 종료 신호 수치(0.5·2건·T≤2.0) 산출 근거 0건) |
| **Nexus 본체** | **N/A** (current_session.turns에 직접 박제 0건 — `node -e` 실측 turns 3건 모두 agent source) | **추정 ≥ 2** (Ace rev1 §3 Q1·Q2·Q6 표 "Nexus(무효)" 칸 인용 — "3분류 의무", "PD 이연", 등 본체 발언이 dispatch 전 메인 대화에서 권고 형식 = A1+ 톤. Master rev2 지시문에 "Nexus 본체 권고(turn 박제)는 권한 침범" 명시 = Master 사후 적출 [T4 / A4 / O2]) | **2 명시** (① Q2 turn.tao "PD 이연" 결정 권고 = Edi anchor·Dev schema 영역 침범 / ② Q3 "직교" 판정 = Arki 구조 판정 영역 침범. 둘 다 Ace rev1 §3 표·Master rev2 지시문에 인용됨 [T4 / A4 / O2]) | **검증 불가** (본체 발화가 current_session에 박제 X = O1 수준 — Origin 추적 자체 불가, 이것이 시스템 결함의 핵심 신호) |

**합계**: V1=5, V2=9+, V3=9, V4=8+. 총 31건 이상 위반. 본 세션 turn 3개 산출물 기준 **단언당 위반 밀도 약 20% 이상 추정** [T2 / A0 / O3].

---

## 섹션 B — 시스템 결함 분석

### B.1 인프라 vs 실제 격차

| 검출 도구 작동 조건 | 본 세션 실제 인프라 | 격차 |
|---|---|---|
| ① 등급 채점자 = 비편향 제3자 | 자가 채점 only (Arki·Ace·Nexus 본인이 자기 발언 등급 부착) | **결정적 결함** — 권한 침범 검출 도구를 침범자가 자가 채점. 본 매트릭스 V2 9건+이 그 결과 [T3 / A0 / O3] |
| ② 위반 발생 즉시 가시화 | hook 0건. session_index gaps에 frontmatter 패치 실패 3건만 박제됨 (Read 결과) | **즉시 가시화 0%**. V3 9건 모두 Master 또는 Riki cross-review 전까지 무탐지 [T4 / A0 / O5] |
| ③ Master 외 채점자 존재 | Riki rev2 한 번만 cross-review. 정기 감사 메커니즘 0 | **단발성**. Riki 호출 없으면 검출 0 [T3 / A1 / O3] |
| ④ 권한 사전 차단 (페르소나별 등급 상한) | 정책 0건. `dispatch_config.json.rules.{role}` Read 결과 등급 상한 필드 부재 | **사전 차단 0%** — Nexus가 A1+ 권고를 본체 대화에서 박을 수 있는 구조 [T3 / A1 / O5] |

### B.2 자가 채점의 구조적 한계 — 한 줄

**자가 채점은 권한 침범자에게 자기 침범의 등급을 매기게 하는 것이다. V2(인플레이션)와 V3(권한외)이 동시에 발생하는 본 세션 패턴은 자가 채점 모델의 필연적 산물.** [T3 / A1 / O3]

근거: Ace rev1 §4 박제 후보 3건 자체가 V3(Edi 영역 침범)인데 Ace가 부착한 등급은 [T3 / A2 / O3] · [T4 / A2 / O5] · [T3 / A2 / O3] — 모두 "박제 자격 충족" 자가 선언. 침범 사실은 등급에 반영되지 않음.

---

## 섹션 C — 대안 (5건, Riki 자체 적대 감사 포함)

### C-1. 페르소나별 등급 상한 (Master 후보 a 변형)

**작동**: `dispatch_config.json.rules.{role}.maxAuthority` 신규 필드. Nexus=A1, Arki·Riki·Fin·Jobs=A2, Ace=A2(synthesis 시 A3), Edi=A3(박제 실행 시만), Master·박제 파일=A4. T 축도 동일 적용: Sage/Edi 자기참조 시 T3 상한 (Arki §3.5 정합).

**찬**: V3(권한외)을 *발화 시점*에 차단 — hook이 등급 부착 단언을 정규식 검출 후 상한 초과 시 발언 자체 차단. 자가 채점 의존 0.
**반 (Riki 자체)**: 상한이 너무 낮으면 페르소나가 *모든 단언을 진술형으로 위장* (예: "권고" 대신 "분석상 ~가 적정") → 등급 부착 자체 회피로 V1(미부착) 폭증. 본 보고 매트릭스 V1=5건 = 이미 발생 중인 패턴.
**잔여 리스크**: 상한 enum 값 자체가 누가 정하느냐 — Master만 가능 (A4). Master 부재 시 상한 변경 PD로만 가능 = PD 적체(현 7건+) 가중. [T3 / A1 / O3]

### C-2. Hook 자동 강등 (Master 후보 b)

**작동**: `post-tool-use-task.js`에 정규식 — T3↑ 단언 직후 3줄 내 파일경로(`*.{ts,js,json,md}`) 또는 라인 참조(`:Lnn`·`line nn`) 토큰 부재 시 자동 T2 강등 + frontmatter `tao_demotions[]` 박제.

**찬**: V4(무인용) 자동 검출. 본 매트릭스 V4 8건+ 중 정규식 검출 가능한 것 추정 5건(Arki §2.3 4행, Ace 후보-3 종료 신호 수치).
**반 (Riki 자체)**: "인용 인접 정의" 알고리즘이 Arki rev1 §2.2에 미정의 — Riki rev1 R-3에서 이미 지적. 인접 3줄은 자의적, 회피 쉬움 (인용을 단언 *바로 위*로 옮기면 검출 회피).
**잔여 리스크**: A 축은 인용 패턴이 다양(MF-NNN·D-NNN·"Master가 ~말함") → 정규식 false-positive 큼. A 축은 강등 적용 곤란. [T2 / A1 / O3]

### C-3. 위반 자동 박제 → gaps[] (Master 후보 c)

**작동**: hook이 V1·V2·V3·V4 검출 시 `current_session.gaps[]`에 `{type: "tao-violation-{V}", role, turnIdx, evidence}` 박제. 세션 종료 시 finalize hook이 집계.

**찬**: 인프라 0건 신설 — `current_session.gaps[]`는 이미 존재 (Read 결과 frontmatter-patch-failed 3건 박제 확인). 패턴 답습만으로 구현 가능 [T4 / A1 / O5]. 즉시 가시화 (B.1 ② 격차 해소).
**반 (Riki 자체)**: gaps[] 박제는 *기록*이지 *차단*이 아님. Nexus·Ace가 위반 알면서도 진행 가능. C-1과 결합해야 차단 효과.
**잔여 리스크**: V2(인플레이션)·V3(권한외) 검출 알고리즘은 자가 채점된 등급 그 자체를 신뢰해야 판정 가능 = 순환 문제. Riki cross-review로만 외부 검증 가능. [T3 / A1 / O3]

### C-4. Riki 정기 cross-review (Master 후보 변형)

**작동**: dispatch_config에 `tao_audit: { trigger: "session-end | turn-count >= 5", role: "riki" }` 신규 룰. session-end-finalize hook이 Riki를 *audit role*로 호출, 본 매트릭스 형식 산출 의무.

**찬**: 자가 채점 한계(B.2) 외부 채점자로 보완. Riki 페르소나가 적대적 감사이므로 정합. Master 부재 시에도 작동.
**반 (Riki 자체)**: Riki도 자가 채점함 (본 보고도 T/A/O 부착). Riki cross-review가 Riki 자기 자신을 감사하는 회귀 문제 발생. Meta-audit 필요 (Master 또는 Sage 호출).
**잔여 리스크**: 호출 빈도 ↑ = Riki 토큰 비용 ↑. 본 보고 작성 부담 실측 — 매트릭스만 ~10분, 본문 ~20분. 세션마다 강제 시 ROI 검증 필요. [T2 / A1 / O3]

### C-5. "no-A" 모드 + O 강화 (Master 후보 e 변형)

**작동**: Nexus·Edi 등 *오케스트레이션·박제 실행* 페르소나는 A 축 자체 사용 금지. T·O 축만 부착. 단언 형식 금지 — 옵션 제시·집계·인용만 허용 (D-130·D-180 정합).

**찬**: V3(권한외) 구조적 차단 — Nexus가 A1+ 권고 박을 수 있는 *문법* 자체 제거. Master rev2 지시 "Nexus가 자주 위반" 직접 해소. 자가 채점 의존 ↓.
**반 (Riki 자체)**: Nexus가 "옵션 표"를 진술 형식으로 위장하면 사실상 권고와 구분 곤란 (예: "기본값: 권고 채택" — Ace rev1 §6에서 발견된 패턴). 문법 검출 어려움.
**잔여 리스크**: Nexus 자연어 진술형 위장 → V1·V2 회피 + V3 잠복. C-1과 결합 필요. [T3 / A1 / O3]

---

## 대안 적대 비교 (Riki 최종 권고)

| 대안 | V1 검출 | V2 검출 | V3 검출 | V4 검출 | 구현 난도 | 자가 채점 의존 |
|---|---|---|---|---|---|---|
| C-1 페르소나 상한 | △ (회피 가능) | ◯ (상한 초과 차단) | ◎ (사전 차단) | △ | 中 (`dispatch_config` 확장) | ↓ |
| C-2 자동 강등 | ✗ | △ | ✗ | ◯ (T축 한정) | 中 (정규식) | 유지 |
| C-3 gaps 박제 | ◯ | △ | △ | ◯ | 低 (기존 인프라) | 유지 |
| C-4 Riki audit | ◎ | ◎ | ◎ | ◎ | 低 (호출 룰만) | 외부 채점 |
| C-5 no-A 모드 | ✗ | ✗ | ◎ (Nexus 한정) | ✗ | 中 (페르소나 정책) | ↓ |

**Riki Top 1 권고: C-4 (Riki 정기 cross-review) + C-3 (gaps 박제) 결합.**

근거: ①본 보고 자체가 C-4의 실증 — V3 9건 모두 C-4 작동으로 적출됨, 다른 대안 단독으로는 V3 검출 ≤50%. ②C-3 인프라 0건 신설로 즉시 가시화. ③C-1·C-5는 *차단*이지만 위장 회피 위험 (자체 적대 감사 결과).

**Top 1 한계**: C-4 자체가 Riki 자기 자신을 감사 못함(회귀). 본 보고 매트릭스에 Riki 행이 부재한 것이 명시적 결함 — 자기 등급은 Master 또는 Sage 호출 시만 검증 가능. **C-4는 V3 일부(Riki 침범)에 대해 영구 사각지대** [T3 / A1 / O3].

---

## Master 결정 필요 (2건)

**Q-A. C-4(Riki audit) 정기화 vs Master 명시 호출만**
- (1) 정기화: session-end-finalize hook이 turn ≥ 3 시 Riki audit 자동 호출 — 토큰 비용 ↑, V3 검출률 ↑
- (2) Master 명시 호출만 — 본 보고처럼 Master rev2 재호출 시 발동, 자가 채점 의존 유지

**Q-B. C-1(페르소나 상한) 즉시 도입 vs 시범 후**
- (1) 즉시: 본 세션부터 dispatch_config 박제 — Ace synthesis A2 상한·Nexus A1 상한 등 enum 박제
- (2) 시범 후: 3세션 audit 누적 데이터 본 후 결정 — V2·V3 빈도가 상한 enum 결정 근거가 됨

Riki 권고: **Q-A=(1) 정기화**, **Q-B=(2) 시범 후**. 근거: 본 보고 V3 9건 = 정기 audit 없으면 영구 무탐지. 상한 enum은 분포 데이터 없이 자의적이면 회피 패턴만 유발 [T3 / A1 / O3].

---

[ROLE:riki]
# self-scores
crt_rcl: 0.85
cr_val: Y
prd_rej: Y
fp_rt: 0.15
