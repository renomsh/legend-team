---
session: session_216
topic: topic_183
condensedBy: zero
date: 2026-05-09
phase: D.Condense Phase A
sourceReports:
  - reports/2026-05-09_pd-057-grade-review/jobs_rev1.md
  - reports/20260509_grade-threshold-review/nova_rev1.md
  - reports/20260509_grade-threshold-review/arki_rev1.md
  - reports/20260509_grade-threshold-review/riki_rev1.md
  - reports/20260509_grade-threshold-review/ace_rev1.md
  - reports/20260509_grade-threshold-review/nova_rev2.md
  - reports/20260509_grade-threshold-review/arki_debate_r1.md
  - reports/20260509_grade-threshold-review/riki_debate_r1.md
  - reports/20260509_grade-threshold-review/riki_debate_r2.md
  - reports/2026-05-09_topic183-grade-threshold/jobs_debate_r1.md
  - reports/2026-05-09_topic183-grade-threshold/jobs_debate_r2.md
  - reports/2026-05-09_grade-redefinition-debate/arki_rev2.md
  - reports/2026-05-09_pd-057-grade-review/ace_debate_r1.md
  - reports/2026-05-09_pd-057-grade-review/ace_debate_r2.md
---

# session_216 — PD-057 Grade 임계 재검토 (condensed)

## TL;DR — 결정 흐름

| 결정 | 내용 |
|---|---|
| C/D 통합 여부 | C 유지 + 재정의 (C 폐기 → Ace 입장 전환) |
| Grade 판정 원칙 | 결정 파급 범위 × 불확실성 × 2축 적용 여부 |
| 역할 순서 기준 | 2축(closed/open × decision/execution) 원칙+예시 4건 형태 |
| Arki 5종 subjectType | dispatch 기준으로 폐기, 사후 로그 레이블로만 허용 |
| S 로스터 | Jobs→Ace→Arki·Riki→Fin→Edi, Nova·Vera 선택 |
| Nova (S grade) | 기본 로스터 제외. 발동 조건 명문화 |
| 매트릭스 형식 | 표(완전성 착각 유발) → "판정 원칙 3줄 + 대표 예시 4건" |

---

## Jobs — blind-parallel (jobs_rev1.md)

**핵심 진단:** Grade 레이블에서 역할 순서 결정권 분리 필요. 현재는 테이블이 오케스트레이션 결정권을 대행한다.

**결정 축:**
- 축 1: C/D 통합 vs 유지 (먼저 결정 필요)
- 축 2: Grade 테이블 고정 vs Nexus 자동 판단
- 축 3: 주제 유형 분류 정밀도 (3~5종 vs 12+종)

**경고:**
- "매트릭스가 또 다른 고정 테이블" 위험
- 매트릭스 언어가 이미 수용된 프레임으로 작동 중 (framing effect)
- S 로스터에서 Nova default 포함은 "Nova는 optional" 정책과 충돌

**executionPlanMode:** conditional (C/D 통합 여부 결정 후 Arki 실행계획)

---

## Nova — blind-parallel (nova_rev1.md)

**핵심 도전:** "등급 판정 기준 외재화 = 매트릭스"라는 등식 반박

**유효 통찰:**
- C/D 구별 실효성 없음 = Grade의 단일 스칼라 정보 손실
- 역할 = lens로 설계됐는데 매트릭스는 stage로 취급 → Arki 선두 고정 마찰의 구조적 원인
- 역할 자기선언(Scenario A) 제안 — 각 역할이 relevance signal 반환

**신뢰도:**
- C/D 단일 스칼라 손실 분석: 높음
- 역할 자기선언 시나리오: 중간
- Coalition 구조: 낮음

---

## Arki — blind-parallel (arki_rev1.md)

**핵심 설계:** 5종 subjectType × Grade 직교 구조

| subjectType | 첫 주자 |
|---|---|
| strategy | Jobs |
| structure | Arki |
| risk-audit | Riki |
| cost-eval | Fin |
| explore | Jobs+Ace |

**Grade × subjectType 분리 원칙:**
- Grade = 역할 구성 (몇 개 역할)
- subjectType = 역할 호출 순서 (누가 먼저)

**C grade Arki 미호출 원인:** 자동 호출 트리거 없음 → Dev-initiated pull 방식으로 전환 권고

**스키마 변경 범위:** `current_session.json`에 `subjectType` 필드 추가, `/open` 시 Nexus 판별

---

## Riki — blind-parallel (riki_rev1.md)

**리스크 목록:**

| # | 리스크 | severity |
|---|---|---|
| R-1 | 매트릭스 분류 오판 → 역할 호출 단일 실패점 (양방향 치명) | 🔴 |
| R-2 | C/D 통합 시 Arki 없는 구조 결함 누적 (통합이 유지보다 나쁜 실패) | 🔴 |
| R-3 | S 로스터 Jobs+Nova 동시 추가 → framing 주도권 충돌 | 🟡 |
| R-4 | 매트릭스가 Nexus 판단력 퇴화 유발 | 🟡 |
| R-5 | Arki 선두 폐기 시 첫 발언 구조 공백 | 🟢 |

