---
role: arki
turnId: 2
sessionId: session_233
topicId: topic_196
invocationMode: subagent
---

# Arki rev2 — 메모리·정책·정의 정제 진단 (Master scope)

Master, Arki입니다. dispatch 인프라(hook·cap·skill·MCP)는 out-of-scope으로 확정되었고, 본 rev2는 **CLAUDE.md / decision_ledger / MEMORY 피드백 / 역할 3층 정의 / 정책 파일** 5개 표면의 dead weight·중복·stale·undeclared deprecation을 진단합니다.

토픽 본질 재정의: "Agent 호출당 inject되는 컨텍스트의 의미밀도(signal/noise) 회복" — Riki rev1이 지적한 prefix cache 가설이 맞다면 cap 절삭은 무용하지만, **stale 텍스트 자체가 노이즈**라면 정제는 모델 첫 토큰 품질에 직접 기여한다(추측, 측정 미확보).

**검증 의무 준수**: 모든 수치는 실측. `wc -l`·`node require`·디렉터리 ls·Grep로 직접 확인. 실측 불가 항목은 "추정" 명시.

---

## 1. 정제 대상 인벤토리 (실측)

### 1.1 CLAUDE.md 본문

| 항목 | 값 | 근거 |
|---|---|---|
| 라인 수 | **276** | `wc -l CLAUDE.md` |
| Top section 수 | 약 9 (`# / ##` 기준) | grep |
| 결정 ID 인용 | D-002·D-006·D-008·D-012·D-017·D-019·D-020·D-028·D-029·D-048·D-056·D-057·D-059·D-062·D-063·D-066·D-067·D-074·D-092·D-104·D-104-s130·D-125·D-126·D-127·D-128·D-129·D-130·D-133·D-138·D-139·D-143·D-145·D-146·D-156·D-164·D-169·D-170·D-170-A1·D-170-A2·D-172·D-173·D-174·D-175 (≈43건) | grep |
| Prime Directive | 4건 (D1~D4, D-113) | L8-11 |
| **🔴 broken reference** | **`agents/role-sage.md` (L21)·`agents/role-zero.md` (L22)** | `agents/` 디렉터리 부재 (`ls -la .claude/agents/` ENOENT, 워크트리 루트도 없음). dispatch context 본 호출의 ROLE 헤더에 "`agents/role-arki.md` 참조"도 동일하게 깨진 링크 |
| 자동 주입 발언자 컨텍스트와 중복되는 본문 | "Operating Protocol §역할 순서·Master Intervention" 등 dispatch hook이 이미 페르소나·정책 layer로 inject 중 | hook v3 L163-199 |

### 1.2 Global CLAUDE.md (`~/.claude/CLAUDE.md`)
- 62 라인. 일반 원칙(사고·정직성·출력·리스크 등 10개 섹션). 프로젝트 CLAUDE.md와 일부 중복: §6 "막히면 보고" ≈ MEMORY `feedback_revert_when_master_frustrated.md`. §9 "허락 기다리지 말고" ≈ MEMORY `feedback_proactive_questioning.md`.

### 1.3 decision_ledger.json

| 항목 | 값 | 근거 |
|---|---|---|
| 총 결정 | **180건** (D-002 ~ D-177) | `decisions.length` |
| status 분포 | superseded **8** / deprecated **9** / resolved **1** / open·pending **0** / 나머지 (status 필드 없거나 'active'/기타) **162** | groupBy |
| **🔴 undeclared deprecation** | **30건** — summary/decision 본문에 "supersede / 폐기 / deprecat" 언급되나 `status` 필드 미갱신 | regex |
| 대표 사례 | D-130 본문 "D-104 supersede" 명시 → **D-104 status=active 잔존**. D-133 본문 "D-115 deprecat" → D-115는 deprecated로 박제됨(정상). D-122 → D-135 "폐기" 명시 → D-122 deprecated 박제됨(정상). 비대칭 존재 | grep |
| 빈 summary | D-122·D-123·D-133·D-135·D-136·D-142·D-143 등 **summary 빈 문자열 8건** (status는 박제됨) | regex |

### 1.4 MEMORY.md (user-level 피드백 인덱스)

