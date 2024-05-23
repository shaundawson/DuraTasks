# DuraTasks

 A web app designed to manage your calendar events and tasks efficiently. With Google authentication, users can log in securely to manage their events and suggest time slots for tasks based on their existing schedule.

## Features

- **Google Authentication**: Secure login functionality using Google OAuth.
- **Event Management**: Create, view, and manage calendar events directly through the app.
- **Time Slot Suggestion**: Automatically suggest available time slots for tasks based on the user's calendar.
- **Responsive Design**: Built using Bootstrap, the app is fully responsive and accessible on various devices.

## Technologies Used

- **React**: A JavaScript library for building user interfaces.
- **Bootstrap**: For responsive design and styled components.
- **Flask**: A lightweight WSGI web application framework for the backend.
- **Google Calendar API**: To manage calendar events.
- **Google Tasks API**: To manage tasks within the user's Google account.
- **Axios**: Promise based HTTP client for making requests.


## Prerequisites

- Python 3
- Node.js
- npm (Node Package Manager)

## Setup Instructions

### Backend Setup

1. Navigate to the `backend` directory:

    ```
    cd backend
    ```

2. Create a virtual environment:

    ```
    python3 -m venv venv
    ```

3. Activate the virtual environment:

    - On macOS/Linux:
    
        ```
        source venv/bin/activate
        ```

    - On Windows (cmd):
    
        ```
        venv\Scripts\activate
        ```

4. Install dependencies:

    ```
    pip install -r requirements.txt
    ```

5. Create a file named `.env` in the `backend` directory and add the following environment variables:

    ```
    APP_SECRET_KEY=your_secret_key
    ```

6. Run the Flask app:

    ```
    flask run --cert adhoc
    ```

### Frontend Setup

1. Open a new terminal window/tab.

2. Navigate to the `frontend` directory:

    ```
    cd frontend
    ```

3. Install dependencies:

    ```
    npm install
    ```

## Running the Application

1. Ensure both the backend Flask app and frontend React app are running.

2. Open your web browser and go to [http://localhost:3000](http://localhost:3000) to access the application.

## Important Notes

- The backend Flask app runs on port 5000 by default.
- The frontend React app runs on port 3000 by default.
- Ensure the backend Flask app is running before starting the frontend React app.