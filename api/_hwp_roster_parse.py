# -*- coding: utf-8 -*-
"""
HWP(한/글) 반별명단 파일을 파싱해서 앱 데이터 구조(JSON)로 변환합니다.
- 표(테이블)의 rowspan/colspan을 직접 펼쳐서 격자(grid)로 재구성합니다.
- HWP 문서 특유의 "스페이서 행"(rowspan 때문에 생기는 유령 중복 행)을 제거합니다.
- "OO세 N명 (담당목사)" 형태의 학년 헤더와 "OO반 선생님1 선생님2 N명" 형태의 반 헤더를 정규식으로 인식합니다.
- 문서 전체 텍스트에서 "2026년" 같은 연도 표기를 찾아 detectedYear로 반환합니다 (없으면 None).

이 모듈은 pyhwp(hwp5) 순수 파이썬 패키지를 이 저장소에 그대로 벤더링해서 사용합니다
(api/_vendor/hwp5). pyhwp를 pip로 설치하지 않는 이유: pyhwp의 setup.py가 최신
setuptools와 호환되지 않아 빌드 환경에 따라 설치가 실패할 수 있기 때문입니다.
pyhwp 자체는 100% 순수 파이썬(컴파일 확장 없음)이라 소스를 그대로 가져와 import해도
동작에 문제가 없음을 확인했습니다. 실제로 필요한 외부 의존성(lxml, olefile,
cryptography, six)은 모두 정상적인 최신 패키지이며 requirements.txt에 명시되어 있습니다.
"""
import os
import re
import sys
import warnings
import tempfile
import shutil
from contextlib import closing

_VENDOR_DIR = os.path.join(os.path.dirname(__file__), "_vendor")
if _VENDOR_DIR not in sys.path:
    sys.path.insert(0, _VENDOR_DIR)

from bs4 import BeautifulSoup  # noqa: E402
try:
    from bs4 import XMLParsedAsHTMLWarning
    warnings.filterwarnings("ignore", category=XMLParsedAsHTMLWarning)
except Exception:
    pass

from hwp5.xmlmodel import Hwp5File  # noqa: E402
from hwp5.hwp5html import HTMLTransform  # noqa: E402
from hwp5.hwp5txt import TextTransform  # noqa: E402


AGE_HEADER_RE = re.compile(r"^(\S+세)\s*(\d+)\s*명\s*(.*)$")
CLASS_HEADER_RE = re.compile(r"^(\S+?)\s+(.*?)\s*(\d+)\s*명$")
YEAR_RE = re.compile(r"(20\d{2})\s*년")


def _expand_table(table_tag):
    """<table> 태그를 rowspan/colspan까지 펼친 2차원 리스트로 변환합니다.
    각 행은 (values, new_cols) 튜플로 반환합니다. new_cols는 이번 행에서 "새로
    시작된"(즉 rowspan으로 위에서 내려온 값이 아니라 실제 <td>가 있는) 컬럼 인덱스의
    집합입니다 - 이 정보가 있어야 rowspan으로 반복되는 값(예: 학년/반 헤더)을
    "매 행마다 새로운 헤더"로 잘못 인식하는 걸 막을 수 있습니다."""
    rows_out = []
    pending = {}  # {col_index: [remaining_rowspan, value]}
    for tr in table_tag.find_all("tr", recursive=False) or table_tag.find_all("tr"):
        row = dict()
        new_cols = set()
        cells = tr.find_all(["td", "th"], recursive=False)
        c = 0
        cell_iter = iter(cells)
        current_cell = next(cell_iter, None)
        while current_cell is not None or any(v[0] > 0 for v in pending.values() if v):
            if c in pending and pending[c][0] > 0:
                row[c] = pending[c][1]
                pending[c][0] -= 1
                if pending[c][0] <= 0:
                    del pending[c]
                c += 1
                continue
            if current_cell is None:
                c += 1
                if c > 200:
                    break
                continue
            colspan = int(current_cell.get("colspan", 1) or 1)
            rowspan = int(current_cell.get("rowspan", 1) or 1)
            text = current_cell.get_text(" ", strip=True)
            for k in range(colspan):
                row[c] = text
                new_cols.add(c)
                if rowspan > 1:
                    pending[c] = [rowspan - 1, text]
                c += 1
            current_cell = next(cell_iter, None)
        maxcol = max(row.keys()) if row else -1
        rows_out.append(([row.get(i, "") for i in range(maxcol + 1)], new_cols))
    return rows_out


