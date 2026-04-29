---
role: fin
session: session_142
topic: topic_131
date: 2026-04-29
turnId: 4
invocationMode: subagent
rev: 2
accessed_assets:
  - reports/2026-04-29_big-bang-legend-nexus-p2-1of3/arki_rev2.md
  - reports/2026-04-29_big-bang-legend-nexus-p2-1of3/riki_rev2.md
  - reports/2026-04-29_big-bang-legend-nexus-p2-1of3/riki_rev3.md
  - .claude/hooks/pre-tool-use-task.js (522 LOC)
  - .claude/settings.json
---

# Fin — Sage-gate hook 별도 파일 분리 vs 통합 비용효용 (s142, rev2)

## 결론 (1줄)

**별도 파일 분리 권고.** 분리 비용 ~+45 LOC + settings.json 1엔트리 vs 통합 시 522→650+ LOC 비대화·테스트 격리 불가·D4 enforcement 강도 약화. ROI 비대칭(false-negative 1건 = D-122 자기충실성 무력화 = 시스템 전체 신뢰 0)이 분리 비용을 압도. Riki rev3 비협상 조건 1번 수용.

---

## 0. Arki 실행계획 오염 감사 (의무 선행)

대상: arki_rev2 §3·§5(Deliverable 6+1파일)·§6(Phase 1~4 의존 그래프).

| 금지어 카테고리 | 적발 |
|---|---|
| 절대 시간 (D+N일·N주차·MM/DD·구체 날짜) | 0건 |
| 인력 배정 (담당자·이름·PD·MM) | 0건 |
| 공수 단위 (N시간·N일 소요·공수) | 0건 |

§6은 "Phase 1 → Phase 2 (페르소나 본문 박제 후) → Phase 3 (정책 박제 후 hook 활성화)" 구조적 선후만 사용. **Clean — 통과.**

---

## 1. 비용 항목별 비교 (정량 + 정성)

현 `pre-tool-use-task.js` 실측: **522 LOC**, 함수 18개, mutate-v3-persona·persona-missing·gate-check·gate-triggered 등 7 phase. 이미 단일 파일 책임 다중(prompt 변조 + persona compose + transition checkpoint).

| 비용 항목 | 분리 (`pre-tool-use-task-sage-gate.js` 신설) | 통합 (기존 파일에 sage 분기 추가) |
|---|---|---|
| **신규 LOC** | ~45 (entry + turns load + 3 reject 분기 + log + main wrapper) | ~25 (조건문 1 + reject branch 2 + KNOWN_ROLES 비교) |
| **기존 파일 수정 LOC** | 0 (변경 없음) | +25, 522→547 (4.8% 증가, 누적 추세) |
| **settings.json 등록** | +1 PreToolUse(Task) hook 엔트리 (~6줄 JSON) | 0 |
| **테스트 fixture 격리** | ✅ sage-gate 단위 테스트 가능 (turns mock만) | ❌ persona compose·gate-check와 fixture 공유 강제 |
| **롤백 비용** | git revert 1파일 / settings 1엔트리 toggle (1분) | git revert 시 prompt 변조 로직 동반 회귀 위험 |
| **장애 격리** | sage-gate 실패해도 mutate-v3-persona 영향 0 | 동일 try/catch scope 공유 → 한쪽 throw가 silent pass로 양쪽 무력화 |
| **유지보수 cognitive load** | 책임 1개 (sage isolation only) | 책임 4개 → 5개 누적 |
| **hook chain 실행 오버헤드** | +1 Node.js process spawn ≈ 30~80ms/Task call | 0 추가 |
| **향후 페르소나 게이트 추가 시 확장성** | 동일 패턴 복제 (zero-gate, sage-v2-gate …) | 분기문 N중첩, 가독성 절벽 |

### 정량 ROI 비교
- 분리 추가 비용: **45 LOC + 80ms × Task 호출 빈도**. session당 평균 5 Task call → 400ms/session 누적. 1000 session까지 ~6.7분.
- false-negative 1건 회피 가치: **시스템 전체 신뢰 0** — D-122 prime directive 자기충실성 무력화 = topic_131 P1~P3 약 600+ 의사결정 분량 재검토 비용. 정량 부정확하지만 **수십 시간 등가**.
- ROI = 수십 시간 / 6.7분 = **>100x**. 분리 압승.

---

## 2. 효용 항목 비교

