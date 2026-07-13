/**
 * VIRTUAL PET AI - Life Simulation Engine
 * Framework-less, Mobile-First.
 */

// --- STATE MANAGEMENT ---
const DEFAULT_STATE = {
    player: { name: "" },
    pet: { name: "", level: 1, exp: 0, coins: 50 },
    stats: { hunger: 80, energy: 80, happy: 80 },
    memory: {
        favoriteFood: "belum tahu",
        hobbies: "belum tahu",
        pastStories: []
    },
    lastOnline: Date.now()
};

let state = { ...DEFAULT_STATE };
let lifeLoopId, thoughtLoopId, weatherLoopId;
let currentMood = "happy"; // happy, sad, angry, sleepy, hungry, excited

// --- DOM ELEMENTS (Cached) ---
const el = {
    egg: document.getElementById('egg-container'),
    bubble: document.getElementById('pet-bubble'),
    petWrapper: document.getElementById('pet-wrapper'),
    mouth: document.getElementById('mouth'),
    tongue: document.getElementById('tongue'),
    eyesGroup: document.getElementById('eyes-group'),
    eyeL: document.getElementById('eye-l'),
    eyeR: document.getElementById('eye-r'),
    blushL: document.getElementById('blush-l'),
    blushR: document.getElementById('blush-r'),
    tearL: document.getElementById('tear-l'),
    tearR: document.getElementById('tear-r'),
    zzz: document.getElementById('zzz-text'),
    chatLogs: document.getElementById('chat-logs'),
    chatInput: document.getElementById('chat-input')
};

// --- INITIALIZATION ---
window.onload = () => {
    const saved = localStorage.getItem('vPet_v3');
    if (saved) {
        state = JSON.parse(saved);
        calculateOfflineTime();
        startGame();
    } else {
        // Show Onboarding
        setTimeout(() => {
            document.getElementById('ob-splash').classList.remove('active');
            document.getElementById('ob-egg').classList.add('active');
        }, 2500);
    }
};

function saveGame() {
    state.lastOnline = Date.now();
    localStorage.setItem('vPet_v3', JSON.stringify(state));
}

function calculateOfflineTime() {
    const diffHours = (Date.now() - state.lastOnline) / (1000 * 60 * 60);
    if (diffHours > 0.1) {
        state.stats.hunger = Math.max(0, state.stats.hunger - (diffHours * 8));
        state.stats.energy = Math.max(0, state.stats.energy - (diffHours * 4));
        state.stats.happy = Math.max(0, state.stats.happy - (diffHours * 6));
    }
}

// --- ONBOARDING LOGIC ---
let eggTaps = 0;
function interactEgg() {
    eggTaps++;
    playSound('hatch');
    el.egg.querySelector('.egg-svg').classList.remove('shake');
    void el.egg.offsetWidth; // trigger reflow
    el.egg.querySelector('.egg-svg').classList.add('shake');
    
    // Spawn heart particle
    spawnParticle(el.egg, '✨');

    if (eggTaps === 3) document.getElementById('egg-crack-1').classList.remove('hidden');
    if (eggTaps === 6) document.getElementById('egg-crack-2').classList.remove('hidden');
    if (eggTaps >= 8) {
        playSound('pop');
        document.getElementById('ob-egg').classList.remove('active');
        document.getElementById('ob-form').classList.add('active');
    }
}

function completeOnboarding() {
    const pName = document.getElementById('input-username').value.trim() || 'Twidy'; // Default fallback based on prompt info
    const petName = document.getElementById('input-petname').value.trim() || 'Mochi';
    
    state.player.name = pName;
    state.pet.name = petName;
    
    document.getElementById('onboarding-screen').style.display = 'none';
    startGame();
}

function startGame() {
    document.getElementById('game-container').classList.remove('hidden');
    updateHUD();
    updateEnvironment();
    
    // Start Engine
    lifeLoopId = setInterval(lifeEngineTick, 15000); // Stat decay every 15s
    thoughtLoopId = setInterval(triggerRandomThought, 45000); // Random thoughts ~45s
    weatherLoopId = setInterval(updateEnvironment, 60000); // Env check 1m
    
    startIdleAnimations();
    evaluateMood();
}

