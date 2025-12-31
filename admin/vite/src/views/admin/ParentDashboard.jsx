// @mui
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Avatar from '@mui/material/Avatar';
import { useTheme } from '@mui/material/styles';

// @project
import OverviewCard from '@/components/cards/OverviewCard';
import MainCard from '@/components/MainCard';
import { getRadiusStyles } from '@/utils/getRadiusStyles';

// @assets
import { IconArrowUp, IconCheck, IconCurrencyDollar, IconCalendar, IconClipboard, IconBell, IconUser, IconUsers } from '@tabler/icons-react';

/***************************  PARENT DASHBOARD  ***************************/

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

export default function ParentDashboard() {
  const theme = useTheme();

  const parentOverviewData = [
    {
      title: 'Children',
      value: '2',
      compare: 'Enrolled students',
      chip: {
        label: 'Active',
        color: 'success',
        avatar: <IconCheck />
      }
    },
    {
      title: 'Total Due',
      value: '$900',
      compare: 'Across all accounts',
      chip: {
        label: 'Due soon',
        color: 'warning',
        avatar: <IconCurrencyDollar />
      }
    },
    {
      title: 'Payment History',
      value: '12',
      compare: 'This year',
      chip: {
        label: 'On time',
        avatar: <IconArrowUp />
      }
    },
    {
      title: 'Notifications',
      value: '3',
      compare: 'Unread',
      chip: {
        label: 'New',
        color: 'info',
        avatar: <IconBell />
      }
    }
  ];

  const childrenData = [
    {
      id: 1,
      name: 'John Doe',
      studentId: 'STU-2024-001',
      room: 'A-105',
      building: 'Building A',
      status: 'Active',
      paymentDue: 450,
      paymentStatus: 'pending',
      lastPayment: '2024-02-15'
    },
    {
      id: 2,
      name: 'Jane Doe',
      studentId: 'STU-2024-002',
      room: 'B-205',
      building: 'Building B',
      status: 'Active',
      paymentDue: 450,
      paymentStatus: 'pending',
      lastPayment: '2024-02-20'
    }
  ];

  const recentNotifications = [
    { id: 1, title: 'Payment Reminder', message: 'Payment for John Doe ($450) due in 5 days', time: '2 hours ago', child: 'John Doe', type: 'payment' },
    { id: 2, title: 'Check-in Notification', message: 'Jane Doe has checked in to room B-205', time: '1 day ago', child: 'Jane Doe', type: 'info' },
    { id: 3, title: 'Maintenance Update', message: 'Maintenance request for room A-105 has been completed', time: '2 days ago', child: 'John Doe', type: 'maintenance' }
  ];

  return (
    <Grid container spacing={{ xs: 2, md: 3 }}>
      <Grid size={12}>
        <Typography variant="h4" sx={{ mb: 2 }}>Parent Dashboard</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Monitor your children's hostel information, payments, and activities
        </Typography>
      </Grid>

      <Grid size={12}>
        <Grid container sx={{ borderRadius: 4, boxShadow: theme.customShadows.section, ...applyBorderWithRadius(16, theme) }}>
          {parentOverviewData.map((item, index) => (
            <Grid key={index} size={{ xs: 6, sm: 6, md: 3 }}>
              <OverviewCard {...{ ...item, cardProps: { sx: { border: 'none', borderRadius: 0, boxShadow: 'none' } } }} />
            </Grid>
          ))}
        </Grid>
      </Grid>

      <Grid size={12} md={8}>
        <MainCard title="My Children" sx={{ mb: 3 }}>
          <Stack spacing={2}>
            {childrenData.map((child) => (
              <Card key={child.id} variant="outlined" sx={{ p: 2 }}>
                <Stack spacing={2}>
                  <Stack direction="row" spacing={2} alignItems="center">
                    <Avatar sx={{ bgcolor: 'primary.main' }}>
                      <IconUser size={24} />
                    </Avatar>
                    <Stack flex={1}>
                      <Typography variant="subtitle1" fontWeight={600}>{child.name}</Typography>
                      <Typography variant="body2" color="text.secondary">ID: {child.studentId}</Typography>
                    </Stack>
                    <Chip label={child.status} color="success" size="small" />
                  </Stack>
                  
                  <Grid container spacing={2}>
                    <Grid size={12} sm={6}>
                      <Stack spacing={0.5}>
                        <Typography variant="caption" color="text.secondary">Room</Typography>
                        <Typography variant="body2" fontWeight={500}>{child.room} - {child.building}</Typography>
                      </Stack>
                    </Grid>
                    <Grid size={12} sm={6}>
                      <Stack spacing={0.5}>
                        <Typography variant="caption" color="text.secondary">Payment Due</Typography>
                        <Typography variant="body2" fontWeight={500} color={child.paymentStatus === 'pending' ? 'warning.main' : 'text.primary'}>
                          ${child.paymentDue} - {child.paymentStatus === 'pending' ? 'Pending' : 'Paid'}
                        </Typography>
                      </Stack>
                    </Grid>
                    <Grid size={12} sm={6}>
                      <Stack spacing={0.5}>
                        <Typography variant="caption" color="text.secondary">Last Payment</Typography>
                        <Typography variant="body2" fontWeight={500}>{child.lastPayment}</Typography>
                      </Stack>
                    </Grid>
                    <Grid size={12} sm={6}>
                      <Chip 
                        icon={<IconCurrencyDollar size={16} />} 
                        label="Make Payment" 
                        color="primary" 
                        variant="outlined" 
                        clickable
                        sx={{ mt: 1 }}
                      />
                    </Grid>
                  </Grid>
                </Stack>
              </Card>
            ))}
          </Stack>
        </MainCard>

        <MainCard title="Notifications" sx={{ height: 1 }}>
          <Stack spacing={2}>
            {recentNotifications.map((notification) => (
              <Card key={notification.id} variant="outlined" sx={{ p: 2 }}>
                <Stack spacing={1}>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <IconBell size={20} />
                    <Typography variant="subtitle2">{notification.title}</Typography>
                    <Chip label={notification.child} size="small" color="primary" variant="outlined" sx={{ ml: 'auto' }} />
                  </Stack>
                  <Typography variant="body2" color="text.secondary">
                    {notification.message}
                  </Typography>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Typography variant="caption" color="text.secondary">
                      {notification.time}
                    </Typography>
                    <Chip label={notification.type} size="small" variant="outlined" />
                  </Stack>
                </Stack>
              </Card>
            ))}
          </Stack>
        </MainCard>
      </Grid>

      <Grid size={12} md={4}>
        <MainCard title="Payment Summary" sx={{ mb: 3 }}>
          <Stack spacing={3}>
            <Box>
              <Typography variant="body2" color="text.secondary" gutterBottom>Total Outstanding</Typography>
              <Typography variant="h5" color="warning.main" fontWeight={600}>$900</Typography>
            </Box>
            <Box>
              <Typography variant="body2" color="text.secondary" gutterBottom>This Month</Typography>
              <Typography variant="h6">$450</Typography>
            </Box>
            <Box>
              <Typography variant="body2" color="text.secondary" gutterBottom>Due Date</Typography>
              <Typography variant="body1" fontWeight={500}>March 15, 2024</Typography>
            </Box>
          </Stack>
        </MainCard>

        <MainCard title="Quick Actions" sx={{ height: 1 }}>
          <Stack spacing={2}>
            <Card variant="outlined" sx={{ p: 2, cursor: 'pointer', '&:hover': { bgcolor: 'action.hover' } }}>
              <Stack direction="row" spacing={2} alignItems="center">
                <IconCurrencyDollar size={24} />
                <Typography variant="body1">Make Payment</Typography>
              </Stack>
            </Card>
            <Card variant="outlined" sx={{ p: 2, cursor: 'pointer', '&:hover': { bgcolor: 'action.hover' } }}>
              <Stack direction="row" spacing={2} alignItems="center">
                <IconClipboard size={24} />
                <Typography variant="body1">Payment History</Typography>
              </Stack>
            </Card>
            <Card variant="outlined" sx={{ p: 2, cursor: 'pointer', '&:hover': { bgcolor: 'action.hover' } }}>
              <Stack direction="row" spacing={2} alignItems="center">
                <IconUsers size={24} />
                <Typography variant="body1">Children Details</Typography>
              </Stack>
            </Card>
            <Card variant="outlined" sx={{ p: 2, cursor: 'pointer', '&:hover': { bgcolor: 'action.hover' } }}>
              <Stack direction="row" spacing={2} alignItems="center">
                <IconBell size={24} />
                <Typography variant="body1">View All Notifications</Typography>
              </Stack>
            </Card>
          </Stack>
        </MainCard>
      </Grid>
    </Grid>
  );
}

