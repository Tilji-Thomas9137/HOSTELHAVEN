import { createBrowserRouter, Navigate } from 'react-router-dom';

// @routes
import MainRoutes from './MainRoutes';
import PagesRoutes from './PagesRoutes';

// Landing page wrapper
import LandingPageWrapper from '@/components/LandingPageWrapper';

/***************************  ROUTING RENDER  ***************************/

const router = createBrowserRouter(
  [
    // Landing / Home
    { path: '/', element: <LandingPageWrapper /> },
    { path: '/index', element: <Navigate to="/" replace /> },
    { path: '/home', element: <Navigate to="/" replace /> },

    // Backward compatibility redirects (NO /app)
    { path: '/dashboard', element: <Navigate to="/dashboard" replace /> },
    { path: '/students', element: <Navigate to="/students" replace /> },
    { path: '/rooms', element: <Navigate to="/rooms" replace /> },
    { path: '/bookings', element: <Navigate to="/bookings" replace /> },
    { path: '/payments', element: <Navigate to="/payments" replace /> },
    { path: '/reports', element: <Navigate to="/reports" replace /> },
    { path: '/settings', element: <Navigate to="/settings" replace /> },

    // Auth routes (login, register, etc.)
    PagesRoutes,

    // Protected app routes (dashboard, students, etc.)
    MainRoutes
  ],
  {
    // IMPORTANT FOR S3
    basename: '/',
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
