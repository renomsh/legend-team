# PD-004 Databook Agent — P0 완료 핸드오프

**topic_175 / session_202 종료 시점 / 2026-05-06**

다음 세션이 이 파일만 읽고도 P1.0부터 바로 착수 가능하도록 구성.

---

## 0. 한 줄 요약

P0 선결조사 완료. 표준 양식 정의 + PK 정책 + 필터 정책 확정. 다음 세션은 **P1.0 (schema 동결) → P1.1 (개인 파일 1개 정규화)** 부터.

---

## 1. 진행 상태

| Phase | Sub | 상태 |
|---|---|---|
| **P0** 선결조사 | P0.1~P0.5, P0.8 | ✅ 완료 |
| | P0.6 (개인 vs 팀 SOT) | ✅ 해소 (Master: 팀 파일 SOT, 개인은 G열 필터) |
| | P0.7 (자연키 충돌 샘플) | ⚠️ P0.3 결과로 흡수 |
| **P1** 개인→팀 | P1.0~P1.7 | 🔲 대기 |
| **P2** 팀→취합 | P2.0~P2.5 | 🔲 대기 |

---

## 2. 확정된 설계 (정책 단일 출처)

→ `topics/topic_175/policy_databook_agent.md` 참조 (이 파일이 SOT)

**핵심 8가지:**
1. 헤더 행 동적 탐지 (50행 스캔, "고유번호" 단독 또는 핵심 3종 매칭)
2. PK 자연키 = `기업코드 + 사업유형 + 기업명(원본)` + lookup table 누적
3. (사용안함) 필터 = 25/26년 매출 모두 0인 행만 제외
4. 컬럼 수 변동 = closedMonths schema 외재화 + 헤더 텍스트 매핑
5. 개인 파일 = G열(영업대표 본인 이름) 필터로 본인 행만 추출
6. F열 팀 분리 = FS3+GS 자동 분리 가능 (실측 검증 완료)
7. 사업취소 행 = 데이터북에 미존재 (별도 필터 불요)
8. 검증 = 수동 결과와 셀 단위 100% 일치

---

## 3. P0 실측 데이터 (재조사 불요)

### 3.1 파일 위치
- 입력 폴더: `C:/Projects/legend-team/Data/Databook/20260507/`
- 최종 취합본 (정답지): `C:/Projects/legend-team/Data/Databook/01_2026년_databook_취합_260507_완료.xlsx`
- 전주 취합본: `C:/Projects/legend-team/Data/Databook/01_2026_databook_260409.xlsx`

### 3.2 팀 파일 구조

| 팀 | 파일 형식 | 시트명 | 헤더 행 | 비고 |
|---|---|---|---|---|
| 기교1팀 | xlsm | `26년 databook(취합)` | 22 | |
| 기교2팀 | xlsm | `26년 databook(취합)` | 23 | |
| 기교3팀 | xlsm | `26년 databook(취합)` | 21 | |
| FS1팀 | **xlsb** | `26년 databook(취합)` | TBD (P1.0에서 pyxlsb로 확인) | pyxlsb 필요 |
| FS2팀 | xlsx | `26년 databook(취합)` | 21 | |
| FS3GS팀 | xlsx | `26년 databook(취합)` | **24** | 다른 팀보다 늦음 |
| 취합본 | xlsx | `26년 Databook(취합)` (대문자 D) | 3 | |

### 3.3 컬럼 구조 (현재 5/7 기준 58열)

| 그룹 | 컬럼 범위 | 비고 |
|---|---|---|
| 식별 (A~M) | 1~13 | 고유번호, 담당팀, 영업대표, 기업명, 영업기회코드, 그룹사, 기업코드 |
| 분류 (N~T) | 14~20 | 기업등급, 고객구분, LMS, 사업유형, 핵심Target |
| 매출이력 (U~AA) | 21~27 | 23/24/25년 매출, 25/26년 확가기, THSM |
| 합계·전주 (AB~AE) | 28~31 | 검수, 26년 예상매출합계, 전주, 차이 |
| 1~3월 마감 (AF~AN) | 32~40 | 예상/매출/사유 (3열 × 3개월 = 9열) |
| 4~12월 미마감 (AO~BF) | 41~58 | 예상/사유 (2열 × 9개월 = 18열) |

`closedMonths = [1, 2, 3]` (5/7 시점). 4월 마감 추가 시 `[1, 2, 3, 4]` + 컬럼 수 60열로 증가.

### 3.4 팀별 행수 (8,515건 / 5월 7일 기준)

| 팀 | 행수 | 영업기회코드 사용률 |
|---|---|---|
| 기업교육1팀 | 1,054 | 0.1% |
| 기업교육2팀 | 707 | 0.1% |
| 기업교육3팀 | 732 | 0% |
| FS1팀 | 1,007 | 0% |
| FS2팀 | 630 | 8% |
| FS3팀 | 1,145 | 97% |
| GS팀 | 3,240 | 97% |