// --- LIFE ENGINE (The Soul) ---
// Sistem yang membuat karakter bergerak secara acak walaupun tidak disentuh
function startIdleAnimations() {
    const behaviors = ['blink', 'lookLeft', 'lookRight', 'earTwitch', 'tailWag', 'yawn'];
    
    function scheduleNextIdle() {
        // Random interval antara 2 - 6 detik
        const nextTime = Math.random() * 4000 + 2000;
        setTimeout(() => {
            if (currentMood !== 'sleepy') {
                const action = behaviors[Math.floor(Math.random() * behaviors.length)];
                executeIdleAction(action);
            } else {
                executeIdleAction('blink'); // Kalau ngantuk cuma kedip
            }
            scheduleNextIdle();
        }, nextTime);
    }
    scheduleNextIdle();
}

function executeIdleAction(action) {
    const wrapper = el.petWrapper;
    switch(action) {
        case 'blink':
            wrapper.classList.add('anim-blink');
            setTimeout(() => wrapper.classList.remove('anim-blink'), 150);
            break;
        case 'lookLeft':
            wrapper.classList.add('anim-look-l');
            setTimeout(() => wrapper.classList.remove('anim-look-l'), 1000);
            break;
        case 'lookRight':
            wrapper.classList.add('anim-look-r');
            setTimeout(() => wrapper.classList.remove('anim-look-r'), 1000);
            break;
        case 'earTwitch':
            const isLeft = Math.random() > 0.5;
            wrapper.classList.add(isLeft ? 'anim-ear-l' : 'anim-ear-r');
            setTimeout(() => wrapper.classList.remove(isLeft ? 'anim-ear-l' : 'anim-ear-r'), 300);
            break;
        case 'yawn':
            setExpression('excited'); // Mulut terbuka
            setTimeout(() => evaluateMood(), 1000);
            break;
    }
}

function lifeEngineTick() {
    // Stat decay
    state.stats.hunger = Math.max(0, state.stats.hunger - 1.5);
    state.stats.energy = Math.max(0, state.stats.energy - 0.8);
    state.stats.happy = Math.max(0, state.stats.happy - 1.2);
    
    evaluateMood();
    updateHUD();
    saveGame();
}

// --- EMOTION & EXPRESSION SYSTEM ---
function evaluateMood() {
    if (state.stats.energy < 20) currentMood = "sleepy";
    else if (state.stats.hunger < 25) currentMood = "hungry";
    else if (state.stats.happy < 30) currentMood = "sad";
    else if (state.stats.happy > 80) currentMood = "happy";
    else currentMood = "neutral";

    applyExpressionVisuals(currentMood);
}

function setExpression(moodOverride) {
    applyExpressionVisuals(moodOverride);
}

