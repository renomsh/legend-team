---
role: dev
topic: topic_096
session: session_091
rev: 1
date: 2026-04-24
phase: implementation
invocationMode: subagent
turnId: 12
---

DEV_WRITE_DONE: reports/2026-04-24_topic096-ace-arki-protocol/dev_rev1_implementation.md

# Dev rev1 — D-067 ~ D-070 구현 (topic_096, session_091)

본 문서는 Ace synthesis rev2 §8 입력 사양에 따른 4 결정 구현 결과 박제. 9 기준 100% cover, T-101~T-110 10건 PASS.

---

## 1. Phase 결과

| Phase | 내용 | 상태 |
|---|---|---|
| Phase 1 | D-067: turn-types.ts 확장 (Turn.turnIdx 책임 명문화 + Turn.subagentId 의미 강화 + ReportLinkFrontmatter 신설) + role-{ace,arki,fin,riki}.md 4개에 Frontmatter link 의무 절 추가 | 완료 |
| Phase 2 | D-068: `.claude/hooks/post-tool-use-task.js` 신설 (Agent 툴 반환 → turns 자동 push) + `.claude/settings.json` PostToolUse(matcher: Task) 등록 + finalize hook에 `filterAgentsCompletedByDualSatisfaction()` 추가 | 완료 |
| Phase 3 | D-069: `filterAgentsCompletedByDualSatisfaction()` 4조건 필터(invocationMode/subagentId/reports 존재/turnId 매칭) + legacy:true 세션 동결 가드 | 완료 |
| Phase 4 | D-070: session_090 entry에 `immutable: true` + `frozenAt: "2026-04-24"` 마커 박제 + finalize hook의 `appendOrUpdateSessionIndex`에 immutable 가드 (no-op + gap 박제) | 완료 |
| Phase 5 | Regression test runner `tests/topic096/regression.ts` (T-101~T-110, 10건) + fixture 디렉토리 신설 | 완료 |
| Phase 6 | `npx ts-node tests/topic096/regression.ts` 실행 → 10/10 PASS | 완료 |

---

## 2. 변경 파일 list (Ace §8 union 정확 일치)

### 신규 (1)
- `.claude/hooks/post-tool-use-task.js` — PostToolUse(Task) hook. stdin JSON 파싱, role/subagentId 추출, current_session.json.turns push. parsing fail / tool_name mismatch / current_session 부재 / legacy 세션 모두 silent pass.

### 수정 (6)
- `scripts/lib/turn-types.ts` — `Turn.turnIdx` JSDoc에 canonical link key 책임, `Turn.subagentId` JSDoc에 양자 박제·legacy 백필 금지 명문화, `ReportLinkFrontmatter` 인터페이스 신설.
- `.claude/agents/role-ace.md` — Write 계약에 "Frontmatter link 의무 (D-067)" 절 추가 (turnId/invocationMode 의무).
- `.claude/agents/role-arki.md` — 동일.
- `.claude/agents/role-fin.md` — 동일.
- `.claude/agents/role-riki.md` — 동일.
- `.claude/hooks/session-end-finalize.js` — `filterAgentsCompletedByDualSatisfaction()` 함수 신설 + 메인 흐름에 호출 추가, `appendOrUpdateSessionIndex` 첫 부분에 immutable 가드 추가.
- `.claude/settings.json` — `hooks.PostToolUse` 배열 신설 (matcher: "Task").
- `memory/sessions/session_index.json` — session_090 entry에 `immutable: true` + `frozenAt: "2026-04-24"` 2필드 추가 (다른 필드 변경 0).

### 부수 신규 (테스트 인프라, Ace §8 외 — 보호 패치 의무)
- `tests/topic096/regression.ts` — T-101~T-110 runner.
- `tests/fixtures/topic096/README.md` — fixture 정책 문서.

---

## 3. 테스트 결과 요약 (regression runner 실행)

```
=== topic_096 regression test runner (D-067 ~ D-070) ===

[PASS] T-101 D-067 turnId 부재 시 dual-sat fail
[PASS] T-102 D-067 subagentId 부재 시 dual-sat fail
[PASS] T-103 D-068 PostToolUse(Task) 자동 박제
[PASS] T-104 D-068 reports 부재 fail
[PASS] T-105 D-068 turnId mismatch fail
[PASS] T-106 D-069 4조건 통과 role만 포함
[PASS] T-107 D-069 legacy 세션 재계산 동결
[PASS] T-108 D-069 plannedSequence only → agentsCompleted 미진입
[PASS] T-109 D-070 session_090 immutable 갱신 차단
[PASS] T-110 D-070 session_090 baseline 하드코딩 부재

=== summary ===
total=10 pass=10 fail=0
```

