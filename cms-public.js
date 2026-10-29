(() => {
  const textValue = (value, fallback = "") => typeof value === "string" ? value.slice(0, 500) : fallback;
  async function loadPortfolioContent() {
    try {
      const response = await fetch("/content.json", { cache: "no-store" });
      if (!response.ok) return;
      const data = await response.json();
      const title = document.querySelector(".titulo-silver");
      if (title) {
        title.replaceChildren();
        title.append(document.createTextNode(textValue(data.headline, "Tecnologia que")));
        title.append(document.createElement("br"));
        const accent = document.createElement("span");
        accent.textContent = textValue(data.headlineAccent, "resolve problemas.");
        title.append(accent);
      }
      const subtitle = document.querySelector(".hero-subtitle");
      if (subtitle) subtitle.textContent = textValue(data.subtitle, subtitle.textContent);
      const grid = document.getElementById("lpGrid");
      if (grid && Array.isArray(data.apps)) {
        grid.replaceChildren();
        data.apps.slice(0, 50).forEach(app => {
          if (!app || typeof app.name !== "string") return;
          const item = document.createElement("div");
          item.setAttribute("role", "button");
          item.tabIndex = 0;
          item.type = "button";
          item.className = "lp-item";
          item.style.background = "transparent";
          item.style.border = "0";
          item.style.color = "inherit";
          item.style.font = "inherit";
          item.style.cursor = "pointer";
          item.setAttribute("aria-label", "Abrir " + app.name.slice(0, 60));
          item.dataset.appName = app.name.slice(0, 60);
          if (typeof app.modalId === "string" && app.modalId) item.dataset.modalId = app.modalId;
          if (typeof app.url === "string" && app.url) item.dataset.appUrl = app.url;
          const icon = document.createElement("img");
          icon.src = textValue(app.icon, "img/favicon.svg");
          icon.alt = "";
          icon.loading = "lazy";
          const label = document.createElement("span");
          label.textContent = app.name.slice(0, 60);
          item.append(icon, label);
          item.addEventListener("keydown", event => {
            if (event.key === "Enter" || event.key === " ") { event.preventDefault(); item.click(); }
          });
          item.addEventListener("click", () => {
            if (typeof app.modalId === "string" && app.modalId) {
              if (typeof window.openModal === "function") window.openModal(app.modalId);
            } else if (typeof app.url === "string") {
              try {
                const url = new URL(app.url, window.location.origin);
                if (["https:", "http:"].includes(url.protocol)) window.open(url.href, "_blank", "noopener,noreferrer");
              } catch {}
            }
          });
          grid.append(item);
        });
      }
    } catch (error) {
      console.warn("Não foi possível carregar as personalizações do portfólio.", error);
    }
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", loadPortfolioContent);
  else loadPortfolioContent();
})();