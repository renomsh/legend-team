---
topic: topic_127
session: session_131
revision: 3
date: 2026-04-28
role: dev
phase: implementation
status: completed
turnId: 0
invocationMode: inline
---

# Dev 구현 보고 — P3 잔여 5역할 atomic 분리 + scaffold-role.ts (session_131)

## 구현 완료 항목

### 1. 5역할 persona 슬림화

| 파일 | 변경 내용 |
|---|---|
| `memory/roles/personas/role-fin.md` | 정체성·원칙만 잔류. Write계약·Frontmatter·Self-Score → _common/policy 이관 |
| `memory/roles/personas/role-riki.md` | 정체성·원칙만 잔류. 동일 |
| `memory/roles/personas/role-nova.md` | 정체성·Must Never Do·Output Style → policy 이관 |
| `memory/roles/personas/role-edi.md` | 정체성·Optimizes For·Must Never Do만 잔류 |
| `memory/roles/personas/role-vera.md` | visual system 5개 도메인(color·typography·spacing·gradient·component spec) persona 보존. policy/common 이관 |

### 2. 5역할 policy 신규 생성

| 파일 | 주요 내용 |
|---|---|
| `memory/roles/policies/role-fin.md` | 발언구조 4섹션 + 컨텍스트 활용 지시 + Self-Score 지표 4건 |
| `memory/roles/policies/role-riki.md` | 필터기준 + 리스크 항목 형식 + 패스 선언 + Self-Score 지표 4건 |
| `memory/roles/policies/role-nova.md` | 발언구조 5섹션 + Default Questions + Output Style + Self-Score 지표 3건 |
| `memory/roles/policies/role-edi.md` | 발언구조 7섹션 + Shared Asset Protocol(필수) + Self-Score 지표 5건 |
| `memory/roles/policies/role-vera.md` | 발언구조 4섹션 + 컨텍스트 활용 지시 + Self-Score 지표 3건 |

### 3. scaffold-role.ts 신규

- 경로: `scripts/scaffold-role.ts`
- 기능: 8역할 persona+policy 파일 존재 확인 + PERSONA_INJECT_FAILED 마커 0건 검증 + _common.md 100줄 cap 확인
- 종료 코드: 0=PASS / 1=FAIL

### 4. finalize hook checkCommonPolicyCap 추가

- `.claude/hooks/session-end-finalize.js`에 `checkCommonPolicyCap()` 함수 추가
- 세션 종료 시 `_common.md` 라인수 > 100이면 `gaps: common-policy-over-cap` 박제

### 5. Nova Output Style 이동 (persona 정비)

- `personas/role-nova.md` → Output Style 3줄 제거
- `policies/role-nova.md` → Output Style 추가

## G3 게이트 결과

```
[scaffold-role] G3 게이트 검증 시작

  _common.md : OK (58줄)

  역할별 결과:
  [PASS] ace      | ✅ persona | ✅ policy
  [PASS] arki     | ✅ persona | ✅ policy
  [PASS] fin      | ✅ persona | ✅ policy
  [PASS] riki     | ✅ persona | ✅ policy
  [PASS] nova     | ✅ persona | ✅ policy
  [PASS] dev      | ✅ persona | ✅ policy
  [PASS] edi      | ✅ persona | ✅ policy
  [PASS] vera     | ✅ persona | ✅ policy

[scaffold-role] G3 PASS — 8역할 inject 100% 검증 완료
```

## 미구현 (P4 이관)

| 항목 | 이관 단계 |
|---|---|
| D-105 박제 (CLAUDE.md 3층 분리 원칙) | P4 |
| PD-044 deprecated 처리 | P4 |
| 1세션 dry-run 검증 | P4 |

## 롤백 경로

```bash
git checkout HEAD -- memory/roles/personas/role-{fin,riki,nova,edi,vera}.md
rm memory/roles/policies/role-{fin,riki,nova,edi,vera}.md
rm scripts/scaffold-role.ts
git checkout HEAD -- .claude/hooks/session-end-finalize.js
```

```yaml
# self-scores
impl_done: 1.0
gate_pass: Y
```
