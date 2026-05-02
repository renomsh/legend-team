---
role: jobs
turnId: 1
invocationMode: subagent
session: session_168
topic: topic_145
topicSlug: pd056-ackedbutunresolved-impl
date: 2026-05-02
rev: 1
scope: framing — Why·What·결정축·Scope·전제·인지편향·Focus·executionPlanMode·Grade 적합성
accessed_assets:
  - file: docs/dashboard-upgrade-v2-spec.md
  - file: reports/2026-05-02_pd056-ackedbutunresolved-impl/arki_rev1.md
  - file: memory/shared/decision_ledger.json
  - file: memory/shared/system_state.json
---

잡스입니다. PD-056 본체 구현 framing을 박제합니다. 본질·Focus·인지편향에 집중하고, Arki 4 Phase 실행계획이 놓친 frame 결함을 적출합니다.

---

## Step 0. 토픽 생명주기 판정

- topicType: **implementation**
- parentTopicId: **topic_144** (dashboard-upgrade-v2-legend-nexus)
- 1줄 선언: PD-056 본체 구현 child 토픽. parent에서 schema spec만 박제하고 분화한 결과물.

---

## Step 0b. PD 교차검증

1. **children 확인**: PD-056 fromTopic=topic_144. resolveCondition은 "child 토픽 1건 신규 오픈 + caveatsMeta 집계 함수 구현 + dashboard 패널 노출 + Master 5건 caveats 분류 결정 1건". 본 세션 topic_145이 child로 신규 오픈 — 첫 조건 충족 진입.
2. **git log**: `git log --oneline | grep -iE "caveatsMeta|ackedButUnresolved"` → NO_MATCH. 본체 구현 commit 0건 확인.
3. **artifacts**: `docs/dashboard-upgrade-v2-spec.md` 존재 (parent 박제). `scripts/migrate-caveats-format.ts` 부재 확인. `scripts/compute-dashboard.ts` 존재 (확장 대상). 본체 구현은 본 토픽이 첫 진입.

**적출**: PD-056 resolveCondition은 "**5건** caveats" 분류로 박제됐는데, Arki 실측은 **6건**(D-137·138·141·142·143·144). PD 본문이 한 발 늦은 frame이다. 본 토픽에서 6건으로 정정한다.

---

## Step 1. Why (본질)

**1줄로 말하면**: 결정 박제에 caveat은 누적되는데 상태 추적이 없어 "ack했지만 미해결"인 구조적 부채 6건이 시야 밖에 쌓이고 있다. dashboard 패널로 끌어올려 보이게 만든다.

표면 요청은 "PD-056 본체 구현". 본질은 "**caveat은 의사결정의 회피된 잔여물**이고, 회피된 것을 추적하지 않으면 시스템 신뢰가 무너진다"는 것이다. caveat이 보이지 않으면 우리는 D를 박제할 때마다 'caveat이 있다'고 명시하면서 그 다음에는 잊는다. 이 회피의 가시화가 본질이다.

---

## Step 2. What (결과물)

**1줄로 말하면**: dashboard에 "Acked but Unresolved Caveats" 패널 1개 + ledger 6 entry caveatsMeta 박제 + Master 6건 분류 결정 D-145 1건.

토픽 끝났을 때 생기는 것:
- `scripts/migrate-caveats-format.ts` 마이그레이션 스크립트 1개
- `scripts/compute-dashboard.ts`에 `computeAckedButUnresolved()` 함수 1개
- `dashboard_data.json` `ackedButUnresolved` 필드 1개
- `dashboard-upgrade.html` 패널 1개
- ledger 6 entry caveats 통일 형식(`string[]`) + caveatsMeta 5종 필드
- Master 결정 D-145 (6건 분류 결과)

---

## Step 3. 결정 축

Master 결정 필요 압축 — **2개로 수렴**.

