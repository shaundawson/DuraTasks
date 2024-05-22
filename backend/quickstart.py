import os.path
from datetime import datetime
from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError

# If modifying these scopes, delete the file token.json.
SCOPES = ["https://www.googleapis.com/auth/calendar",
          "https://www.googleapis.com/auth/calendar.events",
          "https://www.googleapis.com/auth/tasks"]


def main():
    """Shows basic usage of the Google Calendar API and Google Tasks API.
    Prints the names and ids of the first 10 events and tasks the user has access to.
    """
    creds = None
    # The file token.json stores the user's access and refresh tokens, and is
    # created automatically when the authorization flow completes for the first
    # time.
    if os.path.exists("token.json"):
        creds = Credentials.from_authorized_user_file("token.json", SCOPES)
    # If there are no (valid) credentials available, let the user log in.
    if not creds or not creds.valid:
        if creds and creds.expired and creds.refresh_token:
            creds.refresh(Request())
        else:
            flow = InstalledAppFlow.from_client_secrets_file(
                "credentials.json", SCOPES
            )
            creds = flow.run_local_server(port=0)
        # Save the credentials for the next run
        with open("token.json", "w") as token:
            token.write(creds.to_json())

    # Access Google Calendar events
    try:
        calendar_service = build("calendar", "v3", credentials=creds)
        now = datetime.utcnow().isoformat() + 'Z'  # 'Z' indicates UTC time
        print('Getting the upcoming 10 events')
        events_result = calendar_service.events().list(
            calendarId='primary', timeMin=now,
            maxResults=10, singleEvents=True,
            orderBy='startTime').execute()
        events = events_result.get('items', [])

        if not events:
            print('No upcoming events found.')
        else:
            print('Upcoming 10 events:')
            for event in events:
                start = event['start'].get(
                    'dateTime', event['start'].get('date'))
                print(start, event['summary'])

    except HttpError as error:
        print(f'An error occurred accessing Calendar API: {error}')

    # Access Google Tasks
    try:
        tasks_service = build("tasks", "v1", credentials=creds)
        tasklists_result = tasks_service.tasklists().list().execute()
        tasklists = tasklists_result.get('items', [])

        if not tasklists:
            print('No task lists found.')
        else:
            print('Task lists:')
            for tasklist in tasklists:
                print(f"Task list: {tasklist['title']} ({tasklist['id']})")
                tasks_result = tasks_service.tasks().list(
                    tasklist=tasklist['id']).execute()
                tasks = tasks_result.get('items', [])
                if not tasks:
                    print('  No tasks found.')
                else:
                    for task in tasks:
                        print(f"  {task['title']} (due: {
                              task.get('due', 'No due date')})")

    except HttpError as error:
        print(f'An error occurred accessing Tasks API: {error}')


if __name__ == "__main__":
    main()
