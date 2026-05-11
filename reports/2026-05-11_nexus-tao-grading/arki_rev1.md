---
role: arki
sessionId: session_235
turnIdx: 0
topicId: topic_200
date: 2026-05-11
invocationMode: subagent
---

# ARKI — Nexus T/A/O 등급 시스템 구조 분석 rev1

ARKI_WRITE_DONE: reports/2026-05-11_nexus-tao-grading/arki_rev1.md

Master, Arki입니다. 구조(Structure)·흐름(System)·의존성 3섹션으로 보고합니다. 단언마다 `[Tn / An / On]` 태그 부착 — 본 시범 운영 자체에 적용.

---

## 1. 구조 (Structure·Porter)

### 1.1 자산별 좌표 정합/충돌 매핑

| 자산 | 파일 경로 | 현 SOT 역할 | T/A/O 좌표 정합 | 충돌·중복 지점 |
|---|---|---|---|---|
| decision_ledger | `memory/shared/decision_ledger.json` | D-NNN 박제 SOT (D-178 흡수 정책) | **A4 자연 도달점** — `status: "active"` 항목은 정의상 A4 [T3 / A4 / O5] | T 등급 필드 부재 — 모든 active 결정이 동일 A4로 평탄화됨 |
| evidence_index | `memory/shared/evidence_index.json` | E-NNN, `status` enum 보유 (`open`/`resolved-{context}`/`accepted-residual-risk`) | **T 등급 검증 트랙과 동질** — `status=resolved-D-NNN`은 T4→T5 승급 흔적 [T3 / A4 / O5] | T/A/O와 별개의 status 축 — 의미 중복 가능 |
| master_feedback_log | `memory/master/master_feedback_log.json` (※경로 정정: shared 아님) | MF-NNN, Master 발언 SOT | **O2 단일 출처** — `feedback` 필드 = Master 직접 발화 [T4 / A3 / O2] | 인용 시 MF-ID로 O2 추적 가능 — 새 인프라 불요 |
| current_session.turns | `memory/sessions/current_session.json.turns[]` | 세션 발언 박제 (D-048) | **O3 단일 출처** — `turnIdx`로 globally unique 식별 (turn-types.ts §findTurnById) [T3 / A2 / O3] | turn 스키마(`scripts/lib/turn-types.ts:38-48`) 현재 `source` 필드만 보유 — T/A/O 미수용 |
| pending_deferrals | `memory/shared/pending_deferrals.json` | PD-NNN, `status` enum + `resolveCondition` | **A2 영역** — 미결정 보류 = "지속 지시는 있으나 박제 미완" [T2-3 / A2 / O3-5] | 일부 PD가 D-NNN으로 승격되며 A4 진입 — 흐름 정합 |

[T3 / A3 / O5] decision_ledger·current_session 실제 파일 Read 확인.

### 1.2 충돌·중복 핵심 3건

**충돌-1**: evidence_index의 `status`와 T 등급이 의미 중첩.
- `E-001.status="resolved-in-v0.2.0"` = 사실상 T5 (독립 검증·재현) [T4 / A2 / O5]
- T 등급을 별도 필드로 추가하면 dual-write 발생. **Mitigation**: T 등급은 evidence와 별개로 *발언* 단위에만 박제, evidence는 기존 status 유지. **Fallback**: 두 축 간 매핑표(memory/shared/tao_evidence_map.json) 사후 구축.

**충돌-2**: A2/A3/A4 경계 자동 판정 불가.
- A3 "Master 규칙/정책/유지 명시"는 자연어 신호 — 코드 자동 분류 곤란 [T2 / A1 / O1]
- D-180 (Nexus 실행 전 질문 원칙) = A3+, decision_ledger 박제 시 A4. 하지만 "유지" 단어가 없는 결정도 A3+ 다수. **Mitigation**: A 등급은 *발화 역할이 직접 자가 부착*, hook은 검증만(상향 차단). **Fallback**: 분쟁 시 Master 단일 조정.

**충돌-3**: 박제 승급 조건 "T3+A2" — `decision_ledger.json` 박제 트리거와 D-178/D-179 흡수 정책 충돌 위험.
- 현 정책(D-178): MEMORY 피드백은 role policies 또는 decision_ledger 흡수 시 archive [T3 / A4 / O5]
- 새 트리거 "T3+A2 이상" → A2(반복 지시) 단계에서 박제 시 D-178 흐름(흡수 시점 박제)과 시점 어긋남. **Mitigation**: "T3+A2"는 *박제 자격* 임계이지 *자동 박제 트리거*가 아님으로 정의. Edi anchor governance(D-125)가 박제 실행 단일 책임 유지. **Fallback**: Master 명시 박제 명령으로 우회.

---

## 2. 흐름 (System·Keynes)

### 2.1 태그 라이프사이클 (3-Stage)

```
[발언 생성]              [세션 박제]              [영구 박제]
  ↓                         ↓                        ↓
역할 자가 부착            hook 검증·기록            Edi anchor governance
[T1-2 / A0-1 / O1-3]   → [T2-3 / A1-2 / O3-5] →  [T3-4 / A3-4 / O5]
```

