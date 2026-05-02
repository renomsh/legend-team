---
role: arki
turnId: 0
invocationMode: subagent
session: session_168
topic: topic_145
topicSlug: pd056-ackedbutunresolved-impl
date: 2026-05-02
rev: 1
scope: 구조 분석 + 의존 그래프 + 4 Phase 실행계획 + 게이트 + 롤백 + forbid
accessed_assets:
  - file: docs/dashboard-upgrade-v2-spec.md
  - file: memory/shared/decision_ledger.json
  - file: memory/shared/topic_index.json
  - file: scripts/compute-dashboard.ts
---

에이키입니다. PD-056 본체 구현을 위한 구조 분석과 4 Phase 실행계획을 박제합니다. 코드 한 축만 보지 않고, spec 문서·실제 ledger·dashboard 빌드 파이프라인·viewer 정합 4축을 교차 검증했습니다.

---

## §1. 의존 그래프 + spec 정정

### 1.1 spec 문서 vs 실측 ledger 불일치 (Master 보고 항목)

`docs/dashboard-upgrade-v2-spec.md` Phase 4 박제 시점에 caveats 보유 entry를 "D-130/132/133/141/143 5건"으로 기재했지만, `memory/shared/decision_ledger.json` 실측 결과 다음과 같이 6건이며 ID 집합이 다릅니다.

| Decision | caveats 형식 | 비고 |
|---|---|---|
| D-137 | `string` | spec 누락 |
| D-138 | `string` | spec 누락 |
| D-141 | `string[]` (2 items) | 유일한 array 형식 |
| D-142 | `string` | spec 누락 |
| D-143 | `string` | spec 기재 |
| D-144 | `string` | spec 누락 |

**결과:** spec 문서 §3 caveats 항목은 본 토픽에서 정정해야 하는 부수 산출물입니다. 별도 PD 분화 없이, Phase 0 마이그레이션 스크립트의 dry-run 출력으로 spec 문서 정정 근거를 함께 박제합니다.

### 1.2 caveats 형식 혼재 — 마이그레이션 필수성

집계 함수가 `caveat.startsWith()` 같은 string-only API에 의존하면 D-141의 `string[]` 케이스에서 silent fail합니다. 또한 `caveatsMeta`를 부착하려면 caveat의 위치(index)가 안정적이어야 하므로, 단일 source의 인덱싱이 필요합니다.

선택 옵션 3안:
- **A안: SOT 단일 형식 — `string[]` 통일 (권고)** — 모든 5건 string을 1-element array로 wrap. 후속 entry는 array 강제. 장점: 인덱스 안정·타입 단순. 단점: ledger 파일 5건 in-place 수정.
- B안: union 유지 + 정규화 헬퍼 — `normalizeCaveats(d)` 함수가 실시간 변환. 장점: 파일 무수정. 단점: caveatsMeta index와 caveats index 비정렬 위험.
- C안: 짓지 않음 — caveatsMeta를 entry 단위 1택으로만 운영. 장점: 마이그레이션 0. 단점: caveat별 분류 불가 — 집계 신뢰도 저하.

**A안 채택**: 인덱스 안정성이 caveatsMeta v2(스펙 §2)의 전제조건. C안은 spec 본의(per-caveat acked)에 정합하지 않음.

### 1.3 caveatsMeta SOT 결정

스펙 §2가 선택한 방식 — entry-level `caveatsMeta: { acked, ackedBySession, ackedAt, resolvedAt, scope }` 단일 객체 — 를 유지합니다. caveat-level array는 MVP 범위 초과(`pragmatic_weapon_not_art` 정합).

### 1.4 의존 그래프

```
Phase 0 (schema migration)
   │  ledger entry 6건 in-place 수정
   ↓
Phase 1 (compute-dashboard.ts 함수 추가)
   │  computeAckedButUnresolved() 구현
   ↓
Phase 2 (dashboard_data.json 필드 확장)
   │  pipeline 빌드 후 JSON 검증
   ↓
Phase 3 (dashboard-upgrade.html 패널)
   │  GRADE_COLORS·tokens.css 정합
   ↓
Phase 4 (Master 분류 결정 D-145)
      6건 caveat 1턴 일괄 분류 → ledger 갱신
```

