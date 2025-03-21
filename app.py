import os
import json
import time
from dotenv import load_dotenv
from flask import Flask, render_template, send_from_directory, jsonify, request
from shutil import copyfile
from threading import Lock, Thread
import atexit
import random
import uuid

# Load environment variables from .env file
load_dotenv()

app = Flask(__name__)
app.secret_key = os.environ.get("SESSION_SECRET", "dev_key_for_testing")

# Path for persistent counter storage
COUNTER_FILE = os.path.join(os.path.dirname(__file__), 'counters.json')

# Path for personal scores storage
PERSONAL_SCORES_FILE = os.path.join(os.path.dirname(__file__), 'personal_scores.json')

# Path for feedback storage
FEEDBACK_FILE = os.path.join(os.path.dirname(__file__), 'feedback.json')

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

# Personal scores storage
personal_scores = {}  # Format: {device_id: {'breaking_bad': score, 'game_of_thrones': score}}

counter_lock = Lock()  # To prevent race conditions
personal_scores_lock = Lock()  # Lock for personal scores

# Add a reset timestamp to track when counters were last reset
LAST_RESET_TIME = int(time.time())

# Add image rotation configuration with persistent storage
ROTATION_CONFIG_FILE = os.path.join(os.path.dirname(__file__), 'rotation_config.json')

# Default config
image_rotation = {
    'interval': 5 * 60 * 1000,  # 5 minutes in milliseconds by default
    'last_changed': int(time.time() * 1000)  # Current time in milliseconds
}

# Load saved rotation config if it exists
def load_rotation_config():
    global image_rotation
    try:
        if os.path.exists(ROTATION_CONFIG_FILE):
            with open(ROTATION_CONFIG_FILE, 'r') as f:
                saved_config = json.load(f)
                image_rotation.update(saved_config)
                print(f"Loaded rotation config: {image_rotation['interval']/1000} seconds")
    except Exception as e:
        print(f"Error loading rotation config: {e}")

# Save rotation config to persistent storage
def save_rotation_config():
    try:
        with open(ROTATION_CONFIG_FILE, 'w') as f:
            json.dump(image_rotation, f)
            print(f"Saved rotation config: {image_rotation['interval']/1000} seconds")
    except Exception as e:
        print(f"Error saving rotation config: {e}")

# Load saved counters if they exist
def load_counters():
    global counters, LAST_RESET_TIME
    try:
        if os.path.exists(COUNTER_FILE):
            with open(COUNTER_FILE, 'r') as f:
                saved_data = json.load(f)
                if 'counters' in saved_data:
                    for show in counters.keys():
                        if show in saved_data['counters']:
                            counters[show]['total'] = saved_data['counters'][show]['total']
                
                # Load reset timestamp if available
                if 'last_reset_time' in saved_data:
                    LAST_RESET_TIME = saved_data['last_reset_time']
                
                print(f"Loaded counters from {COUNTER_FILE}")
    except Exception as e:
        print(f"Error loading counters: {e}")

# Save counters to persistent storage
def save_counters():
    try:
        data_to_save = {
            'counters': {},
            'last_reset_time': LAST_RESET_TIME
        }
        for show in counters:
            data_to_save['counters'][show] = {'total': counters[show]['total']}
        
        with open(COUNTER_FILE, 'w') as f:
            json.dump(data_to_save, f)
    except Exception as e:
        print(f"Error saving counters: {e}")

# Load saved personal scores if they exist
def load_personal_scores():
    global personal_scores
    try:
        if os.path.exists(PERSONAL_SCORES_FILE):
            with open(PERSONAL_SCORES_FILE, 'r') as f:
                personal_scores = json.load(f)
                print(f"Loaded personal scores from {PERSONAL_SCORES_FILE}")
    except Exception as e:
        print(f"Error loading personal scores: {e}")

# Save personal scores to persistent storage
def save_personal_scores():
    try:
        with open(PERSONAL_SCORES_FILE, 'w') as f:
            json.dump(personal_scores, f)
    except Exception as e:
        print(f"Error saving personal scores: {e}")

# Periodic save function
def periodic_save():
    while True:
        time.sleep(60)  # Save every minute
        with counter_lock:
            save_counters()
        with personal_scores_lock:
            save_personal_scores()

# Load saved feedback if exists
def load_feedback():
    try:
        if os.path.exists(FEEDBACK_FILE):
            with open(FEEDBACK_FILE, 'r') as f:
                return json.load(f)
        return []
    except Exception as e:
        print(f"Error loading feedback: {e}")
        return []

# Save feedback to file
def save_feedback(feedback_data):
    try:
        feedback_list = load_feedback()
        feedback_list.append(feedback_data)
        with open(FEEDBACK_FILE, 'w') as f:
            json.dump(feedback_list, f, indent=2)
        return True
    except Exception as e:
        print(f"Error saving feedback: {e}")
        return False

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
            'last_reset_time': LAST_RESET_TIME  # Add reset timestamp to response
        })

