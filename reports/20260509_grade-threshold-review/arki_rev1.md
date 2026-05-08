---
role: arki
topicId: topic_183
session: session_216
turnId: 3
invocationMode: subagent
phase: blind-parallel
date: 2026-05-09
---

# Arki — Grade 임계 재검토 구조 분석

## 구조 분석 1 — 기술적 성립 여부

**전제 검증:**

현재 시스템에서 Nexus가 "주제 유형 → 역할 순서"를 자동 결정하려면 두 전제가 성립해야 한다.

1. **주제 유형이 토픽 오픈 시점에 판별 가능해야 한다** — 현재 `topicType`은 framing/standalone 2종만 있고, Grade는 난이도+성격 혼합 지표다. 별도의 `subjectType` 필드가 없다.
2. **역할 순서가 주제 유형의 함수여야 한다** — 현재 CLAUDE.md는 Grade를 기준으로 순서를 규정하지만, 실제 운용에서 "같은 Grade인데 첫 주자가 달라야 하는 경우"가 발생한다는 것이 Master 문제 제기의 핵심이다.

두 전제 모두 현재 시스템에서 미충족. 즉, 매트릭스 도입은 기술적으로 새 필드(`subjectType`) + 새 dispatch 로직이 필요한 구조 변경이다.

---

## 구조 분석 2 — 주제 유형 분류 체계 설계

**분류 기준 선택 원칙:**

Nexus가 자동 판별하려면 각 유형의 식별 기준이 **주관 해석 없이 신호(키워드+컨텍스트)로 매핑 가능해야** 한다. 단순 키워드 매칭만으로는 오분류 위험이 크므로 "우선 키워드 + 부정 조건"의 2레이어가 필요하다.

**제안 분류: 5종**

| subjectType | 정의 | 식별 키워드 | 부정 조건 | 기본 첫 주자 |
|---|---|---|---|---|
| **strategy** | 방향·구조·선택지 정의가 주된 미결 사항 | 전략, 방향, 어떻게 갈지, 로드맵, 우선순위, 경쟁, 포지셔닝 | 구현 파일·코드 언급 無 | Jobs |
| **structure** | 시스템·아키텍처·스키마 설계가 주된 미결 사항 | 설계, 구조, 스키마, 아키텍처, 의존성, 인터페이스, 데이터 모델 | 전략적 방향 결정 未완료 시 → strategy 우선 | Arki |
| **risk-audit** | 기존 결정·구현·계획의 결함 검증이 목적 | 리스크, 감사, 검증, 위험, 취약점, 오류, 전제 검증, audit | 신규 설계 언급 無 | Riki |
| **cost-eval** | 자원·비용·투자 판단이 주된 미결 사항 | 비용, 예산, ROI, 수익, 투자, 재무, 자원, cost | 단독 등장 드묾 — 보통 strategy/structure와 복합 | Fin |
| **explore** | 가설 검토·아이디어 탐색·미정 방향의 열린 논의 | 탐색, 아이디어, 가능성, 어떻게 생각하나, 검토해봐, 모르겠다, 실험 | 결정 축이 이미 존재하면 strategy | Jobs+Ace |

**복합 유형 처리:**

실제 토픽의 40~60%는 유형이 혼합된다(추정). 이를 위해:
- 주 유형(primary) 1개 + 보조 유형(secondary) 선택 1개 구조 권장
- primary가 역할 순서의 "첫 주자"를 결정하고, secondary가 "뒤따르는 역할"을 활성화

---

## 구조 분석 3 — 역할-순서 매트릭스 초안

**논거: 정보 생산 의존 그래프**

순서 설계의 원칙은 "정보 생산 의존 그래프"다. A 역할의 발언이 B 역할의 발언에 인풋이 되는 경우 A→B 순서가 구조적으로 옳다.

```
strategy 유형:
  Jobs(Why·What) → Ace(구조 판정) → [Arki, Fin, Riki 병렬 or 순차] → Ace(/ace-synthesis 시)

structure 유형:
  Arki(설계) → Riki(결함 진단) → Fin(자원 영향) → Ace(/ace-synthesis 시)

risk-audit 유형:
  Riki(실패 모드) → Arki(구조 대안) → Ace(선택, /ace-synthesis 시)

cost-eval 유형:
  Fin(자원 평가) → Riki(비용 전제 감사) → Ace(선택, /ace-synthesis 시)

explore 유형:
  Jobs(본질·범위 정의) → Ace(구조 가능성 초안) → Nova(선택적 탐색)
```

**매트릭스:**

| subjectType | 1순 | 2순 | 3순 | 4순 | 선택적 |
|---|---|---|---|---|---|
| strategy | Jobs | Ace | Arki·Riki | Ace(선택, /ace-synthesis 시) | Fin, Nova |
| structure | Arki | Riki | Fin | Ace(선택, /ace-synthesis 시) | Jobs(전제 미정 시) |
| risk-audit | Riki | Arki | Ace(선택) | — | Fin |
| cost-eval | Fin | Riki | Ace(선택) | — | Arki |
| explore | Jobs | Ace | Nova | — | Arki·Riki(구체화 시) |

**Grade와의 관계:**

