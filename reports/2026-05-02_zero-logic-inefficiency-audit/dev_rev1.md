---
role: dev
session: session_173
topic: topic_150
topicId: topic_150
turnId: 2
phase: runtime-verification
rev: 1
invocationMode: subagent
---

# Dev — Zero 비효율 점검 런타임 검증

Dev입니다. Riki/Arki가 미검증으로 자인한 5개 영역에 대해 행위 검증만 수행했습니다. 코드 변경 0. 실측 결과만 박제합니다.

---

## 1. 검증 대상별 실측

### V1. `.claude/hooks/session-end-finalize.js` — zero/jobs/sage 분기 로직

**검증 명령:**
```
Grep pattern: "zero|jobs|sage|KNOWN_ROLES|role_registry|role_palette|ROLE_LIST" -i
대상: .claude/hooks/session-end-finalize.js (1597 lines)
```

**실측 결과:**
- 전체 1597 라인 중 zero/jobs/sage/KNOWN_ROLES/role_registry/role_palette/ROLE_LIST 키워드 매칭 **0건**.
- 매칭된 라인 14건은 모두 무관 텍스트 (`message`, `usage`, `messageCount` 등 — 단어 부분 매칭 false positive).
- turn role 처리 로직 (L475·L1035 등): `turn.role` 문자열을 generic하게 read. 화이트리스트 검증 없음.

**판정: 정상.** finalize.js는 role-agnostic. 새 페르소나(zero/jobs/sage)가 turns에 들어와도 통과. role 화이트리스트 결손 위험 없음.

---

### V2. session_index.json + dashboard_data.json — 실제 zero/jobs/sage turns

**검증 명령:**
```
grep -c '"role":\s*"zero"' memory/sessions/session_index.json → 2
grep -c '"role":\s*"jobs"' memory/sessions/session_index.json → 11
grep -c '"role":\s*"sage"' memory/sessions/session_index.json → 0
```

**실측 결과:**
- zero turns: 2건 (line 6669, 6686 — session_index.json).
- jobs turns: 11건 (line 6471, 6522, 6583, 6622, 6627, 6692, 6697, 6836, 6841, 7116, +).
- sage turns: 0건.

**dashboard_data.json (memory/shared/) 집계 검증:**
```json
{ "role": "jobs", "count": 11 }
{ "role": "zero", "count": 2 }
```

**판정: 정상.** roleFrequency 집계가 zero=2, jobs=11로 정확히 반영됨. sage는 turn 0건이라 자연 누락 (집계 오류 아님).

---

### V3. `scripts/compute-dashboard.ts` — roleFrequency 집계 로직

**검증 위치 (L456-474):**
```ts
const turnRoleFreqMap = new Map<string, { count: number; sessions: string[] }>();
for (const s of sessionIndex.sessions) {
  if (s.legacy) continue;
  if (!s.turns || s.turns.length === 0) continue;
  for (const turn of s.turns) {
    let role = turn.role.toLowerCase();
    if (role === 'editor') role = 'edi';
    const entry = turnRoleFreqMap.get(role) ?? { count: 0, sessions: [] };
    entry.count++;
    ...
```

**실측 결과:**
- role을 turns에서 직접 추출. role_registry.json read **하지 않음**.
- 화이트리스트 필터 없음. lowercase + `editor→edi` alias만 hardcode.
- zero/jobs/sage 자동 포함. 새 역할 추가 시 코드 변경 불필요.

**판정: 정상.** Riki R-1 가설(SOT 분열) 정합 — viewer·집계는 turns 직접 추출, role_registry.json은 dead reference. role_registry 결손은 운영 영향 0.

---

### V4. `.claude/hooks/session-end-tokens.js` — token 집계 role 분류

**검증 명령:**
```
Grep pattern: "zero|jobs|sage|KNOWN_ROLES|ROLE_LIST|role_palette|role_registry"
대상: .claude/hooks/session-end-tokens.js (270 lines)
```

**실측 결과:**
- 전체 270 라인 중 role-specific 분기 **0건**.
- 집계 단위: 세션 전체 (input/output/cache 토큰 합산). role 분류 없음.
- L117-150 `aggregateTokens()` 함수: transcript 메시지 단위 sum, role 무관.

**판정: 정상.** token_log는 role 분류 안 함. zero 분류 부재가 영향 미치는 코드 경로 없음.

