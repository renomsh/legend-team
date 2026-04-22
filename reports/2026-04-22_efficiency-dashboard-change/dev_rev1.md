---
session: session_073
topic: efficiency-dashboard-change
role: dev
rev: 1
date: 2026-04-22
---

# session_073 Dev Report — 효율 대시보드 변경

## 변경 배경

session_072 PD-NEW-B에서 RAW 토큰 접기 패널을 `<details>` 기본 닫힘으로 구현 → 토큰 4개 값 전체가 hidden 처리됨. Master 의도(수치 항상 visible, 내부 세부만 숨김)와 역전된 상태를 이번 세션에서 복원.

## 변경 사항

### 1. `app/dashboard-upgrade.html` — RAW 토큰 패널 재설계

**Before:** `<details>` 전체 접기 (기본 닫힘) — 7.2M/57.7M/968M/1033M 모두 hidden

**After:**
- **Row 1 (항상 visible):** I/O 7.2M / Cache Create 57.7M / Cache Read 968.2M / Total 1033.2M
- **Row 2 (항상 visible):** $106 / $217 / $290 / $613 (카테고리별 API 환산)
- **Hidden expand (▸ 토큰·API환산 상세):** 5행 상세표
  - input_tokens: 168,480 / $0.505
  - output_tokens: 7,057,233 / $106
  - cache_creation: 57,748,769 / $217
  - cache_read: 968,197,115 / $290
  - raw 합계: 1,033,171,597 / $613

### 2. `scripts/compute-dashboard.ts` — tokenUsage 필드 확장

`inputTokens`, `outputTokens` 필드 추가 → 상세 테이블에서 input/output 분리 표시 가능

## 검증

- Row 1 토큰 수치: 스냅샷 확인 ✅ (7.2M / 57.7M / 968.2M / 1033.2M)
- Row 2 $ 수치: 스냅샷 확인 ✅ ($106 / $217 / $290 / $613)
- 상세 테이블 내부값: eval 검증 ✅ (5행 exact 수치 정합)
- dashboard_data.json 재생성: compute-dashboard.ts 실행 완료 ✅
- dist/ 빌드: build.js 완료 ✅ (210 data files)