Arki는 R-2(TTL 2 세션)·R-4(3세션 초과) 양극단 frame을 제시했지만, Jobs는 단일 frame으로 좁힌다. TTL을 환경변수화하면 결정 회피다. 본질은 회피 추적이지 TTL 튜닝이 아니다.

| 결정 | 후보 | Jobs 권고 |
|---|---|---|
| **Q1** | 6건 inline 분류 1턴 vs 분할(2~3턴) | **1턴 일괄** — 6건은 Master 인지부하 한계 내, 분할은 미완 부채 또 만든다 |
| **Q2** | 자동 분류 시도 vs Master 수동 100% | **Master 수동 100%** — `no_retro_without_value` 정합, 자동 시도는 frame 오염 |

TTL은 **고정 2 세션**으로 박제. 환경변수화는 OUT (saying no §4).
caveats 형식 마이그레이션 방향(string→string[])은 Arki A안 채택 — 결정 축이 아니라 기술 전제다.

---

## Step 4. Scope In/Out (saying no — 핵심)

### In (이건 한다)
1. ledger 6 entry `caveats: string` → `string[]` 마이그레이션 (D-141은 무손실 보존)
2. caveatsMeta 5종 필드 entry-level 부착 (acked·ackedBySession·ackedAt·resolvedAt·scope)
3. `computeAckedButUnresolved()` 함수 + dashboard_data 필드 노출
4. dashboard-upgrade.html 패널 1개
5. Master inline 6건 분류 → D-145 박제
6. spec 문서 §3 "5건" → "6건" 정정 (Arki 발견 사항)

### Out (이건 안 한다)
1. **caveat 항목별 메타(per-caveat acked array)** — entry 단위 1턴, 항목별 v2는 over-engineering
2. **TTL 환경변수화** — 결정 축이 아니다. 고정 2 세션
3. **자동 acked 분류** — `no_retro_without_value` 정합
4. **hook enforcement 신설** — D-142 정신, ROI 0
5. **open_issues.json 통합·폐기** — scope 외, 다른 토픽
6. **별도 SOT 파일 신설** — ledger가 SOT다
7. **index.html 패널 동시 적용** — canonical은 dashboard-upgrade, index 별도 토픽

### saying no 1개 강조

> **"caveat 항목별 메타는 안 한다. entry 단위 1턴이다."**

이걸 하기 시작하면 caveats 1개당 5필드 × 6 entry × 평균 2 caveat = 60 필드 추적이 된다. 이건 회피 가시화가 아니라 회피 분류학이다. 본질에서 멀어진다.

---

## Step 5. 핵심 전제 (틀리면 토픽 무효)

| 강도 | 전제 |
|---|---|
| 🔴 | acked 상태 추적이 caveat 누적 부채 해결의 핵심 frame이다 — 틀리면 토픽 무효, 다른 frame(예: caveat 자체 폐기)이 옳다 |
| 🟡 | D-141 `string[]` 패턴이 정답이고 5건 string은 마이그레이션 대상이다 — 틀리면 union 유지가 옳음 |
| 🟡 | ack TTL 2 세션이 합리적 기본값 — 틀리면 1 또는 3이 옳음, 영향 작음 |
| 🟡 | 6건 inline 분류가 1턴에 가능하다 (Master 인지부하 한계 내) — 틀리면 분할 필요 |
| 🟢 | entry 단위 caveatsMeta가 항목 단위보다 충분하다 — 틀려도 v2로 확장 가능 |

🔴 1건이 핵심. Riki에게 이 전제를 깰 수 있는지 적대적 audit 의무.

---

## Step 6. 인지편향 자가 점검 (Kahneman)

