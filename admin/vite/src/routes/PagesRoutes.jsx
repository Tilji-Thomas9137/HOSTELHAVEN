import { lazy } from 'react';
import { Navigate } from 'react-router-dom';

// @project
import Loadable from '@/components/Loadable';
import AuthLayout from '@/layouts/AuthLayout';
import AuthGuard from '@/components/AuthGuard';

// auth
const LoginPage = Loadable(lazy(() => import('@/views/auth/login')));
const OAuthCallbackPage = Loadable(lazy(() => import('@/views/auth/oauth-callback')));
const FirstLoginResetPage = Loadable(lazy(() => import('@/views/auth/first-login-reset')));
const ForgotPasswordPage = Loadable(lazy(() => import('@/views/auth/forgot-password')));
const ResetPasswordPage = Loadable(lazy(() => import('@/views/auth/reset-password')));

/***************************  PAGES ROUTES  ***************************/

const PagesRoutes = {
  path: 'auth',
  element: (
    <AuthGuard>
      <AuthLayout />
    </AuthGuard>
  ),
  children: [
    { index: true, element: <Navigate to="login" replace /> },
    { path: 'login', element: <LoginPage /> },
    { path: 'oauth-callback', element: <OAuthCallbackPage /> },
    { path: 'first-login-reset', element: <FirstLoginResetPage /> },
    { path: 'forgot-password', element: <ForgotPasswordPage /> },
    { path: 'reset-password', element: <ResetPasswordPage /> }
  ]
};

export default PagesRoutes;