@app.route('/api/personal-scores/<device_id>', methods=['GET'])
def get_personal_scores(device_id):
    """Get personal scores for a specific device"""
    with personal_scores_lock:
        if device_id not in personal_scores:
            # Initialize new device with zero scores
            personal_scores[device_id] = {
                'breaking_bad': 0,
                'game_of_thrones': 0
            }
            save_personal_scores()
            
        return jsonify({
            'scores': personal_scores[device_id],
            'last_reset_time': LAST_RESET_TIME
        })

@app.route('/api/increment/<show>', methods=['POST'])
def increment_counter(show):
    """Increment counter for a specific show"""
    if show not in ['breaking_bad', 'game_of_thrones']:
        return jsonify({'error': 'Invalid show'}), 400
    
    try:
        data = request.get_json() or {}
        device_id = data.get('device_id', '')
        
        with counter_lock:
            counters[show]['total'] += 1
            counters[show]['clicks'].append(time.time())
            
            # Save counters after every 10 increments to reduce disk I/O
            if counters[show]['total'] % 10 == 0:
                save_counters()
        
        # If device ID is provided, update personal score
        if device_id:
            with personal_scores_lock:
                if device_id not in personal_scores:
                    personal_scores[device_id] = {
                        'breaking_bad': 0,
                        'game_of_thrones': 0
                    }
                
                personal_scores[device_id][show] += 1
                
                # Save personal scores after every 5 increments
                if personal_scores[device_id][show] % 5 == 0:
                    save_personal_scores()
                
        return jsonify({
            'total': counters[show]['total'],
            'personal_score': personal_scores.get(device_id, {}).get(show, 0) if device_id else None
        })
    except Exception as e:
        app.logger.error(f"Error in increment endpoint: {e}")
        return jsonify({'error': 'Server error during increment'}), 500

@app.route('/api/reset', methods=['POST'])
def reset_counters():
    """Reset all counters (admin functionality)"""
    global LAST_RESET_TIME  # Access the global variable
    
    try:
        data = request.get_json()
        if not data or 'code' not in data:
            return jsonify({'error': 'Missing authorization code'}), 400
        
        admin_code = data.get('code')
        reset_personal = data.get('reset_personal', True)  # Default to resetting personal scores
        
        # Verify the admin code
        if admin_code != "RETRIBUTION":
            return jsonify({'error': 'Invalid authorization code'}), 403
        
        # Reset global counters
        with counter_lock:
            for show in counters:
                counters[show]['total'] = 0
                counters[show]['clicks'] = []
            
            # Update the reset timestamp
            LAST_RESET_TIME = int(time.time())
            
            # Save the reset state to persistent storage
            save_counters()
        
        # Reset personal scores if requested
        if reset_personal:
            with personal_scores_lock:
                # Clear all personal scores
                personal_scores.clear()
                save_personal_scores()
            
        return jsonify({
            'success': True, 
            'message': 'All counters have been reset',
            'reset_personal': reset_personal,
            'last_reset_time': LAST_RESET_TIME
        })
            
    except Exception as e:
        app.logger.error(f"Error in reset endpoint: {e}")
        return jsonify({'error': 'Server error during reset'}), 500

@app.route('/static/<path:path>')
def send_static(path):
    return send_from_directory('static', path)

@app.route('/static/images/<path:filename>')
def serve_image(filename):
    return send_from_directory('static/images', filename)

@app.route('/api/images/<show_type>')
def get_random_image(show_type):
    """Get random image for a specific show"""
    if show_type not in ['breaking_bad', 'game_of_thrones']:
        return jsonify({'error': 'Invalid show type'}), 400
    
    image_dir = os.path.join('static', 'images')
    
    # Check if directory exists
    if not os.path.exists(image_dir):
        return jsonify({'error': f'Image directory not found: {image_dir}'}), 404
    
    # Get all image files matching the pattern (BB* for breaking_bad, GOT* for game_of_thrones)
    prefix = "BB" if show_type == 'breaking_bad' else "GOT"
    image_files = [f for f in os.listdir(image_dir) 
                  if f.startswith(prefix) and f.lower().endswith(('.jpg', '.jpeg', '.png'))]
    
    if not image_files:
        # Fall back to default images if no custom images found
        if show_type == 'breaking_bad':
            return jsonify({'image_url': '/static/images/Breaking BAD.jpg'})
        else:
            return jsonify({'image_url': '/static/images/GOT.jpg'})
    
    # Pick a random image
    random_image = random.choice(image_files)
    image_url = f'/static/images/{random_image}'
    
    return jsonify({'image_url': image_url})

