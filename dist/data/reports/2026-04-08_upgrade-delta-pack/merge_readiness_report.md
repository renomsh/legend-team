---
title: "1팀 병합 전 최종 판정 문서"
type: merge_readiness_report
generated_at: "2026-04-08"
baseline: "1팀 v0.4.0"
source: "2팀 session_001~005 진화 결과"
---

# 병합 준비 상태 보고서

---

## 1. 바로 병합 가능한 항목 (Ready)

다음 항목들은 선행 작업 없이 즉시 1팀에 적용 가능하다.

### R-001: JSON 스크립트 전용 편집 규칙 (DX-004, MA-005)
- **조건**: 1팀에 update-topic.ts, add-decision.ts 스크립트 존재
- **적용**: CLAUDE.md 규칙 섹션에 1줄 추가
- **검증**: 다음 세션에서 에이전트가 스크립트를 통해 파일 편집하는지 확인
- **리스크**: 없음

### R-002: Ace 오케스트레이션 집중 원칙 (DX-008, MA-008)
- **조건**: 없음
- **적용**: agents/ace.md 또는 CLAUDE.md 역할 설명에 2~3줄 추가
- **검증**: 다음 토픽에서 Ace 발언이 직접 답변이 아닌 위임 방식인지 확인
- **리스크**: 없음

### R-003: 기획형 토픽 업무 정의 선행 원칙 (DX-009, MA-009)
- **조건**: 없음
- **적용**: CLAUDE.md 또는 agents/ace.md에 원칙 추가
- **리스크**: 없음

### R-004: Master 발언 과잉 해석 금지 (DX-008 부분, MA-010)
- **조건**: 없음
- **적용**: CLAUDE.md Rules 섹션에 1줄 추가
- **리스크**: 없음

---

## 2. 선행 작업이 필요한 항목 (Conditional)

### C-001: 실행형 토픽 프로토콜 (DX-001, MA-001)
- **선행**: MA-002(토픽 유형 분류표) 동시 추가 필요
  - 분류표 없이 MA-001만 추가하면 SOP 토픽과 실행형 토픽 구분 기준이 없어 에이전트 혼동 발생
- **적용**: CLAUDE.md에 실행형 토픽 서브섹션 + 토픽 유형 분류표 동시 추가
- **검증**: 다음 실행형 토픽에서 Arki 구조확정 단계가 포함되는지 확인

### C-002: project_charter.json canonical 소스 단일화 (DX-002, MA-004)
- **선행**: 1팀 뷰어 코드(app/js/data-loader.js)에서 config/project.json 버전 참조 코드 제거
- **적용**: config/project.json version 필드 교체 + CLAUDE.md 정책 명시
- **검증**: 뷰어에서 프로젝트 버전이 project_charter.json과 동일하게 표시되는지 확인
- **리스크**: 뷰어 코드에 config 참조가 있을 경우 제거 전 적용 시 버전 공백 발생

### C-003: 세션 종료 체크리스트 확장 (DX-003, MA-003)
- **선행**: C-002(canonical 소스 단일화) 완료 후 의미 있음
- **적용**: CLAUDE.md Session End 체크리스트에 'project_charter.json 버전 업데이트' 항목 삽입
- **검증**: 다음 세션 종료 시 charter 버전이 업데이트되는지 확인
- **리스크**: 낮음

### C-004: SOP 토픽 최소 역할 구성 패턴 (DX-007, MA-002) — C-001과 동시 적용
- **선행**: C-001과 분류표로 묶어서 동시 적용 (Phase 2 Step 2a)
- **적용**: 토픽 유형 분류표에 SOP형 정의 포함 + 역할 생략 규칙 명시
- **검증**: 반복 업무 토픽에서 불필요한 역할 발언 없이 Ace+Editor로만 처리되는지 확인
- **주의**: C-001과 분리 적용 시 B-001 발생 — 반드시 동시 적용

### C-005: memory/ junction 공유 구조 (DX-005, MA-006)
- **선행 1**: 1팀에서 worktree를 실제로 사용하는지 확인
  - worktree 미사용 시 이 항목은 적용 불필요
- **선행 2**: 기존 git-tracked memory 있을 경우 데이터 마이그레이션 계획 수립
- **선행 3**: 1팀 실제 memory 경로 확인 후 junction 경로 설정
- **적용**: .gitignore에 memory/ 추가 → junction 생성 → 신규 worktree 체크리스트 문서화(MA-007)
- **검증**: 두 worktree에서 동일한 memory/shared/decision_ledger.json 내용이 보이는지 확인
- **리스크**: 중간 — 기존 memory 데이터 손실 주의

---

## 3. 부분 병합 시 깨질 수 있는 항목

### B-001: C-001과 C-004를 분리 적용 시
**현상**: 실행형 토픽 Arki 필수(C-001)만 추가하고 SOP 최소 구성(C-004)을 빠뜨리면, 에이전트가 회의록 같은 반복 업무에도 Arki를 강제 호출할 수 있음.  
**해결**: C-001과 C-004를 토픽 유형 분류표로 묶어 동시 적용.

### B-002: C-002 없이 MA-003(체크리스트 확장)만 적용 시
**현상**: project_charter.json이 canonical 소스임을 모르는 상태에서 체크리스트에 '버전 업데이트' 항목만 추가하면, 에이전트가 config/project.json을 업데이트할 수 있음.  
**해결**: C-002 먼저 적용 후 MA-003 추가.

