import { useState, useEffect } from 'react';

// @mui
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';
import Chip from '@mui/material/Chip';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Grid from '@mui/material/Grid';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import IconButton from '@mui/material/IconButton';
import Divider from '@mui/material/Divider';

// @project
import ComponentsWrapper from '@/components/ComponentsWrapper';
import PresentationCard from '@/components/cards/PresentationCard';
import adminService from '@/services/adminService';
import { useSnackbar } from 'notistack';

// @icons
import { IconCheck, IconX, IconUser, IconCalendar, IconClock, IconBrush, IconAlertCircle } from '@tabler/icons-react';

/***************************  CLEANING REQUESTS MANAGEMENT PAGE  ***************************/

export default function CleaningRequestsPage() {
  const { enqueueSnackbar } = useSnackbar();
  const [loading, setLoading] = useState(true);
  const [requests, setRequests] = useState([]);
  const [staffList, setStaffList] = useState([]);
  const [statusFilter, setStatusFilter] = useState('all');
  const [urgencyFilter, setUrgencyFilter] = useState('all');
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [assignForm, setAssignForm] = useState({
    staffId: '',
    scheduledDate: '',
    scheduledTime: ''
  });
  const [cancellationReason, setCancellationReason] = useState('');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchRequests();
    fetchStaffList();
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(() => {
      fetchRequests();
    }, 30000);

    return () => clearInterval(interval);
  }, [statusFilter, urgencyFilter]);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const params = {};
      if (statusFilter !== 'all') params.status = statusFilter;
      if (urgencyFilter !== 'all') params.urgency = urgencyFilter;
      const data = await adminService.getAllCleaningRequests(params);
      setRequests(data || []);
    } catch (err) {
      console.error('Failed to fetch cleaning requests:', err);
      enqueueSnackbar(err.response?.data?.message || 'Failed to load cleaning requests', { variant: 'error' });
      setRequests([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchStaffList = async () => {
    try {
      const data = await adminService.getAllStaff();
      setStaffList(data || []);
    } catch (err) {
      console.error('Failed to fetch staff list:', err);
    }
  };

  const handleOpenAssignDialog = (request) => {
    setSelectedRequest(request);
    setAssignForm({
      staffId: '',
      scheduledDate: request.preferredDate ? new Date(request.preferredDate).toISOString().split('T')[0] : '',
      scheduledTime: request.preferredTimeSlot || ''
    });
    setAssignDialogOpen(true);
  };

  const handleCloseAssignDialog = () => {
    setAssignDialogOpen(false);
    setSelectedRequest(null);
    setAssignForm({ staffId: '', scheduledDate: '', scheduledTime: '' });
  };

  const handleOpenCancelDialog = (request) => {
    setSelectedRequest(request);
    setCancellationReason('');
    setCancelDialogOpen(true);
  };

  const handleCloseCancelDialog = () => {
    setCancelDialogOpen(false);
    setSelectedRequest(null);
    setCancellationReason('');
  };

  const handleAssign = async () => {
    if (!assignForm.staffId || !assignForm.scheduledDate) {
      enqueueSnackbar('Please select staff and scheduled date', { variant: 'warning' });
      return;
    }

    try {
      setProcessing(true);
      await adminService.assignCleaningRequest(selectedRequest._id, {
        staffId: assignForm.staffId,
        scheduledDate: assignForm.scheduledDate,
        scheduledTime: assignForm.scheduledTime || selectedRequest.preferredTimeSlot
      });
      enqueueSnackbar('Cleaning request assigned successfully', { variant: 'success' });
      handleCloseAssignDialog();
      fetchRequests();
    } catch (err) {
      enqueueSnackbar(err.response?.data?.message || 'Failed to assign request', { variant: 'error' });
    } finally {
      setProcessing(false);
    }
  };

  const handleCancel = async () => {
    if (!cancellationReason.trim()) {
      enqueueSnackbar('Please provide a cancellation reason', { variant: 'warning' });
      return;
    }

    try {
      setProcessing(true);
      await adminService.cancelCleaningRequest(selectedRequest._id, cancellationReason);
      enqueueSnackbar('Cleaning request cancelled successfully', { variant: 'success' });
      handleCloseCancelDialog();
      fetchRequests();
    } catch (err) {
      enqueueSnackbar(err.response?.data?.message || 'Failed to cancel request', { variant: 'error' });
    } finally {
      setProcessing(false);
    }
  };

  const formatRequestType = (type) => {
    const typeMap = {
      'room_cleaning': 'Room Cleaning',
      'bathroom_cleaning': 'Bathroom Cleaning',
      'common_area_cleaning': 'Common Area Cleaning'
    };
    return typeMap[type] || type;
  };

  const formatTimeSlot = (slot) => {
    const slotMap = {
      'morning': 'Morning',
      'afternoon': 'Afternoon',
      'evening': 'Evening'
    };
    return slotMap[slot] || slot;
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return 'warning';
      case 'assigned':
        return 'info';
      case 'completed':
        return 'success';
      case 'cancelled':
        return 'error';
      default:
        return 'default';
    }
  };

  const formatStatus = (status) => {
    const statusMap = {
      'pending': 'Pending',
      'assigned': 'Assigned',
      'completed': 'Completed',
      'cancelled': 'Cancelled'
    };
    return statusMap[status] || status;
  };

  const pendingRequests = requests.filter(r => r.status === 'pending');
  const highPriorityRequests = pendingRequests.filter(r => r.urgency === 'high');

  return (
    <ComponentsWrapper title="Cleaning Requests">
      <Stack spacing={3}>
        {/* Summary Cards */}
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card variant="outlined">
              <CardContent>
                <Stack spacing={1}>
                  <Typography variant="body2" color="text.secondary">Total Requests</Typography>
                  <Typography variant="h4">{requests.length}</Typography>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card variant="outlined">
              <CardContent>
                <Stack spacing={1}>
                  <Typography variant="body2" color="text.secondary">Pending</Typography>
                  <Typography variant="h4" color="warning.main">{pendingRequests.length}</Typography>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card variant="outlined">
              <CardContent>
                <Stack spacing={1}>
                  <Typography variant="body2" color="text.secondary">High Priority</Typography>
                  <Typography variant="h4" color="error.main">{highPriorityRequests.length}</Typography>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card variant="outlined">
              <CardContent>
                <Stack spacing={1}>
                  <Typography variant="body2" color="text.secondary">Completed</Typography>
                  <Typography variant="h4" color="success.main">
                    {requests.filter(r => r.status === 'completed').length}
                  </Typography>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Filters */}
        <PresentationCard>
          <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
            <FormControl sx={{ minWidth: 200 }}>
              <InputLabel>Filter by Status</InputLabel>
              <Select
                value={statusFilter}
                label="Filter by Status"
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <MenuItem value="all">All Status</MenuItem>
                <MenuItem value="pending">Pending</MenuItem>
                <MenuItem value="assigned">Assigned</MenuItem>
                <MenuItem value="completed">Completed</MenuItem>
                <MenuItem value="cancelled">Cancelled</MenuItem>
              </Select>
            </FormControl>
            <FormControl sx={{ minWidth: 200 }}>
              <InputLabel>Filter by Urgency</InputLabel>
              <Select
                value={urgencyFilter}
                label="Filter by Urgency"
                onChange={(e) => setUrgencyFilter(e.target.value)}
              >
                <MenuItem value="all">All Urgency</MenuItem>
                <MenuItem value="high">High</MenuItem>
                <MenuItem value="normal">Normal</MenuItem>
              </Select>
            </FormControl>
          </Stack>

          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          ) : requests.length === 0 ? (
            <Alert severity="info">No cleaning requests found.</Alert>
          ) : (
            <TableContainer component={Paper} variant="outlined">
              <Table>
                <TableHead>
                  <TableRow sx={{ bgcolor: 'grey.50' }}>
                    <TableCell><strong>Date</strong></TableCell>
                    <TableCell><strong>Student</strong></TableCell>
                    <TableCell><strong>Room</strong></TableCell>
                    <TableCell><strong>Request Type</strong></TableCell>
                    <TableCell><strong>Urgency</strong></TableCell>
                    <TableCell><strong>Preferred Date/Time</strong></TableCell>
                    <TableCell><strong>Status</strong></TableCell>
                    <TableCell><strong>Assigned To</strong></TableCell>
                    <TableCell><strong>Actions</strong></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {requests.map((request) => (
                    <TableRow key={request._id} hover>
                      <TableCell>{new Date(request.createdAt).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <Stack spacing={0.5}>
                          <Typography variant="body2" sx={{ fontWeight: 500 }}>
                            {request.studentIdentity?.name || request.student?.name || 'N/A'}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {request.studentIdentity?.studentId || request.student?.studentId || 'N/A'}
                          </Typography>
                        </Stack>
                      </TableCell>
                      <TableCell>
                        {request.studentIdentity?.roomNumber || request.room?.roomNumber || 'N/A'}
                        {request.room?.block && ` (${request.room.block})`}
                      </TableCell>
                      <TableCell>{formatRequestType(request.requestType)}</TableCell>
                      <TableCell>
                        <Chip
                          label={request.urgency === 'high' ? 'High' : 'Normal'}
                          size="small"
                          color={request.urgency === 'high' ? 'error' : 'default'}
                          icon={request.urgency === 'high' ? <IconAlertCircle size={16} /> : null}
                        />
                      </TableCell>
                      <TableCell>
                        <Stack spacing={0.5}>
                          <Typography variant="body2">
                            {request.preferredDate ? new Date(request.preferredDate).toLocaleDateString() : 'N/A'}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {formatTimeSlot(request.preferredTimeSlot)}
                          </Typography>
                        </Stack>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={formatStatus(request.status)}
                          size="small"
                          color={getStatusColor(request.status)}
                        />
                      </TableCell>
                      <TableCell>
                        {request.assignedTo?.name || 'Not Assigned'}
                        {request.scheduledDate && (
                          <Typography variant="caption" display="block" color="text.secondary">
                            {new Date(request.scheduledDate).toLocaleDateString()} {request.scheduledTime ? formatTimeSlot(request.scheduledTime) : ''}
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        <Stack direction="row" spacing={1}>
                          {request.status === 'pending' && (
                            <>
                              <Button
                                size="small"
                                variant="contained"
                                color="primary"
                                onClick={() => handleOpenAssignDialog(request)}
                              >
                                Assign
                              </Button>
                              <Button
                                size="small"
                                variant="outlined"
                                color="error"
                                onClick={() => handleOpenCancelDialog(request)}
                              >
                                Cancel
                              </Button>
                            </>
                          )}
                        </Stack>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </PresentationCard>
      </Stack>

      {/* Assign Dialog */}
      <Dialog open={assignDialogOpen} onClose={handleCloseAssignDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Typography variant="h6">Assign Cleaning Request</Typography>
            <IconButton onClick={handleCloseAssignDialog} size="small">
              <IconX size={20} />
            </IconButton>
          </Stack>
        </DialogTitle>
        <DialogContent>
          {selectedRequest && (
            <Stack spacing={3} sx={{ mt: 1 }}>
              <Alert severity="info">
                <Typography variant="body2">
                  <strong>Student:</strong> {selectedRequest.studentIdentity?.name || selectedRequest.student?.name || 'N/A'}
                </Typography>
                <Typography variant="body2">
                  <strong>Room:</strong> {selectedRequest.studentIdentity?.roomNumber || selectedRequest.room?.roomNumber || 'N/A'}
                </Typography>
                <Typography variant="body2">
                  <strong>Request Type:</strong> {formatRequestType(selectedRequest.requestType)}
                </Typography>
                <Typography variant="body2">
                  <strong>Preferred:</strong> {selectedRequest.preferredDate ? new Date(selectedRequest.preferredDate).toLocaleDateString() : 'N/A'} - {formatTimeSlot(selectedRequest.preferredTimeSlot)}
                </Typography>
              </Alert>

              <FormControl fullWidth required>
                <InputLabel>Assign To Staff *</InputLabel>
                <Select
                  value={assignForm.staffId}
                  label="Assign To Staff *"
                  onChange={(e) => setAssignForm({ ...assignForm, staffId: e.target.value })}
                >
                  {staffList.map((staff) => (
                    <MenuItem key={staff._id} value={staff._id}>
                      {staff.name} ({staff.staffId})
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <TextField
                fullWidth
                label="Scheduled Date *"
                type="date"
                value={assignForm.scheduledDate}
                onChange={(e) => setAssignForm({ ...assignForm, scheduledDate: e.target.value })}
                required
                slotProps={{
                  inputLabel: {
                    shrink: true
                  }
                }}
                inputProps={{
                  min: new Date().toISOString().split('T')[0]
                }}
              />

              <FormControl fullWidth>
                <InputLabel>Scheduled Time</InputLabel>
                <Select
                  value={assignForm.scheduledTime}
                  label="Scheduled Time"
                  onChange={(e) => setAssignForm({ ...assignForm, scheduledTime: e.target.value })}
                >
                  <MenuItem value="morning">Morning</MenuItem>
                  <MenuItem value="afternoon">Afternoon</MenuItem>
                  <MenuItem value="evening">Evening</MenuItem>
                </Select>
              </FormControl>
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseAssignDialog}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleAssign}
            disabled={processing || !assignForm.staffId || !assignForm.scheduledDate}
            startIcon={processing ? <CircularProgress size={16} /> : <IconCheck size={18} />}
          >
            {processing ? 'Assigning...' : 'Assign'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Cancel Dialog */}
      <Dialog open={cancelDialogOpen} onClose={handleCloseCancelDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Typography variant="h6">Cancel Cleaning Request</Typography>
            <IconButton onClick={handleCloseCancelDialog} size="small">
              <IconX size={20} />
            </IconButton>
          </Stack>
        </DialogTitle>
        <DialogContent>
          {selectedRequest && (
            <Stack spacing={3} sx={{ mt: 1 }}>
              <Alert severity="warning">
                Are you sure you want to cancel this cleaning request?
              </Alert>
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Cancellation Reason *"
                placeholder="Please provide a reason for cancelling this request..."
                value={cancellationReason}
                onChange={(e) => setCancellationReason(e.target.value)}
                required
              />
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseCancelDialog}>Cancel</Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleCancel}
            disabled={processing || !cancellationReason.trim()}
            startIcon={processing ? <CircularProgress size={16} /> : <IconX size={18} />}
          >
            {processing ? 'Cancelling...' : 'Cancel Request'}
          </Button>
        </DialogActions>
      </Dialog>
    </ComponentsWrapper>
  );
}
