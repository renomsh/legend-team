---
topic: pd036-3session-summary-autoload
session: session_098
topicId: topic_103
role: ace
rev: 2
date: 2026-04-25
phase: synthesis
---

# Ace 종합검토 — PD-036 3세션 summary 자동 로드 시스템

## 0. 결론 선요약

Arki 5-Phase 실행계획을 **승인**합니다.  
Riki R-1·R-2 두 건은 모두 **Dev 구현 전 반영 확정**합니다.  
Fin 500자 상한은 **설계에 포함**합니다.  
D-087 박제를 권고합니다.

---

## 1. 역할 교차검토

### Arki 실행계획 검토

구조 분석 품질이 높습니다. 변경 파일 10개, 5-Phase 분해, 의존 그래프 명확.  
P1-A ∥ P1-B 병렬 구간 판단은 타당합니다.

보완점 1개: P3-B(`updateClosedInSession`)의 구현 방식이 아직 open 상태입니다. Riki R-2 결정 이후 확정됩니다 (아래 §3 참고).

### Riki 발언 검토

R-1·R-2는 실질 리스크이며 프리셋 없이 넘기면 운영 손실이 발생합니다. 채택합니다.  
R-3·R-4는 구현 세부 안전망 수준입니다. Dev가 R-3 2단계 폴백을 구현할 때 자연스럽게 반영됩니다.

### Fin 발언 검토

토큰 순증분 ~250~300 tokens, ROI 명확. 투자 타당성 이견 없습니다.  
500자 상한 권고는 설계 제약으로 확정합니다.

---

## 2. 결정 사항 (D-087 박제 권고)

**박제 내용:**

> **D-087** — PD-036 구현 핵심 설계 결정  
> 날짜: 2026-04-25 / 세션: session_098 / 토픽: topic_103

| 항목 | 결정 |
|---|---|
| R-2 처리 | `updateClosedInSession`은 hook 내부 직접 topic_index 쓰기 **금지**. `reclassify-topic.ts` 또는 신규 `set-closed-in-session.ts`를 **spawnSync 위임 패턴**으로 호출. |
| R-1 처리 | finalize hook에 **guard 로직** 삽입: `oneLineSummary` 없으면 `"[summary 없음 — {topicSlug}]"` placeholder 자동 기록. `/close` SKILL.md에 체크리스트 항목 추가 병행. |
| 500자 상한 | `recentSessionSummaries` 세션당 **500자 이하** 제약. sync-system-state.ts에서 초과 시 truncate + 경고 로그. |
| decisionsAdded 키 | 기존 `decisions` 키 유지 + `decisionsAdded` 별칭 병기. 하위 호환성 보존. |
| P1-B 위임 방식 | 신규 `set-closed-in-session.ts` 스크립트 신설. reclassify-topic.ts 오염 방지. |

D-087은 R-2 위임 패턴 + R-1 guard 두 결정을 하나로 묶어 박제합니다.  
Master 승인 없으면 보류. 승인 시 Dev 착수 가능.

---

## 3. 핵심 결정 근거

### R-2 — 왜 spawnSync 위임인가

D-028 계약은 session_index에 명시 적용이나, hook의 직접 JSON 쓰기 관행 자체가  
"조용한 실패 + 레이스 컨디션" 구조를 내재화합니다.  
위임 패턴은 두 가지를 동시에 해결합니다:
- 스크립트 단위의 직렬 실행 보장 (race 제거)
- 실패 시 exit code → hook이 gap 박제 가능 (조용한 실패 제거)

추가 비용: `set-closed-in-session.ts` 신규 파일 1개. 수용 가능합니다.

### R-1 — guard + 체크리스트 양방향

guard만 있으면 placeholder가 쌓여 summary 품질이 silently 저하됩니다.  
체크리스트만 있으면 비정상 종료 시 공백이 발생합니다.  
**둘 다** 적용하는 것이 옳습니다.

---

## 4. 실행계획 확정 (Arki 5-Phase 승인)

