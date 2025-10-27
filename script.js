// Konfigurasi Discord Webhook
const DISCORD_WEBHOOK_URL = 'https://discord.com/api/webhooks/1249680253094334484/qpw0h0LpKJugKgzZRbMeTF0j2i3LbXeie9hg1xPgB5DEk9YYFYmyij2z2NgR80y5aNtD';

// Konfigurasi Cooldown (30 menit dalam milidetik)
const COOLDOWN_DURATION = 30 * 60 * 1000; // 30 menit

// State
let fingerprint = null;

// Inisialisasi
document.addEventListener('DOMContentLoaded', () => {
    initializeFingerprint();
    checkCooldown();
    setupCharCounter();
    setupForm();
});

// Setup fingerprint detection
async function initializeFingerprint() {
    try {
        const fp = await FingerprintJS.load();
        const result = await fp.get();
        fingerprint = result.visitorId;
        console.log('Fingerprint initialized:', fingerprint);
    } catch (error) {
        console.error('Error initializing fingerprint:', error);
        fingerprint = 'unknown';
    }
}

// Setup character counter
function setupCharCounter() {
    const messageInput = document.getElementById('messageInput');
    const charCount = document.getElementById('charCount');

    messageInput.addEventListener('input', () => {
        const count = messageInput.value.length;
        charCount.textContent = count;

        // Change color when approaching limit
        if (count > 450) {
            charCount.style.color = '#cc0000';
        } else if (count > 400) {
            charCount.style.color = '#ff8800';
        } else {
            charCount.style.color = '#999999';
        }
    });
}

// Check cooldown status
function checkCooldown() {
    const lastSent = localStorage.getItem('ngl_last_sent');
    const cooldownContainer = document.getElementById('cooldownContainer');
    const cooldownTimer = document.getElementById('cooldownTimer');
    const form = document.getElementById('messageForm');
    const title = document.getElementById('title');
    const subtitle = document.getElementById('subtitle');
 
    if (!lastSent) {
        cooldownContainer.classList.add('hidden');
        form.classList.remove('hidden');
        title.classList.remove('hidden');
        subtitle.classList.remove('hidden');
        return;
    }
 
    const now = Date.now();
    const elapsed = now - parseInt(lastSent);
 
    if (elapsed < COOLDOWN_DURATION) {
        const remaining = COOLDOWN_DURATION - elapsed;
        const minutes = Math.floor(remaining / 60000);
        const seconds = Math.floor((remaining % 60000) / 1000);
 
        // Hide form and show cooldown
        form.classList.add('hidden');
        cooldownContainer.classList.remove('hidden');
        title.classList.add('hidden');
        subtitle.classList.add('hidden');
        cooldownTimer.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
 
        // Update timer every second
        const timerInterval = setInterval(() => {
            const now = Date.now();
            const elapsed = now - parseInt(lastSent);
            const remaining = COOLDOWN_DURATION - elapsed;
 
            if (remaining <= 0) {
                clearInterval(timerInterval);
                cooldownContainer.classList.add('hidden');
                form.classList.remove('hidden');
                title.classList.remove('hidden');
                subtitle.classList.remove('hidden');
                localStorage.removeItem('ngl_last_sent');
            } else {
                const minutes = Math.floor(remaining / 60000);
                const seconds = Math.floor((remaining % 60000) / 1000);
                cooldownTimer.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
            }
        }, 1000);
    } else {
        // Cooldown is over
        form.classList.remove('hidden');
        cooldownContainer.classList.add('hidden');
        title.classList.remove('hidden');
        subtitle.classList.remove('hidden');
        localStorage.removeItem('ngl_last_sent');
    }
}

// Setup form submission
function setupForm() {
    const form = document.getElementById('messageForm');
    form.addEventListener('submit', handleSubmit);
}

