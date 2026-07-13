// Data Default State (Level 1, 0 EXP, 50 Coin untuk pemain baru)
const DEFAULT_STATE = {
    userName: "",
    petName: "",
    level: 1,
    exp: 0,
    maxExp: 100,
    coins: 50,
    stats: {
        hunger: 80,
        happiness: 80,
        energy: 80,
        hygiene: 80
    },
    inventory: [],
    lastSaved: Date.now()
};

let gameState = { ...DEFAULT_STATE };

// Shop Items Data
const shopItems = [
    { id: 'food_1', name: 'Sosis Premium', type: 'food', price: 20, icon: '🌭', effect: { hunger: 30, happiness: 5 } },
    { id: 'food_2', name: 'Snack Kucing', type: 'food', price: 10, icon: '🍲', effect: { hunger: 20 } },
    { id: 'drink_1', name: 'Susu Segar', type: 'drink', price: 15, icon: '🥛', effect: { hunger: 10, energy: 10 } },
    { id: 'toy_1', name: 'Bola Lempar', type: 'toy', price: 40, icon: '🎾', effect: { happiness: 40, energy: -10 } },
    { id: 'soap_1', name: 'Sabun Wangi', type: 'soap', price: 25, icon: '🧼', effect: { hygiene: 50, happiness: 5 } }
];

// Kalimat acak Pet
const petThoughts = [
    "Aku lapar...", "Ayo main bersama!", "Senang kamu datang.", 
    "Hmm, enaknya tidur...", "Apakah kamu punya cemilan?", 
    "Hari yang indah!", "Aku rindu bermain bola."
];

let thoughtInterval;

// --- Inisialisasi ---
window.onload = () => {
    checkOnboarding();
};

function checkOnboarding() {
    const saved = localStorage.getItem('virtualPetAI_v2');
    if (!saved) {
        // Pemain Baru -> Tampilkan Onboarding
        document.getElementById('onboarding-screen').style.display = 'flex';
        document.getElementById('game-container').classList.add('hidden');
        
        // Timeout Splash -> Telur
        setTimeout(() => {
            document.getElementById('ob-splash').classList.remove('active');
            document.getElementById('ob-egg').classList.add('active');
        }, 2000);
    } else {
        // Pemain Lama -> Langsung Muat Game
        document.getElementById('onboarding-screen').style.display = 'none';
        document.getElementById('game-container').classList.remove('hidden');
        loadGame();
        initGameLoop();
    }
}

// --- Logika Onboarding (Telur Menetas) ---
let eggClicks = 0;
function tapEgg() {
    const egg = document.getElementById('egg-character');
    const crack = document.getElementById('egg-crack');
    
    // Animasikan goyang
    egg.classList.remove('shake-anim');
    void egg.offsetWidth; // trigger reflow
    egg.classList.add('shake-anim');
    
    eggClicks++;
    
    if (eggClicks === 2) {
        crack.style.opacity = '1'; // Munculkan retakan
    } else if (eggClicks >= 4) {
        // Pindah ke input nama
        document.getElementById('ob-egg').classList.remove('active');
        document.getElementById('ob-name').classList.add('active');
    }
}

function finishOnboarding() {
    const uName = document.getElementById('input-username').value.trim();
    const pName = document.getElementById('input-petname').value.trim();
    
    if (!uName || !pName) {
        alert("Harap isi kedua nama tersebut ya!");
        return;
    }
    
    gameState.userName = uName;
    gameState.petName = pName;
    
    document.getElementById('onboarding-screen').style.display = 'none';
    document.getElementById('game-container').classList.remove('hidden');
    
    saveGame();
    initGameLoop();
}

// --- Core Game Initialization ---
function initGameLoop() {
    updateUI();
    renderShop();
    renderInventory();
    checkEnvironment();
    
    // Stat decay & environment check (setiap 15 detik)
    setInterval(gameTick, 15000);
    
    // Random thought bubble (setiap 20-30 detik)
    startRandomThoughts();
}

// --- Save & Load System ---
function saveGame() {
    gameState.lastSaved = Date.now();
    localStorage.setItem('virtualPetAI_v2', JSON.stringify(gameState));
}

function loadGame() {
    const saved = localStorage.getItem('virtualPetAI_v2');
    if (saved) {
        gameState = JSON.parse(saved);
        calculateOfflineDecay();
    }
}

function calculateOfflineDecay() {
    const now = Date.now();
    const diffHours = (now - gameState.lastSaved) / (1000 * 60 * 60);
    
    if (diffHours > 0.1) {
        gameState.stats.hunger = Math.max(0, gameState.stats.hunger - (diffHours * 10));
        gameState.stats.energy = Math.max(0, gameState.stats.energy - (diffHours * 5));
        gameState.stats.hygiene = Math.max(0, gameState.stats.hygiene - (diffHours * 5));
        gameState.stats.happiness = Math.max(0, gameState.stats.happiness - (diffHours * 8));
    }
}

