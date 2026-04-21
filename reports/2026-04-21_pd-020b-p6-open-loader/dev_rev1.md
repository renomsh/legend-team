---
session: session_062
topic: PD-020b P6 — /open 로더 통합
role: dev
rev: 1
date: 2026-04-21
---

## Dev 구현 결과

### 신규 파일

**`scripts/load-context-briefs.ts`**
- system_state.json의 openTopics 중 hold=null인 항목 필터
- topics/{id}/context_brief.md 존재 시 phase·grade·Next Action 요약 출력
- 미존재 토픽 조용히 스킵
- CLI: `npx ts-node scripts/load-context-briefs.ts [--exclude <topicId>]`
- export: `loadContextBriefs(opts)` — programmatic 호출 가능

### 수정 파일

**`.claude/commands/open.md`** — step 3.5 추가:
```
3.5. [context_brief 자동 로드] npx ts-node scripts/load-context-briefs.ts 실행.
   - hold=null인 openTopics의 context_brief.md를 자동 로드해 Master에게 요약 브리핑
   - 파일 없는 토픽은 조용히 스킵 (오류 아님)
   - 출력이 비어있으면 "활성 context_brief 없음"으로 보고 후 진행
```

### 검증

- TypeScript 컴파일 통과 (exactOptionalPropertyTypes 대응)
- `npx ts-node scripts/load-context-briefs.ts` 실행 → "활성 토픽 없음" 정상 출력
- 현재 openTopics context_brief 미생성 → 스킵 정상 동작
