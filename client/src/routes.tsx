import React from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './modules/dashboard/Dashboard';
import Login from './modules/auth/Login';
import Signup from './modules/auth/Signup';
import ForgotPassword from './modules/auth/ForgotPassword';
import { useAuth } from './lib/AuthContext';

// Protected Route Guard
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen w-screen flex items-center justify-center bg-bg">
        <div className="text-sm font-semibold text-text-secondary">Loading AssetFlow...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

// Temporary stubs for other pages to prevent router crashes on navigation
const TempPlaceholder = ({ title }: { title: string }) => (
  <div className="p-24 bg-surface border border-border rounded">
    <h1 className="text-xl font-bold text-text-primary mb-12">{title}</h1>
    <p className="text-sm text-text-secondary">This section is currently under development in subsequent loops.</p>
  </div>
);

export const router = createBrowserRouter([
  {
    path: '/login',
    element: <Login />,
  },
  {
    path: '/signup',
    element: <Signup />,
  },
  {
    path: '/forgot-password',
    element: <ForgotPassword />,
  },
  {
    path: '/',
    element: (
      <ProtectedRoute>
        <Layout />
      </ProtectedRoute>
    ),
    children: [
      {
        path: '',
        element: <Dashboard />,
      },
      {
        path: 'assets',
        element: <TempPlaceholder title="Assets Directory" />,
      },
      {
        path: 'bookings',
        element: <TempPlaceholder title="Resource Booking" />,
      },
      {
        path: 'maintenance',
        element: <TempPlaceholder title="Maintenance Management" />,
      },
      {
        path: 'audits',
        element: <TempPlaceholder title="Asset Audits" />,
      },
      {
        path: 'org-setup',
        element: <TempPlaceholder title="Organization Setup" />,
      },
      {
        path: 'reports',
        element: <TempPlaceholder title="Reports & Analytics" />,
      },
    ],
  },
]);
