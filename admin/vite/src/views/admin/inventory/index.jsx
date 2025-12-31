// @mui
import { useState, useEffect } from 'react';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';
import Chip from '@mui/material/Chip';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Select from '@mui/material/Select';

// @project
import ComponentsWrapper from '@/components/ComponentsWrapper';
import PresentationCard from '@/components/cards/PresentationCard';
import TabPanel from '@/components/TabPanel';
import adminService from '@/services/adminService';
import { useSnackbar } from 'notistack';

/***************************  INVENTORY PAGE  ***************************/

export default function InventoryPage() {
  const { enqueueSnackbar } = useSnackbar();
  const [tab, setTab] = useState(0);
  const [loading, setLoading] = useState(false);
  const [stockRequests, setStockRequests] = useState([]);
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [actionDialogOpen, setActionDialogOpen] = useState(false);
  const [actionType, setActionType] = useState(null);
  const [reviewNotes, setReviewNotes] = useState('');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchStockRequests();
  }, [statusFilter]);

  const fetchStockRequests = async () => {
    try {
      setLoading(true);
      const params = {};
      if (statusFilter !== 'all') params.status = statusFilter;
      const data = await adminService.getAllStockRequests(params);
      setStockRequests(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to fetch stock requests:', err);
      enqueueSnackbar(err.response?.data?.message || 'Failed to load stock requests', { variant: 'error' });
      setStockRequests([]);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAction = (request, type) => {
    setSelectedRequest(request);
    setActionType(type);
    setReviewNotes('');
    setActionDialogOpen(true);
  };

  const handleCloseAction = () => {
    setActionDialogOpen(false);
    setSelectedRequest(null);
    setActionType(null);
    setReviewNotes('');
  };

  const handleUpdateStatus = async () => {
    if (!selectedRequest) return;

    try {
      setProcessing(true);
      const statusMap = {
        approve: 'approved',
        reject: 'rejected',
        fulfill: 'fulfilled'
      };
      
      await adminService.updateStockRequestStatus(selectedRequest._id, {
        status: statusMap[actionType],
        reviewNotes: reviewNotes.trim() || undefined
      });

      enqueueSnackbar(`Stock request ${actionType === 'approve' ? 'approved' : actionType === 'reject' ? 'rejected' : 'fulfilled'} successfully`, { variant: 'success' });
      handleCloseAction();
      fetchStockRequests();
    } catch (err) {
      enqueueSnackbar(err.response?.data?.message || 'Failed to update stock request', { variant: 'error' });
    } finally {
      setProcessing(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'approved':
        return 'success';
      case 'rejected':
        return 'error';
      case 'fulfilled':
        return 'info';
      case 'pending':
        return 'warning';
      default:
        return 'default';
    }
  };

  const filteredRequests = stockRequests.filter(request => {
    if (statusFilter === 'all') return true;
    return request.status === statusFilter;
  });

  return (
    <ComponentsWrapper title="Inventory Management">
      <PresentationCard>
        <Stack spacing={3}>
          <Tabs value={tab} onChange={(_e, value) => setTab(value)}>
            <Tab label="Stock Requests" />
            <Tab label="Update Stock" />
          </Tabs>

          {/* Stock Requests Tab */}
          <TabPanel value={tab} index={0}>
            <Stack spacing={3}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="h6">Stock Requests from Staff</Typography>
                <FormControl size="small" sx={{ minWidth: 150 }}>
                  <InputLabel>Filter by Status</InputLabel>
                  <Select
                    value={statusFilter}
                    label="Filter by Status"
                    onChange={(e) => setStatusFilter(e.target.value)}
                  >
                    <MenuItem value="all">All</MenuItem>
                    <MenuItem value="pending">Pending</MenuItem>
                    <MenuItem value="approved">Approved</MenuItem>
                    <MenuItem value="rejected">Rejected</MenuItem>
                    <MenuItem value="fulfilled">Fulfilled</MenuItem>
                  </Select>
                </FormControl>
              </Box>

              {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                  <CircularProgress />
                </Box>
              ) : filteredRequests.length === 0 ? (
                <Alert severity="info">No stock requests found.</Alert>
              ) : (
                <TableContainer component={Paper} variant="outlined">
                  <Table>
                    <TableHead>
                      <TableRow sx={{ bgcolor: 'grey.50' }}>
                        <TableCell><strong>Date</strong></TableCell>
                        <TableCell><strong>Requested By</strong></TableCell>
                        <TableCell><strong>Item Name</strong></TableCell>
                        <TableCell><strong>Category</strong></TableCell>
                        <TableCell><strong>Quantity</strong></TableCell>
                        <TableCell><strong>Reason</strong></TableCell>
                        <TableCell><strong>Status</strong></TableCell>
                        <TableCell><strong>Actions</strong></TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {filteredRequests.map((request) => (
                        <TableRow key={request._id} hover>
                          <TableCell>
                            {new Date(request.createdAt).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            <Stack>
                              <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                {request.requestedBy?.name || 'Unknown Staff'}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {request.requestedBy?.staffId || 'N/A'}
                              </Typography>
                            </Stack>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">{request.itemName}</Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">{request.category || 'other'}</Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">
                              {request.quantity} {request.unit || 'piece'}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" sx={{ maxWidth: 200 }}>
                              {request.reason}
                            </Typography>
                            {request.reviewNotes && (
                              <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5 }}>
                                <strong>Note:</strong> {request.reviewNotes}
                              </Typography>
                            )}
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={request.status}
                              size="small"
                              color={getStatusColor(request.status)}
                            />
                          </TableCell>
                          <TableCell>
                            {request.status === 'pending' && (
                              <Stack direction="row" spacing={1}>
                                <Button
                                  size="small"
                                  variant="outlined"
                                  color="success"
                                  onClick={() => handleOpenAction(request, 'approve')}
                                >
                                  Approve
                                </Button>
                                <Button
                                  size="small"
                                  variant="outlined"
                                  color="error"
                                  onClick={() => handleOpenAction(request, 'reject')}
                                >
                                  Reject
                                </Button>
                              </Stack>
                            )}
                            {request.status === 'approved' && (
                              <Button
                                size="small"
                                variant="outlined"
                                color="info"
                                onClick={() => handleOpenAction(request, 'fulfill')}
                              >
                                Mark Fulfilled
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </Stack>
          </TabPanel>

          {/* Update Stock Tab */}
          <TabPanel value={tab} index={1}>
            <Typography variant="body2" color="text.secondary">
              Manage hostel inventory and supplies. Update stock levels, track items, and monitor inventory usage.
            </Typography>
          </TabPanel>
        </Stack>
      </PresentationCard>

      {/* Action Dialog */}
      <Dialog open={actionDialogOpen} onClose={handleCloseAction} maxWidth="sm" fullWidth>
        <DialogTitle>
          {actionType === 'approve' ? 'Approve Stock Request' : 
           actionType === 'reject' ? 'Reject Stock Request' : 
           'Mark as Fulfilled'}
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            {selectedRequest && (
              <>
                <Typography variant="body2">
                  <strong>Item:</strong> {selectedRequest.itemName}
                </Typography>
                <Typography variant="body2">
                  <strong>Quantity:</strong> {selectedRequest.quantity} {selectedRequest.unit || 'piece'}
                </Typography>
                <Typography variant="body2">
                  <strong>Requested by:</strong> {selectedRequest.requestedBy?.name || 'Unknown Staff'}
                </Typography>
                <Typography variant="body2">
                  <strong>Reason:</strong> {selectedRequest.reason}
                </Typography>
              </>
            )}
            <TextField
              fullWidth
              multiline
              rows={3}
              label="Review Notes (Optional)"
              value={reviewNotes}
              onChange={(e) => setReviewNotes(e.target.value)}
              placeholder="Add any notes or comments about this request..."
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseAction}>Cancel</Button>
          <Button
            onClick={handleUpdateStatus}
            variant="contained"
            color={actionType === 'reject' ? 'error' : actionType === 'approve' ? 'success' : 'info'}
            disabled={processing}
          >
            {processing ? 'Processing...' : 
             actionType === 'approve' ? 'Approve' : 
             actionType === 'reject' ? 'Reject' : 
             'Mark Fulfilled'}
          </Button>
        </DialogActions>
      </Dialog>
    </ComponentsWrapper>
  );
}

