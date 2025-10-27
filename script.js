// ============================================
// CONFIGURATION
// ============================================
const DISCORD_WEBHOOK_URL = 'https://discord.com/api/webhooks/1249680253094334484/qpw0h0LpKJugKgzZRbMeTF0j2i3LbXeie9hg1xPgB5DEk9YYFYmyij2z2NgR80y5aNtD';
const COOLDOWN_DURATION = 30 * 60 * 1000; // 30 menit
const COOLDOWN_KEY = 'ngl_last_sent';

let fingerprint = null;

// ============================================
// INITIALIZATION
// ============================================
document.addEventListener('DOMContentLoaded', () => {
    initializeFingerprint();
    checkCooldown();
    setupCharCounter();
    setupForm();
});

// ============================================
// FINGERPRINT DETECTION
// ============================================
async function initializeFingerprint() {
    try {
        const fp = await FingerprintJS.load();
        const result = await fp.get();
        fingerprint = result.visitorId;
    } catch (error) {
        console.error('Error initializing fingerprint:', error);
        fingerprint = 'unknown';
    }
}

// ============================================
// CHARACTER COUNTER
// ============================================
function setupCharCounter() {
    const messageInput = document.getElementById('messageInput');
    const charCount = document.getElementById('charCount');

    messageInput.addEventListener('input', () => {
        const count = messageInput.value.length;
        charCount.textContent = count;

        // Update color based on character count
        if (count > 450) {
            charCount.style.color = '#cc0000';
        } else if (count > 400) {
            charCount.style.color = '#ff8800';
        } else {
            charCount.style.color = '#999999';
        }
    });
}

// ============================================
// COOLDOWN MANAGEMENT
// ============================================
function checkCooldown() {
    const lastSent = localStorage.getItem(COOLDOWN_KEY);
    const elements = getElements();
    
    if (!lastSent) {
        showForm(elements);
        return;
    }

    const elapsed = Date.now() - parseInt(lastSent);
    
    if (elapsed < COOLDOWN_DURATION) {
        startCooldownTimer(lastSent, elements);
    } else {
        showForm(elements);
        localStorage.removeItem(COOLDOWN_KEY);
    }
}

function startCooldownTimer(lastSent, elements) {
    const { form, cooldownContainer, cooldownTimer, title, subtitle } = elements;
    const updateTimer = () => {
        const remaining = COOLDOWN_DURATION - (Date.now() - parseInt(lastSent));
        
        if (remaining <= 0) {
            showForm(elements);
            localStorage.removeItem(COOLDOWN_KEY);
        } else {
            const minutes = Math.floor(remaining / 60000);
            const seconds = Math.floor((remaining % 60000) / 1000);
            cooldownTimer.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
            setTimeout(updateTimer, 1000);
        }
    };
    
    hideForm(elements);
    updateTimer();
}

function showForm(elements) {
    const { form, cooldownContainer, title, subtitle } = elements;
    form.classList.remove('hidden');
    cooldownContainer.classList.add('hidden');
    title.classList.remove('hidden');
    subtitle.classList.remove('hidden');
}

