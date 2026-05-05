---
role: arki
session: session_196
topic: topic_169
topicSlug: pd059-close-token-measurement
rev: 1
date: 2026-05-05
turnId: 0
invocationMode: subagent
---

# Arki — PD-059 Close 프로세스 토큰 측정

## 1. Close Chain 구조도

`/close` 명령 실행 시 토큰 소비는 **두 레이어**로 구분된다.

### Layer A: LLM Context Window (Claude가 직접 읽는 것)

```
/close 명령 수신
    │
    ├─► CLAUDE.md (19,969 bytes ≈ 4,992 tokens) — 항상 system context에 포함
    ├─► MEMORY.md (사용자 자동 메모리) — 항상 포함
    ├─► .claude/commands/close.md (4,012 bytes ≈ 1,003 tokens) — /close 명령 정의
    │
    ├─► [LLM 직접 읽기: current_session.json 확인]
    │       current_session.json (~897 bytes ≈ 224 tokens)
    │
    ├─► [LLM 직접 읽기: 14단계 수행 중 필요 파일]
    │       decision_ledger.json (193,510 bytes ≈ 48,377 tokens)  ← 핵심 비용
    │       topic_index.json    (125,847 bytes ≈ 31,461 tokens)   ← 핵심 비용
    │       master_feedback_log.json (78,841 bytes ≈ 19,710 tokens)
    │       role_memory.json × N (역할당 ~10~14K bytes)
    │       session_index.json  (313,667 bytes ≈ 78,416 tokens)   ← 단계적 읽기 시
    │
    └─► [Edi 서브에이전트 호출 시: pre-tool-use-task.js 주입]
            PersonaLayer inject:
              _common.md (2,904 bytes)
            + role-edi.md policy (6,550 bytes)
            + role-edi.md persona (2,232 bytes)
            = 페르소나 레이어 ~11,686 bytes ≈ 2,921 tokens
            TopicLayer inject: 이전 세션 Edi 보고서 MAX_CHARS_PER_EDI=8,000 chars
            SessionLayer inject: 현 세션 turn 보고서 MAX_CHARS_PER_REPORT=6,000 chars × N
```

### Layer B: SessionEnd Hook 체인 (Node.js 프로세스, LLM 컨텍스트 밖)

```
auto-push.js (SessionEnd 트리거)
    │
    ├─ 1. session-end-tokens.js (11,256 bytes)
    │       → .jsonl transcript 파싱 (파일 I/O — LLM context 아님)
    │       → token_log.json append
    │       → current_session.json tokenUsage 기록
    │
    ├─ 2. session-end-finalize.js (65,290 bytes)
    │       → current_session.json 읽기
    │       → decision_ledger.json 읽기 (delta-check)
    │       → topic_index.json 읽기 (delta-check)
    │       → master_feedback_log.json 읽기 (delta-check)
    │       → role_memory.json stat (mtime check)
    │       → session_index.json append
    │       → 다수 ts-node 서브프로세스 spawn:
    │           write-session-contribution.ts
    │           regenerate-context-brief.ts
    │           check-pending-deferrals.ts
    │           set-closed-in-session.ts
    │           auto-close-topics.ts (dry-run)
    │           resolve-pending-deferrals.ts (dry-run)
    │           sync-system-state.ts
    │       → system_state.json 읽기/쓰기
    │       → project_charter.json 읽기/쓰기 (versionBump)
    │
    ├─ 3. finalize-self-scores.ts (8,148 bytes)
    ├─ 4. compute-signature-metrics.ts (10,444 bytes)
    ├─ 5. compute-dashboard.ts (22,010 bytes)
    │       → dashboard_data.json 재계산 (파일 I/O)
    ├─ 6. validate-prime-directive.ts (4,186 bytes)
    └─ 7. build.js (10,478 bytes)
            → dist/ 재생성 (Cloudflare Pages 반영)
```

**핵심 구분:** Layer B는 LLM 컨텍스트에 직접 inject되지 않는다. Node.js 프로세스 수준 I/O. 토큰 비용은 Layer A에서만 발생.

---

## 2. 각 단계 토큰 비용 추정

토큰 환산 기준: 1 token ≈ 4 bytes (영어 기준), 한국어 혼합 텍스트는 실제 더 높을 수 있음. 아래는 하한 추정.

