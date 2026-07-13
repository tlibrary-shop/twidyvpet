// Konfigurasi Game dan Default State
const DEFAULT_STATE = {
    userName: "Twidy",
    petName: "Twidy",
    level: 12,
    exp: 650,
    maxExp: 1200,
    coins: 12450,
    stats: {
        hunger: 60,
        happiness: 80,
        energy: 40,
        hygiene: 70,
        health: 100
    },
    mood: "Senang",
    moodDesc: "Twidy merasa senang karena kamu telah bermain dengannya!",
    inventory: [],
    lastSaved: Date.now()
};

let gameState = { ...DEFAULT_STATE };

// Shop Items Data
const shopItems = [
    { id: 'food_1', name: 'Sosis Premium', type: 'food', price: 50, icon: '🌭', effect: { hunger: 30, happiness: 5 } },
    { id: 'food_2', name: 'Makanan Kucing', type: 'food', price: 30, icon: '🍲', effect: { hunger: 20 } },
    { id: 'drink_1', name: 'Susu Segar', type: 'drink', price: 20, icon: '🥛', effect: { hunger: 10, energy: 10 } },
    { id: 'toy_1', name: 'Bola Lempar', type: 'toy', price: 100, icon: '🎾', effect: { happiness: 40, energy: -10 } },
    { id: 'soap_1', name: 'Sabun Wangi', type: 'soap', price: 40, icon: '🧼', effect: { hygiene: 50, happiness: 5 } }
];

// --- Inisialisasi Game ---
function initGame() {
    loadGame();
    updateUI();
    renderShop();
    renderInventory();
    checkTimeOfDay();
    
    // Game Loop - Kurangi stat setiap 1 menit (dipercepat untuk testing jadi 10 detik)
    setInterval(gameTick, 10000);
}

// --- Save & Load System ---
function saveGame() {
    gameState.lastSaved = Date.now();
    localStorage.setItem('virtualPetAIsave', JSON.stringify(gameState));
}

function loadGame() {
    const saved = localStorage.getItem('virtualPetAIsave');
    if (saved) {
        gameState = JSON.parse(saved);
        calculateOfflineDecay();
    }
}

function calculateOfflineDecay() {
    const now = Date.now();
    const diffHours = (now - gameState.lastSaved) / (1000 * 60 * 60);
    
    if (diffHours > 0.1) {
        // Kurangi stat berdasarkan jam offline
        gameState.stats.hunger = Math.max(0, gameState.stats.hunger - (diffHours * 10));
        gameState.stats.energy = Math.max(0, gameState.stats.energy - (diffHours * 5));
        gameState.stats.hygiene = Math.max(0, gameState.stats.hygiene - (diffHours * 5));
        gameState.stats.happiness = Math.max(0, gameState.stats.happiness - (diffHours * 8));
        updateMood();
    }
}

// --- Core Game Loop ---
function gameTick() {
    gameState.stats.hunger = Math.max(0, gameState.stats.hunger - 1);
    gameState.stats.energy = Math.max(0, gameState.stats.energy - 0.5);
    gameState.stats.hygiene = Math.max(0, gameState.stats.hygiene - 0.5);
    gameState.stats.happiness = Math.max(0, gameState.stats.happiness - 1);
    
    updateMood();
    updateUI();
    saveGame();
    checkTimeOfDay();
}

// --- UI Updates ---
function updateUI() {
    // Header
    document.getElementById('user-name').innerText = gameState.userName;
    document.getElementById('level-val').innerText = gameState.level;
    document.getElementById('exp-val').innerText = gameState.exp;
    document.getElementById('exp-fill').style.width = `${(gameState.exp / gameState.maxExp) * 100}%`;
    document.getElementById('coin-val').innerText = gameState.coins.toLocaleString();

    // Status Bars
    updateBar('hunger', gameState.stats.hunger);
    updateBar('happy', gameState.stats.happiness);
    updateBar('energy', gameState.stats.energy);
    updateBar('hygiene', gameState.stats.hygiene);

    // Mood
    document.getElementById('current-mood-text').innerText = gameState.mood;
    document.getElementById('current-mood-desc').innerText = gameState.moodDesc;
    
    // Set Mood Icon
    let icon = '😐';
    if(gameState.stats.happiness > 70) icon = '😀';
    if(gameState.stats.hunger < 30) icon = '😫';
    if(gameState.stats.energy < 20) icon = '😴';
    document.getElementById('current-mood-icon').innerText = icon;
}

