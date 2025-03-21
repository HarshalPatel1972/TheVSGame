import os
from flask import Flask, render_template, send_from_directory

app = Flask(__name__)
app.secret_key = os.environ.get("SESSION_SECRET", "dev_key_for_testing")

# Enable debug mode for better error messages
app.debug = True

@app.route('/')
def index():
    return render_template('index.html')

# Ensure proper static file serving
@app.route('/static/<path:path>')
def send_static(path):
    return send_from_directory('static', path)

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)