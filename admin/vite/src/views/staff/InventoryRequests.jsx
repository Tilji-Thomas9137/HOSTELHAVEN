import { useState, useEffect } from 'react';

// @mui
import Box from '@mui/material/Box';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
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
import TextField from '@mui/material/TextField';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';

// @project
import ComponentsWrapper from '@/components/ComponentsWrapper';
import PresentationCard from '@/components/cards/PresentationCard';
import TabPanel from '@/components/TabPanel';
import staffService from '@/services/staffService';
import { useSnackbar } from 'notistack';

// @icons
import { IconCheck, IconX, IconPackage, IconHistory, IconArrowLeft } from '@tabler/icons-react';

/***************************  INVENTORY REQUESTS MANAGEMENT PAGE  ***************************/

export default function InventoryRequestsPage() {
  const { enqueueSnackbar } = useSnackbar();
  const [value, setValue] = useState(0);
  const [loading, setLoading] = useState(true);
  const [requests, setRequests] = useState([]);
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [actionDialogOpen, setActionDialogOpen] = useState(false);
  const [actionType, setActionType] = useState(null); // 'approve', 'reject', 'issue', 'return'
  const [rejectionReason, setRejectionReason] = useState('');
  const [returnNotes, setReturnNotes] = useState('');
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
      const data = await staffService.getInventoryRequests(params);
      setRequests(data || []);
    } catch (err) {
      console.error('Failed to fetch inventory requests:', err);
      enqueueSnackbar(err.response?.data?.message || 'Failed to load inventory requests', { variant: 'error' });
      setRequests([]);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (event, newValue) => {
    setValue(newValue);
  };

  const handleOpenActionDialog = (request, type) => {
    setSelectedRequest(request);
    setActionType(type);
    setRejectionReason('');
    setReturnNotes('');
    setActionDialogOpen(true);
  };

  const handleCloseActionDialog = () => {
    setActionDialogOpen(false);
    setSelectedRequest(null);
    setActionType(null);
    setRejectionReason('');
    setReturnNotes('');
  };

  const handleApprove = async () => {
    if (!selectedRequest) return;

    try {
      setProcessing(true);
      await staffService.approveInventoryRequest(selectedRequest._id);
      enqueueSnackbar('Request approved successfully', { variant: 'success' });
      handleCloseActionDialog();
      fetchRequests();
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
      await staffService.rejectInventoryRequest(selectedRequest._id, rejectionReason);
      enqueueSnackbar('Request rejected successfully', { variant: 'success' });
      handleCloseActionDialog();
      fetchRequests();
    } catch (err) {
      enqueueSnackbar(err.response?.data?.message || 'Failed to reject request', { variant: 'error' });
    } finally {
      setProcessing(false);
    }
  };

  const handleIssue = async () => {
    if (!selectedRequest) return;

    try {
      setProcessing(true);
      await staffService.issueInventoryItem(selectedRequest._id);
      enqueueSnackbar('Item issued successfully', { variant: 'success' });
      handleCloseActionDialog();
      fetchRequests();
    } catch (err) {
      enqueueSnackbar(err.response?.data?.message || 'Failed to issue item', { variant: 'error' });
    } finally {
      setProcessing(false);
    }
  };

  const handleReturn = async () => {
    if (!selectedRequest) return;

    try {
      setProcessing(true);
      await staffService.returnInventoryItem(selectedRequest._id, returnNotes);
      enqueueSnackbar('Item return confirmed successfully', { variant: 'success' });
      handleCloseActionDialog();
      fetchRequests();
    } catch (err) {
      enqueueSnackbar(err.response?.data?.message || 'Failed to confirm return', { variant: 'error' });
    } finally {
      setProcessing(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return 'warning';
      case 'approved':
        return 'info';
      case 'issued':
        return 'success';
      case 'rejected':
        return 'error';
      case 'returned':
        return 'default';
      default:
        return 'default';
    }
  };

  const formatStatus = (status) => {
    const statusMap = {
      'pending': 'Pending',
      'approved': 'Approved',
      'issued': 'Issued',
      'rejected': 'Rejected',
      'returned': 'Returned',
      'cancelled': 'Cancelled'
    };
    return statusMap[status] || status;
  };

  const pendingRequests = requests.filter(r => r.status === 'pending');
  const approvedRequests = requests.filter(r => r.status === 'approved');
  const issuedRequests = requests.filter(r => r.status === 'issued');
  const allRequests = requests;

  return (
    <ComponentsWrapper title="Inventory Requests">
      <Box sx={{ width: '100%' }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
          <Tabs value={value} onChange={handleChange}>
            <Tab label={`Pending (${pendingRequests.length})`} icon={<IconPackage size={18} />} iconPosition="start" />
            <Tab label={`Approved (${approvedRequests.length})`} icon={<IconCheck size={18} />} iconPosition="start" />
            <Tab label={`Issued (${issuedRequests.length})`} icon={<IconHistory size={18} />} iconPosition="start" />
            <Tab label="All Requests" icon={<IconHistory size={18} />} iconPosition="start" />
          </Tabs>
        </Box>

        {/* Pending Requests Tab */}
        <TabPanel value={value} index={0}>
          <PresentationCard>
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                <CircularProgress />
              </Box>
            ) : pendingRequests.length === 0 ? (
              <Alert severity="info">No pending requests.</Alert>
            ) : (
              <Stack spacing={2}>
                {pendingRequests.map((request) => (
                  <Card key={request._id} variant="outlined" sx={{ '&:hover': { boxShadow: 2 } }}>
                    <CardContent>
                      <Stack spacing={2}>
                        <Stack direction="row" justifyContent="space-between" alignItems="flex-start" flexWrap="wrap" gap={1}>
                          <Stack spacing={1} flex={1}>
                            <Typography variant="h6">{request.itemName}</Typography>
                            <Stack direction="row" spacing={2} flexWrap="wrap">
                              <Typography variant="body2" color="text.secondary">
                                <strong>Student:</strong> {request.studentIdentity?.name || request.student?.name || 'N/A'} 
                                ({request.studentIdentity?.studentId || request.student?.studentId || 'N/A'})
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                <strong>Room:</strong> {request.studentIdentity?.roomNumber || request.student?.room?.roomNumber || 'N/A'}
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                <strong>Quantity:</strong> {request.quantity} {request.inventoryItem?.unit || 'piece'}(s)
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                <strong>Type:</strong> {request.itemType === 'permanent' ? 'Permanent' : 'Temporary'}
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                <strong>Available:</strong> {request.inventoryItem?.quantity || 0} {request.inventoryItem?.unit || 'piece'}(s)
                              </Typography>
                            </Stack>
                            {request.requestReason && (
                              <Typography variant="body2" color="text.secondary">
                                <strong>Reason:</strong> {request.requestReason}
                              </Typography>
                            )}
                          </Stack>
                          <Chip
                            label={formatStatus(request.status)}
                            size="small"
                            color={getStatusColor(request.status)}
                          />
                        </Stack>
                        <Divider />
                        <Stack direction="row" spacing={1} justifyContent="flex-end">
                          <Button
                            variant="outlined"
                            color="error"
                            size="small"
                            startIcon={<IconX size={18} />}
                            onClick={() => handleOpenActionDialog(request, 'reject')}
                          >
                            Reject
                          </Button>
                          <Button
                            variant="contained"
                            color="success"
                            size="small"
                            startIcon={<IconCheck size={18} />}
                            onClick={() => handleOpenActionDialog(request, 'approve')}
                            disabled={request.inventoryItem?.quantity < request.quantity}
                          >
                            Approve
                          </Button>
                        </Stack>
                      </Stack>
                    </CardContent>
                  </Card>
                ))}
              </Stack>
            )}
          </PresentationCard>
        </TabPanel>

        {/* Approved Requests Tab */}
        <TabPanel value={value} index={1}>
          <PresentationCard>
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                <CircularProgress />
              </Box>
            ) : approvedRequests.length === 0 ? (
              <Alert severity="info">No approved requests pending issue.</Alert>
            ) : (
              <Stack spacing={2}>
                {approvedRequests.map((request) => (
                  <Card key={request._id} variant="outlined" sx={{ '&:hover': { boxShadow: 2 } }}>
                    <CardContent>
                      <Stack spacing={2}>
                        <Stack direction="row" justifyContent="space-between" alignItems="flex-start" flexWrap="wrap" gap={1}>
                          <Stack spacing={1} flex={1}>
                            <Typography variant="h6">{request.itemName}</Typography>
                            <Stack direction="row" spacing={2} flexWrap="wrap">
                              <Typography variant="body2" color="text.secondary">
                                <strong>Student:</strong> {request.studentIdentity?.name || request.student?.name || 'N/A'}
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                <strong>Room:</strong> {request.studentIdentity?.roomNumber || request.student?.room?.roomNumber || 'N/A'}
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                <strong>Quantity:</strong> {request.quantity} {request.inventoryItem?.unit || 'piece'}(s)
                              </Typography>
                            </Stack>
                            {request.reviewedBy && (
                              <Typography variant="caption" color="text.secondary">
                                Approved by: {request.reviewedBy?.name || 'N/A'} on {request.reviewedAt ? new Date(request.reviewedAt).toLocaleDateString() : 'N/A'}
                              </Typography>
                            )}
                          </Stack>
                          <Chip
                            label={formatStatus(request.status)}
                            size="small"
                            color={getStatusColor(request.status)}
                          />
                        </Stack>
                        <Divider />
                        <Stack direction="row" spacing={1} justifyContent="flex-end">
                          <Button
                            variant="contained"
                            color="primary"
                            size="small"
                            startIcon={<IconPackage size={18} />}
                            onClick={() => handleOpenActionDialog(request, 'issue')}
                          >
                            Issue Item
                          </Button>
                        </Stack>
                      </Stack>
                    </CardContent>
                  </Card>
                ))}
              </Stack>
            )}
          </PresentationCard>
        </TabPanel>

        {/* Issued Requests Tab */}
        <TabPanel value={value} index={2}>
          <PresentationCard>
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                <CircularProgress />
              </Box>
            ) : issuedRequests.length === 0 ? (
              <Alert severity="info">No issued items.</Alert>
            ) : (
              <Stack spacing={2}>
                {issuedRequests.map((request) => (
                  <Card key={request._id} variant="outlined" sx={{ '&:hover': { boxShadow: 2 } }}>
                    <CardContent>
                      <Stack spacing={2}>
                        <Stack direction="row" justifyContent="space-between" alignItems="flex-start" flexWrap="wrap" gap={1}>
                          <Stack spacing={1} flex={1}>
                            <Typography variant="h6">{request.itemName}</Typography>
                            <Stack direction="row" spacing={2} flexWrap="wrap">
                              <Typography variant="body2" color="text.secondary">
                                <strong>Student:</strong> {request.studentIdentity?.name || request.student?.name || 'N/A'}
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                <strong>Room:</strong> {request.studentIdentity?.roomNumber || request.student?.room?.roomNumber || 'N/A'}
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                <strong>Quantity:</strong> {request.quantity} {request.inventoryItem?.unit || 'piece'}(s)
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                <strong>Type:</strong> {request.itemType === 'permanent' ? 'Permanent' : 'Temporary'}
                              </Typography>
                            </Stack>
                            {request.issuedBy && (
                              <Typography variant="caption" color="text.secondary">
                                Issued by: {request.issuedBy?.name || 'N/A'} on {request.issuedAt ? new Date(request.issuedAt).toLocaleDateString() : 'N/A'}
                              </Typography>
                            )}
                            {request.inventoryItem?.location && (
                              <Typography variant="caption" color="text.secondary">
                                Location: {request.inventoryItem.location}
                              </Typography>
                            )}
                          </Stack>
                          <Chip
                            label={formatStatus(request.status)}
                            size="small"
                            color={getStatusColor(request.status)}
                          />
                        </Stack>
                        {request.itemType === 'temporary' && (
                          <>
                            <Divider />
                            <Stack direction="row" spacing={1} justifyContent="flex-end">
                              <Button
                                variant="outlined"
                                color="primary"
                                size="small"
                                startIcon={<IconArrowLeft size={18} />}
                                onClick={() => handleOpenActionDialog(request, 'return')}
                              >
                                Confirm Return
                              </Button>
                            </Stack>
                          </>
                        )}
                      </Stack>
                    </CardContent>
                  </Card>
                ))}
              </Stack>
            )}
          </PresentationCard>
        </TabPanel>

        {/* All Requests Tab */}
        <TabPanel value={value} index={3}>
          <PresentationCard>
            <Stack spacing={2} sx={{ mb: 2 }}>
              <FormControl sx={{ minWidth: 200 }}>
                <InputLabel>Filter by Status</InputLabel>
                <Select
                  value={statusFilter}
                  label="Filter by Status"
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <MenuItem value="all">All Status</MenuItem>
                  <MenuItem value="pending">Pending</MenuItem>
                  <MenuItem value="approved">Approved</MenuItem>
                  <MenuItem value="issued">Issued</MenuItem>
                  <MenuItem value="rejected">Rejected</MenuItem>
                  <MenuItem value="returned">Returned</MenuItem>
                </Select>
              </FormControl>
            </Stack>

            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                <CircularProgress />
              </Box>
            ) : requests.length === 0 ? (
              <Alert severity="info">No requests found.</Alert>
            ) : (
              <TableContainer component={Paper} variant="outlined">
                <Table>
                  <TableHead>
                    <TableRow sx={{ bgcolor: 'grey.50' }}>
                      <TableCell><strong>Date</strong></TableCell>
                      <TableCell><strong>Student</strong></TableCell>
                      <TableCell><strong>Item</strong></TableCell>
                      <TableCell><strong>Quantity</strong></TableCell>
                      <TableCell><strong>Type</strong></TableCell>
                      <TableCell><strong>Status</strong></TableCell>
                      <TableCell><strong>Actions</strong></TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {requests.map((request) => (
                      <TableRow key={request._id} hover>
                        <TableCell>{new Date(request.createdAt).toLocaleDateString()}</TableCell>
                        <TableCell>
                          <Stack spacing={0.5}>
                            <Typography variant="body2">
                              {request.studentIdentity?.name || request.student?.name || 'N/A'}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {request.studentIdentity?.roomNumber || request.student?.room?.roomNumber || 'N/A'}
                            </Typography>
                          </Stack>
                        </TableCell>
                        <TableCell>{request.itemName}</TableCell>
                        <TableCell>{request.quantity} {request.inventoryItem?.unit || 'piece'}(s)</TableCell>
                        <TableCell>
                          <Chip
                            label={request.itemType === 'permanent' ? 'Permanent' : 'Temporary'}
                            size="small"
                            color={request.itemType === 'permanent' ? 'primary' : 'default'}
                          />
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={formatStatus(request.status)}
                            size="small"
                            color={getStatusColor(request.status)}
                          />
                        </TableCell>
                        <TableCell>
                          <Stack direction="row" spacing={1}>
                            {request.status === 'pending' && (
                              <>
                                <Button
                                  size="small"
                                  variant="outlined"
                                  color="error"
                                  onClick={() => handleOpenActionDialog(request, 'reject')}
                                >
                                  Reject
                                </Button>
                                <Button
                                  size="small"
                                  variant="contained"
                                  color="success"
                                  onClick={() => handleOpenActionDialog(request, 'approve')}
                                  disabled={request.inventoryItem?.quantity < request.quantity}
                                >
                                  Approve
                                </Button>
                              </>
                            )}
                            {request.status === 'approved' && (
                              <Button
                                size="small"
                                variant="contained"
                                onClick={() => handleOpenActionDialog(request, 'issue')}
                              >
                                Issue
                              </Button>
                            )}
                            {request.status === 'issued' && request.itemType === 'temporary' && (
                              <Button
                                size="small"
                                variant="outlined"
                                onClick={() => handleOpenActionDialog(request, 'return')}
                              >
                                Return
                              </Button>
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
        </TabPanel>
      </Box>

      {/* Action Dialog */}
      <Dialog open={actionDialogOpen} onClose={handleCloseActionDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Typography variant="h6">
              {actionType === 'approve' && 'Approve Request'}
              {actionType === 'reject' && 'Reject Request'}
              {actionType === 'issue' && 'Issue Item'}
              {actionType === 'return' && 'Confirm Return'}
            </Typography>
            <IconButton onClick={handleCloseActionDialog} size="small">
              <IconX size={20} />
            </IconButton>
          </Stack>
        </DialogTitle>
        <DialogContent>
          {selectedRequest && (
            <Stack spacing={3} sx={{ mt: 1 }}>
              <Alert severity="info">
                <Typography variant="body2">
                  <strong>Item:</strong> {selectedRequest.itemName}
                </Typography>
                <Typography variant="body2">
                  <strong>Student:</strong> {selectedRequest.studentIdentity?.name || selectedRequest.student?.name || 'N/A'}
                </Typography>
                <Typography variant="body2">
                  <strong>Quantity:</strong> {selectedRequest.quantity} {selectedRequest.inventoryItem?.unit || 'piece'}(s)
                </Typography>
                {actionType === 'return' && (
                  <Typography variant="body2">
                    <strong>Type:</strong> {selectedRequest.itemType === 'permanent' ? 'Permanent (Cannot be returned)' : 'Temporary (Can be returned)'}
                  </Typography>
                )}
              </Alert>

              {actionType === 'reject' && (
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  label="Rejection Reason *"
                  placeholder="Please provide a reason for rejecting this request..."
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  required
                />
              )}

              {actionType === 'return' && (
                <>
                  {selectedRequest.itemType === 'permanent' ? (
                    <Alert severity="error">
                      Permanent items (like beds) cannot be returned.
                    </Alert>
                  ) : (
                    <TextField
                      fullWidth
                      multiline
                      rows={3}
                      label="Return Notes (Optional)"
                      placeholder="Add any notes about the return condition..."
                      value={returnNotes}
                      onChange={(e) => setReturnNotes(e.target.value)}
                    />
                  )}
                </>
              )}

              {(actionType === 'approve' || actionType === 'issue') && (
                <Alert severity="success">
                  {actionType === 'approve' 
                    ? 'This will approve the request. The student will be notified and can collect the item.'
                    : 'This will issue the item to the student. Inventory will be updated automatically.'}
                </Alert>
              )}
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseActionDialog}>Cancel</Button>
          {actionType === 'approve' && (
            <Button
              variant="contained"
              color="success"
              onClick={handleApprove}
              disabled={processing}
              startIcon={processing ? <CircularProgress size={16} /> : <IconCheck size={18} />}
            >
              {processing ? 'Approving...' : 'Approve'}
            </Button>
          )}
          {actionType === 'reject' && (
            <Button
              variant="contained"
              color="error"
              onClick={handleReject}
              disabled={processing || !rejectionReason.trim()}
              startIcon={processing ? <CircularProgress size={16} /> : <IconX size={18} />}
            >
              {processing ? 'Rejecting...' : 'Reject'}
            </Button>
          )}
          {actionType === 'issue' && (
            <Button
              variant="contained"
              color="primary"
              onClick={handleIssue}
              disabled={processing}
              startIcon={processing ? <CircularProgress size={16} /> : <IconPackage size={18} />}
            >
              {processing ? 'Issuing...' : 'Issue Item'}
            </Button>
          )}
          {actionType === 'return' && selectedRequest?.itemType === 'temporary' && (
            <Button
              variant="contained"
              color="primary"
              onClick={handleReturn}
              disabled={processing}
              startIcon={processing ? <CircularProgress size={16} /> : <IconArrowLeft size={18} />}
            >
              {processing ? 'Processing...' : 'Confirm Return'}
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </ComponentsWrapper>
  );
}