### 2.1 고정 System Context (모든 세션 공통)

| 파일 | 크기(bytes) | 추정 토큰 | 비고 |
|---|---|---|---|
| CLAUDE.md | 19,969 | ~4,992 | 항상 포함 |
| MEMORY.md | ~8,000 est | ~2,000 | 사용자 메모리 |
| close.md | 4,012 | ~1,003 | /close 명령 정의 |
| **소계** | **~32K** | **~8,000** | |

### 2.2 /close 14단계 LLM 직접 읽기 (Step 3~7 중심)

| 파일 | 크기(bytes) | 추정 토큰 | Step | 필요성 |
|---|---|---|---|---|
| current_session.json | 897 | ~224 | Step 1 | 필수 |
| decision_ledger.json | 193,510 | **~48,377** | Step 3 | 필수 |
| topic_index.json | 125,847 | **~31,461** | Step 4 | 필수 |
| master_feedback_log.json | 78,841 | **~19,710** | Step 6 | 조건부 |
| role_memory.json × 역할수 | ~13,655/역할 | ~3,413/역할 | Step 7 | 조건부 |
| session_index.json | 313,667 | **~78,416** | 참조 시 | 대용량 위험 |

### 2.3 Edi 서브에이전트 호출 시 (pre-tool-use-task.js 주입)

pre-tool-use-task.js TOTAL_CAP_CHARS = 80,000 chars (상한 있음)

| 레이어 | 최대 chars | 추정 토큰 |
|---|---|---|
| PersonaLayer (Edi 기준: _common + role-edi policy + persona) | ~11,686 | ~2,921 |
| TopicLayer (이전 Edi 보고서) | 최대 8,000 | ~2,000 |
| SessionLayer (현 세션 turn 보고서) | 최대 6,000 × N turns | ~1,500 × N |
| **주입 총합 상한** | **80,000** | **~20,000** |

### 2.4 /close 세션 총 추정 토큰 (일반적 Grade B 토픽, Edi 포함)

| 구분 | 추정 토큰 |
|---|---|
| System context (CLAUDE.md + MEMORY.md + close.md) | ~8,000 |
| 대화 이력 (turn 교환 누적) | ~10,000~30,000 |
| Step 3 decision_ledger 읽기 | ~48,377 |
| Step 4 topic_index 읽기 | ~31,461 |
| Step 6 master_feedback_log (조건부) | ~19,710 |
| Edi 서브에이전트 주입 (TOTAL_CAP 상한) | ~20,000 |
| **추정 합계** | **~137,000~160,000 tokens** |

> **경고**: decision_ledger(48K)와 topic_index(31K)가 전체 토큰의 약 50~55%를 차지한다.
> session_index(78K tokens)가 의도치 않게 읽힐 경우 추가 78K tokens 소비.

---

## 3. 절감 가능 지점 (리스크 + Mitigation + Fallback 필수)

### G1 — decision_ledger.json 전문 읽기 (Priority: MUST_BY_N=10)

**현황:** Step 3에서 LLM이 decision_ledger.json(193KB ≈ 48K tokens) 전문을 읽는다. 세션당 추가된 결정은 보통 1~3건이다.

**절감 가설:** 마지막 N건만 읽거나, 현 세션 관련 결정만 필터링.

**추정 절감:** 48K tokens 중 40~45K tokens 절감 가능 (80~90% 감소).

**리스크:**
- LLM이 이전 맥락 없이 충돌 결정을 박제하는 오기 위험
- `checklistDeltaCheck` 함수가 ledger를 읽어 cross-check — 이건 hook(Node.js)이므로 무관

**Mitigation:** 전문 대신 "최근 30건 + 현 세션 토픽 관련 결정만" 뷰를 pre-compute. scripts에 `scripts/get-ledger-snapshot.ts` 추가 → close.md Step 3 지시 변경.

**Fallback:** 오기 감지 시 Arki/Riki가 다음 세션에서 역검사. session-end-finalize.js의 기존 delta-check가 안전망.

---

### G2 — topic_index.json 전문 읽기 (Priority: MUST_BY_N=10)

