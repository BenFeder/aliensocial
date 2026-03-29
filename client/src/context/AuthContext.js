import React, { createContext, useState, useEffect } from 'react';
import { authAPI, setAuthToken } from '../api';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const token = localStorage.getItem('token');
    if (token) {
      setAuthToken(token);
      try {
        const response = await authAPI.getCurrentUser();
        setUser(response.data);
      } catch (error) {
        localStorage.removeItem('token');
        setAuthToken(null);
      }
    }
    setLoading(false);
  };

  const register = async (data) => {
    const response = await authAPI.register(data);
    setAuthToken(response.data.token);
    setUser(response.data.user);
    return response.data;
  };

  const login = async (data) => {
    const response = await authAPI.login(data);
    setAuthToken(response.data.token);
    setUser(response.data.user);
    return response.data;
  };

  const logout = () => {
    setAuthToken(null);
    setUser(null);
    localStorage.removeItem('token');
  };

  const updateUser = (userData) => {
    setUser(userData);
  };

  return (
    <AuthContext.Provider value={{ user, setUser, loading, register, login, logout, updateUser, checkAuth }}>
      {children}
    </AuthContext.Provider>
  );
};
