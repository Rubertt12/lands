const { safeEqual, verifyTotp, readSession, setSessionCookie, clearSessionCookie, isSameOrigin } = require("../lib/admin-auth");
const loginAttempts = new Map();
module.exports = async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("X-Content-Type-Options", "nosniff");
  if (req.method !== "POST") { res.setHeader("Allow", "POST"); return res.status(405).json({ error: "Método não permitido." }); }
  if (!isSameOrigin(req)) return res.status(403).json({ error: "Origem não autorizada." });
  const { action, password, code } = req.body || {};
  if (action === "check") return res.status(200).json({ authenticated: readSession(req) });
  if (action === "logout") { clearSessionCookie(res); return res.status(200).json({ ok: true }); }
  if (action !== "login") return res.status(400).json({ error: "Ação inválida." });
  const ip = String(req.headers["x-forwarded-for"] || "unknown").split(",")[0].trim();
  const now = Date.now();
  const record = loginAttempts.get(ip);
  if (record && record.resetAt > now && record.count >= 8) return res.status(429).json({ error: "Muitas tentativas. Aguarde alguns minutos e tente novamente." });
  if (!process.env.ADMIN_PASSWORD || !process.env.ADMIN_TOTP_SECRET || !process.env.SESSION_SECRET)
    return res.status(503).json({ error: "Configure as variáveis secretas do administrador no Vercel antes de entrar." });
  try {
    if (!safeEqual(password, process.env.ADMIN_PASSWORD) || !verifyTotp(process.env.ADMIN_TOTP_SECRET, code)) {
      const current = loginAttempts.get(ip);
      loginAttempts.set(ip, { count: current && current.resetAt > now ? current.count + 1 : 1, resetAt: current && current.resetAt > now ? current.resetAt : now + 15 * 60 * 1000 });
      return res.status(401).json({ error: "Senha ou código de autenticação incorreto." });
    }
    loginAttempts.delete(ip);
  } catch {
    return res.status(503).json({ error: "O segredo 2FA está inválido. Confira ADMIN_TOTP_SECRET no Vercel." });
  }
  setSessionCookie(res);
  return res.status(200).json({ ok: true });
};
