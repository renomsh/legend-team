---
session: session_127
topic: topic_125
role: arki
rev: 1
date: 2026-04-28
---

# Arki 구조 분석

## 현재 구조 실측

- `project_charter.json`: version "1.75", history는 v1.65에서 끊김 (공백 존재)
- 훅 체인: session-end-finalize.js에 version 업데이트 로직 없음 (순수 수작업)
- 최근 15세션 중 73% (11세션)가 결정 없이 pass

## 스키마 설계

`versionBumpReason: string | null` 필드 추가 + session_index 전파로 충분. 독립 로그 파일 불필요.

훅 자동화 점프 금지 — 판단은 Ace, 훅은 전파만.

## 구조적 실행계획 후보 (Phase A~E)

- Phase A: CLAUDE.md 트리거 규칙 정의 확장
- Phase B: current_session.json 스키마 + session-end-finalize.js 전파 로직
- Phase C: CLAUDE.md 규칙 텍스트 교체 + 증분 체계 매핑
- Phase D: project_charter.json history 갭 소급 (선택)
- Phase E: 검증

## 구조적 함정

1. 훅 자동화 점프 금지 — 결정 전 훅 설계로 선진입 금지
2. versionBumpReason은 Ace 종합검토 시점에 기입. 훅 사후 추론 불가
3. MD-117a 비공식 ID — D-104로 흡수 처리
