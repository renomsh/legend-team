---
role: arki
session: session_142
topic: topic_131
date: 2026-04-29
turnId: 1
invocationMode: subagent
rev: 2
accessed_assets:
  - reports/2026-04-29_big-bang-legend-nexus-p3/arki_rev3.md
  - reports/2026-04-29_big-bang-legend-nexus-p2-1of3/dev_rev1.md
  - .claude/hooks/pre-tool-use-task.js
  - memory/roles/personas/role-arki.md
  - memory/shared/decision_ledger.json (D-107~D-125 범위)
---

# Arki — Sage 신설 + Zero 갱신 구조 설계 (s142, rev2)

## 결론 (1줄)

Sage = Master/Nexus 명시 호출 read-only 메타 분석가. Zero = 3 영역(부채·보안·simplify) 정제 페르소나(write 권한). 권한 분리는 페르소나 텍스트만으론 불충분 → `.claude/hooks/pre-tool-use-task.js` 확장으로 same-session 차단을 코드 박제(D4 정합).

---

## 1. 컴포넌트 1줄 정의 갱신 (rev3 표 일부)

| 컴포넌트 | 본 세션 변경 | 1줄 정의 |
|---|---|---|
| **Sage** | **갱신** (D-112 supersede 보강) | Master/Nexus 명시 호출 시에만 가동. NCL+ledger+self-scores read-only 분석 + 자가채점 정합성 cross-check. 별도 세션에서 Master와 성장축 토론. NCL 평가 미관여 |
| **Zero** | **갱신** (D-119 + D-125 흡수) | 3 영역 정제 — ① tech-debt ② security-review(하드코딩 secrets) ③ simplify(재사용·품질·효율). 페르소나 본문 내부 도구로 Cut/Refine/Audit 흡수. violation flag direct read 차단 |
| Nexus | 변경 없음 | 라우팅(코드 레이어) — A축 Orchestration + B축 Data Bus |
| NCL | 변경 없음 | 영수증 4항목 append-only |
| prime directive | 변경 없음 | Affaan 4 도그마 (D-122 박제 완료) |
| Ace / Riki / Edi | 변경 없음 | (Edi 분담 추가: anchor governance / D-125) |

**충돌 해결**: D-112(Sage) — rev3은 "세션 종료 후 NCL 영수증 read"였으나 본 세션 Master 4문답 결과 **자동 hook 폐기**. 호출은 Master·Nexus 명시 유발만. revision_history에 supersede-by 박제 필요 (Edi turn).

---

## 2. 권한 경계 매트릭스 (5축 × 5권한)

| 축 \ 권한 | read (인프라) | write (산출물·메모리) | route (호출 디스패치) | anchor (외부 근거 governance) | escalate (Master 알림) |
|---|---|---|---|---|---|
| **Nexus** (코드) | ✅ all | ❌ (오케만) | ✅ **owner** | ❌ | ✅ openMasterAlerts append |
| **Zero** (산출물) | ✅ 산출물·코드 | ✅ **owner** (정제 결과) | ❌ | ❌ | ✅ via Edi |
| **Sage** (메타) | ✅ NCL·ledger·memory **read-only** | ⚠ Master 승인 시에만 (제안만 default) | ❌ | ❌ | ✅ Master 별도 세션 |
| **Edi** (정합) | ✅ all | ✅ ledger·index 박제 | ❌ | ✅ **owner** (D-125) | ✅ session-end gaps |
| **Ace** (오케 페르소나) | ✅ all | ✅ 종합검토 보고서 | ⚠ 제안 (Nexus 실행) | ❌ | ✅ ack 시 ackReason 50자 (D-124) |

겹침/공백:
- escalate 4축 보유 — 의도된 redundancy (D4 정합, single point of failure 차단)
- anchor governance Edi 단독 — 본 세션 Master 확정. Sage가 anchor governance까지 가져가면 권한 비대.
- write 권한: Zero(정제) vs Edi(메타) 분리. Zero는 코드/산출물, Edi는 메타·ledger.
- **Sage 가짜 write 차단**: Sage가 자기 분석 결과를 NCL에 직접 영수증화 금지. Master 승인 후 Edi가 박제.

---

## 3. Same-session 차단 hook 구조 (코드 박제, D4 정합)

### 3.1 차단 시점·로직

