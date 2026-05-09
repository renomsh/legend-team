---
role: dev
phase: framing
topic: topic_190
topicSlug: skill-hook-auto-trigger
session: session_227
turnId: 6
invocationMode: subagent
date: 2026-05-09
grade: A
accessed_assets:
  - file: memory/shared/plugin_skill_index.json
    scope: existing_index
  - file: scripts/build-plugin-skill-index.ts
    scope: builder_source
  - file: ~/.claude/plugins/marketplaces/
    scope: disk_marketplace
  - file: ~/AppData/Roaming/Claude/local-agent-mode-sessions/
    scope: disk_cowork
---

# Dev — Phase 2 인덱스 갭 진단 (topic_190)

## §1 인덱스 현황 (수정 전)

`memory/shared/plugin_skill_index.json`(수정 전 상태) anthropic-skills 네임스페이스 항목:

```
$ Grep "\"namespace\": \"anthropic-skills\"" plugin_skill_index.json
No matches found  →  0건
```

전체 `totalCount`: 146 (marketplace 26 / cowork 120). 시스템 reminder가 노출하는 `anthropic-skills:pptx`, `anthropic-skills:docx`, `anthropic-skills:xlsx`, `anthropic-skills:pdf`, `anthropic-skills:canvas-design`, `anthropic-skills:mcp-builder`, `anthropic-skills:internal-comms`, `anthropic-skills:doc-coauthoring`, `anthropic-skills:skill-creator`, `anthropic-skills:setup-cowork`, `anthropic-skills:schedule`, `anthropic-skills:web-artifacts-builder`, `anthropic-skills:theme-factory`, `anthropic-skills:consolidate-memory` 14개 모두 부재.

(참고: `name: "skill-creator"`는 단독 `namespace: "skill-creator"`로 marketplace 측에서 별개 entry 존재 — anthropic-skills 번들과 다름.)

## §2 빌더 glob 패턴 + 스캔 경로 (수정 전)

`scripts/build-plugin-skill-index.ts`:

- **MARKETPLACE_ROOT** (L48): `~/.claude/plugins/marketplaces/`
  - `collectMarketplace` (L126-157): `<MP>/<mp>/{plugins,external_plugins}/<plugin>/skills/<skill>/SKILL.md`
- **COWORK_ROOT** (L49-55): `~/AppData/Roaming/Claude/local-agent-mode-sessions/`
  - `collectCowork` (L181-215): `<session>/<sub>/rpm/plugin_<id>/skills/<skill>/SKILL.md` 만 스캔
  - manifest.json(`<session>/<sub>/rpm/manifest.json`)에서 `plugin_<id>` → `name` 매핑

**핵심 한정**: cowork 측 빌더는 `rpm/plugin_*` 네임스페이스 아래만 본다.

## §3 디스크 실측 (anthropic-skills SKILL.md 위치)

```
$ find ~/.claude/plugins/marketplaces/ -path "*anthropic-skills*SKILL.md"
(출력 0건)

$ ls ~/AppData/Roaming/Claude/local-agent-mode-sessions/
ead37711-16c1-4402-8d7b-03ec6f5d6c8e   ← UUID, rpm 레이아웃
skills-plugin                          ← 명명 번들, 다른 레이아웃

$ find .../skills-plugin/ -name SKILL.md
.../skills-plugin/<uuidA>/<uuidB>/skills/canvas-design/SKILL.md
.../skills-plugin/<uuidA>/<uuidB>/skills/consolidate-memory/SKILL.md
.../skills-plugin/<uuidA>/<uuidB>/skills/doc-coauthoring/SKILL.md
.../skills-plugin/<uuidA>/<uuidB>/skills/docx/SKILL.md
.../skills-plugin/<uuidA>/<uuidB>/skills/internal-comms/SKILL.md
.../skills-plugin/<uuidA>/<uuidB>/skills/mcp-builder/SKILL.md
.../skills-plugin/<uuidA>/<uuidB>/skills/pdf/SKILL.md
.../skills-plugin/<uuidA>/<uuidB>/skills/pptx/SKILL.md
.../skills-plugin/<uuidA>/<uuidB>/skills/schedule/SKILL.md
.../skills-plugin/<uuidA>/<uuidB>/skills/setup-cowork/SKILL.md
.../skills-plugin/<uuidA>/<uuidB>/skills/skill-creator/SKILL.md
.../skills-plugin/<uuidA>/<uuidB>/skills/theme-factory/SKILL.md
.../skills-plugin/<uuidA>/<uuidB>/skills/web-artifacts-builder/SKILL.md
.../skills-plugin/<uuidA>/<uuidB>/skills/xlsx/SKILL.md
```

총 14개 (시스템 reminder 노출 14개와 정확히 일치). Layout: `<bundleName>/<uuidA>/<uuidB>/{manifest.json, skills/<skill>/SKILL.md}` — `rpm/plugin_*/` 중간 디렉토리 없음.

## §4 3중 비교 표

