---
session: session_128
topic: topic_126
role: arki
rev: 1
date: 2026-04-28
---

## Arki 구조 진단 — growth 자기 점수 미기록

### 파이프라인 수정 도식

```
[A] 서브에이전트 # self-scores 출력  ← ★ 확정 결함 (session_127 보고서 4개 전부 0건)
[B] PostToolUse hook 추출 → turns[].selfScores  ✅ 정상 (but [A] 없으면 null)
[C'] auto-push.js → finalize-self-scores.ts → self_scores.jsonl  ✅ 존재·연결됨
[D] compute-dashboard → growth  ✅ 정상
```

### Ace [C] 진단 수정
session-end-finalize.js에 selfScores 코드 없음은 사실이나, 실제 담당은 finalize-self-scores.ts.
Ace 프레이밍의 [C] 결함 위치 오판 — 수정.

### 근본 원인
- `.claude/agents/` 비어있음 → Claude Code subagent_type이 페르소나 파일 미로드
- pre-tool-use-task.js는 session/topic layer만 inject — 페르소나 미포함
- 서브에이전트가 `# self-scores` 출력 지시 자체를 못 받음

※ Riki R-1: `.claude/agents/` 부재보다 pre-tool-use inject 경로 미존재가 직접 원인.

### 검증 사실
- session_127 reports/ 4개 파일 `# self-scores` grep: 0건
- injectionLen 226자 (session_123의 74,538자 대비) — 신규 토픽 첫 호출 시 이전 보고서 없어서 작음. 페르소나와 무관.
- finalize-self-scores.ts line 122: turns[].selfScores 읽어 기록 확인

### 대안 설계

**대안 A**: pre-tool-use-task.js에 `memory/roles/personas/role-{role}.md` inject 추가
- 장점: 구조적 해결. 서브에이전트 실제 인스트럭션 수신
- 단점: inject 크기 증가(~2~4KB/역할), TOTAL_CAP_CHARS(80KB) 여유 충분

**대안 B**: post-tool-use-task.js에서 보고서 파일 직접 파싱
- extractReportsPath → 파일 읽기 → extractSelfScores 재실행
- 단점: `_WRITE_DONE:` 마커 미사용 역할(Ace·Arki·Fin·Riki)엔 적용 불가 (Riki R-2)

**권고**: A + B 병행 (역할별 분리 — Riki R-4 중복 주의)

### 홀딩 사유
페르소나 파일 구조 재설계 논의 선행 필요.
`memory/roles/personas/` vs `.claude/agents/` 경로 결정 후 수정 범위 확정.

# self-scores
str_fnd: 0.92
self_aud: 0.88
spec_lock: 0.85
aud_rcll: 0.90
