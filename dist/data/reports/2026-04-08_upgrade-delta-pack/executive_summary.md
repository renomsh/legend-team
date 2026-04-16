---
title: "2팀 Upgrade Delta Pack — Master 검토용 요약"
type: executive_summary
generated_at: "2026-04-08"
baseline: "1팀 v0.4.0 복사본 (commit 7869f06)"
current: "2팀 session_001~session_005 진화 결과"
---

# Executive Summary

## 한 줄 요약

> 2팀은 v0.4.0 베이스라인에서 **프로토콜 공백 4개를 채웠고**, **구조적 인프라 1개를 적용했으며**, **역할 경계 2개를 명문화했다**. 비즈니스 결정 8개는 2팀 전용이므로 이식 대상 아님.

---

## 2팀에서 진화한 핵심 항목 (7개)

| # | 항목 | 유형 | 근거 | 이식 판정 |
|---|------|------|------|-----------|
| 1 | **실행형 토픽 프로토콜** — Arki 구조확정 필수, 실행계획서 Master 승인 후 Editor 실행 | protocol_change | FB-012 → D-021 | **adopt** |
| 2 | **project_charter.json canonical 소스 단일화** — config/project.json version 필드 폐기 | canonical_source_change | D-022 | **adopt** |
| 3 | **세션 종료 체크리스트 확장** — project_charter.json 버전 업데이트 항목 추가 | protocol_change | D-023 | **adopt** |
| 4 | **topic_index/decision_ledger 스크립트 전용 편집** — Claude 직접 편집 금지 | validation_rule_change | D-024 | **adopt** |
| 5 | **memory/ junction 공유 구조** — git tracking 해제, worktree 간 동일 memory 공유 | storage_rule_change | D-012, FB-006 | **adopt** |
| 6 | **Ace 오케스트레이션 집중 원칙** — 직접 답변 금지, 위임 집중, 과잉해석 금지 | role_boundary_change | FB-008/011 | **adopt** |
| 7 | **SOP 토픽 최소 역할 구성** — 반복 업무는 Ace+Editor 최소 구성 + memory/sop/ 저장 | workflow_change | ace_memory pattern | **adapt** (hold→adapt, Opus 감사) |

---

## 1팀에 반드시 이식할 것 (P1 — 즉시 적용 가능)

### 1. 실행형 토픽 프로토콜 (MA-001)
**왜 지금:** 실행형 토픽에서 Arki를 생략하면 매핑 오류와 검증 누락이 구조적으로 발생한다. 2팀에서 실증됨.  
**어디에:** CLAUDE.md Operating Protocol 섹션에 서브섹션으로 추가.  
**주의:** MA-002(토픽 유형 분류표)와 함께 추가해야 SOP 토픽과 혼동 없음.

### 2. project_charter.json canonical 소스 (MA-004)
**왜 지금:** config/project.json과 project_charter.json이 각자 버전을 관리하면 뷰어 오표기가 발생한다. 단순한 정책 변경.  
**어디에:** config/project.json version 필드 교체 + CLAUDE.md 정책 명시.  
**선행 확인:** 1팀 뷰어 코드(data-loader.js)에서 config/project.json 참조 코드 제거 필요.

### 3. 세션 종료 체크리스트 확장 (MA-003)
**왜 지금:** 체크리스트 항목이 없으면 구조적 누락이 반복된다. 항목 삽입 1줄로 해결 가능.  
**어디에:** CLAUDE.md Session End 체크리스트.

### 4. JSON 스크립트 전용 편집 규칙 (MA-005)
**왜 지금:** Claude가 직접 JSON을 편집하면 파싱 오류가 반복 발생한다. 한 번 규칙화하면 재발 방지.  
**어디에:** CLAUDE.md 규칙 섹션.  
**선행 확인:** 1팀에 update-topic.ts, add-decision.ts 스크립트 존재 여부 확인.

---

## 수정 후 이식할 것 (P2~P3 — 검토 필요)

### 5. memory/ junction 공유 구조 (MA-006)
**조건:** 1팀이 worktree를 실제로 사용하는 경우에만 필요. worktree 미사용 시 이식 불필요.  
**수정 사항:** Windows junction 경로를 1팀 실제 경로에 맞게 변경. 신규 worktree 체크리스트(MA-007) 함께 작성.  
**주의:** 기존 git-tracked memory가 있다면 데이터 마이그레이션 선행.

### 6. SOP 토픽 최소 역할 구성 (MA-002)
**조건:** MA-001(실행형 토픽 프로토콜)과 함께 토픽 유형 분류표로 통합하여 추가.  
**수정 사항:** 1팀의 실제 반복 업무 유형(회의록 등)에 맞게 예시 조정.

