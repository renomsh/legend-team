---
role: riki
session: session_181
topic: topic_157
topicSlug: open-close-lightweight
turnId: 4
invocationMode: subagent
date: 2026-05-04
rev: 1
---

RIKI_WRITE_DONE: reports/2026-05-04_open-close-lightweight/riki_rev1.md

# Riki — 리스크 감사: 서브에이전트 프롬프트 정제 계획

실측 검증 기반. 추측 없이 코드·파일 수치 인용.

---

### 🔴 R-1. 2,500 chars 캡은 Riki 리스크 항목의 절반 이상을 절삭한다

**실측 근거:**

`reports/2026-05-01_big-bang-part3/riki_rev1.md` (7,169 chars) 분석:
- R-1 시작: char 2,051 — 2,500 캡 내 수신됨
- **R-2 시작: char 2,509** — 2,500 캡 초과, 절삭됨
- R-3~R-7: char 2,961~6,030 — 전부 절삭됨

5개 리스크 항목 중 4개(🔴 2건 포함)가 2,500 chars 이후에 위치. 수신 역할(Edi, Dev)은 Riki의 크리티컬 리스크를 보지 못한 채 발언하게 된다.

**파손 범위:** Edi가 Riki R-2(🔴) 이하를 수신하지 못하면, 최종 산출물에서 해당 리스크 대응이 누락된다. Arki와 Jobs 보고서도 동일 구조 — 5~10개 섹션 중 앞 2~3개만 수신된다.

**완화 조건:** 일반 역할 캡을 2,500으로 낮추려면, 보고서 작성 컨벤션 변경이 선행 필요 — 핵심 결론·크리티컬 리스크를 항상 상단 2,500 chars 이내에 배치하는 강제 규칙. 현재 컨벤션 없음. 규칙 박제 전 캡 변경은 조기.

---

### 🔴 R-2. self-scores [ROLE:] 마커는 파일 말미에 위치 — 2,500 caps가 아니라도 6,000 caps에서도 유실된다

**실측 근거:**

`post-tool-use-task.js` `extractSelfScores()` 함수는 `tool_response`(서브에이전트 채팅 출력)에서 파싱한다. 파일에서 읽지 않는다. 이 부분은 문제없다.

**그러나 실측 [ROLE:] 위치:**

| 보고서 | 전체 길이 | [ROLE:] 위치 | 6,000 caps 이후? |
|---|---|---|---|
| big-bang ace_rev1.md | 5,471 | 5,333 | 아니오 (아슬) |
| big-bang riki_rev1.md | 7,169 | 7,010 | 🔴 YES |
| big-bang jobs_rev1.md | 7,464 | 7,383 | 🔴 YES |
| zero-audit arki_rev2.md | 18,243 | 18,175 | 🔴 YES |
| zero-audit riki_rev1.md | 7,412 | 7,342 | 🔴 YES |

**파손 범위:** self-scores [ROLE:] 마커는 보고서 파일 말미에 관행적으로 위치한다. SESSION LAYER 주입 시 이 파일을 6,000 caps로 절삭하면 [ROLE:] 마커 전체가 사라진다. 수신 역할 서브에이전트가 `self-scores` 섹션을 보고서에서 찾으려 해도 없는 상황이 발생한다. (파서는 chat output 기준이므로 직접 수집은 무관 — 그러나 다음 역할이 "이전 역할은 자가채점을 했다"는 컨텍스트 자체를 받지 못함.)

**완화 조건:** Arki 권고 옵션 C 적용 시 Edi 캡을 6,000으로 유지하면 edi는 보호된다. 그러나 riki/arki/jobs 6,000 초과 보고서에서는 여전히 절삭 발생. 보고서 컨벤션(self-scores 상단 배치 또는 별도 섹션 분리)이 없으면 이 리스크는 잔존한다.

---

### 🟡 R-3. dry-run 1세션 충분성 검증 불가 — 절삭 발생 조건이 세션마다 다르다

**실측 근거:**

`pre-tool-use-task.js` L468-485: TOTAL_CAP_CHARS(80,000) 초과 시만 추가 절삭 발동. 역할별 MAX_CHARS_BY_ROLE 변경은 `truncate()` 호출 레벨에서 적용되어 TOTAL_CAP과 독립적으로 동작한다.

절삭 발생 여부는 해당 세션의 보고서 크기에 의존한다. dev 단독 발언(1,966 chars) 세션에서는 절삭 미발생 — dry-run이 "이상 없음"으로 통과할 수 있다. 5개 역할 + 대형 보고서(Arki 10K, Riki 7K) 세션에서만 실질 절삭 발생.

**파손 범위:** 1세션 dry-run이 "이상 없음"으로 통과한다고 해서 절삭 없음이 보장되지 않는다. Grade A/S 토픽(5개 역할 이상, 대형 보고서)에서만 효과와 리스크가 동시 발현된다.

**완화 조건:** dry-run 대상을 Grade A/S 세션(역할 4개 이상, 총 보고서 합 20K chars 이상) 기준으로 선별. 단일 소형 세션으로는 검증 불충분.

---

## 의도적 제외

- **_common.md 헤더 250 bytes 삭제 리스크**: 판단 영향 없음(Arki 판단 정확). 제외.
- **config 하드코딩 이전 실패 리스크**: dispatch_config.json 구조 확인됨. 단순 JSON 추가. 제외.
- **nova/sage/zero scale 정의 미기재**: Arki가 이미 명시한 경계 조건. 중복. 제외.

---

## 요약

**2개 🔴 크리티컬:**
1. 2,500 chars 캡 = 대형 보고서에서 리스크 항목 절반 절삭. 보고서 컨벤션 변경 선행 필수.
2. [ROLE:] 마커 위치 관행 = 6,000 caps에서도 절삭됨. 컨벤션 없이 캡 변경은 자기채점 컨텍스트 소실 위험.

**Arki 옵션 C 수정 권고:**
- 2,500 caps 변경은 "핵심 결론 상단 배치" 컨벤션 확립 후에 적용.
- 6,000 caps(현행) 유지하며 _common.md 정제(옵션 A)만 먼저 적용하는 것이 리스크 대비 효과 최적.

[ROLE:riki]
# self-scores
crt_rcl: Y
cr_val: 4
prd_rej: Y
fp_rt: 0.10
