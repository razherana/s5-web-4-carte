import { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/authService';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is logged in on mount
    const currentUser = authService.getCurrentUser();
    setUser(currentUser);
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    const data = await authService.login(email, password);
    setUser(data.user);
    return data;
  };

  const register = async (userData) => {
    const data = await authService.register(userData);
    setUser(data.user);
    return data;
  };

  const updateProfile = async (userData) => {
    const data = await authService.updateProfile(userData);
    setUser(data.user);
    return data;
  };

  const logout = () => {
    authService.logout();
    setUser(null);
  };

  const isManager = () => {
    return user?.role === 'manager' || user?.role === 'admin';
  };

  const value = {
    user,
    loading,
    login,
    register,
    updateProfile,
    logout,
    isAuthenticated: !!user,
    isManager,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
