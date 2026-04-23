---
role: riki
session: session_085
topic: topic_091
date: 2026-04-23
rev: 1
---

# Riki 발언 — Vera Claude Design AI 웹 호출 활용 방법 (framing)

> 함정 수용: 개수 채우기 금지. 5 슬롯 중 확신 있는 항목만. 외부 앵커 1건 cross-check 수행(D-059). Master 직관 권위 회피 없이 검증. Fin 미발언 상태이므로 비용은 언급만(정량화 X).

---

## R-1. 🔴 Master "Figma 대체축 발표" 주장 — 외부 앵커 cross-check 결과 부분적 기각

**원문 재료** — Arki rev1 §4-a: *"Master 제공 정보: Anthropic이 Claude Design을 **장기 Figma 대체 축**으로 공식 발표."*

**외부 앵커 cross-check (WebSearch 2026-04-23 실시)**:
- 3rd-party 보도 다수(VentureBeat, Gizmodo, TheNewStack, TechFlow, WinBuzzer): "Figma rival / alternative / challenger" 프레임으로 보도. Figma 주가 당일 ~7% 하락. Mike Krieger(Anthropic CPO) Figma 이사회 사임.
- **그러나 Anthropic 1차 포지셔닝**(TheNewStack 보도 내 Anthropic 인용): *"Claude Design is built around **interoperability** and is meant to **meet teams where they already work, not replace incumbent tools**."* Canva export·PPTX·PDF·MCP 연계 강조.

**파손 범위**: "공식 Figma 대체축 선언"은 **3rd-party 해석**이지 **Anthropic 1차 문언이 아님**. Arki가 이를 근거로 PD-005를 `supersede`로 종결 권고한 것은 1차 소스 오독 위에 서 있음. D-059(외부 앵커 cross-check 의무) 위반 직전 상태.

**완화 조건**: PD-005 처리 결정 전에 Master에게 "1차 발표문의 정확한 문구"를 제출받거나, `supersede` 판정을 **"Anthropic 공식 대체축 선언"**이 아닌 **"레전드팀 Figma 실사용 0건 + Claude Design 편입 결정"** 근거만으로 재작성. Master 직관이 틀렸다고 말하는 것이 아니라, **근거 체계를 1차 소스로 전환**해야 supersede 기록이 6개월 후 재검증에 살아남음.

※ Master 권위 회피 안 함: 이 주장은 외부 사실 주장이므로 검증 대상이라는 점을 명시. `feedback_external_anchor_mandatory`(D-059) 그대로 적용.

---

## R-2. 🔴 Claude Design "research preview" 결합도 리스크

**원문 재료** — WebSearch 확인: *"Claude Design is a new service in **research preview**"* (2026-04-17 출시).

**파손 범위**: research preview = 가격·API·접근 정책·bundle 포맷·모델 버전 모두 변경 가능. Arki가 설계한 `design/handoffs/source|spec|integrated/` 3단 디렉토리와 `meta.json.ClaudeDesignSessionURL` 의존은 다음 3개 고장점을 지님:
1. Anthropic이 6개월 내 export 포맷 변경 → `source/` 스냅샷 parse 경로 전수 재작성
2. internal session URL 스키마 변경 → `meta.json` 링크 dead → Arki A1 "외부 휘발" 자기감사가 framing 단계에 지적된 그대로 실현
3. research preview → GA 전환 시 유료화·quota 도입 → Vera/Arki 호출 패턴 일부 경제성 붕괴

**완화 조건**: handoff bundle의 **"1차 원천은 Claude Design이 아니라 우리가 보낸 spec(JSON)"** 원칙을 락. spec → 다른 도구(D2, Canva export, 직접 HTML)로 재생성 가능해야 함. `source/` 는 참조용, `spec/` 는 정본. 이 역전 없으면 research preview 변동이 곧 레전드팀 산출물 손실.

---

## R-3. 🟡 Vera 역할 정체성 침식 — "spec 작성자 → AI 외주 검수자" 변질

**원문 재료** — CLAUDE.md: *"Designer (Vera) handles visual system: color, typography, spacing, gradient, component spec. Receives direction from Ace, delivers spec to Edi. Does NOT make UX strategy or data decisions. (D-029, 2026-04-17)"* / Arki rev1 §2-b: Role card UI·Dashboard layout·Handoff 랜딩페이지 모두 **Vera 1차 owner** 로 매핑.

**파손 범위**: Claude Design은 "프롬프트 → 완성 prototype + 인터랙션 슬라이더"까지 생성. Vera가 **spec을 쓰는 주체**에서 **AI 출력을 검수하는 주체**로 미끄러질 구조. 페르소나 정의(D-029)는 "spec 작성"이 본업인데, Claude Design 도입이 "AI 출력 QA"로 Vera 일상 시간의 무게중심을 옮기면 1년 후 Vera 메모리가 "색·타이포 판단 근거" 대신 "AI 출력 승인/반려 로그"로 편향됨. 페르소나 수명 손상.

