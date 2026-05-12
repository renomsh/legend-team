---
sessionId: session_238
topicId: topic_202
grade: B
operationType: structured
date: 2026-05-12
refinedBy: zero
domains: [simplify]
---

# session_238 — Nexus fabrication 방지 + PD-080 hook 버그

## TL;DR

- Nexus fabrication 사고 2건(zero_rev*.md 부재 단언, Grade C Zero 면제 단언) Riki 감사로 허위 판정 → **D-185** 박제: 단언 전 반례 1건 능동 탐색 + Master 확인 동사에 읽을 범위 선언 게이트
- PD-080(Zero D.Condense 산출물 `condensed.md` hook 미인식) 5분 fix: `post-tool-use-task.js` 2곳에 `_zero_condense.json` 마커 우회 + role=zero 분기 추가
- 회귀 테스트 `scripts/test-pd80-fix.js` 4건 PASS (session_234 실측 산출물 기준)
- Riki 적출(legacy 마커 1건·files 검증 누락) → Jobs 반대 "버그는 끝, 헬퍼 치환은 별 PD" → **PD-085 (Tech debt SOT 일관화) 등록**으로 분리
- 박제: D-185 / PD-080 resolved / PD-085 pending

## 핵심 흐름

1. `/open B PD-80` — Zero D.Condense gate 산출물(condensed.md)을 hook이 못 인식하는 버그 처리
2. Nexus 1차 답변 → Riki 감사: 단언 2건 fabrication 적출
   - "zero_rev*.md 가 없다" 단언 — 실측 미수행
   - "Grade C 토픽은 Zero 자체 면제" 단언 — 정책 근거 부재
3. CLAUDE.md D-180 절에 **D-185** 확장 박제 (옵션 A+C)
   - 단언 직전 반례 1건 능동 탐색
   - Master 확인 동사("보여줘"/"확인해" vs "실행해")에 "어디까지 읽을지" 범위 선언 게이트
4. session_234 실측으로 추가 fabrication 발견: "zero_condensed.md" 가정 → 실제는 `condensed.md`
5. Ace framing → Jobs framing → Master 채택: **"PD-80 5분 버그 fix부터, scope 분리"**
6. Nexus 구현: `.claude/hooks/post-tool-use-task.js` 2곳 수정
   - **frontmatter-patch**: `_zero_condense.json` 마커 발견 시 `sessionId` + `files[]` 검증 통과하면 `condensed.md` 우회 인정
   - **missing-report**: `role=zero` 분기 — 마커 우선, fallback으로 `condensed.md` / `zero_rev*.md`
7. 회귀 테스트 `scripts/test-pd80-fix.js` 작성 → session_234 실측 산출물 대상 4건 PASS
8. Arki 검토 OK → Riki 검토: legacy 마커 1건(session_194 이전 잔존), files[] 검증 누락 적출
9. Ace synthesis: Riki 조건부 채택안 권고
10. Jobs 반대: "버그 fix는 종결, 헬퍼 치환·SOT 일관화는 별 PD로 분리" → Master 옵션 A 채택
11. PD-080 resolved, PD-085 (post-tool-use 인라인 마커 검증 SOT 일관화) pending 등록

## 박제 결정

| ID | 내용 | 상태 |
|---|---|---|
| **D-185** | Nexus fabrication 방지 — 단언 전 반례 1건 능동 탐색 + Master 확인 동사 범위 선언 게이트 | 박제 (CLAUDE.md D-180 절 확장) |
| **PD-080** | Zero D.Condense `condensed.md` hook 미인식 | resolved |
| **PD-085** | post-tool-use 인라인 마커 검증 → `scripts/lib/zero-condense-marker.ts` SOT 헬퍼로 일관화 | pending |

## 파일 변경

| 파일 | 변경 |
|---|---|
| `.claude/hooks/post-tool-use-task.js` | frontmatter-patch + missing-report 2곳에 zero 마커 우회/분기 추가 |
| `scripts/test-pd80-fix.js` | 회귀 테스트 신규 (session_234 실측 기준 4 케이스) |
| `CLAUDE.md` | D-180 절에 D-185 확장 박제 |
| `memory/shared/decision_ledger.json` | D-185 추가 |
| `memory/shared/pending_deferrals.json` | PD-080 resolved, PD-085 추가 |
| `memory/shared/topic_index.json` | topic_202 상태 갱신 |
| `memory/sessions/current_session.json` | session_238 turns 박제 |

## Lessons

- **Nexus 본체 fabrication 2건 + Riki 동조 1건** — D-180만으로 부족 → D-185 확장 (반례 능동 탐색 + 확인 동사 게이트) 필요성 실증
- **Scope 게이트 효과**: Jobs framing이 "버그 fix 끝났음, 헬퍼 치환은 별 PD" 분리 → 토픽 비대화 방지, PD-085로 정상 이연
- **Tech debt 1건 (PD-085)**: post-tool-use 인라인 마커 검증이 `zero-condense-marker.ts` SOT 헬퍼(PD-064 P1)와 분리되어 키 드리프트 재발 여지 — 추후 SOT 일관화 필요

[ROLE:zero]
# self-scores
ref_cnt: 1
hc_found: 0
cln_rt: 1.0
