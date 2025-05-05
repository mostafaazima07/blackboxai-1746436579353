import React, { createContext, useContext, useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import api from '../utils/api';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Initialize auth state from localStorage
  useEffect(() => {
    const token = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');

    if (token && storedUser) {
      const parsedUser = JSON.parse(storedUser);
      setUser(parsedUser);
      setIsAuthenticated(true);
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    }

    setLoading(false);
  }, []);

  const login = async (email, password) => {
    try {
      // Validate email domain
      if (!email.endsWith('@thewebvalue.com')) {
        throw new Error('Only @thewebvalue.com email addresses are allowed');
      }

      const response = await api.post('/auth/login', { email, password });
      const { token, user: userData } = response.data;

      // Store auth data
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(userData));
      
      // Update auth state
      setUser(userData);
      setIsAuthenticated(true);
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;

      toast.success('Login successful!');
      return true;
    } catch (error) {
      const message = error.response?.data?.message || error.message || 'Login failed';
      toast.error(message);
      return false;
    }
  };

  const logout = () => {
    // Clear auth data
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    
    // Reset auth state
    setUser(null);
    setIsAuthenticated(false);
    delete api.defaults.headers.common['Authorization'];

    toast.info('Logged out successfully');
  };

  const updateProfile = async (userData) => {
    try {
      const response = await api.put(`/users/${user.id}`, userData);
      const updatedUser = response.data.data;

      // Update stored user data
      localStorage.setItem('user', JSON.stringify(updatedUser));
      setUser(updatedUser);

      toast.success('Profile updated successfully');
      return true;
    } catch (error) {
      const message = error.response?.data?.message || error.message || 'Profile update failed';
      toast.error(message);
      return false;
    }
  };

  const changePassword = async (currentPassword, newPassword) => {
    try {
      await api.put('/auth/updatepassword', {
        currentPassword,
        newPassword
      });

      toast.success('Password changed successfully');
      return true;
    } catch (error) {
      const message = error.response?.data?.message || error.message || 'Password change failed';
      toast.error(message);
      return false;
    }
  };

  const forgotPassword = async (email) => {
    try {
      // Validate email domain
      if (!email.endsWith('@thewebvalue.com')) {
        throw new Error('Only @thewebvalue.com email addresses are allowed');
      }

      await api.post('/auth/forgotpassword', { email });
      toast.success('Password reset email sent');
      return true;
    } catch (error) {
      const message = error.response?.data?.message || error.message || 'Password reset request failed';
      toast.error(message);
      return false;
    }
  };

  const resetPassword = async (token, password) => {
    try {
      await api.put(`/auth/resetpassword/${token}`, { password });
      toast.success('Password reset successful');
      return true;
    } catch (error) {
      const message = error.response?.data?.message || error.message || 'Password reset failed';
      toast.error(message);
      return false;
    }
  };

  // Check if token is expired or invalid
  const checkAuthStatus = async () => {
    try {
      await api.get('/auth/me');
      return true;
    } catch (error) {
      if (error.response?.status === 401) {
        logout();
      }
      return false;
    }
  };

  const value = {
    user,
    loading,
    isAuthenticated,
    login,
    logout,
    updateProfile,
    changePassword,
    forgotPassword,
    resetPassword,
    checkAuthStatus
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthContext;
