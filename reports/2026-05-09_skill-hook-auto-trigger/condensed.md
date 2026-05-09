# topic_190 condensed (session_224)

토픽: 스킬 훅 자동 발동 구현 / Grade A / Discussion 모드 / 관련 PD-068.

## Master 결정 (확정 — synthesis 입력)

1. **자동화 대상 재정의**: 레전드팀 12 skill 아닌 **plugin skill ~150+** 인지·활용 부재 문제. 12개는 정상 사용 중.
2. **기존 BLOCK 방식 폐기**: PreToolUse(Skill) 차단 enforcement 폐기.
3. **새 방식 = 추천 + Master 1키 선택**: 자동 1순위 호출 금지(D2/D4 위반). "하나씩 자동 적용"은 "1키 선택으로 하나씩"으로 재정의.
4. **Hook 위치**: UserPromptSubmit 단일 후보.
5. **SOT**: 별도 캐시 `memory/shared/plugin_skill_index.json` (descriptionHash·trustLevel·tags 포함).
6. **매칭 알고리즘**: 하이브리드 — 1차 substring/tag 필터(top-10) → 2차 LLM 의도 분류(top-3).
7. **최종 답변 (a)**: Arki Q1 권고 채택 — Master 1키 선택 게이트 방식 확정.

## Phase 정리

1. **Phase 1 framing (Jobs)** — Why=인지부담 누적, What=skill 분류표+hook 아키텍처+PoC, 결정축 5개(A~E), 인지편향 3건(analogical/availability/automation).
2. **Phase 2 blind-parallel (12 skill 시기)** — 5명 격리 발언. Arki: A1 90% 비현실, 실측 5/12=42%. Riki: 차단 1차 적용 거부, warn-only shadow 의무. Fin: B축 PreToolUse 단일·D축 warn-only. Ace: Conditional 지속 가능, 단일 hook+명시 우회. Jobs-deep: 본질="skill 일관성"(인지·자율은 부산물), 결정축 F/G/H 추가.
3. **Master 정정** — 대상 = plugin skill ~150+. 12개 분석 무효, 새 방식 전환.
4. **Phase 4 debate r1 (plugin recommend)** — 4명 발언. Arki: UserPromptSubmit + plugin_skill_index.json + 하이브리드 매칭 + 1키 선택 + Phase 3단계. Riki: 실패모드 5건, "인지≠사용 — ROI 부재 가설 검증 선행", 4주 채택률<10% 자동 폐기 임계 박제. Fin: 신규 ROI 우위, 키워드 매칭 시만, engineering·data 우선 PoC, top 1~3. Ace: 단일 최적해 — 매 prompt 조용히 평가 + top-1 1줄 prepend + Master 명시 채택 + 1 skill PoC.
5. **Phase 5 synthesis (대기)** — Edi 박제 예정.

## 합의 결정 (synthesis 입력)

- **Hook 위치**: UserPromptSubmit 단일.
- **SOT**: `memory/shared/plugin_skill_index.json` — version·lastSync·skills[{name,namespace,description,descriptionHash,verifiedBehavior,tags,trustLevel}].
- **매칭**: 하이브리드(키워드/태그 1차 → LLM 의도 분류 2차). substring=결정론, D4 미위배.
- **trustLevel 3단계**: unverified / verified / blocked. descriptionHash 변경 시 자동 unverified 강등. blocked는 추천 풀 제외.
- **자동 호출 금지**: 1순위 자동 실행=D4 위배. Master 1키 선택만 채택.
- **fail-open**: 인덱스 손상 시 hook 추천 생략하고 정상 통과.
- **출력 형식**: system-reminder prepend 1줄 또는 sidecar(채팅 stream 오염 방지).
- **임계**: 매칭 점수 ≥0.5, top-3 상한, 30초 무응답=무시.
- **D2 대응**: trustLevel + 행위 검증(`/skill-verify` 별도 토픽) + descriptionHash 추적.
- **PoC 범위**: 1 plugin skill 단일(Ace) vs engineering·data 카테고리(Fin) — Master 결정 필요.

## 기각된 대안

- BLOCK 방식 (PreToolUse Skill 강제 차단) — Master 폐기.
- 자동 top-1 호출 — D4 위배, Master 1키 선택으로 대체.
- 매 프롬프트 채팅 출력 추천 — Riki R-1 노이즈 누적, sidecar/조건부로 대체.
- 키워드 매칭 hit 시만 추천 — Ace 단일 최적해(매번 조용히 평가)와 충돌, debate r2 미해결.
- 12 skill 일괄 자동화 (A1 90% 목표) — Master 정정으로 무효.
- 단일 skill PoC 1건 (Ace) vs 카테고리 우선(Fin) — synthesis 미해결.
- Riki "ROI 부재 가설 선행 검증" — Master "a" 답변으로 진행 결정, 검증은 폐기 임계로 사후 흡수.
- 폐기 임계 4주 채택률<10% — Riki 제안, synthesis 박제 여부 미확정.

## Phase 분해 (Arki debate r1 명세)

| Phase | 산출물 | Gate |
|---|---|---|
| Phase 1 — 인덱스 수집 | `plugin_skill_index.json` 빌드 스크립트 + 1회 sync | **G1**: skill ≥100건, hash 안정 |
| Phase 2 — 매칭 PoC | substring+tag 필터 함수, dry-run | **G2**: 샘플 prompt 20건 top-3 적합도 ≥70% |
| Phase 3 — Hook 통합 | UserPromptSubmit hook + Master 선택 UI | **G3**: FP 노이즈 허용선 통과 |

- 의존: P1 → P2 → P3 직렬.
- 롤백: hook disable flag 1줄.
- 중단 조건: G2 적합도 <50% → 매칭 알고리즘 재선택(substring→embedding).
- 인덱스 수집 채널: plugin manifest 가능 시, 아니면 `/help` 파싱.

## 핵심 리스크 (Riki + Arki 종합)

| ID | 리스크 | mitigation | fallback |
|---|---|---|---|
| R-1 | 추천 노이즈 누적(매 prompt 5~10% 컨텍스트 점유) | sidecar 출력, 임계 ≥0.5, top-3 상한 | 키워드 hit 시만 |
| R-2 | False recommend (D2 직격) — description 거짓 | trustLevel 3단계 + 행위 검증 | unverified 라벨 표기 |
| R-3 | plugin 부재 시 추천 | available-skills 교차 확인 | "설치 필요" 표시 |
| R-4 | skill 충돌 우선순위 모호 | priority 테이블 + Master override 기록 | 충돌 시 추천 X |
| R-5 | 추천만 누적·적용 0 (인지≠사용) | 4주 채택률 KPI <10% 자동 폐기 | ROI 임계 미달 즉시 롤백 |

## 미해결 (synthesis Edi 박제 시 Master 결정 필요)

1. PoC 범위: 1 skill vs engineering·data 카테고리.
2. 폐기 임계 4주 채택률<10% 박제 여부.
3. 추천 빈도: 매 prompt 조용히 평가(Ace) vs 키워드 hit 시만(Fin/Riki).
4. 출력 형식: system-reminder 1줄 prepend vs sidecar 분리.
5. trustLevel 검증 토픽 별도 분리 동의.
6. debate r2 추가 vs synthesis 직행.
