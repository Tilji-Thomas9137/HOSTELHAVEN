import { createBrowserRouter, Navigate } from 'react-router-dom';

// @routes
import MainRoutes from './MainRoutes';
import PagesRoutes from './PagesRoutes';

// Landing page wrapper
import LandingPageWrapper from '@/components/LandingPageWrapper';

/***************************  ROUTING RENDER  ***************************/

const router = createBrowserRouter(
  [
    // IMPORTANT: Root route must be first - this is the landing/index page
    // Shows landing page for unauthenticated users, redirects authenticated users to dashboard
    { path: '/', element: <LandingPageWrapper /> },
    { path: '/index', element: <Navigate to="/" replace /> },
    { path: '/home', element: <Navigate to="/" replace /> },
    // Redirect old paths to new app/* paths for backward compatibility
    { path: '/dashboard', element: <Navigate to="/app/dashboard" replace /> },
    { path: '/students', element: <Navigate to="/app/students" replace /> },
    { path: '/rooms', element: <Navigate to="/app/rooms" replace /> },
    { path: '/bookings', element: <Navigate to="/app/bookings" replace /> },
    { path: '/payments', element: <Navigate to="/app/payments" replace /> },
    { path: '/reports', element: <Navigate to="/app/reports" replace /> },
    { path: '/settings', element: <Navigate to="/app/settings" replace /> },
    // Auth routes (login) - only accessible to unauthenticated users
    PagesRoutes,
    // Protected app routes (dashboard, etc.) - only accessible to authenticated users
    MainRoutes
  ],
  {
    basename: import.meta.env.VITE_APP_BASE_URL || undefined,
    future: {
      v7_relativeSplatPath: true,
      v7_fetcherPersist: true,
      v7_normalizeFormMethod: true,
      v7_partialHydration: true,
      v7_skipActionErrorRevalidation: true
    }
  }
);

export default router;
