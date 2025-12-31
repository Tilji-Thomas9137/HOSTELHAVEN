import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

// @mui
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import { useTheme } from '@mui/material/styles';

// @project
import OverviewCard from '@/components/cards/OverviewCard';
import MainCard from '@/components/MainCard';
import { getRadiusStyles } from '@/utils/getRadiusStyles';
import staffService from '@/services/staffService';
import { useSnackbar } from 'notistack';

// @assets
import { IconArrowUp, IconUsers, IconDoor, IconCalendar, IconCheck, IconAlertCircle } from '@tabler/icons-react';

/***************************  STAFF DASHBOARD  ***************************/

export function applyBorderWithRadius(radius, theme) {
  return {
    overflow: 'hidden',
    '--Grid-borderWidth': '1px',
    borderTop: 'var(--Grid-borderWidth) solid',
    borderLeft: 'var(--Grid-borderWidth) solid',
    borderColor: 'divider',
    '& > div': {
      overflow: 'hidden',
      borderRight: 'var(--Grid-borderWidth) solid',
      borderBottom: 'var(--Grid-borderWidth) solid',
      borderColor: 'divider',
      [theme.breakpoints.down('md')]: {
        '&:nth-of-type(1)': getRadiusStyles(radius, 'topLeft'),
        '&:nth-of-type(2)': getRadiusStyles(radius, 'topRight'),
        '&:nth-of-type(3)': getRadiusStyles(radius, 'bottomLeft'),
        '&:nth-of-type(4)': getRadiusStyles(radius, 'bottomRight')
      },
      [theme.breakpoints.up('md')]: {
        '&:first-of-type': getRadiusStyles(radius, 'topLeft', 'bottomLeft'),
        '&:last-of-type': getRadiusStyles(radius, 'topRight', 'bottomRight')
      }
    }
  };
}

