---
role: arki
session: session_140
topic: topic_131
date: 2026-04-29
turnId: 2
invocationMode: subagent
rev: 2
---

# Arki — Big Bang Legend Nexus 전체 설계도 (1장)

## 결론

✅ 5 Phase, 7 컴포넌트, Star 토폴로지. self-scores YAML 병행 유지. NCL 규칙 기반 작동 fix.

---

## 1. 컴포넌트 1줄 정의

| 컴포넌트 | 종류 | 1줄 정의 |
|---|---|---|
| **Nexus** | 인프라 (오케스트레이션) | 페르소나 호출·dispatch·hook chain 허브, A축(Orchestration) + B축(Data Bus) |
| **NCL** | 인프라 (데이터 로그) | 규칙 기반 영수증 발행 (Origin/Influence/Diversity/Anchor 4항목). 자동 해석·요약·판단 금지 |
| **Sage** | 페르소나 (메타) | 세션 종료 후 NCL 영수증 read → 페르소나 채점·성장축 분석. 자기 출력도 NCL 영수증화 |
| **Zero** | 페르소나 (3스킬) | Cut/Refine/Audit 3 스킬 + 0수렴 페르소나 원본 유지 |
| **Ace** | 페르소나 (강화) | Master 대리인 + 깊은 프레이밍 + 종합검토 집중 |
| **Riki** | 페르소나 (잔존) | 실시간 adversarial 검증, 변경 없음 |
| **self-scores YAML** | 인프라 (기존) | 발언 직후 자가 메타태그 — Sage 채점과 병행 유지 (D-092 호환) |

---

## 2. 토폴로지 (Star + Nexus first-speaker)

```
                    ┌──────────┐
                    │  Master  │ ← 최종 판독·결정
                    └────▲─────┘
                         │
             ┌───────────┼───────────┐
             │           │           │
        ┌────┴────┐  ┌───┴────┐  ┌──┴───┐
        │  Sage   │  │ Nexus  │  │ NCL  │
        │ (메타)  │◀─│(허브)  │─▶│(로그)│
        └─────────┘  └───┬────┘  └──▲───┘
                         │           │
              ┌──────────┼──────────┐│
              │          │          ││
          ┌───┴──┐  ┌────┴──┐  ┌───┴┴──┐
          │ Ace  │  │ Arki  │  │ Riki  │ ... (Dev/Edi/Vera/Zero)
          └──────┘  └───────┘  └───────┘
              │          │          │
              └──────────┴──────────┘
                  발언 → NCL append (단방향)
```

- 페르소나 → NCL: 단방향 produce (echo loop 차단)
- NCL → Sage: 단방향 read
- Sage → NCL: 자기 채점 영수증화 (R-4 mitigation)
- 모든 레이어 → Master: 직접 판독

---

## 3. Big Bang 5 Phase (D-114)

| Phase | 목표 | 산출물 | 의존 |
|---|---|---|---|
| **P1** | 방향성 합의 + 핵심 결정 박제 (현재 완료) | D-107~D-114 | — |
| **P2** | 페르소나 spec 박제 (Sage 신설, Ace/Zero/Riki 갱신) | `agents/sage.md`, `memory/roles/policies/role-sage.md`, Ace/Zero persona 갱신 | P1 |
| **P3** | Nexus 골격 + Hook + dispatch 재배선 | `scripts/nexus/*`, hook chain 갱신, dispatch_config.json | P2 |
| **P4** | 학습·정책 시스템 (NCL 인프라 + Sage 채점 파이프라인) | `memory/shared/ncl/receipts.jsonl`, NCL append hook, Sage 호출 트리거 | P3 |
| **P5** | 통합 마이그레이션 (legacy 정리·Master 판독 채널) | viewer 패널 또는 report 파일, legacy 자산 정리 | P4 |

게이트:
- G1: P2→P3 — 페르소나 spec이 Star 토폴로지·Nexus override 수용 가능
- G2: P3→P4 — Nexus가 모든 페르소나 호출을 hub로 라우팅
- G3: P4→P5 — NCL append가 발언 latency 영향 없음, Sage 채점 영수증화 작동
- G4: P5 종료 — Master 판독 채널 1회 dry-run

---

## 4. 즉시 박제 vs 후속 토픽

| 즉시 박제 (이번 세션) | 후속 토픽 분리 |
|---|---|
| D-115 NCL 4항목 + 규칙 기반 fix | NCL 영수증 스키마 필드 확정 (P4 진입 시) |
| D-116 self-scores YAML 병행 유지 | Sage 채점 알고리즘 (Sage persona spec 안에서) |
| D-117 Big Bang 5 Phase 순서 (P1~P5) | Master 판독 채널 형태 (P5에서 Vera·Arki) |
| D-118 토폴로지 = Star + Nexus first-speaker (D-111 보강) | 기존 페르소나 spec 갱신 범위 (P2) |

---

## 제약 (모든 Phase 공통)

- C-1: NCL 영수증 append-only, 수정·삭제 금지 (분개장 원칙)
- C-2: Sage는 같은 세션 내 발언 페르소나로 호출 금지 (시간·머리 분리)
- C-3: NCL 자동 해석·요약 알고리즘 도입 금지 (B-1 영구 차단)
- C-4: Sage 채점이 dispatch 가중치에 자동 반영 금지 (automation-in-loop)

---

```
[ROLE:arki]
# self-scores
aud_rcl: Y
str_fd: 3
spc_lck: N
sa_rnd: 1
```
