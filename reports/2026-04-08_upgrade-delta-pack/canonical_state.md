---
title: "2팀 Canonical State — 현재 운영 기준서"
type: canonical_state
version: "2팀 현재 (2026-04-08 기준)"
baseline_ref: "1팀 v0.4.0 복사본 (commit 7869f06)"
generated_for: "1팀 병합 검토"
generated_at: "2026-04-08"
---

# 2팀 Canonical State

> 이 문서는 "지금 2팀이 어떻게 운영되는가"를 한 번에 볼 수 있도록 정리한 현재 기준서다.
> 역사 요약이 아니라 현재 상태의 스냅샷이다.
> 각 섹션에 변경 발생 시점(Decision ID 또는 날짜)을 함께 표기한다.

---

## 1. 에이전트 정의 현재본

| 역할 | 권한/책임 | 상태 | 변경 이력 |
|------|-----------|------|-----------|
| **Ace** | 전략 총괄. 토픽 프레이밍, 결정 축 설계, 스코프 정의, 전체 역할 오케스트레이션. 종합검토(5단계) 수행 — 모든 역할 발언 교차검토 후 Master에게 최종 권고 제출. | Active | 오케스트레이션 집중 원칙 명문화 (FB-008) |
| **Arki** | 구조 분석가. 구조, 의존성, 설계 제약 분석. 실행형 토픽에서도 구조 탐색/스키마/매핑 확정 담당. | Active | 실행형 토픽 역할 확장 (D-021, FB-012) |
| **Fin** | 재무 분석가. 비용, 수익, 리소스 평가. | Active | 변경 없음 |
| **Riki** | 리스크 분석가. 실패 모드, 가정 감사, 모순 노출. 실행형 토픽에서도 검증 참여. | Active | 실행형 토픽 역할 확장 (D-021) |
| **Editor** | 산출물 컴파일러. Ace 종합검토 완료 후 최종 문서 작성/정리/출력만 담당. 독립적 종합 또는 판단 금지. 실행형 토픽에서 실행 후 검증(헤더, 컬럼, 건수) 담당. | Active | synthesis 책임 제거, 실행형 토픽 검증 역할 추가 (D-009 계승, D-021) |
| **Nova** | 투기적 사고. Master 명시 요청 시에만 호출. 발언 후 출력은 주 분석과 분리 유지. Master가 명시적으로 승격하지 않는 한 권위 없음. | Speculative | 정책 변경 없음 (D-005 계승) |

---

## 2. 역할/권한 현재본

### 발언 순서 (Observation Mode 기본)
```
1. Ace       — 프레이밍, 결정 축, 스코프, 핵심 가정
2. Arki      — 구조 분석, 의존성, 설계 제약
3. Fin       — 비용, 수익, 리소스 평가
4. Riki      — 실패 모드, 가정 감사, 모순, 실행 왜곡, 기각 논리
5. Ace(종합검토) — 모든 역할 출력 교차검토, Master에게 최종 권고
6. Editor    — 산출물 컴파일, 포맷, 출력 전담
```
Nova는 기본 포함 안 함. Master 명시 요청 시 Riki 후, Editor 전 삽입.

### 역할 생략 규칙 (D-021 추가)
- 역할 생략 시 반드시 사전 Master 보고 필요
- 편집/정리 작업(반복 SOP) = Ace + Editor 최소 구성 허용
- 실행형 토픽 = Arki 구조확정 필수. 생략 금지.

### 권한 계층
```
Master 피드백 > Ace 종합검토 > 개별 역할 출력
```
- Master 피드백은 모든 에이전트 출력보다 우선
- 어떤 에이전트도 Master 지시를 무시하거나 덮어쓸 수 없음

---

## 3. 토픽 운영 프로토콜 현재본

### 전략형 토픽 (기본)
```
Ace 프레이밍
  └→ Arki 구조분석
    └→ Fin 재무평가
      └→ Riki 리스크
        └→ [Nova — Master 요청 시만]
          └→ Ace 종합검토
            └→ Editor 산출물
```
각 단계 후 Master가 개입 가능. Master 지시 없으면 다음 단계로 자동 진행.

### 실행형 토픽 (D-021 신규 — 2026-04-08)
```
Ace 프레이밍 + 실행계획서 초안 (스키마/매핑/예외처리 명시)
  └→ Arki 구조확정 (필수 — 생략 불가)
    └→ [Fin/Riki — Master 판단으로 생략 가능, 사전 보고 필수]
      └→ Ace 종합검토 + 실행계획서 최종본 제출
        └→ Master 승인
          └→ Editor 실행
            └→ Editor 검증 (헤더값, 컬럼 오매핑, 건수 불일치 확인)
```

