---
turnId: 1
invocationMode: subagent
raterId: vera
date: 2026-04-25
topic: pd037-vera-signature-review
target: app/signature.html
---

# Vera 디자인 시스템 정합성 점검 — signature.html

## 1. 구조·레이아웃 판정

**그리드 구조: 정합.**
`grid-template-columns: 220px 1fr` — 사이드바 고정폭 220px, 콘텐츠 영역 fluid. 뷰포트 폭 1280px 기준 콘텐츠 영역 약 1024px 확보. 합리적.

**카드 그리드: 조건부 정합.**
`repeat(auto-fill, minmax(260px, 1fr))`, `gap: 14px` — 260px minmax는 1024px 콘텐츠에서 3열(~330px/열) 형성. gap 14px는 카드 간 호흡으로 충분하나 카드 내부 padding 14px와 동일하여 내·외부 리듬 구분이 약하다.

**판정 수치:**
- 사이드바 padding: `24px 16px` — 상하 24px/좌우 16px. 상하 과대, 좌우 협소. nav-item padding `9px 10px`과 조합 시 사이드바 상단 여백이 48px 수준으로 증가함. 수정 권고: `padding: 20px 12px`.
- 메인 콘텐츠 padding: `28px 36px 64px` — 좌우 36px는 220px 사이드바 대비 균형 적절. 하단 64px은 스크롤 종료 감지용 여백으로 허용.
- tier 마진: `margin-bottom: 36px` — 섹션 간 충분한 구분. 유지.

**height: 100vh + position: sticky 조합: 문제 없음.** 사이드바 sticky 유지는 긴 콘텐츠 탐색 시 필수 패턴.

---

## 2. 타이포 위계 판정

선언된 위계:
```
28px/800  — .s-h1 (페이지 제목)
14px/700  — .tier-h h2 (섹션 헤더, uppercase)
18px/700  — .card .name (카드 이름)
32px/800  — .card .score (핵심 수치)
13px/500  — .score .unit
11px/400  — .card .topMetric, .card .role, .card .ci
10px/500  — .table th
12px/400  — .table td, .s-sub
9px       — .nav-group, .badge
```

**판정: 위계 역전 1건 발견.**
`card .name 18px` > `tier-h h2 14px` — 카드명이 섹션 헤더보다 크다. 섹션 헤더는 uppercase + letter-spacing으로 시각적 권위를 보완하고 있으나, 순수 크기 위계상 역전이다. 허용 가능 수준이지만 `tier-h h2`를 16px로 올리면 위계가 명확해진다.

**판정: score 32px — 정합.**
카드 내 primary 지표를 32px/800으로 처리한 것은 정보 위계의 핵심 판단이다. unit(13px)과의 크기 차이(2.46배)가 충분히 강조점을 만든다.

**크기 밀집 구간 경고:**
9px(`nav-group`, `badge`) — macOS/Windows 기본 렌더링에서 9px 이하는 가독성 저하. `nav-group`은 10px, `badge`는 10px로 올릴 것을 권고.

**letter-spacing 일관성: 정합.**
`.08em` (tier-h, role, table th), `.14em` (crumb, nav-group) — 두 단계로 일관되게 사용. 혼용 없음.

---

## 3. 색 접근성 판정

### 역할 색상 × 배경(#000000) 대비값

| 역할 | 색상 | CR vs #000 | CR vs #0B0B0D (panel) | 판정 |
|---|---|---|---|---|
| ace | #FF6B6B | **7.57:1** | 7.09:1 | AA PASS |
| arki | #845EC2 | **4.36:1** | 4.08:1 | **AA LARGE only** — 소형 텍스트 미달 |
| fin | #00C9A7 | **9.91:1** | 9.28:1 | AA PASS |
| riki | #FFC75F | **13.59:1** | 12.72:1 | AA PASS |
| nova | #F9F871 | **18.69:1** | 17.50:1 | AA PASS |
| dev | #4D96FF | **7.12:1** | 6.67:1 | AA PASS |
| vera | #F472B6 | **7.93:1** | 7.42:1 | AA PASS |
| editor | #9CA3AF | **8.27:1** | 7.75:1 | AA PASS |

