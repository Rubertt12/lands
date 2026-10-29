const { safeEqual, verifyTotp, readSession, setSessionCookie, clearSessionCookie, isSameOrigin } = require("../lib/admin-auth");
module.exports = async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("X-Content-Type-Options", "nosniff");
  if (req.method !== "POST") { res.setHeader("Allow", "POST"); return res.status(405).json({ error: "Método não permitido." }); }
  if (!isSameOrigin(req)) return res.status(403).json({ error: "Origem não autorizada." });
  const { action, password, code } = req.body || {};
  if (action === "check") return res.status(200).json({ authenticated: readSession(req) });
  if (action === "logout") { clearSessionCookie(res); return res.status(200).json({ ok: true }); }
  if (action !== "login") return res.status(400).json({ error: "Ação inválida." });
  if (!process.env.ADMIN_PASSWORD || !process.env.ADMIN_TOTP_SECRET || !process.env.SESSION_SECRET)
    return res.status(503).json({ error: "Configure as variáveis secretas do administrador no Vercel antes de entrar." });
  try {
    if (!safeEqual(password, process.env.ADMIN_PASSWORD) || !verifyTotp(process.env.ADMIN_TOTP_SECRET, code))
      return res.status(401).json({ error: "Senha ou código de autenticação incorreto." });
  } catch {
    return res.status(503).json({ error: "O segredo 2FA está inválido. Confira ADMIN_TOTP_SECRET no Vercel." });
  }
  setSessionCookie(res);
  return res.status(200).json({ ok: true });
};