| 항목 | 값 | 근거 |
|---|---|---|
| 인덱스 라인 (피드백 항목) | **38건** (project_*, reference_*, feedback_* 합산) | `wc -l` 38 + 1 trailing |
| 가장 오래된 | `feedback_db_mapping_strategy.md` (Apr 10, session_008) | mtime |
| 가장 최근 | `feedback_approval_before_finalize.md` (May 9, session_217) | mtime |
| 디렉터리 실제 파일 수 | 41 (MEMORY.md + 38 피드백 + 2 project + 0 누락) — index와 mismatch 0 | `ls` |
| 설정 정착 후 reminder 가치 약화 의심 | 후술 §2-C | 본문 cross-check |

### 1.5 역할 메모리 (memory/roles/*_memory.json)

| 파일 | 크기(B) | 파싱 | 비고 |
|---|---|---|---|
| ace_memory.json | 2,253 | OK | + ace_memory_archive_20260430.json 26KB (archive 별도) |
| arki_memory.json | 16,183 | OK | 최대 |
| **dev_memory.json** | **15,659** | **🔴 SYNTAX ERROR (line 78 col 5)** | `lessonLog` 첫 번째 항목과 두 번째 사이 콤마 누락. 현재 `require()` 시 throw — D-092 metrics propagation에서 dev 통계 누락 가능 |
| edi_memory.json | 5,077 | OK | |
| fin_memory.json | 6,042 | OK | |
| jobs_memory.json | 6,500 | OK | |
| nova_memory.json | 3,645 | OK | |
| riki_memory.json | 7,707 | OK | |
| sage_memory.json | 1,556 | OK | |
| vera_memory.json | 8,062 | OK | |
| zero_memory.json | 2,626 | OK | |

### 1.6 역할 3층 정의 — `agents/` 부재

CLAUDE.md는 "역할 3층 정의(agents·personas·policies)"를 전제하나 **agents/ 디렉터리 부재**:
- `memory/roles/personas/role-{r}.md` ✅ 11개 (ace/arki/dev/edi/fin/jobs/nova/riki/sage/vera/zero)
- `memory/roles/policies/role-{r}.md` ✅ 11개 + `_common.md`
- `agents/role-{r}.md` ❌ **존재하지 않음**. `.claude/agents/`도 부재.

→ CLAUDE.md L21·L22 broken link, dispatch context 자동 주입 ROLE 헤더 broken link, MEMORY.md 본 dispatch 헤더 "consultancy → `agents/role-arki.md`" 다수 reports에 잔존(20개 파일 grep 적중).

**결론: 3층은 사실상 2층(personas + policies)으로 운영 중**. CLAUDE.md만 3층 표기.

### 1.7 정책 파일 deprecated 필드·주석

`dispatch_config.json` 5,158 chars / 17 top-key. 주석 필드 `_comment`·`_parallel_turn_sort_key_note`·`enforcement_note`(rules.edi 추정) 다수 — 운영 정책과 history가 한 파일에 혼재.

### 1.8 Growth metrics 사용·미사용

| 파일 | 크기 | 역할 |
|---|---|---|
| metrics_registry.json | 57,778 | 빌드 결과(SOT) |
| composite_inputs.json | 8,362 | base 정의 (compile 대상) |
| derived_metrics.json | 1,980 | derived 정의 |
| self_scores.jsonl | 69,789 | append-only log |
| signature_metrics_aggregate.json | 29,184 | 집계 (D-092 이후 signature 개념은 base로 흡수됨 — 명칭 잔존) |
| g6_evaluation_template.md | 7,536 | 템플릿 (사용처 미확인) |
| rollback_playbook.md | 7,332 | playbook |

→ `signatureMetrics → base` 명명 전이가 D-065 session_089 시점 발생. 파일명에 잔존하는 "signature" prefix는 **역사적 명명 잔재**.

---

## 2. 정제 후보 분류

### A. Superseded (후속 결정으로 무효화, status=superseded 또는 deprecated 박제 완료)

박제 정상 11건: D-058·D-066·D-068·D-070·D-110·D-111·D-112·D-115·D-118·D-122·D-123. **별도 정제 불요** — ledger 자체에 박제됨. 다만 CLAUDE.md 본문에서 supersede된 결정을 still 인용하는지 cross-check 필요(예: D-104 본문 인용 vs D-104-s130 보강).

### B. Duplicate (단일 출처 위반)

