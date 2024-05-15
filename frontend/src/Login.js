import React from 'react';
import './App.css';
import { useNavigate } from 'react-router-dom';

function App() {
    let navigate = useNavigate();  // useNavigate hook to manage navigation
    const handleLogin = () => {
        window.location.href = 'https://127.0.0.1:5000/login';
    };

    return (
        <div className="App">
            <header className="App-header">
                <h1>Welcome to the Google Calendar App</h1>
                <button onClick={handleLogin}>Login with Google</button>
            </header>
        </div>
    );
}

export default App;