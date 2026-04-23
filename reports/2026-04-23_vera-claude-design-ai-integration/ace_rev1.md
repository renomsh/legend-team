---
role: ace
topic: Vera Claude Design AI 웹 호출 활용 방법
session: session_088
date: 2026-04-23
status: final
---

# Ace 종합검토 — T2 실측 완료 + D-064 박제

## 1. 세션 요지

topic_091 재개. 이전 세션(session_085)에서 T1(Vera Signature Card) 실측·합의 완료 7항목 도출 후 suspended. 본 세션에서 **T2(8-role topology) 실측 + framing 박제** 완료.

## 2. T2 실측 2회차 결과

### 2-1. Hi-fi 모드 1차 (기각)

프롬프트: "Diagram the agent topology of an 8-role team … Show role groupings (strategic / execution / output) and Master at top."

결함 3건:
- **Nova = Execution** 배치 (🔴 critical, canonical은 speculative/optional)
- "Strategic/Execution/Output" 임의 3분류 (canonical 축과 무관)
- 단일 확정 편향 — 분류축 하나로 확정, 대안 제시 없음

### 2-2. Wireframe 모드 2차 (도입 확정)

Master 지적으로 재시도. 프롬프트: 역할 본질 1줄 + canonical 발언 순서 명시 + 3~5 분류축 병렬 요구.

산출물: `design/handoffs/2026-04-23_vera-claude-design-ai-integration/source/1/project/Agent Topology.html` (5축 + compare cheat-sheet)

| 옵션 | 축 | canonical 정합도 |
|---|---|---|
| A | phase pipeline (intake→debate→synthesis→output) | ★★★★★ |
| B | authority tiers (Master/Ace/advisors/exec) | ★★★★ |
| C | concentric rings (always-on/conditional) | ★★★★ |
| D | critics vs builders (mirrored) | ★★★★ |
| E | debate loop (clock, Ace at 12 opens+closes) | ★★★★★ |
| Compare | 축별 용도 cheat-sheet + hybrid 제안 | ★★★★★ |

**결함 5종 모두 해소**: Nova 5안 전부 dashed/optional/off-loop, Vera side-call, Ace 2회 발언 명시, Edi terminal accent, Master 분리.

### 2-3. 근본 원인 판정

결함 주원인 = **모드 선택**. Wireframe system prompt ("3-5 distinctly different approaches, focus on structure and flow, low-fi") vs Hi-fi ("polished design, design_canvas starter") 차이가 단일 확정 편향을 제거.

## 3. D-064 박제 (framing 11개 결정)

| # | 축 | 결정 |
|---|---|---|
| 1 | A 경로 | handoff bundle 단독 (claude.ai/design → "Send to Claude Code") |
| 2 | B 호출 주체 | Vera (시각 spec) + Arki (토폴로지·phase flow) |
| 3 | C 통합 수준 | SKILL.md에 호출 프로토콜 내장 (실사용 누적 후 박제) |
| 4 | D 페르소나 | "spec precedes generation" 락 |
| 5 | E 메타 자산 | 레지스트리 만들지 않음 |
| 6 | F handoff 위치 | `design/handoffs/{date}_{topic}/source\|spec\|integrated/` 3단 |
| 7 | G PD-005 | 변경 없음 |
| 8 | 프롬프트 protocol | Wireframe 모드 강제 + 역할 본질 1줄 주입 + 3~5 분류축 병렬 + 단일 확정 금지 |
| 9 | 다각도 병렬 원칙 | Arki 산출물 단일 귀결 금지. 용도별 5축 병렬 유지 |
| 10 | Vera 패턴 흡수 | Claude Design 산출 시각 패턴은 주기적으로 Vera Design System에 흡수. 외부 의존도 점진 감소 |
| 11 | Figma 연결 보류 | PD-005 유지. 필요 시 후속 토픽 |

**운영 격**: 본격 박제 아닌 **"테스트 도입"**. 실사용 누적 후 재평가.

## 4. PD 신설

**PD-029**: Claude Design 실사용 3~5 토픽 누적 후 Vera/Arki SKILL.md 통합 + 프롬프트 template 파일화 + Vera Design System 패턴 흡수 리뷰
- fromSession: session_088
- fromTopic: vera-claude-design-ai-integration
- status: pending
- resolveCondition: Vera 또는 Arki의 Claude Design 호출 실사례 3건 이상 누적 + Master 리뷰 요청

## 5. Child 토픽 분기 판정

**분기 없음**. 저마찰 원칙 적용 — 테스트 도입 단계에서 SKILL.md 수정·프롬프트 template 파일화는 과투자. 실사용 2회 이상 재사용 발생 시 PD-029로 박제.

## 6. 보존 자산

- `design/handoffs/2026-04-23_vera-claude-design-ai-integration/source/` — T2 실측 2차 handoff bundle (gzip tar + 전개 파일)
  - `1/README.md` — Claude Design handoff 가이드 원본
  - `1/chats/chat1.md` — T2 2차 프롬프트·응답 전문
  - `1/project/Agent Topology.html` — 5축 시안 단일 파일

## 7. Ace 우려 (유지)

- 장기 Vera 시각 판단 근육 위축 — 완화책: 패턴 흡수 원칙 (결정 10)
- Arki 토폴로지 단일 대표안 부재 — **의도적** (결정 9). 용도별 선택이 장기 적합.

## 8. 세션 지표

- Grade: A (declared + actual)
- 모드: observation
- 역할 발언: Ace (framing·synthesis·교정) / 실측은 Master 직접 (Claude Design 웹 조작)
- 결정: D-064
- PD 신설: PD-029
- Master feedback: (본 세션 신규 없음 — 기존 규칙 적용)
