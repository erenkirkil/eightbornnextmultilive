/* EIGHTBORN MULTILIVE - LOGIC (v28.0 - Drag Fix) */

function escapeHtml(text) {
    if (!text) return text;
    return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
}

const defaultChannels = [
    { name: "Khonus", id: "UCs3th-mToB7w5ffvBH-97YA", visible: true },
    { name: "Yusif Safarov", id: "UC2kycvhXmvbA09MWPGDFDoA", visible: true },
    { name: "Sergeant35", id: "UCHQBe54UVzn2rVHVBO1fDmA", visible: true },
    { name: "syichde", id: "UC5BPd3Zp80IKOCvSV8yWpzg", visible: true },
    { name: "Nilay", id: "UCzaC5yXSkczTU6vPGP7YIwQ", visible: true },
    { name: "Pammyyy", id: "UCsX2qg56Lq4BnpnkD25mRnQ", visible: true },
    { name: "Niyantoo", id: "UCbx7M0pwBKxEKfHqP28R4ZA", visible: true },
    { name: "Valiancys", id: "UCv0z4ePgLfvNpIuRtyrhFpg", visible: true },
    { name: "vegoraX", id: "UCr7VUsDp0XEzJ1m-fb2Yvgw", visible: true },
    { name: "Ewony", id: "UCeq-k9a1UNKTVEFGykaf32w", visible: true },
    { name: "Egoist Pati GTA", id: "UC1BZdzWiOPY6Mp9hGmj39uA", visible: true },
    { name: "Miray", id: "UC3yAvcwCHf0SSAVw71nTDTw", visible: true }
];

let channels = [];
let activeChannelId = null;
let autoRefreshEnabled = localStorage.getItem('eb_auto_refresh') === 'true';

// --- INIT ---
function initData() {
    const storedData = localStorage.getItem('eb_channels');
    if (storedData) {
        try {
            let userChannels = JSON.parse(storedData);
            userChannels.forEach(userChan => {
                const match = defaultChannels.find(def => def.id === userChan.id);
                if (match) userChan.name = match.name;
                if (userChan.visible === undefined) userChan.visible = true;
            });
            const newChannels = defaultChannels.filter(def => !userChannels.some(userChan => userChan.id === def.id));
            channels = [...userChannels, ...newChannels];
        } catch (e) {
            channels = JSON.parse(JSON.stringify(defaultChannels));
        }
    } else {
        channels = JSON.parse(JSON.stringify(defaultChannels));
    }
    saveData();
}

function saveData() { localStorage.setItem('eb_channels', JSON.stringify(channels)); }

window.onload = function() {
    initData();
    const toggle = document.getElementById('autoRefreshToggle');
    if(toggle) toggle.checked = autoRefreshEnabled;
    render();
};

function toggleAutoRefresh() {
    autoRefreshEnabled = document.getElementById('autoRefreshToggle').checked;
    localStorage.setItem('eb_auto_refresh', autoRefreshEnabled);
}

document.addEventListener("visibilitychange", function() {
    if (document.visibilityState === 'visible' && autoRefreshEnabled) {
        const iframes = document.querySelectorAll('iframe');
        iframes.forEach((iframe, index) => {
            setTimeout(() => { iframe.src = iframe.src; }, index * 200);
        });
    }
});

// UI
// UI
function toggleDrawer() {
    const drawer = document.getElementById('drawer');
    const body = document.body;

    // Hem menüyü aç/kapat hem de arka planı (overlay) aktif et
    drawer.classList.toggle('open');

    // CSS'teki "body.drawer-active #overlay" kuralının çalışması için bu sınıf şart:
    if(drawer.classList.contains('open')) {
        body.classList.add('drawer-active');
    } else {
        body.classList.remove('drawer-active');
    }
}

function toggleActiveChannel(id) {
    const container = document.getElementById('container');
    if (activeChannelId === id) {
        activeChannelId = null;
        container.classList.remove('mode-focus');
    } else {
        activeChannelId = id;
        container.classList.add('mode-focus');
    }
    render();
}

function toggleVisibility(index) {
    channels[index].visible = !channels[index].visible;
    if (!channels[index].visible && activeChannelId === channels[index].id) {
        activeChannelId = null;
        document.getElementById('container').classList.remove('mode-focus');
    }
    render();
    saveData();
}

// --- RENDER ---
let dragStartIndex;

