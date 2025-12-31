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
import IconButton from '@mui/material/IconButton';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import TextField from '@mui/material/TextField';
import Grid from '@mui/material/Grid';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Divider from '@mui/material/Divider';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';

// @project
import ComponentsWrapper from '@/components/ComponentsWrapper';
import PresentationCard from '@/components/cards/PresentationCard';
import adminService from '@/services/adminService';
import { useSnackbar } from 'notistack';

// @icons
import { IconEye, IconCheck, IconX, IconCreditCard, IconWallet, IconAlertCircle } from '@tabler/icons-react';

/***************************  ROOM TRANSFER REQUESTS PAGE  ***************************/

export default function TransferRequestsPage() {
  const { enqueueSnackbar } = useSnackbar();
  const [loading, setLoading] = useState(true);
  const [requests, setRequests] = useState([]);
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [actionDialogOpen, setActionDialogOpen] = useState(false);
  const [actionType, setActionType] = useState(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const data = await adminService.getAllRoomChangeRequests();
      setRequests(data.requests || data || []);
    } catch (err) {
      enqueueSnackbar(err.response?.data?.message || 'Failed to load room change requests', { variant: 'error' });
      setRequests([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredRequests = requests.filter(request => {
    if (statusFilter === 'all') return true;
    return request.status === statusFilter;
  });

  const handleViewDetails = async (requestId) => {
    try {
      const data = await adminService.getRoomChangeRequestById(requestId);
      setSelectedRequest(data.request || data);
      setDetailDialogOpen(true);
    } catch (err) {
      enqueueSnackbar(err.response?.data?.message || 'Failed to load request details', { variant: 'error' });
    }
  };

  const handleApprove = (request) => {
    setSelectedRequest(request);
    setActionType('approve');
    setActionDialogOpen(true);
  };

  const handleReject = (request) => {
    setSelectedRequest(request);
    setActionType('reject');
    setActionDialogOpen(true);
  };

  const handleConfirmAction = async () => {
    if (!selectedRequest) return;

    try {
      setProcessing(true);
      if (actionType === 'approve') {
        await adminService.approveRoomChangeRequest(selectedRequest._id, adminNotes);
        enqueueSnackbar('Room change request approved successfully', { variant: 'success' });
      } else {
        if (!rejectionReason.trim()) {
          enqueueSnackbar('Please provide a reason for rejection', { variant: 'warning' });
          return;
        }
        await adminService.rejectRoomChangeRequest(selectedRequest._id, rejectionReason, adminNotes);
        enqueueSnackbar('Room change request rejected', { variant: 'info' });
      }
      setActionDialogOpen(false);
      setAdminNotes('');
      setRejectionReason('');
      setSelectedRequest(null);
      fetchRequests();
    } catch (err) {
      enqueueSnackbar(err.response?.data?.message || `Failed to ${actionType} request`, { variant: 'error' });
    } finally {
      setProcessing(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'approved':
      case 'completed':
        return 'success';
      case 'rejected':
      case 'cancelled':
        return 'error';
      case 'pending_payment':
        return 'warning';
      case 'under_review':
        return 'info';
      default:
        return 'default';
    }
  };

  const formatStatus = (status) => {
    return status.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };

  const stats = {
    total: requests.length,
    pending: requests.filter(r => r.status === 'pending').length,
    pendingPayment: requests.filter(r => r.status === 'pending_payment').length,
    approved: requests.filter(r => r.status === 'approved' || r.status === 'completed').length,
    rejected: requests.filter(r => r.status === 'rejected').length,
  };

  return (
    <ComponentsWrapper title="Room Transfer Requests">
      <Stack spacing={3}>
        {/* Statistics */}
        <Grid container spacing={2}>
          <Grid size={{ xs: 6, sm: 4, md: 2.4 }}>
            <Card sx={{ bgcolor: 'primary.lighter', color: 'primary.main' }}>
              <CardContent>
                <Stack spacing={1}>
                  <Typography variant="h4" fontWeight={600}>{stats.total}</Typography>
                  <Typography variant="body2">Total Requests</Typography>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 6, sm: 4, md: 2.4 }}>
            <Card sx={{ bgcolor: 'warning.lighter', color: 'warning.main' }}>
              <CardContent>
                <Stack spacing={1}>
                  <Typography variant="h4" fontWeight={600}>{stats.pending}</Typography>
                  <Typography variant="body2">Pending</Typography>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 6, sm: 4, md: 2.4 }}>
            <Card sx={{ bgcolor: 'info.lighter', color: 'info.main' }}>
              <CardContent>
                <Stack spacing={1}>
                  <Typography variant="h4" fontWeight={600}>{stats.pendingPayment}</Typography>
                  <Typography variant="body2">Pending Payment</Typography>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 6, sm: 4, md: 2.4 }}>
            <Card sx={{ bgcolor: 'success.lighter', color: 'success.main' }}>
              <CardContent>
                <Stack spacing={1}>
                  <Typography variant="h4" fontWeight={600}>{stats.approved}</Typography>
                  <Typography variant="body2">Approved</Typography>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 6, sm: 4, md: 2.4 }}>
            <Card sx={{ bgcolor: 'error.lighter', color: 'error.main' }}>
              <CardContent>
                <Stack spacing={1}>
                  <Typography variant="h4" fontWeight={600}>{stats.rejected}</Typography>
                  <Typography variant="body2">Rejected</Typography>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Filter */}
        <PresentationCard>
          <Stack direction="row" spacing={2} alignItems="center">
            <Typography variant="h6">Filter by Status:</Typography>
            <FormControl size="small" sx={{ minWidth: 200 }}>
              <InputLabel>Status</InputLabel>
              <Select
                value={statusFilter}
                label="Status"
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <MenuItem value="all">All Requests</MenuItem>
                <MenuItem value="pending">Pending</MenuItem>
                <MenuItem value="pending_payment">Pending Payment</MenuItem>
                <MenuItem value="under_review">Under Review</MenuItem>
                <MenuItem value="approved">Approved</MenuItem>
                <MenuItem value="completed">Completed</MenuItem>
                <MenuItem value="rejected">Rejected</MenuItem>
                <MenuItem value="cancelled">Cancelled</MenuItem>
              </Select>
            </FormControl>
          </Stack>
        </PresentationCard>

        {/* Requests Table */}
        <PresentationCard>
          <Stack spacing={2}>
            <Typography variant="h6">Room Change Requests</Typography>
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                <CircularProgress />
              </Box>
            ) : filteredRequests.length === 0 ? (
              <Alert severity="info">No room change requests found.</Alert>
            ) : (
              <TableContainer component={Paper} elevation={0} sx={{ border: 1, borderColor: 'divider', borderRadius: 2 }}>
                <Table>
                  <TableHead>
                    <TableRow sx={{ bgcolor: 'grey.50' }}>
                      <TableCell><strong>Student</strong></TableCell>
                      <TableCell><strong>Current Room</strong></TableCell>
                      <TableCell><strong>Requested Room</strong></TableCell>
                      <TableCell><strong>Request Date</strong></TableCell>
                      <TableCell><strong>Status</strong></TableCell>
                      <TableCell><strong>Payment</strong></TableCell>
                      <TableCell><strong>Actions</strong></TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredRequests.map((request) => (
                      <TableRow key={request._id} hover>
                        <TableCell>
                          {request.student?.name || 'N/A'}
                          <Typography variant="caption" display="block" color="text.secondary">
                            {request.student?.studentId || 'N/A'}
                          </Typography>
                        </TableCell>
                        <TableCell>{request.currentRoom?.roomNumber || 'N/A'}</TableCell>
                        <TableCell>{request.requestedRoom?.roomNumber || 'N/A'}</TableCell>
                        <TableCell>
                          {request.createdAt ? new Date(request.createdAt).toLocaleDateString() : 'N/A'}
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={formatStatus(request.status)}
                            color={getStatusColor(request.status)}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          {request.paymentStatus === 'pending' && request.upgradePaymentRequired > 0 ? (
                            <Chip
                              icon={<IconCreditCard size={16} />}
                              label={`₹${request.upgradePaymentRequired.toLocaleString()}`}
                              color="warning"
                              size="small"
                            />
                          ) : request.downgradeWalletCredit > 0 ? (
                            <Chip
                              icon={<IconWallet size={16} />}
                              label={`₹${request.downgradeWalletCredit.toLocaleString()} Credit`}
                              color="info"
                              size="small"
                            />
                          ) : (
                            <Chip label="Not Required" size="small" />
                          )}
                        </TableCell>
                        <TableCell>
                          <Stack direction="row" spacing={1}>
                            <IconButton
                              size="small"
                              color="primary"
                              onClick={() => handleViewDetails(request._id)}
                            >
                              <IconEye size={18} />
                            </IconButton>
                            {request.status === 'pending' || request.status === 'pending_payment' || request.status === 'under_review' ? (
                              <>
                                <IconButton
                                  size="small"
                                  color="success"
                                  onClick={() => handleApprove(request)}
                                >
                                  <IconCheck size={18} />
                                </IconButton>
                                <IconButton
                                  size="small"
                                  color="error"
                                  onClick={() => handleReject(request)}
                                >
                                  <IconX size={18} />
                                </IconButton>
                              </>
                            ) : null}
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

        {/* Detail Dialog */}
        <Dialog open={detailDialogOpen} onClose={() => setDetailDialogOpen(false)} maxWidth="md" fullWidth>
          <DialogTitle>Request Details</DialogTitle>
          <DialogContent>
            {selectedRequest && (
              <Stack spacing={2} sx={{ mt: 1 }}>
                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Typography variant="subtitle2" color="text.secondary">Student</Typography>
                    <Typography variant="body1" fontWeight={600}>
                      {selectedRequest.student?.name || 'N/A'} ({selectedRequest.student?.studentId || 'N/A'})
                    </Typography>
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Typography variant="subtitle2" color="text.secondary">Request Date</Typography>
                    <Typography variant="body1">
                      {selectedRequest.createdAt ? new Date(selectedRequest.createdAt).toLocaleString() : 'N/A'}
                    </Typography>
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Typography variant="subtitle2" color="text.secondary">Current Room</Typography>
                    <Typography variant="body1" fontWeight={600}>
                      {selectedRequest.currentRoom?.roomNumber || 'N/A'}
                    </Typography>
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Typography variant="subtitle2" color="text.secondary">Requested Room</Typography>
                    <Typography variant="body1" fontWeight={600}>
                      {selectedRequest.requestedRoom?.roomNumber || 'N/A'}
                    </Typography>
                  </Grid>
                  <Grid size={12}>
                    <Typography variant="subtitle2" color="text.secondary">Reason</Typography>
                    <Typography variant="body1">{selectedRequest.reason || 'N/A'}</Typography>
                  </Grid>
                  <Grid size={12}>
                    <Typography variant="subtitle2" color="text.secondary">Status</Typography>
                    <Chip
                      label={formatStatus(selectedRequest.status)}
                      color={getStatusColor(selectedRequest.status)}
                      size="small"
                    />
                  </Grid>
                  {selectedRequest.priceDifference && (
                    <Grid size={12}>
                      <Alert severity={selectedRequest.priceDifference > 0 ? 'info' : 'success'}>
                        {selectedRequest.priceDifference > 0
                          ? `Upgrade Payment Required: ₹${selectedRequest.upgradePaymentRequired?.toLocaleString() || 0}`
                          : `Downgrade Credit: ₹${selectedRequest.downgradeWalletCredit?.toLocaleString() || 0} will be added to wallet`}
                      </Alert>
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

        {/* Action Dialog */}
        <Dialog open={actionDialogOpen} onClose={() => setActionDialogOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle>
            {actionType === 'approve' ? 'Approve Request' : 'Reject Request'}
          </DialogTitle>
          <DialogContent>
            <Stack spacing={2} sx={{ mt: 1 }}>
              {actionType === 'reject' && (
                <TextField
                  fullWidth
                  label="Rejection Reason"
                  multiline
                  rows={3}
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="Please provide a reason for rejecting this request..."
                  required
                />
              )}
              <TextField
                fullWidth
                label="Admin Notes (Optional)"
                multiline
                rows={3}
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                placeholder="Add any additional notes..."
              />
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => {
              setActionDialogOpen(false);
              setAdminNotes('');
              setRejectionReason('');
            }}>
              Cancel
            </Button>
            <Button
              variant="contained"
              color={actionType === 'approve' ? 'success' : 'error'}
              onClick={handleConfirmAction}
              disabled={processing || (actionType === 'reject' && !rejectionReason.trim())}
            >
              {processing ? 'Processing...' : actionType === 'approve' ? 'Approve' : 'Reject'}
            </Button>
          </DialogActions>
        </Dialog>
      </Stack>
    </ComponentsWrapper>
  );
}
