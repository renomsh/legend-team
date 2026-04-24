---
turnId: 9
invocationMode: subagent
phase: plan
rev: 3
recallReason: post-master
splitReason: scope reduction
---

# Arki rev3 — PD-035 단순화 실행계획

Master 과투자 경고를 수용하여 rev2 대비 스코프를 축소합니다. 목적은 "부족한 축 식별"이며, 정밀 측정이 아닙니다.

---

## 1. 변경 델타 (rev2 대비)

### 삭제 항목 (rev3에서 제외)
- **Goodhart 방어 Phase** (rev2 P2.5, P4.G 게이트) — 가중치 근거 박제·rater 다양성 강제·자가 가중치 상한 등 과투자 로직 전량 제거
- **deferred-settlement 메커니즘** — Riki 제안 불채택. 자가 선언 단발 기록만 유지
- **turns 자동 참여 판정** — `current_session.turns`를 파싱해 기여도 역산하는 산출 로직 제거. 참여=자가 선언으로 단일화
- **core/standard tier 강등 논의** — 5역할(fin/nova/dev/editor/vera)에서 tier 개념 자체 삭제 (평면 엔트리)
- **가중치 근거 박제 아티팩트** — `weights_rationale.json` 등 보조 파일 신설 불필요
- **uniform 리셋 트리거·core 상한** — RK-4 대응 전체 제거
- **금지어 자가감사 섹션** — Fin 일회성 감사로 충분

### 유지 항목
- P0~P5 Phase 뼈대 (단 내부 작업 축소)
- 3역할(ace/arki/riki) tier·weight 기존 유지
- 5역할(fin/nova/dev/editor/vera) 신규 지표 1건씩 등록 (tier 없이 평면)
- 7 persona 파일 `## Self-Score YAML 출력 계약` 섹션 삽입
- Vera persona 파일 신규 생성 + canonical 선언
- dev/editor/nova 3 파일 `## Write 계약 (필수)` + `### Frontmatter link 의무` 이식 (구조 통일)
- nova `prm_rt` deprecate + `blnd_spt` 신설

### 5역할 tier 필드 제거 방침
- `memory/roles/{fin|nova|dev|editor|vera}_memory.json`의 신규 엔트리는 `tier` 필드 자체를 누락시킵니다 (null도 아닌 미존재)
- 기존 엔트리에 tier가 있다면 보존 (본 스코프 건들지 않음, PD-023 정합은 compile 단계에서 처리)
- 합산 공식은 역할별 균등 가중: fin/dev 각 0.25, nova/vera 각 1/3, editor 각 0.20

---

## 2. Phase 재분해

| Phase | 산출물 | DoD |
|---|---|---|
| **P0 실측 동결** | 현재 8 persona 파일 상태·5 role memory 엔트리 스냅샷 | 파일 해시·엔트리 count 박제, 변경 전 baseline 확정 |
| **P1 템플릿 확정** | `## Self-Score YAML` 공통 템플릿 + 역할별 shortKey·weight 표 | 32 지표 shortKey registry 충돌 0건, 3역할 weight 합=1.0 (ace/arki/riki), 5역할 균등 |
| **P1.5 5역할 신규 core 지표 등록** | fin/nova/dev/editor/vera memory.json에 평면 엔트리 1건씩 (tier 필드 없음), nova `prm_rt` deprecate + `blnd_spt` 신설 | 5건 + nova 2건 적용, JSON schema 파싱 OK |
| **P2 7파일 YAML 섹션 + 구조 통일** | ace/arki/fin/riki/nova/dev/editor 7 파일에 `## Self-Score YAML 출력 계약` 삽입. dev/editor/nova에 `## Write 계약 (필수)` + `### Frontmatter link 의무` 이식 | 7 파일 diff 확인, 섹션 헤더 존재 grep 통과 |
| **P3 vera persona 신규** | `memory/roles/personas/role-vera.md` 생성, canonical 선언 + Self-Score YAML 섹션 + Write 계약 포함 | 파일 존재, 8번째 persona로 인정 |
| **P4 검증 G0~G3** | G0~G3 게이트 통과 로그 | 아래 §3 참조 |
| **P5 박제** | D-xxx 결정 기록, reports/ 박제, session_index 반영 | decision_ledger 엔트리, 세션 종료 체크리스트 통과 |

---

## 3. 검증 게이트 G0~G3

> rev2의 G4(Goodhart 방어 검증) 제거

- **G0 — 파일 존재 + YAML 섹션 포함**
  - 대상: `memory/roles/personas/role-{ace,arki,fin,riki,nova,dev,editor,vera}.md` 8개
  - 검사: 파일 존재 + `## Self-Score YAML 출력 계약` 헤더 grep 매칭
  - 실패 시: P2/P3 재개

- **G1 — YAML 블록 파싱**
  - 대상: 8 파일의 YAML 예시 블록
  - 검사: `js-yaml` 또는 `yaml` 파서로 로드 성공, 필수 필드(role, raterId, topicId, score, participated) 존재
  - 실패 시: 템플릿 수정

- **G2 — shortKey registry 정합 + 5역할 신규 엔트리 존재**
  - 대상: 32 지표 shortKey ↔ 역할별 persona weight 테이블 ↔ 5 role memory.json
  - 검사: shortKey 중복 0, 5역할 신규 core 지표 1건씩 + nova `blnd_spt` 존재, `prm_rt` deprecated 마킹
  - 실패 시: 명명 재확정 / memory 재등록

