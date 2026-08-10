# -*- coding: utf-8 -*-
"""POST /api/parse-roster-hwp
매년 새로 받는 한글(HWP) 반별명단 파일을 업로드하면, 그 안의 표를 분석해서
{ detectedYear, sourceTitle, ageGroups, newClass, altList } 형태의 JSON으로 돌려줍니다.
실제로 데이터베이스에 저장하는 것은 프론트엔드에서 사용자가 미리보기를 확인하고
"반영하기"를 누른 뒤 /api/state (PUT)로 별도 처리합니다 - 이 엔드포인트는 "분석"만 담당합니다.

인증: Node.js 쪽 /api/*.js 와 동일하게 Authorization: Bearer <supabase access_token>이
필요합니다. 다만 이 파일은 파이썬 서버리스 함수라 Node용 supabase-js를 쓸 수 없으므로,
Supabase Auth REST 엔드포인트(GET /auth/v1/user)를 직접 호출해서 토큰을 검증합니다.
"""
import os
import sys
import json
import tempfile
import urllib.request
import urllib.error
from http.server import BaseHTTPRequestHandler

sys.path.insert(0, os.path.dirname(__file__))
from _hwp_roster_parse import parse_roster_hwp  # noqa: E402
from _multipart import parse_multipart  # noqa: E402

SUPABASE_URL = os.environ.get("SUPABASE_URL", "")
SUPABASE_SERVICE_ROLE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY", "")
MAX_UPLOAD_BYTES = 30 * 1024 * 1024  # 30MB


def _verify_auth(auth_header):
    """Node 쪽 lib/verifyAuth.js와 동일한 역할: Bearer 토큰을 Supabase에 직접 물어봐서
    유효한 로그인 사용자인지 확인합니다. supabase 파이썬 패키지를 추가로 설치하지 않기
    위해 REST 엔드포인트를 urllib로 직접 호출합니다."""
    if not auth_header or not auth_header.startswith("Bearer "):
        return None
    token = auth_header[len("Bearer "):].strip()
    if not token or not SUPABASE_URL or not SUPABASE_SERVICE_ROLE_KEY:
        return None
    req = urllib.request.Request(
        SUPABASE_URL.rstrip("/") + "/auth/v1/user",
        headers={
            "apikey": SUPABASE_SERVICE_ROLE_KEY,
            "Authorization": "Bearer " + token,
        },
    )
    try:
        with urllib.request.urlopen(req, timeout=10) as resp:
            return json.loads(resp.read().decode("utf-8"))
    except urllib.error.HTTPError:
        return None
    except Exception:
        return None


class handler(BaseHTTPRequestHandler):
    def _send_json(self, status, obj):
        body = json.dumps(obj, ensure_ascii=False).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def do_POST(self):
        user = _verify_auth(self.headers.get("Authorization"))
        if not user:
            self._send_json(401, {"error": "로그인이 필요합니다."})
            return

        content_type = self.headers.get("Content-Type", "")
        if "multipart/form-data" not in content_type:
            self._send_json(400, {"error": "파일을 multipart/form-data로 업로드해주세요."})
            return

        try:
            length = int(self.headers.get("Content-Length", 0) or 0)
        except ValueError:
            length = 0
        if length <= 0 or length > MAX_UPLOAD_BYTES:
            self._send_json(400, {"error": "파일 크기가 올바르지 않습니다 (30MB 이하만 가능)."})
            return

        raw_body = self.rfile.read(length)

        try:
            fields = parse_multipart(raw_body, content_type)
        except Exception as e:
            self._send_json(400, {"error": "업로드된 파일을 읽지 못했습니다: " + str(e)})
            return

        file_field = fields.get("file")
        if not file_field or not file_field[0]:
            self._send_json(400, {"error": "file 필드(첨부 파일)가 없습니다."})
            return

        filename, file_bytes = file_field
        if not filename.lower().endswith(".hwp"):
            self._send_json(400, {"error": "HWP(.hwp) 파일만 업로드할 수 있습니다."})
            return

        tmp_path = None
        try:
            fd, tmp_path = tempfile.mkstemp(suffix=".hwp")
            with os.fdopen(fd, "wb") as f:
                f.write(file_bytes)
            result = parse_roster_hwp(tmp_path)
            self._send_json(200, result)
        except Exception as e:
            self._send_json(500, {"error": "한글 파일을 분석하지 못했습니다: " + str(e)})
        finally:
            if tmp_path and os.path.exists(tmp_path):
                try:
                    os.remove(tmp_path)
                except Exception:
                    pass

    def do_GET(self):
        self._send_json(405, {"error": "허용되지 않은 요청입니다. (POST로 파일을 업로드해주세요)"})
