---
sessionId: session_236
topicId: topic_199
grade: A
operationType: structured
date: 2026-05-11
refinedBy: zero
domains: []
---

# PD-081 auto-push 순서 꼬임 — Condensed (Zero D.Condense)

## TL;DR

- **채택**: R3 — `.claude/` sync commit을 mainRoot에서 워크트리 branch tip으로 이전(commit relocation). 2-commit 분리 구조 보존, mainRoot 분기 자체 소멸 → ff-only 100%.
- **변경 지점 2곳**: `scripts/auto-push.js` L249(paths 배열에서 `.claude/` 제거) + L277~288(블록 cwd: mainRoot→ROOT 전환). 신규 보호장치·lockfile·hook 0.
- **실측 발화 확인**: commit 8b40141은 진짜 분기 충돌 사례 (1초 race + mainRoot 별도 sync commit). R3가 핵심 원인 ①②를 차단.
- **잔존 위험 2건**: R-N2(I5 시간 압축 효과 실측 부재, 🔴) + R-N1(squash merge 시 `.claude/` history 손실, 🟡). Riki 보강 4건 필수.

## 결정 흐름

| Turn | Role | 결론 |
|---|---|---|
| 1 | arki rev1 | 초기 분석 — sync commit 분리 메커니즘 정리 |
| 2 | arki rev2 (R1) | "sync commit 분리는 redundant, 폐지" 추천 → Master 정정: 시간 압축 보존 위해 폐지 불가 |
| 3 | arki rev3 (R3) | 시간 압축 보존 + 분기 소멸 재설계. commit relocation 채택 |
| 4 | riki rev1 | R3 spec 보강 4건 + 신규 risk 2건 적출. 조건부 수용 |

## 최종 채택 (R3 + 보강 4건)

| # | 항목 | 내용 |
|---|---|---|
| 1 | syncClaudeDir 호출 시점 재배치 | commit_B 박은 이후 + merge 이전. working tree dirty 시간 0 |
| 2 | `--no-ff` fallback 유지 | L298~311 코드 R3에서도 유지. 외부 origin 분기 대비. dead code 시사 삭제 |
| 3 | close-timing.log 실측 선행 | R3 구현 전 3회 + 구현 후 3회 비교. 압축 효과 50% 이상 손실 시 롤백 |
| 4 | commit_B 메시지 `[claude-sync]` 태그 | 미래 squash merge 정책 대비. `.claude/` history 보존 |

## 실측 발화

commit 8b40141 (session_234 conflicts) — `eb3aaa9`(mainRoot sync) ↔ `0945eab`(워크트리 commit) **1초 차이** race + 별개 base 분기 → `--no-ff` merge → SOT 파일 3-way merge 충돌. PD-081은 이론 표면이 아닌 실 발화 사례.

## 잔존 위험

| ID | 등급 | 위험 | Mitigation |
|---|---|---|---|
| R-N2 | 🔴 | I5(시간 압축) 가설 단계 — H2(index lock 회피)·H3(cwd 캐시) 미검증. R3 후 시간 증가 가능 | close-timing.log 3+3회 실측 비교 (보강 #3) |
| R-N1 | 🟡 | sync commit이 워크트리 branch에 박힘 — squash merge 시 `.claude/` history 손실 | commit message 태그 또는 별도 PR 분리 (보강 #4) |
| R2 | ⚠ | 원격 main 분기 (다른 머신 hot fix) — ff-only 실패 가능 | `--no-ff` fallback 유지 (보강 #2) |
| R1 | ⚠ | commit_A·B 사이 crash → 자가치유 경로 실측 부재 | crash injection 테스트. 최악의 경우 next close 회복 |

## 후속 (topic_199 재오픈 Phase)

1. **Phase 0**: close-timing.log 3회 수집 (현재 구조)
2. **Phase 1**: R3 구현 (Dev 인계 — Arki rev3 §구현 계획 참조)
3. **Phase 2**: close-timing.log 3회 수집 (R3 구조) + 비교
4. **Phase 3**: 압축 효과 검증 통과 시 PD-081 resolved 박제. 실패 시 롤백

## 정직 보고 (Agent 외 작성분)

- 본 세션 in-scope 변경 0 (코드/hook/skill 변경 없음, 분석·설계·문서만). `check-zero-trigger.js` `recommend_zero: false`.
- 본 Condense는 D.Condense gate 형식 충족 목적. 3 영역(tech-debt·security-review·simplify) 정제 대상 부재 → domains 빈 배열.
- 본 페르소나는 새 발견·새 분석 추가 안 함. 압축만.
