import PropTypes from 'prop-types';
import { useEffect } from 'react';

// @mui
import { useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';

// @project
import { handlerActiveItem, handlerDrawerOpen, useGetMenuMaster } from '@/states/menu';
import DynamicIcon from '@/components/DynamicIcon';
import RouterLink from '@/components/Link';
import { usePathname } from '@/utils/navigation';
import { useRoomAllocation } from '@/contexts/RoomAllocationContext';
import useAuth from '@/hooks/useAuth';
import { useSnackbar } from 'notistack';

// Helper to safely use room allocation context
const useRoomAllocationSafe = () => {
  try {
    return useRoomAllocation();
  } catch {
    return { hasRoom: true, loading: false }; // Default to allowing access if context not available
  }
};

/***************************  RESPONSIVE DRAWER - ITEM  ***************************/

export default function NavItem({ item, level = 0 }) {
  const theme = useTheme();
  const { menuMaster } = useGetMenuMaster();
  const openItem = menuMaster.openedItem;
  const { user } = useAuth();
  const { hasRoom } = useRoomAllocationSafe();
  const { enqueueSnackbar } = useSnackbar();

  const downMD = useMediaQuery(theme.breakpoints.down('md'));

  // Active menu item on page load
  const pathname = usePathname();

  useEffect(() => {
    if (pathname === item.url) handlerActiveItem(item.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  const iconcolor = theme.palette.text.primary;

  // Check if this menu item requires room allocation
  // Dashboard and My Room are always accessible
  const requiresRoom = user?.role === 'student' && 
                       item.id !== 'dashboard' && 
                       item.id !== 'my-room' &&
                       !hasRoom;

  const itemHandler = (e) => {
    if (requiresRoom) {
      e.preventDefault();
      e.stopPropagation();
      // Show toast notification when disabled item is clicked
      // Use a unique key to prevent duplicate toasts
      enqueueSnackbar('You can access this feature after your room is allocated.', {
        variant: 'error',
        autoHideDuration: 5000, // Auto-dismiss after 5 seconds
        key: 'room-allocation-required', // Unique key prevents duplicates
        preventDuplicate: true, // Prevent showing duplicate toasts
        anchorOrigin: {
          vertical: 'bottom',
          horizontal: 'right',
        },
      });
      return;
    }
    if (downMD) handlerDrawerOpen(false);
  };

  const buttonContent = (
    <ListItemButton
      id={`${item.id}-btn`}
      component={requiresRoom ? 'div' : RouterLink}
      to={requiresRoom ? undefined : item.url}
      {...(item?.target && !requiresRoom && { target: '_blank' })}
      selected={openItem === item.id && !requiresRoom}
      disabled={item.disabled || requiresRoom}
      onClick={itemHandler}
      sx={{
        color: requiresRoom ? 'text.disabled' : 'text.primary',
        cursor: requiresRoom ? 'not-allowed' : 'pointer',
        opacity: requiresRoom ? 0.5 : 1,
        ...(level === 0 && { my: 0.25, '&.Mui-selected.Mui-focusVisible': { bgcolor: 'primary.light' } }),
        ...(level > 0 && {
          '&.Mui-selected': {
            color: 'primary.main',
            bgcolor: 'transparent',
            '&:hover': { bgcolor: 'action.hover' },
            '&.Mui-focusVisible': { bgcolor: 'action.focus' },
            '& .MuiTypography-root': { fontWeight: 600 }
          }
        })
      }}
    >
      {level === 0 && (
        <ListItemIcon>
          <DynamicIcon name={item.icon} color={requiresRoom ? theme.palette.text.disabled : iconcolor} size={18} stroke={1.5} />
        </ListItemIcon>
      )}
      <ListItemText primary={item.title} sx={{ mb: '-1px' }} />
    </ListItemButton>
  );

  return buttonContent;
}

NavItem.propTypes = { item: PropTypes.any, level: PropTypes.number };
