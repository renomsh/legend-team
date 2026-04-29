---
role: arki
session: session_140
topic: topic_131
date: 2026-04-29
turnId: 3
invocationMode: subagent
rev: 3
---

# Arki — Big Bang Legend Nexus 전체 설계도 (rev3, 누락 4건 반영)

## 결론

✅ rev2 골격 유지 + 누락 4건 반영. 컴포넌트 1행 추가, Zero 정의 갱신, prime directive Phase 위치 명시, echo chamber 후속 매핑 신설.

---

## 1. 컴포넌트 1줄 정의 (1행 추가, Zero 갱신)

| 컴포넌트 | 종류 | 1줄 정의 |
|---|---|---|
| **Nexus** | 인프라 (오케스트레이션) | 페르소나 호출·dispatch·hook chain 허브, A축(Orchestration) + B축(Data Bus) |
| **NCL** | 인프라 (데이터 로그) | 규칙 기반 영수증 발행 (Origin/Influence/Diversity/Anchor 4항목). 자동 해석·요약·판단 금지 |
| **prime directive** | 정책 (CLAUDE.md 섹션) | **NEW** — Affaan 4 도그마(D-113): 악의 텍스트 유입·도구설명 거짓·저장소 오염·모델 설득 전제하 시스템 안전. 모든 페르소나·hook 발화 위 최상위 제약 |
| **Sage** | 페르소나 (메타) | 세션 종료 후 NCL 영수증 read → 페르소나 채점·성장축 분석. 자기 출력도 NCL 영수증화 |
| **Zero** | 페르소나 (2 미션) | **갱신** — C-4 최신 정책 채택: ① 하드코딩 섬멸 ② 코드 다이어트. ~~Cut/Refine/Audit 3 스킬 + 0수렴 원본~~ → 2 미션으로 단순화 (D-110 → C-4 supersede) |
| **Ace** | 페르소나 (강화) | Master 대리인 + 깊은 프레이밍 + 종합검토 집중 |
| **Riki** | 페르소나 (잔존) | 실시간 adversarial 검증, 변경 없음 |
| **self-scores YAML** | 인프라 (기존) | 발언 직후 자가 메타태그 — Sage 채점과 병행 유지 (D-092 호환) |

**충돌 해결 (2번 누락):** D-110(Zero 원본 유지) vs C-4(2 미션 단순화) — **C-4가 최신 (s138 종료 직전 Master 권고)**. D-110은 D-114 5 Phase 단순화 흐름에서 supersede됨. revision_history 박제 필요 (D-119 후보).

---

## 2. 토폴로지 (Star + Nexus first-speaker, prime directive 최상위)

```
              ┌────────────────────────────┐
              │ prime directive (Affaan 4) │ ← 모든 레이어 위 최상위 제약
              └────────────┬───────────────┘
                           │
                    ┌──────┴───┐
                    │  Master  │ ← 최종 판독·결정
                    └────▲─────┘
                         │
             ┌───────────┼───────────┐
        ┌────┴────┐  ┌───┴────┐  ┌──┴───┐
        │  Sage   │◀─│ Nexus  │─▶│ NCL  │
        └─────────┘  └───┬────┘  └──▲───┘
                         │           │
              ┌──────────┼──────────┐│
          ┌───┴──┐  ┌────┴──┐  ┌───┴┴──┐
          │ Ace  │  │ Arki  │  │ Riki  │ ... (Dev/Edi/Vera/Zero)
          └──────┘  └───────┘  └───────┘
                  발언 → NCL append (단방향)
```

- prime directive는 토폴로지 위 메타 제약 (컴포넌트 아닌 정책 레이어)
- 페르소나 → NCL: 단방향 produce
- NCL → Sage: 단방향 read
- Sage → NCL: 자기 채점 영수증화 (R-4 mitigation)

---

## 3. Big Bang 5 Phase (D-114, prime directive 위치 명시)

| Phase | 목표 | 산출물 | 의존 |
|---|---|---|---|
| **P1** | 방향성 합의 + 핵심 결정 박제 (현재 진행) | D-107~D-118 | — |
| **P2** | 페르소나 spec 박제 + **prime directive CLAUDE.md 박제** | `agents/sage.md`, `role-sage.md`, Ace/Zero persona 갱신, **CLAUDE.md prime directive 섹션 신설 (Affaan 4 도그마)** | P1 |
| **P3** | Nexus 골격 + Hook + dispatch 재배선 | `scripts/nexus/*`, hook chain 갱신, dispatch_config.json | P2 |
| **P4** | 학습·정책 시스템 (NCL 인프라 + Sage 채점) | `memory/shared/ncl/receipts.jsonl`, NCL append hook, Sage 트리거 | P3 |
| **P5** | 통합 마이그레이션 (legacy 정리·Master 판독 채널) | viewer/report, legacy 자산 정리 | P4 |