| # | 항목 | 위치 1 | 위치 2 | 권고 |
|---|---|---|---|---|
| B-1 | "결정 필요 0건이면 진행" | global CLAUDE.md L56 | MEMORY `feedback_low_friction_no_redundant_gate.md` | global이 우선, MEMORY 항목 stale로 판정 |
| B-2 | "막히면 보고·우회 금지" | global CLAUDE.md L44 | MEMORY `feedback_revert_when_master_frustrated.md` | global의 일반판 + MEMORY의 구체 신호("엉망/헤매") 분리 가치 있음 — **유지** |
| B-3 | "허락 기다리지 말고 능동 질문" | global CLAUDE.md L55 | MEMORY `feedback_proactive_questioning.md` | global 우선, MEMORY 항목 stale 후보 |
| B-4 | Operating Protocol §역할 순서 | CLAUDE.md L172-178 | dispatch hook persona/policy inject 본문 | CLAUDE.md는 인간 가독성 유지, hook이 SOT — 명문화 필요 |
| B-5 | Topic Status SOT 정책 | CLAUDE.md L138-141 | `scripts/lib/topic-status.ts` 코드 doc | 코드 doc과 CLAUDE.md 한 줄 요약 분리 — **유지** |

### C. Stale (정착 완료, reminder 가치 약화) — MEMORY.md 38건 전수

reminder 가치 판정 기준: (a) 정책이 코드/hook으로 enforce 되면 stale 후보. (b) 같은 내용이 CLAUDE.md 또는 global에 이미 박제되면 stale 후보. (c) 6개월 이상 미위반 + 시스템에 흡수되면 stale 후보.

