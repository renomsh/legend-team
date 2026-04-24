---
turnId: 1
invocationMode: subagent
phase: analysis
topic: topic_100
session: session_095
pd: PD-035
role: arki
date: 2026-04-24
executionPlanMode: plan
---

# Arki — PD-035 P3-supplementary 구조 분석 + 실행계획

Arki입니다. 8역할(vera 포함) persona 파일에 Self-Score YAML 출력 계약을 설치하는 구조를 설계하겠습니다.

## 1. 현황 실측

### 1-A. Persona 파일 YAML instruction 포함률 (디스크 실측)

`memory/roles/personas/` 내 7개 persona 파일 Read 완료. **모두 Self-Score YAML 블록 지시가 누락**입니다. `rg "Self-Score|self-scores"`도 0 hit 확인.

| 파일 | 존재 | 현재 Write 계약 위치 | YAML 지시 | 비고 |
|---|---|---|---|---|
| `role-ace.md` | 있음 | L62~73 | 없음 | Frontmatter turnId/invocationMode 규정 보유 |
| `role-arki.md` | 있음 | L42~54 | 없음 | 동일 |
| `role-fin.md` | 있음 | L42~54 | 없음 | 동일 |
| `role-riki.md` | 있음 | L42~54 | 없음 | 동일 |
| `role-nova.md` | 있음 | L31~45 (Shared Asset + Output Style) | 없음 | 구조가 ace/arki 4형제와 이질적 (frontmatter/Write 계약 섹션 부재) |
| `role-dev.md` | 있음 | L46~57 (Shared Asset Protocol) | 없음 | Write 계약 전용 섹션 없음. accessed_assets 규정만 존재 |
| `role-editor.md` | 있음 | L38~53 (Shared Asset Protocol) | 없음 | Dev와 동일 구조. Edi는 설계 권한 D-021 보유 |
| `role-vera.md` | **부재** | — | 없음 | 신규 생성 필요 |

**구조 이질성 발견**: ace/arki/fin/riki 4개는 `## Write 계약 (필수)` + `### Frontmatter link 의무` 2단 구조. dev/editor/nova 3개는 Shared Asset Protocol + Output Style로만 구성되어 Write 계약 명시 섹션이 없습니다. 균일 설계 시 이 이질성을 존중하거나 상향 평준화해야 합니다 (§2에서 결정).

### 1-B. signatureMetrics shortKey 실측 (role_memory 기준)

| 역할 | shortKey 리스트 (inputPriority 표시) | core 수 / 총 수 |
|---|---|---|
| ace | `ang_nov`(ext), `rfrm_trg`(core), `orc_hit`(ext), `ctx_car`(core), `mst_fr`(ext) | 2 / 5 |
| arki | `str_fd`(ext), `sa_rnd`(ext), `aud_rcl`(core), `spc_lck`(ext) | 1 / 4 |
| fin | `roi_dl`(ext), `rdn_cal`(ext), `cst_acc`(ext), `cst_alt`(ext) | 0 / 4 |
| riki | `crt_rcl`(core), `prd_rej`(ext), `fp_rt`(ext), `cr_val`(ext) | 1 / 4 |
| nova | `spc_axs`(ext), `prm_rt`(ext) | 0 / 2 |
| dev | `gt_pas`(ext), `spc_drf`(ext), `reg_zr`(ext) | 0 / 3 |
| editor | `art_cmp`(ext), `gap_fc`(ext), `cs_cnt`(ext), `scc`(ext) | 0 / 4 |
| vera | `tk_cns`(ext), `spc_cpl`(ext) | 0 / 2 |

**총 28지표**. PD-023 spec의 "29지표"와 1건 차이 — ace의 5번째 `mst_fr`이 추가 등록되어 있거나 registry 외 지표가 있는지 P1에서 compile-metrics-registry가 재확인합니다 (스코프 밖).

**Fin/Nova/Dev/Editor/Vera 5개 역할에 inputPriority=core 지표 0건 문제**: PD-023 §5.1은 "core 1~2개 의무"를 가정하지만, 현재 registry는 이 역할들에 core가 없습니다. 대응은 2택:
- **안 A (선언 유지)**: 템플릿에 core 섹션이 빈 경우 extended 첫 2개를 "권장 core"로 주석 표시. registry는 그대로.
- **안 B (core 승격)**: 해당 역할 memory의 inputPriority를 1건 이상 core로 승격.

