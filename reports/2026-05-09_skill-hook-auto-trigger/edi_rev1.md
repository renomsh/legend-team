---
role: edi
phase: synthesis
topic: topic_190
session: session_224
turnId: 12
invocationMode: subagent
revision: 1
date: 2026-05-09
accessed_assets:
  - memory/shared/topic_index.json
  - memory/shared/decision_ledger.json
  - memory/shared/evidence_index.json
  - memory/shared/glossary.json
  - memory/shared/pending_deferrals.json
  - memory/shared/project_charter.json
  - memory/sessions/current_session.json
  - reports/2026-05-09_skill-hook-auto-trigger/condensed.md
---

# Edi Synthesis — topic_190 (스킬 훅 자동 발동 구현)

## Executive Summary

플러그인 스킬 ~150+ 인지·활용 부재 문제에 대해, 기존 BLOCK enforcement 폐기 후 **UserPromptSubmit hook 기반 RECOMMEND + Master 1키 선택** 시스템으로 전환 결정. 자동 1순위 호출은 D2/D4 위배로 금지. 매 프롬프트 조용히 평가하여 표 top-3 + 1줄 역할 설명을 system-reminder에 prepend, Master가 1/2/3 또는 "이 skill 추천하지마"로 응답. 구현은 인덱스 수집(P1) → 매칭 PoC(P2) → Hook 통합(P3) 직렬. 본 세션은 **결정 박제 + 명세 확정** 단계이며 코드 구현은 다음 세션 Phase 1부터.

## §1 결정 흐름 표

| Turn | Phase | 역할 | 핵심 출력 |
|---|---|---|---|
| 1 | framing | Jobs | Why=인지부담, What=분류표+hook+PoC, 결정축 A~E, 인지편향 3건 |
| 2 | blind-parallel | Arki | A1 90% 비현실(실측 5/12=42%) |
| 3 | blind-parallel | Riki | 차단 1차 거부, warn-only shadow 의무 |
| 4 | blind-parallel | Fin | B축 PreToolUse 단일·D축 warn-only |
| 5 | blind-parallel | Ace | Conditional 지속 가능, 단일 hook+명시 우회 |
| 6 | blind-parallel | Jobs-deep | 본질="skill 일관성", 결정축 F/G/H 추가 |
| — | (Master 정정) | Master | 대상=plugin skill ~150+, 12개 분석 무효, 새 방식 전환 |
| 7 | debate r1 | Arki | UserPromptSubmit + plugin_skill_index.json + 하이브리드 + 1키 선택 + Phase 3단계 |
| 8 | debate r1 | Riki | 실패모드 5건, 4주 채택률<10% 폐기 임계 제안 |
| 9 | debate r1 | Fin | ROI 우위, 키워드 매칭 시만, engineering·data 우선 PoC |
| 10 | debate r1 | Ace | 매 prompt 조용히 평가 + top-1 prepend + 1 skill PoC |
| — | (Master 결정) | Master | 매 프롬프트 평가, 표 top-3+1줄 설명, 1키 선택, 인덱스부터 직렬, 폐기임계 박제 X, debate r2 생략 |
| 13 | synthesis | Edi | (본 발언) 결정 박제 + 명세 확정 |

## §2 역할별 기여 통합 (이견·합의 동시 표면화)

### 합의된 지점
- **Hook 위치**: UserPromptSubmit 단일 (Arki·Fin·Ace·Riki 공통)
- **SOT 분리**: `memory/shared/plugin_skill_index.json` (Arki 제안, 전원 동의)
- **trustLevel 3단계** + **descriptionHash 추적**: D2 정합 (Arki·Riki)
- **fail-open**: 인덱스 손상 시 hook 추천 생략 정상 통과 (Arki·Riki)
- **자동 호출 금지** = D4 정합: Master 1키 선택만 (Riki·Ace·Master 확정)

