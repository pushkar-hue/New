import os
import torch
import torchvision
from torchvision import transforms
from flask import Flask, render_template, request, jsonify, send_from_directory, session
from werkzeug.utils import secure_filename
from PIL import Image
import json
from datetime import datetime, timedelta
import google.generativeai as genai
from dotenv import load_dotenv
import base64
from report import generate_professional_report
from flask_cors import CORS
from flask_jwt_extended import JWTManager, create_access_token, create_refresh_token, get_jwt_identity, jwt_required, get_jwt
from werkzeug.security import generate_password_hash, check_password_hash
import uuid
from flask_socketio import SocketIO, emit, join_room, leave_room
import time
import secrets



app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})

# Load environment variables
load_dotenv()

# Configure Gemini API
api_key = os.getenv('GEMINI_API_KEY', 'AIzaSyC0OqN9ayyhNwWvbNLpKZNUhNuoMIfMAFQ')
genai.configure(api_key=api_key)
gemini_model = genai.GenerativeModel('gemini-1.5-pro')



app.config['JWT_SECRET_KEY'] = os.getenv('JWT_SECRET_KEY', secrets.token_hex(32))
app.config['JWT_ACCESS_TOKEN_EXPIRES'] = timedelta(hours=1)  # Shorter lifetime for access tokens
app.config['JWT_REFRESH_TOKEN_EXPIRES'] = timedelta(days=30)  # Longer lifetime for refresh tokens
app.config['JWT_ALGORITHM'] = 'HS256'
app.config['JWT_BLACKLIST_ENABLED'] = True
app.config['JWT_BLACKLIST_TOKEN_CHECKS'] = ['access', 'refresh']
jwt = JWTManager(app)

token_blocklist = set()



app.config['UPLOAD_FOLDER'] = 'uploads'
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB max upload
app.config['ALLOWED_EXTENSIONS'] = {'png', 'jpg', 'jpeg'}


socketio = SocketIO(app, cors_allowed_origins="*")

# Simple in-memory chat storage (use a database in production)
chat_messages = {}
chat_rooms = {}
video_rooms = {}
online_users = {} 


# Create upload folder if it doesn't exist
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)
os.makedirs("reports", exist_ok=True)  # Ensure the reports folder exists

# Define device
device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

# Define model information
MODELS = {
    'breast_cancer': {
        'file': 'models/breast_cancer_model.pth',
        'classes': ['Healthy', 'Sick'],
        'display_name': 'Breast Cancer Detection',
        'description': 'Detects potential breast cancer from histopathology images'
    },
    'covid19': {
        'file': 'models/covid19_model.pth',
        'classes': ['COVID', 'Lung_Opacity', 'Normal', 'Viral Pneumonia'],
        'display_name': 'COVID-19 Analysis',
        'description': 'Analyzes chest X-rays for COVID-19 and other lung conditions'
    },
    'malaria': {
        'file': 'models/malaria_model.pth',
        'classes': ['Parasitized', 'Uninfected'],
        'display_name': 'Malaria Detection',
        'description': 'Identifies malaria parasites in blood smear images'
    },
    'pneumonia': {
        'file': 'models/pneumonia_model.pth',
        'classes': ['NORMAL', 'PNEUMONIA'],
        'display_name': 'Pneumonia Detection',
        'description': 'Detects pneumonia in chest X-ray images'
    },
    'skin_cancer': {
        'file': 'models/skin_cancer_model.pth',
        'classes': ['benign', 'malignant'],
        'display_name': 'Skin Cancer Classification',
        'description': 'Classifies skin lesions as benign or malignant'
    },
    'tuberculosis': {
        'file': 'models/tb_model.pth',
        'classes': ['Normal', 'Tuberculosis'],
        'display_name': 'Tuberculosis Screening',
        'description': 'Screens chest X-rays for signs of tuberculosis'
    }
}

# Initialize model cache
model_cache = {}

# Add this after initializing model_cache 
def preload_models():
    """Preload all models at application startup"""
    print("Preloading models...")
    for model_key in MODELS.keys():
        try:
            load_model(model_key)
            print(f"Successfully preloaded {model_key} model")
        except Exception as e:
            print(f"Failed to preload {model_key} model: {str(e)}")
    print("Model preloading complete")

# Create a simple user database (in a real app, use a proper database)
users = {
    # Example users
    "user1@example.com": {
        "id": "user-1",
        "name": "John Doe",
        "email": "user1@example.com",
        "password": generate_password_hash("password123"),
        "role": "patient"
    },
    "doctor1@example.com": {
        "id": "doctor-1",
        "name": "Dr. Sarah Johnson",
        "email": "doctor1@example.com",
        "password": generate_password_hash("password123"),
        "role": "doctor",
        "specialty": "General Medicine",
        "availability": True,  # Indicates if doctor is available for calls
        "status": "online"  # Track online status
    }
}


@jwt.token_in_blocklist_loader
def check_if_token_is_revoked(jwt_header, jwt_payload):
    jti = jwt_payload["jti"]
    return jti in token_blocklist


@app.route('/api/register', methods=['POST'])
def register():
    data = request.json
    email = data.get('email')
    password = data.get('password')
    name = data.get('name')
    role = data.get('role', 'patient')
    specialty = data.get('specialty', 'General Medicine') if role == 'doctor' else None
    
    # Validate required fields
    if not email or not password or not name:
        return jsonify({"error": "Missing required fields"}), 400
    
    # Basic email validation
    if '@' not in email or '.' not in email:
        return jsonify({"error": "Invalid email format"}), 400
    
    # Password strength check
    if len(password) < 8:
        return jsonify({"error": "Password must be at least 8 characters"}), 400
    
    if email in users:
        return jsonify({"error": "Email already registered"}), 400
    
    # Generate user ID based on role
    user_id = f"{role}-{uuid.uuid4().hex[:8]}"
    
    # Create user with additional fields
    users[email] = {
        "id": user_id,
        "name": name,
        "email": email,
        "password": generate_password_hash(password),
        "role": role,
        "avatar": f"/placeholder.svg?height=40&width=40",
        "created_at": time.time(),
        "status": "online"
    }
    
    # Add specialty for doctors
    if role == 'doctor':
        users[email]["specialty"] = specialty
        users[email]["availability"] = True  # Initially available
    
    # Generate tokens
    access_token = create_access_token(identity=email)
    refresh_token = create_refresh_token(identity=email)
    
    return jsonify({
        "id": user_id,
        "name": name,
        "email": email,
        "role": role,
        "avatar": users[email]["avatar"],
        "access_token": access_token,
        "refresh_token": refresh_token
    }), 201

