---
role: fin
session: session_141
topic: topic_131
date: 2026-04-29
turnId: 5
invocationMode: subagent
rev: 1
phase: cost-roi-eval
accessed_assets:
  - reports/2026-04-29_big-bang-legend-nexus-p2-1of3/ace_rev2.md
  - reports/2026-04-29_big-bang-legend-nexus-p2-1of3/arki_rev1.md
  - reports/2026-04-29_big-bang-legend-nexus-p2-1of3/riki_rev1.md
  - memory/roles/fin_memory.json
---

# Fin — s141 ROI·적정성 평가 (P2 1/3)

Fin입니다. Master 질문 "투자 ROI와 적정성. 중요도 판단" 정면 답변. Dev 7건 + R-3 3안 + Pareto 80/20.

---

## 0. Arki 실행계획 오염 감사 (선행)

Arki rev1 §5 의존 그래프·검증 게이트·롤백·중단 조건 정독. 금지어(절대 시간/인력/공수) **0건**. Phase 선후·게이트 통과 기준만 사용. **Clean.** (D-017 준수, 본 세션 Fin 감사 통과 선언.)

---

## 1. Dev 7건 항목별 ROI 평가

| # | 항목 | 투자(정성) | 편익 | ROI | 적정성 |
|---|---|---|---|---|---|
| 1 | CLAUDE.md Affaan 4 bullet + 구분선 | 텍스트 추가 1회. 코드 0. | prime directive 가시 박제 → 모든 역할 prepend 영향. R-1·R-6 mitigation 핵심. | 🟢 high | **본 세션 필수** |
| 2 | prime_directive.lock.json (SHA-256) | JSON 1파일 + 해시 산출 1회. | R-1 single point of compromise 차단. D4 자기충실 (코드 박제). | 🟢 high | **본 세션 필수** |
| 3 | validate-prime-directive.ts + auto-push hook | 신규 ts 1개 + auto-push.js 1줄 추가 + 테스트 1회. | mismatch 시 push 차단 — 변조 자동 감지. #2와 짝, 단독 가치 0. | 🟢 high | **본 세션 필수 (#2와 짝)** |
| 4 | ncl_violations.jsonl schema README + sample 1줄 | 빈 파일 + README 박제. | append-only 초기화 + 후속 토픽(132)이 schema 재논의 없이 진입. 사전 박제 가치 = 후속 세션 framing 비용 절감. | 🟡 medium | **본 세션 권고** (단, sample 1줄은 v0 가동 전 dummy data 위험 — schema 주석만 남기고 sample 라인은 v0 가동 시 첫 실 flag로 대체 권고) |
| 5 | dispatch_config.json persona.zero.excludedAssets | JSON 1키 추가. | D-115 페르소나 노출 차단의 텍스트 박제. **현재 Zero 페르소나가 dispatch_config에 미등록 상태일 가능성** → 이 경우 entry 자체 신설 필요(Arki rev1 §4 미명시). | 🟡 medium→🔴 risk | **조건부 권고**: Zero 페르소나 entry 이미 존재 시 수용. 미존재 시 **별도 토픽(134) 분리** — 빈 페르소나에 exclude 키만 박는 건 dead config (false sense of governance). |
| 6 | decision_ledger D-120 statusNote + supersededBy: D-124 | JSON 1엔트리 갱신. | 미래 세션이 D-120 미결로 오인하지 않게 SOT 명료화. legacy ambiguity 방지. | 🟢 high | **본 세션 필수** (저비용 고편익. Edi가 D-122~125 박제 시 자동 동반 가능) |
| 7 | Edi 페르소나(role-edi.md)에 anchor governance 책무 1줄 박제 | 마크다운 1줄 추가. | R-2 mitigation 운영 박제. Edi가 매 세션 종료 시 anchor 후보 list-up 자동 발동. **단 R-2 본체 hook(URL HEAD/DOI 검증)은 v0.1 후속** — 책무만 먼저 박제하면 Edi가 hook 없는 상태로 list-up하는 운영 공백. | 🟡 medium | **본 세션 수용**, 단 "v0.1 hook 가동까지 임시 수동 박제" 명시. 누락 시 책무 박제했는데 작동 안 하는 zombie governance. |

