document.addEventListener('DOMContentLoaded', () => {
    const appGrid = document.getElementById('app-grid');
    const template = document.getElementById('app-card-template');

    // --- localStorage helpers ---
    function getCustomName(appId) {
        return localStorage.getItem(`appName_${appId}`);
    }
    function setCustomName(appId, name) {
        localStorage.setItem(`appName_${appId}`, name);
    }
    function getCustomBg(appId) {
        return localStorage.getItem(`appBg_${appId}`);
    }
    function setCustomBg(appId, base64) {
        localStorage.setItem(`appBg_${appId}`, base64);
    }

    // Fetch the list of apps from the backend
    fetch('/api/apps')
        .then(response => response.json())
        .then(apps => {
            apps.forEach(app => {
                const card = createCard(app);
                appGrid.appendChild(card);
            });
        })
        .catch(error => {
            console.error('Error fetching apps:', error);
            appGrid.innerHTML = '<p style="color: red; text-align: center; width: 100%;">Failed to load applications. Make sure the backend is running.</p>';
        });

    function createCard(app) {
        const clone = template.content.cloneNode(true);
        const cardElement = clone.querySelector('.app-card');

        const nameEl = cardElement.querySelector('.app-name');
        const editNameBtn = cardElement.querySelector('.edit-name-btn');
        const editBgBtn = cardElement.querySelector('.edit-bg-btn');
        const bgFileInput = cardElement.querySelector('.bg-file-input');

        // --- Apply custom name from localStorage or fallback to default ---
        const customName = getCustomName(app.id);
        nameEl.textContent = customName || app.name;

        // --- Apply custom background from localStorage ---
        const customBg = getCustomBg(app.id);
        if (customBg) {
            cardElement.style.backgroundImage = `url(${customBg})`;
            cardElement.classList.add('has-bg');
        }

        // --- Edit Name handler ---
        editNameBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            const currentName = nameEl.textContent;
            const newName = prompt('Enter a new name for this app:', currentName);
            if (newName !== null && newName.trim() !== '') {
                nameEl.textContent = newName.trim();
                setCustomName(app.id, newName.trim());
            }
        });

        // --- Edit Background handler ---
        editBgBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            bgFileInput.click();
        });

        bgFileInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = (event) => {
                const base64 = event.target.result;
                cardElement.style.backgroundImage = `url(${base64})`;
                cardElement.classList.add('has-bg');
                setCustomBg(app.id, base64);
            };
            reader.readAsDataURL(file);
        });

        // --- Setup initial state ---
        cardElement.classList.add('stopped');
        cardElement.querySelector('.status-text').textContent = 'Stopped';

        // --- Setup buttons ---
        const startBtn = cardElement.querySelector('.start-btn');
        const stopBtn = cardElement.querySelector('.stop-btn');
        const openBtn = cardElement.querySelector('.open-btn');

        openBtn.href = `http://${window.location.hostname}:${app.port}`;

        startBtn.addEventListener('click', () => handleAction(app.id, 'start', cardElement));
        stopBtn.addEventListener('click', () => handleAction(app.id, 'stop', cardElement));

        return cardElement;
    }

    function handleAction(appId, action, cardElement) {
        cardElement.classList.remove('stopped', 'running');
        cardElement.classList.add('working');
        cardElement.querySelector('.status-text').textContent = action === 'start' ? 'Starting...' : 'Stopping...';

        fetch(`/api/apps/${appId}/${action}`, { method: 'POST' })
            .then(response => response.json())
            .then(data => {
                cardElement.classList.remove('working');

                if (data.success) {
                    if (action === 'start') {
                        cardElement.classList.add('running');
                        cardElement.querySelector('.status-text').textContent = 'Running';
                    } else {
                        cardElement.classList.add('stopped');
                        cardElement.querySelector('.status-text').textContent = 'Stopped';
                    }
                } else {
                    alert(`Error: ${data.error}`);
                    cardElement.classList.add(action === 'start' ? 'stopped' : 'running');
                    cardElement.querySelector('.status-text').textContent = action === 'start' ? 'Stopped' : 'Running';
                }
            })
            .catch(error => {
                console.error('Action error:', error);
                cardElement.classList.remove('working');
                alert('A network error occurred.');
            });
    }
});