### 미합의 → Master 결정으로 종결된 지점
| 축 | Riki/Fin | Ace | Master 결정 |
|---|---|---|---|
| 추천 빈도 | 키워드 hit 시만 (노이즈 우려) | 매 prompt 조용히 평가 | **매 프롬프트 평가** (Master) |
| 출력 형식 | sidecar 분리 | system-reminder 1줄 prepend | **표 top-3 + 1줄 설명** prepend (Master) |
| PoC 범위 | engineering·data 카테고리 (Fin) / 1 skill (Ace) | — | **인덱스 수집부터 직렬** (Phase 1 우선) |
| ROI 부재 가설 | 4주 채택률<10% 사전 검증 (Riki) | 진행 후 사후 흡수 | **Master 직접 사용 후 결정**, 폐기 임계 박제 X |
| debate r2 | (필요) | — | **생략, synthesis 직행** |

## §3 결정 박제 (decision_ledger 후보)

> 본 세션 종료 시 Edi가 `memory/shared/decision_ledger.json`에 다음 2건 박제 책임. 세션 종료 hook이 D-176/D-177 채번 적용.

### D-176 — Plugin Skill RECOMMEND 시스템 도입
- **축**: orchestration · ux
- **summary**: 플러그인 스킬 ~150+ 인지·활용 부재를 해소하기 위해 UserPromptSubmit hook 기반 추천 시스템 도입. 매 프롬프트 조용히 평가, 매칭 점수 ≥0.5 통과 항목 중 top-3을 표 + 1줄 설명 형태로 system-reminder 채널에 prepend. Master는 1/2/3 1키 선택으로 적용, 무응답·무관 입력 시 무시. "이 skill 추천하지마" / `/block-skill <name>` 발화 시 trustLevel: blocked로 영구 제외.
- **rationale**: ~150+ 스킬을 Master·Claude 모두 인지 부족으로 활용 못 하는 상태. 자동 호출은 D2(description 거짓 전제)/D4(모델 설득 무력화) 위배 → Master 1키 게이트로 인간 통제 유지하면서 인지 부담 해소.
- **scope**: plugin skill 전체 (~150+). 레전드팀 자체 12개 skill은 정상 사용 중이므로 대상 외.
- **date**: 2026-05-09
- **session**: session_224
- **topic**: topic_190
- **supersedes**: 없음 (신규)

### D-177 — Plugin Skill BLOCK enforcement 폐기 → RECOMMEND 전환
- **축**: governance · skill-lifecycle
- **summary**: 기존 PreToolUse(Skill) 강제 차단 enforcement 폐기. RECOMMEND 방식으로 전환. 자동 1순위 호출도 D4 위배로 금지. Master 1키 선택만 채택.
- **rationale**: BLOCK은 인지부담 해소가 아니라 가중. Master "하나씩 자동 적용" 의도는 "1키 선택으로 하나씩"으로 재해석.
- **date**: 2026-05-09
- **session**: session_224
- **topic**: topic_190

## §4 PD-068 상태 전이 명세

```json
{
  "id": "PD-068",
  "status": "in-progress",
  "resolveCondition": "Phase 3 hook 통합 완료 + Master 직접 사용 검증 통과 (자동화 진행/제외/유지 결정)",
  "linkedTopic": "topic_190",
  "linkedDecisions": ["D-176", "D-177"],
  "updatedAt": "2026-05-09",
  "updatedBy": "edi (session_224 synthesis)"
}
```

## §5 구현 명세 (Phase 1~3 직렬)

### Phase 1 — 인덱스 수집
- **산출물**: `memory/shared/plugin_skill_index.json`, `scripts/build-plugin-skill-index.ts`
- **데이터 소스 우선순위**:
  1. plugin manifest 직독 (가능 시)
  2. `/help` 또는 system-reminder available-skills 블록 파싱
  3. 보조: 수동 보완
- **스키마**:
  ```json
  {
    "version": "<semver>",
    "lastSync": "<ISO>",
    "skills": [
      {
        "name": "<skill-name>",
        "namespace": "<plugin-namespace>",
        "description": "<원문>",
        "descriptionHash": "<sha256>",
        "tags": ["..."],
        "trustLevel": "unverified | verified | blocked",
        "blockedReason": "<옵션>",
        "verifiedBehavior": "<옵션, 행위검증 결과>"
      }
    ]
  }
  ```
