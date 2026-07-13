const twidyContainer = document.getElementById('twidy-container');
const twidySprite = document.getElementById('twidy-sprite');
const bubble = document.getElementById('thought-bubble');

// Mulai animasi napas pada gambar
twidySprite.classList.add('anim-breathe');

// --- INTERAKSI ---
function pokeTwidy() {
    think("Hehe! 👋");
    
    // Animasi loncat untuk gambar
    twidyContainer.style.transitionDuration = '0.2s';
    twidyContainer.style.transform = `translateY(-20px) scaleY(0.9)`;
    setTimeout(() => {
        twidyContainer.style.transform = `translateY(0) scaleY(1)`;
    }, 200);
}

function feedTwidy() {
    think("Nyam nyam! Enak! 🍲");
    // Animasi gerak
    twidySprite.style.transform = "rotate(-5deg)";
    setTimeout(() => twidySprite.style.transform = "rotate(5deg)", 200);
    setTimeout(() => twidySprite.style.transform = "rotate(0deg)", 400);
}

// --- THOUGHT BUBBLE ---
function think(text) {
    bubble.innerText = text;
    bubble.classList.remove('hidden');
    if(window.bubbleTimer) clearTimeout(window.bubbleTimer);
    window.bubbleTimer = setTimeout(() => bubble.classList.add('hidden'), 3500);
}

// Dialog acak berjalan sendiri
setInterval(() => {
    if(Math.random() > 0.5 && bubble.classList.contains('hidden')) {
        const thoughts = ["Taman ini nyaman ya.", "Kamu lagi sibuk?", "Hmmm...", "Hari yang cerah!"];
        think(thoughts[Math.floor(Math.random() * thoughts.length)]);
    }
}, 10000);

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
    
    // Fetch ke backend Vercel kamu akan ada di sini nantinya
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
