/**
 * AUTONOMOUS SPRITE ENGINE
 * Menghubungkan taman CSS dengan Sprite Gambar Twidy
 */

const el = {
    sky: document.getElementById('sky-layer'),
    celestial: document.getElementById('celestial-body'),
    twidyContainer: document.getElementById('twidy-container'),
    twidySprite: document.getElementById('twidy-sprite'),
    bubble: document.getElementById('thought-bubble'),
    zzz: document.getElementById('zzz-fx'),
    particles: document.getElementById('particle-layer'),
    ui: document.getElementById('ui-layer')
};

const state = {
    posX: 50, // vw
    posY: 60, // vh
    isUserActive: true,
    idleTimeout: null,
    facing: 'right'
};

// Zona Lokasi di Taman
const zones = [
    { name: 'center', x: 50, y: 65, action: 'idle' },
    { name: 'pond', x: 20, y: 70, action: 'sit' },
    { name: 'flowers', x: 80, y: 70, action: 'sit' },
    { name: 'bench', x: 75, y: 55, action: 'sit' },
    { name: 'tree', x: 90, y: 60, action: 'sleep' }
];

window.onload = () => {
    updateEnvironment();
    setInterval(updateEnvironment, 60000);
    startLifeEngine();
    setupInteraction();
};

// --- ENVIRONMENT ---
function updateEnvironment() {
    const hour = new Date().getHours();
    let timeClass = '';
    
    el.particles.innerHTML = ''; 
    
    if (hour >= 6 && hour < 15) {
        timeClass = 'time-morning';
        el.celestial.className = 'is-sun';
        spawnParticles('butterfly', 3);
    } else if (hour >= 15 && hour < 18) {
        timeClass = 'time-afternoon';
        el.celestial.className = 'is-sun';
    } else {
        timeClass = 'time-night';
        el.celestial.className = 'is-moon';
        spawnParticles('firefly', 10);
    }
    el.sky.className = timeClass;
}

function spawnParticles(type, count) {
    for (let i = 0; i < count; i++) {
        const p = document.createElement('div');
        p.className = type;
        if(type === 'butterfly') p.innerText = Math.random() > 0.5 ? '🦋' : '🌸'; 
        p.style.left = `${Math.random() * 100}vw`;
        p.style.top = `${Math.random() * 80}vh`;
        p.style.animationDelay = `${Math.random() * 5}s`;
        el.particles.appendChild(p);
    }
}

// --- LIFE ENGINE ---
function startLifeEngine() {
    function loop() {
        if (!state.isUserActive || Math.random() > 0.4) {
            const hour = new Date().getHours();
            let possibleZones = [...zones];
            
            // Perbesar kemungkinan tidur di malam hari
            if (hour >= 21 || hour < 6) {
                possibleZones.push(zones.find(z => z.action === 'sleep'));
            }

            const target = possibleZones[Math.floor(Math.random() * possibleZones.length)];
            executeActivity(target);
        }
        
        if(Math.random() > 0.6) triggerRandomThought();
        
        setTimeout(loop, Math.random() * 8000 + 7000);
    }
    loop();
}

function executeActivity(target) {
    el.twidySprite.className = 'sprite-walk'; // Ganti kelas ke jalan
    el.zzz.classList.add('hidden'); // Matikan zzz
    
    walkTo(target.x, target.y, () => {
        // Setelah sampai, ganti animasi sesuai zona
        el.twidySprite.className = `sprite-${target.action}`;
        
        if(target.action === 'sleep') {
            el.zzz.classList.remove('hidden');
        } else if (target.action === 'sit') {
            if(Math.random() > 0.5) think("Tempat yang nyaman.");
        } else {
            if(Math.random() > 0.5) think("Taman ini tenang sekali.");
        }
    });
}

