import { Navigate } from 'react-router-dom';
import { useEffect, useState } from 'react';

// @project
import LandingPage from '@/views/landing';

/***************************  INDEX/LANDING PAGE WRAPPER  ***************************/

/**
 * Index/Landing Page Wrapper Component
 * 
 * This component serves as the entry point (index page) for the application.
 * - Unauthenticated users: See the landing page with login options
 * - Authenticated users: Automatically redirected to dashboard
 */
export default function LandingPageWrapper() {
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // Check authentication status directly from localStorage
    // This ensures we check auth before rendering anything
    const checkAuth = () => {
      try {
        const storedUser = localStorage.getItem('hostelhaven_user');
        const storedToken = localStorage.getItem('hostelhaven_token');
        const authenticated = !!(storedUser && storedToken);
        setIsAuthenticated(authenticated);
      } catch (error) {
        console.error('Error checking authentication:', error);
        setIsAuthenticated(false);
      } finally {
        setIsCheckingAuth(false);
      }
    };

    checkAuth();
  }, []);

  // While checking auth, show nothing (or could show a minimal loader)
  if (isCheckingAuth) {
    return null;
  }

  // If user is authenticated, redirect them to dashboard
  // This ensures authenticated users don't see the landing page
  if (isAuthenticated) {
    return <Navigate to="/app/dashboard" replace />;
  }

  // Show the landing/index page for unauthenticated users
  // Landing page contains login buttons and app information
  return <LandingPage />;
}

