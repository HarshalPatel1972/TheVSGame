import os
import json
import time
from flask import Flask, render_template, send_from_directory, jsonify, request
from shutil import copyfile
from threading import Lock, Thread
import atexit

app = Flask(__name__)
app.secret_key = os.environ.get("SESSION_SECRET", "dev_key_for_testing")

# Path for persistent counter storage
COUNTER_FILE = os.path.join(os.path.dirname(__file__), 'counters.json')

# Global counter storage with default values
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

# Load saved counters if they exist
def load_counters():
    try:
        if os.path.exists(COUNTER_FILE):
            with open(COUNTER_FILE, 'r') as f:
                saved_data = json.load(f)
                for show in counters.keys():
                    if show in saved_data:
                        counters[show]['total'] = saved_data[show]['total']
                print(f"Loaded counters from {COUNTER_FILE}")
    except Exception as e:
        print(f"Error loading counters: {e}")

# Save counters to persistent storage
def save_counters():
    try:
        data_to_save = {}
        for show in counters:
            data_to_save[show] = {'total': counters[show]['total']}
        
        with open(COUNTER_FILE, 'w') as f:
            json.dump(data_to_save, f)
    except Exception as e:
        print(f"Error saving counters: {e}")

# Periodic save function
def periodic_save():
    while True:
        time.sleep(60)  # Save every minute
        with counter_lock:
            save_counters()

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
        
        # Save counters after every 10 increments to reduce disk I/O
        if counters[show]['total'] % 10 == 0:
            save_counters()
            
        return jsonify({
            'total': counters[show]['total']
        })

@app.route('/static/<path:path>')
def send_static(path):
    return send_from_directory('static', path)

@app.route('/static/images/<path:filename>')
def serve_image(filename):
    return send_from_directory('static/images', filename)

# Register save_counters function to be called on exit
atexit.register(save_counters)

if __name__ == '__main__':
    try:
        # Load existing counters
        load_counters()
        
        # Start background save thread
        save_thread = Thread(target=periodic_save, daemon=True)
        save_thread.start()
        
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