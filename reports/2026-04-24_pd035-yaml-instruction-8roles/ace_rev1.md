---
turnId: 2
invocationMode: subagent
phase: reframe
---

# Ace — 스코프 확장 재프레이밍 (rev1)

Master 지시 반영하여 R-2/R-3/R-4 근본 해소 방향으로 스코프를 확장합니다. Arki v1 실행계획은 v2로 재작성 필요합니다.

## 1. 스코프 확장 확정 (In)

- **A. core 지표 신규 등록** — fin/nova/dev/editor/vera 5역할 `signatureMetrics`에 `inputPriority: "core"` 지표 1건씩 최초 등록. 근거: 5역할이 session_089부터 extended 전용으로만 운영돼 YAML 계약의 core 슬롯이 비어 있음 (R-2 근본 원인).
- **B. vera 이름·역할 canonical 분리** — `vera`=persona identifier(raterId/shortname/파일 prefix), `designer`=role 분류(레거시 D-029 키). `role-vera.md` 최상단에 canonical 선언 박제. 근거: 이름과 역할 분류의 혼용이 집계 스크립트 정규화를 오염시키는 구조적 원인 (R-3).
- **C. 7파일 구조 통일** — dev/editor/nova 3개에 `## Write 계약 (필수)` + `### Frontmatter link 의무` 섹션 이식. 기존 Shared Asset Protocol·Output Style은 유지(보완 관계). 근거: 포맷 비대칭이 Edi 검증 누수로 이어지는 구조 결함 (R-4).

## 2. Out 경계 재정의

- 강도 장치(temperature/guardrail) 설계 — **PD-036**으로 분리 유지.
- probe 문항 재설계 — **PD-038**으로 분리 유지.
- 페르소나 톤·서술 리라이팅 — 여전히 Out. 단, **구조 섹션(Write 계약·Frontmatter 의무) 추가는 허용**으로 조정.
- designer/vera 파일 병합 또는 rename — Out. canonical 선언만 추가.
- 집계 스크립트 role 정규화 로직 수정 — **PD-037** 스코프로 분리. 본 토픽은 canonical 선언 박제까지만.

## 3. Phase 재분해 방향 (Arki v2 지시사항)

기존 Phase 체인:
> P0(실측) → P1(템플릿) → {P2(7파일), P3(vera)} → P4(검증) → P5(박제)

업데이트 요구:

- **P1.5 신설** — 5역할 core 지표 설계·등록. 산출물: 각 역할 `signatureMetrics[]`에 `inputPriority: "core"` 엔트리 1건. 필드: id / shortKey / axis / scale / polarity / construct / externalAnchor. 메타: `source: "session_095_pd035_scope_expand"`, `addedAt`.
- **P2 확장** — 기존 YAML 계약 주입에 더해 dev/editor/nova 3파일에 `## Write 계약 (필수)` + `### Frontmatter link 의무` 섹션 이식 작업 편입.
- **P3 확장** — vera 파일 신설 시 최상단에 B canonical 선언(`raterId=vera 고정, designer는 role 분류 레거시`) 포함.
- **G2 검증 게이트 보강** — core 지표 registry 신규 엔트리 존재 확인(5건) + YAML shortKey와 registry shortKey 일치 확인 + 구조 섹션 이식 완료 확인.
- **P5 박제 노트** — PD-023 registry compile 침범 사실 명기. mitigation: "PD-023 P1 sourceHash 재계산 시 본 토픽에서 추가된 5건 core 엔트리를 일괄 반영".

Arki v2 산출 요구 항목:
1. Phase 분해 재작성 (P1.5 포함, 의존 그래프 갱신)
2. 각 Phase 검증 게이트·롤백 조건·전제조건
3. 중단 조건(abort criteria)
4. 리스크 재평가: R-2/R-3/R-4 해소 여부 + 신규 리스크(특히 PD-023과의 경계 침범 리스크, registry drift 리스크)
5. 금지어 self-audit (Schedule-on-Demand 준수)

## 4. Arki 재호출 선언

- **재호출 사유**: phase-transition (스코프 확장으로 구조 재분석 필요)
- **recallReason**: post-master (Master 지시 반영)
- **산출물 경로**: `reports/2026-04-24_pd035-yaml-instruction-8roles/arki_rev2.md`
- **Frontmatter**: `turnId: 3`, `invocationMode: subagent`, `phase: plan`, `rev: 2`

Arki, v2 실행계획을 요청드립니다. rev1의 P0/P1/P4/P5 뼈대는 유지하되, P1.5 신설과 P2·P3 확장, G2 보강, R-2/R-3/R-4 재평가를 반영해 주세요.

ACE_WRITE_DONE: reports/2026-04-24_pd035-yaml-instruction-8roles/ace_rev1.md
