---
role: riki
topic: topic_142
session: session_165
turnId: 3
invocationMode: subagent
date: 2026-05-02
---

# Riki — topic_142 dispatch_config Edi rule

## 🔴 R-1. D-138 의도 자체가 D-142와 충돌

**원문:** D-142 (session_164, 2026-05-01) "동일 역할 다회 호출 자동 감시·차단 금지 — Master 직접 보고 의도적 재호출도 함, ROI 0". 본 토픽 직전 결정.

**실패 모드:** D-138은 "Edi 호출 강제 + LLM report 부재 시 hard warning + gap 박제"다. 이는 자동 감시의 한 형태. D-142가 ROI 0으로 폐기한 패턴과 같은 메커니즘(자동 감지 → gap 박제 → Master 노이즈 누적)이다. 본 토픽이 enforcement를 dispatch_config로 옮기면 비대칭이 박제되어 향후 해체가 어려워진다.

**mitigation:** rules.edi에 `enforcement_grade: ["A","B","S"]`를 박제하되, Master에게 "session_164에서 자동 감시 ROI 0 판정 직후 D-138 enforcement 유지 의도가 진심인지" 1회 확인 요청. 답이 "유지"면 진행, "재검토"면 본 토픽을 D-138 폐기 토픽으로 재프레이밍.

**fallback:** Master 무응답 → Arki Opt-1 그대로 진행하되 `rules.edi.deprecation_review_at: "session_170"` 필드 1개 박제하여 5세션 후 재검토 강제.

---

## 🟡 R-2. session_164 5 gap 실측을 "정상 작동"으로 해석한 전제 의심

**원문:** Master scope "session_164 실측: 5 gap 박제 정상". Arki·Ace·Jobs 모두 이를 "enforcement 작동 증거"로 수용.

**실패 모드:** 5 gap이 "정상 박제"인지 "5건 false positive"인지 분리 안 됨. session_164에서 Edi가 실제로 호출되지 않은 게 운영 사고였는지, 아니면 D-142 흐름에서 Master가 의도적으로 Edi 생략했는지 미검증. 후자면 5 gap 전체가 noise → 본 토픽이 noise 생산기를 config로 영구 박제하는 결과.

**mitigation:** 구현 전 session_164 turns[]에서 Edi 호출 의도 1회 확인 (1분). Master 의도적 생략이면 R-1과 합쳐 토픽 재프레이밍.

**fallback:** 확인 불가 → 실 구현하되 `rules.edi.fp_audit_at: "session_167"` 박제, 3세션 후 fp ratio 측정.

---

## 🟡 R-3. Opt-1 "함수 위치 unchanged" 가짜 안전감

**원문:** Arki "finalize.js 함수 위치 unchanged. 하드코딩만 config read로 교체. 변경 파일 2."

**실패 모드:** "config read 1줄 추가"는 함수 시그니처는 unchanged지만 런타임 의존성 그래프는 변경된다. dispatch_config.json 파싱 실패 시 finalize.js 전체 hook chain이 깨짐(D-008 auto-push 5단계 chain). 현재는 하드코딩이라 dispatch_config 손상과 무관. config 의존 추가 = chain fragility 증가.

**mitigation:** config read를 try/catch로 감싸 파싱 실패 시 하드코딩 default(`["A","B","S"]`) fallback. 신규 파일 0 유지하되 fallback 로직 명시.

**fallback:** Dev가 G1 검증 게이트에서 dispatch_config.json 의도적 손상 시나리오 1회 테스트.

---

## 의도적 제외

- 이중 enforcement 오해 (Arki R2): mitigation 박제됨, 추가 가치 없음
- 스키마 메이저 bump: Master scope out 명시
- 5신호 의존 코드 (Arki R4 🔴): Arki가 이미 🔴 박제, 중복
- 필드 over-engineering (Arki R5): Arki가 3필드 최소집합 권고로 해소
- recallReason out: Master scope out 명시
- CLAUDE.md update 범위: Arki Master 결정 2건 중 1건, framing 아닌 운영 결정
- 토픽 재오픈 패턴: R-1에 흡수
- Sage/Zero rule 정합성 가짜 frame: R-1에 흡수
- Sunk cost 적출 (Jobs Step 6 위임): R-1이 같은 축을 더 강하게 다룸

---

[ROLE:riki]
# self-scores
crt_rcl: Y
cr_val: 4
prd_rej: Y
fp_rt: 0.15
