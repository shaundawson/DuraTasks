import os
from dotenv import load_dotenv
from flask import Flask, request, jsonify, session, redirect, url_for, abort
from flask_cors import CORS
from flask_session import Session
from google_auth_oauthlib.flow import Flow
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError
from services import save_credentials_to_session, get_credentials_from_session, validate_event_input
from datetime import datetime, timedelta
import logging
import json

# Load environment variables from .env file
load_dotenv()

# Configuration for OAuth with Google APIs
CLIENT_SECRETS_FILE = "credentials.json"  # Path to the client secret JSON file
SCOPES = ["https://www.googleapis.com/auth/calendar",
          "https://www.googleapis.com/auth/calendar.events",
          "https://www.googleapis.com/auth/tasks"]  # Required Google API scopes
# Retrieve application secret key from .env file
APP_SECRET_KEY = os.getenv('APP_SECRET_KEY')

app = Flask(__name__)  # Instantiate a new Flask application
# Set the Flask app secret key for sessions
app.config['SECRET_KEY'] = APP_SECRET_KEY
# Secure session cookie setting, usually True in production
app.config['SESSION_COOKIE_SECURE'] = True
# HTTP-only setting to prevent JavaScript access to session cookie
app.config['SESSION_COOKIE_HTTPONLY'] = True
# SameSite cookie setting to avoid CSRF
app.config['SESSION_COOKIE_SAMESITE'] = 'None'
app.config['SESSION_TYPE'] = 'filesystem'  # Session storage type

Session(app)  # Initialize session management
CORS(app, supports_credentials=True, origins=["http://localhost:3000"], methods=[
     'GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'], allow_headers=['Content-Type', 'Authorization', 'X-Requested-With'])


def get_google_oauth_flow(state=None):
    """Create and return a Google OAuth Flow object."""
    return Flow.from_client_secrets_file(
        CLIENT_SECRETS_FILE, scopes=SCOPES, state=state,
        redirect_uri=url_for('oauth2callback', _external=True)
    )


@app.route('/')
def index():
    """Redirect to login if not authenticated, otherwise show events."""
    if 'credentials' not in session:
        return redirect(url_for('login'))
    return redirect(url_for('events'))


@app.route('/login')
def login():
    """Begin the OAuth process by redirecting to Google's authorization URL."""
    flow = get_google_oauth_flow()
    authorization_url, state = flow.authorization_url(
        access_type='offline', include_granted_scopes='true')
    session['state'] = state
    print(f"Login State Set: {state}")  # Debug log
    return redirect(authorization_url)


@app.route('/oauth2callback')
def oauth2callback():
    """Handle OAuth2 callback and store credentials in session."""
    state = request.args.get('state', '')
    if session.get('state') != state:
        return "State mismatch error", 400
    flow = get_google_oauth_flow(state=state)
    flow.fetch_token(authorization_response=request.url)
    credentials = flow.credentials
    save_credentials_to_session(session, credentials)
    print("Credentials saved to session:", credentials)  # Debug log
    return redirect("http://localhost:3000/events")


@app.route('/events')
def events():
    """Fetch and return calendar events."""
    if 'credentials' not in session:
        return jsonify({"error": "Unauthorized"}), 401
    credentials = get_credentials_from_session(session)
    if not credentials or credentials.expired:
        return jsonify({"error": "Failed to load credentials"}), 500
    service = build('calendar', 'v3', credentials=credentials)

    now = datetime.utcnow()
    two_years_ago = (now - timedelta(days=2*365)).isoformat() + 'Z'
    two_years_from_now = (now + timedelta(days=2*365)).isoformat() + 'Z'

    events_result = service.events().list(
        calendarId='primary',
        timeMin=two_years_ago,
        timeMax=two_years_from_now,
        maxResults=1000,
        singleEvents=True,
        orderBy='startTime').execute()
    return jsonify(events_result.get('items', []))


@app.route('/create_event', methods=['POST'])
def create_event():
    """Create a new calendar event."""
    if 'credentials' not in session:
        return jsonify({"error": "No credentials"}), 401
    credentials = get_credentials_from_session(session)
    if not credentials or credentials.expired:
        return jsonify({"error": "Invalid or expired credentials"}), 401
    service = build('calendar', 'v3', credentials=credentials)
    try:
        event_data = request.json

        # Validate event data
        errors = validate_event_input(event_data)
        if errors:
            logging.error(f"Validation errors: {errors}")
            return jsonify({"error": "Invalid event data", "details": errors}), 400

        # Insert the event
        created_event = service.events().insert(
            calendarId='primary', body=event_data).execute()
        return jsonify(created_event), 201
    except HttpError as error:
        error_content = error.content.decode('utf-8')
        error_json = json.loads(error_content)
        return jsonify({"error": "API call failed", "details": error_json}), error.resp.status
    except Exception as e:
        return jsonify({"error": "Unexpected error", "details": str(e)}), 500


