---
role: arki
session: session_181
topic: topic_157
topicSlug: open-close-lightweight
turnId: 2
invocationMode: subagent
date: 2026-05-04
rev: 1
---

ARKI_WRITE_DONE: reports/2026-05-04_open-close-lightweight/arki_rev1.md

# Arki — 서브에이전트 프롬프트 정제: _common.md 절삭 구조 분석

---

## 1. 기술적 성립 여부

**전제 A:** `_common.md` (3,753 bytes)는 10개 역할 모두에 동일하게 주입된다.
실측 확인 ✓ — `pre-tool-use-task.js` L154-160: `buildPersonaLayer()`가 `_common.md` → `role-{r}.md` → `personas/role-{r}.md` 순서로 concat. 역할 분기 없이 공통 주입.

**전제 B:** persona layer 총 크기 = `_common.md` + `role-{r}.md` + `personas/role-{r}.md`.
실측값:
- arki 기준: 3,753 + 2,575 + 1,472 = **7,800 bytes**
- edi 기준 (최대): 3,753 + 6,625 + 2,404 = **12,782 bytes**
- 평균 역할: 약 **8,500 bytes**

**전제 C:** session layer caps = 보고서당 6,000 chars (Edi 8,000), 총합 80,000 chars.
실측 확인 ✓ — `pre-tool-use-task.js` L29-31.

**전제 D:** 역할 4개 기준 session layer 최대 24,000 chars 주입.
실측 보고서 크기: dev 1,966~2,863 / riki 3,222~5,410 / arki 6,419~9,346 / edi 5,734~5,740.
Arki 보고서는 6,000 caps에 도달함 — 절삭 실증됨.

---

## 2. _common.md 섹션별 분류

실측 `_common.md` 전문 파싱 (총 63줄, 3,753 bytes):

| 섹션명 | 크기(bytes) | 분류 | 근거 |
|---|---|---|---|
| 헤더 + 설명 (1~6줄) | ~250 | 🟢 CUT | hook 자체가 version/소속 정보를 알고 있음. 역할 판단에 기여 없음. |
| **Write 계약** (8~13줄) | ~320 | 🔴 KEEP | WRITE_DONE 응답 형식 + 경로 규칙 — 역할 발언 행동을 직접 통제. 없으면 저장 경로 누락. |
| **Frontmatter link 의무** (15~21줄) | ~450 | 🔴 KEEP | turnId 기록은 PostToolUse hook이 검사. 누락 시 gaps 경보. 행동 규칙. |
| **Self-Score YAML 출력 계약** (23~35줄) | ~550 | 🔴 KEEP | `[ROLE:{r}]` 마커 + 블록 형식 — `post-tool-use-task.js` 파서가 의존. 없으면 자가채점 수집 0. |
| Self-Score 공통 기록 규칙 (37~42줄) | ~380 | 🟡 PARTIAL | scale 정의(0-5 정수 등)는 전 role-*.md에 8회 반복. "3연속 생략 시 경보" 운용 규칙만 KEEP. scale 상세는 CUT 가능. |
| **컨텍스트 활용 지시** (44~49줄) | ~350 | 🟡 PARTIAL | "hook v3가 자동 prepend" 안내는 KEEP. 역할 메모리 경로 안내는 role-*.md에 중복. CUT 가능. |
| **Shared Asset Protocol** (51~56줄) | ~310 | 🟡 PARTIAL | evidence_index·glossary 일반 안내는 role-edi.md에 상세 중복. Edi 전용으로 이전 가능. |
| **자기소개 제약** (58~62줄) | ~390 | 🔴 KEEP | F-013 persona drift 방어. 역할별 "절대 금지" 항목에 부분 중복이지만, 공통 강제 필요. |

**분류 요약:**
- 🔴 KEEP: Write 계약 + Frontmatter link + Self-Score 출력 계약 + 자기소개 제약 = **~1,710 bytes**
- 🟡 PARTIAL 절삭 가능분: scale 상세 + 중복 컨텍스트 지시 + Shared Asset 일반분 = **~500 bytes**
- 🟢 CUT: 헤더 설명 = **~250 bytes**

**절삭 가능 총량: ~750 bytes → 3,753 → 약 3,000 bytes (20% 감소)**

---

## 3. 중복 분석 — _common.md vs role-*.md

다축 교차 확인 결과:

| 내용 | _common.md | role-riki | role-dev | role-fin | role-edi | 판정 |
|---|---|---|---|---|---|---|
| 역할 메모리 Read 권장 | ✓(일반형) | ✓(구체형) | ✓(SOT 참조) | ✓ | ✓ | 완전 중복 |
| Shared Asset 파일 경로 | ✓ | — | ✓(Dev SOT) | ✓ | ✓(필수 Read 강제) | 부분 중복 |
| scale 정의(0-5/Y·N/ratio) | ✓ | ✓ | ✓ | ✓ | ✓ | 전 역할 8회 반복 |
| evidence_index 주체 | ✓(Riki/Arki) | — | — | — | ✓(강제) | Edi 이전 가능 |
| decision_ledger = Edi 기록 | ✓ | — | ✓ | — | ✓(강제) | Edi role policy에 이미 강제 |

**구조 결함 1 (MUST_BY_N=10):**
`scale: 0-5 정수 / Y·N / ratio 0~1 소수2자리 / percentile 0~100 정수` 정의가 `_common.md` + 전 역할 policy에 8회 반복. 단일 출처는 `metrics_registry.json`이므로 `_common.md`에서 "scale/정의 단일 출처: metrics_registry.json" 1줄만 남기고 상세 삭제.

**구조 결함 2 (SHOULD):**
`컨텍스트 활용 지시` 섹션의 "역할 메모리 Read 권장"은 역할별 policy 구체형에 의해 실질 덮어쓰임. _common.md 일반형 삭제 후 role-*.md 구체형만 유지해도 판단 유지됨.

---

## 4. Session Layer 절삭 방향 분석

**실측 보고서 구조:**
보고서 상단 10~15줄(frontmatter + WRITE_DONE + 제목)은 약 200~350 bytes. 핵심 결론(첫 번째 섹션)은 500~800 bytes 내에 존재.

- arki_rev1.md (9,346 bytes): 핵심 발견은 §1~§2 (약 2,500 bytes 이내)
- riki_rev1.md (5,410 bytes): 리스크 3~4개, 각 200~400 bytes
- edi_rev1.md (5,734 bytes): Executive Summary = 첫 800 bytes
- dev_rev1.md (2,863 bytes): 전문 2,863 bytes — caps 미도달

**서브에이전트가 요약본으로 받아도 판단이 유지되는가?**

역할별 판단:
- **Fin → Arki 보고서**: 설계 옵션 권고 + 경계 조건만 필요 ≈ 1,500 bytes. 전문 불필요.
- **Riki → Arki·Fin 보고서**: 전제 + 결론 + 핵심 발견 ≈ 각 1,000~1,500 bytes. 전문 불필요.
- **Edi → 전 역할 보고서**: 결론·결정 타임라인 재구성 필요 — 더 많이 필요.

**권고: MAX_CHARS_PER_REPORT 역할별 분화**

| 수신 역할(보고서 작성자) | 현재 캡 | 권고 캡 | 근거 |
|---|---|---|---|
| 일반 역할(Arki·Fin·Riki·Ace) | 6,000 | **2,500** | 핵심 결론은 2,500 chars 이내 위치 실증 |
| Edi | 8,000 | **5,000** | 전 역할 통합 필요하나 현재 8K 과다 |
| Dev | 6,000 | **3,000** | 실측 보고서 최대 2,863 — 3K면 충분 |

---

## 5. 설계 옵션

### 옵션 A: _common.md 섹션 선별 절삭만 (보수적)
- 헤더 + scale 상세 + 컨텍스트 지시 중복분 삭제
- 절감: 750 bytes (20%)
- 장: 코드 변경 없음. 파일 편집만.
- 단: session layer 낭비는 그대로.

### 옵션 B: MAX_CHARS_PER_REPORT 역할별 분화만 (중간)
- `pre-tool-use-task.js`에 `MAX_CHARS_BY_ROLE` 맵 추가
- 절감: session layer 24,000 → 10,000 chars (58%)
- 장: 즉각 효과 최대.
- 단: 코드 변경 필요. 2,500 caps 충분성 검증 필요.

### 옵션 C: A + B 동시 적용 (권고)
- _common.md 정제 + session layer caps 분화
- 절감: 전체 프롬프트 주입량 ~35% 감소
- 장: 구조적 중복 해소 + 즉각 효과.
- 단: 파일 2~3개 변경. Riki 검증 권고.

**권고: 옵션 C. 단, MAX_CHARS 변경은 1세션 dry-run(warn only, 절삭 발생 시 로그만) 후 확정.**