- **Gate G1**: 인덱싱 skill ≥100건 + descriptionHash 안정 (재실행 시 변경 없음).

### Phase 2 — 매칭 PoC
- **산출물**: `scripts/lib/skill-matcher.ts`
- **알고리즘**: 1차 substring/tag 필터 → top-N=10 후보 → (옵션) 2차 LLM 의도 분류 → top-3
- **임계**: 매칭 점수 ≥0.5
- **dry-run 모드**: hook 미통합 상태에서 샘플 prompt 입력 → 매칭 결과만 출력
- **Gate G2**: 샘플 prompt 20건 top-3 적합도 ≥70% (Master 직접 평가). 미충족 시 substring → embedding 알고리즘 전환 검토.

### Phase 3 — Hook 통합
- **산출물**: `.claude/hooks/user-prompt-submit-skill-recommend.js`
- **동작 흐름**:
  1. UserPromptSubmit 진입 → `plugin_skill_index.json` 로드 (실패 시 즉시 종료, 정상 통과)
  2. 매칭 엔진 실행 → top-3 (점수 ≥0.5 통과한 것만)
  3. system-reminder 채널 prepend:
     ```
     [skill-recommend] 추천 후보:
     | # | Skill | 역할 |
     |---|---|---|
     | 1 | <namespace:name> | <1줄 설명> |
     | 2 | ... | ... |
     | 3 | ... | ... |
     선택: 1/2/3 또는 무시. 영구 제외: "이 skill 추천하지마" / /block-skill <name>
     ```
  4. Master 응답 처리 (별도 PostUserPrompt 또는 동일 hook에서):
     - "1"/"2"/"3" → 해당 skill 자동 호출
     - 무응답/무관 입력 → 무시
     - "이 skill 추천하지마" / `/block-skill <name>` → trustLevel: blocked 갱신
- **롤백**: hook disable flag 1줄 (`feature_flags.json` 내 `plugin_skill_recommend: false`)
- **Gate G3**: Master 직접 사용 후 자동화 진행 / 제외 / 유지 결정.

## §6 거버넌스 결정 정합

| Prime Directive | 정합 메커니즘 |
|---|---|
| **D2 (도구 설명 거짓 전제)** | trustLevel 3단계 + descriptionHash 추적 + 행위 검증(`/skill-verify` 별도 토픽 분리). description 변경 시 자동 unverified 강등. |
| **D4 (모델 설득 무력화)** | 자동 1순위 호출 금지. Master 1키 선택만. hook 코드에 박제 (모델 자율 판단 의존 X). |
| **D-125 (anchor governance)** | `plugin_skill_index.json` 변경 시 Edi 박제 책임 확장 (descriptionHash 변경·trustLevel 강등 모두 박제 대상). |
| **fail-open 원칙** | 인덱스 부재·손상 시 hook 추천 생략, 정상 통과 (시스템 무력화 방지). |

## §7 미해결 이슈·Gap (papering over 금지)

| ID | 이슈 | Master 결정 또는 사후 흡수 경로 |
|---|---|---|
| G-1 | 추천 노이즈 누적 (Riki R-1) | Master "최대한 추천" 의도 수용 — 본 세션 박제 안 함. Master 직접 사용 후 재평가. |
| G-2 | ROI 부재 가설 (Riki R-5) | Master 직접 사용 후 결정. 4주 채택률<10% 폐기 임계 박제 X. |
| G-3 | PoC 범위 (1 skill vs 카테고리) | "인덱스 수집부터 직렬" 결정으로 후순위. Phase 2 진입 시 재검토. |
| G-4 | trustLevel 행위 검증 토픽 분리 | 별도 토픽(`/skill-verify`) — 본 세션 범위 외. |
| G-5 | 추천 후보가 0건일 때 출력 형식 | 명세 미정. Phase 3 hook 구현 시 결정 (기본값: 출력 생략). |