function updateBar(id, value) {
    document.getElementById(`${id}-val`).innerText = `${Math.floor(value)}/100`;
    document.getElementById(`${id}-fill`).style.width = `${value}%`;
}

function updateMood() {
    if (gameState.stats.hunger < 20) {
        gameState.mood = "Sangat Lapar";
        gameState.moodDesc = "Twidy butuh makanan segera, perutnya keroncongan!";
    } else if (gameState.stats.energy < 20) {
        gameState.mood = "Lelah";
        gameState.moodDesc = "Twidy mengantuk dan butuh istirahat.";
    } else if (gameState.stats.hygiene < 30) {
        gameState.mood = "Kotor";
        gameState.moodDesc = "Twidy merasa gatal, saatnya mandi!";
    } else if (gameState.stats.happiness > 70) {
        gameState.mood = "Senang";
        gameState.moodDesc = "Twidy merasa senang menghabiskan waktu bersamamu.";
    } else {
        gameState.mood = "Biasa Saja";
        gameState.moodDesc = "Twidy sedang bersantai menikmati harinya.";
    }
}

// --- Environment ---
function checkTimeOfDay() {
    const hour = new Date().getHours();
    const container = document.getElementById('game-container');
    if (hour >= 18 || hour < 6) {
        container.className = 'room-night';
    } else {
        container.className = 'room-day';
    }
}

// --- Actions & Animations ---
function setAnimation(animClass, durationMs) {
    const pet = document.getElementById('pet-character');
    pet.className = animClass;
    setTimeout(() => {
        pet.className = 'idle';
    }, durationMs);
}

function doAction(action) {
    switch(action) {
        case 'makan':
            if (gameState.stats.hunger >= 100) return alert('Twidy masih kenyang!');
            gameState.stats.hunger = Math.min(100, gameState.stats.hunger + 30);
            gameState.stats.energy = Math.min(100, gameState.stats.energy + 5);
            addExp(10);
            setAnimation('eat', 2000);
            break;
        case 'main':
            if (gameState.stats.energy < 20) return alert('Twidy terlalu lelah untuk bermain.');
            gameState.stats.happiness = Math.min(100, gameState.stats.happiness + 20);
            gameState.stats.energy = Math.max(0, gameState.stats.energy - 15);
            gameState.stats.hunger = Math.max(0, gameState.stats.hunger - 10);
            addExp(15);
            setAnimation('jump', 1000);
            break;
        case 'mandi':
            gameState.stats.hygiene = 100;
            gameState.stats.happiness = Math.min(100, gameState.stats.happiness + 10);
            addExp(10);
            setAnimation('jump', 1500);
            break;
        case 'tidur':
            gameState.stats.energy = 100;
            gameState.stats.hunger = Math.max(0, gameState.stats.hunger - 20);
            setAnimation('sleep', 4000);
            break;
    }
    updateMood();
    updateUI();
    saveGame();
}

function addExp(amount) {
    gameState.exp += amount;
    if (gameState.exp >= gameState.maxExp) {
        gameState.level++;
        gameState.exp -= gameState.maxExp;
        gameState.maxExp = Math.floor(gameState.maxExp * 1.5);
        gameState.coins += 500;
        alert(`Selamat! Level naik ke ${gameState.level}! Mendapatkan 500 Coins.`);
    }
}

// --- Shop & Inventory ---
function renderShop() {
    const grid = document.getElementById('shop-items');
    grid.innerHTML = '';
    shopItems.forEach(item => {
        grid.innerHTML += `
            <div class="item-card" onclick="buyItem('${item.id}')">
                <div class="item-icon">${item.icon}</div>
                <div class="item-name">${item.name}</div>
                <div class="item-price">🐾 ${item.price}</div>
            </div>
        `;
    });
}

function buyItem(id) {
    const item = shopItems.find(i => i.id === id);
    if (gameState.coins >= item.price) {
        gameState.coins -= item.price;
        gameState.inventory.push(item);
        updateUI();
        renderInventory();
        saveGame();
        alert(`${item.name} berhasil dibeli!`);
    } else {
        alert('Coin tidak cukup!');
    }
}

function renderInventory() {
    const grid = document.getElementById('inventory-items');
    grid.innerHTML = '';
    if (gameState.inventory.length === 0) {
        grid.innerHTML = '<p>Tas kosong.</p>';
        return;
    }
    
    // Group items by ID
    const counts = {};
    gameState.inventory.forEach(i => { counts[i.id] = (counts[i.id] || 0) + 1; });
    
    Object.keys(counts).forEach(id => {
        const item = shopItems.find(i => i.id === id);
        grid.innerHTML += `
            <div class="item-card" onclick="useItem('${id}')">
                <div class="item-icon">${item.icon}</div>
                <div class="item-name">${item.name} (x${counts[id]})</div>
                <div class="item-price">Gunakan</div>
            </div>
        `;
    });
}