각 Phase 간 단방향 의존. Phase 4는 결정 박제이므로 자동화 불가 — Master inline 결정으로 1턴 압축 (`implementation_within_3_sessions` 정합).

---

## §2. Phase 분해

### Phase 0 — schema 마이그레이션 (`scripts/migrate-caveats-format.ts`)

**무엇을:** 6건 entry의 `caveats: string` → `caveats: string[]` 통일. `caveatsMeta` 기본값 부착.

**구조:**
```ts
// 의사 코드
for (const d of ledger.decisions) {
  if (!d.caveats) continue;
  if (typeof d.caveats === 'string') d.caveats = [d.caveats];
  if (!d.caveatsMeta) {
    d.caveatsMeta = {
      acked: false,
      ackedBySession: null,
      ackedAt: null,
      resolvedAt: null,
      scope: null
    };
  }
}
```

**중요:** 자동 분류 금지 (`no_retro_without_value` 정합). 모든 entry `acked: false` 시작. Master inline 결정만 수정.

**검증 게이트 G0:**
- dry-run 모드 우선 (`--apply` 별도 플래그)
- `git diff memory/shared/decision_ledger.json` 결과 6 entry만 변경
- caveatsMeta 5종 필드 전부 부착
- D-141 caveats 길이 2 유지 (손실 0)
- JSON parse 통과

**롤백:** `git checkout memory/shared/decision_ledger.json` 1줄.

### Phase 1 — `compute-dashboard.ts` 집계 함수

**무엇을:** `computeAckedButUnresolved(decisions, currentSessionNum)` 추가.

**구조:**
```ts
function computeAckedButUnresolved(
  decisions: Decision[],
  currentSessionNum: number,
  ttlSessions = 2
): AckedButUnresolvedItem[] {
  const items: AckedButUnresolvedItem[] = [];
  for (const d of decisions) {
    const meta = d.caveatsMeta;
    if (!meta?.acked) continue;
    if (meta.resolvedAt) continue;
    const age = currentSessionNum - (meta.ackedBySession ?? currentSessionNum);
    if (age < ttlSessions) continue;
    for (const c of d.caveats ?? []) {
      items.push({
        decisionId: d.id,
        caveat: c,
        ackedBySession: meta.ackedBySession,
        ageInSessions: age
      });
    }
  }
  return items;
}
```

**검증 게이트 G1:**
- TypeScript 빌드 통과 (`npx tsc --noEmit` 또는 컴파일 path)
- 단위 케이스: 6 entry 모두 `acked: false` 상태 → 결과 0건 (Phase 0 직후)
- 모킹 케이스: `acked: true, ackedBySession: 165` (current=168) → age=3, TTL=2 통과 → 결과 1건
- TTL 환경변수 `ACKED_TTL_SESSIONS` override 가능

### Phase 2 — `dashboard_data.json` 필드 확장

**무엇을:** `compute-dashboard.ts` 메인 흐름이 `ackedButUnresolved` 필드를 출력 JSON에 박제.

**구조:** 결과 배열을 dashboard_data 루트(or `panels.ackedButUnresolved`)에 직접 노출. spec §1의 패널 단위 분리 구조 따름.

**검증 게이트 G2:**
- `dist/dashboard_data.json`에 `ackedButUnresolved` 키 존재
- 0건 케이스 빈 배열 `[]` (null 금지)
- 빌드 파이프라인 (`auto-push.js` chain) 회귀 없음

### Phase 3 — `dashboard-upgrade.html` 패널 신설

**무엇을:** 새 panel 컴포넌트 — 카드 그리드 + 빈 상태.

**구조:**
- 패널 제목: "Acked but Unresolved Caveats"
- 0건 상태: "현재 미해결 ack 0건 ✅" (Phase 0 직후 기본값)
- 1+ 상태: 카드 per item — `decisionId`, `caveat` (1줄 truncate), `ackedBySession`, `ageInSessions` 배지
- GRADE_COLORS 토큰 충돌 회피 — `var(--color-warn-muted)` 등 기존 `tokens.css` 토큰만 사용. 신규 hex 도입 금지.

**검증 게이트 G3:**
- VR diff: 0건 빈 상태가 기존 패널 정렬 깨지 않음
- 모바일 반응형 비파괴 (`no_re_asking_settled_policy` — 정착 정책 재질문 금지)
- index.html과 dashboard-upgrade.html 모두 동일 패널 적용 여부 = Phase 3 범위 외 (canonical은 dashboard-upgrade)