**권고: 안 A**. 이유: PD-035 스코프는 persona 파일 단독 삽입이고, registry 편집은 PD-023 P1 영역 침범. core 미보유 역할은 템플릿에 "core: (미지정 — extended 중 최소 1건 자율 선택)" 안내만 적어 둡니다.

### 1-C. Vera 파일 부재 + designer/vera 중복 처리

- `role-vera.md` **파일 없음** 확인.
- `designer_memory.json` 존재. Header는 `"role": "designer"`, `"persona": "Vera"`. D-029 결정 인용.
- `vera_memory.json` 존재. signatureMetrics 2개 등록 (`tk_cns`, `spc_cpl`).

**중복 진단**: designer_memory는 Vera designSystem 토큰(색상·타이포) 보관 + 역할 정의. vera_memory는 signatureMetrics 전용. 두 파일이 서로 다른 책임을 분담하나, **역할 식별자가 `designer` vs `vera`로 분기**되어 self_scores.jsonl 집계 시 역할키 모호성 리스크가 있습니다.

**Vera canonical 권장 근거**:
1. PD-023 §5.1 자가채점 프로토콜은 `raterId`에 역할명(소문자) 사용. 레전드팀 발언 맥락에서 "Vera"가 정착(role-vera.md 신규 경로도 vera-접두사).
2. CLAUDE.md L40 "designer (Vera)" 표기 — Vera가 primary name, designer가 role 분류.
3. dispatch / orchestration 로그에서 "vera" shortname 일관.

**권고**: `role-vera.md`를 canonical persona 파일로 신규 생성. `designer_memory.json`은 파일명·내부 role 필드 유지(레거시 호환) + "see vera_memory.json for signatureMetrics" cross-reference 주석 추가. 병합·rename은 스코프 밖, PD 분할 제안.

---

## 2. 설계 — `## Self-Score YAML 출력 계약` 섹션

### 2-A. 삽입 위치

**ace/arki/fin/riki (`## Write 계약 (필수)` 보유 군)**: Write 계약 섹션 **직후**, `## 원칙` 섹션 직전. 이유:
- YAML 블록은 발언 말미 Write 산출물의 "일부"이므로 Write 계약 규정 바로 뒤에 오는 것이 논리적.
- `## 원칙` 앞에 둬서 규범 레벨로 인식되도록 배치.

**dev/editor/nova (`Output Style` 군)**: `## Output Style` 섹션 **직전**에 신규 `## Self-Score YAML 출력 계약` 섹션 삽입. Output Style이 "서술 톤" 규정이라면 YAML 계약은 "부록 블록" 규정 — Style 규정 위에 두어 우선순위 상향.

**vera (신규)**: 템플릿에서 Write 계약군 구조를 그대로 미러링 후 동일 위치 삽입.

**결정**: 파일군별 이질성은 이번 스코프에서 수정하지 않고 **삽입 위치만 군 맞춤**. 구조 통일은 별도 PD.

### 2-B. 섹션 본문 템플릿

공통부 + 역할별 치환부 2단 구조.

