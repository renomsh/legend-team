---
topic: topic_003
title: 로컬 업그레이드 vs 서버 이전
agent: riki
revision: 1
date: 2026-04-04
status: completed
---

# RIKI — 리스크 감사

## 위험 등급표
| # | 리스크 | 등급 | 설명 |
|---|---|---|---|
| R-1 | 전략 데이터 노출 | 🟡 중간 | Cloudflare Access 인증으로 완화. 전체 배포 시 인증이 유일 방어선 |
| R-2 | Push 규율 붕괴 | 🟡 중간 | 자동 push(D-008)로 완화 |
| R-3 | 뷰어 확장 유혹 | 🟡 중간 | D-003 revised에 쓰기 금지 명시. CLAUDE.md에 기록 |
| R-4 | Git 히스토리 오염 | 🟢 낮음 | 자동 push가 무의미한 커밋 축적 가능 |

## 핵심 권고
- 배포 대상 필터링과 접근 제한 2계층 방어 → Master 지시로 1계층(접근 제한)만 채택
- D-003 범위를 CLAUDE.md에 명시적으로 한정 → 완료
