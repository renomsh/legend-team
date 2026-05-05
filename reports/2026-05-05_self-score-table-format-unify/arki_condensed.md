---
role: arki
topic: topic_164
session: session_191
condensed: true
turnId: 1
invocationMode: subagent
---

# Arki — 구조 분석 (condensed)

## TL;DR
Self-Score 표 포맷 통일 — 5컬럼(shortKey/명칭/scale/채점기준) 합의 가능. 일부 역할 4컬럼 drift 5건 존재. lint 강제는 NO (D-092 단일 출처 원칙: registry가 SOT, 역할 md는 서술).

## 결과
- 5컬럼 표준안 도출. 헤더: `shortKey | 명칭 | scale | 채점 기준`
- drift 5건 (일부 역할 md에 4컬럼/3컬럼 변형 잔존)
- lint 강제 부적합 — `metrics_registry.json` SOT가 이미 검증 채널. 역할 md 표는 가독성 보조.

## 구조적 결론
역할 md 표는 registry mirror. SOT 변경 없이 표 양식만 통일 → low-risk 정제 작업.
