import { useState, useEffect } from 'react';

// @mui
import Box from '@mui/material/Box';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';
import Chip from '@mui/material/Chip';
import Card from '@mui/material/Card';
import Grid from '@mui/material/Grid';
import CircularProgress from '@mui/material/CircularProgress';
import { LineChart } from '@mui/x-charts/LineChart';

// @project
import ComponentsWrapper from '@/components/ComponentsWrapper';
import PresentationCard from '@/components/cards/PresentationCard';
import TabPanel from '@/components/TabPanel';
import studentService from '@/services/studentService';
import { useSnackbar } from 'notistack';

// @icons
import { IconCalendarCheck, IconChartBar, IconCheck, IconX } from '@tabler/icons-react';

/***************************  ATTENDANCE PAGE  ***************************/

export default function AttendancePage() {
  const { enqueueSnackbar } = useSnackbar();
  const [value, setValue] = useState(0);
  const [loading, setLoading] = useState(true);
  const [dailyLog, setDailyLog] = useState([]);
  const [monthlyReport, setMonthlyReport] = useState(null);
  const [chartData, setChartData] = useState({ days: [], present: [], absent: [] });

  useEffect(() => {
    fetchAttendance();
  }, [value]);

  const fetchAttendance = async () => {
    try {
      setLoading(true);
      const today = new Date();
      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);

      const data = await studentService.getAttendance({
        startDate: startOfMonth.toISOString().split('T')[0],
        endDate: endOfMonth.toISOString().split('T')[0]
      });

      // Process daily log
      const sortedData = (data || []).sort((a, b) => new Date(b.date) - new Date(a.date));
      setDailyLog(sortedData);

      // Calculate monthly report
      const present = sortedData.filter(a => a.status === 'present').length;
      const recordsWithAbsentStatus = sortedData.filter(a => a.status === 'absent').length;
      const totalDaysInMonth = endOfMonth.getDate();
      const daysWithRecords = sortedData.length;
      
      // Absent days = Total days in month - Present days - Days with no attendance record
      // If a day has no attendance record, we consider it as absent
      const absent = totalDaysInMonth - present;
      
      // Calculate percentage based on total days in month, not just days with records
      const percentage = totalDaysInMonth > 0 ? ((present / totalDaysInMonth) * 100).toFixed(1) : 0;

      setMonthlyReport({
        month: today.toLocaleString('default', { month: 'long', year: 'numeric' }),
        totalDays: totalDaysInMonth,
        present,
        absent,
        percentage: parseFloat(percentage)
      });

      // Process chart data (last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const chartDataFiltered = sortedData.filter(a => new Date(a.date) >= thirtyDaysAgo);
      
      const days = chartDataFiltered.map(a => new Date(a.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
      const presentData = chartDataFiltered.map(a => a.status === 'present' ? 1 : 0);
      const absentData = chartDataFiltered.map(a => a.status === 'absent' ? 1 : 0);

      setChartData({ days, present: presentData, absent: absentData });
    } catch (err) {
      enqueueSnackbar(err.response?.data?.message || 'Failed to load attendance', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (event, newValue) => {
    setValue(newValue);
  };

  const formatTime = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <ComponentsWrapper title="Attendance">
      <Box sx={{ width: '100%' }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
          <Tabs value={value} onChange={handleChange}>
            <Tab label="Daily IN/OUT Log" icon={<IconCalendarCheck size={18} />} iconPosition="start" />
            <Tab label="Monthly Attendance Report" icon={<IconChartBar size={18} />} iconPosition="start" />
          </Tabs>
        </Box>

        {/* Daily IN/OUT Log Tab */}
        <TabPanel value={value} index={0}>
          <PresentationCard>
            <TableContainer component={Paper} elevation={0} sx={{ border: 1, borderColor: 'divider', borderRadius: 2 }}>
              <Table>
                <TableHead>
                  <TableRow sx={{ bgcolor: 'grey.50' }}>
                    <TableCell><strong>Date</strong></TableCell>
                    <TableCell><strong>IN Time</strong></TableCell>
                    <TableCell><strong>OUT Time</strong></TableCell>
                    <TableCell><strong>Status</strong></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={4} align="center">
                        <CircularProgress sx={{ py: 2 }} />
                      </TableCell>
                    </TableRow>
                  ) : dailyLog.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} align="center">
                        <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
                          No attendance records found
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    dailyLog.map((log, index) => (
                      <TableRow key={log._id || index} hover>
                        <TableCell>{new Date(log.date).toLocaleDateString()}</TableCell>
                        <TableCell>{formatTime(log.checkIn)}</TableCell>
                        <TableCell>{formatTime(log.checkOut)}</TableCell>
                        <TableCell>
                          <Chip
                            label={log.status}
                            color={log.status === 'present' ? 'success' : 'error'}
                            size="small"
                            icon={log.status === 'present' ? <IconCheck size={16} /> : <IconX size={16} />}
                          />
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </PresentationCard>
        </TabPanel>

        {/* Monthly Attendance Report Tab */}
        <TabPanel value={value} index={1}>
          <PresentationCard>
            <Stack spacing={3}>
              {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                  <CircularProgress />
                </Box>
              ) : monthlyReport ? (
                <>
                  <Card variant="outlined" sx={{ p: 3, bgcolor: 'grey.50' }}>
                    <Typography variant="h6" gutterBottom>{monthlyReport.month}</Typography>
                    <Grid container spacing={3} sx={{ mt: 1 }}>
                      <Grid size={6} sm={3}>
                        <Stack>
                          <Typography variant="caption" color="text.secondary">Total Days</Typography>
                          <Typography variant="h5">{monthlyReport.totalDays}</Typography>
                        </Stack>
                      </Grid>
                      <Grid size={6} sm={3}>
                        <Stack>
                          <Typography variant="caption" color="text.secondary">Present</Typography>
                          <Typography variant="h5" color="success.main">{monthlyReport.present}</Typography>
                        </Stack>
                      </Grid>
                      <Grid size={6} sm={3}>
                        <Stack>
                          <Typography variant="caption" color="text.secondary">Absent</Typography>
                          <Typography variant="h5" color="error.main">{monthlyReport.absent}</Typography>
                        </Stack>
                      </Grid>
                      <Grid size={6} sm={3}>
                        <Stack>
                          <Typography variant="caption" color="text.secondary">Attendance %</Typography>
                          <Typography variant="h5" color="primary.main">{monthlyReport.percentage}%</Typography>
                        </Stack>
                      </Grid>
                    </Grid>
                  </Card>
                  {chartData.days.length > 0 && (
                    <Card variant="outlined" sx={{ p: 3 }}>
                      <Typography variant="h6" gutterBottom>Monthly Attendance Trend</Typography>
                      <Box sx={{ width: '100%', height: 300 }}>
                        <LineChart
                          xAxis={[{ data: chartData.days, scaleType: 'point' }]}
                          series={[
                            { data: chartData.present, label: 'Present', color: '#4caf50' },
                            { data: chartData.absent, label: 'Absent', color: '#f44336' }
                          ]}
                          height={300}
                        />
                      </Box>
                    </Card>
                  )}
                </>
              ) : (
                <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 3 }}>
                  No attendance data available
                </Typography>
              )}
            </Stack>
          </PresentationCard>
        </TabPanel>
      </Box>
    </ComponentsWrapper>
  );
}

