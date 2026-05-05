#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
2025년 비용분석 ETL
기준: 출납 기준, 직접비(ERP+BPO), 2025년, 확정 매출만
출력: 비용분석_2025.xlsx
"""

import sys, io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

import pandas as pd
import numpy as np
import re
import warnings
warnings.filterwarnings('ignore')

BASE_DIR = 'D:/Projects/cost'
OUTPUT_FILE = f'{BASE_DIR}/비용분석_2025.xlsx'

# ============================================================
# 상수 정의
# ============================================================

# 직접비 계정 (고객사 귀속 대상)
DIRECT_ACCOUNTS = {
    '이러닝원가', '하이브리드러닝', '컨텐츠개발원가',
    '지급수수료', '지급수수료-일반', '지급수수료-개발용역비',
    '외부인건비', '교육훈련비', '보험료', '마케팅비',
}

# 조건부 직접비: 적요에 고객사 있으면 직접비, 없으면 공통비
CONDITIONAL_ACCOUNTS = {'기타원가'}

# 공통비 계정 (영업 성격, 별도 표기)
COMMON_ACCOUNTS = {
    '구독원가', '도서인쇄비', '소모폼비', '여비교통비', '운반비',
    '차량유지비', '광고비', '광고판촉비', '세금과공과', '수선비',
    '통신비', '판촉비',
}

# 제외 계정
EXCLUDE_ACCOUNTS = {
    'IT투자비', '건설중인자산(무형)', '지급임차료', '기부금',
    '건물관리비', '기 타 (유/무형자산 등)', '정부지원금 환급',
    '지급수수료', '지급수수료-일반', '지급수수료-개발용역비',  # 이러닝 사업 공통비 성격
}

# CP사명 표준화 (CP파일 내 중복/이형 → 대표명)
CP_NAME_NORM = {
    '알엠피1':           '알엠피',
    '이패스코리아1':     '이패스코리아',
    '한국교육방송공사1': '한국교육방송공사',
    '알지비커뮤니케이션㈜': '알지비커뮤니케이션',
    '캐럿솔루션즈':      '캐럿글로벌',   # 캐럿글로벌로 통합
    '북모닝':            '교보문고',      # 교보문고로 통합
    '(주)사이버출판사':  '사이버출판사',
}

# ERP 거래처(정제) → CP 표준명 매핑
ERP_TO_CP = {
    '(주)캐럿솔루션즈':        '캐럿글로벌',
    '교보문고(북모닝)':        '교보문고',
    '(주)교보문고':            '교보문고',
    '주식회사 가람디엠씨':     '가람디엠씨',
    '(주)고려아카데미컨설팅':  '고려아카데미',
    '현대씨앤알':              '현대C&R',
    '사이버출판사(지점)':      '사이버출판사',
    '주식회사 모아팩토리':     '모아교육그룹',
    '한국사회능력개발원':      '사회능력개발원',
    '아이캔비 주식회사':       '아이캔비',
    '이패스코리아':            '이패스코리아',
    '한국교육방송공사':        '한국교육방송공사',
    '(주)유밥':                '유밥',
    '주식회사 마켓디자이너스': '마켓디자이너스',
    '주식회사 데이원컴퍼니':   '데이원컴퍼니',
    '주식회사 큐리어슬리':     '큐리어슬리',
    '제이알씨(JRC)에듀':       '제이알씨에듀',
    '스픽이지랩스코리아 주식회사': '스픽',
    '민병철교육그룹':          '민병철어학원',
    '메가스터디교육(주)':      '메가스터디교육',
    '알지비커뮤니케이션':      '알지비커뮤니케이션',
    # 추가 매핑
    '삼육오이엔엠':            '365E&M',
    '케이지에듀원':            'KG에듀원',
    '이씨케이교육':            'ECK',
    '알엠피':                  '알엠피',   # 거래처=CP사
}

# 고객사명 오귀속 → DB 정확 명칭으로 보정 (post-processing)
CUSTOMER_REMAP = {
    # ── 기존 ──────────────────────────────────────────────────
    '재단법인 병원약학교육연구원':            '한국병원약사회',
    '재단법인 병원약학교육연구원(임상약학)':   '한국병원약사회',
    '한전케이디엔':                          '한전KDN (25년)',
    '한전KDN':                             '한전KDN (25년)',   # ERP 거래처 → DB 대표 이름
    'KT&G':                                '케이티앤지',
    'KB손해보험':                           'KB금융지주(케이비손해보험)',
    '현대자동차':                           '현대자동차 (HR지원팀/법정)',

    # ── (주)/주식회사 제거 (100% 퍼지 매칭 확인) ──────────────
    'HDC현대산업개발(주)':      'HDC현대산업개발',
    '대상주식회사':             '대상 주식회사',
    '코오롱베니트주식회사':     '코오롱베니트 주식회사',
    '엔에이치투자증권':         '엔에이치투자증권㈜',
    'NH투자증권':               '엔에이치투자증권㈜',
    '(주)풍산HRD':              '풍산HRD',
    '(주)케이티에스테이트':     '케이티에스테이트',
    '(주)현대에버다임':         '현대에버다임',
    '(주)대웅제약':             '대웅제약',
    '도쿄일렉트론코리아주식회사': '도쿄일렉트론코리아 주식회사',
    'LF':                      '엘에프',
    '유코카캐리어스(주)':       '유코카캐리어스',
    '광동제약(주)':             '광동제약',
    '(주)오리온':               '오리온',
    '(주)농심':                 '농심',
    '신한카드 주식회사':        '신한카드',
    '신한카드주식회사':         '신한카드',
    '비알코리아(주)':           '비알코리아',
    '(주)딜라이브':             '딜라이브',
    '넥센타이어(주)':           '넥센타이어',
    '삼화페인트공업':           '삼화페인트',
    'LH중앙공동주택관리지원센터': 'LH중앙공동주택관리지원센터 (25년 과업)',
    '화성시온국민평생장학금학습공간': '[46731]화성시온국민평생장학금학습공간',
    '전문건설공제조합':         '전문건설공제조합_A25',
    '동국제강(주)':             '동국제강그룹',
    '대상푸드플러스_풍세':      '대상푸드플러스',
    '동양생명보험(주)':         '동양생명보험',
    '국민은행 인재개발부':      'KB국민은행 인재개발부',
    '(주)하나금융지주':         '하나금융지주',
    '한양이엔지(주)':           '한양이엔지',
    '선인자동차(주)':           '선인자동차',
    '아이비케이투자증권(주)':   '아이비케이투자증권',
    'HDC랩스':                  'hdc랩스',
    '(주)벽산':                 '벽산',
    '한국정보통신(주)':         '한국정보통신',
    '(주)삼우':                 '삼우',
    '하이엠솔루텍주식회사':     '하이엠솔루텍',
    '(주)네패스':               '네패스',
    '아스트':                   '주식회사 아스트',
    '(주)금강주택':             '금강주택',
    '(주)대교홀딩스':           '대교홀딩스',
    '(주)나이스디앤비':         '나이스디앤비',
    '(주)자이에스앤디':         '자이에스앤디',
    '(주)대교':                 '대교',
    '아세아텍':                 '주식회사 아세아텍',
    '해태제과식품(주)':         '해태제과식품',
    '골프존커머스':             '(주)골프존커머스',
    '한국노바티스(주)':         '한국노바티스',
    '에이비엘생명보험(주)':     '에이비엘생명보험',
    '지에스에너지(주)':         'GS에너지',
    '농심태경(주)':             '농심태경㈜',

    # ── 사용자 확인 매핑 (한영/유사 기업명 보정) ─────────────
    '한국전기연구원':               '한국전기안전공사',
    '한국도로공사':                 '한국도로공사서비스',
    '앰코코리아':                   '엠코테크놀로지코리아',   # 앰→엠 오타 수정
    '앰코테크놀로지코리아':         '엠코테크놀로지코리아',   # 앞 버전 잔재 보정
    '아주산업(주)':                 '아주대 경영대학원',
    '아주대학교':                   '아주대 경영대학원',
    '아주':                         '아주대 경영대학원',
    '삼정회계법인':                 '삼정회계법인(NEW)',
    '대상웰라이프(주)':             '대상웰라이프㈜(前 대상라이프사이언스)',
    '한국보훈복지공단':             '한국보훈복지의료공단',
    '에코프로비엠':                 '에코프로',
    '병원협회':                     '대한병원협회',

    # ── ERP 거래처/적요 → DB 기업명 ──────────────────────────
    'VNTG':                           '세아그룹',   # 세아VNTG → 세아그룹

    # ── 이번 회차 사용자 확인 ─────────────────────────────────
    '국립중앙청소년수련원':             '한국청소년활동진흥원',
    '한국여신전문금융업협회':           '여신금융협회',
    '엔잡얼라이언스':                   '[31640]엠얼라이언스 주식회사',
    'KB증권':                           '케이비증권',
    '금호석유화학㈜중앙연구소':         '금호석유화학',
    '금호석유화학㈜여수공장':           '금호석유화학',
    '금호미쓰이화학주식회사':           '금호석유화학',
    '금호피앤비화학 (주) 서울사무소':   '금호석유화학',
    '금호석유화학㈜울산고무공장':       '금호석유화학',
    '금호석유화학㈜울산수지공장':       '금호석유화학',
    '경기도평생학습포털':               '경기도인재개발원',
    # IBK: DB 정확명 = '아이비케이기업은행( ibkonejob)' (공백 포함)
    'IBK기업은행':                      '아이비케이기업은행( ibkonejob)',
    '아이비케이기업은행(ibkonejob)':    '아이비케이기업은행( ibkonejob)',  # 공백 보정
    'KB국민카드':                       'KB금융지주(케이비국민카드)',
    '한국수자원공사':                   '한국수자원공사 인재개발원',
    '한국수자원공사(이러닝)':           '한국수자원공사 인재개발원',
    # 한영전환 보정
    'DB생명':                           '디비생명보험',
    'DB생명보험(주)':                   '디비생명보험',
    'DB생명보험':                       '디비생명보험',
    '국민은행':                         'KB국민은행 인재개발부',
    'KB국민은행':                       'KB국민은행 인재개발부',
    '인천국제공항공사':                 '인천국제공항보안',
    '현대그린푸드':                     '현대그린푸드(SAM)',
    '에치와이':                         '한국야쿠르트(hy)',
    '세아제강':                         '세아그룹',
    '카카오':                           '카카오게임즈',
    '한국은행(스마트러닝)':             '한국은행',
    '(정산용)서울특별시':               '서울특별시인재개발원',
    '한국공항공사 항공기술훈련원':      '한국공항공사',
    '한국공항공사항공기술훈련원':       '한국공항공사',

    # ── 금호석유화학 계열 잔여 ─────────────────────────────────
    '금호석유화학㈜율촌공장':           '금호석유화학',
    '금호폴리켐 (주)':                  '금호석유화학',
    '금호폴리켐(주)':                   '금호석유화학',
    '금호폴리켐 (주) 여수공장':         '금호석유화학',
    '금호폴리켐(주)여수공장':           '금호석유화학',
    '금호피앤비화학 김포연구소':        '금호석유화학',
    '금호피앤비화학주식회사':           '금호석유화학',
    '금호피앤비화학(주)서울사무소':     '금호석유화학',
    '금호티앤엘(주)':                   '금호석유화학',
    '금호리조트(주)':                   '금호석유화학',
    '금호개발상사 (주)':                '금호석유화학',
    '금호개발상사(주)':                 '금호석유화학',
    '금호석유화학㈜-예산건자재공장':    '금호석유화학',

    # ── 세아그룹 계열 ──────────────────────────────────────────
    '세아창원특수강':       '세아그룹',
    '세아베스틸':           '세아그룹',
    '세아홀딩스':           '세아그룹',
    '세아씨엠':             '세아그룹',
    '세아M&S':              '세아그룹',
    '세아L&S':              '세아그룹',
    '세아항공방산소재':     '세아그룹',
    '세아제강지주':         '세아그룹',
    '세아특수강':           '세아그룹',
    '(주) 세아특수강 충추1(정산용)': '세아그룹',
    '(주) 세아특수강 원주공장(정산용)': '세아그룹',

    # ── 동원그룹 계열 ──────────────────────────────────────────
    '동원에프앤비':         '동원그룹',
    '동원홈푸드':           '동원그룹',
    '동원로엑스':           '동원그룹',
    '동원시스템즈':         '동원그룹',
    '동원건설산업':         '동원그룹',
    '동원와인플러스':       '동원그룹',
    '동원팜스':             '동원그룹',
    '동원글로벌터미널부산': '동원그룹',

    # ── 에코프로 계열 ──────────────────────────────────────────
    '(주)에코프로':         '에코프로',
    '에코프로이엠':         '에코프로',
    '에코프로에이치엔':     '에코프로',
    '에코프로씨엔지':       '에코프로',
    '에코프로머티리얼즈':   '에코프로',

    # ── 스마일게이트 계열 ─────────────────────────────────────
    '스마일게이트엔터테인먼트':             '스마일게이트',
    '스마일게이트알피지':                   '스마일게이트',
    '스마일게이트홀딩스메가포트지점':       '스마일게이트',
    '스마일게이트홀딩스 메가포트 지점':     '스마일게이트',
    '(주) 스마일게이트홀딩스':              '스마일게이트',
    '(주)스마일게이트홀딩스':               '스마일게이트',

    # ── 대한적십자사 혈액원 계열 ─────────────────────────────
    '혈액관리본부':                     '대한적십자사혈액관리본부',
    '부산혈액원':                       '대한적십자사혈액관리본부',
    '서울동부혈액원':                   '대한적십자사혈액관리본부',
    '서울남부혈액원':                   '대한적십자사혈액관리본부',
    '서울중앙혈액원':                   '대한적십자사혈액관리본부',
    '경기혈액원':                       '대한적십자사혈액관리본부',
    '전북혈액원':                       '대한적십자사혈액관리본부',
    '강원혈액원':                       '대한적십자사혈액관리본부',
    '광주·전남혈액원':                  '대한적십자사혈액관리본부',
    '대전·세종·충남혈액원':             '대한적십자사혈액관리본부',
    '중앙혈액검사센터':                 '대한적십자사혈액관리본부',
    '남부혈액검사센터':                 '대한적십자사혈액관리본부',
    '혈장분획센터':                     '대한적십자사혈액관리본부',
    '혈액수혈연구원':                   '대한적십자사혈액관리본부',
    '대한적십자사본사':                 '대한적십자사혈액관리본부',
    '대한적십자사':                     '대한적십자사혈액관리본부',
    '대한적십자사경기혈액원':           '대한적십자사혈액관리본부',
    '대한적십자사서울남부혈액원':       '대한적십자사혈액관리본부',
    '대한적십자사서울중앙혈액원':       '대한적십자사혈액관리본부',
    '대한적십자사 인재개발원':          '대한적십자사혈액관리본부',

    # ── 일진그룹 계열 ──────────────────────────────────────────
    '일진전기':                             '일진그룹',
    '일진다이아몬드':                       '일진그룹',
    '일진제강(전주)':                       '일진그룹',
    '일진제강(수원)':                       '일진그룹',
    '일진씨엔에스':                         '일진그룹',
    '일진디스플레이 터치사업부(평택)':      '일진그룹',
    '일진디스플레이터치사업부(평택)':       '일진그룹',

    # ── 사조그룹 개별 매핑 ───────────────────────────────────
    '사조산업(주)':         '사조산업',
    '사조동아원(주)':       '사조동아원',

    # ── 농심태경 공장 계열 ───────────────────────────────────
    '농심태경(주)안성공장': '농심태경㈜',
    '농심태경(주) 안성공장': '농심태경㈜',
    '농심태경(주)대구공장': '농심태경㈜',
    '농심태경(주) 대구공장': '농심태경㈜',

    # ── 기타 개별 ─────────────────────────────────────────────
    'LS전선(주)':           'LS전선',
    '아주대':               '아주대 경영대학원',
    'LG생활건강 (SingleX)': 'LG생활건강(임직원)',
    '(주)LG생활건강':       'LG생활건강(임직원)',
    'LG생활건강(SingleX)':  'LG생활건강(임직원)',

    # ── 팀 매칭 누수 보정 (ver2.0 디버깅) ──────────────────────
    '국가보훈부(제대군인 사이버교육)': '국가보훈부',
    '시몬스':                         '[17165]시몬스',
    '우미':                           '우미건설',
    '롯데인재개발원':                 '롯데지주 주식회사',  # 컨텐츠 임대/판매 (롯데지주)
    '삼립':                           '에스피씨 삼립',
    '(주)대웅':                       '대웅제약',
    '대웅바이오':                     '대웅제약',
}

# 거래처 자체가 고객사인 케이스 (BPO 운영 형태, 직접 비용 지급)
# → 적요 파싱보다 먼저 체크: 거래처_정제가 company_names에 있으면 거래처=고객사
VENDOR_IS_CUSTOMER_KEYWORDS = [
    'LH중앙공동주택관리지원센터', '재단법인 병원약학교육연구원',
    '한국청소년활동진흥원', '한국병원약사회', '한국건설엔지니어링협회',
    '한국여신전문금융업협회', '여신금융협회', '한전케이디엔', '한전KDN', '병원협회',
    '엔잡얼라이언스', '[31640]엠얼라이언스 주식회사',
    '국립중앙청소년수련원',   # CUSTOMER_REMAP → 한국청소년활동진흥원
]

# 내부 계열사/개발사 → 고객사 귀속 불가, 별도 표기
INTERNAL_VENDORS = {'휴넷이지런', '(휴넷)김현경_BPO', '(휴넷)임재혁', '(휴넷)이미지'}

# DB에 이름은 있지만 실제로는 고객사가 아닌 거래처 (vendor-as-customer 처리 제외)
# → 적요 파싱으로 실제 고객사 찾거나 미분류 처리
NON_CUSTOMER_VENDORS = {
    '지에스엠비즈',       # 기프티콘 비용 업체, 고객사 아님
    '스피쿠스',           # CP사 (아주그룹 B2B 등록되어 있으나 실제는 CP사) → CP비율배분으로 처리
    '비즈엠디지',         # LH 위탁 운영 업체, 고객사 아님 → 적요에서 LH 파싱
    '(주)비즈니스임팩트', # KB금융그룹 위탁 업체, 고객사 아님 → 적요에서 KB 파싱
    '유앤알프로젝트',     # 농식품공무원교육원 위탁 업체, 고객사 아님
    '와우디랩',           # 고객사 아님, 적요 파싱
}

# DB 기업명 통합 매핑 (동일 기업이 계약명/사업유형별로 여러 이름으로 분산된 경우 → 대표 이름으로 통합)
# build_company_master 에서 기업명_norm 에 적용 → 매출·비용 집계 정합성 확보 (사업유형 무관 단일 집계)
DB_COMPANY_MERGE = {
    # 한전KDN: 계약별 5개 이름 → 단일 집계
    '한전KDN(마일리지_바이패스)':   '한전KDN (25년)',
    '한전KDN(AI아카데미)':          '한전KDN (25년)',
    '한전KDN(조직활성화-어깨동무)': '한전KDN (25년)',
    '한전KDN (24년)':               '한전KDN (25년)',
    '한전KDN(마일리지)':            '한전KDN (25년)',
    '한전KDN':                      '한전KDN (25년)',
}

# BPO 프로젝트명 → DB 고객사명 직접 매핑 (자동 매칭 실패 케이스)
BPO_PROJECT_MAP = {
    'KT&G 인재개발원':  '케이티앤지',
    '경기도지식사업':   '경기도청',
    '지역정보개발원':   '한국지역정보개발원',   # DB 없음 - 비용만 표기
}

# 거래처 자체 제외 (퇴직금, 프리랜서 풀, 공통비 성격 등)
EXCLUDE_VENDORS = {
    '주식회사 마이플랫',        # 프리랜서 풀 용역비 (특정 고객사 없음)
    '(휴넷)전직원',             # 퇴직급여, 장애인고용부담금
    '한국모바일인증 주식회사',   # 본인확인서비스 (IT 인프라)
    '아이로이드',               # 소프트웨어 라이선스 (Adobe/한글)
    'SALESFORCE.COM',           # Slack 구독료
    '영림원소프트랩',           # ERP 유지보수
    '삼영회계법인',             # 감사보수 (일반관리비)
    '(주)리멤버앤컴퍼니',       # 채용수수료 (HR 비용)
}

# 적요에 해당 키워드 포함 시 제외 (이러닝 공통비, 행사비용 등)
EXCLUDE_NOTE_KEYWORDS = ['포사이트', '수익배분금액', '수익배분', '튜터비', '원격교육 위탁 운영']

# 적요 키워드 → 고객사명 매핑 (DB 기업명과 적요 표현 불일치 해소)
# 긴 패턴부터 먼저 체크되도록 코드에서 sorted(key=len, reverse=True) 사용
NOTE_KEYWORD_MAP = {
    '귀농귀촌 아카데미':    '귀농귀촌 아카데미(농림수산식품교육문화정보원)',
    '귀농귀촌':             '귀농귀촌 아카데미(농림수산식품교육문화정보원)',
    '한국국제협력단':       '한국국제협력단(코이카)',
    '한전원자력연료':       '한국원자력연료',   # 구 사명=한국원자력연료, DB 기준
    '국가생명윤리정책원':   '국가생명윤리정책원(의료기관)',
    '체육인재양성':         '국민체육진흥공단',
    'KB금융그룹':           'KB금융지주',
    '창업진흥원':           '한국창업진흥원',
    '경기도 지식':          '경기도청',
    'GSEEK':                '경기도청',
    '드림미디어':           '드림미디어(광주드림)',
    'LS그룹':               'LS그룹공통연수원',
    'ls그룹':               'LS그룹공통연수원',
    '현대자동차그룹':       '현대자동차',
    '현대자동차':           '현대자동차',
    '미래에셋캐피탈':       '미래에셋캐피탈',
    '미래에셋':             '미래에셋증권',
    '청년창업사관학교':     'KOSMES 청년창업사관학교',
    'LH공사':               'LH(한국토지주택공사)',
    '현대위아':             '현대위아 (위아다움 집합교육)',
    '현대로템':             '현대로템(의왕연구소)',
    '한샘':                 '한샘',             # 2글자라 회사명 사전 필터링됨
    '에이치디현대오일뱅크':  '현대오일뱅크서울지점',
    '현대오일뱅크':         '현대오일뱅크서울지점',
    '한주':                 '한주',             # 2글자라 회사명 사전 필터링됨
    '녹십자홀딩스':         'GC녹십자홀딩스',
    '고려대학교':           '고려대학교(컨텐츠개발)',
    '광주정보':             '광주정보문화산업진흥원',  # 적요 오타 대응
    'KOICA':               '한국국제협력단(코이카)',
    '코이카':              '한국국제협력단(코이카)',
    '중소벤처기업진흥공단':  '중소벤처기업진흥공단',
    '중진공':              '중소벤처기업진흥공단',    # 약칭
    '쿠첸':               '쿠첸',                 # 2글자라 회사명 사전 필터링됨
    '골프존카운티':        '골프존카운티FLEX',
    'NH금융':             '농협금융지주',
    'NH농협':             '농협금융지주',
    '케이티에스테이트':   '케이티에스테이트',
    'KT에스테이트':       '케이티에스테이트',
    'kt estate':          '케이티에스테이트',
    'KT estate':          '케이티에스테이트',
    'KT Estate':          '케이티에스테이트',
    # DB 확인 후 추가
    '한국타이어':           '한국타이어앤테크놀로지',
    'DB인재개발원':         'DB인재개발원(DBinc.)',
    '우리금융그룹':         '우리금융지주',
    '콘티넨탈코리아':       '콘티넨탈오토모티브코리아',
    '충남대병원':           '충남대학교병원',
    '도쿄일렉트론코리아':   '도쿄일렉트론코리아 주식회사',
    '첨단재생의료':         '첨단재생의료 교육포털',
    '수자원공사':           '한국수자원공사 인재개발원',
    '케이씨씨중앙연구소':   '케이씨씨 중앙연구소',
    '웹젠':                 '웹젠',
    'KT_':                  'KT',
    'kt_':                  'KT',
    '기아':                 '기아(KVO)',
    '농심':                 '농심',
    # DB 없음 → 비용만 표시
    'NH투자증권':           'NH투자증권',
    'LG유플러스':           'LG유플러스',
    '에치와이':             '에치와이',
    'DB생명':               'DB생명',
    # 추가 매핑
    '건강보험공단':          '국민건강보험공단',
    'KBNMC':                'KB금융지주 (NMC)',
    '경기도평생학습포털':    '경기도평생학습포털',
    '생명공학연구원':        '한국생명공학연구원',
    '서울시 평생학습포털':   '서울특별시인재개발원',
    '서울시 평생포털':       '서울특별시인재개발원',
    '쿠팡':                 '쿠팡',
    'KB AI':                'KB금융지주',
    '충전인프라':           '충남지방행정발전연구원_A25',
    # 이번 회차 추가
    '코오롱그룹':           '코오롱베니트 주식회사',   # 스피쿠스 적요 → 코오롱베니트
    '보건복지인재원':       '한국보건복지인재원',
    '해양경찰청':           '해양경찰청 해양경찰교육원',
    '농식품공무원교육원':   '농식품공무원교육원',
}

CONTENT_DEV_FILE = f'{BASE_DIR}/(이지런)콘텐츠개발프로젝트_정산내역(12월)_251223_v2.0_사업전략 확인.xlsx'

# 콘텐츠개발비 파일 고객사명 보정 (약칭/오탈자 → DB 정확명)
# CUSTOMER_REMAP 적용 전 선처리
CONTENT_CUST_NORM = {
    '병원약사회':               '한국병원약사회',
    '분당서울대병원':           '분당서울대학교병원',
    '한국장애인고용교육원':     '한국장애인고용공단',
    '한국기술교육대학교':       '한국기술교육대학교 온라인평생교육원',
    '지방자치인재개발원':       '행정안전부 지방자치인재개발원',
    '동우화인캠':               '동우화인켐',
    '현대자동차 울산공장':      '현대자동차 (HR지원팀/법정)',
    '메트라이프':               '메트라이프생명보험(주)',
    '광주정보문화산업진흥원':   '광주정보문화산업진흥원',
    '한국남동발전':             '한국남동발전',
    '한국수력원자력':           '한국수력원자력',
    '한올바이오파마':           '한올바이오파마',
    '한국다이이찌산쿄':         '한국다이이찌산쿄',
    '해양플랜트협회':           '한국조선해양플랜트협회',
    '방재협회':                 '방재협회',
    '카카오창작재단':           '카카오창작재단',
    '동국제약':                 '동국제약',
    '신한라이프':               '신한라이프',
    # ── 이번 회차 추가 (이지런 파일 미매핑 기업 보완) ─────────
    '삼성물산':                 '삼성물산 건설부문',
    '삼성증권':                 '삼성증권주식회사',
    '이스타항공':               '이스타항공㈜',
    '서울성모병원':             '가톨릭대학교서울성모병원',
    '롯데호텔':                 '롯데호텔서비스아카데미',
    '동서발전':                 '한국동서발전',
    '보건복지':                 '한국보건복지인재원',
    '스타벅스':                 '스타벅스커피 코리아',
    '노사발전재단':             '[11259]노사발전재단',
    '국립중앙의료원':           '국립중앙의료원(공공보건의료교육훈련센터)',
}

MONTH_COLS = [f'{i}월 매출' for i in range(1, 13)]
MONTH_NUM  = {f'{i}월': i for i in range(1, 13)}

print('=' * 60)
print('2025년 비용분석 ETL 시작')
print('=' * 60)

# ============================================================
# 1. 데이터 로딩
# ============================================================

def load_erp():
    print('\n[1/4] ERP 출납 로드 중...')
    f = f'{BASE_DIR}/2025년 ERP출납입력_현금계정과목v1 (1).xlsx'
    xl = pd.ExcelFile(f)
    dfs = []
    for sheet in xl.sheet_names:
        df = pd.read_excel(f, sheet_name=sheet, header=2)
        df['월명'] = sheet
        df['월번호'] = MONTH_NUM[sheet]
        dfs.append(df)
    df = pd.concat(dfs, ignore_index=True)
    df = df.dropna(subset=['원화금액'])
    df['원화금액'] = pd.to_numeric(df['원화금액'], errors='coerce').fillna(0)
    df = df[df['원화금액'] > 0]
    df['거래처_정제'] = df['거래처'].astype(str).str.replace(r'^P', '', regex=True).str.strip()
    # 현금계정과목 컬럼 (중복 컬럼 중 첫 번째 사용)
    if '현금계정과목' not in df.columns:
        df['현금계정과목'] = df.iloc[:, 18]
    print(f'   → {len(df):,}건 로드 (총 {df["원화금액"].sum()/1e8:.1f}억원)')
    return df

def load_cp():
    print('[2/4] CP 수수료 로드 중...')
    f = f'{BASE_DIR}/25~26년 CP수수료내역취합(25.01~26.03)_2600421.xlsx'
    df = pd.read_excel(f, sheet_name='all_raw_25년')
    df['정산금액'] = pd.to_numeric(df['정산금액'], errors='coerce').fillna(0)
    df['정산년월_num'] = pd.to_datetime(df['정산년월'], errors='coerce').dt.month
    df['CP사명_std'] = df['CP사명'].map(lambda x: CP_NAME_NORM.get(str(x), str(x)))
    # 수강생명(B)→고객사명 (B2B), 개인은 그대로
    df['고객사명_cp'] = df['수강생명'].astype(str).str.replace(r'\(B\)', '', regex=True).str.strip()
    df['B2B'] = df['수강생명'].astype(str).str.contains(r'\(B\)', regex=True)
    print(f'   → {len(df):,}건 로드')
    return df

def load_bpo():
    print('[3/4] BPO 인건비 로드 중...')
    f = f'{BASE_DIR}/2025 프로젝트별 BPO 인건비 작업_송부용.xlsx'
    df = pd.read_excel(f, sheet_name='프로젝트별 인건비', header=1)
    df.columns = ['프로젝트명', '지급총액', '4대보험', '퇴직금', '합계']
    df = df.dropna(subset=['합계'])
    df = df[~df['프로젝트명'].astype(str).str.contains('총합계', na=False)]
    df['합계'] = pd.to_numeric(df['합계'], errors='coerce').fillna(0)
    df = df[df['합계'] > 0]
    print(f'   → {len(df)}개 프로젝트, 총 {df["합계"].sum()/1e8:.2f}억원')
    return df

def load_databook():
    print('[4/4] 데이터북 로드 중...')
    f = f'{BASE_DIR}/♣2025년_databook_취합_260129_25년마감 완료_맵핑작업용.xlsm'
    df = pd.read_excel(f, sheet_name='25년 databook(취합)', header=3)
    df.columns = [str(c).replace('\n', ' ').strip() for c in df.columns]
    conf_col = [c for c in df.columns if '확정' in c and '가망' in c][0]
    df_all = df.dropna(subset=['기업명 (HSM 기준)']).copy()
    df_conf = df_all[df_all[conf_col] == '01 확정'].copy()
    for col in MONTH_COLS:
        df_conf[col] = pd.to_numeric(df_conf[col], errors='coerce').fillna(0)
    df_conf['25년 매출'] = pd.to_numeric(df_conf['25년 매출'], errors='coerce').fillna(0)
    print(f'   → 확정 기업 {len(df_conf):,}건 / 전체 기업 {len(df_all):,}건 로드')
    return df_conf, df_all  # 확정(매출계산용), 전체(이름사전용)

# ============================================================
# 2. 기준 테이블 구성
# ============================================================

def build_company_master(db_df, db_all_df, bpo_df):
    """고객사 마스터 구성"""
    print('\n[기준] 고객사 마스터 구성...')

    # 데이터북 확정 기업 (기업명 + 사업유형별)
    team_col = [c for c in db_df.columns if '최종팀' in c][0]
    rep_col  = [c for c in db_df.columns if '최종대표' in c][0]

    master = db_df[['기업명 (HSM 기준)', '기업코드', '25년 사업유형',
                    team_col, rep_col, '25년 매출'] + MONTH_COLS].copy()
    master.columns = ['기업명', '기업코드', '사업유형', '팀', '영업대표',
                      '연매출'] + MONTH_COLS
    master = master[master['기업명'].notna() & (master['기업명'] != 'nan')]

    # 기업명 정규화 (검색용)
    master['기업명_norm'] = master['기업명'].astype(str).str.strip()

    # DB 기업명 통합: 계약별/사업유형별로 분산된 이름 → 대표 이름으로 통합
    before = master['기업명_norm'].nunique()
    master['기업명_norm'] = master['기업명_norm'].map(lambda x: DB_COMPANY_MERGE.get(x, x))
    after = master['기업명_norm'].nunique()
    if before != after:
        print(f'   → DB 기업명 통합: {before}개 → {after}개 (합쳐진 {before-after}개)')

    print(f'   → 마스터 {len(master):,}건')
    return master

def build_company_name_list(master_df, db_all_df, cp_df, bpo_df):
    """고객사 이름 사전 (적요 파싱용) - 전체 데이터북 기업명 포함"""
    names = set()
    # 확정 기업 (master)
    names.update(master_df['기업명_norm'].dropna().tolist())
    # 전체 데이터북 기업명 (가망/기회 포함 - 이름 파싱에만 사용)
    names.update(db_all_df['기업명 (HSM 기준)'].dropna().astype(str).str.strip().tolist())
    # BPO 프로젝트명
    names.update(bpo_df['프로젝트명'].dropna().tolist())
    # CP B2B 고객사명 전체
    b2b_names = cp_df[cp_df['B2B']]['고객사명_cp'].dropna().unique()
    names.update(b2b_names)
    # 거래처=고객사 케이스 추가
    names.update(VENDOR_IS_CUSTOMER_KEYWORDS)
    # 3자 이상만 (짧은 이름은 오매칭 위험)
    names = {n for n in names if len(str(n).strip()) >= 3 and str(n) != 'nan'}
    return sorted(names, key=len, reverse=True)

def build_cp_customer_ratios(cp_df):
    """CP사별 연간 고객사 배분 비율 산출"""
    print('[기준] CP 고객사 배분 비율 산출...')

    # B2B만 (B2C 개인은 고객사 매핑 불가)
    b2b = cp_df[cp_df['B2B'] & (cp_df['정산금액'] > 0)].copy()

    ratios = {}  # {CP사명_std: {고객사명: 비율}}
    for cp_name, grp in b2b.groupby('CP사명_std'):
        total = grp['정산금액'].sum()
        if total == 0:
            continue
        by_customer = grp.groupby('고객사명_cp')['정산금액'].sum()
        ratios[cp_name] = (by_customer / total).to_dict()

    b2c_ratio = {}  # B2C 비중
    for cp_name, grp in cp_df.groupby('CP사명_std'):
        total = grp['정산금액'].sum()
        b2c = grp[~grp['B2B']]['정산금액'].sum()
        b2c_ratio[cp_name] = b2c / total if total > 0 else 0

    print(f'   → {len(ratios)}개 CP사 비율 산출')
    return ratios, b2c_ratio

# ============================================================
# 3. ERP 처리
# ============================================================

def classify_account(account):
    """계정과목 → 비용분류"""
    if account in EXCLUDE_ACCOUNTS:
        return '제외'
    elif account in DIRECT_ACCOUNTS:
        return '직접비'
    elif account in CONDITIONAL_ACCOUNTS:
        return '조건부'
    elif account in COMMON_ACCOUNTS:
        return '공통비'
    else:
        return '기타'  # 미정의 계정

_NOTE_KW_SORTED = sorted(NOTE_KEYWORD_MAP.keys(), key=len, reverse=True)

def find_customer_in_text(text, company_names):
    """적요/활동처 텍스트에서 고객사명 찾기"""
    if not text or str(text).strip() in ('nan', ''):
        return None, None
    text = str(text)
    # Step A: DB 기업명 직접 매칭 (긴 이름부터)
    #   NON_CUSTOMER_VENDORS는 거래처이자 DB에도 존재하므로 적요 파싱 시 고객사로 귀속되면 안 됨
    for name in company_names:
        if name in text and name not in NON_CUSTOMER_VENDORS:
            return name, '적요직접'
    # Step B: 별칭 키워드 매핑 (긴 패턴부터)
    for kw in _NOTE_KW_SORTED:
        if kw in text:
            return NOTE_KEYWORD_MAP[kw], '적요키워드'
    return None, None

def get_cp_std_name(erp_vendor):
    """ERP 거래처 → CP 표준명"""
    return ERP_TO_CP.get(erp_vendor, erp_vendor)

def process_erp(erp_df, company_names, cp_ratios, b2c_ratios):
    """ERP 처리: 계정분류 + 고객사 귀속"""
    print('\n[처리] ERP 데이터 처리 중...')

    df = erp_df.copy()

    # 계정 분류
    df['비용분류'] = df['현금계정과목'].map(classify_account).fillna('기타')

    # 제외 거래처/적요 선필터 (계정과목 무관)
    excl_vendor_mask = df['거래처_정제'].apply(lambda v: any(ev in str(v) for ev in EXCLUDE_VENDORS))
    excl_note_mask   = df['적요'].fillna('').astype(str).apply(lambda n: any(kw in n for kw in EXCLUDE_NOTE_KEYWORDS))
    df = df[~excl_vendor_mask & ~excl_note_mask].copy()

    # 처리 대상: 직접비 + 조건부
    target = df[df['비용분류'].isin(['직접비', '조건부'])].copy()
    common = df[df['비용분류'] == '공통비'].copy()
    exclude = df[df['비용분류'] == '제외'].copy()
    other = df[df['비용분류'] == '기타'].copy()

    print(f'   직접비: {len(target):,}건 / 공통비: {len(common):,}건 / 제외: {len(exclude):,}건 / 기타: {len(other):,}건')

    # 결과 저장용 리스트
    result_rows = []

    for _, row in target.iterrows():
        account  = str(row.get('현금계정과목', ''))
        vendor   = str(row.get('거래처_정제', ''))
        amount   = row.get('원화금액', 0)
        month    = row.get('월번호', 0)
        note     = str(row.get('적요', ''))

        # 제외 거래처 (퇴직금, 프리랜서 풀 등)
        if any(ev in vendor for ev in EXCLUDE_VENDORS):
            continue

        # 적요 포함 키워드 제외 (포사이트 등 행사비)
        if any(kw in note for kw in EXCLUDE_NOTE_KEYWORDS):
            continue

        # 내부 계열사/개발사 → 별도 표기
        if any(iv in vendor for iv in INTERNAL_VENDORS):
            result_rows.append({
                '출납월': month, '거래처': vendor, '현금계정과목': account,
                '비용분류_최종': '직접비(내부계열사)', '고객사명': '[내부계열사]',
                '배분방법': '내부계열사', 'CP사명': '',
                '금액': amount, '원본금액': amount, '적요': note,
            })
            continue

        # Step 0: 거래처 자체가 고객사인지 먼저 확인
        # CP 거래처면 VENDOR_IS_CUSTOMER 건너뜀 (CP 배분 우선)
        cp_std_check = get_cp_std_name(vendor)
        is_cp_vendor = cp_std_check in cp_ratios
        vendor_as_customer = None
        if not is_cp_vendor and vendor not in NON_CUSTOMER_VENDORS:
            for kw in VENDOR_IS_CUSTOMER_KEYWORDS:
                if kw in vendor:
                    vendor_as_customer = kw
                    break
            # 또는 vendor가 company_names에 직접 포함
            if vendor_as_customer is None and vendor in set(company_names):
                vendor_as_customer = vendor

        if vendor_as_customer:
            result_rows.append({
                '출납월': month, '거래처': vendor, '현금계정과목': account,
                '비용분류_최종': '직접비', '고객사명': vendor_as_customer,
                '배분방법': '거래처=고객사', 'CP사명': '',
                '금액': amount, '원본금액': amount, '적요': note,
            })
            continue

        # Step 1: 적요에서 고객사 찾기
        customer, method = find_customer_in_text(note, company_names)

        # Step 2: 고객사 미발견 + CP 거래처 → CP 비율 배분
        if customer is None:
            cp_std = get_cp_std_name(vendor)
            if cp_std in cp_ratios:
                # CP 비율로 분할
                ratios = cp_ratios[cp_std]
                b2c_share = b2c_ratios.get(cp_std, 0)
                for cust, ratio in ratios.items():
                    result_rows.append({
                        '출납월': month,
                        '거래처': vendor,
                        '현금계정과목': account,
                        '비용분류_최종': '직접비' if account in DIRECT_ACCOUNTS else ('공통비' if account in COMMON_ACCOUNTS else '직접비'),
                        '고객사명': cust,
                        '배분방법': 'CP비율배분',
                        'CP사명': cp_std,
                        '금액': amount * ratio,
                        '원본금액': amount,
                        '적요': note,
                    })
                # B2C 몫도 B2B 고객사에 비율 배분 (B2C 비중 × B2B 비율)
                if b2c_share > 0:
                    for cust, ratio in ratios.items():
                        result_rows.append({
                            '출납월': month,
                            '거래처': vendor,
                            '현금계정과목': account,
                            '비용분류_최종': '직접비' if account in DIRECT_ACCOUNTS else ('공통비' if account in COMMON_ACCOUNTS else '직접비'),
                            '고객사명': cust,
                            '배분방법': 'CP비율배분',
                            'CP사명': cp_std,
                            '금액': amount * b2c_share * ratio,
                            '원본금액': amount,
                            '적요': note,
                        })
                continue
            else:
                # CP 아닌데 고객사 미발견 → 미분류
                customer = '[미분류]'
                method = '미분류'

        # 외부도입수수료 미분류 → 공통비
        if customer == '[미분류]' and any(kw in note for kw in ['외부도입 수수료', '외부도입수수료']):
            cost_class = '공통비'
            customer = '[공통비]'
            method = '공통비(외부도입)'
        # 조건부 계정: 고객사 미발견 → 공통비로 전환
        elif account in CONDITIONAL_ACCOUNTS and customer == '[미분류]':
            cost_class = '공통비'
        elif account in CONDITIONAL_ACCOUNTS and customer not in (None, '[미분류]'):
            cost_class = '직접비'
        # 미분류 일괄 → 공통비 재배정 (고객사 귀속 불가 항목: 강사료풀·판매장려금·위탁운영 등)
        elif customer == '[미분류]':
            cost_class = '공통비'
            customer = '[공통비]'
            method = '공통비(미분류재배정)'
        else:
            cost_class = '직접비'

        result_rows.append({
            '출납월': month,
            '거래처': vendor,
            '현금계정과목': account,
            '비용분류_최종': cost_class,
            '고객사명': customer or '[미분류]',
            '배분방법': method or '미분류',
            'CP사명': '',
            '금액': amount,
            '원본금액': amount,
            '적요': note,
        })

    result_df = pd.DataFrame(result_rows)

    # 고객사명 보정 (오귀속 → DB 정확 명칭)
    result_df['고객사명'] = result_df['고객사명'].map(lambda x: CUSTOMER_REMAP.get(x, x))

    # 공통비 처리
    common['비용분류_최종'] = '공통비'
    common['고객사명'] = '[공통비]'
    common['배분방법'] = '공통비계정'
    common['금액'] = common['원화금액']
    common['원본금액'] = common['원화금액']
    common['CP사명'] = ''

    # 기타(미정의) 계정 → 미분류로
    other['비용분류_최종'] = '기타미정의'
    other['고객사명'] = '[미정의계정]'
    other['배분방법'] = '미정의'
    other['금액'] = other['원화금액']
    other['원본금액'] = other['원화금액']
    other['CP사명'] = ''
    other['출납월'] = other['월번호']
    other['거래처'] = other['거래처_정제']
    other['현금계정과목'] = other['현금계정과목']
    other['적요'] = other['적요'].astype(str)

    # 공통비 컬럼 맞추기
    cols = ['출납월','거래처','현금계정과목','비용분류_최종','고객사명','배분방법','CP사명','금액','원본금액','적요']
    for df_sub in [common, other]:
        df_sub['출납월'] = df_sub['월번호']
        df_sub['거래처'] = df_sub['거래처_정제']

    common_out = common[cols].copy()
    # other(기타미정의: 은행 대출·회전대출 금융비용 등)는 영업비용 범위 외 → 출력 제외

    # 직접비 결과 통합
    direct_df = pd.concat([result_df, common_out], ignore_index=True)

    return direct_df, exclude

# ============================================================
# 4. 이지런 콘텐츠개발비 처리
# ============================================================

def load_content_dev(company_names):
    """이지런 콘텐츠개발비 → 기업별 월별 직접비 귀속"""
    print('\n[처리] 이지런 콘텐츠개발비 로드 중...')

    xl  = pd.ExcelFile(CONTENT_DEV_FILE)
    rows = []
    M_IDX = list(range(13, 25))   # 헤더 없는 raw 상태에서 1월~12월 컬럼 인덱스

    def clean_company(raw_name):
        s = re.sub(r'^\([^)]+\)\s*', '', str(raw_name).strip())  # 앞 괄호 접두사 제거
        s = re.sub(r'\([^)]+\)\s*$', '', s).strip()              # 뒤 괄호 접미사 제거
        s = CONTENT_CUST_NORM.get(s, s)                          # 약칭 → 정식명
        s = CUSTOMER_REMAP.get(s, s)                             # DB 매핑
        return s

    # ── 시트 1·2: 수주사업(콘텐츠) + 수주사업(통합위탁) ──────
    for sheet_nm in ['1. 수주사업(콘텐츠)', '2. 수주사업(통합위탁)']:
        raw = xl.parse(sheet_nm, header=None)
        data = raw[pd.to_numeric(raw[0], errors='coerce').notna()].copy()
        for _, row in data.iterrows():
            company = clean_company(row[3])
            for m_offset, m_num in enumerate(range(1, 13)):
                amt = pd.to_numeric(row[M_IDX[m_offset]], errors='coerce')
                if pd.isna(amt) or amt == 0:
                    continue
                rows.append({
                    '출납월': m_num,
                    '거래처': '이지런',
                    '현금계정과목': '컨텐츠개발원가',
                    '비용분류_최종': '직접비(콘텐츠개발)',
                    '고객사명': company,
                    '배분방법': f'콘텐츠개발({sheet_nm[:2]})',
                    'CP사명': '',
                    '금액': float(amt),
                    '원본금액': float(amt),
                    '적요': f'[이지런] {str(row[3]).strip()}',
                })

    # ── 시트 3: 스튜디오지원 (프로젝트명 → 고객사 파싱) ──────
    raw3 = xl.parse('3_스튜디오지원', header=None)
    data3 = raw3.iloc[6:].copy()
    data3.columns = range(len(data3.columns))
    data3 = data3[pd.to_numeric(data3[0], errors='coerce').notna()].copy()
    data3[1]  = pd.to_numeric(data3[1],  errors='coerce')
    data3[10] = pd.to_numeric(data3[10], errors='coerce').fillna(0)

    for _, row in data3.iterrows():
        m_raw = row[1]
        if pd.isna(m_raw) or not (1 <= int(m_raw) <= 12):
            continue
        m_num = int(m_raw)
        amt   = float(row[10])
        if amt <= 0:
            continue
        proj = str(row[3]).strip()
        customer, _ = find_customer_in_text(proj, company_names)
        if customer is None:
            # 고객사 미귀속 스튜디오 지원분 → 공통비 재배정
            rows.append({
                '출납월': m_num,
                '거래처': '이지런(스튜디오)',
                '현금계정과목': '컨텐츠개발원가',
                '비용분류_최종': '공통비',
                '고객사명': '[공통비]',
                '배분방법': '공통비(스튜디오미귀속)',
                'CP사명': '',
                '금액': amt,
                '원본금액': amt,
                '적요': proj,
            })
            continue
        customer = CUSTOMER_REMAP.get(customer, customer)
        rows.append({
            '출납월': m_num,
            '거래처': '이지런(스튜디오)',
            '현금계정과목': '컨텐츠개발원가',
            '비용분류_최종': '직접비(콘텐츠개발)',
            '고객사명': customer,
            '배분방법': '스튜디오지원',
            'CP사명': '',
            '금액': amt,
            '원본금액': amt,
            '적요': proj,
        })

    result = pd.DataFrame(rows)
    total   = result['금액'].sum()
    attrib  = result[result['고객사명'] != '[미분류]']['금액'].sum()
    print(f'   → {len(result):,}건 / 총 {total/1e8:.2f}억원')
    print(f'   → 귀속 {attrib/1e8:.2f}억 / 미분류 {(total-attrib)/1e8:.2f}억')
    return result

# ============================================================
# 5. BPO 처리
# ============================================================

def distribute_bpo(bpo_df, master_df):
    """BPO 인건비 → 월별 균등 배분 (프로젝트 기간 내, 매출 공백 포함)"""
    print('[처리] BPO 인건비 월별 배분 중...')

    # 프로젝트명 → 마스터 매핑
    def find_company(proj_name):
        proj_name = str(proj_name).strip()
        for _, row in master_df.iterrows():
            if proj_name in str(row['기업명_norm']) or str(row['기업명_norm']) in proj_name:
                return row['기업명_norm']
        return proj_name  # 미매칭 시 원래 이름 사용

    rows = []
    unmatched = []

    for _, bpo_row in bpo_df.iterrows():
        proj = bpo_row['프로젝트명']
        total = bpo_row['합계']

        # 직접 매핑 우선
        if proj in BPO_PROJECT_MAP:
            company = BPO_PROJECT_MAP[proj]
        else:
            company = find_company(proj)

        # 해당 기업의 월별 매출 (기간 파악용)
        matched = master_df[master_df['기업명_norm'].str.contains(
            re.escape(str(proj).strip()[:5]), na=False, regex=False
        )]

        if len(matched) == 0:
            # 매칭 실패: 12개월 균등
            monthly = total / 12
            for m in range(1, 13):
                rows.append({'출납월': m, '고객사명': company, '프로젝트명': proj,
                             '금액': monthly, '배분방법': '12개월균등(미매칭)', '비용분류_최종': '직접비(BPO)',
                             '현금계정과목': 'BPO인건비', '거래처': 'BPO인건비', 'CP사명': '', '원본금액': total})
            unmatched.append(proj)
            continue

        # 월별 매출 합산 (사업유형이 여러 개일 수 있음)
        monthly_sales = {}
        for m_col in MONTH_COLS:
            m_num = int(m_col.replace('월 매출', ''))
            monthly_sales[m_num] = matched[m_col].sum()

        # 프로젝트 기간: 첫 매출월 ~ 마지막 매출월
        active_months = [m for m, s in monthly_sales.items() if s > 0]
        if not active_months:
            active_months = list(range(1, 13))

        start_m = min(active_months)
        end_m   = max(active_months)
        period_months = list(range(start_m, end_m + 1))  # 공백 포함

        monthly_cost = total / len(period_months)

        for m in period_months:
            rows.append({
                '출납월': m,
                '고객사명': company,
                '프로젝트명': proj,
                '금액': monthly_cost,
                '배분방법': f'기간균등({start_m}~{end_m}월)',
                '비용분류_최종': '직접비(BPO)',
                '현금계정과목': 'BPO인건비',
                '거래처': 'BPO인건비',
                'CP사명': '',
                '원본금액': total,
            })

    bpo_result = pd.DataFrame(rows)
    if unmatched:
        print(f'   BPO 미매칭 프로젝트 ({len(unmatched)}개): {unmatched}')
    print(f'   → BPO 배분 {len(bpo_result):,}건 생성')
    return bpo_result

# ============================================================
# 5. 매출 테이블 구성
# ============================================================

def build_sales_table(master_df):
    """기업별 월별 매출 테이블"""
    rows = []
    for _, row in master_df.iterrows():
        company = row['기업명_norm']
        for m_col in MONTH_COLS:
            m_num = int(m_col.replace('월 매출', ''))
            sales = row[m_col]
            if sales > 0:
                rows.append({
                    '기업명': company,
                    '기업코드': row.get('기업코드', ''),
                    '팀': row.get('팀', ''),
                    '영업대표': row.get('영업대표', ''),
                    '사업유형': row.get('사업유형', ''),
                    '출납월': m_num,
                    '매출': sales,
                })
    return pd.DataFrame(rows)

# ============================================================
# 6. 통합 분석 테이블
# ============================================================

def build_contribution_margin(direct_df, bpo_df_result, sales_df, master_df):
    """기업별 공헌이익 산출"""

    # 직접비 집계 (기업별) - ERP + BPO + 콘텐츠개발비
    direct_cost = direct_df[direct_df['비용분류_최종'].isin(
        ['직접비', '직접비(BPO)', '직접비(콘텐츠개발)']
    )].copy()
    direct_cost = direct_cost[~direct_cost['고객사명'].isin(['[B2C-개인]', '[미분류]', '[공통비]', '[미정의계정]'])]

    cost_by_co = direct_cost.groupby('고객사명')['금액'].sum().reset_index()
    cost_by_co.columns = ['기업명', '총직접비']

    # 매출 집계 (기업별 연합계)
    sales_by_co = sales_df.groupby('기업명')['매출'].sum().reset_index()
    sales_by_co.columns = ['기업명', '연매출']

    # 팀/대표 정보 (DB_COMPANY_MERGE로 통합된 경우 팀 있는 행 우선)
    team_info = master_df[['기업명_norm', '팀', '영업대표', '사업유형']].copy()
    team_info['_has_team'] = team_info['팀'].notna() & (team_info['팀'].astype(str).str.strip() != '')
    team_info = (team_info.sort_values('_has_team', ascending=False)
                          .drop_duplicates('기업명_norm')
                          .drop(columns='_has_team'))
    team_info.columns = ['기업명', '팀', '영업대표', '사업유형']

    # 통합
    cm = pd.merge(sales_by_co, cost_by_co, on='기업명', how='outer')
    cm = pd.merge(cm, team_info, on='기업명', how='left')
    cm['연매출'] = cm['연매출'].fillna(0)
    cm['총직접비'] = cm['총직접비'].fillna(0)
    cm['공헌이익'] = cm['연매출'] - cm['총직접비']
    cm['공헌이익율'] = np.where(cm['연매출'] > 0, cm['공헌이익'] / cm['연매출'], np.nan)
    cm = cm.sort_values('연매출', ascending=False)

    return cm

def build_vendor_stats(erp_df):
    """거래처별 지급 통계"""
    df = erp_df.copy()
    df['거래처_정제'] = df['거래처'].astype(str).str.replace(r'^P', '', regex=True).str.strip()
    df = df[~df['현금계정과목'].isin(EXCLUDE_ACCOUNTS)]

    stats = df.groupby(['거래처_정제', '현금계정과목']).agg(
        지급금액=('원화금액', 'sum'),
        거래건수=('원화금액', 'count')
    ).reset_index()

    vendor_total = df.groupby('거래처_정제').agg(
        총지급금액=('원화금액', 'sum'),
        총거래건수=('원화금액', 'count')
    ).reset_index().sort_values('총지급금액', ascending=False)

    return vendor_total, stats

def build_monthly_pivot(direct_df):
    """기업별 월별 비용 피벗"""
    target = direct_df[direct_df['비용분류_최종'].isin(['직접비', '직접비(BPO)', '직접비(콘텐츠개발)'])]
    target = target[~target['고객사명'].isin(['[B2C-개인]', '[미분류]', '[공통비]', '[미정의계정]'])]

    pivot = target.pivot_table(
        index=['고객사명', '현금계정과목'],
        columns='출납월',
        values='금액',
        aggfunc='sum',
        fill_value=0
    ).reset_index()

    pivot.columns.name = None
    return pivot

def build_team_performance(cm_df):
    """팀/영업대표별 공헌이익"""
    team = cm_df.groupby(['팀', '영업대표']).agg(
        담당기업수=('기업명', 'count'),
        총매출=('연매출', 'sum'),
        총직접비=('총직접비', 'sum'),
        총공헌이익=('공헌이익', 'sum'),
    ).reset_index()
    team['공헌이익율'] = np.where(team['총매출'] > 0, team['총공헌이익'] / team['총매출'], np.nan)
    team = team.sort_values('총매출', ascending=False)
    return team

# ============================================================
# 7. 엑셀 출력
# ============================================================

def write_excel(direct_df, bpo_result, erp_df, cm_df, sales_df,
                vendor_total, vendor_stats, monthly_pivot, team_df, master_df):
    print(f'\n[출력] 엑셀 작성 중...')

    with pd.ExcelWriter(OUTPUT_FILE, engine='openpyxl') as writer:

        # Sheet 1: 직접비_통합 (ERP + BPO)
        output_cols = ['출납월','거래처','현금계정과목','비용분류_최종',
                       '고객사명','배분방법','CP사명','금액','원본금액','적요']
        bpo_out = bpo_result[output_cols].copy() if all(c in bpo_result.columns for c in output_cols) else bpo_result
        combined = pd.concat([
            direct_df[output_cols],
            bpo_out
        ], ignore_index=True)
        combined.to_excel(writer, sheet_name='직접비_통합RAW', index=False)

        # Sheet 2: 기업별_공헌이익
        cm_df.to_excel(writer, sheet_name='기업별_공헌이익', index=False)

        # Sheet 3: 팀대표별_실적
        team_df.to_excel(writer, sheet_name='팀대표별_실적', index=False)

        # Sheet 4: 기업별_월별_비용피벗
        monthly_pivot.to_excel(writer, sheet_name='기업별_월별비용_피벗', index=False)

        # Sheet 5: 기업별_월별_매출
        sales_df.to_excel(writer, sheet_name='기업별_월별매출', index=False)

        # Sheet 6: 거래처_통계
        vendor_total.to_excel(writer, sheet_name='거래처_통계', index=False)

        # Sheet 6b: 거래처_계정별
        vendor_stats.to_excel(writer, sheet_name='거래처_계정별', index=False)

        # Sheet 7: 고객사_마스터
        master_df.to_excel(writer, sheet_name='고객사_마스터', index=False)

        # Sheet 8: 미분류_검토 (고객사 귀속 못한 건)
        unresolved = direct_df[direct_df['고객사명'].isin(['[미분류]', '[미정의계정]'])]
        unresolved_out = unresolved[output_cols].sort_values('금액', ascending=False)
        unresolved_out.to_excel(writer, sheet_name='미분류_검토', index=False)

        # Sheet 9: 공통비
        common = direct_df[direct_df['비용분류_최종'] == '공통비']
        common[output_cols].to_excel(writer, sheet_name='공통비', index=False)

        # Sheet 10: BPO_배분내역
        bpo_result.to_excel(writer, sheet_name='BPO_배분내역', index=False)

        # Sheet 11b: 콘텐츠개발비 원본 (이지런)
        content_dev_out = direct_df[direct_df['비용분류_최종'] == '직접비(콘텐츠개발)']
        content_dev_out[output_cols].to_excel(writer, sheet_name='콘텐츠개발비_이지런', index=False)

        # Sheet 11: BPO_미매칭 체크
        bpo_check = bpo_result[['고객사명','프로젝트명','배분방법','원본금액']].drop_duplicates('프로젝트명')
        bpo_check.to_excel(writer, sheet_name='BPO_매핑확인', index=False)

    print(f'   → 저장 완료: {OUTPUT_FILE}')

# ============================================================
# MAIN
# ============================================================

if __name__ == '__main__':
    # 로드
    erp_df   = load_erp()
    cp_df    = load_cp()
    bpo_df   = load_bpo()
    db_df, db_all_df = load_databook()

    # 기준 테이블
    master_df    = build_company_master(db_df, db_all_df, bpo_df)
    company_names = build_company_name_list(master_df, db_all_df, cp_df, bpo_df)
    cp_ratios, b2c_ratios = build_cp_customer_ratios(cp_df)

    print(f'\n[기준] 고객사 이름 사전: {len(company_names)}개 이름')

    # ERP 처리
    direct_df, exclude_df = process_erp(erp_df, company_names, cp_ratios, b2c_ratios)

    # 이지런 콘텐츠개발비 처리
    content_dev_result = load_content_dev(company_names)
    for col in ['출납월','거래처','현금계정과목','비용분류_최종','고객사명',
                '배분방법','CP사명','금액','원본금액','적요']:
        if col not in content_dev_result.columns:
            content_dev_result[col] = ''

    # ERP + 콘텐츠개발비 통합 (BPO는 별도)
    direct_df = pd.concat([direct_df, content_dev_result], ignore_index=True)

    # BPO 처리
    bpo_result = distribute_bpo(bpo_df, master_df)

    # BPO 컬럼 정리
    for col in ['출납월','거래처','현금계정과목','비용분류_최종','고객사명',
                '배분방법','CP사명','금액','원본금액','적요']:
        if col not in bpo_result.columns:
            bpo_result[col] = ''
    bpo_result['적요'] = bpo_result.get('프로젝트명', '')

    # 매출 테이블
    sales_df = build_sales_table(master_df)

    # 분석 테이블
    cm_df = build_contribution_margin(direct_df, bpo_result, sales_df, master_df)
    vendor_total, vendor_stats = build_vendor_stats(erp_df)
    monthly_pivot = build_monthly_pivot(pd.concat([direct_df, bpo_result], ignore_index=True))
    team_df = build_team_performance(cm_df)

    # 요약 출력
    print('\n' + '='*60)
    print('[요약]')
    direct_only = direct_df[direct_df['비용분류_최종'].isin(['직접비'])]
    unresolved  = direct_df[direct_df['고객사명'] == '[미분류]']
    b2c_rows    = direct_df[direct_df['고객사명'] == '[B2C-개인]']
    print(f'  직접비 총액:    {direct_only["금액"].sum()/1e8:.2f}억원')
    print(f'  BPO 총액:       {bpo_result["금액"].sum()/1e8:.2f}억원')
    print(f'  공통비 총액:    {direct_df[direct_df["비용분류_최종"]=="공통비"]["금액"].sum()/1e8:.2f}억원')
    internal = direct_df[direct_df['비용분류_최종'] == '직접비(내부계열사)']
    print(f'  미분류 건수:    {len(unresolved):,}건 ({unresolved["금액"].sum()/1e8:.2f}억원)')
    print(f'  내부계열사:     {internal["금액"].sum()/1e8:.2f}억원 (휴넷이지런 등)')
    print(f'  B2C 귀속:       {b2c_rows["금액"].sum()/1e8:.2f}억원')
    print(f'  매출 총액(확정): {sales_df["매출"].sum()/1e8:.2f}억원')
    print(f'  공헌이익:       {cm_df["공헌이익"].sum()/1e8:.2f}억원')
    print('='*60)

    # 출력
    write_excel(direct_df, bpo_result, erp_df, cm_df, sales_df,
                vendor_total, vendor_stats, monthly_pivot, team_df, master_df)

    print('\n완료!')
