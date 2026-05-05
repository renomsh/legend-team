---
role: ace
session: session_198
topic: topic_171
topicSlug: nexus-pc-hardware-upgrade
date: 2026-05-05
turnId: 4
rev: 1
invocationMode: subagent
---

# Ace — macOS 전환 + M4 Max 128GB 구조 판정

## 1. M4 Max 128GB — 3년 관점에서 정당한가?

**정당하다.** 단, 조건부가 아니다 — 구조적 이유가 있다.

Legend Nexus는 서브에이전트 병렬 호출 수를 늘리는 방향으로 진화 중이다. 이 시스템의 메모리 소비는 **세션이 깊어질수록, 역할이 많아질수록 선형이 아니라 비선형으로 증가**한다. Claude Code 프로세스 + 서브에이전트 컨텍스트 + hook chain + OS + 브라우저 모니터링이 동시에 적재될 때, 64GB는 3년 후 시스템 확장 임계에 도달할 가능성이 구조적으로 존재한다.

예산 제한이 없다면, **128GB는 3년 브릿지의 상한선을 제거하는 선택**이다. 이것은 과투자가 아니라 **확장 여지 보존**이다. Fin이 "현재 워크로드에서 회수 경로 불명확"이라고 했지만, 그것은 현재 워크로드 기준이다. 시스템이 3년간 정체될 것이라는 가정이 없다면 Fin의 논거는 절반만 맞다.

## 2. M4 Pro 64GB vs M4 Max 128GB — 실질 전환점

전환점은 **동시 active 컨텍스트 수 × 평균 컨텍스트 크기**가 64GB 실사용 가능 용량(약 45~50GB — OS·Claude Code·기타 상시 점유 제외)을 초과하는 순간이다.

구체적으로:
- 서브에이전트 5개 이상 병렬 + 각 에이전트 large context window 풀 로드 → 64GB 압박 시작
- Arki·Riki·Fin·Ace·Edi 5역할 동시 실행 + 대형 토픽 컨텍스트 + session_contributions inject = 이미 64GB 경계에 근접

또한 M4 Max의 핵심 차이는 **Unified Memory 대역폭(273 → 546 GB/s)**이다. 이는 대용량 컨텍스트를 빠르게 스왑·적재하는 속도다. 에이전트 수가 늘어날수록 이 대역폭이 응답 지연을 줄이는 실질 요인이 된다 — GPU 의존 워크로드가 없어도.

## 3. Ace 단일 최종 추천

**MacBook Pro 16" / M4 Max / 128GB / 1TB**

M4 Max는 현재 워크로드의 여유가 아니라 **3년간 시스템 확장의 구조적 상한 제거**를 위한 선택이다. 128GB Unified Memory + 546GB/s 대역폭은 Legend Nexus가 에이전트 수와 컨텍스트 깊이를 늘릴 때 병목이 하드웨어가 되지 않도록 보장한다.

SSD는 1TB로 충분하다. 2TB 추가 비용보다 필요 시 외장 NVMe 추가가 유연하다.

## 4. Master 확인 사항

**SSD가 1TB면 충분한가, 아니면 2TB가 필요한 구체적 이유가 있는가?**

M4 Max 구성에서 2TB → 1TB로 내리면 약 40~50만원 절감된다. 로컬 데이터 아카이브나 영상 등 추가 용도가 없다면 1TB로 충분하다는 것이 판정이지만, Master가 염두에 둔 용도가 있다면 확인이 필요하다.

---

[ROLE:ace]
# self-scores
rfrm_trg: Y
ctx_car: 5
mst_fr: 0
ang_nov: 3
