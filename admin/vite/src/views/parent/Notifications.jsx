import { useState, useEffect } from 'react';

// @mui
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import IconButton from '@mui/material/IconButton';

// @project
import ComponentsWrapper from '@/components/ComponentsWrapper';
import PresentationCard from '@/components/cards/PresentationCard';
import parentService from '@/services/parentService';
import { useSnackbar } from 'notistack';

// @icons
import { IconBell, IconCheck, IconX, IconUser, IconPhone, IconMapPin } from '@tabler/icons-react';

/***************************  NOTIFICATIONS PAGE  ***************************/

export default function NotificationsPage() {
  const { enqueueSnackbar } = useSnackbar();
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState([]);
  const [filterType, setFilterType] = useState('all');
  const [filterRead, setFilterRead] = useState('all');

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const params = {};
      if (filterRead !== 'all') {
        params.isRead = filterRead === 'read';
      }
      const data = await parentService.getNotifications(params);
      setNotifications(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Fetch notifications error:', err);
      enqueueSnackbar(err.response?.data?.message || 'Failed to load notifications', { variant: 'error' });
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, [filterRead]);

  const handleMarkAsRead = async (notificationId) => {
    try {
      await parentService.markNotificationAsRead(notificationId);
      setNotifications(notifications.map(n => 
        n._id === notificationId ? { ...n, isRead: true } : n
      ));
      enqueueSnackbar('Notification marked as read', { variant: 'success' });
    } catch (err) {
      enqueueSnackbar(err.response?.data?.message || 'Failed to mark notification as read', { variant: 'error' });
    }
  };

  const filteredNotifications = notifications.filter(notification => {
    // Filter by type - handle visitor notifications specially
    if (filterType !== 'all') {
      if (filterType === 'visitor') {
        // Show visitor-related notifications (check-in/check-out)
        if (!notification.title?.toLowerCase().includes('visitor') && 
            !notification.message?.toLowerCase().includes('checked in') &&
            !notification.message?.toLowerCase().includes('checked out')) {
          return false;
        }
      } else if (filterType === 'payment') {
        // Handle both 'payment' and 'fee' types for backward compatibility
        if (notification.type !== 'payment' && notification.type !== 'fee') {
          return false;
        }
      } else if (notification.type !== filterType) {
        return false;
      }
    }
    if (filterRead === 'read' && !notification.isRead) {
      return false;
    }
    if (filterRead === 'unread' && notification.isRead) {
      return false;
    }
    return true;
  });

  const notificationTypes = ['all', 'payment', 'complaint', 'attendance', 'activity', 'visitor', 'general'];

  return (
    <ComponentsWrapper title="Notifications">
      <PresentationCard>
        {/* Filters */}
        <Stack direction="row" spacing={2} sx={{ mb: 3 }}>
          <FormControl sx={{ minWidth: 150 }}>
            <InputLabel>Filter by Type</InputLabel>
            <Select
              value={filterType}
              label="Filter by Type"
              onChange={(e) => setFilterType(e.target.value)}
            >
              {notificationTypes.map((type) => (
                <MenuItem key={type} value={type}>
                  {type === 'payment' ? 'Payment/Fee' : type.charAt(0).toUpperCase() + type.slice(1)}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl sx={{ minWidth: 150 }}>
            <InputLabel>Filter by Status</InputLabel>
            <Select
              value={filterRead}
              label="Filter by Status"
              onChange={(e) => setFilterRead(e.target.value)}
            >
              <MenuItem value="all">All</MenuItem>
              <MenuItem value="read">Read</MenuItem>
              <MenuItem value="unread">Unread</MenuItem>
            </Select>
          </FormControl>
        </Stack>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        ) : filteredNotifications.length === 0 ? (
          <Alert severity="info">No notifications found</Alert>
        ) : (
          <Stack spacing={2}>
            {filteredNotifications.map((notification) => (
              <Card
                key={notification._id}
                variant="outlined"
                sx={{
                  p: 3,
                  bgcolor: notification.isRead ? 'background.paper' : 'action.hover',
                  borderLeft: notification.isRead ? 0 : 4,
                  borderLeftColor: 'primary.main'
                }}
              >
                <Stack spacing={2}>
                  <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                    <Stack direction="row" spacing={1} alignItems="center">
                      <IconBell size={20} />
                      <Typography variant="h6">{notification.title}</Typography>
                      {!notification.isRead && (
                        <Chip label="New" color="primary" size="small" />
                      )}
                    </Stack>
                    <Stack direction="row" spacing={1}>
                      {notification.type && (
                        <Chip label={notification.type} size="small" variant="outlined" />
                      )}
                      {!notification.isRead && (
                        <IconButton
                          size="small"
                          onClick={() => handleMarkAsRead(notification._id)}
                          color="primary"
                        >
                          <IconCheck size={18} />
                        </IconButton>
                      )}
                    </Stack>
                  </Stack>
                  <Typography variant="body2" color="text.secondary">
                    {notification.message}
                  </Typography>
                  {notification.studentDetails && (
                    <Stack spacing={1} sx={{ mt: 1, p: 1.5, bgcolor: 'background.default', borderRadius: 1 }}>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <IconUser size={16} />
                        <Typography variant="caption" fontWeight={600}>
                          Child: {notification.studentDetails.name} ({notification.studentDetails.studentId || notification.studentDetails.admissionNumber})
                        </Typography>
                      </Stack>
                      {notification.studentDetails.roomNumber && (
                        <Stack direction="row" spacing={1} alignItems="center">
                          <IconMapPin size={16} />
                          <Typography variant="caption" color="text.secondary">
                            Room: {notification.studentDetails.roomNumber}
                            {notification.studentDetails.block && `, Block: ${notification.studentDetails.block}`}
                          </Typography>
                        </Stack>
                      )}
                    </Stack>
                  )}
                  <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap">
                    <Typography variant="caption" color="text.secondary">
                      {notification.sentAt ? new Date(notification.sentAt).toLocaleString() : 'Recently'}
                    </Typography>
                    {notification.relatedEntity && notification.relatedEntity.entityType !== 'stockRequest' && (
                      <Chip
                        label={`Related: ${notification.relatedEntity.entityType}`}
                        size="small"
                        variant="outlined"
                      />
                    )}
                  </Stack>
                </Stack>
              </Card>
            ))}
          </Stack>
        )}
      </PresentationCard>
    </ComponentsWrapper>
  );
}

