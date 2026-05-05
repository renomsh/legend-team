# -*- coding: utf-8 -*-
"""
팀 미배정 기업명 → DB 기업명 퍼지 매핑
1. (주)/㈜/주식회사 등 법인 표시 제거
2. 한↔영 약어 정규화
3. 80% 이상 유사도 매핑 후 사용자 확인
"""
import sys, io, re
import pandas as pd
from difflib import SequenceMatcher

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

xl = pd.ExcelFile('D:/Projects/cost/비용분석_2025.xlsx')
df_ci = xl.parse(1)
df_ci.columns = ['기업명','연매출','총직접비','팀','영업대표','사업유형','공헌이익','공헌이익율']

# DB에 있는 기업 (팀 있는 것 = 매출 있는 정식 고객사)
db_companies = df_ci[df_ci['팀'].notna() & (df_ci['팀'] != '')]['기업명'].dropna().unique().tolist()

# 팀 미배정 기업
unassigned = df_ci[
    df_ci['팀'].isna() | (df_ci['팀'] == '')
].copy()
unassigned['억_비용'] = (unassigned['총직접비'] / 1e8).round(2)
unassigned = unassigned[unassigned['억_비용'] >= 0.1].sort_values('총직접비', ascending=False)

# ── 정규화 함수 ──────────────────────────────────────────────
# 한↔영 공통 치환 테이블 (양방향)
ABBR = [
    ('GS', '지에스'), ('KB', '케이비'), ('KT', '케이티'),
    ('LH', '엘에이치'), ('NH', '엔에이치'), ('IBK', '아이비케이'),
    ('LG', '엘지'), ('SK', '에스케이'), ('HD', '에이치디'),
    ('HDC', '에이치디씨'), ('KGC', '케이지씨'), ('SGI', '에스지아이'),
    ('LF', '엘에프'), ('KDB', '케이디비'), ('KCC', '케이씨씨'),
    ('HRD', '에이치알디'), ('NMC', '엔엠씨'), ('CP', '씨피'),
    ('FS', '에프에스'), ('GS칼텍스', '지에스칼텍스'),
    ('GS건설', '지에스건설'), ('GS리테일', '지에스리테일'),
    ('KT&G', '케이티앤지'), ('KT엔지니어링', '케이티엔지니어링'),
]

REMOVE_PATTERNS = [
    r'\(주\)', r'㈜', r'주식회사', r'\(사\)', r'\(재\)', r'재단법인\s*',
    r'사단법인\s*', r'\s*\(이러닝\)', r'\s*\(HR.*?\)', r'\s*\(25년\)',
    r'\s*\(법정\)', r'\s*\(단과\)', r'\s*\(인재원\)',
    r'\s+', r'[·•]',
]

def normalize(name: str) -> str:
    s = str(name).strip()
    # 법인/괄호 표시 제거
    for pat in REMOVE_PATTERNS:
        s = re.sub(pat, '', s)
    s = s.strip()
    # 한↔영 정규화: 영→한 먼저, 그 다음 한→영 (둘 다 소문자 비교용으로 영 우선)
    sl = s.upper()
    for eng, kor in ABBR:
        sl = sl.replace(eng, kor)
    # 소문자·공백 정리
    return re.sub(r'\s+', '', sl).upper()

def similarity(a: str, b: str) -> float:
    na, nb = normalize(a), normalize(b)
    return SequenceMatcher(None, na, nb).ratio()

# ── 매칭 ────────────────────────────────────────────────────
THRESHOLD = 0.80
results = []

for _, row in unassigned.iterrows():
    src = row['기업명']
    best_score, best_match = 0.0, None
    for db in db_companies:
        sc = similarity(src, db)
        if sc > best_score:
            best_score, best_match = sc, db
    if best_score >= THRESHOLD:
        results.append({
            '원본(미배정)': src,
            '제안_DB기업명': best_match,
            '유사도': round(best_score, 3),
            '비용(억)': row['억_비용'],
        })

res_df = pd.DataFrame(results).sort_values('유사도', ascending=False)
print(f"매핑 후보 (유사도 {THRESHOLD*100:.0f}%↑): {len(res_df)}건\n")
print(res_df.to_string(index=False))
print(f"\n총 비용: {res_df['비용(억)'].sum():.2f}억")