@app.route('/api/logout', methods=['POST'])
@jwt_required()
def logout():
    jti = get_jwt()["jti"]
    token_blocklist.add(jti)
    
    # Update user status to offline
    current_user_email = get_jwt_identity()
    if current_user_email in users:
        users[current_user_email]["status"] = "offline"
        
        # Notify other users about status change
        user_id = users[current_user_email]["id"]
        socketio.emit('user_status_change', {
            'user_id': user_id,
            'status': 'offline'
        }, broadcast=True)
    
    return jsonify({"success": True, "message": "Logged out successfully"}), 200



@app.route('/api/login', methods=['POST'])
def login():
    data = request.json
    email = data.get('email')
    password = data.get('password')
    
    if not email or not password:
        return jsonify({"error": "Missing email or password"}), 400
    
    user = users.get(email)
    if not user or not check_password_hash(user['password'], password):
        return jsonify({"error": "Invalid email or password"}), 401
    
    # Update user status to online
    user['status'] = "online"
    
    # Generate tokens
    access_token = create_access_token(identity=email)
    refresh_token = create_refresh_token(identity=email)
    
    # Notify other users about status change
    socketio.emit('user_status_change', {
        'user_id': user['id'],
        'status': 'online'
    }, broadcast=True)
    
    return jsonify({
        "id": user['id'],
        "name": user['name'],
        "email": user['email'],
        "role": user['role'],
        "access_token": access_token,
        "refresh_token": refresh_token
    }), 200


@app.route('/api/token/refresh', methods=['POST'])
@jwt_required(refresh=True)
def refresh_token():
    current_user_email = get_jwt_identity()
    access_token = create_access_token(identity=current_user_email)
    
    return jsonify({
        "access_token": access_token
    }), 200

@app.route('/api/doctors', methods=['GET'])
@jwt_required()
def get_doctors():
    """Get all available doctors with filtering options and real-time status"""
    current_user_email = get_jwt_identity()
    current_user = users.get(current_user_email)
    
    if not current_user:
        return jsonify({"error": "User not found"}), 404
    
    # Get query parameters for filtering
    specialty = request.args.get('specialty')
    name_search = request.args.get('name')
    availability = request.args.get('availability')  # Filter by availability
    
    doctors = []
    for user in users.values():
        if user['role'] != 'doctor':
            continue
            
        # Skip if specialty filter is applied and doesn't match
        if specialty and user.get('specialty', '') != specialty:
            continue
            
        # Skip if name search is applied and doesn't match
        if name_search and name_search.lower() not in user['name'].lower():
            continue
            
        # Skip if availability filter is applied and doesn't match
        if availability and str(user.get('availability', False)).lower() != availability.lower():
            continue
            
        # Check if there's an existing chat room with this doctor
        existing_room = None
        for room_id, room in chat_rooms.items():
            if (current_user['id'] in room['participants'] and 
                user['id'] in room['participants']):
                existing_room = room_id
                break
                
        doctors.append({
            'id': user['id'],
            'name': user['name'],
            'email': user['email'],
            'avatar': user.get('avatar', f"/placeholder.svg?height=40&width=40"),
            'specialty': user.get('specialty', 'General Medicine'),
            'status': user.get('status', 'offline'),
            'availability': user.get('availability', False),
            'existing_chat_room': existing_room
        })
    
    return jsonify(doctors), 200


@app.route('/api/doctors/search', methods=['GET'])
@jwt_required()
def search_doctors():
    """Search doctors by name, specialty, or availability"""
    current_user_email = get_jwt_identity()
    current_user = users.get(current_user_email)
    
    if not current_user:
        return jsonify({"error": "User not found"}), 404
    
    # Get search parameters
    search_query = request.args.get('query', '').lower()
    specialty = request.args.get('specialty')
    availability = request.args.get('availability')
    
    matching_doctors = []
    
    for user in users.values():
        if user['role'] != 'doctor':
            continue
            
        # Apply filters
        name_match = search_query in user['name'].lower() if search_query else True
        specialty_match = user.get('specialty') == specialty if specialty else True
        availability_match = str(user.get('availability', False)).lower() == availability.lower() if availability else True
        
        # Check if doctor matches all criteria
        if name_match and specialty_match and availability_match:
            # Check if there's an existing chat room with this doctor
            existing_room = None
            for room_id, room in chat_rooms.items():
                if (current_user['id'] in room['participants'] and 
                    user['id'] in room['participants']):
                    existing_room = room_id
                    break
                    
            matching_doctors.append({
                'id': user['id'],
                'name': user['name'],
                'email': user['email'],
                'avatar': user.get('avatar', f"/placeholder.svg?height=40&width=40"),
                'specialty': user.get('specialty', 'General Medicine'),
                'status': user.get('status', 'offline'),
                'availability': user.get('availability', False),
                'existing_chat_room': existing_room
            })
    
    return jsonify(matching_doctors), 200

