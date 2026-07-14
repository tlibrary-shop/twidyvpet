/**
 * AUTONOMOUS SPRITE ENGINE (PC & Mobile Friendly)
 * UI tidak lagi menghilang otomatis.
 */

const el = {
    sky: document.getElementById('sky-layer'),
    celestial: document.getElementById('celestial-body'),
    twidyContainer: document.getElementById('twidy-container'),
    twidySprite: document.getElementById('twidy-sprite'),
    bubble: document.getElementById('thought-bubble'),
    zzz: document.getElementById('zzz-fx'),
    particles: document.getElementById('particle-layer')
};

const state = {
    posX: 50,
    posY: 60,
    facing: 'right',
    isActionLocked: false // Mengunci aktivitas otonom saat pengguna menekan tombol
};

const zones = [
    { name: 'center', x: 50, y: 65, action: 'idle' },
    { name: 'pond', x: 20, y: 70, action: 'sit' },
    { name: 'flowers', x: 80, y: 70, action: 'sit' },
    { name: 'bench', x: 75, y: 55, action: 'sit' },
    { name: 'lamp', x: 90, y: 55, action: 'idle' }
];

window.onload = () => {
    updateEnvironment();
    setInterval(updateEnvironment, 60000);
    startLifeEngine();
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
        if (!state.isActionLocked && Math.random() > 0.4) {
            const hour = new Date().getHours();
            let possibleZones = [...zones];
            
            if (hour >= 21 || hour < 6) {
                possibleZones.push({ name: 'sleep', x: 50, y: 60, action: 'sleep' });
            }

            const target = possibleZones[Math.floor(Math.random() * possibleZones.length)];
            executeActivity(target);
        }
        
        if(!state.isActionLocked && Math.random() > 0.6) triggerRandomThought();
        
        setTimeout(loop, Math.random() * 8000 + 7000);
    }
    loop();
}

function executeActivity(target) {
    el.twidySprite.className = 'sprite-walk'; 
    el.zzz.classList.add('hidden'); 
    
    walkTo(target.x, target.y, () => {
        el.twidySprite.className = `sprite-${target.action}`;
        
        if(target.action === 'sleep') {
            el.zzz.classList.remove('hidden');
        } else if (target.action === 'sit') {
            if(Math.random() > 0.5) think("Tempat yang nyaman.");
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
    el.twidySprite.style.transform = direction === 'left' ? 'scaleX(-1)' : 'scaleX(1)';
    el.bubble.style.transform = direction === 'left' ? 'translateX(-50%) scaleX(-1)' : 'translateX(-50%) scaleX(1)';
    el.zzz.style.transform = direction === 'left' ? 'scaleX(-1)' : 'scaleX(1)';
}

// --- INTERACTION ---
// Drag functionality for character
let startX = 0;
el.twidyContainer.addEventListener('mousedown', e => startX = e.clientX);
el.twidyContainer.addEventListener('mousemove', e => {
    if (startX !== 0 && Math.abs(e.clientX - startX) > 20) {
        flipSprite(e.clientX > startX ? 'right' : 'left');
        el.twidySprite.className = 'sprite-walk';
    }
});
el.twidyContainer.addEventListener('mouseup', () => { startX = 0; el.twidySprite.className = 'sprite-idle'; });
el.twidyContainer.addEventListener('touchstart', e => startX = e.touches[0].clientX);
el.twidyContainer.addEventListener('touchend', () => { startX = 0; el.twidySprite.className = 'sprite-idle'; });

function pokeTwidy() {
    unlockAction();
    el.twidySprite.className = 'sprite-idle'; 
    el.zzz.classList.add('hidden');
    
    think("Hehe! 👋");
    
    el.twidyContainer.style.transitionDuration = '0.2s';
    el.twidyContainer.style.transform = `translate(${state.posX}vw, ${state.posY - 5}vh) scaleY(0.9)`;
    setTimeout(() => {
        el.twidyContainer.style.transform = `translate(${state.posX}vw, ${state.posY}vh) scaleY(1)`;
    }, 200);
    
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

// --- BUTTON ACTIONS ---
function triggerAction(action) {
    state.isActionLocked = true; // Jeda animasi otonom
    el.zzz.classList.add('hidden');
    
    if (action === 'feed') {
        el.twidySprite.className = 'sprite-walk'; 
        think("Nyam nyam! Sosisnya enak! 🌭");
        setTimeout(() => el.twidySprite.className = 'sprite-idle', 1500);
        
    } else if (action === 'bath') {
        el.twidySprite.className = 'sprite-idle';
        think("Segar sekali! 🧼");
        // Splash effect
        const splash = document.createElement('div');
        splash.style.position = 'absolute'; splash.style.width = '100px'; splash.style.height = '100px';
        splash.style.background = 'radial-gradient(circle, rgba(135,206,235,0.8) 0%, transparent 70%)';
        splash.style.animation = 'splashFX 0.5s ease-out forwards';
        el.twidyContainer.appendChild(splash);
        setTimeout(() => splash.remove(), 500);
        
    } else if (action === 'play') {
        el.twidySprite.className = 'sprite-walk';
        think("Yaaay main lempar tangkap! 🎾");
        el.twidyContainer.style.transitionDuration = '0.3s';
        el.twidyContainer.style.transform = `translate(${state.posX}vw, ${state.posY - 15}vh)`;
        setTimeout(() => el.twidyContainer.style.transform = `translate(${state.posX}vw, ${state.posY}vh)`, 300);
        setTimeout(() => el.twidySprite.className = 'sprite-idle', 1500);
        
    } else if (action === 'read') {
        el.twidySprite.className = 'sprite-sit';
        // Memberikan sentuhan easter egg dari proyek aslimu
        const books = ["Lagi baca Diva The Series nih 📚", "Buku 'Manis di Mulut, Pahit di Tubuh' ini menarik juga...", "Wah, cerita Perpustakaan Keliling! 🚌"];
        think(books[Math.floor(Math.random() * books.length)]);
    }

    setTimeout(unlockAction, 4000);
}

function unlockAction() { state.isActionLocked = false; }

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
    
    setTimeout(() => {
        document.getElementById(typingId).innerText = `(Backend Placeholder): Aku tangkap maksudmu: "${text}"`;
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
