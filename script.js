// 1. RELÓGIO
function updateClock() { 
    const clockEl = document.getElementById('clock');
    if (clockEl) {
        const now = new Date();
        clockEl.innerText = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }); 
    }
}
setInterval(updateClock, 1000); 
updateClock();

// 2. ANIMAÇÃO DO AVATAR (SCROLL)
const avatar = document.getElementById('avatar');
const header = document.getElementById('header');
const target = document.getElementById('avatar-target');

function animate() {
    if (!avatar || !target) return;
    const scroll = window.scrollY;
    const progress = Math.min(scroll / 400, 1);
    const rect = target.getBoundingClientRect();
    const ease = 1 - Math.pow(1 - progress, 3);
    const isMobile = window.innerWidth < 768;

    if (progress < 0.99) {
        header?.classList.remove('active');
        const startSize = isMobile ? 160 : 260;
        const size = startSize - (ease * (startSize - 40));
        avatar.style.width = `${size}px`;
        avatar.style.height = `${size}px`;
        avatar.style.borderRadius = `${(isMobile ? 35 : 55) - (ease * ((isMobile ? 35 : 55) - 10))}px`;
        const curX = (window.innerWidth / 2) + ((rect.left + rect.width / 2) - (window.innerWidth / 2)) * ease;
        const curY = (window.innerHeight * 0.45) + ((rect.top + rect.height / 2) - (window.innerHeight * 0.45)) * ease;
        avatar.style.left = `${curX}px`;
        avatar.style.top = `${curY}px`;
        avatar.style.transform = `translate(-50%, -50%)`;
    } else {
        header?.classList.add('active');
        avatar.style.width = '40px'; 
        avatar.style.height = '40px'; 
        avatar.style.borderRadius = '10px';
        avatar.style.left = `${rect.left + rect.width / 2}px`;
        avatar.style.top = `${rect.top + rect.height / 2}px`;
    }
}
window.addEventListener('scroll', () => requestAnimationFrame(animate));

// 3. LAUNCHPAD & SPOTLIGHT
function toggleLaunchpad(e) {
    if (e) e.stopPropagation();
    const lp = document.getElementById('launchpad');
    const input = document.getElementById('lpSearchInput');
    if (!lp) return;

    if (lp.classList.contains('active')) {
        lp.classList.remove('active');
        setTimeout(() => { lp.style.display = 'none'; }, 300);
    } else {
        lp.style.display = 'flex';
        setTimeout(() => { 
            lp.classList.add('active'); 
            input?.focus();
        }, 10);
    }
}

function toggleLPFullscreen(e) {
    if (e) e.stopPropagation();
    const win = document.getElementById('lpWindow');
    const icon = e.currentTarget.querySelector('i');
    if(win) win.classList.toggle('fullscreen');
    if(icon) {
        icon.classList.toggle('fa-expand');
        icon.classList.toggle('fa-compress');
    }
}

document.getElementById('lpSearchInput')?.addEventListener('input', function(e) {
    const term = e.target.value.toLowerCase();
    const items = document.querySelectorAll('.lp-item');
    items.forEach(item => {
        const name = item.querySelector('span')?.innerText.toLowerCase() || "";
        item.style.display = name.includes(term) ? 'flex' : 'none';
    });
});

// 4. MODAIS E LINKS
function openModal(type) {
    const key = type.toLowerCase();
    const urls = {
        ativae: "https://ativae-inventario-integrado.vercel.app/",
        store: "https://storerubertt-master.vercel.app/",
        empty: "https://whatsempty.vercel.app/",
        finances: "https://financesrubertt.vercel.app/",
        whales: "https://whalesgames.vercel.app/",
        linkedin: "https://br.linkedin.com/in/rubertt-ramires-da-silva",
        github: "https://github.com/Rubertt12",
        inventario:"https://sistema-de-inventario-pearl.vercel.app/"
    };

    if (!urls[key]) return;

    if (document.getElementById('launchpad')?.classList.contains('active')) toggleLaunchpad();

    if (key === 'linkedin' || key === 'github') {
        window.open(urls[key], '_blank'); 
    } else {
        const modal = document.getElementById('modal');
        const content = document.getElementById('modalContent');
        if (modal && content) {
            modal.classList.add('active');
            content.innerHTML = `<iframe src="${urls[key]}" style="width:100%; height:100%; border:none;"></iframe>`;
        }
    }
}

