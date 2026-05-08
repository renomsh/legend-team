---
role: arki
topicId: topic_183
session: session_216
turnId: 6
invocationMode: subagent
phase: debate
round: 1
date: 2026-05-09
---

# Arki — Debate Round 1: 매트릭스 필요 여부 + 설계 기준

## Q1. Ace의 2축 4패턴 vs Arki의 5종 subjectType — 어느 쪽이 Nexus 자동 판단에 더 적합한가?

**수렴 가능하다. 단 흡수 방향이 중요하다.**

Ace의 2축(불확실성 closed/open × 결과물 decision/execution)은 **Nexus 자동 판단 트리거**에 최적화된 구조다. 식별 입력값이 2개 이진 질문이므로 판별 비용이 낮다.

Arki의 5종 subjectType은 **역할 순서의 정보 의존 구조**에 최적화된 분류다. "왜 이 역할이 먼저 나오는가"를 설명하는 근거로서의 역할이 크다.

두 구조를 대비하면:

| 기준 | Ace 2축 | Arki 5종 |
|---|---|---|
| 판별 용이성 | 높음 (2 이진 질문) | 중간 (5종 + 복합 처리) |
| 순서 설명력 | 부분 (4패턴만) | 높음 (정보 의존 그래프 기반) |
| 포착 불가 케이스 | cost-eval 단독 (Fin 선두 필요) | 없음 |
| 구현 복잡도 | 낮음 | 높음 |

**Ace의 2축으로 포착되지 않는 케이스:** `cost-eval` 단독 토픽("투자 여부 판단"). 이는 closed+decision에 해당하지만 첫 주자가 Fin이어야 한다. 2축 패턴에서는 `closed-decision = Arki→Fin→Riki→Ace→Edi`이므로 Arki가 구조 분석 없이 먼저 나오는 어색함이 생긴다.

**권고 수렴 방향:** Ace 2축을 "Nexus 판별 UI(인터페이스)"로 채택하고, 5종 subjectType을 그 2축의 "역할 순서 매핑 테이블"로 사용한다. 즉 2축이 Nexus 입력 → 5종 중 primary 1개 선택 → 해당 순서 실행. 4패턴이 5종을 커버하지 못하는 케이스는 Nexus가 판별 결과를 선언 후 Master 묵인 방식으로 처리.

---

## Q2. Nova의 "역할 자기선언" 방식 — 현재 dispatch 아키텍처에서 성립하는가?

**현재 아키텍처에서는 성립하지 않는다. 구조 결함이 있다.**

Nova의 시나리오A(역할 자기선언 + relevance 큐잉)는 각 역할이 `/open` 시 소형 pre-call을 통해 relevance signal을 반환하는 구조를 전제한다. 이것이 dispatch 레이어와 충돌하는 지점 3개:

**1) dispatch_config.json의 trigger 구조가 Nexus-pull 방식이다.** 현재 `rules.{role}.trigger` 는 Nexus가 명시 트리거를 보내거나 natural_language_suggest가 매칭될 때 역할을 호출하는 구조다. 역할이 스스로 "나 필요함"을 반환하는 역방향 경로가 없다.

**2) pre-tool-use-task.js는 호출 전 게이트이지, 역할 응답 후 re-queue 메커니즘이 아니다.** 역할 자기선언이 되려면 PostToolUse hook이 relevance signal을 읽어서 dispatch 큐에 삽입하는 로직이 필요하다. 현재 PostToolUse는 turn 박제 + 파일 검증 역할이지 dispatch 재편성 역할이 아니다.

**3) current_session.json에 dispatch queue 스키마가 없다.** 역할 자기선언 방식은 세션 중간에 "다음 발언 예정 역할 목록"이 동적으로 변경되어야 하는데, 현재 스키마에는 `turns[]`의 사후 기록만 있다. pre-queue 구조가 없다.

**결론:** Nova의 역할 자기선언은 구현하려면 dispatch 아키텍처를 상당 부분 재설계해야 하는 아이디어다. 이번 topic_183의 목표(Grade 임계 재검토)와 범위가 다르다. PD 분리 권고.

단, Nova의 **개념적 통찰**—"역할은 lens인데 매트릭스는 stage로 취급한다"—은 유효하다. 이것은 매트릭스를 설계할 때 "기본 순서 예시" 수준으로 명시하고 Nexus 재량을 보존해야 한다는 제약 조건으로 흡수할 수 있다.

---

## Q3. Riki의 "분류 오판 단일 실패점" 경고 — 5종 subjectType에서 어떻게 완화되는가?

Riki R-1의 핵심은 분류가 틀리면 전체 역할 호출이 잘못된다는 것이다. 이것은 2축이든 5종이든 매트릭스가 존재하는 한 구조적으로 동일하게 노출되는 리스크다. 5종 subjectType이 2축보다 특별히 완화해주는 것은 없다.

