# Jobs Framing — topic_190 Phase 1

**topicType:** standalone (parent 후보 없음 — PD-068 직결)

## 1. Why
현재 30+ skill 중 실제 자동 발동되는 것은 극소수. **Master·Claude가 매 turn 수동으로 skill을 떠올려 호출**하는 비용이 누적되고 있고, 이 인지 부담이 곧 skill 미사용·정책 표류로 이어진다. 시스템이 진화할수록 skill이 늘어나는데, 호출 의존도는 인간 기억력에 묶여 있어 **시스템 확장성의 천장**이 된다.

## 2. What
**전체 skill 자동 발동 메커니즘 명세 + 일부 구현(PoC).** 산출물 3종:
- (a) skill 분류표 — 자동발동 대상/제외 + 트리거 조건
- (b) hook 아키텍처 — PreToolUse/UserPromptSubmit 강제 enforcement 레이어
- (c) 우선순위 상위 3~5개 skill 실제 hook 구현 (PoC)

## 3. 결정축

| # | 축 | 옵션 | trade-off |
|---|---|---|---|
| A | 자동화 범위 정의 ("90% 이상") | A1: skill 개수 / A2: 호출 빈도 / A3: 자동가능 100% | A1=평탄, A2=ROI 우선, A3=정직 |
| B | 트리거 매칭 엔진 위치 | B1: hook 인라인 / B2: dispatch_config 라우터 / B3: skill frontmatter | B2=SOT 단일·확장성↑ / B3=skill 자율성↑ |
| C | enforcement 강도 | C1: PreToolUse 차단 / C2: 자동 호출+override / C3: 명시 차단+우회명령 | Master C1 확정 |
| D | false positive 처리 | D1: confidence score / D2: 명시 키워드 / D3: 직전 역할 종료 신호 | D2 시작 → D1 점진 |
| E | PoC 우선순위 skill 선정 | E1: 인지부담 / E2: 미발동빈도 / E3: 구현난이도 | E1+E2 교집합 |

## 4. Scope
**IN:** 30+ skill 분류, 트리거 분류 체계, hook 아키텍처, 상위 3~5 PoC, dispatch_config 스키마 확장, D2 대응
**OUT:** skill 자체 신규작성/로직변경, 30개 전수 hook 구현, hook 성능 최적화, 일정·공수·담당, "자동발동률 측정 지표" 정교화

## 5. 핵심 전제
- 🔴 현 hook 인프라가 PreToolUse 차단 안정 지원
- 🔴 skill 호출 의도가 사전 식별 가능한 신호로 환원 가능
- 🟡 Master가 차단 false positive 1주 내 수용
- 🟡 dispatch_config가 트리거 SOT로 확장 가능

## 6. 인지편향
| 편향 | 적출 |
|---|---|
| Analogical bias (코딩 자동훅 비유) | 코딩 hook=결정론적 이벤트, skill=자연어 의도 추론. 비유 한계 |
| Availability heuristic | Master가 떠올리는 skill은 일부, 30+ 중 자동화 가능 비율 미지 |
| Automation bias | 정책 영역 false positive 비용 >>> 코딩 hook |

## 7. Focus (saying no)
- "모든 skill을 동등하게 자동화" — 자동화 가능한 것만
- "완벽한 트리거 엔진 설계 후 구현" — PoC 먼저
- "Master 무개입 완전 자동" — 차단 시 명확한 안내·우회

## 8. executionPlanMode
**`plan`** — Grade A + hook enforcement 박제 + PoC 구현 포함. Phase 분해·검증 게이트·롤백 명시 필요.

```
[ROLE:jobs] focus_sharp:5 bloat_idx:2 bias_cnt:3 no_cnt:5
```
