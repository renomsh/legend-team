---
role: arki
topic: open-context-90k-analysis
date: 2026-05-04
turnId: 0
invocationMode: subagent
---

# Arki 분석: /open 컨텍스트 90K 원인 실측

## 실측 파일 크기

| 파일 | 크기(bytes) | 토큰 추정(÷4) | 비고 |
|---|---|---|---|
| CLAUDE.md (system prompt) | 27,347 | ~6,837 | 항상 로드 |
| MEMORY.md (user auto-memory) | 9,634 | ~2,409 | 항상 로드 |
| system_state.json (fast-path) | 46,743 | ~11,686 | /open step 2 |
| └─ pendingDeferrals (56항목 전체) | 29,482 | ~7,371 | ★ 53개 비활성 포함 |
| └─ openTopics | 198 | ~50 | |
| └─ recentDecisions | 1,325 | ~331 | |
| current_session.json | 722 | ~181 | /open step 1 |
| topic_load_manifest.json | 2,738 | ~685 | /open step 4 |
| ace_memory.json | 31,781 | ~7,945 | 항상 로드 |
| arki_memory.json | 13,655 | ~3,414 | implementation type |
| dev_memory.json | 14,556 | ~3,639 | implementation type |
| dispatch inject/subagent (persona layer) | ~7,800 | ~1,950 | Task 호출당 |
| dispatch inject/subagent (session layer) | ~18,000 | ~4,500 | 이전 역할 보고서 × 3 |
| dispatch inject/subagent (topic layer) | ~16,000 | ~4,000 | 이전 edi 보고서 × 2 |

### 정상 경로 합계

| 시나리오 | 토큰 추정 |
|---|---|
| Base only (CLAUDE.md + MEMORY.md) | ~9,245 |
| /open 체크리스트 (ace 1개 role) | ~29,741 |
| /open 체크리스트 (3 role, implementation) | ~36,794 |
| + 서브에이전트 1회 dispatch inject | ~46,794~56,794 |

---

## 주요 원인 (상위 3개)

### 원인 1. system_state.json pendingDeferrals 비활성 항목 미정리 — ★ 최대 기여
- **크기:** 29,482 bytes = **~7,371 tokens**
- **내용:** 56개 항목 중 pending=3, in-progress=0, **resolved=41+deprecated=11+resolved-fiction=1 = 53개 비활성**
- **원인:** `sync-system-state.ts` line 174가 `currentState.pendingDeferrals` 전체를 무조건 carry-over. 비활성 필터 없음.
- **절감 가능:** 53개 제거 시 ≈ 26,500 bytes 절감 → **~6,600 tokens 절감**

### 원인 2. ace_memory.json 누적 성장 — 중기 기여
- **크기:** 31,781 bytes = **~7,945 tokens**
- **내용:** `lessonLog`, `masterSelectionPatterns`, `topicsHandled` 누적. 개별 항목 900~4,000 bytes.
- **원인:** 세션마다 추가 only, trim 없음. session_001~180 누적.
- **절감 가능:** `topicsHandled` 요약/TTL 적용 시 ≈ 50% 절감 → **~4,000 tokens 절감 가능**

### 원인 3. dispatch hook 서브에이전트 inject — 구조적 기여
- **크기:** 최대 80,000 chars cap = **최대 ~20,000 tokens per 서브에이전트 호출**
- **내용:** persona 3층(7.8K) + session layer(이전 보고서, 최대 18K) + topic layer(이전 edi, 최대 16K)
- **원인:** topic_127은 5개 edi 보고서(각 10K+) 보유. 다회 세션 토픽은 topic layer만 40K+.
- **현재 대응:** TOTAL_CAP_CHARS=80,000 caps 있으나, 상한이 너무 높음.

---

## 경량화 가능 항목

