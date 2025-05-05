import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ requireAdmin }) => {
  const { isAuthenticated, user, loading } = useAuth();
  const location = useLocation();

  // Show loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // Not authenticated - redirect to login
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check admin requirement
  if (requireAdmin && user.role !== 'admin') {
    return <Navigate to="/dashboard" replace />;
  }

  // Render child routes
  return <Outlet />;
};

export const AdminRoute = () => {
  return <ProtectedRoute requireAdmin={true} />;
};

export default ProtectedRoute;
