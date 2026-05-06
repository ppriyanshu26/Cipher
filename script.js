function updateLabels() {
    const mode = document.querySelector('input[name="mode"]:checked').value;
    const textLabel = document.getElementById('text-label');
    if (mode === 'encrypt') {
        textLabel.textContent = 'Plaintext:';
    } else {
        textLabel.textContent = 'Ciphertext:';
    }
}

function base64UrlEncode(bytes) {
    let binary = '';
    const chunkSize = 0x8000;
    for (let i = 0; i < bytes.length; i += chunkSize) {
        const chunk = bytes.subarray(i, i + chunkSize);
        binary += String.fromCharCode.apply(null, chunk);
    }
    return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_');
}

function base64UrlDecodeToBytes(base64Url) {
    const normalized = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const padded = normalized + '==='.slice((normalized.length + 3) % 4);
    const binary = atob(padded);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
}

async function deriveAesKeyFromString(keyString) {
    const keyBytes = new TextEncoder().encode(keyString);
    const hashed = await crypto.subtle.digest('SHA-256', keyBytes);
    return crypto.subtle.importKey('raw', hashed, { name: 'AES-GCM' }, false, ['encrypt', 'decrypt']);
}

async function encryptAesGcm(plaintext, keyString) {
    const key = await deriveAesKeyFromString(keyString);
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const plaintextBytes = new TextEncoder().encode(plaintext);
    const ciphertextBuffer = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, plaintextBytes);
    const ciphertextBytes = new Uint8Array(ciphertextBuffer);

    const combined = new Uint8Array(iv.length + ciphertextBytes.length);
    combined.set(iv, 0);
    combined.set(ciphertextBytes, iv.length);
    return base64UrlEncode(combined);
}

async function decryptAesGcm(ciphertextBase64Url, keyString) {
    try {
        const raw = base64UrlDecodeToBytes(ciphertextBase64Url.trim());
        if (raw.length < 13) {
            throw new Error('Failed to decrypt.');
        }
        const iv = raw.slice(0, 12);
        const encryptedData = raw.slice(12);
        const key = await deriveAesKeyFromString(keyString);
        const plaintextBuffer = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, encryptedData);
        const plaintext = new TextDecoder().decode(plaintextBuffer);
        if (typeof plaintext !== 'string') {
            throw new Error('Failed to decrypt.');
        }
        return plaintext;
    } catch {
        throw new Error('Failed to decrypt. Check your key or ciphertext.');
    }
}

function renderResult({ result, error }) {
    const resultContainer = document.getElementById('result-container');
    if (error) {
        resultContainer.innerHTML = `
            <div class="result error-mode">
                <strong>ERROR:</strong>
                <p id="output-content"></p>
                <button type="button" onclick="copyResult()">Copy</button>
            </div>
        `;
        document.getElementById('output-content').innerText = error;
        return;
    }

    resultContainer.innerHTML = `
        <div class="result">
            <strong>Result:</strong>
            <p id="output-content"></p>
            <button type="button" onclick="copyResult()">Copy</button>
        </div>
    `;
    document.getElementById('output-content').innerText = result;
}

function validateKeyOrShowError() {
    const key = document.getElementById('key').value;
    if (key.length < 8) {
        renderResult({ error: 'Key must be at least 8 characters long.' });
        return false;
    }
    return true;
}

document.addEventListener('DOMContentLoaded', function() {
    updateLabels();

    const form = document.getElementById('crypto-form');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (!validateKeyOrShowError()) return;

        const mode = document.querySelector('input[name="mode"]:checked').value;
        const text = document.getElementById('text').value;
        const key = document.getElementById('key').value;

        try {
            if (mode === 'encrypt') {
                const result = await encryptAesGcm(text, key);
                renderResult({ result });
            } else {
                const result = await decryptAesGcm(text, key);
                if (typeof result !== 'string') {
                    renderResult({ error: 'Failed to decrypt. Check your key or ciphertext.' });
                    return;
                }
                renderResult({ result });
            }
        } catch (err) {
            const rawMessage = err instanceof Error ? err.message : '';
            const normalized = (rawMessage || '').trim();
            const message = normalized
                ? normalized
                : (mode === 'decrypt' ? 'Failed to decrypt. Check your key or ciphertext.' : 'Operation failed.');
            renderResult({ error: message });
        }
    });
});

function copyResult() {
    const content = document.getElementById('output-content').innerText;
    navigator.clipboard.writeText(content).then(() => {
        alert('Copied to clipboard!');
    }).catch(err => {
        console.error('Failed to copy: ', err);
        alert('Failed to copy to clipboard');
    });
}
