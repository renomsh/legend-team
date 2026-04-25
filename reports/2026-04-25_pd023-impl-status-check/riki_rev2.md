---
topic: PD-023 구현 점검
session: session_100
role: riki
phase: risk-audit
revision: 2
date: 2026-04-25
report_status: approved
session_status: closed
accessed_assets:
  - validate-schema-lifecycle.ts
  - role_registry.json
---

# Riki rev2 — Arki rev2 반증

## R-6: 스키마 거버넌스 트랙 분리 시 박제 누락
- 리스크: PD-040 신설 후 PD-020 본 토픽에서 다루지 않으면 enum 정의가 영구 임시 상태.
- mitigation: PD-040 resolveCondition에 "PD-020 차기 토픽 + validate-schema-lifecycle.ts 갱신 + 1회 실적용" 3조건 결합.
- fallback: 6세션 내 미진행 시 stale 알림 → Master 재소집 트리거.

## R-7: PD-035 done 처리 시 행동 변화 미검증
- 리스크: mention만으로 done 판정 → yaml-block 기록률 미개선 시 false-resolved.
- mitigation: PD-035 statusNote에 "행동 변화 검증은 후속 관찰" 명시. PD-023 P3 운영 KPI에서 cross-check.
- fallback: 3세션 후 yaml-block 기록률 변화 없으면 PD-035 재오픈.

## R-8: Quick-win validate-self-scores.ts orphan 검증 false-positive
- 리스크: 신규 역할 추가 시 orphan 오인.
- mitigation: role_registry.json 동적 로드. 하드코딩 금지.
- fallback: --strict 모드만 orphan fail, 기본은 warn.

## R-9: batch-score-helper CLI 대화형 흐름 중단
- 리스크: 사용자 Ctrl+C 시 partial JSONL append 잔여.
- mitigation: append 직전 confirm 단계 + atomic write (tmp → rename).
- fallback: --dry-run으로 출력만 확인.

## R-10: PD-042 promote 트리거 미발동
- 리스크: topic_082 closed 시점에 자동 promote hook 부재.
- mitigation: resolve-pending-deferrals.ts에 "promote on parent close" 패턴 추가 후속 PD 등록.
- fallback: /open 브리핑에서 수동 확인.
