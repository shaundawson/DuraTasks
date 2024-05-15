import os
from dotenv import load_dotenv
from flask import Flask, request, jsonify, session, redirect, url_for, abort
from flask_cors import CORS
from flask_session import Session
from google_auth_oauthlib.flow import Flow
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError
from services import save_credentials_to_session, get_credentials_from_session, suggest_time_slots, create_task
from datetime import datetime, timedelta
import logging


# Load environment variables from .env file
load_dotenv()

# Configuration for OAuth and application
# Setting CLIENT_SECRETS_FILE variable to store the path of the JSON file containing OAuth client secrets
CLIENT_SECRETS_FILE = "credentials.json"
SCOPES = ["https://www.googleapis.com/auth/calendar",
          "https://www.googleapis.com/auth/calendar.events",
          # Setting SCOPES variable to store the required OAuth scopes
          "https://www.googleapis.com/auth/tasks"]
# Retrieving secret key from environment variables
APP_SECRET_KEY = os.getenv('APP_SECRET_KEY')

app = Flask(__name__)  # Creating Flask application instance
# Setting secret key for the application
app.config['SECRET_KEY'] = APP_SECRET_KEY
app.config['SESSION_COOKIE_SECURE'] = False  # Disabling secure session cookies
# Setting session cookies to be accessible only through HTTP
app.config['SESSION_COOKIE_HTTPONLY'] = True
# Setting SameSite attribute of session cookies to 'None'
app.config['SESSION_COOKIE_SAMESITE'] = 'None'
# Using filesystem-based session storage
app.config['SESSION_TYPE'] = 'filesystem'

Session(app)  # Initializing session handling
CORS(app, supports_credentials=True, origins=["http://localhost:3000"], methods=[
     # Enabling CORS for specific origins and methods
     'GET', 'POST', 'DELETE', 'OPTIONS'], allow_headers=['Content-Type', 'Authorization', 'X-Requested-With'])


# Function to create OAuth flow
def get_google_oauth_flow(state=None):
    return Flow.from_client_secrets_file(
        CLIENT_SECRETS_FILE, scopes=SCOPES, state=state,
        redirect_uri=url_for('oauth2callback', _external=True)
    )


def get_calendar_service(session):
    """Retrieve Google Calendar service using stored credentials."""
    credentials = get_credentials_from_session(
        session)  # Getting stored credentials from session
    if not credentials:  # If no credentials found
        return None
    # Building and returning Calendar service
    return build('calendar', 'v3', credentials=credentials)


@app.route('/')  # Route for the index page
def index():
    if 'credentials' not in session:  # If credentials are not stored in session
        return redirect(url_for('login'))  # Redirecting to the login route
    return redirect(url_for('events'))  # Redirecting to the events route


# Login route to initiate OAuth flow
@app.route('/login')  # Route for the login page
def login():
    flow = get_google_oauth_flow()  # Creating OAuth flow
    authorization_url, state = flow.authorization_url(  # Generating authorization URL and state
        access_type='offline', include_granted_scopes='true')
    session['state'] = state  # Storing state in session
    # Redirecting to Google's OAuth authorization URL
    return redirect(authorization_url)


# OAuth2 callback route
@app.route('/oauth2callback')  # Route for OAuth callback
def oauth2callback():
    state = request.args.get('state', '')  # Retrieving state from request
    if session.get('state') != state:  # If state mismatch
        return "State mismatch error", 400  # Return error response
    # Creating OAuth flow with provided state
    flow = get_google_oauth_flow(state=state)
    # Fetching token using authorization response
    flow.fetch_token(authorization_response=request.url)
    credentials = flow.credentials  # Retrieving credentials from flow
    save_credentials_to_session(
        session, credentials)  # Saving credentials to session
    # Redirecting to frontend events page
    return redirect("http://localhost:3000/events")


