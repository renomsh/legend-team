---
session: session_128
topic: topic_126
role: riki
rev: 1
date: 2026-04-28
---

## Riki 리스크 감사 — Arki 대안 A/B

### 사전 확인
self_scores.jsonl 마지막 기록: session_101, recordSource: yaml-block.
Arki [A] 결함 방향 맞음. 구체적 인과 표현에 일부 오류 존재 (R-1).

### R-1 (중) — Arki 원인 진단 표현 오류
`.claude/agents/` 부재가 원인이 아니라 pre-tool-use inject 경로에 페르소나가 없는 것이 직접 원인.
대안 A 방향은 맞으나, `.claude/agents/` 채워넣기 작업이 혼입될 위험.
**Mitigation**: 대안 A = pre-tool-use inject 추가만으로 범위 한정.

### R-2 (높음) — 대안 B, _WRITE_DONE 마커 의존
대안 B는 `_WRITE_DONE:` 마커로 보고서 경로를 찾는데, Ace·Arki·Fin·Riki는 이 마커를 출력하지 않음.
→ 대안 B는 Edi·Dev에만 적용 가능.
**Mitigation**: 역할별 경로 분리 설계.

### R-3 (중) — 페르소나 inject 실패 silent
파일 로드 실패 시 오류 없이 넘어감 → 재발 감지 불가.
**Mitigation**: 실패 시 log() 에러 기록 추가.

### R-4 (높음) — A+B 병행 시 중복 append
동일 세션·역할·지표에 두 번 self_scores.jsonl 기록 가능.
현재 중복 제거 로직 없음.
**Mitigation**: finalize에서 단일 경로 우선 또는 recordId 기반 중복 제거.

### 요약

| # | 리스크 | 심각도 | Mitigation |
|---|---|---|---|
| R-1 | Arki 원인 표현 오류 → 불필요 작업 혼입 | 중 | 대안 A 범위 = pre-tool-use inject만 |
| R-2 | 대안 B, Ace·Arki 등 역할에 적용 불가 | 높음 | Edi·Dev로 제한 |
| R-3 | inject 실패 silent | 중 | log() 에러 기록 |
| R-4 | A+B 병행 중복 append | 높음 | 단일 경로 우선 또는 중복 제거 |

# self-scores
crit_rcll: 0.85
prod_rej: 0.80
fp_rate: 0.10
cross_rev: 0.75
