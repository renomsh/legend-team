---
role: arki
turnId: 2
invocationMode: subagent
date: 2026-05-04
topic: context-token-audit
slug: context-token-audit
rev: 1
---

# Arki — /open 컨텍스트 토큰 구성 분석

## 실측 결과

| 구분 | 파일 | 크기(B) | 추정 토큰 | 압축 가능 |
|---|---|---|---|---|
| 시스템 | CLAUDE.md | 19,969 | ~7,261 | Y |
| 시스템 | MEMORY.md (auto-memory index) | 7,207 | ~2,621 | Y |
| 시스템 | gitStatus (system-reminder) | 4,334 | ~1,576 | N |
| 시스템 | userEmail + currentDate | 200 | ~73 | N |
| open체크 | current_session.json | 780 | ~284 | N |
| open체크 | system_state.json | 5,746 | ~2,089 | Y |
| open체크 | nexus_memory_open.json | 1,798 | ~654 | Y |
| open체크 | open.md | 2,568 | ~934 | Y |
| **open체크** | **session_index.json (전체)** | **295,855** | **~107,584** | **Y!!!** |
| open체크 | load-context-briefs output | 319 | ~116 | N |
| dispatch | dispatch-context (persona layer) | 7,800 | ~2,836 | Y |
| **합계** | | **346,576 B** | **~126,028 tok** | |

> 토큰 추정: 1 token ≈ 2.75 bytes (한국어 혼합 기준)

---

## 57K 토큰 가설 검증

Master가 언급한 ~57K 토큰과 실측 ~126K 토큰의 괴리 분석:

| 시나리오 | 토큰 규모 |
|---|---|
| session_index.json 제외 시 (18K) | ~18,444 tok |
| session_index.json 포함 시 (실측) | ~126,028 tok |
| **57K 토큰 도달 지점** | session_index.json 없이 + α |

**가설**: "~57K 토큰"은 session_index.json을 전체 Read하지 않고 system_state의 nextSessionId만 참조했을 때의 추정치이거나, 이전 세션 session_contributions 보고서(~38K 상당)가 추가로 로드된 시나리오.

---

## 핵심 발견

### 1. session_index.json — 압도적 최대 오버헤드 (MUST_NOW)

- **실측**: 295,855 bytes → **~107,584 tokens**
- 전체 컨텍스트의 **85%** 차지
- 목적: `/open` 시 `nextSessionId` 산출에만 사용 (183개 세션 × 평균 1,616 bytes/세션 전체 로드)
- **구조적 낭비**: 183개 세션 전체 데이터를 로드해서 마지막 ID + 1 계산

**Fix 방향**: `session_index.json`에 `"nextSessionId": "session_187"` 필드 추가 또는 `scripts/get-next-session-id.ts` 스크립트로 분리 조회. Read 없이 nextSessionId만 추출하면 **107K 토큰 즉시 절감**.

### 2. CLAUDE.md — 구조 압축 가능 (MUST_BY_N=10)

- 19,969 bytes → ~7,261 tokens
- 반복 패턴: Grade System 테이블, 역할 목록 등 중복 설명 다수
- **Fix 방향**: `## Topic Grade System` 테이블을 별도 참조 파일로 분리, 인라인 포함 규칙만 요약 (~30% 절감 가능 → ~5K tok)

### 3. MEMORY.md — 중요도 계층화 필요 (MUST_BY_N=10)

- 7,207 bytes → ~2,621 tokens
- 45개 피드백 항목 전체 인라인 → 최근 세션 피드백만 active로 분류, 나머지 archive 처리
- **Fix 방향**: `## ACTIVE (최근 20개)` / `## ARCHIVED` 분리 → ~50% 절감

### 4. dispatch-context persona layer — 역할별 선택 로드 (SHOULD)

- 7,800 bytes (_common.md + policies/role-arki.md + personas/role-arki.md)
- 서브에이전트 1회 호출마다 전체 정책 로드 → 역할 선택적 필드만 주입 가능
- **Fix 방향**: TOTAL_CAP_CHARS=80,000 설정이 있으나 persona-layer 절삭 금지 규칙이 있어 실질 절감 제한

