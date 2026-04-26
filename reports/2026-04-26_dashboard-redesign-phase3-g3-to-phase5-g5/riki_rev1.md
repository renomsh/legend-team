---
role: riki
topic: Dashboard 개편 — Phase 3 G3 회귀 게이트 → Phase 5 G5 부분 출시
topicId: topic_109
session: session_106
date: 2026-04-26
rev: 1
phase: analysis
grade: A
---

# Riki — 리스크 감사 (Turn 2)

## R-1: vr-compare diff 단위 모호성 (🔴 HIGH)

**리스크**: diff 계산 단위가 픽셀 수인지 비율(ratio)인지 미지정 시, 임계값 2% 해석이 구현마다 달라져 재현 불가.

**Mitigation**: D-099로 박제 — `diff = diffPixelCount / (width × height)`, 임계 2% = 0.02 비율. vr-compare.ts 내부 assert로 단위 명시.

**Fallback**: 임계값 초과 시 스냅샷 재촬영 후 1회 재시도. 재시도 후도 초과 시 해당 페이지 VR 예외 처리 로그 + PD 등록.

---

## R-2: Docker 이미지 핀 불일치 (🔴 HIGH)

**리스크**: PD-051에서 v1.45.0-jammy 핀이 실제 존재하지 않아 vr:capture 실패. 핀 정정 없이 진행 시 CI 전체 차단.

**Mitigation**: PD-051 resolvedNote 확인 — v1.59.1-jammy로 정정, docker pull 검증 완료. session_106 vr:capture 24/24 PASS 증거.

**Fallback**: pull 실패 시 `docker pull --platform linux/amd64` 명시 + Docker Hub 가용성 체크.

---

## R-3: inline :root{} 제거 후 색상 깨짐 (🟡 MEDIUM)

**리스크**: 7개 파일에서 :root{} 제거 시 role-colors.js import 누락된 파일이 색상 없음 상태로 배포.

**Mitigation**: 제거 후 각 페이지 로컬 미리보기 → 색상 렌더링 확인. 이후 lint-contrast G3-A가 토큰 미등록 감지.

**Fallback**: git diff로 제거된 :root{} 블록 목록 추적, 누락 파일 재확인.

---

## R-4: ARIA 접근성 부분 적용 위험 (🟡 MEDIUM)

**리스크**: skip-link 5개 중 일부만 적용 시 axe B3 통과 후에도 실사용 키보드 탐색 실패.

**Mitigation**: skip-link는 모든 5페이지(Home/Dashboard-Upgrade/Dashboard-Ops/Records-Topics/Deferrals) 균일 적용 의무. Dev 구현 후 각 페이지 tab 키 이동 수동 확인.

**Fallback**: axe-core B3 자동 감지 보완으로 배포 전 최종 검증.

---

## R-5: CF Pages 배포 후 캐시 불일치 (🟢 LOW)

**리스크**: CF Pages 엣지 캐시가 구버전 HTML 서빙으로 접근성 개선이 즉시 미반영.

**Mitigation**: auto-push 후 CF 캐시 purge 또는 배포 확인 URL에 ?v=timestamp 추가 확인.

**Fallback**: Cloudflare 대시보드에서 수동 purge 가능.

---

## 검토 결론

R-1·R-2는 D-099 박제 및 PD-051 resolved로 미티게이션 완료. R-3·R-4는 Dev 구현 단계에서 순차 검증으로 통제 가능. R-5는 잔존 리스크로 수용.
