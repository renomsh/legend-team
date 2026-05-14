# Decision Ledger Status Audit — 2026-05-13

**Summary**: total=193, self-undeclared=22, referent-undeclared=29

## Mismatches (51)

| id | type | selfStatus | referent | refStatus | snippet |
| --- | --- | --- | --- | --- | --- |
| D-189 | self-undeclared | active |  |  | (1) status 표준 3종 확정: active(현행 정책·구현) / deprecated(폐기·대체·완료) / superseded(후속 결정 존재). 기존 비표준 상태값(conf |
| D-181 | self-undeclared | active |  |  | pen mtopic_XXXXX A 재오픈). migration.lock 폐기(Master 시간차 운영으로 race 회피). 병행세션 병행토픽 시스템 설계 확정. 공식 SOT와 m* |
| D-179 | referent-undeclared |  | D-130 | active | #20 grade_a_subagent_enforcement(D-066 deprecated 인용) / #21 simple_growth_not_measurement(D-092 mem |
| D-179 | referent-undeclared |  | D-059 | active | #20 grade_a_subagent_enforcement(D-066 deprecated 인용) / #21 simple_growth_not_measurement(D-092 mem |
| D-179 | referent-undeclared |  | D-062 | active | #20 grade_a_subagent_enforcement(D-066 deprecated 인용) / #21 simple_growth_not_measurement(D-092 mem |
| D-179 | referent-undeclared |  | D-092 | active | #20 grade_a_subagent_enforcement(D-066 deprecated 인용) / #21 simple_growth_not_measurement(D-092 mem |
| D-179 | referent-undeclared |  | D-178 | active | #20 grade_a_subagent_enforcement(D-066 deprecated 인용) / #21 simple_growth_not_measurement(D-092 mem |
| D-163 | referent-undeclared |  | D-160 | active | arning axis 지표 0개 (D-160 external-rated 폐기 후 공백). app/growth.html L1 카드를 data-axis=quality / 'L1 · Q |
| D-162 | referent-undeclared |  | D-130 | active | 괄 수정. (1) zero-condense gate FP: 마이그레이션 폐기, scripts/lib/zero-condense-marker.{ts,js} SOT 헬퍼(writeMar |
| D-143 | referent-undeclared |  | D-138 | active | ig-driven refactor·helper·try/catch·G1) 폐기 — over-engineered. Master 통찰('에디만 추가하면 되는 문제 아니야?') 직접 적출 |
| D-143 | referent-undeclared |  | D-142 | active | ig-driven refactor·helper·try/catch·G1) 폐기 — over-engineered. Master 통찰('에디만 추가하면 되는 문제 아니야?') 직접 적출 |
| D-142 | self-undeclared | active |  |  | (1) ace-framing skill DEPRECATED 해제. user_invocable=true, 자동 트리거 0건, /ace-framing |
| D-134 | referent-undeclared |  | D-128 | active | 운영 보존 (D-129 본체). (2) P4(LLM 2차 검증) 분리 deprecate — 운영 데이터 0, marginal value 미입증, R-2(dispatch injec |
| D-133 | referent-undeclared |  | D-108 | active | orcement)' — D-108 미결 C축 종결. (3) NCL 전면 폐기: D-115(NCL 4항목 + 규칙기반 fix) deprecated, D-117 P4(NCL 인프라+S |
| D-133 | referent-undeclared |  | D-125 | active | orcement)' — D-108 미결 C축 종결. (3) NCL 전면 폐기: D-115(NCL 4항목 + 규칙기반 fix) deprecated, D-117 P4(NCL 인프라+S |
| D-133 | referent-undeclared |  | D-126 | active | orcement)' — D-108 미결 C축 종결. (3) NCL 전면 폐기: D-115(NCL 4항목 + 규칙기반 fix) deprecated, D-117 P4(NCL 인프라+S |
| D-133 | referent-undeclared |  | D-128 | active | orcement)' — D-108 미결 C축 종결. (3) NCL 전면 폐기: D-115(NCL 4항목 + 규칙기반 fix) deprecated, D-117 P4(NCL 인프라+S |
| D-130 | self-undeclared | active |  |  | 1) Ace 페르소나 재정의: 'Master 판단 대리인'(D-015) 폐기 → 외부 시각 전략가 (Porter+Keynes 합성). 미시적 산업 구조(Porter)·거시 시스템 |
| D-130 | referent-undeclared |  | D-104 | active | 1) Ace 페르소나 재정의: 'Master 판단 대리인'(D-015) 폐기 → 외부 시각 전략가 (Porter+Keynes 합성). 미시적 산업 구조(Porter)·거시 시스템 |
| D-130 | referent-undeclared |  | D-040 | active | 1) Ace 페르소나 재정의: 'Master 판단 대리인'(D-015) 폐기 → 외부 시각 전략가 (Porter+Keynes 합성). 미시적 산업 구조(Porter)·거시 시스템 |
| D-127 | self-undeclared | active |  |  | Audit 3 도구는 페르소나 내부 도구로 흡수 (외부 skill 호출 폐기, 물리 파일 부재 확인). violation flag direct read 차단 (Goodhart 회피 |
| D-127 | referent-undeclared |  | D-125 | active | Audit 3 도구는 페르소나 내부 도구로 흡수 (외부 skill 호출 폐기, 물리 파일 부재 확인). violation flag direct read 차단 (Goodhart 회피 |
| D-126 | self-undeclared | active |  |  | : 평가/성장/회고/채점/지표/self-scores) — 자동 hook 폐기 (D-092·Goodhart 정합). R&R: NCL+decision_ledger+self-scores |
| D-126 | referent-undeclared |  | D-092 | active | : 평가/성장/회고/채점/지표/self-scores) — 자동 hook 폐기 (D-092·Goodhart 정합). R&R: NCL+decision_ledger+self-scores |
| D-126 | referent-undeclared |  | D-125 | active | : 평가/성장/회고/채점/지표/self-scores) — 자동 hook 폐기 (D-092·Goodhart 정합). R&R: NCL+decision_ledger+self-scores |
| D-126 | referent-undeclared |  | D-128 | active | : 평가/성장/회고/채점/지표/self-scores) — 자동 hook 폐기 (D-092·Goodhart 정합). R&R: NCL+decision_ledger+self-scores |
| D-108 | self-undeclared | active |  |  | o→Ace 직렬은 단일 사례). C축은 'Ace 의사결정 서포트' 정의 폐기 (Master 통찰: Ace 종속 제거 시 R-2 구조 해소). C축 신규 정의는 후속 세션 합의. N |
| D-101 | self-undeclared | active |  |  | mmands→skills 이전·Stop hook 자동 14단계 트리거는 폐기(과투자). (3) PD-039 resolved: 두 경로 산출물 diff 분석 완료(R-1 동일 슬러그 |
| D-093 | self-undeclared | active |  |  | ook 편입·feature_flag·3중 차단·compute 수정 전부 폐기. (2) PD-040 deprecated: 실 drift 0건 + 육안 검출 충분 + D-092 자동 |
| D-093 | referent-undeclared |  | D-092 | active | ook 편입·feature_flag·3중 차단·compute 수정 전부 폐기. (2) PD-040 deprecated: 실 drift 0건 + 육안 검출 충분 + D-092 자동 |
| D-092 | self-undeclared | active |  |  | llback/자동 알림/SLA 경보/auto-resolve 게이트 전부 폐기. Master 수동 대시보드 열람이 단일 피드백. (2) 지표 정의 단일 출처: memory/roles |
| D-074 | self-undeclared | active |  |  | (S/A/B/C) 확정. L0/L1/L2 framingLevel 레이어 폐기(90세션 기록 없음 확인). D-058 dispatcher fiction 전체 폐기: dispatch_ |
| D-071 | referent-undeclared |  | D-073 | active | D-058 dispatcher-worker 분기 로직 폐기. .claude/agents/role-{ace,arki,fin,riki}.md 4개는 archive 이 |
| D-052 | self-undeclared | active |  |  | hold_reasons_catalog.json 신설 — aliases·deprecated·schemaVersion 필수 필드 (RK-1 대응). (5) 마이그레이션 = phase |
| D-052 | referent-undeclared |  | D-051 | active | hold_reasons_catalog.json 신설 — aliases·deprecated·schemaVersion 필수 필드 (RK-1 대응). (5) 마이그레이션 = phase |
| D-083 | self-undeclared | active |  |  | nova.prm_rt deprecated(replacedBy: inv_prm). blnd_spt(Riki 미포착 블라인드 스팟 발 |
| D-095 | self-undeclared | active |  |  | era 4단 breakpoint·태블릿 collapsed sidebar 폐기. 모바일 = off-canvas drawer 280px. 데스크톱 기준 + 모바일 안 깨짐(가로 스크롤 |
| D-116 | referent-undeclared |  | D-092 | active | 기존 self-scores YAML(D-092)을 폐기하지 않고 Sage 외부 채점과 병행 운영. 자가 채점(발언자)과 외부 채점(Sage)이 양립 작동. c |
| D-139 | self-undeclared | active |  |  | D-130(framing 자동 트리거 폐기) 선언만 있고 open.md 코드에 S/A/B→L2 ace-framing 매핑이 잔존하여 세션마다 자동 |
| D-139 | referent-undeclared |  | D-130 | active | D-130(framing 자동 트리거 폐기) 선언만 있고 open.md 코드에 S/A/B→L2 ace-framing 매핑이 잔존하여 세션마다 자동 |
| D-145 | self-undeclared | active |  |  | ace-framing SKILL.md Step 0·0b는 옵션 B(1줄 DEPRECATED 위임)로 본문 보존 + 번호 재정렬 안 함. (c) Nexus topicType 판정 S |
| D-160 | self-undeclared | active |  |  | es/policies/role-jobs.md 5 metrics → 4. 폐기: jobs.frame_decision_link / jobs.bias_hit / jobs.legacy_l |
| D-166 | self-undeclared | active |  |  | 채택 + append-only 구조. lock·N=1 fallback 폐기. G안 채택 — 단일 프로세스 + Task 병렬 + append-only JSONL turns push |
| D-169 | self-undeclared | active |  |  | um {hook(default), nexus(병렬)}. D-166 부분 supersede 범위: turns_append jsonl + finalize merge + archive |
| D-169 | referent-undeclared |  | D-166 | active | um {hook(default), nexus(병렬)}. D-166 부분 supersede 범위: turns_append jsonl + finalize merge + archive |
| D-169 | referent-undeclared |  | D-167 | active | um {hook(default), nexus(병렬)}. D-166 부분 supersede 범위: turns_append jsonl + finalize merge + archive |
| D-175 | self-undeclared | active |  |  | _radius 사후 2+ → B 격상. Grade C/D 통합 — D 폐기, D 키워드 fast-path C에 흡수 |
| D-176 | self-undeclared | active |  |  | 기존 PreToolUse hook BLOCK 강제 차단 방식 폐기. 이유: (1) plugin skill ~150+의 인지 실패 문제는 차단으로 해결 불가 — 인지 ≠ |
| D-177 | self-undeclared | active |  |  | RECOMMEND 시스템 구현 명세 확정. Master 가름마 우선, 폐기 임계·ROI 가설 검증 박제 안 함. Plugin Skill RECOMMEND 시스템 명세 — User |
| D-188 | referent-undeclared |  | D-138 | active | vert {merge-commit-sha} 단일 명령 원복. D-143 supersede 범위는 (4) Arki Opt-1 G1 거부 항목만 — rules.edi 박제 정책·D-1 |
| D-188 | referent-undeclared |  | D-142 | active | vert {merge-commit-sha} 단일 명령 원복. D-143 supersede 범위는 (4) Arki Opt-1 G1 거부 항목만 — rules.edi 박제 정책·D-1 |
