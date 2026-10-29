(() => {
  const $ = id => document.getElementById(id);
  const loginView = $("loginView"), editorView = $("editorView"), logoutBtn = $("logoutBtn");
  async function request(url, options = {}) {
    const response = await fetch(url, { credentials: "same-origin", cache: "no-store", ...options, headers: { "Content-Type": "application/json", ...(options.headers || {}) } });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || "Ocorreu um erro.");
    return data;
  }
  function showEditor(show) { loginView.classList.toggle("hidden", show); editorView.classList.toggle("hidden", !show); logoutBtn.classList.toggle("hidden", !show); }
  function message(id, text, error = false) { const el = $(id); el.textContent = text; el.classList.toggle("error", error); }
  function fill(data) { $("headline").value = data.headline || ""; $("headlineAccent").value = data.headlineAccent || ""; $("subtitle").value = data.subtitle || ""; $("apps").value = JSON.stringify(data.apps || [], null, 2); }
  async function loadContent() {
    const response = await fetch("/content.json?admin=" + Date.now(), { cache: "no-store" });
    if (!response.ok) throw new Error("Não foi possível carregar o conteúdo atual.");
    fill(await response.json());
  }
  $("loginForm").addEventListener("submit", async event => {
    event.preventDefault(); const button = event.submitter; button.disabled = true; message("loginMessage", "Validando credenciais…");
    try {
      await request("/api/admin-auth", { method: "POST", body: JSON.stringify({ action: "login", password: $("password").value, code: $("totp").value }) });
      $("password").value = ""; $("totp").value = ""; await loadContent(); showEditor(true);
    } catch (error) { message("loginMessage", error.message, true); }
    finally { button.disabled = false; }
  });
  $("contentForm").addEventListener("submit", async event => {
    event.preventDefault(); const button = event.submitter; button.disabled = true; message("saveMessage", "Salvando…");
    try {
      let apps; try { apps = JSON.parse($("apps").value); } catch { throw new Error("O JSON das aplicações está inválido."); }
      const data = { headline: $("headline").value.trim(), headlineAccent: $("headlineAccent").value.trim(), subtitle: $("subtitle").value.trim(), apps };
      const result = await request("/api/admin-content", { method: "POST", body: JSON.stringify(data) }); message("saveMessage", result.message);
    } catch (error) { message("saveMessage", error.message, true); }
    finally { button.disabled = false; }
  });
  $("reloadBtn").addEventListener("click", async () => { try { await loadContent(); message("saveMessage", "Alterações descartadas. Conteúdo recarregado."); } catch (error) { message("saveMessage", error.message, true); } });
  logoutBtn.addEventListener("click", async () => { try { await request("/api/admin-auth", { method: "POST", body: JSON.stringify({ action: "logout" }) }); } finally { showEditor(false); } });
  request("/api/admin-auth", { method: "POST", body: JSON.stringify({ action: "check" }) }).then(async result => { if (result.authenticated) { await loadContent(); showEditor(true); } }).catch(() => {});
})();
