import { useState, useEffect } from 'react';

// @mui
import Box from '@mui/material/Box';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Card from '@mui/material/Card';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';
import { LineChart } from '@mui/x-charts/LineChart';

// @project
import ComponentsWrapper from '@/components/ComponentsWrapper';
import PresentationCard from '@/components/cards/PresentationCard';
import TabPanel from '@/components/TabPanel';
import parentService from '@/services/parentService';
import { useSnackbar } from 'notistack';

// @icons
import { IconCalendarCheck, IconClock } from '@tabler/icons-react';

/***************************  ATTENDANCE PAGE  ***************************/

export default function AttendancePage() {
  const { enqueueSnackbar } = useSnackbar();
  const [value, setValue] = useState(0);
  const [loading, setLoading] = useState(true);
  const [attendance, setAttendance] = useState([]);
  const [monthlyData, setMonthlyData] = useState([]);

  useEffect(() => {
    fetchAttendance();
  }, []);

  const fetchAttendance = async () => {
    try {
      setLoading(true);
      const data = await parentService.getAttendance();
      const attendanceArray = Array.isArray(data) ? data : [];
      setAttendance(attendanceArray);

      // Group by month for monthly view
      const monthly = {};
      attendanceArray.forEach((record) => {
        const date = new Date(record.date);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        if (!monthly[monthKey]) {
          monthly[monthKey] = { present: 0, absent: 0, total: 0 };
        }
        monthly[monthKey].total++;
        if (record.status === 'present') {
          monthly[monthKey].present++;
        } else if (record.status === 'absent') {
          monthly[monthKey].absent++;
        }
      });
      setMonthlyData(Object.entries(monthly).map(([month, data]) => ({ month, ...data })));
    } catch (err) {
      console.error('Fetch attendance error:', err);
      enqueueSnackbar(err.response?.data?.message || 'Failed to load attendance', { variant: 'error' });
      setAttendance([]);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (event, newValue) => {
    setValue(newValue);
  };

  // Prepare monthly chart data
  const chartData = {
    xAxis: [{ data: monthlyData.map(d => d.month) }],
    series: [
      {
        data: monthlyData.map(d => d.present),
        label: 'Present',
        color: '#4caf50'
      },
      {
        data: monthlyData.map(d => d.absent),
        label: 'Absent',
        color: '#f44336'
      }
    ]
  };

  return (
    <ComponentsWrapper title="Attendance">
      <Box sx={{ width: '100%' }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
          <Tabs value={value} onChange={handleChange}>
            <Tab label="Daily Attendance" icon={<IconCalendarCheck size={18} />} iconPosition="start" />
            <Tab label="Monthly Attendance" icon={<IconClock size={18} />} iconPosition="start" />
          </Tabs>
        </Box>

        {/* Daily Attendance Tab */}
        <TabPanel value={value} index={0}>
          <PresentationCard>
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                <CircularProgress />
              </Box>
            ) : attendance.length === 0 ? (
              <Alert severity="info">No attendance records found</Alert>
            ) : (
              <TableContainer component={Paper} elevation={0} sx={{ border: 1, borderColor: 'divider', borderRadius: 2 }}>
                <Table>
                  <TableHead>
                    <TableRow sx={{ bgcolor: 'grey.50' }}>
                      <TableCell><strong>Date</strong></TableCell>
                      <TableCell><strong>Child</strong></TableCell>
                      <TableCell><strong>IN Time</strong></TableCell>
                      <TableCell><strong>OUT Time</strong></TableCell>
                      <TableCell><strong>Status</strong></TableCell>
                      <TableCell><strong>Remarks</strong></TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {attendance.map((record) => (
                      <TableRow key={record._id} hover>
                        <TableCell>{new Date(record.date).toLocaleDateString()}</TableCell>
                        <TableCell>{record.student?.name || 'N/A'}</TableCell>
                        <TableCell>
                          {record.inTime ? new Date(record.inTime).toLocaleTimeString() : 'N/A'}
                        </TableCell>
                        <TableCell>
                          {record.outTime ? new Date(record.outTime).toLocaleTimeString() : 'N/A'}
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={record.status}
                            color={
                              record.status === 'present' ? 'success' :
                              record.status === 'absent' ? 'error' :
                              record.status === 'leave' ? 'warning' : 'default'
                            }
                            size="small"
                          />
                        </TableCell>
                        <TableCell>{record.remarks || 'N/A'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </PresentationCard>
        </TabPanel>

        {/* Monthly Attendance Tab */}
        <TabPanel value={value} index={1}>
          <PresentationCard>
            {monthlyData.length === 0 ? (
              <Alert severity="info">No monthly attendance data available</Alert>
            ) : (
              <Stack spacing={3}>
                {/* Monthly Chart */}
                <Card variant="outlined" sx={{ p: 3 }}>
                  <Typography variant="h6" gutterBottom>Monthly Attendance Trend</Typography>
                  <Box sx={{ width: '100%', height: 300 }}>
                    <LineChart
                      width={800}
                      height={300}
                      series={chartData.series}
                      xAxis={chartData.xAxis}
                    />
                  </Box>
                </Card>

                {/* Monthly Summary Table */}
                <Card variant="outlined" sx={{ p: 3 }}>
                  <Typography variant="h6" gutterBottom>Monthly Summary</Typography>
                  <TableContainer>
                    <Table>
                      <TableHead>
                        <TableRow sx={{ bgcolor: 'grey.50' }}>
                          <TableCell><strong>Month</strong></TableCell>
                          <TableCell><strong>Present</strong></TableCell>
                          <TableCell><strong>Absent</strong></TableCell>
                          <TableCell><strong>Total Days</strong></TableCell>
                          <TableCell><strong>Attendance %</strong></TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {monthlyData.map((data) => {
                          const percentage = data.total > 0 ? Math.round((data.present / data.total) * 100) : 0;
                          return (
                            <TableRow key={data.month} hover>
                              <TableCell>{data.month}</TableCell>
                              <TableCell>
                                <Chip label={data.present} color="success" size="small" />
                              </TableCell>
                              <TableCell>
                                <Chip label={data.absent} color="error" size="small" />
                              </TableCell>
                              <TableCell>{data.total}</TableCell>
                              <TableCell>
                                <Chip
                                  label={`${percentage}%`}
                                  color={percentage >= 75 ? 'success' : percentage >= 50 ? 'warning' : 'error'}
                                  size="small"
                                />
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Card>
              </Stack>
            )}
          </PresentationCard>
        </TabPanel>
      </Box>
    </ComponentsWrapper>
  );
}