**R-2 핵심 판단:** C 유지 + Arki 호출 트리거를 "결정 파급 범위 기반"으로 재정의가 통합보다 안전

---

## Ace — blind-parallel (ace_rev1.md)

**D1 — C/D 통합 (지속가능성 판정: Yes → C/D 통합이 맞다)**

C 존치 조건 3개 모두 현실에서 붕괴됨. C는 사실상 D와 동치. 단, 통합 방식: "C 폐기→D 흡수"가 아니라 D 정의에 "Arki 호출 트리거"를 인라인 박제.

**D2 — S 로스터 (지속가능성 판정: Conditional)**

Nova는 S grade 기본 로스터 과잉. Jobs와 Nova 동시 포함 시 frame 경계 진동 위험.
확정 로스터: Jobs → Ace → Arki·Riki → Fin → Edi | Nova·Vera 선택

**D3 — 역할-순서 매트릭스 (지속가능성 판정: Yes — 2축 채택)**

2축(closed/open × decision/execution) × 4패턴. 미매칭 시 Nexus 상향 안전장치(불확실 → A).

```
| | closed | open |
| decision | Arki→Fin→Riki→Ace→Edi | Jobs→Ace→Riki→Fin→Edi |
| execution | Arki→Dev→Riki→Edi | Jobs→Ace→Arki→Dev→Edi |
```

---

## Nova — debate round 1 (nova_rev2.md)

**채택:** 1단(Nexus 2가지 판단) + 3단(분류 재검토 신호 가능)
**폐기:** subjectType 5종

핵심 전환: 토픽 분류 매트릭스 → **역할 참여 조건 매트릭스** 제안 (축 뒤집기). Ace 4패턴이 Arki 5종보다 "처리 방식 기반 분류"로 역할 구성 결정에 직접적.

---

## Arki — debate round 1 (arki_debate_r1.md)

**수렴 방향:** Ace 2축(Nexus 판별 인터페이스) + Arki 5종(순서 매핑 테이블) 적층 구조

```
Nexus 판별 → 2축 → primary subjectType 매핑 → 역할 순서 결정
```

**Nova 역할 자기선언:** 현재 아키텍처에서 성립 불가 (dispatch_config Nexus-pull 방식, PostToolUse dispatch 재편성 경로 없음, pre-queue 스키마 없음) → PD 분리 권고

**Riki R-1 완화:** confirm-then-go + "불확실" fallback → A 복귀 경로

---

## Riki — debate round 1 (riki_debate_r1.md)

**Q1 — Ace 확인 질문이 R-1 완화하는가:**
부분 방어선에 불과. 질문이 Nexus의 분류 결과를 전제로 구성됨 → 오분류 확정 루프 위험. open-form 확인 질문 명시 필요.

**Q2 — Arki 5종 vs Ace 2축:**
Ace 2축이 덜 위험. 5종은 복합 유형 20+ 경우의 수, risk-audit/structure 중첩 문제.

**Q3 — Nova 역할 자기선언:**
오분류 제거 안 됨. 3가지 리스크 생성: self-serving relevance inflation, 임계값 결정 불명확, rule-based 구현 시 D-keyword 문제 역할 수 복제.

**매트릭스 수용 조건 3가지:**
1. 매트릭스 우선순위 명시 (Nexus 컨텍스트 판단이 매트릭스보다 우선)
2. open-form 확인 질문 명시
3. 오분류 사례 evidence_index 축적 → 매트릭스 revision 트리거

---

## Jobs — debate round 1 (jobs_debate_r1.md)

**핵심 주장:**
- 기준 외재화 ≠ 매트릭스. 원칙 3줄로 충분.
- Arki 5종 = 닭이 먼저냐 달걀 문제. 역할 호출 결과를 분류 기준으로 사용 (순환).
- Ace 4패턴이 맞되 형식을 "판정 원칙 + 예시 4건"으로 변경 (표의 완전성 착각 제거).

**Nova 역할 자기선언:** 조율 비용이 매트릭스보다 높음. 기각.

---

## Ace — debate round 1 (ace_debate_r1.md)

**판정:**
- Arki 5종 = 출력 레이블. dispatch 기준으로 순환이라 불가.
- "2축 매트릭스" 명칭 → "판정 원칙 + 4패턴 예시" 표기 변경 (Jobs 의견 수용).
- 확인 질문 트리거 구체화: 축 불확실, Grade 상향 신호 감지 시 발동. 기본 상향 안전장치(불확실 → A).
- C/D 통합 입장 유지. D 정의에 "파일 2개 이상 동시 수정" 트리거 인라인 박제 수용.

---

## Arki — debate round 2 (arki_rev2.md)

