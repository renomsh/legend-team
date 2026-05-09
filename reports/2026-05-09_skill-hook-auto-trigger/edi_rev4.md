---
role: edi
phase: synthesis
topic: topic_190
topicSlug: skill-hook-auto-trigger
session: session_227
turnId: 10
invocationMode: subagent
revision: 4
date: 2026-05-09
format: full
grade: A
accessed_assets:
  - memory/shared/topic_index.json
  - memory/shared/decision_ledger.json
  - memory/shared/evidence_index.json
  - memory/shared/glossary.json
  - reports/2026-05-09_skill-hook-auto-trigger/condensed_session227.md
  - memory/sessions/current_session.json
---

# Edi rev4 — session_227 종결 박제

> rev1/2/3은 session_224·225·226 박제. rev4는 session_227(Phase 2 — 임계 보정 + Phase 3 hook) 종결.

## §1 Executive Summary

skill-hook-auto-trigger Phase 2 완료. matcher 임계 0.22 + 분모 cap 5(옵션 A+B) 채택, `.ts→.js` 단일화로 dual-source drift 차단. UserPromptSubmit advisory hook 박제 (RECOMMEND, exit 0 보장, 평균 28ms). Riki 🔴 3건(R-2 토큰 redact / R-4 sha256 변조 차단 / R-9 첫 문장 절단) 코드 박제 완료. Layout B 빌더 분기 추가로 anthropic-skills 14건 인덱싱 격차 해소(146→160→174). Phase D Master 직접 사용 잠정 G3 PASS — 단일/짧은 토큰 false-positive 1건만 잔여. 신규 결정 박제 0건 (D-176/D-177은 session_224 유지). versionBump +0.01 (capacity).

## §2 세션 활동 요약

| 항목 | 값 |
|---|---|
| sessionId | session_227 |
| topicId | topic_190 (skill-hook-auto-trigger) |
| grade | A |
| operationType | structured |
| mode | observation |
| 코드 변경 | 신규 4 / 수정 2 / 삭제 1 |
| 결정 박제 | 0건 (carry-over: D-176/D-177 session_224) |
| PD 신규 등록 | 2건 (§5) |
| Master 명시 feedback | 0건 (검증 prompt만) |
| 역할 호출 | arki(1) → dev(8) → riki(1) → zero(1) → edi(1) |

### 결정 흐름 표

| turn | role | 산출 |
|---|---|---|
| 0 | arki | 임계 보정 옵션 A/B/C 구조 분석 + 4-phase plan |
| 1 | dev | matcher.js 포팅 + threshold 0.22 / cap 5 적용 |
| 2 | dev | Gate G2 PASS 18/20 (top1 89.5%, fp 0) |
| 3 | dev | UserPromptSubmit hook 신설 / lat 28ms |
| 4 | riki | 14 risks (🔴3 / 🟡7 / 🟢4) + 5 PoC |
| 5 | dev | R-2/R-4/R-9 fix + 회귀 G2 18/20 유지 |
| 6 | dev | Layout B 분기 → 인덱스 174 / G2 19/20 |
| 7 | dev | Phase D 사전 점검 |
| 8 | dev | dedupe audit harmless |
| 9 | zero | condense + 정제 검토 |

## §3 구현 상세

- **Phase A — matcher 보정**: `scripts/lib/skill-matcher.js` 신설 (CommonJS, exports `DEFAULT_THRESHOLD=0.22 / TOKEN_DENOM_CAP=5 / DEFAULT_TOP_N=3`). `.ts` 폐기로 dual-source drift 차단. top-1 4/4 + threshold 4/4 PASS.
- **Phase B — Gate G2**: 20-prompt ground-truth harness (`skill-matcher-g2-samples.json` + `skill-matcher-g2-run.js`) → 18/20 = 90% (fp 0). Layout B fix 후 19/20 = 95%.
- **Phase C — UserPromptSubmit hook**: `.claude/hooks/user-prompt-submit-skill-recommend.js` 신설 (advisory only, exit 0 4축 fail-safe, RECOMMEND stdout). `.claude/settings.json` master-first 다음 순 등록. 내부 elapsed 28ms 평균.
- **Riki 🔴 fix**:
  - R-2: 위험 토큰 7종 (`IGNORE PREVIOUS`, `rm -rf`, `이전 지시 무시`, `disregard`, `<system>` 등) → `[REDACTED]`.
  - R-4: `memory/shared/plugin_skill_index.sha256` + builder hash 박제 + hook verify (mismatch 시 silent skip + stderr 경고 + `index-tampered` log).
  - R-9: 첫 문장 절단 80/120 cap (prompt injection 길이 차단).
- **Layout B fix**: `scripts/build-plugin-skill-index.ts` `collectCowork` 분기 추가 → `<bundle>/<uuidA>/<uuidB>/skills/` glob. anthropic-skills 14건 신규 인덱싱 (146→160→174 baseline 정정).

## §4 Phase D 잠정 G3 결과