@app.route('/api/video/call-doctor/<doctor_id>', methods=['POST'])
@jwt_required()
def call_specific_doctor(doctor_id):
    current_user_email = get_jwt_identity()
    user = users.get(current_user_email)
    
    if not user:
        return jsonify({"error": "User not found"}), 404
    
    # Verify the user is a patient
    if user['role'] != 'patient':
        return jsonify({"error": "Only patients can initiate doctor calls"}), 403
    
    # Find the requested doctor
    doctor = None
    for u in users.values():
        if u['id'] == doctor_id and u['role'] == 'doctor':
            doctor = u
            break
            
    if not doctor:
        return jsonify({"error": "Doctor not found"}), 404
        
    if not doctor.get('availability', False):
        return jsonify({"error": "Doctor is not available right now"}), 400
    
    # Generate a unique room ID
    room_id = f"room-{secrets.token_hex(6)}"
    
    # Create the room with patient and doctor
    video_rooms[room_id] = {
        'id': room_id,
        'creator': user['id'],
        'created_at': time.time(),
        'participants': [user['id'], doctor['id']],
        'active': True,
        'patient_id': user['id'],
        'doctor_id': doctor['id'],
        'ended_by': None,
        'end_time': None
    }
    
    # Notify the doctor about the new video call
    socketio.emit('video_call_request', {
        'room_id': room_id,
        'patient_name': user['name'],
        'patient_id': user['id']
    }, room=doctor['id'])
    
    return jsonify({
        'room_id': room_id,
        'creator': user['name'],
        'doctor': {
            'id': doctor['id'],
            'name': doctor['name'],
            'specialty': doctor.get('specialty', 'General Medicine')
        },
        'created_at': video_rooms[room_id]['created_at']
    }), 201


@app.route('/api/doctors/availability', methods=['POST'])
@jwt_required()
def update_doctor_availability():
    current_user_email = get_jwt_identity()
    user = users.get(current_user_email)
    
    if not user:
        return jsonify({"error": "User not found"}), 404
    
    if user['role'] != 'doctor':
        return jsonify({"error": "Only doctors can update availability"}), 403
    
    data = request.json
    availability = data.get('availability')
    
    if availability is None:
        return jsonify({"error": "Availability status is required"}), 400
    
    # Update availability
    user['availability'] = bool(availability)
    
    # Notify all users about the change
    socketio.emit('doctor_availability_change', {
        'doctor_id': user['id'],
        'availability': user['availability']
    }, broadcast=True)
    
    return jsonify({
        "success": True,
        "availability": user['availability']
    }), 200



@app.route('/api/user', methods=['GET'])
@jwt_required()
def get_user():
    current_user_email = get_jwt_identity()
    user = users.get(current_user_email)
    
    if not user:
        return jsonify({"error": "User not found"}), 404
    
    return jsonify({
        "id": user['id'],
        "name": user['name'],
        "email": user['email'],
        "role": user['role']
    }), 200


@app.route('/api/chat/history/<room_id>', methods=['GET'])
@jwt_required()
def get_chat_history(room_id):
    current_user_email = get_jwt_identity()
    user = users.get(current_user_email)
    
    if not user:
        return jsonify({"error": "User not found"}), 404
    
    # Check if user has access to this chat room
    if room_id not in chat_rooms or user['id'] not in chat_rooms[room_id]['participants']:
        return jsonify({"error": "Access denied"}), 403
    
    messages = chat_messages.get(room_id, [])
    
    return jsonify(messages), 200

@app.route('/api/chat/rooms', methods=['GET'])
@jwt_required()
def get_chat_rooms():
    current_user_email = get_jwt_identity()
    user = users.get(current_user_email)
    
    if not user:
        return jsonify({"error": "User not found"}), 404
    
    user_rooms = []
    for room_id, room in chat_rooms.items():
        if user['id'] in room['participants']:
            # Get the other participant
            other_participant_id = next((p for p in room['participants'] if p != user['id']), None)
            other_participant = next((u for u in users.values() if u['id'] == other_participant_id), None)
            
            # Get the last message
            messages = chat_messages.get(room_id, [])
            last_message = messages[-1] if messages else None
            
            user_rooms.append({
                "id": room_id,
                "name": room['name'],
                "other_participant": {
                    "id": other_participant['id'],
                    "name": other_participant['name'],
                    "role": other_participant['role']
                } if other_participant else None,
                "last_message": last_message,
                "unread_count": sum(1 for m in messages if not m['read'] and m['sender_id'] != user['id'])
            })
    
    return jsonify(user_rooms), 200

# Socket.IO events
@socketio.on('connect')
def handle_connect():
    print('Client connected')

@socketio.on('disconnect')
def handle_disconnect():
    """Update user status when disconnected"""
    sid = request.sid
    if sid in online_users:
        user_id = online_users[sid]
        
        # Find user by ID
        for u in users.values():
            if u['id'] == user_id:
                u['status'] = 'offline'
                break
                
        # Notify other users
        socketio.emit('user_status_change', {
            'user_id': user_id,
            'status': 'offline'
        }, skip_sid=sid)  # skip_sid ensures the message isn't sent back to the disconnecting client
                
        # Remove from tracking
        del online_users[sid]
        

@socketio.on('join')
def handle_join(data):
    room = data['room']
    join_room(room)
    print(f'Client joined room: {room}')

@socketio.on('leave')
def handle_leave(data):
    room = data['room']
    leave_room(room)
    print(f'Client left room: {room}')

@socketio.on('video-offer')
def handle_video_offer(data):
    room = data['room']
    emit('video-offer', data, room=room, include_self=False)

@socketio.on('video-answer')
def handle_video_answer(data):
    room = data['room']
    emit('video-answer', data, room=room, include_self=False)


@socketio.on('ice-candidate')
def handle_ice_candidate(data):
    room = data['room']
    emit('ice-candidate', data, room=room, include_self=False)

@socketio.on('message')
def handle_message(data):
    room_id = data['room']
    message = data['message']
    sender_id = data['sender_id']
    sender_name = data['sender_name']
    
    # Create message object
    msg = {
        'id': str(uuid.uuid4()),
        'room_id': room_id,
        'sender_id': sender_id,
        'sender_name': sender_name,
        'content': message,
        'timestamp': time.time(),
        'read': False
    }
    
    # Store message
    if room_id not in chat_messages:
        chat_messages[room_id] = []
    chat_messages[room_id].append(msg)
    
    # Broadcast to room
    emit('message', msg, room=room_id)

