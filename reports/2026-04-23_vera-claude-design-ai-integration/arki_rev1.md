---
role: arki
session: session_085
topic: topic_091
date: 2026-04-23
rev: 1
---

# Arki 발언 — Vera Claude Design AI 웹 호출 활용 방법 (framing)

> 함정 사전 고지 수용: 실측 0건 → 모든 bundle 구조 명제는 "추정 + 검증 가설" 형식. 강점 가정 금지 — Claude Design은 design이 본업이고 아키텍처 다이어그램은 미보증 영역. 외부 앵커 1건 cross-check 포함. 자기감사 2회(시간축·확장성축).

---

## 1. Arki 자신의 호출 영역 정의

### 1-a. 호출 가능성의 축

Claude Design은 "design system 자동 학습"을 셀링포인트로 내세우는 디자인 제너레이터입니다. 본 역할(Arki)이 다루는 산출물은 **system diagram / dependency graph / agent topology / phase gate 플로우** 네 종류가 주이며, 이는 "시각 디자인"이 아니라 **구조적 시각화(structural visualization)** 영역입니다. 두 영역의 생산 도구 역량 분포는 실증 없이 동일시할 수 없습니다 — 강점 가정은 보류합니다.

### 1-b. 호출 유형 분류 (추정 + 검증 가설)

| 유형 | 대상 산출물 | Claude Design 적합성(추정) | 검증 필요 지점 |
|---|---|---|---|
| T1 | Agent topology·Role card 배치 | 중~상 (디자인 본업과 중첩) | 노드-엣지 정확성 유지 여부 |
| T2 | Phase gate 플로우 (Phase 1→G1→Phase 2) | 중 | 조건 분기·롤백 경로 표현력 |
| T3 | Dependency graph (세밀·다층) | 낮~중 | 50+ 노드에서 레이아웃 붕괴 여부 |
| T4 | Runtime data flow / sequence diagram | 낮 | 시간축 표현·lifeline 보존 |

본 역할의 입력 spec은 **"그림"이 아닌 "관계"로 선기술(pre-specify)**합니다. 즉:
- 노드 목록(id·type·role·color hint)
- 엣지 목록(from→to·kind=control|data|gate|rollback·label)
- 레이아웃 힌트(layered·grid·radial 중 택1)
- 색 의미 대응(기존 레전드팀 role palette 준수: dev=blue cool, ace=..., 등 `feedback_role_color_palette` 참조)

출력 bundle은 **standalone HTML + 원본 구조 서술(JSON 또는 마크다운 spec)** 을 동시 수신해야 재현 가능성을 확보합니다. HTML만 받으면 나중에 수정 불가 — "합친 후 쪼개기는 불가" 원칙(session_045 lesson) 위반.

### 1-c. 외부 앵커 cross-check (D-059)

**앵커**: Anthropic 공식 Claude Design 발표(2026-04-17, Opus 4.7 기반)는 "design files, code, brand guidelines"를 입력으로 명시하며 출력 예시로 "슬라이드·로고·랜딩페이지"를 우선 제시합니다. **"architecture diagram"은 공식 예시에 부재** — 이는 T3/T4가 미보증 영역이라는 구조적 증거입니다. T1/T2는 "design" 성격이 강하므로 상대적으로 안전권.

**핵심 권고**: **Arki는 T1·T2에 한해 Claude Design을 호출하고, T3·T4는 기존 D2+Playwright 파이프라인을 유지합니다.** (D2는 arki_memory 검증 완료)

---

## 2. Vera vs Arki 호출 영역 분리선

### 2-a. 분리 원칙

| 축 | Vera 영역 | Arki 영역 | 경계 판정 기준 |
|---|---|---|---|
| 목적 | "보기 좋게 전달" | "관계·선후·조건을 정확히 전달" | 오답 시 비용이 감성인가 구조인가 |
| 자유도 | 색·타이포·여백 재량 | 노드·엣지 구조는 불변, 스타일만 재량 | 구조를 임의 재배치 가능한가 |
| 최종 검수 | Vera 단독 승인 | Arki가 구조 정합성 승인 후 Vera 스타일 검수 | 2단 게이트 |

