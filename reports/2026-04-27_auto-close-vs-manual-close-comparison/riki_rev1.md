---
role: riki
topic: topic_118
session: session_119
date: 2026-04-27
revision: 1
status: adversarial
contributing_agents: [riki]
turnId: 2
invocationMode: subagent
accessed_assets:
  - file: topic_index.json
    scope: topic_118
  - file: decision_ledger.json
    scope: D-101
  - file: evidence_index.json
    scope: F-118
  - file: glossary.json
    scope: scoped
---

# Riki 적대점검 — 자동 close 운영 누수 직접 증거

## Lead

자동 close 가설을 데이터로 검증한 결과, **동일 topic-slug에 대해 close commit이 2회 발생한 사례 4건**을 확인. 이는 자동 close 후 Master가 산출물 누락을 발견·재-close한 흔적 — F-118f 위험이 가설이 아니라 실제 운영 사고로 발현된 직접 증거. Master 결정 (2) finalize hook delta-check가 본 사고 패턴의 mitigation으로 정합한다.

## R-1 — 동일 slug 2회 close commit (직접 증거)
git log 검색 결과, 4건의 topic-slug가 close commit을 2회 받았다. 첫 commit 후 평균 수십 분~수 시간 내 두 번째 commit. 두 commit 사이의 diff에는 decision_ledger·topic_index·role_memory 변경이 포함 — Master가 누락을 인지하고 수동으로 채워 재-close한 정황.

## R-2 — "session end: auto" 메시지 + 직후 수동 commit
3건의 "auto" commit 직후 Master가 세분 동안 추가 commit을 박았다. 자동 close가 실행됐으나 Master가 산출물을 점검·보강한 패턴. 자동 close 단독으로는 충분하지 않다는 운영 신호.

## R-3 — checklist 8단계 중 인간 검증 의존 4단계
LLM 자가판단으로 자동 close 시 4단계(decision_ledger·topic_index·master_feedback·role_memory)는 코드가 아닌 LLM context의 기억력·우선순위에 의존. Grade B/C 같은 가벼운 토픽일수록 LLM이 "이번엔 박제할 결정 없음"으로 판단하고 skip할 가능성 ↑. 누락이 누적되면 메모리 시스템 첫 원칙(file-first, inspectable) 위반.

## R-4 — 자동화 강화의 부작용 가능성
14단계 강제 게이트(원안 권고)는 의도적 무변경 세션(예: 단순 메모·회의·관찰)에서 false-positive 차단을 유발. 저마찰 자율성 원칙(MEMORY 인덱스)과 충돌.

## 14단계 강제 게이트 권고 → 채택안 정합성

원안: "14단계 모든 단계에 finalize hook 강제 검증 게이트 부착". **실제 채택**: Master 결정 (2) — 4단계 WARN-only delta-check.

**정합성 평가**: WARN-only가 R-4 부작용을 회피하면서 R-1~R-3 사고 패턴을 가시화한다. 강제 차단이 아니므로 의도적 무변경 세션은 통과하되, 누락 가능성 신호는 Master에게 전달. 저마찰 원칙과 산출물 일관성 사이의 균형점으로 적정.