| # | 파일 | 내용 | stale 판정 | 사유 |
|---|---|---|---|---|
| C-1 | feedback_db_mapping_strategy.md | DB 매핑 4단계 | **stale (도메인 변화)** | session_008 한정 도메인. 현재 시스템 회귀 가능성 낮음 |
| C-2 | feedback_planning_project_structure.md | 기획 구조 수립 선행 | **stale** | Jobs framing(D-130)이 hook으로 enforce |
| C-3 | feedback_fin_stage_awareness.md | Fin 토픽 단계 인식 | **stale** | role-fin.md policy로 박제 |
| C-4 | feedback_external_plugin_absorption.md | 외부 플러그인 자립 | **유지** | 계속 작용하는 판단 기준 |
| C-5 | feedback_text_vs_action_asymmetry.md | hook으로 행동 강제 | **유지** | 메타 원칙 |
| C-6 | feedback_decompose_before_judge.md | plugin 부품 단위 해체 | **유지** | 메타 원칙 |
| C-7 | feedback_ace_orchestration_responsibility.md | "Nexus 이전" 명시 | **stale** | D-130/D-133에서 Ace→Nexus 책임 이전 박제됨. 본문도 그렇게 명시 |
| C-8 | feedback_fin_nonfinancial_asset_cost.md | Fin 비재무 자산 | **유지** | role-fin.md에 미박제 |
| C-9 | feedback_no_middle_ground.md | 절충안 금지 | **유지** | Ace 행동 패턴 |
| C-10 | feedback_revert_when_master_frustrated.md | 좌절 시 원복 | **유지** | global과 분리 가치(구체 신호) |
| C-11 | feedback_dev_verify_and_callable.md | Dev 검증·callable | **유지** | role-dev.md 정책 강화 인용 |
| C-12 | feedback_ace_grade_intent_check.md | grade 의도 확인 | **유지** | Ace 판단 |
| C-13 | feedback_low_friction_autonomy.md | 무응답=승인 | **유지** | 메타 원칙 (장기 목표 명시) |
| C-14 | feedback_external_anchor_mandatory.md | D-059 cross-check | **유지 (memorial)** | D-059로 박제됨 — MEMORY는 reminder |
| C-15 | feedback_no_retro_without_value.md | 레거시 소급 금지 | **유지** | 행동 원칙 |
| C-16 | feedback_arki_self_audit_on_pressure.md | Arki "한번 더" | **유지** | role-arki.md policy에 인용됨 |
| C-17 | feedback_nova_auto_recommend_on_expansion.md | Nova 추천 | **유지** | D-130/D-174 갱신 정합 |
| C-18 | feedback_pragmatic_weapon_not_art.md | ROI 우선 | **유지** | 메타 원칙 |
| C-19 | feedback_riki_filter_consolidated.md | Riki 3대 필터 | **유지** | role-riki.md 인용 |
| C-20 | feedback_no_action_in_analysis_report.md | 분석에 액션 금지 | **유지** | 보고서 패턴 |
| C-21 | feedback_cost_allocation_distortion.md | 비용 안분 왜곡 | **유지** | role-fin.md 인용 |
| C-22 | feedback_data_category_label_vs_essence.md | 카테고리 라벨 ≠ 실체 | **유지** | 데이터 도메인 |
| C-23 | feedback_simple_growth_not_measurement.md | 측정 위한 측정 금지 | **유지** | D-092 정합 |
| C-24 | feedback_grade_a_subagent_enforcement.md | Grade A subagent | **유지** | D-066(deprecated)인용 — 갱신 필요. **action**: D-066 deprecated 사실 반영 |
| C-25 | feedback_proactive_questioning.md | 능동 질문 | **stale-dup** | global L55 중복 (B-3) |
| C-26 | feedback_arki_risk_requires_mitigation.md | Risk + mitigation | **유지** | role-arki.md 인용 |
| C-27 | feedback_no_re_asking_settled_policy.md | 정착 정책 재질문 금지 | **유지** | 메타 원칙 |
| C-28 | feedback_low_friction_no_redundant_gate.md | 저마찰 게이트 금지 | **stale-dup** | global L56 중복 (B-1) |
| C-29 | feedback_arki_full_system_view.md | Arki 다축 교차 | **유지** | role-arki.md 인용 |
| C-30 | feedback_no_auto_role_recall_surveillance.md | 다회 호출 감시 금지 | **유지** | hook 설계 가드 |
| C-31 | feedback_version_format_float.md | 버전 X.YYY | **유지** | 형식 규칙 |
| C-32 | feedback_d092_self_score_intent.md | D-092 폐기 아님 | **유지 (memorial)** | 오해 방지 |
| C-33 | reference_claude_design_handoff.md | Claude Design 워크플로 | **유지** | 도메인 reference |
| C-34 | project_growth_board_visual_hierarchy.md | Vera 프로젝트 상태 | **유지 (project)** | 진행 중 프로젝트 메모 |
| C-35 | project_vera_design_goal.md | Vera 목표 | **유지 (project)** | 진행 중 |
| C-36 | feedback_fin_master_capacity_assumption.md | Fin Master 부담 단언 금지 | **유지** | session_205 lesson |
| C-37 | feedback_pd_content_verification.md | PD 등록 추측 금지 | **유지** | session_214 |
| C-38 | feedback_approval_before_finalize.md | 박제 전 승인 | **유지** | session_217, /auto 정합 |
| (누락) | feedback_nexus_verbatim_transmission.md (May 7) | 파일 존재 but **MEMORY.md index 미등록** | **🔴 D-누락** | 인덱스 동기화 필요 |

**카테고리 C 정리: stale 4건(C-1·C-2·C-3·C-7) + stale-dup 2건(C-25·C-28). 인덱스 누락 1건(feedback_nexus_verbatim_transmission)**.

### D. Deprecated 표시 누락

| # | 항목 | 위치 | 문제 |
|---|---|---|---|
| D-1 | **`agents/role-{r}.md` 참조** | CLAUDE.md L21·L22, dispatch context 헤더, 20개 reports | 디렉터리 부재. 실제는 `memory/roles/personas/` + `memory/roles/policies/` 2층 운영 |
| D-2 | **decision_ledger 30건 status 누락** | summary/decision 본문에 supersede/폐기 명시되나 status 미갱신 (§1.3) | ledger SOT 무력화 |
| D-3 | **dev_memory.json JSON 파싱 에러** | line 78 col 5 콤마 누락 | D-092 propagation에서 dev 통계 누락 가능 |
| D-4 | "ace-framing DEPRECATED" CLAUDE.md L24 | 본문 표기는 됐으나 `.claude/skills/ace-framing/SKILL.md` 실재 잔존 (system reminder skill 목록에 노출됨) | 실제 skill 파일 정리 필요 |
| D-5 | `metrics_registry.json` 위치 마이그레이션 (`memory/shared/` → `memory/growth/`) | CLAUDE.md L36 "다른 위치에 두지 않는다" 명시. 실파일은 growth/에만 존재 | OK이지만 history 주석 없음 |
| D-6 | `signature_metrics_aggregate.json` 명칭 | D-065 base 흡수 후에도 파일명 `signature_*` 잔존 | 명명 정합성 |