// --- Core Game Loop ---
function gameTick() {
    gameState.stats.hunger = Math.max(0, gameState.stats.hunger - 1);
    gameState.stats.energy = Math.max(0, gameState.stats.energy - 0.5);
    gameState.stats.hygiene = Math.max(0, gameState.stats.hygiene - 0.5);
    gameState.stats.happiness = Math.max(0, gameState.stats.happiness - 1);
    
    updateUI();
    saveGame();
    checkEnvironment();
}

// --- Environment & Weather ---
function checkEnvironment() {
    const hour = new Date().getHours();
    const sky = document.getElementById('sky-outside');
    const celestial = document.getElementById('celestial-body');
    const particles = document.getElementById('weather-particles');
    
    // Clear particles
    particles.innerHTML = '';
    sky.className = '';
    
    // Day / Night
    if (hour >= 18 || hour < 6) {
        sky.classList.add('sky-night');
        celestial.className = 'sun-moon is-moon';
        document.getElementById('room-light').style.opacity = '1'; // Lampu menyala
    } else {
        sky.classList.add('sky-day');
        celestial.className = 'sun-moon is-sun';
        document.getElementById('room-light').style.opacity = '0'; // Lampu mati
        
        // Random Hujan di siang hari (10% chance di game tick)
        if (Math.random() < 0.1) {
            sky.classList.replace('sky-day', 'sky-rain');
            createRain(particles);
        }
    }
}

function createRain(container) {
    for (let i = 0; i < 20; i++) {
        const drop = document.createElement('div');
        drop.classList.add('drop');
        drop.style.left = `${Math.random() * 100}%`;
        drop.style.animationDuration = `${Math.random() * 0.5 + 0.5}s`;
        drop.style.animationDelay = `${Math.random()}s`;
        container.appendChild(drop);
    }
}

// --- UI Updates ---
function updateUI() {
    // Top HUD
    document.getElementById('user-name').innerText = gameState.userName;
    document.getElementById('pet-name').innerText = gameState.petName;
    document.getElementById('avatar-letter').innerText = gameState.userName.charAt(0).toUpperCase();
    document.getElementById('level-val').innerText = gameState.level;
    document.getElementById('coin-val').innerText = gameState.coins;

    // Status Dock
    document.getElementById('hunger-fill').style.width = `${gameState.stats.hunger}%`;
    document.getElementById('happy-fill').style.width = `${gameState.stats.happiness}%`;
    document.getElementById('energy-fill').style.width = `${gameState.stats.energy}%`;
    document.getElementById('hygiene-fill').style.width = `${gameState.stats.hygiene}%`;
    document.getElementById('exp-fill').style.width = `${(gameState.exp / gameState.maxExp) * 100}%`;
}

// --- Random Pet Thoughts ---
function startRandomThoughts() {
    setInterval(() => {
        if (Math.random() > 0.5) {
            const bubble = document.getElementById('pet-thought-bubble');
            const randomText = petThoughts[Math.floor(Math.random() * petThoughts.length)];
            
            // Custom thought based on stats
            let text = randomText;
            if(gameState.stats.hunger < 30) text = "Perutku keroncongan...";
            if(gameState.stats.energy < 30) text = "Hoaamm, ngantuk...";
            
            bubble.innerText = text;
            bubble.classList.remove('hidden');
            
            setTimeout(() => {
                bubble.classList.add('hidden');
            }, 4000);
        }
    }, 25000); // Cek setiap 25 detik
}

// --- Actions & Animations ---
function setAnimation(animClass, durationMs) {
    const pet = document.getElementById('pet-character');
    pet.className = animClass;
    setTimeout(() => { pet.className = 'anim-idle'; }, durationMs);
}

function doAction(action) {
    switch(action) {
        case 'makan':
            if (gameState.stats.hunger >= 100) return showThought("Aku masih kenyang!");
            gameState.stats.hunger = Math.min(100, gameState.stats.hunger + 25);
            addExp(15);
            setAnimation('anim-eat', 1200);
            showThought("Nyam nyam! Enak sekali.");
            break;
        case 'main':
            if (gameState.stats.energy < 20) return showThought("Aku lelah sekali...");
            gameState.stats.happiness = Math.min(100, gameState.stats.happiness + 20);
            gameState.stats.energy = Math.max(0, gameState.stats.energy - 15);
            gameState.stats.hunger = Math.max(0, gameState.stats.hunger - 10);
            addExp(20);
            setAnimation('anim-jump', 1000);
            showThought("Yeeey! Seru sekali!");
            break;
        case 'mandi':
            gameState.stats.hygiene = 100;
            addExp(10);
            setAnimation('anim-jump', 1500);
            showThought("Segar! Badanku jadi wangi.");
            break;
        case 'tidur':
            gameState.stats.energy = 100;
            gameState.stats.hunger = Math.max(0, gameState.stats.hunger - 10);
            setAnimation('anim-sleep', 4000);
            showThought("Zzz...");
            break;
    }
    updateUI();
    saveGame();
}