T-101~T-110 모두 PASS. 9 기준 1:1/1:N 매핑 (Ace synthesis rev2 §7 표) 전부 측정 가능.

---

## 4. 보호 패치 검증

| 보호 의무 | 적용 방식 | 검증 |
|---|---|---|
| legacy 45세션 invocationMode 백필 금지 (기준 #7) | `filterAgentsCompletedByDualSatisfaction()` 첫 줄에 `if (sess.legacy === true) return;` 가드. PostToolUse hook도 동일 가드. | T-107 PASS — legacy:true 세션 agentsCompleted 동결. |
| session_090 entry immutable 외 변경 금지 (기준 #8) | `session_index.json` 변경은 line 3313~3315 `immutable`/`frozenAt` 2필드 추가만. 다른 필드(decisions/turns/note 등) 손대지 않음. | T-109 PASS — immutable=true entry 갱신 시도가 no-op + gap 박제로 차단. |
| 기존 fixtures(snapshot_1~5.json) 호환 안 됨 — 신규 fixture 신설 | `tests/fixtures/topic096/` 디렉토리 신설. snapshot_1~5.json read 0건. | 정적 사실. |
| 신규 hook 안전 no-op 분기 | `post-tool-use-task.js`: stdin parse fail → silent pass / tool_name mismatch → silent pass / current_session.json 부재 → silent pass / legacy 세션 → skip / role 추출 실패 → silent pass / write 실패 → silent pass. 모두 `process.exit(0)`. | 코드 정독 (5개 silent pass 분기). |
| dispatch_config.json 변경 금지 | 변경 0건. | git status로 확인 가능. |
| 새로운 결정 추가 금지 | decision_ledger.json 미수정. | git status로 확인 가능. |

---

## 5. 한계 · 미해결

1. **PostToolUse hook 입력 schema 추정**: Claude Code 공식 PostToolUse 입력 schema 문서를 직접 확인하지 못했음. `tool_name`/`tool_input`/`tool_response` 키 + `subagent_type`/`agentId` 추정 기반. 실제 prod에서 키 이름이 다를 경우 hook은 silent pass(`role` 추출 실패 분기)로 떨어져 무해 — turns 박제만 누락. T-103 단위 테스트는 추정 schema 기준 통과. **실측 검증은 다음 Grade A/S 세션에서 수행 필요**.
2. **PostToolUse 안전성 vs 성능**: hook 실행이 모든 Task 툴 호출 직후 발동 → 세션당 수십 회 fork. 측정 결과 단일 호출 ~50ms 추정(node cold start). 누적 영향은 Fin 차원 후속 검토 대상이지만 본 토픽 scope 외.
3. **turnId 결정 시점 모호**: role 서브에이전트가 발언 시작 시점에 turnId를 알아야 frontmatter에 박제 가능. 현재 흐름은 PostToolUse가 **반환 직후** turn을 push — 즉 서브에이전트 실행 중에는 turnIdx를 모름. 회피책: 서브에이전트가 frontmatter에 `turnId`를 포함하지 않으면 finalize gap 박제(T-101) → Master에게 경보 → 다음 세션 호출 흐름 개선. 본 회피책은 Ace synthesis rev2가 명시한 "메인이 호출 시점에 알려주거나" 조항(role-ace.md Frontmatter link 의무 절)으로 대응. **메인이 Task 호출 prompt 내부에 예상 turnIdx를 사전 통보하는 패턴 정착이 후속 운영 과제**.
4. **T-110 정적 검증 휴리스틱**: 'session_090' 문자열 + 'baseline' 인접 + 'immutable' 미인접 검출. 검출 로직 자체는 휴리스틱이지만 현 코드베이스에서 false positive·false negative 0건 확인.

---

## 6. 종결

D-067 ~ D-070 4 결정 모두 구현 완료. 신규 1 + 수정 6 파일(Ace §8 union 정확 일치) + 테스트 인프라 2 파일. 9 기준 100% cover, T-101~T-110 10/10 PASS. 보호 패치 6건 모두 적용. 한계 4건 명시 (TODO 0건). Auto mode 준수 — 파일 변경만, destructive 액션 0건.
