---
role: arki
session: session_173
topic: topic_150
topicId: topic_150
turnId: 0
phase: structure-analysis
rev: 1
invocationMode: subagent
---

# Arki — Zero 전체 로직 비효율 점검 (식별·정리 단계)

Arki입니다. Zero 페르소나의 다축 footprint를 전수 조사하고, 비효율·중복·잔재·정합 깨진 지점만 식별합니다. 제거는 본 보고서 범위 밖.

---

## 1. 전체 시야 인벤토리 (다축)

| 축 | 파일 | 내용 요약 | 상태 | 비고 |
|---|---|---|---|---|
| CLAUDE.md | `CLAUDE.md` L24 | Zero 정의 한 줄 (D-127, 3 영역, Cut/Refine/Audit, anchor governance Edi 분담) | active | 본문은 정합. 단 `D-119 본문 박제` 참조가 supersede 후에도 존속 |
| CLAUDE.md | `CLAUDE.md` L20 | 역할 분리 라인에 `zero` 포함 | active | 정합 |
| persona | `memory/roles/personas/role-zero.md` | 78줄 페르소나 정의. 모델 Marie Kondo+Stroustrup. 3 영역, 내부 도구 3, 호출 규칙, R&R, Default Q, 원칙 | active | `excludedAssets` 명문화하나 실체 부재(아래 §2.4) |
| policy | `memory/roles/policies/role-zero.md` | 69줄 발언구조·지표·강제 제약 | active | persona와 텍스트 일부 중복(scope_areas / excludedAssets 재기술) |
| memory | `memory/roles/zero_memory.json` | scope·skills·policy·metrics·selfScoreShortKeys | active | `policy.excludedAssets` 박제 — 동일 정보 3중 (persona·policy·memory) |
| dispatch_config | `memory/shared/dispatch_config.json` `rules.zero` | scope_areas, session_isolation, auto_hook, internal_tools, supersedes | active | **`excludedAssets` 누락** (persona/policy/memory와 SOT drift). `trigger` 블록 부재 (Edi rule과 비대칭) |
| skill | `.claude/skills/` | Zero 전용 skill 없음. Cut/Refine/Audit 외부 skill 부재 | by-design | persona가 "내부 흡수" 명시. 정합. |
| agent | `.claude/agents/` | 디렉터리 비어있음(전 역할 공통) | by-design | 정합 |
| hook | `.claude/hooks/post-tool-use-task.js` L36, `pre-tool-use-task-sage-gate.js` L35 | KNOWN_ROLES 배열에 `'zero'` 포함 | active | 정합. 단 sage-gate hook은 Sage 전용임에도 KNOWN_ROLES를 별개로 박제 — 두 hook이 같은 상수를 독립 유지 |
| hook | sage-gate `excludedAssets` enforce | 없음 | gap | dispatch_config의 excludedAssets는 어떤 hook도 read·enforce하지 않음 (코드 부재 확인) |
| script | `scripts/` | Zero 직접 참조 0건. (false positive: zero-fill, regression_zero 등은 무관) | clean | 정합 |
| metrics | `memory/growth/metrics_registry.json` | `zero.ref_count` `zero.hc_found` `zero.clean_rate` 3건 등록 (L1676-) | active | shortKey: `ref_cnt`, `hc_found`, `cln_rt`. 정합 |
| role_registry | `memory/shared/role_registry.json` | **Zero 항목 없음**. roles 배열에 ace/arki/fin/riki/nova/dev/vera/edi 8개만. | **stale** | Sage·Jobs도 동시 결손 (10인 체제 reflection 미이행) |
| role_palette | `memory/shared/role_palette.json` | **Zero 색상 없음**. palette.roles에 8개만. | **stale** | 동일 — Sage·Jobs도 누락 |
| topic_load_manifest | `memory/shared/topic_load_manifest.json` | `zero` 키워드 매핑 0건 | gap | 다른 역할은 키워드→memory 매핑 존재 추정 (manifest grep 0 hit) |
| decision_ledger | `D-110` | 원안 (Zero 9번째 페르소나 신규, 3 스킬 외부) | superseded by D-119 | statusNote 갱신됨 |
| decision_ledger | `D-119` | 정제 페르소나 정의 + 내부 흡수 | active | 본문 박제 D-127로 분리 |
| decision_ledger | `D-125` | 미션×도구 매핑 + NCL excludedAssets | active 단 NCL 의존 | NCL 전면 폐기(D-133) 후에도 `memory/shared/ncl_violations.jsonl` 명문 잔존 |
| decision_ledger | `D-127` | 페르소나 갱신 본문 박제 (P2 1/3) | active | D-110 supersede 확정 |
| decision_ledger | `D-133` | NCL 전면 폐기 + Sage/Zero 갱신 | active | Zero 본체는 보존, NCL 의존 부분만 영향 |
| reports | `reports/2026-04-29_big-bang-legend-nexus-p2-1of3/` `reports/2026-05-01_big-bang-legend-nexus-p3-1of2/` | Zero 첫 dry-run 보고서 + 후속 호출 흔적 | historical | 정합 |

