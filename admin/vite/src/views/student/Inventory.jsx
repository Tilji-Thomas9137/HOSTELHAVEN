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
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import IconButton from '@mui/material/IconButton';

// @project
import ComponentsWrapper from '@/components/ComponentsWrapper';
import PresentationCard from '@/components/cards/PresentationCard';
import TabPanel from '@/components/TabPanel';
import studentService from '@/services/studentService';
import { useSnackbar } from 'notistack';

// @icons
import { IconPackage, IconHistory, IconPlus, IconX } from '@tabler/icons-react';

/***************************  INVENTORY REQUEST PAGE  ***************************/

export default function InventoryPage() {
  const { enqueueSnackbar } = useSnackbar();
  const [value, setValue] = useState(0);
  const [loading, setLoading] = useState(true);
  const [eligibleItems, setEligibleItems] = useState([]);
  const [requests, setRequests] = useState([]);
  const [requestDialogOpen, setRequestDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [requestForm, setRequestForm] = useState({
    quantity: 1,
    requestReason: ''
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchEligibleItems();
    fetchRequests();
  }, []);

  const fetchEligibleItems = async () => {
    try {
      setLoading(true);
      const data = await studentService.getEligibleInventoryItems();
      setEligibleItems(data || []);
    } catch (err) {
      console.error('Failed to fetch eligible items:', err);
      enqueueSnackbar(err.response?.data?.message || 'Failed to load inventory items', { variant: 'error' });
      setEligibleItems([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchRequests = async () => {
    try {
      const data = await studentService.getInventoryRequests();
      setRequests(data || []);
    } catch (err) {
      console.error('Failed to fetch requests:', err);
      enqueueSnackbar(err.response?.data?.message || 'Failed to load requests', { variant: 'error' });
      setRequests([]);
    }
  };

  const handleChange = (event, newValue) => {
    setValue(newValue);
  };

  const handleOpenRequestDialog = (item) => {
    setSelectedItem(item);
    setRequestForm({ quantity: 1, requestReason: '' });
    setRequestDialogOpen(true);
  };

  const handleCloseRequestDialog = () => {
    setRequestDialogOpen(false);
    setSelectedItem(null);
    setRequestForm({ quantity: 1, requestReason: '' });
  };

  const handleSubmitRequest = async () => {
    if (!selectedItem) return;

    const quantity = parseInt(requestForm.quantity);
    if (isNaN(quantity) || quantity < 1) {
      enqueueSnackbar('Quantity must be at least 1', { variant: 'warning' });
      return;
    }

    if (quantity > selectedItem.quantity) {
      enqueueSnackbar(`Only ${selectedItem.quantity} ${selectedItem.unit}(s) available`, { variant: 'warning' });
      return;
    }

    try {
      setSubmitting(true);
      await studentService.requestInventoryItem({
        inventoryItemId: selectedItem._id,
        quantity,
        requestReason: requestForm.requestReason.trim() || undefined
      });
      enqueueSnackbar('Inventory request submitted successfully', { variant: 'success' });
      handleCloseRequestDialog();
      fetchRequests();
      fetchEligibleItems(); // Refresh available quantities
      setValue(1); // Switch to requests tab
    } catch (err) {
      enqueueSnackbar(err.response?.data?.message || 'Failed to submit request', { variant: 'error' });
    } finally {
      setSubmitting(false);
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

  return (
    <ComponentsWrapper title="Inventory Requests">
      <Box sx={{ width: '100%' }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
          <Tabs value={value} onChange={handleChange}>
            <Tab label="Request Items" icon={<IconPackage size={18} />} iconPosition="start" />
            <Tab label="My Requests" icon={<IconHistory size={18} />} iconPosition="start" />
          </Tabs>
        </Box>

        {/* Request Items Tab */}
        <TabPanel value={value} index={0}>
          <PresentationCard>
            <Alert severity="info" sx={{ mb: 3 }}>
              You can request the following items: Chair, Table, Lamp, Bucket, Mug, Plate, Cup, Bed, Broom, Dustbin, and Dustpan.
              Requests will be reviewed by staff before approval.
            </Alert>

            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                <CircularProgress />
              </Box>
            ) : eligibleItems.length === 0 ? (
              <Alert severity="info">No items available for request at this time.</Alert>
            ) : (
              <Grid container spacing={2}>
                {eligibleItems.map((item) => (
                  <Grid size={{ xs: 12, sm: 6, md: 4 }} key={item._id}>
                    <Card variant="outlined" sx={{ height: '100%', '&:hover': { boxShadow: 3 } }}>
                      <CardContent>
                        <Stack spacing={2}>
                          <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                            <Typography variant="h6">{item.name}</Typography>
                            <Chip
                              label={item.itemType === 'permanent' ? 'Permanent' : 'Temporary'}
                              size="small"
                              color={item.itemType === 'permanent' ? 'primary' : 'default'}
                            />
                          </Stack>
                          <Typography variant="body2" color="text.secondary">
                            Category: {item.category}
                          </Typography>
                          <Stack direction="row" spacing={2}>
                            <Typography variant="body2">
                              <strong>Available:</strong> {item.quantity} {item.unit}(s)
                            </Typography>
                          </Stack>
                          <Typography variant="body2" color="text.secondary">
                            Location: {item.location || 'General Store'}
                          </Typography>
                          <Button
                            variant="contained"
                            fullWidth
                            startIcon={<IconPlus size={18} />}
                            onClick={() => handleOpenRequestDialog(item)}
                            disabled={item.quantity === 0 || item.status !== 'available'}
                          >
                            Request Item
                          </Button>
                        </Stack>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            )}
          </PresentationCard>
        </TabPanel>

        {/* My Requests Tab */}
        <TabPanel value={value} index={1}>
          <PresentationCard>
            {requests.length === 0 ? (
              <Alert severity="info">No inventory requests found.</Alert>
            ) : (
              <TableContainer component={Paper} variant="outlined">
                <Table>
                  <TableHead>
                    <TableRow sx={{ bgcolor: 'grey.50' }}>
                      <TableCell><strong>Item</strong></TableCell>
                      <TableCell><strong>Quantity</strong></TableCell>
                      <TableCell><strong>Type</strong></TableCell>
                      <TableCell><strong>Status</strong></TableCell>
                      <TableCell><strong>Requested</strong></TableCell>
                      <TableCell><strong>Details</strong></TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {requests.map((request) => (
                      <TableRow key={request._id} hover>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontWeight: 500 }}>
                            {request.itemName}
                          </Typography>
                        </TableCell>
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
                          {new Date(request.createdAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          {request.status === 'rejected' && request.rejectionReason && (
                            <Typography variant="caption" color="error">
                              Reason: {request.rejectionReason}
                            </Typography>
                          )}
                          {request.status === 'issued' && request.issuedAt && (
                            <Typography variant="caption" color="success.main">
                              Issued: {new Date(request.issuedAt).toLocaleDateString()}
                            </Typography>
                          )}
                          {request.status === 'returned' && request.returnedAt && (
                            <Typography variant="caption" color="text.secondary">
                              Returned: {new Date(request.returnedAt).toLocaleDateString()}
                            </Typography>
                          )}
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

      {/* Request Dialog */}
      <Dialog open={requestDialogOpen} onClose={handleCloseRequestDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Typography variant="h6">Request Inventory Item</Typography>
            <IconButton onClick={handleCloseRequestDialog} size="small">
              <IconX size={20} />
            </IconButton>
          </Stack>
        </DialogTitle>
        <DialogContent>
          {selectedItem && (
            <Stack spacing={3} sx={{ mt: 1 }}>
              <Alert severity="info">
                <Typography variant="body2">
                  <strong>Item:</strong> {selectedItem.name}
                </Typography>
                <Typography variant="body2">
                  <strong>Available:</strong> {selectedItem.quantity} {selectedItem.unit}(s)
                </Typography>
                <Typography variant="body2">
                  <strong>Type:</strong> {selectedItem.itemType === 'permanent' ? 'Permanent (Cannot be returned)' : 'Temporary (Can be returned)'}
                </Typography>
              </Alert>

              <FormControl fullWidth>
                <InputLabel>Quantity *</InputLabel>
                <Select
                  value={requestForm.quantity}
                  label="Quantity *"
                  onChange={(e) => setRequestForm({ ...requestForm, quantity: parseInt(e.target.value) })}
                >
                  {Array.from({ length: Math.min(selectedItem.quantity, 10) }, (_, i) => i + 1).map((num) => (
                    <MenuItem key={num} value={num}>{num}</MenuItem>
                  ))}
                </Select>
              </FormControl>

              <TextField
                fullWidth
                multiline
                rows={3}
                label="Reason (Optional)"
                placeholder="Please provide a reason for requesting this item..."
                value={requestForm.requestReason}
                onChange={(e) => setRequestForm({ ...requestForm, requestReason: e.target.value })}
              />
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseRequestDialog}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleSubmitRequest}
            disabled={submitting}
            startIcon={submitting ? <CircularProgress size={16} /> : <IconPlus size={18} />}
          >
            {submitting ? 'Submitting...' : 'Submit Request'}
          </Button>
        </DialogActions>
      </Dialog>
    </ComponentsWrapper>
  );
}
