---
role: edi
topic: topic_164
session: session_191
turnId: 4
invocationMode: main-inline-fallback
accessed_assets:
  - memory/shared/topic_index.json
  - memory/shared/decision_ledger.json
  - memory/shared/system_state.json
  - memory/growth/metrics_registry.json
  - memory/roles/policies/role-*.md
note: "Edi subagent invocation는 zero-condense gate false positive로 2회 차단됨. main inline fallback로 작성 (D-131). _zero_condense.json 마커 정상 존재 확인."
---

# Edi — Self-Score 지표 표 형식 통일 종합 (topic_164, session_191)

## 세션 요약

PD-060(Zero R3 발굴, session_188) 이행 토픽. Arki 4컬럼 강제 권고 → Master `/jobs-framing` 호출 → Jobs B안(문법 통일·컬럼 가변) 채택. Dev 8개 policy 변환 −600B + scale drift 5건 registry SOT 정정. Riki 적대적 검토 KILL 0, 부분 GO 2건(byte anchoring caveat·컬럼 가변 jobs 패턴 참조), 신규 발견 1건(weight SOT 부재 → PD-062 분리). Master 추가 질의로 growth 데이터 경로 단절(signatureMetrics 0건) 발견 → PD-063 high 분리.

## 결정 흐름 표

| # | 단계 | 역할 | 출력 |
|---|---|---|---|
| 1 | 구조 분석 | Arki | 8 변환 / jobs 7컬럼·zero 4컬럼 / 4컬럼 강제(A안) 권고 / weight SOT 부재 적출 / signatureMetrics 0건 적출 |
| 2 | 프레이밍 (`/jobs-framing` 명시 호출) | Jobs | 본질=정의 보존+시각 통일 / B안(문법 통일·컬럼 가변) 권고 / lint NO / anchoring 자가 적출 |
| 3 | 결정 | Master | "문법만 통일, 컬럼 가변" (B안 채택) |
| 4 | 변환 | Dev | 8 파일 −600B / drift 5건 registry SOT 정정 / weight 보존 |
| 5 | 적대적 검토 | Riki | KILL 0 / GO 3 / 부분 GO 2 (byte anchoring caveat + 컬럼 가변 jobs 패턴 참조) / 신규 R-1 |
| 6 | Master 질의 | Master | "growth 업데이트 안 되는 건 PD-062/PD-063 중?" → PD-063 직접 원인 확정 |
| 7 | Zero condense | Zero | 4 condensed.md + _zero_condense.json 마커 |
| 8 | 컴파일 | Edi | 본 보고서 + D-158 박제 + PD-060 resolved + PD-062·PD-063 신규 |

## 변경 파일 (8건)

| 파일 | before | after | delta |
|---|---|---|---|
| role-ace.md | 2,450 | 2,380 | −70 |
| role-arki.md | 2,454 | 2,448 | −6 |
| role-dev.md | 2,383 | 2,275 | −108 |
| role-edi.md | 6,341 | 6,168 | −173 |
| role-fin.md | 1,320 | 1,223 | −97 |
| role-nova.md | 1,952 | 1,869 | −83 |
| role-riki.md | 1,359 | 1,372 | +13 |
| role-vera.md | 1,382 | 1,306 | −76 |
| **합계** | **19,641** | **19,041** | **−600** |

미수정: role-jobs.md(7컬럼 유지) / role-zero.md(4컬럼 유지) / role-sage.md(write 면제, D-126).

### scale drift 정정 (registry SOT 채택, 5건)

| role | shortKey | before | after |
|---|---|---|---|
| ace | ctx_car | ratio | 0-5 |
| ace | mst_fr | ratio | 0-5 |
| arki | aud_rcl | Y/N | ratio |
| riki | crt_rcl | Y/N | ratio |
| riki | cr_val | 0-5 | Y/N |

## 통일 spec (D-158 채택)

