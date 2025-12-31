import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

// @mui
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CircularProgress from '@mui/material/CircularProgress';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';

// @project
import ComponentsWrapper from '@/components/ComponentsWrapper';
import PresentationCard from '@/components/cards/PresentationCard';
import adminService from '@/services/adminService';
import { useSnackbar } from 'notistack';

/***************************  ADMIN REPORTS & ANALYTICS PAGE  ***************************/

export default function ReportsPage() {
  const { enqueueSnackbar } = useSnackbar();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [studentIdInput, setStudentIdInput] = useState('');

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const data = await adminService.getDashboardStats();
        setStats(data?.stats || null);
      } catch (err) {
        console.error('Failed to load admin reports stats:', err);
        enqueueSnackbar(err.response?.data?.message || 'Failed to load reports', { variant: 'error' });
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const formatCurrency = (amount) =>
    typeof amount === 'number' ? `₹${amount.toLocaleString('en-IN', { maximumFractionDigits: 2 })}` : '₹0';

  const handleViewStudentReport = async () => {
    const trimmed = (studentIdInput || '').trim();
    if (!trimmed) {
      enqueueSnackbar('Please enter a student ID / admission number', { variant: 'warning' });
      return;
    }
    try {
      // Look up the student by studentId/admission number first
      const student = await adminService.getStudentByStudentId(trimmed);
      if (!student?._id) {
        enqueueSnackbar('Student not found with this ID', { variant: 'error' });
        return;
      }
      navigate(`/app/students/${student._id}`);
    } catch (err) {
      console.error('Failed to find student by ID:', err);
      enqueueSnackbar(err.response?.data?.message || 'Student not found with this ID', { variant: 'error' });
    }
  };

  return (
    <ComponentsWrapper title="Reports">
      <Stack spacing={3}>
        <PresentationCard title="Reports & Analytics">
          <Stack spacing={2}>
            <Typography variant="body2" color="text.secondary">
              Overview of key hostel metrics for students and staff, including occupancy, fees, and booking trends.
            </Typography>

            {/* Quick link to a specific student's detailed report */}
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems={{ xs: 'stretch', sm: 'center' }}>
              <TextField
                label="View Specific Student Report"
                placeholder="Enter Student ID / Admission Number"
                size="small"
                value={studentIdInput}
                onChange={(e) => setStudentIdInput(e.target.value)}
                sx={{ minWidth: 260, maxWidth: 360 }}
              />
              <Button variant="contained" onClick={handleViewStudentReport}>
                Go to Student Report
              </Button>
            </Stack>
          </Stack>
        </PresentationCard>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
            <CircularProgress />
          </Box>
        ) : !stats ? (
          <PresentationCard>
            <Typography variant="body2" color="text.secondary">
              No report data available.
            </Typography>
          </PresentationCard>
        ) : (
          <>
            {/* High-level student & room metrics */}
            <Grid container spacing={2}>
              <Grid size={{ xs: 6, sm: 3 }}>
                <Card sx={{ bgcolor: 'primary.lighter', color: 'primary.main' }}>
                  <CardContent>
                    <Stack spacing={1}>
                      <Typography variant="h4" fontWeight={600}>{stats.totalStudents}</Typography>
                      <Typography variant="body2">Active Students</Typography>
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>
              <Grid size={{ xs: 6, sm: 3 }}>
                <Card sx={{ bgcolor: 'success.lighter', color: 'success.main' }}>
                  <CardContent>
                    <Stack spacing={1}>
                      <Typography variant="h4" fontWeight={600}>{stats.occupiedRooms}</Typography>
                      <Typography variant="body2">Occupied Rooms</Typography>
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>
              <Grid size={{ xs: 6, sm: 3 }}>
                <Card sx={{ bgcolor: 'info.lighter', color: 'info.main' }}>
                  <CardContent>
                    <Stack spacing={1}>
                      <Typography variant="h4" fontWeight={600}>{stats.totalRooms}</Typography>
                      <Typography variant="body2">Total Rooms</Typography>
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>
              <Grid size={{ xs: 6, sm: 3 }}>
                <Card sx={{ bgcolor: 'warning.lighter', color: 'warning.main' }}>
                  <CardContent>
                    <Stack spacing={1}>
                      <Typography variant="h4" fontWeight={600}>{stats.pendingPayments}</Typography>
                      <Typography variant="body2">Students with Pending Fees</Typography>
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>

            {/* Fee summary & booking summary */}
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, md: 6 }}>
                <Card sx={{ bgcolor: 'grey.50' }}>
                  <CardContent>
                    <Typography variant="subtitle1" gutterBottom>Fee Summary</Typography>
                    <Grid container spacing={2}>
                      <Grid size={{ xs: 6 }}>
                        <Typography variant="caption" color="text.secondary">Total Fees</Typography>
                        <Typography variant="h6">{formatCurrency(stats.totalFeesAmount)}</Typography>
                      </Grid>
                      <Grid size={{ xs: 6 }}>
                        <Typography variant="caption" color="text.secondary">Collected</Typography>
                        <Typography variant="h6" color="success.main">
                          {formatCurrency(stats.paidFeesAmount)}
                        </Typography>
                      </Grid>
                      <Grid size={{ xs: 6 }}>
                        <Typography variant="caption" color="text.secondary">Pending</Typography>
                        <Typography variant="h6" color="error.main">
                          {formatCurrency(stats.pendingFeesAmount)}
                        </Typography>
                      </Grid>
                      <Grid size={{ xs: 6 }}>
                        <Typography variant="caption" color="text.secondary">Students with Bookings</Typography>
                        <Typography variant="h6">
                          {stats.activeBookings}
                        </Typography>
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              </Grid>

              <Grid size={{ xs: 12, md: 6 }}>
                <Card sx={{ bgcolor: 'grey.50' }}>
                  <CardContent>
                    <Typography variant="subtitle1" gutterBottom>Recent Trends (Last 30 Days)</Typography>
                    <Grid container spacing={2}>
                      <Grid size={{ xs: 6 }}>
                        <Typography variant="caption" color="text.secondary">New Students</Typography>
                        <Typography variant="h6">{stats.recentStudents}</Typography>
                      </Grid>
                      <Grid size={{ xs: 6 }}>
                        <Typography variant="caption" color="text.secondary">Student Growth</Typography>
                        <Typography variant="h6" color={stats.changes?.students >= 0 ? 'success.main' : 'error.main'}>
                          {stats.changes?.students ?? 0}%
                        </Typography>
                      </Grid>
                      <Grid size={{ xs: 6 }}>
                        <Typography variant="caption" color="text.secondary">Room Occupancy Change</Typography>
                        <Typography variant="h6" color={stats.changes?.rooms >= 0 ? 'success.main' : 'error.main'}>
                          {stats.changes?.rooms ?? 0}%
                        </Typography>
                      </Grid>
                      <Grid size={{ xs: 6 }}>
                        <Typography variant="caption" color="text.secondary">Pending Payments Change</Typography>
                        <Typography variant="h6" color={stats.changes?.payments <= 0 ? 'success.main' : 'error.main'}>
                          {stats.changes?.payments ?? 0}%
                        </Typography>
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </>
        )}
      </Stack>
    </ComponentsWrapper>
  );
}
