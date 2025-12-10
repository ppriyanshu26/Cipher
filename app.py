from flask import Flask, render_template, request
from Crypto import Crypto
import os
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)

@app.route('/', methods=['GET', 'POST'])
def index():
    result = None
    error = None
    input_text = None
    key = None
    api_key = None
    mode = 'encrypt'
    
    if request.method == 'POST':
        mode = request.form.get('mode')
        input_text = request.form.get('text')
        key = request.form.get('key')
        api_key = request.form.get('api_key')

        valid_api_keys = os.getenv('API_KEY', '').split(',')
        
        if not api_key or api_key not in valid_api_keys:
            error = "Invalid or missing API Key."
        elif not key or len(key) < 8:
            error = "Key must be at least 8 characters long."
        else:
            crypto = Crypto(key)
            if mode == 'encrypt':
                try:
                    result = crypto.encrypt_aes(input_text)
                except Exception as e:
                    error = f"Encryption failed: {str(e)}"
            elif mode == 'decrypt':
                result = crypto.decrypt_aes(input_text)
                if result is None:
                    error = "Decryption failed. Check your key or ciphertext."

    return render_template('index.html', result=result, error=error, input_text=input_text, key=key, api_key=api_key, mode=mode)

if __name__ == '__main__':
    app.run(debug=True)