def _dedup_phantom_rows(rows):
    """rowspan 스페이서 행 때문에 생기는, 실제 데이터가 전혀 없는(=이번 행에서 새로
    시작된 컬럼이 하나도 없는) 유령 행을 제거합니다."""
    return [(values, new_cols) for (values, new_cols) in rows if new_cols]


def parse_age_header(s):
    m = AGE_HEADER_RE.match(s.strip())
    if not m:
        return None
    age, _cnt, pastor = m.group(1), m.group(2), m.group(3).replace(" ", "")
    return age, pastor


def parse_class_header(s):
    m = CLASS_HEADER_RE.match(s.strip())
    if not m:
        return None
    name, mid, _cnt = m.group(1), m.group(2).strip(), m.group(3)
    return name, (mid.split() if mid else [])


def _normalize_dob(raw):
    """문서에 적힌 생년월일 표기를 최대한 앱 표준 형식("YY.MM.DD")으로 정리합니다.
    이미 YY.MM.DD 형태면 공백만 제거하고 그대로 둡니다. 인식 불가하면 원문 그대로 반환합니다."""
    if not raw:
        return ""
    s = re.sub(r"\s+", "", raw.strip())
    s = s.rstrip(".")  # HWP 원문에 "21.09.16." 처럼 끝에 마침표가 붙어 있는 경우가 있어 제거합니다.
    m = re.match(r"^(\d{2})[.\-/](\d{1,2})[.\-/](\d{1,2})$", s)
    if m:
        yy, mo, dd = m.group(1), m.group(2).zfill(2), m.group(3).zfill(2)
        return f"{yy}.{mo}.{dd}"
    return raw.strip()


def _clean(s):
    s = re.sub(r"\s+", " ", (s or "")).strip()
    # HWP 원문에 "김민정A" 같은 부모 이름 뒤 구분자를 "/"로 적으면서 앞뒤에 불규칙한
    # 공백이 섞여 있는 경우가 많아("선정우 / 조연지", "106 /1403") "/" 주변 공백을 정리합니다.
    s = re.sub(r"\s*/\s*", "/", s)
    return s


def _clean_name(s):
    """이름 안에 글자 간격을 주려고 넣은 공백(예: "선 호", "임 하 은")을 전부 제거합니다."""
    return re.sub(r"\s+", "", (s or "")).strip()


