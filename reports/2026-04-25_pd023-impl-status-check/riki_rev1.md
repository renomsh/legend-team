---
topic: PD-023 구현 점검
session: session_100
role: riki
phase: risk-audit
revision: 1
date: 2026-04-25
report_status: superseded
session_status: closed
accessed_assets:
  - system_state.json
  - topic_index.json
---

# Riki rev1 — 5개 리스크 (mitigation + fallback 병기)

## R-1: 매트릭스 done 표기와 운영 KPI 괴리
- 리스크: 코드 done 표기를 보고 PD-023 closed 판단 → 86% default-fallback 실태 은폐.
- mitigation: statusNote에 운영 KPI 수치 병기 (ex: "코드 done / yaml-block 14%").
- fallback: dashboard에 yaml-block 기록률 패널 강제 노출.

## R-2: PD-031 흡수 시 진단 컨텍스트 손실
- 리스크: PD-031 item 텍스트(원인 6가지 가설)가 단순 absorbed 처리 시 사라짐.
- mitigation: PD-031 statusNote에 "absorbed-by-PD-023 per D-088" 명시 + 원본 item 보존.
- fallback: D-088 decision.value에 6가지 가설 요약 inline.

## R-3: Quick-win 본 세션 압박
- 리스크: 280줄 + 검증 → 세션 over-run.
- mitigation: 2파일 모두 단일 책임·외부 의존 없음. dry-run 옵션으로 검증 분리.
- fallback: 1파일만 본 세션, 1파일 다음 세션 spawn.

## R-4: followup-A test-regression baseline drift
- 리스크: fixture 5종이 schema 변경 시 자동 깨짐.
- mitigation: PD-041 resolveCondition에 "baseline 갱신 trigger 정의" 포함.
- fallback: tests/fixtures/regression/ 에 schema_version 필드 명시.

## R-5: P5 nav 통합 무기한 지연
- 리스크: topic_082 suspended 상태 지속 → PD-042 resolved 영구 미달.
- mitigation: PD-042 resolveCondition에 "topic_082 closed 후 promote" 명시 + 6세션 이내 미달 시 stale 알림.
- fallback: signature.html 단독 surface로 운영 KPI 측정 (nav 의존 제거).
