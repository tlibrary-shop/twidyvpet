/**
 * SPRITE-BASED LIFE ENGINE
 * Sempurna untuk memuat aset ilustrasi asli.
 */

const el = {
    sky: document.getElementById('sky-layer'),
    celestial: document.getElementById('celestial'),
    twidyContainer: document.getElementById('twidy-container'),
    twidySprite: document.getElementById('twidy-sprite'),
    bubble: document.getElementById('thought-bubble'),
    particles: document.getElementById('particle-layer'),
    ui: document.getElementById('ui-layer')
};

const state = {
    posX: 50,
    posY: 60,
    facing: 'right',
    isUserActive: true,
    idleTimeout: null
};

// Titik lokasi (X, Y) dalam viewport (vw, vh)
const hotspots = [
    { name: 'center', x: 50, y: 65, sprite: 'sprite-idle', thought: "Taman yang damai..." },
    { name: 'pond', x: 25, y: 70, sprite: 'sprite-idle', thought: "Airnya tenang sekali." },
    { name: 'flowers', x: 80, y: 60, sprite: 'sprite-sit', thought: "Wanginya enak~ 🌸" },
    { name: 'lamp', x: 75, y: 55, sprite: 'sprite-sit', thought: "Aku suka duduk di sini." }
];

window.onload = () => {
    updateEnvironment();
    setInterval(updateEnvironment, 60000);
    startLifeEngine();
    setupInteraction();
};

// --- ENVIRONMENT & LIGHTING ---
function updateEnvironment() {
    const hour = new Date().getHours();
    let timeClass = '';
    
    el.particles.innerHTML = ''; 
    
    if (hour >= 6 && hour < 16) {
        timeClass = 'sky-day';
        el.celestial.className = 'is-sun';
    } else if (hour >= 16 && hour < 18) {
        timeClass = 'sky-evening';
        el.celestial.className = 'is-sun';
    } else {
        timeClass = 'sky-night';
        el.celestial.className = 'is-moon';
        for(let i=0; i<15; i++) {
            const firefly = document.createElement('div');
            firefly.className = 'firefly';
            firefly.style.left = `${Math.random() * 100}vw`;
            firefly.style.top = `${Math.random() * 80}vh`;
            firefly.style.animationDelay = `${Math.random() * 5}s`;
            el.particles.appendChild(firefly);
        }
    }
    el.sky.className = timeClass;
}

// --- SPRITE ANIMATION ENGINE ---
function startLifeEngine() {
    function loop() {
        if (!state.isUserActive || Math.random() > 0.4) {
            const target = hotspots[Math.floor(Math.random() * hotspots.length)];
            
            // Logika Tidur Malam
            const hour = new Date().getHours();
            if ((hour >= 22 || hour < 6) && Math.random() > 0.3) {
                target.sprite = 'sprite-sleep';
                target.thought = "Zzz... 🌙";
            }
            
            executeActivity(target);
        } else if (Math.random() > 0.7) {
            triggerRandomThought();
        }
        
        setTimeout(loop, Math.random() * 8000 + 7000);
    }
    loop();
}

function executeActivity(target) {
    // 1. Ubah sprite menjadi jalan
    changeSprite('sprite-walk');
    
    walkTo(target.x, target.y, () => {
        // 2. Saat sampai, ubah sprite sesuai aktivitas
        changeSprite(target.sprite);
        if(Math.random() > 0.4) think(target.thought);
    });
}

function changeSprite(spriteClass) {
    el.twidySprite.className = spriteClass;
}

function walkTo(targetX, targetY, callback) {
    const currentX = state.posX;
    if (targetX !== currentX) {
        flipSprite(targetX > currentX ? 'right' : 'left');
    }
    
    const dist = Math.sqrt(Math.pow(targetX - state.posX, 2) + Math.pow(targetY - state.posY, 2));
    const duration = dist * 0.08; 
    
    el.twidyContainer.style.transitionDuration = `${duration}s`;
    el.twidyContainer.style.transform = `translate(${targetX}vw, ${targetY}vh)`;
    
    state.posX = targetX;
    state.posY = targetY;
    
    setTimeout(() => { if(callback) callback(); }, duration * 1000);
}

function flipSprite(direction) {
    state.facing = direction;
    el.twidySprite.style.transform = direction === 'left' ? 'scaleX(-1)' : 'scaleX(1)';
    // Pastikan bubble tidak ikut terbalik
    el.bubble.style.transform = direction === 'left' ? 'translateX(-50%) scaleX(-1)' : 'translateX(-50%) scaleX(1)';
}

