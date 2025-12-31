import { useState, useEffect } from 'react';

// @mui
import Box from '@mui/material/Box';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import Grid from '@mui/material/Grid';
import CircularProgress from '@mui/material/CircularProgress';

// @project
import ComponentsWrapper from '@/components/ComponentsWrapper';
import PresentationCard from '@/components/cards/PresentationCard';
import TabPanel from '@/components/TabPanel';
import studentService from '@/services/studentService';
import { useSnackbar } from 'notistack';

// @icons
import { IconChartBar, IconDownload } from '@tabler/icons-react';

/***************************  REPORTS PAGE  ***************************/

export default function ReportsPage() {
  const { enqueueSnackbar } = useSnackbar();
  const [value, setValue] = useState(0);
  const [loading, setLoading] = useState(true);
  const [feeReport, setFeeReport] = useState(null);
  const [attendanceReport, setAttendanceReport] = useState(null);
  const [complaintReport, setComplaintReport] = useState(null);

  useEffect(() => {
    fetchReports();
  }, [value]);

  const fetchReports = async () => {
    try {
      setLoading(true);
      if (value === 0) {
        // Fee Report
        const fees = await studentService.getFees();
        const payments = await studentService.getPaymentHistory();
        const totalFees = fees.reduce((sum, f) => sum + (f.amount || 0), 0);
        const paidFees = payments.reduce((sum, p) => sum + (p.amount || 0), 0);
        setFeeReport({
          total: totalFees,
          paid: paidFees,
          pending: totalFees - paidFees
        });
      } else if (value === 1) {
        // Attendance Report (calculate based on total calendar days in month)
        const today = new Date();
        const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
        const attendance = await studentService.getAttendance({
          startDate: startOfMonth.toISOString().split('T')[0],
          endDate: endOfMonth.toISOString().split('T')[0]
        });
        const present = (attendance || []).filter(a => a.status === 'present').length;
        const totalDaysInMonth = endOfMonth.getDate();
        const percentage = totalDaysInMonth > 0 ? ((present / totalDaysInMonth) * 100).toFixed(1) : 0;
        setAttendanceReport({
          totalDays: totalDaysInMonth,
          present,
          percentage: parseFloat(percentage)
        });
      } else if (value === 2) {
        // Complaint Report
        const complaints = await studentService.getComplaints();
        const resolved = complaints.filter(c => c.status === 'resolved').length;
        const pending = complaints.filter(c => c.status === 'pending').length;
        setComplaintReport({
          total: complaints.length,
          resolved,
          pending
        });
      }
    } catch (err) {
      enqueueSnackbar(err.response?.data?.message || 'Failed to load reports', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (event, newValue) => {
    setValue(newValue);
  };

  const handleDownload = (type) => {
    try {
      let data, filename, csvContent;
      
      switch(type) {
        case 'Fee':
          if (!feeReport) {
            enqueueSnackbar('No fee data to download', { variant: 'warning' });
            return;
          }
          // Create CSV content
          csvContent = 'Type,Amount,Status\n';
          csvContent += `Total Fees,₹${feeReport.totalFees},\n`;
          csvContent += `Paid,₹${feeReport.paid},Completed\n`;
          csvContent += `Pending,₹${feeReport.pending},Pending\n`;
          filename = `fee-report-${new Date().toISOString().split('T')[0]}.csv`;
          break;
          
        case 'Attendance':
          if (!attendanceReport) {
            enqueueSnackbar('No attendance data to download', { variant: 'warning' });
            return;
          }
          csvContent = 'Metric,Value\n';
          csvContent += `Total Days,${attendanceReport.totalDays || 0}\n`;
          csvContent += `Present,${attendanceReport.present || 0}\n`;
          csvContent += `Absent,${attendanceReport.absent || 0}\n`;
          csvContent += `Attendance Percentage,${attendanceReport.attendancePercentage || 0}%\n`;
          filename = `attendance-report-${new Date().toISOString().split('T')[0]}.csv`;
          break;
          
        case 'Complaint':
          if (!complaintReport) {
            enqueueSnackbar('No complaint data to download', { variant: 'warning' });
            return;
          }
          csvContent = 'Status,Count\n';
          csvContent += `Total Complaints,${complaintReport.total || 0}\n`;
          csvContent += `Resolved,${complaintReport.resolved || 0}\n`;
          csvContent += `Pending,${complaintReport.pending || 0}\n`;
          csvContent += `In Progress,${complaintReport.inProgress || 0}\n`;
          filename = `complaint-report-${new Date().toISOString().split('T')[0]}.csv`;
          break;
          
        default:
          return;
      }
      
      // Create and download CSV
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      
      link.setAttribute('href', url);
      link.setAttribute('download', filename);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      enqueueSnackbar(`${type} report downloaded successfully`, { variant: 'success' });
    } catch (error) {
      console.error('Download error:', error);
      enqueueSnackbar('Failed to download report', { variant: 'error' });
    }
  };

  return (
    <ComponentsWrapper title="Reports">
      <Box sx={{ width: '100%' }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
          <Tabs value={value} onChange={handleChange}>
            <Tab label="Fee Report" icon={<IconChartBar size={18} />} iconPosition="start" />
            <Tab label="Attendance Report" icon={<IconChartBar size={18} />} iconPosition="start" />
            <Tab label="Complaint Report" icon={<IconChartBar size={18} />} iconPosition="start" />
          </Tabs>
        </Box>

        {/* Fee Report Tab */}
        <TabPanel value={value} index={0}>
          <PresentationCard>
            <Stack spacing={3}>
              <Typography variant="h6">Fee Report</Typography>
              {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                  <CircularProgress />
                </Box>
              ) : feeReport ? (
                <>
                  <Card variant="outlined" sx={{ p: 3 }}>
                    <Grid container spacing={3}>
                      <Grid size={12} sm={6} md={4}>
                        <Stack>
                          <Typography variant="caption" color="text.secondary">Total Fees</Typography>
                          <Typography variant="h5">${feeReport.total}</Typography>
                        </Stack>
                      </Grid>
                      <Grid size={12} sm={6} md={4}>
                        <Stack>
                          <Typography variant="caption" color="text.secondary">Paid</Typography>
                          <Typography variant="h5" color="success.main">${feeReport.paid}</Typography>
                        </Stack>
                      </Grid>
                      <Grid size={12} sm={6} md={4}>
                        <Stack>
                          <Typography variant="caption" color="text.secondary">Pending</Typography>
                          <Typography variant="h5" color="warning.main">${feeReport.pending}</Typography>
                        </Stack>
                      </Grid>
                    </Grid>
                  </Card>
                  <Button 
                    variant="contained" 
                    startIcon={<IconDownload size={18} />}
                    onClick={() => handleDownload('Fee')}
                  >
                    Download Fee Report
                  </Button>
                </>
              ) : (
                <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 3 }}>
                  No fee data available
                </Typography>
              )}
            </Stack>
          </PresentationCard>
        </TabPanel>

        {/* Attendance Report Tab */}
        <TabPanel value={value} index={1}>
          <PresentationCard>
            <Stack spacing={3}>
              <Typography variant="h6">Attendance Report</Typography>
              {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                  <CircularProgress />
                </Box>
              ) : attendanceReport ? (
                <>
                  <Card variant="outlined" sx={{ p: 3 }}>
                    <Grid container spacing={3}>
                      <Grid size={12} sm={6} md={4}>
                        <Stack>
                          <Typography variant="caption" color="text.secondary">Total Days</Typography>
                          <Typography variant="h5">{attendanceReport.totalDays}</Typography>
                        </Stack>
                      </Grid>
                      <Grid size={12} sm={6} md={4}>
                        <Stack>
                          <Typography variant="caption" color="text.secondary">Present</Typography>
                          <Typography variant="h5" color="success.main">{attendanceReport.present}</Typography>
                        </Stack>
                      </Grid>
                      <Grid size={12} sm={6} md={4}>
                        <Stack>
                          <Typography variant="caption" color="text.secondary">Attendance %</Typography>
                          <Typography variant="h5" color="primary.main">{attendanceReport.percentage}%</Typography>
                        </Stack>
                      </Grid>
                    </Grid>
                  </Card>
                  <Button 
                    variant="contained" 
                    startIcon={<IconDownload size={18} />}
                    onClick={() => handleDownload('Attendance')}
                  >
                    Download Attendance Report
                  </Button>
                </>
              ) : (
                <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 3 }}>
                  No attendance data available
                </Typography>
              )}
            </Stack>
          </PresentationCard>
        </TabPanel>

        {/* Complaint Report Tab */}
        <TabPanel value={value} index={2}>
          <PresentationCard>
            <Stack spacing={3}>
              <Typography variant="h6">Complaint Report</Typography>
              {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                  <CircularProgress />
                </Box>
              ) : complaintReport ? (
                <>
                  <Card variant="outlined" sx={{ p: 3 }}>
                    <Grid container spacing={3}>
                      <Grid size={12} sm={6} md={4}>
                        <Stack>
                          <Typography variant="caption" color="text.secondary">Total Complaints</Typography>
                          <Typography variant="h5">{complaintReport.total}</Typography>
                        </Stack>
                      </Grid>
                      <Grid size={12} sm={6} md={4}>
                        <Stack>
                          <Typography variant="caption" color="text.secondary">Resolved</Typography>
                          <Typography variant="h5" color="success.main">{complaintReport.resolved}</Typography>
                        </Stack>
                      </Grid>
                      <Grid size={12} sm={6} md={4}>
                        <Stack>
                          <Typography variant="caption" color="text.secondary">Pending</Typography>
                          <Typography variant="h5" color="warning.main">{complaintReport.pending}</Typography>
                        </Stack>
                      </Grid>
                    </Grid>
                  </Card>
                  <Button 
                    variant="contained" 
                    startIcon={<IconDownload size={18} />}
                    onClick={() => handleDownload('Complaint')}
                  >
                    Download Complaint Report
                  </Button>
                </>
              ) : (
                <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 3 }}>
                  No complaint data available
                </Typography>
              )}
            </Stack>
          </PresentationCard>
        </TabPanel>
      </Box>
    </ComponentsWrapper>
  );
}

