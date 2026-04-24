---
title: "session_089 Arki — 구조 감사·복구·composite 재정의"
session: session_089
topic: topic_094
date: 2026-04-24
author: arki
---

# Arki 구조 진단 — P0b overwrite 사고 및 composite 재정의 두 축

## 1. P0b overwrite runtime 파괴 진단 (Ace damage report 보강)

에이스 파일 수준 분석은 정확했으나 **런타임 contract 수준** 누락 3건 보강:

### 1.1 스키마-instance 검증 미수행
- `metrics-registry.schema.json` (Slice 2 재작성): draft 2020-12 meta-schema
- 기존 Ajv(draft-07)는 이 meta-schema 미등록 → compile-metrics-registry.ts crash
- S1 재현 검증에서 확인: `no schema with key or ref "https://json-schema.org/draft/2020-12/schema"`

### 1.2 이중 타입 소스 위험
- 기존: `scripts/lib/signature-metrics-types.ts`
- 신규: `types/signature-metrics.d.ts` (Slice 1·P0a 생성)
- Slice 1 lib 파일들이 신규 경로 `../../types/signature-metrics.js` import
- 기존 downstream 6개 파일은 기존 경로 유지 → 런타임 shape drift 위험
- legacy-compat wrapper로 은폐됐으나 본질적 문제 유지

### 1.3 import 확장자 문제
- Slice 1 lib들이 nodenext 스타일 `.js` 확장자 import
- ts-node CommonJS 환경에서 resolve 실패 → test-p0b-smoke / compute-signature-metrics 모두 crash

**복구 결론**: 에이스 경로 A(선별 git restore) + types/ 제거 + 14 파일 원상 → 전 scripts 재검증 PASS

## 2. Composite 재정의 2건 (Master 감사 결과)

### 2.1 `dev.gate_pass_rate` → derived composite
Master 감사에서 **부풀림 증거** 발견:
- raw=1 (100점) 주장 지지하는 축: 첫 시도 pass (사실)
- 누락 축: 시도 횟수·사후 디버깅·하드코딩 비율

**재정의**:
```
dev.gate_pass_rate (derived, weighted-mean, polarityNormalized)
  ├─ dev.first_try_pass_rate       (weight 0.35, higher-better)
  ├─ dev.retry_count_per_phase     (weight 0.20, lower-better)
  ├─ dev.post_gate_debug_count     (weight 0.25, lower-better, timing=deferred)
  └─ dev.hardcoding_ratio          (weight 0.20, lower-better)
```

### 2.2 `editor.gap_flag_count` → derived composite
Master 감사에서 **Edi 구조 감사 역량 약점** 발견:
- 기계적 gap 0건 주장과 달리 PD 미전이·session_index undefined 필드 등 구조 gap 다수 누락

**재정의**:
```
editor.gap_flag_count (derived, weighted-mean, polarityNormalized)
  ├─ editor.mechanical_gap_count      (weight 0.30)
  ├─ editor.structural_gap_severity   (weight 0.45, 핵심)
  └─ editor.retroactive_gap_discovery (weight 0.25, timing=deferred)
```

### 2.3 구조 제약 준수
- Master 지시: "Dev/Edi signatureMetrics ≤ 4" (< 5) 유지
- 신규 base metric 7종은 signatureMetrics 배열 **미포함**, `memory/growth/composite_inputs.json` 분리
- compile-metrics-registry.ts가 composite_inputs.json 스캔하도록 확장
- 결과: metrics_registry 29 → 36, sourceHash 8d314a → 1c555d20

## 3. Self-score MVP 실가동 구조 감사

70 records 분포:
- **실 yaml-block: 10건 (14%)**
- **default-fallback propagation: 60건 (86%)**
- session_086~089 4세션 연속 YAML 0건

### 구조적 원인 6가설 (PD-031)
1. Master 관심 부족
2. finalize hook YAML 자동 추출 실패
3. YAML 포맷 학습 장벽
4. 역할별 shortKey 기억 어려움
5. 입력 도구 부재 (batch-score-helper.ts 미구현, G6.2 ②)
6. 출력 surface staged (topic_082 대기, G6.2 ③)

### 즉시 대응 (D-065 B)
- `feature_flags.allowDefaultFallback: false` 추가
- `finalize-self-scores.ts`가 이 flag 체크 → YAML 미기입 시 participationGaps로 이관
- 결과: 다음 세션부터 propagation 차단, 정직한 데이터

## 4. Riki 기능 내재화

이번 세션에서 Riki 독립 호출 없이 Arki 구조 진단에 리스크 감사 내포:
- Ace damage report 과소평가 지점 3건 보강 (1.1~1.3)
- 회귀 테스트 미실행 플래그 → S1 재현 검증 필수화 권고
- tsconfig include 변경 파급 효과 선제 분석

Grade S 선언 대비 실질 work는 acceptance·cleanup 수준 → grade mismatch 누적 기록.
