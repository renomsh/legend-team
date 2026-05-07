---
turnId: 1
invocationMode: subagent
session: session_207
topic: topic_176
role: dev
phase: P0-grep-investigation
date: 2026-05-07
---

# topic_NNN hardcode 전수 조사 — P0

Arki rev1 §3.1 P0 산출. mtopic_NNN namespace 도입 전 코드 레이어 분기 지점 식별.

## 1. 통계

- **총 entries: 34**
- **needs-branch (mtopic 분기 필요): 19**
- **topic-only (정당 / legacy / spike): 8**
- **agnostic (id shape 무관 또는 _archived/주석): 7**

### 카테고리

| category | count |
|---|---|
| regex | 6 |
| path (경로 hardcode) | 18 |
| literal (특정 ID 박제) | 5 |
| comment (주석) | 3 |
| startsWith | 0 |

`topic_id.startsWith('topic_')` 패턴은 **0건** — 이 코드베이스는 prefix 검사 대신 정규식·경로 join·literal 사용. 구조적으로 깔끔.

### Hot files (needs-branch 多)

1. `scripts/create-topic.ts` — 5건 (`topics/${id}` 경로 박제)
2. `scripts/lib/topic-resolver.ts` — 2건 (controlPath/reportPath fallback)
3. `scripts/lib/topic-status.ts` — 2건 (SOT path + mirror path)
4. `app/js/nav.js` — 2건 (regex 정렬·최신 추출)
5. `app/decisions.html` — 2건 (`/^topic_\d+$/` test로 anchor 생성 분기)

## 2. SPIKE-R6 마커 위치

**파일**: `.claude/hooks/post-tool-use-task.js`

- **선언 블록**: line 290 ~ 307 (17줄, `spikeLog()` 함수 정의 포함)
- **호출 지점 6개**: line 311, 345, 348, 369, 372, 375

`SPIKE_R6_LOG` 환경변수 미설정 시 no-op 확인 완료 (reports/2026-05-07_topic_176_spike/dev_rev1.md).

**cleanup 절차**:
1. line 290~307 블록 통째 제거
2. line 311, 345, 348, 369, 372, 375의 `spikeLog(...)` 호출 6줄 제거
3. PD 항목(decision_ledger.json line 2525, 2578·current_session.json line 30) resolved 처리

## 3. 코어 분기 지점 (P4 작업 시 우선 박제 대상)

Arki rev1 §6 권고 "scripts/lib/topic-id.ts 단일 정규식 export" 적용 시 다음 위치가 import 소비자가 됨:

### 3.1 정규식 6건 — `lib/topic-id.ts` 단일 출처화

| 파일 | line | 현재 | 처리 |
|---|---|---|---|
| `scripts/migrate-topic-index.ts` | 32 | `/^topic_(\d+)([a-z]*)$/i` | `parseTopicId` import |
| `app/js/nav.js` | 144 | `/^topic_(\d+)/` | viewer는 별도 사본 유지(번들 분리). mtopic 분기 추가 |
| `app/js/nav.js` | 211 | `/^topic_(\d+)([a-z]*)$/i` | 동일 |
| `app/index.html` | 232 | `/^topic_(\d+)/` | 동일 |
| `app/decisions.html` | 129, 148 | `/^topic_\d+$/.test(...)` | `/^(m)?topic_\d+$/` 확장 또는 OR |

**권고**: viewer 측은 `<script>` inline이라 `lib/topic-id.ts` import 불가. nav.js에 `compareTopicIdDesc` + mtopic 인지 함수 export하고 다른 페이지는 그걸 사용하도록 통일.

### 3.2 경로 분기 핵심 4건

| 파일 | 핵심 분기 |
|---|---|
| `scripts/lib/topic-status.ts` line 59, 82 | `mtopic_index.json` SOT + `mtopics/${id}/topic_meta.json` mirror 분기 (또는 단일 디렉토리 합의) |
| `scripts/lib/topic-resolver.ts` line 21, 22 | mtopic resolver 분기 또는 별도 `mtopic-resolver.ts` 신설 |
| `scripts/create-topic.ts` 5곳 | mtopic 신규 발급 시 별도 디렉토리 정책 반영 |
| `scripts/build.js` line 127 | viewer published mtopic_index 생성 분기 |

### 3.3 viewer 정책 분기 2건

- `app/js/data-loader.js` line 74 — mtopic_index.json 별도 fetch
- `app/decisions.html` line 129, 148 — owningTopicId가 mtopic이면 같은 anchor 패턴(topic.html?id=...) 사용 가능 정책 결정

## 4. topic-only / agnostic 분류 근거

**topic-only (8건)**: 모두 (a) legacy 일회성 마이그레이션 스크립트 5건(`migrate-editor-pass3/4`, `migrate-editor-to-edi`, `migrate-p4-phase-hold-legacy`, `migrate-topic-index`) 또는 (b) topic_176 spike 한정 literal 3건(`spike-r6-task-race.ts` × 2 + post-tool-use-task.js의 spike 마커). mtopic_NNN 진입 시 새 마이그레이션 스크립트 별도 작성하면 됨.

**agnostic (7건)**: `_archived/*` 3건(런타임 import 없음 확인), 주석 3건(src/types/index.ts JSDoc, scripts/_archived/generate-dashboard.ts), 그 외 fixture 1건(tests/topic-status-finalize-r6.test.ts의 `topic_127` · `topic_999`).

## 5. 다음 단계 권고 (Arki rev1 P-단계 입력)

P0 → P4 진입 시 우선순위:

1. **`scripts/lib/topic-id.ts` 신설** — TOPIC_RE / MTOPIC_RE / parseTopicId / compareTopicIdDesc 단일 출처. Arki rev1 MUST_BY_N=10 항목.
2. **`scripts/lib/topic-resolver.ts` mtopic 분기** — 평면 분리(`mtopic_index.json`) 채택 시 별도 resolver 또는 inline if. fallback path도 분기.
3. **`scripts/lib/topic-status.ts` SOT 분기** — `mtopic_index.json` 신규 SOT 추가. mirror 경로 정책 결정 후 박제.
4. **`scripts/create-topic.ts`** — `--namespace mtopic` 옵션 추가 또는 별도 `create-mtopic.ts` 분기. P5(mtopic_001 첫 발급) 직전.
5. **viewer 측** — `app/js/nav.js` + `app/decisions.html`은 P6(운영 모니터) 단계까지 mtopic 표시 유보 가능 (mtopic이 메인 라인 KPI에 들어가지 않게 함이 자연스러움).

**Riki append-only 1차 검토 권고**: 위 5개 위치 중 1·2·3은 **append-only 호환** (기존 topic_index.json 수정 0, 신규 mtopic_index.json만 추가). 4(create)·5(viewer)는 신규 분기지 기존 path 변경 0. 따라서 P4 박제는 **기존 topic_NNN 동작 무영향** 확인됨 — Arki rev1 R-9 mitigation 정합.

## 6. 산출 파일

- `reports/2026-05-07_topic_176_arki/grep_topic_hardcode.json` — entries 34건 + summary
- `reports/2026-05-07_topic_176_arki/grep_topic_hardcode_summary.md` — 본 문서

[ROLE:dev]
# 조사 작업이라 측정 metric 해당 없음 — 형식만 박제
