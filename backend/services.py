# Import necessary modules
from datetime import datetime, timedelta, timezone
from googleapiclient.errors import HttpError
from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build
import json


# Functions that handle credentials
# Serialize credentials object to dictionary
def serialize_credentials(credentials):
    return {
        'token': credentials.token,
        'refresh_token': credentials.refresh_token,
        'token_uri': credentials.token_uri,
        'client_id': credentials.client_id,
        'client_secret': credentials.client_secret,
        'scopes': credentials.scopes,
        'expiry': credentials.expiry.isoformat() if credentials.expiry else None
    }


# Deserialize credentials dictionary to credentials object
def deserialize_credentials(creds_info):
    if 'expiry' in creds_info and creds_info['expiry']:
        creds_info['expiry'] = datetime.fromisoformat(creds_info['expiry'])
    return Credentials(**creds_info)


# Save credentials to session storage
def save_credentials_to_session(session, credentials):
    session['credentials'] = json.dumps(serialize_credentials(credentials))


# Get credentials from session storage
def get_credentials_from_session(session):
    creds_json = session.get('credentials')
    if creds_json:
        creds_info = json.loads(creds_json)
        return deserialize_credentials(creds_info)
    return None


# Task-related functions
# Create a new task
def create_task(service, tasklist='@default', title="New Task", due=None):
    new_task = {'title': title, 'due': due}
    try:
        return service.tasks().insert(tasklist=tasklist, body=new_task).execute()
    except Exception as e:
        return None


# Calendar-related functions
# Get free time slots within a specified time range
def get_free_times(calendar_service, time_min, time_max, duration=60):
    try:
        events_result = calendar_service.events().list(
            calendarId='primary', timeMin=time_min, timeMax=time_max, singleEvents=True, orderBy='startTime').execute()
        events = events_result.get('items', [])
        free_times = []
        start_time = datetime.fromisoformat(time_min[:-1])
        end_time = datetime.fromisoformat(time_max[:-1])
        last_end_time = start_time
        for event in events:
            event_start = datetime.fromisoformat(
                event['start'].get('dateTime')[:-1])
            event_end = datetime.fromisoformat(
                event['end'].get('dateTime')[:-1])
            if last_end_time + timedelta(minutes=duration) <= event_start:
                free_times.append((last_end_time, event_start))
            last_end_time = max(last_end_time, event_end)
        if last_end_time + timedelta(minutes=duration) <= end_time:
            free_times.append((last_end_time, end_time))
        return free_times
    except HttpError as error:
        return []


# Get tasks within a specified due date range
def get_tasks(task_service, due_min, due_max):
    try:
        task_lists = task_service.tasklists().list().execute()
        all_tasks = []
        for task_list in task_lists['items']:
            tasks = task_service.tasks().list(
                tasklist=task_list['id']).execute()
            for task in tasks.get('items', []):
                if 'due' in task and due_min <= task['due'] <= due_max:
                    all_tasks.append(task)
        return all_tasks
    except HttpError as error:
        return []


# Suggest time slots for tasks based on calendar events and other parameters
def suggest_time_slots(calendar_service, task_duration_minutes, latest_possible_date, priority, deadline, timeMin=None):
    try:
        task_duration_minutes = int(task_duration_minutes)

        utc_zone = timezone.utc
        if timeMin is None:
            timeMin = datetime.utcnow().replace(tzinfo=utc_zone)
        else:
            timeMin = datetime.fromisoformat(
                timeMin.replace('Z', '')).replace(tzinfo=utc_zone)

        deadline = datetime.fromisoformat(
            deadline.replace('Z', '')).replace(tzinfo=utc_zone)
        latest_date = datetime.fromisoformat(
            latest_possible_date.replace('Z', '')).replace(tzinfo=utc_zone)

        end_search_date = min(deadline, latest_date)

        events_result = calendar_service.events().list(
            calendarId='primary',
            timeMin=timeMin.isoformat(),
            timeMax=end_search_date.isoformat(),
            singleEvents=True,
            orderBy='startTime'
        ).execute()

        events = events_result.get('items', [])
        free_times = []
        last_end_time = timeMin

        for event in events:
            # Extract start and end times, checking if 'dateTime' or 'date' is used
            event_start_str = event['start'].get(
                'dateTime') or event['start'].get('date') + 'T00:00:00Z'
            event_end_str = event['end'].get(
                'dateTime') or event['end'].get('date') + 'T00:00:00Z'

            # Parse datetime strings, ensuring timezone info is handled properly
            event_start = datetime.fromisoformat(
                event_start_str).astimezone(utc_zone)
            event_end = datetime.fromisoformat(
                event_end_str).astimezone(utc_zone)

            if (event_start - last_end_time).total_seconds() >= task_duration_minutes * 60:
                free_times.append((last_end_time, event_start))

            last_end_time = max(last_end_time, event_end)

        if (end_search_date - last_end_time).total_seconds() >= task_duration_minutes * 60:
            free_times.append((last_end_time, end_search_date))

        return [(slot[0].isoformat(), slot[1].isoformat()) for slot in free_times]
    except Exception as e:
        raise ValueError(f"Error processing time slots: {str(e)}")


# Validate event input data
def validate_event_input(event_data):
    required_fields = ['summary', 'start', 'end']
    nested_required_fields = [('start', 'dateTime'), ('end', 'dateTime')]
    errors = []

    if not all(field in event_data for field in required_fields):
        errors.append("Missing required top-level fields in event data")

    # for field, subfield in nested_required_fields:
    #     if field not in event_data or subfield not in event_data[field]:
    #         errors.append(f"Missing required nested field {field}.{subfield} in event data")

    return errors


# Handle event planning based on suggested time slots
def handle_event_planning(calendar_service, task_service, suggest_time_slots, create_task):
    suggested_slots = suggest_time_slots(
        calendar_service, duration=60, latest_possible_date="2024-10-01T00:00:00Z")
    results = []
    for slot in suggested_slots:
        due_date = slot.isoformat() if isinstance(slot, datetime) else slot
        result = create_task(
            task_service, title="Prepare for event", due=due_date)
        results.append(result)
    return results