function applyExpressionVisuals(mood) {
    // Reset all
    el.tongue.style.opacity = '0';
    el.blushL.style.opacity = '0'; el.blushR.style.opacity = '0';
    el.tearL.style.opacity = '0'; el.tearR.style.opacity = '0';
    el.zzz.style.opacity = '0';
    
    const eyeNormal = "M 68 95 A 6 8 0 1 1 80 95 A 6 8 0 1 1 68 95";
    const eyeNormalR = "M 120 95 A 6 8 0 1 1 132 95 A 6 8 0 1 1 120 95";
    const eyeHappy = "M 65 95 Q 74 85, 83 95"; // ^
    const eyeHappyR = "M 117 95 Q 126 85, 135 95";
    const eyeSad = "M 65 92 Q 74 90, 83 98"; // \
    const eyeSadR = "M 117 98 Q 126 90, 135 92";
    
    switch(mood) {
        case 'happy':
            el.mouth.setAttribute('d', "M 92 122 Q 100 135, 108 122"); // Big smile
            el.eyeL.setAttribute('d', eyeNormal); el.eyeR.setAttribute('d', eyeNormalR);
            break;
        case 'excited':
            el.mouth.setAttribute('d', "M 92 120 Q 100 140, 108 120 Z"); // Open mouth
            el.mouth.setAttribute('fill', '#264653');
            el.tongue.style.opacity = '1';
            el.eyeL.setAttribute('d', eyeHappy); el.eyeR.setAttribute('d', eyeHappyR);
            el.blushL.style.opacity = '0.6'; el.blushR.style.opacity = '0.6';
            break;
        case 'sad':
            el.mouth.setAttribute('d', "M 92 125 Q 100 118, 108 125"); // Frown
            el.eyeL.setAttribute('d', eyeSad); el.eyeR.setAttribute('d', eyeSadR);
            break;
        case 'hungry':
            el.mouth.setAttribute('d', "M 92 123 Q 100 120, 108 123"); // Straight line
            el.eyeL.setAttribute('d', eyeNormal); el.eyeR.setAttribute('d', eyeNormalR);
            el.tearL.style.opacity = '1'; // Drool effect repurpose
            break;
        case 'sleepy':
            el.mouth.setAttribute('d', "M 95 123 Q 100 123, 105 123"); // Tiny line
            el.eyeL.setAttribute('d', eyeHappy); el.eyeR.setAttribute('d', eyeHappyR); // Closed eyes
            el.zzz.style.opacity = '1';
            break;
        case 'blush': // Interaction override
            el.mouth.setAttribute('d', "M 92 122 Q 100 130, 108 122");
            el.eyeL.setAttribute('d', eyeHappy); el.eyeR.setAttribute('d', eyeHappyR);
            el.blushL.style.opacity = '1'; el.blushR.style.opacity = '1';
            break;
        default:
            el.mouth.setAttribute('fill', 'none');
            el.mouth.setAttribute('d', "M 92 122 Q 100 128, 108 122");
            el.eyeL.setAttribute('d', eyeNormal); el.eyeR.setAttribute('d', eyeNormalR);
    }
}

// --- INTERACTION SYSTEM ---
function handlePetTouch(e) {
    // Berikan reaksi saat disentuh
    playSound('happy');
    setExpression('blush');
    el.petWrapper.classList.add('anim-bounce');
    
    // Spawn hearts at touch point relative to SVG
    spawnParticle(el.petWrapper, '❤️', -50);
    
    state.stats.happy = Math.min(100, state.stats.happy + 5);
    updateHUD();
    
    // Bubble response
    showBubble("Hehe 😊");
    
    setTimeout(() => {
        el.petWrapper.classList.remove('anim-bounce');
        evaluateMood();
    }, 1500);
}

function spawnParticle(parent, char, yOffset = 0) {
    const p = document.createElement('div');
    p.classList.add('heart-particle');
    p.innerText = char;
    p.style.left = `50%`;
    p.style.top = `${20 + yOffset}%`;
    parent.appendChild(p);
    setTimeout(() => p.remove(), 1000);
}

// --- ACTIONS ---
function triggerAction(type) {
    switch(type) {
        case 'feed':
            if (state.stats.hunger >= 95) return showBubble("Masih kenyang nih!");
            state.stats.hunger = Math.min(100, state.stats.hunger + 30);
            setExpression('excited');
            playSound('eat');
            showBubble("Nyam nyam! Enak~ 🍖");
            el.petWrapper.classList.add('anim-bounce');
            setTimeout(() => el.petWrapper.classList.remove('anim-bounce'), 600);
            break;
        case 'play':
            if (state.stats.energy < 30) return showBubble("Aku capek, mau istirahat dulu...");
            state.stats.happy = Math.min(100, state.stats.happy + 25);
            state.stats.energy -= 15;
            state.stats.hunger -= 10;
            setExpression('excited');
            playSound('happy');
            el.petWrapper.classList.add('anim-jump');
            showBubble("Yeeeeay! Seru!! 🎾");
            setTimeout(() => el.petWrapper.classList.remove('anim-jump'), 500);
            break;
        case 'clean':
            state.stats.happy = Math.min(100, state.stats.happy + 10);
            setExpression('happy');
            showBubble("Seger banget mandinya! 🧼");
            break;
        case 'sleep':
            state.stats.energy = 100;
            state.stats.hunger -= 15;
            currentMood = 'sleepy';
            applyExpressionVisuals('sleepy');
            showBubble("Zzz... mimpi indah... 🌙");
            break;
    }
    evaluateMood();
    updateHUD();
    saveGame();
}