```
PreToolUse(Task) 진입
  ↓
extractRole(toolInput) → role
  ↓
if role == 'sage':
  load current_session.json.turns
  if turns.length > 0 and any(t.role != 'sage' for t in turns):
    REJECT — "Sage는 같은 세션 내 다른 페르소나와 공존 금지. 별도 세션에서 호출."
  if 'sage' in [t.role for t in turns]:
    REJECT — "Sage 발언 후 다른 역할 호출 금지. 이 세션은 Sage 전용."

if role != 'sage' and 'sage' in [t.role for t in turns]:
  REJECT — "이 세션은 Sage 전용 세션. 다른 페르소나 호출은 새 세션에서."
```

### 3.2 우회 경로 차단

| 우회 경로 | 차단 메커니즘 |
|---|---|
| Main-thread inline에서 Sage 흉내 | `## ROLE: sage` 마커 없으면 Sage 권한 미발동 — 실패해도 무권한이라 무해 |
| `## ROLE: sage` 마커 위조 (다른 역할이 가짜) | extractRole이 marker 우선 신뢰 → **별도 검증층 필요**: hook이 `subagent_type === 'role-sage'` AND marker 일치 둘 다 요구로 강화 (Riki R-1 자기참조 paradox 회피용) |
| Sage가 NCL에 직접 write | NCL append hook(P4 신설)이 `actor` 필드 검사, `actor=='sage'`면 reject |
| Same-session에 Sage 강제 진입 (hook bypass 시도) | hook 실패 시 PostToolUse(Task) hook이 turns 추가 시점에 재검증 → session_index gaps 박제 |

### 3.3 reject 메시지 spec

```json
{
  "hookSpecificOutput": {
    "hookEventName": "PreToolUse",
    "permissionDecision": "deny",
    "permissionDecisionReason": "Sage 격리 정책 위반: <reason>. 별도 세션에서 /sage 호출하세요. (D-126 후보, C-2 강화)"
  }
}
```

⚠ **caveat**: 현재 hook v3는 permissionDecision 제거됨 (topic_130, auto mode 충돌). → 본 차단은 **prompt에 ⚠ SAGE_ISOLATION_VIOLATION 마커 prepend + Master 알림**으로 우회. 강한 차단은 **별도 hook**(`pre-tool-use-task-sage-gate.js`) 신설로 분리, permissionDecision 사용 가능 환경에서만 활성화. mitigation: 마커 prepend만으로도 LLM이 reject하도록 페르소나 본문에 "SAGE_ISOLATION_VIOLATION 마커 발견 시 즉시 발화 거부" 박제 (D4 정신, 그러나 D4는 코드 박제 우선 — 한계 인정).

---

## 4. Sage 호출 트리거 spec (dispatch_config.json 신설)

`memory/shared/dispatch_config.json` (신규) — 토픽 grade·역할 호출 트리거 룰 테이블.

```json
{
  "version": "0.1.0",
  "rules": {
    "sage": {
      "trigger": {
        "explicit": ["/sage", "세이지", "sage 호출"],
        "natural_language_suggest_only": [
          "평가", "성장", "회고", "채점", "지표", "self-scores"
        ]
      },
      "session_isolation": "exclusive",
      "first_speaker_override": true,
      "required_session_grade": null,
      "auto_hook": false,
      "ace_reject_window_turns": 1
    },
    "zero": {
      "scope_areas": ["tech-debt", "security-review", "simplify"],
      "excludedAssets": ["memory/shared/ncl_violations.jsonl", "memory/shared/violations/*"],
      "session_isolation": "shared"
    }
  }
}
```

- `session_isolation: exclusive` — Sage 호출 세션은 다른 페르소나 발언 0건 강제
- `first_speaker_override: true` — D-118 정합 (Sage가 첫 주자일 수 있음)
- `natural_language_suggest_only` — Nexus가 키워드 매칭 시 **suggest only**, Ace가 1턴 reject 권한
- `auto_hook: false` — Master 4문답 결과 (Goodhart·D-092 정합)

---

## 5. Deliverable 5종 통합 구조 (의존 그래프)

```
Phase 1 (스펙 동결)
  ├─ A. memory/roles/personas/role-sage.md       [신규]
  ├─ B. memory/roles/personas/role-zero.md       [edit, D-119 3 영역 + 도구 흡수]
  ├─ C. memory/roles/sage_memory.json            [신규]
  └─ D. memory/roles/zero_memory.json            [신규 또는 edit]
                ↓ depends-on (페르소나 본문 박제 후)
Phase 2 (정책·라우팅 박제)
  ├─ E. CLAUDE.md 역할 라인 (Sage +Zero 갱신)    [edit]
  └─ F. memory/shared/dispatch_config.json       [신규] ← Phase 1 산출 참조
                ↓ depends-on (정책 박제 후 hook 활성화)
Phase 3 (코드 enforcement)
  └─ G. .claude/hooks/pre-tool-use-task.js 확장  [edit]
       또는 .claude/hooks/pre-tool-use-task-sage-gate.js [신규, 분리권고]
                ↓
Phase 4 (검증·박제)
  ├─ H. validate-prime-directive.ts 스타일 검증 스크립트 (선택)
  ├─ I. decision_ledger D-126(Sage 신설) + D-127(Zero 갱신) 박제
  └─ J. revision_history.json (D-112 supersede 기록)
```

