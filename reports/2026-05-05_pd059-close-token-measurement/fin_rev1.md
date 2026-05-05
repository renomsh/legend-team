---
role: fin
session: session_196
topic: topic_169
topicSlug: pd059-close-token-measurement
rev: 1
date: 2026-05-05
turnId: 3
invocationMode: subagent
---

# Fin — PD-059 Close 프로세스 토큰 측정 및 효율화

## 1. 실측 vs 추정 비교 (token_log 기반)

### 1.1 total_billable 단위 검증

`total_billable = input_tokens + output_tokens + cache_creation_input_tokens + cache_read_input_tokens` (단순 합산, 비중 없음).

**session_195 검증**: sum=12,529,975 = total_billable. 정확 일치. 이 수치는 "가중 비용 토큰"이 아닌 **원시 토큰 합계**.

### 1.2 최근 10세션 실측 비용 (USD, Anthropic 공식 요금)

| 세션 | total_billable | 실비용(USD) | 비용 구성 비율 |
|---|---|---|---|
| session_186 | 43,857,993 | $29.44 | output 15%, cacheCreate 44%, cacheRead 41% |
| session_187 | 91,558,902 | $43.30 | output 20%, cacheCreate 18%, cacheRead 62% |
| session_188 | 20,867,700 | $10.90 | output 17%, cacheCreate 27%, cacheRead 55% |
| session_189 | 9,231,310 | $4.51 | output 23%, cacheCreate 18%, cacheRead 59% |
| session_190 | 6,534,102 | $3.73 | output 15%, cacheCreate 35%, cacheRead 49% |
| session_191 | 6,115,928 | $3.61 | output 26%, cacheCreate 26%, cacheRead 48% |
| session_192 | 21,566,147 | $10.35 | output 22%, cacheCreate 17%, cacheRead 61% |
| session_193 | 9,538,889 | $5.99 | output 17%, cacheCreate 38%, cacheRead 44% |
| session_194 | 4,645,675 | $3.45 | output 24%, cacheCreate 40%, cacheRead 37% |
| session_195 | 12,529,975 | $7.56 | output 16%, cacheCreate 38%, cacheRead 46% |

**평균: $12.28/세션. 월 60세션 기준 추정: ~$737/월.**

### 1.3 추정 vs 실측 Gap

Arki의 "137,000~160,000 tokens" 추정은 **하한 추정**임이 실측으로 확인된다.

단, 이 추정은 `/close` 한 단계의 비용이 아닌 **전체 세션** 비용이다. `/close`는 마지막 명령이므로, 전체 세션에서 `/close` 단계가 차지하는 비중을 정확히 분리할 수 없다. 그러나 핵심 구조는 타당하다:

- **cache_read가 93~97%**: 대부분의 토큰은 이미 캐시된 컨텍스트를 읽는 것
- **cache_create가 17~44%의 비용**: 비용 구조상 캐시 생성이 가장 큰 단일 비용 축
- **output이 15~26%의 비용**: LLM 생성 비용도 유의미

**실측 핵심 발견**: 토큰 수보다 토큰 종류가 비용을 결정한다. decision_ledger(48K tokens) 읽기는:
- cache_create 기준: **$0.18/call**
- cache_read 기준(이미 캐시된 경우): **$0.014/call**

**Gap 결론**: Arki의 토큰 수 추정은 타당하나, 이를 비용으로 환산 시 캐시 상태 가정이 결과를 10배까지 바꾼다. **최선 케이스(cache_read)와 최악 케이스(cache_create) 모두 계산 필요.**

---

## 2. 누적 성장 비용 분석

### 2.1 현재 파일 실측 (2026-05-05, session_196 기준)

| 파일 | 실측 크기 | 토큰(÷4) | 항목 수 | 항목당 바이트 |
|---|---|---|---|---|
| decision_ledger.json | 193,510 bytes | ~48,378 | 164건 | ~1,180 bytes |
| topic_index.json | 125,847 bytes | ~31,462 | 165건 | ~763 bytes |
| master_feedback_log.json | 78,841 bytes | ~19,710 | 4건 | ~19,710 bytes |
| session_index.json | 313,667 bytes | ~78,417 | 192건 | ~1,634 bytes |

### 2.2 세션당 성장률

| 파일 | 세션당 증가(bytes) | 세션당 증가(tokens) |
|---|---|---|
| decision_ledger.json | ~1,008 bytes | ~252 tokens |
| topic_index.json | ~655 bytes | ~163 tokens |
| session_index.json | ~1,634 bytes | ~408 tokens |
| **Close 관련 합계(DL+TI)** | **~1,663 bytes** | **~415 tokens** |