def parse_roster_hwp(hwp_path):
    """HWP 파일 경로를 받아 구조화된 dict를 반환합니다.

    반환 형식:
    {
      "detectedYear": 2026 또는 None,
      "sourceTitle": "문서에서 찾은 제목 텍스트 일부" 또는 "",
      "ageGroups": [ { "age": "5세", "pastor": "임하은", "classes": [
          { "name": "믿음반", "teachers": ["박은혜"],
            "members": [ {"name":..,"dob":..,"gender":..,"phone":..,"address":..,"note":..}, ... ] }
      ] } ],
      "newClass": { "members": [...] },   # 신입반
      "altList": { "members": [...] }     # 별명부
    }
    """
    tmpdir = tempfile.mkdtemp(prefix="hwproster_")
    try:
        with closing(Hwp5File(hwp_path)) as hwp5file:
            html_t = HTMLTransform()
            html_t.transform_hwp5_to_dir(hwp5file, tmpdir)
        with closing(Hwp5File(hwp_path)) as hwp5file:
            text_t = TextTransform()
            text_path = os.path.join(tmpdir, "plain.txt")
            with open(text_path, "wb") as f:
                text_t.transform_hwp5_to_text(hwp5file, f)

        with open(os.path.join(tmpdir, "index.xhtml"), "rb") as f:
            xhtml_bytes = f.read()
        soup = BeautifulSoup(xhtml_bytes, "lxml")

        # ---- 연도 인식 ----
        try:
            with open(text_path, "r", encoding="utf-8", errors="ignore") as f:
                plain_text = f.read()
        except Exception:
            plain_text = ""
        year_match = YEAR_RE.search(plain_text)
        detected_year = int(year_match.group(1)) if year_match else None
        source_title = _clean(plain_text.splitlines()[0]) if plain_text.strip() else ""

        # ---- 표 파싱 ----
        tables = soup.find_all("table")
        all_rows = []
        for t in tables:
            rows = _expand_table(t)
            if rows:
                rows = rows[1:]  # 첫 행은 표 헤더(이름/생년월일/... 컬럼 라벨)이므로 제외
            all_rows.extend(rows)
        all_rows = _dedup_phantom_rows(all_rows)

        # 실제 표의 컬럼 구성은 [0]=학년 라벨(그 학년 전체에 걸친 rowspan),
        # [1]=반 이름/특수섹션 라벨("믿음반 박은혜 5명", "별명부 5명", "신입반 10명" 등,
        # 해당 반/섹션 인원수만큼 rowspan), [2]=이름 [3]=생년월일 [4]=성별 [5]=전화번호
        # [6]=주소 [7]=비고 입니다. 라벨 칸과 그 라벨의 "첫 번째" 회원 데이터가 같은 행에
        # 같이 나타나는 경우가 많고([0]/[1]/[2..7]이 모두 새로 시작), 라벨만 단독으로 있는
        # 행도 있습니다(반이 바뀌면서 이전 반의 rowspan이 아직 안 끝난 경우). 그래서
        # "라벨 처리"와 "회원 데이터 처리"는 서로 배타적(continue)이 아니라 각 컬럼이 이번
        # 행에서 새로 시작됐는지([0],[1],[2] 각각)를 독립적으로 확인해서 함께 처리합니다.
        age_groups = []  # [{age, pastor, classes: [{name, teachers, members}]}]
        cur_age_group = None
        cur_class = None
        special = {"신입반": [], "별명부": []}
        cur_special = None

        def col(values, i):
            return _clean(values[i]) if i < len(values) else ""

        for values, new_cols in all_rows:
            col0_new = 0 in new_cols
            col1_new = 1 in new_cols
            col2_new = 2 in new_cols
            v0 = col(values, 0)
            v1 = col(values, 1)

            if col0_new and v0:
                age_hdr = parse_age_header(v0)
                if age_hdr:
                    age, pastor = age_hdr
                    cur_age_group = {"age": age, "pastor": pastor, "classes": []}
                    age_groups.append(cur_age_group)
                    cur_class = None
                    cur_special = None

            if col1_new and v1:
                cls_hdr = parse_class_header(v1)
                if cls_hdr:
                    cname, teachers = cls_hdr
                    if cname == "별명부":
                        cur_special = "별명부"
                        cur_class = None
                    elif cname in ("신입반", "미배정자", "미배정"):
                        cur_special = "신입반"
                        cur_class = None
                    else:
                        cur_class = {"name": cname, "teachers": teachers, "members": []}
                        cur_special = None
                        if cur_age_group is not None:
                            cur_age_group["classes"].append(cur_class)

            v0_nospace = v0.replace(" ", "")
            if v0_nospace in ("총재적", "총재적수", "합계", "총계"):
                # 표 맨 아래 "총 재적 / 총60명(재적55+별명부5)" 같은 요약(footer) 행입니다.
                # 오른쪽 칸("총60명(...)")이 회원 데이터처럼 보여도 이 행 전체를 무시합니다.
                continue

            if col2_new:
                name = _clean_name(values[2] if 2 < len(values) else "")
                if name and name != "이름":
                    member = {
                        "name": name,
                        "dob": _normalize_dob(col(values, 3)),
                        "gender": col(values, 4),
                        "phone": col(values, 5),
                        "address": col(values, 6),
                        "note": col(values, 7),
                    }
                    if cur_special:
                        special[cur_special].append(member)
                    elif cur_class is not None:
                        cur_class["members"].append(member)
                    # else: 어디에도 속하지 않는 행 -> 무시 (표 스타일 잔재 등)

        return {
            "detectedYear": detected_year,
            "sourceTitle": source_title,
            "ageGroups": age_groups,
            "newClass": {"members": special["신입반"]},
            "altList": {"members": special["별명부"]},
        }
    finally:
        shutil.rmtree(tmpdir, ignore_errors=True)
