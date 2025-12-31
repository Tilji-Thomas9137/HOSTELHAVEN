import { Navigate, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import PropTypes from 'prop-types';

/***************************  AUTH GUARD  ***************************/

/**
 * Auth Guard Component
 * Redirects authenticated users trying to access auth pages (login)
 * back to dashboard, since they're already logged in
 * Exception: Allows authenticated users to access first-login-reset page
 */
export default function AuthGuard({ children }) {
  const location = useLocation();
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    // Check localStorage immediately on mount
    try {
      if (typeof window !== 'undefined') {
        const storedUser = localStorage.getItem('hostelhaven_user');
        const storedToken = localStorage.getItem('hostelhaven_token');
        return !!(storedUser && storedToken);
      }
      return false;
    } catch {
      return false;
    }
  });

  useEffect(() => {
    // Check authentication status directly from localStorage
    const checkAuth = () => {
      try {
        if (typeof window !== 'undefined') {
          const storedUser = localStorage.getItem('hostelhaven_user');
          const storedToken = localStorage.getItem('hostelhaven_token');
          const authenticated = !!(storedUser && storedToken);
          setIsAuthenticated(authenticated);
        }
      } catch (error) {
        console.error('Error checking authentication:', error);
        setIsAuthenticated(false);
      }
    };

    // Check immediately
    checkAuth();

    // Set up interval to check for auth changes (e.g., after login)
    const interval = setInterval(checkAuth, 100);

    // Also listen for storage events (when localStorage changes in another tab)
    const handleStorageChange = () => {
      checkAuth();
    };
    window.addEventListener('storage', handleStorageChange);

    return () => {
      clearInterval(interval);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  // Allow authenticated users to access first-login-reset page
  const isFirstLoginReset = location.pathname === '/auth/first-login-reset';
  
  // If user is already authenticated and trying to access auth pages (except first-login-reset),
  // redirect them to dashboard immediately
  if (isAuthenticated && !isFirstLoginReset) {
    return <Navigate to="/app/dashboard" replace />;
  }

  // If not authenticated, or if authenticated and accessing first-login-reset, allow access
  return children;
}

AuthGuard.propTypes = {
  children: PropTypes.node.isRequired
};

