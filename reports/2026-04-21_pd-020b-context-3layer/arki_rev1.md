---
role: arki
session: session_059
topic: pd-020b-context-3layer
date: 2026-04-21
turns: [1, 4]
phase: structural-analysis (v1) + post-intervention recall (v2)
---

# Arki — Structural Analysis (v2 final)

## 1. 구조 분석 — Pyramid of Aggregation

| 층 | 파일 | 단위 | 패턴 | 작성 주체 | 소비자 |
|---|---|---|---|---|---|
| L1 Raw | topics/{id}/turn_log.jsonl | turn | append-only JSONL | hook | 디버깅·재생성 소스 |
| L2 Session | topics/{id}/session_contributions/session_NNN.md | session | 1세션=1파일 | hook+Editor | brief 입력 |
| L3 Topic | topics/{id}/context_brief.md | topic | overwrite | hook | /open 로드 |

**원칙:** L1 손실 없는 원본, L2 의미 압축, L3 결정·상태 요약(LLM 컨텍스트). 단방향 derivation graph — L3 손상 시 L2에서 재생성, L2 손상 시 L1+session_index에서 재구성.

## 2. 의존 그래프 (v2 — Riki 응답 후 P0 추가)

```
/close (status=closed)
  ↓
[A] session-end-tokens.js          (기존)
  ↓
[B] session-end-finalize.js        (기존)
  ↓
[P0-G0] turns[] 무결성 검증 + C1 강제화  ← Riki RK-1
  ↓
[C] turn-log-writer.js             (신규 P2, L1)
  ↓
[D] session-contribution-writer.js (신규 P3, L2 + quality 플래그)
  ↓
[E] regenerate-context-brief.js    (신규 P4, L3 + degraded 분리)
  ↓
[F] compute-dashboard.ts           (기존)
  ↓
[G] build.js                       (기존)
```

C·D·E 순차 의존 (race condition 방지).

## 3. 설계 제약 5개
1. **Idempotency** — session_NNN.md 덮어쓰기, brief 전체 재생성, turn_log는 sessionId 중복 검사
2. **Hook 실패 격리** — try/catch + process.exit(0) 패턴, gap을 current_session.gaps[] 기록
3. **context_brief 토큰 예산** — 토픽당 ~500토큰 상한, N>7 fallback (RK-3)
4. **Editor 본문 작성 시점** — /close 직전 작성, hook이 wrap (RK-2 quality 플래그로 우회 차단)
5. **topic_id 누락 방어** — sess.topicId 없으면 스킵 + gaps 기록 (session_005/006 케이스)

## 4. 실행계획 v2 (7 Phase)

| Phase | 산출 | 게이트 |
|---|---|---|
| **P0** turns[] 무결성 + C1 강제화 | validate-session-turns 검증, C1 ABORT 또는 backfill 옵션 결정 | G0: 최근 5세션 turns[] 정합성 통과 |
| **P1** 스키마 정의 + 디렉토리 부트스트랩 | docs/context-3layer-schema.md, create-topic.ts에 session_contributions/ 생성 | G1: 스키마 review + topic_062 디렉토리 확인 |
| **P2** L1 turn-log-writer.js | .claude/hooks/turn-log-writer.js | G2: topic_062/turn_log.jsonl 생성 + 라인수=turns수 |
| **P3** L2 session-contribution-writer.js | .claude/hooks/session-contribution-writer.js + quality 플래그 | G3: session_059.md 생성 + 필수 섹션 + quality 명시 |
| **P4** L3 regenerate-context-brief.js | .claude/hooks/regenerate-context-brief.js + degraded 섹션 분리 | G4: context_brief.md ~500토큰 이내 |
| **P5** 훅 체인 통합 | auto-push.js runHookChain() 갱신 | G5: /close 1회로 3파일 모두 생성 |
| **P6** /open 로더 + N>7 fallback | CLAUDE.md Session Start checklist step 3.5 | G6: 다음 /open 시 brief 자동 로드 + 활성토픽 카운트 |

**중단 조건:** G0·G2 실패 시 후속 Phase 진입 금지.
**롤백:** 각 Phase 독립 파일 추가/수정. topic_062가 첫 실증 토픽이라 데이터 손실 위험 없음.

## 5. Riki·Fin 응답 (v2 변경 사항)

- **RK-1 수용:** P0 신규 추가 (turns[] 무결성 검증 + C1 강제화). G0 통과 못하면 P2 진입 금지.
- **RK-2 수용+보강:** quality: editor-written | hook-fallback 플래그, hook-fallback 시 본문 첫 줄 ⚠️ 경고, L3 재생성 시 별도 섹션 분리, hook stderr 경고
- **RK-3 수용:** P6 /open 로더에 활성 토픽 N>7 fallback (현재 토픽만 로드, --load-all 옵션). PD-020c 완료 시 제거 예정.
- **Fin:** 동의. 추가 없음.
