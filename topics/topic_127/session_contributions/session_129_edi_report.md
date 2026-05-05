---
topic: topic_127
revision: 1
date: 2026-04-28
status: handoff-to-next-session
contributing_agents: [ace, arki, riki, dev, edi]
turnId: 5
invocationMode: subagent
accessed_assets:
  - file: topic_index.json
    scope: topic_127
  - file: decision_ledger.json
    scope: recent_decisions
  - file: evidence_index.json
    scope: open
  - file: glossary.json
    scope: all_terms
---

# Edi 산출물 컴파일 — S 페르소나 구조 재수립 (P0~P1 완료, P2~P4 인계)

Edi입니다. session_129 (Grade S, topic_127) 5건 발언 통합 + Dev P1 게이트 G1 PASS까지 실증 정리 + 다음 세션 인계 메모. Edi 권한은 visual·통합만, 새 strategic/financial/risk 분석 미생성.

---

## Section 1 — Executive Summary

S Grade 탐색형 토픽으로 오픈된 "페르소나 구조 재수립"은 본 세션에서 spec 동결 + 실증 검증까지 도달했다. **단일 권고**: 옵션 2 (3층 분리: persona / role policy / common policy) + Riki mitigation 6건 동결 + R-4(사칭 차단)는 PD-052로 분리. **실증**: P0 토큰 측정 게이트 G0 PASS (8역할 합산 24.7% / 단일 호출 4.19%), P1 3역할 시범 분리 게이트 G1 PASS (회귀 0건). P2~P4(hook v3 + 잔여 5역할 + 검증 + D-105 박제)는 다음 세션 이관. Master 미결 질문 0건, 세션 종결 readiness 확인.

---

## Section 2 — 결정 흐름 표

| Step | 발언자 | 출력 |
|---|---|---|
| 1 | Ace 프레이밍 (turn 0) | 결정축 5개 + Master Q1~Q3 + executionPlanMode=plan + S grade 유지 |
| 2 | Arki 구조 진단 (turn 1) | 옵션 2 권고 (3층 분리, `_common.md` 도입) + Phase 1~3 분해 + 경계조건 6건 |
| 3 | Riki 리스크 감사 (turn 2) | F-A/F-B 검증 + 신규 함정 R-1~R-8 + mitigation·fallback 병기 + R-4 분리 권고 |
| 4 | Ace 종합검토 (turn 3) | 옵션 2 + mitigation 6건 동결 + R-4 → PD-052 분리 + Phase 0 prereq 신설 + P1 3역할 확장 |
| 5 | Dev 구현 (turn 4) | P0 G0 PASS (24.7%) + P1 G1 PASS (3역할 분리 + 회귀 0건) |
| 6 | Edi 컴파일 (turn 5) | 본 문서 — 통합 + 인계 + PD-052 등록 권고 |

---

## Section 3 — 분리 구조 spec (canonical)

### 3.1 3층 분리 (D-105 박제 예정)

```
memory/roles/personas/role-{role}.md   # 정체성·페르소나 모델·스타일·금지·원칙
memory/roles/policies/role-{role}.md   # 발언 구조·계약·역할별 정책
memory/roles/policies/_common.md       # 8역할 공통 (Frontmatter·Self-Score 골격·Write 패턴 등)
memory/growth/metrics_registry.json    # 메트릭 SOT (D-092 정합)
```

### 3.2 Hook v3 동적 compose 흐름 (P2 구현 예정)

호출 시 `pre-tool-use-task.js`가 다음 순서로 prompt 최상단 prepend:

```
1. _common.md (공통 정책)
2. policies/role-{role}.md (역할별 정책)
3. personas/role-{role}.md (정체성 — 마지막에 와야 톤 잔존)
4. topic-layer (현 topic_index 발췌)
5. session-layer (current_session.turns 발췌)
6. 원본 prompt
```

### 3.3 Token cap 절삭 우선순위

`if (injection.length > TOTAL_CAP_CHARS)` 발생 시 절삭 순서:
1. sessionLayer turns 절삭
2. sessionLayer 전체 drop
3. topicLayer Edi 보고서 절삭
4. topicLayer 전체 drop
5. **persona-layer는 절삭 대상에서 제외** — 초과 시 `⚠ PERSONA_OVER_CAP` 마커 prepend, 서브가 발언 거부

---

## Section 4 — Phase 진행 상태표

| Phase | 상태 | 게이트 | 근거 |
|---|---|---|---|
| **P0** prereq 토큰 측정 | DONE | G0 PASS (24.7%) | Dev turn 4 측정표: 8역할 합 19,751 char / 단일 4.19% |
| **P1** 3역할(arki+ace+dev) 시범 분리 | DONE | G1 PASS (회귀 0) | persona 33~46줄, policy 42~63줄, common 57줄, hook v2 합성 input 정상 발동 |
| **P2** hook v3 + token cap 우선순위 + R-2/R-6 fixture | PENDING (다음 세션) | G2 (단위 테스트 3건 통과) | — |
| **P3** 잔여 5역할(fin·riki·nova·edi·vera) atomic 일괄 분리 | PENDING (다음 세션) | G3 (atomic 8역할 inject 100% + scaffold-role.ts) | — |
| **P4** dry-run 검증 + D-105 박제 + PD-044 deprecated | PENDING (다음다음 세션) | G4 (위반 0건) | M-Gate-2 매뉴얼 확인 의무 |