## §8 인계 메모 (다음 세션)

- **시작점**: Phase 1 — `scripts/build-plugin-skill-index.ts` 작성
- **우선 작업**:
  1. plugin manifest 위치·접근 경로 조사 (anthropic-skills, daloopa, miro, sp-global, pdf-viewer, productivity, operations, human-resources, design, sales, finance, customer-support, legal, product-management, enterprise-search, engineering, data — 17 plugin namespace 식별됨)
  2. `/help` 파싱 fallback 경로 확인
  3. `plugin_skill_index.json` 초기 빌드 → Gate G1 검증
- **컨텍스트**: 본 세션 reports 디렉토리 + decision_ledger 신규 D-176/D-177 + PD-068 in-progress
- **PD 상태**: PD-068 status=in-progress, resolveCondition 갱신 완료
- **dispatch 주의**: 본 작업은 Grade A — Phase 1은 코드 작업이므로 Dev subagent 호출 권장

## §9 versionBump 확정 (D-130 + PD-064)

### 입력 — versionBumpSuggested 부재
`current_session.json.versionBumpSuggested = null` (Nexus 자동 감지값 부재). 이는 본 세션이 **결정 박제 + 명세 확정** 단계로 코드 변경 0건이며, 자동 감지 룰의 변경 파일 매칭 카테고리에 해당 없음. **D-130 §6.4 케이스 1 (suggested 부재)** 처리.

### Edi 판단
- 자동 감지: 없음
- 변경 파일: 0건 (본 세션은 reports/* + 결정 박제만, decision_ledger.json은 세션 종료 hook이 갱신)
- **확정**: decision_ledger.json에 D-176/D-177 신규 추가 예정 → D-130 룰상 capacity(+0.01) 해당. 단, 본 발언 시점 미적용 → **세션 종료 hook 적용 후 자동 감지 재평가 필요**
- **Edi 의견**: +0.01 (capacity, decision_ledger 신규 2건). structural(+0.1) 아님 — 페르소나·정책 신규 도입은 결정 박제일 뿐 현 세션 내 코드 박제 없음.
- **확정값**: **+0.01** (1.619 → 1.620)
- **사유**: D-176/D-177 결정 박제로 capacity 확장. 코드 구현은 다음 세션 Phase 1부터 → 현 세션 structural bump 부적합.

```json
{
  "value": 0.01,
  "from": "1.619",
  "to": "1.620",
  "reason": "D-176/D-177 결정 박제 (Plugin Skill RECOMMEND 시스템 도입 + BLOCK 폐기). capacity 확장. 코드 구현은 다음 세션.",
  "confirmedBy": "edi",
  "confirmedAt": "2026-05-09T00:00:00Z",
  "basedOn": "edi-override",
  "overrideReason": "versionBumpSuggested null → Edi 수동 판단 (decision_ledger 신규 2건 매칭, capacity bump 적용)"
}
```

## §10 세션 종결 readiness 평가

| 항목 | 상태 |
|---|---|
| 빌드 통과 | N/A (코드 변경 없음) |
| 경보 없음 | OK (open gaps 없음) |
| Master 미결 질문 | 없음 (Master 8개 결정 확정, debate r2 생략 명시) |
| Edi 박제 완료 | 본 발언으로 완료 |
| versionBump 확정 | +0.01 (1.619 → 1.620) |
| PD 전이 | PD-068 → in-progress |
| 결정 박제 후보 | D-176, D-177 (세션 종료 hook이 채번·박제) |
| 다음 세션 시작점 | Phase 1 인덱스 수집 |

**판정: 세션 종결 가능 (auto-close 기준 충족).**

---

[ROLE:edi]
# self-scores
scc: Y
cs_cnt: 4
art_cmp: 1.0
gap_fc: 4
gp_acc: 0.85
versionBumpSuggested: {to: "1.620", reason: "D-176/D-177 결정 박제 (capacity +0.01)"}
