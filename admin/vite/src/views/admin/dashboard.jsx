// @project
import { useEffect, useState } from 'react';
import useAuth from '@/hooks/useAuth';
import Loader from '@/components/Loader';

// Role-specific dashboards
import AdminDashboard from './AdminDashboard';
import StaffDashboard from './StaffDashboard';
import StudentDashboard from './StudentDashboard';
import ParentDashboardNew from '../parent/Dashboard';

/***************************  DASHBOARD - ROLE-BASED ROUTING  ***************************/

/**
 * Main Dashboard Component that routes to role-specific dashboards
 */
export default function Dashboard() {
  const { user } = useAuth();
  // Initialize role immediately from localStorage or user context to avoid loading state
  const [userRole, setUserRole] = useState(() => {
    try {
      if (typeof window !== 'undefined') {
        const storedUser = localStorage.getItem('hostelhaven_user');
        if (storedUser) {
          const parsedUser = JSON.parse(storedUser);
          return parsedUser.role || 'student';
        }
      }
      return user?.role || 'student';
    } catch {
      return 'student';
    }
  });

  useEffect(() => {
    // Update role if user context changes
    if (user?.role && userRole !== user.role) {
      setUserRole(user.role);
    }
  }, [user, userRole]);

  // No loading state needed - we have a default role immediately

  // Route to role-specific dashboard
  try {
    switch (userRole.toLowerCase()) {
      case 'admin':
        return <AdminDashboard />;
      case 'staff':
        return <StaffDashboard />;
      case 'student':
        return <StudentDashboard />;
      case 'parent':
        return <ParentDashboardNew />;
      default:
        return <StudentDashboard />; // Default to student dashboard
    }
  } catch (error) {
    console.error('Error rendering dashboard:', error);
    // Fallback to student dashboard on error
    return <StudentDashboard />;
  }
}
