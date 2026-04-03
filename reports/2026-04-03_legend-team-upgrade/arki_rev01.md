---
topic: legend-team-upgrade
role: arki
revision: 1
date: 2026-04-03
status: approved
accessed_assets:
  - file: glossary.json
    scope: current_topic
---

# ARKI — 구조 분석

## 현재 구조 진단

```
legend-team/
├── agents/          ✅ 정의 완료 (6개 역할 md)
├── config/          ✅ workflow, roles, output 정의 완료
├── memory/
│   ├── master/      ⚠️ master_preferences.json 비어있음
│   ├── roles/       ⚠️ 전체 비어있음
│   ├── sessions/    ❌ current_session.json 비어있음
│   └── shared/      ❌ decision_ledger, topic_index, glossary, evidence_index 비어있음
├── app/             ⚠️ dashboard.html 존재 (CLAUDE.md 원칙 위반 소지)
├── logs/            ⚠️ app.log, errors.log 비어있음
└── 코드(TS)         — 실행 루틴은 prompt-driven으로 운용 (결정 2A)
```

## 핵심 구조적 갭

**GAP-01: 메모리가 껍데기다**
- current_session.json, decision_ledger.json, topic_index.json, glossary.json, evidence_index.json 비어있음
- "memory-first" 표방이지만 메모리가 실제로 쓰이지 않고 있음

**GAP-02: 실행 루틴 — 결정 2A로 수동 프로토콜 채택**
- Claude Code가 세션 중 직접 파일 기록
- 별도 TS 오케스트레이션 코드 불필요 (v0.3.0에서 재검토)

**GAP-03: app/dashboard.html**
- 결정 3B: internal-viewer.html로 이름 변경 + CLAUDE.md 예외 명시

**GAP-04: reports/ 디렉토리 없음**
- 결정 4: reports/{date_topic}/{role}_rev{n}.md 구조로 생성

## 의존성 맵

```
[CLAUDE.md 규칙]
      ↓
[config/workflow.json] → 에이전트 시퀀스
      ↓
[agents/*.md] → 역할 행동 정의
      ↓
[memory/shared/topic_index.json] → 토픽 관리
      ↓
[memory/sessions/current_session.json] → 세션 상태
      ↓
[reports/{date_topic}/{role}_rev{n}.md] → 산출물 저장
```

## 확정 구조 (v0.2.0)

```
reports/
└── {YYYY-MM-DD}_{topic-slug}/
    ├── ace_rev{n}.md
    ├── arki_rev{n}.md
    ├── fin_rev{n}.md
    ├── riki_rev{n}.md
    ├── (nova_rev{n}.md)   ← Master 요청 시만
    └── editor_rev{n}.md
```

## 설계 결정 (확정)

1. 메모리 파일: JSON 스키마 확정 후 초기화
2. 보고서 저장: 수동 기록 프로토콜 (Claude Code가 직접 Write)
3. dashboard.html → internal-viewer.html (이름 변경)
4. 로그 파일: 이번 v0.2.0에서는 수동 관리 (자동화는 v0.3.0)
