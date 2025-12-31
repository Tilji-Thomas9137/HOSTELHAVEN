import { useEffect, useMemo, useState } from 'react';

import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import Divider from '@mui/material/Divider';
import FormControlLabel from '@mui/material/FormControlLabel';
import Stack from '@mui/material/Stack';
import Switch from '@mui/material/Switch';
import Typography from '@mui/material/Typography';

import { IconBell, IconRefresh, IconUserShield } from '@tabler/icons-react';

import ComponentsWrapper from '@/components/ComponentsWrapper';
import PresentationCard from '@/components/cards/PresentationCard';
import staffService from '@/services/staffService';
import { useSnackbar } from 'notistack';

const originColorMap = {
  admin: 'primary',
  student: 'secondary',
  staff: 'info',
  system: 'default'
};

const priorityColorMap = {
  urgent: 'error',
  high: 'warning',
  medium: 'info',
  low: 'default'
};

const preferenceToggles = [
  { key: 'duty', label: 'Duty change alerts', defaultChecked: true },
  { key: 'inventory', label: 'Inventory low stock', defaultChecked: true },
  { key: 'complaint', label: 'Complaint updates', defaultChecked: true },
  { key: 'meal', label: 'Meal plan updates', defaultChecked: false },
  { key: 'attendance', label: 'Attendance reminders', defaultChecked: true }
];

const formatDateTime = (value) => {
  if (!value) return '—';
  return new Date(value).toLocaleString();
};

