import { useEffect, useState } from 'react';

// @mui
import { useTheme } from '@mui/material/styles';
import Grid from '@mui/material/Grid';
import CircularProgress from '@mui/material/CircularProgress';
import Box from '@mui/material/Box';

// @project
import OverviewCard from '@/components/cards/OverviewCard';
import { getRadiusStyles } from '@/utils/getRadiusStyles';
import adminService from '@/services/adminService';

// @assets
import { IconArrowDown, IconArrowUp } from '@tabler/icons-react';

/***************************  CARDS - BORDER WITH RADIUS  ***************************/

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

/***************************   OVERVIEW - CARDS  ***************************/

export default function AnalyticsOverviewCard() {
  const theme = useTheme();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);

  useEffect(() => {
    fetchStats();
    
    // Set up polling every 30 seconds for real-time updates
    const interval = setInterval(() => {
      fetchStats();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const data = await adminService.getDashboardStats();
      setStats(data.stats);
    } catch (error) {
      console.error('Failed to fetch dashboard stats:', error);
      // Set default values on error
      setStats({
        totalStudents: 0,
        occupiedRooms: 0,
        pendingPayments: 0,
        activeBookings: 0,
        changes: {
          students: 0,
          rooms: 0,
          payments: 0,
          bookings: 0
        }
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 200 }}>
        <CircularProgress />
      </Box>
    );
  }

  const overviewAnalytics = [
    {
      title: 'Total Students',
      value: stats?.totalStudents?.toString() || '0',
      compare: 'Compare to last month',
      chip: {
        label: `${stats?.changes?.students >= 0 ? '+' : ''}${stats?.changes?.students?.toFixed(1) || 0}%`,
        color: stats?.changes?.students >= 0 ? 'default' : 'error',
        avatar: stats?.changes?.students >= 0 ? <IconArrowUp /> : <IconArrowDown />
      }
    },
    {
      title: 'Occupied Rooms',
      value: stats?.occupiedRooms?.toString() || '0',
      compare: 'Compare to last month',
      chip: {
        label: `${stats?.changes?.rooms >= 0 ? '+' : ''}${stats?.changes?.rooms?.toFixed(1) || 0}%`,
        color: stats?.changes?.rooms >= 0 ? 'default' : 'error',
        avatar: stats?.changes?.rooms >= 0 ? <IconArrowUp /> : <IconArrowDown />
      }
    },
    {
      title: 'Pending Payments',
      value: stats?.pendingPayments?.toString() || '0',
      compare: 'Compare to last month',
      chip: {
        label: `${stats?.changes?.payments >= 0 ? '+' : ''}${stats?.changes?.payments?.toFixed(1) || 0}%`,
        color: stats?.changes?.payments >= 0 ? 'error' : 'default',
        avatar: stats?.changes?.payments >= 0 ? <IconArrowUp /> : <IconArrowDown />
      }
    },
    {
      title: 'Active Bookings',
      value: stats?.activeBookings?.toString() || '0',
      compare: 'Compare to last month',
      chip: {
        label: `${stats?.changes?.bookings >= 0 ? '+' : ''}${stats?.changes?.bookings?.toFixed(1) || 0}%`,
        color: stats?.changes?.bookings >= 0 ? 'default' : 'error',
        avatar: stats?.changes?.bookings >= 0 ? <IconArrowUp /> : <IconArrowDown />
      }
    }
  ];

  return (
    <Grid container sx={{ borderRadius: 4, boxShadow: theme.customShadows.section, ...applyBorderWithRadius(16, theme) }}>
      {overviewAnalytics.map((item, index) => (
        <Grid key={index} size={{ xs: 6, sm: 6, md: 3 }}>
          <OverviewCard {...{ ...item, cardProps: { sx: { border: 'none', borderRadius: 0, boxShadow: 'none' } } }} />
        </Grid>
      ))}
    </Grid>
  );
}
