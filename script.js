/**
 * COZY LIFE - Autonomous AI Engine
 * Simulasi perilaku otonom dengan pergerakan kamera dinamis.
 */

const el = {
    camera: document.getElementById('world-camera'),
    char: document.getElementById('character-container'),
    bubble: document.getElementById('thought-bubble'),
    ui: document.getElementById('ui-layer'),
    clock: document.getElementById('clock-display'),
    sky: document.getElementById('window-view'),
    
    // SVG Parts for expression
    eyeL: document.getElementById('eye-l'),
    eyeR: document.getElementById('eye-r'),
    mouth: document.getElementById('mouth'),
    blushL: document.getElementById('blush-l'),
    blushR: document.getElementById('blush-r'),
    book: document.getElementById('prop-book'),
    broom: document.getElementById('prop-broom')
};

// State Engine
const engine = {
    isUserActive: true,
    idleTimer: null,
    currentAction: 'idle',
    positionX: window.innerWidth / 2,
    roomWidth: window.innerWidth * 1.5,
    facing: 'right', // right or left
    
    // Zona di dalam ruangan (X coordinates relative to room)
    zones: {
        window: window.innerWidth * 0.15,
        center: window.innerWidth * 0.75,
        bookshelf: window.innerWidth * 1.2,
        bed: window.innerWidth * 1.35
    }
};

// Waktu dalam game (sinkron dengan dunia nyata)
function updateClock() {
    const now = new Date();
    const h = now.getHours().toString().padStart(2, '0');
    const m = now.getMinutes().toString().padStart(2, '0');
    el.clock.innerText = `${h}:${m}`;
    
    // Environment lighting
    if (now.getHours() >= 6 && now.getHours() < 15) el.sky.className = 'sky-morning';
    else if (now.getHours() >= 15 && now.getHours() < 18) el.sky.className = 'sky-afternoon';
    else el.sky.className = 'sky-night';
}
setInterval(updateClock, 60000);
updateClock();

// --- INACTIVITY & UI AUTO-HIDE ---
function resetIdleTimer() {
    engine.isUserActive = true;
    el.ui.classList.add('active');
    
    clearTimeout(engine.idleTimer);
    // Jika 5 detik tidak disentuh, sembunyikan UI dan biarkan pet hidup sendiri
    engine.idleTimer = setTimeout(() => {
        engine.isUserActive = false;
        el.ui.classList.remove('active');
    }, 5000);
}
window.addEventListener('touchstart', resetIdleTimer);
window.addEventListener('mousemove', resetIdleTimer);
resetIdleTimer();

// --- AUTONOMOUS BEHAVIOR ENGINE ---
// Menentukan apa yang dilakukan karakter saat dibiarkan
const behaviors = [
    { name: 'idle', weight: 30 },
    { name: 'walk_random', weight: 20 },
    { name: 'look_window', weight: 15 },
    { name: 'sweep', weight: 10 },
    { name: 'read_book', weight: 15 },
    { name: 'sleep', weight: 10 }
];

function pickBehavior() {
    // Jangan ubah aksi jika pengguna sedang aktif interaksi
    if (engine.isUserActive && Math.random() > 0.3) return;
    
    const hour = new Date().getHours();
    
    // Modifikasi bobot berdasarkan waktu
    let currentBehaviors = behaviors.map(b => ({...b}));
    if (hour >= 21 || hour < 6) {
        currentBehaviors.find(b => b.name === 'sleep').weight += 50;
    }
    if (hour >= 7 && hour <= 10) {
        currentBehaviors.find(b => b.name === 'sweep').weight += 20;
    }

    const totalWeight = currentBehaviors.reduce((acc, curr) => acc + curr.weight, 0);
    let randomNum = Math.random() * totalWeight;
    let selected = currentBehaviors[0].name;

    for (let b of currentBehaviors) {
        if (randomNum < b.weight) { selected = b.name; break; }
        randomNum -= b.weight;
    }
    
    executeBehavior(selected);
}

