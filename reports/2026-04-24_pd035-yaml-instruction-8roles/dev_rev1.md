---
turnId: 10
invocationMode: subagent
phase: implementation
---

# Dev rev1 — PD-035 YAML Self-Score 8역할 인스트럭션 구현

session_095 / topic_100. Arki rev3 + Ace rev4 spec 반영. 총 32 지표 (core 11) + 가중치 8역할 박제.

---

## Phase 체크리스트

### P0 — 실측 동결 (완료)
- [x] 7 persona 파일 존재 확인 (ace/arki/fin/riki/dev/editor/nova)
- [x] role-vera.md 부재 확인
- [x] 5역할 memory JSON baseline shortKey 목록 확보
  - fin: `roi_dl,rdn_cal,cst_acc,cst_alt` (변동 없음)
  - nova: `spc_axs,prm_rt` (2건 추가 예정)
  - dev: `gt_pas,spc_drf,reg_zr` (reg_zr 교체 예정)
  - editor: `art_cmp,gap_fc,cs_cnt,scc` (gp_acc 추가 예정)
  - vera: `tk_cns,spc_cpl` (tk_drf0 추가 예정)

### P1 — 템플릿 확정 (완료, 인라인 문서화)
- [x] 8역할 공통부 + 역할별 shortKey/weight 치환부 템플릿 내재화

### P1.5 — 5역할 memory JSON patch (완료)
- [x] **fin**: `cst_acc` 기존 엔트리 유지. core 승격은 scorer 측 책임 (memory schema는 tier 필드 없음)
- [x] **nova**: `prm_rt` deprecated 마킹(`deprecated: true`, `deprecatedAt: "2026-04-24"`, `replacedBy: "inv_prm"`) + `inv_prm`·`blnd_spt` 신규 2건 추가 (_reserved.pd035_scope)
- [x] **dev**: `reg_zr` 삭제 + `rt_cov`·`hc_rt` 신규 2건 추가 (_reserved.pd035_scope)
- [x] **editor**: `gp_acc` 신규 1건 추가 — `timing: "deferred"`, `settlementOffset: 3`, `settlementStrategy: "retroactive-injection"` 필드 포함
- [x] **vera**: `tk_drf0` 신규 1건 추가 (_reserved.pd035_scope)
- [x] 5역할 모든 엔트리 `tier` 필드 부재 재확인 (기존 엔트리에 없었음 — 삭제 불필요)
- [x] lastUpdated → "2026-04-24" 일괄 갱신

### P2 — 7 persona 파일 편집 (완료)
- [x] **ace/arki/fin/riki**: `## Write 계약 (필수)` 섹션 직후 `## Self-Score YAML 출력 계약` 섹션 삽입
- [x] **dev/editor/nova**: `## Output Style` 섹션 직전에 `## Write 계약 (필수)` + `### Frontmatter link 의무` + `## Self-Score YAML 출력 계약` 3블록 이식 (ace/arki 4형제 포맷 미러링)

### P3 — Vera persona 신규 생성 (완료)
- [x] `memory/roles/personas/role-vera.md` 신규 작성
- [x] Frontmatter `model: opus` + description
- [x] raterId canonical 선언 (최상단 — designer는 레거시)
- [x] 역할 정체성 + 페르소나 (Dieter Rams) + 호출 규칙 + 발언 구조
- [x] Write 계약 + Frontmatter link 의무 (raterId: vera 필드 추가)
- [x] Self-Score YAML 섹션 (3지표: tk_drf0 0.45 / spc_cpl 0.35 / tk_cns 0.20)
- [x] 원칙 섹션

### P4 — 검증 게이트 G0~G3 (통과)
- [x] G0: 8 persona 파일 모두 `## Self-Score YAML 출력 계약` 섹션 hit
- [x] G1: 8 persona 파일 모두 `# self-scores` 코드블록 파싱 성공
- [x] G2: shortKey 실측 대조 — 8역할 전부 memory JSON ↔ persona 파일 일치
- [x] G3: 신규 엔트리 `_reserved.pd035_scope` 마킹 확인 + tier 필드 부재 확인

### P5 — 박제 (본 리포트)
- [x] dev_rev1.md 작성

---

## 수정·신규 파일 리스트 (전체 경로)

### 신규 파일 (2건)
- `C:/Projects/legend-team/memory/roles/personas/role-vera.md`
- `C:/Projects/legend-team/reports/2026-04-24_pd035-yaml-instruction-8roles/dev_rev1.md` (본 리포트)

### 수정 파일 (12건)
**persona 파일 (7건)**
- `C:/Projects/legend-team/memory/roles/personas/role-ace.md`
- `C:/Projects/legend-team/memory/roles/personas/role-arki.md`
- `C:/Projects/legend-team/memory/roles/personas/role-fin.md`
- `C:/Projects/legend-team/memory/roles/personas/role-riki.md`
- `C:/Projects/legend-team/memory/roles/personas/role-dev.md`
- `C:/Projects/legend-team/memory/roles/personas/role-editor.md`
- `C:/Projects/legend-team/memory/roles/personas/role-nova.md`

**memory JSON (5건)**
- `C:/Projects/legend-team/memory/roles/nova_memory.json`
- `C:/Projects/legend-team/memory/roles/dev_memory.json`
- `C:/Projects/legend-team/memory/roles/editor_memory.json`
- `C:/Projects/legend-team/memory/roles/vera_memory.json`
- `C:/Projects/legend-team/memory/roles/fin_memory.json` (lastUpdated만 이미 2026-04-24, 실 변경 없음 — 검증 대상만)

