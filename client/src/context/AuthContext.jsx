import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import * as authApi from '../services/api/auth';
import api from '../services/api/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const queryClient = useQueryClient();
  const pingRef = useRef(null);

  // Keep Render's free-tier server awake by pinging it every 10 min while
  // the user is logged in. Without this the server spins down after 15 min
  // of inactivity and the next AI classify call times out with a cold-start.
  useEffect(() => {
    if (user) {
      // Ping immediately so a freshly-logged-in session warms the server.
      api.get('/ping').catch(() => {});
      pingRef.current = setInterval(() => {
        api.get('/ping').catch(() => {}); // silent — we don't care about the response
      }, 10 * 60 * 1000); // every 10 minutes
    } else {
      clearInterval(pingRef.current);
    }
    return () => clearInterval(pingRef.current);
  }, [user]);

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
        queryClient.clear();
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
        queryClient.clear();
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
      queryClient.clear();
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
      queryClient.clear();
      setUser(null);
      setLoading(false);
    }
  };

  const updateProfile = async (details) => {
    const res = await authApi.updateProfile(details);
    if (res?.success && res?.data?.user) setUser(res.data.user);
    return res;
  };

  const setAuthenticatedUser = (nextUser) => setUser(nextUser);

  const value = {
    user,
    loading,
    login,
    signup,
    logout,
    logoutAll,
    updateProfile,
    setAuthenticatedUser,
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
