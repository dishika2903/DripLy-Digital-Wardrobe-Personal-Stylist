import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Loader2 } from 'lucide-react';
import Logo from './Logo';

export default function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-brand-neutral-lightbg dark:bg-brand-neutral-darkbg flex flex-col items-center justify-center p-6 transition-colors duration-300">
        <div className="relative mb-4"><Logo className="h-12 w-12" /><Loader2 className="absolute -right-2 -bottom-1 h-4 w-4 animate-spin text-brand-purple-600" /></div>
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