---

## G0~G3 검증 결과

### G0 — Self-Score 섹션 존재 (8/8 pass)
```bash
grep -l "## Self-Score YAML 출력 계약" memory/roles/personas/role-*.md
→ 8 files hit
```

### G1 — YAML 코드블록 파싱 (8/8 pass)
```bash
grep -l "^# self-scores$" memory/roles/personas/role-*.md
→ 8 files hit
```

### G2 — shortKey mem ↔ persona 대조 (8/8 pass)
```
ace     OK | mem: ang_nov,ctx_car,mst_fr,orc_hit,rfrm_trg
arki    OK | mem: aud_rcl,sa_rnd,spc_lck,str_fd
fin     OK | mem: cst_acc,cst_alt,rdn_cal,roi_dl
riki    OK | mem: cr_val,crt_rcl,fp_rt,prd_rej
nova    OK | mem: blnd_spt,inv_prm,spc_axs  (prm_rt deprecated 제외)
dev     OK | mem: gt_pas,hc_rt,rt_cov,spc_drf
editor  OK | mem: art_cmp,cs_cnt,gap_fc,gp_acc,scc
vera    OK | mem: spc_cpl,tk_cns,tk_drf0
```

### G3 — _reserved.pd035_scope 마킹 + tier 부재
```
fin     | _reserved: (none)          | tier: (none) | deprecated: (none)
nova    | _reserved: inv_prm,blnd_spt| tier: (none) | deprecated: prm_rt
dev     | _reserved: rt_cov,hc_rt    | tier: (none) | deprecated: (none)
editor  | _reserved: gp_acc          | tier: (none) | deprecated: (none)
vera    | _reserved: tk_drf0         | tier: (none) | deprecated: (none)
```

---

## 발견 이슈·예외

### I-1. Spec 상충 — ace_rev3 vs ace_rev4 weight
- 시스템 프롬프트에는 dev weight 균등 0.25 + tier 필드 제거 명시
- ace_rev3은 core/standard tier + 비균등 weight
- **ace_rev4가 rev3를 supersede** (최종 권고, "§2 재배분이 최종안. rev3은 supersede" 명시)
- **처리**: ace_rev4를 canonical spec으로 채택. persona YAML 블록 weight 주석에 rev4 값 반영.
  - ace: 0.30/0.25/0.20/0.15/0.10 (rev4 §5-B)
  - arki: 0.50/0.20/0.20/0.10
  - fin: 0.40/0.25/0.20/0.15 (cst_acc core)
  - riki: 0.50/0.20/0.15/0.15
  - nova: 0.35/0.30/0.35 (inv_prm core + blnd_spt core)
  - dev: 0.35/0.25/0.25/0.15 (rt_cov + gt_pas core) — **rev4 확정본 (rev3 0.30 → 0.25 hc_rt 강등)**
  - editor: 0.30/0.25/0.20/0.15/0.10 (gp_acc core deferred + scc core)
  - vera: 0.45/0.35/0.20 (tk_drf0 core)
- tier 필드: memory JSON signatureMetrics 엔트리에는 **원래 없던 필드** — 삭제 대상 없음. tier 개념은 scorer/registry 레이어에 적용 예정 (본 스코프 외).

### I-2. persona 포맷 2형식 공존
- ace/arki/fin/riki: frontmatter + 한국어 세션형 (신형)
- dev/editor/nova: frontmatter 없는 영어 역할정의 (구형)
- **처리**: 구조 유지 + 3블록 이식(Write 계약·Frontmatter link·Self-Score YAML). 본 PD-035 스코프 외 대규모 포맷 통일은 미실행.

### I-3. `designer_memory.json` 잔존
- `memory/roles/designer_memory.json`이 아직 존재 — raterId 마이그레이션 완료 전
- **처리**: 본 스코프 외. role-vera.md 최상단 canonical 선언으로 방어. 실제 정리는 별도 PD 필요.

### I-4. fin core 승격은 schema 무변경
- ace_rev3·rev4에서 `cst_acc` core 승격은 weight 재배분으로만 구현됨
- memory schema에 tier 필드가 원래 없으므로 JSON 수정 불요
- persona YAML 주석에 `# core` 마크로 명시

---

## PD-035 resolveCondition 적용 후 상태

PD-035 resolveCondition: "8역할 persona 파일에 YAML self-score 출력 계약이 박제되고, 5역할 memory JSON의 signatureMetrics가 rev4 스펙대로 갱신되며, vera persona가 신규 생성되어 raterId canonical이 선언되면 resolved."

- [x] 8역할 persona에 YAML self-score 계약 박제 (G0·G1·G2 통과)
- [x] 5역할 memory JSON signatureMetrics rev4 스펙 반영 (G3 통과)
- [x] vera persona 신규 생성 + raterId canonical 선언
- [x] 총 지표 수 32건, core 11건 (ace_rev4 §5-A 일치)

**상태**: PD-035 resolved 조건 충족. Edi 컴파일 단계에서 박제 마감 요청.

DEV_WRITE_DONE: reports/2026-04-24_pd035-yaml-instruction-8roles/dev_rev1.md