- **Grade S**: subjectType=explore 또는 strategy. 매트릭스 1순=Jobs 확정.
- **Grade A**: subjectType=strategy 또는 structure. 현재 "Arki 선두" 고정은 structure 편향이다. strategy 유형 A grade라면 Jobs·Ace가 먼저 나오는 게 구조적으로 맞다.
- **Grade B**: subjectType=structure 또는 risk-audit.
- **Grade C/D**: subjectType 판별 우선, 매트릭스 적용은 선택 (Grade 규칙 우선 권고).

---

## 구조 분석 4 — C grade Arki 호출 조건

**C에서 Arki가 거의 안 나오는 구조적 이유:**

C grade 기본 순서는 "Dev → Arki 검토 → Dev 수정". 이 흐름에서 Arki 호출은 Dev가 구현 후 검토 요청하는 구조다. 그러나 실제 C grade 토픽은 "오타 수정", "버그 픽스", "작은 기능 추가" 패턴이 대부분이다.

결과: Dev가 Arki를 명시적으로 호출하지 않으면 Arki 발언이 없음. "Arki 검토" 단계가 선택적으로 설계되어 있으나 실행 트리거가 없다.

**Arki 호출 기준:**

| 구분 | 기준 | Arki 호출 여부 |
|---|---|---|
| **의미 있음** | 파일 2개 이상 의존 관계 변경, 스키마 수정 포함, hook/config 경계 변경 | 호출 필요 |
| **의미 있음** | Dev가 "이 구조 맞나?" 질문 발생 시 | 호출 필요 |
| **의미 없음** | 단일 파일 수정, 값 변경, 텍스트 수정 | 생략 정상 |
| **의미 없음** | 테스트·검증 스크립트만 수정 | 생략 정상 |

**권고:** C grade는 Arki 호출을 **Dev-initiated pull 방식**으로 전환. 자동 호출 규칙 추가 불필요.

---

## 구조 분석 5 — 설계 제약 및 Nexus 자동 판단 전제

**성립 전제:**

1. **`subjectType` 필드가 `current_session.json`에 박제되어야 한다** — `/open` 단계에서 Nexus가 판별 또는 Master가 명시 선언. 현재 스키마에 없음.
2. **dispatch 로직이 Grade × subjectType 2차원 결합을 처리해야 한다** — 현재 pre-tool-use-task.js와 dispatch_config.json은 Grade 단일 기준. config 구조 변경 필요.
3. **subjectType 불일치 시 fallback 정책** — 분류 실패 시 Grade 기본값으로 fallback 규칙 명시 필요.
4. **역할 순서 override 프로토콜** — Master가 매트릭스 결과에 반해 순서를 바꿀 때 신호 언어 필요.

**구조적 한계:**

- **Nexus 판별 정확도** — 토픽 제목만으로 subjectType을 결정하면 오분류 발생 예상(실측치 없음). 보완책: confirm-then-go 패턴(Nexus가 판별 결과 1줄 선언 → 이의 없으면 진행).
- **복합 유형 연쇄** — strategy→structure 전환이 토픽 중간에 발생하는 경우 단일 subjectType으로는 대응 불가. `subjectTypeHistory[]` 또는 `phaseTransition` 이벤트 필요 — 이번 설계 범위 외, PD 분리 권고.
- **C/D grade와의 충돌** — C/D는 Grade 규칙 우선 유지.

---

## 설계 옵션

**Option A — Grade × subjectType 직교 도입 (권고 채택)**
- `current_session.json`에 `subjectType` 필드 추가, CLAUDE.md에 매트릭스 박제
- Grade = 역할 구성(몇 개 역할 참여), subjectType = 호출 순서(누가 먼저) 로 축 분리
- 장점: 두 축 독립적 진화. Nexus 자동 판단 구조 성립.
- 단점: 스키마 변경 + CLAUDE.md 업데이트 + subjectType 판별 로직 신규 작성.

**Option B — Grade 내 variant 세분화 (폐기)**
- Grade A를 A-strategy / A-structure 식으로 세분화
- 단점: Grade enum 폭발. 폐기.

**Option C — "첫 주자 hint" 자연어 지침만 추가 (임시 방편)**
- 변경 최소, 즉시 적용 가능
- 단점: Nexus 자동 판단 불가. 본격 자동화 목표라면 폐기.

---

## Grade × subjectType 분리 원칙 (보정된 핵심)

| 차원 | 결정 기준 |
|---|---|
| **역할 구성 (몇 개 역할 참여)** | Grade (S=풀 로스터, A=6役, B=4役, C=2役, D=1役) |
| **역할 호출 순서 (누가 먼저)** | subjectType (strategy=Jobs, structure=Arki, risk-audit=Riki, cost-eval=Fin, explore=Jobs) |

---

## 자기감사 요약 (3차 완료)

- 1차: Grade × subjectType 충돌 규칙 누락 발견 → 직교 원칙으로 해소
- 2차: Ace 호출 표기 오해 여지 → "(선택, /ace-synthesis 시)" 명시 보정
- 3차: 추가 발견 없음. 종료 조건 충족.

---

[ROLE:arki]
# self-scores
str_fd: 4
aud_rcl: 0.80
spc_lck: N
sa_rnd: 3