### 2-b. 겹침 영역 owner 매핑

| 산출물 | 1차 owner | 2차 검수 | 근거 |
|---|---|---|---|
| Role card UI(6역할 카드) | **Vera** | Arki(정보위계만) | 색·타이포가 본질 |
| Dashboard layout(KPI+패널) | **Vera** | Arki(데이터 원천 정합성 체크) | session_045 lesson — 같은 원천 overlay 우선 |
| Agent topology map | **Arki** | Vera(심미) | 관계 오류가 치명 |
| Phase/Gate 플로우 | **Arki** | Vera(가독성) | 순서·조건이 본질 |
| Handoff bundle 랜딩페이지 | **Vera** | Arki(링크 구조) | 전달 목적 |
| Topic lifecycle 다이어그램 | **Arki** | Vera(심미) | D-056/057 구조 준수 |

### 2-c. 충돌 해소 프로토콜

동일 산출물 두 역할이 경합 시 규칙:
1. **구조 정확성이 깨지면 Arki 우선** (실현 가능성 > 미학, arki_memory.nonNegotiables)
2. **구조 정확성이 동일하면 Vera 우선** (D-029 비주얼 시스템 owner)
3. 2단 게이트는 순서 불변: 구조 락 → 스타일 재량

**핵심 권고**: **같은 산출물의 "1차 owner / 2차 검수" 매트릭스를 `memory/shared/design_ownership_map.json`(가칭)에 명시해 호출 시점에 조회 가능하게 합니다.** 매 세션 말로 합의하는 비용 제거.

---

## 3. Handoff bundle 수신 아키텍처

### 3-a. 안착 위치 — 3가지 옵션

| 옵션 | 경로 | 장점 | 단점 |
|---|---|---|---|
| O1 | `design/handoffs/{date}_{topic-slug}/` | 도메인 전용 디렉토리, `app/` 정책과 완전 분리 | 신규 top-level 디렉토리 추가 |
| O2 | `reports/{date}_{slug}/handoff/` | 기존 리포트 체계에 편입 | 리포트=텍스트 산출물 경계 흐림 |
| O3 | `memory/shared/design_bundles/{topic}/` | 메모리 검색성 | 메모리=상태 원칙 위반 |

**권고: O1.** 이유 3가지:
- `app/`(viewer, read-only)과 충돌 없음 — `app/`은 완성된 산출물 뷰어, `design/handoffs/`는 원자재
- `reports/`와 역할 분리 — 리포트는 역할 발언 텍스트, handoff는 외부 도구 bundle
- top-level 추가는 1회 비용 vs 매번 경로 혼선 방지

### 3-b. 디렉토리 구조 (추정 + 검증 가설)

```
design/
  handoffs/
    2026-04-23_topic-091/
      source/            # Claude Design 원본 export (HTML/PPTX/PDF)
      spec/              # Arki/Vera가 보낸 원본 prompt·JSON spec
      meta.json          # {requester, role, createdAt, ClaudeDesignSessionURL, inputs[], outputs[]}
      integrated/        # 레포 편입된 최종 HTML (app/ 빌드 대상 후보)
      review.md          # Arki 구조 검수 + Vera 스타일 검수 결과
```

검증 필요 지점:
- `source/standalone.html`이 `app/` build.js에서 빌드 가능한 형태인가 → 실측 전 미확정
- Claude Design이 상대 경로 자산(이미지 등)을 bundle에 동봉하는지 → 실측 전 미확정
- 한국어 폰트(Malgun Gothic 등) 기본 포함 여부 → 실측 전 미확정

### 3-c. 기존 파이프라인과의 충돌·연계

