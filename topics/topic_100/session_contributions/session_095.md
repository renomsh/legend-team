---
sessionId: session_095
topicId: topic_100
startedAt: 2026-04-25T02:30:00.000Z
closedAt: 2026-04-25T02:30:00.000Z
grade: A
rolesInOrder: []
turnsCount: 0
decisionIds: ["D-081", "D-082", "D-083", "D-084", "D-085", "D-086"]
nextAction: "PD-035"
---

## Summary

PD-035 구현 토픽. session_094에서 생성됨(D-080 Phase remapping). PD-031 근본 원인 해소용 — YAML 미기입은 role instruction 결함이 1차 원인.

## Decisions

- **D-081**: 8 persona 파일 전체에 `## Self-Score YAML 출력 계약` 섹션 삽입 완료. shortKey·weight·polarity 32건 동결. composite = Σ(normalized × weight), invoked-sessions-only. lower-better 정규화: 100 - raw_pct.
- **D-082**: dev.reg_zr 삭제. dev.hc_rt(하드코딩률, lower-better) 신설. 최종 4건: rt_cov 0.35(core) / gt_pas 0.25(core) / hc_rt 0.25(standard) / spc_drf 0.15(standard). DEV-LL-006 정합.
- **D-083**: nova.prm_rt deprecated(replacedBy: inv_prm). blnd_spt(Riki 미포착 블라인드 스팟 발견률) 신설. nova 3건: inv_prm 0.35(core) / blnd_spt 0.30(core) / spc_axs 0.35(extended).
- **D-084**: memory/roles/personas/role-vera.md 신규 생성. raterId=vera canonical 선언. designer는 레거시 role 분류로 격하. vera 3지표: tk_drf0 0.45(core) / spc_cpl 0.35 / tk_cns 0.20.
- **D-085**: editor.gp_acc: timing=deferred, settlementOffset=3, settlementStrategy=retroactive-injection. 현세션 자가 선언 단발 기록 방식으로 운용. 3세션 후 실측 주입 프로토콜은 향후 PD로 이연.
- **D-086**: turns 자동 산출·deferred-settlement 메커니즘 전량 스코프 제외(단순화). 참여 판정은 자가 선언 기준. 재정밀화 조건(기록률 ≥70% 3세션 관찰 후) 충족 시 별도 PD 오픈.

## Key Findings

- 관련 PD: PD-023 (parent canonical spec), PD-031 (실가동 감사 결과), PD-037 (Vera 페르소나 신규), PD-038 (probe 재설계, 장기).
- Grade A → L2 full framing, Ace 첫 주자.
- 구현 완료: 8 persona 파일 YAML 계약 + 32 shortKey + Vera canonical + 구조 통일. D-081~D-086 박제.

## Open Issues

_(없음)_

## Next Action

PD-035
