---
topic: legend-team-upgrade
role: riki
revision: 1
date: 2026-04-03
status: approved
accessed_assets:
  - file: topic_index.json
    scope: all_topics
  - file: decision_ledger.json
    scope: all_topics
  - file: evidence_index.json
    scope: all_topics
  - file: glossary.json
    scope: all_topics
  - file: project_charter.json
    scope: all_topics
---

# RIKI — 리스크 압박

## 리스크 레지스터

| ID | 설명 | 확률 | 임팩트 | 심각도 | 완화 |
|---|---|---|---|---|---|
| R-01 | 업그레이드 후에도 메모리가 실제로 안 쓰임 | 높음 | 높음 | 🔴 치명 | 세션 종료 프로토콜 명문화 |
| R-02 | 수동 기록 누락 → 컨텍스트 유실 | 높음 | 높음 | 🔴 치명 | 세션 시작/종료 체크리스트 |
| R-03 | dashboard.html 방치 원칙 형해화 | 중간 | 중간 | 🟡 주의 | 결정 3B로 해소 예정 |
| R-04 | 업그레이드 범위 미결정 무한 확장 | 높음 | 높음 | 🔴 치명 | Master 결정 1A로 범위 확정됨 |
| R-05 | 역할 간 출력 포맷 비일관 | 중간 | 높음 | 🔴 치명 | frontmatter 표준화로 완화 |

## 가정 감사

| 가정 | 출처 | 강도 | 파괴 시 결과 |
|---|---|---|---|
| "메모리 파일 초기화만으로 시스템 실질화 가능" | Ace/Fin | 보통 | 수동 기록 없으면 여전히 껍데기 |
| "수동 프로토콜로 충분" | Fin | 약함 | 세션이 자주 끊기면 누락 누적 |
| "TS 자동화는 v0.3.0에서" | Fin | 합리적 | v0.2.0 검증 이후 판단 가능 |

## 모순 로그

| 모순 | 상태 |
|---|---|
| "Never start from UI" vs. dashboard.html 존재 | ✅ 결정 3B로 해소 예정 |
| "memory-first" vs. 메모리 전부 비어있음 | ✅ v0.2.0 업그레이드로 해소 예정 |

## 실행 왜곡 경보

> **가장 큰 리스크: "이 세션 결정이 저장 안 되는" 패턴**
> - 결정 4로 reports/ 구조 확정 → 이번 세션부터 저장 시작
> - 세션 종료 시 current_session.json 업데이트 프로토콜 필수

## 트립와이어

- ⚠️ 다음 세션에서 topic_index.json이 여전히 비어있으면 → 업그레이드 실패
- ⚠️ reports/에 파일이 없으면 → 수동 기록 프로토콜 미작동
- ⚠️ decision_ledger.json에 이번 결정이 없으면 → 메모리 시스템 미작동

## 잔여 리스크

- R-02(수동 누락)가 핵심 잔여 리스크. 세션 종료 체크리스트로 완화 가능하나 제거 불가.
- v0.3.0에서 자동화로 해소 검토.
