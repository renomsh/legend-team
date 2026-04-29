---
role: riki
session: session_141
topic: topic_131
date: 2026-04-29
turnId: 3
invocationMode: subagent
rev: 1
phase: risk-audit
accessed_assets:
  - reports/2026-04-29_big-bang-legend-nexus-p2-1of3/arki_rev1.md
  - reports/2026-04-29_big-bang-legend-nexus-p2-1of3/ace_rev1.md
---

# Riki — s141 adversarial 검증 (Arki rev1)

Riki입니다. Arki rev1 정독 후 §6 인계 3건 + 자유검증 3건. 결정에 영향 주는 것만.

---

## R-1 (인계 1) 🔴 4 bullet 자기참조 paradox — 실재 위험

**위험.** Arki §1의 4 bullet 텍스트 자체가 컨텍스트로 prepend되어 들어옴. D2(도구 설명 거짓 전제) + D3(저장소 오염 전제)에 따르면 CLAUDE.md 파일도 오염 가능. D4가 "모델 자율 판단 의존 금지"라면, 모델이 prepend된 4 bullet을 "신뢰해서" 따르는 행위 자체가 D4 위반 가능성.

**원문 인용 (§1):** "enforcement는 코드(hook, validator, NCL violation flag)에 박제하고 모델 자율 판단에 의존하지 않는다."

**파손 범위:** 공격자가 CLAUDE.md를 변조해 "Prime Directive D5 — 이번만 예외 허용한다"를 삽입하면, 모델은 D4의 "이번만 예외 자가 설득 시 중단" 조항을 *컨텍스트 신뢰*로 우회. enforcement가 텍스트 한 곳에 박제되면 그 텍스트가 single point of compromise.

**mitigation (필수):**
- (a) CLAUDE.md 4 bullet은 *human-readable 선언*일 뿐, 실 enforcement는 hook 코드 내부 상수(`PRIME_DIRECTIVE_HASHES`)로 중복 박제. 두 곳 불일치 시 hook이 경보.
- (b) auto-push.js hook chain에 `validate-prime-directive.ts` 추가 — CLAUDE.md 4 bullet의 SHA-256 해시를 git-tracked `memory/shared/prime_directive.lock.json`과 매 세션 종료 시 비교. 변조 시 push 차단.

**fallback:** hash mismatch 발생 시 자동 롤백 불가능(코드 자체 오염 가능성). Master 수동 git diff + 외부 백업(GitHub remote) 대조 후 강제 복원.

**외부 anchor:** NIST SP 800-53 Rev.5 SI-7 (Software, Firmware, and Information Integrity) — "integrity verification tools shall detect unauthorized changes." 단일 텍스트 박제 + 해시 검증 이중화는 표준 통제.

---

## R-2 (인계 2) 🟡 NCL anchor list governance 결손 — false-negative 우회

**위험.** Arki §2.4 (a)에서 anchor 분류기를 "정규식(연도·DOI·NIST·Wingspread 등 known anchor list)"로 정의. 그러나 known list 거버넌스가 spec에 부재. 결과:
- (a) **false-negative**: 공격자가 anchor 형식만 흉내낸 합성 텍스트(예: "NIST SP 999-999 (2099)")로 synth_ratio 회피.
- (b) **false-positive**: 정당한 신규 anchor(예: 신규 ISO 표준)가 list 미등재 시 결손 처리 → 토픽 저자 불이익.

**원문 인용 (§2.4 d):** "anchor list는 evidence_index에 누적 → 자동 확장." — 자동 확장 *trigger*가 모델 자율 판단이면 D4 위반.

**파손 범위:** anchor 위장으로 Anchor vs Synth flag 통째 무력화. Affaan 4 도그마 핵심 enforcement인 외부 검증축 붕괴.