[T3 / A2 / O3] nexus-turn-push.ts §extractSelfScoresFromContent (line 64-92) — 이미 발언 본문에서 self-scores YAML 파싱 인프라 존재.

### 2.2 게이트별 위치·책임

| 게이트 | 위치 | 트리거 조건 | 현 구현 재사용 가능 여부 |
|---|---|---|---|
| G1: 태그 생성 | 역할 발언 본문 (모든 단언 끝 `[Tn / An / On]`) | 발언 시점 자가 부착 | **신규** — self-scores YAML 블록 옆에 `# tao-tags` 블록 추가 가능 [T2 / A1 / O3] |
| G2: T 상향 검증 | `post-tool-use-task.js` (frontmatter 검사 기존) | T3↑ 단언은 `relatedFiles` 또는 line 인용 필수 / T4↑은 실행결과 인용 필수 / T5는 독립 재현 로그 ID 필수 | `post-tool-use-task.js:258-280` frontmatter patch 로직 옆 신규 함수 [T3 / A2 / O5] |
| G3: A 상향 검증 | `session-end-finalize.js` | A3↑ 단언은 MF-NNN 인용 필수 / A4는 D-NNN·PD-NNN 인용 필수 | `session-end-finalize.js:428-498` frontmatter cross-check 로직 패턴 답습 [T3 / A2 / O5] |
| G4: O 자동 추적 | hook 자동 부착 | sessionId + turnIdx + 파일 path 자동 (역할 수동 부착 X) | nexus-turn-push.ts §pushTurnsFromPending이 이미 `agentId`·`turnIdx`·`source` 박제 — O5 자동 부착 가능 [T4 / A2 / O5] |
| G5: 박제 승급 | Edi (D-125 anchor governance) | T3+A2 임계 통과 → D-NNN 후보 박제 → Edi 확정 | 신규 후보 큐 필요 (`memory/shared/tao_pending_anchor.json`) [T2 / A1 / O1] |

### 2.3 A4 박제 위치·필드

A4 = 파일 박제. 후보 파일은 이미 존재 — 신규 파일 불요:

- 결정성 단언 → `decision_ledger.json[].decisionAuthorityTag: "A4"` 신규 필드 (선택 — 모든 active = A4 자명 시 생략 가능) [T2 / A1 / O1]
- 발견·증거 → `evidence_index.json[].truthTag: "T4"` 신규 필드 (status와 병행, 의미 분리 — finding 자체의 검증도 vs 결과 처리 상태) [T2 / A1 / O1]
- 운영 룰셋 → `dispatch_config.json` (정책 SOT, A4 자연 도달) [T3 / A4 / O5]
- 세션 발언 → `current_session.turns[].tao: {t,a,o}` (O3 박제만, A4 아님 — 세션은 O3 영구 위치) [T2 / A1 / O1]

### 2.4 승급 경로 (A0→A1→A2→A3→A4)

```
A0 (임시)        → 자동 폐기 (세션 종료 시 turn에는 남으나 anchor 불가)
A1 (1회 지시)    → MF-NNN 박제 시 A2 후보
A2 (반복·명시)   → 2회+ MF 또는 D-NNN 인용 시 A3 후보  ← 박제 자격 임계
A3 (Master 정책) → "규칙/정책/유지" 키워드 + Master 명시 시 A4 후보
A4 (파일 박제)   → Edi anchor governance 통과 (D-125 정합)
```

[T2 / A1 / O3] 자동 키워드 매칭은 신호일 뿐, 최종 승급은 Edi 판단.

---

## 3. 의존성·구현 영향 범위

### 3.1 Hook 영향 (3건)

| Hook | 영향 | 변경 종류 |
|---|---|---|
| `.claude/hooks/post-tool-use-task.js` | T 등급 검증 (line 인용 부재 시 gap 박제) + tao 필드 frontmatter 패치 | **확장** — line 258-280 패턴 답습 [T3 / A2 / O5] |
| `.claude/hooks/session-end-finalize.js` | A 등급 검증 (MF·D 인용 부재 시 gap) + tao 통계 집계 | **확장** — line 428-498 cross-check 패턴 답습 [T3 / A2 / O5] |
| `.claude/hooks/pre-tool-use-task.js` | dispatch 시 컨텍스트에 T/A/O schema 인젝트 (현재 self-scores YAML 인젝트와 동일 위치) | **확장** [T3 / A2 / O5] |

`pre-tool-use-task-sage-gate.js`는 same-session 격리 책임 — T/A/O와 무관, 영향 0 [T3 / A2 / O5].

### 3.2 Skill·페르소나 영향

- 모든 역할 페르소나 정의 파일 (`memory/roles/policies/role-{r}.md` 또는 `.claude/agents/{r}.md`)에 "T/A/O 자가 부착 의무" 1문단 추가 — Ace·Jobs·Arki·Riki·Fin·Edi·Zero·Sage·Dev 9건 [T2 / A1 / O3]
- Edi 정책 (D-125·D-143)에 "A4 박제 시 T/A/O 검증" 추가 — `memory/shared/dispatch_config.json.rules.edi`에 `tao_gate: true` 신규 플래그 [T2 / A1 / O3]