| 항목 | 현재 크기 | 조치 | 절감 추정 |
|---|---|---|---|
| pendingDeferrals (비활성 53개) | 29,482 bytes | sync-system-state.ts에서 `status!=='pending'` 필터 적용 | **~26,500 bytes / ~6,600 tokens** |
| ace_memory.json topicsHandled | ~3,801 bytes | 최근 20건만 유지, 나머지 아카이브 | ~1,500 bytes / ~375 tokens |
| ace_memory.json masterSelectionPatterns | ~4,351 bytes | key 요약으로 압축 | ~2,000 bytes / ~500 tokens |
| dispatch TOTAL_CAP_CHARS | 현재 80,000 | 50,000으로 하향 | per-subagent ~7,500 tokens 절감 |
| topic layer (다회 세션 토픽) | 최대 50K+ | 최신 1~2개 edi만 inject (현재: 전체) | 최대 ~8,000 tokens 절감 |
| system_state.json (전체) | 46,743 bytes | pending 전용 slim 버전 별도 생성 | ~18,000 bytes 순 절감 가능 |

---

## 구조적 의존 관계

```
/open 실행
  └─ CLAUDE.md [system prompt, 항상]
  └─ MEMORY.md [user memory, 항상]
  └─ memory/sessions/current_session.json [step 1]
  └─ memory/shared/system_state.json [step 2, fast-path]
       └─ pendingDeferrals[56] ← sync-system-state.ts carry-over (비필터)
       └─ openTopics, recentDecisions, recentSessionSummaries
  └─ memory/shared/topic_load_manifest.json [step 4]
       └─ 키워드 매칭 → role memory 선택 로드
            └─ ace_memory.json [항상]
            └─ arki_memory.json, dev_memory.json [implementation type]
  └─ [Subagent Task 호출 발생 시]
       └─ .claude/hooks/pre-tool-use-task.js
            └─ memory/roles/policies/_common.md
            └─ memory/roles/policies/role-{r}.md
            └─ memory/roles/personas/role-{r}.md
            └─ reports/{slug}/{role}_rev{n}.md (session layer)
            └─ topics/{id}/session_contributions/*_edi_report.md (topic layer)
```

**핵심 의존:** `sync-system-state.ts` → `system_state.json.pendingDeferrals` → `/open` 체크리스트 step 2 전량 로드

---

## Arki 진단 요약

**성장 경로:** session_001 ~30K → session_180 ~90K. 3배 성장의 주원인:
1. pendingDeferrals 누적 (56개, 95% 비활성)
2. role memory 파일 세션마다 누적 성장 (ace: 31K)
3. dispatch hook topic layer 누적 (multi-session 토픽)

**즉각 실행 가능 (MUST_NOW):**
- `sync-system-state.ts`: `pendingDeferrals` 필터를 `status === 'pending'` 만 포함으로 변경
  → 즉시 ~26,500 bytes / **~6,600 tokens 절감**. 코드 변경 5줄 이내.

**중기 (MUST_BY_N=10):**
- `pre-tool-use-task.js`: `TOTAL_CAP_CHARS` 80,000 → 50,000 하향, topic layer `ediFiles.slice(-2)` 최신 2개만 inject
- ace_memory.json: `topicsHandled` 최근 30건 cap + 나머지 archive 파일 분리

**구조 재설계 (SHOULD):**
- system_state.json slim 버전 (`system_state_slim.json`) — pending만 포함, /open fast-path용 전용 파일
  현재 문서 지침 "system_state.json (fast-path)"가 이미 의도하는 개념이지만 미구현 상태

**경계 조건 (설계가 깨지는 조건):**
- topic_index.json이 system_state fallback으로 로드되면 추가 ~29,630 tokens (118K bytes)
- decision_ledger.json fallback 시 +~44,873 tokens (179K bytes)
- → fallback 조건 발생 최소화가 token 안정성의 핵심. system_state 갱신 신뢰도 유지 필수.

**목표 달성 가능성:** 위 3개 조치 적용 시 ~90K → **~60~65K tokens**로 감소. 50K 달성은 dispatch CAP 조정 + role memory trim 병행 필요.
