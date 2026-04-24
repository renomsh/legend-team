---
session_id: session_094
topic: pd023-resume-self-scores-mvp
role: fin
rev: 1
date: 2026-04-24
---

# Fin — 3세션 Summary 비용·이득 분석

## 비용 (directional)
- sync-system-state.ts 확장: 1세션 구현.
- session_index / topic_index 스키마 확장: 1세션 내 병행.
- 운영 오버헤드: 세션당 수 KB JSON 쓰기. 무시 가능.
- /open 토큰 추가 로드: 3세션 × ~200자 ≈ 600자. 기존 fast-path 대비 +5% 미만.

## 이득
- 토큰 효율화로 인한 정보 휘발 차단 (Master 명시 지적).
- 구현 지연 시 context loss risk 감소.
- 다중 세션 토픽 연속성 확보 — 특히 implementation 토픽에서 전 세션 결정 재확인 비용 축소.

## ROI 판정
- 단일 ROI 배수 제시 보류 — 외부 앵커 없는 상태에서 17.5× 같은 수치 제시는 위험(교훈 박제: fin_memory).
- 정성적 결론: **구현 가치 > 비용** 명확. 즉시 착수 권고.
- Grade D 토픽 self-scores 대상 외 명문화(D-079)로 participation 분모 왜곡도 동시 해소.

## 캐비엇
- 3개 초과 session 저장 시 누적 효용 체감. 3개로 고정 권장.
