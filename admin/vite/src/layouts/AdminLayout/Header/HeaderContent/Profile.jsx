import { useState, useEffect, useRef } from 'react';

// @mui
import { useTheme } from '@mui/material/styles';
import Avatar from '@mui/material/Avatar';
import Button from '@mui/material/Button';
import ClickAwayListener from '@mui/material/ClickAwayListener';
import Divider from '@mui/material/Divider';
import Fade from '@mui/material/Fade';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Popper from '@mui/material/Popper';
import Stack from '@mui/material/Stack';
import Switch from '@mui/material/Switch';
import Box from '@mui/material/Box';


// @project
import { ThemeMode } from '@/config';
import MainCard from '@/components/MainCard';
import Profile from '@/components/Profile';
import { AvatarSize } from '@/enum';
import useConfig from '@/hooks/useConfig';
import useAuth from '@/hooks/useAuth';

// @assets
import { IconLogout, IconSunMoon } from '@tabler/icons-react';

import profile from '@/assets/images/users/avatar-1.png';

/***************************  HEADER - PROFILE  ***************************/

export default function ProfileSection() {
  const theme = useTheme();
  const { mode, updateConfig } = useConfig();
  const { user, logout } = useAuth();

  const [anchorEl, setAnchorEl] = useState(null);
  // Initialize userData from localStorage immediately (synchronously) to avoid delay
  const [userData, setUserData] = useState(() => {
    try {
      const storedUser = localStorage.getItem('hostelhaven_user');
      if (storedUser) {
        return JSON.parse(storedUser);
      }
    } catch (error) {
      console.error('Error parsing user from localStorage on mount:', error);
    }
    return null;
  });
  const intervalRef = useRef(null);
  const userDataRef = useRef(null); // Track userData in a ref to avoid dependency issues
  
  // Keep ref in sync with userData state
  useEffect(() => {
    userDataRef.current = userData;
  }, [userData]);

  const open = Boolean(anchorEl);
  const id = open ? 'profile-action-popper' : undefined;

  // Get user data from auth context or localStorage
  // Prefer AuthContext user as it's the source of truth
  const getUserData = () => {
    try {
      // Always prefer AuthContext user first (it's reactive)
      if (user) {
        return user;
      }
      const storedUser = localStorage.getItem('hostelhaven_user');
      if (storedUser) {
        return JSON.parse(storedUser);
      }
    } catch (error) {
      console.error('Error getting user data:', error);
    }
    return { name: 'User', username: 'user', role: 'student' };
  };

  // Update user data when AuthContext user changes or localStorage changes
  useEffect(() => {
    // Update immediately when AuthContext user changes
    if (user) {
      setUserData(user);
      userDataRef.current = user;
    } else {
      // If no user in context, try to get from localStorage immediately
      const storedUser = localStorage.getItem('hostelhaven_user');
      if (storedUser) {
        try {
          const parsedUser = JSON.parse(storedUser);
          setUserData(parsedUser);
          userDataRef.current = parsedUser;
        } catch (error) {
          console.error('Error parsing user from localStorage:', error);
        }
      }
    }
  }, [user]);

  // Also listen for profile update events and localStorage changes
  useEffect(() => {
    const updateUserData = () => {
      // Always check localStorage first (it's the source of truth after login)
      const storedUser = localStorage.getItem('hostelhaven_user');
      if (storedUser) {
        try {
          const parsedUser = JSON.parse(storedUser);
          setUserData(parsedUser);
          userDataRef.current = parsedUser;
          return;
        } catch (error) {
          console.error('Error parsing user from localStorage:', error);
        }
      }
      // Fallback to getUserData() which checks AuthContext
      const fallbackData = getUserData();
      setUserData(fallbackData);
      userDataRef.current = fallbackData;
    };

    // Initial load - check immediately
    updateUserData();
    
    // Also check after a small delay to catch any updates that happened during mount
    const immediateCheck = setTimeout(() => {
      updateUserData();
    }, 50);

    // Listen for storage changes (when profile is updated in another tab/component)
    const handleStorageChange = (e) => {
      if (e.key === 'hostelhaven_user') {
        updateUserData();
      }
    };

    window.addEventListener('storage', handleStorageChange);

    // Also listen for custom event when profile is updated in same tab
    const handleProfileUpdate = (event) => {
      // If event has user data, use it directly
      if (event.detail?.user) {
        setUserData(event.detail.user);
        userDataRef.current = event.detail.user;
      } else {
        updateUserData();
      }
    };

    window.addEventListener('profileUpdated', handleProfileUpdate);

    // Poll for changes (fallback for same-tab updates) - check localStorage directly
    // Use a shorter interval immediately after mount, then increase it
    intervalRef.current = setInterval(() => {
      try {
        const storedUser = localStorage.getItem('hostelhaven_user');
        if (storedUser) {
          const parsedUser = JSON.parse(storedUser);
          const currentData = userDataRef.current;
          // Compare profilePhoto and name specifically to catch updates
          // Use ref to avoid dependency on userData state
          if (!currentData || 
              parsedUser.profilePhoto !== currentData.profilePhoto || 
              parsedUser.name !== currentData.name ||
              parsedUser.phone !== currentData.phone) {
            updateUserData();
          }
        }
      } catch (error) {
        // Ignore parsing errors
      }
    }, 100); // Check every 100ms for first few seconds
    
    // Clear and restart with longer interval after initial checks
    const timeoutId = setTimeout(() => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      intervalRef.current = setInterval(() => {
        try {
          const storedUser = localStorage.getItem('hostelhaven_user');
          if (storedUser) {
            const parsedUser = JSON.parse(storedUser);
            const currentData = userDataRef.current;
            // Use ref to avoid dependency on userData state
            if (!currentData || 
                parsedUser.profilePhoto !== currentData.profilePhoto || 
                parsedUser.name !== currentData.name ||
                parsedUser.phone !== currentData.phone) {
              updateUserData();
            }
          }
        } catch (error) {
          // Ignore parsing errors
        }
      }, 500); // Slower polling after initial period
    }, 2000); // Fast polling for first 2 seconds after mount

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('profileUpdated', handleProfileUpdate);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      clearTimeout(timeoutId);
      clearTimeout(immediateCheck);
    };
  }, [user]); // Removed userData from dependencies to prevent infinite loop

  // Use current userData or fallback - always get fresh data
  const currentUserData = userData || getUserData();
  
  // Format role for display (capitalize first letter)
  const roleDisplay = currentUserData.role ? currentUserData.role.charAt(0).toUpperCase() + currentUserData.role.slice(1) : 'User';
  const userName = currentUserData.name || currentUserData.username || 'User';

  // Use user's profile photo if available, otherwise use default
  // Add cache-busting for base64 images to force refresh
  let avatarSrc = currentUserData.profilePhoto || profile;
  if (avatarSrc && avatarSrc.startsWith('data:image/')) {
    // For base64 images, add a timestamp query to force refresh (though base64 shouldn't cache)
    // The key prop will handle re-rendering, but this ensures browser doesn't cache
    avatarSrc = avatarSrc;
  }

  const profileData = {
    avatar: { src: avatarSrc, size: AvatarSize.XS },
    title: userName,
    caption: roleDisplay
  };

  const handleActionClick = (event) => {
    setAnchorEl(anchorEl ? null : event.currentTarget);
  };

  const logoutAccount = () => {
    setAnchorEl(null);
    logout();
  };

  const handleThemeToggle = (event) => {
    const newMode = mode === ThemeMode.LIGHT ? ThemeMode.DARK : ThemeMode.LIGHT;
    updateConfig({ mode: newMode });
  };

  return (
    <>
      <Box onClick={handleActionClick} sx={{ cursor: 'pointer' }}>
        <Box sx={{ display: { xs: 'none', sm: 'flex' } }}>
          <Profile {...profileData} key={`profile-${currentUserData.profilePhoto ? currentUserData.profilePhoto.substring(0, 50).replace(/[^a-zA-Z0-9]/g, '') : 'no-photo'}-${userName}`} />
        </Box>
        <Box sx={{ display: { xs: 'block', sm: 'none' } }}>
          <Avatar 
            {...profileData.avatar} 
            src={avatarSrc} 
            alt={profileData.title} 
            key={`avatar-${currentUserData.profilePhoto ? currentUserData.profilePhoto.substring(0, 50).replace(/[^a-zA-Z0-9]/g, '') : 'no-photo'}`}
            sx={{ ...profileData.avatar.sx, imageRendering: 'auto' }}
          />
        </Box>
      </Box>
      <Popper
        placement="bottom-end"
        id={id}
        open={open}
        anchorEl={anchorEl}
        transition
        popperOptions={{ modifiers: [{ name: 'offset', options: { offset: [8, 8] } }] }}
      >
        {({ TransitionProps }) => (
          <Fade in={open} {...TransitionProps}>
            <MainCard sx={{ borderRadius: 2, boxShadow: theme.customShadows.tooltip, minWidth: 220, p: 0.5 }}>
              <ClickAwayListener onClickAway={() => setAnchorEl(null)}>
                <Stack sx={{ px: 0.5, py: 0.75 }}>
                  <Profile
                    {...profileData}
                    key={`profile-menu-${currentUserData.profilePhoto ? 'has-photo' : 'no-photo'}-${userName}`}
                    sx={{
                      flexDirection: 'column',
                      justifyContent: 'center',
                      textAlign: 'center',
                      width: 1,
                      '& .MuiAvatar-root': { width: 48, height: 48 }
                    }}
                  />
                  <Divider sx={{ my: 1 }} />
                  <List disablePadding>
                    <ListItem
                      secondaryAction={
                        <Switch size="small" checked={mode === ThemeMode.DARK} onChange={handleThemeToggle} />
                      }
                      sx={{ py: 0.5, pl: 1, '& .MuiListItemSecondaryAction-root': { right: 8 } }}
                    >
                      <ListItemIcon>
                        <IconSunMoon size={16} />
                      </ListItemIcon>
                      <ListItemText primary="Dark Theme" />
                    </ListItem>
                    <ListItem disablePadding sx={{ mt: 1 }}>
                      <Button
                        fullWidth
                        variant="outlined"
                        color="secondary"
                        size="small"
                        endIcon={<IconLogout size={16} />}
                        onClick={logoutAccount}
                      >
                        Logout
                      </Button>
                    </ListItem>
                  </List>
                </Stack>
              </ClickAwayListener>
            </MainCard>
          </Fade>
        )}
      </Popper>
    </>
  );
}