다만 5종 설계에 포함된 두 가지 완화 장치가 Riki 요구를 충족한다:

**1) confirm-then-go 패턴.** Nexus가 `/open` 시 분류 판단을 "이 토픽은 `structure` 유형으로 판단합니다 — Arki 선두"처럼 선언하고, Master가 이의 없으면 진행한다. 이것은 Riki가 요구한 "Nexus 분류 선언 + Master 게이트"를 충족한다. 단 tool blocker가 아닌 1회 알림이므로 Master 마찰은 최소다.

**2) "불확실" 버킷 → A 복귀 경로.** Nexus가 분류 키워드를 못 잡는 경우 자동으로 `subjectType=strategy + Grade A`로 fallback하는 규칙을 박제하면, Riki R-1의 "A급 필요한데 C로 처리" 위험을 원천 차단한다. 보수 fallback이 오버킬이지만, 오분류보다 오버킬이 낫다.

**confirm-then-go만으로 충분한가?** 아니다. 필요하지만 충분하지 않다. confirm 게이트가 있어도 Master가 무응답으로 통과시키면 오분류가 실행된다. 이를 보완하는 것은 오분류 사례의 evidence_index 축적 + 매트릭스 revision 트리거다. 이것이 Riki가 제안한 세 번째 완화 조건이며 Arki도 동의한다.

---

## Q4. Arki 최종 입장 — 5종 유지, 2축으로 수렴, 또는 혼합? 스키마 최소 변경 범위는?

**혼합 채택. 2축이 판별 인터페이스, 5종이 순서 매핑 테이블.**

blind-parallel 단계의 Arki 입장(5종 subjectType)을 부분 수정한다. 5종이 옳은 이유는 정보 의존 그래프 기반 순서 설명력 때문이지, Nexus 판별 용이성 때문이 아니다. Ace의 2축은 Nexus 판별에 더 적합하다. 두 축의 강점이 다르므로 적층이 맞다.

**최종 구조:**

```
Nexus 판별 → 2축(closed/open × decision/execution) → primary subjectType 매핑 → 역할 순서 결정
```

매핑 테이블:
| closed/open | decision/execution | primary subjectType | 첫 주자 |
|---|---|---|---|
| closed | decision | structure or cost-eval | Arki or Fin(※) |
| closed | execution | structure | Arki |
| open | decision | strategy | Jobs→Ace |
| open | execution | explore | Jobs→Ace→Arki |

※ cost-eval 판별은 "비용·자원이 1차 미결사항인가"로 Nexus 추가 판단. Riki R-5 완화: 첫 주자가 Fin인 경우 Arki를 2순으로 강제.

**스키마 최소 변경 범위:**

| 대상 | 변경 내용 | 범위 |
|---|---|---|
| `current_session.json` | `subjectType: string` 필드 추가 (`/open` 단계 박제) | 스키마 1필드 추가 |
| `current_session.json` | `subjectTypeAxis: {uncertainty: "closed"/"open", output: "decision"/"execution"}` 추가 | 스키마 1객체 추가 |
| `CLAUDE.md` | Grade 임계 재검토 섹션에 2축 × subjectType 매핑 테이블 박제 | 문서 추가 |
| `scripts/lib/topic-lifecycle.ts` | `subjectType` 판별 유틸 추가 | 함수 1~2개 |
| `pre-tool-use-task.js` | confirm-then-go 분류 선언 + 불확실 fallback 규칙 | hook 조건 추가 |

dispatch_config.json은 직접 변경 불요. subjectType은 hook이 current_session에서 읽으면 되므로 config에 별도 엔트리 불필요.

**D-057 PD 해소 판단:** 위 구조가 구현되면 "Nexus가 주제 유형을 보고 역할 순서를 자동 결정"이 성립한다. Grade와 subjectType이 직교 관계로 유지되므로 Grade 테이블 자체를 건드리지 않아도 된다. C/D 통합 여부는 별개 결정 — Riki R-2 논거(통합이 구조 결함 누적 위험)에 무게를 두면 C 유지 + "Arki 호출 트리거를 결정 파급 범위 기반으로 재정의"가 더 안전하다.

---

## 자기감사 — 이번 debate 발언 (1차)

- structuration: 2축↔5종 적층 관계 명시됨. 의존 없음 확인.
- hardcoding: "불확실" fallback → A 복귀는 하드코딩이지만 의도적 보수 설계. 허용.
- efficiency: confirm-then-go + evidence 축적의 2단 완화는 중복 아님. 각각 예방/학습 역할 분리.
- extensibility: subjectType 확장 시 매핑 테이블 1행 추가로 충분. 구조 변경 불요.

추가 발견 없음.

---

[ROLE:arki]
# self-scores
str_fd: 3
aud_rcl: 0.80
spc_lck: N
sa_rnd: 1