function walkTo(targetX, targetY, callback) {
    if (targetX !== state.posX) {
        flipSprite(targetX > state.posX ? 'right' : 'left');
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
    // Balik sprite
    el.twidySprite.style.transform = direction === 'left' ? 'scaleX(-1)' : 'scaleX(1)';
    // Jaga agar bubble tidak terbalik
    el.bubble.style.transform = direction === 'left' ? 'translateX(-50%) scaleX(-1)' : 'translateX(-50%) scaleX(1)';
    el.zzz.style.transform = direction === 'left' ? 'scaleX(-1)' : 'scaleX(1)';
}

// --- INTERACTION ---
function setupInteraction() {
    function resetIdle() {
        state.isUserActive = true;
        el.ui.style.opacity = '1';
        clearTimeout(state.idleTimeout);
        state.idleTimeout = setTimeout(() => {
            state.isUserActive = false;
            el.ui.style.opacity = '0';
        }, 4000);
    }
    document.addEventListener('touchstart', resetIdle);
    document.addEventListener('touchmove', resetIdle);
    resetIdle();
}

function pokeTwidy() {
    el.twidySprite.className = 'sprite-idle'; // Bangun
    el.zzz.classList.add('hidden');
    
    think("Hehe! 👋");
    
    // Lompat kecil
    el.twidyContainer.style.transitionDuration = '0.2s';
    el.twidyContainer.style.transform = `translate(${state.posX}vw, ${state.posY - 5}vh) scaleY(0.9)`;
    setTimeout(() => {
        el.twidyContainer.style.transform = `translate(${state.posX}vw, ${state.posY}vh) scaleY(1)`;
    }, 200);
    
    // Love Particle
    const heart = document.createElement('div');
    heart.innerText = '❤️';
    heart.style.position = 'absolute';
    heart.style.left = '50%';
    heart.style.top = '-20px';
    heart.style.fontSize = '1.5rem';
    heart.style.animation = 'floatUpHeart 1s forwards ease-out';
    el.twidyContainer.appendChild(heart);
    setTimeout(() => heart.remove(), 1000);
}

function feedTwidy() {
    el.twidySprite.className = 'sprite-idle';
    el.zzz.classList.add('hidden');
    
    think("Nyam nyam! Enak! 🍲");
    // Karena kita cuma pakai idle.png, kita mainkan CSS hopWalk sementara
    el.twidySprite.className = 'sprite-walk'; 
    setTimeout(() => el.twidySprite.className = 'sprite-idle', 1500);
}

function playTwidy() {
    el.twidySprite.className = 'sprite-walk';
    el.zzz.classList.add('hidden');
    
    think("Yaaay main! 🎾");
    // Lompat tinggi
    el.twidyContainer.style.transitionDuration = '0.4s';
    el.twidyContainer.style.transform = `translate(${state.posX}vw, ${state.posY - 15}vh)`;
    setTimeout(() => el.twidyContainer.style.transform = `translate(${state.posX}vw, ${state.posY}vh)`, 400);
    
    setTimeout(() => el.twidySprite.className = 'sprite-idle', 1000);
}

// --- THOUGHT BUBBLE ---
function think(text) {
    el.bubble.innerText = text;
    el.bubble.classList.remove('hidden');
    if(window.bubbleTimer) clearTimeout(window.bubbleTimer);
    window.bubbleTimer = setTimeout(() => {
        el.bubble.classList.add('hidden');
    }, 4000);
}

function triggerRandomThought() {
    if(!el.bubble.classList.contains('hidden')) return;
    const hour = new Date().getHours();
    const thoughts = ["Taman yang indah.", "Aku lapar...", "Hoooamm..."];
    if (hour < 11) thoughts.push("Selamat pagi! ☀️", "Ayo mulai hari ini.");
    else if (hour > 18) thoughts.push("Udah malam ya.", "Bintangnya indah.");
    think(thoughts[Math.floor(Math.random() * thoughts.length)]);
}

// --- CHAT MODAL ---
function openChat() {
    document.getElementById('chat-modal').classList.remove('hidden');
    if(!document.getElementById('chat-logs').innerHTML) {
        appendLog("Halo! Mau ngobrolin apa hari ini?", "twidy");
    }
}
function closeChat() { document.getElementById('chat-modal').classList.add('hidden'); }

function sendChat() {
    const input = document.getElementById('chat-input');
    const text = input.value.trim();
    if(!text) return;
    
    appendLog(text, "user");
    input.value = '';
    const typingId = appendLog("...", "twidy");
    
    // Backend Vercel Fetch Placeholder
    setTimeout(() => {
        document.getElementById(typingId).innerText = `(Terkoneksi ke Backend). Aku tangkap maksudmu: "${text}"`;
    }, 1000);
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
