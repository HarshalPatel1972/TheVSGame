import os
import json
import time
from flask import Flask, render_template, send_from_directory, jsonify, request
from shutil import copyfile
from threading import Lock

# Server startup timestamp - will change every time the server restarts/redeploys
SERVER_START_TIME = int(time.time())

app = Flask(__name__)
app.secret_key = os.environ.get("SESSION_SECRET", "dev_key_for_testing")

# Global counter storage
counters = {
    'breaking_bad': {
        'total': 0,
        'clicks': [],  # Store recent clicks with timestamps
    },
    'game_of_thrones': {
        'total': 0,
        'clicks': [],  # Store recent clicks with timestamps
    }
}
counter_lock = Lock()  # To prevent race conditions

# Enable debug mode for better error messages
app.debug = True

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/counters', methods=['GET'])
def get_counters():
    """Get current counter values and points per second"""
    with counter_lock:
        # Clean up old clicks (older than 5 seconds)
        current_time = time.time()
        for show in counters:
            counters[show]['clicks'] = [click for click in counters[show]['clicks'] 
                                      if current_time - click < 5]
            
        # Calculate points per second (clicks in the last second)
        bb_recent = sum(1 for click in counters['breaking_bad']['clicks'] 
                      if current_time - click <= 1)
        got_recent = sum(1 for click in counters['game_of_thrones']['clicks'] 
                       if current_time - click <= 1)
        
        return jsonify({
            'breaking_bad': {
                'total': counters['breaking_bad']['total'],
                'per_second': bb_recent
            },
            'game_of_thrones': {
                'total': counters['game_of_thrones']['total'],
                'per_second': got_recent
            },
            'server_start_time': SERVER_START_TIME  # Add server start time to response
        })

@app.route('/api/increment/<show>', methods=['POST'])
def increment_counter(show):
    """Increment counter for a specific show"""
    if show not in ['breaking_bad', 'game_of_thrones']:
        return jsonify({'error': 'Invalid show'}), 400
    
    with counter_lock:
        counters[show]['total'] += 1
        counters[show]['clicks'].append(time.time())
        
        return jsonify({
            'total': counters[show]['total']
        })

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