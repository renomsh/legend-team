---
role: ace
session: session_160
topic: topic_141
topicSlug: bigbang-completion-review
date: 2026-05-01
turnId: 3
invocationMode: subagent
rev: 2
---

# Ace — 구조 판정: Grade C/D Edi 기록 필요성

## 판정

**불필요. Grade C/D에서 `edi_auto_rev1.md` mechanical fallback은 제거해야 한다.**

CLAUDE.md 설계 의도: Grade D = "Dev 직행, Edi 생략" / Grade C = 경량 Edi(선택). mechanical fallback이 Grade 무관하게 생성되는 현재 구조는 설계 의도를 코드가 위반하는 상태다. 더 심각한 문제는 Riki가 지적한 것처럼 이 혼재가 `auditEdiLlmInvocation`의 신호 해석을 오염시켜, Grade A/B/S의 실제 Edi LLM 미호출을 탐지하는 감사 경로의 정밀도를 떨어뜨린다는 점이다.

**단일 조치: `synthesizeMechanicalEdiReport`에 Grade C/D early-return 분기 추가.** Grade C/D 세션에서는 mechanical fallback 생성을 건너뛰고 info-level log("grade C/D: edi skipped by design")만 남긴다. Grade A/B/S는 현행 유지 — mechanical fallback 생성 + `auditEdiLlmInvocation` 4신호 경보.

이 단일 변경으로 세 효과를 동시에 얻는다: (1) 설계 의도와 코드 정합 회복, (2) Grade A/B/S 감사 신호 노이즈 제거, (3) C/D 세션 파일 오염 제거.

## 지속 가능성 판정

**Yes.** Grade 기반 분기 추가는 hook SRP를 강화한다. 코드 변경 범위 최소(1개 함수 early-return), 롤백 비용 거의 없음.