**주의: arki #845EC2 — AA 미달.**
소형 텍스트(11px/400, `.card .role`) 기준 4.5:1 필요. 실측 4.36:1. 0.14 부족.
`.role-dot`(8×8px 그래픽)은 비텍스트 UI 요소로 3:1 기준 적용 → 통과.
그러나 role 텍스트 레이블로 사용 시 미달. **arki 색상을 #9B6FF0으로 +밝기 조정 권고. 예상 CR: 5.2:1.**

### CSS 토큰 색상

| 토큰 | CR vs #000 | 판정 |
|---|---|---|
| --text (#F5F5F7) | 19.29:1 | PASS |
| --text-2 (#B8B8C0) | 10.66:1 | PASS |
| --text-3 (#6E6E78) | 4.16:1 | **경계값** — 소형 텍스트 미달 |
| --ok (#10B981) | 8.28:1 | PASS |
| --warn (#F59E0B) | 9.78:1 | PASS |
| --bad (#EF4444) | 5.58:1 | PASS |

**--text-3 (#6E6E78) — 소형 텍스트(9~11px) 사용 시 미달.**
`.nav-group`(9px), `.card .ci`(10px), `.card .role`(11px)에 text-3 적용 중. 9~10px 사용처는 크기 상향 또는 색 상향으로 해결. 권고: nav-group을 10px + #7E7E88로 조정(예상 CR ≈ 4.7:1).

---

## 4. Rams 관점: 제거 후보

**제거 후보 1: `.card:hover { border-color: rgba(139,92,246,.35) }`**
hover 효과가 violet 고정. 역할별 색상이 이미 정체성을 담당하므로 hover accent 색이 별도로 작동하면 색 체계가 분열된다. 카드 hover는 `border-color: rgba(255,255,255,.12)` 중성으로 교체하거나 제거. 정보를 전달하지 않는 장식 효과는 뺀다.

**제거 후보 2: `.active` nav-item의 gradient 배경**
`linear-gradient(135deg, rgba(139,92,246,.18), rgba(6,182,212,.12))` — 두 색의 혼합 gradient가 220px 사이드바에서 사실상 보이지 않는다(투명도 12~18%). 지각 효과 없이 코드 복잡도만 높인다. `background: rgba(139,92,246,.20)` 단색으로 교체.

---

## 5. Editor 인계 스펙 (diff 형태)

수정 사항 3건:

```diff
/* [1] arki 역할 색상 — AA 접근성 확보 */
/* JS ROLE_COLOR 수정 */
- arki:'#845EC2'
+ arki:'#9B6FF0'

/* [2] hover accent — 색 체계 일관성 */
- .card:hover{border-color:rgba(139,92,246,.35)}
+ .card:hover{border-color:rgba(255,255,255,.10)}

/* [3] nav-item active — gradient 제거 */
- .nav-item.active{background:linear-gradient(135deg,rgba(139,92,246,.18),rgba(6,182,212,.12));color:#fff}
+ .nav-item.active{background:rgba(139,92,246,.20);color:#fff}
```

선택적 권고 (기능 영향 없음):
```diff
/* [4] tier-h h2 — 위계 역전 해소 */
- .tier-h h2{font-size:14px; ...}
+ .tier-h h2{font-size:16px; ...}

/* [5] nav-group 최소 가독성 */
- .nav-group{font-size:9px; ...}
+ .nav-group{font-size:10px; ...}
```

필수 수정: [1][2][3]. 선택 수정: [4][5].

---

## 6. Self-score YAML

```yaml
self_score:
  raterId: vera
  date: 2026-04-25
  target: app/signature.html
  scores:
    tk_drf0: 0.88
    # 설계 토큰 정합성 — 대부분 일관. arki 미달 1건, text-3 경계 1건. 중대 위반 없음.
    spc_cpl: 0.91
    # 스펙 완결성 — 구조/타이포/색/Rams/diff 전항목 커버. 수치 근거 명시.
    tk_cns: 0.85
    # 토큰 일관성 — CSS 변수 체계 일관. hover gradient와 active gradient 혼용이 0.15 감점.
```
