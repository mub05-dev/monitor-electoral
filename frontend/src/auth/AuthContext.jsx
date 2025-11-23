import React, { createContext, useState, useContext, useEffect } from 'react';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('monitor_token');
    if (token) setUser({ name: "Analista", token });
    setLoading(false);
  }, []);

  const login = (username, password) => {
    // Login Dummy: Usuario "admin", Password "admin"
    if (username === "admin" && password === "admin") {
      const token = "demo-token-123";
      localStorage.setItem('monitor_token', token);
      setUser({ name: username, token });
      return true;
    }
    return false;
  };

  const logout = () => {
    localStorage.removeItem('monitor_token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);