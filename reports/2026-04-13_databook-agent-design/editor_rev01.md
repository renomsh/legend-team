---
role: editor
topic: databook-agent-design
session: session_015
revision: 1
date: 2026-04-13
status: final
participants: [nova, arki, fin, riki, ace]
---

# 데이터북 Agent 설계 — 세션 기록

## 세션 개요

| 항목 | 내용 |
|------|------|
| 세션 | session_015 |
| 토픽 | 데이터북 Agent 설계 |
| 모드 | Observation (전원 참석) |
| 발언 순서 | Nova → Arki → Fin → Riki → Ace |
| 날짜 | 2026-04-13 |

## 배경

주간 데이터북 취합 업무(매주 목요일)를 자동화하는 이식형 Claude Code 에이전트 설계.
최종 산출물: `26년 Databook(취합)` 시트 — 기업별 매출액 데이터 (7,797건, 53열).
레전드팀은 설계 + 프로토타입까지 담당. 실운영은 기본 Claude Code 설치 PC에 이식.

## 핵심 확정 사항

| # | 항목 | 결정 |
|---|------|------|
| 1 | 에이전트 유형 | 폴더 기반 배치형 (초기 대화형) |
| 2 | 런타임 | Claude Code CLI + Python/openpyxl + pyxlsb |
| 3 | 스코프 | 26년 Databook(취합) 시트 + index + 유효성검사 시트 |
| 4 | 파이프라인 | 5단계: 준비→정규화→취합→검증→최종화 |
| 5 | 검증 방식 | 피벗 제거 → Markdown 검증 리포트 |
| 6 | 서식 보존 | 템플릿 복사 + 값만 덮어쓰기 (openpyxl 서식 파괴 방지) |
| 7 | 자율수정 | 초기 전건 확인, 승인 패턴 축적 후 자율 확대 |
| 8 | FS3GS팀 | 파일 1개로 통합 |
| 9 | .xlsb 대응 | 휴먼이 .xlsx 변환 후 input/ 투입 |
| 10 | 병행 운영 | 1~3개월 |
| 11 | 상태 관리 | work/status.json |

## 실제 데이터 구조 확인 결과

| 항목 | 값 |
|------|-----|
| 총 행수 | 7,797건 |
| 총 컬럼수 | 53열 (A~BA) |
| 팀 구성 | GS(2744), 기교1(1049), FS3(991), FS1(970), 기교3(737), 기교2(695), FS2(611) |
| 예상매출합계 | ~1,195억원 |
| 월별 패턴 | 마감월: 예상+매출+사유 3열 / 미마감월: 예상+사유 2열 |
| 팀 파일 포맷 | .xlsb (바이너리) — pyxlsb 필요 |
| 헤더 위치 | 팀별 상이 (FS1팀: row 20, 취합본: row 3) — 자동탐지 필요 |

## 역할별 핵심 발언 요약

### Nova
- 배치형 에이전트 제안 (Master 동의)
- 5개 질문: MCP 여부, 파일 포맷, 검증 기준, 주기, 고통점
- Master 답변으로 설계 방향 확정

### Arki
- 폴더 구조 + 5단계 파이프라인 + 검증 리포트 설계 (rev01.md 작성)
- 실제 컬럼 스키마 53열 전수 확인
- Riki 지적 수용: 템플릿 복사 방식, 헤더 자동탐지, work/status.json
- D2 아키텍처 다이어그램 생성: `architecture_d2.svg`, `architecture_d2.png`

### Fin
- 주당 4~5시간 절감 (현재 5~7시간 → 45분~1.5시간)
- 연간 ~200시간 절감
- 초기 4~6주 신뢰 구축 기간 비용 경고

### Riki
- F1: openpyxl 서식 파괴 → 템플릿 복사 방식으로 해결
- A2: 헤더 위치 하드코딩 위험 → 자동탐지 필요
- F3: 자율수정 범위 → 초기 전건 확인으로 Master 결정
- E1: 단계 간 상태 관리 → work/status.json으로 설계 해결

### Ace
- 에이전트 본질: "Excel 매크로 대체"가 아닌 "정규화 + 검증 리포트"
- 프로토타입 성공 기준: 정규화 정확도 + 검증 리포트 신뢰도
- .xlsb 포맷 + 컬럼 구조 차이(FS1 팀 파일 55열, 취합본 53열) 발견
- 다음 세션 목표: 7개 팀 파일 전수 조사 → canonical 스키마 확정

## 생성 산출물

| 파일 | 설명 |
|------|------|
| `arki_rev01.md` | Arki 아키텍처 설계서 |
| `architecture.d2` | D2 다이어그램 소스 |
| `architecture_d2.svg` | 벡터 다이어그램 (브라우저 확대 가능) |
| `architecture_d2.png` | 래스터 다이어그램 |
| `architecture.mmd` | Mermaid 초기 다이어그램 (deprecated) |
| `architecture.png` | Mermaid 렌더 (deprecated) |

## 다음 세션 작업 항목

1. **7개 팀 파일 전수 투입** — input/ 폴더에 모든 팀 .xlsx 파일 준비
2. **canonical 스키마 확정** — config/schema.json 정의
3. **팀별 매핑 정의** — config/teams.json + 팀별 컬럼 매핑
4. **normalize.py** — 정규화 스크립트 구현 + dry-run
5. **merge.py + validate.py** — 취합 및 검증 스크립트
