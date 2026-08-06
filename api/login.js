// POST /api/login  { email, password } -> { access_token, refresh_token, expires_at }
// Supabase Auth에 등록된 사용자(교사/관리자)만 로그인할 수 있습니다.
// 사용자 계정은 Supabase 대시보드(Authentication > Users)에서 직접 추가하세요.
// 이 엔드포인트는 회원가입 기능을 제공하지 않습니다 (누구나 계정을 만들 수 없도록).
const { createClient } = require("@supabase/supabase-js");

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "허용되지 않은 요청입니다." });
    return;
  }

  const { email, password } = req.body || {};
  if (!email || !password) {
    res.status(400).json({ error: "이메일과 비밀번호를 입력해주세요." });
    return;
  }

  const url = process.env.SUPABASE_URL;
  const anonKey = process.env.SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    res.status(500).json({ error: "서버 설정 오류입니다. 관리자에게 문의하세요." });
    return;
  }

  const supabase = createClient(url, anonKey, { auth: { persistSession: false } });
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error || !data.session) {
    res.status(401).json({ error: "이메일 또는 비밀번호가 올바르지 않습니다." });
    return;
  }

  res.status(200).json({
    access_token: data.session.access_token,
    refresh_token: data.session.refresh_token,
    expires_at: data.session.expires_at
  });
};
