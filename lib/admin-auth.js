const crypto = require("crypto");
function safeEqual(a, b) {
  const aa = Buffer.from(String(a || ""));
  const bb = Buffer.from(String(b || ""));
  return aa.length === bb.length && crypto.timingSafeEqual(aa, bb);
}
function base32Decode(input) {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
  const clean = String(input || "").toUpperCase().replace(/=+$/g, "").replace(/\s/g, "");
  let bits = "";
  for (const char of clean) {
    const index = alphabet.indexOf(char);
    if (index < 0) throw new Error("Invalid base32 secret");
    bits += index.toString(2).padStart(5, "0");
  }
  const bytes = [];
  for (let i = 0; i + 8 <= bits.length; i += 8) bytes.push(parseInt(bits.slice(i, i + 8), 2));
  return Buffer.from(bytes);
}
function totpAt(secret, counter) {
  const key = base32Decode(secret);
  const msg = Buffer.alloc(8);
  msg.writeBigUInt64BE(BigInt(counter));
  const hmac = crypto.createHmac("sha1", key).update(msg).digest();
  const offset = hmac[hmac.length - 1] & 15;
  return String((hmac.readUInt32BE(offset) & 0x7fffffff) % 1000000).padStart(6, "0");
}
function verifyTotp(secret, code) {
  if (!/^\d{6}$/.test(String(code || ""))) return false;
  const step = Math.floor(Date.now() / 30000);
  return [-1, 0, 1].some(delta => safeEqual(totpAt(secret, step + delta), code));
}
function sign(payload, secret) {
  const data = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return data + "." + crypto.createHmac("sha256", secret).update(data).digest("base64url");
}
function readSession(req) {
  const cookie = req.headers.cookie || "";
  const token = cookie.split(";").map(v => v.trim()).find(v => v.startsWith("portfolio_admin="))?.slice("portfolio_admin=".length);
  if (!token || !process.env.SESSION_SECRET) return false;
  const [data, sig] = token.split(".");
  if (!data || !sig) return false;
  const expected = crypto.createHmac("sha256", process.env.SESSION_SECRET).update(data).digest("base64url");
  if (!safeEqual(sig, expected)) return false;
  try {
    const payload = JSON.parse(Buffer.from(data, "base64url").toString("utf8"));
    return payload.admin === true && payload.exp > Math.floor(Date.now() / 1000);
  } catch { return false; }
}
function setSessionCookie(res) {
  const now = Math.floor(Date.now() / 1000);
  const token = sign({ admin: true, iat: now, exp: now + 8 * 60 * 60 }, process.env.SESSION_SECRET);
  res.setHeader("Set-Cookie", "portfolio_admin=" + token + "; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=28800");
}
function clearSessionCookie(res) {
  res.setHeader("Set-Cookie", "portfolio_admin=; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=0");
}
function isSameOrigin(req) {
  const origin = req.headers.origin;
  if (!origin) return true;
  const host = req.headers["x-forwarded-host"] || req.headers.host;
  try { return !!host && new URL(origin).host === host; } catch { return false; }
}
module.exports = { safeEqual, verifyTotp, readSession, setSessionCookie, clearSessionCookie, isSameOrigin };
