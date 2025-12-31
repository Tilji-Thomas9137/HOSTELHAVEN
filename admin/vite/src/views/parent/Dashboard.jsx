import { useState, useEffect } from 'react';

// @mui
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Avatar from '@mui/material/Avatar';
import Alert from '@mui/material/Alert';
import CircularProgress from '@mui/material/CircularProgress';
import Divider from '@mui/material/Divider';
import { useTheme } from '@mui/material/styles';
import { LineChart } from '@mui/x-charts/LineChart';
import { BarChart } from '@mui/x-charts/BarChart';

// @project
import ComponentsWrapper from '@/components/ComponentsWrapper';
import PresentationCard from '@/components/cards/PresentationCard';
import parentService from '@/services/parentService';
import { useSnackbar } from 'notistack';

// @icons
import { IconCurrencyDollar, IconCalendarCheck, IconTool, IconUser, IconTrendingUp, IconDoorExit, IconDoorEnter, IconActivity, IconCalendar, IconMapPin, IconClock, IconUsers } from '@tabler/icons-react';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';

/***************************  PARENT DASHBOARD  ***************************/

export default function ParentDashboard() {
  const theme = useTheme();
  const { enqueueSnackbar } = useSnackbar();
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState(null);
  const [exitLogs, setExitLogs] = useState([]);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [visitorLogs, setVisitorLogs] = useState([]);
  const [loadingVisitors, setLoadingVisitors] = useState(false);
  const [childrenActivities, setChildrenActivities] = useState([]);
  const [loadingActivities, setLoadingActivities] = useState(false);

  useEffect(() => {
    fetchDashboardData();
    fetchExitLogs();
    fetchVisitorLogs();
    fetchChildrenActivities();
  }, []);

  const fetchVisitorLogs = async () => {
    try {
      setLoadingVisitors(true);
      const logs = await parentService.getVisitorLogs({ limit: 10 });
      setVisitorLogs(Array.isArray(logs) ? logs : []);
    } catch (err) {
      console.error('Error fetching visitor logs:', err);
    } finally {
      setLoadingVisitors(false);
    }
  };

  const fetchChildrenActivities = async () => {
    try {
      setLoadingActivities(true);
      const activities = await parentService.getChildrenActivities();
      setChildrenActivities(Array.isArray(activities) ? activities : []);
    } catch (err) {
      console.error('Error fetching children activities:', err);
    } finally {
      setLoadingActivities(false);
    }
  };

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const data = await parentService.getDashboardStats();
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
      const logs = await parentService.getOutingRequests({ limit: 10 });
      // Show all outing requests (pending, approved, rejected, completed)
      setExitLogs(Array.isArray(logs) ? logs : []);
    } catch (err) {
      console.error('Error fetching exit logs:', err);
    } finally {
      setLoadingLogs(false);
    }
  };

  if (loading) {
    return (
      <ComponentsWrapper title="Dashboard">
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
          <CircularProgress />
        </Box>
      </ComponentsWrapper>
    );
  }

  if (!dashboardData) {
    return (
      <ComponentsWrapper title="Dashboard">
        <Alert severity="info">No data available. Please contact administrator if you believe this is an error.</Alert>
      </ComponentsWrapper>
    );
  }

  const { stats, children } = dashboardData;
  const childrenCount = children?.length || 0;
  const suspendedChildren = children?.filter(child => child.status === 'suspended') || [];

  // Prepare attendance trend data (last 7 days)
  const attendanceTrendData = {
    xAxis: [{ data: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] }],
    series: [
      {
        data: [stats.attendanceSummary?.present || 0, 0, 0, 0, 0, 0, 0],
        label: 'Present',
        color: theme.palette.success.main
      }
    ]
  };

  // Prepare monthly payment history (last 6 months) - use real data from backend
  const monthlyHistory = stats.monthlyPaymentHistory || [];
  const paymentHistoryData = {
    xAxis: [{ data: monthlyHistory.map(m => m.month) }],
    series: [
      {
        data: monthlyHistory.map(m => m.amount),
        label: 'Paid',
        color: theme.palette.success.main
      }
    ]
  };

  // Prepare monthly mess fee payment history (last 6 months)
  const monthlyMessFeeHistory = stats.monthlyMessFeePaymentHistory || [];
  const messFeePaymentHistoryData = {
    xAxis: [{ data: monthlyMessFeeHistory.map(m => m.month) }],
    series: [
      {
        data: monthlyMessFeeHistory.map(m => m.amount),
        label: 'Paid',
        color: theme.palette.info.main
      }
    ]
  };

  return (
    <ComponentsWrapper title="Dashboard">
      {suspendedChildren.length > 0 && (
        <Alert severity="error" sx={{ mb: 3 }}>
          <Typography variant="subtitle2" fontWeight={600}>
            Account Suspension Notice
          </Typography>
          <Typography variant="body2">
            {suspendedChildren.length === 1 
              ? `Your child ${suspendedChildren[0].name} (${suspendedChildren[0].studentId}) has been suspended. Please contact the administrator for more information.`
              : `${suspendedChildren.length} of your children have been suspended. Please contact the administrator for more information.`
            }
          </Typography>
        </Alert>
      )}
      <Grid container spacing={3}>
        {/* Summary Cards */}
        <Grid item xs={12} sm={6} md={3}>
          <PresentationCard>
            <Stack spacing={1}>
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Typography variant="body2" color="text.secondary">Total Fees Paid</Typography>
                <IconCurrencyDollar size={24} color={theme.palette.success.main} />
              </Stack>
              <Typography variant="h4" fontWeight={600} color="success.main">
                ₹{(stats.totalFeesPaid || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Across all children
              </Typography>
            </Stack>
          </PresentationCard>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <PresentationCard>
            <Stack spacing={1}>
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Typography variant="body2" color="text.secondary">Total Fees Pending</Typography>
                <IconCurrencyDollar size={24} color={theme.palette.warning.main} />
              </Stack>
              <Typography variant="h4" fontWeight={600} color="warning.main">
                ₹{(stats.totalFeesPending || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Outstanding amount
              </Typography>
            </Stack>
          </PresentationCard>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <PresentationCard>
            <Stack spacing={1}>
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Typography variant="body2" color="text.secondary">Attendance Summary</Typography>
                <IconCalendarCheck size={24} color={theme.palette.info.main} />
              </Stack>
              <Typography variant="h4" fontWeight={600}>
                {stats.attendanceSummary?.present || 0} / {stats.attendanceSummary?.total || 0}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Present / Total (Last 30 days)
              </Typography>
            </Stack>
          </PresentationCard>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <PresentationCard>
            <Stack spacing={1}>
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Typography variant="body2" color="text.secondary">My Children</Typography>
                <IconUser size={24} color={theme.palette.primary.main} />
              </Stack>
              <Typography variant="h4" fontWeight={600}>
                {childrenCount}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Enrolled students
              </Typography>
            </Stack>
          </PresentationCard>
        </Grid>

        {/* Mess Fee Summary Cards */}
        <Grid item xs={12} sm={6} md={3}>
          <PresentationCard>
            <Stack spacing={1}>
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Typography variant="body2" color="text.secondary">Mess Fees Paid</Typography>
                <IconCurrencyDollar size={24} color={theme.palette.info.main} />
              </Stack>
              <Typography variant="h4" fontWeight={600} color="info.main">
                ₹{(stats.totalMessFeesPaid || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Total mess fees paid
              </Typography>
            </Stack>
          </PresentationCard>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <PresentationCard>
            <Stack spacing={1}>
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Typography variant="body2" color="text.secondary">Mess Fees Pending</Typography>
                <IconCurrencyDollar size={24} color={theme.palette.warning.main} />
              </Stack>
              <Typography variant="h4" fontWeight={600} color="warning.main">
                ₹{(stats.totalMessFeesPending || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Outstanding mess fees
              </Typography>
            </Stack>
          </PresentationCard>
        </Grid>

        {/* Charts Row */}
        <Grid item xs={12} md={6}>
          <PresentationCard>
            <Typography variant="h6" gutterBottom>Attendance Trend (Last 7 Days)</Typography>
            <Box sx={{ width: '100%', height: 300 }}>
              <LineChart
                width={500}
                height={300}
                series={attendanceTrendData.series}
                xAxis={attendanceTrendData.xAxis}
              />
            </Box>
          </PresentationCard>
        </Grid>

        <Grid item xs={12} md={6}>
          <PresentationCard>
            <Typography variant="h6" gutterBottom>Payment Overview</Typography>
            <Stack spacing={2} sx={{ mt: 2 }}>
              <Card variant="outlined" sx={{ p: 2, bgcolor: 'background.default' }}>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Stack>
                    <Typography variant="body2" color="text.secondary">Total Paid</Typography>
                    <Typography variant="h5" fontWeight={600} color="success.main">
                      ₹{(stats.totalFeesPaid || 0).toLocaleString('en-IN')}
                    </Typography>
                  </Stack>
                  <IconCurrencyDollar size={32} color={theme.palette.success.main} />
                </Stack>
              </Card>
              <Card variant="outlined" sx={{ p: 2, bgcolor: 'background.default' }}>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Stack>
                    <Typography variant="body2" color="text.secondary">Mess Fees Paid</Typography>
                    <Typography variant="h5" fontWeight={600} color="info.main">
                      ₹{(stats.totalMessFeesPaid || 0).toLocaleString('en-IN')}
                    </Typography>
                  </Stack>
                  <IconCurrencyDollar size={32} color={theme.palette.info.main} />
                </Stack>
              </Card>
              <Card variant="outlined" sx={{ p: 2, bgcolor: 'background.default' }}>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Stack>
                    <Typography variant="body2" color="text.secondary">Outstanding</Typography>
                    <Typography variant="h5" fontWeight={600} color="warning.main">
                      ₹{((stats.totalFeesPending || 0) + (stats.totalMessFeesPending || 0)).toLocaleString('en-IN')}
                    </Typography>
                  </Stack>
                  <IconCurrencyDollar size={32} color={theme.palette.warning.main} />
                </Stack>
              </Card>
            </Stack>
          </PresentationCard>
        </Grid>

        {/* Payment History Graphs - Side by Side */}
        <Grid item xs={12} md={6}>
          <PresentationCard>
            <Typography variant="h6" gutterBottom>Monthly Fee Payment History</Typography>
            <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
              Room rent, deposits, and other fees
            </Typography>
            <Box sx={{ width: '100%', height: 300 }}>
              <BarChart
                width={500}
                height={300}
                series={paymentHistoryData.series}
                xAxis={paymentHistoryData.xAxis}
              />
            </Box>
          </PresentationCard>
        </Grid>

        <Grid item xs={12} md={6}>
          <PresentationCard>
            <Typography variant="h6" gutterBottom>Monthly Mess Fee Payment History</Typography>
            <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
              Mess fees based on attendance
            </Typography>
            <Box sx={{ width: '100%', height: 300 }}>
              <BarChart
                width={500}
                height={300}
                series={messFeePaymentHistoryData.series}
                xAxis={messFeePaymentHistoryData.xAxis}
              />
            </Box>
          </PresentationCard>
        </Grid>

        {/* Latest Complaints */}
        <Grid item xs={12} md={6}>
          <PresentationCard>
            <Typography variant="h6" gutterBottom>Latest Complaints</Typography>
            <Stack spacing={2} sx={{ mt: 2 }}>
              {stats.latestComplaints && stats.latestComplaints.length > 0 ? (
                stats.latestComplaints.map((complaint) => (
                  <Card key={complaint._id} variant="outlined" sx={{ p: 2 }}>
                    <Stack spacing={1}>
                      <Stack direction="row" justifyContent="space-between" alignItems="center">
                        <Typography variant="subtitle2" fontWeight={600}>
                          {complaint.student?.name || 'Unknown'}
                        </Typography>
                        <Chip
                          label={complaint.status}
                          color={
                            complaint.status === 'resolved' ? 'success' :
                            complaint.status === 'in_progress' ? 'warning' : 'default'
                          }
                          size="small"
                        />
                      </Stack>
                      <Typography variant="body2" color="text.secondary">
                        {complaint.description || complaint.title || 'No description'}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Room: {complaint.room?.roomNumber || 'N/A'} • {new Date(complaint.createdAt).toLocaleDateString()}
                      </Typography>
                    </Stack>
                  </Card>
                ))
              ) : (
                <Alert severity="info">No complaints found</Alert>
              )}
            </Stack>
          </PresentationCard>
        </Grid>


        {/* Upcoming Due Dates */}
        <Grid item xs={12}>
          <PresentationCard>
            <Typography variant="h6" gutterBottom>Upcoming Due Dates</Typography>
            <Stack spacing={2} sx={{ mt: 2 }}>
              {stats.upcomingDueDates && stats.upcomingDueDates.length > 0 ? (
                stats.upcomingDueDates.map((fee) => (
                  <Card key={fee._id} variant="outlined" sx={{ p: 2 }}>
                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                      <Stack>
                        <Typography variant="subtitle2" fontWeight={600}>
                          {fee.student?.name || 'Unknown'} - {fee.feeType?.charAt(0).toUpperCase() + fee.feeType?.slice(1).replace('_', ' ')}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Due: {new Date(fee.dueDate).toLocaleDateString()}
                        </Typography>
                      </Stack>
                      <Stack alignItems="flex-end">
                        <Typography variant="h6" fontWeight={600} color="warning.main">
                          ₹{((fee.amount - (fee.paidAmount || 0))).toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                        </Typography>
                        <Chip
                          label={fee.status}
                          color={fee.status === 'overdue' ? 'error' : 'warning'}
                          size="small"
                        />
                      </Stack>
                    </Stack>
                  </Card>
                ))
              ) : (
                <Alert severity="success">No upcoming due dates. All fees are paid!</Alert>
              )}
            </Stack>
          </PresentationCard>
        </Grid>

        {/* Children Exit/Return Logs */}
        <Grid item xs={12}>
          <PresentationCard>
            <Typography variant="h6" gutterBottom>Children Exit/Return Logs</Typography>
            {loadingLogs ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
                <CircularProgress size={24} />
              </Box>
            ) : exitLogs.length === 0 ? (
              <Alert severity="info" sx={{ mt: 2 }}>No exit/return logs found for your children</Alert>
            ) : (
              <TableContainer component={Paper} variant="outlined" sx={{ mt: 2 }}>
                <Table>
                  <TableHead>
                    <TableRow sx={{ bgcolor: 'grey.50' }}>
                      <TableCell><strong>Child Name</strong></TableCell>
                      <TableCell><strong>Purpose</strong></TableCell>
                      <TableCell><strong>Exit Time</strong></TableCell>
                      <TableCell><strong>Return Time</strong></TableCell>
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
                            <Typography variant="body2" color="error.main">
                              {new Date(log.exitTime).toLocaleString()}
                            </Typography>
                          ) : (
                            <Typography variant="body2" color="text.secondary">-</Typography>
                          )}
                        </TableCell>
                        <TableCell>
                          {log.returnTime ? (
                            <Typography variant="body2" color="success.main">
                              {new Date(log.returnTime).toLocaleString()}
                            </Typography>
                          ) : (
                            <Typography variant="body2" color="text.secondary">-</Typography>
                          )}
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={
                              log.status === 'completed' ? 'Returned' : 
                              log.status === 'rejected' ? 'Rejected' :
                              log.status === 'approved' && log.exitTime ? 'Outside' : 
                              log.status === 'approved' ? 'Approved' : 
                              'Pending'
                            }
                            color={
                              log.status === 'completed' ? 'success' : 
                              log.status === 'rejected' ? 'error' :
                              log.status === 'approved' && log.exitTime ? 'warning' : 
                              log.status === 'approved' ? 'info' : 
                              'default'
                            }
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

        {/* Children Visitor Logs */}
        <Grid item xs={12}>
          <PresentationCard>
            <Typography variant="h6" gutterBottom>Children Visitor Logs</Typography>
            {loadingVisitors ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
                <CircularProgress size={24} />
              </Box>
            ) : visitorLogs.length === 0 ? (
              <Alert severity="info" sx={{ mt: 2 }}>No visitor logs found for your children</Alert>
            ) : (
              <TableContainer component={Paper} variant="outlined" sx={{ mt: 2 }}>
                <Table>
                  <TableHead>
                    <TableRow sx={{ bgcolor: 'grey.50' }}>
                      <TableCell><strong>Visitor Name</strong></TableCell>
                      <TableCell><strong>Child Name</strong></TableCell>
                      <TableCell><strong>Relation</strong></TableCell>
                      <TableCell><strong>Phone</strong></TableCell>
                      <TableCell><strong>Check In</strong></TableCell>
                      <TableCell><strong>Check Out</strong></TableCell>
                      <TableCell><strong>Status</strong></TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {visitorLogs.map((log) => (
                      <TableRow key={log._id} hover>
                        <TableCell>{log.visitorName}</TableCell>
                        <TableCell>
                          <Stack>
                            <Typography variant="body2" sx={{ fontWeight: 500 }}>
                              {log.student?.name || 'Unknown'}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {log.student?.studentId || log.student?.admissionNumber || 'N/A'}
                            </Typography>
                          </Stack>
                        </TableCell>
                        <TableCell>{log.relation || 'N/A'}</TableCell>
                        <TableCell>{log.visitorPhone}</TableCell>
                        <TableCell>
                          {log.checkIn ? new Date(log.checkIn).toLocaleString() : '-'}
                        </TableCell>
                        <TableCell>
                          {log.checkOut ? new Date(log.checkOut).toLocaleString() : '-'}
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={log.status === 'checked_out' ? 'Checked Out' : 'Checked In'}
                            color={log.status === 'checked_out' ? 'success' : 'warning'}
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

        {/* Children Activities */}
        <Grid item xs={12}>
          <PresentationCard>
            <Typography variant="h6" gutterBottom>
              <IconActivity size={20} style={{ verticalAlign: 'middle', marginRight: 8 }} />
              Activities Your Children Joined
            </Typography>
            {loadingActivities ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
                <CircularProgress size={24} />
              </Box>
            ) : childrenActivities.length === 0 ? (
              <Alert severity="info" sx={{ mt: 2 }}>Your children haven't joined any activities yet</Alert>
            ) : (
              <Stack spacing={2} sx={{ mt: 2 }}>
                {childrenActivities.map((activity) => {
                  const formatDate = (dateString) => {
                    const date = new Date(dateString);
                    return date.toLocaleDateString('en-IN', { 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    });
                  };

                  const getStatusColor = (status) => {
                    switch (status) {
                      case 'upcoming': return 'info';
                      case 'ongoing': return 'warning';
                      case 'completed': return 'success';
                      case 'cancelled': return 'error';
                      default: return 'default';
                    }
                  };

                  const getCategoryColor = (category) => {
                    switch (category) {
                      case 'Sports': return 'error';
                      case 'Cultural': return 'warning';
                      case 'Academic': return 'info';
                      case 'Community': return 'success';
                      case 'Meeting': return 'secondary';
                      default: return 'default';
                    }
                  };

                  return (
                    <Card key={activity._id} variant="outlined" sx={{ p: 2 }}>
                      <Stack spacing={2}>
                        <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                          <Stack spacing={1} sx={{ flex: 1 }}>
                            <Typography variant="h6">{activity.title}</Typography>
                            <Stack direction="row" spacing={1}>
                              <Chip 
                                label={activity.category} 
                                size="small" 
                                color={getCategoryColor(activity.category)} 
                              />
                              <Chip 
                                label={activity.status} 
                                size="small" 
                                color={getStatusColor(activity.status)} 
                              />
                            </Stack>
                          </Stack>
                        </Stack>

                        <Stack spacing={1}>
                          <Typography variant="body2" color="text.secondary">
                            <IconCalendar size={16} style={{ verticalAlign: 'middle', marginRight: 4 }} />
                            {formatDate(activity.date)} at {activity.time}
                          </Typography>
                          {activity.location && (
                            <Typography variant="body2" color="text.secondary">
                              <IconMapPin size={16} style={{ verticalAlign: 'middle', marginRight: 4 }} />
                              {activity.location}
                            </Typography>
                          )}
                          {activity.duration && (
                            <Typography variant="body2" color="text.secondary">
                              <IconClock size={16} style={{ verticalAlign: 'middle', marginRight: 4 }} />
                              Duration: {activity.duration}
                            </Typography>
                          )}
                        </Stack>

                        {activity.description && (
                          <Typography variant="body2" color="text.secondary">
                            {activity.description}
                          </Typography>
                        )}

                        <Divider />

                        <Stack spacing={1}>
                          <Typography variant="subtitle2" fontWeight={600}>
                            <IconUsers size={16} style={{ verticalAlign: 'middle', marginRight: 4 }} />
                            Children Joined ({activity.children?.length || 0}):
                          </Typography>
                          {activity.children && activity.children.map((child, idx) => (
                            <Card key={idx} variant="outlined" sx={{ p: 1.5, bgcolor: 'background.default' }}>
                              <Stack direction="row" justifyContent="space-between" alignItems="center">
                                <Stack>
                                  <Typography variant="body2" fontWeight={500}>
                                    {child.student?.name || child.studentIdentity?.name || 'Unknown'}
                                  </Typography>
                                  <Typography variant="caption" color="text.secondary">
                                    {child.student?.studentId || child.studentIdentity?.studentId || 'N/A'}
                                    {child.studentIdentity?.roomNumber && ` • Room: ${child.studentIdentity.roomNumber}${child.studentIdentity.block ? ` (${child.studentIdentity.block})` : ''}`}
                                  </Typography>
                                </Stack>
                                <Typography variant="caption" color="text.secondary">
                                  Joined: {child.joinedAt ? new Date(child.joinedAt).toLocaleDateString() : 'N/A'}
                                </Typography>
                              </Stack>
                            </Card>
                          ))}
                        </Stack>
                      </Stack>
                    </Card>
                  );
                })}
              </Stack>
            )}
          </PresentationCard>
        </Grid>
      </Grid>
    </ComponentsWrapper>
  );
}

