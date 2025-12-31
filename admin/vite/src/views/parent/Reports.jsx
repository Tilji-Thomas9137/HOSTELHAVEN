import { useState, useEffect } from 'react';

// @mui
import Box from '@mui/material/Box';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Card from '@mui/material/Card';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';

// @project
import ComponentsWrapper from '@/components/ComponentsWrapper';
import PresentationCard from '@/components/cards/PresentationCard';
import TabPanel from '@/components/TabPanel';
import parentService from '@/services/parentService';
import { useSnackbar } from 'notistack';

// @icons
import { IconChartBar, IconDownload } from '@tabler/icons-react';

/***************************  REPORTS PAGE  ***************************/

export default function ReportsPage() {
  const { enqueueSnackbar } = useSnackbar();
  const [value, setValue] = useState(0);
  const [loading, setLoading] = useState(true);
  const [feeData, setFeeData] = useState([]);
  const [attendanceData, setAttendanceData] = useState([]);
  const [complaintData, setComplaintData] = useState([]);

  useEffect(() => {
    if (value === 0) fetchFeeReport();
    else if (value === 1) fetchAttendanceReport();
    else if (value === 2) fetchComplaintReport();
  }, [value]);

  const fetchFeeReport = async () => {
    try {
      setLoading(true);
      const data = await parentService.getPaymentStatus();
      setFeeData(data?.fees || []);
    } catch (err) {
      console.error('Fetch fee report error:', err);
      enqueueSnackbar(err.response?.data?.message || 'Failed to load fee report', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const fetchAttendanceReport = async () => {
    try {
      setLoading(true);
      const data = await parentService.getAttendance();
      setAttendanceData(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Fetch attendance report error:', err);
      enqueueSnackbar(err.response?.data?.message || 'Failed to load attendance report', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const fetchComplaintReport = async () => {
    try {
      setLoading(true);
      const data = await parentService.getComplaints();
      setComplaintData(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Fetch complaint report error:', err);
      enqueueSnackbar(err.response?.data?.message || 'Failed to load complaint report', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (event, newValue) => {
    setValue(newValue);
  };

  const [downloading, setDownloading] = useState(false);

  const handleDownloadPDF = async (type) => {
    try {
      setDownloading(true);
      let blob;
      let fileName;

      if (type === 'Fee') {
        blob = await parentService.downloadFeeReport();
        fileName = `Fee_Report_${new Date().toISOString().split('T')[0]}.pdf`;
      } else if (type === 'Attendance') {
        blob = await parentService.downloadAttendanceReport();
        fileName = `Attendance_Report_${new Date().toISOString().split('T')[0]}.pdf`;
      } else if (type === 'Complaint') {
        blob = await parentService.downloadComplaintReport();
        fileName = `Complaint_Report_${new Date().toISOString().split('T')[0]}.pdf`;
      } else {
        throw new Error('Invalid report type');
      }

      // Create download link
      const url = window.URL.createObjectURL(new Blob([blob], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      enqueueSnackbar(`${type} report downloaded successfully`, { variant: 'success' });
    } catch (err) {
      console.error('Download report error:', err);
      enqueueSnackbar(err.response?.data?.message || `Failed to download ${type} report`, { variant: 'error' });
    } finally {
      setDownloading(false);
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
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
              <Typography variant="h6">Fee Report</Typography>
              <Button
                variant="outlined"
                startIcon={<IconDownload size={18} />}
                onClick={() => handleDownloadPDF('Fee')}
                disabled={downloading || feeData.length === 0}
              >
                {downloading ? 'Downloading...' : 'Download PDF'}
              </Button>
            </Stack>
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                <CircularProgress />
              </Box>
            ) : feeData.length === 0 ? (
              <Alert severity="info">No fee data available</Alert>
            ) : (
              <TableContainer component={Paper} elevation={0} sx={{ border: 1, borderColor: 'divider', borderRadius: 2 }}>
                <Table>
                  <TableHead>
                    <TableRow sx={{ bgcolor: 'grey.50' }}>
                      <TableCell><strong>Child</strong></TableCell>
                      <TableCell><strong>Fee Type</strong></TableCell>
                      <TableCell><strong>Total Amount</strong></TableCell>
                      <TableCell><strong>Paid</strong></TableCell>
                      <TableCell><strong>Pending</strong></TableCell>
                      <TableCell><strong>Due Date</strong></TableCell>
                      <TableCell><strong>Status</strong></TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {feeData.map((fee) => {
                      const remaining = fee.amount - (fee.paidAmount || 0);
                      return (
                        <TableRow key={fee._id} hover>
                          <TableCell>{fee.student?.name || 'N/A'}</TableCell>
                          <TableCell>
                            {fee.feeType?.charAt(0).toUpperCase() + fee.feeType?.slice(1).replace('_', ' ')}
                          </TableCell>
                          <TableCell>₹{fee.amount.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</TableCell>
                          <TableCell>₹{(fee.paidAmount || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}</TableCell>
                          <TableCell>₹{remaining.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</TableCell>
                          <TableCell>{new Date(fee.dueDate).toLocaleDateString()}</TableCell>
                          <TableCell>{fee.status}</TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </PresentationCard>
        </TabPanel>

        {/* Attendance Report Tab */}
        <TabPanel value={value} index={1}>
          <PresentationCard>
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
              <Typography variant="h6">Attendance Report</Typography>
              <Button
                variant="outlined"
                startIcon={<IconDownload size={18} />}
                onClick={() => handleDownloadPDF('Attendance')}
                disabled={downloading || attendanceData.length === 0}
              >
                {downloading ? 'Downloading...' : 'Download PDF'}
              </Button>
            </Stack>
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                <CircularProgress />
              </Box>
            ) : attendanceData.length === 0 ? (
              <Alert severity="info">No attendance data available</Alert>
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
                    {attendanceData.map((record) => (
                      <TableRow key={record._id} hover>
                        <TableCell>{new Date(record.date).toLocaleDateString()}</TableCell>
                        <TableCell>{record.student?.name || 'N/A'}</TableCell>
                        <TableCell>
                          {record.inTime ? new Date(record.inTime).toLocaleTimeString() : 'N/A'}
                        </TableCell>
                        <TableCell>
                          {record.outTime ? new Date(record.outTime).toLocaleTimeString() : 'N/A'}
                        </TableCell>
                        <TableCell>{record.status}</TableCell>
                        <TableCell>{record.remarks || 'N/A'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </PresentationCard>
        </TabPanel>

        {/* Complaint Report Tab */}
        <TabPanel value={value} index={2}>
          <PresentationCard>
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
              <Typography variant="h6">Complaint Report</Typography>
              <Button
                variant="outlined"
                startIcon={<IconDownload size={18} />}
                onClick={() => handleDownloadPDF('Complaint')}
                disabled={downloading || complaintData.length === 0}
              >
                {downloading ? 'Downloading...' : 'Download PDF'}
              </Button>
            </Stack>
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                <CircularProgress />
              </Box>
            ) : complaintData.length === 0 ? (
              <Alert severity="info">No complaint data available</Alert>
            ) : (
              <TableContainer component={Paper} elevation={0} sx={{ border: 1, borderColor: 'divider', borderRadius: 2 }}>
                <Table>
                  <TableHead>
                    <TableRow sx={{ bgcolor: 'grey.50' }}>
                      <TableCell><strong>Date</strong></TableCell>
                      <TableCell><strong>Child</strong></TableCell>
                      <TableCell><strong>Title</strong></TableCell>
                      <TableCell><strong>Room</strong></TableCell>
                      <TableCell><strong>Status</strong></TableCell>
                      <TableCell><strong>Resolved Date</strong></TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {complaintData.map((complaint) => (
                      <TableRow key={complaint._id} hover>
                        <TableCell>{new Date(complaint.createdAt).toLocaleDateString()}</TableCell>
                        <TableCell>{complaint.student?.name || 'N/A'}</TableCell>
                        <TableCell>{complaint.title || 'Complaint'}</TableCell>
                        <TableCell>{complaint.room?.roomNumber || 'N/A'}</TableCell>
                        <TableCell>{complaint.status}</TableCell>
                        <TableCell>
                          {complaint.resolvedAt ? new Date(complaint.resolvedAt).toLocaleDateString() : 'N/A'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </PresentationCard>
        </TabPanel>
      </Box>
    </ComponentsWrapper>
  );
}

