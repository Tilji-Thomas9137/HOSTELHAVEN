import { Navigate } from 'react-router-dom';
import PropTypes from 'prop-types';
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import { useState, useEffect, useContext } from 'react';

// @project
import { AuthContext } from '@/contexts/AuthContext';

/***************************  PROTECTED ROUTE  ***************************/

/**
 * ProtectedRoute component that checks if user is authenticated
 * If not authenticated, redirects to login page
 * If authenticated, renders the children
 * Shows loading state while checking authentication
 * Optimized for page refresh - checks localStorage directly to prevent redirects
 */
// Cache localStorage reads to avoid repeated access
let cachedAuthCheck = null;
let cacheTimestamp = 0;
const CACHE_DURATION = 100; // Cache for 100ms to avoid excessive reads

const getCachedAuth = () => {
  const now = Date.now();
  if (cachedAuthCheck !== null && (now - cacheTimestamp) < CACHE_DURATION) {
    return cachedAuthCheck;
  }
  
  try {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('hostelhaven_token');
      const user = localStorage.getItem('hostelhaven_user');
      cachedAuthCheck = !!(token && user);
      cacheTimestamp = now;
      return cachedAuthCheck;
    }
  } catch {
    cachedAuthCheck = false;
    cacheTimestamp = now;
  }
  return false;
};

export default function ProtectedRoute({ children }) {
  // Check localStorage directly FIRST for immediate auth check on refresh
  // This prevents any redirects during the brief moment before context initializes
  // Use cached version to avoid excessive localStorage reads
  const [localAuth, setLocalAuth] = useState(() => getCachedAuth());

  // Get context auth - use useContext instead of use() to avoid potential suspension issues
  const authContext = useContext(AuthContext);
  const contextAuth = authContext?.isAuthenticated ?? false;
  const contextLoading = authContext?.loading ?? false;

  // Update local auth check when context changes
  // Always trust localStorage if it says authenticated - this is critical for page refresh
  useEffect(() => {
    const hasAuth = getCachedAuth();
    // CRITICAL: If localStorage has auth, ALWAYS trust it and set to true
    // This ensures page refresh works correctly
    if (hasAuth) {
      setLocalAuth(true);
      return; // Don't override with context value if localStorage says authenticated
    }
    // Only use context value if localStorage doesn't have auth AND context is done loading
    if (!contextLoading) {
      setLocalAuth(contextAuth);
    }
  }, [contextAuth, contextLoading]);

  // Final synchronous check of localStorage as a safeguard
  // This ensures we never redirect if localStorage has auth data, even if state is out of sync
  // Use cached version to avoid excessive reads
  const hasLocalStorageAuth = getCachedAuth();

  // Update localAuth state if localStorage has auth but state doesn't
  useEffect(() => {
    if (hasLocalStorageAuth && !localAuth) {
      setLocalAuth(true);
    }
  }, [hasLocalStorageAuth, localAuth]);

  // Determine authentication status
  // CRITICAL: Trust localStorage FIRST - if it says authenticated, render the page immediately
  // Only redirect if localStorage explicitly says no auth AND context confirms no auth
  // Priority: localStorage > localAuth state > contextAuth
  const isAuthenticated = hasLocalStorageAuth || localAuth || contextAuth;
  
  // Only show loading if we don't have localStorage auth AND context is still loading
  // If localStorage has auth, we can render immediately without waiting for context
  const loading = contextLoading && !hasLocalStorageAuth && !localAuth;

  // Show loading spinner only if we don't have localStorage auth AND context is still loading
  if (loading) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '100vh',
          width: '100%',
          backgroundColor: '#f5f5f5',
        }}
      >
        <CircularProgress size={48} />
      </Box>
    );
  }

  // CRITICAL: Only redirect if localStorage explicitly has NO auth data
  // If localStorage has ANY auth data (token + user), we trust it and render
  // This prevents redirects on page refresh even if API verification fails
  // Also check if we're showing an auth error - delay redirect to allow error to be displayed
  const showAuthError = typeof window !== 'undefined' ? sessionStorage.getItem('showAuthError') : null;
  
  if (!hasLocalStorageAuth && !localAuth && !contextAuth) {
    // If we're showing an auth error, allow a brief moment for the error to be displayed
    // The component will handle the redirect after showing the error message
    if (showAuthError) {
      // Allow rendering so the component can display the error message
      // The component will redirect after showing the error (see AddStudent.jsx)
      return children;
    }
    return <Navigate to="/auth/login" replace />;
  }

  // Render protected content if authenticated
  // This happens immediately if localStorage has auth data, allowing page to refresh in place
  return children;
}

ProtectedRoute.propTypes = {
  children: PropTypes.node.isRequired
};