---

## 2. 비효율·중복·잔재·정합 불일치 식별

### 2.1 [중복 정의] excludedAssets 3중 박제 — 강도 🟡

같은 정책(`memory/shared/violations/*` 차단)이 4 위치에 산재:
1. `memory/roles/personas/role-zero.md` 본문 호출 규칙
2. `memory/roles/policies/role-zero.md` 강제 제약
3. `memory/roles/zero_memory.json` `policy.excludedAssets`
4. (본래 SOT여야 할) `dispatch_config.json` `rules.zero` — **여기는 누락**

→ SOT drift. enforce 코드도 없음(아래 2.4).

### 2.2 [중복 정의] scope_areas 3중 박제 — 강도 🟢(낮음)

`["tech-debt", "security-review", "simplify"]`가 persona·policy·memory·dispatch_config 4 위치 모두 박제. dispatch_config가 SOT라면 persona/policy는 참조형 prose로 단축 가능.

### 2.3 [stale 참조] D-119 본문 박제 표기 잔존 — 강도 🟢

`CLAUDE.md` L24 Zero 라인에 `(D-127, 2026-04-29 / D-119 본문 박제 / D-133 갱신 2026-05-01)` 3 결정 모두 표기. D-127이 D-119 본문 박제를 완료한 supersede 결정이므로, supersede 이후엔 D-127만 표기해도 충분(혹은 chain 표기 단순화). 큰 위해는 없음.

### 2.4 [phantom 정합] excludedAssets는 어떤 코드도 read하지 않음 — 강도 🔴

- 보호 대상(`memory/shared/violations/`, `ncl_violations.jsonl`) **파일·디렉터리 부재** (실측: ls 결과 'No such file or directory').
- D-133에서 NCL 전면 폐기. 보호할 자산이 없는 정책이 4 위치에 박제됨.
- `excludedAssets` 키워드 코드 grep: 정책 문서 4건만, hook·script 0건. → 자기 검열 우회 차단 enforce 메커니즘은 **persona의 자율 판단 의존**(D4 prime directive 위반 위험 — "enforcement는 코드에 박제하고 모델 자율 판단에 의존하지 않는다").

### 2.5 [stale] D-125 NCL ncl_violations.jsonl 명시 — 강도 🟡

D-125 본문에 `memory/shared/ncl_violations.jsonl` hard-exclude 명시. NCL은 D-133에서 전면 폐기. 결정 본문은 신성하지 않으나(D-134), Zero 호출 시 인용되면 폐기된 인프라를 가리키는 dead pointer.

### 2.6 [정합 불일치] dispatch_config.rules.zero가 정책 sparse — 강도 🟡

Edi rule(34줄, trigger·ownership·enforcement_note 포함)과 비교해 Zero rule은 8줄. `enforcement_note` 부재. `excludedAssets` 부재. trigger 키워드 부재. 8역할 정책 비대칭 해소(topic_142, D-141 caveat) 작업이 Zero에는 미적용. (Master 피드백: 정착된 정책 재질문 금지 — 단 비대칭은 식별 가치 있음)

### 2.7 [중복 박제] KNOWN_ROLES 배열 hook 2개에 독립 박제 — 강도 🟢

`post-tool-use-task.js` L36과 `pre-tool-use-task-sage-gate.js` L35가 동일 12 역할 배열을 각자 보유. 순서만 살짝 다름(`zero` 위치). Zero 한정 이슈 아님 — 시스템 전체 잔재 패턴.

### 2.8 [미사용 잔재] internal_tools 배열 — 강도 🟢

`dispatch_config.rules.zero.internal_tools: ["Cut","Refine","Audit"]`. 어떤 코드도 read하지 않음. persona·policy 본문에 동일 정보 박제. 정보적 의의만.

### 2.9 [정합 깨짐] role_registry / role_palette에 Zero 부재 — 강도 🔴

