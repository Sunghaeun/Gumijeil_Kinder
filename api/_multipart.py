# -*- coding: utf-8 -*-
"""아주 단순한 multipart/form-data 파서입니다.
Vercel의 파이썬 서버리스 함수는 Flask/express 같은 프레임워크 없이 raw HTTP 요청을 직접
다루므로, cgi 모듈(파이썬 3.13부터 제거 예정) 대신 이 작은 파서를 직접 구현해서 사용합니다.
파일 업로드 1개 + 몇 개의 텍스트 필드 정도의 단순한 폼만 다루면 되므로, 범용 multipart
스펙 전체를 구현하지는 않습니다."""
import re


def parse_multipart(raw_body, content_type):
    """raw_body(bytes)와 Content-Type 헤더 문자열을 받아 {field_name: (filename_or_None, bytes)}
    형태의 dict를 반환합니다. boundary를 찾지 못하면 ValueError를 발생시킵니다."""
    m = re.search(r'boundary="?([^";]+)"?', content_type or "")
    if not m:
        raise ValueError("multipart boundary를 찾을 수 없습니다.")
    boundary = m.group(1).encode("utf-8")
    delimiter = b"--" + boundary

    fields = {}
    parts = raw_body.split(delimiter)
    for part in parts:
        if not part or part in (b"--\r\n", b"--", b"\r\n"):
            continue
        part = part.strip(b"\r\n")
        if not part:
            continue
        if b"\r\n\r\n" not in part:
            continue
        header_bytes, content = part.split(b"\r\n\r\n", 1)
        headers_text = header_bytes.decode("utf-8", errors="ignore")
        name_match = re.search(r'name="([^"]*)"', headers_text)
        if not name_match:
            continue
        field_name = name_match.group(1)
        filename_match = re.search(r'filename="([^"]*)"', headers_text)
        filename = filename_match.group(1) if filename_match else None
        if content.endswith(b"\r\n"):
            content = content[:-2]
        fields[field_name] = (filename, content)
    return fields
