---
topic: topic_003
title: 로컬 업그레이드 vs 서버 이전
agent: fin
revision: 1
date: 2026-04-04
status: completed
---

# FIN — 비용 분석

## 금전 비용
| 항목 | 비용 |
|---|---|
| GitHub Private Repo | $0 |
| Cloudflare Pages | $0 |
| Cloudflare Access | $0 (50명 무료) |
| **월간 합계** | **$0** |

## 시간 비용
| 블록 | 소요 |
|---|---|
| E-1 GitHub 연결 | ~15분 |
| E-2 빌드 스크립트 | ~30분 |
| E-3 뷰어 재설계 | ~3-4시간 |
| E-4 Cloudflare Pages | ~15분 |
| E-5 Access 인증 | ~20분 |
| E-6 자동 push | ~20분 |
| E-7 검증 | ~30분 |
| **합계** | **~5-6시간** |

## 숨은 비용 경고
1. push 습관 붕괴 → D-008 자동화로 해소
2. internal-viewer.html 적응 작업 → 다중 페이지 재설계로 대체
