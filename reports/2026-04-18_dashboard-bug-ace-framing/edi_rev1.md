---
sessionId: session_033
topic: Dashboard Bug & ace-framing 조건화
topicSlug: dashboard-bug-ace-framing
date: 2026-04-18
grade: A
framingLevel: L2
agentsCompleted: [Ace, Nova, Arki, Fin, Riki, Editor]
decisions: [D-032, D-033]
---

# Session_033 — Dashboard Bug & ace-framing 조건화

## 1. 버그 수정: CF Pages 회귀

**원인:** commit `e94543a` (remove .claude/worktrees/ gitlinks)가 worktree에만 존재, origin/main에 미반영. CF Pages는 main 브랜치 빌드 → stale session_029 데이터 표시.

**해결:** 미반영 파일 전체 수동 commit + push → CF Pages 재배포 → 최신 데이터 반영 확인.

---

## 2. Topic Grade System (D-032)

### 설계 근거
- Size 공식 (D-027): `Size = (decisionAxes×2) + rolesCalled + (rolesRecalled×2) + (sessionsSpanned×3)`
- 기존 33세션 분포 기반 경계: S(12+) / A(8–11) / B(5–7) / C(≤4)

### Grade → Framing Level 매핑

| Grade | Level | Framing 방식 | 첫 주자 |
|---|---|---|---|
| S | L2 | ace-framing 스킬 전체 | Ace |
| A | L2 | ace-framing 스킬 전체 | Ace |
| B | L1 | Ace 인라인 2~3문장 | Ace (경량) |
| C | L0 | 프레이밍 없음 | Dev 직행 |

### 입력 규칙
- `/open B 대시보드 버그` → grade: B (단일 문자 선언)
- 미선언 시 키워드 자동 추론, 미매칭 시 기본값 A

### 검증 루프
- `gradeDeclared` (선언) vs `gradeActual` (Size 역산) → `gradeMismatch` flag
- 대시보드 Grade Distribution + Grade Mismatch 패널로 시각화

### 표기
- 대화: Grade A / Lv. A 병용
- 대시보드: "Lv. S/A/B/C" 표시

---

## 3. 버전 관리 단일소스화 (D-033)

- **단일 소스:** `memory/shared/project_charter.json`
- **자동 반영:** `app/js/nav.js`가 모든 페이지 `#sidebarVersion` span에 동적 주입
- **명명 규칙:** 큰 변화 +0.1, 작은 변화 +0.01
- **현재 버전:** v1.01

---

## 4. 대시보드 추가 수정

- **Decisions:** 최신순 정렬 (`allDecisions.reverse()`)
- **OPS:** 순서 1→2→3→4→5 (O3 Recent Sessions ↔ O4 Pending Deferrals 위치 정렬)
- **Grade Distribution 패널:** Lv. S/A/B/C 막대 + 비율
- **Grade Mismatch 패널:** gradeMismatch 세션 목록
- **Chart data gap notes:** 효율성/자율성 추이 데이터 부족 안내 추가

---

## 5. 이연 등록 (PD-010)

**항목:** SessionEnd token hook 미캡처 진단  
**내용:** session_028~032 token_log.json 누락. hook-diagnostics.log 공백.  
**다음 액션:** session-end-tokens.js 발동 여부 + transcript_path 형식 검증 필요.

---

## 결정 요약

| ID | 축 | 결정 |
|---|---|---|
| D-032 | Topic Grade System + ace-framing 조건화 | S/A→L2, B→L1, C→L0. 단일문자 입력. Lv. 표기. |
| D-033 | 버전 단일소스화 | project_charter.json + nav.js 동적 주입. v1.01 적용. |
