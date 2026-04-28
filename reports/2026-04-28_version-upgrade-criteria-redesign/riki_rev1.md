---
session: session_127
topic: topic_125
role: riki
rev: 1
date: 2026-04-28
---

# Riki 리스크 감사

## R-01 🔴 판단 기준 모호성 → 버전 인플레이션

**리스크:** 최소 인정 임계값 없으면 매 세션 bump 가능.

**Mitigation:** CLAUDE.md 카테고리별 최소 인정 임계값 기술어 추가.

**→ 해소:** 세션당 +0.1 캡으로 구조적 통제. 인정 임계값 논쟁 불필요.

## R-02 🟡 Ace 누락 → 공백 누적 구조적 재현

**리스크:** versionGapCount 경고 트리거 없음.

**Mitigation:** N=3 연속 null 시 브리핑 경보 제안.

**→ 해소:** Master 결정 — 경고 없음. +0.1 캡이 충분한 안전장치.

## R-03 🟡 증분 단위 의미 희석

**리스크:** 같은 크기(+0.001)가 다른 의미 공존.

**Mitigation:** versionBumpReason 레이블로 성격 분리. 크기 재정의 불필요.

**→ 해소:** versionBump.reason 필드가 레이블 역할 담당.

## 종합

세 리스크 모두 versionBumpReason 필드 위에서 해소. +0.1 캡이 R-01/R-02 구조적 안전장치로 작동.
