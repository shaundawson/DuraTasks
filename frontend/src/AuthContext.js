import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext({
    isAuthenticated: false,
    login: () => { },
    logout: () => { }
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    useEffect(() => {
        const token = localStorage.getItem('userToken');
        if (token) {
            setIsAuthenticated(true);
        }
    }, []);

    const login = () => {
        localStorage.setItem('userToken', 'yourTokenValue');
        setIsAuthenticated(true);
    };

    const logout = () => {
        localStorage.removeItem('userToken');
        setIsAuthenticated(false);
    };

    return (
        <AuthContext.Provider value={{ isAuthenticated, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};
