---
role: jobs
session: session_173
topic: topic_150
topicId: topic_150
turnId: 4
phase: framing-late
rev: 1
invocationMode: subagent
---

# Jobs — Zero 비효율 점검 framing-late

Jobs입니다. Arki/Riki/Dev/Ace 4개 발언 정독 후 framing 시각으로 재진입합니다. Ace 단일 권고 추인 아닌, 다른 시각 제공이 본 호출 목적입니다.

---

## 1. Why 재질문 — 진짜 동기

표면 목표: "Zero 페르소나 footprint 비효율 정리".

실 motivation 후보 3개:
- **(a) NCL 폐기 잔재 청소** — D-133에서 NCL 전면 폐기 후 Zero 정책 4중 박제가 dead pointer 안고 있음. 정합성 회복.
- **(b) 신규 3 페르소나(Sage/Zero/Jobs) 운영 정합 점검** — Zero가 첫 번째 trigger. 이후 Sage·Jobs로 같은 패턴 반복 가능성.
- **(c) 단순 정리** — Master 메모리 "어중간한 절충안 금지" 정합. 군더더기 제거.

**Jobs 판정:** 실 motivation은 **(b) 우선, (a) 부수**. 본 토픽은 Zero 단독 정리가 아니라 **"신규 페르소나 도입 후 N일 footprint 검진"의 첫 케이스 스터디**. (a)는 그 안에 포함된 부수 발견.

→ **이 framing이 맞다면 Ace의 "B1/B2/B3 후속 토픽 분리" 권고는 부분 회피.** Sage/Jobs 공통 결손이라는 사실 자체가 본 토픽 발견의 본질이고, 분리 시 다음 토픽에서 0에서 다시 출발해야 함. 본 토픽 안에서 "공통 패턴" 박제는 가능.

---

## 2. What 재정의

Ace 권고가 정의하는 What: "phantom 정합 정합화 + dead pointer 정정 + 매니페스트 결손" 3건 처리.

**누락된 What:**
- **W-누락-1. "신규 페르소나 도입 SOP" 박제 부재.** 본 토픽이 발견한 12 axes 인벤토리(persona/policy/memory/dispatch_config/skill/agent/hook/script/metrics/role_registry/role_palette/manifest)는 **Sage·Jobs·향후 N번째 페르소나 도입 시 동일하게 점검할 체크리스트**. Ace 권고 어디에도 박제 없음. 가장 큰 가치 자산이 보고서로만 휘발 위기.
- **W-누락-2. role_registry vs tokens.css SOT 분열의 본질 진단 부재.** Riki R-1이 "viewer SOT는 tokens.css"라 적출했으나, **왜 분열됐는가** 묻지 않음. 분열 자체는 Zero 추가 시 발견된 표면 증상이지 원인 아님. 원인은 "신규 페르소나 추가 SOP 부재" → W-누락-1과 연결.
- **W-누락-3. Master 결정 게이트 명시.** Ace는 A1~A3를 "처리"로 묶었으나 **A1 self-exclusion 일반 원칙 보존 vs 폐기는 Master 의사결정**. 처리 단계 진입 전 결정 1건 격리 필요. Riki도 "Master 선호로 결정"이라 적시했으나 Ace 합성에서 흐려짐.

---

## 3. 결정축 적출

Ace 단일 권고의 결정축 단순화:
- "본 세션 처리 3건 + 후속 토픽 3건"으로 **공간 분리 1축**만 제시.

**Jobs 적출하는 진짜 결정축 (3개):**

### 결정축 D1. Self-exclusion 정책 — 보존 vs 폐기
- 보존(Riki R-2 권고): NCL 재도입·메타-자산(Sage log·audit trail) 등장 시 회귀 비용 회피. 단 코드는 0 enforce.
- 폐기(Arki C1-(a) 권고): 보호 대상 부재. 정책 4중 박제 비용 0화.
- **이건 Master 철학 결정.** "있는데 안 쓰는 정책"을 적응적 보존으로 볼지, "코드 enforce 없는 정책은 정책 아님(D4 prime directive)"으로 볼지.

### 결정축 D2. 본 토픽 scope — Zero 단독 vs 신규 3 페르소나 공통 확장
- Zero 단독(Ace 권고): scope creep 회피. implementation_within_3_sessions 정합.
- 공통 확장(Jobs 권고): 발견 본질이 공통 패턴. 후속 토픽 분리 시 0에서 재시작 비용.
- **이건 ROI 결정.** 본 세션에서 SOP 1줄 박제 비용 vs 후속 토픽 1세션 비용.

### 결정축 D3. SOT 분열 진단 — 표면 증상 정리 vs 원인 박제
- 표면(Ace A2): D-125 statusNote 1줄 추가.
- 원인(Jobs 권고): "왜 분열됐는가 = 신규 페르소나 도입 SOP 부재"를 decision으로 박제.
- **이건 Sage 영역 침범 위험.** Sage가 메타 진단 read-only인데 Jobs가 원인 박제 권고하면 역할 경계 흐림. 단 본 토픽은 식별 단계라 정합.

