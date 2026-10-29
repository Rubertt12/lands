const { isSameOrigin } = require("../lib/admin-auth");
const OWNER = process.env.GITHUB_OWNER || "Rubertt12";
const REPO = process.env.GITHUB_REPO || "lands";
const BRANCH = process.env.GITHUB_BRANCH || "main";
const PATH = "content.json";
async function githubRequest(method, url, body) {
  const response = await fetch(url, {
    method,
    headers: { "Authorization": "Bearer " + process.env.GITHUB_TOKEN, "Accept": "application/vnd.github+json", "X-GitHub-Api-Version": "2022-11-28", "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.message || "Falha ao acessar o GitHub.");
  return data;
}
function validContent(data) {
  if (!data || typeof data !== "object" || typeof data.headline !== "string" || typeof data.headlineAccent !== "string" || typeof data.subtitle !== "string") return false;
  if (data.headline.length > 100 || data.headlineAccent.length > 100 || data.subtitle.length > 500 || !Array.isArray(data.apps) || data.apps.length > 50) return false;
  if (data.photo !== undefined) {
    if (typeof data.photo !== "string" || data.photo.length > 500) return false;
    if (data.photo !== "" && !/^(https?:\/\/|\/img\/[a-zA-Z0-9._-]+$)/i.test(data.photo)) return false;
  }
  if(data.roleLine!==undefined&&(typeof data.roleLine!=="string"||data.roleLine.length>180))return false;
  if(data.backgroundText!==undefined&&(typeof data.backgroundText!=="string"||data.backgroundText.length>1200))return false;
  if(data.experiences!==undefined&&(!Array.isArray(data.experiences)||data.experiences.length>30||!data.experiences.every(item=>item&&typeof item.date==="string"&&item.date.length<=100&&typeof item.title==="string"&&item.title.trim()&&item.title.length<=240&&typeof item.description==="string"&&item.description.length<=1200)))return false;
  if(data.education!==undefined&&(!Array.isArray(data.education)||data.education.length>20||!data.education.every(item=>item&&typeof item.category==="string"&&item.category.length<=100&&typeof item.title==="string"&&item.title.trim()&&item.title.length<=240&&typeof item.institution==="string"&&item.institution.length<=240&&typeof item.status==="string"&&item.status.length<=100)))return false;
  return data.apps.every(app => app && typeof app.name === "string" && app.name.trim().length > 0 && app.name.length <= 60 &&
    typeof app.icon === "string" && app.icon.length <= 300 &&
    (!app.url || (typeof app.url === "string" && app.url.length <= 500 && /^https?:\/\//i.test(app.url))) &&
    (!app.modalId || (typeof app.modalId === "string" && /^[a-z0-9_-]{1,40}$/i.test(app.modalId))));
}
module.exports = async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("X-Content-Type-Options", "nosniff");
  if (req.method !== "POST") { res.setHeader("Allow", "POST"); return res.status(405).json({ error: "Método não permitido." }); }
  if (!isSameOrigin(req)) return res.status(403).json({ error: "Origem não autorizada." });
  if (!process.env.GITHUB_TOKEN) return res.status(503).json({ error: "Configure GITHUB_TOKEN nas variáveis do Vercel." });
  if (!validContent(req.body)) return res.status(400).json({ error: "Revise os campos. O conteúdo enviado não passou pela validação." });
  try {
    const api = "https://api.github.com/repos/" + OWNER + "/" + REPO + "/contents/" + PATH;
    const existing = await githubRequest("GET", api + "?ref=" + encodeURIComponent(BRANCH));
    const encoded = Buffer.from(JSON.stringify(req.body, null, 2) + "\n", "utf8").toString("base64");
    await githubRequest("PUT", api, { message: "Atualizar conteúdo do portfólio pelo painel administrativo", content: encoded, sha: existing.sha, branch: BRANCH });
    return res.status(200).json({ ok: true, message: "Alterações salvas. O Vercel iniciará uma nova publicação automaticamente." });
  } catch (error) {
    const detail = String(error.message || "");
    console.error("Erro ao salvar conteúdo do portfólio:", detail);
    if (/bad credentials|expired|invalid token/i.test(detail)) {
      return res.status(502).json({ error: "O token do GitHub configurado no Vercel é inválido ou expirou. Atualize GITHUB_TOKEN e publique novamente." });
    }
    if (/resource not accessible|permission|forbidden/i.test(detail)) {
      return res.status(502).json({ error: "O token do GitHub não tem permissão para alterar este repositório. Conceda acesso a Rubertt12/lands e Contents: Read and write." });
    }
    return res.status(502).json({ error: "Não foi possível salvar no GitHub. Confira GITHUB_TOKEN e as permissões Contents: Read and write." });
  }
};