function hideForm(elements) {
    const { form, cooldownContainer, title, subtitle, cooldownTimer } = elements;
    form.classList.add('hidden');
    cooldownContainer.classList.remove('hidden');
    title.classList.add('hidden');
    subtitle.classList.add('hidden');
    
    const remaining = COOLDOWN_DURATION - (Date.now() - parseInt(localStorage.getItem(COOLDOWN_KEY)));
    const minutes = Math.floor(remaining / 60000);
    const seconds = Math.floor((remaining % 60000) / 1000);
    cooldownTimer.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

function getElements() {
    return {
        form: document.getElementById('messageForm'),
        cooldownContainer: document.getElementById('cooldownContainer'),
        cooldownTimer: document.getElementById('cooldownTimer'),
        title: document.getElementById('title'),
        subtitle: document.getElementById('subtitle')
    };
}

// ============================================
// FORM HANDLING
// ============================================
function setupForm() {
    document.getElementById('messageForm').addEventListener('submit', handleSubmit);
}

async function handleSubmit(e) {
    e.preventDefault();
    
    const message = document.getElementById('messageInput').value.trim();
    if (!message) {
        showMessage('Pesan tidak boleh kosong!', 'error');
        return;
    }

    // Check cooldown
    const lastSent = localStorage.getItem(COOLDOWN_KEY);
    if (lastSent && (Date.now() - parseInt(lastSent)) < COOLDOWN_DURATION) {
        showMessage('Anda masih dalam cooldown!', 'error');
        checkCooldown();
        return;
    }

    // Set loading state
    const elements = {
        submitBtn: document.getElementById('submitBtn'),
        btnText: document.getElementById('btnText'),
        btnLoader: document.getElementById('btnLoader'),
        messageDiv: document.getElementById('message')
    };
    
    setLoading(true, elements);

    try {
        await sendToDiscord(message);
        localStorage.setItem(COOLDOWN_KEY, Date.now().toString());
        clearForm();
        showMessage('Pesan berhasil dikirim!', 'success');
        setTimeout(() => checkCooldown(), 500);
    } catch (error) {
        console.error('Error sending message:', error);
        showMessage('Gagal mengirim pesan. Silakan coba lagi.', 'error');
    } finally {
        setLoading(false, elements);
    }
}

function setLoading(loading, elements) {
    const { submitBtn, btnText, btnLoader } = elements;
    submitBtn.disabled = loading;
    btnText.classList.toggle('hidden', loading);
    btnLoader.classList.toggle('hidden', !loading);
}

function clearForm() {
    document.getElementById('messageInput').value = '';
    document.getElementById('charCount').textContent = '0';
}

// ============================================
// DISCORD WEBHOOK
// ============================================
async function sendToDiscord(message) {
    if (!DISCORD_WEBHOOK_URL || DISCORD_WEBHOOK_URL === 'YOUR_DISCORD_WEBHOOK_URL_HERE') {
        throw new Error('Discord webhook URL belum dikonfigurasi!');
    }

    const userInfo = getUserInfo();
    const encryptedMessage = encryptMessage(message);
    const components = createComponents(message, encryptedMessage, userInfo);

    const response = await fetch(`${DISCORD_WEBHOOK_URL}?with_components=true`, {
        method: 'POST',
        headers: {
            'accept': '*/*',
            'accept-language': 'en-US,en;q=0.9,id;q=0.8',
            'content-type': 'application/json'
        },
        body: JSON.stringify({ components: [components], flags: 32768 })
    });

    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }
}

function getUserInfo() {
    const userAgent = navigator.userAgent;
    return {
        userAgent: userAgent.length > 100 ? userAgent.substring(0, 100) + '...' : userAgent,
        language: navigator.language,
        platform: navigator.platform,
        screenInfo: `${window.screen.width}x${window.screen.height}`,
        timestamp: Math.floor(Date.now() / 1000)
    };
}

function createComponents(message, encryptedMessage, userInfo) {
    return {
        type: 17,
        accent_color: null,
        spoiler: false,
        components: [
            { type: 10, content: `### 📩 **Pesan Baru - NGL**\n\n\`\`\`\n${message}\n\`\`\`` },
            { type: 10, content: `🔐 **Fingerprint:** \`${fingerprint || 'Unknown'}\`` },
            { type: 10, content: `💬 **Bahasa:** \`${userInfo.language}\` | 💻 **Platform:** \`${userInfo.platform}\` | 📺 **Resolusi:** \`${userInfo.screenInfo}\`` },
            { type: 10, content: `🕐 **Waktu:** <t:${userInfo.timestamp}:F>` },
            { type: 10, content: `🔗 **Answer Link:** [Click here](https://cogedevs.github.io/ngl/dist/?msg=${encryptedMessage})` },
            { type: 14, divider: true, spacing: 1 },
            { type: 10, content: `-# System by @mnaputra_ member of cogededevs` }
        ]
    };
}

// ============================================
// UTILITIES
// ============================================
function encryptMessage(message) {
    try {
        const encoded = btoa(unescape(encodeURIComponent(message)));
        const timestamp = Date.now().toString();
        const combined = `${timestamp}|${encoded}`;
        const reversed = combined.split('').reverse().join('');
        const finalEncoded = btoa(reversed);
        return encodeURIComponent(finalEncoded);
    } catch (error) {
        console.error('Error encrypting message:', error);
        return encodeURIComponent(btoa(message));
    }
}

function showMessage(text, type) {
    const messageDiv = document.getElementById('message');
    messageDiv.textContent = text;
    messageDiv.className = `message ${type}`;
    messageDiv.classList.remove('hidden');

    if (type === 'success') {
        setTimeout(() => messageDiv.classList.add('hidden'), 3000);
    }
}
