# -*- coding: utf-8 -*-
import pandas as pd
import io, sys

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

xl = pd.ExcelFile('D:/Projects/cost/비용분석_2025.xlsx')
sheets = xl.sheet_names
print("시트 목록:", sheets)

# RAW 시트 (0번)
raw = xl.parse(0)
raw.columns = ['출납월','거래처','현금계정과목','비용분류_최종','고객사명','배분방법','CP사명','금액','원본금액','적요']

# DB 매출 고객사명 목록 파악 (공헌이익_기업별 시트)
df_rev = xl.parse(4)
df_rev.columns = ['사업부','코드','팀','담당자','기업명','월','매출']
company_with_revenue = set(df_rev['기업명'].dropna().unique())

# 팀 매핑 (기업명 → 팀)
team_map = df_rev.groupby('기업명')['팀'].first().to_dict()

# RAW에서 직접비+BPO만
cost_df = raw[raw['비용분류_최종'].isin(['직접비','BPO'])].copy()
cost_df['금액'] = pd.to_numeric(cost_df['금액'], errors='coerce').fillna(0)

# 고객사별 비용 합계
by_cust = cost_df.groupby('고객사명')['금액'].sum().reset_index()
by_cust.columns = ['고객사명','비용합계']
by_cust['억'] = (by_cust['비용합계'] / 1e8).round(2)
by_cust['팀'] = by_cust['고객사명'].map(team_map)
by_cust['매출있음'] = by_cust['고객사명'].isin(company_with_revenue)

# 팀 미배정 = 팀이 없고(NaN) 미분류/B2C/공통비 아닌 것
unassigned = by_cust[
    by_cust['팀'].isna() &
    ~by_cust['고객사명'].isin(['[미분류]','[B2C-개인]','[공통비]']) &
    ~by_cust['고객사명'].str.startswith('[', na=False)
].sort_values('비용합계', ascending=False)

print(f"\n팀 미배정 기업 (직접비+BPO 기준): {len(unassigned)}개")
print(f"합계: {unassigned['억'].sum():.2f}억")
print()
print(unassigned[['고객사명','억','매출있음']].to_string(index=False))