- **`app/` viewer 정책 (D-003 revised)**: 읽기 전용, 쓰기 금지. `design/handoffs/integrated/*.html`을 `app/`이 iframe 또는 복사 편입할 때 **write interaction 금지 조항** 위반 없는지 점검해야 함. Claude Design이 자체 폼·버튼을 포함한 bundle을 생산하면 **그 bundle은 `app/` 편입 불가** — `design/handoffs/source/`에만 보존.
- **Edi build.js**: canonical HTML 파이프라인. handoff bundle은 **build.js 입력이 아니라 산출물 원자재** — Edi가 수동 취사선택 후 자신의 파이프라인으로 재생성. bundle HTML을 그대로 배포 금지(라이선스·CF Pages 호환성·보안 3중 리스크).
- **revisionable 원칙 (CLAUDE.md)**: handoff bundle은 `integrated/review.md`에 rev 이력 기록. Claude Design의 internal URL은 외부 상태 — 외부 상태 소실 대비 `source/` 로컬 스냅샷 필수.

**핵심 권고**: **`design/handoffs/` top-level 디렉토리 신설 + `source/spec/integrated/` 3단 분리 + build.js는 `integrated/`만 선택적 참조. `app/`는 standalone HTML을 원칙상 편입 금지하고 iframe embed로만 노출.**

---

## 4. Figma MCP(PD-005) 처리 방침

### 4-a. 사실 확인

- PD-005는 session_025(v0.9.0 선언) 시점에 "Figma 디자인 시스템 연동"으로 등록된 deferred 항목. 이후 활성 이관 이력 없음.
- Master 제공 정보: Anthropic이 Claude Design을 **장기 Figma 대체 축**으로 공식 발표.
- Claude Design 공식 문서: Figma 통합 미언급.
- 레전드팀 현실: Figma 사용 실적 0건, Vera는 로컬 템플릿 기반 운영(D-030).

### 4-b. 옵션 평가

| 옵션 | 의미 | 장점 | 단점 |
|---|---|---|---|
| keep | Figma MCP 여전히 유효 deferral | 생태계 유지 | 자원 낭비·분기 위험 |
| downgrade | 우선순위 하향, 관측만 | 관측 창구 유지 | 여전히 목록 오염 |
| archive | 공식 종결 + 대체축 선언 | 깔끔·집중 | 향후 Figma 재부상 시 재등록 비용 |
| supersede | "Figma MCP → Claude Design handoff" 계승 선언 | 맥락 보존·재부상 대비 | 신규 status 타입 필요 |

### 4-c. 권고: **supersede**

근거:
- archive는 맥락 소실(왜 보류했는지·무엇으로 대체했는지). supersede는 "계승 관계" 보존.
- keep/downgrade는 Master 정보(장기 대체 축)와 직접 충돌.
- 신규 status 타입 비용은 deferral 레코드 필드 1개 추가(`supersededBy`) 수준 — 과잉 구조 아님.

제안 기록:
```
PD-005:
  status: superseded
  supersededBy: "Claude Design handoff workflow (topic_091 framing 기반)"
  supersededAt: 2026-04-23
  supersededReason: "Anthropic 공식 Figma 대체축 선언 + 레전드팀 Figma 실사용 0건"
```

**핵심 권고**: **PD-005는 archive가 아닌 supersede로 종결하고, 계승 포인터로 topic_091 framing 산출물을 지정합니다.** 이 경우 `deferral_log.json` 스키마에 `supersededBy`·`supersededReason` 2필드 추가가 필요합니다(Dev 합의 필수 — 스키마 변경).

---

## 5. 자기감사 (2회 round, D-063 selfAuditProtocol 준용)

> terminationCriteria 전까지 round 계속. 축: structuration / hardcoding / efficiency / extensibility.

### Round 1 — 축: 시간축·Provenance

| # | 발견 | 축 | ROI 라벨 |
|---|---|---|---|
| A1 | handoff bundle의 Claude Design internal URL은 **외부 휘발 상태**. 6개월 후 링크 죽을 수 있음 — 본 설계에 "외부 URL 실패 시 로컬 `source/`만으로 재생산 가능한가" 검증 가설이 빠져 있음 | structuration | MUST_BY_N=10 |
| A2 | `meta.json`에 `ClaudeDesignSessionURL`은 있으나 **모델 버전·도구 버전 스냅샷 필드 없음**. Claude Design 모델 업그레이드 시 동일 prompt → 다른 결과 발생, 재현성 파괴 | extensibility | MUST_BY_N=10 |
| A3 | review.md rev 이력은 수기 기록 전제 — Vera/Arki가 빠뜨리면 lifecycle 추적 불가. 자동화 hook(session-end-finalize 확장) 미설계 | efficiency | SHOULD |

