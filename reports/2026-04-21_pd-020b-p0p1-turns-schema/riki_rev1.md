---
role: riki
session: session_060
topic: pd-020b-p0p1-turns-schema
phase: analysis
rev: 1
---

# Riki — 전제 오류·Silent Failure 감사

## 발견

- **🔴 RK-1** (Master 채택): agentsCompleted ↔ turns[] 정합성을 P0에 포함. 실제 4 세션(052/053/054/059)에서 Set-의미 dedup 발견.
- **🔴 RK-4** (Master 채택): session_060 자체의 L1 기록 방침 범위에 포함. 옵션 B(소급 기록) 확정.
- **🟡 RK-2** (채택): P0 스크립트 smoke test 게이트 추가. 4 fixture로 허약성 차단.
- **🟡 RK-3** (범위 한정 채택): 백필 시 session_index 전파 확인까지. 리포트 재생성은 L2 구현(session_061) 때 일괄.
- **🟡 L1 실패 정책**: Arki GA-2(조용한 계속)에 누적 3건 경보 병합 — 채택.
- **🟡 Next Action 책임자**: Ace 종합검토 출력 필수 필드 — 채택(L2 frontmatter nextAction 필수).

## 필터링 후 남기지 않은 것
- TS 단일원천 축 리스크 없음 (현 시스템 최적안)
- context_brief 5KB 상한은 Editor 압축으로 해결 가능
