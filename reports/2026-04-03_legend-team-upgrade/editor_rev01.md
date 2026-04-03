---
topic: legend-team-upgrade
role: editor
revision: 1
date: 2026-04-03
status: final
contributing_agents: [ace, arki, fin, riki]
nova_invoked: false
accessed_assets:
  - file: topic_index.json
    scope: all_topics
  - file: decision_ledger.json
    scope: all_topics
  - file: evidence_index.json
    scope: all_topics
  - file: glossary.json
    scope: all_topics
---

# 레전드팀 v0.1.0 → v0.2.0 업그레이드 — 최종 합산

## Executive Summary

레전드팀 v0.1.0은 "설계도"였다. v0.2.0은 "실제로 기억하는 시스템"으로의 전환이다.
Master가 5개 결정을 확정했으며, 이번 세션 종료 후 즉시 실행한다.

**핵심 결정 요약:**
1. **v0.2.0 기준:** 메모리 초기화 + reports/ 구조 생성 (코드 자동화는 v0.3.0)
2. **실행 방식:** Claude Code 수동 기록 프로토콜
3. **dashboard.html:** internal-viewer.html로 이름 변경 + CLAUDE.md 예외 명시
4. **보고서 구조:** reports/{YYYY-MM-DD}_{topic}/{role}_rev{n}.md
5. **Nova:** 현상 유지 (Master 명시 요청 시만)

## 에이전트 기여 요약

| 역할 | 핵심 기여 | 상태 |
|---|---|---|
| Ace | 결정 축 4개 + 스코프 확정 | ✅ |
| Arki | 구조적 갭 4개 진단 + 확정 아키텍처 | ✅ |
| Fin | 총 ~3h 작업량, TS 이연 판단 | ✅ |
| Riki | R-01/02/04/05 치명 리스크 + 트립와이어 | ✅ |

## 통합 권고

v0.2.0 실행 순서:
1. 메모리 파일 전체 초기화 (스키마 정의 + 초기값 기록)
2. reports/ 디렉토리 구조 생성 + 이번 세션 파일 저장
3. dashboard.html → internal-viewer.html 이름 변경
4. CLAUDE.md 업데이트 (예외 조항 추가)
5. project.json 버전 0.2.0으로 갱신

## 미해소 질문

- 수동 기록 누락 리스크(R-02)는 v0.3.0 자동화 전까지 잔여 리스크로 유지
- 세션 종료 체크리스트 명문화 필요 (다음 토픽 검토 권고)

## 버전 노트

- v0.1.0 → v0.2.0: 메모리 실질화, reports/ 구조 생성, internal-viewer 명시
- 이전 버전(v0.1.0) 파일 보존: config/project.json revision history 참조
