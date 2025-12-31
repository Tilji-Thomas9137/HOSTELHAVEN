import { Fragment, useState, useMemo, useEffect, useRef } from 'react';

// @mui
import { keyframes, useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
import Badge from '@mui/material/Badge';
import Button from '@mui/material/Button';
import CardHeader from '@mui/material/CardHeader';
import CardContent from '@mui/material/CardContent';
import CardActions from '@mui/material/CardActions';
import ClickAwayListener from '@mui/material/ClickAwayListener';
import Fade from '@mui/material/Fade';
import IconButton from '@mui/material/IconButton';
import List from '@mui/material/List';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemText from '@mui/material/ListItemText';
import ListSubheader from '@mui/material/ListSubheader';
import Popper from '@mui/material/Popper';
import Stack from '@mui/material/Stack';
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';

// @project
import EmptyNotification from '@/components/header/empty-state/EmptyNotification';
import MainCard from '@/components/MainCard';
import NotificationItem from '@/components/NotificationItem';
import SimpleBar from '@/components/third-party/SimpleBar';
import useAuth from '@/hooks/useAuth';

// @services
import adminService from '@/services/adminService';
import staffService from '@/services/staffService';
import studentService from '@/services/studentService';
import parentService from '@/services/parentService';

// @assets
import { IconBell, IconChevronDown, IconUser, IconDoor, IconCalendar, IconCurrencyDollar, IconAlertCircle, IconBed, IconCheck, IconUsers } from '@tabler/icons-react';

const swing = keyframes`
  20% {
    transform: rotate(15deg) scale(1);
}
40% {
    transform: rotate(-10deg) scale(1.05);
}
60% {
    transform: rotate(5deg) scale(1.1);
}
80% {
    transform: rotate(-5deg) scale(1.05);
}
100% {
    transform: rotate(0deg) scale(1);
}
`;

/***************************  HEADER - NOTIFICATION  ***************************/

export default function Notification() {
  const theme = useTheme();
  const downSM = useMediaQuery(theme.breakpoints.down('sm'));
  const { user, isAuthenticated } = useAuth();

  const [anchorEl, setAnchorEl] = useState(null);
  const [innerAnchorEl, setInnerAnchorEl] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showEmpty, setShowEmpty] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState('All notification');
  const pollingIntervalRef = useRef(null);

  const open = Boolean(anchorEl);
  const innerOpen = Boolean(innerAnchorEl);
  const id = open ? 'notification-action-popper' : undefined;
  const innerId = innerOpen ? 'notification-inner-popper' : undefined;
  const buttonStyle = { borderRadius: 2, p: 1 };

  // Get user role from auth context or localStorage
  const getUserRole = () => {
    try {
      if (user?.role) {
        return user.role.toLowerCase();
      }
      const storedUser = localStorage.getItem('hostelhaven_user');
      if (storedUser) {
        const parsedUser = JSON.parse(storedUser);
        return (parsedUser.role || 'student').toLowerCase();
      }
    } catch (error) {
      console.error('Error getting user role:', error);
    }
    return 'student';
  };

  const userRole = getUserRole();

  // Get notification service based on role
  const getNotificationService = () => {
    switch (userRole) {
      case 'admin':
        return adminService.getAllNotifications;
      case 'staff':
        return staffService.getNotifications;
      case 'student':
        return studentService.getNotifications;
      case 'parent':
        return parentService.getNotifications;
      default:
        return studentService.getNotifications;
    }
  };

  // Get mark as read service based on role
  const getMarkAsReadService = () => {
    switch (userRole) {
      case 'admin':
        return adminService.markNotificationAsRead;
      case 'staff':
        return staffService.markNotificationAsRead;
      case 'student':
        return studentService.markNotificationAsRead;
      case 'parent':
        return parentService.markNotificationAsRead;
      default:
        return studentService.markNotificationAsRead;
    }
  };

  // Fetch notifications from backend
  const fetchNotifications = async () => {
    // Only fetch if user is authenticated
    if (!isAuthenticated || !user) {
      setNotifications([]);
      setShowEmpty(true);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const service = getNotificationService();
      const data = await service({ isRead: false }); // Fetch unread notifications for badge count
      const allData = await service({}); // Fetch all notifications for display
      
      if (Array.isArray(allData)) {
        setNotifications(allData);
        setShowEmpty(allData.length === 0);
      } else {
        setNotifications([]);
        setShowEmpty(true);
      }
    } catch (error) {
      // Only log errors that aren't authentication-related
      if (error.response?.status !== 401 && error.response?.status !== 403) {
        console.error('Failed to fetch notifications:', error);
      }
      setNotifications([]);
      setShowEmpty(true);
    } finally {
      setLoading(false);
    }
  };

  // Format notification for display
  const formatNotification = (notification) => {
    const getIcon = () => {
      switch (notification.type) {
        case 'payment':
          return <IconCurrencyDollar />;
        case 'complaint':
        case 'maintenance':
          return <IconAlertCircle />;
        case 'attendance':
          return <IconCheck />;
        case 'room':
        case 'booking':
          return <IconDoor />;
        case 'event':
          return <IconCalendar />;
        default:
          return <IconBell />;
      }
    };

    const formatTitle = () => {
      let title = notification.title || 'Notification';
      
      // Add student details to title if available
      if (notification.studentDetails && notification.studentDetails.name) {
        const studentName = notification.studentDetails.name;
        const studentId = notification.studentDetails.studentId || notification.studentDetails.admissionNumber;
        if (studentId) {
          title = `${title} · ${studentName} (${studentId})`;
        } else {
          title = `${title} · ${studentName}`;
        }
      }
      
      // Add parent details to title if available
      if (notification.parentDetails && notification.parentDetails.name) {
        const parentName = notification.parentDetails.name;
        if (notification.studentDetails && notification.studentDetails.name) {
          title = `${title} · Parent: ${parentName}`;
        } else {
          title = `${title} · ${parentName}`;
        }
      }
      
      return title;
    };

    const formatSubTitle = () => {
      if (notification.studentDetails) {
        const parts = [];
        if (notification.studentDetails.course) {
          parts.push(notification.studentDetails.course);
        }
        if (notification.studentDetails.roomNumber) {
          const roomInfo = `Room ${notification.studentDetails.roomNumber}`;
          if (notification.studentDetails.block) {
            parts.push(`${roomInfo} (Block ${notification.studentDetails.block})`);
          } else {
            parts.push(roomInfo);
          }
        }
        if (parts.length > 0) {
          return parts.join(' · ');
        }
      }
      
      if (notification.parentDetails && notification.studentDetails) {
        return `Child: ${notification.studentDetails.name} (${notification.studentDetails.studentId || notification.studentDetails.admissionNumber || 'N/A'})`;
      }
      
      return notification.message?.substring(0, 50) || 'Notification';
    };

    const formatDateTime = (date) => {
      if (!date) return '';
      const notificationDate = new Date(date);
      const now = new Date();
      const diffInMs = now - notificationDate;
      const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
      
      if (diffInDays === 0) {
        return 'Today';
      } else if (diffInDays === 1) {
        return 'Yesterday';
      } else if (diffInDays < 7) {
        return `${diffInDays} days ago`;
      } else {
        return notificationDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      }
    };

    return {
      id: notification._id || notification.id,
      avatar: getIcon(),
      title: formatTitle(),
      subTitle: formatSubTitle(),
      dateTime: formatDateTime(notification.sentAt || notification.createdAt),
      isSeen: notification.isRead || false,
      notification: notification, // Keep original for mark as read
    };
  };

  // Filter and group notifications by date
  const groupedNotifications = useMemo(() => {
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    
    const recent = [];
    const older = [];
    
    // Filter notifications based on selected filter category
    const filterNotificationsByCategory = (notification) => {
      if (selectedFilter === 'All notification') {
        return true;
      }

      const filterLower = selectedFilter.toLowerCase();
      const notificationType = notification.type?.toLowerCase() || '';
      const entityType = notification.relatedEntity?.entityType?.toLowerCase() || '';
      const title = notification.title?.toLowerCase() || '';
      const message = notification.message?.toLowerCase() || '';

      // Role-specific filtering logic
      switch (userRole) {
        case 'admin':
          if (filterLower === 'students') {
            return entityType === 'student' || 
                   notificationType === 'attendance' ||
                   title.includes('student') ||
                   message.includes('student');
          }
          if (filterLower === 'rooms') {
            return entityType === 'room' || 
                   title.includes('room') ||
                   message.includes('room');
          }
          if (filterLower === 'bookings') {
            return entityType === 'booking' ||
                   title.includes('booking') ||
                   message.includes('booking');
          }
          if (filterLower === 'payments') {
            return notificationType === 'payment' || 
                   entityType === 'payment' ||
                   title.includes('payment') ||
                   message.includes('payment');
          }
          if (filterLower === 'maintenance') {
            return notificationType === 'maintenance' ||
                   entityType === 'complaint' ||
                   title.includes('maintenance') ||
                   title.includes('complaint') ||
                   message.includes('maintenance') ||
                   message.includes('complaint');
          }
          break;

        case 'staff':
          if (filterLower === 'check-ins') {
            return notificationType === 'attendance' ||
                   title.includes('check-in') ||
                   title.includes('attendance') ||
                   message.includes('check-in') ||
                   message.includes('attendance');
          }
          if (filterLower === 'inspections') {
            return title.includes('inspection') ||
                   message.includes('inspection') ||
                   entityType === 'room';
          }
          if (filterLower === 'requests') {
            return entityType === 'stockrequest' ||
                   entityType === 'complaint' ||
                   title.includes('request') ||
                   title.includes('stock') ||
                   message.includes('request') ||
                   message.includes('stock');
          }
          if (filterLower === 'maintenance') {
            return notificationType === 'maintenance' ||
                   entityType === 'complaint' ||
                   title.includes('maintenance') ||
                   title.includes('complaint') ||
                   message.includes('maintenance') ||
                   message.includes('complaint');
          }
          break;

        case 'student':
          if (filterLower === 'room') {
            return entityType === 'room' ||
                   entityType === 'roomchangerequest' ||
                   title.includes('room') ||
                   message.includes('room');
          }
          if (filterLower === 'payments') {
            return notificationType === 'payment' ||
                   entityType === 'payment' ||
                   title.includes('payment') ||
                   message.includes('payment');
          }
          if (filterLower === 'maintenance') {
            return notificationType === 'maintenance' ||
                   entityType === 'complaint' ||
                   title.includes('maintenance') ||
                   title.includes('complaint') ||
                   message.includes('maintenance') ||
                   message.includes('complaint');
          }
          if (filterLower === 'events') {
            return notificationType === 'event' ||
                   title.includes('event') ||
                   message.includes('event');
          }
          break;

        case 'parent':
          if (filterLower === 'children') {
            return entityType === 'student' ||
                   title.includes('child') ||
                   title.includes('student') ||
                   message.includes('child') ||
                   message.includes('student');
          }
          if (filterLower === 'payments') {
            return notificationType === 'payment' ||
                   entityType === 'payment' ||
                   title.includes('payment') ||
                   message.includes('payment');
          }
          if (filterLower === 'updates') {
            return notificationType === 'general' ||
                   notificationType === 'system' ||
                   title.includes('update') ||
                   message.includes('update');
          }
          break;
      }

      return false;
    };
    
    // Filter notifications first, then group by date
    const filteredNotifications = notifications.filter(filterNotificationsByCategory);
    
    filteredNotifications.forEach((notification) => {
      const notificationDate = new Date(notification.sentAt || notification.createdAt);
      const formatted = formatNotification(notification);
      
      if (notificationDate >= sevenDaysAgo) {
        recent.push(formatted);
      } else {
        older.push(formatted);
      }
    });
    
    return { recent, older };
  }, [notifications, selectedFilter, userRole]);

  // Initial fetch and setup polling (only when authenticated)
  useEffect(() => {
    // Only fetch if authenticated
    if (!isAuthenticated || !user) {
      setNotifications([]);
      setShowEmpty(true);
      // Clear any existing polling interval
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
      return;
    }

    fetchNotifications();
    
    // Set up polling every 30 seconds for real-time updates
    pollingIntervalRef.current = setInterval(() => {
      fetchNotifications();
    }, 30000); // 30 seconds
    
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
    };
  }, [userRole, isAuthenticated, user]);

  // Role-specific notification filter categories
  const getListContent = () => {
    switch (userRole) {
      case 'admin':
        return ['All notification', 'Students', 'Rooms', 'Bookings', 'Payments', 'Maintenance'];
      case 'staff':
        return ['All notification', 'Check-ins', 'Inspections', 'Requests', 'Maintenance'];
      case 'student':
        return ['All notification', 'Room', 'Payments', 'Maintenance', 'Events'];
      case 'parent':
        return ['All notification', 'Children', 'Payments', 'Updates'];
      default:
        return ['All notification'];
    }
  };

  const listcontent = getListContent();

  const handleActionClick = (event) => {
    setAnchorEl(anchorEl ? null : event.currentTarget);
    // Refresh notifications when opening (only if authenticated)
    if (!anchorEl && isAuthenticated && user) {
      fetchNotifications();
    }
  };

  const handleInnerActionClick = (event) => {
    setInnerAnchorEl(innerAnchorEl ? null : event.currentTarget);
  };

  const handleFilterSelect = (filter) => {
    setSelectedFilter(filter);
    setInnerAnchorEl(null); // Close the filter dropdown
  };

  // Function to mark all notifications as read
  const handleMarkAllAsRead = async () => {
    try {
      const service = getMarkAsReadService();
      const unreadNotifications = notifications.filter(n => !n.isRead);
      
      await Promise.all(
        unreadNotifications.map(notification => 
          service(notification._id || notification.id || notification.notification?._id || notification.notification?.id).catch(err => {
            console.error('Failed to mark notification as read:', err);
          })
        )
      );
      
      // Update local state
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    }
  };

  const handleClearAll = () => {
    setNotifications([]);
    setShowEmpty(true);
  };

  const handleNotificationClick = async (notification) => {
    if (!notification.isSeen && notification.notification) {
      try {
        const service = getMarkAsReadService();
        await service(notification.id);
        // Update local state
        setNotifications(prev =>
          prev.map(n => {
            const nId = n._id || n.id;
            return nId === notification.id ? { ...n, isRead: true } : n;
          })
        );
      } catch (error) {
        console.error('Failed to mark notification as read:', error);
      }
    }
  };

  // Calculate unread count based on filtered notifications
  const unreadCount = useMemo(() => {
    if (selectedFilter === 'All notification') {
      return notifications.filter(n => !n.isRead).length;
    }

    const filterLower = selectedFilter.toLowerCase();
    return notifications.filter(n => {
      if (n.isRead) return false;
      
      const notificationType = n.type?.toLowerCase() || '';
      const entityType = n.relatedEntity?.entityType?.toLowerCase() || '';
      const title = n.title?.toLowerCase() || '';
      const message = n.message?.toLowerCase() || '';

      switch (userRole) {
        case 'admin':
          if (filterLower === 'students') {
            return entityType === 'student' || notificationType === 'attendance' || title.includes('student') || message.includes('student');
          }
          if (filterLower === 'rooms') {
            return entityType === 'room' || title.includes('room') || message.includes('room');
          }
          if (filterLower === 'bookings') {
            return entityType === 'booking' || title.includes('booking') || message.includes('booking');
          }
          if (filterLower === 'payments') {
            return notificationType === 'payment' || entityType === 'payment' || title.includes('payment') || message.includes('payment');
          }
          if (filterLower === 'maintenance') {
            return notificationType === 'maintenance' || entityType === 'complaint' || title.includes('maintenance') || title.includes('complaint') || message.includes('maintenance') || message.includes('complaint');
          }
          break;
        case 'staff':
          if (filterLower === 'check-ins') {
            return notificationType === 'attendance' || title.includes('check-in') || title.includes('attendance') || message.includes('check-in') || message.includes('attendance');
          }
          if (filterLower === 'inspections') {
            return title.includes('inspection') || message.includes('inspection') || entityType === 'room';
          }
          if (filterLower === 'requests') {
            return entityType === 'stockrequest' || entityType === 'complaint' || title.includes('request') || title.includes('stock') || message.includes('request') || message.includes('stock');
          }
          if (filterLower === 'maintenance') {
            return notificationType === 'maintenance' || entityType === 'complaint' || title.includes('maintenance') || title.includes('complaint') || message.includes('maintenance') || message.includes('complaint');
          }
          break;
        case 'student':
          if (filterLower === 'room') {
            return entityType === 'room' || entityType === 'roomchangerequest' || title.includes('room') || message.includes('room');
          }
          if (filterLower === 'payments') {
            return notificationType === 'payment' || entityType === 'payment' || title.includes('payment') || message.includes('payment');
          }
          if (filterLower === 'maintenance') {
            return notificationType === 'maintenance' || entityType === 'complaint' || title.includes('maintenance') || title.includes('complaint') || message.includes('maintenance') || message.includes('complaint');
          }
          if (filterLower === 'events') {
            return notificationType === 'event' || title.includes('event') || message.includes('event');
          }
          break;
        case 'parent':
          if (filterLower === 'children') {
            return entityType === 'student' || title.includes('child') || title.includes('student') || message.includes('child') || message.includes('student');
          }
          if (filterLower === 'payments') {
            return notificationType === 'payment' || entityType === 'payment' || title.includes('payment') || message.includes('payment');
          }
          if (filterLower === 'updates') {
            return notificationType === 'general' || notificationType === 'system' || title.includes('update') || message.includes('update');
          }
          break;
      }
      return false;
    }).length;
  }, [notifications, selectedFilter, userRole]);
  const allRead = unreadCount === 0;
  const showEmptyState = groupedNotifications.recent.length === 0 && groupedNotifications.older.length === 0;

  return (
    <>
      <IconButton
        variant="outlined"
        color="secondary"
        size="small"
        onClick={handleActionClick}
        aria-label="show notifications"
        {...(unreadCount > 0 && { sx: { '& svg': { animation: `${swing} 1s ease infinite` } } })}
      >
        <Badge
          color="error"
          variant="dot"
          invisible={allRead || notifications.length === 0}
          slotProps={{
            badge: { sx: { height: 6, minWidth: 6, top: 4, right: 4, border: `1px solid ${theme.palette.background.default}` } }
          }}
        >
          <IconBell size={16} />
        </Badge>
      </IconButton>
      <Popper
        placement="bottom-end"
        id={id}
        open={open}
        anchorEl={anchorEl}
        popperOptions={{
          modifiers: [{ name: 'offset', options: { offset: [downSM ? 45 : 0, 8] } }]
        }}
        transition
      >
        {({ TransitionProps }) => (
          <Fade in={open} {...TransitionProps}>
            <MainCard
              sx={{
                borderRadius: 2,
                boxShadow: theme.customShadows.tooltip,
                width: 1,
                minWidth: { xs: 352, sm: 240 },
                maxWidth: { xs: 352, md: 420 },
                p: 0
              }}
            >
              <ClickAwayListener onClickAway={() => setAnchorEl(null)}>
                <Box>
                  <CardHeader
                    sx={{ p: 1 }}
                    title={
                      <Stack direction="row" sx={{ gap: 1, justifyContent: 'space-between' }}>
                        <Button
                          color="secondary"
                          size="small"
                          sx={{ typography: 'h6' }}
                          endIcon={<IconChevronDown size={16} />}
                          onClick={handleInnerActionClick}
                        >
                          {selectedFilter}
                        </Button>
                        <Popper
                          placement="bottom-start"
                          id={innerId}
                          open={innerOpen}
                          anchorEl={innerAnchorEl}
                          transition
                          popperOptions={{ modifiers: [{ name: 'preventOverflow', options: { boundary: 'clippingParents' } }] }}
                        >
                          {({ TransitionProps }) => (
                            <Fade in={innerOpen} {...TransitionProps}>
                              <MainCard sx={{ borderRadius: 2, boxShadow: theme.customShadows.tooltip, minWidth: 156, p: 0.5 }}>
                                <ClickAwayListener onClickAway={() => setInnerAnchorEl(null)}>
                                  <List disablePadding>
                                    {listcontent.map((item, index) => (
                                      <ListItemButton 
                                        key={index} 
                                        sx={{
                                          ...buttonStyle,
                                          bgcolor: selectedFilter === item ? 'action.selected' : 'transparent'
                                        }} 
                                        onClick={() => handleFilterSelect(item)}
                                      >
                                        <ListItemText>{item}</ListItemText>
                                      </ListItemButton>
                                    ))}
                                  </List>
                                </ClickAwayListener>
                              </MainCard>
                            </Fade>
                          )}
                        </Popper>
                        {!showEmptyState && (
                          <Button color="primary" size="small" onClick={handleMarkAllAsRead} disabled={allRead}>
                            Mark All as Read
                          </Button>
                        )}
                      </Stack>
                    }
                  />
                  {loading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                      <CircularProgress size={24} />
                    </Box>
                  ) : showEmptyState ? (
                    <EmptyNotification />
                  ) : (
                    <Fragment>
                      <CardContent sx={{ px: 0.5, py: 2, '&:last-child': { pb: 2 } }}>
                        <SimpleBar sx={{ maxHeight: 405, height: 1 }}>
                          <List disablePadding>
                            {groupedNotifications.recent.length > 0 && (
                              <>
                                <ListSubheader disableSticky sx={{ color: 'text.disabled', typography: 'caption', py: 0.5, px: 1, mb: 0.5 }}>
                                  Last 7 Days
                                </ListSubheader>
                                {groupedNotifications.recent.map((notification) => (
                                  <ListItemButton 
                                    key={notification.id} 
                                    sx={buttonStyle}
                                    onClick={() => handleNotificationClick(notification)}
                                  >
                                    <NotificationItem
                                      avatar={notification.avatar}
                                      title={notification.title}
                                      subTitle={notification.subTitle}
                                      dateTime={notification.dateTime}
                                      isSeen={notification.isSeen}
                                    />
                                  </ListItemButton>
                                ))}
                              </>
                            )}
                            {groupedNotifications.older.length > 0 && (
                              <>
                                <ListSubheader
                                  disableSticky
                                  sx={{ color: 'text.disabled', typography: 'caption', py: 0.5, px: 1, mb: 0.5, mt: 1.5 }}
                                >
                                  Older
                                </ListSubheader>
                                {groupedNotifications.older.map((notification) => (
                                  <ListItemButton 
                                    key={notification.id} 
                                    sx={buttonStyle}
                                    onClick={() => handleNotificationClick(notification)}
                                  >
                                    <NotificationItem
                                      avatar={notification.avatar}
                                      title={notification.title}
                                      subTitle={notification.subTitle}
                                      dateTime={notification.dateTime}
                                      isSeen={notification.isSeen}
                                    />
                                  </ListItemButton>
                                ))}
                              </>
                            )}
                          </List>
                        </SimpleBar>
                      </CardContent>
                      <CardActions sx={{ p: 1 }}>
                        <Button fullWidth color="error" onClick={handleClearAll}>
                          Clear all
                        </Button>
                      </CardActions>
                    </Fragment>
                  )}
                </Box>
              </ClickAwayListener>
            </MainCard>
          </Fade>
        )}
      </Popper>
    </>
  );
}
