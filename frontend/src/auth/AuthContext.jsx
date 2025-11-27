import React, { createContext, useState, useContext, useEffect } from "react";
import { login } from "../data/api";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    const username = localStorage.getItem("monitor_user");
    if (token && username) {
      setUser({ name: username, token });
    }
    setLoading(false);
  }, []);

  const authentication = async (username, password) => {
    try {
      const response = await login(username, password);

      if (response.data && response.data.token) {
        const { token, username: apiUser } = response.data;

        localStorage.setItem("access_token", token);
        localStorage.setItem("monitor_user", apiUser);

        setUser({ name: apiUser, token });
        return true;
      }
      return false;
    } catch (error) {
      return false;
    }
  };

  const logout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("monitor_user");
    setUser(null);
    window.location.href = "/login";
  };

  return (
    <AuthContext.Provider value={{ user, authentication, logout, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
