# Arki rev1 (condensed) — PD-063 SOT 경로 진단

session_192 / topic_165 / Grade A / turn 0

## SOT 정의 vs 실재 (다축 검증)

| 축 | 명문 | 실재 | 갭 |
|---|---|---|---|
| CLAUDE.md D-092 | `metrics` 단일 출처 | jobs(5)/zero(3)/sage(0), 8 role 누락 | 명문 미반영 |
| compile-metrics-registry.ts L48 | `signatureMetrics` 필요 | 11 role 전체 undefined | 빌더 기대 0건 |
| PD-063 | `signatureMetrics` SOT | 동일 | D-092와 필드명 불일치 |
| registry.json (stale) | 49 metrics | 재컴파일 시 8건 (composite7+derived1) | 535b5fa 이전 잔재 |
| git diff 535b5fa | -3,519 라인 대량 삭제 | 마이그레이션 잔재 | 의도/누락 미확정 |

**필드명 3중 분리:** D-092=`metrics` / 빌더=`signatureMetrics` / 데이터=일부 `metrics`.

## 데이터 흐름

[현재] policy 표 ✗→ role_memory.signatureMetrics(0건) ✗→ registry.json(stale 49 우연 잔존) → 대시보드 표면 동작.
**우회로 분담:** D-065 — composite_inputs는 derived 의존성, base metric 대체재 아님.

## 단절 원인 가설

| 가설 | 판정 |
|---|---|
| H1 스키마 누락 | △ |
| H2 박제 hook 부재 | ◯ |
| H3 정책 변경 잔재 (의도적 폐기) | **◯ 강력** — D-092 정신과 시간 정합 |
| H4 자연어 트리거 단절 | ◯ |

**최강 결합 H3+H2:** D-092 부담 폐기로 정공 의도적 절단. 빌더 미수정·D-092 명문도 3개만 채움·registry stale로 표면 유지.

## 복구 옵션

| 기준 | A 정공 mirror | **B 빌더 재정의** | C 우회로 격상 |
|---|---|---|---|
| 코드 변경 | 중 | 중 | 대 |
| D-092 정합 | ✗ | **◯** | △ |
| D-158 정합 | △ | **◯** | △ |
| Silent drift | 고 | **저** | 중 |
| 박제 부담 | 고 | **0** | 중 |

**권고: B (R-B2 보조 JSON)** — D-158 표 SOT 직접 활용, signatureMetrics 잔재 폐기, `memory/growth/metrics_definitions.json`로 부족 25 메타필드 join.

## 리스크

- R-1 stale 49건 dashboard 참조 → diff Master 노출 / grep 사전 확인
- R-2 이름 불일치 → D-092 명문 정정 (Edi anchor)
- R-3 의도적 폐기였다면 D-092 역행 → B는 부담 0이라 역행 아님
- R-4 policy 표 누락 → grep 검증 / 0건+경고
- R-5 49→8 손실 시 derived 깨짐 → B에선 base 재충전 / unit test

### selfScores
- str_fd: 4 / sa_rnd: 2 / aud_rcl: 0.80
