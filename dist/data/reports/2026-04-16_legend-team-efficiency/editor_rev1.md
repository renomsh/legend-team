---
session: session_023
topic: legend-team 효율화
date: 2026-04-16
roles: ace, arki, fin, riki
status: closed
---

# legend-team 효율화 — session_023

## 1. 배경 및 목표

세션 I/O 비용 점검: `/open` 시 매번 ~700줄을 로드하나 실제 사용 비율은 낮음. 과거 이연 항목의 체계적 추적 부재. 이를 해소하는 구조 개선.

## 2. 실측 분석 — 최근 10개 세션 결정 참조 분포

| 항목 | 실측값 |
|------|--------|
| 보고서 내 D-NNN 소급 인용 | **0건** (10개 세션 전체) |
| D-NNN 기록 세션 | 3개 (session_018~020, 모두 당해 세션 생성 결정) |
| 세션당 평균 신규 결정 | 0.6개 |
| 이연 체인 최대 길이 | 2세션 |
| decision_ledger 실사용률 | ~15% (243줄 로드 대비 실제 참조 ~35줄) |
| session_index 실사용률 | ~1% (162줄 로드 → 숫자 1개 추출) |

**결론:** 과거 결정은 CLAUDE.md·role memory에 내재화됨. 전체 로드 불필요. recentDecisions 5개로 충분.

## 3. 구현 완료 항목

### 신설 파일

| 파일 | 역할 |
|------|------|
| `memory/shared/system_state.json` | fast-path 단일 파일. nextSessionId, openTopics, recentDecisions(5), pendingDeferrals 포함 |
| `memory/shared/topic_load_manifest.json` | 토픽 타입 6종 + keywords → loadMemory 매핑 |

### 개정 파일

| 파일 | 변경 내용 |
|------|----------|
| `.claude/commands/open.md` | 3단계 구조: Stage1 fast-path → Stage2 타입별 로드 → Stage3 이연 List-up + 세션 오픈 |
| `.claude/commands/close.md` | 9단계 d항: editor 보고서 이연 섹션 자동 추출 → pendingDeferrals 기입 |
| `CLAUDE.md` | Session Start 체크리스트 → system_state fast-path 방식으로 교체 |
| `config/project.json` | v0.5.0 → v0.8.0. v0.6.0·v0.7.0 changelog 소급 추가 |

### 효과

| 항목 | 변경 전 | 변경 후 |
|------|---------|---------|
| /open 로드 파일 수 | 5~6개 | 2개 |
| 세션당 읽기 줄 수 | ~700줄 | ~50줄 |
| 이연 항목 추적 | 없음 | pendingDeferrals 자동 List-up |
| role memory 로드 | 미정의 | 토픽 타입별 선택 (1~3개) |

## 4. 현재 pendingDeferrals 현황

| ID | 항목 | 출처 |
|----|------|------|
| PD-001 | 과거 토픽 19개 타입 레이블링 | session_023 (이번 세션 이연) |
| PD-002 | 토픽 유형별 역할 호출 세그먼트 설계 | session_013 |
| PD-003 | EduAgent 파일럿·LLM 선택·감수 인력 결정 | session_014 |
| PD-004 | 데이터북 Agent 프로토타입 구현 | session_015 (topic_012 suspended) |

## 5. 이연 항목

- **PD-001**: 과거 토픽 19개 타입 레이블 부여 — 다음 세션에서 처리. topic_load_manifest 기준 검증 겸.
- **새 구조 검증**: 다음 /open이 system_state fast-path 첫 실제 실행 케이스.

## 6. Ace 레슨런

- "분류기준이 필요하다"는 Ace의 과잉 설계였음. Editor 보고서에 이미 이연 섹션이 명시되어 있어 추가 판단 불필요. Master 지적으로 수정.
- 효율화 달성 선언은 첫 사이클 실측 후. "설계 완료"와 "효율화 달성"은 다름.
