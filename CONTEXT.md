# Legend-Team — 외부 채팅용 컨텍스트 요약

> 이 파일은 GPT/Claude 채팅 등 외부 AI와 개선 방향을 논의할 때 붙여넣기용입니다.
> 실제 구현은 Claude Code에서만 진행합니다.

---

## 시스템 개요

**Legend-Team**은 파일 기반 전략 의사결정 시스템입니다.
여러 역할(에이전트)이 순서대로 발언하고, Master(사용자)가 피드백/승인/방향 전환을 결정합니다.
UI 없음. 모든 데이터는 JSON/Markdown 파일로 저장됩니다.

**기술 스택:** Node.js + TypeScript + 파일 기반 JSON/Markdown
**배포:** Cloudflare Pages (읽기 전용 뷰어) + Cloudflare Access (인증)
**실행 환경:** Claude Code (로컬) — 외부 채팅 도구는 구현 불가

---

## 역할 구조

| 역할 | 기능 |
|------|------|
| **Ace** | 프레이밍, 의사결정 축 정의, 스코프 설정, 종합검토 |
| **Arki** | 구조 분석, 의존성, 설계 제약 |
| **Fin** | 비용/수익 프로파일, 자원 평가 |
| **Riki** | 실패 모드, 가정 감사, 리스크 플래그 |
| **Editor** | 결과물 편집/포맷/저장 전담 (독립 판단 없음) |
| **Nova** | Master 명시 요청 시만 호출. 항상 투기적으로 표시 |

**발언 순서:** Ace → Arki → Fin → Riki → Ace(종합검토) → Editor
**Master**는 각 발언 후 개입 가능. Master 피드백은 권위적입니다.

---

## 핵심 규칙

- UI 먼저 시작 금지 (JSX/React 금지)
- 모든 데이터 변경은 Claude Code 통해서만
- app/ 뷰어는 읽기 전용 (쓰기 인터랙션 금지)
- Nova는 명시적 요청 없으면 자동 호출 안 함
- 이전 결정/리포트 덮어쓰기 금지

---

## 확정된 주요 결정 (D-001 ~ D-009)

| ID | 내용 |
|----|------|
| D-001 | v0.2.0 = 메모리 초기화 + reports/ 구조만. TS 자동화는 v0.3.0으로 이연 |
| D-002 | Claude Code가 세션 중 직접 파일 기록하는 수동 프로토콜 채택 |
| D-003 | app/ = 읽기 전용 다중 페이지 정적 뷰어. 읽기 인터랙션 허용, 쓰기 금지 |
| D-004 | reports 구조: `reports/{YYYY-MM-DD}_{topic-slug}/{role}_rev{n}.md` |
| D-005 | Nova는 Master 명시 요청 시만 호출 |
| D-006 | 배포: Cloudflare Pages + Cloudflare Access |
| D-007 | 전체 배포 (memory/master/ 포함). 보안은 Cloudflare Access에 위임 |
| D-008 | 세션 종료 시 자동 git push |
| D-009 | Ace = 종합검토 담당. Editor = 출력 전담 (synthesis 역할 분리) |

---

## 현재 상태 (2026-04-05 기준)

**현재 버전:** v0.2.0 확정 완료
**진행 중 토픽:** topic_004 — v0.3.0 업그레이드 항목 검토 (suspended)

### v0.3.0 후보 항목 (Ace 프레이밍 완료, Master 미결정)

| 카테고리 | 항목 |
|----------|------|
| 자동화 | H-01: 세션 기록 TS 자동화 (D-001에서 이연) |
| 자동화 | H-02: 로그 시스템 활성화 |
| 리스크 해소 | M-01: 수동 누락 구조적 해소 |
| 품질 | M-02: 출력 포맷 일관성 강화 |
| 자산 실질화 | N-01: evidence_index 활용 프로토콜 |
| 자산 실질화 | N-02: master_preferences 실질화 |
| 자산 실질화 | N-03: glossary 운용 기준 |
| 연동 | N-04: 뷰어 ↔ reports 연동 |

### 미결 의사결정 축 (4개)

1. **v0.3.0 범위 전략** — A(자동화만) / B(자동화+자산) / C(풀패키지)
2. **자동화 수준** — A(스크립트 보조) / B(풀 오케스트레이션)
3. **N-항목 처리** — A(v0.3.0 포함) / B(v0.4.0 이연) / C(점진)
4. **뷰어 연동** — A(자동 인덱싱) / B(현상 유지) / C(폐기)

---

## 파일 구조 요약

```
legend-team/
├── agents/          # 역할 시스템 프롬프트 (ace.md, arki.md, ...)
├── app/             # 읽기 전용 정적 뷰어 (Cloudflare Pages 배포)
├── memory/
│   ├── shared/      # topic_index.json, decision_ledger.json
│   ├── sessions/    # current_session.json
│   ├── master/      # master_feedback_log.json, master_preferences.json
│   └── roles/       # 각 역할별 메모리
├── reports/         # {YYYY-MM-DD}_{topic-slug}/{role}_rev{n}.md
├── scripts/         # TS 스크립트 (세션 로그, 토픽 생성 등)
└── topics/          # 토픽별 debate_log.json
```

---

## 외부 채팅에서 논의할 때 권장 사항

- 이 파일 전체를 붙여넣고 질문하세요
- 논의 결과(방향, 결정 후보)만 Claude Code에 가져오면 됩니다
- 실제 파일 구조/코드 변경은 Claude Code에서만 가능합니다