### Round 2 — 축: 확장성·역할 확장

| # | 발견 | 축 | ROI 라벨 |
|---|---|---|---|
| B1 | 분리선이 2역할(Vera/Arki) 가정. Dev가 구현 과정에서 같은 도구 호출 가능 — **3번째 호출자 등장 시 1차 owner 매트릭스 확장 프로토콜 부재** | extensibility | MUST_BY_N=30 |
| B2 | 경로 하드코딩 위험: `design/handoffs/{date}_{topic-slug}/`를 스크립트·hook·문서 세 곳에서 참조 예상. config 원천 JSON 미지정(`feedback_dev_verify_and_callable` 위반 가능) | hardcoding | MUST_NOW |
| B3 | PD-005 supersede 권고가 단발 적용 — **향후 유사 "대체축 발표" 사건(예: 다른 툴 superseded) 반복 시 절차 표준화 부재**. deferral_log.json에 supersede 절차 문서화 필요 | structuration | SHOULD |
| B4 | O1(`design/handoffs/`)을 top-level로 신설하면 **레포 루트 디렉토리 개수 증가**. 기존 top-level(`app/`, `reports/`, `memory/`, `scripts/`, `topics/`, `logs/`, `.claude/`) 대비 의미 분류 재검토 필요 — `design/`가 장기적으로 single-purpose에 머물지, Vera 자산 확장 포털이 될지 결정 필요 | extensibility | SHOULD |

### Round 2 종료 판정

- Round 2 발견 = 4건 (>1). terminationCriteria 미충족 → Round 3 가능.
- 단, 본 세션은 **framing 단계**이므로 MUST_NOW(B2)·MUST_BY_N=10(A1,A2) 3건은 **구현 토픽 분기 시 PD 등록 필수**로 이관하고 Round 3는 구현 토픽에서 수행 권고.

**미발견 축 명시**:
- efficiency 차원에서 Round 1 A3 외 핵심 추가 없음 — No critical issue at this dimension in framing scope.

---

## 6. 구현 토픽 분기 — PD 등록 권고

framing 종결 후 구현 토픽 분기 시 아래 PD 사전 등록 권고:

| PD(제안) | 제목 | 근거 |
|---|---|---|
| PD-new-1 | handoff bundle 디렉토리·스키마 확정 + config 원천 JSON | B2 MUST_NOW |
| PD-new-2 | Claude Design 외부 상태 휘발 대비 재현성 메타데이터 스키마 | A1·A2 MUST_BY_N=10 |
| PD-new-3 | design_ownership_map.json 스키마 + Dev 합의 | 섹션 2-c 권고 |
| PD-new-4 | PD-005 supersede 절차 + deferral_log.json 스키마 확장 | 섹션 4-c + B3 |
| PD-new-5 | Arki T1/T2 호출 실측 vs T3/T4 D2 유지 게이트 검증 | 섹션 1-c 미보증 가설 |

**핵심 권고**: **framing에서 합의된 결정 축은 lock, 실측·스키마 변경은 PD로 분기. 구현 토픽 grade는 A 이상(스키마 변경 + 여러 역할 합의 필요) 권고합니다.**

---

## 요약 (Master 시점)

1. Arki는 Claude Design을 **T1(topology)·T2(phase flow)에만 호출**하고 T3/T4는 기존 D2 유지.
2. Vera/Arki 경계는 **"구조 정확성 깨지면 Arki 우선, 그 외 Vera"** 원칙 + 1차/2차 매트릭스를 JSON으로 고정.
3. handoff bundle은 **`design/handoffs/`** top-level 신설 + source/spec/integrated 3단 분리. `app/` 편입은 iframe embed만 허용.
4. PD-005는 **supersede**(archive 아님)로 종결, 계승 포인터 = topic_091.
5. 구현 토픽 분기 시 PD 5건 사전 등록 권고.
