import { useState, useEffect } from 'react';

import Stack from '@mui/material/Stack';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import TableContainer from '@mui/material/TableContainer';
import Paper from '@mui/material/Paper';
import Divider from '@mui/material/Divider';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Select from '@mui/material/Select';


import ComponentsWrapper from '@/components/ComponentsWrapper';
import PresentationCard from '@/components/cards/PresentationCard';
import TabPanel from '@/components/TabPanel';
import staffService from '@/services/staffService';
import { useSnackbar } from 'notistack';

export default function StaffInventory() {
  const { enqueueSnackbar } = useSnackbar();
  const [tab, setTab] = useState('request');
  const [loading, setLoading] = useState(false);
  const [stockRequests, setStockRequests] = useState([]);
  const [inventoryItems, setInventoryItems] = useState([]);
  const [loadingInventory, setLoadingInventory] = useState(false);
  const [requestForm, setRequestForm] = useState({
    type: 'stock_request',
    itemName: '',
    category: 'other',
    quantity: '',
    unit: 'piece',
    reason: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (tab === 'requests') {
      fetchStockRequests();
    } else if (tab === 'items') {
      fetchInventoryItems();
    }
  }, [tab]);

  useEffect(() => {
    if (tab === 'items') {
      fetchInventoryItems();
    }
  }, [categoryFilter, statusFilter]);

  const fetchStockRequests = async () => {
    try {
      setLoading(true);
      const data = await staffService.getStockRequests();
      setStockRequests(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to fetch stock requests:', err);
      enqueueSnackbar(err.response?.data?.message || 'Failed to load stock requests', { variant: 'error' });
      setStockRequests([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchInventoryItems = async () => {
    try {
      setLoadingInventory(true);
      const params = {};
      if (categoryFilter !== 'all') params.category = categoryFilter;
      if (statusFilter !== 'all') params.status = statusFilter;
      const data = await staffService.getInventoryItems(params);
      setInventoryItems(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to fetch inventory items:', err);
      enqueueSnackbar(err.response?.data?.message || 'Failed to load inventory items', { variant: 'error' });
      setInventoryItems([]);
    } finally {
      setLoadingInventory(false);
    }
  };

  const getFilteredInventoryItems = () => {
    let filtered = [...inventoryItems];

    // Filter by category (already filtered by API, but keep for consistency)
    if (categoryFilter !== 'all') {
      filtered = filtered.filter(item => item.category === categoryFilter);
    }

    // Filter by status (already filtered by API, but keep for consistency)
    if (statusFilter !== 'all') {
      filtered = filtered.filter(item => item.status === statusFilter);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(item => {
        const name = item.name?.toLowerCase() || '';
        const location = item.location?.toLowerCase() || '';
        const supplier = item.supplier?.toLowerCase() || '';
        const roomNumber = item.room?.roomNumber?.toLowerCase() || '';
        return name.includes(query) || location.includes(query) || supplier.includes(query) || roomNumber.includes(query);
      });
    }

    // Sort by most recently created
    filtered.sort((a, b) => {
      const dateA = new Date(a.createdAt);
      const dateB = new Date(b.createdAt);
      return dateB - dateA;
    });

    return filtered;
  };

  const handleSubmitRequest = async () => {
    if (!requestForm.itemName || !requestForm.quantity || !requestForm.reason.trim()) {
      enqueueSnackbar('Please fill in all required fields', { variant: 'warning' });
      return;
    }

    const quantity = parseInt(requestForm.quantity);
    if (isNaN(quantity) || quantity < 1) {
      enqueueSnackbar('Quantity must be at least 1', { variant: 'warning' });
      return;
    }

    if (quantity > 500) {
      enqueueSnackbar('Quantity cannot exceed 500', { variant: 'warning' });
      return;
    }

    try {
      setSubmitting(true);
      await staffService.createStockRequest({
        type: 'stock_request',
        itemName: requestForm.itemName.trim(),
        category: requestForm.category,
        quantity: quantity,
        unit: requestForm.unit.toLowerCase(),
        priority: 'medium',
        reason: requestForm.reason.trim(),
      });
      enqueueSnackbar(
        'Stock request submitted successfully! Admin will be notified.',
        { variant: 'success' }
      );
      setRequestForm({
        type: 'stock_request',
        itemName: '',
        category: 'other',
        quantity: '',
        unit: 'piece',
        reason: ''
      });
      fetchStockRequests();
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to submit request';
      console.error('Stock request error:', err);
      enqueueSnackbar(errorMessage, { variant: 'error' });
    } finally {
      setSubmitting(false);
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
      case 'available':
        return 'success';
      case 'in_use':
        return 'info';
      case 'maintenance':
        return 'warning';
      case 'damaged':
        return 'error';
      case 'disposed':
        return 'default';
      default:
        return 'default';
    }
  };

  const formatCategory = (category) => {
    if (!category) return 'N/A';
    return category
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const formatStatus = (status) => {
    if (!status) return 'N/A';
    return status
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };


  return (
    <ComponentsWrapper title="Inventory">
      <PresentationCard>
        <Stack spacing={3}>
          <Tabs value={tab} onChange={(_e, value) => setTab(value)}>
            <Tab value="request" label="Request Stock" />
            <Tab value="requests" label={`My Requests (${stockRequests.length})`} />
            <Tab value="items" label="View Inventory" />
          </Tabs>

          {/* Request Stock Tab */}
          <TabPanel value={tab} index="request">
            <Stack spacing={3}>
              <Alert severity="info">
                Use this form to request essential items to be stocked. All requests will be sent to the admin for review.
              </Alert>

              <Grid container spacing={2}>
                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField
                    label="Item Name"
                    placeholder="e.g., Cleaning gloves, Brooms, etc."
                    fullWidth
                    required
                    value={requestForm.itemName}
                    onChange={(e) => setRequestForm({ ...requestForm, itemName: e.target.value })}
                  />
                </Grid>

                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField
                    label="Category"
                    select
                    fullWidth
                    value={requestForm.category}
                    onChange={(e) => setRequestForm({ ...requestForm, category: e.target.value })}
                  >
                    <MenuItem value="cleaning">Cleaning</MenuItem>
                    <MenuItem value="furniture">Furniture</MenuItem>
                    <MenuItem value="electronics">Electronics</MenuItem>
                    <MenuItem value="appliances">Appliances</MenuItem>
                    <MenuItem value="bedding">Bedding</MenuItem>
                    <MenuItem value="utensils">Utensils</MenuItem>
                    <MenuItem value="other">Other</MenuItem>
                  </TextField>
                </Grid>

                <Grid size={{ xs: 12, md: 3 }}>
                  <TextField
                    label="Quantity"
                    type="number"
                    fullWidth
                    required
                    inputProps={{ min: 1, max: 500 }}
                    value={requestForm.quantity}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (value === '' || (parseInt(value) >= 1 && parseInt(value) <= 500)) {
                        setRequestForm({ ...requestForm, quantity: value });
                      }
                    }}
                    helperText="Maximum 500"
                    error={requestForm.quantity && (parseInt(requestForm.quantity) < 1 || parseInt(requestForm.quantity) > 500)}
                  />
                </Grid>

                <Grid size={{ xs: 12, md: 3 }}>
                  <TextField
                    label="Unit"
                    select
                    fullWidth
                    value={requestForm.unit}
                    onChange={(e) => setRequestForm({ ...requestForm, unit: e.target.value })}
                  >
                    <MenuItem value="piece">Piece</MenuItem>
                    <MenuItem value="set">Set</MenuItem>
                    <MenuItem value="kg">Kilogram</MenuItem>
                    <MenuItem value="liter">Liter</MenuItem>
                    <MenuItem value="meter">Meter</MenuItem>
                  </TextField>
                </Grid>

                <Grid size={12}>
                  <TextField
                    label="Reason for Request"
                    placeholder="Explain why this item is needed and its intended use..."
                    multiline
                    rows={4}
                    fullWidth
                    required
                    value={requestForm.reason}
                    onChange={(e) => setRequestForm({ ...requestForm, reason: e.target.value })}
                  />
                </Grid>

                <Grid size={12}>
                  <Button
                    variant="contained"
                    size="large"
                    fullWidth
                    onClick={handleSubmitRequest}
                    disabled={submitting || !requestForm.itemName || !requestForm.quantity || !requestForm.reason.trim()}
                  >
                    {submitting ? 'Submitting...' : 'Submit Stock Request'}
                  </Button>
                </Grid>
              </Grid>
            </Stack>
          </TabPanel>

          {/* My Requests Tab */}
          <TabPanel value={tab} index="requests">
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                <CircularProgress />
              </Box>
            ) : stockRequests.length === 0 ? (
              <Alert severity="info">You haven't submitted any stock requests yet.</Alert>
            ) : (
              <TableContainer component={Paper} variant="outlined">
                <Table>
                  <TableHead>
                    <TableRow sx={{ bgcolor: 'grey.50' }}>
                      <TableCell><strong>Date</strong></TableCell>
                      <TableCell><strong>Item</strong></TableCell>
                      <TableCell><strong>Category</strong></TableCell>
                      <TableCell><strong>Quantity</strong></TableCell>
                      <TableCell><strong>Status</strong></TableCell>
                      <TableCell><strong>Reason</strong></TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {stockRequests.map((request) => (
                      <TableRow key={request._id} hover>
                        <TableCell>
                          {new Date(request.createdAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">{request.itemName}</Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">{request.category || 'other'}</Typography>
                        </TableCell>
                        <TableCell>
                          {request.quantity} {request.unit}
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={request.status}
                            size="small"
                            color={getStatusColor(request.status)}
                          />
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" sx={{ maxWidth: 200 }}>
                            {request.reason}
                          </Typography>
                          {request.reviewNotes && (
                            <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5 }}>
                              <strong>Admin Note:</strong> {request.reviewNotes}
                            </Typography>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </TabPanel>

          {/* View Inventory Tab */}
          <TabPanel value={tab} index="items">
            <Stack spacing={3}>
              <Alert severity="info">
                View all available inventory items in the hostel. Newly added items are displayed here.
              </Alert>

              {/* Filters */}
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, md: 4 }}>
                  <TextField
                    fullWidth
                    label="Search Items"
                    placeholder="Search by name, location, supplier..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 4 }}>
                  <FormControl fullWidth>
                    <InputLabel>Category</InputLabel>
                    <Select
                      value={categoryFilter}
                      label="Category"
                      onChange={(e) => setCategoryFilter(e.target.value)}
                    >
                      <MenuItem value="all">All Categories</MenuItem>
                      <MenuItem value="furniture">Furniture</MenuItem>
                      <MenuItem value="electronics">Electronics</MenuItem>
                      <MenuItem value="appliances">Appliances</MenuItem>
                      <MenuItem value="bedding">Bedding</MenuItem>
                      <MenuItem value="utensils">Utensils</MenuItem>
                      <MenuItem value="cleaning">Cleaning</MenuItem>
                      <MenuItem value="other">Other</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid size={{ xs: 12, md: 4 }}>
                  <FormControl fullWidth>
                    <InputLabel>Status</InputLabel>
                    <Select
                      value={statusFilter}
                      label="Status"
                      onChange={(e) => setStatusFilter(e.target.value)}
                    >
                      <MenuItem value="all">All Status</MenuItem>
                      <MenuItem value="available">Available</MenuItem>
                      <MenuItem value="in_use">In Use</MenuItem>
                      <MenuItem value="maintenance">Maintenance</MenuItem>
                      <MenuItem value="damaged">Damaged</MenuItem>
                      <MenuItem value="disposed">Disposed</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>

              {loadingInventory ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                  <CircularProgress />
                </Box>
              ) : getFilteredInventoryItems().length === 0 ? (
                <Alert severity="info">No inventory items found matching the filters.</Alert>
              ) : (
                <TableContainer component={Paper} variant="outlined">
                  <Table>
                    <TableHead>
                      <TableRow sx={{ bgcolor: 'grey.50' }}>
                        <TableCell><strong>Item Name</strong></TableCell>
                        <TableCell><strong>Category</strong></TableCell>
                        <TableCell><strong>Quantity</strong></TableCell>
                        <TableCell><strong>Unit</strong></TableCell>
                        <TableCell><strong>Location/Room</strong></TableCell>
                        <TableCell><strong>Status</strong></TableCell>
                        <TableCell><strong>Condition</strong></TableCell>
                        <TableCell><strong>Added Date</strong></TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {getFilteredInventoryItems().map((item) => (
                        <TableRow key={item._id} hover>
                          <TableCell>
                            <Typography variant="body2" sx={{ fontWeight: 500 }}>
                              {item.name}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={formatCategory(item.category)}
                              size="small"
                              color="primary"
                              variant="outlined"
                            />
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">{item.quantity || 0}</Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" color="text.secondary">
                              {item.unit || 'piece'}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">
                              {item.location || (item.room ? `${item.room.roomNumber}${item.room.building ? ` (${item.room.building})` : ''}` : 'N/A')}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={formatStatus(item.status)}
                              size="small"
                              color={getStatusColor(item.status)}
                            />
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" color="text.secondary">
                              {item.condition ? item.condition.charAt(0).toUpperCase() + item.condition.slice(1) : 'N/A'}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" color="text.secondary">
                              {new Date(item.createdAt).toLocaleDateString()}
                            </Typography>
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
    </ComponentsWrapper>
  );
}