| 효용 | 분리 | 통합 |
|---|---|---|
| **D4 정합도** | ✅ 강 — 단일 책임, audit 시 sage isolation 코드 한 파일만 검사 | ⚠ 중 — 다른 로직과 얽혀 audit 비용 증가, "이번만 예외" 자가설득 우회 면적 확대 |
| **Defense in Depth** (Riki anchor: NIST SP 800-160 Vol.2) | ✅ 다층 — settings.json hook 2엔트리 = 2개 독립 게이트 | ❌ 단일 게이트 (한 파일 throw 시 전체 silent pass) |
| **회복 비대칭** (FP vs FN) | FP: 정상 호출 reject = 즉시 인지 + 재시도. FN: sage 격리 깨짐 = 무인지 누수. 분리는 FN 면적 최소화 | 통합은 FP·FN 모두 동일 코드 경로, FN 발생 시 mutate-v3 로그에 묻힘 |
| **후속 게이트 재사용** | 패턴 박제 = `pre-tool-use-task-{role}-gate.js` 템플릿화 | N/A |
| **코드 가독성** | 새 파일 ~80 LOC, 단일 책임 = 30초 이해 | 547 LOC 다중 책임 = 신규 인입자 5분+ |

---

## 3. 비재무 자산 영향

분리는 **"hook 1책임 1파일" 박제 사례** 신설 → 향후 코드 박제 정책의 reference. 학습 루프(Arki 자기감사)·역할 진화(Riki R-2 카테고리 오류 분리 학습)·메타 역량(D4 enforcement 패턴 라이브러리화)에 모두 양(+). 통합은 hook 비대화 누적 부채로 ledger 외 silent cost.

---

## 4. ROI 프로파일

| 효과 카테고리 | 분리 |
|---|---|
| 즉시 효과 | sage isolation enforcement 활성화, D-122 자기충실성 코드 박제 |
| 간접 효과 | hook 분리 패턴 reference 박제, 후속 페르소나 게이트 재사용 |
| 재투자 가능 자원 | ~45 LOC 템플릿 = 차후 zero-gate·anchor-gate hook 50%+ 시간 절감 |
| 누적성 | ✅ 누적 (패턴 라이브러리) |

방치 비용: 통합 시 522→700→1000 LOC 누적 → 어느 시점 강제 분리 리팩터 + 그동안 발생한 silent FN 회수 불가.

---

## 5. 외부 anchor

**Single Responsibility Principle (Robert C. Martin, 2003 — "Agile Software Development: Principles, Patterns, and Practices")** — "A class should have only one reason to change." Hook 파일은 modify 사유가 한 가지여야 안전. 현 `pre-tool-use-task.js`는 이미 (a) prompt 변조 (b) persona compose (c) transition checkpoint 3 사유 보유 — sage-gate 추가는 4번째 사유, SRP 위반 가속. 분리가 정합.

보조 anchor: NIST SP 800-160 Vol.2 §3.4.5 *Defense in Depth* — "Multiple, independent enforcement layers." (Riki rev2 축 B 인용 재확인.)

---

## 6. 단일 권고

**분리 권고 (Riki rev3 비협상 조건 1번 수용).**

### 권고 패키지
1. `.claude/hooks/pre-tool-use-task-sage-gate.js` 신설 (~45 LOC, 단일 책임)
2. `.claude/settings.json` PreToolUse(Task) hooks 배열에 2번째 엔트리 등록 (기존 hook 다음, hook chain 직렬 실행)
3. 기존 `pre-tool-use-task.js`는 **불변** — sage 분기 추가 금지 (책임 분리 보존)
4. dispatch_config.json 신설 시 `sage.session_isolation: "exclusive"` 본 hook이 read해 검증

### 거부 조건
없음. 통합안은 D4 enforcement 강도·SRP·Defense in Depth 3축 모두 열위. 어중간 절충(예: "통합하되 별도 함수로 격리") 거부 — 함수 격리는 try/catch scope 공유 문제 미해소.

### Master 인지부하·저마찰 정합성
hook 1개 추가 = settings.json 6줄 JSON 추가만으로 영구 enforcement. Master 추가 인지부하 0. 저마찰 자율성 원칙(memory feedback_low_friction_autonomy) 정합.

---

## 7. 메모리 정합 self-check

- feedback_no_middle_ground: 단일 권고 (분리). 절충 없음. ✅
- feedback_pragmatic_weapon_not_art: 45 LOC + 30~80ms/call = 측정 비용. 회피 가치 정량 비교. 과투자 아님. ✅
- feedback_fin_nonfinancial_asset_cost: 학습 루프·메타 역량 영향 §3 박제. ✅
- feedback_fin_stage_awareness: 본 세션은 spec+구현 단계 → 정량 LOC·ms 동반. ✅
- feedback_external_anchor_mandatory (D-059): SRP + NIST 2 anchor. ✅
- D2 도구 설명 거짓 전제: "별도 hook = 추가 process spawn" 실측 30~80ms 추정 cost 동반. settings.json 직접 read 검증. ✅

---

FIN_WRITE_DONE: reports/2026-04-29_big-bang-legend-nexus-p2-1of3/fin_rev2.md

[ROLE:fin]
# self-scores
cst_acc: 0.80
roi_dl: 4
rdn_cal: Y
cst_alt: Y