### 7. Ace 역할 원칙 업데이트 (MA-008, MA-009, MA-010)
**조건:** agents/ace.md 또는 CLAUDE.md 역할 설명에 추가.  
**내용:** 오케스트레이션 집중, 업무 정의 선행, 과잉 해석 금지.

---

## 아직 이식하면 안 되는 것 (직접 적용 금지)

| 항목 | 이유 |
|------|------|
| D-010 (브라운백 B방식) | 2팀 고유 업무(회의록 작성) 기반 결정. 1팀 무관. |
| D-023 (CLAUDE.md 미반영 버전) | 2팀에서 결정됐으나 아직 CLAUDE.md 미반영. 1팀 적용 시 직접 완성본으로 삽입. |

## 1팀에서 설계 후 2팀으로 재이식할 것 (Hold — 1팀 설계 대상)

| 항목 | 1팀 작업 내용 | 재이식 결과물 |
|------|--------------|--------------|
| D-011 (로컬 전용 vs CF Pages) | 1팀 컨텍스트에서 배포 정책 재설계 | 통합 배포 정책 → 2팀 재이식 |
| D-013~D-020 (AI 오케스트레이션 결정군) | 1팀에서 내용 업데이트 + 구조 재설계 | AI 팀원 시스템 설계 완성본 → 2팀 재이식 |

> DX-007(토픽 유형 분류표)은 Opus 감사 후 hold → **adapt**로 변경. 최소 분류표(전략형/실행형/SOP형)는 Phase 2에서 MA-001과 동시 삽입. Phase 5에서는 분류표 정교화만 담당.
> 위 2개 항목은 2팀 현재 상태를 그대로 복사하지 않는다. 1팀 설계 세션의 OUTPUT이 2팀으로 돌아오는 방향.

---

## 병합 시 가장 큰 충돌 포인트

### 충돌 1: 실행형 토픽 Arki 필수 vs SOP 토픽 Ace+Editor 최소 (OI-006)
**내용:** 두 규칙의 적용 대상이 명확히 분리되지 않으면 에이전트가 어느 규칙을 따를지 혼동.  
**해결:** 토픽 유형 분류표(전략형/실행형/SOP형) 명시적 추가로 해소 가능.

### 충돌 2: memory/ junction 경로 (OI-007)
**내용:** junction 경로가 2팀 전용 경로(`D:\Projects\legend-team\memory`)로 하드코딩됨.  
**해결:** 1팀 경로에 맞게 변경 필요. 신규 worktree 생성 체크리스트 동시 작성.

### 충돌 3: project_charter.json 버전 이력 불일치
**내용:** 2팀 charter는 v0.3.0(2팀 진화 반영). 1팀은 자체 charter가 있을 경우 버전 이력이 다름.  
**해결:** 1팀 charter를 그대로 유지하고, D-022 정책(canonical 소스 단일화)만 이식.

---

## 빠른 이식 시나리오 (권장 순서)

```
Step 1 — CLAUDE.md 4개 추가 (MA-001, MA-002, MA-003, MA-005)
  소요: 30분 이내. 리스크: 낮음.
  검증: 다음 세션에서 실행형 토픽 1개 처리 후 프로토콜 작동 확인.

Step 2 — canonical 소스 단일화 (MA-004)
  소요: 15분. 선행: 뷰어 코드 참조 확인.
  검증: 뷰어 버전 표기가 project_charter.json과 일치하는지 확인.

Step 3 — Ace 역할 원칙 업데이트 (MA-008, MA-009, MA-010)
  소요: 20분. 리스크: 없음.
  검증: 다음 기획 토픽에서 Ace 발언 방식 확인.

Step 4 — memory/ junction 구조 (MA-006, MA-007)
  소요: 1시간 + 데이터 마이그레이션.
  선행: 1팀 worktree 사용 여부 및 기존 memory git 상태 확인.
  검증: 두 worktree에서 동일 memory 조회 확인.
```

---

## 정량 요약

| 구분 | 개수 |
|------|------|
| 2팀 전체 결정 (D-010~D-024) | 15개 |
| Delta 추출 (DX-001~DX-010) | 10개 |
| 1팀 즉시 적용 (adopt) | 7개 (DX-001~005, DX-008~009) |
| 1팀 수정 후 적용 (adapt) | 1개 (DX-007 — 최소 분류표로 Phase 2 동시 적용) |
| 1팀 설계 후 재이식 (hold) | 2개 (DX-006, DX-010) |
| Migration 액션 (MA-001~MA-013) | 13개 |
| Feedback Rules 승격 (FR-001~FR-006) | 6개 |
| 미해결 이슈 (OI-001~OI-009) | 9개 |
| Evidence 추적 (EV-001~EV-022) | 22개 |
| 1팀에서 직접 충돌 가능한 이슈 | 3개 |
