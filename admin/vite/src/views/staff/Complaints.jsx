import { useState, useEffect } from 'react';

import Stack from '@mui/material/Stack';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import Button from '@mui/material/Button';
import Grid from '@mui/material/Grid';
import Paper from '@mui/material/Paper';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import TableContainer from '@mui/material/TableContainer';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Chip from '@mui/material/Chip';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';
import Box from '@mui/material/Box';
import Alert from '@mui/material/Alert';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';

import ComponentsWrapper from '@/components/ComponentsWrapper';
import PresentationCard from '@/components/cards/PresentationCard';
import TabPanel from '@/components/TabPanel';
import staffService from '@/services/staffService';
import { useSnackbar } from 'notistack';

export default function StaffComplaints() {
  const { enqueueSnackbar } = useSnackbar();
  const [tab, setTab] = useState('assigned');
  const [loading, setLoading] = useState(false);
  const [complaints, setComplaints] = useState([]);
  const [filteredComplaints, setFilteredComplaints] = useState([]);
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [updateDialogOpen, setUpdateDialogOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');
  const [updateForm, setUpdateForm] = useState({
    status: 'resolved',
    resolutionNotes: ''
  });
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    fetchComplaints();
  }, []);

  useEffect(() => {
    filterComplaints();
  }, [complaints, statusFilter]);

  const fetchComplaints = async () => {
    try {
      setLoading(true);
      const data = await staffService.getAssignedComplaints();
      setComplaints(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to fetch complaints:', err);
      enqueueSnackbar(err.response?.data?.message || 'Failed to load complaints', { variant: 'error' });
      setComplaints([]);
    } finally {
      setLoading(false);
    }
  };

  const filterComplaints = () => {
    let filtered = [...complaints];
    
    if (statusFilter !== 'all') {
      filtered = filtered.filter(c => c.status === statusFilter);
    }
    
    setFilteredComplaints(filtered);
  };

  const handleOpenUpdateDialog = (complaint) => {
    setSelectedComplaint(complaint);
    setUpdateForm({
      status: complaint.status === 'requested' ? 'resolved' : 'requested',
      resolutionNotes: complaint.resolutionNotes || ''
    });
    setUpdateDialogOpen(true);
  };

  const handleCloseUpdateDialog = () => {
    setUpdateDialogOpen(false);
    setSelectedComplaint(null);
    setUpdateForm({ status: 'resolved', resolutionNotes: '' });
  };

  const handleUpdateStatus = async () => {
    if (!selectedComplaint) return;

    try {
      setUpdating(true);
      await staffService.updateComplaintStatus(selectedComplaint._id, {
        status: updateForm.status,
        resolutionNotes: updateForm.resolutionNotes.trim() || undefined
      });
      enqueueSnackbar('Complaint status updated successfully', { variant: 'success' });
      handleCloseUpdateDialog();
      fetchComplaints();
    } catch (err) {
      enqueueSnackbar(err.response?.data?.message || 'Failed to update complaint status', { variant: 'error' });
    } finally {
      setUpdating(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'resolved':
        return 'success';
      case 'requested':
        return 'warning';
      default:
        return 'default';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'urgent':
        return 'error';
      case 'high':
        return 'warning';
      case 'medium':
        return 'info';
      case 'low':
        return 'default';
      default:
        return 'default';
    }
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

  const assignedComplaints = complaints.filter(c => c.status === 'requested');
  const resolvedComplaints = complaints.filter(c => c.status === 'resolved');

  return (
    <ComponentsWrapper title="Complaints">
      <PresentationCard>
        <Stack spacing={3}>
          <Tabs value={tab} onChange={(_e, value) => setTab(value)}>
            <Tab value="assigned" label={`Assigned Complaints (${assignedComplaints.length})`} />
            <Tab value="history" label="Complaint History" />
          </Tabs>

          {/* Assigned Complaints Tab */}
          <TabPanel value={tab} index="assigned">
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                <CircularProgress />
              </Box>
            ) : assignedComplaints.length === 0 ? (
              <Alert severity="info">
                No assigned complaints. All complaints have been resolved!
              </Alert>
            ) : (
              <Stack spacing={2}>
                {assignedComplaints.map((complaint) => (
                  <Card key={complaint._id} variant="outlined" sx={{ '&:hover': { boxShadow: 2 } }}>
                    <CardContent>
                      <Stack spacing={2}>
                        <Stack direction="row" justifyContent="space-between" alignItems="flex-start" flexWrap="wrap" gap={1}>
                          <Stack spacing={1} flex={1}>
                            <Typography variant="h6">{complaint.title || 'Complaint'}</Typography>
                            <Stack direction="row" spacing={2} flexWrap="wrap">
                              <Typography variant="body2" color="text.secondary">
                                <strong>Student:</strong> {complaint.studentIdentity?.name || complaint.student?.name || 'N/A'} ({complaint.studentIdentity?.registerNumber || complaint.studentIdentity?.admissionNumber || complaint.student?.studentId || 'N/A'})
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                <strong>Course/Year:</strong> {complaint.studentIdentity?.course || complaint.student?.course || 'N/A'} {complaint.studentIdentity?.year || complaint.student?.year ? `(${complaint.studentIdentity?.year || complaint.student?.year})` : ''}
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                <strong>Room:</strong> {complaint.studentIdentity?.roomNumber || complaint.room?.roomNumber || 'N/A'}
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                <strong>Phone:</strong> {complaint.studentIdentity?.phone || complaint.student?.phone || 'N/A'}
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                <strong>Email:</strong> {complaint.studentIdentity?.email || complaint.student?.email || 'N/A'}
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                <strong>Category:</strong> {complaint.category || 'N/A'}
                              </Typography>
                            </Stack>
                          </Stack>
                          <Stack direction="row" spacing={1} alignItems="center">
                            <Chip
                              label={complaint.priority || 'medium'}
                              size="small"
                              color={getPriorityColor(complaint.priority)}
                            />
                            <Chip
                              label={complaint.status}
                              size="small"
                              color={getStatusColor(complaint.status)}
                            />
                          </Stack>
                        </Stack>
                        
                        <Typography variant="body2" color="text.secondary">
                          {complaint.description || 'No description provided'}
                        </Typography>
                        
                        <Stack direction="row" spacing={1} justifyContent="space-between" alignItems="center">
                          <Typography variant="caption" color="text.secondary">
                            Submitted: {new Date(complaint.createdAt).toLocaleString()}
                          </Typography>
                          <Button
                            variant="contained"
                            size="small"
                            onClick={() => handleOpenUpdateDialog(complaint)}
                          >
                            Update Status
                          </Button>
                        </Stack>
                      </Stack>
                    </CardContent>
                  </Card>
                ))}
              </Stack>
            )}
          </TabPanel>

          {/* Complaint History Tab */}
          <TabPanel value={tab} index="history">
            <Stack spacing={2}>
              <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
                <TextField
                  label="Filter by Status"
                  select
                  fullWidth
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <MenuItem value="all">All</MenuItem>
                  <MenuItem value="requested">Requested</MenuItem>
                  <MenuItem value="resolved">Resolved</MenuItem>
                </TextField>
              </Stack>
              
              {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                  <CircularProgress />
                </Box>
              ) : filteredComplaints.length === 0 ? (
                <Alert severity="info">
                  No complaints found.
                </Alert>
              ) : (
                <TableContainer component={Paper} variant="outlined">
                  <Table>
                    <TableHead>
                      <TableRow sx={{ bgcolor: 'grey.50' }}>
                        <TableCell><strong>Date</strong></TableCell>
                        <TableCell><strong>Student</strong></TableCell>
                        <TableCell><strong>Title</strong></TableCell>
                        <TableCell><strong>Category</strong></TableCell>
                        <TableCell><strong>Priority</strong></TableCell>
                        <TableCell><strong>Status</strong></TableCell>
                        <TableCell><strong>Actions</strong></TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {filteredComplaints.map((complaint) => (
                        <TableRow key={complaint._id} hover>
                          <TableCell>
                            {new Date(complaint.createdAt).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            <Stack spacing={0.5}>
                              <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                {complaint.studentIdentity?.name || complaint.student?.name || 'N/A'}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                Reg: {complaint.studentIdentity?.registerNumber || complaint.studentIdentity?.admissionNumber || complaint.student?.studentId || 'N/A'}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {complaint.studentIdentity?.course || complaint.student?.course || ''} {complaint.studentIdentity?.year || complaint.student?.year || ''}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                Room: {complaint.studentIdentity?.roomNumber || complaint.room?.roomNumber || 'N/A'}
                            </Typography>
                            </Stack>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" sx={{ maxWidth: 200 }}>
                              {complaint.title || 'N/A'}
                            </Typography>
                          </TableCell>
                          <TableCell>{formatCategory(complaint.category) || 'N/A'}</TableCell>
                          <TableCell>
                            <Chip
                              label={complaint.priority || 'medium'}
                              size="small"
                              color={getPriorityColor(complaint.priority)}
                            />
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={complaint.status}
                              size="small"
                              color={getStatusColor(complaint.status)}
                            />
                          </TableCell>
                          <TableCell>
                            <Button
                              size="small"
                              variant="outlined"
                              onClick={() => handleOpenUpdateDialog(complaint)}
                            >
                              Update
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </Stack>
          </TabPanel>
        </Stack>
      </PresentationCard>

      {/* Update Status Dialog */}
      <Dialog open={updateDialogOpen} onClose={handleCloseUpdateDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          Update Complaint Status
          {selectedComplaint && (
            <Typography variant="caption" display="block" color="text.secondary" sx={{ mt: 0.5 }}>
              Complaint ID: {selectedComplaint._id}
            </Typography>
          )}
        </DialogTitle>
        <DialogContent>
          {selectedComplaint && (
            <Stack spacing={3} sx={{ mt: 1 }}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="subtitle2" gutterBottom>
                    Complaint Details
                  </Typography>
                  <Divider sx={{ my: 1 }} />
                  <Stack spacing={1}>
                    <Typography variant="body2">
                      <strong>Title:</strong> {selectedComplaint.title}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Student Name:</strong> {selectedComplaint.studentIdentity?.name || selectedComplaint.student?.name || 'N/A'}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Register Number:</strong> {selectedComplaint.studentIdentity?.registerNumber || selectedComplaint.studentIdentity?.admissionNumber || selectedComplaint.student?.studentId || 'N/A'}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Course:</strong> {selectedComplaint.studentIdentity?.course || selectedComplaint.student?.course || 'N/A'}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Year:</strong> {selectedComplaint.studentIdentity?.year || selectedComplaint.student?.year || 'N/A'}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Department:</strong> {selectedComplaint.studentIdentity?.department || 'N/A'}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Hostel Name:</strong> {selectedComplaint.studentIdentity?.hostelName || selectedComplaint.room?.block || selectedComplaint.room?.building || 'N/A'}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Room Number:</strong> {selectedComplaint.studentIdentity?.roomNumber || selectedComplaint.room?.roomNumber || 'N/A'}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Phone Number:</strong> {selectedComplaint.studentIdentity?.phone || selectedComplaint.student?.phone || 'N/A'}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Email ID:</strong> {selectedComplaint.studentIdentity?.email || selectedComplaint.student?.email || 'N/A'}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Description:</strong> {selectedComplaint.description}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Current Status:</strong>{' '}
                      <Chip
                        label={selectedComplaint.status}
                        size="small"
                        color={getStatusColor(selectedComplaint.status)}
                      />
                    </Typography>
                  </Stack>
                </CardContent>
              </Card>

              <TextField
                label="Status"
                select
                fullWidth
                value={updateForm.status}
                onChange={(e) => setUpdateForm({ ...updateForm, status: e.target.value })}
              >
                <MenuItem value="requested">Requested</MenuItem>
                <MenuItem value="resolved">Resolved</MenuItem>
              </TextField>

              <TextField
                label="Resolution Notes / Remarks"
                placeholder="Add inspection notes, resolution details, or next steps..."
                multiline
                rows={4}
                fullWidth
                value={updateForm.resolutionNotes}
                onChange={(e) => setUpdateForm({ ...updateForm, resolutionNotes: e.target.value })}
              />

              {selectedComplaint.resolutionNotes && (
                <Alert severity="info">
                  <Typography variant="subtitle2" gutterBottom>
                    Previous Notes:
                  </Typography>
                  <Typography variant="body2">
                    {selectedComplaint.resolutionNotes}
                  </Typography>
                </Alert>
              )}
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseUpdateDialog} disabled={updating}>
            Cancel
          </Button>
          <Button
            onClick={handleUpdateStatus}
            variant="contained"
            disabled={updating}
          >
            {updating ? 'Updating...' : 'Update Status'}
          </Button>
        </DialogActions>
      </Dialog>
    </ComponentsWrapper>
  );
}
