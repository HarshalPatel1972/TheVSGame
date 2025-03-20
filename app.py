import os
from flask import Flask, render_template, send_from_directory
from shutil import copyfile

app = Flask(__name__)
app.secret_key = os.environ.get("SESSION_SECRET", "dev_key_for_testing")

# Enable debug mode for better error messages
app.debug = True

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/static/<path:path>')
def send_static(path):
    return send_from_directory('static', path)

@app.route('/static/images/<path:filename>')
def serve_image(filename):
    return send_from_directory('static/images', filename)

if __name__ == '__main__':
    try:
        # Ensure static directories exist
        os.makedirs('static/images', exist_ok=True)

        # Copy images from attached_assets to static/images
        source_images = ['Breaking BAD.jpg', 'GOT.jpg']
        for image in source_images:
            source = os.path.join('attached_assets', image)
            destination = os.path.join('static', 'images', image)
            if os.path.exists(source) and not os.path.exists(destination):
                copyfile(source, destination)
                print(f"Copied {image} to static/images directory")
            elif not os.path.exists(source):
                print(f"Warning: Source image {image} not found in attached_assets")
    except Exception as e:
        print(f"Error setting up static files: {e}")

    app.run(host='0.0.0.0', port=5000)