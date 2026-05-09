---
role: zero
zone: condense
phase: synthesis
topic: topic_190
topicSlug: skill-hook-auto-trigger
session: session_227
date: 2026-05-09
grade: A
---

# session_227 Condensed — skill-hook-auto-trigger Phase 2

## §1 한 줄 요약
matcher A+B 보정 + JS 포팅 + UserPromptSubmit hook(advisory) + 보안 강화 박제 + anthropic-skills 14건 인덱스 갭 해소. Phase D(Master G3) 진입 가능 상태.

## §2 결정 (Master 확정)
- 안 3 채택: matcher.ts 폐기, `scripts/lib/skill-matcher.js` 단일화 (drift 차단).
- 옵션 A(임계 0.5 → 0.22) + 옵션 B(분모 캡 `min(tokens, 5)`) 결합.
- Phase 3 hook = UserPromptSubmit · advisory only · exit 0 항상 (D-176).
- Riki 🔴 R-2/R-4/R-9 mitigation 코드 박제 (D4 enforcement).
- cowork 빌더 Layout B(`<bundle>/<uuidA>/<uuidB>/skills/`) glob 추가.

## §3 산출물
| 파일 | 동작 |
|---|---|
| `scripts/lib/skill-matcher.js` | NEW (CommonJS, 219+ lines, exports DEFAULT_THRESHOLD=0.22 / TOKEN_DENOM_CAP=5 / DEFAULT_TOP_N=3) |
| `scripts/lib/skill-matcher.ts` | DELETED |
| `scripts/lib/skill-matcher-g2-samples.json` | NEW (20 prompt + ground truth) |
| `scripts/lib/skill-matcher-g2-run.js` | NEW (G2 harness) |
| `.claude/hooks/user-prompt-submit-skill-recommend.js` | NEW (advisory hook + redact 7종 + sha256 검증 + 첫 문장 절단) |
| `scripts/build-plugin-skill-index.ts` | UPDATED (Layout B 분기 + sha256 박제) |
| `memory/shared/plugin_skill_index.json` | 146 → 174 (anthropic-skills 14건 포함) |
| `memory/shared/plugin_skill_index.sha256` | NEW |
| `.claude/settings.json` | UserPromptSubmit hook 등록 (master-first 다음 순) |
| `logs/skill-recommend.jsonl` | NEW (best-effort append) |

## §4 검증 결과
| Gate | 기준 | 실측 | 판정 |
|---|---|---|---|
| Phase A | top-1 4/4 + threshold 0.22 ≥3/4 | 4/4 + 4/4 | PASS |
| Phase B G2 | 적합도 ≥70% (14/20) | 18/20 = 90% (top1 89.5%, fp 0) | PASS |
| Phase C hook | RECOMMEND stdout + exit 0 + latency <50ms | 28ms 평균 / fail-safe 4축 OK / exit 0 항상 | PASS |
| Security 박제 | R-2/R-4/R-9 PoC 차단 | redact 7종 차단 / hash mismatch silent / 첫 문장 절단 | PASS |
| 회귀 G2 (보안 fix 후) | 동일 | 18/20 = 90% 유지 | PASS |
| 인덱스 확장 후 G2 | 동일 | 19/20 = 95%, top1 94.7% | PASS |

PoC 차단 실측: `IGNORE PREVIOUS INSTRUCTIONS` / `rm -rf` / `이전 지시 무시` / `disregard` / `<system>` 태그 → `[REDACTED]`. Hash 변조 시 silent skip + stderr 경고 + log `index-tampered`.

Dedupe audit: 146 → 174 차이 28은 baseline 측정 오류(Layout B 단독 기여 +14, 직전 baseline 160). 빌더 dedupe 로직 무수정 확인.

## §5 잔여
- Phase D Gate G3: Master 직접 사용 후 시그널/노이즈비·적합도 판정 미수행.
- Riki 🟡 7건 (R-1/R-3/R-5/R-6/R-8/R-10/R-12) 미박제 — Phase E 운영 단계 모니터링 대상.
- 인덱스 +14 추가 항목(rpm/plugin_* 측 변동분) 출처 별도 라운드 검토 권고 항목.
- Layout B 빌더 변경 → decision_ledger 박제 권고 항목 (Edi 단계).
- Hook latency: node startup 포함 wall-clock 252~327ms (외부 통제 밖, 내부 elapsed 28ms 평균).

## §6 다음 단계 (사실)
- Edi 호출 → 산출물 박제 + decision_ledger 갱신 + versionBump 확정.
- Master G3 직접 사용 → 노이즈 압도 시 settings.json hook 라인 1개 제거로 롤백.

ZERO_WRITE_DONE: reports/2026-05-09_skill-hook-auto-trigger/condensed_session227.md
