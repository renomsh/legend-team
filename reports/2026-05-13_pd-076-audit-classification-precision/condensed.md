---
role: zero
session: session_246
topic: mtopic_001_W3677250a
topicSlug: pd-076-audit-classification-precision
date: 2026-05-13
rev: condensed
format: condensed
turnId: 7
invocationMode: subagent
---

# session_246 — PD-076 Audit Classification Precision (Condensed)

## TL;DR
- **결정**: `scripts/audit-decision-ledger-status.ts` 폐기 (B1). status 운영은 **active 기본 + 충돌 시 Master 문의** 단순 정책으로 회귀. PD-076 resolved.
- **폐기된 검토 항목**: C2 정책 박제, N1+N2 hook, 자동 마이그, 화이트리스트 — Master 단순화 지시로 전부 제외.
- **Grade**: B / phase: closed → session-end.

## 핵심 결정 흐름

| Turn | 역할 | 발언 압축 |
|---|---|---|
| 1 | Jobs | Why: audit 스크립트가 status 분류 정확도 낮음 → false positive 양산. What: 분류 로직 vs 운영 정책 중 어디를 손볼지 결정축. Scope: status 필드 SOT 영향 범위 확인. |
| 2 | Ace | 구조(Porter) — audit 도구는 SOT 보조이지 SOT 아님. 흐름(Keynes) — 도구 정밀도 추구 시 hook·마이그·화이트리스트 누적 부채. 권고: 도구 폐기 + 운영 단순화. |
| 3 | Arki rev1 | 옵션 A(분류 로직 정밀화) / B(폐기) / C(정책 박제만) / N1+N2(hook) 비교. 의존도: audit 도구는 단독 — 외부 reference 0건. |
| 4 | Arki rev2 | Master 재질의 후 단순화 — B1(도구 폐기) 단독 채택. 잔존 hardcode/dead-ref 점검: 0건. |
| 5 | Riki | 리스크: status 무결성 — Master SOT 직접 관리로 우회. mitigation: 충돌 시 Master 문의 규약. residual: 0. |
| 6 | Dev | `scripts/audit-decision-ledger-status.ts` 삭제 + /code-review 통과. 빌드·검증 전량 green. |

## 폐기 검토 항목 (Master 짜증 → 단순화)
- **C2 정책 박제**: D-NNN 신설 불요. CLAUDE.md status enum 정의로 충분.
- **N1+N2 hook**: status 변경 가로채기 hook — 운영 부담만 가중.
- **자동 마이그**: legacy status 일괄 변환 — Master 수동 처리로 회피.
- **화이트리스트**: status 변경 허용 컨텍스트 정의 — Master 직접 결정.

## 3 영역 정제 결과 (Zero)

| 영역 | 처리 | 근거 |
|---|---|---|
| tech-debt | Cut 1건 (B1 삭제로 처리됨) | audit-decision-ledger-status.ts 외부 reference 0, dead tool |
| security-review | Audit 0건 | status SOT는 Master 직접 관리. hardcode·credential 변경 없음 |
| simplify | Refine 0건 (본 세션 자체가 simplify 사례) | LLM·hook·마이그·화이트리스트 → "active 기본 + 충돌 시 문의" 4축 단일화 |

## 미해결 Gap
- 없음. PD-076 resolved.

## versionBump
- 제안: +0.001 (Grade B, 도구 1건 폐기) — Nexus 자동 감지 → Edi 확정.

[T4 / A2 / O5]
