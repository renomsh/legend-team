---
role: edi
session: session_182
topic: topic_157
condensed: true
condensedBy: zero/session_184
---

# Edi — session_182 요약 (topic_157)

## TL;DR

**역설적 결론:** 분리·정제 4건은 토큰 절감 효과 사실상 0. ace_memory.json(31KB)은 /open 시 자동 로드된 적 없었음(Zero+Riki 실증). 75K 주범은 dispatch-context inject(~78KB)+CLAUDE.md(~27KB) — 건드리지 못함. 본 세션은 **구조 정리·dead spec 제거**로만 유효.

## 결정 흐름 표

| # | 역할 | 발언·결정 | 결과 |
|---|---|---|---|
| 1 | Arki rev2 | 3키 매핑(grade×topicType×isNew). 10건 중 8건 규칙화. open_routing_config.json 설계 | 매핑 모델 도출 |
| 2 | Riki rev3 | 🔴R-1: 75K 주범은 dispatch-context inject. 매핑 lookup으로 못 건드림 | 방향 재검토 |
| 3 | Master | /open 가장 큰 토큰 영역 직접 재조사 | ace_memory.json 31KB 발견 |
| 4 | Zero rev1 | ace_memory 학습 이력 5섹션 = dead data. Archive 권고 | 분리 설계 |
| 5 | Master | ace 강제 포함 정책 폐기 + nexus_memory_open.json 분리 결정 | 결정 |
| 6 | Dev | nexus_memory_open.json 신규(4,211B) / ace_memory.json 정리(1,119B) | 구현 완료 |
| 7 | Riki rev4 | ace_memory.json /open 시 자동 로드된 적 없음. 75K 주범 = dispatch-context inject(~78KB) + CLAUDE.md(~27KB) | 진단 확정 |
| 8 | Master (3건 지시) | CLAUDE.md step 2-b / ace_memory archive / auto-memory 정제 6Cut+3→1Merge | 3건 구현 완료 |

## 실제 변경 파일

| 파일 | Before | After | 변동 |
|---|---|---|---|
| CLAUDE.md | — | Step 2-b 삽입 | 정책 갱신 |
| nexus_memory_open.json | 없음 | 4,211B | 신규 |
| ace_memory.json | 26,858B | 1,119B | **-96%** |
| ace_memory_archive_20260430.json | — | 26,441B | archive |
| auto-memory 9파일 | 78,662B | 69,133B | -12.1% |

순 토큰 효과: ace_memory 자동 로드 경로 없음 → 실 절감 미확정. auto-memory 정제만 실 절감 가능성.

## 미해결 Gap (인계)

| # | 항목 | 우선순위 |
|---|---|---|
| G-1 | dispatch-context inject 경량화 — 진짜 레버 | **MUST** |
| G-2 | /open SKILL.md 본문 크기 미측정 | MUST |
| G-3 | nexus_memory_open.json hook 자동 로드 미구현 | SHOULD |
| G-7 | close 프로세스 토큰 측정 | SHOULD |

구조 결함: topic_load_manifest.json = dead spec (consume 코드 0건).

## versionBump: +0.01 (0.7.151→0.8.0)

코드 변경 0, 토큰 효과 미실증 → structural 기준 미달, capacity 하향.

[ROLE:edi]
# self-scores
gp_acc: 0.80
scc: Y
cs_cnt: 5
art_cmp: 0.85
gap_fc: 2
