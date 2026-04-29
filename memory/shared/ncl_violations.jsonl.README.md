# `ncl_violations.jsonl` — Nexus Contribution Ledger Violations

> 박제: D-123 (session_141, topic_131, 2026-04-29). Phase A enforcement는 D-120 + D-124 정의.

## 목적

NCL(Nexus Contribution Ledger) 4항목 — Origin Trace / Influence Score / Diversity Index / Anchor vs Synth — 의 violation flag를 turn-단위 append-only 로그로 기록.

## 파일 형식

JSON Lines (`.jsonl`). 각 라인 = 독립 JSON 객체 = 1 violation flag.
- **append-only** (Phase A 동안): 기존 라인 수정·삭제 금지. resolve/dismiss는 별도 jsonl 또는 master_feedback_log.json mirror로.
- 빈 파일 자체는 git track 하지 않음 — 첫 실 flag 발생 시 hook이 신설.

## 스키마 (Arki rev1 §2.5 공통 메타)

각 라인은 다음 5필드 의무:

| 필드 | 타입 | 설명 |
|---|---|---|
| `type` | enum | `origin` \| `influence` \| `diversity` \| `anchor_synth` |
| `severity` | enum | `warn` \| `block` (Phase A는 전부 `warn`-only) |
| `turnIdx` | integer | `current_session.json.turns[].turnIdx` |
| `sessionId` | string | `session_NNN` |
| `condition_id` | string | 조건식 ID (예: `origin.self_citation`, `diversity.axis_coverage`) |
| `raw_metric` | object | 산출 지표 raw 값 (예: `{"self_citation_ratio": 0.62}`) |

### 선택 필드
- `topicId` — `topic_NNN`
- `role` — 발언 역할
- `phase` — 발언 phase
- `acknowledgedBy` — `ace` (Ace ack 시, D-124)
- `ackReason` — 50자 이상 의무 (D-124)
- `ackedAt` — ISO timestamp
- `ackedSessionId` — TTL 비교용 (D-124, 2 세션 TTL)

## 운영 규칙

- **trigger:** 코드 hook 단독 (PostToolUse(Task) + SessionEnd finalize 2단). 모델 자율 판단 0% (D-124 + Affaan D4).
- **페르소나 노출 차단 (D-115/D-125):** 본 파일은 역할 prompt 자동 prepend 금지. Zero 페르소나 prompt에서 hard-exclude (`dispatch_config.json[persona.zero.excludedAssets]`).
- **Phase A v0:** origin / influence / diversity 3항목만 작동. anchor_synth는 v0.1 (synth 분류기 hook 구현 후).
- **임시 통제 (anchor_synth v0):** Edi 세션 종료 시 random 1 turn 수동 spot-check.

## 관련 결정

- D-115 ~ D-121 (s140) — NCL 인프라 + Affaan 4
- D-122 (s141) — prime directive lock + 무결성 hook
- D-123 (s141) — 4항목 조건식 + v0/v0.1 분기
- D-124 (s141) — 판정 주체 + Ace ack 권한 제약 (D-120 supersede)
- D-125 (s141) — Zero 운영 매핑 + 페르소나 노출 차단

## 관련 스크립트 (예정)

- `.claude/hooks/session-end-finalize.js` — session-level flag append + ack TTL escalate
- PostToolUse(Task) hook — turn-level flag append (P2 후속 토픽)
- `scripts/validate-prime-directive.ts` — prime directive 무결성 (D-122, 본 세션 박제)
