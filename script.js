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

// 2. ANIMAÇÃO DO AVATAR
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
        github: "https://github.com/Rubertt12"
    };

   if (!urls[key]) return;

    // Fecha o launchpad se estiver aberto
    const lp = document.getElementById('launchpad');
    if (lp && lp.classList.contains('active')) toggleLaunchpad();

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

// Eventos de fechamento
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
            const grid = document.querySelector('.lp-grid') || document.getElementById('lpGrid');
            if (!grid) return;

            const newItem = document.createElement('div');
            newItem.className = 'lp-item';
            newItem.onclick = () => window.open(url, '_blank');

            const randomFallback = defaultIcons[Math.floor(Math.random() * defaultIcons.length)];
            newItem.innerHTML = `
                <img src="${icon}" alt="${name}" onerror="this.src='${randomFallback}'">
                <span>${name}</span>
            `;

            const addBtn = document.querySelector('.add-btn');
            if (addBtn) grid.insertBefore(newItem, addBtn);
            else grid.appendChild(newItem);
        }
    } else if (password !== null) {
        alert("Senha incorreta.");
    }
}



// Feedback visual de clique (escala o ícone brevemente)
    const activeItem = document.querySelector(`.lp-item[onclick*="${type}"]`);
    if (activeItem) {
        activeItem.style.transform = "scale(0.9)";
        setTimeout(() => activeItem.style.transform = "", 150);
    }

    if (key === 'linkedin' || key === 'github') {
        window.open(urls[key], '_blank');
        if (document.getElementById('launchpad').classList.contains('active')) toggleLaunchpad();
    } else {
        const modal = document.getElementById('modal');
        const content = document.getElementById('modalContent');
        
        if (modal && content) {
            // Mostra um loader enquanto o iframe carrega (Opcional, melhora a experiência)
            content.innerHTML = `<div class="loader-modal" style="color:white; position:absolute; top:50%; left:50%; transform:translate(-50%,-50%)">Carregando...</div>
                                 <iframe src="${urls[key]}" style="width:100%; height:100%; border:none; opacity:0; transition: opacity 0.5s;" onload="this.style.opacity='1'"></iframe>`;
            
            modal.classList.add('active');
            if (document.getElementById('launchpad').classList.contains('active')) toggleLaunchpad();
        }
    }




    // Rastreamento de mouse para efeito de luz nos cards
document.querySelectorAll('.card').forEach(card => {
    card.onmousemove = e => {
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        card.style.setProperty("--mouse-x", `${x}px`);
        card.style.setProperty("--mouse-y", `${y}px`);
    };
});

// Melhoria: Fechar modal ao clicar na tecla 'ESC'
document.addEventListener('keydown', (e) => {
    if (e.key === "Escape") {
        closeModal();
        if (document.getElementById('launchpad').classList.contains('active')) {
            toggleLaunchpad();
        }
    }
});