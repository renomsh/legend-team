---
turnId: 4
invocationMode: subagent
session: session_192
topic: topic_165
role: arki
rev: 2
---

# Arki — Measurement Loop 5겹 구조 재진단 + 실행계획

session_192 / topic_165 / Grade S / turnIdx 4 / executionPlanMode = plan

> 재호출 사유 (Nexus): A-1 + B-1' 확정 후 5겹 단절 phase 분해 + parser 미스매치(5번) 원인 다축 검증.

## 1. 5번 단절 다축 검증 — parser 미스매치

### 1-A. 코드 축 — finalize-self-scores.ts (PD-023 P3)
- `parseYamlBlocks()` (L45-): 전사(transcript) 텍스트를 라인 스캔 → `# self-scores` 마커 다음 줄들을 `key: value`로 파싱. `[ROLE:xxx]` 마커 위 한 줄로 currentRole 식별.
- L122-125: **현재 세션 모드는 `current_session.json.turns[]` 의 `t.selfScores` 객체를 직접 read** (parseYaml 보조).
- 즉 finalize는 두 입력 경로 지원: **(α) turns[].selfScores 객체** 또는 **(β) transcript yaml-block**.

### 1-B. 호출 축 — auto-push.js
- L75: `npx ts-node scripts/finalize-self-scores.ts` (인자 무) → `readCurrent()` 경로 진입 → `current_session.json` read.
- `--transcript` 인자 미전달 → parseYaml은 빈 입력으로 동작.
- **결론:** β 경로는 자동 chain에서 활성 0. α 경로만 살아 있음.

### 1-C. 데이터 축 — current_session.json (session_192 시점 직접 확인)
- `turns[]` 존재. 그러나 grep `selfScores` 결과 0. **turn에 selfScores 객체 부재.**
- 역할 서브가 응답에 yaml-block 출력하지만 그건 채팅 응답 스트림 — current_session에 박제하는 주체는 Main inline write (현재 미구현 또는 끊김).

### 1-D. 역사 축 — session_129가 마지막
- 마지막 record `recordSource: "yaml-block"`. session_129 시점은 finalize가 transcript 경로(β)로 동작했음을 시사.
- 그 이후 어떤 결정으로 transcript 인자 끊겼는지 — auto-push.js git history 미확인이나 D-092(2026-04-25) 이후 박제 부담 폐기 정신과 정합. **H3 보강:** 의도적 폐기는 아니나 D-092 해석 시 finalize 자체를 손대지 않은 채 호출 인자만 단순화한 잔재 가능성.

### 1-E. spec 축 — 컨텍스트의 출력 계약
- 본 dispatch 컨텍스트 §"Self-Score YAML 출력 계약": ` ```\n[ROLE:xxx]\n# self-scores\nkey: value\n``` ` 포맷 규정.
- 이 포맷은 **β 경로 parseYamlBlocks와 정확히 호환**. 그러나 β 경로가 호출되지 않으므로 실효 0.

### 5번 단절 정밀 진단
**parser 자체는 살아 있다.** 끊긴 곳은:
- (1) auto-push.js가 `--transcript` 인자 미전달 → β dead
- (2) Main이 `turns[].selfScores` 객체로 박제하는 hook 부재 → α dead

둘 중 하나만 복구해도 입력 박제 chain 부활. **β 복구가 더 단순** (auto-push.js 1줄, transcript 경로 결정 필요).

---

## 2. 5겹 단절 의존 그래프

```
[Phase 1] 입력 박제 (1번 + 5번 동시 해결)
    │   auto-push.js에 --transcript 인자 또는
    │   Main inline turns[].selfScores write hook
    ▼
[Phase 2] aggregate SOT 격상 (A-1)
    │   compute-signature-metrics.ts 검증·확장
    │   ID 정규화 (registry 8 ⟂ aggregate 49 → aggregate 단일)
    │   compile-metrics-registry.ts 폐기 또는 derived view 재정의
    ▼
[Phase 3] 렌더 단절 복구 (3번)
    │   app/growth.html L354-363 fetch 경로를 aggregate로
    │   값 없는 ID hidden 정책 (Goodhart 회피, Ace §3 Keynes)
    ▼
[Phase 4] 로컬 path 복구 (4번)
    │   data/memory/growth/ build copy 산출 (build.js)
    │   또는 viewer fetch base를 memory/ 직접 read로 단순화
    ▼
[게이트 G-Final] Master 보드에서 11 역할 점수 카드 시각 확인
```

