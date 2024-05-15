// src/index.js
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './Layout';
import App from './App';
import Calendar from './Calendar';
import TimeSlotSelector from './TimeSlotSelector';
import { AuthProvider } from './AuthContext';
import './index.css';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <Router>
      <AuthProvider>
        <Layout>
          <Routes>
            <Route path="/" element={<App />} />
            <Route path="/events" element={<Calendar />} />
            <Route path="/time-slots" element={<TimeSlotSelector />} />
          </Routes>
        </Layout>
      </AuthProvider>
    </Router>
  </React.StrictMode>
);
