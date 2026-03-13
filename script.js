 
        function updateClock() { 
            const now = new Date();
            document.getElementById('clock').innerText = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }); 
        }
        setInterval(updateClock, 1000); updateClock();

        const avatar = document.getElementById('avatar');
        const header = document.getElementById('header');
        const target = document.getElementById('avatar-target');

        function animate() {
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
                avatar.style.width = '40px'; avatar.style.height = '40px'; avatar.style.borderRadius = '10px';
                avatar.style.left = `${rect.left + rect.width / 2}px`;
                avatar.style.top = `${rect.top + rect.height / 2}px`;
            }
        }

        window.addEventListener('scroll', () => requestAnimationFrame(animate));

      function openModal(type) {
    const urls = {
        ativae: "https://ativae-inventario-integrado.vercel.app/",
        store: "https://storerubertt-master.vercel.app/",
        empty: "https://whatsempty.vercel.app/",
        finances: "https://financesrubertt.vercel.app/",
        linkedin: "https://br.linkedin.com/in/rubertt-ramires-da-silva",
        github: "https://github.com/Rubertt12"
    };

   
    if (type === 'linkedin' || type === 'github') {
        window.open(urls[type], '_blank'); 
    } else {
       
        document.getElementById('modal').classList.add('active');
        document.getElementById('modalContent').innerHTML = `<iframe src="${urls[type]}"></iframe>`;
    }
}

        
        function closeModal() { 
            document.getElementById('modal').classList.remove('active'); 
            document.getElementById('modalContent').innerHTML = ""; 
        }
