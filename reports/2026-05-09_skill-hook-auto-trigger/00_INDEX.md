# topic_190 — 스킬 훅 자동 발동 구현 / 발언 인덱스

세션: session_224 / Grade A / Discussion 모드 / 관련 PD: PD-068

## Phase 1 — Framing
- [01_jobs_framing_phase1.md](01_jobs_framing_phase1.md) — Jobs 1차 framing (결정축 5개 A~E, 인지편향 3건)

## Phase 2 — Blind-Parallel (12 skill 시기, Master 정정 전)
- [02_arki_blind_parallel.md](02_arki_blind_parallel.md) — **A1 90% 비현실 / 실측 5/12=42%** + Phase 분해 4단계
- [03_riki_blind_parallel.md](03_riki_blind_parallel.md) — 실패모드 6건, 차단 1차 적용 거부, warn-only shadow 의무
- [04_fin_blind_parallel.md](04_fin_blind_parallel.md) — 비용 양극화, B축 PreToolUse 단일·D축 warn-only 권고
- [05_ace_blind_parallel.md](05_ace_blind_parallel.md) — Conditional 지속 가능, B/C/D 통합 권고
- [06_jobs_deep_blind_parallel.md](06_jobs_deep_blind_parallel.md) — **본질 = "skill 일관성"** (90% 표면 아님), 추가 결정축 F/G/H

## Master 정정 (Phase 3 open)
- 자동화 대상 = **plugin skill ~150+** (레전드팀 12개는 정상 사용 중)
- 진짜 문제 = Master 인지 실패 → 미사용
- 기존 hook BLOCK 방식 폐기
- 새 방식: 프롬프트 입력 시 추천 → 하나씩 자동 적용

## Phase 4 — Debate r1 (plugin recommend 새 방식)
- [07_arki_debate_r1.md](07_arki_debate_r1.md) — UserPromptSubmit hook + plugin_skill_index.json + 하이브리드 매칭 + Master 1키 선택
- [08_riki_debate_r1.md](08_riki_debate_r1.md) — 실패모드 5건, **"인지 ≠ 사용 — ROI 부재 가설 검증 선행 필요"**, 4주 채택률<10% 자동 폐기
- [09_fin_debate_r1.md](09_fin_debate_r1.md) — 신규 ROI 우위, 키워드 매칭 시만, engineering·data 우선, top 1~3
- [10_ace_debate_r1.md](10_ace_debate_r1.md) — 단일 최적해: 매 prompt 조용히 평가 + top-1 1줄 prepend + Master 명시 채택 + 1 skill PoC

## Master 결정 필요 (synthesis 진입 전)
1. 추천 빈도: 매 프롬프트 vs 키워드 hit 시만
2. 출력 형식: 1줄 top-1 vs 표 top-3 vs sidecar 분리
3. 1차 PoC 범위: 1 skill / 1 카테고리 / 인덱스 수집 직렬
4. Riki "ROI 부재 가설" 선행 검증 여부
5. 폐기 임계 박제 (4주 채택률 임계)
6. debate r2 vs synthesis 직행
