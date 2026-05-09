# topic_190 condensed (session_225)

session_225는 Phase 1 진입 전 **plugin manifest 접근 경로 타당성 조사** 단계. 코드 변경 0건, 결정 박제 0건, PD 변동 0건으로 종료.

## 핵심 발견 (Phase 1 명세 갱신 트리거)

### F-1. Plugin skill 디스크 직독 = 26개 한정
- 마켓플레이스 cache(`.claude/plugins/cache/marketplaces/`) + repos에서 SKILL.md 탐색 가능한 plugin = **26개**.
- 잔여 ~140 skill (anthropic-skills, daloopa, sales, finance, design, engineering, operations, productivity, customer-support, legal, enterprise-search, product-management, miro, sp-global, human-resources, pdf-viewer 등 17 namespace)은 **system-reminder 런타임 인젝션 only** — 디스크에 SKILL.md 없음.

### F-2. 도구 preload 무관
- Master 가설("도구 preload하면 manifest 읽힘") 반증.
- `cowork:tools.preload` 옵션은 **MCP 툴 스키마 hydrate에만 영향** (deferred → eager). skill 파일 디스크 배치와 직교.
- 증거: 본 dispatch context의 deferred tools 목록에 cowork plugin 도구 0건. available-skills 목록에는 ~140 skill 노출. 두 메커니즘이 분리되어 있음을 입증.

### F-3. Phase 1 Gate G1 ≥100건 충족 불가
- D-177 명세: "G1: skill ≥100건, hash 안정".
- 디스크 직독 채널만으로는 26건. 100건 미달 → **G1 통과 불가능**.

## 3 영역 정제 판정

### tech-debt (1건 식별)
- **D-177 Phase 1 명세 부채화**: G1 임계 ≥100건은 디스크 직독 전제 위에 세워졌으나, 실측 26건. 명세를 그대로 두면 후속 세션이 G1 미달=중단으로 오판할 위험. 해결안 3건(런타임 캡처 / 정적+수동시드 / G1 하향)은 Master 결정 보류 상태로 제기됨 — synthesis 미해결 #7로 추가 권고.
- 단, 코드 산출물 0건 단계라 cut/refine 대상 코드 부재. 부채는 **명세 메타데이터** 영역에 한정 — Edi 박제 시 D-177 footnote 또는 PD-068 후속 항목으로 흡수 권장.

### security-review
- 해당 없음. 코드/설정 변경 0건. 노출된 secret·credential·하드코딩 0건.

### simplify
- 해당 없음. 정제 대상 코드 0건.

## 미해결 추가 (이전 6건 → 7건)

7. **Plugin manifest 수집 채널 결정** — 옵션 A(런타임 캡처: UserPromptSubmit hook이 system-reminder 파싱) / B(정적+수동시드: 26건 자동 + ~140건 수동 등록) / C(Gate G1 하향: ≥20건). D-177 Phase 1 진입 전 Master 결정 필수.

## Self-exclusion 적용
- 본 세션 산출물에 메타-자산(violation flag·audit trail·self-scores log) 정제 대상 없음. 회피 의무 위반 0건.
