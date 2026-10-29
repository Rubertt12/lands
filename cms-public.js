(() => {
  const textValue = (value, fallback = "") => typeof value === "string" ? value.slice(0, 500) : fallback;
  async function loadPortfolioContent() {
    try {
      const response = await fetch("/content.json", { cache: "no-store" });
      if (!response.ok) return;
      const data = await response.json();
      const avatar = document.getElementById("avatar");
      if (avatar && typeof data.photo === "string" && data.photo) avatar.src = data.photo;
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
      const roleLine=document.getElementById("roleLine");if(roleLine&&typeof data.roleLine==="string")roleLine.textContent=data.roleLine;
      const background=document.getElementById("backgroundText");if(background&&typeof data.backgroundText==="string")background.textContent=data.backgroundText;
      const experienceList=document.getElementById("experienceList");if(experienceList&&Array.isArray(data.experiences)){experienceList.replaceChildren();data.experiences.slice(0,30).forEach(item=>{if(!item||typeof item.title!=="string")return;const box=document.createElement("div");box.className="exp-box";const date=document.createElement("span");date.className="date";date.textContent=textValue(item.date,"");const heading=document.createElement("h3");heading.textContent=item.title;const desc=document.createElement("p");desc.textContent=textValue(item.description,"");box.append(date,heading,desc);experienceList.append(box);});const last=experienceList.lastElementChild;if(last){last.style.border="none";last.style.marginBottom="0";}}
      const educationList=document.getElementById("educationList");if(educationList&&Array.isArray(data.education)){educationList.replaceChildren();data.education.slice(0,20).forEach(item=>{if(!item||typeof item.title!=="string")return;const box=document.createElement("div");box.style.marginBottom="20px";const category=document.createElement("h3");category.style.fontSize="1.1rem";category.textContent=textValue(item.category,"Formação");const p=document.createElement("p");p.append(document.createTextNode(textValue(item.title,"")),document.createElement("br"));const detail=document.createElement("span");detail.style.color="var(--sotaque)";detail.style.fontSize=".9rem";detail.textContent=[textValue(item.institution,""),textValue(item.status,"")].filter(Boolean).join(" · ");p.append(detail);box.append(category,p);educationList.append(box);});const last=educationList.lastElementChild;if(last)last.style.marginBottom="0";}
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