**prime directive 박제 위치:** P2 (페르소나 spec과 함께). 이유 — prime directive는 모든 페르소나 발화 위에 작동하는 제약이므로, 페르소나 spec 박제 시점에 동시에 CLAUDE.md 섹션으로 들어가야 P3 hook 재배선 시 참조 가능.

게이트:
- G1: P2→P3 — 페르소나 spec + **prime directive 섹션** 모두 박제
- G2: P3→P4 — Nexus가 모든 페르소나 호출을 hub로 라우팅
- G3: P4→P5 — NCL append latency 영향 없음, Sage 채점 영수증화 작동
- G4: P5 종료 — Master 판독 채널 1회 dry-run

---

## 4. echo chamber 후속 매핑 (NEW — 3번 누락 반영)

s139에서 도출된 3안과 NCL+Sage 구조의 흡수 범위:

| 후속안 | NCL+Sage 흡수 정도 | 흡수 메커니즘 | 잔존 (후속 토픽 분리) |
|---|---|---|---|
| **(a) 외부 anchoring 강제** | ⚠ 부분 흡수 | NCL 영수증 4항목 중 `Anchor` 필드가 외부 근거 기록 슬롯 제공. 단, "결정 박제 시 외부 근거 의무"의 **강제 hook은 없음** | ✅ 후속 분리: "결정 박제 시 외부 anchor 필수 hook" — D-059 외부 앵커 cross-check 의무와 합쳐서 별도 토픽 |
| **(b) 자기감사 로직 강제** | ✅ 거의 흡수 | Sage 외부 채점 = 자기감사를 다른 머리·다른 시간으로 분리. 자가 채점도 self-scores YAML로 병행 유지 | ⚠ 잔여: Sage 자체 출력 감사(R-4) — Sage 채점 영수증화로 같은 토픽 안에서 mitigation |
| **(c) Master 직접 결정 + 페르소나 검증 only 모드** | ❌ 미흡수 | 본 구조는 페르소나 발언 + NCL 영수증 + Sage 채점 흐름. Master가 직접 결정·페르소나가 검증만 하는 모드는 별도 오케스트레이션 패턴 | ✅ 후속 분리: "Master-first 모드 신설" — orchestration-mode skill 확장 토픽 |

요약: NCL+Sage가 (b)는 거의 흡수, (a)는 슬롯만 제공·강제는 미흡, (c)는 별도 오케스트레이션 토픽 필요.

---

## 5. 즉시 박제 vs 후속 토픽 (rev2 + 신규 추가)

| 즉시 박제 (이번 세션) | 후속 토픽 분리 |
|---|---|
| D-115 NCL 4항목 + 규칙 기반 fix | NCL 영수증 스키마 필드 확정 (P4 진입 시) |
| D-116 self-scores YAML 병행 유지 | Sage 채점 알고리즘 (Sage spec 안에서) |
| D-117 Big Bang 5 Phase 순서 (P1~P5) | Master 판독 채널 형태 (P5에서 Vera·Arki) |
| D-118 토폴로지 = Star + Nexus first-speaker (D-111 보강) | 기존 페르소나 spec 갱신 범위 (P2) |
| **D-119 (NEW)** Zero 미션 2개로 단순화 — D-110 supersede, C-4 채택 | (a) 외부 anchor 필수 hook 토픽 |
| **D-120 (NEW)** prime directive(Affaan 4) P2에서 CLAUDE.md 박제 | (c) Master-first 모드 신설 토픽 |

---

## 제약 (모든 Phase 공통)

- C-1: NCL 영수증 append-only, 수정·삭제 금지 (분개장 원칙)
- C-2: Sage는 같은 세션 내 발언 페르소나로 호출 금지
- C-3: NCL 자동 해석·요약 알고리즘 도입 금지
- C-4: Sage 채점이 dispatch 가중치에 자동 반영 금지
- **C-5 (NEW):** prime directive(Affaan 4)는 모든 페르소나·hook 발화 위 최상위 제약. 위반 시 발화 무효

---

```
[ROLE:arki]
# self-scores
aud_rcl: Y
str_fd: 4
spc_lck: N
sa_rnd: 2
```
