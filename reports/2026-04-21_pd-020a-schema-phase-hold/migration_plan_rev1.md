---
topic: PD-020a 스키마 + phase×hold 기반 구현
sessionId: session_054
artifact: migration_plan
rev: 1
executionPlanMode: plan
---

# 마이그레이션 실행계획 v1 (5 Phase)

executionPlanMode: **plan**. 구조적 선후만 (시간·담당·공수 금지어 D-018 준수).

## Phase 분해

### P1 — Catalog + Schema Spec 분리 산출

**산출물:**
- `memory/shared/phase_catalog.json` 신설
- `memory/shared/hold_reasons_catalog.json` 신설
- `docs/schema/topic-centric-v1.md` (schema_spec_rev1.md를 docs로 이관)

**게이트:** Master 승인 (catalog enum 값·alias·deprecated 정책).

**롤백:** 신설 파일 3개 삭제. 코드 영향 0.

---

### P2 — Validator + Type Guards

**산출물:**
- `scripts/validate-topic-schema.ts` 신설
  - `assertPhase`, `assertHold` type guards export
  - `validateAll()` — 56 topic + 52 session 전수 스캔
  - 위반 리스트 산출 (json + console)

**게이트:**
- 알려진 legacy(56 topic + 52 session 전체) 외 위반 0건
- 알려진 legacy 외 위반 ≥ 5건 시 → **중단 + Master 재소집**

**롤백:** 스크립트 삭제. 데이터 영향 0.

---

### P3 — Writer 갱신

**산출물:**
- `scripts/create-topic.ts` 갱신 — phase·hold·phaseHistory 초기화 로직
- `scripts/append-session.ts` 갱신 — topicId·phaseAtStart·phaseAtEnd 기록, phase 변경 시 phaseHistory push, lastActivityAt 갱신

**게이트:**
- Dry-run: 신규 dummy 토픽 생성 + dummy 세션 1건 append → schema validator 통과
- antiPattern 코드(미러·sessions[]) 부재 grep 검증

**롤백:** git revert 단일 커밋.

---

### P4 — Migration 실행

**산출물:**
- `scripts/migrate-to-topic-centric.ts` 신설 (idempotent 강제)
  - 56개 `topic_meta.json`에 `phase: null`, `hold: null`, `legacy: true` 추가 (기존 필드 보존)
  - 56개 `topic_meta.json`에서 `sessions[]` 필드 존재 시 제거
  - 56개 `topic_index` 엔트리에 `legacy: true` 추가
  - 52개 `session_index` 엔트리에 `topicId` 백필 — **slug 정확매칭만**
    - 매칭 실패 시 `topicId: null`, `legacy: true`
    - **추측 매칭 금지** (R6 원칙)
  - `topicPhaseAtStart`/`topicPhaseAtEnd`는 legacy 세션에 기록 안 함

**전제:** P3 게이트 통과.

**게이트:**
- 사전 git tag 백업: `pre-pd020a-migration`
- 마이그레이션 후 P2 validator 전수 통과
- slug 매칭 실패율 통계 산출 (정보용, blocking 아님)

**롤백:** `git reset --hard pre-pd020a-migration` (Master 승인 시에만).

**중단 조건:** validator 통과 실패 OR 기존 dashboard 빌드 실패 → 즉시 중단.

---

### P5 — Verify

**산출물:**
- `npx ts-node scripts/validate-topic-schema.ts --all` 통과
- `npx ts-node scripts/validate-session-turns.ts --all` 통과 (D-048 기존 검증)
- `node scripts/build.js` 통과 (dashboard 무회귀)
- 토픽 목록 UI(app/topic.html) 무회귀 — phase 미러 삭제 후 UI 깨지지 않음 확인

**게이트:** 모든 검증 green.

**실패 시:** P4 롤백 → 원인 분석 → P3·P4 재시도.

---

## 의존 그래프

```
P1 (Catalog + Spec)
  ↓
P2 (Validator + Type Guards)
  ↓
P3 (Writer 갱신)
  ↓
P4 (Migration 실행)  ←─ 사전 git tag 백업
  ↓
P5 (Verify)
  ↓
종결: PD-020a status → resolved
```

## Dev 양방향 협의 항목 (D-031 원칙)

P3·P4 진입 전 Dev와 합의 필요:
1. `session_index` 엔트리 구조 — `topicId` 백필 가능한 식별자 필드 존재 확인
2. slug 매칭 로직 — `topicSlug` ↔ `topic_index.path`/`controlPath` 정합성
3. migrate 스크립트 idempotent 보장 — 재실행 시 noop

## 금지어 자가검토

절대 시간(D+N일·N주차·MM/DD), 담당자, 공수 단위(N시간·N일·MM) 사용 0건 ✅