// --- THOUGHT BUBBLE SYSTEM ---
const thoughtDict = {
    happy: ["Aku senang kamu ada di sini!", "Hari ini indah ya?", "Hehe, moodku lagi bagus~", "Kamu udah makan?"],
    sad: ["Aku kesepian...", "Peluk dong...", "Jangan tinggalin aku lama-lama ya."],
    hungry: ["Perutku bunyi nih...", "Ada makanan nggak?", "Lapeeeer 😫", "Pengen makan sosis..."],
    sleepy: ["Hoaaam...", "Ngantuk berat...", "Mataku berat banget..."],
    neutral: ["Lagi ngapain?", "Hmm...", "Aku suka merhatiin debu terbang."]
};

function triggerRandomThought() {
    // 30% chance to not say anything this tick to feel more natural
    if (Math.random() < 0.3) return; 
    
    const thoughts = thoughtDict[currentMood] || thoughtDict['neutral'];
    const randomText = thoughts[Math.floor(Math.random() * thoughts.length)];
    showBubble(randomText);
}

function showBubble(text) {
    el.bubble.innerText = text;
    el.bubble.classList.remove('hidden');
    
    // Clear old timeout to prevent overlapping hides
    if(window.bubbleTimeout) clearTimeout(window.bubbleTimeout);
    
    window.bubbleTimeout = setTimeout(() => {
        el.bubble.classList.add('hidden');
    }, 4000);
}

// --- ENVIRONMENT SYSTEM ---
function updateEnvironment() {
    const hour = new Date().getHours();
    const sky = document.getElementById('sky');
    const celestial = document.getElementById('celestial');
    const light = document.getElementById('night-light');
    const weatherLayer = document.getElementById('weather-layer');
    
    weatherLayer.innerHTML = ''; // Reset weather
    
    if (hour >= 6 && hour < 17) {
        sky.className = 'sky-day';
        celestial.className = 'sun';
        light.style.opacity = '0';
        
        // Random Day Weather (15% Rain)
        if (Math.random() < 0.15) {
            sky.className = 'sky-rain';
            createWeather(weatherLayer, 'rain-drop', 40);
        }
    } else if (hour >= 17 && hour < 19) {
        sky.className = 'sky-sunset';
        celestial.className = 'sun';
        light.style.opacity = '0.5';
    } else {
        sky.className = 'sky-night';
        celestial.className = 'moon';
        light.style.opacity = '1';
        
        // Random Night Weather (10% Snow)
        if (Math.random() < 0.10) {
            createWeather(weatherLayer, 'snow-flake', 30);
        }
    }
}

function createWeather(container, className, count) {
    for (let i = 0; i < count; i++) {
        const drop = document.createElement('div');
        drop.className = className;
        drop.style.left = `${Math.random() * 100}%`;
        drop.style.animationDuration = `${Math.random() * 0.5 + 0.5}s`;
        drop.style.animationDelay = `${Math.random() * 2}s`;
        container.appendChild(drop);
    }
}

// --- UI UPDATER ---
function updateHUD() {
    document.getElementById('hud-player').innerText = state.player.name;
    document.getElementById('hud-pet').innerText = state.pet.name;
    document.getElementById('hud-initial').innerText = state.player.name.charAt(0).toUpperCase();
    document.getElementById('val-level').innerText = state.pet.level;
    document.getElementById('val-coin').innerText = state.pet.coins;
    
    // Update SVG Rings based on percentage
    updateRing('stat-hunger', state.stats.hunger);
    updateRing('stat-energy', state.stats.energy);
    updateRing('stat-happy', state.stats.happy);
}

