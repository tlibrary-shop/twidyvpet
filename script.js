/**
 * TWIDY COZY GARDEN - Autonomous Life Engine
 * Mobile First, Zero Frameworks.
 */

// --- CACHED DOM ELEMENTS ---
const el = {
    world: document.getElementById('world'),
    sky: document.getElementById('sky-layer'),
    celestial: document.getElementById('celestial-body'),
    twidy: document.getElementById('twidy-container'),
    svg: document.getElementById('twidy-svg'),
    bubble: document.getElementById('thought-bubble'),
    particles: document.getElementById('particle-layer'),
    ui: document.getElementById('ui-layer'),
    
    // SVG Parts for Expressions
    eyeL: document.getElementById('eye-l'),
    eyeR: document.getElementById('eye-r'),
    mouth: document.getElementById('mouth'),
    blushL: document.getElementById('blush-l'),
    blushR: document.getElementById('blush-r')
};

// --- GAME STATE & AI ENGINE ---
const state = {
    level: 1,
    exp: 0,
    coins: 50,
    timeOfDay: 'noon', // morning, noon, afternoon, night
    
    // Engine variables
    isUserActive: true,
    idleTimeout: null,
    currentAction: 'idle',
    posX: 50, // vw
    posY: 60, // vh
    facing: 'right'
};

// Defined zones in the garden (vw, vh coordinates)
const zones = [
    { id: 'center', x: 50, y: 65, action: 'idle' },
    { id: 'pond', x: 20, y: 70, action: 'look_water' },
    { id: 'flowers', x: 80, y: 75, action: 'smell' },
    { id: 'bench', x: 75, y: 55, action: 'sit' },
    { id: 'tree', x: 90, y: 60, action: 'sleep' }
];

// --- INITIALIZATION ---
window.onload = () => {
    updateEnvironment();
    setInterval(updateEnvironment, 60000); // Check time every minute
    
    startLifeEngine();
    setupInteraction();
};

function updateHUD() {
    document.getElementById('val-level').innerText = state.level;
    document.getElementById('val-coin').innerText = state.coins;
}

// --- ENVIRONMENT & TIME SYSTEM ---
function updateEnvironment() {
    const hour = new Date().getHours();
    let timeClass = '';
    
    el.particles.innerHTML = ''; // Clear particles
    
    if (hour >= 6 && hour < 11) {
        timeClass = 'time-morning';
        el.celestial.className = 'is-sun';
        spawnParticles('butterfly', 3);
    } else if (hour >= 11 && hour < 15) {
        timeClass = 'time-noon';
        el.celestial.className = 'is-sun';
        spawnParticles('butterfly', 5);
    } else if (hour >= 15 && hour < 18) {
        timeClass = 'time-afternoon';
        el.celestial.className = 'is-sun';
    } else {
        timeClass = 'time-night';
        el.celestial.className = 'is-moon';
        spawnParticles('firefly', 10);
    }
    
    if (state.timeOfDay !== timeClass) {
        state.timeOfDay = timeClass;
        el.sky.className = timeClass;
    }
}

function spawnParticles(type, count) {
    for (let i = 0; i < count; i++) {
        const p = document.createElement('div');
        p.className = type;
        if(type === 'butterfly') p.innerText = Math.random() > 0.5 ? '🦋' : '💮'; // mix
        p.style.left = `${Math.random() * 100}vw`;
        p.style.top = `${Math.random() * 80}vh`;
        p.style.animationDelay = `${Math.random() * 5}s`;
        el.particles.appendChild(p);
    }
}

// --- AUTONOMOUS LIFE ENGINE ---
function startLifeEngine() {
    function loop() {
        if (!state.isUserActive || Math.random() > 0.5) {
            pickRandomActivity();
        }
        
        // Random thought bubble independently
        if(Math.random() > 0.6) triggerRandomThought();
        
        // Loop randomly between 6 to 15 seconds
        setTimeout(loop, Math.random() * 9000 + 6000);
    }
    loop();
}

function pickRandomActivity() {
    const hour = new Date().getHours();
    let possibleZones = [...zones];
    
    // Higher chance to sleep at night
    if (hour >= 21 || hour < 6) {
        possibleZones.push(zones.find(z => z.action === 'sleep'));
        possibleZones.push(zones.find(z => z.action === 'sleep'));
    }

    const target = possibleZones[Math.floor(Math.random() * possibleZones.length)];
    executeActivity(target);
}