- 섹션 헤더: `## Self-Score 지표 (N건)`
- 첫 컬럼 = `shortKey` (필수)
- 마지막 컬럼 = `설명` (필수)
- 최소 3컬럼, 최대 무제한 — **컬럼 수는 지표 정의 풍부도가 결정**
- weight 표기: `0.50 (core)` 또는 `0.20`
- 금지: shortKey 첫 컬럼 아닌 경우 / 설명 마지막 아닌 경우 / yaml+bullet 혼재

## 결정 박제

- **D-158** (decision_ledger.json SOT 참조) — Self-Score 표 형식 통일, Jobs B안 채택, Arki A안(4컬럼 강제) 거부.

## PD 변경

- **PD-060 resolved** — 이번 토픽이 본문. session_191 / topic_164 / D-158으로 종결.
- **PD-062 신규** — weight 필드 SOT 부재 (registry에 weight 컬럼 없음). resolveCondition: drift 1건 이상 발견 OR Master 명시 재오픈.
- **PD-063 신규 (high)** — `{role}_memory.json[].signatureMetrics` 모든 role 0건. `compile-metrics-registry.ts` line 43-50 input 경로 단절. growth registry는 현재 `composite_inputs.json` + `derived_metrics.json` 우회로만 동작. policy self-score 표의 신규 shortKey가 자동 등록되지 않는 위험. resolveCondition: signatureMetrics 채우기 OR SOT 경로 재정의.

## Self-Score 통합

| 역할 | 지표 |
|---|---|
| arki | aud_rcl: N / str_fd: 4 / spc_lck: N / sa_rnd: 1 |
| jobs | (인라인 메인 발화 — agent 박제 없음) |
| dev | fix_cnt: 8 / runtime_pass: 1 / hardcode_cnt: 0 |
| riki | crt_rcl: 0.40 / cr_val: Y / prd_rej: N / fp_rt: 0.20 |
| zero | ref_cnt: 4 / hc_found: 0 / cln_rt: 1.0 |
| edi | gp_acc: 0.95 / scc: Y / cs_cnt: 4 / art_cmp: 1.0 / gap_fc: 0 |

## Riki caveat 명시

- **F5 (byte anchoring)**: 변환 효과는 표 일관성·의미 보존·정의 가시성에 있다. byte 절감(−600B)은 부산물. Zero R3 추정(~1.2-2.4KB)은 비교 기준이 아니다. session_190 R3 패턴 재발 방지.
- **F4 (컬럼 가변 정신)**: 변환 8건이 4컬럼으로 자연 수렴한 것은 정보 풍부도가 동질했기 때문. 향후 axis/polarity/rater 등 추가 컬럼 필요한 role 발생 시 jobs 7컬럼 패턴 참조. **컬럼 가변 원칙은 유효**.

## 인계 메모

- PD-063은 D-092 SOT 표현(`{role}_memory.json[].metrics`)과 현실(0건) drift의 본질. 다음 세션에서 별 토픽으로 분기 가능.
- weight 컬럼은 휴리스틱 운영 정보로 잔존. 합 1.0 강제 검증 없음 (현행 유지).
- Persona Layer 정제 누적: 1차(D-155, −5,407B) + 2차(D-157, −91B) + 3차(D-158, −600B) = **−6,098B**.

## versionBump (Edi 확정)

- value: 0.01
- type: capability
- reason: 정책 결정(D-158) 신규 1건 + mechanical refactor 8건. 구조 변경 아님 → +0.01 (역량 확장) 적정.
- confirmedBy: edi
- confirmedAt: 2026-05-05T13:00:00.000Z

## 미해결 이슈·Gap

없음. R-1(weight SOT)·signatureMetrics 0건은 PD-062·PD-063 박제로 명시 인계. F4·F5 caveat은 본 보고서 명시 반영.

selfScores: {gp_acc: 0.95, scc: Y, cs_cnt: 4, art_cmp: 1.0, gap_fc: 0}

[ROLE:edi] EDI_WRITE_DONE
