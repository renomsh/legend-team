---
topic: Superpowers 플러그인 업그레이드 검토
topicId: topic_014
session: session_017
date: 2026-04-15
mode: observation
agents: [ace, arki, fin, riki, ace-synthesis]
novaInvoked: false
status: closed
---

# Superpowers 플러그인 업그레이드 검토 — 최종 보고서

## 1. 토픽 개요

**배경**: obra/superpowers v5.0.7 (14 skills, MIT, claude-plugins-official 마켓플레이스 등재) 플러그인을 레전드팀에 도입할지 검토. Master 목적: 레전드팀 워크플로우 품질 + 개발작업 품질 동시 향상. 장기적으로 레전드팀을 **핵심 자산**으로 육성.

**검토 축**: (1) 실제 업그레이드 가능성 (2) 도입 방식 (설치 vs 인용) (3) 리스크.

**모드**: Observation Mode. Nova 미호출.

---

## 2. 실검증 결과

| 항목 | 상태 |
|---|---|
| 마켓플레이스 등재 | ✅ `anthropics/claude-plugins-official` marketplace.json에 `"name": "superpowers"` 엔트리 확인 |
| 소스 위치 | github.com/obra/superpowers.git |
| 현재 설치 상태 | 미설치 (clone만 `C:\Projects\legend-team\.claude\scratch\superpowers`에 보관) |
| 레전드팀 기존 플러그인 | 없음 (첫 도입 사례) |
| 14 skills 전수 목록 확인 | 완료 |

---

## 3. 역할별 발언 요지

### Ace (1차 프레이밍)
- 결정축 3개 제시: 적합도 / 도입 방식 / 리스크
- 초기 권고: 하이브리드 C안 (소스 정독 → 검증 설치)
- **한계**: "설치 vs 미설치"에 갇혀 있었음. "통으로 보기" 프레임의 실패.

### Arki (구조 매핑)
- 14 skills × 레전드팀 매핑: 🟢 7개 / 🟡 5개 / 중립 2개
- 3개 충돌 지점(C-1 trigger 경합, C-2 test 과적용, C-3 저장 경로) → CLAUDE.md 수정으로 해소 가능
- **1차 실수**: 우선순위 규칙만 보고 트리거 메커니즘 누락. Riki 지적 후 인정·수정.

### Fin (비용·리소스)
- 14 SKILL.md 총 ~109KB, lazy-load 구조로 세션당 실증가 3~5K 토큰
- "설치 비용은 장애물 아님, 결정 축은 역할 혼란"으로 Riki에게 공 넘김
- **한계**: 벤치마크(14% 토큰 절감)가 코딩 작업 한정임을 비판 없이 인용. "Ace 학습 루프 훼손"이라는 비재무적 비용 누락.

### Riki (리스크 감사)
- 5개 리스크 제시: R-1 트리거 경합 🔴 / R-2 Ace 학습 훼손 🔴 / R-3 Riki 역할 덮어쓰기 🟡 / R-4 포크 경로 막힘 🟡 / R-5 롤백 프로토콜 부재 🔴
- **강점**: R-1·R-2·R-5는 Ace·Arki·Fin이 놓친 핵심 리스크
- **약점**: R-2 "복구 불가" 과장, R-3 description 오독, R-4 업스트림 PR 정책과 로컬 포크 권리 혼동

### Arki (Riki 재검토)
- R-1 🔴 인정 (트리거 메커니즘 놓친 점 수용)
- R-2 🟠로 하향 (상류 훼손이지 하류 파괴 아님)
- R-3 🟡 근거 수정, 구조적 교훈(텍스트 vs 액션 비대칭) 유효
- R-4 🟡 overlay 방식으로 우회 가능
- R-5 🔴 **강화** — 롤백 프로토콜은 설치 선행 조건

### Ace (종합검토 1차)
- 재프레이밍: "설치 여부"가 아니라 "전략 시스템 + 개발 시스템 정체성 분리 여부"
- 조건부 C안 권고: 세션 이원화 + 선별 차단 + 롤백 자산

### Master 개입 1 — "전략 세션에 의미 없나?"
- Ace 재점검: 14 skills 중 **전략 토픽에도 유의미한 skill 7개** 식별 (brainstorming/writing-plans/verification-before-completion/systematic-debugging/subagent-driven-development/dispatching-parallel-agents/writing-skills)
- 수정 권고: skill allow/block 리스트 (조정 A+C)

### Master 개입 2 — "brainstorming 로직 설명"
- Ace: 9단계 풀 로직 해설
- 재판정: brainstorming은 "1% 룰 무조건 선행"이 아니라 **EnterPlanMode 직전 + "만들자" 요청 시에만 강제**. trigger 범위 좁음.
- 조정 D (최소 개입) 권고