@app.route('/api/video/create-room', methods=['POST'])
@jwt_required()
def create_video_room():
    current_user_email = get_jwt_identity()
    user = users.get(current_user_email)
    
    if not user:
        return jsonify({"error": "User not found"}), 404
    
    data = request.json or {}
    specific_doctor_id = data.get('doctor_id')  # Optional: Request a specific doctor
    
    # Generate a unique room ID
    room_id = f"room-{secrets.token_hex(6)}"
    
    if user['role'] == 'patient':
        # If specific doctor requested
        if specific_doctor_id:
            # Find the requested doctor
            doctor = None
            for u in users.values():
                if u['id'] == specific_doctor_id and u['role'] == 'doctor':
                    doctor = u
                    break
                    
            if not doctor:
                return jsonify({"error": "Doctor not found"}), 404
                
            if not doctor.get('availability', False):
                return jsonify({"error": "Doctor is not available right now"}), 400
                
            if doctor.get('status', 'offline') != 'online':
                return jsonify({"error": "Doctor is currently offline"}), 400
        else:
            # Auto-assign an available doctor
            available_doctors = [u for u in users.values() 
                               if u['role'] == 'doctor' 
                               and u.get('availability', False)
                               and u.get('status', 'offline') == 'online']
            
            if not available_doctors:
                return jsonify({"error": "No doctors available at this time"}), 404
            
            # Select the first available doctor (could be improved with load balancing)
            doctor = available_doctors[0]
        
        # Create the room with patient and doctor
        video_rooms[room_id] = {
            'id': room_id,
            'creator': user['id'],
            'created_at': time.time(),
            'participants': [user['id'], doctor['id']],
            'active': True,
            'patient_id': user['id'],
            'doctor_id': doctor['id'],
            'ended_by': None,
            'end_time': None,
            'call_status': 'pending'  # New field to track call status
        }
        
        # Notify the doctor about the new video call
        socketio.emit('video_call_request', {
            'room_id': room_id,
            'patient_name': user['name'],
            'patient_id': user['id'],
            'patient_avatar': user.get('avatar', f"/placeholder.svg?height=40&width=40")
        }, room=doctor['id'])
        
        return jsonify({
            'room_id': room_id,
            'creator': user['name'],
            'doctor': {
                'id': doctor['id'],
                'name': doctor['name'],
                'specialty': doctor.get('specialty', 'General Medicine'),
                'avatar': doctor.get('avatar', f"/placeholder.svg?height=40&width=40")
            },
            'created_at': video_rooms[room_id]['created_at'],
            'call_status': 'pending'
        }), 201
    
    elif user['role'] == 'doctor':
        # Doctors can create a room for an invited patient
        patient_id = data.get('patient_id')
        
        if not patient_id:
            return jsonify({"error": "Patient ID is required"}), 400
        
        # Find the patient
        patient = None
        for u in users.values():
            if u['id'] == patient_id and u['role'] == 'patient':
                patient = u
                break
                
        if not patient:
            return jsonify({"error": "Patient not found"}), 404
        
        # Create the room
        video_rooms[room_id] = {
            'id': room_id,
            'creator': user['id'],
            'created_at': time.time(),
            'participants': [user['id'], patient['id']],
            'active': True,
            'patient_id': patient['id'],
            'doctor_id': user['id'],
            'ended_by': None,
            'end_time': None,
            'call_status': 'pending'  # New field to track call status
        }
        
        # Notify the patient about the new video call
        socketio.emit('video_call_request', {
            'room_id': room_id,
            'doctor_name': user['name'],
            'doctor_id': user['id'],
            'doctor_avatar': user.get('avatar', f"/placeholder.svg?height=40&width=40"),
            'doctor_specialty': user.get('specialty', 'General Medicine')
        }, room=patient['id'])
        
        return jsonify({
            'room_id': room_id,
            'creator': user['name'],
            'patient': {
                'id': patient['id'],
                'name': patient['name'],
                'avatar': patient.get('avatar', f"/placeholder.svg?height=40&width=40")
            },
            'created_at': video_rooms[room_id]['created_at'],
            'call_status': 'pending'
        }), 201
    
@app.route('/api/video/join-room/<room_id>', methods=['POST'])
@jwt_required()
def join_video_room(room_id):
    current_user_email = get_jwt_identity()
    user = users.get(current_user_email)
    
    if not user:
        return jsonify({"error": "User not found"}), 404
    
    if room_id not in video_rooms:
        return jsonify({"error": "Room not found"}), 404
    
    room = video_rooms[room_id]
    
    if not room['active']:
        return jsonify({"error": "Room is no longer active"}), 400
    
    # Check if user is allowed to join this room
    if user['id'] not in room['participants']:
        return jsonify({"error": "You are not authorized to join this room"}), 403
    
    # Update call status when participants join
    if room.get('call_status') == 'pending':
        room['call_status'] = 'connected'
    
    # Get participant information
    participants = []
    for p_id in room['participants']:
        participant = None
        for u in users.values():
            if u['id'] == p_id:
                participant = {
                    'id': u['id'],
                    'name': u['name'],
                    'role': u['role'],
                    'avatar': u.get('avatar', f"/placeholder.svg?height=40&width=40"),
                    'specialty': u.get('specialty') if u['role'] == 'doctor' else None
                }
                break
        if participant:
            participants.append(participant)
    
    # Notify other participants that this user has joined
    socketio.emit('user_joined_video', {
        'room_id': room_id,
        'user': {
            'id': user['id'],
            'name': user['name'],
            'role': user['role'],
            'avatar': user.get('avatar', f"/placeholder.svg?height=40&width=40")
        }
    }, room=room_id)
    
    # Add Socket.IO listener for this room
    socketio.on_event('join_room', lambda data: socketio.join_room(room_id))
    
    return jsonify({
        'room_id': room_id,
        'participants': participants,
        'created_at': room['created_at'],
        'patient_id': room['patient_id'],
        'doctor_id': room['doctor_id'],
        'call_status': room.get('call_status', 'connected')
    }), 200

