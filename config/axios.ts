import axios from 'axios';
import { API_CONFIG } from './api';
import { getToken, clearToken, clearUser } from '../utils/storage';

// Create axios instance
const axiosInstance = axios.create({
  baseURL: API_CONFIG.BASE_URL,
  timeout: API_CONFIG.TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Flag to prevent multiple logout triggers
let isLoggingOut = false;

// List of public endpoints that don't require authentication
const PUBLIC_ENDPOINTS = [
  '/api/auth/login',
  '/api/auth/register',
  '/api/auth/oauth-login',
  '/api/auth/verify-otp',
  '/api/auth/forgot-password',
  '/api/auth/reset-password',
  '/api/auth/apple-signin',
  '/api/auth/apple-verify-code',
  '/api/user/logout', // Logout doesn't require auth - stateless JWT
];

// Request interceptor to add auth token
axiosInstance.interceptors.request.use(
  async (config) => {
    const token = await getToken();
    const isPublicEndpoint = PUBLIC_ENDPOINTS.some(ep => config.url?.includes(ep));
    
    console.log('📤 API Request:', config.method?.toUpperCase(), config.url);
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log('📤 Authorization header added');
    } else if (!isPublicEndpoint) {
      // Only warn about missing token for protected endpoints
      console.log('⚠️ No token available for protected request');
    }
    return config;
  },
  (error) => {
    console.error('❌ Request Error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
axiosInstance.interceptors.response.use(
  (response) => {
    console.log('✅ API Response:', response.status, response.config.url, response.data);
    return response;
  },
  async (error) => {
    console.error('❌ API Error:', {
      status: error.response?.status,
      url: error.config?.url,
      data: error.response?.data,
      message: error.message
    });
    
    if (error.response?.status === 401 && !isLoggingOut) {
      // Token expired or invalid - clear all auth data
      isLoggingOut = true;
      console.log('🔓 Token invalid, clearing auth data...');
      try {
        await clearToken();
        await clearUser();
      } catch (e) {
        console.error('Error clearing auth data:', e);
      }
      isLoggingOut = false;
      // The app should detect user is null and redirect to login
    }
    
    // Extract error message
    const errorMessage = 
      error.response?.data?.error || 
      error.response?.data?.message || 
      error.message || 
      'An error occurred';
    
    return Promise.reject(new Error(errorMessage));
  }
);

export default axiosInstance;
