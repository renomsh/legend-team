---
role: edi
session: session_229
topic: topic_191
topicSlug: close-speed-diagnosis
date: 2026-05-10
rev: 1
format: lite
turnId: null
invocationMode: subagent
---

## 작업 내용
- topic_191 재오픈 (이전 session_228에서 timing 계측 코드 추가)
- 측정값 분석: total 50.1초, `.claude/hooks/session-end-finalize.js` 14.3초, ts-node × 10회 ≈ 20초가 실제 병목
- 옵션 A 적용:
  - `scripts/auto-push.js` 상단에 `process.env.TS_NODE_TRANSPILE_ONLY = '1'` 1줄 추가
  - `.claude/hooks/session-end-finalize.js` 상단에 `process.env.TS_NODE_TRANSPILE_ONLY = '1'` 1줄 추가
- 벤치마크: `scripts/compute-dashboard.ts` 2.5s → 1.6s (-35%, 호출당 ~0.9s 절감, 11회 × 0.9s ≈ -10초 예상)
- syntax check 양쪽 OK
- 옵션 C는 PD-073으로 등록 (별도 토픽으로 진행)

## 결정 이유
- 결정 박제 없음 (Grade C, 코드 패치 단건)

## PD 변동
- PD-073 등록: 옵션 C — 4개 스크립트(`process.exit`/`argv`/`export`) 리팩터로 ts-node fork 제거, 별도 토픽에서 진행

## versionBump
- 자동 감지 시 `session-end-finalize.js` hook이 박제 — 본 보고서 생략

[ROLE:edi]
# self-scores
scc: Y
cs_cnt: 2
art_cmp: 1