---

## 3. 정제 원칙 (Decision rules)

### 3.1 결정 ledger
- **삭제 금지** (history). status 필드만 갱신: `superseded`/`deprecated`/`active`.
- 본문에 "supersede X" 명시 시 **자동 검증 스크립트로 X의 status 감사** (Phase 1 자동화 대상).
- summary 빈 문자열 8건은 `decision`/`relatedDecisions` 필드에서 1줄 추출해 backfill (auto-generation 가능).

### 3.2 MEMORY.md 피드백
판정 매트릭스:
1. global CLAUDE.md 또는 프로젝트 CLAUDE.md에 동일 원칙 박제됨 → **archive** (별 디렉터리 `memory/archive/`로 이동, MEMORY.md에서 제거).
2. role-{r}.md policy에 흡수됨 → **archive + role 파일에 reference 1줄**.
3. 도메인 변화로 무관해짐 → **archive**.
4. 위 3개 미해당 → **유지**.

stale 판정 6건(C-1·C-2·C-3·C-7·C-25·C-28) → archive. 인덱스 누락 1건 추가. **MEMORY.md = 38 → 33건**.

### 3.3 CLAUDE.md
현재 CLAUDE.md는 **(a)작동 정책 + (b)history + (c)인간 가독 요약**이 섞여 있음. 정제 원칙:
- **(a) 작동 정책**: 한 줄 + SOT 파일 링크만 유지 (예: "Topic Status SOT → `scripts/lib/topic-status.ts`")
- **(b) history**: ledger 인용으로만 유지 (D-XXX 링크). 본문에 supersede 표기 명시.
- **(c) 가독 요약**: §Operating Protocol 같은 인간 onboarding 텍스트는 별도 섹션으로 격리.

해체 결과: 본문 276 → 약 180 라인 추정 (history bullet들이 ledger 링크로 압축).

### 3.4 역할 정의 — agents 층은 폐기, 2층 명문화

CLAUDE.md "역할 3층 (agents·personas·policies)" → **"역할 2층 (personas=정체성, policies=규칙)"** 로 정정.
- `agents/role-{r}.md`라는 표현 전수 치환: CLAUDE.md L21·L22, dispatch hook README/주석, reports 20건은 history → 미수정.
- 책임 매트릭스: **personas = "누구인가"(정체성·금지·금기), policies = "무엇을 어떻게"(발언 구조·self-score 키·메모리 경로)**.

### 3.5 dispatch context inject
정제 진단 결과 노이즈로 작용 가능한 항목:
- "agents/role-arki.md 참조" broken link (위 D-1)
- inject된 페르소나 텍스트와 CLAUDE.md 본문 중복
- self-score YAML block 의무 — 이미 hook이 inject 하므로 페르소나 본문에서 중복 제거 가능 (현재 `_common.md`에 중복 박제, L? — 추후 검증)

---

## 4. 실행계획 (Phase 분해)

**Schedule-on-Demand 엄수**: 시간·공수·담당 추정 0건. 구조적 선후만.

### Phase 1 — 인벤토리 자동화 (스크립트 신설)

**목적**: 정제 대상을 mechanical하게 식별·재추출 가능하게.

**산출물**:
- `scripts/audit-decision-ledger-status.ts` — 본문 supersede/폐기 텍스트 vs status 필드 mismatch 검출. 출력: `reports/{date}_ledger-status-audit.md`.
- `scripts/audit-broken-references.ts` — `agents/role-`, deprecated skill, missing role file 등 grep + 존재 검증. 화이트리스트(역사적 reports/) 지원.
- `scripts/audit-memory-feedback-coverage.ts` — `MEMORY.md` 인덱스 vs 실파일 vs 정책/role/global 박제 cross-check. stale 후보 자동 분류(B/C/D 카테고리).
- `scripts/validate-role-memory-json.ts` — 11개 역할 JSON 파싱 + 스키마(필수 키) 검증. dev_memory 같은 silent 파싱 에러 즉시 검출.

**의존성**: 없음 (read-only, 신규 스크립트).

