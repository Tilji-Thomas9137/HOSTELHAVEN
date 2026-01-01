import axios from 'axios';

const API_URL = '/api';



// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  // Add timeout to prevent hanging requests
  timeout: 10000, // 10 seconds
});

// Request interceptor - Add token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('hostelhaven_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - Handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Don't try to refresh token for auth endpoints (login, refresh-token, etc.)
    // These endpoints don't require authentication and shouldn't trigger refresh logic
    const isAuthEndpoint = originalRequest.url?.includes('/auth/login') ||
      originalRequest.url?.includes('/auth/refresh-token') ||
      originalRequest.url?.includes('/auth/logout');

    // Suppress 401 errors for notification endpoints when user is not authenticated
    // This happens when Notification component tries to fetch on login page
    const isNotificationEndpoint = originalRequest.url?.includes('/notifications');
    const isUnauthenticated = !localStorage.getItem('hostelhaven_token');

    if (error.response?.status === 401 && isNotificationEndpoint && isUnauthenticated) {
      // Silently fail - user is not logged in, so notifications can't be fetched
      error._suppressError = true;
      return Promise.reject(error);
    }

    // Suppress room allocation error toasts and console logs
    // Mark the error so components know not to show toast for this specific error
    if (error.response?.status === 403 &&
      error.response?.data?.message?.includes('room is allocated')) {
      // Set flags to prevent duplicate toasts and console errors
      originalRequest._suppressToast = true;
      originalRequest._suppressConsoleError = true;
      // Mark as expected error to prevent browser console logging
      error.isExpectedRoomAllocationError = true;
    }

    // If token expired, try to refresh (but not for auth endpoints)
    if (error.response?.status === 401 && !originalRequest._retry && !isAuthEndpoint) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('hostelhaven_refresh_token');
        if (!refreshToken) {
          throw new Error('Session expired. Please log in again.');
        }

        const response = await axios.post(`${API_URL}/auth/refresh-token`, {
          refreshToken,
        });

        const { token } = response.data;
        localStorage.setItem('hostelhaven_token', token);

        // Retry original request with new token
        originalRequest.headers.Authorization = `Bearer ${token}`;
        return api(originalRequest);
      } catch (refreshError) {
        // Refresh failed - set flag to allow error display before redirect
        // This prevents ProtectedRoute from redirecting immediately
        if (typeof window !== 'undefined') {
          sessionStorage.setItem('showAuthError', 'true');
        }

        // Clear auth - but ProtectedRoute will check the flag before redirecting
        localStorage.removeItem('hostelhaven_token');
        localStorage.removeItem('hostelhaven_refresh_token');
        localStorage.removeItem('hostelhaven_user');

        // Don't redirect here - let the error propagate to the component
        // The component will show the error, and ProtectedRoute will handle redirect
        // This allows users to see what went wrong before being redirected

        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default api;