### 1.1 핵심 트레이드오프 (#4·#5 정밀)

- **#4 (jsonl 빈파일 + README)**: 본 세션 박제 가치 = 후속 토픽 진입 마찰 ↓. 비용 = 거의 0. **단, sample 1줄은 dummy data가 NCL 첫 실 flag와 혼동될 위험** (schema는 README에만 명시하고 sample 줄은 생략 권고).
- **#5 (excludedAssets)**: Zero 페르소나가 dispatch_config에 이미 등록되어 있으면 OK. 미등록이면 entry 신설 = Zero 운영 의사결정 미동결 상태에서의 선박제 = D-125 동결과 운영 가동(P3) 사이 공백 기간 동안 dead config. **사전 검증 필요**: Dev가 dispatch_config 현재 상태 read 후 분기 처리.

---

## 2. R-3 3안 비교

| 안 | 직접 비용 | 즉시성 | 숨은 비용 (비재무) | ROI | Fin 권고 |
|---|---|---|---|---|---|
| **A** child 분리 + 임시 통제 = "Master 직접 ack" | 본 세션 0. 후속 토픽 1건 추가. | R-3 enforcement 공백 발생 (체결 ~ 후속 hook 가동까지). | **enforcement 공백 기간 silent dismiss 1회 발생 시 신뢰 자산 훼손** — Affaan 4 D4 시스템 신뢰성 메모리 탈락. echo chamber(s139) 회귀 패턴 부분 재현 비용. 비재무적 학습 루프 손실. | 🟡 medium (즉시 비용 0, 숨은 비용 中) | ⚠ Ace 권고와 부분 이의 |
| **B** 본 세션 흡수 (Dev 5건 추가) | 본 세션 부담 大. R-3 mitigation을 spec→코드로 즉시 승격. | 즉시 차단. | 다른 산출 품질 저하 위험. Dev 단일 세션 12건 처리 = 검증 누락 가능성. | 🔴 low (과투자, Master "최대한" 지시도 무한이 아님) | 거부 |
| **C** child 분리 + 임시 통제 코드 1건만 = "openMasterAlerts 강제 prepend hook" | 본 세션 +1 (단순 hook). 후속 토픽 1건. | 부분 즉시 차단 (TTL 없이도 ack된 flag가 Master 시야 강제 진입). | 절충 = false sense of security 위험. **그러나 본 사례는 false sense 아님** — "ack된 flag도 Master 본다"는 상태가 부분 enforcement가 아니라 R-3 핵심 기제(silent dismiss 차단) 자체를 충족. TTL·escalate는 후속에서 추가. | 🟢 high (저비용, 핵심 누수 즉시 차단) | **권고 ✅** |

### 2.1 Fin 권고: **C안**

- A안 권고(Ace)에 **조건부 이의**. 근거:
  - R-3은 Riki가 🔴 critical로 분류. critical 미tigation을 spec 동결만 하고 코드 0 채로 후속 세션으로 미루는 건, 메모리 [Riki 리스크 대안 의무]·[Affaan 4 D4 자기충실]에 부합하지 않음.
  - C안의 핵심 hook 1건(openMasterAlerts 강제 prepend)은 코드량 작고 기존 hook chain에 자연 결합. **세션 부담 증가 限定的**.
  - A안의 "Master 직접 ack" 임시 통제는 사실상 통제 부재 — 메모리 [저마찰 자율성: 무응답=승인]을 NCL ack에 적용하면 silent dismiss 정상 경로화. self-defeating.
- 단 Master가 "본 세션 진짜 너무 무겁다" 판단 시 A안 수용 가능 — Master 결정 사항.

---

## 3. 중요도 판단 (Pareto 80/20)