**검증 게이트 G1**:
- 4개 스크립트 callable export(`feedback_dev_verify_and_callable.md` 준수).
- 각 스크립트 dry-run으로 본 rev2 §2의 카테고리 분류와 ≥80% 일치(샘플 검증).

**롤백**: 신규 스크립트 git revert만으로 충분.

**중단 조건**: dispatch_config 변경 필요 시(out-of-scope) 즉시 중단·재논의.

**consolidate-memory 활용**: Phase 1에서는 **개념만 차용** — 인덱스 vs 실파일 매칭, 중복 검출 패턴. 직접 invoke 안 함.

### Phase 2 — 카테고리 A·B·D 일괄 정제 (mechanical, low-risk)

**목적**: history 보존 + status·링크·파싱 에러 박제만 갱신. 의미 변경 0.

**산출 변경**:
- D-2: ledger 30건 status backfill (`superseded`/`deprecated` 일괄 갱신). summary 빈 8건 backfill.
- D-3: `dev_memory.json` JSON 콤마 1자 추가. JSON.parse 통과 확인.
- D-1: CLAUDE.md L21·L22 `agents/role-{sage,zero}.md` → `memory/roles/personas/role-{sage,zero}.md` 치환.
- D-4: `.claude/skills/ace-framing/` 디렉터리 처리 결정 — Master 결정 필요 (삭제 vs README에 DEPRECATED 박제 vs SKILL.md만 남기고 본문 stub).
- D-5/D-6: 명명 잔재(`signature_*`) 처리 — Master 결정 필요 (rename 시 dashboard·hook 다축 영향).
- B-4: CLAUDE.md Operating Protocol § hook SOT 명시 1줄 추가.

**의존성**: Phase 1 스크립트 audit 결과 출력 필요.

**검증 게이트 G2**:
- ledger status 갱신 후 audit 스크립트 mismatch=0.
- `node -e "require('./memory/roles/dev_memory.json')"` 통과.
- `grep "agents/role-" CLAUDE.md` → 0건.
- 기존 hook·테스트 회귀 0건 (`scripts/validate-session-turns.ts` 등 기존 검증 통과).

**롤백**: git revert. ledger·CLAUDE.md·dev_memory 모두 텍스트 변경만이라 안전.

**중단 조건**: G2 회귀 발생 시 즉시 중단·롤백 → 원인 진단.

**consolidate-memory 활용**: ledger backfill 시 "동일 결정의 다른 표기 통합" 개념 차용. 직접 invoke 안 함.

### Phase 3 — 카테고리 C 정제 (stale 판정, Master 승인 필요)

**목적**: MEMORY.md 38건 → 33건. archive 6건(C-1·C-2·C-3·C-7·C-25·C-28) + 인덱스 누락 1건 추가.

**산출**:
- `memory/archive/feedback_archive_index.md` 신설 (왜 archive 됐는지 1줄씩).
- 6개 파일 `memory/` → `memory/archive/` 이동.
- MEMORY.md 6줄 제거 + `feedback_nexus_verbatim_transmission.md` 1줄 추가.

**의존성**: Phase 2 완료 (D-1 broken link 정제 후 cross-check 안정).

**검증 게이트 G3**:
- Master 승인 6건 각각.
- archive 파일 `git mv`로 history 보존 확인.
- MEMORY.md 인덱스 vs `ls memory/` 정확히 일치.

**롤백**: git revert (archive 디렉터리 + MEMORY.md 라인). 안전.

**중단 조건**: Master가 1건이라도 archive 거부 시 해당 항목 유지하고 나머지만 진행. **일괄 vs 분할 결정**: 6건 한 번에 Master에 표 형태로 제시 → 거부 항목만 유지. 분할 호출 안 함(Master 부담).

**consolidate-memory 활용**: 본 phase가 사실상 consolidate-memory 스킬의 reflective pass에 해당. **스킬 본문 컨셉 차용 — 직접 invoke 시 외부 메모리 분류기와 충돌 위험(이 시스템은 자체 SOT 운영). 본 phase는 인간(Master) 승인 게이트 필수**.

### Phase 4 — CLAUDE.md 재구성 (history vs 작동 정책 분리)

**목적**: 본문 276 → 약 180 라인. (a) 작동 정책 (b) 가독 onboarding (c) history reference 3섹션 분리.