### 3.5 사업유형 24종 중 상위 10
1. `02. 이러닝 - 단과` (4,085)
2. `03. 이러닝 - 법정` (1,080)
3. `08. 하이브리드러닝 - 하이브리드형 러닝` (594)
4. `06. 이러닝 - 정부지원사업` (561)
5. `01. 이러닝 - 통합위탁` (471)
6. `09. 하이브리드러닝 - 순수 오프라인` (390)
7. `13. 구독 - 휴넷FLEX` (362)
8. `15. 컨텐츠 - 컨텐츠 개발` (231)
9. `07. 이러닝 - 컨텐츠 임대/판매` (128)
10. `11. 구독 - 휴넷CEO멤버십` (103)

### 3.6 중복 1,174건 4분류
- B. 이름변형(괄호) **1,140건** (97%)
- D. 실제별건(담당 다름) 16건
- A. 동일(미세차이) 16건
- C. 연도분기 2건

### 3.7 (사용안함) 11건
- 매출 있는 4건 (4635, 4845, 4935, 5004): **취합 포함**
- 매출 0인 7건 (4189, 4341, 5003, 5015, 6401, 6557, 6558): **취합 제외**

### 3.8 P0 산출물 위치
- `C:/Projects/legend-team/Data/Databook/data_inv2.json` — 전체 통계
- `C:/Projects/legend-team/Data/Databook/p0_3_4.json` — 중복 분류 + 헤더 위치
- `C:/Projects/legend-team/Data/Databook/p0_5_8.json` — 기업명 패턴 + 헤더 텍스트 전체
- `C:/Projects/legend-team/Data/Databook/p0_prev.json` — 전주 파일 구조
- `C:/Projects/legend-team/Data/Databook/unused_rows.json` — (사용안함) 11건 상세

---

## 4. 다음 세션 시작 (P1.0)

### 첫 작업: schema 동결본 작성
경로 후보: `C:/Projects/legend-team/Data/Databook/databook-agent/schema/`

**필요 파일:**
1. `schema/closed_months.json` = `[1, 2, 3]`
2. `schema/header_signature.json` = canonical 헤더 텍스트 58종 + 매칭 룰
3. `schema/team_rules.json` = 7팀 splitValues + 영업기회코드 화이트리스트(FS3/GS만)
4. `schema/company_aliases.json` = 빈 초기값 (운영자 검토 큐 결과 누적)
5. `schema/filter_rules.json` = `(사용안함)` 필터 정책
6. `schema/anomaly_thresholds.json` = 전주 대비 매출 이상치 임계 (TBD - Master 확인 필요)

### P1.0 후 P1.1
- 개인 파일 1개(예: `박정규_완료.xlsm`) 정규화 → `work/normalized/박정규.csv`
- 동적 헤더 탐지 + WARN/ABORT 게이트 동작 검증
- 산출물: G열 필터로 박정규 본인 117행만 추출됐는지 확인

### 검증 게이트 G1.a 통과 기준
- 박정규 파일에서 추출된 본인 행수 = 사람이 센 박정규 본인 행수 (정확히 일치)

---

## 5. 미해결 / Master 확인 필요

| # | 항목 | 비고 |
|---|---|---|
| M1 | 전주 대비 매출 이상치 임계값 (`anomaly_thresholds.json`) | %·절댓값 기준 정의 필요 |
| M2 | FS1팀 xlsb 헤더 행 위치 (P1.0에서 pyxlsb로 확인) | 코드 작성 시 자동 해결 가능 |
| M3 | Phase 1 우선 착수 팀 선택 (1팀 먼저 → 7팀 확장) | 기교1팀 추천 (7팀 중 가장 단순) |

---

## 6. Arki 로드맵 (P0 결과 반영본)

→ `reports/2026-05-06_pd004-roadmap/arki_rev1.md` 참조

**P0 결과로 보정된 사항:**
- PK 자연키에 기업명 추가 (괄호 정규화 X)
- 헤더 탐지 KEY_HEADERS 완화 (`"고유번호"` 단독 매칭 허용)
- closedMonths 외재화 + 헤더 텍스트 교차 검증 강화
- (사용안함) 필터 정책 명시
- FS1팀 xlsb pyxlsb 처리 명시

---

## 7. Riki 리스크 추적

→ `reports/2026-05-06_topic175-riki/riki_rev01.md`

