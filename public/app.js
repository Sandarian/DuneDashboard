document.addEventListener('DOMContentLoaded', () => {
    const appGrid = document.getElementById('app-grid');
    const template = document.getElementById('app-card-template');

    // appId -> card DOM element
    const cardMap = {};
    // appId -> { action: 'start'|'stop', time: ms } — grace period after user-triggered actions
    const actionTimestamps = {};
    const GRACE_MS = 25000; // wait 25s before polling overrides a start action (containers take time to boot)
    const POLL_INTERVAL_MS = 15000;

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

    // --- Apply a known running/stopped state to a card ---
    function applyStatus(cardElement, isRunning) {
        cardElement.classList.remove('running', 'stopped', 'working');
        if (isRunning) {
            cardElement.classList.add('running');
            cardElement.querySelector('.status-text').textContent = 'Running';
        } else {
            cardElement.classList.add('stopped');
            cardElement.querySelector('.status-text').textContent = 'Stopped';
        }
    }

    // --- Poll all app statuses from the backend ---
    function pollStatuses() {
        fetch('/api/status')
            .then(r => r.json())
            .then(statuses => {
                const now = Date.now();
                statuses.forEach(({ id, running }) => {
                    const card = cardMap[id];
                    if (!card) return;
                    // Don't overwrite while a command is in-flight
                    if (card.classList.contains('working')) return;
                    // Don't overwrite within the grace period after a start — the container may still be booting
                    const ts = actionTimestamps[id];
                    if (ts && ts.action === 'start' && (now - ts.time) < GRACE_MS) return;
                    applyStatus(card, running);
                });
            })
            .catch(err => console.error('Status poll failed:', err));
    }

    // Fetch the list of apps from the backend
    fetch('/api/apps')
        .then(response => response.json())
        .then(apps => {
            apps.forEach(app => {
                const card = createCard(app);
                cardMap[app.id] = card;
                appGrid.appendChild(card);
            });
            // Check real status immediately, then on a recurring interval
            pollStatuses();
            setInterval(pollStatuses, POLL_INTERVAL_MS);
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

        // Start neutral — pollStatuses() will resolve real state shortly after
        cardElement.querySelector('.status-text').textContent = 'Checking...';

        // --- Setup buttons ---
        const openBtn = cardElement.querySelector('.open-btn');
        openBtn.href = `http://${window.location.hostname}:${app.port}`;

        cardElement.querySelector('.start-btn').addEventListener('click', () => handleAction(app.id, 'start', cardElement));
        cardElement.querySelector('.stop-btn').addEventListener('click', () => handleAction(app.id, 'stop', cardElement));

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
                    // Record the timestamp so polls don't overwrite during the boot grace period
                    actionTimestamps[appId] = { action, time: Date.now() };
                    applyStatus(cardElement, action === 'start');
                } else {
                    alert(`Error: ${data.error}`);
                    // Revert to opposite of what we tried
                    applyStatus(cardElement, action === 'start' ? false : true);
                }
            })
            .catch(error => {
                console.error('Action error:', error);
                cardElement.classList.remove('working');
                alert('A network error occurred.');
            });
    }
});
