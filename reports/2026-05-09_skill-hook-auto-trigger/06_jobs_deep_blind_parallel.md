# Jobs Deep — Phase 2 blind-parallel (framing 재검증)

**결론**: 1차 framing은 결정축은 잡았으나 **"90%의 분모"·"학습 루프"·"override 인터페이스"** 3개 축 누락. Master 의도 본질은 "90% 발동" 표면이 아니라 **"시스템이 Master 인지 부담 없이 일관성을 자력 유지"** — 이게 진짜 jobs-to-be-done.

## §1 1차 framing 자체 감사 — 3가지 약점

### A. "90%"의 분모 미정의
- (a) 현재 시점 skill 수 고정 (snapshot)
- (b) **자동화 적합 skill만 분모** ← 권장
- (c) 호출 빈도 가중

박제 필요: A1 = "**자동화 적합 분류 통과 skill의 90%+**"

### B. "skill 호출 의도 사전 식별 가능" 전제 검증 경로 누락
검증 경로: 30+ skill 중 20개 무작위 표본 → 과거 50세션 호출 의도 키워드/문맥 추출 → 매칭률 80%+ 시 전제 성립

### C. 결정축 5개 부족 — 3개 추가 필요 (§3)

## §2 Master 의도 재해석

표면: "skill 90% 자동발동"

**본질 후보 비교**:
| 후보 | 정의 |
|---|---|
| ① 인지 부담 감소 | Master가 호출 안 떠올려도 됨 |
| ② 시스템 일관성 | skill 미사용 품질 편차 제거 |
| ③ 자율 운영 | Master 없이도 시스템 운행 |

**3개 다 맞으나 jobs-to-be-done은 ②**. ①·③은 ②의 결과. skill이 일관 발동되면 자연히 ①·③ 따라옴.

박제: 본질 = **"skill 발동 일관성 → ①·③은 부산물"**.
KPI 재설계: 발동률 90% → **발동 정확도 (precision/recall)**.

## §3 추가 결정축 3개

### F. 자동발동 학습 루프
- F1 정적 (키워드/패턴 고정)
- F2 동적 (FP/FN 로깅 → 자동 보정)
- **F3 하이브리드** (정적 룰 + Master override 로그 학습) ← 권장

### G. Skill 충돌 해결
- G1 priority 정적 테이블
- **G2 가장 specific 매칭 1개** + 충돌 시 Master 1회 확인 ← 권장
- G3 모두 호출 + Edi 종합

### H. Master Override 인터페이스
- **H1 명령어** (`/skip-skill`, `/force-skill`) ← 권장
- H2 자연어 인식
- H3 둘 다

## §4 인지편향 추가 적출 2건

### 4. Sunk cost
"이미 만든 30+ skill 다 활용해야 한다" — 무의식 압박. 일부는 만든 것 자체가 실수일 수도. **분류표에 "사용 안 함" 카테고리 명시 필요**.

### 5. Recursion blindness
자동발동 메커니즘 자체가 자동발동 대상에서 빠졌는지 미검토. **메타-skill은 명시적 자동발동 제외**.

## §5 Saying No 재확정

1. 모든 skill 일괄 자동화 — 거절
2. "PoC 좋으면 전체 확장" 낙관 — 거절. 확장 기준은 F1-score 임계
3. 자동발동 메커니즘에 자동발동 — 거절 (재귀)
4. **신설** — 자연어 트리거 100% 의존 — 거절
5. **신설** — false-positive 0 추구 — 거절. 임계값(<10%) 이하면 합격

## §6 Nexus 인계 사항

Phase 3 이후 Master 확인 6건:
1. A1 분모: "자동화 적합 분류 통과 skill의 90%+" 박제 OK?
2. 본질 = "skill 일관성 → 부산물 ①·③" 동의?
3. F (학습 루프) — F3 하이브리드 OK?
4. G (충돌) — G2 + Master 1회 확인 OK?
5. H (override) — H1 명령어 방식 OK?
6. 정확도 임계값 (precision ≥0.9, recall ≥0.85) — synthesis 전 확정?

```
[ROLE:jobs-deep] self_audit:4 intent_layers:3 new_axes:3 bias_add:2 focus_sharp:5
```