---

## 4. 인지편향 적출 (Kahneman, *Thinking Fast and Slow* 2011)

### 편향 B1. Anchoring (Arki 12 후보 라벨)
- Arki §3 표가 C1~C9 9건을 🔴/🟡/🟢 라벨로 anchor.
- Riki는 라벨을 재라벨링했으나 **9건 후보 자체는 받아들임**. Dev V1~V5는 그 중 5건만 검증.
- Ace는 9건을 A/B/거부/DEFER 4 분류로 합성 — **여전히 9건 frame 안에서 작업.**
- **Jobs 적출:** "후보 0건은?" 질문 부재. Arki가 12 axes 인벤토리에서 **footprint가 적정 수준인 axes는 라벨 안 함** — 정합한 것을 정합하다 박제하는 가치 누락. Anchoring 완성형.

### 편향 B2. Availability heuristic (Dev "결손 0")
- Dev V1~V5 5개 코드 경로 정상 → "결손 0건" 단언.
- 검증 안 한 경로: viewer runtime 브라우저 출력, build 회귀, worktrees 60+. Dev는 모두 자인.
- Ace는 Dev 5/0/1 결과를 "Riki R-1 정합" 근거로 사용 → **availability bias 증폭**. "검증한 곳에서 0건 = 전체 0건" 일반화.
- **Jobs 적출:** Dev는 충실히 자인했으나 Ace 합성에서 자인이 흐려짐. Master 결정 시 "Dev 5건 외 검증 부재" 경고 라벨 필요.

### 편향 B3. Status quo bias (DEFER 3건)
- Ace DEFER: C3(scope_areas 4중 prose 단축) / C6(KNOWN_ROLES 공통 모듈) / C7(internal_tools 잔재).
- "운영 효익 낮음"·"ROI 낮음" 근거. **그러나 변경 비용도 거의 0** (텍스트 단축 1건, 모듈 추출 1건, 키 삭제 1건).
- ROI 낮음은 status quo 정당화의 통상적 옷. **변경 회피인지 정당한 보류인지 구분 불가.**
- **Jobs 적출:** DEFER 결정 자체는 받아들이되, "1년 내 재검토 트리거"(Sage/Jobs 도입 시 또는 신규 페르소나 N번째 시) 박제 권고. 그렇지 않으면 영구 DEFER.

### 편향 B4. Confirmation bias (Riki R-3 거부)
- Riki: "Edi rule 비대화는 D-138 영구 감시 회피의 결과 → Edi rule이 이상치, Zero rule sparse가 정상 → 보강 anti-pattern"
- 논리는 정합하나 **"비대칭 자체가 가치 있을 수도"라는 반대 가설 기각 검토 부재**. Edi rule 패턴이 ledger 추적성·후임 페르소나 onboarding에 가치 있다면 sparse가 오히려 손실.
- **Jobs 적출:** Riki 결론(거부)은 수용. 단 근거가 한 쪽 가설만 검토 — 본 토픽 결정에는 영향 없으나 향후 dispatch_config rule 표준화 토픽 시 재검토 의무.

---

## 5. Scope 재검증

Master 명시: "정리만, 제거는 영향 점검 후".

Ace 격리:
- 본 세션: A1~A3 처리(통합·표기·키워드). **단 A1은 통합이지 제거 아님. 정합.**
- 후속 토픽: B1~B3.

**Jobs 검증:**
- A1 통합(persona SOT 1곳)은 "정리"에 정합. ✅
- A2 statusNote 추가는 "정리"에 정합. ✅
- A3 manifest 키워드 추가는 정확히는 "추가"이나 결손 보전이므로 정합. ✅
- B1(role_registry/palette 추가)은 "정리"보다 "추가"에 가까움. 후속 토픽 분리 정합. ✅
- **B2(영역 경계 정량화) 후속 분리는 정합.** 데이터 기반 박제 시점 미도래.
- **B3(decision chain 모호) 후속 분리는 회피 의심.** Zero ledger chain 정정은 본 토픽 scope 정합 — D-110→D-119→D-127 표기 단순화는 1줄 작업.

→ **Jobs 권고: B3을 본 세션 A4로 승격.** 4건 처리. scope 정합. 비용 1줄.

---

## 6. Focus (Saying No)

Steve Jobs: "Focusing is about saying no."

Ace 3건(A1/A2/A3) + Jobs 권고 1건(B3→A4) = 4건. "한 가지를 정말 잘 하는" 원칙에 어긋나는가?

**Jobs 판정: 어긋나지 않음.** 4건 모두 **"Zero footprint 정정"** 단일 카테고리. 다른 도메인 혼입 없음. Focus 유지.

