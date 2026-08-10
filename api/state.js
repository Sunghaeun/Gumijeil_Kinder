// GET    /api/state?key=roster_2026|roster_meta|attendance  -> { data: <저장된 JSON 또는 null> }
// PUT    /api/state   body { key: "roster_2026"|"roster_meta"|"attendance", data: {...} }
// DELETE /api/state?key=roster_2020  (연도별 반별명단 백업만 삭제 가능 - 5년 보관기간 자동 정리용)
//
// 반드시 로그인(Authorization: Bearer <token>)이 있어야 응답합니다.
// 실제 데이터베이스 접근은 서비스 역할 키(service role key)를 가진 서버에서만 이루어지고,
// 이 테이블은 Row Level Security로 잠겨 있어 브라우저에서 Supabase로 직접 접근할 수 없습니다.
const { supabaseAdmin } = require("../lib/supabaseAdmin");
const { verifyAuth } = require("../lib/verifyAuth");

// "roster"는 연도별 구조 도입 이전의 예전 키(하위 호환용으로 계속 읽을 수 있게 허용).
// "roster_2026"처럼 연도별로 나뉜 반별명단 키와, 그 목록/현재연도를 담는 "roster_meta",
// 그리고 연도와 무관한 "attendance"(출석부)만 허용합니다.
const STATIC_ALLOWED_KEYS = new Set(["roster", "attendance", "roster_meta"]);
const YEAR_KEY_RE = /^roster_\d{4}$/;

function isAllowedKey(key) {
  return typeof key === "string" && (STATIC_ALLOWED_KEYS.has(key) || YEAR_KEY_RE.test(key));
}

module.exports = async function handler(req, res) {
  const user = await verifyAuth(req);
  if (!user) {
    res.status(401).json({ error: "로그인이 필요합니다." });
    return;
  }

  if (req.method === "GET") {
    const key = req.query.key;
    if (!isAllowedKey(key)) { res.status(400).json({ error: "잘못된 key 입니다." }); return; }

    const { data, error } = await supabaseAdmin()
      .from("app_state")
      .select("data")
      .eq("key", key)
      .maybeSingle();

    if (error) { res.status(500).json({ error: error.message }); return; }
    res.status(200).json({ data: data ? data.data : null });
    return;
  }

  if (req.method === "PUT") {
    const { key, data } = req.body || {};
    if (!isAllowedKey(key)) { res.status(400).json({ error: "잘못된 key 입니다." }); return; }
    if (data === undefined) { res.status(400).json({ error: "data가 필요합니다." }); return; }

    const { error } = await supabaseAdmin()
      .from("app_state")
      .upsert({ key, data, updated_at: new Date().toISOString(), updated_by: user.email || user.id }, { onConflict: "key" });

    if (error) { res.status(500).json({ error: error.message }); return; }
    res.status(200).json({ ok: true });
    return;
  }

  if (req.method === "DELETE") {
    const key = req.query.key;
    // 삭제는 연도별 백업(roster_YYYY)에 대해서만 허용합니다 (5년 지난 자료 자동 파기용).
    // "roster_meta"나 "attendance" 같은 핵심 키는 실수로라도 지울 수 없게 막습니다.
    if (!YEAR_KEY_RE.test(key || "")) { res.status(400).json({ error: "잘못된 key 입니다." }); return; }

    const { error } = await supabaseAdmin().from("app_state").delete().eq("key", key);
    if (error) { res.status(500).json({ error: error.message }); return; }
    res.status(200).json({ ok: true });
    return;
  }

  res.status(405).json({ error: "허용되지 않은 요청입니다." });
};