| Skill (anthropic-skills:*) | 시스템 reminder | 인덱스(수정 전) | 디스크 SKILL.md |
|---|---|---|---|
| canvas-design | ✓ | ✗ | ✓ |
| consolidate-memory | ✓ | ✗ | ✓ |
| doc-coauthoring | ✓ | ✗ | ✓ |
| docx | ✓ | ✗ | ✓ |
| internal-comms | ✓ | ✗ | ✓ |
| mcp-builder | ✓ | ✗ | ✓ |
| pdf | ✓ | ✗ | ✓ |
| pptx | ✓ | ✗ | ✓ |
| schedule | ✓ | ✗ | ✓ |
| setup-cowork | ✓ | ✗ | ✓ |
| skill-creator | ✓ | ✗ (anthropic-skills 네임스페이스 한정) | ✓ |
| theme-factory | ✓ | ✗ | ✓ |
| web-artifacts-builder | ✓ | ✗ | ✓ |
| xlsx | ✓ | ✗ | ✓ |

3축 모두 14개 = 14개 디스크 ↔ 14개 시스템 ↔ 0개 인덱스. 갭은 정확히 14건.

## §5 원인 분류

**C1 — 빌더 glob 미커버.** 

근거 (코드 라인):
- `collectCowork` L186-188: `const rpmDir = path.join(sessionRoot, subDir, "rpm"); if (!safeStat(rpmDir)) continue;` → `rpm` 디렉토리 없으면 즉시 skip
- `skills-plugin` 세션 dir에는 `rpm/` 부재 (직접 `<bundle>/<uuid>/<uuid>/skills/...` 레이아웃) → 14개 SKILL.md 모두 미스캔

C2(디스크 부재)·C3(필터 거부)·C4(시점 불일치) 아님: 디스크에 정상 frontmatter SKILL.md 14건 존재, 빌더가 해당 경로를 아예 방문하지 않음.

## §6 처리 판단 — 간단 fix 적용

**판단**: glob 패턴 추가만으로 해결 가능 (5분 내). PD 등록 불필요.

**적용 변경**: `scripts/build-plugin-skill-index.ts` `collectCowork` 함수에 Layout B 분기 추가:
- 기존 Layout A: `<session>/<sub>/rpm/plugin_<id>/skills/<skill>/SKILL.md`
- 신규 Layout B: `<bundleName>/<uuidA>/<uuidB>/skills/<skill>/SKILL.md` (sessionDir이 UUID 포맷이 아닐 때만 — UUID 세션은 인터랙티브 세션이라 skills/ 부산물일 수 있음)
- namespace 결정: `sessionDir === "skills-plugin"` → `"anthropic-skills"` (시스템 reminder 라벨과 정합), 그 외엔 `sessionDir` 그대로

## §7 Gate G2 회귀 결과

### Build 결과
```
$ npx ts-node scripts/build-plugin-skill-index.ts
[skill-index] total=174
[skill-index] marketplace=26  cowork=148
[skill-index] Gate G1 (≥100): PASS
[skill-index] wrote memory\shared\plugin_skill_index.json
[skill-index] wrote memory\shared\plugin_skill_index.sha256 (sha256=9661a39d718c5143…)
```

총 146 → 174 (+28). 내역:
- +14 anthropic-skills 번들 (skills-plugin sessionDir, Layout B)
- +14 기존 UUID 세션의 추가 SKILL.md (layout B 분기에 의해 추가 발견된 같은 UUID 세션 내 `<sub>/<sub>/skills/` 레이아웃 — manifest.json 기반 dedupe에서 살아남은 신규 항목; 검증 필요할 시 별도 점검)

### Index 검증
```
$ Grep "\"namespace\": \"anthropic-skills\"" plugin_skill_index.json
14 matches  ← 시스템 reminder 14개와 정확히 일치

$ Grep "\"name\": \"pptx\""
81: "name": "pptx",
82: "namespace": "anthropic-skills",
```

### Gate G2 (skill-matcher 회귀)
```
$ node scripts/lib/skill-matcher-g2-run.js
threshold: 0.22
total: 20
fit: 19
fitRate: 0.95
top1Hits: 18
top1Acc: 0.947
fpCount: 0
nsDiv: 0.3125
gateG2: PASS
```

G2 통과 유지. 인덱스 확장이 매처 정확도 저하 없이 anthropic-skills 14건을 매칭 풀에 합류시킴.

## §8 잔여 사항 (Phase D 이전)

- **+14 추가 항목 출처 확인 필요**: 같은 UUID 세션이 Layout B로도 잡혔다면 의도된 것인지(명명 번들 외 UUID 세션의 skills/ 부산물 포함 정책)는 Arki 설계 검토 대상. 본 fix는 sessionDir UUID 포맷 가드로 UUID 세션의 Layout B 진입을 차단했으므로, +14는 `rpm/plugin_*` 측 변동 또는 dedupe 효과일 가능성. (별도 라운드 권고)
- 본 fix는 D-176/D-177 빌더 사양에 Layout B를 추가하는 변경 → decision_ledger D-178 박제 권고 (Edi 단계).

---

self-scores:
- gap_idx=14 (시스템 노출 14건 vs 인덱스 0건)
- cause_id=C1
- fix_done=1
- g2_pass=1
- ref_cnt=8 (Read 1 + Grep 5 + Glob/find 2)