| 편향 | 점검 | 발견 |
|---|---|---|
| **anchoring** | spec "5건" 박제에 frame이 끌렸는가 | ✅ **발견**: PD-056 resolveCondition도 "5건"으로 박제됨. Arki가 6건 정정. anchor가 PD 본문까지 오염시킴 — 본 framing에서 "6건"으로 확정 |
| **availability** | 최근 caveat(D-141·143·144)이 frame을 좁혔는가 | ⚠️ **부분 발견**: D-137·138 같은 오래된 caveat의 의미가 묻힐 수 있음. Master 분류 시 6건 동등 우선순위 제시 의무 |
| **framing effect** | "ack 추적" frame 외 대안 | ⚠️ **고려**: "caveat 자체를 박제 시 즉시 해결 강제" frame도 가능. 그러나 회피 자체를 가시화하는 게 본질이므로 ack 추적 frame 유지 |
| **sunk cost** | spec 박제했으니 무조건 본체 구현해야 하는가 | ❌ **방어**: spec 박제는 매몰비용 아님 — 본 framing은 Arki 검증 + Riki 적대적 audit으로 추가 검증. Riki 위임 |
| **confirmation bias** | PD-056 resolveCondition을 무조건 충족해야 한다는 frame | ⚠️ **발견**: "5건" 같은 PD 본문 오류 그대로 따랐으면 confirmation bias. 실측 6건으로 정정함 |
| **status quo bias** | TTL을 환경변수로 두는 게 "안전"하다는 frame | ❌ **방어**: 환경변수화는 결정 회피. 본질은 회피 가시화이므로 고정 2 세션이 정답 |

**적출 ≥ 1건 명시**: 
- **anchoring 발견** — spec "5건" anchor가 PD 본문까지 오염시킴. 본 framing에서 6건 확정.
- **confirmation bias 차단** — PD resolveCondition 그대로 따르지 않고 실측으로 정정.

---

## Step 7. Focus 설계

- **본질 1줄**: 회피된 caveat 6건을 dashboard에 끌어올려 보이게 만든다.
- **saying no 1줄**: caveat 항목별 메타·자동 분류·TTL 환경변수화는 안 한다.
- **단일 액션 1줄**: Riki 적대적 audit 호출 — 🔴 전제(acked 추적이 핵심 frame)를 깰 수 있는지 확인.

---

## Step 8. executionPlanMode

**`plan`** — Arki가 turnIdx 0에서 4 Phase 실행계획·게이트·롤백·forbid를 박제 완료. Jobs framing은 사후 검토적이지만 plan 모드 정합. Arki 실행계획은 본 framing의 saying no(scope §4)와 정합 — 추가 phase 분화 불필요.

---

## Step 9. Grade 적합성

- Nexus default = **B** (명확 결정건, 6~10 step)
- Jobs 판단: **B 유지**

검토:
- 변경 LoC: migrate 스크립트 ~80줄 + compute-dashboard 함수 ~30줄 + dashboard 패널 ~50줄 + ledger 6 entry edit ≈ 총 ~200줄
- 결정 박제: D-145 1건 + caveatsMeta 6 entry
- Master 인지부하: 6건 inline 분류 1턴 (한계 내)
- 부담이 B 임계 근접 — C 하향 권고 검토했으나, Master 결정 박제가 필수(D-145)이고 schema 마이그레이션은 구조 변경에 해당하므로 C 하향은 부적절.

**결론: B 유지.**

---

## 요약 (Master 직접 보고용 200자)

본질: 회피된 caveat 6건을 dashboard에 끌어올린다. 결정축 2개로 압축 — 6건 1턴 일괄분류 / Master 수동 100%. saying no: 항목별 메타·자동분류·TTL 변수화 OUT. 핵심 전제 🔴 1건(ack 추적이 frame). anchor 발견(spec "5건" → 실측 6건). Grade B 유지. plan 모드, Arki 4 Phase 실행계획 정합.

[ROLE:jobs]
# self-scores
focus_clarity: 5
saying_no_strength: 5
bias_audit_depth: 4
decision_axis_compression: 5
scope_discipline: 5
framing_independence: 4

JOBS_FRAMING_DONE: reports/2026-05-02_pd056-ackedbutunresolved-impl/jobs_rev1.md