function updateRing(id, value) {
    const el = document.getElementById(id);
    if(!el) return;
    const ring = el.querySelector('.ring');
    // Simple visual color feedback based on stat
    let color = "var(--c-primary)";
    if (value < 30) color = "#e63946"; // Red warning
    ring.style.borderTopColor = color;
    ring.style.borderRightColor = color;
    
    // Note: A true SVG circular progress bar would be better, but border-rotation is a lightweight CSS hack. 
    // Opacity pulse on low
    if (value < 20) el.style.animation = "pulse 1s infinite alternate";
    else el.style.animation = "none";
}

// --- AUDIO SYSTEM ---
function playSound(type) {
    const audioEl = document.getElementById(`sfx-${type}`);
    if (audioEl && audioEl.src) { // Check if source is actually loaded
        audioEl.currentTime = 0;
        audioEl.play().catch(e => console.log("Audio play prevented by browser policy"));
    }
}

// --- API INTEGRATION (SECURE BACKEND CALL) ---
function openChat() {
    document.getElementById('chat-modal').classList.remove('hidden');
    // Initial greeting if empty
    if(el.chatLogs.innerHTML === '') {
        appendLog(`Halo ${state.player.name}! Mau ngobrolin apa nih?`, 'pet');
    }
}

function closeChat() {
    document.getElementById('chat-modal').classList.add('hidden');
}

function handleEnter(e) {
    if(e.key === 'Enter') sendMessage();
}

async function sendMessage() {
    const text = el.chatInput.value.trim();
    if(!text) return;
    
    appendLog(text, 'user');
    el.chatInput.value = '';
    
    // Simulate thinking
    const typingId = appendLog('...', 'pet');
    
    try {
        // CONTOH PEMANGGILAN BACKEND VERCEL SERVERLESS
        // Endpoint ini yang akan memiliki akses ke process.env.GEMINI_API_KEY
        // Frontend mengirimkan konteks Memory Object
        
        /* const response = await fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                message: text,
                context: {
                    petName: state.pet.name,
                    playerName: state.player.name,
                    mood: currentMood,
                    memory: state.memory
                }
            })
        });
        const data = await response.json();
        const aiResponse = data.reply;
        */
        
        // --- SIMULASI KARENA TIDAK ADA BACKEND SAAT INI ---
        setTimeout(() => {
            document.getElementById(typingId).remove();
            
            // Extract Memory mock (Very basic keyword learning)
            if(text.toLowerCase().includes("suka makan")) {
                state.memory.favoriteFood = text.split("makan")[1].trim();
                saveGame();
                appendLog(`Wah, aku catat ya! Kamu suka makan ${state.memory.favoriteFood}.`, 'pet');
            } else {
                appendLog(`(Terkoneksi ke Backend). Sistem menangkap: "${text}". Memory fav foodmu: ${state.memory.favoriteFood}`, 'pet');
            }
            
            // React visually
            setExpression('excited');
            el.petWrapper.classList.add('anim-jump');
            setTimeout(() => {
                el.petWrapper.classList.remove('anim-jump');
                evaluateMood();
            }, 1000);
            
        }, 1500);

    } catch (error) {
        document.getElementById(typingId).innerText = "Maaf, koneksiku ke server sedang terputus... 😿";
    }
}

function appendLog(text, sender) {
    const id = `msg-${Date.now()}`;
    const div = document.createElement('div');
    div.id = id;
    div.className = `log-bubble ${sender === 'user' ? 'log-user' : 'log-pet'}`;
    div.innerText = text;
    el.chatLogs.appendChild(div);
    el.chatLogs.scrollTop = el.chatLogs.scrollHeight;
    return id;
}
