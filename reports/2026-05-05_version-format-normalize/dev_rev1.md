---
role: dev
topic: C 버전 형식 정규화
session: session_189
date: 2026-05-05
report_status: final
---

# Dev — 버전 형식 정규화

## 문제 진단

**PD-061**: session_182 이후 버전 history에 점 두 개짜리 형식 오기 (`0.9.171`, `0.8.171` 등) 발생.  
원인: Edi가 수동으로 `versionBump.to`를 설정할 때 `0.9.171` 형태로 입력.

**올바른 형식**: `X.YYY` (3자리 소수 float, 점 하나)  
- structural +0.1, capacity +0.01, bugfix +0.001 단순 덧셈

## 수정 내역

### 1. `session-end-finalize.js` — 원본 parseFloat 방식 복원

이전 오류 수정 시도(3-segment integer 방식)를 되돌리고 원본 `parseFloat + toFixed(3)` 방식 복원.  
원본 코드 자체는 올바랐음 — 문제는 Edi의 수동 오기였음.

### 2. `memory/shared/project_charter.json`

- `version`: `"0.9.171"` → `"0.917"`
- `versionSchema` 추가: `X.YYY (3자리 소수 float, 점 하나)` 명문화
- history 오기 항목 정정:
  - `0.7.161` → `0.716` (session_182)
  - `0.8.161` → `0.816` (session_183)
  - `0.8.171` → `0.817` (session_184)
  - `0.9.171` → `0.917` (session_188)

### 3. `memory/shared/system_state.json`

- `currentVersion`: `"v0.9.171"` → `"v0.917"`

## 검증

```
0.917 + 0.1  = 1.017 ✓
0.917 + 0.01 = 0.927 ✓
0.917 + 0.001 = 0.918 ✓
```

점 두 개짜리 잔여 항목 없음 확인.

## 결론

PD-061 resolved. 버전 형식 `X.YYY` 확정. 이후 Edi 수동 박제 시 점 하나만 사용할 것.
