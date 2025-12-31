import { use } from 'react';

// @project
import { AuthContext } from '@/contexts/AuthContext';

/***************************  HOOKS - AUTH  ***************************/

/**
 * Custom hook to access the authentication context.
 * 
 * @returns {object} The authentication context value with user, isAuthenticated, login, and logout.
 */

export default function useAuth() {
  return use(AuthContext);
}

