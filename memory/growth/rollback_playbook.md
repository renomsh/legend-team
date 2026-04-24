# PD-023 Self-Scores MVP — Rollback Playbook

**Source:** `reports/2026-04-23_pd023-self-scores-thin-impl/arki_rev1.md` §8
**Scope:** Grade S topic_088 / session_082 canonical spec v1.0
**Last updated:** 2026-04-24

---

## When to Invoke

Trigger rollback when **any one** of the following criteria is met:

- **E-010 compute SLA 위반 ≥ 3회** (누적, 30세션 window) — finalize 3초 초과가 반복되어 세션 종료가 지연될 때.
- **Schema validation E-class 에러가 compile 차단** — E-001/E-006/E-009/E-022 중 하나가 `compile-metrics-registry.ts`를 실패시켜 registry snapshot을 생성하지 못할 때.
- **Master "원복" 신호** (`feedback_revert_when_master_frustrated` 원칙, session_044) — Master가 "엉망", "헤매", "원복" 중 하나라도 발화 시 변호 없이 즉시 실행. 상태만 보고.
- **self_scores.jsonl append 손상** — write-atomic.ts fsync 실패로 partial write가 감지되거나 orphan metricId (E-002)가 5건 이상 누적.
- **Dashboard L4 (Tier 1/2/3 signature 섹션)이 build.js 빌드를 차단** — `scripts/build.js` 실행 중 L4 관련 예외 발생 시.

무응답 = 보류 (저마찰 원칙). 적용 전 Master 통지 권장, 단 "원복" 신호 수신 시 통지 생략 가능.

---

## Rollback Steps (8단계, 순차 실행)

### Step 1. `session-end-finalize.js` 이전 버전 git revert

```bash
# 최근 커밋 중 session-end-finalize.js 변경분만 되돌림
git log --oneline -- .claude/hooks/session-end-finalize.js | head -5
git revert <commit-sha-of-pd023-finalize>
# 또는 특정 파일만 이전 상태로:
git checkout <pre-pd023-sha> -- .claude/hooks/session-end-finalize.js
```

**확인:** `node .claude/hooks/session-end-finalize.js --dry-run` 이 에러 없이 종료.

### Step 2. `compute-dashboard.ts` L4 분기 차단

두 가지 경로 중 하나 선택:

```bash
# (a) feature_flags 즉시 토글 (재배포 불필요)
# memory/shared/feature_flags.json 편집:
#   "signatureMetricsEnabled": false
```

또는

```bash
# (b) 코드 분기 주석 처리 (feature flag 시스템 자체가 의심스러울 때)
# scripts/compute-dashboard.ts 의 L4 block 을 주석 처리 후:
npx ts-node scripts/compute-dashboard.ts
```

**확인:** `dist/data/dashboard_data.json` 재생성, `tier1Cards`/`tier2Body` 필드 제거 또는 빈 배열.

### Step 3. `self_scores.jsonl` 보존 (삭제 금지)

```bash
# 원본 보존 복사 — 사후 분석용
cp memory/growth/self_scores.jsonl \
   memory/growth/_quarantine/self_scores.jsonl.rollback-$(date +%Y%m%d-%H%M%S)
# 원본은 건드리지 않는다. evidence 보존 원칙.
```

**확인:** `ls -la memory/growth/_quarantine/` 에 타임스탬프 백업 존재.

### Step 4. `current_session.json.turns[].selfScores` 무시 (호환 유지)

```bash
# 스키마는 유지, 소비 지점만 끈다.
# scripts/lib/turn-types.ts 의 selfScores 필드는 optional 이므로 제거 불필요.
# session-end-finalize.js 에서 selfScores 읽기 블록 early-return 처리.
```

**확인:** 다음 세션 종료 시 `current_session.json` 은 정상 기록되고 `self_scores.jsonl` 엔 append 되지 않음.

### Step 5. Dashboard role-signature 섹션 hidden 토글

```bash
# app/signature.html, app/dashboard-upgrade.html 의
# <section class="tier" id="tier1"> 등에 style="display:none" 추가
# 또는 feature_flags.json 기반 조건부 렌더링으로 전환.
```