function executeBehavior(action) {
    // Reset all states
    el.char.className = '';
    engine.currentAction = action;
    setExpression('neutral');

    let targetX = engine.positionX;
    
    switch(action) {
        case 'idle':
            think("Anginnya sejuk...");
            break;
        case 'walk_random':
            targetX = Math.random() * (engine.roomWidth * 0.8) + (engine.roomWidth * 0.1);
            walkTo(targetX, () => {
                el.char.className = ''; // Stop walking
                think(Math.random() > 0.5 ? "Hmm..." : "Hari yang damai.");
            });
            break;
        case 'look_window':
            walkTo(engine.zones.window, () => {
                el.char.className = '';
                flipCharacter('left');
                think("Burung-burung pada kemana ya?");
            });
            break;
        case 'sweep':
            walkTo(engine.zones.center, () => {
                el.char.className = 'state-sweeping';
                think("Waktunya bersih-bersih karpet!");
            });
            break;
        case 'read_book':
            walkTo(engine.zones.bookshelf, () => {
                el.char.className = 'state-reading';
                setExpression('happy');
                // Subtle personalization reference woven naturally
                const thoughts = [
                    "Buku tentang kesehatan ini menarik juga...",
                    "Wah, cerita tentang perpustakaan keliling ini seru!",
                    "Cerita petualangan yang bagus."
                ];
                think(thoughts[Math.floor(Math.random() * thoughts.length)]);
            });
            break;
        case 'sleep':
            walkTo(engine.zones.bed, () => {
                el.char.className = 'state-sleeping';
                think("Zzz...");
            });
            break;
    }
}

// Loop kehidupan: berjalan setiap 8 - 15 detik
function lifeLoop() {
    setTimeout(() => {
        pickBehavior();
        lifeLoop();
    }, Math.random() * 7000 + 8000);
}
lifeLoop(); // Start Engine

// --- MOVEMENT & CAMERA TRACKING ---
function walkTo(targetX, callback) {
    if (Math.abs(targetX - engine.positionX) < 20) {
        if(callback) callback();
        return;
    }

    el.char.className = 'state-walking';
    flipCharacter(targetX > engine.positionX ? 'right' : 'left');
    
    // Calculate duration based on distance (constant speed)
    const distance = Math.abs(targetX - engine.positionX);
    const durationStr = (distance / 100).toFixed(1) + 's';
    el.char.style.transitionDuration = durationStr;
    el.char.style.transform = `translateX(${targetX}px)`;
    
    engine.positionX = targetX;
    
    // Panning Camera (bergerak berlawanan arah agar karakter tetap di layar)
    // Hitung posisi kamera ideal agar karakter berada sedikit di tengah
    const screenWidth = window.innerWidth;
    let cameraTarget = -(targetX - screenWidth / 2);
    
    // Batasi kamera agar tidak melewati batas ruangan
    cameraTarget = Math.min(0, Math.max(cameraTarget, -(engine.roomWidth - screenWidth)));
    
    el.camera.style.transitionDuration = durationStr;
    el.camera.style.transform = `translateX(${cameraTarget}px)`;

    // Wait for transition to finish
    setTimeout(() => {
        if(callback) callback();
    }, (distance / 100) * 1000);
}

function flipCharacter(direction) {
    engine.facing = direction;
    const svg = document.getElementById('pet-svg');
    if (direction === 'left') {
        svg.style.transform = 'scaleX(-1)';
        el.bubble.style.transform = 'scaleX(-1)'; // Fix bubble text flip
    } else {
        svg.style.transform = 'scaleX(1)';
        el.bubble.style.transform = 'scaleX(1)';
    }
}

