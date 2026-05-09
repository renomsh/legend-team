# Ace — Phase 2 blind-parallel (구조·흐름, 12 skill 시기)

## §1 구조 판정 (Porter)

| 축 | Before (수동) | After (자동) |
|---|---|---|
| skill 정체성 | 도구 카탈로그 | 운영체제 reflex |
| Master 역할 | 매뉴얼 암기 | 의사결정자 |
| 경쟁우위 | Master 숙련도 | 시스템 reaction 정확도 |
| failure mode | Master 누락 (silent) | 시스템 오발동 (visible) |

**핵심 trade-off**:
- 자율성 vs 강제성 — hook 강제 = Master 자율성 일부 양도, D4 박제
- 단순성 vs 정확도 — 다축 트리거↑ 정확도↑ 디버깅↓
- Recall vs Precision — 90% recall = FP 일부 수용

**구조적 약점**: 트리거 로직이 SPOF. hook 버그 = 전체 reflex 오작동. D2 적용 필수.

## §2 흐름 (Keynes)

```
[Before] Master 입력 → Master 판단 → skill 명시 호출 → 역할 호출
[After]  Master 입력 → 트리거 엔진 → skill 자동 호출 → 역할 호출
                       ↑ 새 SPOF
```

| 시간축 | 동학 | 위험/기회 |
|---|---|---|
| 단기 (1~10세션) | FP 노이즈 | 음(-) 피드백, Master 좌절 → 원복 압력 |
| 중기 (10~50세션) | 트리거 룰 튜닝 | 양(+) 피드백 시작 |
| 장기 (50세션~) | 90% 안착 → OS reflex | 트리거 노후화 시 마비 |

**피드백 루프**:
- 양: 자동발동 → 데이터 누적 → 정확도↑ (복리)
- 음: FP 폭증 → Master 좌절 → enforcement 약화 압력 (D4 자가설득)

**PD-068 누적 부채 — 지금이 임계점**:
1. skill 개수 임계량 돌파
2. D-170 discussion 모드 phase 축 명시 → 트리거 신호로 활용
3. 추가 이연 시 소급 비용 기하급수

## §3 지속 가능성 — Conditional 지속 가능

근거: 구조적 정체성 변화 옳음, 흐름상 임계점. **단, 단기 FP 음의 루프 끊는 enforcement 설계 충족 시.**

위험:
1. 트리거 SPOF — kill-switch + dry-run 모드 분리
2. D4 자가설득 압력 — enforcement 약화는 코드 변경으로만 (런타임 토글 금지)

## §4 결정축 통합 권고

| 축 | 권고 | 근거 |
|---|---|---|
| B | PreToolUse hook 단일 + 전용 모듈 분리 | SPOF는 불가피 → 단일화·격리로 디버깅 가능성 확보 |
| C | Master override 명시 키워드 1종만 (`/skip-skill`) | C1 강제 차단 정체성 유지, D4 자가설득 차단 |
| D | 로그 누적 + 주간 트리거 룰 튜닝 (자동 학습 금지) | 자동 학습은 D2 위반 |

**단일 최적해**: 단일 hook 위치 + 단일 명시 우회 키워드 + 수동 튜닝 루프

## §5 Discussion 모드 적합성
**적합** — blind-parallel 가치 높음 (역할별 시각차 첨예), debate 가치 높음 (B/C/D trade-off 양립 불가), synthesis Edi 단일 박제 적절.

```
[ROLE:ace] struct_jdg:4 flow_jdg:4 sustain_jdg:3 rfrm_trg:Y ang_nov:4
```