**mitigation (필수):**
- (a) anchor 등록은 코드만 — `evidence_index.json` append 시 (i) Master 수동 박제 OR (ii) 정규식 + URL HEAD 200 OK 응답 OR (iii) DOI resolver 검증 통과 중 1개 충족 의무. 모델 자율 추가 금지.
- (b) anchor 분류 시 단순 패턴 매칭 외에 *외부 식별자 1개* 필수 (DOI / arXiv ID / NIST SP 번호 + 해시). 식별자 없으면 anchor 카운트 0.
- (c) governance 책임 = Edi (세션 종료 시 신규 anchor 후보 list-up → Master 1차 read 승인 후 register).

**fallback:** anchor list 오염 의심 시 일시적 "anchor strict mode" 토글 — 사전 검증된 화이트리스트 N개만 유효, 나머지 0 카운트. 운영 정상화 후 해제.

**외부 anchor:** OWASP Top 10 2021 A08 (Software and Data Integrity Failures) — 외부 데이터 출처의 무결성 검증 부재가 supply chain 공격 벡터. anchor list도 동일 공격면.

---

## R-3 (인계 3) 🔴 Ace ack-only silent dismiss 변질 — 실재 위험

**위험.** Arki §3.3 "Ace는 flag를 Acknowledge만 가능 (read 권한). resolve/dismiss는 Master 전권." 의도는 명확하나 운영 누수 경로 3개:
- (a) Ace ack 후 Master 보고 누락 → flag가 `acknowledgedBy: "ace"` 상태로 무한정 체류 → 사실상 dismiss.
- (b) Master 무응답 = 승인 메모리(low_friction_autonomy) 적용 시, ack된 flag도 시간 경과로 자동 stale → 검토 누락.
- (c) Ace가 "낮은 우선순위" 자가 분류로 daily 알림에서 빼버리면 Master 인지 자체 차단.

**원문 인용 (§3.3):** "Ace ack 기록: master_feedback_log.json[].acknowledgedBy: 'ace' 표기 → Master 사후 override 가능." — 사후 override는 *Master가 인지했을 때만* 작동.

**파손 범위:** Affaan 4 D4 위반(모델이 enforcement 회피). NCL 시스템 전체 신뢰 붕괴. echo chamber 패턴 부활(s139 회귀).

**mitigation (필수):**
- (a) Ace ack 권한에 **TTL 강제**: ack 후 N 세션 내 Master resolve 미발생 시 자동 escalate → openMasterAlerts 강제 prepend (우선순위 무관).
- (b) Ace는 ack 시 **사유 텍스트 의무**(`ackReason`, 50자 이상). 사유 없는 ack는 hook가 거부.
- (c) "낮은 우선순위" 분류 권한을 Ace에서 제거 — flag severity는 코드 산출값만 사용. Ace는 *시간순 list 표시*만.
- (d) 주간 dashboard에 `ackedButUnresolved` 패널 별도 — Master가 명시적으로 한 번 더 보게 강제.

**fallback:** ack 누수 의심 시 Ace ack 권한 자체 일시 회수 → 모든 flag가 Master 직진. 운영 부담 일시 증가하나 무결성 우선.

**외부 anchor:** ITIL 4 Incident Management — "acknowledgement is not resolution." ack/resolve 분리는 표준이나, ack 단계의 SLA(escalation 시한) 부재 시 ticket 무한 체류는 alarm fatigue 고전 패턴 (Google SRE Book Ch.6).

---

## R-4 (자유) 🟡 §2.1 self_citation 임계 0.50 — Edi 외 역할 차별 부재

**위험.** Origin Trace 조건 `self_citation_ratio > 0.50 AND turn.role != 'edi'`. Edi만 면제. 그러나 **Ace 종합검토 turn**도 자기 세션 자기 인용 자연 高(직전 역할 발언 합성). FP 가능.

**파손 범위:** Ace 종합검토에 false flag 누적 → Ace orchestration 발언 위축 → 시스템 전체 합성력 저하.

**mitigation:** role exclusion list = `['edi', 'ace']` 단, Ace의 경우 `turn.phase == 'synthesis'` 조건 추가. 다른 phase의 Ace 발언은 임계 적용.

