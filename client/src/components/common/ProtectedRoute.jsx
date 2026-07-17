import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Loader2 } from 'lucide-react';

export default function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-brand-neutral-lightbg dark:bg-brand-neutral-darkbg flex flex-col items-center justify-center p-6 transition-colors duration-300">
        <Loader2 className="h-10 w-10 text-brand-purple-600 animate-spin mb-4" />
        <p className="text-slate-500 dark:text-slate-400 font-medium text-sm animate-pulse">
          Setting up your wardrobe...
        </p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children ? children : <Outlet />;
}
