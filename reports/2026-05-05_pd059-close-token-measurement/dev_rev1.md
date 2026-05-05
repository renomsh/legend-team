---
role: dev
session: session_196
topic: topic_169
topicSlug: pd059-close-token-measurement
rev: 1
date: 2026-05-05
turnId: 8
invocationMode: subagent
accessed_assets:
  - file: .claude/commands/close.md
    scope: G5/G2/G1 수정 대상
  - file: scripts/lib/topic-status.ts
    scope: R-1 SOT 확인 + G2 헬퍼 검증
  - file: memory/shared/status_catalog.json
    scope: R-1 enum 현황 확인
  - file: memory/shared/decision_ledger.json
    scope: G1 스냅샷 동작 검증
---

# Dev — PD-059 Close 프로세스 토큰 절감 구현

Dev입니다.

---

## 무엇을 만들었는지

| 항목 | 변경 내용 |
|---|---|
| G5 | `.claude/commands/close.md` Step 8에 session_index.json LLM 직접 Read 금지 명시 |
| R-1 | close.md Step 4의 status SOT를 status_catalog.json(4종) → CLAUDE.md 7종으로 수정 |
| G2 | close.md Step 4에 topic_index.json 전문 읽기 금지 + updateTopicStatus() 스크립트 호출 지시 추가. PD resolveCondition은 hook이 담당함을 명시 |
| G1 | `scripts/get-ledger-snapshot.ts` 신규 작성 + close.md Step 3 지시 변경 (스냅샷 우선 + escape hatch) |

---

## G5 — session_index.json LLM 직접 Read 금지

**변경 파일:** `.claude/commands/close.md` Step 8

**추가 문구:**
```
[G5 — LLM 직접 Read 금지] session_index.json은 hook이 전담한다.
LLM이 이 파일을 Read 도구로 직접 읽는 것은 금지 — 불필요한 78K tokens 소비 방지.
참조가 필요하면 current_session.json의 sessionId로 충분하다.
```

---

## R-1 — status SOT 동기화

**발견:** close.md Step 4가 `status_catalog.json`(4종: open/in-progress/completed/suspended)을 SOT로 지정. 반면 `scripts/lib/topic-status.ts`는 이미 CLAUDE.md 기준 7종 enum을 TypeScript 타입으로 정의.

**실측 확인:**
- `topic-status.ts` TopicStatus 타입: `open | framing | design-approved | implementing | completed | suspended | cancelled` (7종)
- `status_catalog.json` statuses[].id: `open, in-progress, completed, suspended` (4종)

**결론:** topic-status.ts가 코드 레벨 실제 SOT. close.md가 구식 status_catalog.json을 참조하고 있었음.

**변경 내용:** close.md Step 4의 "허용 값은 status_catalog.json의 statuses[].id만" → "허용 값은 CLAUDE.md §Topic Lifecycle의 7종 enum (D-B)"로 수정.

**비고:** status_catalog.json은 UI 색상·레이블 정보를 보유한 별도 파일로 enum SOT가 아님. 파일 자체는 유지(UI 참조 목적).

---

## G2 — topic_index.json 전문 읽기 → 스크립트 호출 전환

**변경 파일:** `.claude/commands/close.md` Step 4

**추가 지시:**
```
[G2 — 전문 읽기 금지] topic_index.json 전문을 Read 도구로 읽지 말 것 (31K tokens 낭비).
현 topicId 항목만 scripts/lib/topic-status.ts의 updateTopicStatus() 헬퍼를 통해 갱신:
  npx ts-node -e "import {updateTopicStatus} from './scripts/lib/topic-status'; ..."
PD resolveCondition 매칭은 hook 체인의 resolve-pending-deferrals.ts (dry-run) 및
auto-close-topics.ts가 담당 — LLM 개입 불필요.
```

**R-3 확인:** `resolve-pending-deferrals.ts`가 hook 체인에서 dry-run으로 실행됨 (`session-end-finalize.js` 참조). LLM이 topic_index 전문을 읽지 않아도 PD resolveCondition 매칭은 스크립트가 처리. G2 전환 안전.

