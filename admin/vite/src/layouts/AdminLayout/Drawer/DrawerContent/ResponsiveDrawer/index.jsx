// @mui
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import { useMemo } from 'react';

// @project
import { getMenuItemsByRole } from '@/menu';
import NavGroup from './NavGroup';
import useAuth from '@/hooks/useAuth';

/***************************  DRAWER CONTENT - RESPONSIVE DRAWER  ***************************/

export default function ResponsiveDrawer() {
  const { user } = useAuth();

  // Get user role from auth context or localStorage
  const getUserRole = () => {
    try {
      if (user?.role) {
        return user.role;
      }
      const storedUser = localStorage.getItem('hostelhaven_user');
      if (storedUser) {
        const parsedUser = JSON.parse(storedUser);
        return parsedUser.role || 'student';
      }
    } catch (error) {
      console.error('Error getting user role:', error);
    }
    return 'student';
  };

  const userRole = getUserRole();
  
  // Get role-specific menu items
  const menuItems = useMemo(() => getMenuItemsByRole(userRole), [userRole]);

  const navGroups = menuItems.items.map((item, index) => {
    switch (item.type) {
      case 'group':
        return <NavGroup key={index} item={item} />;
      default:
        return (
          <Typography key={index} variant="h6" color="error" align="center">
            Fix - Navigation Group
          </Typography>
        );
    }
  });

  return <Box sx={{ py: 1, transition: 'all 0.3s ease-in-out' }}>{navGroups}</Box>;
}
