# Arki — PD-063 signatureMetrics SOT 경로 복구 (구조 진단)

session_192 / topic_165 / Grade A / turnIdx 0

## 1. 현재 SOT 정의 vs 실재 (다축 검증)

| 축 | 명문 | 실재 | 갭 |
|---|---|---|---|
| **CLAUDE.md D-092** | "단일 출처는 `memory/roles/{role}_memory.json[].metrics`" | `metrics` 필드: jobs(5), zero(3), sage(0). 8 role 누락 | 명문이 약속이었거나 폐기 미반영 |
| **compile-metrics-registry.ts L48** | `if (!Array.isArray(mem.signatureMetrics)) continue;` | 11 role 전체 `signatureMetrics: undefined` | 빌더 기대 필드 0건 |
| **PD-063** | `signatureMetrics`가 SOT라 명시 | 위와 동일 | **D-092 본문과 필드명 불일치** |
| **registry.json (stale)** | 49 metrics | 빌더 재실행 시 8건만 (composite 7 + derived 1) | session 535b5fa(2026-04-30) 이전 컴파일 결과의 잔재. 이후 미재컴파일 |
| **git diff 535b5fa** | 11 role_memory에서 signatureMetrics/persona/responsibility 대량 삭제 (-3,519 라인) | "9agent-persona-policy-upgrade-v1.1" / "pd053-10roles-3axes-master-review" 마이그레이션 잔재 | 의도적 폐기인지 마이그레이션 누락인지 미확정 |

**필드명 3중 분리:** D-092=`metrics` / 빌더=`signatureMetrics` / 데이터=일부만 `metrics`. 정의 SOT, 실 SOT, 데이터가 모두 다른 이름.

## 2. 데이터 흐름 그래프

```
[본래 설계 — 535b5fa 이전]
policy self-score 표 → role_memory[].signatureMetrics → 빌더(정공)
                                                       + composite_inputs (보조, D-065)
                                                       + derived_metrics (보조)
                                                       → registry.json

[현재 — 535b5fa 이후]
policy self-score 표 (D-158 통일)
   ✗ 박제 경로 단절
role_memory[].signatureMetrics = [] (전체 0건)
   ✗ 빌더 재실행 시 49 → 8 (41건 손실)
registry.json (stale 49건이 우연히 남아 대시보드 표면 동작)
```

**우회로 분담:** D-065 명시 — composite_inputs는 derived 해석용 의존성이지 base metric 정의 대체재 아님. 정공 복구 없이는 base metric 정의 0건.

## 3. 단절 원인 가설 다축 검증

| 가설 | 증거 | 판정 |
|---|---|---|
| H1. 스키마 정의 누락 | role_memory에 signatureMetrics 0건 | △ — 필드 정의 가능하나 데이터 삭제됨 |
| H2. 박제 hook 부재 | signatureMetrics를 write/append하는 hook 0건 | ◯ — 박제 메커니즘 자체 부재 |
| H3. 정책 변경 잔재 (의도적 폐기) | 535b5fa "pd053-10roles-3axes-master-review"에서 대량 삭제. D-092 "측정 위한 측정 금지" 정신과 시간 정합 | **◯ 강력** — D-092 정신으로 박제 부담 폐기, 빌더 코드만 미정리 |
| H4. 자연어 트리거 단절 | D-092=`metrics`, 빌더=`signatureMetrics`, PD-063=`signatureMetrics` 3 이름 분산 | ◯ |

**최강 결합 (H3+H2):** D-092 자가평가 단순화에서 박제 부담을 의도적 폐기. (a) 빌더 코드 미수정, (b) D-092 명문 `metrics`도 11 role 중 3개만 채움, (c) registry는 stale snapshot으로 표면 동작 유지. **정공 경로는 의도적으로 끊겼고 시스템은 stale snapshot으로 동작 중.** D-158 신규 shortKey가 위험한 이유 — registry 진입 경로가 없다.

## 4. 복구 옵션 trade-off

### A. signatureMetrics 정공 복원 (mirror 신설)
- 의존: git history(◯) + sync hook(✗ 신설)
- 결합: policy ↔ role_memory(mirror) ↔ registry — 3계층
- D-092 정합 ✗ (부담 증가) / D-158 정합 △ (이중 갱신)

### B. 빌더 SOT 경로 재정의 (policy 직접 파싱) ★
- 의존: D-158 통일 표 — **이미 충족**
- 결합: policy(SOT) → 빌더 → registry — **1계층**
- D-092 정합 ◯ / D-158 정합 ◯
- 코드 변경: md 파서 + 보조 JSON(부족 25 필드용)

### C. 우회로 격상 (base_metrics.json 신설)
- 의존: 신규 base_metrics.json + 49건 마이그레이션
- 결합: growth/ 단일 디렉토리 집중. policy 표와 **이중 SOT 위험**
- D-092 정합 △ / D-158 정합 △

**구조적 권고: B (R-B2 보조 JSON 적용)** — D-158 표를 SOT로 직접 활용. signatureMetrics 잔재 명시 폐기. 부족 메타필드는 `memory/growth/metrics_definitions.json` 보조 SOT로 shortKey join. SOT 1계층, mirror 0개, 박제 자동화 부담 0.

| 기준 | A | **B** | C |
|---|---|---|---|
| 코드 변경량 | 중 | 중 | 대 |
| D-092 정합 | ✗ | **◯** | △ |
| D-158 정합 | △ | **◯** | △ |
| Silent drift 가능성 | 고 | **저** | 중 |
| 박제 자동화 부담 | 고 | **0** | 중 |

## 5. 리스크 + mitigation/fallback

| ID | 리스크 | Mitigation | Fallback |
|---|---|---|---|
| R-1 | stale 49건이 대시보드 참조 중 → 정정 시 표면 변화 | 빌더 재실행 전 stale snapshot 보존, diff Master 노출 | 옵션 채택 전 dashboard read 경로 grep 확인 |
| R-2 | D-092(`metrics`) vs 빌더(`signatureMetrics`) 이름 불일치 | D-092 명문 정정 (Edi anchor governance). B 채택 시 `metrics`로 통일 권장 | 코드 내부 변수만 단일화 |
| R-3 | 535b5fa가 의도적 폐기였다면 복구가 D-092 역행 | 복구 전 Master 의도 재확인 | B는 부담 0이므로 D-092 역행 아님 |
| R-4 | 11 role policy 표 누락 가능 | B 구현 전 grep 검증 | 누락 role은 0건 빌드 + 경고 |
| R-5 | 49 → 8 손실 시 derived가 inputs 못 찾음 | B에선 base metric도 빌더가 다시 채움 | derived 빌드 단위 테스트 |

---

### selfScores
- str_fd: 4 / sa_rnd: 2 / aud_rcl: 0.80
