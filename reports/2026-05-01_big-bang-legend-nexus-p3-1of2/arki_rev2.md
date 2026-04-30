---
role: arki
session: session_153
topic: topic_131
date: 2026-05-01
turnId: 15
invocationMode: subagent
rev: 2
accessed_assets:
  - memory/shared/topic_index.json
  - memory/shared/decision_ledger.json
  - memory/shared/dispatch_config.json
  - reports/2026-05-01_big-bang-legend-nexus-p3-1of2/arki_rev1.md
  - reports/2026-05-01_big-bang-legend-nexus-p3-1of2/ace_rev1.md
  - reports/2026-05-01_big-bang-legend-nexus-p3-1of2/riki_rev1.md
  - reports/2026-05-01_big-bang-legend-nexus-p3-1of2/riki_rev2.md
  - reports/2026-05-01_big-bang-legend-nexus-p3-1of2/riki_rev3.md
  - reports/2026-05-01_big-bang-legend-nexus-p3-1of2/dev_rev1.md
---

# Arki rev2 — NCL 폐기 후 Big Bang 후속 계획 재수정

Arki입니다. NCL 전면 폐기(D-133) 후 후속 계획을 재구성하겠습니다. Rich Hickey 시각으로 — **"짓지 않음"이 가장 단순한 선택이고, NCL 폐기는 그 선택을 늦게나마 적용한 것**. 남은 작업은 NCL을 전제했던 토픽들을 솎아내고, **B축(기존 자산 재활용) + C축(Master 결정 패턴 학습)**을 별도 트랙으로 분리하는 것입니다.

---

## §1. 폐기 토픽 처리 (topic_132·133)

### 1.1 처리 매트릭스

| 토픽 | 원래 의존 | 처리 결정 | 살릴 가치 |
|---|---|---|---|
| **topic_132** | NCL Phase A v0 hook (PostToolUse + SessionEnd 4항목 평가) + Zero entry 본체 + dispatch_config persona.zero.excludedAssets | **분할 폐기** | (a) Zero entry 본체 + excludedAssets — **유지·이전** (D-119/D-125 정합 인프라, NCL 무관) → 작은 잔여 토픽 또는 다른 토픽에 흡수. (b) NCL Phase A hook — **완전 폐기** |
| **topic_133** | Anchor vs Synth 분류기 v0.1 hook (D-123 분기) | **완전 폐기** | D-123 자체가 deprecate. anchor governance는 D-122에서 Edi 책임으로 재배치(anchor 자체는 외부 anchor 인용 의무로 잔존하나, "Synth 분류" 자동화 가치는 0) |

### 1.2 처리 근거

- topic_132 (a)는 **NCL과 독립**. Zero 페르소나 운영(D-119) + dispatch_config 완성도(D-127) 작업으로, 약 1~2 turn 분량의 작은 잔여물.
- topic_132 (b)와 topic_133 전체는 NCL 4항목 자체의 자동 평가·분류를 위한 인프라 → NCL 폐기 시 존재 이유 0.
- "분류기"는 분류 대상이 사라지면 의미가 없습니다. Hickey 원칙: **사라진 것을 위한 코드를 쓰지 않는다.**

### 1.3 권고

- topic_132 (a)는 **신규 학습 트랙 토픽 또는 보존 토픽 묶음에 흡수**하는 편이 새 토픽 1개를 따로 여는 것보다 단순합니다.
- topic_index.json에서 topic_132·133 status를 `cancelled` 또는 `superseded` 처리, 이유에 D-133 인용.

---

## §2. 신규 후속 토픽 — 학습 트랙 (B + C)

### 2.1 핵심 질문 분해