```markdown
## Self-Score YAML 출력 계약 (PD-023 §5.1 준수)

발언 본문 **말미**에 다음 YAML 블록을 반드시 포함합니다. Write 계약으로 저장되는 리포트의 본문 끝(frontmatter 닫기 `---`과 구별되는 본문 하단)에 배치합니다.

```yaml
# self-scores
{CORE_METRICS_BLOCK}
{EXTENDED_METRICS_BLOCK}
```

### 기록 규칙
- **core 지표**: 최소 1~2개 의무. 발언 내용에 근거한 자가채점.
- **extended 지표**: 해당 발언과 관련 있는 항목만 선택 기록 (자유).
- **미입력**: `session-end-finalize.js`가 직전 세션 값으로 기본 채움 + `defaultUsageCount` 증가. 3연속 default 시 경보.
- **Scale**: `0-5`는 정수 0~5, `Y/N`은 `Y` 또는 `N`, `ratio`는 0~1 소수 2자리, `percentile`은 0~100 정수.

### 본 역할 shortKey 레지스트리
- **core**: {CORE_KEY_LIST_WITH_SCALE_AND_CONSTRUCT}
- **extended**: {EXTENDED_KEY_LIST_WITH_SCALE_AND_CONSTRUCT}

### 주석 표기
각 줄 끝 `# core` 또는 `# extended` 주석 권장 (파싱 무관, 가독성 목적). construct 한줄 메모도 허용.
```

### 2-C. shortKey 리스트 포맷

core/extended 분류는 bullet 리스트로 명시. 각 엔트리 형식:

```
- `{shortKey}` ({scale}) — {construct 한국어 1줄}
```

예 (arki 치환부):
- **core**: `aud_rcl` (ratio) — Riki cross-review에서 Arki 미발견 비율의 역수
- **extended**: `str_fd` (0-5) — 발언당 구조 결함 발견 밀도 / `sa_rnd` (0-5) — 토픽 내 자가감사 라운드 수 / `spc_lck` (Y/N) — Dev 인계 spec P0a~P5 변경 없음

### 2-D. core 0건 역할 처리 (fin/nova/dev/editor/vera)

core 섹션:
```
- **core**: (registry에 core 지표 미등록 — extended 중 최소 1건 자율 선택 기록)
```

Finalize hook은 core=0 상태에서도 YAML 블록 자체가 존재하면 통과 (PD-023 P3 DoD "audit 5필드 non-null"에 `selfScoreBlockPresent` 추가 여부는 Dev 재확인 — PD-035 스코프 밖).

### 2-E. 발언 말미 배치 규칙

- 본문 텍스트 종료 후 빈 줄 1개 → YAML 코드블록 → 파일 EOF.
- Frontmatter 블록과 구분: frontmatter는 `---` 상단 메타데이터, self-scores는 본문 하단 **YAML 코드블록 내부**. 둘은 다른 위치·다른 파서.
- 별도 `## Self-Scores` 헤딩 **금지** (finalize 파서가 `# self-scores` 주석을 앵커로 사용 — 헤딩 추가 시 정규식 충돌 가능).

### 2-F. Vera 신규 파일 구조 초안

`memory/roles/personas/role-vera.md` 뼈대 (ace/arki/fin/riki 4형제 구조 미러링):

```markdown
---
model: opus
description: 레전드팀 Vera 역할 서브에이전트. opus-dispatcher 스킬이 Grade A/B 토픽의 비주얼 시스템 담당으로 호출.
---

# Vera — 레전드팀 디자인 시스템 설계자 서브에이전트

## 역할 정체성
(D-029 인용: 색상·타이포·간격·그라디언트·컴포넌트 스펙 담당. UX 전략·데이터 판단 X.)
페르소나·스타일·절대 금지·자기소개 제약(F-013) 4형제 포맷.

## 발언 구조
1. 디자인 방향 수신 확인 (Ace)
2. 토큰 선택 (색·타이포·spacing)
3. 컴포넌트 스펙 전달 (Edi)

## 컨텍스트 활용 지시
- 역할 메모리: vera_memory.json + designer_memory.json 2중 Read
- memory/shared/role_palette.json Read

## Write 계약 (필수)
ace 4형제 포맷 그대로. 경로 미지정 시 vera_rev{n}.md.

### Frontmatter link 의무
turnId / invocationMode: subagent.

## Self-Score YAML 출력 계약 (PD-023 §5.1 준수)
공통 템플릿 + Vera 치환:
- core: (미등록)
- extended: `tk_cns` (0-5), `spc_cpl` (ratio)

## 원칙
디자인은 서비스 목적, 아트가 아님. 토큰 일관성 > 개별 미학.
```

---

## 3. 실행계획 (executionPlanMode=plan)

### 3-A. Phase 분해