@app.route('/api/video/respond/<room_id>', methods=['POST'])
@jwt_required()
def respond_to_video_call(room_id):
    current_user_email = get_jwt_identity()
    user = users.get(current_user_email)
    
    if not user:
        return jsonify({"error": "User not found"}), 404
    
    if room_id not in video_rooms:
        return jsonify({"error": "Room not found"}), 404
    
    room = video_rooms[room_id]
    
    # Check if user is allowed to respond to this call
    if user['id'] not in room['participants']:
        return jsonify({"error": "You are not authorized for this room"}), 403
    
    data = request.json or {}
    response = data.get('response', 'accept')  # accept or reject
    
    # Update room status based on response
    if response == 'accept':
        room['call_status'] = 'accepted'
        
        # Get the other participant
        other_participant_id = next((p for p in room['participants'] if p != user['id']), None)
        
        # Notify the other participant about acceptance
        if other_participant_id:
            socketio.emit('video_call_accepted', {
                'room_id': room_id,
                'accepted_by': user['name'],
                'accepted_by_id': user['id']
            }, room=other_participant_id)
            
        return jsonify({
            'status': 'accepted',
            'room_id': room_id
        }), 200
    
    elif response == 'reject':
        room['active'] = False
        room['ended_by'] = user['id']
        room['end_time'] = time.time()
        room['call_status'] = 'rejected'
        room['end_reason'] = f"Call rejected by {user['name']}"
        
        # Get the other participant
        other_participant_id = next((p for p in room['participants'] if p != user['id']), None)
        
        # Notify the other participant about rejection
        if other_participant_id:
            socketio.emit('video_call_rejected', {
                'room_id': room_id,
                'rejected_by': user['name'],
                'rejected_by_id': user['id']
            }, room=other_participant_id)
            
        return jsonify({
            'status': 'rejected',
            'room_id': room_id
        }), 200
    
    else:
        return jsonify({"error": "Invalid response. Must be 'accept' or 'reject'"}), 400

@app.route('/api/video/end-room/<room_id>', methods=['POST'])
@jwt_required()
def end_video_room(room_id):
    current_user_email = get_jwt_identity()
    user = users.get(current_user_email)
    
    if not user:
        return jsonify({"error": "User not found"}), 404
    
    if room_id not in video_rooms:
        return jsonify({"error": "Room not found"}), 404
    
    room = video_rooms[room_id]
    
    # Check if user is a participant in this room
    if user['id'] not in room['participants']:
        return jsonify({"error": "You are not a participant in this room"}), 403
    
    # Only participants can end the room
    if user['id'] not in room['participants']:
        return jsonify({"error": "Only participants can end the room"}), 403
    
    data = request.json or {}
    end_reason = data.get('reason', 'Call ended by ' + user['name'])
    follow_up = data.get('follow_up')
    notes = data.get('notes')
    
    # Update room status
    room['active'] = False
    room['ended_by'] = user['id']
    room['end_time'] = time.time()
    room['end_reason'] = end_reason
    
    # If there are follow-up details or notes, save them
    if follow_up:
        room['follow_up'] = follow_up
        
    if notes:
        room['notes'] = notes
    
    # Notify all participants that the room has ended
    socketio.emit('video_room_ended', {
        'room_id': room_id,
        'ended_by': user['name'],
        'end_reason': end_reason,
        'follow_up': follow_up
    }, room=room_id)
    
    # If doctor ended the call and set follow-up, create a notification
    if user['role'] == 'doctor' and follow_up:
        patient_id = room['patient_id']
        # In a real app, you would store this in a notifications table
        socketio.emit('follow_up_notification', {
            'doctor_name': user['name'],
            'follow_up_date': follow_up,
            'notes': notes
        }, room=patient_id)
    
    return jsonify({
        'success': True,
        'ended_at': room['end_time'],
        'follow_up': follow_up if follow_up else None
    }), 200

@app.route('/api/video/rooms', methods=['GET'])
@jwt_required()
def get_video_rooms():
    current_user_email = get_jwt_identity()
    user = users.get(current_user_email)
    
    if not user:
        return jsonify({"error": "User not found"}), 404
    
    # Filter active rooms where user is a participant
    active_rooms = []
    for room_id, room in video_rooms.items():
        if user['id'] in room['participants'] and room['active']:
            # Get other participant info
            other_participant_id = next((p for p in room['participants'] if p != user['id']), None)
            other_participant = None
            
            for u in users.values():
                if u['id'] == other_participant_id:
                    other_participant = {
                        'id': u['id'],
                        'name': u['name'],
                        'role': u['role'],
                        'specialty': u.get('specialty') if u['role'] == 'doctor' else None
                    }
                    break
            
            active_rooms.append({
                'id': room_id,
                'created_at': room['created_at'],
                'other_participant': other_participant
            })
    
    return jsonify(active_rooms), 200

@app.route('/api/video/history', methods=['GET'])
@jwt_required()
def get_video_history():
    current_user_email = get_jwt_identity()
    user = users.get(current_user_email)
    
    if not user:
        return jsonify({"error": "User not found"}), 404
    
    # Get completed video calls for this user
    history = []
    for room_id, room in video_rooms.items():
        if user['id'] in room['participants'] and not room['active'] and room.get('end_time'):
            # Get other participant info
            other_participant_id = next((p for p in room['participants'] if p != user['id']), None)
            other_participant = None
            
            for u in users.values():
                if u['id'] == other_participant_id:
                    other_participant = {
                        'id': u['id'],
                        'name': u['name'],
                        'role': u['role']
                    }
                    break
            
            history.append({
                'id': room_id,
                'started_at': room['created_at'],
                'ended_at': room['end_time'],
                'duration': round((room['end_time'] - room['created_at']) / 60, 1),  # minutes
                'other_participant': other_participant,
                'follow_up': room.get('follow_up'),
                'notes': room.get('notes')
            })
    
    # Sort by start time (newest first)
    history.sort(key=lambda x: x['started_at'], reverse=True)
    
    return jsonify(history), 200


# Socket.IO events for video call signaling
@socketio.on('video-offer')
def handle_video_offer(data):
    room = data['room']
    emit('video-offer', data, room=room, include_self=False)

