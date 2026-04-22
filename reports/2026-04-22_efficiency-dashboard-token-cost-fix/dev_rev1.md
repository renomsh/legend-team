---
session: session_074
topic: 효율 대시보드 토큰·비용 패널 수정
role: dev
rev: 1
date: 2026-04-22
---

## 변경 사항

### 1. 비용 KPI 3개 → I/O cost 기준 전환

**파일:** `app/dashboard-upgrade.html`

- KPI 레이블 변경: `Total Cost` → `I/O Cost`, `Avg / Session` → `Avg I/O / Session`, `Max Session` → `Max I/O Session`
- JS 비용 계산 로직: `sessionCostUSD`(전체 billable) → `inputTokens*3 + outputTokens*15` / 1e6 (I/O only)
- sparkCost 차트도 I/O cost 기준으로 전환
- 결과: $618 → $107, avg $9.22 → $1.60, max $38 → $7.24 (session_034)

### 2. 녹색 Row 2 라인 제거

- `<!-- Row 2: $ cost per category -->` div 블록 삭제 ($107/$218/$292/$618 녹색 라인)
- 대응 DOM 세팅 코드 (`rawInputCost`, `rawCCCost`, `rawCRCost`, `rawTotalCost`) 제거
- 상세 내역은 `▸ 토큰·API환산 상세` expand에서 확인 가능하므로 중복 불필요

## 검증

- 빌드 완료 (`node scripts/build.js`)
- 브라우저 preview 확인: I/O COST $107, AVG $1.60, MAX $7.24 정상 표시
- 녹색 Row 2 미표시 확인