**현황:** Step 4에서 topic_index.json(125KB ≈ 31K tokens) 전문 읽기. 현재 세션의 토픽 1건만 업데이트가 필요하다.

**추정 절감:** 31K tokens 중 28~30K tokens 절감 가능.

**리스크:**
- 관련 토픽 링크·PD resolveCondition 매핑을 놓칠 수 있음
- status 7종 규칙 확인 필요

**Mitigation:** close.md Step 4 지시를 "topic_index.json의 현 topicId 항목만 `updateTopicStatus()` 헬퍼 경유 갱신" 으로 변경. LLM은 스크립트 호출만 하고 전문 읽기 불필요.

**Fallback:** `validate-schema-lifecycle.ts` 스크립트가 기존에 drift 감시 중 — 갱신 누락을 사후 검출 가능.

---

### G3 — master_feedback_log.json 조건부 읽기 (Priority: SHOULD)

**현황:** Step 6는 Master feedback이 있을 때만 실행되지만, close.md가 조건 분기를 명시하지 않아 대부분의 경우 LLM이 전문(78KB ≈ 19K tokens)을 읽는다.

**추정 절감:** 19K tokens × 조건부 발생률(추정 30~50%) = 평균 6~9K tokens 절감.

**리스크:** Master feedback이 있는 세션에서 log를 읽지 않으면 중복 기록 위험.

**Mitigation:** close.md Step 6 지시를 "current_session.json.masterFeedback 길이 > 0인 경우만 읽기" 로 명시.

**Fallback:** finalize hook의 Step 6 delta-check가 누락 시 warn 출력.

---

### G4 — Edi 서브에이전트 호출 시 SessionLayer inject 최적화 (Priority: SHOULD)

**현황:** pre-tool-use-task.js의 TOTAL_CAP = 80K chars. 세션 turn이 많을수록 SessionLayer가 커진다. MAX_CHARS_PER_REPORT = 6,000 chars/역할.

**추정 절감:** turn 수 × 6K chars. 역할 5개 세션이면 30K chars 절감 가능.

**리스크:** Edi가 이전 역할 발언 요약 없이 컴파일하면 품질 저하.

**Mitigation:** Zero Condense 게이트(이미 v4에서 구현됨)가 condensed.md를 사용하여 6K → 1~2K chars로 압축 가능. Zero 호출 선행 강화.

**Fallback:** TOTAL_CAP 절삭 로직이 이미 존재 (Level 1~4). 현재도 80K 상한 보호 중.

---

### G5 — session_index.json 우발적 읽기 방지 (Priority: MUST_NOW)

**현황:** session_index.json = 313KB ≈ 78K tokens. LLM이 실수로 Read하면 단일 최대 비용.

**리스크:** close.md에 session_index 읽기 명시는 없으나, LLM이 컨텍스트 확인 목적으로 자율 Read할 가능성. 실측 확인 필요.

**Mitigation:** close.md에 "session_index.json은 읽지 않는다. [자동] finalize hook이 처리" 를 명시적으로 금지 문구로 추가.

**Fallback:** step 8 지침("수동 실행 불필요")이 이미 있으나 LLM 자율 Read를 차단하지 않음 → 명시적 금지 문구 추가 필요.

---

### 자기감사 (3회)

**1차 감사 — 발견 4개 / 4축 최소 3지점 검사**

- `structuration`: G1·G2 절감 포인트가 각각 별개 파일이므로 구조 분리 명확. LLM 읽기 vs Hook 읽기 경계가 암묵적 → 명시화 MUST_NOW.
- `hardcoding`: TOTAL_CAP_CHARS=80000, MAX_CHARS_PER_REPORT=6000, MAX_CHARS_PER_EDI=8000 모두 코드 하드코딩. dispatch_config.json으로 이동 검토 SHOULD.
- `efficiency`: decision_ledger + topic_index 전문 읽기는 명백한 중복 비용. 둘 합쳐 ~80K tokens → 스냅샷 pre-compute 방식으로 대체 MUST_BY_N=10.
- `extensibility`: close.md가 14단계 모노리스 텍스트. 단계별 파일 분리 구조로 바꾸면 선택적 include 가능 NICE.

**2차 감사 — 발견 2개**