@socketio.on('user_connected')
def handle_user_connected(data):
    """Track online users"""
    user_id = data.get('user_id')
    if not user_id:
        return
        
    # Find user by ID
    user = None
    for u in users.values():
        if u['id'] == user_id:
            user = u
            break
            
    if user:
        # Update user status
        user['status'] = 'online'
        # Associate socket ID with user ID
        online_users[request.sid] = user_id
        
        # Notify other users
        socketio.emit('user_status_change', {
            'user_id': user_id,
            'status': 'online'
        }, to=None)


@socketio.on('video-answer')
def handle_video_answer(data):
    room = data['room']
    emit('video-answer', data, room=room, include_self=False)

@socketio.on('ice-candidate')
def handle_ice_candidate(data):
    room = data['room']
    emit('ice-candidate', data, room=room, include_self=False)

@socketio.on('leave-room')
def handle_leave_room(data):
    room = data['room']
    leave_room(room)
    emit('user-left', {'user_id': data['user_id']}, room=room)


def cleanup_stale_video_rooms():
    current_time = time.time()
    stale_threshold = 30 * 60  # 30 minutes
    
    for room_id, room in list(video_rooms.items()):
        # Check if room is active but has been open for too long
        if room['active'] and (current_time - room['created_at']) > stale_threshold:
            room['active'] = False
            room['end_time'] = current_time
            room['end_reason'] = "Call automatically ended due to inactivity"
            
            # Notify participants
            socketio.emit('video_room_ended', {
                'room_id': room_id,
                'ended_by': 'System',
                'end_reason': room['end_reason']
            }, room=room_id)

def load_model(model_key):
    """Load model if not already in cache"""
    if model_key not in model_cache:
        print(f"Loading model: {model_key}")
        
        # Initialize model architecture
        model = torchvision.models.efficientnet_b0(weights=None)
        num_classes = len(MODELS[model_key]['classes'])
        
        model.classifier = torch.nn.Sequential(
            torch.nn.Dropout(p=0.5),
            torch.nn.Linear(model.classifier[1].in_features, num_classes)
        )
        
        # Load the saved weights
        model_path = MODELS[model_key]['file']
        try:
            loaded = torch.load(model_path, map_location=device)
            
            # Handle both full model and state_dict formats
            if isinstance(loaded, torch.nn.Module):  # Full model case
                model.load_state_dict(loaded.state_dict())
            else:  # State dict case
                model.load_state_dict(loaded)
                
            model.to(device)
            model.eval()
            model_cache[model_key] = model
            print(f"Model {model_key} loaded successfully")
        except Exception as e:
            print(f"Error loading model {model_key}: {str(e)}")
            return None
    
    return model_cache[model_key]


# Define image transformation for inference
test_transform = transforms.Compose([
    transforms.Resize((224, 224)),
    transforms.ToTensor(),
    transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
])

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in app.config['ALLOWED_EXTENSIONS']

def generate_enhanced_report(report_data, image_path, save_path):
    """
    Generate a comprehensive medical report using Gemini API.
    
    :param report_data: Dictionary containing prediction, confidence, and analysis.
    :param image_path: Path to the uploaded patient image.
    :param save_path: Path to save the generated PDF.
    """
    # Get model and prediction information
    model_name = report_data['display_name']
    prediction = report_data['prediction']
    confidence = report_data['confidence']
    
    # Create prompt for Gemini API
    prompt = f"""
    You are a medical AI assistant. Based on the image analysis performed by our {model_name} model,
    generate a comprehensive medical report. The image was classified as '{prediction}' with 
    {confidence:.2f}% confidence.
    
    The report should include:
    1. A detailed explanation of the detected condition
    2. Possible symptoms associated with this condition
    3. Common treatments and next steps
    4. Risk factors and preventive measures
    5. When the patient should seek immediate medical attention
    
    Format the report professionally as it will be included in a medical PDF.
    """
    
    # Encode the image
    with open(image_path, "rb") as img_file:
        encoded_image = base64.b64encode(img_file.read()).decode('utf-8')
    
    # Generate content with Gemini
    response = gemini_model.generate_content([
        prompt,
        {"mime_type": "image/jpeg", "data": encoded_image}
    ])
    
    # Extract the generated report content
    generated_report = response.text
    
    # Now generate the PDF with this enhanced content
    generate_pdf_with_gemini(report_data, image_path, save_path, generated_report)
    
    return generated_report

def generate_pdf_with_gemini(report_data, image_path, save_path, gemini_report):
    """
    Generate a medical PDF report with Gemini-enhanced content.
    """
    from reportlab.lib.pagesizes import letter
    from reportlab.pdfgen import canvas
    from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
    from reportlab.platypus import Paragraph, SimpleDocTemplate, Spacer, Image as RLImage
    from reportlab.lib.units import inch
    
    # Create a PDF document
    doc = SimpleDocTemplate(save_path, pagesize=letter)
    story = []
    
    # Add styles
    styles = getSampleStyleSheet()
    title_style = styles['Heading1']
    heading_style = styles['Heading2']
    normal_style = styles['Normal']
    
    # Add title
    story.append(Paragraph("AI-Powered Medical Diagnosis Report", title_style))
    story.append(Spacer(1, 0.2*inch))
    
    # Add date
    story.append(Paragraph(f"Date: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}", normal_style))
    story.append(Spacer(1, 0.1*inch))
    
    # Add image
    img = RLImage(image_path, width=3*inch, height=2*inch)
    story.append(img)
    story.append(Spacer(1, 0.2*inch))
    
    # Add model information
    story.append(Paragraph("Analysis Information", heading_style))
    story.append(Paragraph(f"Model Used: {report_data['display_name']}", normal_style))
    story.append(Paragraph(f"Detected Condition: {report_data['prediction']}", normal_style))
    story.append(Paragraph(f"Confidence: {report_data['confidence']:.2f}%", normal_style))
    
    # Add risk level
    risk_level = "High Risk" if report_data['confidence'] > 85 else "Moderate Risk" if report_data['confidence'] > 50 else "Low Risk"
    story.append(Paragraph(f"Risk Assessment: {risk_level}", normal_style))
    story.append(Spacer(1, 0.2*inch))
    
    # Add Gemini-generated report
    story.append(Paragraph("Detailed Medical Analysis", heading_style))
    # Split the report into paragraphs and add them
    for paragraph in gemini_report.split('\n\n'):
        if paragraph.strip():
            story.append(Paragraph(paragraph, normal_style))
            story.append(Spacer(1, 0.1*inch))
    
    # Disclaimer
    story.append(Spacer(1, 0.2*inch))
    disclaimer_style = ParagraphStyle(
        'Disclaimer', 
        parent=normal_style, 
        fontName='Helvetica-Oblique',
        fontSize=8
    )
    story.append(Paragraph("DISCLAIMER: This report is AI-generated and should not replace professional medical advice. Please consult with a healthcare provider for proper diagnosis and treatment.", disclaimer_style))
    
    # Build the PDF
    doc.build(story)