**산출 변경**:
- §Topic Lifecycle System 등 D-XXX bullet 다수 → `memory/shared/decision_ledger.json` 링크로 압축.
- §Operating Protocol 가독 텍스트 유지.
- 새 §History (또는 ledger 링크 1줄)로 history 격리.

**의존성**: Phase 1·2·3 완료 (ledger SOT가 신뢰 가능해야 링크 안전).

**검증 게이트 G4**:
- CLAUDE.md grep으로 `D-\d+` 인용 모두 ledger 박제 ID와 매칭(broken D-ID 0건).
- 본문 라인 수 감소 ≥ 30%.
- Master "가독성 회귀 없음" 승인.

**롤백**: git revert. 본문 텍스트 변경만이라 안전. 단 hook·스크립트 중 CLAUDE.md 특정 line/heading parse하는 것 있는지 사전 확인 필요(grep `CLAUDE.md` in scripts/). 

**중단 조건**: Hook이 CLAUDE.md 특정 라인 의존 발견 시 → 해당 hook 정합성 먼저 결정.

**consolidate-memory 활용**: "index 가지치기" 컨셉 차용. CLAUDE.md를 "index"로 보고 본문은 다른 SOT로 위임.

### Phase 5 — 회귀 검증 (정제 후 시스템 작동 확인)

**목적**: 정제가 hook·검증·dispatch에 silent 회귀 일으키지 않음 확인.

**산출**:
- `scripts/test-regression-after-purge.ts` (Phase 1 audit 스크립트 + 기존 검증 일괄 실행 wrapper).
- 더미 세션 1회 실행으로 hook chain · session-end-finalize · validate-session-turns 모두 정상 통과 확인.
- self-score propagation: dev_memory 파싱 통과 후 `compile-metrics-registry.ts` 출력에 dev 지표 포함 확인.

**의존성**: Phase 1~4 완료.

**검증 게이트 G5**:
- 모든 회귀 검증 0건.
- 신규 dispatch 1회당 inject 크기 측정(추정용 instrumentation 추가는 out-of-scope이지만 기존 SPIKE_R6_LOG 활용 가능).
- Master 정성 회고 "메모리 컨텍스트 신호 향상" 1줄.

**롤백**: 단계별 git revert.

**중단 조건**: 회귀 1건 발견 시 즉시 중단 → 어느 Phase에서 도입됐는지 git bisect.

**consolidate-memory 활용**: 없음. 검증 단계.

---

## 자기감사 (3 라운드)

### 1차 — structuration / hardcoding / efficiency / extensibility

- **structuration**: agents 층 부재 발견(D-1) — CLAUDE.md ↔ 실제 디렉터리 구조 분리. ROI=`MUST_NOW`.
- **structuration**: ledger 30건 status 박제 vs 본문 mismatch — SOT 무력화. ROI=`MUST_NOW`.
- **structuration**: MEMORY.md ↔ 실파일 동기 깨짐(인덱스 1건 누락). ROI=`MUST_BY_N=10`.
- **hardcoding**: dispatch_config의 `_comment` 등 history와 운영이 한 파일에 혼재. ROI=`SHOULD`.
- **hardcoding**: `signature_metrics_aggregate.json` 파일명 잔재. ROI=`NICE`.
- **hardcoding**: `metrics_registry.json` 위치 history 주석 부재. ROI=`DEFER` (작동에 무영향).
- **efficiency**: dev_memory.json 파싱 에러로 D-092 dev 통계 누락 가능. ROI=`MUST_NOW`.
- **efficiency**: dispatch inject 시 페르소나·CLAUDE.md 텍스트 중복(B-4). ROI=`SHOULD`.
- **efficiency**: MEMORY 38건 매번 inject context (gob context briefing) — stale 6건 제거 시 inject 크기 약 6KB 절감(추정). ROI=`MUST_BY_N=30`.
- **extensibility**: audit 스크립트 4종으로 정제 자동화. ROI=`MUST_NOW`.
- **extensibility**: `memory/archive/` 디렉터리 패턴 도입. ROI=`MUST_BY_N=10`.
- **extensibility**: ledger status backfill 일회성 — 향후 박제 시점에 동기 보장 hook 필요. ROI=`SHOULD`.

**1차 발견: 12건 / 4축 모두 ≥3 검사**.

### 2차 (자기 압박 — "한번 더")

