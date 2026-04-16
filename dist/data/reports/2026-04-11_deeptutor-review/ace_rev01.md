---
topic: DeepTutor GitHub repository 검토
topicId: topic_011
revision: 01
date: 2026-04-11
role: ace
status: completed
session: session_014
accessed_assets:
  - file: topic_index.json
    scope: all_topics
  - file: decision_ledger.json
    scope: all_topics
---

# Ace — 프레이밍 + 종합검토

## 프레이밍

DeepTutor(HKUDS/DeepTutor) 오픈소스를 레퍼런스로, 회사 내부 교육용 멀티에이전트 시스템(EduAgent) 자체 구축 검토.

### 의사결정 축 (Master 확정: B안)
- 참여 범위: 사업 활용 검토 포함
- 비용 성격: 에이전트 API 비용 + 초기 인력 감수 비용
- 레전드팀 연관성: 축소된 모형, 더 단순

## 종합검토

### Master 피드백 반영 정정
1차 프레이밍: DeepTutor 도입 검토 → Master 정정: 오픈소스는 레퍼런스만, 내부 자체 구축
2차 정정: 파일럿 %가 아니라 아키텍처가 중요. 오픈소스 공개 자체가 정보 축적 전략.

### 최종 판단
- 기술 난이도: 낮음 (Master 확인)
- 아키텍처 확정이 선행, 정보는 운용의 결과로 자연 축적
- 에이전트는 쉽다, 아키텍처가 중요하다, 정보가 비싸다
- 4단계 파이프라인 유지 (Nova Solver 축소론 기각 — Arki 구조적 반론 승인)
- GATE 기준: Critical 정정율 < 5%, 과정별 독립 측정 (Riki 지적 → Arki 보완)
