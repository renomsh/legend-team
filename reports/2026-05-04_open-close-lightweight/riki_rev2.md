---
role: riki
session: session_181
topic: topic_157
topicSlug: open-close-lightweight
turnId: 5
invocationMode: subagent
date: 2026-05-04
rev: 2
---

RIKI_WRITE_DONE: reports/2026-05-04_open-close-lightweight/riki_rev2.md

# Riki — 리스크 감사 (rev2): 보고서 내용 정제 방식 3가지 점검

실측 코드 검증 기반. 추측 없음.

---

### 🟢 감사 포인트 1: post-tool-use-task.js는 채팅 출력(tool_response)에서만 self-scores를 읽는가?

**실측 확인 — 완전 검증:**

`post-tool-use-task.js` L152-188 `extractSelfScores()` 함수:
- 입력: `input.tool_response || input.toolResponse` (L289)
- 보고서 파일 읽기 코드 없음 — `readFileSync` 호출은 L56(stdin), L219(frontmatter patchTurnId) 두 곳뿐
- `patchFrontmatterTurnId()` (L216-238)는 frontmatter `turnId` 필드만 패치. self-scores 읽기 아님

**판정: self-scores는 채팅 출력 전용. 보고서 파일에서 읽지 않는다.**

보고서 파일에서 `[ROLE:riki]\n# self-scores\n...` 블록을 제거해도 hook 파싱에 영향 없음.
단, 블록 크기 실측: arki_rev1.md 하단 블록 = **68 bytes**, riki_rev1.md 하단 블록 = **70 bytes**.
보고서 파일 크기 절감 효과: **60~80 bytes (0.7~1.6%)** — 절감 거의 없음.

**결론: 보고서에서 self-scores 제거 = hook 무영향. 단, 절감 효과도 미미 (~70 bytes).**

---

### 🔴 R-1. "핵심 결론 상단 배치" 컨벤션 — hook 강제 없음, LLM 자율 의존

**실측 확인:**

현재 role policy에서 상단 배치 컨벤션 적용 현황:
- `role-edi.md` L10: "Executive Summary — 핵심 결론 1단락 선두" ✓
- `role-arki.md`: 없음. 발언 구조 = 기술적 성립 여부(§1) → 프로토콜 호환성(§2) → 설계 옵션(§3) → 경계 조건(§4). 결론이 §5 이후에 위치하는 구조.
- `role-riki.md`, `role-fin.md`, `role-jobs.md`: 없음.

`pre-tool-use-task.js`에서 보고서 구조 검증 코드: 없음. `post-tool-use-task.js`에서도 없음. 컨벤션 위반 탐지 hook 없음.

**실측 보고서에서 핵심 결론 위치:**
arki_rev1.md (10,017 bytes): 권고 결론(옵션 C) = §5 "설계 옵션" 섹션. char 기준 약 5,500~6,000 번째에 위치.
즉, 현행 arki 발언 구조(§1~§4 순서)를 유지한 채 policy에 "상단 배치" 규칙만 추가해도 — **Arki가 발언 구조를 바꾸지 않으면 결론은 여전히 5,500 chars 이후에 위치한다.**

**파손 범위:**
- policy 텍스트 추가만으로 실제 동작 변경을 보장할 수 없다. LLM이 기존 발언 구조 패턴(§1~§4 근거→결론)을 따르면 규칙이 무시된다.
- hook 없는 컨벤션 = "권고 수준." CLAUDE.md 피드백 항목 "[텍스트 vs 액션형 skill 비대칭] 행동 강제는 skill 파일/hook, CLAUDE.md 문장만으론 부족"이 동일하게 적용된다.

**완화 조건:** hook이 `# self-scores` 블록을 탐지하듯, 보고서 상단 N chars 내에 "## 핵심 결론" 또는 "## TL;DR" 섹션 헤더 없으면 경보를 내는 `post-tool-use-task.js` 검증 추가 필요. 텍스트 규칙만으로 강제 불가.

---

### 🟡 R-2. _common.md self-scores 섹션 제거 — 정작 큰 절감 항목이 아님

**실측 수치 교정:**

Arki rev1이 측정한 _common.md 섹션별 크기:
- Self-Score YAML 출력 계약 섹션 자체: ~550 bytes
- 보고서 파일의 self-scores 블록: 68~70 bytes

전자(~550 bytes)는 **persona layer 주입량** 절감이고, 후자(70 bytes)는 **session layer 주입량** 절감이다. 이 두 항목은 다른 경로.

**_common.md 절삭 (~750 bytes)의 실제 session layer 절감 = 0.**
_common.md는 persona layer이지, session layer(보고서 주입) 경로가 아니다. Arki 보고서 10K → Riki 보고서 5K로 절삭해야 session layer 절감이 발생한다.

**파손 범위:** "3가지 조합으로 ~35% 절감"이라는 Arki 옵션 C 수치가 경로 혼동을 포함할 수 있다. persona layer 절감(~750 bytes) + session layer 절감(캡 분화 시)은 별개 경로이며, 합산 시 "프롬프트 전체 대비 %"로 표현해야 정확하다.

**완화 조건:** 절감 효과 계산 시 (a) persona layer 절감 bytes / 총 persona layer bytes, (b) session layer 절감 chars / 총 session layer chars를 분리 표기. 합산 수치는 오해를 낳음.

---

## 의도적 제외

- **self-scores 제거 불가 리스크**: 실측으로 hook은 채팅 출력에서만 읽음. 보고서 파일 제거 = 무영향. 리스크 없음. 제외.
- **_common.md 헤더 250 bytes 삭제 리스크**: Arki와 동일 판단. 제외.
- **dry-run 충분성 리스크 (rev1 R-3)**: 이미 rev1에서 다룸. 중복. 제외.

---

## 요약

**1개 🔴 크리티컬 (신규):**
1. "핵심 결론 상단 배치" 컨벤션 = policy 텍스트만으로 강제 불가. Arki 발언 구조(§1~§4 근거 선행)와 충돌. hook 없이 배포 시 규칙 무시 가능성 높음.

**1개 🟡 (명확화):**
2. self-scores 보고서 제거의 절감 효과 = 70 bytes. session layer 절감 아님. _common.md 절삭은 persona layer 절감 — 경로 구분 필수.

**새 방향 3가지 평가:**
- ① "핵심 결론 상단 배치" 컨벤션 박제: hook 강제 없이 policy 텍스트만이면 LLM 자율에 의존 — 실효 불확실. hook 추가 시 확실.
- ② self-scores 블록 보고서에서 제거: 기술적으로 무해. 단, 절감 효과 미미 (70 bytes).
- ③ _common.md 헤더·중복 절삭: 기술적으로 안전. 실제 절감은 persona layer 750 bytes — 유효하나 session layer와 구분해서 기대치 설정 필요.

[ROLE:riki]
# self-scores
crt_rcl: Y
cr_val: 4
prd_rej: Y
fp_rt: 0.10
