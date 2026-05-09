---
role: dev
phase: framing
topic: topic_190
topicSlug: skill-hook-auto-trigger
session: session_227
turnId: 2
invocationMode: subagent
date: 2026-05-09
grade: A
accessed_assets:
  - file: scripts/lib/skill-matcher.js
    scope: matcher_under_test
  - file: memory/shared/plugin_skill_index.json
    scope: index_32_namespaces_160_skills
  - file: reports/2026-05-09_skill-hook-auto-trigger/arki_phase2_plan.md
    scope: gate_g2_spec
---

# Dev Phase B G2 — 20-prompt dry-run 적합도 검증

## 1. 표본 구성

160 skills · 32 namespaces (실측: `plugin_skill_index.json`). 20건 분포:

| 도메인 | 건수 | 대표 namespace |
|---|---|---|
| 코드/엔지니어링 | 5 | engineering |
| 데이터/SQL/분석 | 4 | data |
| 문서·기획 | 3 | anthropic-skills(미인덱스), product-management |
| 영업/마케팅/운영 | 3 | sales, operations |
| 재무·법무 | 2 | finance, legal |
| HR·디자인 | 2 | human-resources, design |
| 모호/노이즈 | 1 | (ground truth = null) |

표본·정답 SOT: `scripts/lib/skill-matcher-g2-samples.json`. 재현: `node scripts/lib/skill-matcher-g2-run.js`.
**Phase A 4건과 중복 없음** (review-the-security / SQL-find-top-customers / customize-analyze / financial-revenue-forecast 모두 제외).

## 2. Dry-run 결과 (threshold=0.22)

| # | domain | top1 | score | gt_score | 적합 | 비고 |
|---|---|---|---|---|---|---|
| 1 | engineering | engineering:debug | 0.267 | 0.267 | ✓ | top1+thr |
| 2 | engineering | engineering:incident-response | 0.800 | 0.800 | ✓ | top1+thr |
| 3 | engineering | engineering:architecture | 0.400 | 0.400 | ✓ | top1+thr |
| 4 | engineering | engineering:deploy-checklist | 0.467 | 0.467 | ✓ | top1+thr |
| 5 | engineering | engineering:tech-debt | 0.467 | 0.467 | ✓ | top1+thr |
| 6 | data | data:explore-data | 0.667 | 0.667 | ✓ | top1+thr |
| 7 | data | data:build-dashboard | 0.800 | 0.800 | ✓ | top1+thr |
| 8 | data | data:statistical-analysis | 0.533 | 0.533 | ✓ | top1+thr |
| 9 | data | data:validate-data | 0.600 | 0.600 | ✓ | top1+thr |
| 10 | docs_pm | data:create-viz | 0.267 | 0.000 | ✗ | gt namespace 미인덱스 (아래 §4) |
| 11 | docs_pm | product-management:write-spec | 1.000 | 1.000 | ✓ | top1+thr (분모 cap 만점) |
| 12 | docs_pm | product-management:roadmap-update | 0.600 | 0.600 | ✓ | top1+thr |
| 13 | sales_mkt_ops | sales:draft-outreach | 0.733 | 0.733 | ✓ | top1+thr |
| 14 | sales_mkt_ops | operations:vendor-review | 0.667 | 0.667 | ✓ | top1+thr |
| 15 | sales_mkt_ops | sales:forecast | 0.800 | 0.800 | ✓ | top1+thr |
| 16 | finance_legal | finance:journal-entry-prep | 0.933 | 0.867 (gt) | ✗ | journal-entry vs journal-entry-prep 양쪽 다 인덱스 존재. 동의어 충돌 |
| 17 | finance_legal | legal:triage-nda | 0.733 | 0.733 | ✓ | top1+thr |
| 18 | hr_design | human-resources:onboarding | 0.667 | 0.667 | ✓ | top1+thr |
| 19 | hr_design | design:accessibility-review | 0.600 | 0.600 | ✓ | top1+thr |
| 20 | noise (ko) | (no match) | 0.000 | — | ✓ | false-positive 없음 (한국어 토큰 STOPWORDS 처리) |

## 3. 적합률 + Gate G2 판정

| 지표 | 실측 | 비고 |
|---|---|---|
| 적합 | **18/20** | 90% |
| top-1 정확도 (gt 보유 19건) | 17/19 = 0.895 | |
| threshold 0.22 통과 (gt 보유 19건) | 17/19 | gt가 인덱스에 있는 18건 기준 17/18 = 94.4% |
| false-positive (gt=null) | 0/1 | 통과 |
| Gate G2 임계 | ≥ 14/20 (70%) | **PASS (18/20 = 90%)** |

실행 명령: `node scripts/lib/skill-matcher-g2-run.js`
실제 출력: `gateG2: "PASS"`, `fit: 18`, `fitRate: 0.9`, `top1Acc: 0.8947`, `fpCount: 0` (full JSON은 harness stdout)

## 4. 실패 케이스 분석 (2건)

### 케이스 #10 — `anthropic-skills:pptx` ground truth 무효
- Ground truth로 지정한 `anthropic-skills:pptx`가 **실제 인덱스에 없음** (`plugin_skill_index.json` 검증: `skills.filter(s=>s.namespace.includes('anthropic'))` → `[]`).
- system-reminder의 skill 리스트와 `plugin_skill_index.json` 인덱스가 불일치 — 표본 작성 시 후자가 SOT인데 전자를 참조한 작성 오류.
- 매처는 정상 동작 (인덱스에 없으면 매칭 불가). **표본 작성 결함이지 매처 결함 아님.**
- 필터링 후 적합률: 19건 중 17건 = 89.5% (여전히 G2 PASS 임계 초과).

### 케이스 #16 — `finance:journal-entry` vs `journal-entry-prep`
- 인덱스에 두 skill 모두 존재. 프롬프트의 "prepare" 토큰이 `-prep` 변형에 더 강하게 매칭 (`prepare`/`prep` substring 포함).
- top1=`journal-entry-prep` (0.933), gt=`journal-entry` (0.867). **둘 다 threshold 통과**, top1만 차순위.
- 의미적으로는 거의 동의어 — Stage 2 LLM intent classifier 도입 시 해소 영역. Stage 1 substring 매처의 본질적 한계.

### 케이스 #20 — 한국어 노이즈 검증 통과
- "오늘 점심 뭐 먹을까…" → STOPWORDS에 `해`, `해줘` 등 박혀 있어 잔여 토큰 (`오늘`, `점심`, `먹을까`, `고민중이야`, `추천`)이 어떤 skill에도 매칭 안 됨. score 0.
- false-positive 회피 검증 ✓.

## 5. Phase C 진입 권고

**권고: 진입 가능.** 근거:
1. Gate G2 PASS (18/20, 임계 14/20 대비 +4 여유)
2. false-positive 0건 — 한국어 노이즈에서도 hook이 잘못된 skill 발동 안 함
3. 실패 2건 모두 매처 결함 아님 (#10 표본 오류, #16 동의어 — 알려진 Stage 1 한계)
4. 도메인 분포 10/32 namespace 커버 (gt 보유 기준), namespace_diversity 0.31

**Phase C 진입 시 유의:**
- finance journal-entry류 동의어 케이스는 hook이 top-3 표시(이미 DEFAULT_TOP_N=3)로 Master 선택 여지 보존하면 실용 영향 없음
- 한국어 프롬프트 처리: 현재 STOPWORDS는 휴리스틱. 본격 한국어 토큰화는 Phase 3 이후 별도 검토

DEV_WRITE_DONE: reports/2026-05-09_skill-hook-auto-trigger/dev_phaseB_g2.md
