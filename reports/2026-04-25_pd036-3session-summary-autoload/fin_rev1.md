---
topic: topic_103
session: session_098
role: fin
rev: 1
date: 2026-04-25
slug: pd036-3session-summary-autoload
---

# Fin — 비용·자원 평가 (topic_103 / PD-036)

## 1. 토큰 부담 평가

### 현재 /open 로드 기준선

`system_state.json` 실측 기준:

- **openTopics**: 3건 — topic_082(Dashboard 개편), topic_044(COPD 논문), topic_012(데이터북 Agent). 각 note 포함 시 건당 평균 400~600자 추정 → **총 약 1,500자**
- **pendingDeferrals**: 14건(PD-023~PD-036) — 건당 평균 300~500자(item + resolveCondition + note) → **총 약 5,600자**
- 합산 기준선: **약 7,000자 / 2,300 tokens** (rough estimate)

### 추가 분량 (recentSessionSummaries 3건)

제안 스키마 기준:
- 세션 1건 = oneLineSummary(~80자) + decisionsAdded 2~3개(건당 ~60자) + topicsChanged 1~2건(~40자)
- 세션당 약 250~300자 → 3건 = **약 750~900자 / 250~300 tokens**

### 순증분 비율

기준선 대비 추가 분량: **약 11~13%**

이는 `/open` 총 로드 컨텍스트 기준으로 한 자릿수 중반 퍼센트 증분에 해당한다. 실무적으로 **무시 가능한 수준(negligible overhead)**이다.

> 단서: recentSessionSummaries 필드 설계가 간결하게 유지되어야 한다는 전제. 세션 요약이 롤 발언 전문 수준으로 팽창하면 이 판단은 무효화된다. 설계 제약으로 명시 권장.

---

## 2. ROI 평가

### 문제 원점: 세션 간 정보 휘발

MEMORY.md에 기록된 피드백: *"구현 토픽은 3세션 이내 완결 설계, 세션 간 정보 휘발이 오진·재작업 유발"* (session_094).

현재 openTopics 3건 중 2건(topic_044, topic_012)이 **수 세션 이상 suspended** 상태다. 재개 시 직전 3세션 컨텍스트 공백이 Ace의 재진입 품질을 저하시킨다.

### 편익 방향성

| 편익 항목 | 방향 | 근거 |
|---|---|---|
| 오진율 감소 | 긍정 | 재개 세션에서 직전 결정·변경 이력 즉시 참조 가능 |
| 재작업 감소 | 긍정 | 중복 질문·중복 설계 방지 |
| /open 브리핑 밀도 향상 | 긍정 | "PD X가 지난 세션에서 어디까지 진행됐는지" 요약 제공 |
| 이연 항목 교차검증 강화 | 긍정 | PD-030 resolvedInSession 패턴처럼, 직전 세션 decisionsAdded로 PD 자동 해소 탐지 지원 |

**ROI 결론**: 토큰 비용 대비 편익 비율이 명확히 정(+)이다. 비용은 한 자릿수 중반 % 증분, 편익은 세션 간 오진·재작업이라는 실질 운영 손실 감소. **투자 타당성 충분.**

---

## 3. 비재무적 자산 가치

### 세션 이력 가독성

현재 `/open` 브리핑은 openTopics + pendingDeferrals 나열이 주다. 여기에 *마지막 3세션이 무엇을 결정했는지*가 추가되면, Master의 컨텍스트 재구성 부담이 수동 탐색(session_index, decision_ledger 직접 열람)에서 자동 요약 수신으로 전환된다.

이는 **Master의 인지 부하 절감**이라는 비재무적 자산이다. 측정이 어렵지만, 운영 속도(세션 착지 시간 단축)로 간접 반영된다.

### 시스템 자기기술성(self-documenting)

recentSessionSummaries가 system_state.json에 누적되면, 프로젝트가 *자신의 최근 이력을 내재화*하는 구조가 된다. 외부 문서나 별도 로그 없이 시스템 자체가 "지난 3번의 선택이 무엇이었는가"를 보존한다. 이는 장기적으로 새 역할 합류 또는 세션 공백 후 재진입 시 온보딩 비용을 낮추는 구조적 가치다.

---

## 4. 종합 판단

- **비용**: 무시 가능 수준의 토큰 순증분 (~250~300 tokens / 세션 시작당)
- **ROI**: 명확히 정(+). 세션 간 정보 휘발 감소 효과가 비용을 압도
- **비재무 가치**: Master 인지 부하 감소, 시스템 자기기술성 향상

**Fin 권고**: 토큰 절약을 이유로 이 기능을 지연할 근거 없음. 단, recentSessionSummaries 필드 크기에 **명시적 상한(예: 세션당 500자 이하)** 을 설계 단계에서 박을 것을 권장. 팽창 방지가 ROI 지속성의 전제 조건이다.