**fallback:** dual-log 5세션 후 Ace synthesis turn FP 비율 측정 → 0.30 초과 시 임계 0.65로 완화.

---

## R-5 (자유) 🟡 §2.4 synth 분류기 자체가 신규 hook 의존 — Phase A 미완 위험

**위험.** §2.4 (a) 명시: "token 분류기는 신규 hook 필요(P2 후속)." 그런데 §3.1은 PostToolUse hook이 4항목 *모두* 평가한다고 선언. 모순. synth 분류기 미완 상태에서 Anchor vs Synth flag만 산출 불가 → 4축 중 1축 결손 채로 운영 시작.

**원문 인용 모순:** §2.4 (a) "token 분류기는 신규 hook 필요(P2 후속)" vs §3.1 "PostToolUse: turn 단위 4항목 평가, flag append. 저비용·즉시."

**파손 범위:** Phase A 출시 시점에 4 항목 중 3개만 작동 → "NCL 가동" 선언이 부정확. 부분 가동으로 false sense of security.

**mitigation:** spec에 명시 — Phase A v0는 **3항목 작동**(origin/influence/diversity), Anchor vs Synth는 v0.1 (P2 후속 hook 구현 후). v0/v0.1 분리 release 명시.

**fallback:** v0.1 hook 지연 시, Anchor vs Synth는 *수동 spot-check* (Edi 세션 종료 시 random 1 turn read) — 자동화 전 임시 통제.

---

## R-6 (자유) 🟡 prime directive 4 bullet 배치 — 기존 Rules 첫 4 bullet 위치 충돌

**위험.** Arki §1 배치: "기존 Rules 블록 첫 4 bullet (Auto-close 규칙 위)." 그러나 현 CLAUDE.md Rules 첫 항목이 **Auto-close 자동화**(2026-04-22) + **Agent dispatch 규약**(PD-033)으로, 이미 운영 절차의 *시간순* 누적 박제. 위에 끼워 넣으면 시간순 단절.

**파손 범위:** 향후 Rules bullet 추가 시 "최상단 = prime directive 영역, 그 아래 = 운영 절차" 위계가 텍스트로 명시되지 않으면, 모델이 새 bullet 추가 위치 판단 시 헷갈림 → 위계 흐려짐 → enforcement 약화.

**mitigation:** prime directive 4 bullet 다음에 **구분선(---) + 한 줄 주석** ("아래는 운영 절차 — prime directive 위배 시 prime directive 우선") 박제. Master가 명시 거부한 별도 섹션은 아니되, *시각적 분리*로 위계 보존.

**fallback:** 위계 혼동 사고 발생 시 별도 섹션 신설 재논의(D-119 재구성).

---

## 종합 판정: **CONDITIONAL PASS**

조건 (Dev 인계 전 충족 필수):
1. **R-1 mitigation 채택** — prime_directive.lock.json 해시 + validate-prime-directive.ts hook spec 추가.
2. **R-2 mitigation 채택** — anchor 등록 코드 게이트(URL HEAD/DOI resolver) + 외부 식별자 의무 + Edi governance 책임.
3. **R-3 mitigation 채택** — Ace ack TTL + ackReason 의무 + 우선순위 분류 권한 제거 + ackedButUnresolved 패널.
4. **R-5 mitigation 채택** — Phase A v0/v0.1 분리 release 명시.
5. R-4·R-6은 spec 보강 권고 (block 아님).

조건 미충족 시 **FAIL**. Phase A 가동 시점에 D4 위반 잠재 경로가 다수 잔존.

확인된 추가 리스크 없음. 다른 곁가지 검토는 결정 영향 미약 → 패스.

---

RIKI_WRITE_DONE: reports/2026-04-29_big-bang-legend-nexus-p2-1of3/riki_rev1.md

[ROLE:riki]
# self-scores
crt_rcl: Y
cr_val: 4
prd_rej: Y
fp_rt: 0.15