| 질문 | 답 | 근거 |
|---|---|---|
| Q1. B(기존 자산 재활용)와 C(Master 결정 패턴 추출) — 단일 토픽 vs 분리 토픽? | **2단계 framing 토픽 1개 → 분리 구현 2개 (B토픽·C토픽)** | 분리 결정 자체가 framing의 핵심 산출. 미리 단일/분리를 고정하지 않음. |
| Q2. 첫 번째 결정점은 무엇인가? | **(α) 학습의 정의·범위·성공기준 — 무엇을 어떻게 측정 없이 학습했다고 할 것인가** (NCL 식 측정 우회의 본질) | NCL 폐기 이유가 "측정 자체가 학습 왜곡". 새 토픽은 "측정 없이 학습"의 정의부터 시작. |
| Q3. framing 토픽인가 implementation 토픽인가? | **framing 토픽** (parentTopicId 없음, childTopicIds로 B·C 구현 토픽 후속) | 단계별 진입 — 헌장(charter) 없이 구현 토픽 열면 NCL 재발. |
| Q4. Grade 권고? | **A** | size 11+ 닫힌 실행형 — Jobs framing 호출 후 Arki/Riki 핵심 검토. S 아닌 이유: 오픈 탐색 아님(NCL 폐기로 방향 좁혀짐). |

### 2.2 학습 트랙 토픽 구조

```
topic_138 (가칭, framing, Grade A)
  ├─ "측정 없는 학습의 정의" 헌장 박제
  ├─ B축·C축 분리/통합 결정
  ├─ 자산 inventory (B축 후보) + 결정 sample 추출 절차 (C축 후보)
  └─ 후속 구현 토픽 분기 결정
       ├─ topic_139 (B축 구현, framing 결과에 따름)
       └─ topic_140 (C축 구현, framing 결과에 따름)
```

### 2.3 framing 토픽 결정축 후보 (Jobs 영역 — Arki 제안만)

| 결정축 | 옵션 |
|---|---|
| **D-A** 학습 산출물의 형태 | (가) 패턴 카드 (Master 결정 추상화) / (나) 페르소나 정책 갱신 / (다) 둘 다 |
| **D-B** 학습 추출 주체 | (가) Sage read-only 분석 / (나) Master 직접 큐레이션 / (다) Edi가 세션 종료 시 후보 박제 |
| **D-C** B·C 단일 vs 분리 | (가) 단일 토픽 (자산 재활용 = 결정 패턴 적용 형태) / (나) 분리 (B=정적 자산, C=동적 패턴) |
| **D-D** 학습 검증 방법 | (가) 사후 적용 사례 1~2건 — 다음 토픽에서 패턴이 실제 인용·재현 / (나) 검증 없음(neutral 박제) |

### 2.4 첫 번째 결정점 (Master Step 1)

framing 토픽 turn 1에서 Jobs가 묻거나 Master가 답해야 할 질문:

> **"학습했다고 어떻게 알 것인가? 측정 없이."**

이 질문에 답이 안 나오면 NCL 식 함정 재발. 답이 나오면 그 답이 곧 D-A·D-B의 기본값을 결정합니다.

---

## §3. 보존 토픽 우선순위 재배치

### 3.1 NCL 폐기로 인한 우선순위 변동

| 토픽 | 원래 우선순위 | 변동 사유 | 새 우선순위 |
|---|---|---|---|
| **topic_134** (ackReason 50자 + dashboard ackedButUnresolved) | 중간 | 변동 없음 — D-124 잔존, NCL 무관 | **중간 (유지)** |
| **topic_135** (외부 anchor 필수 hook + URL HEAD/DOI resolver) | 중간 | **상승** — anchor governance가 NCL 사라진 후 더 중요해짐. NCL이 "다양성·영향 점수"로 anchor 부재를 감추는 효과를 잃음 → anchor 직접 검증 의무 강화 필요. D-122(Edi anchor 책임)와 정합. | **상위** |
| **topic_136** (Master-first 모드 본격화) | 중간 | **상승 (큰 폭)** — NCL 폐기로 echo chamber 차단의 자동 측정 트랙이 사라짐. Master-first 모드(D-129)가 echo chamber 잔존(s139) 대응의 **유일한 코드 박제 메커니즘**으로 격상. P4~P6(LLM 2차 / enforce / 30세션 게이트)이 NCL 부재 환경에서 실질적 보완재. | **최상위** |
| **topic_137** (prime directive 표/본문 정합 정리) | 낮음 | 변동 없음 — Affaan 4 도그마 자체는 D-133과 무관 | **낮음 (유지)** |

