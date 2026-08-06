// 요청 헤더의 Authorization: Bearer <access_token> 을 Supabase Auth로 검증합니다.
// 유효하지 않으면 null을 반환합니다 (호출한 쪽에서 401 처리).
const { supabaseAdmin } = require("./supabaseAdmin");

async function verifyAuth(req) {
  const header = req.headers["authorization"] || req.headers["Authorization"];
  if (!header || !header.startsWith("Bearer ")) return null;
  const token = header.slice("Bearer ".length).trim();
  if (!token) return null;

  try {
    const { data, error } = await supabaseAdmin().auth.getUser(token);
    if (error || !data || !data.user) return null;
    return data.user;
  } catch (e) {
    return null;
  }
}

module.exports = { verifyAuth };