@app.route('/update_event/<event_id>', methods=['PUT', 'OPTIONS'])
def update_event(event_id):
    """Update a specified calendar event."""
    if request.method == 'OPTIONS':
        return '', 200  # Handle CORS preflight request

    if 'credentials' not in session:
        print("No credentials in session")  # Debug log
        return jsonify({"error": "Unauthorized - No credentials"}), 401

    credentials = get_credentials_from_session(session)
    if not credentials or credentials.expired:
        print("Failed to load credentials or credentials expired")  # Debug log
        return jsonify({"error": "Failed to load credentials"}), 500

    service = build('calendar', 'v3', credentials=credentials)

    try:
        event_data = request.json
        logging.info(f"Received event data for update: {event_data}")

        # Validate event data
        errors = validate_event_input(event_data)
        if errors:
            logging.error(f"Validation errors: {errors}")
            return jsonify({"error": "Invalid event data", "details": errors}), 400

        updated_event = service.events().update(
            calendarId='primary', eventId=event_id, body=event_data).execute()
        return jsonify(updated_event), 200
    except HttpError as error:
        logging.error(f"API call failed: {error}")
        return jsonify({"error": "API call failed", "details": str(error)}), error.resp.status
    except Exception as e:
        logging.error(f"Unexpected error: {e}")
        return jsonify({"error": "Unexpected error", "details": str(e)}), 500


@app.route('/events/<event_id>', methods=['DELETE', 'OPTIONS'])
def delete_event(event_id):
    """Delete a specified calendar event."""
    print("Session Data:", session)  # Debugging print statement
    if request.method == 'OPTIONS':
        return '', 200

    if 'credentials' not in session:
        return jsonify({"error": "Unauthorized - No credentials in"}), 401

    credentials = get_credentials_from_session(session)
    if not credentials or credentials.expired:
        return jsonify({"error": "Failed to load credentials"}), 500

    service = build('calendar', 'v3', credentials=credentials)

    try:
        service.events().delete(calendarId='primary', eventId=event_id).execute()
        return jsonify({"status": "success"}), 200
    except HttpError as error:
        return jsonify({"error": "Failed to delete event", "details": str(error)}), 400


@app.route('/tasks')
def tasks():
    if 'credentials' not in session:
        return jsonify({"error": "Unauthorized"}), 401
    credentials = get_credentials_from_session(session)
    if not credentials or credentials.expired:
        return jsonify({"error": "Failed to load credentials"}), 500

    service = build('tasks', 'v1', credentials=credentials)
    try:
        result = service.tasks().list(tasklist='@default').execute()
        return jsonify(result.get('items', []))
    except HttpError as error:
        return jsonify({"error": "API call failed", "details": str(error)}), error.resp.status


@app.route('/create_task', methods=['POST'])
def create_task_route():
    """Create a new task."""
    if 'credentials' not in session:
        return jsonify({"error": "No credentials"}), 401
    credentials = get_credentials_from_session(session)
    if not credentials or credentials.expired:
        return jsonify({"error": "Invalid or expired credentials"}), 401
    service = build('tasks', 'v1', credentials=credentials)
    try:
        task_data = request.json
        created_task = service.tasks().insert(
            tasklist='@default', body=task_data).execute()
        return jsonify(created_task), 201
    except HttpError as error:
        return jsonify({"error": "API call failed", "details": error}), error.resp.status


@app.route('/update_task/<task_id>', methods=['PUT', 'OPTIONS'])
def update_task(task_id):
    """Update a specified task."""
    if request.method == 'OPTIONS':
        return '', 200  # Handle CORS preflight request

    if 'credentials' not in session:
        return jsonify({"error": "Unauthorized - No credentials"}), 401

    credentials = get_credentials_from_session(session)
    if not credentials or credentials.expired:
        return jsonify({"error": "Failed to load credentials"}), 500

    service = build('tasks', 'v1', credentials=credentials)

    try:
        task_data = request.json
        updated_task = service.tasks().update(
            tasklist='@default', task=task_id, body=task_data).execute()
        return jsonify(updated_task), 200
    except HttpError as error:
        logging.error(f"API call failed: {error}")
        return jsonify({"error": "API call failed", "details": str(error)}), error.resp.status
    except Exception as e:
        logging.error(f"Unexpected error: {e}")
        return jsonify({"error": "Unexpected error", "details": str(e)}), 500


@app.route('/tasks/<task_id>', methods=['DELETE', 'OPTIONS'])
def delete_task(task_id):
    """Delete a specified task."""
    if request.method == 'OPTIONS':
        return '', 200

    if 'credentials' not in session:
        return jsonify({"error": "Unauthorized - No credentials"}), 401

    credentials = get_credentials_from_session(session)
    if not credentials or credentials.expired:
        return jsonify({"error": "Failed to load credentials"}), 500

    service = build('tasks', 'v1', credentials=credentials)

    try:
        service.tasks().delete(tasklist='@default', task=task_id).execute()
        return jsonify({"status": "success"}), 200
    except HttpError as error:
        return jsonify({"error": "Failed to delete task", "details": str(error)}), 400


if __name__ == "__main__":
    app.run(debug=True, port=5000, ssl_context=('cert.pem', 'key.pem'))