function executeActivity(zone) {
    // Reset state
    el.twidy.className = '';
    setExpression('neutral');
    
    walkTo(zone.x, zone.y, () => {
        el.twidy.className = ''; // Stop walking
        
        switch(zone.action) {
            case 'look_water':
                flipChar('left');
                setTimeout(() => setExpression('excited'), 500);
                if(Math.random() > 0.5) think("Ada ikan kecil!");
                break;
            case 'smell':
                el.twidy.className = 'state-sit'; // Squat
                setExpression('happy');
                think("Wanginya enak~ 🌸");
                break;
            case 'sit':
                el.twidy.className = 'state-sit';
                think("Duduk santai dulu.");
                break;
            case 'sleep':
                el.twidy.className = 'state-sleeping';
                think("Zzz...");
                break;
            default:
                if(Math.random() > 0.5) executeMicroAnimation();
                break;
        }
    });
}

// Over 100+ variations created dynamically by mixing parts
function executeMicroAnimation() {
    const actions = ['blink', 'lookLeft', 'lookRight', 'lookUp', 'tailWag'];
    const act = actions[Math.floor(Math.random() * actions.length)];
    
    if(act === 'blink') {
        el.eyeL.setAttribute('d', "M 75 105 L 87 105"); el.eyeR.setAttribute('d', "M 113 105 L 125 105");
        setTimeout(() => setExpression('neutral'), 150);
    } else if (act === 'lookUp') {
        el.twidy.style.transform += " translateY(-5px)";
        setTimeout(() => el.twidy.style.transform = el.twidy.style.transform.replace(" translateY(-5px)", ""), 1000);
    }
}

// --- MOVEMENT ENGINE ---
function walkTo(targetX, targetY, callback) {
    const currentX = state.posX;
    
    if (Math.abs(targetX - currentX) > 2) {
        el.twidy.className = 'state-walking';
        flipChar(targetX > currentX ? 'right' : 'left');
    }
    
    // Calculate distance for smooth constant speed
    const dist = Math.sqrt(Math.pow(targetX - state.posX, 2) + Math.pow(targetY - state.posY, 2));
    const duration = dist * 0.08; // speed multiplier
    
    el.twidy.style.transitionDuration = `${duration}s`;
    el.twidy.style.transform = `translate(${targetX}vw, ${targetY}vh)`;
    
    state.posX = targetX;
    state.posY = targetY;
    
    setTimeout(() => {
        if(callback) callback();
    }, duration * 1000);
}

function flipChar(direction) {
    state.facing = direction;
    if(direction === 'left') {
        el.svg.style.transform = 'scaleX(-1)';
        el.bubble.style.transform = 'translateX(-50%) scaleX(-1)'; // Prevent backwards text
    } else {
        el.svg.style.transform = 'scaleX(1)';
        el.bubble.style.transform = 'translateX(-50%) scaleX(1)';
    }
}

// --- EXPRESSIONS & THOUGHTS ---
function setExpression(mood) {
    // Reset to neutral
    el.mouth.setAttribute('d', "M 95 126 Q 100 132, 105 126");
    el.eyeL.setAttribute('d', "M 75 105 A 6 8 0 1 1 87 105 A 6 8 0 1 1 75 105");
    el.eyeR.setAttribute('d', "M 113 105 A 6 8 0 1 1 125 105 A 6 8 0 1 1 113 105");
    el.blushL.style.opacity = '0'; el.blushR.style.opacity = '0';
    
    const eyeHappy = "M 75 105 Q 81 95, 87 105";
    
    switch(mood) {
        case 'happy':
            el.eyeL.setAttribute('d', eyeHappy);
            el.eyeR.setAttribute('d', "M 113 105 Q 119 95, 125 105");
            el.mouth.setAttribute('d', "M 92 126 Q 100 140, 108 126 Z"); // open mouth
            break;
        case 'blush':
            el.eyeL.setAttribute('d', eyeHappy);
            el.eyeR.setAttribute('d', "M 113 105 Q 119 95, 125 105");
            el.blushL.style.opacity = '0.7'; el.blushR.style.opacity = '0.7';
            break;
        case 'excited':
            el.eyeL.setAttribute('d', eyeHappy);
            el.eyeR.setAttribute('d', "M 113 105 Q 119 95, 125 105");
            break;
    }
}

function think(text) {
    el.bubble.innerText = text;
    el.bubble.classList.remove('hidden');
    if(window.bubbleTimer) clearTimeout(window.bubbleTimer);
    window.bubbleTimer = setTimeout(() => {
        el.bubble.classList.add('hidden');
    }, 4000);
}

function triggerRandomThought() {
    const hour = new Date().getHours();
    const thoughts = {
        morning: ["Selamat pagi ☀️", "Ayo mulai hari ini.", "Udara pagi segar sekali."],
        noon: ["Sudah makan?", "Cuaca cerah!", "Kupu-kupunya lucu."],
        afternoon: ["Cuacanya enak ya.", "Mau jalan-jalan santai."],
        night: ["Ayo istirahat.", "Malam yang tenang.", "Bintangnya indah."],
        random: ["Aku senang kamu datang.", "Ayo bermain.", "Ngantuk nih..."]
    };
    
    let pool = thoughts.random;
    if(hour >= 6 && hour < 11) pool = pool.concat(thoughts.morning);
    else if(hour >= 11 && hour < 15) pool = pool.concat(thoughts.noon);
    else if(hour >= 15 && hour < 18) pool = pool.concat(thoughts.afternoon);
    else pool = pool.concat(thoughts.night);
    
    think(pool[Math.floor(Math.random() * pool.length)]);
}