function closeModal() {
    const modal = document.getElementById('modal');
    const content = document.getElementById('modalContent');
    if(modal) modal.classList.remove('active');
    if(content) content.innerHTML = '';
}

// 5. ADICIONAR NOVO APP
function addNewApp() {
    const password = prompt("Senha:");
    if (password === "Mordocker42@ad") {
        const name = prompt("Nome do Aplicativo:");
        const url = prompt("URL do Site (com https://):");
        let icon = prompt("URL do Ícone (ou deixe vazio para aleatório):");

        const defaultIcons = ["img/favicon.svg", "img/favicon-control.png", "img/novo-usuario.png", "img/gestao.ico"];
        if (!icon || icon.trim() === "") {
            icon = defaultIcons[Math.floor(Math.random() * defaultIcons.length)];
        }

        if (name && url) {
            const grid = document.querySelector('.lp-grid');
            if (!grid) return;

            const newItem = document.createElement('div');
            newItem.className = 'lp-item';
            newItem.onclick = () => window.open(url, '_blank');
            newItem.innerHTML = `<img src="${icon}" alt="${name}"><span>${name}</span>`;

            const addBtn = document.querySelector('.add-btn');
            grid.insertBefore(newItem, addBtn);
        }
    } else if (password !== null) {
        alert("Senha incorreta.");
    }
}

// 6. EVENTOS GERAIS E DRAG & DROP
document.addEventListener('DOMContentLoaded', () => {
    // Fechar modais ao clicar fora
    window.addEventListener('click', (event) => {
        const lp = document.getElementById('launchpad');
        if (event.target === lp) toggleLaunchpad();
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === "Escape") {
            const lp = document.getElementById('launchpad');
            if (lp?.classList.contains('active')) toggleLaunchpad();
            closeModal();
        }
    });

    // Rastreamento de mouse para efeito de luz nos cards
    document.querySelectorAll('.card').forEach(card => {
        card.onmousemove = e => {
            const rect = card.getBoundingClientRect();
            card.style.setProperty("--mouse-x", `${e.clientX - rect.left}px`);
            card.style.setProperty("--mouse-y", `${e.clientY - rect.top}px`);
        };
    });

    // --- LÓGICA DE DRAG & DROP DA DOCK ---
    const dock = document.querySelector('.dock');
    let draggedItem = null;

    const dockItems = document.querySelectorAll('.dock-item[draggable="true"]');

    dockItems.forEach(item => {
        item.addEventListener('dragstart', function(e) {
            draggedItem = this;
            this.classList.add('dragging');
            e.dataTransfer.effectAllowed = 'move';
            e.dataTransfer.setData('text/plain', ''); 
        });

        item.addEventListener('dragend', function() {
            this.classList.remove('dragging');
            document.querySelectorAll('.dock-item').forEach(i => i.classList.remove('drag-over'));
            draggedItem = null;
        });

        item.addEventListener('dragover', function(e) {
            e.preventDefault(); 
            if (this !== draggedItem) this.classList.add('drag-over');
        });

        item.addEventListener('dragleave', function() {
            this.classList.remove('drag-over');
        });

        item.addEventListener('drop', function(e) {
            e.preventDefault();
            this.classList.remove('drag-over');

            if (draggedItem && draggedItem !== this) {
                const allItems = Array.from(dock.children);
                const draggedIdx = allItems.indexOf(draggedItem);
                const targetIdx = allItems.indexOf(this);

                if (draggedIdx < targetIdx) {
                    this.after(draggedItem);
                } else {
                    this.before(draggedItem);
                }
            }
        });
    });
});



// --- LÓGICA DO BOTÃO DARK/LIGHT MODE ---
const themeToggle = document.getElementById('theme-toggle');

// Verifica se já existe uma preferência salva
if (localStorage.getItem('theme') === 'light') {
    document.body.classList.add('light-mode');
    themeToggle.classList.replace('fa-sun', 'fa-moon');
}

themeToggle.addEventListener('click', () => {
    document.body.classList.toggle('light-mode');
    const isLight = document.body.classList.contains('light-mode');
    
    // Salva a preferência
    localStorage.setItem('theme', isLight ? 'light' : 'dark');
    
    // Troca o ícone (Sol para modo escuro, Lua para modo claro)
    if (isLight) {
        themeToggle.classList.replace('fa-sun', 'fa-moon');
    } else {
        themeToggle.classList.replace('fa-moon', 'fa-sun');
    }
});



