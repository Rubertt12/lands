const { isSameOrigin } = require("../lib/admin-auth");
const OWNER = process.env.GITHUB_OWNER || "Rubertt12";
const REPO = process.env.GITHUB_REPO || "lands";
const BRANCH = process.env.GITHUB_BRANCH || "main";
const MIME_EXT = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "image/gif": "gif" };
module.exports = async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("X-Content-Type-Options", "nosniff");
  if (req.method !== "POST") { res.setHeader("Allow", "POST"); return res.status(405).json({ error: "Método não permitido." }); }
  if (!isSameOrigin(req)) return res.status(403).json({ error: "Origem não autorizada." });
  if (!process.env.GITHUB_TOKEN) return res.status(503).json({ error: "Configure GITHUB_TOKEN nas variáveis do Vercel." });
  const body = req.body || {};
  const ext = MIME_EXT[body.type];
  if (!ext || typeof body.data !== "string" || body.data.length > 4 * 1024 * 1024 || !/^[A-Za-z0-9+/]+={0,2}$/.test(body.data)) {
    return res.status(400).json({ error: "Imagem inválida. Envie JPG, PNG, WEBP ou GIF de até 3 MB." });
  }
  const buffer = Buffer.from(body.data, "base64");
  if (!buffer.length || buffer.length > 3 * 1024 * 1024) return res.status(400).json({ error: "A imagem deve ter até 3 MB." });
  const signatureOk = body.type === "image/jpeg" ? buffer[0] === 0xff && buffer[1] === 0xd8 :
    body.type === "image/png" ? buffer.subarray(0, 8).equals(Buffer.from([137,80,78,71,13,10,26,10])) :
    body.type === "image/webp" ? buffer.toString("ascii", 0, 4) === "RIFF" && buffer.toString("ascii", 8, 12) === "WEBP" :
    buffer.toString("ascii", 0, 3) === "GIF";
  if (!signatureOk) return res.status(400).json({ error: "O arquivo não parece ser uma imagem válida do tipo selecionado." });
  const path = "img/profile-" + Date.now() + "." + ext;
  try {
    const response = await fetch("https://api.github.com/repos/" + OWNER + "/" + REPO + "/contents/" + path, {
      method: "PUT",
      headers: { "Authorization": "Bearer " + process.env.GITHUB_TOKEN, "Accept": "application/vnd.github+json", "X-GitHub-Api-Version": "2022-11-28", "Content-Type": "application/json" },
      body: JSON.stringify({ message: "Atualizar foto do perfil pelo painel administrativo", content: buffer.toString("base64"), branch: BRANCH })
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(result.message || "Falha ao enviar imagem ao GitHub.");
    return res.status(200).json({ ok: true, path: "/" + path });
  } catch (error) {
    console.error("Erro ao enviar foto do perfil:", error.message);
    return res.status(502).json({ error: "Não foi possível enviar a foto ao GitHub. Verifique o token e as permissões do repositório." });
  }
};