- **G3 — finalize dry-run**
  - 대상: `session-end-finalize.js` dry-run
  - 검사: 참여=자가 선언 기반 점수 집계, 0~100 float 1자리 출력, 에러 없음
  - 실패 시: 스크립트 패치 (단 본 스코프 외 변경은 PD로 이연)

---

## 4. 롤백

- **파일 단위 git revert** — P2/P3 커밋 단위로 분리해 문제 발생 시 해당 커밋만 revert
- **P1.5 실패 시** — 5 role memory.json 변경분 개별 revert (git checkout HEAD~ 해당 파일)
- **P3 실패 시** — `memory/roles/personas/role-vera.md` 삭제로 상태 복귀 (신규 파일이라 영향 국소)
- **P1.5/P2/P3 독립 커밋 원칙** — 각 Phase는 별도 commit으로 분리해 부분 롤백 가능하게 보존

---

## 5. 리스크

### 유지 (mitigation 강화)

- **R-5 (PD-023 registry drift)**
  - 내용: 32 shortKey ↔ 향후 PD-023 compile 단계 registry 불일치 가능
  - mitigation: P1.5에서 `_reserved.pd035_scope: true` 마킹 유지, G2에서 shortKey 중복 0 강제
  - fallback: PD-023 compile 시점에 rename 스크립트로 일괄 조정 (본 스코프 외)

- **R-3 (vera raterId)** — canonical 선언으로 축소 해소
  - 내용: 기존 designer vs 신규 vera 중복 가능
  - mitigation: role-vera.md 최상단에 `raterId: vera` canonical 선언, designer_memory.json은 legacy 유지 (본 스코프 외)
  - fallback: 향후 designer → vera 마이그레이션 PD 별도 오픈

- **R-7 (Shared Asset Protocol ↔ Write 계약 중첩)** — 구조 통일로 해소
  - 내용: dev/editor/nova Write 계약과 기존 Shared Asset Protocol 규칙 중복 가능
  - mitigation: P2에서 이식 시 중복 문장 제거, 상위 규칙(Shared Asset Protocol) 참조 링크로 대체
  - fallback: 중복 발견 시 persona 파일이 상위 참조 형태로 축소

### 삭제 (rev3 스코프에서 해소 또는 수용)

- ~~R-1 (앵커 충돌)~~ — 본 스코프로 해소
- ~~R-2 (core 0건 인플레)~~ — tier 제거로 개념 자체 소멸
- ~~R-4 (구조 이질성)~~ — P2 구조 통일로 해소
- ~~R-6 (PD-023 경계 침범)~~ — `_reserved.pd035_scope` 마킹으로 충분
- ~~R-8 (candidate 즉시 채점)~~ — Master 과투자 경고 준수로 수용 (즉시 채점 허용)

### 신규

- **R-9 (단순화 후 재정밀화 필요 시점 판단 부재)**
  - 내용: 본 rev3가 측정 정밀도를 의도적으로 낮춘 만큼, 향후 "부족한 축"이 실제로 식별되면 정밀화가 필요한데 그 시점을 놓칠 수 있음
  - mitigation: P5 박제 시 결정문에 "재정밀화 트리거 조건"을 명시 — 예: 동일 축이 3세션 연속 부족 판정으로 나오거나, 자가 선언 결과가 Master 체감과 명백히 괴리할 때
  - fallback: 재정밀화 PD 신규 오픈, rev2의 Goodhart 방어 로직을 선택적으로 부활

---

## 6. 중단 조건

- **P1.5에서 shortKey ↔ PD-023 registry 충돌 발견** → 즉시 보류, Master 재보고 후 재개 여부 확정
- **P3 vera canonical 선언 문구에 Master 이견** → 문구 재확정 전 P4 진입 금지

---

## 7. Dev 인계 준비

### spc_lck=Y 조건 (Dev 스펙 lock)
- [x] 지표 32건 목록·shortKey·weight 확정 (본 rev3 §스펙 참조)
- [x] 5역할 tier 필드 제거 방침 확정
- [x] 7 persona YAML 섹션 + 3 파일 Write 계약 이식 범위 확정
- [x] vera persona 신규 생성 + canonical 선언 문구 범위 확정
- [x] 가중치 합산 공식 확정 (0~100 float 1자리, 참여=자가 선언)
- [x] G0~G3 검증 게이트 정의

### Dev 착수 가능 상태
위 spc_lck 조건 전체 충족. Dev는 writing-plans 스킬을 거쳐 Phase별 task breakdown 후 P0→P5 순차 실행 가능합니다.

### 참조 파일 경로
- persona 원본: `memory/roles/personas/role-{ace,arki,fin,riki,nova,dev,editor}.md`
- 신규 생성: `memory/roles/personas/role-vera.md`
- role memory: `memory/roles/{fin,nova,dev,editor,vera}_memory.json`
- finalize hook: `.claude/hooks/session-end-finalize.js`
- shortKey registry 참조: PD-023 관련 `_reserved.pd035_scope` 마킹

---

ARKI_WRITE_DONE: C:\Projects\legend-team\reports\2026-04-24_pd035-yaml-instruction-8roles\arki_rev3.md
