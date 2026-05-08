---
role: edi
topic: topic_183
session: session_216
phase: synthesis
revision: 1
date: 2026-05-09
---

# PD-057 Grade 임계 재검토 — 종합 산출물

## 결론 1: 주제 유형별 역할 순서 원칙 (2축 판정)

### 목적

Grade가 역할 로스터를 결정하는 유일 축이었던 기존 체계에, 토픽 성격에 따른 역할 순서 보조 패턴을 추가한다. Nexus 컨텍스트 판단이 항상 우선이며 패턴은 보조 도구다.

### 2축 판정

| 축 | 값 | 설명 |
|---|---|---|
| 축 1 (불확실성) | `closed` | 목표·전제 닫혀 있음 — 무엇을 할지 명확 |
| 축 1 (불확실성) | `open` | 목표 불확실 — 탐색·정의가 선행 필요 |
| 축 2 (결과물) | `decision` | 의사결정이 주 목표 |
| 축 2 (결과물) | `execution` | 구현·산출이 주 목표 |

### 4패턴 역할 순서

| | closed | open |
|---|---|---|
| **decision** | Arki→Fin→Riki→Ace(선택)→Edi | Jobs→Ace→Riki→Fin→Edi |
| **execution** | Arki→Dev→Riki→Edi | Jobs→Ace→Arki→Dev→Edi |

### 안전장치 3조건

1. CLAUDE.md 섹션 첫 줄: "Nexus 판단 보조 도구. Nexus 컨텍스트 판단이 패턴보다 우선"
2. 미매칭 시 Nexus open-form 확인 질문 (closed-form 금지 명시)
3. 불확실 → Grade A 기본값 상향

### Arki 5종 subjectType 위상

dispatch 기준 아님. 세션 출력 레이블로만 병존. 역할 로스터 결정은 Grade + 2축 판정이 담당.

---

## 결론 2: Grade 5단계 재정의 (D-172)

### 공통 원칙

Grade = 결정 파급 범위 × 불확실성 × 2축 적용 여부

### Grade 테이블

| Grade | 정의 | 파급 범위 | 2축 적용 | 첫 주자 | 기본 역할 구성 |
|---|---|---|---|---|---|
| **S** | 오픈 탐색형. Master 명시 선언 전용 | 조직·전략 전체 | full | Jobs(`/jobs-framing` 명시 시) or Ace | Jobs→Ace→Arki·Riki→Fin→Edi. Nova·Vera 선택. **Jobs: `/jobs-framing` 명시 호출 시만. S 선언 = Jobs 자동 트리거 아님.** **Nova: Riki 🔴 2개+ 미해소 OR 역할 교착 → Nexus 추천. Master 승인 필요.** |
| **A** | 닫힌 실행형. 결과가 다수 시스템 인풋 | 시스템 경계 횡단 | full | 2축 패턴 기반 | 2축 판정→패턴 적용→Ace(선택,`/ace-synthesis`)→Dev→Edi |
| **B** | 명확 결정건. blast_radius ≥ 2. 결과가 다른 시스템·결정 인풋 | 모듈 경계 횡단 | 2축 판별 | Arki | Arki→Riki→Ace(선택,`/ace-synthesis`)→Dev→Edi |
| **C** | 경량 처리. blast_radius ≤ 1. 단일 모듈 내 완결 | 단일 모듈 내 | 신호 매칭 | Dev 기본 (신호에 따라 가변) | Dev 기본 + 신호 조건부 선제 호출 |
| **D** | 명백 단순. D 키워드 매칭 | 로컬 | 없음 | Dev | Dev 직행 (Edi 생략 가능). 파일 간 의존 감지 시 → C 격상 |

### B vs C 경계 단일 기준

> **blast_radius**: 변경이 닿는 컴포넌트 레이어 종류 수. ≥ 2 → B. ≤ 1 → C. 파일 수는 2차 신호.

### C grade 역할 호출 신호

| 신호 | 호출 역할 |
|---|---|
| 파일 간 의존 관계 변경 or 스키마 영향 | Arki (선두로) |
| 신규 인터페이스·API 표면 변경 | Arki |
| 비용·자원 조정 포함 | Fin |
| 리스크 명시 ("테스트 없음", "레거시 건드림") | Riki |
| 위 신호 없음 | Dev 단독 |
| blast_radius 사후 2+ 확인 | → B 격상 |

---

## decision_ledger 등록 대상

- **D-172**: 주제 유형별 역할 순서 원칙 도입 (2축 판정 패턴)
- **D-173**: Grade 5단계 재정의 (C 재정의, B vs C blast_radius 경계, S 로스터 확정)

---

## selfScores

```yaml
scc: Y
cs_cnt: 3
art_cmp: 1
gap_fc: 0
gp_acc: 0.9
```
