(() => {
  const STORAGE_KEY = "portfolio-dock-pinned-apps-v1";
  const dock = document.querySelector(".dock");
  const grid = document.getElementById("lpGrid");
  if (!dock || !grid) return;

  let draggedApp = null;
  let menu = null;
  let longPressTimer = null;

  const safeUrl = (value) => {
    try {
      const url = new URL(value, window.location.href);
      return ["http:", "https:"].includes(url.protocol) ? url.href : "";
    } catch { return ""; }
  };

  function readPinned() {
    try {
      const value = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
      return Array.isArray(value) ? value.filter(app => app && typeof app.name === "string") : [];
    } catch { return []; }
  }

  function savePinned(apps) {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(apps)); }
    catch { console.warn("Não foi possível salvar a Dock neste navegador."); }
  }

  function appData(item) {
    if (!item || item.classList.contains("add-btn")) return null;
    const img = item.querySelector("img");
    const name = (item.dataset.appName || item.dataset.label || item.querySelector("span")?.textContent || "").trim();
    const onclick = item.getAttribute("onclick") || "";
    const modalMatch = onclick.match(/openModal\(['"]([a-z0-9_-]+)['"]\)/i);
    const modalId = item.dataset.modalId || modalMatch?.[1] || "";
    const url = safeUrl(item.dataset.appUrl || item.dataset.url || (item instanceof HTMLAnchorElement ? item.href : ""));
    if (!name || (!modalId && !url)) return null;
    return { name: name.slice(0, 60), icon: img?.getAttribute("src") || "img/favicon.svg", modalId, url };
  }

  function appKey(app) { return app.modalId ? "modal:" + app.modalId : "url:" + app.url; }

  function openApp(app) {
    if (app.modalId && typeof window.openModal === "function") {
      window.openModal(app.modalId);
      return;
    }
    const url = safeUrl(app.url);
    if (!url) return;
    const modal = document.getElementById("modal");
    const content = document.getElementById("modalContent");
    if (modal && content && new URL(url).origin !== window.location.origin) {
      modal.classList.add("active");
      content.replaceChildren();
      const iframe = document.createElement("iframe");
      iframe.src = url;
      iframe.title = app.name;
      iframe.referrerPolicy = "strict-origin-when-cross-origin";
      content.appendChild(iframe);
    } else if (modal && content) {
      modal.classList.add("active");
      content.innerHTML = "";
      const iframe = document.createElement("iframe");
      iframe.src = url;
      iframe.title = app.name;
      content.appendChild(iframe);
    } else {
      window.open(url, "_blank", "noopener,noreferrer");
    }
  }

  function removeMenu() {
    if (menu) menu.remove();
    menu = null;
  }

  function showMenu(x, y, app, pinned, dockItem = null, launchpadItem = null) {
    removeMenu();
    menu = document.createElement("div");
    menu.className = "dock-app-menu";
    const addAction = (label, callback, disabled = false) => {
      const action = document.createElement("button");
      action.type = "button";
      action.textContent = label;
      action.disabled = disabled;
      action.addEventListener("click", () => { callback(); removeMenu(); });
      menu.appendChild(action);
    };
    if (launchpadItem) {
      addAction("Ocultar do Launchpad", () => {
        const key = appKey(app);
        let hidden = [];
        try {
          const stored = JSON.parse(localStorage.getItem("portfolio-launchpad-hidden-v1") || "[]");
          if (Array.isArray(stored)) hidden = stored;
        } catch {}
        if (!hidden.includes(key)) hidden.push(key);
        try { localStorage.setItem("portfolio-launchpad-hidden-v1", JSON.stringify(hidden)); } catch {}
        applyHiddenLaunchpadItems();
        showToast(app.name + " foi ocultado do Launchpad.");
      });
    }
    if (dockItem) {
      const items = [...dock.querySelectorAll(".dock-item:not(.lp-btn)")];
      const index = items.indexOf(dockItem);
      addAction("Mover para a esquerda", () => {
        if (index > 0) { dock.insertBefore(dockItem, items[index - 1]); saveDockOrder(); }
      }, index <= 0);
      addAction("Mover para a direita", () => {
        if (index >= 0 && index < items.length - 1) { dock.insertBefore(items[index + 1], dockItem); saveDockOrder(); }
      }, index < 0 || index >= items.length - 1);
      addAction("Remover da Dock", () => {
        if (dockItem.classList.contains("dock-pinned-app")) unpinApp(app);
        else {
          const key = appKey(app);
          dockItem.classList.add("dock-item-hidden");
          dockItem.hidden = true;
          try {
            const stored = JSON.parse(localStorage.getItem("portfolio-dock-hidden-v1") || "[]");
            const hidden = Array.isArray(stored) ? stored : [];
            if (!hidden.includes(key)) hidden.push(key);
            localStorage.setItem("portfolio-dock-hidden-v1", JSON.stringify(hidden));
          } catch {}
          showToast(app.name + " foi removido da Dock.");
        }
      });
    } else {
      addAction(pinned ? "Desafixar da Dock" : "Fixar na Dock", () => {
        if (pinned) unpinApp(app);
        else pinApp(app);
      });
    }
    document.body.appendChild(menu);
    const left = Math.min(x, window.innerWidth - menu.offsetWidth - 8);
    const top = Math.min(y, window.innerHeight - menu.offsetHeight - 8);
    menu.style.left = Math.max(8, left) + "px";
    menu.style.top = Math.max(8, top) + "px";
  }

  function saveDockOrder() {
    const order = [...dock.querySelectorAll(".dock-item:not(.lp-btn)")].map(item => {
      const app = appData(item);
      return app ? appKey(app) : "";
    }).filter(Boolean);
    try { localStorage.setItem("portfolio-dock-order-v1", JSON.stringify(order)); } catch {}
  }
  function applyDockOrder() {
    let order = [];
    try { order = JSON.parse(localStorage.getItem("portfolio-dock-order-v1") || "[]"); } catch {}
    if (!Array.isArray(order) || !order.length) return;
    const items = [...dock.querySelectorAll(".dock-item:not(.lp-btn):not(.dock-trash)")];
    items.sort((a,b) => {
      const aa=appData(a), bb=appData(b);
      const ai=aa?order.indexOf(appKey(aa)):-1, bi=bb?order.indexOf(appKey(bb)):-1;
      return (ai < 0 ? 9999 : ai) - (bi < 0 ? 9999 : bi);
    });
    const rightSeparator = dock.querySelector(".dock-trash-separator");
    items.forEach(item => dock.insertBefore(item, rightSeparator || dock.querySelector(".dock-trash")));
  }

  function applyHiddenDockItems() {
    let hidden = [];
    try { hidden = JSON.parse(localStorage.getItem("portfolio-dock-hidden-v1") || "[]"); } catch {}
    dock.querySelectorAll(".dock-item:not(.lp-btn):not(.dock-trash)").forEach(item => {
      const app = appData(item);
      if (app) {
        const isHidden = hidden.includes(appKey(app));
        item.hidden = isHidden;
        item.classList.toggle("dock-item-hidden", isHidden);
      }
    });
  }

  function applyHiddenLaunchpadItems() {
    let hidden = [];
    try { hidden = JSON.parse(localStorage.getItem("portfolio-launchpad-hidden-v1") || "[]"); } catch {}
    if (!Array.isArray(hidden)) hidden = [];
    grid.querySelectorAll(".lp-item").forEach(item => {
      if (item.classList.contains("add-btn")) return;
      const app = appData(item);
      if (!app) return;
      const isHidden = hidden.includes(appKey(app));
      item.hidden = isHidden;
      item.classList.toggle("lp-item-hidden", isHidden);
    });
  }

  dock.addEventListener("contextmenu", event => {
    const item = event.target.closest(".dock-item");
    if (!item || item.classList.contains("lp-btn") || item.classList.contains("dock-pinned-app")) return;
    const app = appData(item);
    if (!app) return;
    event.preventDefault();
    showMenu(event.clientX, event.clientY, app, true, item);
  });

  function makePinButton(item) {
    if (item.classList.contains("add-btn") || item.querySelector(".lp-pin-btn")) return;
    const app = appData(item);
    if (!app) return;
    item.classList.add("lp-app-draggable");
    item.draggable = true;
    item.dataset.appName = app.name;
    if (app.modalId) item.dataset.modalId = app.modalId;
    if (app.url) item.dataset.appUrl = app.url;
    const pin = document.createElement("button");
    pin.type = "button";
    pin.className = "lp-pin-btn";
    pin.title = "Fixar na Dock";
    pin.setAttribute("aria-label", "Fixar " + app.name + " na Dock");
    pin.innerHTML = '<i class="fa-solid fa-thumbtack" aria-hidden="true"></i>';
    pin.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      pinApp(app);
    });
    item.appendChild(pin);
    const hide = document.createElement("button");
    hide.type = "button";
    hide.className = "lp-hide-btn";
    hide.title = "Ocultar do Launchpad";
    hide.setAttribute("aria-label", "Ocultar " + app.name + " do Launchpad");
    hide.innerHTML = '<i class="fa-solid fa-eye-slash" aria-hidden="true"></i>';
    hide.addEventListener("click", event => {
      event.preventDefault();
      event.stopPropagation();
      const key = appKey(app);
      let hidden = [];
      try {
        const stored = JSON.parse(localStorage.getItem("portfolio-launchpad-hidden-v1") || "[]");
        if (Array.isArray(stored)) hidden = stored;
      } catch {}
      if (!hidden.includes(key)) hidden.push(key);
      try { localStorage.setItem("portfolio-launchpad-hidden-v1", JSON.stringify(hidden)); } catch {}
      applyHiddenLaunchpadItems();
      showToast(app.name + " foi ocultado do Launchpad.");
    });
    item.appendChild(hide);
  }

  function renderPinned() {
    dock.querySelectorAll(".dock-pinned-app").forEach(item => item.remove());
    readPinned().forEach(app => {
      const item = document.createElement("a");
      item.href = "javascript:void(0)";
      item.className = "dock-item dock-pinned-app";
      item.dataset.label = app.name;
      item.dataset.appName = app.name;
      item.setAttribute("aria-label", app.name);
      if (app.modalId) item.dataset.modalId = app.modalId;
      if (app.url) item.dataset.appUrl = app.url;
      const icon = document.createElement("img");
      icon.src = safeUrl(app.icon) || app.icon || "img/favicon.svg";
      icon.alt = app.name;
      item.appendChild(icon);
      item.addEventListener("click", event => { event.preventDefault(); openApp(app); });
      item.addEventListener("contextmenu", event => {
        event.preventDefault();
        showMenu(event.clientX, event.clientY, app, true, item);
      });
      item.addEventListener("dragstart", event => {
        draggedApp = app;
        event.dataTransfer.effectAllowed = "move";
        event.dataTransfer.setData("text/plain", JSON.stringify(app));
      });
      item.draggable = true;
      dock.appendChild(item);
    });
    applyDockOrder();
    applyHiddenDockItems();
  }

  function pinApp(app) {
    if (!app || (!app.modalId && !safeUrl(app.url))) return;
    let hidden = [];
    try {
      const stored = JSON.parse(localStorage.getItem("portfolio-dock-hidden-v1") || "[]");
      if (Array.isArray(stored)) hidden = stored;
    } catch {}
    const key = appKey(app);
    if (hidden.includes(key)) {
      localStorage.setItem("portfolio-dock-hidden-v1", JSON.stringify(hidden.filter(item => item !== key)));
      applyHiddenDockItems();
      showToast(app.name + " voltou para a Dock.");
      return;
    }
    const apps = readPinned();
    if (apps.some(existing => appKey(existing) === key)) {
      showToast("Esse aplicativo já está fixado na Dock.");
      return;
    }
    apps.push({ name: app.name, icon: app.icon || "img/favicon.svg", modalId: app.modalId || "", url: safeUrl(app.url) });
    savePinned(apps);
    renderPinned();
    showToast(app.name + " foi fixado na Dock.");
  }

  function unpinApp(app) {
    savePinned(readPinned().filter(existing => appKey(existing) !== appKey(app)));
    renderPinned();
    showToast(app.name + " foi removido da Dock.");
  }

  let toastTimer;
  function showToast(message) {
    let toast = document.getElementById("dock-toast");
    if (!toast) {
      toast = document.createElement("div");
      toast.id = "dock-toast";
      toast.className = "dock-toast";
      document.body.appendChild(toast);
    }
    toast.textContent = message;
    toast.classList.add("visible");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove("visible"), 2200);
  }

  function prepareItems() {
    grid.querySelectorAll(".lp-item").forEach(makePinButton);
    applyHiddenLaunchpadItems();
  }

  prepareItems();
  renderPinned();
  applyDockOrder();
  applyHiddenDockItems();
  applyHiddenLaunchpadItems();
  new MutationObserver(prepareItems).observe(grid, { childList: true, subtree: true });

  grid.addEventListener("dragstart", event => {
    const item = event.target.closest(".lp-item");
    const app = appData(item);
    if (!app) { event.preventDefault(); return; }
    draggedApp = app;
    event.dataTransfer.effectAllowed = "copy";
    event.dataTransfer.setData("text/plain", JSON.stringify(app));
    item.classList.add("dragging");
  });

  grid.addEventListener("dragend", event => {
    event.target.closest(".lp-item")?.classList.remove("dragging");
    dock.classList.remove("dock-drop-target");
    draggedApp = null;
  });

  grid.addEventListener("contextmenu", event => {
    const item = event.target.closest(".lp-item");
    const app = appData(item);
    if (!app) return;
    event.preventDefault();
    showMenu(event.clientX, event.clientY, app, readPinned().some(existing => appKey(existing) === appKey(app)), null, item);
  });

  grid.addEventListener("touchstart", event => {
    const item = event.target.closest(".lp-item");
    const app = appData(item);
    if (!app || event.target.closest(".lp-pin-btn")) return;
    longPressTimer = setTimeout(() => {
      const rect = item.getBoundingClientRect();
      showMenu(rect.left + rect.width / 2, rect.top + rect.height / 2, app,
        readPinned().some(existing => appKey(existing) === appKey(app)), null, item);
    }, 650);
  }, { passive: true });
  ["touchend", "touchmove", "touchcancel"].forEach(type => document.addEventListener(type, () => clearTimeout(longPressTimer), { passive: true }));

  dock.addEventListener("dragover", event => {
    if (!draggedApp) return;
    event.preventDefault();
    event.dataTransfer.dropEffect = "copy";
    dock.classList.add("dock-drop-target");
  });
  dock.addEventListener("dragleave", event => {
    if (!dock.contains(event.relatedTarget)) dock.classList.remove("dock-drop-target");
  });
  dock.addEventListener("drop", event => {
    event.preventDefault();
    dock.classList.remove("dock-drop-target");
    let app = draggedApp;
    if (!app) {
      try { app = JSON.parse(event.dataTransfer.getData("text/plain")); } catch {}
    }
    if (app) pinApp(app);
    draggedApp = null;
  });

  document.addEventListener("click", event => {
    if (menu && !menu.contains(event.target)) removeMenu();
  });
  document.addEventListener("keydown", event => {
    if (event.key === "Escape") removeMenu();
  });
})();