- `role_registry.json`: 8개만(ace/arki/fin/riki/nova/dev/vera/edi). Zero/Sage/Jobs 누락.
- `role_palette.json`: 동일 8개만.
- 영향: 대시보드·viewer 색상 매핑·`applicableTopicTypes` 매핑이 Zero에 없음. 시각화에서 Zero 발언이 무색·미분류로 출력될 위험.
- **Zero 단독 이슈 아님** — 신규 3 페르소나(Sage, Zero, Jobs) 공통 결손. 본 토픽이 Zero이므로 식별만 보고, 후속은 별도 토픽 권고.

### 2.10 [모호 영역] 영역 경계 — 강도 🟡

- `tech-debt`(Cut)와 `simplify`(Refine)의 경계가 정량 기준 없이 정성: "삭제할지 합칠지". D-125가 우선순위(`Audit > Refine > Cut`)는 박제했으나 영역 판정 알고리즘 부재.
- Sage(메타 read-only)와 Zero(산출물 정제) 분리는 D-127·D-133에서 명문화. 정합.
- Edi(anchor governance)와 Zero(정제) 분리는 D-125에서 명문화. 정합.
- 따라서 외부 페르소나와의 경계는 정합. **내부 3 영역 경계만 모호**.

### 2.11 [topic_load_manifest 미등록] — 강도 🟡

`memory/shared/topic_load_manifest.json`에 `zero` 키워드 매핑 0건. CLAUDE.md Session Start checklist 4번 "토픽 제목 키워드로 타입 판별 → 해당 role memory만 선택 로드" 메커니즘에서 Zero 관련 토픽이 들어와도 zero_memory.json 자동 로드 안 됨. (확인 필요: manifest 구조 자체가 zero를 의도적으로 빼는지)

---

## 3. 정리 후보 리스트 (영향 / mitigation / 검증)

| # | 카테고리 | 후보 | 영향 범위 | mitigation | 검증 방법 |
|---|---|---|---|---|---|
| C1 | phantom 정합 | `excludedAssets` 정책 4 위치 박제 → SOT 1곳(dispatch_config)으로 통합 + read enforce hook 신설 OR 정책 자체 폐기 | persona/policy/memory/dispatch_config 4 파일. enforce hook 신설 시 pre-tool-use-task에 Zero gate 추가 | (a) 폐기안: D-133이 NCL 전면 폐기 → 보호 대상 부재 → 폐기가 일관됨 (b) enforce안: hook 신설 + Zero 호출 시 prompt에서 해당 경로 strip. **Master에 폐기/유지 의사결정 요청 필수**. (Schedule-on-Demand: 일정 산정 X) | grep `excludedAssets` 시 SOT 1곳만 / hook이 read하는지 행위 검증 |
| C2 | stale 참조 | D-125 본문 NCL `ncl_violations.jsonl` 명문 → D-133 supersede 표기 또는 amendment | decision_ledger 1건 | "박제는 신성하지 않다"(D-134) — supersededBy/amendedBy 또는 statusNote 추가. 본문은 보존 | ledger 검증 스크립트로 dead pointer 탐지 |
| C3 | 중복 정의 | scope_areas 4중 박제 → dispatch_config SOT, 나머지 prose 참조형으로 단축 | persona/policy/memory 3 파일 | 변경은 텍스트만, 기능 영향 없음. 단 prose 가독성 손실 가능 | 스키마 검증: SOT 1곳에서 read한 값을 prose가 가리키는지 |
| C4 | stale | role_registry.json·role_palette.json에 Zero/Sage/Jobs 추가 | 대시보드·viewer 색상 매핑 | **본 토픽 범위 밖** — 3 페르소나 공통 이슈. 별도 토픽으로 분리 권고. 추가 시 색상 충돌·중복 회피 검증 필요 | 대시보드 빌드 후 Zero 발언 색상 출력 확인 |
| C5 | 정합 비대칭 | dispatch_config.rules.zero에 `trigger`·`ownership`·`enforcement_note` 보강 (Edi rule 패턴 참조) | dispatch_config 1건. enforce 코드 신설 X (config-only) | Edi rule처럼 hook이 read하지 않는 정책 일관성 박제용도 가능. ROI 0 자동 감시 회피 명문(D-142) | rule 스키마 검증, hook 비호출 확인 |
| C6 | 중복 박제 | KNOWN_ROLES 배열 hook 2개 독립 → 공통 모듈 추출 | hook 2개. Zero 한정 아님 | `scripts/lib/known-roles.ts` 신설하고 hook이 require | 두 hook 동작 동일성 회귀 테스트 |
| C7 | 미사용 잔재 | dispatch_config.rules.zero.internal_tools 배열 → 정보 가치만, prose에 동일 박제됨 | dispatch_config 1건 | 삭제 또는 유지(저비용) — Master 판단 사항 | grep 후 read 코드 0건 재확인 |
| C8 | 모호 영역 | 3 영역(tech-debt/security-review/simplify) 경계 정량 기준 박제 | persona/policy 본문 보강 | "3줄 패턴 N회"·"중복 N위치"는 이미 일부 박제. tech-debt vs simplify 분기 룰 누락 → 후속 토픽 | Zero 호출 사례 누적 후 영역 분류 일관성 측정 |
| C9 | 매니페스트 결손 | topic_load_manifest에 `zero` 키워드 등록 | manifest 1건 | 키워드 후보: "정제·보안 리뷰·tech-debt·simplify·하드코딩". manifest 구조 선조사 필요 | Zero 관련 토픽 /open 시 zero_memory 자동 로드 확인 |

