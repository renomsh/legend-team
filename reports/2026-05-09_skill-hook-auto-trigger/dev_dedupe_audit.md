---
role: dev
phase: framing
topic: topic_190
topicSlug: skill-hook-auto-trigger
session: session_227
turnId: 8
invocationMode: subagent
date: 2026-05-09
grade: A
accessed_assets:
  - file: memory/shared/plugin_skill_index.json
    scope: current_index
  - file: reports/2026-05-09_skill-hook-auto-trigger/dev_index_gap_diagnosis.md
    scope: prior_round_baseline
---

# Dev — Dedupe 의문 Audit (topic_190)

## 결론

"146 → 174 = +28, 그런데 anthropic-skills는 14건. 차이 14는 어디로?" 프레이밍은 **허상**. 실제 Layout B 추가 기여분은 **+14**(전부 anthropic-skills). 146은 더 이전 시점 baseline이며, Layout B 추가 직전 baseline은 160이다(174 − 14 = 160). dedupe 동작 변화 없음, 빌더 코드 변경 불요, 인덱스 174 그대로 유효.

## §1 가설 검증 결과

직전 라운드 진단(`dev_index_gap_diagnosis.md`) + 현재 인덱스 실측 기반.

| ID | 가설 | 결과 | 근거 |
|---|---|---|---|
| H1 | Layout B 패치가 14건 외 추가 namespace를 끌어들였다 | **FAIL** | namespace 분포(§2) anthropic-skills = 14, 나머지 32개 namespace 합 = 160. Layout B 직전 baseline(160)과 정확히 일치. |
| H2 | dedupe 키 약화로 cowork 항목이 추가 흡수되었다 | **FAIL** | cowork 측 namespace 항목 수 변화 0(빌더 cowork 분기 미수정). |
| H3 | marketplace 측 collision 풀림으로 +14 외 누설 | **FAIL** | marketplace+cowork 합계가 160 + 14 유지. 누설 시 174 초과해야 함. |
| H4 | 146 → 174 차이 28이 Layout B 단독 기여 | **FAIL** | Layout B는 anthropic-skills 14건만 추가. "+28" 산정의 baseline이 잘못 잡힘. |
| H5 | 빌더에 silent dedup 변경 commit | **FAIL** | `git log -- scripts/build-plugin-skill-index.ts memory/shared/plugin_skill_index.json` → 단일 commit `2344c9c session end: skill-hook-auto-trigger phase1+2 implementation`. dedupe 로직 수정 없음(Layout B glob 추가만). |

## §2 namespace 분포 (현재 인덱스 174건)

```
total: 174
```

주요 namespace (총 33종):

| namespace | count | namespace | count |
|---|---:|---|---:|
| daloopa | 21 | sales | 9 |
| **anthropic-skills** | **14** | legal | 9 |
| data | 10 | finance | 8 |
| engineering | 10 | marketing | 8 |
| operations | 9 | product-management | 8 |
| human-resources | 9 | design | 7 |
| plugin-dev | 7 | bio-research | 6 |
| customer-support | 5 | enterprise-search | 5 |
| sp-global | 4 | productivity | 4 |
| mcp-server-dev | 3 | discord/imessage/telegram/example-plugin | 2×4 |
| (단건 13종) | 13 | | |

소계 검증: 174 − 14(anthropic-skills) = **160**. Layout B 적용 직전 baseline과 정합.

## §3 baseline 오류 분석 — "146"은 어디서 왔는가

직전 라운드 보고(`dev_index_gap_diagnosis.md` §1):

> 전체 `totalCount`: 146 (marketplace 26 / cowork 120).

이 146은 **Phase 2 진단 시점** 스냅샷이다. 그 이후 Layout B 패치 이전 단계에서 빌더 다른 분기 변경(cowork plugin scan 누적분 등)으로 160이 되어 있었고, 마지막 Layout B 패치에서 +14만 들어가 174가 되었다.

즉 "146 → 174"는 **두 단계 변화의 합산을 한 단계로 오인**:

- 단계 1 (Layout B **이전**): 146 → 160 (+14, anthropic-skills 외)
- 단계 2 (Layout B 적용): 160 → 174 (+14, 전부 anthropic-skills)

Layout B 단독 기여는 **+14**. 그 14는 anthropic-skills 14와 동일한 수다. dedupe 누락·중복 흡수·collision 변화 모두 발생하지 않았다.

검증:
```
$ git log --oneline -- memory/shared/plugin_skill_index.json scripts/build-plugin-skill-index.ts
2344c9c session end: skill-hook-auto-trigger phase1+2 implementation
```
worktree 단일 commit. 빌더 dedupe 키·정렬·필터 코드 변경 없음(Layout B glob 추가만).

## §4 결론: 무해

- **실제 dedupe 변화 없음** — 빌더 dedupe 로직 무수정.
- **단순 baseline 측정 오류** — "146"은 Layout B 이전 두 단계 전 스냅샷.
- **인덱스 174 유효** — namespace 분포 합산 정합(160 + 14 = 174).

## §5 처리

- PD 등록 **불필요** — 시스템 결함 0건.
- 빌더 코드 변경 **불필요**.
- 인덱스 174 그대로 유지.
- 후속 baseline 비교 시 직전 build 결과를 SOT로 사용. 진단 리포트 본문 수치를 baseline으로 재인용 시 스냅샷 시점 명시 필수.

DEV_WRITE_DONE: reports/2026-05-09_skill-hook-auto-trigger/dev_dedupe_audit.md
