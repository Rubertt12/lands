(() => {
  const $ = id => document.getElementById(id);
  const editorView = $("editorView");
  let loadedApps = [];
  async function request(url, options = {}) {
    const response = await fetch(url, { credentials: "same-origin", cache: "no-store", ...options, headers: { "Content-Type": "application/json", ...(options.headers || {}) } });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || "Ocorreu um erro.");
    return data;
  }
  function message(id, text, error = false) { const el = $(id); if (!el) return; el.textContent = text; el.classList.toggle("error", error); }
  function renderApps(apps) {
    const list = $("appsList");
    list.replaceChildren();
    loadedApps = Array.isArray(apps) ? apps : [];
    if (!loadedApps.length) {
      const empty = document.createElement("p");
      empty.className = "muted";
      empty.textContent = "Nenhuma aplicação cadastrada. Clique em “Adicionar aplicação”.";
      list.append(empty);
    }
    loadedApps.forEach((app, index) => {
      const card = document.createElement("div");
      card.className = "app-editor-card";
      card.dataset.modalId = app.modalId || "";
      const head = document.createElement("div");
      head.className = "app-editor-head";
      const logo = document.createElement("img");
      logo.className = "app-logo-preview";
      logo.alt = "";
      logo.src = app.icon || "img/favicon.svg";
      logo.onerror = () => { logo.onerror = null; logo.src = "img/favicon.svg"; };
      const title = document.createElement("strong");
      title.textContent = app.name || "Nova aplicação";
      const remove = document.createElement("button");
      remove.type = "button"; remove.className = "remove-app-btn"; remove.textContent = "Remover";
      remove.addEventListener("click", () => {
        const current = readAppsFromCards();
        current.splice(index, 1);
        renderApps(current);
      });
      head.append(logo, title, remove);
      const fields = document.createElement("div");
      fields.className = "app-editor-fields";
      const makeField = (labelText, value, placeholder, kind = "text") => {
        const wrap = document.createElement("label");
        wrap.className = "app-field";
        wrap.append(document.createTextNode(labelText));
        const input = document.createElement("input");
        input.type = kind; input.value = value || ""; input.placeholder = placeholder;
        input.addEventListener("input", () => {
          if (labelText === "Nome da aplicação") title.textContent = input.value || "Nova aplicação";
          if (labelText === "Logo / imagem") {
            logo.src = input.value || "img/favicon.svg";
          }
        });
        wrap.append(input);
        return {wrap, input};
      };
      const name = makeField("Nome da aplicação", app.name, "Ex.: Meu projeto");
      const icon = makeField("Logo / imagem", app.icon, "https://... ou img/logo.png");
      const url = makeField("Link do projeto", app.url, "https://meuprojeto.vercel.app", "url");
      fields.append(name.wrap, icon.wrap, url.wrap);
      card._getApp = () => {
        const value = { name: name.input.value.trim(), icon: icon.input.value.trim() || "img/favicon.svg" };
        const link = url.input.value.trim();
        if (link) value.url = link;
        if (card.dataset.modalId) value.modalId = card.dataset.modalId;
        return value;
      };
      list.append(card);
    });
  }
  function readAppsFromCards() {
    return Array.from($("appsList").querySelectorAll(".app-editor-card")).map(card => card._getApp());
  }
  function fill(data) {
    $("headline").value = data.headline || "";
    $("headlineAccent").value = data.headlineAccent || "";
    $("subtitle").value = data.subtitle || "";
    renderApps(data.apps || []);
  }
  async function loadContent() {
    const response = await fetch("/content.json?admin=" + Date.now(), { cache: "no-store" });
    if (!response.ok) throw new Error("Não foi possível carregar o conteúdo atual.");
    fill(await response.json());
  }
  $("addAppBtn").addEventListener("click", () => {
    const apps = readAppsFromCards();
    if (apps.length >= 50) { message("saveMessage", "Limite de 50 aplicações atingido.", true); return; }
    apps.push({name:"", icon:"", url:""});
    renderApps(apps);
    const cards = $("appsList").querySelectorAll(".app-editor-card");
    cards[cards.length - 1]?.scrollIntoView({behavior:"smooth", block:"center"});
    cards[cards.length - 1]?.querySelector("input")?.focus();
  });
  // Acesso temporário sem login: abrir a página carrega diretamente o editor.
  editorView.classList.remove("hidden");
  const loginView = $("loginView");
  if (loginView) loginView.remove();
  const logoutBtn = $("logoutBtn");
  if (logoutBtn) logoutBtn.remove();
  loadContent().catch(error => message("saveMessage", error.message, true));
  $("contentForm").addEventListener("submit", async event => {
    event.preventDefault();
    const button = event.submitter;
    button.disabled = true;
    message("saveMessage", "Salvando…");
    try {
      const apps = readAppsFromCards();
      if (apps.some(app => !app.name)) throw new Error("Preencha o nome de todas as aplicações ou remova as linhas vazias.");
      if (apps.some(app => app.url && !/^https?:\/\//i.test(app.url))) throw new Error("Os links dos projetos devem começar com http:// ou https://.");
      if (apps.some(app => app.icon && /^(javascript|data):/i.test(app.icon))) throw new Error("Use uma imagem por URL HTTP/HTTPS ou caminho local.");
      const data = { headline: $("headline").value.trim(), headlineAccent: $("headlineAccent").value.trim(), subtitle: $("subtitle").value.trim(), apps };
      const result = await request("/api/admin-content", { method: "POST", body: JSON.stringify(data) });
      message("saveMessage", result.message);
    } catch (error) { message("saveMessage", error.message, true); }
    finally { button.disabled = false; }
  });
  $("reloadBtn").addEventListener("click", async () => {
    try { await loadContent(); message("saveMessage", "Alterações descartadas. Conteúdo recarregado."); }
    catch (error) { message("saveMessage", error.message, true); }
  });
})();