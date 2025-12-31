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
import Divider from '@mui/material/Divider';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
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

export default function RoomChangeRequestsPage() {
  const { enqueueSnackbar } = useSnackbar();
  const [loading, setLoading] = useState(true);
  const [requests, setRequests] = useState([]);
  const [filteredRequests, setFilteredRequests] = useState([]);
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [approveDialogOpen, setApproveDialogOpen] = useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [adminNotes, setAdminNotes] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchRequests();
  }, []);

  useEffect(() => {
    filterRequests();
  }, [requests, statusFilter]);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const response = await adminService.getAllRoomChangeRequests();
      setRequests(response.requests || []);
    } catch (error) {
      enqueueSnackbar('Failed to fetch room change requests', { variant: 'error' });
      console.error('Error fetching requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterRequests = () => {
    if (statusFilter === 'all') {
      setFilteredRequests(requests);
    } else {
      setFilteredRequests(requests.filter(req => req.status === statusFilter));
    }
  };

  const handleViewDetails = async (requestId) => {
    try {
      const response = await adminService.getRoomChangeRequestById(requestId);
      setSelectedRequest(response.request);
      setDetailDialogOpen(true);
    } catch (error) {
      enqueueSnackbar('Failed to fetch request details', { variant: 'error' });
    }
  };

  const handleApprove = async () => {
    if (!selectedRequest) return;

    try {
      setProcessing(true);
      await adminService.approveRoomChangeRequest(selectedRequest._id, adminNotes);
      enqueueSnackbar('Room change request approved successfully', { variant: 'success' });
      setApproveDialogOpen(false);
      setDetailDialogOpen(false);
      setAdminNotes('');
      setSelectedRequest(null);
      await fetchRequests();
    } catch (error) {
      enqueueSnackbar(error.response?.data?.message || 'Failed to approve request', { variant: 'error' });
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
      await adminService.rejectRoomChangeRequest(selectedRequest._id, rejectionReason, adminNotes);
      enqueueSnackbar('Room change request rejected successfully', { variant: 'success' });
      setRejectDialogOpen(false);
      setDetailDialogOpen(false);
      setRejectionReason('');
      setAdminNotes('');
      setSelectedRequest(null);
      await fetchRequests();
    } catch (error) {
      enqueueSnackbar(error.response?.data?.message || 'Failed to reject request', { variant: 'error' });
    } finally {
      setProcessing(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
      case 'pending_payment':
        return 'warning';
      case 'under_review':
        return 'info';
      case 'approved':
      case 'completed':
        return 'success';
      case 'rejected':
        return 'error';
      default:
        return 'default';
    }
  };

  const formatPrice = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getStatusCounts = () => {
    return {
      all: requests.length,
      pending: requests.filter(r => r.status === 'pending').length,
      pending_payment: requests.filter(r => r.status === 'pending_payment').length,
      under_review: requests.filter(r => r.status === 'under_review').length,
      approved: requests.filter(r => r.status === 'approved' || r.status === 'completed').length,
      rejected: requests.filter(r => r.status === 'rejected').length,
    };
  };

  const statusCounts = getStatusCounts();

  if (loading) {
    return (
      <ComponentsWrapper>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
          <CircularProgress />
        </Box>
      </ComponentsWrapper>
    );
  }

  return (
    <ComponentsWrapper>
      <Stack spacing={3}>
        <PresentationCard title="Room Change Requests">
          {/* Status Filter Tabs */}
          <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
            <Tabs
              value={statusFilter}
              onChange={(e, newValue) => setStatusFilter(newValue)}
              variant="scrollable"
              scrollButtons="auto"
            >
              <Tab label={`All (${statusCounts.all})`} value="all" />
              <Tab label={`Pending (${statusCounts.pending})`} value="pending" />
              <Tab label={`Payment Pending (${statusCounts.pending_payment})`} value="pending_payment" />
              <Tab label={`Under Review (${statusCounts.under_review})`} value="under_review" />
              <Tab label={`Approved (${statusCounts.approved})`} value="approved" />
              <Tab label={`Rejected (${statusCounts.rejected})`} value="rejected" />
            </Tabs>
          </Box>

          {filteredRequests.length === 0 ? (
            <Alert severity="info">No room change requests found.</Alert>
          ) : (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell><strong>Student</strong></TableCell>
                    <TableCell><strong>From Room</strong></TableCell>
                    <TableCell><strong>To Room</strong></TableCell>
                    <TableCell><strong>Price Difference</strong></TableCell>
                    <TableCell><strong>Status</strong></TableCell>
                    <TableCell><strong>Date</strong></TableCell>
                    <TableCell><strong>Actions</strong></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredRequests.map((request) => (
                    <TableRow key={request._id} hover>
                      <TableCell>
                        <Stack>
                          <Typography variant="body2" fontWeight={600}>
                            {request.student?.name || 'N/A'}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {request.student?.studentId || 'N/A'}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {request.student?.course || 'N/A'} - {request.student?.batchYear || 'N/A'}
                          </Typography>
                        </Stack>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {request.currentRoom?.roomNumber || 'N/A'}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {formatPrice(request.currentRoomPrice || 0)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {request.requestedRoom?.roomNumber || 'N/A'}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {formatPrice(request.requestedRoomPrice || 0)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        {request.priceDifference > 0 ? (
                          <Chip
                            icon={<IconCreditCard size={16} />}
                            label={`+${formatPrice(request.upgradePaymentRequired || 0)}`}
                            color="warning"
                            size="small"
                          />
                        ) : request.priceDifference < 0 ? (
                          <Chip
                            icon={<IconWallet size={16} />}
                            label={`-${formatPrice(request.downgradeWalletCredit || 0)}`}
                            color="info"
                            size="small"
                          />
                        ) : (
                          <Typography variant="body2" color="text.secondary">
                            No change
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={request.status.replace('_', ' ').toUpperCase()}
                          color={getStatusColor(request.status)}
                          size="small"
                        />
                        {request.paymentStatus === 'pending' && request.upgradePaymentRequired > 0 && (
                          <Chip
                            label="Payment Pending"
                            color="error"
                            size="small"
                            sx={{ ml: 1 }}
                          />
                        )}
                      </TableCell>
                      <TableCell>
                        {new Date(request.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <IconButton
                          size="small"
                          color="primary"
                          onClick={() => handleViewDetails(request._id)}
                          title="View Details"
                        >
                          <IconEye size={18} />
                        </IconButton>
                        {request.status !== 'approved' && request.status !== 'completed' && request.status !== 'rejected' && (
                          <>
                            <IconButton
                              size="small"
                              color="success"
                              onClick={() => {
                                handleViewDetails(request._id);
                                setTimeout(() => setApproveDialogOpen(true), 300);
                              }}
                              disabled={request.paymentStatus === 'pending' && request.upgradePaymentRequired > 0}
                              title={request.paymentStatus === 'pending' ? 'Payment required before approval' : 'Approve'}
                            >
                              <IconCheck size={18} />
                            </IconButton>
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => {
                                handleViewDetails(request._id);
                                setTimeout(() => setRejectDialogOpen(true), 300);
                              }}
                              title="Reject"
                            >
                              <IconX size={18} />
                            </IconButton>
                          </>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </PresentationCard>

        {/* Detail Dialog */}
        <Dialog
          open={detailDialogOpen}
          onClose={() => {
            setDetailDialogOpen(false);
            setSelectedRequest(null);
            setAdminNotes('');
            setRejectionReason('');
          }}
          maxWidth="md"
          fullWidth
        >
          {selectedRequest && (
            <>
              <DialogTitle>Room Change Request Details</DialogTitle>
              <DialogContent>
                <Stack spacing={3} sx={{ mt: 1 }}>
                  {/* Student Info */}
                  <Card variant="outlined" sx={{ p: 2 }}>
                    <Typography variant="subtitle1" gutterBottom fontWeight={600}>
                      Student Information
                    </Typography>
                    <Grid container spacing={2}>
                      <Grid size={{ xs: 12, sm: 6 }}>
                        <Typography variant="body2" color="text.secondary">Name</Typography>
                        <Typography variant="body1">{selectedRequest.student?.name || 'N/A'}</Typography>
                      </Grid>
                      <Grid size={{ xs: 12, sm: 6 }}>
                        <Typography variant="body2" color="text.secondary">Admission Number</Typography>
                        <Typography variant="body1">{selectedRequest.student?.studentId || 'N/A'}</Typography>
                      </Grid>
                      <Grid size={{ xs: 12, sm: 6 }}>
                        <Typography variant="body2" color="text.secondary">Course</Typography>
                        <Typography variant="body1">{selectedRequest.student?.course || 'N/A'}</Typography>
                      </Grid>
                      <Grid size={{ xs: 12, sm: 6 }}>
                        <Typography variant="body2" color="text.secondary">Batch Year</Typography>
                        <Typography variant="body1">{selectedRequest.student?.batchYear || 'N/A'}</Typography>
                      </Grid>
                    </Grid>
                  </Card>

                  {/* Room Comparison */}
                  <Grid container spacing={2}>
                    <Grid size={{ xs: 12, md: 6 }}>
                      <Card variant="outlined" sx={{ p: 2 }}>
                        <Typography variant="subtitle1" gutterBottom fontWeight={600}>
                          Current Room
                        </Typography>
                        <Stack spacing={1}>
                          <Typography variant="h6">{selectedRequest.currentRoom?.roomNumber || 'N/A'}</Typography>
                          <Typography variant="body2">
                            <strong>Block:</strong> {selectedRequest.currentRoom?.block || 'N/A'}
                          </Typography>
                          <Typography variant="body2">
                            <strong>Floor:</strong>{' '}
                            {selectedRequest.currentRoom?.floor !== null && selectedRequest.currentRoom?.floor !== undefined
                              ? selectedRequest.currentRoom.floor === 0
                                ? 'Ground Floor'
                                : `${selectedRequest.currentRoom.floor}${selectedRequest.currentRoom.floor === 1 ? 'st' : selectedRequest.currentRoom.floor === 2 ? 'nd' : selectedRequest.currentRoom.floor === 3 ? 'rd' : 'th'} Floor`
                              : 'N/A'}
                          </Typography>
                          <Typography variant="body2">
                            <strong>Type:</strong> {selectedRequest.currentRoom?.roomType || 'N/A'}
                          </Typography>
                          <Typography variant="body2">
                            <strong>Yearly Fee:</strong> {formatPrice(selectedRequest.currentRoomPrice || 0)}
                          </Typography>
                          {selectedRequest.currentRoomOccupants && selectedRequest.currentRoomOccupants.length > 0 && (
                            <Box sx={{ mt: 1 }}>
                              <Typography variant="caption" color="text.secondary">Current Occupants:</Typography>
                              {selectedRequest.currentRoomOccupants.map((occupant, idx) => (
                                <Typography key={idx} variant="caption" display="block">
                                  • {occupant.name} ({occupant.admissionNumber})
                                </Typography>
                              ))}
                            </Box>
                          )}
                        </Stack>
                      </Card>
                    </Grid>
                    <Grid size={{ xs: 12, md: 6 }}>
                      <Card variant="outlined" sx={{ p: 2 }}>
                        <Typography variant="subtitle1" gutterBottom fontWeight={600}>
                          Requested Room
                        </Typography>
                        <Stack spacing={1}>
                          <Typography variant="h6">{selectedRequest.requestedRoom?.roomNumber || 'N/A'}</Typography>
                          <Typography variant="body2">
                            <strong>Block:</strong> {selectedRequest.requestedRoom?.block || 'N/A'}
                          </Typography>
                          <Typography variant="body2">
                            <strong>Floor:</strong>{' '}
                            {selectedRequest.requestedRoom?.floor !== null && selectedRequest.requestedRoom?.floor !== undefined
                              ? selectedRequest.requestedRoom.floor === 0
                                ? 'Ground Floor'
                                : `${selectedRequest.requestedRoom.floor}${selectedRequest.requestedRoom.floor === 1 ? 'st' : selectedRequest.requestedRoom.floor === 2 ? 'nd' : selectedRequest.requestedRoom.floor === 3 ? 'rd' : 'th'} Floor`
                              : 'N/A'}
                          </Typography>
                          <Typography variant="body2">
                            <strong>Type:</strong> {selectedRequest.requestedRoom?.roomType || 'N/A'}
                          </Typography>
                          <Typography variant="body2">
                            <strong>Yearly Fee:</strong> {formatPrice(selectedRequest.requestedRoomPrice || 0)}
                          </Typography>
                          <Typography variant="body2">
                            <strong>Available Slots:</strong>{' '}
                            {(selectedRequest.requestedRoom?.capacity || 0) - (selectedRequest.requestedRoom?.currentOccupancy || 0)}
                          </Typography>
                          {selectedRequest.requestedRoomOccupants && selectedRequest.requestedRoomOccupants.length > 0 && (
                            <Box sx={{ mt: 1 }}>
                              <Typography variant="caption" color="text.secondary">Current Occupants:</Typography>
                              {selectedRequest.requestedRoomOccupants.map((occupant, idx) => (
                                <Typography key={idx} variant="caption" display="block">
                                  • {occupant.name} ({occupant.admissionNumber})
                                </Typography>
                              ))}
                            </Box>
                          )}
                        </Stack>
                      </Card>
                    </Grid>
                  </Grid>

                  {/* Price Difference */}
                  <Card variant="outlined" sx={{ p: 2, bgcolor: 'grey.50' }}>
                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                      <Typography variant="subtitle1" fontWeight={600}>
                        Price Difference
                      </Typography>
                      {selectedRequest.priceDifference > 0 ? (
                        <Chip
                          icon={<IconCreditCard size={16} />}
                          label={`Upgrade: +${formatPrice(selectedRequest.upgradePaymentRequired || 0)}`}
                          color="warning"
                        />
                      ) : selectedRequest.priceDifference < 0 ? (
                        <Chip
                          icon={<IconWallet size={16} />}
                          label={`Downgrade: -${formatPrice(selectedRequest.downgradeWalletCredit || 0)} (Wallet Credit)`}
                          color="info"
                        />
                      ) : (
                        <Chip label="No Price Difference" color="default" />
                      )}
                    </Stack>
                    {selectedRequest.paymentStatus === 'pending' && selectedRequest.upgradePaymentRequired > 0 && (
                      <Alert severity="warning" sx={{ mt: 2 }}>
                        Payment of {formatPrice(selectedRequest.upgradePaymentRequired)} is required before approval.
                      </Alert>
                    )}
                  </Card>

                  {/* Reason */}
                  <Card variant="outlined" sx={{ p: 2 }}>
                    <Typography variant="subtitle1" gutterBottom fontWeight={600}>
                      Reason for Change
                    </Typography>
                    <Typography variant="body2">{selectedRequest.reason || 'N/A'}</Typography>
                  </Card>

                  {/* Status and Admin Notes */}
                  <Stack spacing={2}>
                    <Chip
                      label={selectedRequest.status.replace('_', ' ').toUpperCase()}
                      color={getStatusColor(selectedRequest.status)}
                      size="medium"
                    />
                    {selectedRequest.rejectionReason && (
                      <Alert severity="error">
                        <Typography variant="subtitle2" gutterBottom>Rejection Reason:</Typography>
                        <Typography variant="body2">{selectedRequest.rejectionReason}</Typography>
                      </Alert>
                    )}
                    {selectedRequest.adminNotes && (
                      <Box>
                        <Typography variant="subtitle2" gutterBottom>Admin Notes:</Typography>
                        <Typography variant="body2">{selectedRequest.adminNotes}</Typography>
                      </Box>
                    )}
                  </Stack>
                </Stack>
              </DialogContent>
              <DialogActions>
                <Button onClick={() => {
                  setDetailDialogOpen(false);
                  setSelectedRequest(null);
                  setAdminNotes('');
                  setRejectionReason('');
                }}>
                  Close
                </Button>
                {selectedRequest.status !== 'approved' && selectedRequest.status !== 'completed' && selectedRequest.status !== 'rejected' && (
                  <>
                    <Button
                      variant="contained"
                      color="success"
                      startIcon={<IconCheck size={18} />}
                      onClick={() => setApproveDialogOpen(true)}
                      disabled={selectedRequest.paymentStatus === 'pending' && selectedRequest.upgradePaymentRequired > 0}
                    >
                      Approve
                    </Button>
                    <Button
                      variant="contained"
                      color="error"
                      startIcon={<IconX size={18} />}
                      onClick={() => setRejectDialogOpen(true)}
                    >
                      Reject
                    </Button>
                  </>
                )}
              </DialogActions>
            </>
          )}
        </Dialog>

        {/* Approve Dialog */}
        <Dialog open={approveDialogOpen} onClose={() => setApproveDialogOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Approve Room Change Request</DialogTitle>
          <DialogContent>
            <Stack spacing={2} sx={{ mt: 1 }}>
              <Alert severity="info">
                Approving this request will:
                <ul>
                  <li>Move the student from {selectedRequest?.currentRoom?.roomNumber} to {selectedRequest?.requestedRoom?.roomNumber}</li>
                  <li>Update room occupancy counts</li>
                  {selectedRequest?.downgradeWalletCredit > 0 && (
                    <li>Credit ₹{formatPrice(selectedRequest.downgradeWalletCredit)} to student's wallet</li>
                  )}
                </ul>
              </Alert>
              {selectedRequest?.paymentStatus === 'pending' && selectedRequest?.upgradePaymentRequired > 0 && (
                <Alert severity="error">
                  Payment of {formatPrice(selectedRequest.upgradePaymentRequired)} must be completed before approval.
                </Alert>
              )}
              <TextField
                label="Admin Notes (Optional)"
                multiline
                rows={3}
                fullWidth
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                placeholder="Add any notes about this approval..."
              />
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setApproveDialogOpen(false)}>Cancel</Button>
            <Button
              variant="contained"
              color="success"
              onClick={handleApprove}
              disabled={processing || (selectedRequest?.paymentStatus === 'pending' && selectedRequest?.upgradePaymentRequired > 0)}
              startIcon={processing ? <CircularProgress size={20} /> : <IconCheck size={18} />}
            >
              {processing ? 'Approving...' : 'Approve Request'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Reject Dialog */}
        <Dialog open={rejectDialogOpen} onClose={() => setRejectDialogOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Reject Room Change Request</DialogTitle>
          <DialogContent>
            <Stack spacing={2} sx={{ mt: 1 }}>
              <Alert severity="warning">
                Please provide a clear reason for rejection. This will be shown to the student.
              </Alert>
              <TextField
                label="Rejection Reason *"
                multiline
                rows={3}
                fullWidth
                required
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Enter the reason for rejecting this request..."
                error={!rejectionReason.trim()}
              />
              <TextField
                label="Admin Notes (Optional)"
                multiline
                rows={3}
                fullWidth
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                placeholder="Add any internal notes..."
              />
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setRejectDialogOpen(false)}>Cancel</Button>
            <Button
              variant="contained"
              color="error"
              onClick={handleReject}
              disabled={processing || !rejectionReason.trim()}
              startIcon={processing ? <CircularProgress size={20} /> : <IconX size={18} />}
            >
              {processing ? 'Rejecting...' : 'Reject Request'}
            </Button>
          </DialogActions>
        </Dialog>
      </Stack>
    </ComponentsWrapper>
  );
}