// --- EXPRESSIONS ---
function setExpression(mood) {
    // Reset
    el.mouth.setAttribute('d', "M 94 122 Q 100 128, 106 122"); // Normal
    el.eyeL.setAttribute('d', "M 70 100 A 5 7 0 1 1 80 100 A 5 7 0 1 1 70 100");
    el.eyeR.setAttribute('d', "M 120 100 A 5 7 0 1 1 130 100 A 5 7 0 1 1 120 100");
    el.blushL.style.opacity = '0'; el.blushR.style.opacity = '0';
    
    const eyeHappy = "M 68 100 Q 75 92, 82 100";
    
    if (mood === 'happy') {
        el.eyeL.setAttribute('d', eyeHappy);
        el.eyeR.setAttribute('d', "M 118 100 Q 125 92, 132 100");
        el.mouth.setAttribute('d', "M 92 122 Q 100 135, 108 122");
    } else if (mood === 'blush') {
        el.eyeL.setAttribute('d', eyeHappy);
        el.eyeR.setAttribute('d', "M 118 100 Q 125 92, 132 100");
        el.blushL.style.opacity = '0.7'; el.blushR.style.opacity = '0.7';
    }
}

function think(text) {
    el.bubble.innerText = text;
    el.bubble.classList.remove('hidden');
    if(window.bubbleTimeout) clearTimeout(window.bubbleTimeout);
    window.bubbleTimeout = setTimeout(() => {
        el.bubble.classList.add('hidden');
    }, 4000);
}

// --- INTERACTION ---
function pokeCharacter() {
    el.char.className = ''; // Stop current action
    setExpression('blush');
    think("Hehe 😊");
    
    // Bounce animation via JS
    el.char.style.transitionDuration = '0.2s';
    el.char.style.transform = `translateX(${engine.positionX}px) scaleY(0.9) scaleX(1.05)`;
    setTimeout(() => {
        el.char.style.transform = `translateX(${engine.positionX}px) scaleY(1) scaleX(1)`;
        setTimeout(() => setExpression('neutral'), 1500);
    }, 200);
}

function interact(type) {
    el.char.className = '';
    if (type === 'feed') {
        setExpression('happy');
        think("Nyam! Terima kasih makanannya!");
    } else if (type === 'play') {
        setExpression('happy');
        think("Yay! Bermain!");
        // Lompat
        el.char.style.transitionDuration = '0.3s';
        el.char.style.transform = `translateX(${engine.positionX}px) translateY(-50px)`;
        setTimeout(() => el.char.style.transform = `translateX(${engine.positionX}px) translateY(0)`, 300);
    }
}

// --- PARTICLES ---
function initDust() {
    const container = document.getElementById('dust-motes');
    for(let i=0; i<30; i++) {
        const mote = document.createElement('div');
        mote.className = 'mote';
        mote.style.left = `${Math.random() * 100}%`;
        mote.style.top = `${Math.random() * 100}%`;
        mote.style.animationDelay = `${Math.random() * 10}s`;
        mote.style.animationDuration = `${Math.random() * 10 + 10}s`;
        container.appendChild(mote);
    }
}
initDust();

// --- CHAT MODAL (Simulated Backend) ---
function openChat() {
    document.getElementById('chat-modal').classList.remove('hidden');
}
function closeChat() {
    document.getElementById('chat-modal').classList.add('hidden');
}
function sendChat() {
    const input = document.getElementById('chat-input');
    const logs = document.getElementById('chat-logs');
    const text = input.value.trim();
    if(!text) return;
    
    logs.innerHTML += `<div class="chat-bubble-msg msg-user">${text}</div>`;
    input.value = '';
    
    // Simulate thinking/backend call
    setTimeout(() => {
        const responses = ["Aku setuju!", "Masa sih?", "Hehe, kamu lucu.", "Wah, menarik banget!"];
        const reply = responses[Math.floor(Math.random() * responses.length)];
        logs.innerHTML += `<div class="chat-bubble-msg msg-pet">${reply}</div>`;
        logs.scrollTop = logs.scrollHeight;
    }, 1000);
}
