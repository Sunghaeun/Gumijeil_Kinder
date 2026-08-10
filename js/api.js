/* 서버 API 통신 담당 (예전 localStorage 자리를 대신합니다) */

const AUTH_KEY = "gmch_auth_session";

function getSession() {
  try { return JSON.parse(localStorage.getItem(AUTH_KEY) || "null"); } catch (e) { return null; }
}

function setSession(session) {
  localStorage.setItem(AUTH_KEY, JSON.stringify(session));
}

function clearSession() {
  localStorage.removeItem(AUTH_KEY);
}

function isLoggedIn() {
  const s = getSession();
  return !!(s && s.access_token);
}

function logout() {
  clearSession();
  location.href = "login.html";
}

async function apiGet(key) {
  const session = getSession();
  const res = await fetch(`/api/state?key=${encodeURIComponent(key)}`, {
    headers: { "Authorization": "Bearer " + (session ? session.access_token : "") }
  });
  if (res.status === 401) { clearSession(); location.href = "login.html"; return null; }
  if (!res.ok) throw new Error("불러오기 실패");
  const body = await res.json();
  return body.data;
}

async function apiPut(key, data) {
  const session = getSession();
  const res = await fetch("/api/state", {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      "Authorization": "Bearer " + (session ? session.access_token : "")
    },
    body: JSON.stringify({ key, data })
  });
  if (res.status === 401) { clearSession(); location.href = "login.html"; return null; }
  if (!res.ok) throw new Error("저장 실패");
  return res.json();
}

async function apiDelete(key) {
  const session = getSession();
  const res = await fetch(`/api/state?key=${encodeURIComponent(key)}`, {
    method: "DELETE",
    headers: { "Authorization": "Bearer " + (session ? session.access_token : "") }
  });
  if (res.status === 401) { clearSession(); location.href = "login.html"; return null; }
  if (!res.ok) throw new Error("삭제 실패");
  return res.json();
}

/* 보호된 페이지(index.html) 맨 위에서 호출: 로그인 안 되어 있으면 로그인 화면으로 이동 */
function requireLogin() {
  if (!isLoggedIn()) {
    location.href = "login.html";
    return false;
  }
  return true;
}