@app.route('/api/rotation-interval', methods=['GET', 'POST'])
def update_rotation_interval():
    """Get or update the image rotation interval"""
    if request.method == 'POST':
        try:
            data = request.get_json()
            
            # Validate admin code
            if not data or 'code' not in data or data['code'] != "RETRIBUTION":
                return jsonify({'error': 'Invalid authorization code'}), 403
            
            # Calculate new interval in milliseconds
            new_interval = 0
            if 'hours' in data:
                new_interval += int(data['hours']) * 60 * 60 * 1000
            if 'minutes' in data:
                new_interval += int(data['minutes']) * 60 * 1000
            if 'seconds' in data:
                new_interval += int(data['seconds']) * 1000
            
            # Ensure at least 1 second
            if new_interval < 1000:
                new_interval = 1000
            
            # Update interval
            image_rotation['interval'] = new_interval
            image_rotation['last_changed'] = int(time.time() * 1000)
            
            # Persist the change
            save_rotation_config()
            
            return jsonify({
                'success': True,
                'interval': image_rotation['interval'],
                'message': f'Rotation interval updated to {image_rotation["interval"]/1000} seconds'
            })
            
        except Exception as e:
            app.logger.error(f"Error updating rotation interval: {e}")
            return jsonify({'error': f'Server error: {str(e)}'}), 500
    
    # GET request - return current settings
    return jsonify({
        'interval': image_rotation['interval'],
        'interval_seconds': image_rotation['interval'] / 1000,
        'interval_minutes': (image_rotation['interval'] / 1000) / 60,
        'interval_hours': (image_rotation['interval'] / 1000) / 3600,
        'last_changed': image_rotation['last_changed'] / 1000,
    })

@app.route('/api/save-feedback', methods=['POST'])
def save_feedback_endpoint():
    """Save feedback without sending email"""
    try:
        data = request.get_json()
        
        if not data or 'feedback' not in data:
            return jsonify({'error': 'Missing required fields'}), 400
            
        name = data.get('name', 'Anonymous')
        email = data.get('email', 'Not provided')
        feedback = data.get('feedback')
        
        # Create feedback record with timestamp
        feedback_data = {
            'name': name,
            'email': email,
            'feedback': feedback,
            'timestamp': time.strftime('%Y-%m-%d %H:%M:%S'),
        }
        
        # Save feedback to file
        save_feedback(feedback_data)
        
        return jsonify({
            'success': True, 
            'message': 'Feedback saved successfully'
        })
            
    except Exception as e:
        app.logger.error(f"Error saving feedback: {str(e)}")
        return jsonify({'error': 'Server error saving feedback', 'message': str(e)}), 500

# Admin route to view feedback (protected with the same password)
@app.route('/admin/feedback', methods=['GET'])
def view_feedback():
    """View all saved feedback (protected)"""
    auth_code = request.args.get('code')
    
    if auth_code != "RETRIBUTION":
        return jsonify({'error': 'Unauthorized access'}), 403
        
    feedback_list = load_feedback()
    return jsonify({'feedback': feedback_list})

@app.route('/api/emailjs-config', methods=['GET'])
def get_emailjs_config():
    """Get EmailJS configuration for client-side use"""
    try:
        config = {
            'publicKey': os.environ.get('EMAILJS_PUBLIC_KEY', ''),
            'serviceId': os.environ.get('EMAILJS_SERVICE_ID', ''),
            'templateId': os.environ.get('EMAILJS_TEMPLATE_ID', '')
        }
        
        # Add detailed logging for debugging
        app.logger.info(f"EmailJS config: publicKey={config['publicKey'][:3]}...{config['publicKey'][-3:] if len(config['publicKey']) > 6 else ''}, serviceId={config['serviceId']}, templateId={config['templateId']}")
        
        # Ensure all required fields are provided
        missing_fields = []
        if not config['publicKey']:
            missing_fields.append('EMAILJS_PUBLIC_KEY')
        if not config['serviceId']:
            missing_fields.append('EMAILJS_SERVICE_ID')
        if not config['templateId']:
            missing_fields.append('EMAILJS_TEMPLATE_ID')
            
        if missing_fields:
            app.logger.error(f"Missing EmailJS credentials in environment variables: {', '.join(missing_fields)}")
            return jsonify({"error": f"EmailJS configuration incomplete. Missing: {', '.join(missing_fields)}"}), 500
            
        return jsonify(config)
    except Exception as e:
        app.logger.error(f"Error in emailjs-config endpoint: {str(e)}")
        return jsonify({"error": f"Server error: {str(e)}"}), 500

# Register save functions to be called on exit
atexit.register(save_counters)
atexit.register(save_personal_scores)

if __name__ == '__main__':
    try:
        # Load existing counters and configuration
        load_counters()
        load_personal_scores()
        load_rotation_config()
        
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