### 반복 SOP 토픽
```
첫 세션: Ace SOP 수립 → memory/sop/{topic-slug}.md 저장
이후 세션: Ace + Editor 최소 구성으로 실행
```

### Conversation Modes
- **Observation Mode** (기본): 각 역할 순차 발언, Master 응답 가능
- **Compressed Mode**: 전체 역할 내부 실행, Master에게 역할별 요약 단일 응답
- **Report Mode**: 전체 역할 내부 실행, Editor만 최종 문서 출력

---

## 4. 종료/저장/반영 프로토콜 현재본

### 세션 종료 체크리스트 (현재 CLAUDE.md 기준 8항목)

```
1. 모든 에이전트 출력 저장: reports/{YYYY-MM-DD}_{topic-slug}/{role}_rev{n}.md
2. 새 결정사항 추가: memory/shared/decision_ledger.json
   ⚠️ 스크립트 전용(add-decision.ts). Claude 직접 편집 금지 (D-024)
3. 토픽 상태 업데이트: memory/shared/topic_index.json
   ⚠️ 스크립트 전용(update-topic.ts). Claude 직접 편집 금지 (D-024)
4. current_session.json 업데이트: status="closed", closedAt 기록
5. 마스터 피드백 추가: memory/master/master_feedback_log.json (있는 경우)
6. 역할 메모리 업데이트: memory/roles/{role}_memory.json (새 패턴/발견)
7. 세션 이벤트 로그: ts-node scripts/session-log.ts end {topic-slug}
8. 로컬 commit: node scripts/auto-push.js "session end: {topic-slug}"
```

**D-023 미반영 항목 (결정은 확정됐으나 CLAUDE.md 미업데이트):**
- project_charter.json 버전 업데이트를 필수 체크리스트 항목으로 추가 예정

항목 누락 시 → memory/sessions/current_session.json의 gaps 필드에 기록

### 리포트 경로 규칙
```
reports/{YYYY-MM-DD}_{topic-slug}/{role}_rev{n}.md
```
- 덮어쓰기 금지. 개정 시 rev 번호 증가
- frontmatter 필수: role, report_status, session_status

---

## 5. 저장 규칙 현재본

### 파일 분류

| 파일 | 경로 | 편집 방법 | 비고 |
|------|------|-----------|------|
| topic_index.json | memory/shared/ | 스크립트 전용 (D-024) | Claude 직접 편집 금지 |
| decision_ledger.json | memory/shared/ | 스크립트 전용 (D-024) | Claude 직접 편집 금지 |
| project_charter.json | memory/shared/ | Claude 직접 편집 가능 | 버전 canonical 소스 (D-022) |
| evidence_index.json | memory/shared/ | Claude 직접 편집 또는 log-evidence.ts | 삭제 금지, status 변경만 |
| glossary.json | memory/shared/ | Claude 직접 편집 | 최신 정의가 canonical |
| current_session.json | memory/sessions/ | Claude 직접 편집 | 세션 시작/종료 시 갱신 |
| master_feedback_log.json | memory/master/ | Claude 직접 편집 | 피드백 추가 시 |
| role_memory.json | memory/roles/ | Claude 직접 편집 | 패턴/발견 추가 시 |

### memory/ git tracking 정책 (D-012)
- memory/ 디렉토리는 .gitignore 등록 (git tracking 해제)
- 각 worktree에서 공유 memory로 junction 연결 필수
- 신규 worktree 생성 시 junction 재생성 체크리스트 확인 필요

### 버전 canonical 소스 (D-022)
- **Primary**: memory/shared/project_charter.json (canonical)
- **Deprecated**: config/project.json의 version 필드 (_version_note로 대체)
- viewer는 project_charter.json만 읽음

---

## 6. 출력 규칙 현재본

### 리포트 frontmatter 스키마
```yaml
---
role: {ace|arki|fin|riki|editor|nova}
report_status: {draft|final}
session_status: {in-progress|closed}
topic_slug: {slug}
date: {YYYY-MM-DD}
revision: {n}
---
```

### evidence_index.json 운용
- 기록 주체: 주로 Riki, Arki, 세션 정비 시 운영자
- 기록 시점: 역할 발언 중 핵심 발견 또는 세션 종료 후 소급 허용
- 필수 필드: id(E-NNN), date, topic, type, source, finding, status
- type 값: structural-diagnosis | principle-violation | risk | assumption | data-error | operational-gap | legacy-ambiguity
- status 값: open | resolved-{context} | accepted-residual-risk
- **삭제 금지**: status 변경만 허용

