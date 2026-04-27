---
topic: DeepTutor GitHub repository 검토
topicId: topic_011
revision: 01
date: 2026-04-11
status: completed
session: session_014
mode: observation
contributing_agents:
  - ace
  - arki
  - fin
  - riki
  - nova
nova_invoked: true
accessed_assets:
  - file: topic_index.json
    scope: all_topics
  - file: decision_ledger.json
    scope: all_topics
  - file: evidence_index.json
    scope: current_topic
  - file: glossary.json
    scope: current_topic
---

# Session_014 Report — DeepTutor GitHub Repository 검토

## Executive Summary

DeepTutor([HKUDS/DeepTutor](https://github.com/HKUDS/DeepTutor))를 레퍼런스로, 회사 내부 교육용 멀티에이전트 시스템(EduAgent) 자체 구축을 검토. 기술 난이도는 낮고, 아키텍처는 4단계 파이프라인으로 확정. 핵심 비용은 에이전트 구축이 아니라 정보 축적이며, 아키텍처가 확정되면 정보는 운용의 결과로 자연 축적된다.

## Context

- Master 판단: "어려울 건 없는데 학습시키는 비용이 들어가겠네"
- DeepTutor 오픈소스는 도입 대상이 아니라 레퍼런스 — 테스트로 패턴 학습
- 오픈소스 공개 자체가 외부 사용자 데이터로 정보 축적하는 전략
- 내부적으로도 같은 논리: 아키텍처 깔아놓으면 사용 과정에서 정보자산 축적

## Agent Contributions

### Ace — 프레이밍 + 종합검토

**프레이밍:** 3개 의사결정 축 제시 (참여 범위, 학습 비용 성격, 레전드팀 연관성). Master 지시로 B안(사업 활용 검토) 확정.

**종합 판단:**
- 에이전트는 쉽다, 아키텍처가 중요하다
- 아키텍처 확정 → 정보는 운용의 결과로 자연 축적
- 감수 비용은 초기 투자이지 구조 문제가 아님

### Arki — 구조 분석 + 아키텍처 설계

**DeepTutor 기술 구조 확인:**
- 이중 루프 아키텍처 (Analysis Loop + Solve Loop)
- 에이전트 10+개, RAG 파이프라인 3종, FastAPI + Next.js
- 레전드팀보다 축소된 모형 — 파이프라인형, 역할 간 충돌 없음

**EduAgent 아키텍처 설계:** 4단계 파이프라인 + Knowledge Store + Human Review Loop + GATE 구조.

산출물: `reports/2026-04-11_deeptutor-review/eduagent-architecture.png`

**Riki 지적 수용 — GATE 기준 보완:**
- 측정 단위: 문제 단위 정정율
- 오류 등급: Critical(정답 오류, 논리 비약) vs Minor(표현, 태깅)
- GATE 조건: Critical 정정율 < 5% 시 플랫폼 자동 등록 허용
- 과정별 독립 측정

**Nova 반론 — Solver 유지 근거:**
- Generator 풀이 = 출제자 관점, Solver 풀이 = 풀이자 관점
- 독립 풀이 없으면 Verifier가 확증 편향에 빠짐
- 프롬프트 페르소나 분리 + temperature 차이로 독립성 확보

### Fin — 비용 평가

- Knowledge Store가 실질적 자산 — 에이전트는 교체 가능하지만 축적 데이터는 대체 불가
- 자체 보유 구조(외부 서비스 락인 없음) 확인

### Riki — 리스크 점검

- GATE 기준 미정의 지적 → Arki 보완으로 해결
- 정의 없는 GATE는 장식이라는 원칙 확인

### Nova — 추측적 의견

- Solver 불필요론 제기 (4단계 → 3단계 축소)
- Arki가 구조적 반론 → Master가 Arki 의견 승인으로 기각
- Master 피드백: 의외성 부족. 페르소나 업그레이드 지시.

## Confirmed Architecture

| 단계 | Agent | 입력 | 출력 |
|------|-------|------|------|
| 1 | Analyze Agent | 교재/PDF/자료 | Knowledge Map |
| 2 | Question Agent | Knowledge Map + 출제 기준 | Question Set |
| 3 | Solution Agent | Question Set | Solution (독립 풀이) |
| 4 | Check Agent | Question Set + Solution | Verification Report |

**Knowledge Store:** Vector DB + Question History DB + Review Feedback DB

**Human Review Loop:** 검증 → 감수 → 정정 → 피드백 축적 → 프롬프트 튜닝 재투입

**GATE:** Critical 정정율 < 5% → 플랫폼 자동 등록 허용 (과정별 독립)

## Master Feedback (MF-008)

세션 종료 시 3건 역할 피드백:
1. **Arki** — 아키텍처 시각화 방법론 학습, Agent 설계가 팀 과업. 아키텍처 수정 저장.
2. **Nova** — 의외성 부족. 페르소나를 더 자유분방하고 한계 없게 업그레이드.
3. **Ace** — 전략적 방향 review와 강한 의견 추가. 다각적 관점. 스마트하고 자신감 넘치는 캐릭터.
4. **전체** — 각 역할별 스킬과 커넥터 적극 활용.

반영 완료: `agents/arki.md`, `agents/nova.md`, `agents/ace.md` 업데이트. role memory 3건 갱신.

## Next Steps

1. DeepTutor 오픈소스 테스트 (패턴 학습 + 축적 감각 확보)
2. 내부 EduAgent 아키텍처 구현 착수
3. 파일럿 과정 1개 선정 → GATE 기준 운용 검증

## Unresolved Questions

- 파일럿 과정 선정 미결
- LLM 선택 (gpt-4o-mini vs Claude vs 기타) 미결
- 감수 인력 배정 기준 미결