---

## 4. 자기감사 (Master 압박 가정 — "한번 더, 빠뜨린 축?")

### 1차 감사 — 빠뜨린 축 점검

- ✅ persona / policy / memory / config / skill / agent / hook / script / metrics / decision_ledger / reports — 11 축 cover
- ⚠ **viewer/대시보드 컴포넌트 스캔 미실행** — `app/` 또는 `dist/` 내 Zero 색상·라벨 hardcode 가능성. role_registry/palette 결손과 연결.
- ⚠ **session_index·current_session.json**에서 Zero 발언 turns가 어떻게 기록되는지 행위 검증 미실시. role 식별이 KNOWN_ROLES에 의존하므로 이론적으론 정합이나 실측 X.
- ⚠ **token_log.json·dashboard_data.json**의 Zero 집계 분기 미점검. role_palette 결손이 색상에만 영향인지 집계 자체에 영향인지 미확인.
- ⚠ **AGENTS.md / CONTEXT.md** grep 결과: Zero 언급 0. 두 문서가 8역할 시점 잔재인지 의도적 비박제인지 미확인.
- ✅ SOT 4 위치(persona/policy/memory/config) 비교 완료
- ✅ NCL 의존 잔재 D-133 정합 점검 완료

### 2차 감사 — 결함 추가 발견

- 🟡 D-110(원안)이 D-127로 supersede됐고 statusNote 갱신됐지만, decision_ledger에 D-110→D-127 chain 외에 D-119 본문 박제 결정도 별도 ID(D-127). chain이 D-110→D-119→D-127 3단인지, D-110+D-119→D-127 병합인지 ledger 표기만으론 모호. 의사결정 추적성 약화.
- 🟡 zero_memory.json `selfScoreShortKeys`는 3건이나 metrics 배열도 3건으로 동일. 단 metrics_registry는 SOT — zero_memory의 metrics 배열은 mirror로 봐야 함. 중복 박제 1건 추가.

### 결함 종합

본 1차+2차 감사로 §2의 11 항목 외 **추가 발견 3건**(viewer/dashboard 행위 미검증, decision chain 모호, zero_memory.metrics mirror 중복). 모두 정리 후보 추가 가능. 단 ROI 라벨 기준 NICE/DEFER 수준.

### scope drift 체크

본 보고서는 **식별·정리만** 수행, 제거 실행 X. Master scope 준수. spec 누적 1배 — drift 없음.

### 종합

후보 9건(§3 C1~C9) + 자기감사 추가 3건 = **총 12건**. 핵심 카테고리 5종: ① phantom 정합(C1) ② 중복 정의(C3·C7·zero_memory.metrics) ③ stale 참조(C2·D-119 표기) ④ 정합 비대칭(C5) ⑤ 결손(C4·C9·viewer 미검증).

🔴 즉시: C1, C4 (Master 의사결정 필요)
🟡 검토: C2, C3, C5, C8, C9
🟢 NICE/DEFER: C6, C7, decision chain 모호

---

ARKI_WRITE_DONE: C:/Projects/legend-team/reports/2026-05-02_zero-logic-inefficiency-audit/arki_rev1.md

[ROLE:arki]
# self-scores
aud_rcl: Y
str_fd: 4
spc_lck: N
sa_rnd: 2