### 2.3 성장 예측

| 시점 | decision_ledger | topic_index | 합계 | /close 컨텍스트 점유율 |
|---|---|---|---|---|
| 지금 (session_196) | 188 KB / 48K tok | 123 KB / 31K tok | 310 KB / 79K tok | ~75% |
| +50세션 (session_246) | 237 KB / 60K tok | 155 KB / 39K tok | 392 KB / 99K tok | ~80% |
| +100세션 (session_296) | 287 KB / 73K tok | 187 KB / 47K tok | 474 KB / 120K tok | ~85% |
| +200세션 (session_396) | 386 KB / 98K tok | 251 KB / 64K tok | 637 KB / 162K tok | ~93% |
| +500세션 (session_696) | 681 KB / 174K tok | 443 KB / 113K tok | 1,124 KB / 287K tok | **컨텍스트 초과** |

**경고: 현재 /close 컨텍스트는 이미 200K 컨텍스트 창의 74~80%를 사용 중이다. session_224(+28세션)에서 품질 저하 임계(80%)에 도달. session_320(+124세션)에서 포화.**

---

## 3. G1~G5 ROI 재정렬 (Fin 관점)

### 3.1 비용-효과 매트릭스

**요금 기준**: input $3/MTok, output $15/MTok, cache_create $3.75/MTok, cache_read $0.30/MTok

| ID | 절감 토큰 | 비용 절감/세션 (worst) | 비용 절감/세션 (best) | 구현 비용(추정) | ROI 배수 (월/60세션) | Fin 우선순위 |
|---|---|---|---|---|---|---|
| **G5** | 78K tok (예방) | $0.29/발생 | $0.023/발생 | 15분 (1 line) | **무한대** (순예방) | **#1 MUST_NOW** |
| **G2** | 29K tok | $0.109/세션 | $0.009/세션 | 1~2시간 | $3.91~$6.53/월 | **#2 HIGH** |
| **G1** | 45K tok | $0.169/세션 | $0.014/세션 | 3~4시간 | $3.05~$10.13/월 | **#3 HIGH** |
| **G3** | 10K tok (조건부) | $0.038/세션 | $0.003/세션 | 30분 | $1.35~$2.25/월 | **#4 MEDIUM** |
| **G4** | 6K×N tok | 가변 | 가변 | 2~3시간 | 낮음 | **#5 LOW** |

### 3.2 Arki 우선순위 vs Fin 재정렬

Arki: G1 > G2 > G5 > G3 > G4

**Fin 재정렬: G5 > G2 > G1 > G3 > G4**

**재정렬 근거:**

**G5를 #1으로 상향**: 구현 비용 15분에 불과하며, session_index(78K tokens) 우발 읽기는 /close 세션을 컨텍스트 오버플로우(119%)로 몰아넣는다. 발생 빈도가 낮더라도 **위험 등급 최고** — 차단이 아닌 예방이 ROI 무한대.

**G2를 G1보다 우선**: `updateTopicStatus()` 스크립트가 이미 존재한다. LLM이 topic_index 전문을 읽지 않고 스크립트 호출만 하도록 close.md Step 4 지시 변경 = 구현 부담 최소. G1(get-ledger-snapshot.ts 신규 작성)보다 선행 가능.

**G3 조기 실행 권장**: 30분 작업이나 약 절반 세션에서 19K tokens 절감. Arki가 "SHOULD"로 분류했지만, 구현 대비 효과 충분.

**G4 후순위**: 역할 수에 따라 효과가 가변적. Zero Condense 강화는 별도 토픽으로 분리 권장.

---

## 4. 비재무적 품질 훼손 비용 평가

### 4.1 컨텍스트 포화의 품질 비용 (핵심 발견)

순수 달러 비용보다 **컨텍스트 포화로 인한 품질 저하**가 더 중요한 비용이다.

현재 /close가 74~80%의 컨텍스트를 소비한다면:
- **Lost in the Middle 효과**: LLM은 컨텍스트 중간부(특히 80%+ 구간)의 정보를 상대적으로 덜 주목한다
- decision_ledger의 100~164번째 결정(최신 결정들)이 컨텍스트 후반부에 위치하여 누락·오기 위험
- /close 단계에서 Master feedback 처리, role_memory 갱신 등 "마지막 작업"이 컨텍스트 압박 하에 실행됨