### 3.1 박제 결정 4건 우선순위
1. **D-122 (prime directive 박제 + 해시 hook)** — 🟢 critical. P2 전체 정합성의 base. 미박제 시 D1~D4 모두 텍스트 외 단일 박제 부재.
2. **D-124 (판정 주체 + Ace ack 제약)** — 🟢 critical. D-120 미결 종결. echo chamber 회귀 차단 본체.
3. **D-123 (NCL 4항목 조건식 + v0/v0.1 분기)** — 🟡 high. 운영 정합성. 단 v0 가동 코드는 후속.
4. **D-125 (Zero 매핑)** — 🟡 medium. P3 진입 시점 가동. **본 세션 박제는 "운영 정의 동결"이지 가동 아님** — 후순위 가능.

### 3.2 Dev 7건 중 본 세션 미수행 시 가장 위험한 항목
**1순위 위험(미수행 시 큰 손실)**: **#1 + #2 + #3 (CLAUDE.md + lock.json + validator hook 3종 세트)**. 셋 중 하나라도 빠지면 prime directive 박제 불완전 — D-122 박제 결정과 코드 상태 불일치 = 시스템 신뢰성 균열.

**1순위 안전(미루기 OK)**: **#5 (excludedAssets)**. Zero 가동(P3) 전엔 dead config. 미등록 시 P3 직전 토픽에서 Zero entry 본체와 함께 박제하는 게 응집도 高.

### 3.3 양보 불가 코어 (Pareto 80/20 ≈ 본 세션의 핵심 20%)

**양보 불가 2건:**
- **C-1**: CLAUDE.md Affaan 4 + lock.json + validator hook (3종 1체) — D-122 코드화 본체.
- **C-2**: D-124 박제 + R-3 임시 통제 (C안 hook 1건) — Ace ack silent dismiss 차단 본체.

**나머지(D-123/D-125 박제 + Dev #4/#6/#7)는 cleanup 카테고리** — 코어 2건이 들어가면 80% 가치 확보. cleanup은 양보 가능하나 #6 (D-120 statusNote)은 Edi 자동 박제로 거의 무비용.

---

## 4. 외부 anchor (D-059)

- **Pareto Principle (Vilfredo Pareto, 1896 / Joseph Juran 1941 quality management 적용)** — 산출의 80%는 입력의 20%에서 나옴. 본 세션 양보 불가 코어 2건(C-1·C-2) 식별의 분석 프레임.
- **NIST SP 800-160 Vol.2 (2021) Cyber Resiliency** §D.5 "Privilege Restriction" — Ace ack 권한 제한 (severity 자가분류 권한 회수)이 R-3 mitigation의 표준 통제. C안 hook 정당성 cross-check.
- **Brooks's Law (Fred Brooks, "The Mythical Man-Month" 1975)** — "Adding manpower to a late project makes it later" 유추: 단일 세션에 산출 12건 흡수(B안)는 검증 품질 저하 → R-3 mitigation 자체가 부실 통제로 변질 위험. B안 거부 근거.

---

## 5. 비재무적 자산 영향

- **학습 루프**: A안 채택 시 R-3 enforcement 공백 동안 "critical 위험을 spec만 박제하고 코드 미수행" 패턴이 메모리 누적 → 향후 critical risk 처리 표준 약화. C안은 이 패턴 차단.
- **역할 진화**: D-124의 Ace ack 권한 제한(severity 자가분류 권한 회수)은 Ace 페르소나 메타 진화 — "오케스트레이터지만 enforcement 자율 분류 권한 없음"으로 정합성 강화. 본 세션 박제 시 즉시 효과.
- **Master 인지부하**: C안의 openMasterAlerts 강제 prepend는 Master 시야 강제 진입 1회 추가. 단 ack된 flag만 대상이라 일반 alert 폭주 아님 — 인지부하 증분 限定的.

---

## 6. Self-score YAML

ROLE_WRITE_DONE: reports/2026-04-29_big-bang-legend-nexus-p2-1of3/fin_rev1.md

FIN_WRITE_DONE: reports/2026-04-29_big-bang-legend-nexus-p2-1of3/fin_rev1.md

[ROLE:fin]
# self-scores
cst_acc: 0.85
roi_dl: 4
rdn_cal: Y
cst_alt: Y
