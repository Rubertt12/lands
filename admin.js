(() => {
  const $ = id => document.getElementById(id);
  const editorView = $("editorView");

  async function request(url, options = {}) {
    const response = await fetch(url, {
      credentials: "same-origin",
      cache: "no-store",
      ...options,
      headers: { "Content-Type": "application/json", ...(options.headers || {}) }
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || "Ocorreu um erro.");
    return data;
  }

  function message(id, text, error = false) {
    const el = $(id);
    if (!el) return;
    el.textContent = text;
    el.classList.toggle("error", error);
  }

  function makeInput(labelText, value, placeholder, type = "text") {
    const label = document.createElement("label");
    label.className = "app-field";
    label.append(document.createTextNode(labelText));
    const input = document.createElement("input");
    input.type = type;
    input.value = value || "";
    input.placeholder = placeholder;
    label.append(input);
    return { label, input };
  }

  function readAppsFromCards() {
    return Array.from($("appsList").querySelectorAll(".app-editor-card")).map(card => {
      const name = card.querySelector('[data-field="name"]').value.trim();
      const icon = card.querySelector('[data-field="icon"]').value.trim() || "img/favicon.svg";
      const url = card.querySelector('[data-field="url"]').value.trim();
      const originalModalId = card.dataset.modalId || "";
      const app = { name, icon };
      if (url) app.url = url;
      else if (originalModalId) app.modalId = originalModalId;
      return app;
    });
  }

  function renderApps(apps) {
    const list = $("appsList");
    list.replaceChildren();

    if (!Array.isArray(apps) || apps.length === 0) {
      const empty = document.createElement("p");
      empty.className = "muted apps-empty";
      empty.textContent = "Ainda não há aplicações. Clique em “+ Adicionar aplicação” para criar o primeiro bloco.";
      list.append(empty);
      return;
    }

    apps.forEach((app, index) => {
      const card = document.createElement("article");
      card.className = "app-editor-card";
      card.dataset.modalId = app.modalId || "";

      const head = document.createElement("div");
      head.className = "app-editor-head";

      const number = document.createElement("span");
      number.className = "app-number";
      number.textContent = String(index + 1).padStart(2, "0");

      const logo = document.createElement("img");
      logo.className = "app-logo-preview";
      logo.alt = "Prévia da logo";
      logo.src = app.icon || "img/favicon.svg";
      logo.onerror = () => { logo.onerror = null; logo.src = "img/favicon.svg"; };

      const title = document.createElement("strong");
      title.textContent = app.name || "Nova aplicação";

      const remove = document.createElement("button");
      remove.type = "button";
      remove.className = "remove-app-btn";
      remove.textContent = "Excluir bloco";
      remove.setAttribute("aria-label", "Excluir aplicação " + (app.name || index + 1));
      remove.addEventListener("click", () => {
        const current = readAppsFromCards();
        current.splice(index, 1);
        renderApps(current);
        message("saveMessage", "Bloco removido da edição. Clique em “Salvar e publicar” para confirmar.");
      });

      head.append(number, logo, title, remove);

      const fields = document.createElement("div");
      fields.className = "app-editor-fields";

      const name = makeInput("Nome da aplicação", app.name, "Ex.: Meu projeto");
      name.input.dataset.field = "name";
      name.input.maxLength = 60;
      name.input.required = true;
      name.input.addEventListener("input", () => { title.textContent = name.input.value || "Nova aplicação"; });

      const icon = makeInput("Logo / imagem", app.icon, "https://... ou img/logo.png");
      icon.input.dataset.field = "icon";
      icon.input.maxLength = 300;
      icon.input.addEventListener("input", () => {
        logo.src = icon.input.value || "img/favicon.svg";
      });

      const url = makeInput("Link do projeto", app.url, "https://meuprojeto.vercel.app", "url");
      url.input.dataset.field = "url";
      url.input.maxLength = 500;

      fields.append(name.label, icon.label, url.label);

      const hint = document.createElement("p");
      hint.className = "app-card-hint";
      hint.textContent = app.modalId && !app.url
        ? "Este atalho abre uma janela interna do portfólio. Preencha o link acima para transformá-lo em um link externo."
        : "Preencha os três campos. Para logo, use um caminho local (img/logo.png) ou URL HTTPS.";

      const footer = document.createElement("div");
      footer.className = "app-card-footer";
      const status = document.createElement("span");
      status.className = "app-card-status";
      status.textContent = app.modalId && !app.url ? "Janela interna" : (app.url ? "Link externo" : "Novo bloco");
      url.input.addEventListener("input", () => {
        status.textContent = url.input.value.trim() ? "Link externo" : (card.dataset.modalId ? "Janela interna" : "Novo bloco");
        hint.textContent = url.input.value.trim()
          ? "Este atalho abrirá o endereço informado em uma nova aba."
          : (card.dataset.modalId ? "Este atalho abre uma janela interna. Deixe o link vazio para manter esse comportamento." : "Adicione o link do projeto para que o atalho possa ser aberto.");
      });
      footer.append(status);
      card.append(head, fields, hint, footer);
      list.append(card);
    });
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
    if (apps.length >= 50) {
      message("saveMessage", "Limite de 50 aplicações atingido.", true);
      return;
    }
    apps.push({ name: "", icon: "", url: "" });
    renderApps(apps);
    const cards = $("appsList").querySelectorAll(".app-editor-card");
    const last = cards[cards.length - 1];
    last?.scrollIntoView({ behavior: "smooth", block: "center" });
    last?.querySelector('[data-field="name"]')?.focus();
    message("saveMessage", "Novo bloco adicionado. Preencha os campos e salve.");
  });

  // Acesso temporário sem login, conforme solicitado.
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
    message("saveMessage", "Salvando alterações…");
    try {
      const apps = readAppsFromCards();
      if (apps.some(app => !app.name)) throw new Error("Cada bloco precisa ter um nome. Preencha ou exclua os blocos vazios.");
      if (apps.some(app => app.url && !/^https?:\/\//i.test(app.url))) throw new Error("Os links dos projetos devem começar com http:// ou https://.");
      if (apps.some(app => /^(javascript|data):/i.test(app.icon))) throw new Error("A logo deve ser um caminho de imagem ou URL HTTP/HTTPS.");
      const data = {
        headline: $("headline").value.trim(),
        headlineAccent: $("headlineAccent").value.trim(),
        subtitle: $("subtitle").value.trim(),
        apps
      };
      const result = await request("/api/admin-content", { method: "POST", body: JSON.stringify(data) });
      message("saveMessage", result.message || "Alterações salvas.");
    } catch (error) {
      message("saveMessage", error.message, true);
    } finally {
      button.disabled = false;
    }
  });

  $("reloadBtn").addEventListener("click", async () => {
    try {
      await loadContent();
      message("saveMessage", "Conteúdo publicado recarregado. Alterações não salvas foram descartadas.");
    } catch (error) {
      message("saveMessage", error.message, true);
    }
  });
})();