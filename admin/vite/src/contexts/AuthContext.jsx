import { createContext, useState, useEffect } from 'react';
import authService from '@/services/authService';

// Create context with default values to prevent errors
const defaultAuthValue = {
  user: null,
  isAuthenticated: false,
  loading: true,
  login: async () => {},
  logout: async () => {},
  updateUser: () => {},
};

export const AuthContext = createContext(defaultAuthValue);

// Initialize auth state synchronously from localStorage
// This must happen BEFORE the component renders to prevent redirects
const getInitialAuthState = () => {
  try {
    const token = localStorage.getItem('hostelhaven_token');
    const storedUser = localStorage.getItem('hostelhaven_user');
    
    if (token && storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        return {
          user: parsedUser,
          isAuthenticated: true,
          loading: false, // Set to false immediately since we have valid localStorage data
        };
      } catch (parseError) {
        console.error('Error parsing stored user:', parseError);
        return { user: null, isAuthenticated: false, loading: false };
      }
    }
    
    return { user: null, isAuthenticated: false, loading: false };
  } catch (error) {
    console.error('Error initializing auth state:', error);
    return { user: null, isAuthenticated: false, loading: false };
  }
};

const initialState = getInitialAuthState();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(initialState.user);
  const [isAuthenticated, setIsAuthenticated] = useState(initialState.isAuthenticated);
  const [loading, setLoading] = useState(initialState.loading);

  useEffect(() => {
    // Only verify with API if we have auth data from localStorage
    // This happens in background without blocking the UI
    // Use a small delay to allow initial render to complete first
    const verifyAuth = async () => {
      const token = localStorage.getItem('hostelhaven_token');
      const storedUser = localStorage.getItem('hostelhaven_user');
      
      if (!token || !storedUser) {
        // No auth data, already set correctly in initial state
        return;
      }

      // Delay API verification slightly to allow page to render first
      // This improves perceived performance
      await new Promise(resolve => setTimeout(resolve, 100));

      try {
        // Verify token with API (async) - this happens in background
        const userData = await authService.getMe();
        // Update user with fresh data from API (including profilePhoto)
        setUser(userData);
        setIsAuthenticated(true);
        // Update stored user with fresh data (including profilePhoto)
        localStorage.setItem('hostelhaven_user', JSON.stringify(userData));
        // Dispatch event to notify components of fresh user data
        window.dispatchEvent(new CustomEvent('profileUpdated', { detail: { user: userData } }));
      } catch (apiError) {
        // API call failed, but we keep the user from localStorage
        // CRITICAL: Only clear auth if it's a clear authentication error AND the error
        // is not from a network issue or server being down
        // This prevents clearing auth on page refresh when network is slow or server is temporarily down
        const isAuthError = apiError.response?.status === 401 || apiError.response?.status === 403;
        const isNetworkError = !apiError.response || apiError.code === 'ECONNABORTED' || apiError.code === 'ERR_NETWORK';
        
        // Only clear auth if it's a definitive auth error (not network/server issues)
        if (isAuthError && !isNetworkError) {
          // Token invalid or expired - clear auth state
          localStorage.removeItem('hostelhaven_token');
          localStorage.removeItem('hostelhaven_refresh_token');
          localStorage.removeItem('hostelhaven_user');
          setUser(null);
          setIsAuthenticated(false);
          // Redirect will happen via ProtectedRoute
        } else {
          // For network errors, server down, timeouts, etc., keep the user logged in from localStorage
          // The user can continue working, and we'll verify again on next page load
          // This ensures page refresh doesn't log users out due to temporary network issues
          console.warn('Auth verification failed but keeping user logged in:', apiError.message);
        }
      }
    };

    verifyAuth();
  }, []);

  const login = async (userData, token, refreshToken = null) => {
    // Update localStorage first (synchronous)
    localStorage.setItem('hostelhaven_token', token);
    localStorage.setItem('hostelhaven_user', JSON.stringify(userData));
    
    // Store refresh token if provided
    if (refreshToken) {
      localStorage.setItem('hostelhaven_refresh_token', refreshToken);
    }
    
    // Then update state (this triggers re-renders)
    setUser(userData);
    setIsAuthenticated(true);
    setLoading(false);
    
    // Dispatch event immediately to notify all components (header, etc.) of the login
    // This ensures the profile photo appears immediately without needing a page refresh
    window.dispatchEvent(new CustomEvent('profileUpdated', { detail: { user: userData } }));
    
    // Also trigger storage event for cross-tab updates
    window.dispatchEvent(new StorageEvent('storage', {
      key: 'hostelhaven_user',
      newValue: JSON.stringify(userData)
    }));
    
    // Return a resolved promise to allow await
    return Promise.resolve();
  };

  const logout = async () => {
    await authService.logout();
    setUser(null);
    setIsAuthenticated(false);
  };

  // Function to update user data (e.g., after profile update)
  const updateUser = (userData) => {
    if (userData) {
      setUser(userData);
      localStorage.setItem('hostelhaven_user', JSON.stringify(userData));
      // Dispatch event to notify other components
      window.dispatchEvent(new CustomEvent('profileUpdated', { detail: { user: userData } }));
    } else {
      // Refresh from localStorage
      const storedUser = localStorage.getItem('hostelhaven_user');
      if (storedUser) {
        try {
          const parsedUser = JSON.parse(storedUser);
          setUser(parsedUser);
        } catch (error) {
          console.error('Error parsing user from localStorage:', error);
        }
      }
    }
  };

  // Listen for profile updates from other components
  useEffect(() => {
    const handleProfileUpdate = (event) => {
      const updatedUser = event.detail?.user;
      if (updatedUser) {
        setUser(updatedUser);
      } else {
        // Refresh from localStorage
        const storedUser = localStorage.getItem('hostelhaven_user');
        if (storedUser) {
          try {
            const parsedUser = JSON.parse(storedUser);
            setUser(parsedUser);
          } catch (error) {
            console.error('Error parsing user from localStorage:', error);
          }
        }
      }
    };

    window.addEventListener('profileUpdated', handleProfileUpdate);
    return () => window.removeEventListener('profileUpdated', handleProfileUpdate);
  }, []);

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, loading, login, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}