# Arki — Phase 2 blind-parallel (구조 분석, 12 skill 시기 — Master 정정 전)

> **참고**: 이 분석은 Master 정정("plugin skill 대상") 이전 작성. 레전드팀 자체 12개 skill 대상 분석. 정정 후 무효처리, debate r1에서 plugin ~150+ 대상으로 재설계.

## §1 구조 분석

### 1-1. 현재 skill 발동 경로
| 경로 | 메커니즘 | hook 개입? |
|---|---|---|
| A. Skill tool 호출 | 모델이 Skill tool로 호출 → PreToolUse(Skill) matcher | ✅ pre-tool-use-skill-jobs-framing.js 실증 |
| B. Slash command | `/open` `/close` `/discussion` `/structured` `/pd` (5건) | UserPromptSubmit hook 매칭 가능 |
| C. SKILL.md description 자율 인식 | 모델 자유 판단 | ❌ |
| D. CLAUDE.md 문장 지침 | 자연어 → 모델 자율 | ❌ |

### 1-2. Skill 실측 — `.claude/skills/` 12개

> **중요**: "skill 30+"는 plugin 포함 ~150+ 합산. 레전드팀 자체 = 12개.

| 분류 | 개수 | skill |
|---|---|---|
| 자동발동 적합 | 5 | verification-before-completion, executing-plans, subagent-driven-development, dispatching-parallel-agents, systematic-debugging |
| 조건부 (D-130에서 자동 트리거 거부) | 4 | ace-framing, ace-synthesis, jobs-framing, orchestration-mode |
| 부적합 | 3 | ace-learning-loop, writing-plans, writing-skills |

**A1 90% 도달 가능성 — 부정적**: 자동발동 적합 5/12 = 42%. 안전선 7/12 = 58%. 90% 무리.

### 1-3. hook 인프라
settings.json 등록된 5종:
- SessionEnd, UserPromptSubmit, PreToolUse[Task] (3 chain), PreToolUse[Skill], PostToolUse[Task], PostToolUse[Write|Edit]

**핵심 제약**:
1. PreToolUse(Skill) BLOCK 가능성 — 미검증
2. hook → skill 직접 호출 불가 (Skill tool은 모델만 호출)
3. D2 — PreToolUse(Skill) BLOCK 동작 공식 문서 미확인 → spike 필수

## §2 의존·제약 그래프

```
Master 입력
   ↓
[UserPromptSubmit hook] ← prompt 매칭
   ↓
Claude(모델) 판단
   ├─→ Skill tool → [PreToolUse(Skill) hook]
   ├─→ Task tool → [PreToolUse(Task) hook chain]
   └─→ 자율 텍스트 (hook 개입 불가)
```

## §3 결정축 권고
| 축 | 권고 | 근거 |
|---|---|---|
| B | Hybrid: dispatch_config SOT + 신규 hook `pre-tool-use-skill-auto-fire.js` | dispatch_config 이미 trigger 스키마 존재 |
| C | C1-단계적: BLOCK + escape `--bypass-skill-auto` | spike 검증 후 점진 |
| D | Logged-warn-then-escape: 1차 BLOCK + escape 메시지 | 우회 빈도 로깅 → 키워드 튜닝 |

## §4 Phase 분해
- **Phase 1**: spike — PreToolUse(Skill) BLOCK 검증. G1: BLOCK 동작 확인 + escape 작동
- **Phase 2**: dispatch_config 확장 (auto_fire 섹션). G2: validator 통과
- **Phase 3**: hook PoC (verification-before-completion 1개). G3: 5건 중 4건 발화 + FP ≤20%
- **Phase 4**: 5 skill 확장. G4: 42% 도달 + 우회 ≤30%
- **중단 조건**: PreToolUse BLOCK 미지원 → PostToolUse warn 분기

## §5 리스크
| 리스크 | mitigation | fallback |
|---|---|---|
| R1: BLOCK 미지원 | Phase 1 spike | PostToolUse warn 분기 |
| R2: false-positive 차단 | escape valve + 빈도 로깅 | skill 단위 disable |
| R3: A1 90% 비현실 | 분류표 보고 | 목표 재정의 |
| R4: dispatch_config drift | 동일 파일 내 신설 | validator drift 감시 |
| R5: plugin skill 오발화 | prefix 화이트리스트 | hook에서 skip |
| R6: 모델 자율 호출 enforcement 불가 | Skill/Task tool 한정 | 자연어 호출은 측정만 |

## §7 핵심 보고
1. **A1 90% 비현실 — 실측 42% (5/12)**. 목표 재정의 권고
2. **Phase 1 spike가 첫 게이트** — PreToolUse(Skill) BLOCK 동작 미검증
3. **scope 분리 필요** — 레전드팀 12 skill만 대상, plugin 150+은 외

```
[ROLE:arki] struct_clr:4 dep_map:5 plan_phase_cnt:4 gate_cnt:4 spc_lck:N aud_rcl:0.7
```