- `structuration`: buildTopicLayer가 모든 이전 세션 Edi 보고서를 전부 inject한다. 세션이 쌓일수록 누적 크기가 unbounded. 현재 TOTAL_CAP_CHARS=80K로 절삭되지만 cap 접근 빈도 모니터링 부재 → logs/pre-tool-use-task.log에 injectionLen 추적 중(확인됨) — ROI SHOULD.
- `extensibility`: token_log.json에 세션별 토큰 집계가 있으나, close 단계별(Step 3, Step 4 등) 기여분 분해 없음. 절감 효과 검증이 어렵다 → 단계별 토큰 기여 측정 MUST_BY_N=10 (PD-059 미션 핵심).

**3차 감사 — 발견 1개**

- `efficiency`: pre-tool-use-task.js는 Edi 서브에이전트 호출 시만 주입하는 게 아니라 모든 Task 호출에 주입한다. close 과정에서 Edi 외에 다른 역할도 호출되면(ex. role_memory 업데이트용 역할 서브에이전트) 해당 주입도 발생 — 실측 확인 필요 SHOULD.

---

## 4. 구조적 실행계획

### Phase 분해

**Phase 1: 측정 인프라 구축**
- `close.md` 각 단계에 `## [TOKEN_PROBE] Step N` 마커 삽입
- `token_log.json` 스키마에 `stageBreakdown: {step3: N, step4: N, ...}` 필드 추가
- close 실행 후 transcript .jsonl의 message당 token → step 귀속 로직 구현
- `pre-tool-use-task.log`의 injectionLen 값을 per-call 리포트에 병기

**Phase 2: 핵심 절감 구현 (G1·G2)**
- `scripts/get-ledger-snapshot.ts` 구현: 현 세션 topicId 관련 결정 + 최근 30건 필터
- `scripts/get-topic-entry.ts` 구현: topicId 단건 JSON 반환
- `close.md` Step 3·4 지시 변경: 전문 대신 스냅샷 스크립트 호출 참조

**Phase 3: 검증 게이트 통과 후 배포**
- G3(master_feedback 조건화) + G5(session_index 명시 금지) close.md 편집
- 실측 before/after token_log 비교 (token_log.entries[].usage.total_billable 기준)

### 의존 그래프

```
Phase 1 (측정) → Phase 2 (G1·G2 절감) → Phase 3 (G3·G5 보완)
      ↓ 검증 게이트 G-A
Phase 2 통과 기준: total_billable 10% 이상 감소 확인 (token_log before/after 비교)
```

### 검증 게이트

- **G-A (Phase 1 완료 기준):** token_log에 stage별 breakdown 필드 있음 + 3회 이상 close 실측값 기록
- **G-B (Phase 2 완료 기준):** G1·G2 절감 후 total_billable 측정값이 Phase 1 baseline 대비 ≥20% 감소
- **G-C (Phase 3 완료 기준):** close.md 지시 변경 후 session_index 우발 읽기 0건 (logs 확인)

### 전제조건

- token_log.json 기존 누적값: before-baseline으로 사용 가능 (현재 구조 활용)
- Phase 2 스크립트 구현: Dev 인계 전 Arki spec 동결 필요

### 중단 조건

- G1·G2 스냅샷 구현 후 결정 cross-check 오기 발생 시 → 전문 읽기 복구 + Phase 2 재설계
- TOTAL_CAP 도달 빈도가 오히려 증가하면 → SessionLayer 절삭 로직 우선 검토

---

## 요약

Close 프로세스 LLM 토큰 비용의 주요 요인은 다음 3가지다:

1. **decision_ledger.json 전문 읽기** (~48K tokens) — 절감 우선순위 1위
2. **topic_index.json 전문 읽기** (~31K tokens) — 절감 우선순위 2위
3. **master_feedback_log.json 비조건부 읽기** (~19K tokens) — 조건부 트리거 개선으로 절감

Hook 체인(session-end-finalize.js 등)은 Node.js 프로세스 수준이며 LLM 토큰을 소비하지 않는다. 절감 대상은 LLM이 `close.md` 지시에 따라 직접 Read하는 파일들이다.

G1·G2 스냅샷 방식 구현 시 총 70~80K tokens 절감(전체 close 비용의 40~50%) 가능으로 추정된다.