### Phase 4 — Master 결정 박제 (D-145 후보)

**무엇을:** Master가 6건 caveat 각각에 대해 `acked` / `still-relevant` / `resolved` 1턴 일괄 분류. Edi가 ledger에 박제:

```
caveatsMeta.acked = true | false
caveatsMeta.ackedBySession = 168 (현재 세션)
caveatsMeta.ackedAt = "2026-05-02"
caveatsMeta.resolvedAt = (해당 시) "2026-05-02"
```

**검증 게이트 G4:**
- 6건 모두 분류 결과 박제 (누락 0)
- 다음 dashboard 빌드에서 패널 결과 일치
- D-145 entry 1건 신설 (분류 정책 메타)

---

## §3. 리스크 + mitigation + fallback

| ID | 리스크 | mitigation | fallback |
|---|---|---|---|
| R-1 | caveats 형식 혼재 마이그레이션 시 D-141 array 손상 | dry-run 우선 + `git diff` 6 entry 한정 검증 + array length preserve assertion | `git checkout memory/shared/decision_ledger.json` revert |
| R-2 | TTL=2 세션이 짧아 false positive 노출 | `ACKED_TTL_SESSIONS` env override + 패널 상단 "임계 N세션" 표기 | 임계 5+ 상향 또는 패널 임시 숨김 |
| R-3 | 자동 분류 유혹 — `no_retro_without_value` 위반 | Phase 0 스크립트 모두 `acked: false` 기본값 강제. Master inline 결정만 수정 가능 | git revert + Phase 4 재실행 |
| R-4 | 본 토픽 3세션 초과 우려 | Phase 4를 Master 1턴 일괄 분류로 압축. Phase 0~3 본 세션 내 완결 | child 분화 거부 — 본 토픽 내 완료 |
| R-5 | dashboard 패널이 GRADE_COLORS와 시각 충돌 | `tokens.css` 기존 토큰만 사용 — 신규 hex 0 도입 | 패널 임시 비활성화 (feature flag) |
| R-6 | spec 문서 D-130/132/133 오기재 발견 — 다른 spec 항목도 오염 가능성 | Phase 0 dry-run 결과를 spec 정정 근거로 박제 | spec 전수 검증 별도 토픽 (PD 분화) |
| R-7 | LLM 자율 호출이 마이그레이션 스크립트를 자동 실행 | `--apply` 플래그 명시 강제 + `package.json` script 미등록 | dry-run 결과만 노출, apply는 Master 승인 후 |

리스크 7건 모두 mitigation·fallback 병기 (`arki_risk_requires_mitigation` 절대 원칙 정합).

---

## §4. forbid (절대 금지)

### 시간 어휘 (Schedule-on-Demand 정합)
- `D+N일`, `N주차`, `MM/DD`, 구체 날짜 사용 금지
- `N시간`, `N일 소요`, `공수`, `MM` 단위 금지
- 담당자 이름 배정 금지

### 데이터 정책
- caveats 자동 acked 분류 금지 (`no_retro_without_value`)
- 6건 entry의 acked 값 추론 금지 — Master inline 결정만 인정
- 신규 SOT 파일 생성 금지 — `decision_ledger.caveats` 단일 출처 유지
- `caveatsMeta`를 별도 파일로 분리 금지 (entry-level inline 유지)

### 범위 정책
- 본 토픽 외 파일 변경 금지 (예: `package.json` name, 다른 페르소나 정책)
- index.html 패널 적용은 본 Phase 범위 외 (canonical = dashboard-upgrade)
- TTL 정책 재설계는 본 토픽 외 (env override만 허용)

### 호출 정책
- Phase 0 스크립트 `--apply` 자동 실행 금지 — Master 승인 게이트 필수
- LLM 자율 호출이 마이그레이션 트리거 금지 (`arki_full_system_view` — 다축 검증)

---

ARKI_SPEC_DONE: reports/2026-05-02_pd056-ackedbutunresolved-impl/arki_rev1.md

[ROLE:arki]
# self-scores
aud_rcl: Y
str_fd: 4
spc_lck: Y
sa_rnd: 2
