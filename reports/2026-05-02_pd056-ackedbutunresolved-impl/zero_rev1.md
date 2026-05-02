---
role: zero
turnId: 5
invocationMode: subagent
session: session_168
topic: topic_145
topicSlug: pd056-ackedbutunresolved-impl
date: 2026-05-02
rev: 1
scope: Dev rev1 정제 점검 — tech-debt / security-review / simplify 3 영역
accessed_assets:
  - file: reports/2026-05-02_pd056-ackedbutunresolved-impl/dev_rev1.md
  - file: scripts/compute-dashboard.ts
  - file: scripts/migrate-caveats-format.ts
  - file: memory/shared/decision_ledger.json
  - file: app/dashboard-upgrade.html
  - file: .claude/hooks/post-tool-use-task.js
  - file: .claude/hooks/session-end-finalize.js
  - file: .claude/skills/jobs-framing/SKILL.md
  - file: .claude/skills/ace-framing/SKILL.md
  - file: CLAUDE.md
  - file: .claude/commands/open.md
---

제로입니다. Dev rev1 산출물을 3 영역(tech-debt / security-review / simplify) 한정으로 정제 점검했습니다. 단호한 cut 결정만 박제합니다. 회색 영역 거부.

---

## §1. Cut (tech-debt)

### 검토 항목 + 정량 근거

| # | 항목 | 실측 | 판정 |
|---|---|---|---|
| 1 | `scripts/migrate-caveats-format.ts` (1회용, 142 LoC) | apply 완료 후 멱등 skip 동작. META_MAP 6 entry 하드코딩 | **그대로 둔다** |
| 2 | `post-tool-use-task.js` 폐기 코멘트 3 lines (258~260) | grep "duplicate-agent-turn" → 1 hit, enforcement 코드 0 | **그대로 둔다** |
| 3 | jobs-framing/ace-framing Step 0·0b 본문 (옵션 B) | DEPRECATED 1줄 + 본문 보존, 외부 참조 깨짐 0 | **그대로 둔다** |
| 4 | D-145 entry 압축 (4 책임 단일 entry) | axisLen=89, decisions 길이 +1, JSON parse 통과 | **그대로 둔다** |

**판정 근거**:

1. **migrate-caveats-format.ts**: 1회용 스크립트지만 멱등성(`if (!entry.caveatsMeta)` skip) 보장됨. 향후 새 entry 추가 시 META_MAP 확장 + 재실행으로 재사용 가능. dead code 아님. 단, `META_MAP`에 6 entry id가 하드코딩됐고 회복 불가능한 작업지시 명시값 — **session_168 시점 박제**로 의미 보존되므로 삭제 ROI 0.
2. **폐기 코멘트 3 lines**: history 추적용 의도적 잔재. Master 메모리 `feedback_no_auto_role_recall_surveillance` 정합 사유 기록. 삭제하면 왜 폐기됐는지 향후 인입자가 모름. **유지가 정답.**
3. **skill 본문 보존**: 옵션 B 정책(Arki R-9 mitigation, 외부 참조 보존)이 본 토픽 결정. 본문은 history 보존용 — Cut 침범 시 D-145 결정 위배.
4. **D-145 단일 entry 압축**: 4 책임이지만 모두 "Jobs↔Ace↔Nexus 분리 원칙" 단일 axis로 수렴됨. 분할하면 결정 추적 비용↑. axisLen 89자는 가독성 임계 내.

### 삭제 후보 0건

회색 영역 항목은 단호하게 "그대로 둔다"로 분류했습니다. **Cut 0건.**

---

## §2. Refine (simplify)

### 검토 항목 + before/after

#### 2-1. `computeAckedButUnresolved` 함수 — Array.isArray 분기 (line 117)

**현재**:
```ts
const caveats = Array.isArray(d.caveats) ? d.caveats : (d.caveats ? [d.caveats] : []);
```

**검토**: caveats 형식이 Phase 0 마이그레이션으로 **전부 string[]로 통일**됨. legacy fallback이 dead code인가?

**실측**: `decision_ledger.json` 6 caveatsMeta entry 모두 caveats가 array. 단, **`caveatsMeta` 없는 다른 139 entry**의 caveats 필드는 형식 미통일 가능성. 그러나 함수는 line 110 `if (!m || !m.acked || m.resolvedAt) continue;`로 **caveatsMeta 없는 entry는 사전 차단**.

**결론**: Array.isArray 분기는 caveatsMeta 부착 entry만 도달. 그 entry들은 마이그레이션 후 모두 array. **fallback은 dead code.**

| 항목 | before | after |
|---|---|---|
| line 117 | `Array.isArray(d.caveats) ? d.caveats : (d.caveats ? [d.caveats] : [])` | `d.caveats ?? []` (또는 `d.caveats as string[]` + 인터페이스 string\|string[] union 제거) |
| LoC 절감 | -1 | -1 |
| 인터페이스 단순화 | `caveats?: string[] \| string` | `caveats?: string[]` |

**판정**: **합친다 (Refine).** 단, 인터페이스 union 제거가 동반돼야 의미 있음. Master 결정 필요 — 본 토픽 scope 내 처리 vs 향후 정제 토픽으로 분화. **회색 영역 → Master 1건 결정 권고.**

#### 2-2. patch 패턴 중복 (jobs-framing / ace-framing 동일 1줄 위임)

**현재**: 두 파일 각각 Step 0·0b에 동일 blockquote 4 hits 박제.

**검토**: 헬퍼 함수화 가능? skill 파일은 **Markdown 정적 문서**이므로 함수화 불가. 동일 문구 4번 반복은 의도된 명시성(인입자가 어느 Step을 보든 위임 메시지 즉시 인지).

