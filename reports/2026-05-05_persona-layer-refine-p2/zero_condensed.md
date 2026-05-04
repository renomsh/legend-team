### Condense — zero (원본: zero_rev1.md)
- 제거: 없음 (원본 lean — 구조적 표 + Self-Score만)
- 보존: TL;DR · Cut 표 · 기각 목록 · Audit · Self-Score

# Zero — Refinement (2nd pass, topic_163, session_190)

## TL;DR
1차 정제(session_188) 후 잔여 군더더기 미미. 추가 절감 4건 발견 (~1,030~1,430B). 모두 ROI 임계 경계선.

## A. Cut — 발견 항목

| # | 파일 | 위치/유형 | 절감 | 우선 |
|---|---|---|---|---|
| 1 | `policies/role-edi.md` §6.4+§6.6 | versionBump G-1 부분 중복 | ~400B | SHOULD |
| 2 | `policies/role-zero.md` 발언 구조 | personas SOT 자기참조 4회 | ~250B | SHOULD |
| 3 | `personas/role-ace.md:19` | "배합의 묘미" 12-17행 재서술 | ~180B | MUST |
| 4 | `personas/role-jobs.md:19` | "배합의 묘미" 13-17행 재서술 | ~200B | MUST |

## B. 기각 (ROI < 임계)
- `_common.md` Self-Score 블록 — 단일 출처 유지
- 페르소나 "절대 금지" 패턴 — 형식 통일성

## C. Audit — security-review
하드코딩 secret/credential/abs-path 0건.

## Self-Score
ref_cnt: 4 / hc_found: 0 / cln_rt: 1.0
