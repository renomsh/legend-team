---
role: arki
topic: topic_175
session: session_202 (후속)
date: 2026-05-06
turnId: 0
invocationMode: subagent
---

# Arki — 데이터북 Agent 설계 (P1 구조 분석)

topic_175 / session_202 후속 / Arki입니다.

---

## 1. 현재 상태 요약

### P0에서 확정된 핵심 설계 결정 (policy_databook_agent.md SOT 기준)

| # | 결정 | 재조사 불요 |
|---|---|---|
| §1 | 헤더 행 동적 탐지 — 50행 스캔, "고유번호" 단독 or 핵심 3종 매칭 | ✅ 실측 완료 |
| §2 | 자연키 = `기업코드 + 26년 사업유형 + 기업명(원본)` — 기업명 정규화 금지 | ✅ 확정 |
| §3 | (사용안함) 필터 = 25/26년 매출 모두 0인 경우만 제외 | ✅ Master 확정 |
| §4 | closedMonths 외재화 + 헤더 텍스트 교차 검증 | ✅ 확정 |
| §5 | 개인 파일 = G열(26년 영업대표) 필터로 본인 행만 추출 | ✅ 확정 |
| §6 | F열 팀 분리 — ABORT 게이트, splitValues 외재화 | ✅ 확정 |
| §7 | 사업취소 행 = 데이터북 미존재, 별도 필터 불요 | ✅ 실측 확인 |
| §8 | 검증 = 수동 결과 셀 단위 100% 일치 | ✅ 확정 |

### 재조사 불요 항목

- 팀별 헤더 행 위치: GI1=22, GI2=23, GI3=21, FS2=21(실측), FS3GS=24
  - FS1(xlsb)은 P0에서 시트 목록 확인됨 (`'26년 databook(취합)'` 없음 — **주의 항목**)
- 헤더 텍스트 58열 전체: `p0_5_8.json`에 박제 완료
- 박정규 본인 행수: **117건** (`personal_stats.json` 확인)
- 개인 파일 존재: `★2026년_databook_기교1팀_260507_박정규_완료.xlsm` 확인 완료
- pyxlsb, openpyxl 설치 상태: **모두 설치 완료**

---

## 2. P1 구조적 실행계획 (executionPlanMode = plan)

### Phase 분해

**P1.0: Schema 동결 (6개 JSON 파일 작성)**

경로: `C:/Projects/legend-team/Data/Databook/databook-agent/schema/`

| 파일 | 내용 | 데이터 출처 | 상태 |
|---|---|---|---|
| `closed_months.json` | `[1, 2, 3]` — 마감 완료 월 | 정책 §4 | 즉시 작성 가능 |
| `header_signature.json` | canonical 58열 헤더 텍스트 + 매칭 룰 | `p0_5_8.json` C1~C58 | 즉시 작성 가능 |
| `team_rules.json` | 7팀 splitValues + FS1 xlsb 플래그 | 정책 §6 + 실측 | 즉시 작성 가능 |
| `company_aliases.json` | 빈 초기값 `{}` (운영자 검토 큐 누적용) | — | 즉시 작성 가능 |
| `filter_rules.json` | (사용안함) 필터 정책 | 정책 §3 | 즉시 작성 가능 |
| `anomaly_thresholds.json` | 전주 대비 매출 이상치 임계 | **M1 미결 — Master 확인 필요** | 대기 |

**P1.1: 개인 파일 정규화 코드**

대상: `★2026년_databook_기교1팀_260507_박정규_완료.xlsm`

구조:
```
normalize_personal.py
├── find_header_row(ws, max_scan=50) → int
├── filter_by_rep(ws, header_row, rep_name) → list[dict]
├── validate_schema(rows, header_sig) → WARN/ABORT
└── write_csv(rows, out_path)
```

출력: `work/normalized/기교1팀/박정규.csv`

**P1.2: 검증 게이트 G1.a**

- 박정규 파일에서 추출된 본인 행수 = **117** (personal_stats.json 실측치)
- 비교 방법: 출력 CSV 행수 카운트

---

### 의존 그래프