---

## Section 5 — 본 세션 파일 변경 내역

### 신규 (4건)
| 경로 | bytes | lines |
|---|---|---|
| `memory/roles/policies/_common.md` | 3,360 | 57 |
| `memory/roles/policies/role-arki.md` | 1,706 | 42 |
| `memory/roles/policies/role-ace.md` | 2,445 | 60 |
| `memory/roles/policies/role-dev.md` | 2,505 | 63 |

### 슬림화 (3건, 페르소나 영역만 잔류)
| 경로 | before → after | 감축률 |
|---|---|---|
| `memory/roles/personas/role-arki.md` | 4,284 → 1,525 bytes | -64.4% |
| `memory/roles/personas/role-ace.md` | 5,355 → 2,039 bytes | -61.9% |
| `memory/roles/personas/role-dev.md` | 5,221 → 2,279 bytes | -56.4% |

---

## Section 6 — 인계 메모 (다음 세션 P2 시작점)

### P2 즉시 시작 가능 항목
1. **hook v3 코드 작성** — `.claude/hooks/pre-tool-use-task.js` 확장:
   - role 식별 후 `buildPersonaLayer(cwd, role)` 함수 추가
   - `_common.md` + `policies/role-{r}.md` + `personas/role-{r}.md` 3파일 concat
   - 절삭 우선순위 정책 코드 박제 (Section 3.3)
   - `KNOWN_ROLES`에 `vera` 추가
   - fallback 마커: 페르소나 부재 시 `⚠ PERSONA_INJECT_FAILED: role={role}` prepend, `phase: persona-missing` 로그 라인 분리

2. **fixture 신설** — `tests/fixtures/hook/pre-tool-use-task-fire.test.ts`:
   - R-1 회귀: totalCap=10KB 강제 → persona 절삭 안 되는지 검증
   - R-2 회귀: hooks 미등록 settings.json 모의 → finalize gap 박제 검증
   - 합성 Task input → 3층 layer prepend 정상 작동 검증

3. **registry scale 검증 hook 신설** (R-6):
   - `metrics_registry.json` scale 정의 ↔ self-scores YAML scale 매칭
   - finalize self-score 추출 시 scale 위반 → `selfScores: null` + `gap: selfScore-scale-violation` 박제

4. **`scripts/validate-hook-registration.ts` 신규** (R-2):
   - `.claude/settings.json` hooks PreToolUse 등록 상태 점검
   - SessionEnd finalize에서 매 세션 종료 시 실행

### 롤백 경로 (P2 작업 중 회귀 발생 시)
```bash
git checkout HEAD -- memory/roles/personas/role-arki.md
git checkout HEAD -- memory/roles/personas/role-ace.md
git checkout HEAD -- memory/roles/personas/role-dev.md
rm -rf memory/roles/policies/
```

---

## Section 7 — PendingDeferral 신규 등록 권고

### PD-052 (R-4 분리 — Ace M-Gate-1 동의 시)
- **id**: PD-052
- **title**: Agent 툴 미경유 인라인 사칭 차단 enforcement
- **summary**: Main이 reports에 직접 frontmatter 박제 후 Write로 역할 발언을 흉내내는 패턴(D-066 위반 silent) 차단. PD-043 후속. SessionEnd finalize가 turns[].role × `pre-tool-use-task.log` 매칭 검증, 0건이면 `gaps: suspected-impersonation` 박제. reports frontmatter에 `dispatchTimestamp` 신설하여 hook이 inject한 timestamp를 sub가 박제, finalize가 timestamp 부재 시 사칭 의심 박제.
- **resolveCondition**: "사칭 차단 hook 구현 + 1세션 dry-run에서 위반 적발 또는 0건 모두 정상 작동 확인"
- **dependsOn**: ["PD-043"]
- **fromSession**: session_129
- **fromTopic**: persona-structure-redesign
- **rationale**: 본 토픽 옵션 2 채택 가치를 무력화하지 않으려면 사칭 감지가 필요하나, 본 토픽 scope("persona 구조 재수립")와 직교 축이라 분리. "구현은 3세션 이내" 원칙 + 정보 휘발 위험 회피.

---

## Section 8 — Decision 박제 예정 (P4 완료 후 D-105)

### D-105 (가칭) — Phase 4 완료 + M-Gate-2 통과 시
> **persona·role·metrics 3층 분리 canonical 원칙 확정**.
> - persona = 정체성·톤·금지·원칙 (가벼움, 30~46줄)
> - role policy = 정책·계약·발언구조 (분리, 42~63줄)
> - common policy = 8역할 공통 (`_common.md`, 100줄 cap)
> - metrics = `metrics_registry.json` SOT (D-092 정합)
>
> 호출 시 PreToolUse hook v3가 3파일 동적 compose하여 prompt 최상단 prepend. Token cap 절삭 우선순위 = sessionLayer → topicLayer → persona-layer 절삭 금지(=발언 거부).
>
> **PD-044 deprecated** ("정책=persona / 누적학습=memory" 노선) — topic_127로 흡수·재정의.