# Route to fetch events
@app.route('/events')  # Route for fetching events
def events():
    if 'credentials' not in session:  # If credentials are not stored in session
        # Return unauthorized error
        return jsonify({"error": "Unauthorized"}), 401
    credentials = get_credentials_from_session(
        session)  # Retrieving credentials from session
    if not credentials or credentials.expired:  # If no credentials or credentials expired
        # Return error
        return jsonify({"error": "Failed to load credentials"}), 500
    # Building Calendar service
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
    return jsonify(events_result.get('items', []))  # Returning fetched events


# Route to create an event
@app.route('/create_event', methods=['POST'])
def create_event():
    if 'credentials' not in session:  # If credentials are not stored in session
        return jsonify({"error": "No credentials"}), 401  # Return error
    credentials = get_credentials_from_session(
        session)  # Retrieving credentials from session
    if not credentials or credentials.expired:  # If no credentials or credentials expired
        # Return error
        return jsonify({"error": "Invalid or expired credentials"}), 401
    # Building Calendar service
    service = build('calendar', 'v3', credentials=credentials)
    try:
        event_data = request.json  # Getting event data from request
        created_event = service.events().insert(  # Creating event
            calendarId='primary', body=event_data).execute()
        return jsonify(created_event), 201  # Returning created event
    except HttpError as error:
        # Returning error
        return jsonify({"error": "API call failed", "details": error}), error.resp.status


# Route to delete an event
@app.route('/events/<event_id>', methods=['DELETE', 'OPTIONS'])
def delete_event(event_id):
    # Log session data for debugging:
    print("Session Data:", session)
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


# Route to create a task
@app.route('/create_event_with_task', methods=['POST'])
def create_event_with_task():
    if 'credentials' not in session:  # If credentials are not stored in session
        return jsonify({"error": "No credentials"}), 401  # Return error
    credentials = get_credentials_from_session(
        session)  # Retrieving credentials from session
    if not credentials or credentials.expired:  # If no credentials or credentials expired
        # Return error
        return jsonify({"error": "Invalid or expired credentials"}), 401
    try:
        # Building Calendar service
        calendar_service = build('calendar', 'v3', credentials=credentials)
        # Building Tasks service
        task_service = build('tasks', 'v1', credentials=credentials)
        event_data = request.json  # Getting event data from request
        created_event = calendar_service.events().insert(  # Creating event
            calendarId='primary', body=event_data).execute()
        # If task creation is requested
        if 'createTask' in event_data and event_data['createTask']:
            task_title = f"Prepare for {event_data['summary']}"
            create_task(task_service, title=task_title,
                        # Creating task
                        due=created_event['start']['dateTime'])
        return jsonify(created_event), 201  # Returning created event
    except HttpError as error:
        # Returning error
        return jsonify({"error": str(error)}), error.resp.status


# Route to suggest time slots based on calendar availability
@app.route('/suggest_time_slots', methods=['GET'])
def suggest_time_slots_route():
    try:
        task_duration_minutes = request.args.get(
            'duration', '60')  # Getting task duration from request
        # Getting latest possible date from request
        latest_possible_date = request.args.get('latestPossibleDate')
        # Getting priority from request
        priority = request.args.get('priority')
        # Getting deadline from request
        deadline = request.args.get('deadline')

        if not latest_possible_date or not priority or not deadline:  # If required parameters are missing
            # Return error
            return jsonify({"error": "Missing required parameters"}), 400

        # If credentials are not stored in session
        if 'credentials' not in session or not session['credentials']:
            # Return authentication error
            return jsonify({"error": "Authentication required"}), 401

        calendar_service = get_calendar_service(
            session)  # Getting Calendar service

        slots = suggest_time_slots(  # Suggesting time slots
            calendar_service=calendar_service,
            task_duration_minutes=task_duration_minutes,
            latest_possible_date=latest_possible_date,
            priority=priority,
            deadline=deadline
        )
        return jsonify(slots), 200  # Returning suggested time slots
    except ValueError as e:
        return jsonify({"error": str(e)}), 400  # Returning error
    except Exception as e:
        return jsonify({"error": str(e)}), 500  # Returning error


if __name__ == "__main__":
    app.run(debug=True, port=5000, ssl_context=(
        'cert.pem', 'key.pem'))
