---
role: riki
session: session_145
topic: topic_131
date: 2026-04-30
turnId: 0
invocationMode: subagent
rev: 1
question: "Grade 조정권 — Jobs 보유 vs Nexus 보유"
---

## ROLE: riki

Riki입니다. Master가 놓친 실패 모드만 짚습니다.

### 🟡 R-1. (A) Jobs 보유 시 — Grade 사각지대

Jobs는 Master 명시 호출 한정 가동. C/D grade 토픽(`bug`, `fix`, `오타` 등 D 키워드)은 Jobs 미호출이 정상 — 그런데 Grade 조정권자가 부재. Dev 직행 토픽에서 "이거 사실 B 아닌가?" 판단 주체가 사라짐. **파손 범위**: 잘못 분류된 토픽(D로 들어왔는데 실제 B) 구조 누락 → s139류 echo chamber 재발 경로.
**Mitigation**: Jobs 미호출 세션에서는 Nexus가 키워드 매칭 자동 분류 폴백.
**Fallback**: 분류 confidence 낮으면 Master 1줄 확인.

### 🟡 R-2. (B) Nexus 보유 시 — framing 분리 비용

Grade는 framing 부산물(토픽 복잡도·축 수). framing 주체(Jobs)와 분리되면 Nexus가 키워드·과거 패턴 휴리스틱으로 판정 → framing 미실행 시점 판정은 **post-hoc rationalization** 위험. Goodhart's Law(Strathern 1997, "When a measure becomes a target, it ceases to be a good measure") — 자동 키워드 매칭은 토픽 작성자가 키워드를 회피·삽입하면 무력화.
**Mitigation**: Nexus 자동 판정 후 Jobs 호출 시 Jobs가 override 권한 보유 (Nexus는 default, Jobs는 authoritative).
**Fallback**: gradeMismatch 대시보드 패널로 사후 검증 (compute-dashboard.ts 기존 로직 활용).

### 권고: **(B) Nexus 보유 + Jobs override**

- 근거: C/D 미호출 세션 커버리지 (R-1 차단) > framing 부산물 자연성 (R-2는 override로 회수). D-040이 "Ace 보유"로 단일화한 이유는 framing-Grade 결합이지만, 본 세션에서 framing/orchestration이 이미 분리됐으므로(D-130) Grade도 orchestration 측에 붙는 게 정합.
- 외부 anchor: NIST SP 800-160 Vol.2 §3.4.5 (Defense in Depth) — 1차 자동 판정 + 2차 override의 레이어 구조.

### 권고 무산 조건

Jobs가 **모든 세션**에서 자동 가동되도록 정책이 바뀌면 (B) 권고 무산 — Grade가 framing 부산물로 자연 결합되므로 (A) 채택.

### Master 채택 결과

Master 결정: **(B) Nexus default + Jobs override**. D-130에 박제.

```
[ROLE:riki]
# self-scores
crt_rcl: Y
cr_val: 4
prd_rej: Y
fp_rt: 0.15
```

RIKI_WRITE_DONE: reports/2026-04-30_big-bang-legend-nexus-p2-3of3/riki_rev1.md
