---
session: session_097
topic: PD-030 PD 자동 전이 훅 확장 — children/git/교차검증/Step 0 재판정
role: riki
rev: 1
date: 2026-04-25
phase: risk-audit
---

# Riki — 리스크 감사

## R-1 🔴 session-end 언급 커밋 오인

session-end 타입 commit(세션 종료 태그)에 PD-NNN이 언급되더라도 구현 증거가 아님.
**Mitigation:** implementation 타입 0건 PD → "구현 커밋 없음 — resolved 근거 아님" 출력. suggest 억제.
**Fallback:** --apply 시 commitType=session-end 항목에 `resolveEligible: false` 강제 부착.

## R-2 🟡 gitEvidence 덮어쓰기 이력 소실

--apply 재실행 시 이전 스캔 결과 소실 → 감사 이력 재구성 불가.
**Mitigation:** hash 기준 upsert (신규 hash만 append, 기존 hash는 scannedAt 업데이트).
**Fallback:** gitEvidencePrev 1회분 보존 또는 logs/app.log 기록.

## R-3 🟢 git log 성능 — 현 규모 실질 위험 낮음

현재 프로젝트 규모(commit 수백~수천)에서 10초 timeout 충분.
**Mitigation:** `--since="6 months ago"` 범위 제한 추가.
**Fallback:** timeout 초과 시 "스캔 실패 — 수동 확인 요망" 출력 후 정상 종료.

## R-4 🔴 PD-030 부트스트랩 — 구현 전 resolved 처리 위험

스크립트 구현 커밋 발견 후 기능 검증 전 resolved 처리 가능성.
**Mitigation:** P4(dry-run 검증) 완료 후에만 PD-030 resolved 처리 원칙.
**Fallback:** 현 세션에서 PD-030 자기 언급 커밋 없어 자동 회피 확인됨.