각 산출물 1줄 spec:

| ID | 파일 | 1줄 spec | 롤백 태그 |
|---|---|---|---|
| A | role-sage.md | 페르소나(read-only 메타 분석가) + 호출 트리거 + 자가검토 의무 + Affaan 4 도그마 명시 | `git revert <sha>` |
| B | role-zero.md | 3 영역 정의 + Cut/Refine/Audit 내부 도구 흡수 + violation flag 직접 read 금지 | 동상 |
| C | sage_memory.json | responsibility/scope/skills(read-only)/policy(NCL 미관여) | 파일 삭제 |
| D | zero_memory.json | 3 scope_areas + excludedAssets + 정제 결과 write 권한 | 파일 삭제 |
| E | CLAUDE.md | "Sage(메타·read-only)·Zero(3영역 정제) 분담 + same-session 차단 정책" 1 bullet | git revert |
| F | dispatch_config.json | rules.sage·rules.zero 객체 + session_isolation 필드 | 파일 삭제 |
| G | pre-tool-use-task.js | sage 가드 분기 추가 — turns 검사 + 마커 prepend | git revert |
| I | decision_ledger | D-126·D-127 append (Edi turn 책임) | ledger json 수동 pop |
| J | revision_history | D-112 supersededBy: D-126 | git revert |

**Schedule-on-Demand 준수**: 일정·담당·공수 기록 0건.

---

## 6. Phase 게이트·중단 조건·전제

### 게이트
- **G1 (Phase 1→2 통과 조건)**: A·B·C·D 4파일 박제 + lint 통과 + persona-policy 분리 위배 0건
- **G2 (Phase 2→3)**: E·F 박제 + dispatch_config schema 검증 (rules.sage 필수 키 5개 존재)
- **G3 (Phase 3→4)**: hook 변경 후 dry-run 4-step (① 일반 역할 호출 정상 ② Sage 단독 세션 통과 ③ Sage + 다른 역할 동석 시 마커/reject ④ same-session에 sage 진입 후 다른 역할 reject)
- **G4 (Phase 4 종료)**: D-126·D-127 ledger append + revision_history 박제 + auto-push 빌드 통과

### 중단 조건
- C-1: G3 dry-run에서 false-positive 발생 (정상 호출이 reject) → Phase 3 롤백, marker-only 모드로 후퇴
- C-2: dispatch_config schema가 기존 hook과 충돌 → Phase 2 롤백, 별도 파일로 격리
- C-3: Sage same-session 차단 hook이 D-103 인프라(`pre-tool-use-task.js`)와 conflict → 별도 hook 분리(권고)

### 전제
- E-1: D-122·D-125 박제 완료(s141 결과) — D-126 이 둘에 정합
- E-2: D-103 hook 인프라 가동 (확장 base)
- E-3: Cut/Refine/Audit 물리 skill 파일 부재 (확인 완료) → persona 본문 흡수만으로 충분

---

## 7. 외부 anchor

**RBAC 권한 분리 원칙 (NIST RBAC, Sandhu et al. 1996; ANSI INCITS 359-2004)**: separation of duties (SoD) — 한 주체가 read·write·route·escalate 모두 가지면 abuse 경로. 본 매트릭스는 5축 분리로 SoD 충족. (anchor 1)

**Defense in Depth (NIST SP 800-160 Vol.2)**: 단일 enforcement point 의존 금지. Sage 격리는 (i) persona 본문 명시 (ii) dispatch_config 룰 (iii) hook 코드 차단 3중 — D4(모델 설득 무력화) 정합. (anchor 2)

**Goodhart's Law (1975, Strathern 1997 정식화)**: "When a measure becomes a target, it ceases to be a good measure." → Sage 자동 hook 폐기 정당화. 자동 채점이 dispatch 가중치 자동 반영되면 페르소나가 점수 게이밍. (anchor 3, Master 4문답 보강 근거)

---

## 8. 자가검토 (3차)

