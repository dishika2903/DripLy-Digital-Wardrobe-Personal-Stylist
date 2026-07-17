import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './context/AuthContext';
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

const queryClient = new QueryClient();

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
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
              <Route path="/profile" element={<Profile />} />
              <Route path="/wardrobe/add" element={<AddClothing />} />
              <Route path="/wardrobe/edit/:id" element={<EditClothing />} />
              <Route path="/wardrobe/:id" element={<ClothingDetails />} />
              </Route>
            </Route>

            {/* Catch all redirect to root */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
}
