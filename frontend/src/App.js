import React, { useState, useEffect } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import { Button } from '@mui/material';
import './App.css';
import { useAuth } from './AuthContext';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faGoogle } from '@fortawesome/free-brands-svg-icons';

function App() {
  const { isAuthenticated, login } = useAuth();

  useEffect(() => {
    const token = localStorage.getItem('userToken');
    if (token) {
      login();
    }
  }, [login]);

  const handleLogin = () => {
    localStorage.setItem('userToken', 'yourTokenValue');
    login(); // Update authentication status
    window.location.href = 'https://127.0.0.1:5000/login';
  };

  return (
    <div className="App bg-light">
      <div className="jumbotron jumbotron-fluid bg-light text-dark p-5">
        <img src="https://www.iamsdawson.com/hubfs/Duratasks/Logo-01.png" className="img-fluid" alt="DuraTasks Logo" style={{ maxWidth: '25%', display: 'block', margin: '0 auto' }} />
        <h1 className="display-4" style={{ marginTop: '0rem', textAlign: 'center' }}>Your Daily Planner, Perfected</h1>
        <p className="lead" style={{ textAlign: 'center' }}>
          Organize your day effectively and sync seamlessly with Google Calendar.
        </p>
        <p className="lead" style={{ textAlign: 'center' }}>
          <Button style={{
            width: 240, height: 50, boxShadow: '1px 1px 1px grey', background: '#fff',
          }}
            onClick={handleLogin} >
            <FontAwesomeIcon icon={faGoogle} style={{ marginRight: '8px', fontSize: '1rem', verticalAlign: 'middle' }} />
            <span className="buttonText">Continue with Google</span>
          </Button>
        </p>
      </div>
      <hr className="my-4" />
    </div>
  );
}

export default App;