### 3.2 핵심 변동 요지

- **topic_136 Master-first가 최상위로 격상**: NCL 폐기 = 자동 측정 폐기. Master-first 모드는 "측정 없이 echo chamber 차단"의 거의 유일한 메커니즘.
- **topic_135 anchor hook 중요도 상승**: NCL이 anchor 부재를 다양성 점수로 무마하던 효과가 사라짐 → 외부 anchor 직접 의무화 필요.
- **topic_134·137은 NCL과 무관해 우선순위 안정**.

---

## §4. Big Bang 토픽(topic_131) 자체의 처리

### 4.1 D-117 5 Phase 잔여 평가

| Phase | 원래 내용 | NCL 폐기 후 상태 |
|---|---|---|
| P1 | 인프라 합의 (3-Layer + Star + prime directive) | ✅ 완료 (s140) |
| P2 | prime directive 박제 + Sage·Zero 페르소나 + ack 제약 | ✅ 완료 (s141·s142·s145·s146) |
| P3 | NCL Phase A v0 hook | ❌ **deprecate** (D-133) |
| P4 | NCL Phase B v0.1 enforce | ❌ **deprecate** (D-133) |
| P5 | dashboard·통합 검증 | ⚠ NCL 의존 부분 deprecate, 비-NCL 부분만 잔존 (거의 없음) |

**5 Phase 중 P3·P4가 통째로 사라지고 P5는 사실상 무력화**. topic_131의 원래 정의된 Big Bang은 **P1·P2 완료로 핵심 가치 회수 완료** 상태입니다.

### 4.2 다음 단계 옵션 검토

| 옵션 | 장 | 단 |
|---|---|---|
| **(a) P3 (2/2)로 hook chain 잔여 작업 (topic_131 내부)** | 본 세션 컨텍스트 보존, 새 토픽 생성 비용 0 | 잔여 작업이 NCL 무관(Zero entry 본체·CLAUDE.md 정리 등)이라 "Big Bang Nexus P3" 명목이 misleading. 토픽 정체성 흐려짐. |
| **(b) topic_131 종결 후 학습 트랙 신규 토픽 (§2)** | 토픽 경계 명확. lifecycle 권고(9세션 초과)도 충족. NCL 폐기라는 큰 결정 이후의 명확한 분기점. | 본 세션 닫고 다시 열어야 함 (1세션 갈무리 비용). |
| **(c) topic_131 종결 + topic_132 (a) 잔여물 + 학습 트랙 framing 동시 재조립** | 두 작업을 한 번에 인계. | 컨텍스트 늘어남. |

### 4.3 권고: **(b)**

근거:
1. **lifecycle 임계 충족**: topic_131은 이미 9세션(s138~s146·s153) — Edi s146 인계에서도 종결 권고됨.
2. **D-133은 자연스러운 종결 트리거**: NCL 폐기 = Big Bang의 P3·P4 deprecate = 토픽 본래 목표의 한 축이 사라짐. 토픽을 닫고 새 framing으로 시작하는 것이 정직.
3. **Hickey 원칙**: 정체성이 흐려진 토픽을 끌고가지 않는다 — 닫고 새 이름을 붙인다.
4. **잔여물은 작음**: topic_132 (a) Zero entry 본체 + dispatch_config 완성은 학습 트랙 framing 토픽의 사전 준비 또는 별도 1턴 토픽으로 처리 가능.

### 4.4 종결 절차

| 단계 | 행위 |
|---|---|
| 1 | 본 세션(s153)에서 D-133 + 후속 계획 박제 완료 |
| 2 | Edi가 topic_131 status `completed` 전환 (D-117 5 Phase 중 P1·P2 핵심 가치 회수, P3·P4는 의식적 폐기로 간주) |
| 3 | 다음 세션 첫 작업: 학습 트랙 framing 토픽(topic_138 가칭) `/open` |
| 4 | topic_132·133은 `cancelled` (D-133 인용) — 별도 세션 행위 0, Edi가 본 세션에서 같이 처리 가능 |