**확인:** `npx serve dist/` 후 브라우저에서 signature.html 접속, Tier 섹션이 보이지 않음.

### Step 6. 회귀 테스트 통과 확인 (`test-regression.ts`)

```bash
npx ts-node scripts/test-regression.ts
# 기대: PD-023 변경 전 스냅샷 5개 fixture 와 diff 0
# 실패 시 Step 1~5 중 놓친 파일이 있는지 역추적
```

**확인:** stdout 에 `fixtures PASS (5/5)` 출력.

### Step 7. `_quarantine/` 폴더 내 미flush 파일 수동 검토

```bash
ls -la memory/growth/_quarantine/
# 각 파일에 대해:
#  - 스키마 검증 통과 (validate-self-scores.ts 수동 실행) + 의미적 무결성 확인
#    → flush 가능 → self_scores.jsonl 에 append 후 _quarantine/ 에서 삭제
#  - 손상 (JSON parse 실패 또는 orphan metricId)
#    → _quarantine/corrupt/ 로 이동, 사후 분석 대기
```

**확인:** `_quarantine/` 루트에 미처리 파일 없음. corrupt 케이스는 `logs/app.log` 에 상세 기록.

### Step 8. 버전 v1.55 → v1.54 fallback

```bash
# memory/shared/project_charter.json 의 version 필드 수정
# "version": "1.55" → "1.54"
# revision_history 에 fallback 사유 기록:
#   { "version": "1.54", "from": "1.55", "reason": "PD-023 rollback", "date": "..." }
```

**확인:** `decisions.html` 대시보드에서 version 표기가 1.54로 갱신.

---

## Recovery Verification

Step 8 완료 후 다음 3단계 검증을 **반드시** 수행한다.

1. **write-atomic 무결성 probe**
   ```bash
   npx ts-node -e "require('./scripts/lib/write-atomic').probe('./memory/growth/self_scores.jsonl')"
   ```
   기대: fsync OK, inode consistent, 마지막 레코드 JSON parse 통과.

2. **회귀 테스트 재실행**
   ```bash
   npx ts-node scripts/test-regression.ts
   ```
   기대: `PASS (5/5)`. 실패 시 rollback 미완료 — Step 1~5 재점검.

3. **Dashboard 로드 검증**
   ```bash
   node scripts/build.js
   npx serve dist/ &
   # 브라우저: http://localhost:3000/signature.html
   ```
   기대: 페이지 로드, L4 (Tier 1/2/3) 섹션 오류 없음 (숨김 상태여도 JS 콘솔 에러 0건).

---

## Post-Rollback Action

1. **로그 기록** — 세션 이벤트로 rollback 을 공식 기록:
   ```bash
   npx ts-node scripts/session-log.ts rollback pd023-self-scores-mvp
   # logs/app.log 에 timestamp + trigger criteria + 실행 step 목록이 append 된다.
   ```

2. **current_session.json gaps 필드에 기입** — 세션 종료 체크리스트의 gap 항목에 rollback 사실을 명시:
   ```json
   {
     "gaps": [
       "PD-023 rollback executed at <timestamp> — trigger: <criteria>. See logs/app.log."
     ]
   }
   ```

3. **Master 브리핑 (비동기)** — session-end 시 Edi 가 rollback 사실 1줄 요약을 마스터에게 전달. 후속 조치 (PD-023 재시도 / 폐기 / 분할 축소)는 별도 토픽으로 오픈.

4. **Evidence 기록** — `memory/shared/evidence_index.json` 에 E-NNN 엔트리 추가 (type: `operational-gap`, status: `open`).

---

## Residual Risks

- `self_scores.jsonl` 은 보존되므로 데이터 손실 없음. 그러나 재사용 시 스키마 드리프트 주의 (registryVersion 필드로 호환성 판정).
- dashboard hidden 상태에서도 build.js 는 L4 관련 코드를 파싱하므로, 장기간 rollback 유지 시 Step 2(b) 경로 (코드 분기 주석 처리) 를 권장.
- v1.54 fallback 후 재진입은 새 토픽 (PD-023-retry) 으로 오픈. 기존 topic_088 는 `status: rolled-back` 으로 마감.
