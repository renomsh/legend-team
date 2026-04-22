---
topic: token-revalidation-discrepancy
topicId: topic_074
sessionId: session_071
grade: S
date: 2026-04-22
mode: observation
status: closed
---

# 토큰 재검증 — CC 측정 vs 레전드팀 산출 간 괴리 원인 분석

## 사건 요약

- **현상**: CC 대시보드 "총 토큰 7.9M" vs 레전드팀 token_log `total_billable` 합계 **1,013M**. 약 128배 차이.
- **Master 지시**: 이전 재검증에서 "맞다" 결론 의심. 가설 3개 이상 수립.
- **결과**: 128배 괴리는 **오류가 아닌 정의 불일치**. "총 토큰"이라는 동일 레이블이 두 시스템에서 서로 다른 집계를 가리킴.

## 가설 및 검증 결과

| ID | 가설 | 판정 |
|---|---|---|
| H1 | Cache_read 포함 여부 차이 | ✅ **확정 (부분)** — CC는 cache 2종 제외, 레전드팀은 4필드 전합 |
| H2 | Transcript usage가 누적값이라 중복 카운트 | ❌ 기각 — delta 맞음 |
| H3 | CC 대시보드 범위 차이 (계정 vs 프로젝트) | ❌ 기각 — Master 확인: legend-team만 유효 |
| H4 | 유효 과금 환산 차이 | ❌ 기각 — CC는 raw input+output 그대로 표시 |
| H5 | **CC "총 토큰" = input + output (cache 제외)** | ✅ **확정 (정본)** — 레전드팀 input+output = 7.09M ≈ CC 7.9M 정합 |
| H6 | Compaction 중복 누산 | ❌ 기각 |
| H7 | 대시보드 시간창 차이 | ❌ 기각 |

## 실측 데이터

### 레전드팀 token_log.json 65세션 합계 (session_005~070)

| 필드 | 토큰 수 | API 환산 단가 | API 환산 $ |
|---|---|---|---|
| input_tokens | 168,120 | $3.00/MTok | $0.50 |
| output_tokens | 6,918,864 | $15.00/MTok | $103.78 |
| cache_creation | 56,882,090 | $3.75/MTok | $213.31 |
| cache_read | 949,118,270 | $0.30/MTok | $284.74 |
| **raw 합** | **1,013,087,344** | — | **$602.33** |
| **I/O 합** | **7,086,984** | — | $104.28 (근사) |

- `input + output = 7.09M` ≈ CC 대시보드 "총 토큰 7.9M" (차이는 session_071 등 미반영분).
- Master 실 Max 결제액 ≈ **$104.28** (누적, 주기 내 증가 중).

## 결정 (D-059 포함)

### D1. 정본 지표
- **Primary KPI**: 실 결제액 $ (누적)
- **Secondary KPI**: `tokensPureIO = input + output`
- **보조**: 캐시 효율율(cache_read 점유)
- **감춤**: raw total_billable (상세 접기 패널에만)

### D2. cache_read 처리
KPI 집계에서 제외. 캐시 효율 패널에서만 노출.

### D3. 측정 범위
Legend-team 프로젝트 전용(Master 확인 완료).

### D4. 이전 "맞다" 결론
부분 기각. 비용 계산 로직(PD-018/topic_073)은 유지. 대시보드 레이블·raw 노출은 재작업 대상.

### D-059. 외부 앵커 cross-check 의무 (신규 원칙)
> 측정 지표의 "맞음"을 선언할 때, 내부 재현(self-consistency)만으로는 불충분. 외부 앵커(제3자 시스템·공식 문서·청구서) 최소 1개와의 cross-check 증거를 `logs/evidence_index.json`에 E-NNN으로 남겨야 한다.

- **Why**: session_066/067/068 폐쇄루프 재현 검증이 128배 괴리를 덮었던 사고 방지.
- **How to apply**: Dev 검증 기본값에 "외부 앵커 조항" 추가. KPI·비용·토큰 관련 PD 완료 시 Editor 역검사 게이트에서 요구.

## 대시보드 표시안 (최종 확정)

### KPI 헤더 (Primary)
```
누적 결제액: $104.28    활성 일수: 20일    세션: 71    평균 $/세션: $1.47
```

### 보조 스트립 (Secondary)
```
I/O 토큰 7.09M │ 캐시 효율 93.7% │ 세션당 평균 I/O 99.8K
```

### 세션당 비용 배분
**규칙: 실결제 $ × I/O 토큰 비중 (1번 채택, 최종)**
- `session_N $ = $104.28 × (sessionN_IOtokens / ΣallIOtokens)`
- 예: session_070 I/O 102K / 전체 7.09M = 1.44% → 배분액 $1.50
- $104.28은 Master 청구 페이지 참조 값, 누적 증가. 하이브리드 추정 자동 보조.
- API 환산 $ ($602 등)는 상세 패널 참고용으로만 보존.

### 상세 패널 (접힘)
- 4필드 토큰 분해
- API 환산 $ 필드별 상세
- Max 구독 절감 배수 ($API ÷ $실결제)

## 잔류 리스크 (Riki)

- 🟡 **R-1**: CC "총 토큰" 공식 정의가 Anthropic 문서로 확정되지 않음. 추정 기반. → child 토픽에서 문서 앵커 1건 추가.
- 🟡 **R-2**: 과거 세션(session_001~004, session_035~039 일부) 결손 여부 `tokensPureIO` 재집계 시 점검.
- 🟢 **R-3**: cache_read 93.7% 지배는 효율 지표로 보존 가치 있음.

## 후속 작업 (Child 토픽으로 분기)

| PD | 제목 | Grade |
|---|---|---|
| PD-NEW-A | 대시보드 KPI 개편 — 사용량(I/O 토큰) + 효율(캐시 히트율) Primary 정식화 | B |
| PD-NEW-B | 캐시 효율 보조 패널 + raw 합 상세 접기 + API 환산 $ 보조 스트립 | B |
| PD-NEW-C | 외부 앵커 cross-check 원칙(D-059) evidence_index 등록 + Anthropic 공식 문서 앵커 1건 추가 | C |

## 버전 업데이트

`project_charter.json` **v1.54 → v1.55** (역량 확장 +0.01 — 외부 앵커 원칙 신설).

## 턴 기록

1. Ace (framing, L2) — topicType 판정 + 4 결정축 + 4 가설 풀
2. Arki (실측 선행 + 파이프라인 구조) — H5 확정, 측정 파이프라인 단계별 분해
3. Fin (비용 함의) — $ canonical 확정, Arki 실행계획 오염 금지어 감사 통과
4. Riki (반증) — 폐쇄루프 허위검증 지적, D-059 원칙 후보 제시, 잔류 리스크 3건
5. Ace (종합검토) — D1~D4 결정, D-059 원칙 확정, child 토픽 3건 제안
6. Master — I/O 비중 배분 채택, $104.28 누적 성질 확정, 하이브리드 입력 방식 승인
7. Editor — 본 산출물