### glossary.json 운용
- 새 용어 사용 또는 정의 필요 시 추가
- 필수 필드: term, definition, addedBy, date
- 정의 변경 시 덮어쓰기 허용 (최신 정의가 canonical)
- 한국어 우선, 영어 병기 허용

---

## 7. 검증 규칙 현재본

### JSON 파일 무결성
- topic_index.json / decision_ledger.json: 스크립트 전용 편집 (D-024)
  - 위반 시 JSON 파싱 오류 발생 위험
  - 스크립트(update-topic.ts, add-decision.ts)는 전체 파일 읽기 후 writeJson으로 재작성

### 리포트 frontmatter 검증
- validate-output.ts로 검증 가능
- frontmatter 필수 필드 누락 시 invalid

### 실행형 토픽 결과 검증 (D-021, Editor 담당)
- 헤더값 오매핑 확인
- 컬럼 불일치 확인
- 건수 불일치 확인
- 중복 탐지

---

## 8. 인계 규칙 현재본

### 세션 시작 체크리스트
```
1. memory/sessions/current_session.json 읽기 — 토픽·모드 확인
2. memory/shared/topic_index.json 읽기 — 오픈/진행 중 토픽 확인
3. memory/shared/decision_ledger.json 읽기 — 기존 결정 로드 (에이전트 발언 전)
4. 새 세션이면 current_session.json에 세션ID·토픽 업데이트
```

### 역할 메모리 인계
- 세션 종료 시 새 패턴/발견 → memory/roles/{role}_memory.json 업데이트
- 다음 세션 시작 시 역할 메모리 참조하여 문맥 복원

### 스크립트 상태
| 스크립트 | 상태 | 역할 |
|----------|------|------|
| session-log.ts | Active | 세션 시작/종료 + 체크리스트 검증 |
| validate-output.ts | Active | 리포트 frontmatter 검증 |
| auto-push.js | Active | 로컬 commit (push 없음) |
| build.js | Active | 뷰어 빌드 |
| create-topic.ts | Utility | 토픽 생성 |
| apply-feedback.ts | Utility | 피드백 적용 |
| log-evidence.ts | Utility | 증거 기록 |
| add-decision.ts | Utility | 결정 추가 (스크립트 전용 편집 경로) |
| update-topic.ts | Utility | 토픽 업데이트 (스크립트 전용 편집 경로) |
| run-debate.ts | **Deprecated** | debate_log.json 기반, 사용 중지 |
| generate-dashboard.ts | **Deprecated** | build.js로 대체 |
| build-report.ts | **Deprecated** | run-debate.ts 의존, 사용 중지 |

---

## 9. 현재 토픽 상태 요약

| ID | Slug | 상태 | 주요 결과 |
|----|------|------|-----------|
| topic_001 | shared-asset-protocol | closed | shared asset 조회 프로토콜 설계 |
| topic_002 | local-only-setup | closed | CF Pages 제거, localhost:8090 전용 설정 |
| topic_003 | brownbag-minutes | closed | SOP 수립, B방식 확정 |
| topic_004 | legend-team-logic-check | closed | memory junction 적용, D-012/D-013 등록 |
| topic_005 | ai-teammate-orchestration-slack | **suspended** | Phase 1 Part 1 완료, Part 2 미진행 |
| topic_006 | haenggyeongdae-list | closed | 1,042명 통합, CLAUDE.md v0.5.0 추가 |
| topic_007 | dashboard-version-check | closed | 뷰어 버그 수정, D-022~D-024 등록 |

---

## 10. 알려진 현재 갭

| 갭 | 설명 | 위험도 |
|----|------|--------|
| session_005 미종료 | current_session.json status="open", topic_007은 "closed" — 불일치 | 낮음 |
| config/project.json 버전 스태일 | v0.2.0 표기, 실제 charter는 v0.3.0 | 낮음 (D-022로 canonical 전환됨) |
| D-023 CLAUDE.md 미반영 | project_charter.json 버전 업데이트 체크리스트 항목 결정됐으나 미삽입 | 중간 |
| CLAUDE.md Script Status 불일치 | "build.js — CF Pages 빌드 (canonical)" 표기이나 D-011로 로컬 전용 결정 | 낮음 (기능 이상 없음, 설명 오해 소지) |