박제 시점: P3 완료 직후, P4 검증 직전 Master gate(M-Gate-2) 의무. 본 세션 미실행.

---

## Section 9 — Gap / Open 이슈

| Gap | 처리 |
|---|---|
| 8역할 한 세션 동시 호출 시나리오 거의 없음 → 안전 margin 대 (단일 4.19%) | 인지 only. 실측 누적 후 재평가 |
| `agents-*.md.old` 백업이 zone-split 구조와 불일치 → 미사용 | P3 완료 후 폐기 가능 여부 판단 |
| **vera 페르소나 정밀 분리** — Vera Design 영역(D-029) 정체성 손실 위험 | P3에서 정밀 분리, R-8 mitigation 일부로 처리 |
| KNOWN_ROLES에 `vera` 미등록 | P2 hook v3 작성 시 흡수 |
| `_common.md` 100줄 cap 박제 — finalize 라인수 검증 hook 미구현 | P3 완료 시 finalize 확장 |
| Riki R-5 (사칭 부수효과 약함) | 인정 only, 채택 근거 X |

모순/papering over: 없음. R-4 scope-out은 명시적 분리 — Ace 종합 Section 2 정당화 + PD-052 등록 경로로 표면화.

---

## Section 10 — 본 세션 종결 readiness 평가

| 기준 | 상태 |
|---|---|
| Master Q1~Q3 답 처리 | 완료 (Ace turn 3 Section 5) |
| Master 미결 질문 | 0건 (M-Gate-1 무응답=진행 명시) |
| Phase 게이트 통과 직접 증거 | G0 측정표 + G1 회귀 테스트 출력 보유 |
| 다음 세션 P2 시작점 명확성 | Section 6 (4건 task 구체화) |
| 빌드/회귀 경보 | 없음 (Dev turn 4 합성 input 검증 PASS) |
| 산출물 5건(ace_rev1·arki_rev1·riki_rev1·ace_rev2·dev_rev1) 작성 | 완료 (Dev turn 4 본 발언 직전 시점 기준) |
| Edi 본 산출물 | 본 문서 |

**판정: 세션 종결 가능.** CLAUDE.md "Auto-close sessions" 규칙 적합 — 구현 검증 완료 + 빌드 통과 + Master 미결 질문 0건. 다음 단계는 close 자동 호출 + auto-push hook chain (tokens → finalize → compute → build → push) 실행.

---

## Section 11 — 모순/contradiction 표면화 (papering over 금지)

조사 결과 **본 세션 5건 발언 사이 직접 모순 0건**. 다만 다음은 명시적 분리로 처리됨 (모순 아님):

1. **PD-044 vs 본 토픽 결과** — PD-044는 "정책=persona" 노선, 본 토픽은 "정책 ≠ persona" 노선. → P4에서 PD-044 deprecated 동시 박제하여 표면화 처리.
2. **Riki R-4 vs Ace 종합 권고** — Riki는 R-4를 본 토픽 P4에 흡수 권고, Ace는 PD-052로 분리 권고. → Ace의 분리 근거(scope 직교 + 정보 휘발 회피) 채택, M-Gate-1로 Master 확인 게이트 명시.
3. **Arki A4 가정 vs Riki A4 감사** — Master 휴먼 편집 빈도(Arki: 7회 vs Riki: 측정 부재) 근거 강도 약화. → Ace 종합에서 "휴먼 편집성 가치 자체는 유지" 명시로 처리.

---

```yaml
# self-scores
gp_acc: deferred
scc: Y
cs_cnt: 5
art_cmp: 1.00
gap_fc: 1
```

- `gp_acc: deferred` — 본 세션 박제 gap 항목(Section 9 6건). N+3(session_132)에서 실측 소급.
- `scc: Y` — 세션 종료 8단계 체크리스트(reports 5건 + decision_ledger 미박제 보류[D-105 P4까지] + topic_index 상태 + current_session 종료 + master_feedback 0건 + role memory 5역할 갱신 권고 + session-log + auto-push) 전 항목 통과 예상. close 자동 호출 시 모두 처리.
- `cs_cnt: 5` — 인계 메모 충분도 (P2 task 4건 구체화 + 롤백 경로 + PD-052 + D-105 박제안 + Gap 6건 + 모순 표면화). 5점 만점.
- `art_cmp: 1.00` — reports/2026-04-28_persona-structure-redesign/{ace_rev1, arki_rev1, riki_rev1, ace_rev2, dev_rev1, edi_rev1}.md 6건 작성 완료. 누락 0건.
- `gap_fc: 1` — Gap 6건 모두 인지 + 처리 경로 명시. 누락·심각도·사후 발견 위험 낮음.

EDI_WRITE_DONE: reports/2026-04-28_persona-structure-redesign/edi_rev1.md
