---
role: arki
topic: topic_183
session: session_216
turnId: 11
invocationMode: subagent
date: 2026-05-09
phase: debate
round: 2
subject: Grade 재정의 — 새 C 정의 초안
---

# Arki — Round 2: Grade 재정의

## 1. Round 1 권고 vs Master 제안 호환성

Round 1 Arki 입장("C 유지 + Dev-pull Arki 호출")과 Master 제안("Dev 고정 아닌 경량 처리 + 필요 역할 호출")은 **완전 호환**이다.

단, "Dev 고정 아닌"의 의미는 "Dev 후보 제외"가 아니라 "Dev가 기본값이되 경직 고정이 아님"으로 읽어야 한다. "고정 해제"의 의미 = Dev가 아닌 역할이 선두가 될 수 있는 진입로를 만드는 것.

## 2. 새 C 역할 호출 구조

subjectType에 따라 첫 주자와 호출 역할이 달라진다.

| subjectType | 첫 주자 | 추가 호출 역할 | 트리거 조건 |
|---|---|---|---|
| `execution` (구현·패치·설정 변경) | Dev | Arki (선택) | 파일 간 의존 존재 or 스키마 영향 |
| `design-lite` (경량 구조 결정) | Arki | Dev (의무) | Arki 발언 시 자동 |
| `decision-simple` (단일 판단, 역할 필요) | Ace 또는 Riki | Dev (구현 필요 시) | 결정 파급이 단일 파일 이내 |

Nexus가 `/open` 시점에 subjectType을 판정한다.

## 3. B vs 새 C 경계 — 단일 기준

**구조적 파급 범위(structural blast radius)**: 변경이 직접 영향을 주는 컴포넌트 레이어 종류 수.

- **B (blast_radius ≥ 2)**: 변경이 2개 이상의 독립 컴포넌트·스키마·정책에 닿는다.
- **C (blast_radius ≤ 1)**: 변경이 단일 컴포넌트 내부 또는 단일 경계에서 완결된다.

파일 수는 보조 신호. blast_radius 우선, 파일 수 보조.

blast_radius 산출 방식: 변경 파일들이 속하는 컴포넌트 레이어(hook·script·schema·memory·app) 종류 수. 2종 이상이면 radius=2+.

## 4. 새 C 정의 초안

**C = 단일 컴포넌트 경계 내 완결되는 경량 작업. 구조적 파급 없음 or 파급이 단일 경계 이내.**

**역할 구성:**
- Dev (기본 참여)
- Arki (design-lite subjectType, 또는 Dev가 의존 감지 시 풀 호출)
- Riki (리스크 있다고 Dev·Arki가 판단 시 호출)
- Ace (단일 결정이 원칙 충돌 유발 시 호출)

**첫 주자 결정 방식:**
Nexus가 subjectType 판정 → `execution` → Dev 선두 / `design-lite` or `decision-simple` → 해당 역할 선두.

**Arki 호출 트리거:**
1. `design-lite` subjectType → 자동 선두
2. Dev가 "파일 간 의존 발견" 또는 "스키마 영향 있음" 선언 → 즉시 풀 호출
3. blast_radius 사후 확인에서 2+ 판정 → B 격상

**Arki 미호출 조건:**
- `execution` subjectType + blast_radius ≤ 1 + Dev 의존 미감지

## 자기감사 (3라운드)

**1차:**
- [structuration] subjectType 4종 신규 필드 — blast_radius 판정 방식 추론 부담. `MUST_BY_N=10`
- [hardcoding] "2종 이상" 수치 → dispatch_config.json에 blast_radius_threshold: 2 명문화 필요. `MUST_BY_N=10`
- [efficiency] open-question은 C 내부 케이스 아님 → 표에서 제거. `SHOULD`
- [extensibility] subjectType이 Grade와 직교 독립 필드가 되어야 함. `MUST_BY_N=30`

**2차:**
- blast_radius 레이어 목록(hook·script·schema·memory·app)이 CLAUDE.md 미정의. Nexus 임의 해석 위험. `MUST_NOW` — 채택 시 레이어 enum dispatch_config.json 명문화 선행 필요.

**3차:**
- subjectType과 파일 수 충돌 케이스(design-lite + 파일 8개) → blast_radius 우선 원칙이 명시되어야 함. `MUST_BY_N=10`

**종료:** 3차 완료. 5건 발견. 즉시 차단 이슈 없으나 채택 시 레이어 enum 명문화 선행 필요.

---

[ROLE:arki]
# self-scores
aud_rcl: 1.00
str_fd: 5
spc_lck: N
sa_rnd: 3
