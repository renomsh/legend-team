---
session_id: session_094
topic: pd023-resume-self-scores-mvp
role: riki
rev: 1
date: 2026-04-24
---

# Riki — Arki v1 오진 공격 + 기타 공격

## 핵심 공격 (Arki v1)
- Arki v1은 `session-end-finalize.js` 단일 파일만 검토하고 "pipeline drift" 단정. 근거 부족.
- auto-push.js hook chain: `session-end-tokens.js` → `session-end-finalize.js` → `compute-dashboard.ts` → `build.js`. Arki는 앞뒤 단계 실측 없음.
- 실측 요구: 기록된 10건의 출처를 확인하면 dev/editor persona에서만 나온 것 — 파서 문제 아님.
- **결론: 파이프라인은 무죄. 입력 공급선이 범인.**

## 기타 공격
1. Fin 직관 ROI 17.5× 같은 단일 수치 지양 (session_094 처음엔 제시되지 않았으나 방지 차원 박제).
2. D-073 "페르소나 archive 이동" 결정이 MVP 기록 공급선을 끊어버린 side effect 미식별 — 부분 rescind 필요 (D-075 제안 근거).
3. 자동 close 규칙과 Master 수동 /close 스킬의 산출물 차이 미검증 — PD 등록 권고 (PD-039).

## 교훈
- hook chain 실측 증거 공격 1건이 세션 전체 value를 바꿈. riki_memory에 박제.