// Handle form submission
async function handleSubmit(e) {
    e.preventDefault();

    const messageInput = document.getElementById('messageInput');
    const message = messageInput.value.trim();
    const submitBtn = document.getElementById('submitBtn');
    const btnText = document.getElementById('btnText');
    const btnLoader = document.getElementById('btnLoader');
    const messageDiv = document.getElementById('message');
    const cooldownContainer = document.getElementById('cooldownContainer');

    if (!message) {
        showMessage('Pesan tidak boleh kosong!', 'error');
        return;
    }

    // Check cooldown before sending
    const lastSent = localStorage.getItem('ngl_last_sent');
    if (lastSent) {
        const now = Date.now();
        const elapsed = now - parseInt(lastSent);
        if (elapsed < COOLDOWN_DURATION) {
            showMessage('Anda masih dalam cooldown!', 'error');
            checkCooldown();
            return;
        }
    }

    // Disable form and show loading
    submitBtn.disabled = true;
    btnText.classList.add('hidden');
    btnLoader.classList.remove('hidden');
    messageDiv.classList.add('hidden');
    cooldownContainer.classList.add('hidden');

    try {
        await sendToDiscord(message);
        // console.log(message);
        // const encryptedMessage = encryptMessage(message);
        // console.log(encryptedMessage);
        // window.location.href = `dist/?msg=${encryptedMessage}`;
        // return;

        // Save timestamp to localStorage
        localStorage.setItem('ngl_last_sent', Date.now().toString());

        // Clear form
        messageInput.value = '';
        document.getElementById('charCount').textContent = '0';

        // Show success message
        showMessage('Pesan berhasil dikirim!', 'success');

        // Start cooldown timer
        setTimeout(() => {
            checkCooldown();
        }, 500);

    } catch (error) {
        console.error('Error sending message:', error);
        showMessage('Gagal mengirim pesan. Silakan coba lagi.', 'error');
        
        // Re-enable form on error
        submitBtn.disabled = false;
        btnText.classList.remove('hidden');
        btnLoader.classList.add('hidden');
    }
}

// Send message to Discord webhook
async function sendToDiscord(message) {
    if (!DISCORD_WEBHOOK_URL || DISCORD_WEBHOOK_URL === 'YOUR_DISCORD_WEBHOOK_URL_HERE') {
        throw new Error('Discord webhook URL belum dikonfigurasi!');
    }

    // Get user info
    const userAgent = navigator.userAgent;
    const language = navigator.language;
    const platform = navigator.platform;
    const screenInfo = `${window.screen.width}x${window.screen.height}`;
    const referrer = document.referrer || 'Direct';
    const timestamp = new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' });

    // Format User Agent
    const shortUserAgent = userAgent.length > 100 ? userAgent.substring(0, 100) + '...' : userAgent;
    const shortReferrer = referrer !== 'Direct' ? (referrer.length > 100 ? referrer.substring(0, 100) + '...' : referrer) : 'Direct';

    // Create components structure
    const components =
    {
        type: 17, // Container component
        accent_color: null,
        spoiler: false,
        components: [
            {
                type: 10, // Text content
                content: `### 📩 **Pesan Baru - NGL**\n\n\`\`\`\n${message}\n\`\`\``
            },
            {
                type: 10,
                content: `🔐 **Fingerprint:** \`${fingerprint || 'Unknown'}\``
            },
            {
                type: 10,
                content: `🌐 **Browser:** \`${shortUserAgent}\``
            },
            {
                type: 10,
                content: `💬 **Bahasa:** \`${language}\` | 💻 **Platform:** \`${platform}\` | 📺 **Resolusi:** \`${screenInfo}\``
            },
            {
                type: 10,
                content: `🔗 **Referrer:** \`${shortReferrer}\`\n🕐 **Waktu:** \`${timestamp}\``
            },
            {
                type: 14, // Divider
                divider: true,
                spacing: 1
            },
            {
                type: 10,
                content: `-# System by @mnaputra_ member of cogededevs`
            }
        ]
    }


    // Send to Discord
    const response = await fetch(DISCORD_WEBHOOK_URL + '?with_components=true', {
        method: 'POST',
        headers: {
            'accept': '*/*',
            'accept-language': 'en-US,en;q=0.9,id;q=0.8',
            'cache-control': 'no-cache',
            'content-type': 'application/json',
            'pragma': 'no-cache'
        },
        body: JSON.stringify({
            components: [components],
            flags: 32768 // Ephemeral flag
        })
    });

    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }
}

// Encrypt message before sending
function encryptMessage(message) {
    try {
        // Simple encryption using base64 and obfuscation
        const encoded = btoa(unescape(encodeURIComponent(message)));
        
        // Add timestamp for uniqueness
        const timestamp = Date.now().toString();
        const combined = `${timestamp}|${encoded}`;
        
        // Reverse the string
        const reversed = combined.split('').reverse().join('');
        
        // Double encode
        const finalEncoded = btoa(reversed);
        
        return encodeURIComponent(finalEncoded);
    } catch (error) {
        console.error('Error encrypting message:', error);
        // Fallback to simple base64 if encryption fails
        return encodeURIComponent(btoa(message));
    }
}

// Show message to user
function showMessage(text, type) {
    const messageDiv = document.getElementById('message');
    messageDiv.textContent = text;
    messageDiv.className = `message ${type}`;
    messageDiv.classList.remove('hidden');

    // Auto hide success messages after 3 seconds
    if (type === 'success') {
        setTimeout(() => {
            messageDiv.classList.add('hidden');
        }, 3000);
    }
}