**비재무 비용 추산**: 결정 오기 1건 = 다음 세션 Arki/Riki 역검사 + 수정 = 0.5~1세션 비용 ≈ $6~12/건.

### 4.2 G1·G2 스냅샷 방식의 품질 리스크 평가

**Arki 제안 G1 스냅샷**: "최근 30건 + 현 topicId 관련 결정만"

Fin 평가:
- **30건 기준의 임의성 위험**: 164건 중 30건은 18%. 현 세션 토픽과 교차하는 과거 결정이 30건 밖에 있을 확률 존재
- **Arki fallback(역검사) 충분성**: session-end-finalize.js의 delta-check가 "변경 여부"만 감지하고 "충돌 여부"는 감지하지 못한다. 다음 세션 Arki 역검사는 다음 세션 Master 투입 비용을 요구

**Fin 보정 권고**: 스냅샷을 "최근 30건" 고정이 아닌, "현 topicId 관련 전체 + 최근 N건(슬라이딩 윈도우 30)" 으로 구성. 또한 Close 시 LLM에게 "충돌 결정 의심 시 전문 조회 가능" escape hatch 명시.

**결론**: G1·G2 품질 리스크는 Arki fallback이 불완전하나 **허용 가능한 수준**. 단, 충돌 결정 escape hatch 없이 구현하면 품질 훼손 비용이 절감 효과를 잠식할 가능성 있음.

### 4.3 학습 루프 영향

G1·G2 구현 시 `/close` 프로세스에서 "LLM이 전체 결정 맥락을 읽는" 단계가 사라진다. 이는 단기 비용 절감이지만, **세션 종료 시 LLM의 전체 결정 맥락 인식 기회 감소**라는 비재무 비용을 수반한다. 이 trade-off는 Master가 인지해야 한다.

---

## 5. Fin 최종 권고

### 5.1 즉시 실행 (오늘)

**G5 즉시 집행**: session_index.json 우발 읽기 금지 문구를 close.md에 추가. 15분 작업. 1건이라도 발생하면 $0.29 + 컨텍스트 오버플로우 위험. 선행 집행 조건 없음.

**G3 병행 집행**: master_feedback_log.json 읽기 조건 명시화. 30분. close.md Step 6 지시를 "Master feedback이 **이번 세션에** 있었을 때만" 으로 강화.

### 5.2 단기 실행 (다음 세션)

**G2 우선**: updateTopicStatus() 헬퍼 활용 → close.md Step 4 지시 변경. 1~2시간. LLM이 topic_index 전문 읽기 불필요해짐. 신규 스크립트 작성 불필요.

### 5.3 중기 실행 (N=10 이전)

**G1 집행**: get-ledger-snapshot.ts 작성. 단, 다음 조건을 포함해야 ROI 유지:
1. 스냅샷 = "현 topicId 관련 전체 결정 + 최근 30건"
2. close.md에 "충돌 의심 시 전문 조회" escape hatch 명시
3. 구현 후 3세션 품질 추적(결정 오기 여부)

### 5.4 G4 별도 토픽

Edi SessionLayer Zero Condense 강화는 현 토픽에서 분리. 효과가 역할 수에 따라 가변적이며 Edi 정책 변경을 수반 → 별도 Grade C 토픽.

### 5.5 ROI 수치 요약

| 우선순위 | ID | 월 절감(worst) | 구현 시간 | 비재무 위험 |
|---|---|---|---|---|
| #1 MUST_NOW | G5 | 예방적 | 15분 | 없음 |
| #2 HIGH | G3 | $1.35 | 30분 | 없음 |
| #3 HIGH | G2 | $3.91 | 1~2시간 | 낮음 (스크립트 헬퍼 기존 존재) |
| #4 HIGH | G1 | $3.05 | 3~4시간 | 중간 (스냅샷 범위 설계 필요) |
| #5 LOW | G4 | 가변 | 2~3시간 | 낮음 |

**핵심 경보**: 달러 절감보다 **컨텍스트 포화 속도**가 더 시급한 문제다. 현재 74~80% 점유율에서 +28세션이면 품질 저하 임계에 도달한다. G1+G2 집행 시 context를 ~37%로 복원하여 +302세션 여유를 확보한다. 이것이 G1·G2의 진정한 ROI다.

---

[ROLE:fin]
# self-scores
cst_acc: 0.75
roi_dl: 4
rdn_cal: Y
cst_alt: Y