```
[P1.0: 5개 schema 즉시 작성]
  └─→ [P1.0: anomaly_thresholds.json] ← M1 Master 확인 대기
        ↓ (M1 해소 또는 빈 파일로 우선 작성)
[P1.0 완료]
  └─→ [P1.1: normalize_personal.py 작성]
        └─→ [G1.a: 박정규 행수 117 확인]
              └─→ [P1.1 완료 → P1.2 이후 확장]
```

M1 미결이더라도 `anomaly_thresholds.json`을 빈 구조체 `{}` + comment로 선착수 가능:
```json
{
  "_note": "M1 미결 — Master 확인 필요. %·절댓값 기준 정의 후 채워넣기.",
  "week_over_week_percent": null,
  "week_over_week_absolute": null
}
```

---

### 검증 게이트

| 게이트 | 통과 기준 | 실패 시 |
|---|---|---|
| G0 (schema 동결) | 6개 JSON 파일 JSON 스키마 유효, `closed_months` 값 = `[1,2,3]` | 재작성 |
| G1.a (박정규 추출) | CSV 행수 = 117 (personal_stats.json 실측치) | 헤더 탐지 로직 재검토 |
| G1.a-2 (G열 필터) | 모든 행의 `26년 영업대표` 컬럼 값 = "박정규" | 필터 조건 재확인 |

---

### 롤백 경로

- P1.0 schema 잘못 작성 → JSON 파일 덮어쓰기 (버전 관리 불필요, 선언적 파일)
- P1.1 코드 오류 → normalize_personal.py 수정 재실행 (CSV 덮어쓰기)
- 중간 산출물은 모두 `work/` 하위 — 입력 원본 파일 불변 보장

---

### 중단 조건

| 조건 | 우선순위 |
|---|---|
| FS1팀 xlsb — `'26년 databook(취합)'` 시트 없음 (P0 실측에서 시트 목록 불일치) | 🔴 P1.1 FS1팀 착수 전 재확인 필수 |
| 헤더 50행 스캔 실패 (ABORT 게이트) | 🔴 즉시 중단 |
| G열 컬럼 위치 확인 불가 (헤더 텍스트 "26년 영업대표" 미발견) | 🔴 즉시 중단 |

---

## 3. 리스크 예고 (Riki에게 넘길 항목)

**R-5: FS1팀 xlsb 시트명 불일치 위험 (🔴)**
- P0.4 실측에서 FS1팀 xlsb의 시트 목록 = `['25Pivot', '수주리스트', '20250507']`
- `'26년 databook(취합)'` 시트명 미확인 — 팀 파일 SOT임에도 데이터 접근 경로 미정
- Mitigation: P1.1 착수 전 별도로 FS1 완료 파일(`★2026년_databook_FS1팀_260507_완료.xlsb`) 시트명 재확인
- Fallback: pyxlsb로 시트 목록 출력 후 "취합" 부분 일치 매칭으로 동적 탐지

**R-6: 헤더 텍스트 줄바꿈(\\n) 정규화 불일치 위험 (🟡)**
- GI1팀 실측 헤더에 `\n` 포함: `"24년 \n담당팀"`, `"26년 영업대표\n(as_is)"`
- canonical 헤더(p0_5_8.json)는 공백 포함 단일 라인 텍스트
- 비교 시 정규화 전처리(strip + \n→공백) 없으면 매칭 실패
- Mitigation: header_signature.json에 `normalize_whitespace: true` 플래그 + 탐지 코드에서 전처리 필수

**R-7: G열 = C7 위치 변동 위험 (🟡)**
- G열(7번째 컬럼) = "26년 영업대표 (현재담당자)" — canonical C7
- 팀별 컬럼 위치 고정 가정 시 위험 (L4 레슨런: 열 번호 매핑 절대 금지)
- Mitigation: 헤더 텍스트 기반 컬럼 인덱스 동적 탐지 (열 번호 하드코딩 금지)

**R-8: 변경 없음 .txt 파일 포함 시 코드 crash 위험 (🟡)**
- 기교1팀 폴더에 `변경 없음_이재성.txt`, `변경 없음_조미희.txt` 존재
- 폴더 전체 순회 시 .xlsm/.xlsx/.xlsb 확장자 외 파일 처리 시도 → 오류
- Mitigation: 확장자 화이트리스트 필터링 + txt 파일 발견 시 SKIP + 미제출자 목록 별도 기록