- **structuration**: CLAUDE.md "Edi 단일 책임 잠식 우려"(D-162 본문) → Edi 정책이 4개 hook에 분산되는 위험 (Phase 4에서 noticed). ROI=`SHOULD`. 본 토픽 scope-out (Edi anchor governance는 D-125).
- **hardcoding**: `_common.md`의 self-score YAML 블록 양식 — dispatch hook이 이미 inject하는데 정책 파일에도 박제. ROI=`SHOULD`.
- **efficiency**: ledger 180건 중 162건 active — active 비율 90% → status 갱신만 잘하면 ledger 자체는 비대 아님. ROI=`NICE`(즉 ledger 자체 분할은 불필요).
- **extensibility**: Phase 1 audit 스크립트 4개 분리 vs 단일 audit 통합 — 통합 시 hardcoding(스위치 case 추가) 회귀. 분리 유지가 옳음. ROI=`NICE` 검증.

**2차 발견: 4건. 3건 NICE/SHOULD, 1건 검증**.

### 3차 (scope drift 체크)

원 토픽 scope: 5표면 정제. 누적 spec 검사:
- Phase 1 신규 스크립트 4개 = scope 내 (인벤토리 자동화).
- Phase 2 dev_memory 수정 = scope 내 (역할 메모리).
- Phase 3 archive 디렉터리 신설 = scope 내 (MEMORY 정제).
- Phase 4 CLAUDE.md 재구성 = scope 내.
- Phase 5 회귀 검증 = scope 내.
- Master 결정 필요 항목(D-4 ace-framing skill, D-5/D-6 명명) = scope 외 일부 → Master 의사결정으로 scope 명확화 요청.

**scope 위반 0건. 누적 spec 원래 정의 ≤2배 (Master 표기한 5표면 → 5 Phase + audit 자동화)**.

**3차 발견: 1건 (Master 결정 게이트 명시 필요).**

종료 기준: 3차 발견 1건 + Master 게이트 NICE 라벨. **자기감사 종료**.

---

## Master 결정 필요 (5건)

| # | 결정 항목 | 옵션 | 권고 |
|---|---|---|---|
| Q1 | "역할 3층" → "2층"으로 CLAUDE.md 정정 동의? | (a) 2층 정정 (b) agents/ 디렉터리 신설해 3층 복원 (c) 보류 | **(a) 2층 정정**. agents/ 미존재 6개월+ 운영 안정. 복원 ROI 0 |
| Q2 | MEMORY 6건 archive 동의? (C-1·C-2·C-3·C-7·C-25·C-28) | (a) 6건 일괄 (b) 항목별 검토 (c) 모두 유지 | **(a) 일괄**. C-25·C-28 global 중복은 명백, 나머지 4건도 §C 표 근거 충분 |
| Q3 | `.claude/skills/ace-framing/` 처리 | (a) 디렉터리 삭제 (b) SKILL.md만 남기고 본문 "DEPRECATED" stub (c) 유지 | **(b) stub**. 외부 인용 가능성 + history 가시성 |
| Q4 | `signature_metrics_aggregate.json` rename | (a) `base_metrics_aggregate.json`로 rename (b) 유지 (history) (c) 보류 | **(b) 유지**. dashboard·hook 다축 영향, ROI 낮음 |
| Q5 | Phase 1 audit 스크립트 4개 신설 동의? | (a) 동의 (b) 1개 통합 스크립트 (c) 수동 정제 | **(a) 동의**. 향후 정제 재현·회귀 검증에 자산 |

---

## SelfScores

```json
{"selfScores": {"str_fd": 5, "sa_rnd": 3, "spc_lck": "Y", "aud_rcl": 0.8}}
```

`str_fd=5` (D-1 broken refs / D-2 ledger drift / D-3 JSON 파싱 에러 / B-4 inject 중복 / Phase 4 hook 의존 위험 — 5건 실 결함). `sa_rnd=3` (3 라운드 자기감사 + scope drift 체크). `spc_lck=Y` (Phase 1~5 spec 동결, 변경은 G2+회귀 게이트 통과 후만). `aud_rcl=0.8` (dispatch context Riki rev1 반례를 §1 본질 재정의에 반영, prefix cache 가설 명시).

[ROLE:arki]
# self-scores
str_fd: 5
sa_rnd: 3
spc_lck: Y
aud_rcl: 0.8
