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
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import Chip from '@mui/material/Chip';
import TextField from '@mui/material/TextField';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import IconButton from '@mui/material/IconButton';
import Grid from '@mui/material/Grid';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';

// @project
import ComponentsWrapper from '@/components/ComponentsWrapper';
import PresentationCard from '@/components/cards/PresentationCard';
import adminService from '@/services/adminService';
import { useSnackbar } from 'notistack';

// @icons
import {
  IconCheck,
  IconX,
  IconRefresh,
  IconEye,
  IconQrcode,
  IconCalendar,
  IconMapPin,
  IconUser,
  IconPhone,
  IconFileText,
} from '@tabler/icons-react';

/***************************  APPROVE OUTING REQUESTS PAGE  ***************************/

export default function ApproveOutingsPage() {
  const { enqueueSnackbar } = useSnackbar();
  const [loading, setLoading] = useState(true);
  const [requests, setRequests] = useState([]);
  const [filteredRequests, setFilteredRequests] = useState([]);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [approveDialogOpen, setApproveDialogOpen] = useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [remarks, setRemarks] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');

  // Filters
  const [statusFilter, setStatusFilter] = useState('pending');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchRequests();
  }, []);

  useEffect(() => {
    filterRequests();
  }, [requests, statusFilter, searchQuery]);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const data = await adminService.getAllOutingRequests({ status: statusFilter });
      setRequests(Array.isArray(data) ? data : []);
    } catch (err) {
      enqueueSnackbar(err.response?.data?.message || 'Failed to load outing requests', { variant: 'error' });
      setRequests([]);
    } finally {
      setLoading(false);
    }
  };

  const filterRequests = () => {
    let filtered = [...requests];

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((req) => {
        const studentName = req.student?.name?.toLowerCase() || '';
        const studentId = req.student?.studentId?.toLowerCase() || '';
        const destination = req.destination?.toLowerCase() || '';
        const purpose = req.purpose?.toLowerCase() || '';
        return (
          studentName.includes(query) ||
          studentId.includes(query) ||
          destination.includes(query) ||
          purpose.includes(query)
        );
      });
    }

    setFilteredRequests(filtered);
  };

  const handleApprove = async () => {
    if (!selectedRequest) return;

    try {
      setProcessing(true);
      await adminService.approveOutingRequest(selectedRequest._id, remarks);
      enqueueSnackbar('Outing request approved successfully. QR code generated.', { variant: 'success' });
      setApproveDialogOpen(false);
      setRemarks('');
      setSelectedRequest(null);
      await fetchRequests();
    } catch (err) {
      enqueueSnackbar(err.response?.data?.message || 'Failed to approve request', { variant: 'error' });
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!selectedRequest || !rejectionReason.trim()) {
      enqueueSnackbar('Please provide a rejection reason', { variant: 'warning' });
      return;
    }

    try {
      setProcessing(true);
      await adminService.rejectOutingRequest(selectedRequest._id, rejectionReason);
      enqueueSnackbar('Outing request rejected successfully', { variant: 'success' });
      setRejectDialogOpen(false);
      setRejectionReason('');
      setSelectedRequest(null);
      await fetchRequests();
    } catch (err) {
      enqueueSnackbar(err.response?.data?.message || 'Failed to reject request', { variant: 'error' });
    } finally {
      setProcessing(false);
    }
  };

  const handleViewDetails = (request) => {
    setSelectedRequest(request);
    setDetailDialogOpen(true);
  };

  const handleOpenApprove = (request) => {
    setSelectedRequest(request);
    setRemarks('');
    setApproveDialogOpen(true);
  };

  const handleOpenReject = (request) => {
    setSelectedRequest(request);
    setRejectionReason('');
    setRejectDialogOpen(true);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'approved':
        return 'success';
      case 'rejected':
        return 'error';
      case 'completed':
        return 'info';
      case 'pending':
        return 'warning';
      default:
        return 'default';
    }
  };

  const formatDate = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDateOnly = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // Calculate statistics
  const stats = {
    total: requests.length,
    pending: requests.filter((r) => r.status === 'pending').length,
    approved: requests.filter((r) => r.status === 'approved').length,
    rejected: requests.filter((r) => r.status === 'rejected').length,
    completed: requests.filter((r) => r.status === 'completed').length,
  };

  return (
    <ComponentsWrapper title="Approve Outing Requests">
      <Stack spacing={3}>
        {/* Statistics Cards */}
        <Grid container spacing={2}>
          <Grid item xs={6} sm={4} md={2.4}>
            <Card sx={{ bgcolor: 'primary.lighter', color: 'primary.main' }}>
              <CardContent>
                <Stack spacing={1}>
                  <Typography variant="h4" fontWeight={600}>
                    {stats.total}
                  </Typography>
                  <Typography variant="body2">Total Requests</Typography>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={6} sm={4} md={2.4}>
            <Card sx={{ bgcolor: 'warning.lighter', color: 'warning.main' }}>
              <CardContent>
                <Stack spacing={1}>
                  <Typography variant="h4" fontWeight={600}>
                    {stats.pending}
                  </Typography>
                  <Typography variant="body2">Pending</Typography>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={6} sm={4} md={2.4}>
            <Card sx={{ bgcolor: 'success.lighter', color: 'success.main' }}>
              <CardContent>
                <Stack spacing={1}>
                  <Typography variant="h4" fontWeight={600}>
                    {stats.approved}
                  </Typography>
                  <Typography variant="body2">Approved</Typography>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={6} sm={4} md={2.4}>
            <Card sx={{ bgcolor: 'error.lighter', color: 'error.main' }}>
              <CardContent>
                <Stack spacing={1}>
                  <Typography variant="h4" fontWeight={600}>
                    {stats.rejected}
                  </Typography>
                  <Typography variant="body2">Rejected</Typography>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={6} sm={4} md={2.4}>
            <Card sx={{ bgcolor: 'info.lighter', color: 'info.main' }}>
              <CardContent>
                <Stack spacing={1}>
                  <Typography variant="h4" fontWeight={600}>
                    {stats.completed}
                  </Typography>
                  <Typography variant="body2">Completed</Typography>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Filters */}
        <PresentationCard>
          <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap">
            <TextField
              size="small"
              placeholder="Search by student name, ID, destination..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              sx={{ minWidth: 250, flexGrow: 1 }}
            />
            <FormControl size="small" sx={{ minWidth: 150 }}>
              <InputLabel>Status</InputLabel>
              <Select
                value={statusFilter}
                label="Status"
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  fetchRequests();
                }}
              >
                <MenuItem value="all">All Status</MenuItem>
                <MenuItem value="pending">Pending</MenuItem>
                <MenuItem value="approved">Approved</MenuItem>
                <MenuItem value="rejected">Rejected</MenuItem>
                <MenuItem value="completed">Completed</MenuItem>
              </Select>
            </FormControl>
            <Button
              variant="outlined"
              startIcon={<IconRefresh size={18} />}
              onClick={fetchRequests}
              disabled={loading}
            >
              Refresh
            </Button>
          </Stack>
        </PresentationCard>

        {/* Requests Table */}
        <PresentationCard>
          <Stack spacing={2}>
            <Typography variant="h6">Outing Requests</Typography>
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                <CircularProgress />
              </Box>
            ) : filteredRequests.length === 0 ? (
              <Alert severity="info">No outing requests found matching the filters.</Alert>
            ) : (
              <TableContainer component={Paper} elevation={0} sx={{ border: 1, borderColor: 'divider', borderRadius: 2 }}>
                <Table>
                  <TableHead>
                    <TableRow sx={{ bgcolor: 'grey.50' }}>
                      <TableCell>
                        <strong>Student</strong>
                      </TableCell>
                      <TableCell>
                        <strong>Destination</strong>
                      </TableCell>
                      <TableCell>
                        <strong>Purpose</strong>
                      </TableCell>
                      <TableCell>
                        <strong>Departure</strong>
                      </TableCell>
                      <TableCell>
                        <strong>Expected Return</strong>
                      </TableCell>
                      <TableCell>
                        <strong>Status</strong>
                      </TableCell>
                      <TableCell>
                        <strong>Actions</strong>
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredRequests.map((request) => (
                      <TableRow key={request._id} hover>
                        <TableCell>
                          <Typography variant="body2" fontWeight={500}>
                            {request.student?.name || 'N/A'}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {request.student?.studentId || 'N/A'}
                          </Typography>
                        </TableCell>
                        <TableCell>{request.destination || 'N/A'}</TableCell>
                        <TableCell>{request.purpose || 'N/A'}</TableCell>
                        <TableCell>{formatDateOnly(request.departureDate)}</TableCell>
                        <TableCell>{formatDateOnly(request.expectedReturnDate)}</TableCell>
                        <TableCell>
                          <Chip
                            label={request.status?.toUpperCase()}
                            size="small"
                            color={getStatusColor(request.status)}
                          />
                        </TableCell>
                        <TableCell>
                          <Stack direction="row" spacing={1}>
                            <IconButton
                              size="small"
                              color="primary"
                              onClick={() => handleViewDetails(request)}
                            >
                              <IconEye size={18} />
                            </IconButton>
                            {request.status === 'pending' && (
                              <>
                                <IconButton
                                  size="small"
                                  color="success"
                                  onClick={() => handleOpenApprove(request)}
                                >
                                  <IconCheck size={18} />
                                </IconButton>
                                <IconButton
                                  size="small"
                                  color="error"
                                  onClick={() => handleOpenReject(request)}
                                >
                                  <IconX size={18} />
                                </IconButton>
                              </>
                            )}
                            {request.status === 'approved' && request.qrCode && (
                              <IconButton
                                size="small"
                                color="info"
                                onClick={() => handleViewDetails(request)}
                              >
                                <IconQrcode size={18} />
                              </IconButton>
                            )}
                          </Stack>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Stack>
        </PresentationCard>

        {/* Request Details Dialog */}
        <Dialog
          open={detailDialogOpen}
          onClose={() => setDetailDialogOpen(false)}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Typography variant="h6">Outing Request Details</Typography>
              <IconButton size="small" onClick={() => setDetailDialogOpen(false)}>
                <IconX size={18} />
              </IconButton>
            </Stack>
          </DialogTitle>
          <DialogContent>
            {selectedRequest && (
              <Stack spacing={2} sx={{ mt: 1 }}>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary">
                      Student Name
                    </Typography>
                    <Typography variant="body1" fontWeight={500}>
                      {selectedRequest.student?.name || 'N/A'}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary">
                      Student ID
                    </Typography>
                    <Typography variant="body1" fontWeight={500}>
                      {selectedRequest.student?.studentId || 'N/A'}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary">
                      Destination
                    </Typography>
                    <Typography variant="body1">{selectedRequest.destination || 'N/A'}</Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary">
                      Purpose
                    </Typography>
                    <Typography variant="body1">{selectedRequest.purpose || 'N/A'}</Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary">
                      Departure Date
                    </Typography>
                    <Typography variant="body1">{formatDate(selectedRequest.departureDate)}</Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary">
                      Expected Return Date
                    </Typography>
                    <Typography variant="body1">
                      {formatDate(selectedRequest.expectedReturnDate)}
                    </Typography>
                  </Grid>
                  {selectedRequest.emergencyContact && (
                    <>
                      <Grid item xs={12} sm={6}>
                        <Typography variant="body2" color="text.secondary">
                          Emergency Contact Name
                        </Typography>
                        <Typography variant="body1">
                          {selectedRequest.emergencyContact.name || 'N/A'}
                        </Typography>
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <Typography variant="body2" color="text.secondary">
                          Emergency Contact Phone
                        </Typography>
                        <Typography variant="body1">
                          {selectedRequest.emergencyContact.phone || 'N/A'}
                        </Typography>
                      </Grid>
                    </>
                  )}
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary">
                      Status
                    </Typography>
                    <Chip
                      label={selectedRequest.status?.toUpperCase()}
                      size="small"
                      color={getStatusColor(selectedRequest.status)}
                    />
                  </Grid>
                  {selectedRequest.approvedBy && (
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2" color="text.secondary">
                        Approved By
                      </Typography>
                      <Typography variant="body1">
                        {selectedRequest.approvedBy?.name || 'N/A'}
                      </Typography>
                    </Grid>
                  )}
                  {selectedRequest.approvedAt && (
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2" color="text.secondary">
                        Approved At
                      </Typography>
                      <Typography variant="body1">{formatDate(selectedRequest.approvedAt)}</Typography>
                    </Grid>
                  )}
                  {selectedRequest.exitTime && (
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2" color="text.secondary">
                        Exit Time
                      </Typography>
                      <Typography variant="body1">{formatDate(selectedRequest.exitTime)}</Typography>
                    </Grid>
                  )}
                  {selectedRequest.returnTime && (
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2" color="text.secondary">
                        Return Time
                      </Typography>
                      <Typography variant="body1">{formatDate(selectedRequest.returnTime)}</Typography>
                    </Grid>
                  )}
                  {selectedRequest.qrCode && (
                    <Grid item xs={12}>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        QR Code
                      </Typography>
                      <Box
                        sx={{
                          display: 'flex',
                          justifyContent: 'center',
                          p: 2,
                          bgcolor: 'grey.50',
                          borderRadius: 2,
                        }}
                      >
                        <img
                          src={selectedRequest.qrCode}
                          alt="QR Code"
                          style={{ maxWidth: '200px', height: 'auto' }}
                        />
                      </Box>
                    </Grid>
                  )}
                  {selectedRequest.remarks && (
                    <Grid item xs={12}>
                      <Typography variant="body2" color="text.secondary">
                        Remarks
                      </Typography>
                      <Typography variant="body1">{selectedRequest.remarks}</Typography>
                    </Grid>
                  )}
                  {selectedRequest.rejectionReason && (
                    <Grid item xs={12}>
                      <Typography variant="body2" color="text.secondary">
                        Rejection Reason
                      </Typography>
                      <Typography variant="body1" color="error.main">
                        {selectedRequest.rejectionReason}
                      </Typography>
                    </Grid>
                  )}
                </Grid>
              </Stack>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDetailDialogOpen(false)}>Close</Button>
          </DialogActions>
        </Dialog>

        {/* Approve Dialog */}
        <Dialog open={approveDialogOpen} onClose={() => setApproveDialogOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Approve Outing Request</DialogTitle>
          <DialogContent>
            <Stack spacing={2} sx={{ mt: 1 }}>
              <Alert severity="info">
                Approving this request will generate a QR code that the student can use to exit and return from the
                hostel.
              </Alert>
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Remarks (Optional)"
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                placeholder="Add any remarks or notes..."
              />
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setApproveDialogOpen(false)} disabled={processing}>
              Cancel
            </Button>
            <Button
              variant="contained"
              color="success"
              onClick={handleApprove}
              disabled={processing}
              startIcon={processing ? <CircularProgress size={18} /> : <IconCheck size={18} />}
            >
              {processing ? 'Approving...' : 'Approve'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Reject Dialog */}
        <Dialog open={rejectDialogOpen} onClose={() => setRejectDialogOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Reject Outing Request</DialogTitle>
          <DialogContent>
            <Stack spacing={2} sx={{ mt: 1 }}>
              <Alert severity="warning">Please provide a reason for rejecting this request.</Alert>
              <TextField
                fullWidth
                multiline
                rows={4}
                label="Rejection Reason *"
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Enter the reason for rejection..."
                required
                error={!rejectionReason.trim()}
                helperText={!rejectionReason.trim() ? 'Rejection reason is required' : ''}
              />
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setRejectDialogOpen(false)} disabled={processing}>
              Cancel
            </Button>
            <Button
              variant="contained"
              color="error"
              onClick={handleReject}
              disabled={processing || !rejectionReason.trim()}
              startIcon={processing ? <CircularProgress size={18} /> : <IconX size={18} />}
            >
              {processing ? 'Rejecting...' : 'Reject'}
            </Button>
          </DialogActions>
        </Dialog>
      </Stack>
    </ComponentsWrapper>
  );
}