**병행 가능성:** Phase 2와 Phase 3는 schema 합의 후 병행. Phase 1은 Phase 2의 prerequisite (입력 없으면 aggregate 갱신 무의미). Phase 4는 Phase 3 완료 후 마지막 마일.

---

## 3. Phase 별 검증 게이트 + 롤백

| Phase | 게이트 | 롤백 |
|---|---|---|
| **P1 입력** | 다음 세션 종료 시 self_scores.jsonl tail timestamp이 session_192 이후 + record 1건 이상 추가 | auto-push.js 변경 revert. 박제 chain 이전 상태(53세션 0건)로 복귀 |
| **P2 aggregate SOT** | aggregate.json metric IDs ⊇ 모든 ROLE turn shortKey 정규화 결과. compile-metrics-registry.ts 호출 0건이거나 derived 재정의 명문 | aggregate 스키마 이전 commit. registry.json snapshot 보존 (stale) |
| **P3 렌더** | growth.html fetch 응답에 카드 1건 이상. 값 없는 ID는 hidden 클래스 |  L354-363 이전 fetch URL revert |
| **P4 로컬 path** | `npx ts-node scripts/build.js` 실행 후 data/memory/growth/aggregate.json 존재 + viewer 로컬 preview 카드 일치 | build copy step revert. viewer 직접 fetch로 우회 |
| **G-Final** | Master 육안 확인 (대시보드 캡처 또는 발화) | 모든 phase revert (각 commit 단위) |

---

## 4. 전제 (🔴 깨지면 plan 무효)

1. 🔴 `auto-push.js`가 SessionEnd 시 실제로 호출됨 (D-008 hook chain 명문). 미호출이면 P1 작업 전부 무효.
2. 🔴 `current_session.json.turns[]` 가 모든 역할 turn을 포함 (Turn Push Protocol C1 / D-048). 일부 turn 누락이면 self-score 박제 자체 불가.
3. 🔴 Master 보드 = `app/growth.html` (CF Pages 배포본 또는 로컬 preview). 다른 화면 기대 시 P3 변경 무효.
4. 🟡 11 역할 정책의 self-score shortKey 표가 `metrics_definitions.json` 보조 SOT로 매핑 가능 (D-158 통일 표). 누락 role 발견 시 부분 카드 허용.
5. 🟡 self_scores.jsonl 52 records 보존 (P2에서 ID 정규화 시 historical 손실 0).

## 5. 중단 조건 (Plan halt → Master 재확인)

- **C-1:** P1 게이트 통과 후에도 다음 세션에 0 records → α/β 둘 다 dead 판정. 박제 메커니즘 근본 재설계 필요.
- **C-2:** P2 진행 중 aggregate 스키마와 D-158 정책 표 사이 ID 정합률 50% 미만 → SOT 단일화 자체가 메트릭 재설계 부르므로 Jobs Step 4 OUT 1번(메트릭 ID 재설계 금지) 위반. Master 정책 재해석 요청.
- **C-3:** P3 fetch 단계에서 CORS·CF Access 권한 차단 발견 → P4 로컬 path 우선 처리로 phase 재정렬.
- **C-4:** P4 build copy 시 data/ 트리 누락이 build.js 전반 회귀 → build.js 자체 수정 토픽 분기 필요 (PD-064 분리).
- **C-5:** 작업 진행 중 D-092 본문(`metrics`) vs 빌더(`signatureMetrics`) vs aggregate(`aggregate`) 3중 명명 충돌이 코드 수정 면적을 2배 이상 키움 → 명명 통일 사전 결정 토픽으로 분리.

---

## 6. Riki R-3 (이중 SOT) 대응 — Phase 2 내 박제

P2에서 `metrics_definitions.json` 보조 SOT는 **읽기 전용** (Ace §3 명시). 작성 책임은 D-158 통일 표(role-{r}.md). 보조 JSON은 scale·weight·tier·정의 메타필드 join용. 빌더/대시보드는 보조 JSON write 금지. enforcement는 P2 commit 시 README 또는 spec 1줄 박제 + Edi anchor governance.

**Riki K1 가설(loop 미폐쇄 단독 ROI 0) 처리:** 본 plan이 P1~P4 + G-Final로 loop 전체를 닫음. PD-063 단독 닫기 아님. PD-063 scope = 본 plan 전체 완료 시점.

---

## 7. Schedule-on-Demand 준수

본 plan에 `D+N일`·`N시간`·`담당자`·`PD/MM` 미사용. Phase 1→2→3→4→G-Final 구조적 선후만. Fin 감사 통과 가능.

---

### selfScores
- str_fd: 5 / sa_rnd: 1 / aud_rcl: 0.90
