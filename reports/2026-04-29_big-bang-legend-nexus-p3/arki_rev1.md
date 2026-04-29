---
role: arki
session: session_140
topic: topic_131
date: 2026-04-29
turnId: 1
invocationMode: subagent
rev: 1
---

# Arki 구조 검토 — NCL 인프라 + Sage 외부 채점 + Riki 잔존 구조

## 결론

✅ **구조 성립** — 3-Layer 분리 (인프라 / 페르소나 / 메타) 가 깔끔하다. 단 2개 미정 영역이 spec 동결 전에 닫혀야 함 (B-1, B-2).

---

## 1. 3-Layer 데이터 흐름

```
[발언 Layer]                    [기록 Layer]                  [메타 Layer]
페르소나(Ace/Arki/Dev/Riki/...)   NCL 인프라                     Sage
        │                            │                            │
   발언 produce  ──────────────▶  영수증 발행 (자동)         세션 종료 후 read
        │                            │                            │
        │                       receipts.jsonl                    │
        │                       (append-only)                     │
        │                                                         ▼
        │                                                  채점 산출
        │                                                  (페르소나×지표)
        │                                                         │
        │                                                         ▼
        │                                                  NCL에 영수증 발행
        │                                                  (R-4 mitigation)
        │                                                         │
        ▼                            ▼                            ▼
                            ┌────────────────────┐
                            │ Master 직접 판독   │  ← 단일 의사결정 지점
                            └────────────────────┘
```

핵심 의존:
- 페르소나 → NCL: 단방향 produce (페르소나는 NCL 출력을 read 하지 않음 — echo loop 차단)
- NCL → Sage: 단방향 read (Sage는 NCL에 직접 write 권한 없음, 영수증으로만 기록)
- Sage → NCL: 자기 채점도 영수증화 (R-4 닫기)
- 모든 레이어 → Master: 판독 게이트

---

## 2. 기존 시스템 정합성

### ✅ 호환
- **Turn Push Protocol (D-048)**: NCL 영수증 = turn 단위 부산물. `current_session.json.turns[]` 기록 시점에 NCL append 동시 트리거 가능. 기존 hook chain (`session-end-finalize.js`)에 한 단계 추가만 하면 됨.
- **selfScores 폐기 대체 (D-092)**: 자가 채점 → Sage 외부 채점은 D-092의 "단일 출처" 원칙과 충돌 안 함. `metrics_registry.json`은 정의만 보유하고, 값은 Sage 산출물로 이동.
- **decision_ledger.json**: NCL은 기여도 영수증, decision_ledger는 결정 박제 — 별개 자산. 충돌 없음.

### ⚠ 마찰
- **기존 `selfScores: {key: value}` YAML 블록 (현 hook v3가 prepend하는 공통 정책)**: 즉시 폐기 시 모든 역할 페르소나 spec 동시 갱신 필요. Big Bang P3 범위에 포함되는지 Master 확인 필요.
- **PD-035 (self-score YAML 출력 계약)**: 본 세션 응답까지는 self-scores YAML 출력 의무. P3 spec 동결 시 PD-035 폐기 결정 동반 필요.

---

## 3. 구조적 제약·전제

### 전제 (P3 spec 박제 시 충족 필요)
- T-1: NCL 영수증 스키마 확정 (필드: turn_ref, persona, timestamp, raw_quote, metric_tags?, ...)
- T-2: 영수증 발행 트리거 = Turn Push와 동일 시점 (D-048 hook 재활용)
- T-3: Sage 채점 알고리즘은 spec이 아닌 prompt 레벨 (Sage 페르소나 정의에 포함)
- T-4: Master 판독 진입 경로 = viewer 페이지 신설 또는 기존 dashboard 패널 추가

### 제약
- C-1: 영수증은 append-only. 수정·삭제 금지 (분개장 원칙).
- C-2: Sage는 같은 세션 내 발언 페르소나로 호출 금지 (시간·머리 분리 원칙).
- C-3: NCL이 페르소나 발언을 자동 해석·요약하면 인프라 경계 위반.

### 깨지는 조건
- B-1: NCL 영수증 자동 해석 알고리즘이 시스템 내부에 도입되면 → 인프라/메타 경계 붕괴 → echo chamber 재발생
- B-2: Sage 채점이 자동으로 페르소나 가중치·dispatch 로직에 반영되면 → automation-in-loop 원칙 위반 → SPOF 형성

---

## 4. 미정 영역 (P3 spec 동결 전 결정 필요)

| ID | 미정 사항 | 결정 주체 | 영향 |
|---|---|---|---|
| U-1 | NCL 영수증 스키마 필드 확정 | Arki 후속 turn / Dev | T-1 |
| U-2 | Sage 호출 시점 (세션 종료 직후 자동 / Master 수동 요청) | Master | C-2 강도 |
| U-3 | Sage 채점 영수증의 Master 판독 채널 (viewer / report 파일 / 대시보드) | Vera·Arki | R-4 mitigation 완결 |
| U-4 | 기존 self-scores YAML 폐기 시점 (P3 동결 즉시 / 점진적) | Master | persona spec 갱신 범위 |
| U-5 | NCL 저장 위치 (`memory/shared/ncl/receipts.jsonl` 제안) | Arki | 파일 구조 |

---

## 실행계획 (P3 페르소나 박제 단계 — 구조적 선후)

- **Phase 1**: NCL 영수증 스키마 + 저장 경로 spec 박제 (U-1, U-5 결정 후)
- **Phase 2**: Sage 페르소나 spec 박제 (호출 시점 U-2 결정 후) — `agents/sage.md` 신규 + `memory/roles/policies/role-sage.md` 신규
- **Phase 3**: hook 통합 — Turn Push 시점에 NCL append 트리거 (D-048 hook 확장)
- **Phase 4**: Master 판독 채널 구현 (U-3 결정 후)
- **Phase 5**: 기존 self-scores YAML 폐기 (U-4 결정 후)

게이트:
- G-1 (Phase 1→2 통과): 영수증 스키마가 모든 페르소나 발언 형태를 커버하는지 검증 (Riki adversarial)
- G-2 (Phase 2→3): Sage spec이 C-2 (시간·머리 분리)를 지키는지 검증
- G-3 (Phase 3→4): NCL append가 페르소나 발언 latency를 증가시키지 않는지 측정
- G-4 (Phase 4→5): Master 판독 채널이 실제 사용 가능한지 1회 dry-run

롤백:
- Phase 3 실패 시: hook 변경만 revert, Sage spec은 dry 상태로 유지 (Phase 2까지의 자산 보존)
- Phase 5 실패 시: self-scores YAML 병행 운영 모드로 복귀 (양립 가능)

중단 조건:
- B-1 또는 B-2 위반 설계가 발견되면 즉시 중단

---

```
[ROLE:arki]
# self-scores
aud_rcl: Y
str_fd: 4
spc_lck: N
sa_rnd: 2
```