| ID | 상태 | 비고 |
|---|---|---|
| R-1 (closedMonths 오기) | 정책 §4 반영 | 헤더 텍스트 교차 검증으로 해소 |
| R-2 (filterRules column 미정의) | 보류 | 사업취소 행 미존재로 우선순위 하락 |
| R-3 (F열 빈 값 unknown) | 정책 §6 반영 | ABORT 게이트로 해소 |
| R-4 (전주 파일 정규화) | 정책 §4 반영 | 헤더 텍스트 매핑으로 해소 |

---

## 8. 결정 박제

| ID | 내용 |
|---|---|
| D-166 (이번 세션) | PD-004 Phase 0 완료 + 정책 SOT 박제(`topics/topic_175/policy_databook_agent.md`) |
| D-167 (이번 세션) | Arki 로드맵 확정 (P0/P1/P2 분할 + 검증 게이트 9개) |
| D-168 (이번 세션) | (사용안함) 행 필터 정책 — 25/26년 매출 모두 0인 경우만 제외 |

---

**최종 갱신: 2026-05-06 / session_202 종료**

---

---

# session_204 진행 현황 (2026-05-06)

다음 세션이 이 파일만 읽고 바로 착수 가능하도록 구성.

---

## S1. 세션 정리 완료

session_202(pd004-databook-review)·session_203(auto-push-log-conflict)가 클로즈 누락으로 인덱스 미등록 상태였음. 수동 정리 완료.

| sessionId | slug | 상태 |
|---|---|---|
| session_202 | pd004-databook-review | ✅ 등록 완료 (D-166/167/168, v0.957→v1.057) |
| session_203 | auto-push-log-conflict | ✅ 등록 완료 (Grade D, 최소 세션) |
| session_204 | databook-agent-design | ▶ 진행 중 (현재 세션) |

currentVersion: **v1.057**

---

## S2. Master 확정 로드맵 (Step 1~8)

Master가 이번 세션에서 확정한 전체 흐름:

| Step | 내용 | 상태 |
|---|---|---|
| **1** | 전체 통일용 데이터북 파일 — 스키마 정의 (취합본 기준) | 🔲 다음 착수 |
| **2** | 규칙·정책·PK키 점검 (P0 결과 재검증·동결) | 🔲 |
| **3** | 아키텍처 및 로직 | 🔲 |
| **4** | 어플리케이션 설계 | 🔲 |
| **5** | 팀원 → 팀 Agent 설계 및 구현 | 🔲 |
| **6** | 테스트 및 확인 점검 (G2 게이트) | 🔲 |
| **7** | 팀 → 전체 Agent 설계 및 구현 | 🔲 |
| **8** | 테스트 및 확인 점검 (G3 게이트) | 🔲 |

---

## S3. Arki P1 실행계획 요약

→ `reports/2026-05-06_topic175-arki/arki_rev1.md` 전문

**즉시 착수 가능 (소스 확보 완료):**
- `schema/closed_months.json` = `[1, 2, 3]`
- `schema/header_signature.json` — `p0_5_8.json` 기반 58열 canonical (단, M6 해소 후 rep_column_key 확정 필요)
- `schema/team_rules.json` — 7팀 splitValues + FS1 xlsb 플래그
- `schema/company_aliases.json` = `{}` 빈 초기값
- `schema/filter_rules.json` — §3 정책 반영
- `schema/anomaly_thresholds.json` — 빈 구조체 선작성 후 M1 해소 시 채우기

**경로:** `C:/Projects/legend-team/Data/Databook/databook-agent/schema/`

---

## S4. Riki 블로커 (다음 세션 시작 전 반드시 해소)

→ `reports/2026-05-06_topic175-riki/riki_rev1.md` 전문

### 🔴 R-10 · M6 — G열 기준 컬럼 미확정

기교1팀 완료 파일 헤더 행 22에 "26년 영업대표" 컬럼 **3종 공존**:

| col_idx | 헤더 (정규화 후) | 박정규 건수 |
|---|---|---|
| 6 | `'26년 영업대표 (as_is)'` | **117건** |
| 7 | `'26년 영업대표 (현재 담당)'` | 0건 |
| 8 | `'26년 영업대표 (To_be)'` | 0건 |

**M6 (블로킹):** G열 필터 기준 = as_is / 현재담당 / To_be 중 어느 컬럼인가?

---

### 🔴 R-11 · M5 — 소스 파일 미확정

| 파일 | 총 행수 | as_is 기준 박정규 |
|---|---|---|
| 팀 완료 (`기교1팀_완료.xlsm`) | 1,054 | **117건** |
| 박정규 개인 (`박정규_완료.xlsm`) | 1,050 | **47건** |

현재 G1.a 기준값(117) = 팀 완료 파일 기준. 개인 파일로 구현하면 즉시 실패(47 ≠ 117).

**M5 (블로킹):** P1.1 소스 파일 = 개인 파일(47건) vs 팀 완료 파일(117건)?

---

### 🟡 R-12 — xlsm data_only 미지정 시 수식 문자열 반환

