---
role: riki
session: session_248
topic: topic_207
topicSlug: arki-emergency-hooks
date: 2026-05-14
rev: 1
turnId: 7
invocationMode: subagent
authorship: agent
scope: pending_deferrals 전수 risk 적출 (Master 명시 "3 go")
---

# Riki — Pending Deferrals 전수 risk 감사

RIKI_WRITE_DONE: reports/2026-05-14_arki-emergency-hooks/riki_pd_audit_rev1.md

## 0. 데이터 정합 사전 정리 (T4/A0/O5)

- **pending_deferrals.json `items[]` 전수 31건** (resolved 12, in-progress 1, pending 18)
- **system_state.json `pendingDeferrals[]` 17건** (모두 status=pending — 위 18건과 -1 차이는 PD-068 in-progress 제외)
- **이전 Sage 적출 시점 "13건"** = session_247 turn 0 발화. **현 시점 18건** (session_247에서 PD-094~098 5건 추가). Sage M-1 '11/13 미명기' baseline은 추가 5건 제외 기준이며, 본 감사는 현 시점 18 pending 기준 재산정.
- **decision_ledger D-NNN 인용 cross-check 완료**: 14개 인용 D 모두 ledger 존재. 단 1건 status=deprecated 발견 (§3 R-1).

## 1. PD pending 18건 4축 점검 표

| id | createdAt | age(d) | resolveCondition | dependsOn | relatedDecisions 정합 | 종합 |
|---|---|---|---|---|---|---|
| PD-098 | 05-14 | 0 | 명기 (측정가능) | [] | D-056·D-057·D-185 all active | 🟢 |
| PD-097 | 05-14 | 0 | 명기 (측정가능) | [] | **D-067 deprecated** + D-194 active | 🟡 R-1 |
| PD-096 | 05-14 | 0 | 명기 (측정가능 — 14일 무충돌) | [] | D-187 active | 🟢 |
| PD-095 | 05-14 | 0 | 명기 (측정가능 — FP 5%↓) | [PD-094] | D-185 active | 🟡 R-2 |
| PD-094 | 05-14 | 0 | 명기 (측정가능) | [] | D-185·D-184·D-189 all active | 🟢 |
| PD-093 | 05-13 | 1 | 명기 (측정가능 — 3 검증 조건) | [] | D-193·D-194·D-127·D-185 all active | 🟢 |
| PD-079 | 05-11 | 3 | **누락** | [PD-077 **resolved**] | D-181 active | 🔴 R-3 |
| PD-076 | 05-10 | 4 | **누락** | [] | (없음) | 🔴 R-4 |
| PD-078 | 05-10 | 4 | **누락** + title도 "L2 / L1 / inline 재도입" 단편 | [] | (없음) | 🔴 R-5 |
| PD-068 | 05-08 | 6 | 명기 (측정가능) | (in-progress) | D-176·D-177 | 🟡 R-6 |
| PD-083 | 05-11 | 3 | **누락** | [PD-082 **resolved**] | D-183·D-184 | 🔴 R-7 |
| PD-084 | 05-11 | 3 | **누락** | [PD-082 **resolved**] | D-183·D-184 | 🔴 R-8 |
| PD-085 | 05-12 | 2 | 명기 (측정가능 — test PASS) | [] | (없음) | 🟢 |
| PD-087 | 05-12 | 2 | 명기 (측정가능 — untracked 0건) | [] | (없음) | 🟢 |
| PD-088 | 05-13 | 1 | **누락** | [] | D-191·D-192 | 🟡 R-9 |
| PD-089 | 05-13 | 1 | **누락** | [] | D-192 | 🟡 R-10 |
| PD-090 | 05-13 | 1 | **누락** | [] | D-192 | 🟡 R-11 |
| PD-091 | 05-13 | 1 | **누락** | [] | D-192 | 🟡 R-12 |
| PD-092 | 05-13 | 1 | **누락** | [] | (없음) | 🟡 R-13 |

**resolveCondition 누락 통계 (T4/A0/O5):** 18건 중 9건 누락 = **50%**. (Sage가 인용한 13/11=84%는 baseline 시점, 신규 5건 모두 명기로 비율 개선됨. 추세 [T2/A1/O3].)

## 2. 위반 적출 (Risk 등급별)

### 🔴 R-3. PD-079 — dependsOn 충돌 (CRITICAL) [T4/A2/O5]

> "dependsOn": ["PD-077"] — PD-077는 status=resolved (resolvedAt 2026-05-11)

**파손 범위**: D-056/D-057 자동 전이 시스템 작동 시 PD-079가 resolved 의존을 무한 대기. PD-079 본문은 D-181 8 미티게이션 코드 박제이며, 실제 D-191/D-192로 박제 완료 산물 → **PD-079 자체가 사실상 resolved 후보**인데 stale.
**완화**: (a) PD-079 status를 resolved로 즉시 갱신 (resolvedBy=session_245, D-191·D-192) (b) dependsOn 빈 배열로 정리. 단 Master 결정 사항 (§5).

