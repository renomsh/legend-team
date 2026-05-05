---
sessionId: session_137
topicId: topic_126
date: 2026-04-29
rolesInOrder: ["ace", "dev", "riki", "ace", "edi"]
turnsCount: 5
decisionIds: ["D-106"]
grade: A
---

## Summary

self-score 파이프라인 결함 원인 실증 및 수정 방향 확정. 근본 원인: `post-tool-use-task.js`의 `extractSelfScores(toolResponse)`가 tool_response에서 `# self-scores` 블록을 파싱하는데, 서브에이전트는 채팅 응답에 짧은 마커만 반환하고 전문은 파일에만 저장 → session_129 이후 7세션 연속 0건 적재. Option A(파일 스캔) 기각, Option B(`_common.md` 지시 강화) 채택. D-106 박제.

## Decisions

- **D-106**: self-score 파이프라인 수정 방향 — Option B 채택. `_common.md`에 2개 지시 추가: ① `# self-scores` 블록을 파일+채팅 응답 양쪽 출력 의무화, ② 블록 직전 `[ROLE:{역할명}]` 마커 출력 의무화. Option A(파일 스캔) 기각 (R-1: parseYamlBlocks frontmatter 미인식). 코드 수정 없음.

## Key Findings

- **[B] 단계가 결함**: inject([A])·스크립트([C])·대시보드([D])는 정상. tool_response → turns[].selfScores 경로만 끊김.
- **session_129 예외 이유**: inject 크기가 작을 때 서브에이전트가 full text를 직접 응답으로 반환. session_130+ inject 크기 8000-46000자로 증가 후 Write 툴 패턴 전환.
- **R-1 치명**: `parseYamlBlocks` line 62-63 코드 증거 — `[ROLE:(\w+)]` 마커만 인식, frontmatter `role:` 미인식.
- **Option B 최소 수정**: 파일 1개(`_common.md`) 수정으로 기존 파이프라인 완전 재활용 가능.

## Open Issues

- G-1: `_common.md` 실제 수정 미완료 (다음 세션 첫 번째 작업)
- G-2: `self-scores-writer.ts` appendScore 중복 방지 로직 미확인
- G-3: session_129~136 누락 7세션 자가평가 소급 여부 미결

## Next Action

Dev가 `memory/roles/policies/_common.md` Self-Score YAML 출력 계약 섹션에 2개 지시 추가 → 서브에이전트 테스트 발언 → `finalize-self-scores.ts` 재실행 검증