`normalize_personal.py` 작성 시 `data_only=True` 필수. Arki 권고(read_only=True)에서 누락됨.

---

## S5. 미결 항목 전체

| ID | 항목 | 긴급도 | 해소 방법 |
|---|---|---|---|
| **M5** ⭐ | P1.1 소스: 개인 파일 vs 팀 완료 파일 | 높음 | Master 확인 |
| **M6** ⭐ | G열 기준: as_is / 현재담당 / To_be | 높음 | Master 확인 |
| M1 | 이상치 임계값 (`anomaly_thresholds.json`) | 보통 | Master 확인 |
| M2 | FS1팀 xlsb 헤더 행 위치 | 낮음 | 코드로 자동 해결 가능 |
| M3 | Phase 1 우선 착수 팀 (기교1팀 추천) | 낮음 | Master 확인 |
| M4 | `변경 없음_*.txt` 이름 파싱 자동화 | 낮음 | Master 확인 |

---

## S6. 다음 세션 시작점

**M5·M6 해소 후 즉시:**
1. `databook-agent/schema/` 폴더 생성 + JSON 6개 작성 (Step 1)
2. `normalize_personal.py` 작성 — `data_only=True` 필수 (Step 5 선행)
3. 박정규 파일 실행 → G1.a 게이트 검증

**M5·M6 미해소 시:** schema 5개(anomaly 제외)만 작성 후 대기.

---

---

## S7. M5·M6 확정 (session_204, 2026-05-06)

### M5 확정 — 소스 파일 = 팀 완료 파일

Master 답변: "전체 자기 파일 내역 중 변경된 내역만 보낸 모양이네"

- 개인 제출 파일(`박정규_완료.xlsm`) = 본인이 **변경한 행만** 포함 → as_is 박정규 **47건**
- 팀 완료 파일(`기교1팀_완료.xlsm`) = 전체 행 포함 → as_is 박정규 **117건**

**결정:** 에이전트 소스 = **팀 완료 파일**. 개인 파일은 참조 불요.
- G1.a 기준값 **117건** 유지 확정.

---

### M6 확정 — G열 필터 기준 = `as_is` 컬럼 → 취합본 `현재담당자` 출력

Master 답변: "조직변동 DB이관 때문. 지금 정규화에 뭐가 들어갔는지 확인해봐."

**취합본(`01_2026년_databook_취합_260507_완료.xlsx`) col 7~9 실측:**

| 컬럼 | 헤더 | 값 있는 행수 | 박정규 건수 |
|---|---|---|---|
| col 7 | `26년 영업대표 (현재담당자)` | 497건 | **117건** |
| col 8 | `26년 영업대표 (변경 전)` | **0건** | 0건 |
| col 9 | `26년 영업대표 (To_be) 수정요청` | **0건** | 0건 |

취합본 상위 담당자 (col 7): 장지웅 157 / 이재성 127 / 박정규 117 / 황동현 85 / 이태원 11

**결론:**
- 취합본은 `(현재담당자)` 컬럼만 사용. `(변경 전)`·`(To_be)` = 미사용.
- 팀 파일 `as_is` (col 6) → 취합본 `현재담당자` (col 7) 매핑.
- **필터 기준 = 팀 파일 `as_is` 컬럼. 출력 컬럼명 = `현재담당자`.**

**정책 §5 보정 필요:**
> `header_signature.json`에 `rep_column_key: "as_is"` 박제.
> normalize 시 팀 파일 `as_is` 값을 읽어 취합본 `현재담당자` 컬럼에 기록.

---

## S8. 홀딩 — 다음 세션 시작점

**모든 블로커 해소 완료. 즉시 착수 가능.**

### 다음 세션 첫 작업 (Step 1)

```
경로: C:/Projects/legend-team/Data/Databook/databook-agent/schema/
```

1. `closed_months.json` = `[1, 2, 3]`
2. `header_signature.json` — 58열 canonical + `rep_column_key: "as_is"` + `rep_output_col: "현재담당자"` 박제
3. `team_rules.json` — 7팀 splitValues
4. `company_aliases.json` = `{}`
5. `filter_rules.json` — (사용안함) 정책
6. `anomaly_thresholds.json` — 빈 구조체 (M1 해소 후 채우기)

### 검증 기준 (G1.a)
- 소스: 팀 완료 파일 (`기교1팀_완료.xlsm`)
- 필터: `as_is` 컬럼 기준 본인 이름
- 기준값: **박정규 117건**

### 주의사항
- `normalize_personal.py`: `data_only=True` 필수 (R-12)
- FS1팀 xlsb: P1.1 확장 시 pyxlsb + 시트명 동적 탐지 (R-5)

---

**최종 갱신: 2026-05-06 / session_204 홀딩**
