import pandas as pd
import sys
import io

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

files = [
    'C:/Projects/legend-team/Data/20260402_HSM 기업리스트_전달.xlsx',
    'C:/Projects/legend-team/Data/20260402_데일리잡 리스트_검토완료.xlsx',
    'C:/Projects/legend-team/Data/HSM 계열사_그룹사 관련 데이터_원본.xlsx'
]

for f in files:
    print(f'===== {f.split("/")[-1]} =====')
    sheets = pd.read_excel(f, sheet_name=None, dtype=str)
    for name, df in sheets.items():
        print(f'  Sheet: {name} | Rows: {len(df)} | Cols: {len(df.columns)}')
        print(f'  Columns: {list(df.columns)}')
        print(df.head(5).to_string())
        print()
