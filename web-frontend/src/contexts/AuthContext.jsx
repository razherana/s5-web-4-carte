/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState } from "react";
import { authService } from "../services/authService";
import { toast } from "sonner";

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(authService.getCurrentUser());
  const [loading] = useState(false);

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

  const logout = async () => {
    await authService.logout();
    setUser(null);
  };

  const refreshToken = async () => {
    try {
      const data = await authService.refreshToken();
      if (data.user) {
        setUser(data.user);
      }
      return data;
    } catch (error) {
      // If refresh fails, logout the user
      setUser(null);
      toast.error("Session expired. Please log in again.");
      throw error;
    }
  };

  const fetchCurrentUser = async () => {
    try {
      const userData = await authService.fetchCurrentUser();
      setUser(userData);
      return userData;
    } catch (error) {
      toast.error("Failed to fetch user data. Please log in again.");
      throw error;
    }
  };

  const isManager = () => {
    return user?.role === "manager" || user?.role === "admin";
  };

  const value = {
    user,
    loading,
    login,
    register,
    updateProfile,
    logout,
    refreshToken,
    fetchCurrentUser,
    isAuthenticated: !!user,
    isManager,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
