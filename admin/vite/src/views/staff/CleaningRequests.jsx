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
import TextField from '@mui/material/TextField';
import IconButton from '@mui/material/IconButton';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';

// @project
import ComponentsWrapper from '@/components/ComponentsWrapper';
import PresentationCard from '@/components/cards/PresentationCard';
import staffService from '@/services/staffService';
import { useSnackbar } from 'notistack';

// @icons
import { IconCheck, IconX, IconBrush, IconAlertCircle } from '@tabler/icons-react';

/***************************  ASSIGNED CLEANING REQUESTS PAGE  ***************************/

export default function StaffCleaningRequestsPage() {
  const { enqueueSnackbar } = useSnackbar();
  const [loading, setLoading] = useState(true);
  const [requests, setRequests] = useState([]);
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [completeDialogOpen, setCompleteDialogOpen] = useState(false);
  const [completionNotes, setCompletionNotes] = useState('');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchRequests();
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(() => {
      fetchRequests();
    }, 30000);

    return () => clearInterval(interval);
  }, [statusFilter]);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const params = statusFilter !== 'all' ? { status: statusFilter } : {};
      const data = await staffService.getAssignedCleaningRequests(params);
      setRequests(data || []);
    } catch (err) {
      console.error('Failed to fetch cleaning requests:', err);
      enqueueSnackbar(err.response?.data?.message || 'Failed to load cleaning requests', { variant: 'error' });
      setRequests([]);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCompleteDialog = (request) => {
    setSelectedRequest(request);
    setCompletionNotes('');
    setCompleteDialogOpen(true);
  };

  const handleCloseCompleteDialog = () => {
    setCompleteDialogOpen(false);
    setSelectedRequest(null);
    setCompletionNotes('');
  };

  const handleComplete = async () => {
    try {
      setProcessing(true);
      await staffService.completeCleaningRequest(selectedRequest._id, completionNotes);
      enqueueSnackbar('Cleaning request marked as completed successfully', { variant: 'success' });
      handleCloseCompleteDialog();
      fetchRequests();
    } catch (err) {
      enqueueSnackbar(err.response?.data?.message || 'Failed to complete request', { variant: 'error' });
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
      case 'assigned':
        return 'info';
      case 'completed':
        return 'success';
      default:
        return 'default';
    }
  };

  const assignedRequests = requests.filter(r => r.status === 'assigned');
  const completedRequests = requests.filter(r => r.status === 'completed');

  return (
    <ComponentsWrapper title="Assigned Cleaning Requests">
      <Stack spacing={3}>
        {/* Summary Cards */}
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <Card variant="outlined">
              <CardContent>
                <Stack spacing={1}>
                  <Typography variant="body2" color="text.secondary">Total Assigned</Typography>
                  <Typography variant="h4">{requests.length}</Typography>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <Card variant="outlined">
              <CardContent>
                <Stack spacing={1}>
                  <Typography variant="body2" color="text.secondary">Pending</Typography>
                  <Typography variant="h4" color="info.main">{assignedRequests.length}</Typography>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <Card variant="outlined">
              <CardContent>
                <Stack spacing={1}>
                  <Typography variant="body2" color="text.secondary">Completed</Typography>
                  <Typography variant="h4" color="success.main">{completedRequests.length}</Typography>
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
                <MenuItem value="assigned">Assigned</MenuItem>
                <MenuItem value="completed">Completed</MenuItem>
              </Select>
            </FormControl>
          </Stack>

          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          ) : requests.length === 0 ? (
            <Alert severity="info">No cleaning requests assigned to you.</Alert>
          ) : (
            <TableContainer component={Paper} variant="outlined">
              <Table>
                <TableHead>
                  <TableRow sx={{ bgcolor: 'grey.50' }}>
                    <TableCell><strong>Student</strong></TableCell>
                    <TableCell><strong>Room</strong></TableCell>
                    <TableCell><strong>Request Type</strong></TableCell>
                    <TableCell><strong>Urgency</strong></TableCell>
                    <TableCell><strong>Scheduled Date/Time</strong></TableCell>
                    <TableCell><strong>Status</strong></TableCell>
                    <TableCell><strong>Actions</strong></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {requests.map((request) => (
                    <TableRow key={request._id} hover>
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
                            {request.scheduledDate ? new Date(request.scheduledDate).toLocaleDateString() : 
                             request.preferredDate ? new Date(request.preferredDate).toLocaleDateString() : 'N/A'}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {request.scheduledTime ? formatTimeSlot(request.scheduledTime) : 
                             request.preferredTimeSlot ? formatTimeSlot(request.preferredTimeSlot) : 'N/A'}
                          </Typography>
                        </Stack>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={request.status === 'assigned' ? 'Assigned' : request.status === 'completed' ? 'Completed' : request.status}
                          size="small"
                          color={getStatusColor(request.status)}
                        />
                      </TableCell>
                      <TableCell>
                        {request.status === 'assigned' && (
                          <Button
                            size="small"
                            variant="contained"
                            color="success"
                            startIcon={<IconCheck size={18} />}
                            onClick={() => handleOpenCompleteDialog(request)}
                          >
                            Mark Complete
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </PresentationCard>
      </Stack>

      {/* Complete Dialog */}
      <Dialog open={completeDialogOpen} onClose={handleCloseCompleteDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Typography variant="h6">Mark Cleaning as Completed</Typography>
            <IconButton onClick={handleCloseCompleteDialog} size="small">
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
              </Alert>

              <TextField
                fullWidth
                multiline
                rows={3}
                label="Completion Notes (Optional)"
                placeholder="Add any notes about the completed cleaning..."
                value={completionNotes}
                onChange={(e) => setCompletionNotes(e.target.value)}
              />
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseCompleteDialog}>Cancel</Button>
          <Button
            variant="contained"
            color="success"
            onClick={handleComplete}
            disabled={processing}
            startIcon={processing ? <CircularProgress size={16} /> : <IconCheck size={18} />}
          >
            {processing ? 'Completing...' : 'Mark Complete'}
          </Button>
        </DialogActions>
      </Dialog>
    </ComponentsWrapper>
  );
}