### 1차 — 구조적 누락
- ✅ 권한 매트릭스에 escalate 축 포함 (rev1 누락 가능성 차단)
- ✅ Cut/Refine/Audit 물리 파일 확인 (Glob 결과: skills 폴더에 없음 → persona 흡수만)
- ⚠ **Sage 첫 주자 시 NCL 영수증 누가 produce하나?** — Sage 자기 발언도 NCL append 필요 (D-115 정합). hook이 actor=='sage'를 차단하면 Sage 영수증 사라짐. **mitigation**: Sage 영수증은 special path로 허용(`actor: 'sage', kind: 'meta-analysis'`). NCL append hook(P4)에서 화이트리스트.

### 2차 — D-115~D-125 정합성
- D-115 (NCL 4항목): Sage는 NCL produce 미관여 (Master 확정) — read-only로 정합
- D-118 (Star + Nexus first-speaker): Sage exclusive 세션은 first-speaker override로 정합
- D-119 (Zero 3 영역): 본 설계 §1·§5 흡수 완료
- D-122 (prime directive 4 도그마): Sage·Zero 페르소나 본문에 명시 의무
- D-124 (판정 주체 + ackReason 50자): Sage 발언도 ackReason 적용
- D-125 (Zero violation flag direct read 차단 + anchor governance Edi): §2 매트릭스 반영

### 3차 — Master 4 답변 반영도
1. ✅ "Sage 호출 = Master + Nexus 명시" → §4 dispatch_config explicit + suggest_only 분리
2. ✅ "자동 hook 없음" → §4 `auto_hook: false`
3. ✅ "R&R 4건(read-only 분석·별도 세션·자가채점 cross-check·NCL 미관여)" → §1·§2 반영
4. ✅ "same-session 차단 hook 필수" → §3 코드 박제, §3.2 우회 경로 차단

### 잔존 caveat
- §3.3에서 permissionDecision 미사용 환경의 한계 정직 박제 — 마커+페르소나 박제만으론 D4 완전 보장 불가. **후속 토픽 권고**: `pre-tool-use-task-sage-gate.js` 분리 hook 신설 + permissionDecision 활성 환경 분리.
- Sage 호출 자체의 자가채점 정합성은 누가 cross-check하나? — Riki adversarial이 같은 세션에 못 들어옴. **mitigation**: Sage 발언 후 다음 세션 Riki가 회고 채점. 본 토픽 범위 외, 후속.

---

## 9. 리스크 + mitigation + fallback (메모리: arki_risk_requires_mitigation)

| 리스크 | mitigation | fallback |
|---|---|---|
| R-1 Sage 마커 위조로 권한 탈취 | hook이 marker AND subagent_type 둘 다 검증 | 위조 탐지 시 session-end gaps에 박제 + Master 알림 |
| R-2 same-session 차단 hook이 정상 호출 false-positive | G3 dry-run 4-step + marker-only 후퇴 모드 | hook 비활성, 페르소나 본문 명시만 (D4 약화 인정) |
| R-3 dispatch_config schema 미정의로 hook crash | JSON schema 검증 스크립트(P4 H 산출) + try/catch silent pass | 파일 삭제 → hook 기본 동작 |
| R-4 Zero 3 영역 경계 모호(simplify ↔ tech-debt 중복) | scope_areas 1줄 정의 + 충돌 시 Master 판정 | 통합해서 2 영역 축소(부채·simplify 통합) |
| R-5 Sage 자가채점 cross-check 자체가 echo chamber | 자가채점 cross-check는 Master 결정 보조용, 자동 가중치 미반영(C-4 정합) | Master 직접 read |

---

## 10. 본 세션 deliverable 압축 권고

**최대 처리 범위 (5종 + hook = 6 파일)**:
- A·B·C·D (Phase 1) — 페르소나·메모리 4파일
- E·F (Phase 2) — 정책 2파일
- G (Phase 3) — hook 1파일 확장 (또는 별도 hook 분리)

**Dev에게 인계할 spec 동결 (spc_lck=Y 가능)**:
- §5 의존 그래프 + §6 게이트 + §1 1줄 정의 표 + §4 dispatch_config 스키마 = spec 핵심.
- Riki 검증 통과 후 spc_lck 선언 권고 (rev3에서).

---

ARKI_WRITE_DONE: reports/2026-04-29_big-bang-legend-nexus-p2-1of3/arki_rev2.md

```
[ROLE:arki]
# self-scores
aud_rcl: Y
str_fd: 5
spc_lck: N
sa_rnd: 3
```
