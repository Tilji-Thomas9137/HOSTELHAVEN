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
import Divider from '@mui/material/Divider';

// @project
import ComponentsWrapper from '@/components/ComponentsWrapper';
import PresentationCard from '@/components/cards/PresentationCard';
import TabPanel from '@/components/TabPanel';
import parentService from '@/services/parentService';
import { useSnackbar } from 'notistack';

// @icons
import { IconTool, IconHistory } from '@tabler/icons-react';

/***************************  COMPLAINTS PAGE  ***************************/

export default function ComplaintsPage() {
  const { enqueueSnackbar } = useSnackbar();
  const [value, setValue] = useState(0);
  const [loading, setLoading] = useState(true);
  const [complaints, setComplaints] = useState([]);

  useEffect(() => {
    fetchComplaints();
  }, []);

  const fetchComplaints = async () => {
    try {
      setLoading(true);
      const data = await parentService.getComplaints();
      setComplaints(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Fetch complaints error:', err);
      enqueueSnackbar(err.response?.data?.message || 'Failed to load complaints', { variant: 'error' });
      setComplaints([]);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (event, newValue) => {
    setValue(newValue);
  };

  const formatCategory = (category) => {
    const categoryMap = {
      'room_furniture': 'Room/Furniture',
      'electrical': 'Electrical',
      'water_plumbing': 'Water/Plumbing',
      'cleanliness': 'Cleanliness',
      'internet_wifi': 'Internet/Wi-Fi',
      'security': 'Security',
      'other': 'Others'
    };
    return categoryMap[category] || category;
  };

  const pendingComplaints = complaints.filter(c => c.status !== 'resolved');
  const resolvedComplaints = complaints.filter(c => c.status === 'resolved');

  return (
    <ComponentsWrapper title="Complaints">
      <Box sx={{ width: '100%' }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
          <Tabs value={value} onChange={handleChange}>
            <Tab label="Complaint Status" icon={<IconTool size={18} />} iconPosition="start" />
            <Tab label="Complaint History" icon={<IconHistory size={18} />} iconPosition="start" />
          </Tabs>
        </Box>

        {/* Complaint Status Tab */}
        <TabPanel value={value} index={0}>
          <PresentationCard>
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                <CircularProgress />
              </Box>
            ) : pendingComplaints.length === 0 ? (
              <Alert severity="success">No pending complaints. All complaints have been resolved!</Alert>
            ) : (
              <Stack spacing={2}>
                {pendingComplaints.map((complaint) => (
                  <Card key={complaint._id} variant="outlined" sx={{ p: 3 }}>
                    <Stack spacing={2}>
                      <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                        <Stack spacing={1}>
                          <Typography variant="h6">{complaint.title || 'Complaint'}</Typography>
                          <Typography variant="body2" color="text.secondary">
                            Child: {complaint.studentIdentity?.name || complaint.student?.name || 'N/A'} • 
                            Register: {complaint.studentIdentity?.registerNumber || complaint.studentIdentity?.admissionNumber || complaint.student?.studentId || 'N/A'} • 
                            Department: {complaint.studentIdentity?.department || 'N/A'} • 
                            Hostel: {complaint.studentIdentity?.hostelName || complaint.room?.block || complaint.room?.building || 'N/A'} • 
                            Room: {complaint.studentIdentity?.roomNumber || complaint.room?.roomNumber || 'N/A'}
                          </Typography>
                        </Stack>
                        <Chip
                          label={complaint.status}
                          color={
                            complaint.status === 'resolved' ? 'success' :
                            complaint.status === 'requested' ? 'warning' : 'default'
                          }
                          size="small"
                        />
                      </Stack>
                      
                      <Divider />
                      
                      <Box>
                        <Typography variant="subtitle2" gutterBottom>Complaint Description:</Typography>
                        <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                          {complaint.description || 'No description provided'}
                        </Typography>
                      </Box>
                      
                      {complaint.assignedTo && (
                        <Typography variant="body2" color="text.secondary">
                          <strong>Assigned to:</strong> {complaint.assignedTo.name || complaint.assignedTo.staffId || 'N/A'}
                        </Typography>
                      )}
                      
                      {complaint.resolutionNotes && (
                        <Alert severity="info">
                          <Typography variant="subtitle2" gutterBottom>Remarks / Resolution Notes:</Typography>
                          <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                            {complaint.resolutionNotes}
                          </Typography>
                        </Alert>
                      )}
                      
                      <Stack direction="row" spacing={2} justifyContent="space-between" flexWrap="wrap">
                        <Typography variant="caption" color="text.secondary">
                          <strong>Status:</strong> {complaint.status}
                        </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Submitted: {new Date(complaint.createdAt).toLocaleString()}
                      </Typography>
                        {complaint.resolvedAt && (
                          <Typography variant="caption" color="text.secondary">
                            Resolved: {new Date(complaint.resolvedAt).toLocaleString()}
                          </Typography>
                        )}
                      </Stack>
                    </Stack>
                  </Card>
                ))}
              </Stack>
            )}
          </PresentationCard>
        </TabPanel>

        {/* Complaint History Tab */}
        <TabPanel value={value} index={1}>
          <PresentationCard>
            {resolvedComplaints.length === 0 ? (
              <Alert severity="info">No resolved complaints found</Alert>
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
                      <TableCell><strong>Resolved By</strong></TableCell>
                      <TableCell><strong>Resolved Date</strong></TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {resolvedComplaints.map((complaint) => (
                      <TableRow key={complaint._id} hover>
                        <TableCell>{new Date(complaint.createdAt).toLocaleDateString()}</TableCell>
                        <TableCell>
                          <Stack spacing={0.5}>
                            <Typography variant="body2">{complaint.studentIdentity?.name || complaint.student?.name || 'N/A'}</Typography>
                            <Typography variant="caption" color="text.secondary">
                              {complaint.studentIdentity?.registerNumber || complaint.studentIdentity?.admissionNumber || complaint.student?.studentId || 'N/A'}
                            </Typography>
                          </Stack>
                        </TableCell>
                        <TableCell>{complaint.title || 'Complaint'}</TableCell>
                        <TableCell>
                          <Stack spacing={0.5}>
                            <Typography variant="body2">{complaint.studentIdentity?.hostelName || complaint.room?.block || complaint.room?.building || 'N/A'}</Typography>
                            <Typography variant="caption" color="text.secondary">
                              {complaint.studentIdentity?.roomNumber || complaint.room?.roomNumber || 'N/A'}
                            </Typography>
                          </Stack>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={complaint.status}
                            color={complaint.status === 'resolved' ? 'success' : 'default'}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>{complaint.resolvedBy?.name || 'N/A'}</TableCell>
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

