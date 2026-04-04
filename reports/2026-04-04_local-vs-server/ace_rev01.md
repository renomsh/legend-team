---
topic: topic_003
title: 로컬 업그레이드 vs 서버 이전
agent: ace
revision: 1
date: 2026-04-04
status: completed
---

# ACE — 로컬 업그레이드 vs 서버 이전

## 프레이밍

### 결정축
| 축 | 설명 |
|---|---|
| A. 시스템 성숙도 | v0.2.0은 파일 기반 수동 프로토콜. 서버 이전에 충분히 안정적인가? |
| B. 이전 목적 | 접근성, 자동화, 협업 중 무엇이 핵심인가? |
| C. 투자 대비 효과 | 로컬 업그레이드 한계 비용 vs 서버 세팅 초기 비용 |

### Master 요구사항 확인
- 접근성 (모바일/PC 상호호환)
- 프로젝트 진행현황 점검
- Claude Code를 통한 데이터 축적 유지 (API 구조 배제)

### Ace 소견
읽기/쓰기 경로 분리가 핵심. 쓰기 경로(Claude Code)는 유지, 읽기 경로만 서버로 확장.
로컬에서 할 수 있는 업그레이드를 먼저 소진하는 것이 리스크가 낮지만, 정적 사이트 배포는 코드 변경이 거의 없으므로 지금 실행 권고.

## 종합검토 (session_003)

### 전원 합의
- 쓰기 경로(Claude Code) 변경 없음 — 전원 일치
- 읽기 경로를 모바일/PC 접근 가능하게 — 전원 일치
- Private repo 필수 — 전원 일치
- 지금 실행 (v0.3.0 대기 불필요) — Ace, Fin 일치

### Master 결정
- D-006: A — Cloudflare Pages + Access
- D-007: A → revised — 전체 배포, 보안은 Cloudflare Access
- D-008: B — 자동 push
- D-009: Ace 종합검토, Editor 출력만

### 실행 결과
다중 페이지 정적 뷰어 구현 및 Cloudflare Pages 배포 완료.
