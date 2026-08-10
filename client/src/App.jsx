import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import ProtectedRoute from './components/common/ProtectedRoute';
import Login from './pages/auth/login';
import Signup from './pages/auth/signup';
import ForgotPassword from './pages/auth/forgot-password';
import ResetPassword from './pages/auth/reset-password';
import Profile from './pages/profile';
import AddClothing from './pages/wardrobe/add-clothing';
import EditClothing from './pages/wardrobe/edit-clothing';
import ClothingDetails from './pages/wardrobe/clothing-details';
import DashboardLayout from './components/layout/DashboardLayout';
import Dashboard from './pages/dashboard';
import Wardrobe from './pages/wardrobe';
import Outfits from './pages/outfits';
import Laundry from './pages/laundry';
import Settings from './pages/settings';

// Every query previously defaulted to staleTime: 0, so navigating back to a page you'd
// already visited (dashboard -> wardrobe -> dashboard, etc.) always refetched from the
// network and showed a loading spinner again, even though nothing had changed. A short
// staleTime lets React Query reuse what's already in memory instead, which is what actually
// made the app feel slow to redisplay things — not the mutations themselves. Actions that
// change data (save, favorite, delete, rate) still explicitly invalidate the relevant
// queries, so you always see fresh data right after doing something.
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ThemeProvider>
        <BrowserRouter>
          <Routes>
            {/* Public Authentication Pages */}
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password/:token" element={<ResetPassword />} />

            {/* Secure Pages Protected by Guard */}
            <Route element={<ProtectedRoute />}>
              <Route element={<DashboardLayout />}>
              <Route path="/" element={<Dashboard />} />
              <Route path="/wardrobe" element={<Wardrobe />} />
              <Route path="/outfits" element={<Outfits />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/laundry" element={<Laundry />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/wardrobe/add" element={<AddClothing />} />
              <Route path="/wardrobe/edit/:id" element={<EditClothing />} />
              <Route path="/wardrobe/:id" element={<ClothingDetails />} />
              </Route>
            </Route>

            {/* Catch all redirect to root */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
        </ThemeProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
