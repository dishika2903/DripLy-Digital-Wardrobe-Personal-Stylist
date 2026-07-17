import React, { createContext, useContext, useState, useEffect } from 'react';
import * as authApi from '../services/api/auth';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Attempt to restore session silently on initial mount
  useEffect(() => {
    const checkSession = async () => {
      try {
        const res = await authApi.refreshSession();
        if (res?.success && res?.data?.user) {
          setUser(res.data.user);
        }
      } catch (err) {
        // Silent catch: user remains unauthenticated
      } finally {
        setLoading(false);
      }
    };
    checkSession();
  }, []);

  const login = async (credentials) => {
    setLoading(true);
    try {
      const res = await authApi.login(credentials);
      if (res?.success && res?.data?.user) {
        setUser(res.data.user);
      }
      return res;
    } finally {
      setLoading(false);
    }
  };

  const signup = async (details) => {
    setLoading(true);
    try {
      const res = await authApi.signup(details);
      if (res?.success && res?.data?.user) {
        setUser(res.data.user);
      }
      return res;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      await authApi.logout();
    } catch (err) {
      // Fail-safe cleanup
    } finally {
      setUser(null);
      setLoading(false);
    }
  };

  const logoutAll = async () => {
    setLoading(true);
    try {
      await authApi.logoutAll();
    } catch (err) {
      // Fail-safe cleanup
    } finally {
      setUser(null);
      setLoading(false);
    }
  };

  const updateProfile = async (details) => {
    const res = await authApi.updateProfile(details);
    if (res?.success && res?.data?.user) setUser(res.data.user);
    return res;
  };

  const value = {
    user,
    loading,
    login,
    signup,
    logout,
    logoutAll,
    updateProfile,
    isAuthenticated: !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
export default AuthContext;
