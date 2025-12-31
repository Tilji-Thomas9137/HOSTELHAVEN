import { useState, useEffect } from 'react';

import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Chip from '@mui/material/Chip';
import Divider from '@mui/material/Divider';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';

import { IconAlertCircle, IconCalendarEvent, IconCheck, IconClock, IconToolsKitchen, IconUsersGroup, IconDoorExit, IconDoorEnter } from '@tabler/icons-react';
import { LineChart } from '@mui/x-charts/LineChart';
import { BarChart } from '@mui/x-charts/BarChart';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';

import ComponentsWrapper from '@/components/ComponentsWrapper';
import PresentationCard from '@/components/cards/PresentationCard';
import staffService from '@/services/staffService';
import { useSnackbar } from 'notistack';

/***************************  STAFF PORTAL - DASHBOARD  ***************************/

export default function StaffPortalDashboard() {
  const { enqueueSnackbar } = useSnackbar();
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState(null);
  const [exitLogs, setExitLogs] = useState([]);
  const [loadingLogs, setLoadingLogs] = useState(false);

  useEffect(() => {
    fetchDashboardData();
    fetchExitLogs();
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

  const fetchExitLogs = async () => {
    try {
      setLoadingLogs(true);
      const logs = await staffService.getStudentExitLogs({ limit: 10 });
      setExitLogs(Array.isArray(logs) ? logs : []);
    } catch (err) {
      console.error('Error fetching exit logs:', err);
    } finally {
      setLoadingLogs(false);
    }
  };

  if (loading) {
    return (
      <ComponentsWrapper title="Staff Dashboard">
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
          <CircularProgress />
        </Box>
      </ComponentsWrapper>
    );
  }

  if (!dashboardData) {
    return (
      <ComponentsWrapper title="Staff Dashboard">
        <Alert severity="info">No data available. Please contact administrator if you believe this is an error.</Alert>
      </ComponentsWrapper>
    );
  }

  const { stats, todaySchedule = [], alerts = [], attendanceChart, complaintChart, attendanceChecklist = [] } = dashboardData;

  const quickStats = [
    { 
      label: 'Assigned duties', 
      value: stats.myAssignments || 0, 
      chip: `+${stats.newAssignments || 0} today`, 
      icon: <IconCalendarEvent size={20} /> 
    },
    { 
      label: 'Pending complaints', 
      value: stats.pendingRequests || 0, 
      chip: `${stats.urgentRequests || 0} urgent`, 
      color: 'error', 
      icon: <IconAlertCircle size={20} /> 
    },
    { 
      label: 'Attendance streak', 
      value: `${stats.attendanceStreak || 0} days`, 
      chip: stats.attendanceStreak > 0 ? 'On time' : 'Start marking', 
      color: 'success', 
      icon: <IconClock size={20} /> 
    },
    { 
      label: 'Meal services', 
      value: stats.mealServicesCount || 0, 
      chip: 'All prepped', 
      color: 'primary', 
      icon: <IconToolsKitchen size={20} /> 
    }
  ];

  return (
    <ComponentsWrapper title="Staff Dashboard">
      <Stack spacing={3}>
        <Grid container spacing={2}>
          {quickStats.map((stat, index) => (
            <Grid key={index} size={{ xs: 12, sm: 6, md: 3 }}>
              <Card variant="outlined" sx={{ height: 1 }}>
                <CardContent>
                  <Stack spacing={1.5}>
                    <Stack direction="row" spacing={1} alignItems="center">
                      {stat.icon}
                      <Typography variant="subtitle2" color="text.secondary">
                        {stat.label}
                      </Typography>
                    </Stack>
                    <Typography variant="h4">{stat.value}</Typography>
                    <Chip label={stat.chip} color={stat.color || 'default'} size="small" />
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        <Grid container spacing={2}>
          <Grid size={{ xs: 12, md: 7 }}>
            <PresentationCard title="Today's Schedule">
              {todaySchedule.length === 0 ? (
                <Alert severity="info">No scheduled tasks for today</Alert>
              ) : (
                <Stack spacing={2}>
                  {todaySchedule.map((item, index) => (
                    <Card key={index} variant="outlined">
                      <CardContent>
                        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} justifyContent="space-between">
                          <Stack spacing={0.5}>
                            <Typography variant="subtitle2">{item.duty}</Typography>
                            <Typography variant="body2" color="text.secondary">
                              {item.location}
                            </Typography>
                            {item.student && (
                              <Typography variant="caption" color="text.secondary">
                                Student: {item.student}
                              </Typography>
                            )}
                          </Stack>
                          <Stack spacing={1} alignItems={{ xs: 'flex-start', sm: 'flex-end' }}>
                            <Chip label={item.time} size="small" icon={<IconClock size={16} />} />
                            {item.priority && (
                              <Chip 
                                label={item.priority} 
                                size="small" 
                                color={item.priority === 'urgent' ? 'error' : item.priority === 'high' ? 'warning' : 'default'}
                              />
                            )}
                          </Stack>
                        </Stack>
                      </CardContent>
                    </Card>
                  ))}
                </Stack>
              )}
            </PresentationCard>
          </Grid>

          <Grid size={{ xs: 12, md: 5 }}>
            <PresentationCard title="Alerts & Notifications" secondary={<Button size="small" onClick={() => window.location.href = '/app/staff/notifications'}>View all</Button>}>
              {alerts.length === 0 ? (
                <Alert severity="success">No alerts. All tasks are up to date!</Alert>
              ) : (
                <List dense>
                  {alerts.map((alert, index) => (
                    <ListItem key={alert.id || index} alignItems="flex-start">
                      <ListItemText
                        primary={alert.title}
                        secondary={alert.severity === 'error' ? 'Immediate attention required' : 'Updates available'}
                      />
                      {index < alerts.length - 1 && <Divider component="li" />}
                    </ListItem>
                  ))}
                </List>
              )}
            </PresentationCard>
          </Grid>
        </Grid>

        <Grid container spacing={2}>
          <Grid size={{ xs: 12, md: 7 }}>
            <PresentationCard title="Attendance Summary (This Week)">
              {attendanceChart && attendanceChart.days && attendanceChart.onDuty ? (
                <LineChart
                  height={280}
                  series={[{ data: attendanceChart.onDuty, label: 'Check-ins', color: '#6366f1' }]}
                  xAxis={[{ data: attendanceChart.days, scaleType: 'point' }]}
                  slotProps={{ legend: { hidden: true } }}
                />
              ) : (
                <Alert severity="info">No attendance data available for this week</Alert>
              )}
            </PresentationCard>
          </Grid>
          <Grid size={{ xs: 12, md: 5 }}>
            <PresentationCard title="Complaint Resolution">
              {complaintChart && complaintChart.stages && complaintChart.values ? (
                <BarChart
                  height={280}
                  borderRadius={4}
                  series={[{ data: complaintChart.values, label: 'Complaints' }]}
                  xAxis={[{ data: complaintChart.stages, scaleType: 'band' }]}
                />
              ) : (
                <Alert severity="info">No complaint data available</Alert>
              )}
            </PresentationCard>
          </Grid>
        </Grid>

        <Grid container spacing={2}>
          <Grid size={{ xs: 12, md: 6 }}>
            <PresentationCard title="Attendance Checklist">
              <Stack spacing={1.5}>
                {attendanceChecklist.length > 0 ? (
                  attendanceChecklist.map((item, index) => (
                    <Stack key={index} direction="row" spacing={1} alignItems="center">
                      <IconCheck size={18} color={item.done ? '#22c55e' : '#fb8c00'} />
                      <Typography variant="body2">{item.task}</Typography>
                    </Stack>
                  ))
                ) : (
                  <>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <IconCheck size={18} color="#22c55e" />
                      <Typography variant="body2">Morning round completed</Typography>
                    </Stack>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <IconCheck size={18} color="#fb8c00" />
                      <Typography variant="body2">Mid-day mess inspection pending</Typography>
                    </Stack>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <IconCheck size={18} color="#22c55e" />
                      <Typography variant="body2">Night roll call scheduled</Typography>
                    </Stack>
                  </>
                )}
              </Stack>
            </PresentationCard>
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <PresentationCard title="Meal Plan of the Day" secondary={<Chip label="Veg / Non-Veg" size="small" />}>
              <Stack spacing={1.5}>
                {[
                  { meal: 'Breakfast', menu: 'Idli, Sambar, Boiled eggs, Milk' },
                  { meal: 'Lunch', menu: 'Rice, Dal, Chicken curry, Veg poriyal' },
                  { meal: 'Dinner', menu: 'Chapati, Paneer butter masala, Salad' }
                ].map((item, index) => (
                  <Stack key={index}>
                    <Typography variant="subtitle2">{item.meal}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {item.menu}
                    </Typography>
                  </Stack>
                ))}
              </Stack>
            </PresentationCard>
          </Grid>
        </Grid>

        {/* Student Exit/Return Logs */}
        <Grid container spacing={2}>
          <Grid size={{ xs: 12 }}>
            <PresentationCard 
              title="Recent Student Exit/Return Logs" 
              secondary={
                <Button size="small" onClick={() => window.location.href = '/app/staff/register-log'}>
                  View All
                </Button>
              }
            >
              {loadingLogs ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
                  <CircularProgress size={24} />
                </Box>
              ) : exitLogs.length === 0 ? (
                <Alert severity="info">No exit/return logs found</Alert>
              ) : (
                <TableContainer component={Paper} variant="outlined">
                  <Table>
                    <TableHead>
                      <TableRow sx={{ bgcolor: 'grey.50' }}>
                        <TableCell><strong>Student</strong></TableCell>
                        <TableCell><strong>Purpose</strong></TableCell>
                        <TableCell><strong>Exit Time</strong></TableCell>
                        <TableCell><strong>Return Time</strong></TableCell>
                        <TableCell><strong>Scanned By</strong></TableCell>
                        <TableCell><strong>Status</strong></TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {exitLogs.map((log) => (
                        <TableRow key={log._id} hover>
                          <TableCell>
                            <Stack direction="row" spacing={1} alignItems="center">
                              {log.exitTime && !log.returnTime ? (
                                <IconDoorExit size={18} color="#ef4444" />
                              ) : log.returnTime ? (
                                <IconDoorEnter size={18} color="#22c55e" />
                              ) : null}
                              <Stack>
                                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                  {log.student?.name || 'Unknown'}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  {log.student?.studentId || log.student?.admissionNumber || 'N/A'}
                                </Typography>
                              </Stack>
                            </Stack>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">{log.purpose || 'N/A'}</Typography>
                            <Typography variant="caption" color="text.secondary">
                              {log.destination || ''}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            {log.exitTime ? (
                              <Stack>
                                <Typography variant="body2" color="error.main">
                                  {new Date(log.exitTime).toLocaleString()}
                                </Typography>
                                {log.exitScannedBy && (
                                  <Typography variant="caption" color="text.secondary">
                                    by {log.exitScannedBy.name}
                                  </Typography>
                                )}
                              </Stack>
                            ) : (
                              <Typography variant="body2" color="text.secondary">-</Typography>
                            )}
                          </TableCell>
                          <TableCell>
                            {log.returnTime ? (
                              <Stack>
                                <Typography variant="body2" color="success.main">
                                  {new Date(log.returnTime).toLocaleString()}
                                </Typography>
                                {log.returnScannedBy && (
                                  <Typography variant="caption" color="text.secondary">
                                    by {log.returnScannedBy.name}
                                  </Typography>
                                )}
                              </Stack>
                            ) : (
                              <Typography variant="body2" color="text.secondary">-</Typography>
                            )}
                          </TableCell>
                          <TableCell>
                            <Stack spacing={0.5}>
                              {log.exitScannedBy && (
                                <Typography variant="caption" color="text.secondary">
                                  Exit: {log.exitScannedBy.name}
                                </Typography>
                              )}
                              {log.returnScannedBy && (
                                <Typography variant="caption" color="text.secondary">
                                  Return: {log.returnScannedBy.name}
                                </Typography>
                              )}
                              {!log.exitScannedBy && !log.returnScannedBy && (
                                <Typography variant="caption" color="text.secondary">-</Typography>
                              )}
                            </Stack>
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={log.status === 'completed' ? 'Returned' : log.exitTime ? 'Outside' : 'Pending'}
                              color={log.status === 'completed' ? 'success' : log.exitTime ? 'warning' : 'default'}
                              size="small"
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </PresentationCard>
          </Grid>
        </Grid>
      </Stack>
    </ComponentsWrapper>
  );
}