// --- INTERACTION & UI HIDE ---
function setupInteraction() {
    function resetIdle() {
        state.isUserActive = true;
        el.ui.style.opacity = '1';
        clearTimeout(state.idleTimeout);
        state.idleTimeout = setTimeout(() => {
            state.isUserActive = false;
            el.ui.style.opacity = '0';
        }, 5000);
    }
    document.addEventListener('touchstart', resetIdle);
    document.addEventListener('touchmove', resetIdle);
    resetIdle();
    
    // Dragging Karakter
    let startX = 0;
    el.twidyContainer.addEventListener('touchstart', e => startX = e.touches[0].clientX);
    el.twidyContainer.addEventListener('touchmove', e => {
        const moveX = e.touches[0].clientX;
        if(Math.abs(moveX - startX) > 20) {
            flipSprite(moveX > startX ? 'right' : 'left');
            changeSprite('sprite-walk');
        }
    });
    el.twidyContainer.addEventListener('touchend', () => changeSprite('sprite-idle'));
}

function pokeTwidy() {
    changeSprite('sprite-idle'); // Reset ke idle saat disentuh
    
    // Efek loncat ringan
    el.twidyContainer.style.transitionDuration = '0.2s';
    el.twidyContainer.style.transform = `translate(${state.posX}vw, ${state.posY - 5}vh) scaleY(0.9)`;
    setTimeout(() => {
        el.twidyContainer.style.transform = `translate(${state.posX}vw, ${state.posY}vh) scaleY(1)`;
    }, 200);
    
    think("Hehe! 😊");
    
    // Spawn Heart
    const heart = document.createElement('div');
    heart.innerText = '❤️';
    heart.style.position = 'absolute';
    heart.style.left = '50%';
    heart.style.top = '-20px';
    heart.style.fontSize = '1.5rem';
    heart.style.animation = 'floatUp 1s ease-out forwards';
    el.twidyContainer.appendChild(heart);
    setTimeout(() => heart.remove(), 1000);
}

// --- THOUGHT BUBBLE ---
function think(text) {
    el.bubble.innerText = text;
    el.bubble.classList.remove('hidden');
    if(window.bubbleTimer) clearTimeout(window.bubbleTimer);
    window.bubbleTimer = setTimeout(() => el.bubble.classList.add('hidden'), 4000);
}

function triggerRandomThought() {
    const hour = new Date().getHours();
    const thoughts = ["Aku senang di sini.", "Mau main?", "Taman yang indah.", "Aku lapar...", "Hoooamm..."];
    if (hour < 11) thoughts.push("Selamat pagi! ☀️");
    if (hour > 18) thoughts.push("Udah malam ya.");
    think(thoughts[Math.floor(Math.random() * thoughts.length)]);
}

// --- ACTIONS ---
function triggerAction(action) {
    if(action === 'feed') {
        changeSprite('sprite-eat');
        think("Nyam nyam! Enak! 🍲");
    } else if (action === 'play') {
        changeSprite('sprite-walk');
        think("Yaaay! 🎾");
        // Lompat tinggi
        el.twidyContainer.style.transitionDuration = '0.4s';
        el.twidyContainer.style.transform = `translate(${state.posX}vw, ${state.posY - 15}vh)`;
        setTimeout(() => el.twidyContainer.style.transform = `translate(${state.posX}vw, ${state.posY}vh)`, 400);
    }
    setTimeout(() => changeSprite('sprite-idle'), 3000);
}

// --- SECURE CHAT INTEGRATION ---
function openChat() {
    document.getElementById('chat-modal').classList.remove('hidden');
    if(!document.getElementById('chat-logs').innerHTML) {
        appendLog("Hai! Senang kamu mampir. Mau ngobrolin apa?", "twidy");
    }
}
function closeChat() { document.getElementById('chat-modal').classList.add('hidden'); }

async function sendChat() {
    const input = document.getElementById('chat-input');
    const text = input.value.trim();
    if(!text) return;
    
    appendLog(text, "user");
    input.value = '';
    const typingId = appendLog("...", "twidy");
    
    try {
        /*
        ========================================================================
        INI ADALAH STRUKTUR FETCH KE BACKEND VERCEL ANDA.
        API KEY SAMA SEKALI TIDAK ADA DI SINI.
        ========================================================================
        
        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: text })
        });
        const data = await response.json();
        
        document.getElementById(typingId).innerText = data.reply;
        */
       
        // Fallback simulasi
        setTimeout(() => {
            document.getElementById(typingId).innerText = `(Mock Backend): Aku dengar kamu bilang "${text}".`;
        }, 1000);
        
    } catch(e) {
        document.getElementById(typingId).innerText = "Koneksi ke server terputus... 😿";
    }
}

function appendLog(text, sender) {
    const logs = document.getElementById('chat-logs');
    const id = `msg-${Date.now()}`;
    const div = document.createElement('div');
    div.id = id;
    div.className = `msg msg-${sender}`;
    div.innerText = text;
    logs.appendChild(div);
    logs.scrollTop = logs.scrollHeight;
    return id;
}

// Tambahkan CSS Keyframe untuk partikel hati di runtime
const style = document.createElement('style');
style.innerHTML = `@keyframes floatUp { 0% { transform: translate(-50%, 0) scale(0.5); opacity: 1; } 100% { transform: translate(-50%, -50px) scale(1.5); opacity: 0; } }`;
document.head.appendChild(style);
