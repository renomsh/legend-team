---
topic: 역할 재호출 측정 구조 신설
topicId: topic_048
sessionId: session_045
grade: A
date: 2026-04-20
mode: observation
status: approved
roles: [ace, nova, arki, fin, riki, ace-synthesis, arki-execution, editor]
decisions: [D-048]
resolves: [PD-011]
spawns: [PD-019]
---

# 역할 재호출 측정 구조 신설 — session_045 최종안

## 배경

- PD-011(session_034 Arki 진단 결함 4) 해소 토픽.
- 현상: `agentsCompleted`가 Set 의미로 저장됨. [compute-dashboard.ts:368](../../scripts/compute-dashboard.ts) `seen.has(role) continue`로 역할 재호출이 `roleFrequency`에서 1회로 수렴. D-019 Ace Orchestration Protocol·D-027 Size 공식이 재호출을 공식 인정함에도 계측이 따라오지 못함.
- Master 선언: Grade A, Ace 프레이밍 → Nova 우선 발언(변칙 순서).

## 결정 요약 (D-048)

| 축 | 확정안 |
|---|---|
| A — 스키마 | A2 구조화 `Turn[]`. 필드: `role, turnIdx, phase?, recallReason?, splitReason?, chars?, segments?`. 추가: `plannedSequence: string[]`, `plannedSequenceRevisions?: Diff[]`. |
| B — 재호출 정의 | opt2 (Claude Code 실시간 판정) + 4조건 프로토콜. |
| C — 기록 시점 | C1(역할 발언 직후 push) + C2(세션 종료 검증) 병행. |
| D — 집계·UI | D3 sequence 1급. `seen.has` 제거. turn 타임라인·planned/actual gap 뷰. motif는 스키마만 먼저. |

### B축 4조건 (turn 분리 판정)

1. **다른 역할 개입 후 복귀** — 기계적 자동 분리.
2. **Master 개입 후 재발언** — 객관 이벤트 자동 분리.
3. **phase 전환** — `phase_catalog.json` enum 참조, 주관 판단 허용. Nova deepening motif 보존.
4. **같은 phase 내 연속** — 병합 (1 turn, chars 누적).

조건 1·2·3 적용 시 `recallReason` 또는 `splitReason` 필드 필수 기록.

### 부대 조치

- **R-2**: `memory/shared/phase_catalog.json` 신설. 초기 enum `framing | speculative | analysis | synthesis | reframe | execution-plan | compile`. status_catalog 동형 구조.
- **R-4**: Grade B/C도 `plannedSequence` 최소 1줄 강제. L2 전환 시 gap 계산 가능케.
- **R-5**: Size 임계 유지, 본 세션 포함 이후 첫 10세션은 gradeMismatch 경보 억제.
- **R-6**: 과거 44세션 `legacy: true` 플래그. 재호출·motif·gap 집계에서 명시 배제.

### 비채택

- **R-1** (자기판정 감사 패널): R-2 해결로 자동 소멸. 과엔지니어링.
- **R-3** (plan immutable + Goodhart 방어): 이 시스템에서 Claude Code 인센티브 모델 부적합. plan diff 기록은 투명성 목적 선택적.
- Motif 자동 분석 구현: 100세션 축적 후 별도 토픽.
- 세션/토픽 아키텍처 전환: PD-019로 이연.

## 역할 호출 패턴 (본 세션 자체)

```
plannedSequence:  [ace, nova, arki, fin, riki, ace, arki, editor]
actualSequence:   ace(framing) → nova(speculative) → arki(analysis)
                → arki(reframe:B축재검토) → fin(analysis)
                → riki(analysis) → ace(synthesis)
                → arki(execution-plan) → editor(compile)
```

- Ace 재호출 2회 (종합검토 + 초기 프레이밍 대비)
- Arki 재호출 2회 (B축 재검토 + 실행계획)
- **본 세션 자체가 PD-011이 풀리지 않았을 때 측정 불가능한 패턴**의 살아있는 사례.

## 실행계획 (Arki)

### Phase 1 — 스키마·카탈로그
- `phase_catalog.json`, `turn-types.ts` 신설
- `current_session.json` / `session_index.json` 필드 확장 (legacy alias 유지)
- 게이트 G1: `validate-output.ts` enum 검증

### Phase 2 — 기록 파이프라인
- Claude Code turn push 규칙 → `CLAUDE.md` 추가
- `session-end-finalize.js` 비어있음 검증
- `validate-session-turns.ts` 신설 (reports 대조)
- `ace-framing` SKILL.md에 `plannedSequence` 선언 슬롯
- 게이트 G2: 첫 3개 신규 세션 전수 기록 확인

### Phase 3 — 집계 전환
- `compute-dashboard.ts:368` `seen.has` 제거
- `countRolesRecalled` turnLog 기반 교체
- `legacy: true` 배제 필터
- gap diff 함수 신설
- gradeMismatch 10세션 억제
- 게이트 G3: session_045 집계 검증

### Phase 4 — UI (1 primary + 1 aggregate)
구조 재설계: 패널 3개 신설 → **Timeline에 5종 정보 overlay 통합** + **Recall Summary Strip** 2뷰로 압축.

- **4.1 Primary — Session Turn Timeline** (session.html 상세 내 통합)
  - swim-lane 다이어그램. 재호출 = 같은 레인 ■ 다수
  - planned shadow(점선) + actual solid(채움) overlay → gap 즉시 인식
  - phase 배지 hue encoding (color saturation 변조)
  - recallReason/splitReason tooltip
  - motif 3연속 패턴 자동 border 그룹핑

- **4.2 Aggregate — Recall Summary Strip** (dashboard-upgrade.html 하단 56px 스트립)
  - 4구획: 재호출 총계 · 주요 재호출 역할 · 빈발 motif · 평균 gap
  - 클릭 시 해당 세션·motif 드릴다운

- **4.3 Legacy 전역 필터**: 대시보드 상단 토글 + 세션 카드 배지 (`🟨 legacy`)

- **4.4 Motif 노출 기준 재조정**:
  - 🟢 Emerging (freq ≥3): **약 15~25 세션에 도달**. placeholder 불필요
  - 🟡 Confirmed (≥3 in ≥2 distinct topic types): 30~50 세션
  - 🔵 Stable (≥10): 100세션은 여기 수준
  - → 데이터 쌓이는 즉시 점진 노출

- **비채택(회수)**: 별도 Role Recall Frequency 패널·Gap 패널·Motif Catalog 패널 — 모두 Timeline/Strip에 흡수

Vera 비주얼 스펙: [vera_rev1.md](./vera_rev1.md) · 토큰: [role_palette.json](../../memory/shared/role_palette.json)

## Ace Orchestration 기록

- **Master 개입 포인트**:
  - D3 기준 고정 선언 (축 D 선결정)
  - "연속된 대답 1회" 제안 → 이후 Nova motif 수용으로 opt2 전환
  - PD-019 (토픽 중심 전체 개편) 별도 이연 지시
  - Riki R-1·R-3 기각 유도 → Ace 재평가로 채택/기각 재정렬

- **파생 이연 (PD-019)**: 토픽 중심 아키텍처 전환 — 세션은 토픽 하위 단위로 재정의. Grade S 예상.

## 해소·파생

- ✅ PD-011 resolved
- 🆕 PD-019 spawned (토픽 중심 아키텍처)
