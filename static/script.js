function updateLabels() {
    const mode = document.querySelector('input[name="mode"]:checked').value;
    const textLabel = document.getElementById('text-label');
    if (mode === 'encrypt') {
        textLabel.textContent = 'Plaintext:';
    } else {
        textLabel.textContent = 'Ciphertext:';
    }
}

function validateForm() {
    const key = document.getElementById('key').value;
    if (key.length < 8) {
        const resultContainer = document.getElementById('result-container');
        resultContainer.innerHTML = `
            <div class="result error-mode">
                <strong>ERROR:</strong>
                <p id="output-content">Key must be at least 8 characters long.</p>
                <button type="button" onclick="copyResult()">Copy</button>
            </div>
        `;
        return false;
    }
    return true;
}

document.addEventListener('DOMContentLoaded', function() {
    updateLabels();
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