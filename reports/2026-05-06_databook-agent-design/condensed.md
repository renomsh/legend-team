---
role: zero
phase: D.Condense Phase A
session: session_204
topic: topic_175
date: 2026-05-06
turnId: 2
invocationMode: subagent
sources:
  - reports/2026-05-06_topic175-arki/arki_rev1.md
  - reports/2026-05-06_topic175-riki/riki_rev1.md
  - topics/topic_175/handoff_p0_complete.md (S7·S8)
---

# session_204 핵심 결정 요약 — topic_175 데이터북 Agent 설계

## 1. Master 로드맵 Step 1~8 확정

| Step | 내용 |
|---|---|
| 1 | 전체 통일용 데이터북 파일 — 스키마 정의 (취합본 기준) |
| 2 | 규칙·정책·PK키 점검 (P0 결과 재검증·동결) |
| 3 | 아키텍처 및 로직 |
| 4 | 어플리케이션 설계 |
| 5 | 팀원 → 팀 Agent 설계 및 구현 |
| 6 | 테스트 및 확인 점검 (G2 게이트) |
| 7 | 팀 → 전체 Agent 설계 및 구현 |
| 8 | 테스트 및 확인 점검 (G3 게이트) |

---

## 2. M5·M6 확정 결과

### M5 — 소스 파일 = 팀 완료 파일 (확정)
- 개인 파일(`박정규_완료.xlsm`) = 본인이 변경한 행만 포함 (as_is 박정규 47건)
- 팀 완료 파일(`기교1팀_완료.xlsm`) = 전체 행 (as_is 박정규 117건)
- **결정: 에이전트 소스 = 팀 완료 파일. G1.a 기준값 117건 유지.**

### M6 — G열 필터 기준 = `as_is` 컬럼 (확정)
- 팀 파일 col_idx 6 (`as_is`) → 취합본 `현재담당자` 컬럼으로 출력
- 취합본 col 7(`현재담당자`) = 유효 497건 / col 8·9 = 미사용(0건)
- **결정: 필터 기준 = `"26년 영업대표 (as_is)"`. 출력 컬럼명 = `현재담당자`.**
- `header_signature.json`에 `rep_column_key: "as_is"` + `rep_output_col: "현재담당자"` 박제 필요.

---

## 3. Arki P1 실행계획 핵심

### 즉시 착수 가능 (schema 동결)
경로: `C:/Projects/legend-team/Data/Databook/databook-agent/schema/`

| 파일 | 내용 | 상태 |
|---|---|---|
| `closed_months.json` | `[1, 2, 3]` | 즉시 작성 가능 |
| `header_signature.json` | 58열 canonical + `rep_column_key: "as_is"` + `rep_output_col: "현재담당자"` | M6 해소 완료 → 즉시 |
| `team_rules.json` | 7팀 splitValues + FS1 xlsb 플래그 | 즉시 작성 가능 |
| `company_aliases.json` | `{}` 빈 초기값 | 즉시 작성 가능 |
| `filter_rules.json` | (사용안함) 정책 §3 | 즉시 작성 가능 |
| `anomaly_thresholds.json` | 빈 구조체 (`null` 값) | M1 해소 후 채우기 |

### 검증 게이트
- **G0**: 6개 JSON 스키마 유효 + `closed_months = [1,2,3]`
- **G1.a**: 팀 완료 파일 추출 CSV 행수 = 117
- **G1.a-2**: 모든 행의 `as_is` 컬럼값 = "박정규"

### MUST_NOW 이행 항목 (코드 작성 시 반드시 반영)
1. `normalize_personal.py` 함수 분리 (헤더탐지·필터·CSV출력 혼재 금지)
2. schema 파일 경로 하드코딩 금지 → config JSON에서 읽기
3. G열 컬럼 위치 하드코딩 금지 → 헤더 텍스트 동적 탐지
4. `\n` 정규화 전처리 (strip + `\n`→공백) 필수
5. 7팀 확장 = `team_rules.json` 수정만으로 가능한 구조 유지

---

## 4. Riki 블로커

### 🔴 R-10 — G열 3종 컬럼 문제 (M6로 해소)
- col_idx 6 (as_is) = 박정규 117건 / col_idx 7·8 = 0건
- **M6 확정으로 해소. `as_is` 컬럼 명시 박제 필요.**

### 🔴 R-11 — 개인 파일 행수 불일치 (M5로 해소)
- 개인 파일 as_is 박정규 = 47건 (팀 완료 파일 117건과 불일치)
- **M5 확정으로 해소. 소스 = 팀 완료 파일.**

### 🟡 R-12 — xlsm data_only 미지정 시 수식 문자열 반환
- `openpyxl.load_workbook(path, read_only=True)` 기본값은 `data_only=False`
- 매출 집계 컬럼 수식 셀 → 문자열 반환 → TypeError 위험
- **필수 처리: `data_only=True` 명시적 지정 (read_only와 독립 파라미터)**

---

## 5. 다음 세션 시작점

**모든 블로커 해소 완료. 즉시 착수 가능.**

1. `databook-agent/schema/` 폴더 생성 + JSON 6개 작성 (Step 1)
2. `normalize_personal.py` 작성 — `data_only=True` + `keep_vba=True` 필수 (Step 5 선행)
3. 팀 완료 파일 (`기교1팀_완료.xlsm`) 실행 → G1.a 117건 게이트 검증

**주의사항:**
- normalize 시 팀 파일 `as_is` 값 읽어 출력 컬럼명 `현재담당자`로 기록
- FS1팀 xlsb: pyxlsb + 시트명 동적 탐지 필수 (R-5)
- policy_databook_agent.md §5에 `as_is` 컬럼 명시 업데이트 필요 (R-10 보완)

**미해결 M1**: 이상치 임계값 (`anomaly_thresholds.json`) — 빈 구조체로 선작성 후 Master 확인 대기.
