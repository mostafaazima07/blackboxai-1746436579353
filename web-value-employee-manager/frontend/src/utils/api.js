import axios from 'axios';
import { toast } from 'react-toastify';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add token to requests if it exists
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Handle response errors globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const message = error.response?.data?.message || error.message || 'An error occurred';
    
    // Handle specific error cases
    switch (error.response?.status) {
      case 401:
        // Unauthorized - clear auth data and redirect to login
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
        toast.error('Session expired. Please login again.');
        break;
      
      case 403:
        // Forbidden
        toast.error('You do not have permission to perform this action');
        break;
      
      case 404:
        // Not Found
        toast.error('Resource not found');
        break;
      
      case 422:
        // Validation Error
        if (error.response.data.errors) {
          error.response.data.errors.forEach((err) => {
            toast.error(err.msg);
          });
        } else {
          toast.error(message);
        }
        break;
      
      case 429:
        // Too Many Requests
        toast.error('Too many requests. Please try again later.');
        break;
      
      case 500:
        // Server Error
        toast.error('Server error. Please try again later.');
        break;
      
      default:
        // Generic Error
        toast.error(message);
    }

    return Promise.reject(error);
  }
);

// API endpoints
export const endpoints = {
  // Auth endpoints
  auth: {
    login: '/auth/login',
    logout: '/auth/logout',
    me: '/auth/me',
    updatePassword: '/auth/updatepassword',
    forgotPassword: '/auth/forgotpassword',
    resetPassword: (token) => `/auth/resetpassword/${token}`
  },

  // User endpoints
  users: {
    list: '/users',
    create: '/users',
    get: (id) => `/users/${id}`,
    update: (id) => `/users/${id}`,
    delete: (id) => `/users/${id}`,
    stats: (id) => `/users/${id}/stats`,
    search: '/users/search',
    bulk: {
      activate: '/users/bulk/activate',
      deactivate: '/users/bulk/deactivate'
    }
  },

  // Task endpoints
  tasks: {
    list: '/tasks',
    create: '/tasks',
    get: (id) => `/tasks/${id}`,
    update: (id) => `/tasks/${id}`,
    updateStatus: (id) => `/tasks/${id}/status`,
    comments: (id) => `/tasks/${id}/comments`,
    timeline: (id) => `/tasks/${id}/timeline`,
    search: '/tasks/search',
    analytics: '/tasks/analytics/overview',
    export: '/tasks/export',
    bulk: {
      updateStatus: '/tasks/bulk/update-status'
    }
  }
};

// Helper functions for common API operations
export const apiHelpers = {
  // Generic GET request with error handling
  async get(endpoint, config = {}) {
    try {
      const response = await api.get(endpoint, config);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Generic POST request with error handling
  async post(endpoint, data = {}, config = {}) {
    try {
      const response = await api.post(endpoint, data, config);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Generic PUT request with error handling
  async put(endpoint, data = {}, config = {}) {
    try {
      const response = await api.put(endpoint, data, config);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Generic DELETE request with error handling
  async delete(endpoint, config = {}) {
    try {
      const response = await api.delete(endpoint, config);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Upload file with progress tracking
  async uploadFile(endpoint, file, onProgress) {
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await api.post(endpoint, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          if (onProgress) {
            onProgress(percentCompleted);
          }
        }
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  }
};

export default api;