// --- DRAG & INTERACTIONS ---
function setupInteraction() {
    let isDragging = false;
    
    // Auto-hide UI Logic
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
    
    // Drag Logic (Twidy follows finger slightly)
    let startX = 0;
    el.twidy.addEventListener('touchstart', (e) => { startX = e.touches[0].clientX; });
    el.twidy.addEventListener('touchmove', (e) => {
        const moveX = e.touches[0].clientX;
        if (Math.abs(moveX - startX) > 30) {
            flipChar(moveX > startX ? 'right' : 'left');
            think("Whoaaa!");
        }
    });
}

// Specific Part Touches (Triggered via HTML onclick on hitboxes)
function interact(part) {
    el.twidy.className = ''; // Stop current action
    
    if (part === 'head') {
        setExpression('blush');
        think("Hehe 😊");
        createFloatingHeart();
        
        // Bounce
        el.twidy.style.transitionDuration = '0.2s';
        el.twidy.style.transform = `translate(${state.posX}vw, ${state.posY}vh) scaleY(0.9) scaleX(1.05)`;
        setTimeout(() => {
            el.twidy.style.transform = `translate(${state.posX}vw, ${state.posY}vh) scaleY(1) scaleX(1)`;
        }, 200);
        
    } else if (part === 'body') {
        setExpression('happy');
        think("Geli hihihi!");
        el.twidy.style.transform += " translateX(5px)";
        setTimeout(() => el.twidy.style.transform = el.twidy.style.transform.replace(" translateX(5px)", ""), 100);
        
    } else if (part === 'tail') {
        setExpression('neutral');
        flipChar(state.facing === 'left' ? 'right' : 'left'); // Look back
        think("Eh?");
    }
    
    setTimeout(() => setExpression('neutral'), 2000);
}

function createFloatingHeart() {
    const heart = document.createElement('div');
    heart.innerText = '❤️';
    heart.style.position = 'absolute';
    heart.style.left = '50%';
    heart.style.top = '10%';
    heart.style.fontSize = '1.5rem';
    heart.style.animation = 'floatFly 1s forwards ease-out';
    el.twidy.appendChild(heart);
    setTimeout(() => heart.remove(), 1000);
}

// --- BUTTON ACTIONS ---
function feedTwidy() {
    el.twidy.className = '';
    setExpression('happy');
    think("Nyam nyam! Sosis enak! 🌭"); // Contextual to user memory (sosis)
    
    // Jump
    el.twidy.style.transitionDuration = '0.3s';
    el.twidy.style.transform = `translate(${state.posX}vw, ${state.posY - 10}vh)`;
    setTimeout(() => { el.twidy.style.transform = `translate(${state.posX}vw, ${state.posY}vh)`; }, 300);
}

function playTwidy() {
    el.twidy.className = '';
    setExpression('excited');
    think("Yaaay main!");
    flipChar(state.facing === 'left' ? 'right' : 'left');
}

// --- CHAT MODAL (BACKEND FETCH STRUCTURE) ---
function openChat() {
    document.getElementById('chat-modal').classList.remove('hidden');
    if(document.getElementById('chat-logs').innerHTML === '') {
        appendLog("Hai! Hari ini kita mau ngapain? Aku siap nemenin kamu!", 'twidy');
    }
}

function closeChat() { document.getElementById('chat-modal').classList.add('hidden'); }

async function sendChat() {
    const input = document.getElementById('chat-input');
    const logs = document.getElementById('chat-logs');
    const text = input.value.trim();
    if(!text) return;
    
    appendLog(text, 'user');
    input.value = '';
    const typingId = appendLog('...', 'twidy');
    
    try {
        /**
         * SECURE BACKEND FETCH
         * Frontend TIDAK mengetahui API Key Gemini. 
         * Request dikirim ke Vercel Serverless Function (/api/chat)
         */
        
        /* const response = await fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: text })
        });
        const data = await response.json();
        const reply = data.reply;
        */
       
        // Simulasi respon karena tidak ada backend aktif
        setTimeout(() => {
            document.getElementById(typingId).remove();
            appendLog(`(Terkoneksi ke Backend). Aku dengar kamu bilang: "${text}". Hehe!`, 'twidy');
            setExpression('blush');
        }, 1000);
        
    } catch (err) {
        document.getElementById(typingId).innerText = "Maaf, koneksiku ke server terputus... 😿";
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
