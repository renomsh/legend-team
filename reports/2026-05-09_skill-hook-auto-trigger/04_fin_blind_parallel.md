# Fin — Phase 2 blind-parallel (비용·자원, 12 skill 시기)

**결론 먼저**:
- A1 (skill 90%) + hook 강제는 토큰 비용 증가 방향, ROI 양극화
- B축: PreToolUse hook 단일 위치가 운영비 최소
- D축: warn-only fallback 단계 도입이 차단 비용 최소
- 비재무 1순위: false positive 누적 → skill 시스템 신뢰 추락

## §1 비용 분류

| 항목 | 종류 | 방향 | 누적 |
|---|---|---|---|
| 자동 skill 호출 토큰 | 운영비 | ↑ | 누적 |
| Master 인지 부담 | 비재무 | ↓ | 비누적 (FP 시 역전) |
| FP 작업 차단 손실 | 운영부작용 | ↑ | 누적 |
| skill 분류·hook 구현 | 일회성 | ↑ | 비누적 |
| hook 유지보수 (skill 추가 시) | 지속비용 | ↑ | 누적 (숨은 비용) |
| 트리거 엔진 실행 비용 | 운영비 | ↑ | 누적 |

**숨은 비용**:
1. skill 추가 시 트리거 정의 의무화 (거버넌스 부채)
2. 컨텍스트 재주입 비용 (skill prepend 토큰)
3. skill 충돌 해결 비용 (90% 자동화 시 동시 매칭 다수)

## §2 ROI 양극화
Master 의도 "스킬 사용=퀄러티 증가" 핵심 가정 = 모든 skill 호출 ROI 양수. 검증 안 됨.
- ROI 높은 skill (검증·게이트류): 자동화 효과 큼
- ROI 낮은 skill (희귀 유틸): 강제 시 토큰 낭비

권고: A1 채택하되 PoC에서 skill별 ROI 측정 → ROI 음수 자동 강등.

## §3 비재무적 자산
**음(-) 영향이 더 큼:**
1. **신뢰성 1순위**: FP 1회당 신뢰 손실 비대칭. 누적 시 "끄기" 결론 → 매몰비용
2. 학습 루프 영향 (학습보다 활용 우선 = Master 수용된 trade-off)
3. 메타 역량 — 자동발동 거버넌스 부채 (D-125 anchor governance 확장 필요)

## §4 결정축 권고

### B축 — 트리거 엔진 위치
| 옵션 | 운영비 | 유지비 | 권고 |
|---|---|---|---|
| PreToolUse hook 단일 | 낮음 | 낮음 | **권고** |
| skill 자체 분산 | 매 호출 시 누적 | 높음 | 비권고 |

### D축 — false positive
| 옵션 | 차단 비용 | 신뢰 손실 |
|---|---|---|
| 즉시 차단 | 높음 | 높음 (FP 누적 시) |
| warn-only fallback | 낮음 | 낮음 |
| Master 게이트 | 중간 | 중간 |

→ **warn-only fallback 권고**. PoC에서 FP율 측정 후 임계값 이하 검증되면 hard block 전환. PD-052 선례.

## 권고 요약
1. A1 채택 + ROI 측정 메커니즘 필수
2. B축 → PreToolUse hook 단일
3. D축 → warn-only fallback
4. 숨은 비용 명문화 — D-125 anchor governance 흡수
5. PoC 측정 지표: skill별 발동 횟수·FP율·토큰 증가율

```
[ROLE:fin] cst_acc: roi_dl:3 rdn_cal:Y cst_alt:Y
```
