import api from './api';

export const authService = {
  // Login
  login: async (username, password) => {
    try {
      const response = await api.post('/auth/login', { username, password });
      
      // Validate response structure
      if (!response.data) {
        throw new Error('Invalid response from server');
      }
      
      const { user, token, refreshToken } = response.data;

      // Validate required fields
      if (!user || !token) {
        throw new Error('Invalid response: missing user or token');
      }

      if (!refreshToken) {
        console.warn('Warning: No refresh token received from server');
        // Continue with login even if refresh token is missing
        // The user will need to log in again when token expires
      }

      // Store tokens and user data
      localStorage.setItem('hostelhaven_token', token);
      if (refreshToken) {
        localStorage.setItem('hostelhaven_refresh_token', refreshToken);
      }
      localStorage.setItem('hostelhaven_user', JSON.stringify(user));

      return { user, token, refreshToken };
    } catch (error) {
      // Re-throw with more context
      if (error.response) {
        // Server responded with error
        const message = error.response.data?.message || 'Login failed';
        throw new Error(message);
      } else if (error.request) {
        // Request made but no response (network error, server not running)
        throw new Error('Cannot connect to server. Please check if the backend is running.');
      } else {
        // Error in request setup
        throw error;
      }
    }
  },

  // Logout
  logout: async () => {
    try {
      await api.post('/auth/logout');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem('hostelhaven_token');
      localStorage.removeItem('hostelhaven_refresh_token');
      localStorage.removeItem('hostelhaven_user');
    }
  },

  // Get current user
  getMe: async () => {
    const response = await api.get('/auth/me');
    return response.data;
  },

  // First login password reset
  firstLoginReset: async (newPassword) => {
    const response = await api.put('/auth/first-login-reset', { newPassword });
    return response.data;
  },

  // Change password
  changePassword: async (currentPassword, newPassword) => {
    const response = await api.put('/auth/change-password', {
      currentPassword,
      newPassword,
    });
    return response.data;
  },

  // Forgot password
  forgotPassword: async (email) => {
    const response = await api.post('/auth/forgot-password', { email });
    return response.data;
  },

  // Reset password
  resetPassword: async (token, password) => {
    const response = await api.post('/auth/reset-password', { token, password });
    return response.data;
  },

  // Send WhatsApp OTP
  sendOTP: async (phone) => {
    try {
      const response = await api.post('/auth/send-otp', { phone });
      return response.data;
    } catch (error) {
      if (error.response) {
        const message = error.response.data?.message || 'Failed to send OTP';
        throw new Error(message);
      } else if (error.request) {
        throw new Error('Cannot connect to server. Please check if the backend is running.');
      } else {
        throw error;
      }
    }
  },

  // Verify WhatsApp OTP
  verifyOTP: async (phone, otp) => {
    try {
      const response = await api.post('/auth/verify-otp', { phone, otp });
      
      if (!response.data) {
        throw new Error('Invalid response from server');
      }
      
      const { user, token, refreshToken } = response.data;

      if (!user || !token) {
        throw new Error('Invalid response: missing user or token');
      }

      // Store tokens and user data
      localStorage.setItem('hostelhaven_token', token);
      if (refreshToken) {
        localStorage.setItem('hostelhaven_refresh_token', refreshToken);
      }
      localStorage.setItem('hostelhaven_user', JSON.stringify(user));

      return { user, token, refreshToken };
    } catch (error) {
      if (error.response) {
        const message = error.response.data?.message || 'Invalid OTP';
        throw new Error(message);
      } else if (error.request) {
        throw new Error('Cannot connect to server. Please check if the backend is running.');
      } else {
        throw error;
      }
    }
  },
};

export default authService;