---

## 자기감사 (1차)

### structuration
- session_index.json이 nextSessionId 산출 외 목적으로도 사용될 가능성 있음 (3-c 최근 3세션 요약에서 `system_state.recentSessionSummaries[]` 참조하므로 session_index.json 직접 참조 불필요 확인됨)
- open.md 체크리스트 4번이 session_index.json 전체 Read 구조 강제

### hardcoding
- session_index.json path가 open.md에 하드코딩 (변경 용이하나 압축 방법은 코드 레벨 변경 필요)
- TOTAL_CAP_CHARS=80000 in pre-tool-use-task.js 하드코딩 (설정 파일화 NICE)

### efficiency
- 183개 세션 × 1,616 bytes = 295KB를 nextSessionId 1개 위해 전량 로드 — 최고 severity 낭비
- dispatch-context 45개 feedback 파일은 MEMORY.md 인덱스만 로드 (이미 효율적)
- load-context-briefs output 319 bytes — 이미 최적

### extensibility
- session_index.json은 세션 추가될수록 무한 증가 구조 → 183세션 기준 ~295K, 300세션 시 ~480K 예상
- MEMORY.md feedback 항목도 누적 증가 구조 — archive 계층 없으면 계속 비대화

---

## 자기감사 (2차) — scope drift 체크

1차 발견 MUST_NOW 1개, MUST_BY_N=10 2개, SHOULD 1개, NICE 1개. 2차에서 추가 확인:

- **session_index.json Fix의 역효과 경계**: nextSessionId 분리 시 append-session.ts가 양쪽 동기화 필요 → 단순 field 추가로 해결 가능, 역방향 의존 없음 ✓
- **CLAUDE.md 압축 경계**: 정책 테이블 외부 분리 시 system-reminder에서 참조 불가 → 핵심 규칙은 인라인 유지 필수. 분리 대상은 Grade 테이블, 역할 목록에 한정
- scope drift 없음 (원래 정의 내 분석)

2차 발견: 추가 결함 0개 → 종료 기준 충족

---

## 압축 시나리오 요약

| 시나리오 | 절감 토큰 | 대응 방법 |
|---|---|---|
| session_index → nextSessionId 필드만 | ~107,552 tok | 파일에 필드 추가 (MUST_NOW) |
| session_index → 최근 10세션 슬라이스 | ~103,703 tok | read-only tail 스크립트 |
| CLAUDE.md 구조 압축 | ~2,000 tok | 테이블 분리, 요약 인라인 |
| MEMORY.md active/archive 분리 | ~1,300 tok | 계층화 |
| **최대 절감 합계** | **~113,855 tok** | (126K → ~12K tok) |

---

## 설계 옵션 (session_index.json 문제 한정)

**Option A (권고)** — `session_index.json`에 `nextSessionId` 필드 추가
- 장: 코드 변경 최소 (append-session.ts 한 줄 추가), 즉시 적용
- 단: nextSessionId 필드와 sessions[] 간 정합성 관리 필요
- 절감: ~107K tok

**Option B** — `scripts/get-next-session-id.ts` Bash 스크립트로 ID 조회, Read 호출 제거
- 장: 파일 구조 변경 없음
- 단: open.md 체크리스트 수정, 스크립트 신규 추가
- 절감: ~107K tok

**Option C** — session_index.json을 rolling 구조로 변경 (최근 30세션만 유지, 전체는 archive)
- 장: 근본적 무한 증가 방지
- 단: archive 관리 복잡도 증가, legacy session 접근 제한
- 절감: ~100K tok

**권고**: Option A (가장 단순, 즉시 효과)

---

## 경계 조건

- session_index.json을 open.md 4번 외에 다른 곳에서도 Read하는 경우 fix 범위 확대 필요
- CLAUDE.md 압축은 system-reminder 외부에서 참조하는 스크립트가 없는지 먼저 확인 필요
- dispatch-context persona-layer는 "절삭 금지" 정책(pre-tool-use-task.js line 157)이 있어 자동 절삭 불가 — 정책 레벨 변경 필요