### Master 개입 3 — **결정적 전환**
> "브레인스토밍을 분해해서 새로 스킬을 만들거나 에이스가 흡수하면 될 것 같은데? 1~4까지 일치하고 5~9는 정의만 다르고 지금 역할이 다 있잖아."

- **3명 공통 찬성**. 단순 흡수가 아니라 **skill 파일 신설** 필요
- Riki: 텍스트 vs 액션 비대칭 경고 / 5번 섹션 해상도 / 9번 종료 지점 공백
- Arki: 레전드팀 `writing-skills` 메타 역량 점화 기회

### Ace (최종 종합)
**Superpowers 미설치. `ace-framing` 자작 skill로 첫 자립 시도.**

---

## 4. 최종 의사결정

### Master 결재 (2026-04-15)
1. **최종 권고 승인** — Superpowers 미설치, `ace-framing` 자작 skill 신설
2. **실행은 다음 세션으로 이연** — 이번 세션은 의사결정만, Phase 1~3 실행은 topic_015
3. **실행 계획 작성 역할 공백도 이연** — topic_015와 병행 또는 별도 토픽으로 결정

### 확정 사항
| 항목 | 결정 |
|---|---|
| Superpowers 플러그인 설치 | ❌ **미설치** |
| 의존 vs 자립 | **자립 경로 채택** |
| 첫 자작 skill | **`ace-framing`** (brainstorming 3번·7번 + Ace 페르소나) |
| Superpowers clone 위치 | `C:\Projects\legend-team\.claude\scratch\superpowers` (참고서로 유지) |
| 나머지 13 skill | `ace-framing` 시도 결과 후 해체·흡수 순차 재평가 |
| 실행 계획 작성 역할 | **topic_015로 이연** (brainstorming 9번 공백) |
| `ace-framing` Phase 1~3 실행 | **다음 세션** (topic_015 또는 별개 토픽) |

---

## 5. 레슨런 (memory 저장 대상)

### L-1. "통으로 보기" 프레임의 한계
plugin/skill 같은 복합 단위는 **부품 단위 해체 후 재조합**이 기본 분석 경로. Ace 첫 실수.

### L-2. 의존 vs 자립 축
외부 플러그인 도입 검토 시 축은 "설치 vs 미설치"가 아니라 **"의존 vs 자립"**. 핵심 자산 시스템에서는 자립 경로가 원칙.

### L-3. 텍스트 vs 액션형 비대칭
CLAUDE.md 원칙 문장은 skill 체크리스트보다 행동 강제력이 약함. 행동을 바꾸려면 **skill 파일로 만들어야** 함.

### L-4. Riki 필터 "개수 채우기 금지"
Riki가 리스크 5개를 냈지만 R-3, R-4는 근거 부실. 필터에 "개수 맞추기 금지, 확신 없는 항목은 빼라" 추가 필요.

### L-5. Fin은 비재무적 자산 가치도 본다
"돈으로 환산되지 않는 자산 가치"(Ace 학습 루프, 역할 진화 경로)도 Financial 1차 검토 대상. Riki에게 공 넘기기 전 스캔 필수.

### L-6. Ace 오케스트레이션 책임
Arki·Fin이 놓친 것(트리거 메커니즘, 벤치마크 범위)은 **Ace가 질문 설계로 보호할 수 있었던 지점**. 오케스트레이터는 역할 발언 전 "묻는 방식"을 설계해야 함.

---

## 6. 이연 항목 (topic_015 후보)

1. **`ace-framing` skill Phase 1~3 실행**
   - Phase 1: Arki가 Superpowers `writing-skills` + `anthropic-best-practices` + `testing-skills-with-subagents` 정독
   - Phase 2: Ace가 `ace-framing` skill v1 초안 (3단계 체크리스트: 맥락 점검 / 정교화 질문 / 자가 검토)
   - Phase 3: Riki adversarial pressure-test (과거 topic_013 프레이밍 재시뮬레이션)
2. **실행 계획 작성 역할 정의**
   - brainstorming 9번의 "writing-plans 호출" 공백 해소
   - 옵션: (A) Ace 권한 확대 / (B) Arki 권한 확대 / (C) 새 역할 신설
3. **나머지 13 skill 해체·흡수 순차 재평가** (`ace-framing` 성공 시)

---

## 7. 산출물

- 본 보고서: `reports/2026-04-15_superpowers-plugin-review/editor_rev1.md`
- Superpowers 참고 clone: `C:\Projects\legend-team\.claude\scratch\superpowers` (미삭제 유지)

---

**작성자**: Editor (기록자)
**승인**: Master (2026-04-15)
