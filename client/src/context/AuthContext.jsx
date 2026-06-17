// =========================================================================
// React Authentication Context & Provider
// =========================================================================
import React, { createContext, useState, useEffect, useContext } from 'react';
import { loginUser, registerUser, getMe } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Check if user is logged in on mount
  useEffect(() => {
    const checkUserAuth = async () => {
      const token = localStorage.getItem('lexicore_token');
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const data = await getMe();
        if (data.success) {
          setUser(data.user);
        } else {
          // Token expired or invalid
          localStorage.removeItem('lexicore_token');
        }
      } catch (err) {
        console.error('Session validation failed:', err);
        localStorage.removeItem('lexicore_token');
      } finally {
        setLoading(false);
      }
    };

    checkUserAuth();
  }, []);

  // Login action
  const login = async (username, password) => {
    try {
      const data = await loginUser(username, password);
      if (data.success) {
        localStorage.setItem('lexicore_token', data.token);
        setUser(data.user);
        return { success: true };
      }
      return { success: false, message: data.message || 'Login failed' };
    } catch (err) {
      console.error(err);
      return { 
        success: false, 
        message: err.response?.data?.message || 'Invalid username or password' 
      };
    }
  };

  // Register action
  const register = async (username, email, password, role) => {
    try {
      const data = await registerUser(username, email, password, role);
      if (data.success) {
        localStorage.setItem('lexicore_token', data.token);
        setUser(data.user);
        return { success: true };
      }
      return { success: false, message: data.message || 'Registration failed' };
    } catch (err) {
      console.error(err);
      return { 
        success: false, 
        message: err.response?.data?.message || 'Registration failed' 
      };
    }
  };

  // Logout action
  const logout = () => {
    localStorage.removeItem('lexicore_token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