def get_gemini_chat_response(user_message):
    """Get response from Gemini API for chat"""
    # Create a medical context prompt
    context = """You are a helpful medical assistant chatbot for a medical diagnosis application. 
    Your purpose is to answer medical questions, explain conditions, and provide general health information.
    You should NOT attempt to diagnose specific conditions or prescribe treatments.
    Always clarify that users should consult healthcare professionals for proper diagnosis and treatment.
    Keep responses concise, accurate, and empathetic."""
    
    # Combine context and user message
    prompt = f"{context}\n\nUser: {user_message}\n\nAssistant:"
    
    # Call Gemini API
    response = gemini_model.generate_content(prompt)
    
    return response.text

@app.route('/')
def index():
    # Pass model information to the template
    return render_template('index.html', models=MODELS)

@app.route('/chat', methods=['GET'])
def chat_interface():
    """Render the chat interface page"""
    return render_template('chat.html')

@app.route('/api/chat', methods=['POST'])
def chat_with_gemini():
    """API endpoint for the chatbot"""
    data = request.json
    user_message = data.get('message', '')
    
    if not user_message:
        return jsonify({'error': 'No message provided'}), 400
    
    try:
        # Call Gemini API for chat response
        chat_response = get_gemini_chat_response(user_message)
        return jsonify({'response': chat_response})
    except Exception as e:
        print(f"Error in chat processing: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/models')
def get_models():
    return jsonify(MODELS)

@app.route('/predict', methods=['POST'])
def predict():
    if 'file' not in request.files:
        return jsonify({'error': 'No file part'}), 400
    
    file = request.files['file']
    model_key = request.form.get('model', 'skin_cancer')
    
    if model_key not in MODELS:
        return jsonify({'error': 'Invalid model selection'}), 400
    
    if file.filename == '':
        return jsonify({'error': 'No selected file'}), 400
    
    if file and allowed_file(file.filename):
        filename = secure_filename(file.filename)
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        file.save(filepath)
        
        try:
            # Load the selected model
            model = load_model(model_key)
            if model is None:
                return jsonify({'error': f'Failed to load model: {model_key}'}), 500
            
            # Open and transform the image
            img = Image.open(filepath).convert('RGB')
            img_tensor = test_transform(img).unsqueeze(0).to(device)
            
            # Get prediction
            with torch.no_grad():
                output = model(img_tensor)
                probabilities = torch.nn.functional.softmax(output, dim=1)[0]
                prediction = torch.argmax(probabilities).item()
            
            # Get class names for this model    
            class_names = MODELS[model_key]['classes']
            
            # Generate a PDF Report
            pdf_filename = f"report_{filename.rsplit('.', 1)[0]}.pdf"
            pdf_path = os.path.join("reports", pdf_filename)
            
            # Format the result
            result = {
                'prediction': class_names[prediction],
                'confidence': float(probabilities[prediction]) * 100,
                'model_used': model_key,
                'display_name': MODELS[model_key]['display_name'],
                'probabilities': {
                    class_names[i]: float(prob) * 100 
                    for i, prob in enumerate(probabilities)
                },
                'report_url': f"/reports/{pdf_filename}"
            }

            # Get enhanced report content from Gemini
            gemini_report = get_gemini_report_content(result, filepath)
            
            # Generate the professional PDF report
            generate_professional_report(result, filepath, pdf_path, gemini_report)
            
            # Add the report content to the result
            result['report_content'] = gemini_report

            return jsonify(result)
        
        except Exception as e:
            print(f"Error in prediction: {str(e)}")
            return jsonify({'error': str(e)}), 500
    
    return jsonify({'error': 'Invalid file type'}), 400

def get_gemini_report_content(report_data, image_path):
    """
    Get enhanced report content from Gemini API.
    
    :param report_data: Dictionary containing prediction, confidence, and analysis.
    :param image_path: Path to the uploaded patient image.
    :return: Generated report text
    """
    # Get model and prediction information
    model_name = report_data['display_name']
    prediction = report_data['prediction']
    confidence = report_data['confidence']
    
    # Create prompt for Gemini API
    prompt = f"""
    You are a medical reporting AI assistant. Based on the image analysis performed by our {model_name} model,
    generate a professional and structured medical report. The image was classified as '{prediction}' with 
    {confidence:.2f}% confidence.
    
    Format the report with the following sections, each with the title in bold followed by a colon:
    
    **Preliminary {model_name} Report:**
    [Brief introduction about the report and its purpose]
    
    **Detected Condition:**
    [Detailed explanation of the detected condition, what it means, and important caveats about AI interpretation]
    
    **Possible Symptoms:**
    [Common symptoms associated with this condition]
    
    **Common Treatments and Next Steps:**
    [Potential treatments and immediate recommended actions]
    
    **Risk Factors and Preventive Measures:**
    [Common risk factors and how to prevent or manage the condition]
    
    **When to Seek Immediate Medical Attention:**
    [Clear guidance on when the patient should seek immediate medical care]
    
    Format each section title with double asterisks and a colon like this: **Section Title:** followed by the content.
    Make the report professional, accurate, and include appropriate medical terminology while still being understandable to patients.
    """
    
    # Encode the image
    with open(image_path, "rb") as img_file:
        encoded_image = base64.b64encode(img_file.read()).decode('utf-8')
    
    # Generate content with Gemini
    response = gemini_model.generate_content([
        prompt,
        {"mime_type": "image/jpeg", "data": encoded_image}
    ])
    
    # Extract the generated report content
    return response.text

# Route to serve uploaded images (for preview purposes)
@app.route('/uploads/<filename>')
def uploaded_file(filename):
    return send_from_directory(app.config['UPLOAD_FOLDER'], filename)

@app.route('/reports/<filename>')
def download_report(filename):
    return send_from_directory("reports", filename, as_attachment=True)

@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def catch_all(path):
    # Create a models dictionary to pass to the template
    models = {
        'skin_cancer': {
            'display_name': 'Skin Cancer Detector',
            'description': 'Detects melanoma and other skin conditions',
            'classes': ['benign', 'malignant']
        },
        'covid': {
            'display_name': 'COVID-19 Detector',
            'description': 'Identifies COVID-19 from chest X-rays',
            'classes': ['Normal', 'COVID', 'Viral Pneumonia']
        },
        'pneumonia': {
            'display_name': 'Pneumonia Detector',
            'description': 'Detects pneumonia from chest X-rays',
            'classes': ['NORMAL', 'PNEUMONIA']
        },
        # Add other models as needed
    }
    
    return render_template('index.html', models=models)

@app.route('/symptom-checker')
def symptom_checker():
    """Render the symptom checker page"""
    return render_template('symptom_checker.html', models=MODELS)

@app.route('/api/check-symptoms', methods=['POST'])
def check_symptoms():
    """API endpoint for symptom analysis"""
    data = request.json
    symptoms = data.get('symptoms', '')
    age = data.get('age', '')
    gender = data.get('gender', '')
    medical_history = data.get('medicalHistory', '')
    
    if not symptoms:
        return jsonify({'error': 'No symptoms provided'}), 400
    
    try:
        # Format user information
        user_info = f"Patient Information:\nAge: {age}\nGender: {gender}\nMedical History: {medical_history}\n\nSymptoms: {symptoms}"
        
        # Create prompt for Gemini API
        prompt = f"""
        You are a medical triage assistant. Based on the following patient information and symptoms, provide:
        
        1. A list of possible conditions that match these symptoms (3-5 most likely)
        2. For each condition, indicate which of our diagnostic models would be most appropriate:
           - Breast Cancer Detection (for histopathology images)
           - COVID-19 Analysis (for chest X-rays)
           - Malaria Detection (for blood smear images)
           - Pneumonia Detection (for chest X-rays)
           - Skin Cancer Classification (for skin lesion images)
           - Tuberculosis Screening (for chest X-rays)
        3. Recommend what type of medical images would be most helpful for diagnosis
        4. Provide general precautionary advice
        
        Format your response with clearly labeled sections.
        
        IMPORTANT: Include a clear disclaimer that this is preliminary information only and not a medical diagnosis.
        
        Patient Information:
        {user_info}
        """
        
        # Call Gemini API
        response = gemini_model.generate_content(prompt)
        
        # Structure the response
        analysis = {
            'analysis': response.text,
            'recommended_models': determine_recommended_models(response.text)
        }
        
        return jsonify(analysis)
    
    except Exception as e:
        print(f"Error in symptom checking: {str(e)}")
        return jsonify({'error': str(e)}), 500

def determine_recommended_models(analysis_text):
    """Extract recommended models from the analysis text"""
    recommended = []
    
    for model_key, model_info in MODELS.items():
        if model_info['display_name'] in analysis_text:
            recommended.append({
                'key': model_key,
                'name': model_info['display_name'],
                'description': model_info['description']
            })
    
    # If no specific models were mentioned, return the first three as default options
    if not recommended:
        count = 0
        for model_key, model_info in MODELS.items():
            if count < 3:
                recommended.append({
                    'key': model_key,
                    'name': model_info['display_name'],
                    'description': model_info['description']
                })
                count += 1
    
    return recommended
def add_sample_users():
    """Add sample users for testing"""
    if "patient1@example.com" not in users:
        users["patient1@example.com"] = {
            "id": "patient-1",
            "name": "Jane Smith",
            "email": "patient1@example.com",
            "password": generate_password_hash("password123"),
            "role": "patient",
            "avatar": "/placeholder.svg?height=40&width=40",
            "status": "offline"
        }
    
    if "doctor2@example.com" not in users:
        users["doctor2@example.com"] = {
            "id": "doctor-2",
            "name": "Dr. Michael Chen",
            "email": "doctor2@example.com",
            "password": generate_password_hash("password123"),
            "role": "doctor",
            "specialty": "Cardiology",
            "avatar": "/placeholder.svg?height=40&width=40",
            "availability": True,
            "status": "offline"
        }
    
    if "doctor3@example.com" not in users:
        users["doctor3@example.com"] = {
            "id": "doctor-3",
            "name": "Dr. Emily Rodriguez",
            "email": "doctor3@example.com",
            "password": generate_password_hash("password123"),
            "role": "doctor",
            "specialty": "Dermatology",
            "avatar": "/placeholder.svg?height=40&width=40",
            "availability": False,
            "status": "offline"
        }

if __name__ == '__main__':
    # Create a JSON file with model info for the frontend
    with open('static/model_info.json', 'w') as f:
        json.dump(MODELS, f)
    
    # Add sample users
    add_sample_users()
    
    # Preload models
    preload_models()
    
    # Run stale room cleanup periodically
    from threading import Thread
    import time
    
    def background_cleanup():
        while True:
            time.sleep(300)  # Run every 5 minutes
            cleanup_stale_video_rooms()
    
    cleanup_thread = Thread(target=background_cleanup)
    cleanup_thread.daemon = True
    cleanup_thread.start()

    # Run the application with Socket.IO
    socketio.run(app, host="0.0.0.0", port=5000, debug=True, 
                 use_reloader=True,                  
                 log_output=True)