### 🔴 R-4. PD-076 — title·resolveCondition·relatedDecisions 모두 결측 (CRITICAL) [T4/A2/O5]

> {id, fromSession, fromTopic, createdAt, item, status} only — title 없음, resolveCondition 없음, relatedDecisions 없음, dependsOn 없음

**파손 범위**: 검색·자동 전이·인용 cross-check 모두 우회. age 4일.
**완화**: PD-098 schema required 보강이 본 사례를 정확히 차단. PD-076는 backfill 1순위.

### 🔴 R-5. PD-078 — 본문 단편 ("L2 / L1 / inline 재도입") (CRITICAL) [T4/A2/O5]

> "item": "L2 / L1 / inline 재도입" — 4단어, 맥락·범위·검증 0

**파손 범위**: Master 외 어떤 역할도 의미 복원 불가. fromTopic=pd-dashboard-fix, age 4일. 본 PD는 **본인 정정 또는 폐기 외 진행 불가**.
**완화**: Master 직접 의미 확인 또는 status=cancelled.

### 🔴 R-7·R-8. PD-083·PD-084 — dependsOn 충돌 (CRITICAL ×2) [T4/A2/O5]

> 둘 다 dependsOn=[PD-082] — PD-082 status=resolved (resolvedAt 2026-05-12, session_237)

**파손 범위**: T/A/O 시범 운영(D-183/D-184) 후속 결정이 의존 만족 후에도 stale 대기. 두 PD 모두 "시범 후 결정" 조건이지만 시범 종료 트리거(PD-084 본문)가 미발동 → **시범 데이터가 누적되는데 enum/종료조건 결정이 막혀 있는 상태**일 수 있음.
**완화**: dependsOn 정리 + status 재평가 필요. Master 결정 사항.

### 🟡 R-1. PD-097 — D-067 deprecated 인용 [T4/A2/O5]

> relatedDecisions: ["D-194", "D-067"] — D-067 status=deprecated (date 2026-04-24)

**파손 범위**: D-190 active-only 인용 enforcement(WARN-only) 미발동 시 deprecated 정책 인용으로 PD 본문 근거가 무효 ledger 참조. PD-097은 frontmatter 의무를 D-067에 인용했으나 D-067 자체가 폐기됐다면 supersededBy 추적 필요.
**완화**: D-067 supersededBy 확인 후 active 후속 D로 인용 갱신 또는 D-067 deprecation 사유 본문에 반영.

### 🟡 R-2. PD-095 — dependsOn=[PD-094] 동시 등록의 순환 risk [T3/A1/O3]

PD-094·095 모두 같은 session_247 등록, 같은 fromTopic. 순환 의존은 아니지만 두 PD가 동일 세션 산물·동일 권한 게이트(별도 토픽 오픈)를 공유 → 한 토픽 처리 시 양쪽 모두 처리 가능성. **별도 토픽 분리 권고가 모순**: 두 토픽으로 쪼개면 dispatch overhead, 한 토픽으로 묶으면 D-185 "표면 2개 묶지 않기" 위반.
**완화**: Master가 분리 vs 통합 결정 필요 (§5).

### 🟡 R-6. PD-068 — in-progress + scopeRedefined 후 lastUpdated 5일 무진행 [T3/A2/O5]

> lastUpdatedAt: 2026-05-09 — 오늘 2026-05-14, **5일 정체**. status: "in-progress"

**파손 범위**: in-progress 표기는 진행 중 신호인데 5일 무진행 = **status가 거짓 신호**. age 정체 + 표기 불일치.
**완화**: status=pending으로 강등 또는 진행 트리거 명시.

### 🟡 R-9~R-13. PD-088~092 — resolveCondition 누락 5건 클러스터 [T4/A2/O5]

session_245(topic_197) 산물 5건 모두 동일 패턴: title 명기, item 상세, 그러나 **resolveCondition 0건**. 등록 세션이 D-191·D-192 박제 직후라 후속 정제 대상이 명확함에도 자동 전이 트리거 부재.
**완화**: PD-098 schema required 발효 시 backfill 의무 발생. backfill은 LLM 추측 risk → Master/Edi 수동 우선.

## 3. 상위 risk PD 5건 (즉시 처리 권고) [T3/A2/O5]

| 순위 | id | risk | 권고 액션 |
|---|---|---|---|
| 1 | **PD-079** | dependsOn(resolved) + 본문 작업 사실상 완료 | status→resolved 갱신 (resolvedBy=session_245) |
| 2 | **PD-076** | title/resolveCondition/relatedDecisions 모두 결측 + age 4일 | Master backfill 또는 cancel |
| 3 | **PD-078** | 본문 4단어 단편, 의미 복원 Master만 가능 | Master 본문 확정 또는 cancel |
| 4 | **PD-083·084** | dependsOn(resolved) + T/A/O 시범 종료 트리거 stale | dependsOn 정리 + 시범 종료 조건 재평가 |
| 5 | **PD-097** | D-067 deprecated 인용 | D-067 supersededBy 확인 후 인용 갱신 |