**R-9: 개인 파일 내 기교1팀 전체 1,052행 처리 부하 (🟢)**
- openpyxl이 xlsm(xlsm = zip+xml) 파일 로드 시 전체 워크북 메모리 적재
- 1,052행 × 58열 규모는 부하 미미 — 실질 위험 낮음
- Mitigation: read_only=True 모드 사용으로 메모리 최소화 (openpyxl 지원)

---

## 4. 즉시 착수 가능 여부 판단

### 착수 가능 항목 (이번 세션)

| 항목 | 가능 여부 | 근거 |
|---|---|---|
| P1.0: 5개 schema JSON 작성 | ✅ 즉시 | 데이터 소스 확보 완료 |
| P1.0: anomaly_thresholds.json 뼈대 작성 | ✅ 빈 구조체 | M1 대기 중이나 구조 선박제 가능 |
| P1.1: normalize_personal.py 작성 | ✅ 즉시 | 개인 파일 존재 + 라이브러리 설치 완료 |
| G1.a: 박정규 117행 검증 실행 | ✅ 즉시 | 기준값 확정 (personal_stats.json) |

### 막히는 지점

| 항목 | 막힘 내용 | 해소 방법 |
|---|---|---|
| M1: anomaly_thresholds.json 완성 | Master 기준 미정 (% 또는 절댓값?) | 이번 세션에 Master 확인 후 채우기 |
| FS1팀 xlsb 시트명 | P0 실측에서 `'26년 databook(취합)'` 미확인 | P1.1 FS1팀 확장 전 별도 탐지 코드 실행 |

### 권고 순서

```
Step 1: schema 디렉토리 생성 + 5개 JSON 즉시 작성 (anomaly는 빈 구조체)
Step 2: normalize_personal.py 작성
Step 3: 박정규 파일 실행 → 117행 G1.a 검증
Step 4: (병렬) Master에 M1 확인 → anomaly_thresholds.json 완성
```

---

## 자기감사 (1차)

### 1차 감사 — 발견 4개 / 4축 × 3지점 이상 검사 / ROI 라벨 의무

**structuration 축**
1. `normalize_personal.py` 단일 파일에 헤더 탐지·필터·CSV 출력 혼재 설계 → 함수 분리 필수 `MUST_NOW`
2. schema 파일 경로 하드코딩 위험 — config 최상위 JSON에서 경로 읽기 `MUST_NOW`
3. `work/` 출력 경로 하드코딩 위험 — 실행 인자 또는 config 분리 `MUST_BY_N=10`

**hardcoding 축**
1. G열 = 7번째 컬럼 위치 하드코딩 금지 → 헤더 탐지 후 동적 획득 `MUST_NOW`
2. `\n` 정규화 없이 헤더 매칭 시 실패 → strip+정규화 전처리 `MUST_NOW`
3. xlsm 확장자만 처리 → xlsx/xlsb 분기 처리 포함 `MUST_BY_N=10`

**efficiency 축**
1. openpyxl read_only=True 미사용 시 대형 파일 메모리 낭비 `SHOULD`
2. 전체 행 로드 후 필터 vs 스트리밍 필터 — 현 규모(1천 행)는 차이 없음 `NICE`
3. schema JSON 매번 파일 재독 → 프로세스 내 캐시 `NICE`

**extensibility 축**
1. 7팀 확장 시 `team_rules.json` 수정만으로 처리 가능한 구조인가 → splitValues 외재화로 해결 `MUST_NOW`
2. 마감월 추가 시 `closed_months.json` 1개 숫자 추가만으로 처리 가능한가 → 헤더 교차 검증 포함 `MUST_NOW`
3. 미제출자(.txt) 처리 확장성 — 현재 SKIP만, 향후 전주 파일 참조 로직 연결 `DEFER`

**자기감사 결론:** MUST_NOW 5건 — P1.1 코드 작성 시 반드시 반영. 설계 spec 동결 전 Dev에 인계.

---

[ROLE:arki]
# self-scores
aud_rcl: 0.85
str_fd: 4
spc_lck: N
sa_rnd: 1
