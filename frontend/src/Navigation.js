import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from './AuthContext';

function Navigation() {
    const { isAuthenticated } = useAuth();

    if (!isAuthenticated) {
        return null;
    }

    return (
        <nav className="navbar navbar-expand-lg navbar-light bg-light">
            <div className="container-fluid">
                <Link className="navbar-brand" to="/">DuraTasks</Link>
                <div className="collapse navbar-collapse" id="navbarNav">
                    <ul className="navbar-nav">
                        <li className="nav-item">
                            <Link className="nav-link" to="/events">Calendar</Link>
                        </li>
                        <li className="nav-item">
                            <Link className="nav-link" to="/time-slots">Find Time Slot For Tasks</Link>
                        </li>
                    </ul>
                </div>
            </div>
        </nav>
    );
}

export default Navigation;
