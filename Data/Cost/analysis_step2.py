#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
2025 비용분석 Step2 — 심층 분석
입력: 비용분석_2025_ver2.0.xlsx, ♣2025년_databook_취합...xlsm
출력: 분석_2025_step2.xlsx (13개 시트)
"""

import sys, io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

import pandas as pd
import numpy as np
import warnings
warnings.filterwarnings('ignore')

BASE = 'D:/Projects/cost'
SRC_XLSX = f'{BASE}/비용분석_2025_ver2.0.xlsx'
DATABOOK = f'{BASE}/♣2025년_databook_취합_260129_25년마감 완료_맵핑작업용.xlsm'
OUT = f'{BASE}/분석_2025_step2.xlsx'

RAW_COLS = ['출납월','거래처','계정과목','비용분류','고객사','배분방법','CP사','금액','원본금액','적요']

# ============================================================
# 고객사 정규화 (계열 통합)
# ============================================================
import re

# 괄호/구분자 앞의 본명으로 병합될 때, 다른 기업과 혼동을 막기 위한 보호 목록
_PROTECT_NAMES = {
    '현대자동차그룹',  # 현대자동차와 분리 유지
}

# 수동 병합: 정규화 결과를 특정 이름으로 덮어씀 (매출·비용이 서로 다른 이름으로 흩어진 경우)
_MANUAL_MERGE = {
    '동원산업': '동원그룹',                            # 비용은 동원산업, 매출은 동원그룹에 집중
    '한국기술교육대학교 온라인평생교육원': '한국기술교육대학교',  # 본교-산하기관 통합
    '고려아연온산제련소': '고려아연',                    # 사업장 통합
}

# LS 그룹 전체 — 영·한 계열명 통합 (지엘에스이·천일티엘에스 등 무관 기업 제외)
_LS_GROUP_MEMBERS = {
    'LS', 'LS일렉트릭', 'LS전선', 'LS엠트론', 'LS MnM', 'LS메탈',
    'LS이모빌리티솔루션', 'LS EV Korea', 'LS ITC',
    '엘에스메카피온_A25', '엘에스지스카이셰프코리아_A25', '엘에스지스카이세프코리아',
    '엘에스웨어', 'LS그룹공통연수원',
}
for _n in _LS_GROUP_MEMBERS:
    _MANUAL_MERGE[_n] = 'LS그룹'

def normalize_company(name):
    """고객사명 정규화 — 괄호/대괄호 이전까지만 + 공백 정리 + 수동 병합"""
    if name is None or (isinstance(name, float) and pd.isna(name)):
        return name
    s = str(name).strip()
    # 수동 병합 우선 적용 (원본 이름 기준)
    if s in _MANUAL_MERGE:
        return _MANUAL_MERGE[s]
    if s in _PROTECT_NAMES:
        return s
    # [코드] 프리픽스 제거
    s = re.sub(r'^\[\d+\]\s*', '', s)
    # 괄호 이전까지 (첫 '(' 또는 ' (' 기준)
    cut = re.split(r'\s*\(', s, maxsplit=1)[0].strip()
    # 후행 법인표기 제거: (주), ㈜, " 주식회사" — 단독 "주"는 절대 제거 금지
    cut = re.sub(r'\s*\(주\)\s*$', '', cut).strip()
    cut = re.sub(r'\s+주식회사\s*$', '', cut).strip()
    cut = cut.replace('㈜', '').strip()
    result = cut if cut else s
    # 정규화 후에도 수동 병합 체크
    return _MANUAL_MERGE.get(result, result)

# ============================================================
# 거래처 카테고리 규칙 (다축 분류)
# ============================================================

# 내부 계열사
INTERNAL_KW = ['휴넷이지런','이지런','휴넷씨이오','휴넷인터내셔널','휴넷러닝스페이스']

# CP사 (이러닝 콘텐츠 공급사) — 주요 CP사 키워드
CP_KW = [
    '에듀윌','캐럿','시대고시','시대에듀','데이원','메가스터디','해커스','EBS','한국교육방송',
    '교보문고','북모닝','유밥','사이버출판','모아팩토리','모아교육','고려아카데미','제이알씨','JRC',
    '큐리어슬리','마켓디자이너스','알엠피','이패스','가람디엠씨','케이지에듀원','KG에듀원',
    '민병철','스픽','ECK','365E&M','삼육오이엔엠','사회능력개발원','한국사회능력개발원',
    '네오넷','현대씨앤알','현대C&R','이씨케이','알지비',
]

# 라이브/하이브리드러닝 강사·운영
LIVE_ACCT = ['하이브리드러닝']

# 강사료 풀 / 위탁 강사사
INSTRUCTOR_KW = [
    '티와이컴퍼니','에이치알커넥트','HR커넥트','루멘컨설팅','스코프랩스','로이컨설팅',
    '휴먼다이나믹','유니타스','커리어케어','휴넷컨설팅','인제니움','헤이조이스',
    '애자일아카데미','플랜비디자인','이음파트너스','한국리더십센터','와이즈먼코리아',
]

# 콘텐츠 개발 (촬영·편집·제작·스튜디오)
CONTENT_KW = [
    '스튜디오','프로덕션','미디어','필름','영상','에이전시','컨텐츠','콘텐츠',
    '디자인','그래픽','애니메이션','일러스트','편집',
]

# 시스템·IT·라이선스
IT_KW = [
    '시스템','테크','소프트','SW','솔루션','네트워크','IT','전산','클라우드','AWS','Azure',
    '라이선스','라이센스','Harvard','HBR','MS','Microsoft','구글','Google','Adobe','Zoom',
    '웹','모바일','앱','플랫폼','소프트웨어',
]

# 운영 위탁 (LH/KB위탁 등)
OPERATION_KW = [
    '비즈엠디지','비즈니스임팩트','유앤알','와우디랩','지에스엠비즈','스피쿠스',
]

# 여행/행사
TRAVEL_KW = [
    '여행사','트래블','투어','호텔','리조트','펜션','항공','에어','ATC','델타','KAL',
]

# 판매장려금 (기프티콘/상품권)
GIFT_KW = [
    '기프티콘','상품권','해피머니','컬쳐랜드','문화상품권','쿠폰','GS25','CU','기프트',
]

def categorize_vendor(row):
    v = str(row['거래처'])
    acct = str(row['계정과목'])
    method = str(row.get('배분방법',''))
    note = str(row.get('적요',''))

    # 1) 내부계열사
    if any(k in v for k in INTERNAL_KW) or '내부계열사' in str(row.get('비용분류','')):
        return '내부계열사'
    # 2) BPO 인건비
    if 'BPO' in str(row.get('비용분류','')) or v == 'BPO인건비':
        return 'BPO인건비'
    # 3) 콘텐츠개발 (비용분류 기반 우선)
    if '콘텐츠개발' in str(row.get('비용분류','')):
        return '콘텐츠개발(이지런)'
    # 4) 라이브 (계정 기반)
    if acct in LIVE_ACCT or '하이브리드' in acct:
        return '라이브/하이브리드'
    # 5) CP사 (거래처 키워드 또는 CP배분)
    if 'CP' in method or any(k in v for k in CP_KW):
        return 'CP사(이러닝콘텐츠)'
    # 6) 판매장려금 (기프티콘)
    if any(k in v for k in GIFT_KW):
        return '판매장려금(기프티콘)'
    # 7) 운영위탁
    if any(k in v for k in OPERATION_KW):
        return '운영위탁'
    # 8) 강사료 풀
    if any(k in v for k in INSTRUCTOR_KW):
        return '강사료풀(위탁사)'
    # 9) IT/시스템/라이선스
    if any(k in v for k in IT_KW):
        return 'IT/시스템/라이선스'
    # 10) 여행/행사
    if any(k in v for k in TRAVEL_KW):
        return '여행/행사'
    # 11) 콘텐츠 스튜디오/제작
    if any(k in v for k in CONTENT_KW):
        return '콘텐츠외주(제작)'
    # 12) 개인(보통 강사) 추정 — 3-4자 한글 이름
    import re
    if re.fullmatch(r'[가-힣]{2,4}', v):
        return '강사(개인)'
    return '기타'


# ============================================================
# 1. 원본 로딩
# ============================================================

def load_all():
    print('[로딩] 직접비 통합 RAW ...')
    raw = pd.read_excel(SRC_XLSX, sheet_name=0)
    raw.columns = RAW_COLS
    raw['금액'] = pd.to_numeric(raw['금액'], errors='coerce').fillna(0)
    print(f'  RAW rows={len(raw):,}, 금액합={raw["금액"].sum()/1e8:.2f}억')

    print('[로딩] 기업별_공헌이익 (+ BPO 보정 + 계열통합) ...')
    cm_raw = pd.read_excel(SRC_XLSX, sheet_name='기업별_공헌이익')
    cm_raw.columns = ['고객사','매출','직접비_기존','팀','영업대표','사업유형','공헌이익_기존','공헌이익율_기존']
    # BPO 고객사별 집계 후 직접비에 추가 (원본이름 기준)
    bpo = raw[raw['비용분류']=='직접비(BPO)'].groupby('고객사')['금액'].sum().rename('BPO금액')
    cm_raw = cm_raw.merge(bpo, left_on='고객사', right_index=True, how='left')
    cm_raw['BPO금액'] = cm_raw['BPO금액'].fillna(0)
    cm_raw['직접비_항목'] = cm_raw['직접비_기존'] + cm_raw['BPO금액']
    # 정규화(계열 통합)
    cm_raw['정규고객사'] = cm_raw['고객사'].apply(normalize_company)
    # 팀/사업유형은 최대매출 고객사 기준으로 대표값
    top_team = cm_raw.sort_values('매출', ascending=False).drop_duplicates('정규고객사')[['정규고객사','팀','영업대표','사업유형']]
    cm = cm_raw.groupby('정규고객사').agg(
        원본기업수=('고객사','nunique'),
        매출=('매출','sum'),
        직접비=('직접비_항목','sum'),
    ).reset_index().rename(columns={'정규고객사':'고객사'})
    cm = cm.merge(top_team.rename(columns={'정규고객사':'고객사'}), on='고객사', how='left')
    cm['공헌이익'] = cm['매출'] - cm['직접비']
    cm['공헌이익율'] = np.where(cm['매출']>0, cm['공헌이익']/cm['매출'], np.nan)
    print(f'  원본기업 {len(cm_raw):,}개 → 통합 {len(cm):,}개 ({len(cm_raw)-len(cm)}개 감소)')
    print(f'  매출합 = {cm["매출"].sum()/1e8:.2f}억, 직접비(+BPO) = {cm["직접비"].sum()/1e8:.2f}억, '
          f'공헌이익 = {cm["공헌이익"].sum()/1e8:.2f}억, 이익율 = {cm["공헌이익"].sum()/cm["매출"].sum()*100:.1f}%')
    print(f'  BPO 반영 = {(cm_raw["BPO금액"]>0).sum()}건, BPO합 = {cm_raw["BPO금액"].sum()/1e8:.2f}억')
    # 통합 예시 확인
    merged_groups = cm_raw.groupby('정규고객사')['고객사'].nunique()
    top_merged = merged_groups[merged_groups>=3].sort_values(ascending=False).head(10)
    if len(top_merged)>0:
        print(f'  통합 상위: {dict(top_merged)}')

    print('[로딩] 고객사_마스터 (월별매출) ...')
    sales_m = pd.read_excel(SRC_XLSX, sheet_name='고객사_마스터')

    print('[로딩] 데이터북 (확정) ...')
    db = pd.read_excel(DATABOOK, sheet_name=2, header=3)
    cols = ['_x','팀','기업명','고객사','고객코드','사업유형','매출_23','매출_24','상태',
            '매출합계','확정일','비고','m1','m2','m3','m4','m5','m6','m7','m8','m9','m10','m11','m12',
            'sum25','sum26','sum27','r1','r2']
    db.columns = cols[:len(db.columns)]
    db_conf = db[db['상태']=='01 확정'].copy()
    db_conf['매출합계'] = pd.to_numeric(db_conf['매출합계'], errors='coerce').fillna(0)
    for m in [f'm{i}' for i in range(1,13)]:
        db_conf[m] = pd.to_numeric(db_conf[m], errors='coerce').fillna(0)
    # 동일 정규화 적용
    db_conf['정규고객사'] = db_conf['고객사'].apply(normalize_company)
    print(f'  확정 레코드 = {len(db_conf):,}, 매출 = {db_conf["매출합계"].sum()/1e8:.2f}억')

    return raw, cm, sales_m, db_conf


# ============================================================
# 2. 시트별 분석
# ============================================================

def sheet_01_company(cm):
    """전체 기업 공헌이익 (이익율 내림차순, 매출 > 0)"""
    df = cm[cm['매출']>0].copy()
    df['매출(억)'] = (df['매출']/1e8).round(3)
    df['직접비(억)'] = (df['직접비']/1e8).round(3)
    df['공헌이익(억)'] = (df['공헌이익']/1e8).round(3)
    df['공헌이익율'] = (df['공헌이익율']*100).round(1)
    out = df[['고객사','원본기업수','팀','영업대표','사업유형','매출(억)','직접비(억)','공헌이익(억)','공헌이익율']]
    out = out.sort_values('매출(억)', ascending=False)
    return out


def sheet_02_biztype(db_conf, cm):
    """사업유형별 매출·직접비(매출비율 안분)·공헌이익"""
    # 기업별 총매출 (databook 정규고객사)
    co_rev = db_conf.groupby('정규고객사')['매출합계'].sum().rename('기업총매출')
    # 기업별 사업유형별 매출
    biz_rev = db_conf.groupby(['정규고객사','사업유형'])['매출합계'].sum().reset_index()
    biz_rev = biz_rev.merge(co_rev, on='정규고객사')
    biz_rev['매출비중'] = biz_rev['매출합계'] / biz_rev['기업총매출']
    # 기업별 직접비 (cm — 이미 정규고객사 기준 통합됨)
    co_cost = cm[['고객사','직접비']].rename(columns={'고객사':'정규고객사'}).copy()
    biz_rev = biz_rev.merge(co_cost, on='정규고객사', how='left')
    biz_rev['직접비'] = biz_rev['직접비'].fillna(0)
    biz_rev['배분직접비'] = biz_rev['직접비'] * biz_rev['매출비중']
    # 사업유형별 집계
    agg = biz_rev.groupby('사업유형').agg(
        기업수=('정규고객사','nunique'),
        매출=('매출합계','sum'),
        직접비=('배분직접비','sum'),
    ).reset_index()
    agg['공헌이익'] = agg['매출'] - agg['직접비']
    agg['공헌이익율'] = np.where(agg['매출']>0, agg['공헌이익']/agg['매출']*100, 0)
    agg['매출(억)'] = (agg['매출']/1e8).round(2)
    agg['직접비(억)'] = (agg['직접비']/1e8).round(2)
    agg['공헌이익(억)'] = (agg['공헌이익']/1e8).round(2)
    agg['공헌이익율'] = agg['공헌이익율'].round(1)
    out = agg[['사업유형','기업수','매출(억)','직접비(억)','공헌이익(억)','공헌이익율']]
    out = out.sort_values('매출(억)', ascending=False)
    return out


def sheet_03_team_biztype(db_conf, cm):
    """팀 × 사업유형 매출·이익율 교차"""
    co_rev = db_conf.groupby('정규고객사')['매출합계'].sum().rename('기업총매출')
    biz_rev = db_conf.groupby(['팀','정규고객사','사업유형'])['매출합계'].sum().reset_index()
    biz_rev = biz_rev.merge(co_rev, on='정규고객사')
    biz_rev['매출비중'] = biz_rev['매출합계'] / biz_rev['기업총매출']
    cm_m = cm[['고객사','직접비']].rename(columns={'고객사':'정규고객사'})
    biz_rev = biz_rev.merge(cm_m, on='정규고객사', how='left').fillna({'직접비':0})
    biz_rev['배분직접비'] = biz_rev['직접비'] * biz_rev['매출비중']
    agg = biz_rev.groupby(['팀','사업유형']).agg(매출=('매출합계','sum'), 직접비=('배분직접비','sum')).reset_index()
    agg['공헌이익'] = agg['매출'] - agg['직접비']
    agg['이익율'] = np.where(agg['매출']>0, agg['공헌이익']/agg['매출']*100, 0).round(1)
    agg['매출(억)'] = (agg['매출']/1e8).round(2)
    agg['직접비(억)'] = (agg['직접비']/1e8).round(2)
    agg['공헌이익(억)'] = (agg['공헌이익']/1e8).round(2)
    return agg[['팀','사업유형','매출(억)','직접비(억)','공헌이익(억)','이익율']]\
        .sort_values(['팀','매출(억)'], ascending=[True,False])


def sheet_04_margin_dist(cm):
    """이익율 구간별 분포"""
    df = cm[cm['매출']>0].copy()
    bins = [-np.inf, 0, 20, 40, 60, 80, np.inf]
    labels = ['적자(음수)', '0~20%', '20~40%', '40~60%', '60~80%', '80%+']
    df['이익율구간'] = pd.cut(df['공헌이익율']*100, bins=bins, labels=labels)
    agg = df.groupby('이익율구간').agg(
        기업수=('고객사','count'),
        매출=('매출','sum'),
        직접비=('직접비','sum'),
        공헌이익=('공헌이익','sum'),
    ).reset_index()
    agg['매출(억)'] = (agg['매출']/1e8).round(2)
    agg['직접비(억)'] = (agg['직접비']/1e8).round(2)
    agg['공헌이익(억)'] = (agg['공헌이익']/1e8).round(2)
    agg['매출비중%'] = (agg['매출']/agg['매출'].sum()*100).round(1)
    return agg[['이익율구간','기업수','매출(억)','직접비(억)','공헌이익(억)','매출비중%']]


def sheet_05_lowprofit(cm):
    """공헌이익율 <30% 또는 적자 기업 — 매출 1천만+"""
    df = cm[(cm['매출']>=1e7) & (cm['공헌이익율']<0.30)].copy()
    df['매출(억)'] = (df['매출']/1e8).round(3)
    df['직접비(억)'] = (df['직접비']/1e8).round(3)
    df['공헌이익(억)'] = (df['공헌이익']/1e8).round(3)
    df['공헌이익율'] = (df['공헌이익율']*100).round(1)
    df['손실규모(억)'] = ((df['직접비']-df['매출'])/1e8).round(3)
    out = df[['고객사','팀','사업유형','매출(억)','직접비(억)','공헌이익(억)','공헌이익율','손실규모(억)']]
    return out.sort_values('공헌이익(억)', ascending=True)


def sheet_06_account_direct(raw):
    """계정과목별 직접비 분해"""
    d = raw[raw['비용분류'].str.startswith('직접비', na=False)].copy()
    agg = d.groupby('계정과목')['금액'].agg(['sum','count']).reset_index()
    agg.columns = ['계정과목','금액','건수']
    agg['금액(억)'] = (agg['금액']/1e8).round(3)
    agg['비중%'] = (agg['금액']/agg['금액'].sum()*100).round(1)
    return agg[['계정과목','건수','금액(억)','비중%']].sort_values('금액(억)', ascending=False)


def sheet_07_account_common(raw):
    """계정과목별 공통비"""
    d = raw[raw['비용분류']=='공통비'].copy()
    agg = d.groupby('계정과목')['금액'].agg(['sum','count']).reset_index()
    agg.columns = ['계정과목','금액','건수']
    agg['금액(억)'] = (agg['금액']/1e8).round(3)
    agg['비중%'] = (agg['금액']/agg['금액'].sum()*100).round(1)
    return agg[['계정과목','건수','금액(억)','비중%']].sort_values('금액(억)', ascending=False)


def sheet_08_vendor_top(raw):
    """거래처 Top 100 (총액 + 카테고리 + 주계정)"""
    raw = raw.copy()
    raw['카테고리'] = raw.apply(categorize_vendor, axis=1)
    agg = raw.groupby('거래처').agg(
        총금액=('금액','sum'),
        건수=('금액','count'),
    ).reset_index()
    # 주 카테고리 / 주 계정 (거래처별 최빈/최대금액)
    top_cat = raw.groupby(['거래처','카테고리'])['금액'].sum().reset_index()\
                 .sort_values('금액', ascending=False).drop_duplicates('거래처')[['거래처','카테고리']]
    top_acct = raw.groupby(['거래처','계정과목'])['금액'].sum().reset_index()\
                  .sort_values('금액', ascending=False).drop_duplicates('거래처')[['거래처','계정과목']]
    agg = agg.merge(top_cat, on='거래처').merge(top_acct, on='거래처')
    agg['금액(억)'] = (agg['총금액']/1e8).round(3)
    agg = agg.sort_values('총금액', ascending=False).head(100)
    return agg[['거래처','카테고리','계정과목','건수','금액(억)']]


def sheet_09_category(raw):
    """카테고리별 집계 (전체)"""
    raw = raw.copy()
    raw['카테고리'] = raw.apply(categorize_vendor, axis=1)
    agg = raw.groupby('카테고리').agg(
        거래처수=('거래처','nunique'),
        건수=('금액','count'),
        금액=('금액','sum'),
    ).reset_index()
    agg['금액(억)'] = (agg['금액']/1e8).round(2)
    agg['비중%'] = (agg['금액']/agg['금액'].sum()*100).round(1)
    return agg[['카테고리','거래처수','건수','금액(억)','비중%']]\
            .sort_values('금액(억)', ascending=False)


def sheet_10_instructor(raw):
    """강사료 상세 (강사료풀·강사개인·라이브강사 거래처 Top)"""
    raw = raw.copy()
    raw['카테고리'] = raw.apply(categorize_vendor, axis=1)
    mask = raw['카테고리'].isin(['강사료풀(위탁사)','강사(개인)','라이브/하이브리드'])
    d = raw[mask]
    agg = d.groupby(['카테고리','거래처']).agg(
        건수=('금액','count'),
        금액=('금액','sum'),
    ).reset_index()
    agg['금액(억)'] = (agg['금액']/1e8).round(3)
    agg = agg.sort_values(['카테고리','금액'], ascending=[True,False])
    # 카테고리별 상위 30만 남기기
    agg = agg.groupby('카테고리').head(30).reset_index(drop=True)
    return agg[['카테고리','거래처','건수','금액(억)']]


def sheet_11_monthly(raw, db_conf):
    """월별 매출·비용·이익 추이"""
    # 매출 (databook 확정)
    m_cols = [f'm{i}' for i in range(1,13)]
    rev_m = db_conf[m_cols].sum()
    rev_m.index = [f'{i}월' for i in range(1,13)]
    # 비용 (raw 출납월)
    raw = raw.copy()
    raw['월'] = raw['출납월'].astype(str).str.extract(r'(\d+)').astype(float)
    cost_m = raw.groupby('월')['금액'].sum()
    direct_m = raw[raw['비용분류'].str.startswith('직접비', na=False)].groupby('월')['금액'].sum()
    common_m = raw[raw['비용분류']=='공통비'].groupby('월')['금액'].sum()
    out = pd.DataFrame({
        '매출(억)': (rev_m.values/1e8).round(2),
    }, index=[f'{i}월' for i in range(1,13)])
    for i in range(1,13):
        out.loc[f'{i}월','직접비(억)'] = round(direct_m.get(i,0)/1e8, 2)
        out.loc[f'{i}월','공통비(억)'] = round(common_m.get(i,0)/1e8, 2)
    out['공헌이익(억)'] = (out['매출(억)'] - out['직접비(억)']).round(2)
    out['공헌이익율%'] = (out['공헌이익(억)']/out['매출(억)']*100).round(1)
    out = out.reset_index().rename(columns={'index':'월'})
    return out


def sheet_12_top30(cm, db_conf, raw):
    """Top 30 기업 상세 (사업유형 breakdown + 주요 거래처)"""
    top = cm.sort_values('매출', ascending=False).head(30).copy()
    top['매출(억)'] = (top['매출']/1e8).round(2)
    top['직접비(억)'] = (top['직접비']/1e8).round(2)
    top['공헌이익(억)'] = (top['공헌이익']/1e8).round(2)
    top['이익율%'] = (top['공헌이익율']*100).round(1)
    # 사업유형 breakdown (정규고객사 기준)
    biz = db_conf.groupby(['정규고객사','사업유형'])['매출합계'].sum().reset_index()
    biz['매출(백만)'] = (biz['매출합계']/1e6).round(0).astype(int)
    biz_wide = biz[biz['정규고객사'].isin(top['고객사'])].groupby('정규고객사')\
        .apply(lambda g: ' | '.join([f"{r['사업유형']}:{r['매출(백만)']}M" for _,r in g.sort_values('매출합계',ascending=False).iterrows()]))\
        .rename('사업유형_Breakdown').reset_index().rename(columns={'정규고객사':'고객사'})
    # 주요 거래처 (raw는 원본 고객사명 — 정규화해서 매칭)
    raw2 = raw.copy()
    raw2['정규고객사'] = raw2['고객사'].apply(normalize_company)
    raw_v = raw2[raw2['정규고객사'].isin(top['고객사'])]
    vd = raw_v.groupby(['정규고객사','거래처'])['금액'].sum().reset_index()
    vd_top = vd.sort_values(['정규고객사','금액'], ascending=[True,False])\
        .groupby('정규고객사').head(5).groupby('정규고객사')\
        .apply(lambda g: ' | '.join([f"{r['거래처']}:{r['금액']/1e6:.0f}M" for _,r in g.iterrows()]))\
        .rename('주요거래처_Top5').reset_index().rename(columns={'정규고객사':'고객사'})
    out = top[['고객사','팀','영업대표','사업유형','매출(억)','직접비(억)','공헌이익(억)','이익율%']]\
        .merge(biz_wide, on='고객사', how='left')\
        .merge(vd_top, on='고객사', how='left')
    return out


# ============================================================
# Main
# ============================================================

def main():
    raw, cm, sales_m, db_conf = load_all()
    print()
    print('[시트 생성]')
    s01 = sheet_01_company(cm);              print(f'  01_기업별_공헌이익: {len(s01)}')
    s02 = sheet_02_biztype(db_conf, cm);     print(f'  02_사업유형별: {len(s02)}')
    s03 = sheet_03_team_biztype(db_conf, cm);print(f'  03_팀×사업유형: {len(s03)}')
    s04 = sheet_04_margin_dist(cm);          print(f'  04_이익율분포: {len(s04)}')
    s05 = sheet_05_lowprofit(cm);            print(f'  05_저이익기업: {len(s05)}')
    s06 = sheet_06_account_direct(raw);      print(f'  06_계정과목_직접비: {len(s06)}')
    s07 = sheet_07_account_common(raw);      print(f'  07_계정과목_공통비: {len(s07)}')
    s08 = sheet_08_vendor_top(raw);          print(f'  08_거래처_Top100: {len(s08)}')
    s09 = sheet_09_category(raw);            print(f'  09_카테고리집계: {len(s09)}')
    s10 = sheet_10_instructor(raw);          print(f'  10_강사비상세: {len(s10)}')
    s11 = sheet_11_monthly(raw, db_conf);    print(f'  11_월별추이: {len(s11)}')
    s12 = sheet_12_top30(cm, db_conf, raw);  print(f'  12_Top30상세: {len(s12)}')

    # 13. 비용투입순 전체 (비용 > 0 기업 전체, 직접비 내림차순)
    s13 = s01[s01['직접비(억)']>0].sort_values('직접비(억)', ascending=False).reset_index(drop=True)
    s13.insert(0, '순위', range(1, len(s13)+1))
    print(f'  13_비용투입순_전체: {len(s13)}')

    # 14. 영업대표별_전체 (팀대표별_실적 원본을 가공)
    rep = pd.read_excel(SRC_XLSX, sheet_name='팀대표별_실적')
    rep.columns = ['팀','영업대표','기업수','매출','직접비','공헌이익','공헌이익율']
    rep['매출(억)'] = (rep['매출']/1e8).round(3)
    rep['직접비(억)'] = (rep['직접비']/1e8).round(3)
    rep['공헌이익(억)'] = (rep['공헌이익']/1e8).round(3)
    rep['이익율%'] = (rep['공헌이익율']*100).round(1)
    s14 = rep[['팀','영업대표','기업수','매출(억)','직접비(억)','공헌이익(억)','이익율%']]\
            .sort_values('매출(억)', ascending=False).reset_index(drop=True)
    s14.insert(0, '순위', range(1, len(s14)+1))
    print(f'  14_영업대표별_전체: {len(s14)}')

    print(f'\n[출력] {OUT}')
    with pd.ExcelWriter(OUT, engine='openpyxl') as w:
        s01.to_excel(w, sheet_name='01_기업별_공헌이익', index=False)
        s02.to_excel(w, sheet_name='02_사업유형별', index=False)
        s03.to_excel(w, sheet_name='03_팀x사업유형', index=False)
        s04.to_excel(w, sheet_name='04_이익율분포', index=False)
        s05.to_excel(w, sheet_name='05_저이익기업', index=False)
        s06.to_excel(w, sheet_name='06_계정_직접비', index=False)
        s07.to_excel(w, sheet_name='07_계정_공통비', index=False)
        s08.to_excel(w, sheet_name='08_거래처_Top100', index=False)
        s09.to_excel(w, sheet_name='09_카테고리집계', index=False)
        s10.to_excel(w, sheet_name='10_강사비상세', index=False)
        s11.to_excel(w, sheet_name='11_월별추이', index=False)
        s12.to_excel(w, sheet_name='12_Top30_상세', index=False)
        s13.to_excel(w, sheet_name='13_비용투입순_전체', index=False)
        s14.to_excel(w, sheet_name='14_영업대표별_전체', index=False)
    print('완료.')

if __name__ == '__main__':
    main()