---

### V5. `scripts/build.js` — viewer 빌드 시 role_palette/role_registry 사용

**검증 명령:**
```
Grep pattern: "role_palette|role_registry|tokens\.css|role-colors"
대상: scripts/build.js (289 lines)
```

**실측 결과:**
- 키워드 매칭 **0건**.
- L26-30: DATA_SOURCES = `memory/`, `reports/`, `logs/` 단순 복사.
- viewer는 build 시점이 아닌 런타임에 fetch (`role_palette.json`은 dist/data/memory/shared/로 단순 복사).
- 실제 색상 SOT는 `app/css/tokens.css` (Riki A1 실측 결과 정합).

**판정: 정상.** build.js는 role-agnostic 복사. role_palette 결손 시에도 빌드 정상.

---

## 2. 정상/결손/위험 분류

### 정상 (5건)
1. **finalize.js** — role-agnostic, 12역할 모두 통과. (V1)
2. **session_index 집계** — zero=2, jobs=11 정확 기록. (V2)
3. **compute-dashboard.ts** — turns 직접 추출, registry 미의존. (V3)
4. **session-end-tokens.js** — role 분류 없음, 영향 무. (V4)
5. **build.js** — 단순 복사, role-agnostic. (V5)

### 결손 (0건)
런타임 영향 있는 결손 미발견. role_registry.json·role_palette.json의 zero/jobs/sage 부재는 실제로 read되지 않으므로 운영 영향 없음 (Riki R-1 정합).

### 잠재 위험 (1건)
- **W1. role_registry.json SOT 격하 미문서화 (🟢 낮음)** — 코드는 이미 turns 직접 추출로 우회했으나, 정책 문서·persona는 여전히 role_registry를 SOT처럼 기술. 향후 신규 페르소나 추가 시 "registry에 박제하라"는 잘못된 가이드 따라 dead update 발생 가능. (본 토픽 범위 밖, Sage/Jobs 공통 후속 토픽 권고)

---

## 3. Master 의사결정 영향 항목

| 항목 | Arki/Riki 권고 | Dev 검증 결과 | 의사결정 영향 |
|---|---|---|---|
| C1 excludedAssets 4중 박제 | Arki 🔴 / Riki 🟡 유지+통합 | 코드 read 0건 확인 (보호 대상도 부재) | **유지/폐기 무관 — 회귀 비용 0**. Master 선호로 결정 가능 |
| C4 role_registry/palette 결손 | Arki 🔴 / Riki 🟢 DEFER | viewer·집계 모두 정상 작동 확인 | **DEFER 정합** — 운영 영향 0 |
| C5 rules.zero 비대칭 보강 | Arki 🟡 / Riki ❌ 거부 | dispatch_config 자체가 enforce 0건 | **거부 정합** — 박제 비대화 안티패턴 |
| C2 D-125 NCL 명문 잔존 | Arki 🟡 / Riki 🟡 유지 | 본 검증 범위 외 (decision_ledger 메타) | 저비용 메모 추가만 |

---

## 4. 실측 한계

- **build 회귀 미실행** — 실제 `node scripts/build.js` 실행 → dist/ 비교는 미수행. 정적 분석만. 단 build.js가 단순 복사임이 코드상 명백하므로 회귀 가능성 낮음.
- **viewer runtime 미검증** — 실제 브라우저에서 zero turn 색상 출력 확인 안 함. 단 Riki A1에서 tokens.css L50 + role-colors.js L23-34 hardcode 확인됨 → 정합.
- **모든 worktrees 미검증** — `.claude/worktrees/*` 다수 (60+) 의 dashboard_data.json은 미확인. 메인 트리만 검증. (worktrees는 격리된 작업 트리로 운영 영향 없음)

---

## 결론

**핵심 1줄:** zero/jobs/sage 페르소나는 finalize·집계·viewer 전 코드 경로에서 정상 처리되며, role_registry/palette 결손은 실제 운영 영향 0이다.

**Master 결정 권고:** Riki 재라벨(C1 🟡, C4 🟢 DEFER, C5 ❌ 거부) 채택 안전. 본 토픽은 식별 단계 종료 → 정리 단계에서 C1·C9만 처리 권고.

```
[ROLE:dev]
# self-scores
rt_cov: 0.85
gt_pas: 0.95
hc_rt: 0.05
spc_drf: 0
```
