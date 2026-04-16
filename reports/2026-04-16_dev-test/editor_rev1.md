---
role: editor
topic: dev-test
topic_id: topic_018
session: session_021
date: 2026-04-16
report_status: final
---

# Dev Test — 세션 산출물

## 토픽 목적

Dev 에이전트 첫 실전 투입. Arki 구조 분석 → Dev 구현 → 검증 파이프라인 테스트.
대상: `session-log.ts` 세션 클로즈 버그 3종.

## 발언 순서

Ace(프레이밍) → Arki(구조 분석 + 실행계획) → Dev(구현 + 검증)

## 버그 수정 내역

### B-01: duration 음수 출력
- **파일**: `scripts/session-log.ts` L236–241
- **원인**: `startedAt`이 수동 입력 미래 시각일 때 음수 발생
- **수정**: `ms >= 0` 조건 추가 → 음수 시 `'unknown (startedAt in future)'` 출력

### B-02: OP-04 FAIL — session_index 항목 누락
- **파일**: `scripts/session-log.ts` L221–233
- **원인**: `map()` 기반 업데이트 — session_index에 항목 없으면 무시
- **수정**: `some()` 체크 후 없으면 `push()` 소급 추가 + WARN 로그

### B-03: topicSlug mismatch 경고 불명확
- **파일**: `scripts/session-log.ts` L191–194
- **수정**: 로그/콘솔에 "사용된 slug" 명시

## 타입 정의 수정

### `src/types/index.ts`
- `TopicStatus`: `'completed'`, `'suspended'` 추가
- `TopicIndexEntry`: `controlPath`, `reportPath`, `reportFiles`, `published` 필드 추가 (실제 데이터 구조 반영)
- 기존 `path` 필드: optional로 변경 (legacy fallback)

## 타입 오류 해소
- `scripts/create-topic.ts`: `TopicIndexEntry` 타입 오류 해소
- `scripts/lib/topic-resolver.ts`: `controlPath`, `reportPath` 접근 오류 해소
- `npx tsc --noEmit`: 오류 0

## 검증 결과

`ts-node scripts/session-log.ts end dev-test` 실행:
- B-01: `duration: 117m` 양수 정상
- B-02: `added retroactively` → OP-04 PASS
- B-03: mismatch 메시지 명시 포함

## 추가 발견: topic_index.json JSON 오염

세션 오픈 시 Edit 도구로 삽입한 topic_018 항목이 배열 밖으로 유출 (`],` 이후 삽입). JSON 파싱 실패 원인. 수정 완료.

---

*Editor: 디자인 판단 없음. 구현 사실 기록만.*
