// 서버(백엔드)에서만 사용하는 Supabase 클라이언트입니다.
// SUPABASE_SERVICE_ROLE_KEY는 절대로 프론트엔드(브라우저) 코드에 노출되면 안 됩니다.
// Vercel 프로젝트의 환경변수(Environment Variables)에만 설정하세요.
const { createClient } = require("@supabase/supabase-js");

let _admin = null;
function supabaseAdmin() {
  if (_admin) return _admin;
  const url = process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    throw new Error("SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY 환경변수가 설정되지 않았습니다.");
  }
  _admin = createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  });
  return _admin;
}

module.exports = { supabaseAdmin };
