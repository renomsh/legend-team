---
role: arki
topic: alarm-analysis-resolution
date: 2026-04-22
rev: 1
---

# Arki — 알람 규칙 재설계 구조 분석

## 1. 기술적 성립 여부 (Ace 🔴 전제 검증)

**전제 1 (`rolesRecalled` 정확 기록):** 부분 성립. `compute-dashboard.ts` 296~297줄에서 `rolesRecalled`는 `roleStats.recalled` 합계로 계산되는데, 이는 Turn[] 기반(D-048)이므로 legacy 세션(turns 없음)은 0으로 찍힌다. 즉 R1 경보는 **non-legacy 세션에 한해서만 유의미**. legacy 세션이 R1 경보에 포함되지 않는 것은 이미 구조적으로 보장됨.

**전제 2 (`extractKeywords` stop words 없음):** **반증됨.** 182~189줄 확인 결과 한국어 조사 stop words(`이/가/은/는/을/를/의/에/로/으로/와/과/및/또는/그리고`)는 이미 존재. 다만 Ace가 언급한 `"Ace"/"Master"/"역할"/"데이터"/"이번에"` 같은 **메타/도메인 고빈도어는 누락**. 전제는 "stop words 전무"가 아니라 "도메인 stop words 부재"로 정정 필요.

부가 발견: `slice(0, 5)` — 피드백당 상위 5개만 채택. 즉 stop words를 추가하면 채택되는 유효 키워드가 늘어나 **오히려 다른 재발이 드러날 수도** 있다(양면 효과).

## 2. 프로토콜 호환성

**R1 (rolesRecalled >= 2):**
- 의존: Turn[] 프로토콜(D-048) + dispatch_config. Grade A/S 오케스트레이션은 "Ace 종합검토" 재호출을 정상 동작으로 포함 → R1 임계값은 Grade-blind 상태.
- 충돌 지점: 임계값만 올리면(`>=5`) Grade C 세션의 비정상 재호출을 탐지 못함. Grade별 다른 임계값이 본질.

**R2 (masterTurns > avg×1.5):**
- 의존: `avgMasterTurns`는 전 세션 기준 단일 스칼라(336~338줄). session_017~034 고토큰 시절 값이 avg를 고정적으로 끌어올림.
- 충돌 지점: 평균이 과거 분포의 꼬리를 포함 → 최근 세션 어떤 값도 상대적으로 낮게 평가됨(=노이즈). 롤링 윈도우는 단순 교체이나 **출력 스키마의 `metrics.avgMasterTurns`를 롤링 기준으로 바꾸면 대시보드 다른 패널도 영향받음** — 전역 평균과 경보 평균을 분리해야 안전.

**R5 (keyword 3회+):**
- 의존: `feedbackLog.entries` + `extractKeywords`. 다른 경보와 독립적.
- 충돌 지점: 없음. stop words 추가는 다른 규칙에 파급 없음.

## 3. 설계 옵션 — 규칙별 독립성 판정

**핵심 답: 세 규칙은 거의 독립이다.** 공유하는 상태는 (a) `sessions[]` 배열 자체, (b) `avgMasterTurns` 스칼라뿐. R1과 R2는 같은 루프(358~371줄)에 있을 뿐 로직 의존 없음. R5는 별도 루프. **한 번에 하나씩 바꿀 수 있다.** 단 R2 롤링 적용 시 `metrics.avgMasterTurns`의 의미 변경 여부만 주의.

### R1 설계 옵션
- **옵션 A (완전 폐기):** 한 줄 삭제. Grade A/S 정상 재호출 신호 소실 감수. 단순.
- **옵션 B (Grade 조건부 임계값):** `if (s.gradeActual === 'C' && s.rolesRecalled >= 2) || (s.gradeActual === 'B' && s.rolesRecalled >= 3) || (['A','S'].includes(s.gradeActual) && s.rolesRecalled >= 5)`. Grade별 차등. 코드 1~2줄. **권고.**
- **옵션 C (recallReason 기반):** Turn[]의 `recallReason`이 `post-master`/`post-intervention`으로 편중된 세션만 경보. 가장 의미론적이나 집계 로직 신설 필요(복잡도 중).

### R2 설계 옵션
- **옵션 A (롤링 윈도우만):** 최근 20세션 기준 avg 재계산 후 ×1.5. 단순. `metrics.avgMasterTurns`는 전역 유지, R2 내부에만 `recentAvgMasterTurns` 지역 변수. **권고.**
- **옵션 B (Grade 조건):** Grade A/S 세션은 masterTurns 원래 크므로 제외 or 별도 임계값. 롤링과 결합 가능.
- **옵션 C (절대 임계값):** `masterTurns > 40`처럼 고정. 과거 avg에 오염되지 않으나 체제 변화 민감도 없음.

### R5 설계 옵션
- **옵션 A (도메인 stop words 추가):** `Ace/Master/Arki/Fin/Riki/Editor/역할/데이터/세션/이번/우리/방식/구조` 등 메타/조직어 추가. `slice(0,5)` 유지. **권고.**
- **옵션 B (최소 길이 3자):** `length >= 2`를 `>= 3`으로. 한국어 2자 의미어(예: "평가", "검증") 배제되는 부작용 — 비권고.
- **옵션 C (TF-IDF형 가중):** 전체 피드백 분포 기준 저변별력 단어 제외. 정확하나 구현 복잡도 높음(새 루프 2개 필요) — Out 범위 신설에 가까움.

## 4. 경계 조건 (설계가 깨지는 조건)

- **R1-옵션 B:** Grade 누락 세션(레거시) 시 `gradeActual` 기본값(`C`)으로 빠지면 과탐. 현재 스키마상 `gradeActual`은 항상 채워지지만, `dataQuality='legacy'` 세션은 rolesRecalled=0이라 자연 배제되므로 실질 안전.
- **R2-옵션 A:** 전체 세션 수가 20 미만이면 롤링=전역. 구현 시 `sessions.slice(-20)` 가드.
- **R2-옵션 A:** 롤링 평균이 과거 평균보다 낮아지므로 **과거 session_017~034 경보는 이전보다 더 많이 찍힐 수 있다**. Master 관심사가 "최근 세션 노이즈 감소"라면 경보 집계도 `sessions.slice(-N)`으로 제한 필요.
- **R5-옵션 A:** stop words를 과도하게 넣으면 `slice(0,5)`로 의미 키워드가 밀려 재발 탐지 공백 발생. 추가 단어는 **실측 빈도 상위 N개로 근거 기반** 선정 권고.
- **공통:** `metrics.avgMasterTurns` 의미 변경 시 대시보드 뷰어/다른 skill 참조처 점검 필요. 현재는 단일 전역 스칼라이므로 **경보용 롤링을 지역 변수로 격리**하는 편이 안전.

## 권고 요약

- R1: 옵션 B (Grade 조건부 임계값)
- R2: 옵션 A (롤링 윈도우, 지역 변수로 격리하여 기존 `metrics.avgMasterTurns` 의미 보존)
- R5: 옵션 A (도메인 stop words 추가, 실측 빈도 상위 기반 선정)

세 변경은 독립 패치로 개별 검증 가능. 단일 PR에 묶더라도 함수/블록 단위로 분리 리뷰 가능한 구조.
