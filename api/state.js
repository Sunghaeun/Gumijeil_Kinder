// GET  /api/state?key=roster|attendance  -> { data: <저장된 JSON 또는 null> }
// PUT  /api/state   body { key: "roster"|"attendance", data: {...} }
//
// 반드시 로그인(Authorization: Bearer <token>)이 있어야 응답합니다.
// 실제 데이터베이스 접근은 서비스 역할 키(service role key)를 가진 서버에서만 이루어지고,
// 이 테이블은 Row Level Security로 잠겨 있어 브라우저에서 Supabase로 직접 접근할 수 없습니다.
const { supabaseAdmin } = require("../lib/supabaseAdmin");
const { verifyAuth } = require("../lib/verifyAuth");

const ALLOWED_KEYS = new Set(["roster", "attendance"]);

module.exports = async function handler(req, res) {
  const user = await verifyAuth(req);
  if (!user) {
    res.status(401).json({ error: "로그인이 필요합니다." });
    return;
  }

  if (req.method === "GET") {
    const key = req.query.key;
    if (!ALLOWED_KEYS.has(key)) { res.status(400).json({ error: "잘못된 key 입니다." }); return; }

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
    if (!ALLOWED_KEYS.has(key)) { res.status(400).json({ error: "잘못된 key 입니다." }); return; }
    if (data === undefined) { res.status(400).json({ error: "data가 필요합니다." }); return; }

    const { error } = await supabaseAdmin()
      .from("app_state")
      .upsert({ key, data, updated_at: new Date().toISOString(), updated_by: user.email || user.id }, { onConflict: "key" });

    if (error) { res.status(500).json({ error: error.message }); return; }
    res.status(200).json({ ok: true });
    return;
  }

  res.status(405).json({ error: "허용되지 않은 요청입니다." });
};