**새 C 정의:**
- C = 단일 컴포넌트 경계 내 완결. 구조적 파급 없음.
- 기준: structural blast_radius (변경 영향 컴포넌트 레이어 종류 수)
  - B: blast_radius ≥ 2
  - C: blast_radius ≤ 1

**새 C 역할 구성:**

| subjectType | 첫 주자 | Arki 호출 트리거 |
|---|---|---|
| execution | Dev | 파일 간 의존 존재 or 스키마 영향 |
| design-lite | Arki | 자동 선두 |
| decision-simple | Ace 또는 Riki | 결정 파급 단일 파일 이내 |

**자기감사 발견 사항 (5건):** blast_radius_threshold dispatch_config.json 명문화, 레이어 enum 사전 정의, subjectType-파일 수 충돌 처리 등 — 채택 시 선행 필요.

---

## Riki — debate round 2 (riki_debate_r2.md)

**Round 2 핵심:** Master 제안(C 재정의)이 "경량 경로 삭제" 우려를 해소하나, "하향 편향" 우려는 B→C 경계로 이동해 재현됨.

**신규 리스크:**
- 🟡 R-1: 새 C 역할 호출 조건 모호 시 호출 기준 drift (B와 동일화 또는 사문화)
- 🔴 R-2: B vs 새 C 경계에서 Nexus 하향 편향 재현 — "결정 파급 범위" 기준 없으면 B급 작업이 C로 처리됨

**수용 조건 3가지:**
1. 새 C 역할 호출 트리거 명시 (파일 영향 범위, 시스템 경계 교차 기준)
2. B/C 경계 "결정 파급 범위 / 시스템 경계 교차" 보강
3. C→B 강제 격상 트리거 명시

---

## Jobs — debate round 2 (jobs_debate_r2.md)

**Grade 계층 재정의 (최종):**

| Grade | 정의 |
|---|---|
| S | Master 명시. 오픈 탐색형. |
| A | 의사결정 있음 + 전제 조건 열림 or 다축 분석 필요 |
| B | 의사결정 있음 + 전제 조건 닫힘 |
| D | 의사결정 없음 + 실행만 (Dev 직행) |
| C | 폐기 — "경량+판단여지"는 B(의사결정 있음+Size 작음)로 흡수 |

**Master 제안 vs Ace 안:** Ace 안 채택 + Riki 트리거 기준 인라인 박제. Master 안은 문제를 이동(C/D 경계 불명 → 새 C/D 경계 불명으로).

**S 로스터 확정:**
```
기본: Jobs(명시 호출 시) / Ace / Arki / Riki / Edi
선택: Fin / Dev / Vera
Nova: 제외. 발동 조건: Riki 🔴 2개 이상 + 교착 발생 시 Master 승인.
```

---

## Ace — debate round 2 (ace_debate_r2.md)

**핵심 입장 전환:** C 폐기 → C 재정의 수용. 이유: C 슬롯 존재 자체가 D→C→B 격상 판단 강제 게이트.

**Grade 5단계 재정의:**

| Grade | 파급 범위 | 불확실성 | 2축 | 첫 주자 |
|---|---|---|---|---|
| S | 조직·전략 전체 | 높음(open) | full | Jobs(명시 호출 시) → Ace |
| A | 시스템 경계 횡단 | 중간 | full | Arki |
| B | 모듈 경계 횡단 | 낮음~중간 | 2축 적용 | Arki |
| C | 단일 모듈 내 | 낮음 | 신호 매칭 | Dev 기본 / 신호 기반 선제 호출 |
| D | 로컬 | 거의 없음 | 없음 | Dev 직행 |

**새 C 역할 호출 조건 (인풋 신호 5줄):**
1. 기존 파일 2개 이상 동시 수정 → Arki
2. 신규 인터페이스·API 표면 변경 → Arki
3. 비용·자원 조정 포함 → Fin
4. 실패 가능성 명시 → Riki
5. 위 신호 없음 → Dev 단독

**B vs C 경계 단일 기준:** "이 토픽의 실행 결과가 다른 시스템·역할·결정의 인풋이 되는가?" (파일 수는 2차 신호)

**S 로스터 확정:**
- Jobs 발동 조건: `/jobs-framing` 명시 호출 시만 framing phase 진입
- S 선언: Master 명시 전용. Nexus 자동 S 판정 금지.

---

## 미해결 Gap

| 항목 | 상태 |
|---|---|
| blast_radius_threshold 수치 dispatch_config.json 박제 | 미구현 (Arki 자기감사 MUST_BY_N=10) |
| 레이어 enum (hook·script·schema·memory·app) CLAUDE.md 정의 | 미구현 (Arki MUST_NOW) |
| `subjectType` 필드 `current_session.json` 스키마 추가 | 미구현 (구조 변경 필요) |
| open-form 확인 질문 규칙 박제 | 미구현 |
| 오분류 사례 evidence_index 축적 트리거 | 미구현 |
| CLAUDE.md Grade 섹션 업데이트 | 미구현 |