function render() {
    const container = document.getElementById('container');
    const list = document.getElementById('channelList');

    // 1. LISTE RENDER
    list.innerHTML = '';
    channels.forEach((channel, index) => {
        const item = document.createElement('div');
        item.className = `channel-list-item ${!channel.visible ? 'passive' : ''}`;
        item.draggable = true;
        item.dataset.index = index;
        item.innerHTML = `
            <div style="display:flex; align-items:center; flex:1; overflow:hidden;">
                <span style="color:#666; margin-right:8px; cursor:grab;">☰</span>
                <span class="name-text" style="font-size:13px; font-weight:500; white-space:nowrap; text-overflow:ellipsis; overflow:hidden;">${escapeHtml(channel.name)}</span>
            </div>
            <div class="item-actions">
                <label class="switch"><input type="checkbox" onchange="toggleVisibility(${index})" ${channel.visible ? 'checked' : ''}><span class="slider"></span></label>
                <button class="btn-icon" onclick="editChannel(${index})"><svg viewBox="0 0 24 24"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/></svg></button>
                <button class="btn-icon" onclick="deleteChannel(${index})"><svg viewBox="0 0 24 24"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg></button>
            </div>
        `;
        item.addEventListener('dragstart', dragStart); item.addEventListener('dragover', dragOver); item.addEventListener('drop', drop);
        list.appendChild(item);
    });

    // 2. GRID RENDER
    const visibleChannels = channels.filter(c => c.visible);

    // Temizlik
    const existingCards = Array.from(document.querySelectorAll('.card'));
    existingCards.forEach(card => {
        if (!visibleChannels.some(c => c.id === card.getAttribute('data-id'))) {
            card.remove();
        }
    });

    // Mod Kontrolü
    if(activeChannelId) container.classList.add('mode-focus');
    else container.classList.remove('mode-focus');

    // KARTLARI ÇİZ
    visibleChannels.forEach((channel, index) => {
        let card = document.querySelector(`.card[data-id="${channel.id}"]`);
        const isActive = (activeChannelId === channel.id);
        const safeName = escapeHtml(channel.name);
        const safeId = encodeURIComponent(channel.id);
        const channelUrl = `https://www.youtube.com/channel/${safeId}`;

        if(card) {
            if(isActive) card.classList.add('active'); else card.classList.remove('active');
            card.style.order = isActive ? -1 : index;
        }

        const btnText = isActive ? "Küçült" : "Büyült";
        const iconSvg = isActive
            ? `<svg viewBox="0 0 24 24"><path d="M5 16h3v3h2v-5H5v2zm3-8H5v2h5V5H8v3zm6 11h2v-3h3v-2h-5v5zm2-14v3h3v2h-5V5h2z"/></svg>`
            : `<svg viewBox="0 0 24 24"><path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z"/></svg>`;

        const headerHtml = `
            <span class="title-text">${safeName}</span>
            <div class="card-actions">
                <a href="${channelUrl}" target="_blank" class="btn-header btn-link" title="Kanala Git">
                    <svg viewBox="0 0 24 24"><path d="M19 19H5V5h7V3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2v-7h-2v7zM14 3v2h3.59l-9.83 9.83 1.41 1.41L19 6.41V10h2V3h-7z"/></svg>
                    <span>Git</span>
                </a>
                <button class="btn-header btn-focus" onclick="toggleActiveChannel('${channel.id}')" title="${btnText}">
                    ${iconSvg}
                    <span>${btnText}</span>
                </button>
            </div>
        `;

        if (card) {
            card.querySelector('.header').innerHTML = headerHtml;
        } else {
            card = document.createElement('div');
            card.className = `card ${isActive ? 'active' : ''}`;
            card.setAttribute('data-id', channel.id);
            card.style.order = isActive ? -1 : index;
            card.innerHTML = `
                <div class="header">${headerHtml}</div>
                <div class="video-wrapper">
                     <iframe src="https://www.youtube.com/embed/live_stream?channel=${safeId}&autoplay=1&mute=1" loading="lazy" allowfullscreen></iframe>
                </div>
            `;
            container.appendChild(card);
        }
    });
}

// Helpers
let currentEditingIndex = -1;
function editChannel(index) {
    currentEditingIndex = index;
    const channel = channels[index];
    document.getElementById('editNameInput').value = channel.name;
    document.getElementById('editIdInput').value = channel.id;
    document.getElementById('editModal').classList.add('show');
}
function closeModal() { document.getElementById('editModal').classList.remove('show'); currentEditingIndex = -1; }
function saveEditChannel() {
    if (currentEditingIndex === -1) return;
    const newName = document.getElementById('editNameInput').value.trim();
    const newId = document.getElementById('editIdInput').value.trim();
    if (newName && newId) {
        const isDuplicate = channels.some((c, index) => c.id === newId && index !== currentEditingIndex);
        if (isDuplicate) { alert("Bu ID zaten var!"); return; }
        const channel = channels[currentEditingIndex];
        channel.name = newName;
        if (channel.id !== newId && activeChannelId === channel.id) {
            activeChannelId = null;
            document.getElementById('container').classList.remove('mode-focus');
        }
        channel.id = newId;
        saveData(); render(); closeModal();
    } else { alert("Eksik bilgi!"); }
}
function addChannel() {
    const name = document.getElementById('chanName').value.trim();
    const id = document.getElementById('chanId').value.trim();
    if(name && id) {
        const isDuplicate = channels.some(c => c.id === id);
        if (isDuplicate) { alert("Bu ID zaten ekli!"); return; }
        channels.push({name, id, visible: true});
        saveData();
        document.getElementById('chanName').value = ''; document.getElementById('chanId').value = '';
        render();
    }
}
function deleteChannel(index) {
    if(confirm('Silinsin mi?')) {
        const idToDelete = channels[index].id;
        if (activeChannelId === idToDelete) {
             activeChannelId = null;
             document.getElementById('container').classList.remove('mode-focus');
        }
        channels.splice(index, 1);
        saveData(); render();
    }
}

// --- DRAG & DROP FIX ---
function dragStart() {
    dragStartIndex = +this.closest('.channel-list-item').dataset.index;
    this.classList.add('dragging');
}
function dragOver(e) { e.preventDefault(); }
function drop(e) {
    e.preventDefault();
    e.stopPropagation(); // Olayın karışmasını engelle

    const dragEndIndex = +this.closest('.channel-list-item').dataset.index;

    // Geçersiz durum kontrolü
    if (dragStartIndex === undefined || dragEndIndex === undefined || dragStartIndex === dragEndIndex) return;

    // Diziyi güncelle
    const item = channels[dragStartIndex];
    channels.splice(dragStartIndex, 1);
    channels.splice(dragEndIndex, 0, item);

    saveData();

    // Hile: Render'ı bir sonraki "tick"e atarak tarayıcının drop işlemini bitirmesine izin ver
    setTimeout(() => {
        render();
    }, 0);
}