Master 직접 사용 1라운드.

| 분류 | 케이스 | 결과 |
|---|---|---|
| 정탐 (true positive) | "skill 만들어줘" 류 2건 | 2/2 PASS — `writing-skills` 추천 정확 |
| 음성 (true negative) | 일반 코드 질문 1건 | 1/1 PASS — 빈 RECOMMEND |
| 오탐 (false positive) | 단일/짧은 토큰 prompt 1건 | 1건 발생 — 분모 cap 하한 보정 필요 |

**잠정 판정**: G3 PASS (운영 모니터링 + 단일 토큰 보정 후속 필요).

## §5 결정·PD 변동

### 결정 박제 (0건)
신규 결정 없음. session_224 박제 D-176(UserPromptSubmit advisory) / D-177(matcher 단일화) 구현 라운드.

### PD 신규 등록 권고 (2건)
1. **단일/짧은 토큰 prompt false-positive 보정** — matcher 분모 cap 하한 도입 (예: `max(min(tokens,5), 2)`). Phase D G3 1건 발견.
2. **사후 점검 hook 토픽 분리** — PostToolUse / Stop 시점 skill 미사용 감지 advisory를 별도 토픽화. 본 세션 범위 외.

## §6 versionBump 확정 (D-130)

- **versionBumpSuggested**: 부재 (Hook 미박제)
- **변경 종류**: 코드 신규 4(matcher.js, hook js, sha256, g2 harness 2건) + 수정 2(builder.ts, settings.json) + 삭제 1(matcher.ts)
- **카테고리 검토**: 페르소나/정책/SKILL.md/CLAUDE.md/role memory 변경 없음 → structural 미해당. `.claude/hooks/*` 신규 1건 + settings.json 변경 → **capacity** 해당. bugfix(Grade C/D 한정) 미해당.
- **Edi 판단**: capacity (+0.01) 확정 — UserPromptSubmit advisory hook 신설(역량 확장) + matcher.js 단일화 + Layout B 인덱싱 보강 + Riki R-2/R-4/R-9 보안 박제 합산.
- **확정값**: **+0.01** (1.630 → **1.640**)
- **사유**: capacity 확장. 세션당 +0.1 cap 미저촉.
- **overrideReason**: N/A (suggested 부재 → 신규 박제)

```json
{
  "value": 0.01,
  "from": "1.630",
  "to": "1.640",
  "reason": "capacity: UserPromptSubmit advisory hook 신설 + matcher.js 단일화 + Layout B 빌더 분기 + Riki R-2/R-4/R-9 보안 fix",
  "confirmedBy": "edi",
  "confirmedAt": "2026-05-09T13:40:00.000Z",
  "overrideReason": null,
  "basedOn": "edi-direct"
}
```

## §7 미해결 이슈 (carry-over)

| ID | 항목 | 처리 경로 |
|---|---|---|
| C-1 | Riki 🟡 7건 (R-1/R-3/R-5/R-6/R-8/R-10/R-12) | Phase E 운영 모니터링 |
| C-2 | 단일/짧은 토큰 false-positive | PD §5-1 |
| C-3 | 사후 점검 hook (PostToolUse/Stop) | PD §5-2 |
| C-4 | Hook wall-clock 252~327ms (node startup) | 외부 통제 — 내부 elapsed 28ms 대체 측정 유지 |
| C-5 | 인덱스 +14 추가 출처 audit | 다음 라운드 선택 |
| C-6 | missing-report gaps 10건 (turns 0~9) | hook 박제 행태 — 실제 산출물은 condense·개별 dev 파일에 통합. false alarm 성격 |

## §8 세션 종결 readiness

| 기준 | 상태 |
|---|---|
| 빌드/검증 통과 | G2 19/20, hook 28ms PASS |
| 경보 없음 | gaps missing-report 10건 (info 수준, 실제 산출물 존재 — false alarm) |
| Master 미결 질문 | 0건 |
| 결정 박제 | N/A (신규 0건) |
| versionBump 확정 | PASS (+0.01 → 1.640) |
| Anchor governance (D-122) | N/A (외부 anchor 인용 turn 없음) |
| Edi 산출물 | 본 파일 |

**Auto-close 조건 충족** (CLAUDE.md 2026-04-22).

## §9 다음 세션 시작점

- **즉시 진입 후보**: PD §5-1 단일/짧은 토큰 보정 → matcher 분모 cap 하한 실험.
- **선택**: PD §5-2 사후 점검 hook 별도 토픽 (`/open`).
- **운영 모니터링**: `logs/skill-recommend.jsonl` 누적 → false-positive 비율 측정 → C grade 패치 라운드.
- **Layout B audit**: 인덱스 +14 출처 검토 (회수 가치 낮으면 skip).

[ROLE:edi]
# self-scores
scc: Y
cs_cnt: 4
art_cmp: 1
gap_fc: 2
gp_acc: 0.6
versionBumpSuggested: 0.01