function showThought(text) {
    const bubble = document.getElementById('pet-thought-bubble');
    bubble.innerText = text;
    bubble.classList.remove('hidden');
    setTimeout(() => { bubble.classList.add('hidden'); }, 3000);
}

function addExp(amount) {
    gameState.exp += amount;
    if (gameState.exp >= gameState.maxExp) {
        gameState.level++;
        gameState.exp -= gameState.maxExp;
        gameState.maxExp = Math.floor(gameState.maxExp * 1.5);
        gameState.coins += 200;
        showThought(`Hore! Naik ke Level ${gameState.level}!`);
    }
}

// --- Shop & Inventory ---
function renderShop() {
    const grid = document.getElementById('shop-items');
    grid.innerHTML = '';
    shopItems.forEach(item => {
        grid.innerHTML += `
            <div class="item-card bounce-hover" onclick="buyItem('${item.id}')">
                <div class="item-icon">${item.icon}</div>
                <div class="item-name">${item.name}</div>
                <div class="item-price">🪙 ${item.price}</div>
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
        showThought(`Yeay, dapat ${item.name}!`);
    } else {
        alert('Koinmu tidak cukup!');
    }
}

function renderInventory() {
    const grid = document.getElementById('inventory-items');
    grid.innerHTML = '';
    if (gameState.inventory.length === 0) {
        grid.innerHTML = '<p style="grid-column: span 2; text-align:center; color:#888;">Tas kosong.</p>';
        return;
    }
    
    const counts = {};
    gameState.inventory.forEach(i => { counts[i.id] = (counts[i.id] || 0) + 1; });
    
    Object.keys(counts).forEach(id => {
        const item = shopItems.find(i => i.id === id);
        grid.innerHTML += `
            <div class="item-card bounce-hover" onclick="useItem('${id}')">
                <div class="item-icon">${item.icon}</div>
                <div class="item-name">${item.name} <br><span style="color:var(--primary-color)">x${counts[id]}</span></div>
                <div class="item-price" style="color:var(--info); font-size:0.8rem">Gunakan</div>
            </div>
        `;
    });
}

function useItem(id) {
    const index = gameState.inventory.findIndex(i => i.id === id);
    if (index > -1) {
        const item = gameState.inventory[index];
        gameState.inventory.splice(index, 1);
        
        if(item.effect.hunger) gameState.stats.hunger = Math.min(100, gameState.stats.hunger + item.effect.hunger);
        if(item.effect.happiness) gameState.stats.happiness = Math.min(100, gameState.stats.happiness + item.effect.happiness);
        if(item.effect.energy) gameState.stats.energy = Math.min(100, gameState.stats.energy + item.effect.energy);
        if(item.effect.hygiene) gameState.stats.hygiene = Math.min(100, gameState.stats.hygiene + item.effect.hygiene);
        
        setAnimation(item.type === 'food' || item.type === 'drink' ? 'anim-eat' : 'anim-jump', 1500);
        showThought(`Terima kasih atas ${item.name}-nya!`);
        
        updateUI();
        renderInventory();
        saveGame();
        
        // Tutup modal setelah menggunakan barang
        if(gameState.inventory.findIndex(i => i.id === id) === -1) {
            document.getElementById('inventory-modal').style.display = 'none';
        }
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
    
    appendChatBubble(message, 'user');
    input.value = '';
    
    await chatWithPet(message);
}

function appendChatBubble(text, sender) {
    const history = document.getElementById('chat-history');
    const bubbleClass = sender === 'user' ? 'user-msg' : 'pet-msg';
    
    const html = `<div class="chat-bubble ${bubbleClass}">${text}</div>`;
    history.insertAdjacentHTML('beforeend', html);
    history.scrollTop = history.scrollHeight;
}

async function chatWithPet(userMessage) {
    if (GEMINI_API_KEY === "ISI_API_KEY_ANDA_DISINI") {
        setTimeout(() => {
            appendChatBubble(`(Sistem): API Key belum disetel. Pesanmu: "${userMessage}"`, 'pet');
            setAnimation('anim-jump', 1000);
        }, 1000);
        return;
    }

    try {
        const systemPrompt = `Kamu adalah pet virtual bernama ${gameState.petName}. Pemilikmu bernama ${gameState.userName}. 
        Balas dengan sangat singkat (maksimal 1-2 kalimat pendek), lucu, hangat, menggunakan emoji. 
        Statusmu saat ini: Lapar ${Math.floor(gameState.stats.hunger)}%, Energi ${Math.floor(gameState.stats.energy)}%.`;

        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;
        
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ role: "user", parts: [{ text: systemPrompt + "\n\nPemilik: " + userMessage }] }]
            })
        });

        const data = await response.json();
        const aiResponse = data.candidates[0].content.parts[0].text;
        
        appendChatBubble(aiResponse, 'pet');
        setAnimation('anim-jump', 1000);
        
        gameState.stats.happiness = Math.min(100, gameState.stats.happiness + 5);
        updateUI();
        
    } catch (error) {
        console.error("Error AI Chat:", error);
        appendChatBubble("Koneksiku sedang buruk... 😿", 'pet');
    }
}