### 3.3 Schema 영향

- `scripts/lib/turn-types.ts.Turn` 인터페이스 (line 38-48): **선택 필드 추가** `tao?: { t: 1|2|3|4|5, a: 0|1|2|3|4, o: 1|2|3|4|5 }` — optional 유지로 legacy 호환 [T4 / A2 / O5]
- `decision_ledger.json` schema: 신규 선택 필드 `truthOnAtBirth?: Tn` (박제 시점 T 등급 — 사후 승급 추적용) [T2 / A1 / O1]
- `evidence_index.json` schema: 신규 선택 필드 `truthLevel?: Tn` (기존 status와 직교) [T2 / A1 / O1]

### 3.4 마이그레이션 정책

**소급 적용 vs 신규 한정 — 신규 한정 권고.**

근거: D-067 "레거시 소급은 실질 가치 증명 후에만" [T4 / A4 / O5]. 과거 turns·decisions에 소급 T/A/O 부착은 (a) 자가 추정 = T1 평탄화, (b) 인지 비용 大, (c) 시범 운영 목적과 무관.

- 적용 시점: 본 세션(session_235)부터 신규 발언·신규 D-NNN·신규 PD-NNN
- 과거 자산: `tao`/`truthLevel` 필드 부재 = "legacy-untagged" 의미 (별도 마이그레이션 0건)
- 시범 운영 종료 후 박제 결정 시 D-067 정신 따라 "소급 가치 증명" 별도 토픽 필요

[T3 / A4 / O5] D-067 인용 — decision_ledger 참조.

### 3.5 리스크 + Mitigation/Fallback

| 리스크 | Mitigation | Fallback |
|---|---|---|
| 모든 단언 태그 부착 = 인지 부담 폭증, 발언 길이 1.5~2배 | 단언 단위가 아닌 *섹션 헤딩* 단위 부착 옵션 (Master 결정 필요) | 핵심 단언(결정·인용·수치)만 부착, 서술 산문은 면제 |
| 자가 부착 = 인플레이션 (모두 T3+A2 자가 선언) | hook G2/G3 검증 (인용 부재 시 자동 강등 또는 gap 박제) | Master 샘플 감사 |
| Sage·Edi 자기참조 (자기 발언에 T 등급 자가 부착) 정직성 훼손 | T4↑은 *외부 인용*만 허용 — 자기 분석은 T3 상한 | Riki cross-review로 T 등급 도전 권한 |
| 박제 트리거 자동화 = D-178 흡수 정책과 시점 충돌 | "T3+A2 이상"은 자격 임계, *자동 박제 아님*. Edi가 단일 박제자 (D-125) | Master 명시 박제 명령 |

---

## 자기감사 (1차)

- **structuration**: 자산 5종 + 게이트 5종 + hook 3종 분리 명확. T/A 검증 hook 분리(G2 post-tool-use / G3 session-end)는 발화 시점·세션 종료 시점 비대칭 정당. ROI MUST_NOW.
- **hardcoding**: T/A/O enum 값을 hook 코드에 박지 말 것 — `dispatch_config.json` 또는 `tao_schema.json` 외부 SOT 필수. ROI MUST_NOW.
- **efficiency**: nexus-turn-push.ts §extractSelfScoresFromContent (line 64-92) 패턴 재사용 — `extractTaoTagsFromContent` 신규 함수가 자연. 중복 파서 작성 회피. ROI MUST_BY_N=10.
- **extensibility**: T1-5 / A0-4 / O1-5 enum은 단계 추가 시 enum 확장 (예: T6 "외부 학술 검증"). hook 검증은 enum 비교만 — drift 위험 낮음. No issue at this dimension에 가까움.

---

## Master 결정 필요 사항 (3건)

**Q1. 태그 부착 단위**
- (a) 모든 단언 — 인지 부담 大, 정밀
- (b) 섹션 헤딩 단위 — 부담 中, 정합
- (c) 핵심 단언만(결정·인용·수치) — 부담 小, 누락 위험
- Arki 권고: **(c) 시범 운영 시작 → 누락 발견 패턴 누적 후 (b) 또는 (a)로 상향**

**Q2. tao 필드를 turn 스키마에 박을지**
- (a) `Turn.tao` 필드 추가 (소급 0건, 신규만 박제, O3 영구 위치)
- (b) 발언 본문 inline `[Tn/An/On]`만 — 스키마 변경 0
- Arki 권고: **(a) — 집계·승급 자동화에 schema 박제 필수. legacy는 optional이라 호환 영향 0**

**Q3. evidence_index의 기존 status vs 신규 truthLevel 관계**
- (a) 직교 (별도 축) — 명확성 大, 필드 중복 우려 中
- (b) 통합 (truthLevel이 status를 흡수) — 마이그레이션 부담 大
- Arki 권고: **(a) 직교 — D-067 소급 회피 정합. 사후 매핑은 별도 토픽**

---

[ROLE:arki]
# self-scores
aud_rcl: 0.80
str_fd: 3
spc_lck: N
sa_rnd: 1
