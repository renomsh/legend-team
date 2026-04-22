---
role: ace
topic: PD-021 auto-model-switch 재구현 — Sonnet 메인 + Opus 서브에이전트
session: session_068
phase: synthesis
recallReason: post-roles
date: 2026-04-22
---

# Ace — 종합검토

## 실측이 논쟁을 끝냈다
Probe 3건 통과:
- Probe 1: E1 라우팅 ✅ — Sonnet 4.6 메인 → opus 서브 → 실제 Opus 4.7 동작
- Probe 2: 품질 스모크 ✅ — Opus 급 정밀 응답
- Probe 3: 스킬 상속 ✅ — 스킬 미주입 상태에서도 Opus 4.7이 ace-framing Step 0 수행
→ Riki R-1 기각, R-2 경감. Dispatcher-Worker 구조 채택 확정.

## Master 질문 답변
> "이게되면 A까지도 sonnet 쓰면 되잖아?"

**Yes. Grade A까지 Sonnet 메인.** 조건:
- 역할 발언 → `model: opus` 서브
- 오케스트레이션·Master 신호 캐치 → 메인 Sonnet
- Grade S는 Opus 메인 유지 (보수적, 10세션 후 재평가)

## 4개 결정 축 최종
| Axis | 결정 |
|---|---|
| Dispatcher-Worker | ✅ 채택 |
| Grade A 메인 | Sonnet 4.6 |
| Grade S 메인 | Opus 유지 |
| 서브 기록 | Arki A안 — 파일 직접 write |
| 스킬 주입 | Ace 종합검토 서브에만 선택 주입 |

## 잔여 리스크
- R-3: P4 3세션 실측 — Master 피드백 반응성 정성 기록
- R-4: Fin 산정 "65~75%" 하향 보정

## D-058 확정. Arki 실행계획 재호출 → 구현 진행.