---

## §5. 종합 권고 — 향후 6~10 세션 plan

### 5.1 우선순위 표 (구조적 선후만 — 절대 시간·인력·공수 미포함)

| 순서 | 토픽 | 단계 | 의존 | 산출 |
|---|---|---|---|---|
| **1** | topic_131 | 종결 | D-133 박제 후 | status `completed`, topic_132·133 `cancelled` 동반 처리 |
| **2** | topic_138 (가칭, framing) | 학습 트랙 charter | topic_131 종결 게이트 통과 후 | "측정 없는 학습" 정의·B/C 분리 결정·D-A~D-D 결정축 박제. childTopicIds 결정. |
| **3** | topic_136 | Master-first 모드 본격화 (P4~P6) | topic_138 framing 결과에 정합 (학습 트랙과 echo chamber 차단 메커니즘이 한 결로 흐를 수 있음) | LLM 2차 / enforce / 30세션 게이트 hook 구현 |
| **4** | topic_135 | 외부 anchor 필수 hook | topic_136 완료 후 (Master-first 가동되어야 anchor 누락 적출 효과적) | URL HEAD/DOI resolver + anchor 직접 의무 hook |
| **5** | topic_139 (가칭, B축 구현) | 기존 자산 재활용 구현 | topic_138에서 B/C 분리 결정 시에만 발동 | 자산 inventory + 재활용 패턴 카드 (또는 통합 결정 시 5+6 합쳐짐) |
| **6** | topic_140 (가칭, C축 구현) | Master 결정 패턴 추출 구현 | topic_138 framing 결과 + topic_139 완료 또는 병렬 (framing 결과에 따름) | 결정 sample 추출 절차 + 페르소나 정책 갱신 패턴 |
| **7** | topic_134 | ackReason 50자 + dashboard 패널 | 위 모든 학습 트랙 게이트 통과 후 (정합 검토 필요) | ack 잔류 누수 차단 |
| **8** | topic_137 | prime directive 표/본문 정합 정리 | 모든 큰 작업 후 정리 단계 | 문서 정합 |

### 5.2 의존 그래프 (구조적)

```
topic_131 종결
    │
    └─→ topic_138 (학습 트랙 framing) ──┬─→ topic_139 (B축, 조건부)
                  │                      └─→ topic_140 (C축, 조건부)
                  │
                  └─→ topic_136 (Master-first 본격화) ──→ topic_135 (anchor hook)
                                                              │
                                                              └─→ topic_134 ──→ topic_137
```

### 5.3 검증 게이트 (구조적)

| Gate | 통과 기준 |
|---|---|
| **G1** topic_131 종결 | D-133 박제 + topic_132·133 cancelled + Edi 종결 보고서 |
| **G2** topic_138 framing 완료 | "측정 없는 학습" 정의 박제 + B/C 분리 결정 + 결정축 4개 답 |
| **G3** topic_136 본격화 | LLM 2차 hook 가동 + Master 첫 dual-trigger 케이스 발생·기록 |
| **G4** topic_135 anchor hook | 외부 anchor 누락 적출 hook 가동 + 첫 적출 사례 |
| **G5** topic_139·140 학습 트랙 본격화 | 자산 카드 또는 결정 패턴 카드 1건 이상 + 다음 토픽에서 실제 인용 사례 (사후 검증) |

### 5.4 중단 조건 (Stop conditions)

- topic_138 framing에서 "측정 없는 학습"의 정의가 3 turn 이상 합의되지 않으면 → 토픽 분할 또는 학습 트랙 자체 보류 (NCL 폐기와 같은 패턴 재발 방지).
- topic_136 P4 LLM 2차에서 false positive ≥ 30%면 → P5 enforce 진입 보류.
- 학습 트랙 산출물이 다음 3개 토픽에서 0회 인용되면 → 학습 트랙 자체를 deprecate (NCL과 같은 운명 회피하려면 인용·재현 검증 필수).