export default function StaffNotifications() {
  const { enqueueSnackbar } = useSnackbar();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState('');
  const [filter, setFilter] = useState('all');
  const [preferences, setPreferences] = useState(() => {
    // initialise from defaults
    const initial = {};
    preferenceToggles.forEach((p) => {
      initial[p.key] = p.defaultChecked;
    });
    return initial;
  });

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const data = await staffService.getNotifications();
      setNotifications(data || []);
    } catch (error) {
      console.error('Failed to fetch notifications', error);
      enqueueSnackbar(error.response?.data?.message || 'Failed to fetch notifications', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const handleMarkRead = async (id) => {
    try {
      setUpdatingId(id);
      await staffService.markNotificationAsRead(id);
      setNotifications((prev) =>
        prev.map((notification) => (notification._id === id ? { ...notification, isRead: true, readAt: new Date().toISOString() } : notification))
      );
    } catch (error) {
      enqueueSnackbar(error.response?.data?.message || 'Failed to update notification', { variant: 'error' });
    } finally {
      setUpdatingId('');
    }
  };

  const filteredNotifications = useMemo(() => {
    let list = notifications;
    if (filter === 'unread') {
      list = list.filter((notification) => !notification.isRead);
    }

    // If all preferences are on, just return list as-is
    const anyPrefOn = Object.values(preferences).some(Boolean);
    if (!anyPrefOn) {
      // If staff turns everything off, hide all categorized notifications
      return [];
    }

    const isCategorised = (n) => {
      const type = n.type;
      const entity = n.relatedEntity?.entityType;
      return (
        type === 'inventory' ||
        type === 'complaint' ||
        type === 'attendance' ||
        entity === 'staffSchedule' ||
        entity === 'mealSuggestion' ||
        entity === 'stockRequest'
      );
    };

    return list.filter((n) => {
      const type = n.type;
      const entity = n.relatedEntity?.entityType;

      const matchesDuty = preferences.duty && entity === 'staffSchedule';
      const matchesInventory =
        preferences.inventory && (type === 'inventory' || entity === 'stockRequest');
      const matchesComplaint =
        preferences.complaint && (type === 'complaint' || entity === 'complaint');
      const matchesMeal = preferences.meal && entity === 'mealSuggestion';
      const matchesAttendance = preferences.attendance && type === 'attendance';

      const matchesCategory =
        matchesDuty || matchesInventory || matchesComplaint || matchesMeal || matchesAttendance;

      // For notifications that don't belong to any of these categories,
      // always show them (general/system messages, etc.).
      if (!isCategorised(n)) {
        return true;
      }

      return matchesCategory;
    });
  }, [filter, notifications, preferences]);

  return (
    <ComponentsWrapper title="Notifications">
      <Stack spacing={3}>
        <PresentationCard
          title="Recent Updates"
          secondary={
            <Stack direction="row" spacing={1}>
              <Button size="small" variant={filter === 'all' ? 'contained' : 'outlined'} onClick={() => setFilter('all')}>
                All
              </Button>
              <Button size="small" variant={filter === 'unread' ? 'contained' : 'outlined'} onClick={() => setFilter('unread')}>
                Unread
              </Button>
              <Button size="small" variant="text" startIcon={<IconRefresh size={16} />} onClick={fetchNotifications}>
                Refresh
              </Button>
            </Stack>
          }
        >
          {loading ? (
            <Stack alignItems="center" py={4}>
              <CircularProgress />
            </Stack>
          ) : filteredNotifications.length === 0 ? (
            <Stack alignItems="center" spacing={1} py={4}>
              <IconUserShield size={56} color="#9DA4AE" />
              <Typography variant="body2" color="text.secondary">
                {filter === 'unread' ? 'You are all caught up!' : 'No notifications available yet.'}
              </Typography>
            </Stack>
          ) : (
            <Stack divider={<Divider flexItem />} spacing={2}>
              {filteredNotifications.map((notification) => (
                <Stack key={notification._id} spacing={1}>
                  <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ xs: 'flex-start', sm: 'center' }} spacing={1}>
                    <Typography variant="subtitle1" fontWeight={600}>
                      {notification.title}
                    </Typography>
                    <Stack direction="row" spacing={1} flexWrap="wrap">
                      {notification.studentDetails ? (
                        <Chip
                          size="small"
                          variant="outlined"
                          label={`${notification.studentDetails.name} (${notification.studentDetails.studentId || 'N/A'})`}
                          color={originColorMap[notification.origin] || 'default'}
                          sx={{ fontWeight: 600 }}
                        />
                      ) : (
                        <Chip
                          size="small"
                          variant="outlined"
                          label={`From ${notification.origin || 'system'}`}
                          color={originColorMap[notification.origin] || 'default'}
                        />
                      )}
                      {notification.priority && notification.priority !== 'medium' && (
                        <Chip
                          size="small"
                          label={notification.priority}
                          color={priorityColorMap[notification.priority] || 'default'}
                        />
                      )}
                      {notification.type && <Chip size="small" variant="outlined" label={notification.type} />}
                    </Stack>
                  </Stack>

                  {notification.studentDetails && (
                    <Stack spacing={0.5} sx={{ mb: 1, p: 1.5, bgcolor: 'action.hover', borderRadius: 1 }}>
                      <Typography variant="caption" color="text.secondary" fontWeight={600}>
                        Student Details:
                      </Typography>
                      <Stack direction="row" spacing={2} flexWrap="wrap">
                        <Typography variant="caption" color="text.secondary">
                          <strong>Name:</strong> {notification.studentDetails.name || 'N/A'}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          <strong>ID:</strong> {notification.studentDetails.studentId || notification.studentDetails.admissionNumber || 'N/A'}
                        </Typography>
                        {notification.studentDetails.course && (
                          <Typography variant="caption" color="text.secondary">
                            <strong>Course:</strong> {notification.studentDetails.course}
                          </Typography>
                        )}
                        {notification.studentDetails.batchYear && (
                          <Typography variant="caption" color="text.secondary">
                            <strong>Batch:</strong> {notification.studentDetails.batchYear}
                          </Typography>
                        )}
                        {notification.studentDetails.roomNumber && (
                          <Typography variant="caption" color="text.secondary">
                            <strong>Room:</strong> {notification.studentDetails.roomNumber}
                            {notification.studentDetails.block && ` (Block: ${notification.studentDetails.block})`}
                          </Typography>
                        )}
                      </Stack>
                    </Stack>
                  )}
                  <Typography 
                    variant="body2" 
                    color="text.secondary"
                    sx={{ 
                      whiteSpace: 'pre-line',
                      wordBreak: 'break-word',
                      lineHeight: 1.6,
                      '& strong': {
                        fontWeight: 600,
                        color: 'text.primary'
                      }
                    }}
                  >
                    {notification.message}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {formatDateTime(notification.sentAt)}
                  </Typography>

                  <Stack direction="row" spacing={1}>
                    {!notification.isRead && (
                      <Button
                        size="small"
                        variant="outlined"
                        onClick={() => handleMarkRead(notification._id)}
                        disabled={updatingId === notification._id}
                      >
                        {updatingId === notification._id ? 'Updating...' : 'Mark as read'}
                      </Button>
                    )}
                  </Stack>
                </Stack>
              ))}
            </Stack>
          )}
        </PresentationCard>

        <PresentationCard title="Notification Preferences">
          <Stack spacing={2}>
            {preferenceToggles.map((item) => (
              <FormControlLabel
                key={item.key}
                control={
                  <Switch
                    checked={preferences[item.key]}
                    onChange={(e) =>
                      setPreferences((prev) => ({
                        ...prev,
                        [item.key]: e.target.checked
                      }))
                    }
                  />
                }
                label={item.label}
              />
            ))}
            <Alert severity="info" icon={<IconBell size={18} />}>
              Notifications triggered by students and admins are automatically shared with staff so you can coordinate responses quickly.
            </Alert>
          </Stack>
        </PresentationCard>
      </Stack>
    </ComponentsWrapper>
  );
}


