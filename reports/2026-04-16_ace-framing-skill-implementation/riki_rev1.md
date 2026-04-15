---
topic: ace-framing 자작 skill 실제 구현
topicId: topic_016
session: session_019
date: 2026-04-16
role: riki
rev: 1
---

# Riki — 리스크 감사

## R-1 🟡 self-review 의례화 위험

- **문제:** 4항목을 매번 돌리면 "통과×4" 기계적 보고로 퇴화
- **대응:** 걸린 항목만 노출, "4개 통과" 보고 금지 → CLAUDE.md에 명시 완료
- **현재 상태:** 대응 반영됨

## R-2 🟡 섹션별 승인 과적용

- **문제:** 모든 토픽에 섹션별 승인 적용 시 세션 턴 수 과잉 증가
- **대응:** Ace 오케스트레이션 판단(D-019 re-call)으로 처리, 프로토콜 변경 없음
- **현재 상태:** 대응 반영됨

## 패스 항목

ace-framing skill 자체 구조 리스크: 낮음 (단일 .md, 롤백 즉시 가능)
