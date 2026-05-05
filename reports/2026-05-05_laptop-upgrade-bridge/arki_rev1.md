---
role: arki
topic: topic_171
topicTitle: "Legend Nexus PC 환경 — 노트북 하드웨어 업그레이드"
grade: B
date: 2026-05-05
turnId: 1
invocationMode: subagent
executionPlanMode: plan
rev: 1
---

# Arki — 구조 분석 & 실행계획 (rev1)

## Section 1. 구조 분석

### 1-a. 워크로드 프로파일링 — Legend Nexus 에이전트 시스템

**메모리 소비 패턴 (추정)**

- Claude Code 메인 프로세스: ~2–4GB RSS
- 서브에이전트 1개당: ~1–2GB (Node.js VM + 컨텍스트 버퍼)
- 병렬 4–6 서브에이전트 동시 구동 시: 8–16GB 추가 소비
- WSL2 기반 레이어 오버헤드: ~2–3GB 상시 예약

| 항목 | 추정 소비 |
|---|---|
| 기본 OS + 개발 툴 | 6–8 GB |
| Claude Code (메인) | 4 GB |
| 병렬 서브에이전트 4개 | 8 GB |
| 스토리지 I/O 버퍼 | 1–2 GB |
| 헤드룸(열화 대비) | 10–15 GB |
| **최소 실용 총계** | **29–37 GB → 64GB 목표** |

**CPU 특성:**
- Claude Code: 단일코어 IO-bound (LLM API 대기 지배)
- 서브에이전트 병렬화: 멀티코어 자연 분산 — P-코어 수보다 E-코어 효율 중요
- hook 체인: 단발 spike, 지속 부하 아님
- **결론**: 단일코어 클럭보다 P+E 코어 균형 + 지속 TDP 여유

**스토리지 I/O:** 소파일 다수 접근 패턴. NVMe SSD 이상 필수.

**열 부하:** 간헐적 고부하(서브에이전트 초기화) + 반복 spike 패턴. 지속 부하 시 쓰로틀링이 실질 성능 결정.

---

### 1-b. 플랫폼 구조 비교

| 비교 축 | Intel Core Ultra (Windows) | Apple M4 Pro (macOS) |
|---|---|---|
| 메모리 아키텍처 | CPU↔GPU 분리, LPDDR5x | Unified Memory 공유, LPDDR5X |
| 동일 용량 실효 대역폭 | ~68–100 GB/s | 273 GB/s (M4 Pro 48GB) |
| 메모리 최대 구성 | 96GB 가능 (일부 모델) | 64GB 상한 (M4 Pro) |
| WSL 의존성 | 네이티브 — 의존성 없음 | 불가 — VM 경유만 |
| 지속 부하 열 특성 | 쓰로틀링 위험 높음 | 저발열, 지속 부하 안정 |
| 하네스 마이그레이션 | 불필요 | 전면 재검토 필요 |

---

### 1-c. ≤2.5kg 후보 압축

**후보 A: Apple MacBook Pro 14" M4 Pro (2024)**
- 무게: 1.61kg
- 메모리: 최대 64GB Unified Memory
- 대역폭: 273 GB/s
- 구조적 비용: 하네스 마이그레이션 대형

**후보 B: LG 그램 Pro 16" (2025, Intel Core Ultra 7)**
- 무게: ~1.19–1.35kg
- 메모리: 32GB (64GB 지원 여부 확인 필요 — 추측)
- 대역폭: ~68 GB/s
- 열 마진: 초경량 섀시 — 지속 부하 쓰로틀링 리스크 높음
- 구조적 비용: 마이그레이션 0

---

## Section 2. 의존성 & 설계 제약

### Claude Code + WSL 구동 체계

```
현재 구조:
Windows Native
  └── Claude Code (Node.js)
        └── hooks/ (pre-tool-use-task.js 등)
              └── C:\Projects\legend-team\... (하드코딩 경로 다수)

macOS 전환 시:
macOS Native
  └── Claude Code (Node.js arm64)
        └── hooks/ 전면 경로 감사 필요
              └── /Users/.../legend-team/... (경로 재박제)
```

### 마이그레이션 복잡도 비교

| 항목 | Windows 유지 | macOS 전환 |
|---|---|---|
| 하네스 재검증 | 불필요 | 전면 필요 |
| 경로 재박제 | 없음 | 절대경로 전수 감사 |
| 브릿지 후 서버 이전 경로 연속성 | Windows→Linux (단절 2회) | macOS→Linux (Unix계열 연속성) |

---

## Section 3. 리스크 플래그 (Riki 심화 대상)

- **R-1**: 메모리 비가역성 — 솔더링 구조, 초기 용량 결정이 비가역
- **R-2**: 플랫폼 전환 시 hook 무음 실패 → 세션 기록 오염 전파
- **R-3**: 브릿지 3년 중 워크로드 점프 시 조기 교체 비용

---

## Section 4. 구조적 실행계획

### Phase 분해

| Phase | 내용 |
|---|---|
| Phase 0 | 현재 하네스 Windows 의존성 전수 감사 (절대경로, PowerShell 호출 등) |
| Phase 1 | Master 플랫폼 결정 (Phase 0 완료 후) |
| Phase 2 | 하드웨어 조달 + 구성 확정 (Phase 1 완료 후) |
| Phase 3 | 환경 구성 + 하네스 마이그레이션 (Phase 2 완료 후) |
| Phase 4 | 검증 게이트 — hook chain smoke test |
| Phase 5 | 구형 기기 정리 (Phase 4 통과 + Master 명시 승인 후) |

### 의존 그래프

```
Phase 0 → Phase 1(Master 결정)
                │
        [macOS] │ [Windows]
           ↓    ↓
         Phase 2 (조달)
              │
         Phase 3 (환경+마이그레이션)
              │
         Phase 4 (검증 게이트)
              │
         Phase 5 (구형 정리)
```

### 검증 게이트

| 게이트 | 통과 기준 |
|---|---|
| G0 | Phase 0 감사 보고서 완성 |
| G1 | Master 플랫폼 결정 선언 |
| G2 | 기기 수령 확인 |
| G3 | Node.js, git, Claude Code 정상 구동 |
| G4 | hook chain smoke test — session_index 정상 기록 |
| G5 | 구형 기기 정리 전 Master 명시 승인 |

### 롤백

- Phase 3 실패: 구형 기기 유지, 병행 운영
- G4 실패: 개별 디버깅, 전면 롤백 아님
- G5 이전: 구형 기기 반드시 보존

### 전제

- Phase 0 감사 = Arki/Dev 공동 수행
- 경로 추상화(환경변수 기반)는 Phase 3에서 선택지로 검토

### 중단 조건

- Phase 0에서 제거 불가 Windows 의존성 발견 시 → Phase 1 재심의
- G4 실패 3회 이상 → Dev 전면 감사 후 재시도

---

## 자기감사 결과

| 차수 | 발견 | ROI |
|---|---|---|
| 1차 | Phase 3-A·3-B 병렬화 미명시 | SHOULD |
| 1차 | 경로 추상화 확장 지점 미명시 | NICE |
| 2차 | Phase 5 "서버 실험용" 표현이 Scope Out과 모호하게 겹침 | SHOULD |
| 3차 | 발견 없음 | — |

감사 종료 조건 충족.
