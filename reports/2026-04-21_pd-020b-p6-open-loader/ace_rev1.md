---
session: session_062
topic: PD-020b P6 — /open 로더 통합
role: ace
rev: 1
date: 2026-04-21
---

## Ace (L1 경량 프레이밍)

**토픽:** P6 = `/open` 로더에 `context_brief.md` 자동 로드 통합

**핵심:** `.claude/commands/open.md`의 체크리스트에 step 3.5를 추가 — openTopics(hold=null) 각각의 `topics/{id}/context_brief.md`를 읽어 세션 컨텍스트에 포함. 스크립트(`load-context-briefs.ts`) 신설 + 순수 지시문 방식 병행.

**범위 안:** open.md 수정 + context_brief 로드 지시 추가 + 보조 스크립트.
**범위 밖:** close.md, 기존 writer 수정.
