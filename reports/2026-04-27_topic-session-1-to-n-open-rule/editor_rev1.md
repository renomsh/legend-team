---
role: editor
topic: topic_117
session: session_116
date: 2026-04-27
rev: 1
phase: compile
---

# 에디 산출물 — Topic-세션 1:다 구조 (session_116)

## 변경 파일
- `.claude/commands/open.md` — 7번 항목 분기 A/B 재작성, Grade 판정 규칙 §0 추가

## 핵심 변경

### 7번 항목 (분기 A — 기존 토픽 재사용)
`/open topic_NNN ...` 패턴 감지 시:
- topic_index.json에서 엔트리 확인 (없으면 오류 후 중단)
- current_session.json.topicId = 기존 topic_NNN
- topic_index.json status → "open" 갱신
- `create-topic.ts` 실행 금지
- 보고: "기존 토픽 topic_NNN — {title}에 session_NNN 추가"

### 7번 항목 (분기 B — 신규 토픽 생성)
토픽 ID 미명시 시 기존과 동일하게 `create-topic.ts` 실행.

### Grade 판정 규칙 §0 추가
`/open topic_NNN ...` 패턴 최우선 감지. 토픽 ID + grade 동시 명시 가능(`/open topic_NNN B 추가 작업`).

## 사용 예시
```
/open topic_117                   # 기존 topic_117, grade 유지
/open topic_117 B 이어서 작업     # 기존 topic_117, grade: B
/open B 새 토픽 제목              # 신규 토픽 생성, grade: B
```

## 결정 사항
없음 (스킬 파일 수정만)