**진짜 saying no 대상:**
- **No to scope creep.** B1(role_registry/palette 3 페르소나 동시 추가) 본 세션 진입 거부 — 정합.
- **No to dispatch_config 격상 욕구.** C5 거부 — Riki R-3 정합.
- **No to enforce hook 신설.** A1 통합 후 hook 추가 거부 — D-142 ROI 0 자동 감시 회피 정합.
- **No to 영구 DEFER.** C3/C6/C7 DEFER에 재검토 트리거 박제 권고.

---

## 7. 전제 적출

### 전제 P1. "self-exclusion 일반 원칙 보존이 Zero 정체성에 본질적이다" (Riki R-2 / Ace 합성)
- 검증 부재. Zero persona 본문(role-zero.md)은 정제 페르소나 Marie Kondo+Stroustrup 모델로 정의 — self-exclusion은 명문화된 정체성 요소가 아니라 NCL 보호용 운영 규칙.
- NCL 폐기 후 self-exclusion이 "정체성 본질"이라는 격상은 ad-hoc 정당화 가능성.
- **Jobs 권고:** D1 결정축에서 Master에게 "정체성 본질 vs 운영 규칙 잔재" 명시 질의. Ace가 묻지 않음.

### 전제 P2. "본 토픽 1세션 완결이 implementation_within_3_sessions 메모리 정합이다" (Ace 권고 기저)
- Master 메모리는 "구현 토픽 3세션 이내". 본 토픽은 **식별 토픽** (Master 명시 "정리만"). 메모리 직접 정합 대상 아님.
- 1세션 완결 욕구가 후속 토픽 3건 분리를 정당화하는 데 사용됨 — 전제 오용.
- **Jobs 권고:** 본 토픽은 식별. 후속 정리 실행은 별도 세션. 분리 사유는 "phase 분리"이지 "3세션 정합"이 아님.

### 전제 P3. "후속 토픽 분리가 회피 아니라 격리이다" (Ace 권고 기저)
- 부분 결함. B1(role_registry/palette)는 진짜 격리 — 3 페르소나 공통이라 Zero 단독 토픽 범위 밖.
- B2(영역 경계 정량화)는 데이터 미도래 격리 — 정합.
- B3(decision chain 모호)는 본 토픽 scope 내 — 위 §5에서 적출. 격리 아닌 회피.

---

## 8. Master 결정에 대한 framing 권고

### Ace와 충돌 1: B3 → A4 승격
**Ace:** B3(decision chain D-110→D-119→D-127 모호) 후속 토픽 분리.
**Jobs:** A4로 본 세션 승격. ledger 표기 단순화 1줄. scope 정합.

### Ace와 충돌 2: D1(self-exclusion 정책) Master 결정 게이트 명시
**Ace:** A1 통합으로 처리. Master 결정 게이트 흐림.
**Jobs:** A1 진입 전 Master에게 "self-exclusion 일반 원칙 보존 vs 폐기" 1문 질의. 결정 후 통합 또는 삭제 분기.

### Ace와 충돌 3: 본 토픽 부산물로 SOP 박제
**Ace:** SOP 박제 미언급. 12 axes 인벤토리 보고서로만 잔존.
**Jobs:** 본 토픽 결정 박제 시 **"신규 페르소나 도입 12 axes 점검 SOP"** 1건을 decision으로 추가. Sage·Jobs·향후 N번째 페르소나 도입 시 동일 체크리스트로 재사용. 비용 1건 박제, 가치 N건 회피.

### Ace 권고 수용 항목
- C5(rules.zero 비대칭 보강) 거부 — 정합.
- B1(role_registry/palette) 후속 토픽 분리 — 정합.
- B2(영역 경계 정량화) 후속 토픽 분리 — 정합.
- DEFER 3건(C3/C6/C7) — 단 재검토 트리거 박제 조건부 수용.
- A2(D-125 statusNote)·A3(manifest 키워드) — 정합.

---

## 9. 인지편향 핵심 1줄 (Kahneman 정합)

**4명 발언 모두 "9건 후보 frame" 안에서 작업했다. "후보 0건이어야 할 axes는?" 질문 부재가 본 토픽 최대 anchoring.**

---

## 외부 anchor

- **Kahneman, D. (2011).** *Thinking, Fast and Slow.* Farrar, Straus and Giroux. — Anchoring·Availability·Status quo·Confirmation bias 4 편향 적출 근거.
- **Jobs, S. (1997).** Apple WWDC keynote: "Focusing is about saying no to the hundred other good ideas." — Focus(saying no) 원칙.

---

JOBS_WRITE_DONE: C:/Projects/legend-team/reports/2026-05-02_zero-logic-inefficiency-audit/jobs_rev1.md

[ROLE:jobs]
# self-scores
fram_clr: 4
why_dpt: 4
bias_ct: 4
focus_no: 3
