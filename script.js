// 1. RELÓGIO
function updateClock() { 
    const now = new Date();
    const clockEl = document.getElementById('clock');
    if (clockEl) {
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
        header.classList.remove('active');
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
        header.classList.add('active');
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
    if (!lp) return;

    if (lp.classList.contains('active')) {
        lp.classList.remove('active');
        setTimeout(() => { lp.style.display = 'none'; }, 400);
    } else {
        lp.style.display = 'flex';
        setTimeout(() => { 
            lp.classList.add('active'); 
            document.getElementById('lpSearchInput')?.focus();
        }, 10);
    }
}

function toggleLPFullscreen(e) {
    if (e) e.stopPropagation();
    const win = document.getElementById('lpWindow');
    const icon = e.currentTarget.querySelector('i');
    win.classList.toggle('fullscreen');
    icon.classList.toggle('fa-expand');
    icon.classList.toggle('fa-compress');
}

// Filtro de Busca Estilo Spotlight
document.getElementById('lpSearchInput')?.addEventListener('input', function(e) {
    const term = e.target.value.toLowerCase();
    const items = document.querySelectorAll('.lp-item');
    const grid = document.querySelector('.lp-grid');
    
    // Se não houver busca, mostra tudo. Se houver, filtra.
    items.forEach(item => {
        const name = item.querySelector('span').innerText.toLowerCase();
        item.style.display = name.includes(term) ? 'flex' : 'none';
    });
});

// 4. MODAIS
function openModal(type) {
    const urls = {
        ativae: "https://ativae-inventario-integrado.vercel.app/",
        store: "https://storerubertt-master.vercel.app/",
        empty: "https://whatsempty.vercel.app/",
        finances: "https://financesrubertt.vercel.app/",
        linkedin: "https://br.linkedin.com/in/rubertt-ramires-da-silva",
        github: "https://github.com/Rubertt12"
    };

    if (document.getElementById('launchpad').classList.contains('active')) toggleLaunchpad();

    if (type === 'linkedin' || type === 'github') {
        window.open(urls[type], '_blank'); 
    } else {
        document.getElementById('modal').classList.add('active');
        document.getElementById('modalContent').innerHTML = `<iframe src="${urls[type]}" style="width:100%; height:100%; border:none;"></iframe>`;
    }
}

function closeModal() {
    document.getElementById('modal').classList.remove('active');
    document.getElementById('modalContent').innerHTML = '';
}



// Abrir e fechar o Launchpad
function toggleLaunchpad(e) {
    if (e) e.stopPropagation();
    const lp = document.getElementById('launchpad');
    const input = document.getElementById('lpSearchInput');

    if (!lp) return;

    if (lp.classList.contains('active')) {
        lp.classList.remove('active');
        // Espera a animação de fade antes de esconder o display
        setTimeout(() => { lp.style.display = 'none'; }, 300);
    } else {
        lp.style.display = 'flex';
        // Pequeno delay para a transição de opacidade funcionar
        setTimeout(() => { 
            lp.classList.add('active'); 
            if(input) input.focus(); 
        }, 10);
    }
}

// FECHAR AO CLICAR FORA (Ajustado)
window.onclick = function(event) {
    const lp = document.getElementById('launchpad');
    // Se o clique foi no fundo escuro (lp-overlay) e não na janela central
    if (event.target == lp) {
        toggleLaunchpad();
    }
}

// Atalho Tecla ESC para fechar
document.addEventListener('keydown', (e) => {
    if (e.key === "Escape") {
        const lp = document.getElementById('launchpad');
        if (lp && lp.classList.contains('active')) toggleLaunchpad();
    }
});




function addNewApp() {
    const password = prompt("Senha:");
    
    if (password === "Mordocker42@ad") {
        const name = prompt("Nome do Aplicativo:");
        const url = prompt("URL do Site (com https://):");
        let icon = prompt("URL do Ícone (ou deixe vazio para aleatório):");

        // Lista de ícones padrão (caso ele não encontre ou não digite um)
        const defaultIcons = [
            "img/favicon.svg",
            "img/favicon-control.png",
            "img/novo-usuario.png",
            "img/gestao.ico"
        ];

        // Se o input estiver vazio, escolhe um aleatório da lista acima
        if (!icon || icon.trim() === "") {
            icon = defaultIcons[Math.floor(Math.random() * defaultIcons.length)];
        }

        if (name && url) {
            const grid = document.getElementById('lpGrid');
            const newItem = document.createElement('div');
            newItem.className = 'lp-item';
            
            // Define o clique para abrir o link
            newItem.onclick = () => window.open(url, '_blank');

            // O atributo 'onerror' garante que, se a URL digitada quebrar, 
            // ele substitua por um ícone aleatório da lista
            const randomFallback = defaultIcons[Math.floor(Math.random() * defaultIcons.length)];

            newItem.innerHTML = `
                <img src="${icon}" alt="${name}" onerror="this.src='${randomFallback}'">
                <span>${name}</span>
            `;

            // Insere antes do botão de adicionar
            const addBtn = document.querySelector('.add-btn');
            grid.insertBefore(newItem, addBtn);
        }
    } else {
        alert("Senha incorreta.");
    }
}