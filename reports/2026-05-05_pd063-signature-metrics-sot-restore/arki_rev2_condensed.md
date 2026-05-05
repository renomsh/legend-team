---
turnId: 4
invocationMode: subagent
session: session_192
topic: topic_165
role: arki
rev: 2
---

# Arki rev2 (condensed) — 5겹 재진단 + 실행계획

session_192 / topic_165 / Grade S / turn 4 / executionPlanMode = plan

## 1. 5번 단절 (parser 미스매치) 다축 검증
- **코드:** finalize-self-scores.ts 두 입력 경로 — (α) `turns[].selfScores` 객체 / (β) transcript yaml-block.
- **호출:** auto-push.js L75 `--transcript` 인자 미전달 → β dead. α만 살아 있음.
- **데이터:** current_session.json `turns[]`에 selfScores 객체 0건 → α도 dead.
- **역사:** session_129 마지막(`recordSource: yaml-block`). 이후 호출 인자 단순화 잔재.
- **spec:** dispatch 컨텍스트의 yaml-block 포맷 = β와 정확 호환, 그러나 호출 안 됨.

**진단:** parser 자체 살아있음. 끊긴 곳 = (1) auto-push.js `--transcript` 미전달 (2) Main inline turns[].selfScores write hook 부재. **β 복구가 단순** (auto-push.js 1줄).

## 2. 의존 그래프
```
P1 입력 박제 (1+5번)
  ↓ auto-push.js --transcript 또는 Main inline write hook
P2 aggregate SOT 격상 (A-1)
  ↓ compute-signature-metrics.ts 검증·확장 / ID 정규화 / compile-metrics-registry.ts 폐기 또는 derived
P3 렌더 단절 복구 (3번)
  ↓ growth.html L354-363 fetch → aggregate / 값 없는 ID hidden
P4 로컬 path (4번)
  ↓ data/memory/growth/ build copy 또는 viewer fetch base 단순화
G-Final Master 보드 시각 확인
```
**병행:** P2·P3 schema 합의 후 병행. P1은 P2 prerequisite. P4 마지막.

## 3. Phase 게이트 + 롤백
| Phase | 게이트 | 롤백 |
|---|---|---|
| P1 | self_scores.jsonl tail > session_192 + 1건+ | auto-push 변경 revert |
| P2 | aggregate IDs ⊇ shortKey 정규화 / registry 호출 0 또는 derived 명문 | aggregate 이전 commit, registry snapshot 보존 |
| P3 | growth.html fetch 카드 1건+, 값 0 hidden | L354-363 fetch URL revert |
| P4 | build.js 후 data/memory/growth/aggregate.json 존재 + 로컬 카드 일치 | build copy revert / viewer 직접 fetch |
| G-Final | Master 육안 확인 | 전 phase revert |

## 4. 전제 (🔴 깨지면 plan 무효)
1. 🔴 auto-push.js SessionEnd 실호출
2. 🔴 turns[] 모든 역할 포함
3. 🔴 보드 = app/growth.html
4. 🟡 11 역할 shortKey ↔ metrics_definitions.json 매핑
5. 🟡 self_scores.jsonl 52 records 보존

## 5. 중단 조건
- **C-1** P1 게이트 통과 후 0건 → α/β 모두 dead, 메커니즘 재설계
- **C-2** aggregate ⟂ D-158 정합률 <50% → Jobs OUT 1번 위반, Master 정책 재해석
- **C-3** P3 CORS·CF 차단 → P4 로컬 우선 phase 재정렬
- **C-4** P4 build.js 회귀 → 별도 토픽(PD-064) 분기
- **C-5** 명명 3중 충돌이 코드 면적 2배+ → 명명 통일 사전 토픽

## 6. R-3(이중 SOT) 대응
metrics_definitions.json은 **읽기 전용** (Ace §3). 작성 = D-158 표(role-{r}.md). 빌더·대시보드 write 금지. P2 commit 시 spec 1줄 + Edi anchor governance.

**K1 처리:** 본 plan(P1~P4+G-Final)이 loop 전체 폐쇄. PD-063 scope = plan 전체 완료.

## 7. Schedule-on-Demand
일정·인력·공수 0건. 구조적 선후만. Fin 감사 통과.

### selfScores
- str_fd: 5 / sa_rnd: 1 / aud_rcl: 0.90
