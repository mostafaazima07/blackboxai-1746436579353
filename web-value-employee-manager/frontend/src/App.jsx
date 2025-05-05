import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import { useTranslation } from 'react-i18next';
import { AuthProvider, useAuth } from './context/AuthContext';

// Components
import Login from './components/Login';
import AdminDashboard from './components/AdminDashboard';
import EmployeeDashboard from './components/EmployeeDashboard';
import TaskCreate from './components/TaskCreate';
import TaskDetail from './components/TaskDetail';
import Profile from './components/Profile';
import AdminAddUser from './components/AdminAddUser';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';

// Styles
import 'react-toastify/dist/ReactToastify.css';
import './i18n/i18n';

const App = () => {
  const { i18n } = useTranslation();

  // Set document direction based on language
  React.useEffect(() => {
    document.dir = i18n.language === 'ar' ? 'rtl' : 'ltr';
  }, [i18n.language]);

  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-gray-50">
          <ToastContainer
            position="top-right"
            autoClose={5000}
            hideProgressBar={false}
            newestOnTop
            closeOnClick
            rtl={i18n.language === 'ar'}
            pauseOnFocusLoss
            draggable
            pauseOnHover
          />
          
          <AppContent />
        </div>
      </Router>
    </AuthProvider>
  );
};

const AppContent = () => {
  const { isAuthenticated, user } = useAuth();

  return (
    <>
      {isAuthenticated && <Navbar />}
      
      <main className="container mx-auto px-4 py-8">
        <Routes>
          {/* Public Routes */}
          <Route 
            path="/login" 
            element={!isAuthenticated ? <Login /> : <Navigate to="/dashboard" />} 
          />

          {/* Protected Routes */}
          <Route element={<ProtectedRoute />}>
            {/* Admin Routes */}
            <Route
              path="/admin/*"
              element={
                user?.role === 'admin' ? (
                  <Routes>
                    <Route path="dashboard" element={<AdminDashboard />} />
                    <Route path="users/add" element={<AdminAddUser />} />
                  </Routes>
                ) : (
                  <Navigate to="/dashboard" />
                )
              }
            />

            {/* Employee Routes */}
            <Route path="/dashboard" element={
              user?.role === 'admin' ? 
                <Navigate to="/admin/dashboard" /> : 
                <EmployeeDashboard />
            } />

            {/* Common Protected Routes */}
            <Route path="/tasks/create" element={<TaskCreate />} />
            <Route path="/tasks/:id" element={<TaskDetail />} />
            <Route path="/profile" element={<Profile />} />

            {/* Default Route */}
            <Route 
              path="/" 
              element={
                <Navigate 
                  to={user?.role === 'admin' ? '/admin/dashboard' : '/dashboard'} 
                />
              } 
            />
          </Route>

          {/* 404 Route */}
          <Route 
            path="*" 
            element={
              <div className="flex flex-col items-center justify-center min-h-screen">
                <h1 className="text-4xl font-bold text-gray-800 mb-4">404</h1>
                <p className="text-gray-600 mb-8">Page not found</p>
                <button
                  onClick={() => window.history.back()}
                  className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition-colors"
                >
                  Go Back
                </button>
              </div>
            }
          />
        </Routes>
      </main>
    </>
  );
};

export default App;