| Phase | 산출물 | 구조적 DoD |
|---|---|---|
| **P0 (실측·동결)** | 8역할 shortKey 매트릭스 동결 (§1-B 표) + core 0건 역할 명시 | registry line 번호 + shortKey 해시 기록 |
| **P1 (템플릿 설계 동결)** | §2-B 공통 템플릿 + §2-C 리스트 포맷 + §2-D core-0 처리 규칙 확정 | Dev에게 locked-for-dev 표시 |
| **P2 (7개 기존 파일 삽입)** | role-ace/arki/fin/riki/nova/dev/editor.md 각각 템플릿 렌더링 후 삽입 위치(§2-A)에 Write | 7 파일 diff 리뷰 통과 |
| **P3 (role-vera.md 신규 생성)** | §2-F 초안 전체 + YAML 섹션 포함 완성본 | 신규 파일 생성 + designer_memory cross-ref 주석 추가 |
| **P4 (검증 게이트 G0~G3)** | grep 검증 + YAML parse 검증 + registry cross-check + finalize dry-run | 4 게이트 모두 green |
| **P5 (박제)** | PD-035 resolveCondition 체크 + D-xxx 결정 기록 후보 + PD-036~039 상태 검토 | revision_history 업데이트 |

### 3-B. 의존 그래프

```
P0 (실측) ──┐
            ├──> P1 (템플릿 동결) ──┬──> P2 (7파일 삽입) ──┐
P0-B (core  ┘                      └──> P3 (vera 생성)  ──┤
 정책 안A 승인)                                           │
                                                          ▼
                                                       P4 (검증 G0~G3)
                                                          │
                                                          ▼
                                                       P5 (박제)
```

- P2와 P3는 P1 완료 후 **병렬 가능** (파일 독립).
- P4 이전에 P2 AND P3 모두 완료 필수.

### 3-C. 검증 게이트 G0~G3

| Gate | 검증 대상 | 통과 기준 |
|---|---|---|
| **G0** | 파일 존재 + 섹션 포함 | `rg "## Self-Score YAML 출력 계약" memory/roles/personas/role-*.md` 결과 8 hit |
| **G1** | YAML 블록 파싱 | 각 persona 파일에서 ` ```yaml ... ``` ` 블록 추출 후 `# self-scores` 앵커 + 최소 1개 `key: value` 샘플 포함 |
| **G2** | shortKey registry 정합 | 템플릿 내 모든 shortKey가 `memory/roles/{role}_memory.json.signatureMetrics[*].shortKey` 집합의 부분집합 (실존 key 참조 검증) |
| **G3** | finalize dry-run | `session-end-finalize.js --dry-run` (또는 등가 테스트)에서 YAML 파싱 에러 0건 |

G3 실패 시 P2/P3 rollback 후 템플릿 재설계 (P1 복귀).

### 3-D. 롤백 경로

- **단위**: 파일 단위 git revert. Phase 단위 rollback 지원.
- **P2 부분 실패**: 실패 파일만 `git checkout HEAD -- memory/roles/personas/role-{실패}.md` 후 재삽입.
- **P3 실패**: `git rm memory/roles/personas/role-vera.md` + designer_memory cross-ref 제거.
- **P4 G3 실패**: P2+P3 전면 revert (`git revert --no-commit <commits>`) 후 P1 재설계.
- **P5 박제 후 발견 결함**: 결정 `D-xxx`에 `supersededBy` 필드로 후속 결정 기록. 파일은 재편집.

### 3-E. 중단 조건

- P1 템플릿 설계에서 Ace/Master가 core-0 처리(§2-D)에 이견 → Fin 감사 전에 템플릿 재확정 회차 필요.
- P4 G2에서 registry shortKey 변경 이력(PD-023 P1 아직 미완결) 발견 → PD-035를 PD-023 P1 완료 이후로 보류.

---

## 4. 리스크 (mitigation + fallback 병기)

### R-1. 🟡 템플릿 YAML 앵커(`# self-scores`)가 markdown 렌더러·파서와 충돌
- **취약점**: `# self-scores`는 YAML 주석이지만, 일부 markdown 환경에서 codeblock 외부로 노출 시 H1 헤딩 해석. finalize 파서가 정규식으로 `# self-scores`를 찾을 때 위치 혼동 가능.
- **Mitigation**: 항상 ` ```yaml ` fenced codeblock 내부에 둔다. 템플릿 명시로 강제.
- **Fallback**: 파서가 오작동하면 앵커를 `# __self_scores__` 등 unique token으로 교체 (PD-023 §5.1 spec 변경 PD 필요 — 별도 제안).