## 4. PD-094~098 절차 정합 평가 (Sage exclusive에서 Nexus 직접 등록)

### 사실 (T4/A0/O5)
- 5건 모두 fromSession=session_247, fromTopic=topic_207
- session_247은 Sage exclusive 세션 (rolesInOrder=["sage","sage"], turnsCount=2)
- session_247 oneLineSummary: "PD 5건 등록(O4/O1/D-187잔여/D-194잔여/resolveCondition 의무화), sage-gate hook L133 패치"
- 즉 Edi 미호출 (Sage exclusive로 dispatch 차단). Nexus 본체가 직접 pending_deferrals.json write.

### 정합 분석 [T3/A2/O3]

| 축 | 평가 |
|---|---|
| **권한 (D-128 Sage exclusive)** | ✅ 정합 — Edi dispatch 자체가 hook 차단. Nexus 본체 직접 write는 page L130 Sage policy 외부. Sage 정체성=read-only/박제 권한 0. PD 등록 주체는 Sage가 아닌 Nexus. |
| **D-194 원문 보존** | ✅ 정합 — 5건 모두 design content 원문 형태 (옵션 (a)/(b)/... 병기). PD-094는 "(구체 동작·N값·status enum은 Master 결정 사항)" 정정 흔적이 자기시정 증거. |
| **resolveCondition 명기** | ✅ 정합 — 5건 모두 측정 가능 조건 명기 (M-1 자기시정). |
| **D-185 정합 (정책=해결 안도 차단)** | 🟡 부분 — PD-094 자체가 D-185 위반 메타 차단 PD. 단 PD-094 자신의 resolveCondition이 "별도 Grade A 토픽 오픈 → ..."로 prompt-only 분기 잠재 (resolveCondition 충족 검증 메커니즘 자체가 자율 판단). 자기참조 risk 1건. |
| **Edi 위임 우회** | 🟡 잠재 위반 — CLAUDE.md L_(Edi protocol) "anchor governance(D-125) 정합" + dispatch_config rules.edi anchor_governance=true. PD 등록을 anchor governance에 포함시키느냐는 미정. **Master 결정 사항** (§5). |
| **Nexus 본체가 PD 5건 일괄 추가** | 🟡 패턴 risk — 단일 세션 5건 일괄 등록은 Sage 1턴 권고를 즉시 채택한 패턴. Sage T3/A1/O3 권고를 Nexus가 T4 단언처럼 채택했을 가능성 (DVA-B 정책 박제형 메타 패턴 재발 risk). 단 Master 명시 승인("등록")이 있었다면 정합. |

### 종합 [T3/A1/O3]

권한·D-194·resolveCondition 측면 정합. 단 **PD 등록을 Edi 책임에 포함시킬지 vs Nexus 본체 직접 write 허용할지** 정책 공백 존재. 본 사례를 정합으로 인정하면 향후 Sage-only 세션에서 Nexus가 PD 임의 등록하는 경로가 정착.

## 5. Master 결정 필요 항목 (Riki 임의 결정 금지)

1. **PD-079 status 갱신** — resolved로 일괄 처리 vs 개별 검증
2. **PD-076 backfill vs cancel**
3. **PD-078 의미 확정** — Master 본인만 가능
4. **PD-083·084 dependsOn 정리** + T/A/O 시범 종료 조건 평가
5. **PD-097 D-067 deprecated 인용** — supersededBy 확인 + 갱신 vs PD 자체 폐기
6. **PD-094·095 분리 vs 통합 토픽 오픈** (D-185 정합 vs dispatch 효율 trade-off)
7. **PD 등록 권한 정책** — Nexus 본체 직접 write 허용 vs Edi anchor governance 포함 (PD-094~098 사례 회고 결정)
8. **PD-068 status 강등 (in-progress→pending)** vs 진행 트리거 명시

## 6. 메타 관찰 [T3/A1/O3]

- **resolveCondition 누락 50%** — Sage M-1 적출 시점 84%에서 50%로 개선됐으나 여전히 절반. PD-098 schema required 발효 시 기존 9건 backfill burden.
- **dependsOn(resolved) 충돌 3건** (PD-079, PD-083, PD-084) — auto-resolve 트리거가 dependsOn 정합 검증 안 하면 stale chain 누적. PD-098 hook에 dependsOn integrity check 추가 권고.
- **단일 세션 5건 일괄 등록** (session_247) — Sage 1회 권고 → Nexus 즉시 5건 박제 패턴은 DVA-B 메타 재발 risk 잠재. PD-094 본인이 차단 대상 메커니즘.

확신 없는 추가 risk는 제외. 위 13건이 cross-check 가능 범위 내 모든 risk.

---

[ROLE:riki]
# self-scores
crt_rcl: 0.85
cr_val: Y
prd_rej: N
fp_rt: 0.10