function useItem(id) {
    const index = gameState.inventory.findIndex(i => i.id === id);
    if (index > -1) {
        const item = gameState.inventory[index];
        gameState.inventory.splice(index, 1); // Remove 1 item
        
        // Apply effects
        if(item.effect.hunger) gameState.stats.hunger = Math.min(100, gameState.stats.hunger + item.effect.hunger);
        if(item.effect.happiness) gameState.stats.happiness = Math.min(100, gameState.stats.happiness + item.effect.happiness);
        if(item.effect.energy) gameState.stats.energy = Math.min(100, gameState.stats.energy + item.effect.energy);
        if(item.effect.hygiene) gameState.stats.hygiene = Math.min(100, gameState.stats.hygiene + item.effect.hygiene);
        
        setAnimation(item.type === 'food' || item.type === 'drink' ? 'eat' : 'jump', 1500);
        
        updateMood();
        updateUI();
        renderInventory();
        saveGame();
    }
}

// --- Modals Toggle ---
function toggleModal(modalId) {
    const modal = document.getElementById(modalId);
    modal.style.display = modal.style.display === 'flex' ? 'none' : 'flex';
}

function toggleChat() {
    const chat = document.getElementById('chat-section');
    chat.style.display = chat.style.display === 'block' ? 'none' : 'block';
}

// --- AI Chat Implementation ---
const GEMINI_API_KEY = "ISI_API_KEY_ANDA_DISINI"; 

function handleChatKey(event) {
    if (event.key === 'Enter') sendChatMessage();
}

async function sendChatMessage() {
    const input = document.getElementById('chat-input');
    const message = input.value.trim();
    if (!message) return;
    
    // Add user message to UI
    appendChatBubble(message, 'user');
    input.value = '';
    
    // Call AI
    await chatWithPet(message);
}

function appendChatBubble(text, sender) {
    const history = document.getElementById('chat-history');
    const bubbleClass = sender === 'user' ? 'user-bubble' : 'pet-bubble';
    
    let avatarHtml = '';
    if(sender === 'pet') {
        avatarHtml = `<div class="chat-avatar"><img src="data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><circle cx='50' cy='50' r='50' fill='%232d251f'/></svg>" alt="Pet"></div>`;
    }

    const html = `
        <div class="chat-bubble ${bubbleClass}">
            ${avatarHtml}
            <div class="chat-text">${text}</div>
        </div>
    `;
    history.insertAdjacentHTML('beforeend', html);
    history.scrollTop = history.scrollHeight;
}

// Fungsi utama yang siap ditempelkan API Key
async function chatWithPet(userMessage) {
    if (GEMINI_API_KEY === "ISI_API_KEY_ANDA_DISINI") {
        setTimeout(() => {
            appendChatBubble(`(Sistem): API Key belum disetel. Saya menerima pesanmu: "${userMessage}"`, 'pet');
            setAnimation('jump', 1000);
        }, 1000);
        return;
    }

    try {
        // Sistem Prompt untuk AI agar berakting sebagai pet
        const systemPrompt = `Kamu adalah pet virtual bernama ${gameState.petName}. Pemilikmu bernama ${gameState.userName}. 
        Ingat kesukaan pemilikmu (suka sosis, main sore, mau ke Jepang). 
        Balas dengan gaya lucu, hangat, menggunakan emoji, dan pendek (maksimal 2 kalimat). 
        Statusmu saat ini: Lapar ${gameState.stats.hunger}%, Energi ${gameState.stats.energy}%.`;

        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;
        
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [
                    { role: "user", parts: [{ text: systemPrompt + "\n\nPemilik: " + userMessage }] }
                ]
            })
        });

        const data = await response.json();
        const aiResponse = data.candidates[0].content.parts[0].text;
        
        appendChatBubble(aiResponse, 'pet');
        setAnimation('jump', 1000);
        
        // Naikkan kebahagiaan saat ngobrol
        gameState.stats.happiness = Math.min(100, gameState.stats.happiness + 5);
        updateUI();
        
    } catch (error) {
        console.error("Error AI Chat:", error);
        appendChatBubble("Maaf, koneksiku sedang terganggu... 😿", 'pet');
    }
}

// Mulai Game saat halaman dimuat
window.onload = initGame;