---

## G1 — get-ledger-snapshot.ts 구현

**신규 파일:** `scripts/get-ledger-snapshot.ts`

**기능:**
- decision_ledger.json에서 최소 필요 결정만 필터링
- 필터 규칙: (현 topicId 관련 전체) ∪ (최근 N건, 기본 30) — 중복 제거
- CLI: `npx ts-node scripts/get-ledger-snapshot.ts <topicId> [--limit=30]`
- 출력: `{ totalDecisions, snapshotDecisions, omittedDecisions, decisions[], escapeHatch }` JSON

**close.md Step 3 변경:**
- 전문 읽기 금지 명시
- 스냅샷 명령 지시: `npx ts-node scripts/get-ledger-snapshot.ts <topicId>`
- escape hatch 명문화: "충돌 의심 시 전문 Read 허용"

---

## 어떻게 실행하는지

```bash
# G1 스냅샷 (기본 30건)
npx ts-node scripts/get-ledger-snapshot.ts topic_169

# G1 스냅샷 (제한 변경)
npx ts-node scripts/get-ledger-snapshot.ts topic_169 --limit=50

# G2 topic status 갱신 (스크립트 직접 호출 예시)
npx ts-node scripts/test-update-topic-status.ts
```

---

## 실제 출력 증거

### G1 스냅샷 실행 결과 (topic_169, limit=5)

```json
{
  "generatedAt": "2026-05-05T05:22:52.144Z",
  "totalDecisions": 164,
  "snapshotDecisions": 5,
  "omittedDecisions": 159,
  "topicId": "topic_169",
  "limit": 5,
  "escapeHatch": "충돌 결정 의심 시 decision_ledger.json 전문 조회 가능 (escape hatch). ...",
  "decisions": [...]
}
```

### G2 updateTopicStatus 동작 확인

```
topic_169 found: true | current status: open
updateTopicStatus type: function
G2 verification: updateTopicStatus import OK
```

---

## 검증 체크리스트

| 항목 | 결과 |
|---|---|
| G5: close.md Step 8에 session_index 금지 문구 존재 | PASS |
| R-1: topic-status.ts가 7종 enum 사용 확인 | PASS (이미 7종) |
| R-1: close.md Step 4 SOT 참조 수정 | PASS |
| G2: close.md Step 4 지시 변경 확인 | PASS |
| G2: updateTopicStatus() 함수 import 동작 | PASS |
| G2: PD resolveCondition = hook 담당 확인 | PASS |
| G1: get-ledger-snapshot.ts 컴파일 통과 | PASS |
| G1: 실행 결과 정상 JSON 출력 | PASS |
| G1: close.md Step 3 스냅샷 지시 + escape hatch | PASS |

---

## 변경 파일 목록

| 파일 | 변경 유형 | 내용 |
|---|---|---|
| `.claude/commands/close.md` | 수정 | Step 3(G1), Step 4(R-1+G2), Step 8(G5) — 토큰 절감 지시 추가 |
| `scripts/get-ledger-snapshot.ts` | 신규 | decision_ledger 스냅샷 CLI 스크립트 |

---

## 추정 절감 효과

Jobs 기준 실행 순서(G5→R-1→G2→G1) 완료 후 예상 /close 컨텍스트 절감:

| 항목 | 절감 토큰 |
|---|---|
| G5: session_index 우발 읽기 예방 | 78K tokens (발생 시) |
| G2: topic_index 전문 읽기 제거 | ~29K tokens/세션 |
| G1: decision_ledger 전문 읽기 제거 | ~45K tokens/세션 |
| **합계** | **~74K tokens/세션 (+ G5 예방)** |

/close 컨텍스트 점유율: 74~80% → 예상 40% 이하 (Jobs 목표 달성 범위).

---

[ROLE:dev]
# self-scores
rt_cov: 0.75
gt_pas: 1.0
hc_rt: 0.0
spc_drf: 0