### B-003: C-005(junction)를 기존 memory 마이그레이션 없이 적용 시
**현상**: git-tracked memory를 .gitignore에 추가하면 해당 worktree의 기존 memory 파일이 미추적 상태로 전환됨. 다른 worktree로 junction 연결 시 이전 데이터가 사라질 수 있음.  
**해결**: junction 적용 전 기존 memory 파일을 공유 memory 경로로 복사 후 적용.

---

## 4. 병합 순서 제안

```
Phase 1 — 규칙 추가 (의존성 없음, 즉시 적용)
  Step 1a. R-001: CLAUDE.md에 JSON 스크립트 전용 편집 규칙 추가
  Step 1b. R-002: Ace 오케스트레이션 집중 원칙 추가
  Step 1c. R-003: 기획형 토픽 업무 정의 선행 원칙 추가
  Step 1d. R-004: Master 발언 과잉 해석 금지 추가

Phase 2 — 프로토콜 추가 (분류표 + 실행형 + SOP 동시 적용)
  Step 2a. C-001 + C-004: CLAUDE.md에 토픽 유형 분류표(전략형/실행형/SOP형) + 실행형 토픽 프로토콜 + SOP 최소 구성 규칙 동시 삽입
  ※ 분류표 없이 C-001만 추가하면 B-001 발생 (SOP 토픽에도 Arki 강제 호출)
  ※ Phase 5에서는 분류표 '정교화'만 담당 — 최소 분류표는 여기서 삽입

Phase 3 — canonical 소스 정리 (선행 확인 필요)
  Step 3a. 1팀 app/js/data-loader.js에서 config/project.json 버전 참조 확인
  Step 3b. C-002: canonical 소스 단일화 적용
  Step 3c. C-003: 체크리스트 항목 추가

Phase 4 — 인프라 변경 (위험도 높음, 충분한 준비 후)
  Step 4a. 1팀 worktree 사용 여부 확인
  Step 4b. (worktree 사용 시) 기존 memory 마이그레이션
  Step 4c. C-005: memory/ junction 구조 적용 + MA-007 가이드 문서화

Phase 5 — 1팀 설계 후 재이식 (별도 세션, 순서 무관)
  Step 5a. MA-012: 배포 정책 (D-011 참조) — 1팀에서 CF Pages vs 로컬 비교 설계
  Step 5b. MA-013: AI 오케스트레이션 설계 (D-013~D-020 참조) — 1팀 컨텍스트로 재설계
           ※ topic_005 Phase 2(회의록/페르소나) 미완 항목 포함 검토
  Step 5c. DX-007: 토픽 유형 분류표 정교화 — Phase 2 최소 분류표 기반으로 1팀 경험 반영 후 확장, 양팀 재이식
  ※ Phase 5 완료 후 재이식 시 별도 Delta Pack 생성
```

---

## 5. 병합 후 검증 포인트

### V-001: 실행형 토픽 프로토콜 작동 확인
- 방법: 실행형 토픽 1개 처리
- 기준: Arki가 구조확정 단계에서 발언하고, Ace가 실행계획서를 Master에게 제출하며, Master 승인 후 Editor가 실행하는지 확인

### V-002: JSON 스크립트 편집 작동 확인
- 방법: 세션 종료 시 결정사항 추가 및 토픽 상태 업데이트
- 기준: update-topic.ts와 add-decision.ts가 오류 없이 실행되고 JSON 파일이 정상 파싱되는지 확인

### V-003: 뷰어 버전 표기 확인 (C-002 적용 후)
- 방법: localhost viewer 접속
- 기준: 표시 버전이 project_charter.json의 version 값과 일치하는지 확인

### V-004: memory 공유 확인 (C-005 적용 후)
- 방법: 두 worktree에서 동일 decision을 추가하고 양쪽에서 조회
- 기준: 두 worktree 모두 동일한 최신 decision을 볼 수 있는지 확인

### V-005: 세션 종료 체크리스트 완전 실행 확인
- 방법: 다음 세션 종료 시 체크리스트 8개 항목 + project_charter.json 업데이트 포함 여부 확인
- 기준: current_session.json status='closed', closedAt 기록, charter 버전 업데이트 확인

---

## 6. 최종 판정 요약

| 구분 | 항목 수 | 액션 |
|------|---------|------|
| 즉시 병합 가능 | 4개 (R-001~R-004) | Phase 1에서 처리 |
| 선행 작업 후 병합 | 5개 (C-001~C-005) | Phase 2~4에서 처리 |
| 1팀 설계 후 재이식 (hold) | 2개 (DX-006, DX-010) | Phase 5 — 1팀 설계 세션 별도 진행 |
| 수정 후 이식 (adapt) | 1개 (DX-007 — 최소 분류표로 Phase 2 동시 적용) | Phase 2에서 C-001과 동시 처리 |
| 병합 제외 (reject) | 2개 (D-010, 기타 고유 항목) | 이식 불필요 |
| 가장 큰 리스크 | C-005 (memory 마이그레이션) | 데이터 백업 선행 필수 |
| 가장 중요한 단일 변화 | DX-001 (실행형 토픽 프로토콜) | Phase 2 최우선 |
| 병합 순서 의존성 | C-002 → C-003 / C-001 + C-004 동시 | 순서 오류 시 B-001~B-003 발생 |

---

> **결론**: Phase 1은 오늘 바로 적용 가능하며 리스크 없다. Phase 2는 분류표 초안 작성이 선행되면 즉시 가능하다. Phase 3은 뷰어 코드 확인 후 15분 작업. Phase 4는 worktree 사용 여부 확인이 전제이며, 사용 시 신중하게 진행해야 한다.