**완화 조건**: Vera가 Claude Design을 호출할 때 **반드시 "spec 먼저 작성 → 그 spec으로 Claude Design 프롬프팅"** 순서 강제. "먼저 Claude Design에 그려보고 마음에 드는 것을 spec으로 역추출" 경로 금지 규칙을 Vera 페르소나 문서에 명시. Arki 매트릭스에 **"spec precedes generation"** 컬럼 추가 권고.

---

## R-4. 🟡 Figma MCP(PD-005) 양방향 리스크 — Arki supersede 권고 단독 채택 금지

**원문 재료** — Arki rev1 §4-c *"archive는 맥락 소실... supersede로 종결하고, 계승 포인터로 topic_091"*, §4-a *"레전드팀 현실: Figma 사용 실적 0건"*.

**파손 범위**: 두 방향 모두 리스크.
- **조기 supersede 방향**: R-1에서 지적한 대로 "Figma 대체" 주장이 Anthropic 1차 문언이 아닌 3rd-party 해석이므로, supersede 판정 근거가 미달. 6개월 내 Figma 자체가 MCP·AI 협업 강화로 재부상하면 supersede 기록이 오판으로 남음.
- **keep 방향**: 매몰비용 — 레전드팀 Figma 실사용 0건에서 2년째이므로 keep은 dead deferral 누적.

**완화 조건**: `superseded` 대신 **`archived-with-pointer`** 같은 중간 상태 신설 또는 supersede 하되 `reviewTrigger: "Figma가 자체 AI 설계 도구 공식 발표 시 재평가"` 명시. Arki B3(절차 표준화) 감사와 정합. 단발 supersede 결정 금지.

---

## R-5. 🟡 Arki 발언 감사 — `design_ownership_map.json` 메타 자산 유지비용

**원문 재료** — Arki rev1 §2-b 권고: *"같은 산출물의 '1차 owner / 2차 검수' 매트릭스를 `memory/shared/design_ownership_map.json`(가칭)에 명시."*

**파손 범위**: 메타 레지스트리는 두 조건에서 가치 창출 — (a) 조회 빈도가 유지비용을 상회, (b) 역할 수가 증가해 경계가 흐려짐. 현재 레전드팀은 Vera·Arki 2역할 + 6개 산출물 유형 수준 = 12칸 매트릭스. 이 규모는 **CLAUDE.md 또는 Arki 페르소나 문서 내 표 한 장**으로 충분. 신규 JSON 파일·validator·참조 hook을 요구하는 규모가 아님. `feedback_pragmatic_weapon_not_art`(D-062) "효과 대비 비용 낮으면 즉시 기각" 정면 대상.

**완화 조건**: 이 세션에서는 **표 1장을 CLAUDE.md의 Vera/Arki 항목에 추가**하는 수준으로 종결. JSON 레지스트리는 Arki B1(3번째 호출자 등장) 시점까지 **PD로 보류**. 지금 JSON을 만들면 Arki A3 자기감사(수기 유지 필요) 그대로 실현 — 대시보드 영향 없는 dead registry.

※ Arki의 다른 핵심 findings는 정독 검토 결과 유지 가치 확인됨: A1/A2(외부 휘발·재현성 메타) = R-2 보강으로 이미 반영. B2(경로 하드코딩) = Dev 세션 합류 시 필수, framing에서 재지적 불필요.

---

## 기각한 후보 리스크 (의도적 제외)

- **"Claude Design 한국어 폰트 미보증"**: Arki가 이미 검증 가설로 명시. 실측 단계 이슈 — framing 리스크 아님. 기각.
- **"Opus 4.7 모델 버전 변경 시 출력 drift"**: Arki A2가 이미 커버. 중복 금지.
- **"라이선스·저작권"**: Arki §3-c가 "build.js 입력 금지" 근거로 이미 지적. 중복.
- **"비용 폭증"**: Fin 영역. 월권 회피.

---

## 요약 (Master 시점)

- 🔴 2건: R-1(Figma 대체 주장 1차 소스 미확인) · R-2(research preview 결합도)
- 🟡 3건: R-3(Vera 변질) · R-4(PD-005 양방향) · R-5(design_ownership_map 과투자)
- **핵심**: Arki 발언의 구조적 권고(T1/T2 한정 호출, `design/handoffs/` 신설, iframe embed)는 살려도 됨. 단 **PD-005 supersede 결정은 1차 소스 재확인 전 보류** 권고, **메타 JSON 레지스트리는 기각**, **Vera spec-precedes-generation 규칙은 명시 필수**.
- Cross-review 보강 1건 이상(riki.cr_val 지표): R-1·R-3·R-5가 Arki 자가감사 2라운드에서 미포착 — signature metric Y 판정.
