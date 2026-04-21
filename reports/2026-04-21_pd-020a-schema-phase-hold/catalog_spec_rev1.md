---
topic: PD-020a 스키마 + phase×hold 기반 구현
sessionId: session_054
artifact: catalog_spec
rev: 1
---

# Catalog 명세 v1 (2개 신설)

D-047 status_catalog 패턴의 자연스러운 확장. 모든 enum은 코드 박힘 금지, catalog 단일원천 참조.

## 1. phase_catalog.json (`memory/shared/phase_catalog.json`)

```jsonc
{
  "schemaVersion": "v1",
  "phases": ["framing", "design", "implementation", "validated"],
  "displayLabels": {
    "framing": "프레이밍",
    "design": "설계",
    "implementation": "구현",
    "validated": "검증완료"
  },
  "aliases": {},        // 향후 이름 변경 시 구→신 매핑 (예: "build": "implementation")
  "deprecated": [],     // 신규 부여 금지, 과거 데이터는 valid (예: ["draft"])
  "transitions": null,  // 자유 전이 v0. 전이 그래프는 PD-020c
  "_notes": [
    "RK-1 대응: aliases/deprecated 빈 배열로 사전 정의 — 향후 변경 시 breaking 회피",
    "validator는 phase ∈ phases ∪ aliases.keys() ∪ deprecated 모두 허용",
    "신규 토픽 부여는 phases \\ deprecated 만"
  ]
}
```

## 2. hold_reasons_catalog.json (`memory/shared/hold_reasons_catalog.json`)

```jsonc
{
  "schemaVersion": "v1",
  "reasons": [
    "waiting-decision",
    "upstream-block",
    "deprioritized",
    "external-dependency",
    "resource-constraint"
  ],
  "displayLabels": {
    "waiting-decision": "결정 대기",
    "upstream-block": "상위 차단",
    "deprioritized": "우선순위 낮춤",
    "external-dependency": "외부 의존",
    "resource-constraint": "자원 제약"
  },
  "aliases": {},
  "deprecated": [],
  "_notes": [
    "hold.reason 필드는 본 카탈로그 reasons만 허용",
    "자유 텍스트 사유는 hold.note 필드에",
    "신규 reason 추가는 catalog 갱신 → schemaVersion bump"
  ]
}
```

## 3. catalog 운용 규칙

### 변경 정책
| 변경 종류 | 절차 |
|---|---|
| 신규 enum 추가 | `phases`/`reasons` 배열에 추가. schemaVersion bump 불필요 (additive). |
| 이름 변경 | 구 enum을 `deprecated[]`에 추가 + `aliases`에 매핑. 신규 데이터는 신 enum, 기존 데이터는 alias 경유 valid. |
| enum 제거 | `deprecated[]` 추가 후 6개월 유예 → 마이그레이션 → 실제 배열에서 제거. |
| schemaVersion bump | 위 호환 메커니즘으로 흡수 불가능한 breaking change 시에만. |

### Reader 강제
- 모든 코드는 catalog 동적 로드 (require/import). 코드에 enum 값 박힘 금지.
- `validate-topic-schema.ts`의 `assertPhase` · `assertHold` 경유 강제.
- 카탈로그 부재 시 validator 실패 (fail-fast).

### Writer 강제
- `create-topic.ts` 신규 phase 부여 시 `phases \ deprecated` 집합에서만 선택.
- `append-session.ts` phase 전환 시 동일 규칙.

## 4. 분리 산출 근거 (Fin 권고)

catalog 정의 = **데이터 정의**.
schema 정의 = **구조 정의**.

분리 시 향후 catalog만 수정하는 작업이 schema 변경과 섞이지 않음. 디버깅·롤백 단위 명확. 본 세션 P1에서 별도 커밋으로 산출.