export default function StaffDashboard() {
  const theme = useTheme();
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState(null);

  useEffect(() => {
    fetchDashboardData();
    // Set up auto-refresh every 30 seconds for real-time updates
    const interval = setInterval(fetchDashboardData, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const data = await staffService.getDashboardStats();
      setDashboardData(data);
    } catch (err) {
      console.error('Dashboard fetch error:', err);
      enqueueSnackbar(err.response?.data?.message || 'Failed to load dashboard data', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  // Quick action handlers
  const handleNewCheckIn = () => {
    navigate('/app/staff/attendance');
  };

  const handleRoomInspection = () => {
    navigate('/app/staff/cleaning-requests');
  };

  const handleViewSchedule = () => {
    navigate('/app/staff/schedules');
  };

  const handlePendingRequests = () => {
    navigate('/app/staff/complaints');
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <CircularProgress />
      </Box>
    );
  }

  const stats = dashboardData?.stats || {};
  const recentActivities = dashboardData?.recentActivities || [];

  const staffOverviewData = [
    {
      title: 'My Assignments',
      value: stats.myAssignments?.toString() || '0',
      compare: 'Active tasks this month',
      chip: {
        label: `${stats.newAssignments || 0} new`,
        avatar: <IconArrowUp />
      }
    },
    {
      title: 'Check-ins Today',
      value: stats.checkInsToday?.toString() || '0',
      compare: 'Compared to yesterday',
      chip: {
        label: `${stats.checkInChange >= 0 ? '+' : ''}${stats.checkInChange?.toFixed(1) || 0}%`,
        avatar: <IconArrowUp />
      }
    },
    {
      title: 'Pending Requests',
      value: stats.pendingRequests?.toString() || '0',
      compare: 'Requires attention',
      chip: {
        label: `${stats.urgentRequests || 0} urgent`,
        color: stats.urgentRequests > 0 ? 'error' : 'default',
        avatar: <IconAlertCircle />
      }
    },
    {
      title: 'Room Inspections',
      value: stats.roomInspections?.toString() || '0',
      compare: 'This week',
      chip: {
        label: `${stats.inspectionProgress || 0}% done`,
        avatar: <IconCheck />
      }
    }
  ];

  return (
    <Grid container spacing={{ xs: 2, md: 3 }}>
      <Grid size={12}>
        <Typography variant="h4" sx={{ mb: 2 }}>Staff Dashboard</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Manage your daily tasks, check-ins, and assignments
        </Typography>
      </Grid>

      <Grid size={12}>
        <Grid container sx={{ borderRadius: 4, boxShadow: theme.customShadows.section, ...applyBorderWithRadius(16, theme) }}>
          {staffOverviewData.map((item, index) => (
            <Grid key={index} size={{ xs: 6, sm: 6, md: 3 }}>
              <OverviewCard {...{ ...item, cardProps: { sx: { border: 'none', borderRadius: 0, boxShadow: 'none' } } }} />
            </Grid>
          ))}
        </Grid>
      </Grid>

      <Grid size={12} md={8}>
        <MainCard title="Recent Activities" sx={{ height: 1 }}>
          <Stack spacing={2}>
            {recentActivities.length === 0 ? (
              <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 3 }}>
                No recent activities
              </Typography>
            ) : (
              recentActivities.map((activity) => (
                <Card key={activity.id} variant="outlined" sx={{ p: 2 }}>
                  <Stack direction="row" spacing={2} alignItems="center" justifyContent="space-between">
                    <Stack spacing={0.5} flex={1}>
                      <Typography variant="subtitle2">{activity.type}</Typography>
                      {activity.student && (
                        <Typography variant="body2" color="text.secondary">
                          Student: {activity.student}
                        </Typography>
                      )}
                      {activity.room && (
                        <Typography variant="body2" color="text.secondary">
                          Room: {activity.room}
                        </Typography>
                      )}
                      {activity.description && (
                        <Typography variant="body2" color="text.secondary">
                          {activity.description}
                        </Typography>
                      )}
                    </Stack>
                    <Stack spacing={0.5} alignItems="flex-end">
                      <Chip 
                        label={activity.status} 
                        color={activity.status === 'completed' ? 'success' : 'warning'} 
                        size="small" 
                      />
                      <Typography variant="caption" color="text.secondary">
                        {activity.time}
                      </Typography>
                    </Stack>
                  </Stack>
                </Card>
              ))
            )}
          </Stack>
        </MainCard>
      </Grid>

      <Grid size={12} md={4}>
        <MainCard title="Quick Actions" sx={{ height: 1 }}>
          <Stack spacing={2}>
            <Card 
              variant="outlined" 
              sx={{ p: 2, cursor: 'pointer', transition: 'all 0.2s', '&:hover': { bgcolor: 'primary.lighter', transform: 'translateY(-2px)', boxShadow: 2 } }}
              onClick={handleNewCheckIn}
            >
              <Stack direction="row" spacing={2} alignItems="center">
                <Box sx={{ color: 'primary.main' }}>
                  <IconUsers size={24} />
                </Box>
                <Typography variant="body1" fontWeight={500}>New Check-in</Typography>
              </Stack>
            </Card>
            <Card 
              variant="outlined" 
              sx={{ p: 2, cursor: 'pointer', transition: 'all 0.2s', '&:hover': { bgcolor: 'success.lighter', transform: 'translateY(-2px)', boxShadow: 2 } }}
              onClick={handleRoomInspection}
            >
              <Stack direction="row" spacing={2} alignItems="center">
                <Box sx={{ color: 'success.main' }}>
                  <IconDoor size={24} />
                </Box>
                <Typography variant="body1" fontWeight={500}>Room Inspection</Typography>
              </Stack>
            </Card>
            <Card 
              variant="outlined" 
              sx={{ p: 2, cursor: 'pointer', transition: 'all 0.2s', '&:hover': { bgcolor: 'info.lighter', transform: 'translateY(-2px)', boxShadow: 2 } }}
              onClick={handleViewSchedule}
            >
              <Stack direction="row" spacing={2} alignItems="center">
                <Box sx={{ color: 'info.main' }}>
                  <IconCalendar size={24} />
                </Box>
                <Typography variant="body1" fontWeight={500}>View Schedule</Typography>
              </Stack>
            </Card>
            <Card 
              variant="outlined" 
              sx={{ p: 2, cursor: 'pointer', transition: 'all 0.2s', '&:hover': { bgcolor: 'warning.lighter', transform: 'translateY(-2px)', boxShadow: 2 } }}
              onClick={handlePendingRequests}
            >
              <Stack direction="row" spacing={2} alignItems="center">
                <Box sx={{ color: 'warning.main' }}>
                  <IconCheck size={24} />
                </Box>
                <Stack direction="row" spacing={1} alignItems="center" flex={1} justifyContent="space-between">
                  <Typography variant="body1" fontWeight={500}>Pending Requests</Typography>
                  {stats.pendingRequests > 0 && (
                    <Chip label={stats.pendingRequests} color="warning" size="small" />
                  )}
                </Stack>
              </Stack>
            </Card>
          </Stack>
        </MainCard>
      </Grid>
    </Grid>
  );
}