### R-2. 🔴 core 0건 역할(fin/nova/dev/editor/vera)에서 채점 실종
- **취약점**: §2-D 안 A 채택 시 core 섹션이 "미지정" 상태. 5개 역할 발언자가 extended 자가채점 습관 없으면 3연속 default 경보가 해당 역할 전체로 확산 가능.
- **Mitigation**: P1에서 Ace에게 "core 0건 역할도 extended 최소 1건 권장" 가이드 문구를 persona 파일 템플릿에 못박기. finalize hook의 default 경보 임계값은 PD-023이 3세션 — 완충 존재.
- **Fallback**: PD-036에서 core 승격(안 B)을 정식 재평가. 5개 역할 중 실측 participation 낮은 순으로 1건씩 inputPriority=core 승격.

### R-3. 🟡 Vera 신규 파일과 designer_memory 이중화로 raterId 모호성
- **취약점**: self_scores.jsonl 기록 시 `role: "vera"` vs `role: "designer"` 혼용 가능. aggregation이 두 키를 다른 역할로 취급하면 participation rate 왜곡.
- **Mitigation**: P3에서 `role-vera.md` 최상단에 "raterId는 `vera`로 고정. `designer`는 role 분류 레거시 필드"를 명기. compile-metrics-registry가 role 키 정규화 여부는 P1 스코프가 아니므로 현상 유지.
- **Fallback**: PD-037 분리 — designer_memory와 vera_memory를 단일 파일로 병합 + role 키 canonical 결정.

### R-4. 🟡 7개 파일 구조 이질성(§1-A)으로 삽입 위치 혼선
- **취약점**: ace/arki/fin/riki는 `## Write 계약` + `## 원칙` 사이, dev/editor/nova는 `## Output Style` 직전. 8파일을 병렬 편집할 때 위치 규칙을 잘못 적용하면 렌더링 순서 불일치.
- **Mitigation**: P1 템플릿 문서에 "삽입 위치 매트릭스" 표 명시. P2에서 파일별 Edit 전 `rg "^## "` 로 섹션 헤딩 먼저 실측.
- **Fallback**: G0 게이트에서 8파일 섹션 순서 검증 실패 시 해당 파일만 재배치 (전체 rollback 불요).

### R-5. 🔴 PD-023 P1 registry compile 미완료 상태에서 shortKey 박제 → drift
- **취약점**: 현재 shortKey는 `memory/roles/*_memory.json`의 raw 값. PD-023 P1이 compile-metrics-registry를 실행하며 sourceHash 변경·shortKey 정규화가 일어날 수 있음. persona 파일에 하드코딩된 shortKey가 registry v1.0과 불일치하면 E-009(sourceHash mismatch) 경보.
- **Mitigation**: P1 템플릿 작성 시 shortKey 리스트를 "v1.0 registry compile 이전 스냅샷" 으로 주석 표기 + P4 G2 게이트에서 cross-check. PD-023 P1 종료 후 drift 발견 시 일괄 패치 PD 오픈.
- **Fallback**: persona 파일에서 shortKey 리스트를 하드코딩 대신 `{role}_memory.json → signatureMetrics[*].shortKey` 경로 참조로 서술적 표현 ("본 역할 memory의 signatureMetrics 참조")으로 degrade. 가독성 손실 대신 drift 면역.

---

Arki 입장 정리: P3-supplementary의 구조는 얇습니다. 스코프는 persona 파일 단독 삽입 + Vera 신규, 핵심 리스크는 registry drift(R-5)와 core 0건(R-2) 두 건. Dev 호출 전에 Fin 감사(금지어) + Riki 리스크 cross-review가 필요합니다.

```yaml
# self-scores
aud_rcl: 0.85    # core — registry·파일 실측으로 미발견 최소화
str_fd: 4        # extended — 발견 9건 (이질성·core 0·vera 중복 등)
sa_rnd: 1        # extended — 초회 발언, 재감사 없음
spc_lck: Y       # extended — 템플릿 §2-B 고정 후 Dev 인계 예정
```

ARKI_WRITE_DONE: C:/Projects/legend-team/reports/2026-04-24_pd035-yaml-instruction-8roles/arki_rev1.md