| Phase | 내용 | 병렬 가능 | 선행 조건 |
|---|---|---|---|
| P1-A | `append-session.ts` SessionEntry 인터페이스 + entry 구성에 `oneLineSummary`, `decisionsAdded` 추가 | P1-B와 병렬 | — |
| P1-B | `topic_index` 스키마에 `closedInSession` 필드 추가. `create-topic.ts` 기본값 null 포함 | P1-A와 병렬 | — |
| P2 | `sync-system-state.ts` 확장 — SystemState 인터페이스 + recentSessionSummaries 합성 블록 + 500자 truncate | 순차 | P1-A 완료 후 |
| P3-A | `session-end-finalize.js` `appendOrUpdateSessionIndex()` — `oneLineSummary` guard + entry 포함 | P3-B와 병렬 | P1-A 완료 후 |
| P3-B | `set-closed-in-session.ts` 신규 스크립트. finalize hook에서 spawnSync 호출 | P3-A와 병렬 | P1-B 완료 후 |
| P4 | `open.md` step 3.5 확장 — recentSessionSummaries 브리핑 지시 삽입 | 순차 | P2 완료 후 |
| P4-close | `/close` SKILL.md에 `oneLineSummary` write 체크리스트 항목 추가 | P4와 병렬 가능 | — |
| P5 | 검증 게이트 G0~G4 통과 확인 | 순차 | P1~P4 완료 후 |

검증 게이트:

- **G0** — `append-session.ts` 컴파일 통과 + `oneLineSummary` 필드 포함 dry-run 출력 확인
- **G1** — `sync-system-state.ts` 실행 후 `system_state.json`에 `recentSessionSummaries` 배열 생성 확인
- **G2** — `session-end-finalize.js` 수동 실행: `oneLineSummary` 없는 current_session → placeholder 자동 삽입 확인
- **G3** — `set-closed-in-session.ts` 실행: 대상 topicId에 `closedInSession` 기록 + `validate-schema-lifecycle.ts` 통과 확인
- **G4** — `/open` dry-run: step 3.5에서 recentSessionSummaries 3건 브리핑 출력 확인

---

## 5. Dev 지시 사항 확정

Dev는 아래 순서로 구현합니다. Grade A — 서브에이전트로 호출합니다.

**구현 순서:**

1. **P1-A ∥ P1-B 병렬 시작**
   - `scripts/append-session.ts` — SessionEntry에 `oneLineSummary?: string`, `decisionsAdded?: string[]` 추가. entry 구성 블록에 조건부 spread 적용.
   - `memory/shared/topic_index.json` 스키마 + `scripts/create-topic.ts` — `closedInSession: null` 기본값 추가.

2. **P3-B: `set-closed-in-session.ts` 신규 스크립트**
   - 인수: `--topicId <id> --sessionId <id>`
   - `topic_index.json` 해당 엔트리의 `closedInSession` 필드를 sessionId로 기록
   - 성공 시 exit code 0, 실패 시 exit code 1 + stderr 출력 (조용한 실패 금지)

3. **P3-A: `session-end-finalize.js` 수정**
   - `appendOrUpdateSessionIndex()` 내 guard 삽입: `oneLineSummary` 없으면 placeholder 자동 기록
   - `updateClosedInSession()` 함수 신설: `spawnSync('npx ts-node scripts/set-closed-in-session.ts', ['--topicId', sess.topicId, '--sessionId', sess.sessionId])`. exit code 비정상 시 `sess.gaps.push({type: 'topic-index-write-failed'})` 박제.
   - hook chain 순서: `updateClosedInSession` → `runAutoCloseDryRun` (순차 고정)

4. **P2: `sync-system-state.ts` 확장**
   - `SystemState` 인터페이스에 `recentSessionSummaries` 배열 추가
   - `recentDecisions` 블록 이후 합성 블록 삽입 (Arki 설계 코드 그대로 사용)
   - 500자 초과 `oneLineSummary`는 497자 + "…" truncate + console.warn 출력

5. **P4: `open.md` + `/close` SKILL.md 수정**
   - `open.md` step 3.5: 기존 context_brief 로드 직후, `system_state.json`의 `recentSessionSummaries` 3건을 "최근 3세션 요약" 섹션으로 출력하는 지시 추가
   - `/close` SKILL.md: 마감 전 체크리스트에 "step: `current_session.json`에 `oneLineSummary` 1줄 write 확인" 항목 추가

6. **P5: 검증 게이트 G0~G4 순서대로 통과 확인 후 완료 보고**

**R-3 대응 (구현 시 포함):**  
`sync-system-state.ts` 합성 블록에서 `closedInSession` 없는 레거시 항목은  
`session_index.entries[].topicSlug` 역방향 폴백 조회 + "(레거시 — 제목 미연결)" 표기 로직 포함.

---

## 6. 미결 사항 (Master 확인 요청)

1. **D-087 박제 승인** — 위 §2 결정 내용 그대로 진행 여부 확인 요청.  
   무응답 = 승인으로 처리하고 Dev 착수합니다.

2. `set-closed-in-session.ts` 신규 파일 생성에 대한 이견 없으시면 진행합니다.

---

*Ace 종합검토 완료. Dev 착수 대기.*