**판정**: **그대로 둔다.** Markdown 중복은 코드 중복과 다름. 동적 substitution 도입은 over-engineering.

#### 2-3. dashboard-upgrade.html `window.dashboardData` 글로벌 노출

**현재**: line 383에서 `window.dashboardData = data` 박제 + line 795·796 read.

**검토**: 글로벌 변수 도입은 일반적으로 코드 위생 위배. 단, 본 컨텍스트는 단일 페이지 단일 init 흐름 + 다른 render 함수들도 동일 패턴(`data` closure 미사용·전역 read 패턴) 추정. legacy 일관성.

**실측**: `renderAckedButUnresolved`만 `window.dashboardData` 사용 — 다른 render 함수는 인자 전달. **일관성 위배.**

| 항목 | before | after |
|---|---|---|
| `renderAckedButUnresolved()` 시그니처 | 인자 없음 + window 전역 read | `renderAckedButUnresolved(data)` 인자 받기 |
| `init()` line 383 | `window.dashboardData = data` 추가 | 삭제 |
| line 463 | `renderAckedButUnresolved()` | `renderAckedButUnresolved(data)` |
| LoC 절감 | -1 | -1 (글로벌 1줄 제거) |

**판정**: **합친다 (Refine).** 다른 render 함수와 시그니처 통일. 글로벌 변수 1개 제거. simplify 영역 정합.

### Refine 결과 — 합친다 2건

1. line 117 Array.isArray 분기 → ?? 단순화 (인터페이스 union 제거 동반) — **Master 결정 필요**
2. `window.dashboardData` 글로벌 → 인자 전달 패턴 통일

---

## §3. Audit (security-review)

### 하드코딩 카운트 표

| 검토 패턴 | 대상 파일 | hits | 판정 |
|---|---|---|---|
| 절대 경로 (`C:\\`, `/Users/`, `file:///`) | migrate-caveats-format.ts, compute-dashboard.ts | **0** | ✅ pass |
| API key / token / secret / password 패턴 | migrate-caveats-format.ts, compute-dashboard.ts | **0** | ✅ pass |
| `session_168` 하드코딩 | migrate-caveats-format.ts | **11** | ✅ 정당 (1회용 마이그레이션, 작업지시 명시값) |
| 6 decision id 하드코딩 (D-137·138·141·142·143·144) | migrate-caveats-format.ts META_MAP | 6 | ✅ 정당 (1회용 + 멱등성 보장) |

### 세부 검토

1. **session_168 11 hits**: 모두 `META_MAP[id].ackedBySession = 'session_168'` 패턴. 1회용 마이그레이션 스크립트의 작업지시 명시값. Master 메모리 `no_retro_without_value` 정합 — 자동 추론 회피, 명시값 박제. **정당.**
2. **D-id 하드코딩 6건**: META_MAP 키. caveatsMeta 부여 대상 6건 명시. 멱등성 sentinel(`if (!entry.caveatsMeta)`)로 재실행 시 skip. **정당.**
3. **신규 코드 0 secrets**: `compute-dashboard.ts`의 신규 60 LoC + `dashboard-upgrade.html` 신규 ~50 LoC + `migrate-caveats-format.ts` 142 LoC 전수 grep — credential 패턴 0 hits.
4. **PII / 사용자 데이터 누출**: `caveats` 본문이 dashboard에 노출됨 — 단, 이는 **의도된 노출**(회피 가시화 = 본질). caveats 자체가 시스템 결정 메타데이터, 외부 사용자 데이터 아님. **Audit pass.**

### Security 결과 — 0 violations

---

## §4. 종합 판정

### 결과 카운트

- **지운다**: **0건**
- **합친다**: **2건** (Array.isArray fallback / window.dashboardData 글로벌)
- **그대로 둔다**: **5건** (migrate 스크립트 / 폐기 코멘트 / skill 본문 / D-145 entry 압축 / Markdown 4 hits 중복)

### 임팩트 큰 발견 (Master 보고용 1~2건)

1. **🟡 합친다 (Master 결정 필요)**: `compute-dashboard.ts` line 117 Array.isArray fallback이 마이그레이션 후 dead code. `DecisionEntry.caveats`의 `string[] | string` union 제거 동반 시 LoC 절감 + 타입 일관성↑. **본 토픽 scope 내 처리 vs 별도 PD로 분화** Master 1건 결정 권고.
2. **🟡 합친다 (Dev 인계)**: `dashboard-upgrade.html` `renderAckedButUnresolved()`만 `window.dashboardData` 글로벌 read. 다른 render 함수와 시그니처 비일관. 인자 전달 패턴으로 통일하면 글로벌 변수 1개 제거 + 일관성 회복. **scope 내 즉시 처리 가능.**

### Security 영역

- **0 violations**. 신규 코드 전수 grep 통과. 절대 경로·credential·secret·password 패턴 0 hits. session_168 하드코딩(11 hits) + 6 D-id 하드코딩 모두 1회용 마이그레이션 정당 사유 충족.

### Master 결정 필요 (1건)

> **Q**: `DecisionEntry.caveats` union 제거(`string[] | string` → `string[]`) + line 117 fallback 단순화를 본 세션 처리할 것인가? (a) 본 세션 / (b) 별도 정제 PD로 분화

Zero 권고: **(a) 본 세션** — 변경 LoC ~3, B grade 임계 미돌파. 분화하면 결정 부채만 누적(`no_premature_topic_split` 정합).

---

[ROLE:zero]
# self-scores
cut_dec: 5
sec_vio: 0
ref_qty: 2
gry_rej: 1.00

ZERO_REFINE_DONE: reports/2026-05-02_pd056-ackedbutunresolved-impl/zero_rev1.md