---

## 6. 경계 조건

1. **MAX_CHARS를 2,500으로 낮출 때 Riki가 Arki 발언 오독 위험**: Arki 보고서 9,346 bytes → 2,500 chars 절삭 시 설계 옵션 3번째가 잘릴 수 있음. 절삭 시 "... Read 도구로 확인" 안내는 이미 존재(truncate 함수 L66). 수신 역할이 필요 시 Read 호출 가능 — 허용 가능 위험.
2. **Edi 캡 5,000 낮출 때 versionBump 확정 정보 누락**: edi_rev1.md versionBump 섹션은 하단에 위치. 5,734 bytes 보고서를 5,000 caps로 자르면 누락 가능. 실측 확인 후 Edi는 6,000 유지 고려.
3. **scale 상세 삭제 시 nova/sage/zero role-*.md에 미기재 가능성**: 해당 역할 policy 확인 필수. nova/sage/zero에 scale 정의 없으면 삭제 전 추가 후 진행.
4. **헤더 삭제 시 hook 버전 정보 소실**: hook이 로그에 버전 기록하므로 판단 무관.

---

## 1차 자기감사

### structuration
- 옵션 A/B/C 분리 명확, 각 독립 배포 가능 ✓
- `MAX_CHARS_BY_ROLE` 맵은 `pre-tool-use-task.js` 단일 변경으로 완결 ✓
- _common.md 변경은 코드 변경 없음 — 파일 편집 독립 ✓

### hardcoding
- `MAX_CHARS_PER_REPORT = 6000` 하드코딩 → `dispatch_config.json` 이전 권고 [MUST_BY_N=10]
- `MAX_CHARS_PER_EDI = 8000` 하드코딩 → 동일 [MUST_BY_N=10]
- `TOTAL_CAP_CHARS = 80,000` 하드코딩 → config 이전 시 런타임 조정 가능 [SHOULD]

### efficiency
- 역할별 캡 분화 시 `findLatestReport()` 함수 변경 불필요 ✓
- `seenRoles` 중복 방지 이미 존재 → session layer 중복 주입 이미 방어됨 ✓
- scale 정의 8회 반복 → 단일 스크립트 치환 가능 [NICE]

### extensibility
- `MAX_CHARS_BY_ROLE`을 `dispatch_config.json`에 박제하면 코드 무변경으로 향후 조정 [MUST_BY_N=10]
- 역할별 _common.md 선택 주입 → 도입 시 복잡도 증가, ROI 낮음 [DEFER]

---

## 전체 절감 수치화

| 항목 | 현재 | 옵션 C 적용 후 | 절감 |
|---|---|---|---|
| _common.md | 3,753 bytes | ~3,000 bytes | -753 bytes (20%) |
| persona layer (arki 기준 1회 호출) | 7,800 bytes | ~7,050 bytes | -750 bytes |
| session layer (역할 4개 기준 최대) | 24,000 chars | 10,000 chars | **-14,000 chars (58%)** |
| 전체 주입량 (4역할 세션, 평균) | ~32,000~56,000 chars | ~17,000~25,000 chars | **~55% 감소** |

**역할 호출 1회당 절감:** persona -750 bytes + session -3,500 chars (선행 3역할 기준)

---

## 구현 우선순위

1. **[MUST_NOW] MAX_CHARS_PER_REPORT 역할별 분화** — `pre-tool-use-task.js`: others=2,500 / Dev=3,000 / Edi=5,000 또는 6,000. 즉시 효과 최대. 위험 낮음 (절삭 시 Read 도구 안내 이미 존재).
2. **[MUST_BY_N=10] 캡 상수 → dispatch_config.json 이전** — 하드코딩 제거, 런타임 조정 가능.
3. **[MUST_BY_N=10] _common.md 헤더 + scale 상세 절삭** — 파일 편집만. 코드 무변경.
4. **[SHOULD] 컨텍스트 활용 지시 중복분 CUT** — role-*.md 구체형으로 대체.
5. **[NICE] scale 정의 8회 반복 제거** — 전 role-*.md에서 "metrics_registry 참조" 1줄로 대체.
6. **[DEFER] 역할별 _common.md 선택 주입** — 과잉 추상화 위험, ROI 낮음.

---

[ROLE:arki]
# self-scores
aud_rcl: Y
str_fd: 3
spc_lck: N
sa_rnd: 1