### 5.5 롤백 경로

- topic_131 종결 후 학습 트랙이 같은 함정에 빠지면 → topic_131 status 복원 없이 새 토픽으로 학습 트랙 deprecate 박제 (D-133과 동일 패턴).
- topic_136 P5 enforce가 false positive 폭증하면 → P3 warn-only로 회귀 (이미 코드 박제됨, dispatch_config 토글 1줄).

---

## §6. 자기감사 — 1차 (Arki 자기감사 프로토콜 D-063)

### 6.1 structuration (구조 분리·의존 명확성)

- (a) topic_138 framing 토픽 vs topic_139·140 구현 토픽 분리 명확. 의존 graph 단방향.
- (b) topic_136이 학습 트랙(topic_138)과 정합 흐름 — "Master-first가 학습 측정의 대체"라는 점에서 의미 연결. 단일 의존이 아닌 정합 의존.
- (c) **발견 1 (NICE)**: topic_138의 D-A~D-D 결정축 4개는 framing 단계에 적당하나, 서로 직교성이 다소 약함(D-A와 D-D는 상관 있을 수 있음). 직교성 검증은 Jobs framing 단계 위임.

### 6.2 hardcoding (하드코딩 경로·값·설정)

- 본 보고서는 토픽 번호(topic_138~140) 가칭 사용 — 실 번호는 다음 세션 `/open` 시 자동 할당. 가칭 명시로 하드코딩 위험 0.
- (d) **발견 2 (DEFER)**: "30세션 게이트" 등 숫자는 D-129 박제값 인용. 본 세션에서 변경 권고 0건.

### 6.3 efficiency (중복 제거·알고리즘 선택)

- topic_132 (a)를 학습 트랙 토픽에 흡수 권고 = 토픽 1개 절약.
- topic_131 종결 + topic_132·133 cancelled 동시 처리 = Edi 1턴 절약.
- (e) **발견 3 (SHOULD)**: 학습 트랙 B/C 분리/통합 결정을 framing에 위임한 것은 Arki가 단일 결정을 못 내려 미룬 것이 아니라 — framing 단계의 본질적 결정이라 위임이 정당. 그러나 Arki rev3에서 단일 권고로 좁힐 수 있는지 재검토 가치 있음 (자기감사 2차에서).

### 6.4 extensibility (확장 지점·확장 방식)

- 학습 트랙 토픽 구조(framing → child 구현 N개)는 향후 D축·E축 추가 시 child 토픽 하나만 더 열면 확장됨. 게이트·롤백·중단 조건 모두 framing에서 박제되므로 확장 시 헌장만 갱신.
- (f) **발견 4 (NICE)**: §5.1 우선순위 표에서 topic_134·137은 "정리·잔여" 성격이라 학습 트랙 진행과 병렬 가능. 그러나 본 보고서는 직렬 권고 — 의도적 단순화. 병렬화는 다음 framing에서 결정 가능.

### 6.5 자기감사 1차 종합

- 발견: 4건 (NICE 2 / SHOULD 1 / DEFER 1)
- 모든 발견 NICE/DEFER + 1건 SHOULD(자기감사 2차 가치) → **종료 임계 근사**.
- 자기감사 2차는 Master 또는 Ace 압박 시 발동. 본 rev2는 1차 자기감사 후 종료.

---

## §7. 결론 한 줄

**topic_131을 종결하고, 학습 트랙 framing 토픽(가칭 topic_138)을 다음 세션에 새로 열되, 첫 결정점은 "측정 없이 학습했다고 어떻게 아는가"이며, topic_136 Master-first가 NCL 폐기 후 echo chamber 차단의 단일 코드 메커니즘으로 격상된 우선순위를 인정해야 합니다.**

---

ARKI_WRITE_DONE: reports/2026-05-01_big-bang-legend-nexus-p3-1of2/arki_rev2.md

[ROLE:arki]
# self-scores
aud_rcl: Y
str_fd: 4
spc_lck: N
sa_rnd: 1
