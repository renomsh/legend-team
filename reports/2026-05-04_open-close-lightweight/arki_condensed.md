---
role: arki
session: session_182
topic: topic_157
topicSlug: open-close-lightweight
turnId: 0
invocationMode: subagent
date: 2026-05-04
rev: 2
condensed: true
condensedBy: zero/session_184
---

# Arki — `/open` LLM 분류 결정 매핑 테이블 설계

## TL;DR

3단계 키 (grade × topicType × isNew) 매핑 테이블로 `/open` LLM 결정 10건 중 8건 규칙화 가능. LLM 판단 필요 잔존: Grade A/S 경계(Nexus 질문 1개로 해소) + D-7(role memory 파일 선택) 2건. Config 위치: `memory/shared/open_routing_config.json`.

## 1. LLM 분류 결정 현황

| # | 결정 | 규칙화? | LLM 필요? |
|---|---|---|---|
| D-1 | Grade 판정 | 부분 (D/C 키워드 규칙, A/S 경계 문맥 의존) | 필요 |
| D-2 | topicType 판정 | 완전 (D-145 알고리즘) | 불필요 |
| D-3 | isNew 판단 | 규칙 (패턴 매칭) | 불필요 |
| D-4~D-6 | 첫 주자/모드/역할 순서 | 규칙 (표 lookup) | 불필요 |
| D-7 | 로드 파일 목록 | 미완성 | 필요 |
| D-8~D-10 | context_brief/Edi/PD 브리핑 | 규칙 | 불필요 |

규칙화 8건 / LLM 잔존 2건.

## 2. 매핑 테이블 설계

**Key = { grade, topicType, isNew }** — 총 30조합, 실사용 ~12개.

| route key | firstSpeaker | transitionGate | loadFiles 수 |
|---|---|---|---|
| A_framing_new | arki | true | 4 |
| A_standalone_new | arki | true | 2 |
| B_standalone_existing | arki | true | 3 |
| C_standalone_new | dev | false | 1 |
| D_standalone_new | dev | false | 0 |

JSON 스키마 필드: `keyDimensions`, `gradeKeywords`, `routes[key]`, `topicTypeRules[]`, `conditionalScripts[{script, condition}]`.

Nexus 최소 질문: 0~1개 (A/S 경계 불명확 시만).

## 3. 감사 발견 요약 (9건 → 3차 종료)

| 우선순위 | 영역 | 내용 |
|---|---|---|
| MUST_NOW | 구조화 | topicType 알고리즘(D-145) CLAUDE.md 분산 → config `topicTypeRules[]` 추가로 단일화 |
| MUST_NOW | 효율 | topic_load_manifest.json read 불필요화 — loadFiles[] 완전 정의 시 해소 |
| MUST_BY_N=10 | 하드코딩 | open.md 스크립트 경로 → routes[key].scripts[]로 이전 |
| MUST_BY_N=10 | 확장성 | roleSequence string[] → `{role, required: boolean}` 구조화 |
| MUST_BY_N=10 | 효율 | conditionalScripts 구조 추가 (조건부 실행 표현 수단 없음) |
| SHOULD | 구조화 | gradeKeywords SOT config 기계 실행 SOT 명시 |
| SHOULD | 효율 | `loadContextBriefs: boolean` 필드 추가 |
| NICE | 구조화 | routes에 forbidden 조합 명시 (S_implementation_new 등) |
| NICE | 구조화 | #last20/#latest suffix 파싱 규칙 명세 |

## 4. 경계 조건

| 조건 | 대응 |
|---|---|
| `/open` 없이 토픽 시작 | fallback: CLAUDE.md 현행 방식 |
| grade 키워드 교차 매칭 | config 우선순위 명시 (D→C→A/B→S) |
| routes[key] miss | `defaultRoute` 또는 `forbidden` 필드 필수 |
| loadFiles 파일 미존재 | miss 경보 추가 필요 (D-3) |
| 신규 역할 추가 | dispatch_config.json과 동기화 의무 |

## 5. 미결 전제

- P-1: open.md 병행 운용 (config lookup 실패 시 fallback)
- P-2: Nexus 인라인 처리, 별도 hook 불필요
- P-3: gradeKeywords CLAUDE.md 서술 유지 (삭제 금지)
- 미결: conditionalScripts 포맷 — 구현 세션 Dev 협의 후 확정

[ROLE:arki]
# self-scores
aud_rcl: Y
str_fd: 3
spc_lck: N
sa_rnd: 3
