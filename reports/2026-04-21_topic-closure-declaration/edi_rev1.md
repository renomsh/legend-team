---
topic: 토픽 종료 선언 — 프레이밍 종결 + PD resolved 구조화
topicId: topic_069
session: session_066
date: 2026-04-21
status: completed
grade: A
framingLevel: 2
decision: D-056
---

# D-056: 토픽 생명주기 자동화

## 배경

session_062~065에서 두 건의 구조적 누수 발견:
1. **프레이밍 토픽 미종결**: topic_062가 topic_063~065(구현)으로 분할되며 부모가 영구 in-progress 잔류. `/close` 훅이 `current_session.topicId`만 처리하므로 자동 전파 불가
2. **PD resolved 누락**: `sync-system-state.ts`가 `pendingDeferrals`를 원본 보존만 함 → PD-020b가 실제 해소됐음에도 pending 유지

두 건 모두 **"연결된 토픽·이연 항목의 생명주기를 시스템이 모른다"**는 동일 뿌리.

## 역할별 입력

- **Ace 프레이밍**: 3결정축(A·B·C) + executionPlanMode=conditional
- **Nova (speculative)**: N1~N4 제시. N3(Intent-inferring /open + Ace Step 0) 채택, 나머지 기각
- **Arki**: 스키마 3종(parent·topicType·resolveCondition) + Phase 4분할 skeleton + D-051 N:1 단방향 준수 확인
- **Fin**: 전 항목 채택 단일 권고. 비재무 자산(토픽 관계 가시성·시스템 자기 일관성·Master 신뢰) 가치가 비용 압도
- **Riki**: 🔴 R1(auto-close 연쇄) + 🔴 R2(참조 무결성) + 🟡 R3(pending-classification) + 🟡 R4(abandoned) — R1·R2 미해결 시 도입 금지 판정
- **Ace 종합검토**: 통합 단일안 도출, Riki 🔴 방어책 내장
- **Master**: 무응답=승인 원칙 박제 + Nova N4 장기 목표 명문화

## 결정 요약

스키마 확장·운영 프로토콜·저마찰 원칙·장기 로드맵은 decision_ledger D-056 본문 참조.

## 분기

**PD-022** — 토픽 생명주기 시스템 구현 (Grade A, 4-Phase, Arki 재소집 필요)

## 소급 정리

- topic_062·066: PD-022 P1에서 `topicType=framing` 소급 분류 + auto-close 검증
- 레거시 전 토픽: `standalone` 일괄 마이그레이션
