---
role: arki
topic: PD-021 auto-model-switch 재구현 — Sonnet 메인 + Opus 서브에이전트
session: session_068
phase: analysis
date: 2026-04-22
---

# Arki — 구조 분석

## E1 즉시 검증
✅ Agent tool 스키마에 `model` 파라미터 존재 (enum: sonnet/opus/haiku). 단, 정확한 버전 강제는 에이전트 정의 파일 frontmatter 필요.

## 프로토콜 호환성 매트릭스
| 요소 | 파손 범위 |
|---|---|
| turns[] 기록 | 경미 — 타이밍만 이동 |
| reports/{role}_revN.md | 중간 — 서브 계약 필요 |
| Ace 종합검토 원문 참조 | 중간 — raw 반환 강제 필요 |
| 재호출 4조건 | 중간 — 컨텍스트 재주입 프롬프트 빌더 필요 |
| Master 중간 개입 (원자성) | 🔴 중대 — 서브 호출 중 중단 불가. 감내 가능하나 명시 결정 필요 |

## Grade × 모델 매핑안
| Grade | 메인 | 서브 |
|---|---|---|
| S | Opus | Opus (메인=Opus이므로 서브화 불필요) |
| A | Sonnet | Opus |
| B | Sonnet | Sonnet (서브 선택적) |
| C | Sonnet | 없음 |

## 서브 계약 권고
**A안**: 서브가 `reports/{slug}/{role}_revN.md` 직접 write. 메인은 파일 읽기만.

## 컨텍스트 재주입 비용
평균 Grade A 세션: 서브 4~6회 × ~20k 토큰 → 총 ~$5. Opus 통짜 대비 여전히 절감.

## 하드코딩 위험 구역 6개 (상세 설계 가이드)
Z-1 모델 식별자 / Z-2 Grade 매핑 / Z-3 역할 목록 / Z-4 컨텍스트 레이어 / Z-5 파일 경로 / Z-6 가드레일
→ `memory/shared/dispatch_config.json` 단일 원천으로 해결. 스킬·에이전트 파일 하드코딩 금지.

## 실행계획 (P1~P5)
- P1: 서브에이전트 정의 4종 (G1 검증)
- P2: 컨텍스트 빌더 + dispatcher 로직
- P3: opus-dispatcher 스킬 + CLAUDE.md (G3 검증)
- P4: 3세션 실측 검증
- P5: ace_memory 갱신 + PD-021 resolved
