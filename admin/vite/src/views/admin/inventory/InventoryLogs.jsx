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
import Grid from '@mui/material/Grid';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import IconButton from '@mui/material/IconButton';

// @project
import ComponentsWrapper from '@/components/ComponentsWrapper';
import PresentationCard from '@/components/cards/PresentationCard';
import adminService from '@/services/adminService';
import { useSnackbar } from 'notistack';

// @icons
import { IconEye, IconRefresh, IconX, IconHistory } from '@tabler/icons-react';

/***************************  INVENTORY LOGS PAGE  ***************************/

export default function InventoryLogsPage() {
  const { enqueueSnackbar } = useSnackbar();
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState(0);

  const [inventory, setInventory] = useState([]);
  const [filteredInventory, setFilteredInventory] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  
  // Filters for inventory
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Student inventory requests
  const [inventoryRequests, setInventoryRequests] = useState([]);
  const [requestStatusFilter, setRequestStatusFilter] = useState('all');

  useEffect(() => {
    fetchInventory();
  }, []);

  useEffect(() => {
    if (tab === 1) {
      fetchInventoryRequests();
    }
  }, [tab, requestStatusFilter]);

  useEffect(() => {
    filterInventory();
  }, [inventory, categoryFilter, statusFilter, searchQuery]);

  const fetchInventory = async () => {
    try {
      setLoading(true);
      const data = await adminService.getAllInventory();
      setInventory(Array.isArray(data) ? data : []);
    } catch (err) {
      enqueueSnackbar(err.response?.data?.message || 'Failed to load inventory', { variant: 'error' });
      setInventory([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchInventoryRequests = async () => {
    try {
      setLoading(true);
      const params = requestStatusFilter !== 'all' ? { status: requestStatusFilter } : {};
      const data = await adminService.getAllInventoryRequests(params);
      setInventoryRequests(Array.isArray(data) ? data : []);
    } catch (err) {
      enqueueSnackbar(err.response?.data?.message || 'Failed to load inventory requests', { variant: 'error' });
      setInventoryRequests([]);
    } finally {
      setLoading(false);
    }
  };

  const filterInventory = () => {
    let filtered = [...inventory];

    // Filter by category
    if (categoryFilter !== 'all') {
      filtered = filtered.filter(item => item.category === categoryFilter);
    }

    // Filter by status
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

    // Sort by most recently updated
    filtered.sort((a, b) => {
      const dateA = new Date(a.updatedAt || a.createdAt);
      const dateB = new Date(b.updatedAt || b.createdAt);
      return dateB - dateA;
    });

    setFilteredInventory(filtered);
  };

  const handleViewDetails = (item) => {
    setSelectedItem(item);
    setDetailDialogOpen(true);
  };

  const getStatusColor = (status) => {
    switch (status) {
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

  const getCategoryColor = (category) => {
    switch (category) {
      case 'furniture':
        return 'primary';
      case 'electronics':
        return 'secondary';
      case 'appliances':
        return 'info';
      case 'bedding':
        return 'success';
      case 'utensils':
        return 'warning';
      case 'cleaning':
        return 'error';
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

  const formatRequestStatus = (status) => {
    const map = {
      pending: 'Pending',
      approved: 'Approved',
      issued: 'Issued',
      rejected: 'Rejected',
      returned: 'Returned',
      cancelled: 'Cancelled'
    };
    return map[status] || formatStatus(status);
  };

  const formatDate = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatPrice = (amount) => {
    if (!amount && amount !== 0) return 'N/A';
    return `₹${amount.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
  };

  // Calculate statistics
  const stats = {
    total: inventory.length,
    available: inventory.filter(i => i.status === 'available').length,
    inUse: inventory.filter(i => i.status === 'in_use').length,
    maintenance: inventory.filter(i => i.status === 'maintenance').length,
    damaged: inventory.filter(i => i.status === 'damaged').length,
    totalQuantity: inventory.reduce((sum, i) => sum + (i.quantity || 0), 0),
    totalValue: inventory.reduce((sum, i) => sum + ((i.purchasePrice || 0) * (i.quantity || 0)), 0)
  };

  return (
    <ComponentsWrapper title="Inventory Logs">
      <Stack spacing={3}>
        {/* Tabs */}
        <Stack direction="row" spacing={2} sx={{ borderBottom: 1, borderColor: 'divider', pb: 1 }}>
          <Button
            variant={tab === 0 ? 'contained' : 'text'}
            size="small"
            onClick={() => setTab(0)}
          >
            Inventory Items
          </Button>
          <Button
            variant={tab === 1 ? 'contained' : 'text'}
            size="small"
            startIcon={<IconHistory size={16} />}
            onClick={() => setTab(1)}
          >
            Student Issue & Return Log
          </Button>
        </Stack>

        {/* INVENTORY ITEMS TAB */}
        {tab === 0 && (
        <>
        {/* Statistics Cards */}        
        <Grid container spacing={2}>
          <Grid size={{ xs: 6, sm: 4, md: 2.4 }}>
            <Card sx={{ bgcolor: 'primary.lighter', color: 'primary.main' }}>
              <CardContent>
                <Stack spacing={1}>
                  <Typography variant="h4" fontWeight={600}>{stats.total}</Typography>
                  <Typography variant="body2">Total Items</Typography>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 6, sm: 4, md: 2.4 }}>
            <Card sx={{ bgcolor: 'success.lighter', color: 'success.main' }}>
              <CardContent>
                <Stack spacing={1}>
                  <Typography variant="h4" fontWeight={600}>{stats.available}</Typography>
                  <Typography variant="body2">Available</Typography>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 6, sm: 4, md: 2.4 }}>
            <Card sx={{ bgcolor: 'info.lighter', color: 'info.main' }}>
              <CardContent>
                <Stack spacing={1}>
                  <Typography variant="h4" fontWeight={600}>{stats.inUse}</Typography>
                  <Typography variant="body2">In Use</Typography>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 6, sm: 4, md: 2.4 }}>
            <Card sx={{ bgcolor: 'warning.lighter', color: 'warning.main' }}>
              <CardContent>
                <Stack spacing={1}>
                  <Typography variant="h4" fontWeight={600}>{stats.maintenance}</Typography>
                  <Typography variant="body2">Maintenance</Typography>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 6, sm: 4, md: 2.4 }}>
            <Card sx={{ bgcolor: 'error.lighter', color: 'error.main' }}>
              <CardContent>
                <Stack spacing={1}>
                  <Typography variant="h4" fontWeight={600}>{stats.damaged}</Typography>
                  <Typography variant="body2">Damaged</Typography>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Summary Cards */}
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, sm: 6 }}>
            <Card sx={{ bgcolor: 'grey.50' }}>
              <CardContent>
                <Stack spacing={1}>
                  <Typography variant="body2" color="text.secondary">Total Quantity</Typography>
                  <Typography variant="h5" fontWeight={600}>
                    {stats.totalQuantity.toLocaleString('en-IN')} units
                  </Typography>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <Card sx={{ bgcolor: 'grey.50' }}>
              <CardContent>
                <Stack spacing={1}>
                  <Typography variant="body2" color="text.secondary">Total Inventory Value</Typography>
                  <Typography variant="h5" fontWeight={600}>
                    {formatPrice(stats.totalValue)}
                  </Typography>
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
              placeholder="Search by name, location, supplier, or room..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              sx={{ minWidth: 250, flexGrow: 1 }}
            />
            <FormControl size="small" sx={{ minWidth: 150 }}>
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
            <FormControl size="small" sx={{ minWidth: 150 }}>
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
            <Button
              variant="outlined"
              startIcon={<IconRefresh size={18} />}
              onClick={fetchInventory}
              disabled={loading}
            >
              Refresh
            </Button>
          </Stack>
        </PresentationCard>

        {/* Inventory Logs Table */}
        <PresentationCard>
          <Stack spacing={2}>
            <Typography variant="h6">Inventory Transaction History</Typography>
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                <CircularProgress />
              </Box>
            ) : filteredInventory.length === 0 ? (
              <Alert severity="info">No inventory items found matching the filters.</Alert>
            ) : (
              <TableContainer component={Paper} elevation={0} sx={{ border: 1, borderColor: 'divider', borderRadius: 2 }}>
                <Table>
                  <TableHead>
                    <TableRow sx={{ bgcolor: 'grey.50' }}>
                      <TableCell><strong>Item Name</strong></TableCell>
                      <TableCell><strong>Category</strong></TableCell>
                      <TableCell><strong>Quantity</strong></TableCell>
                      <TableCell><strong>Location/Room</strong></TableCell>
                      <TableCell><strong>Status</strong></TableCell>
                      <TableCell><strong>Condition</strong></TableCell>
                      <TableCell><strong>Created</strong></TableCell>
                      <TableCell><strong>Last Updated</strong></TableCell>
                      <TableCell><strong>Actions</strong></TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredInventory.map((item) => (
                      <TableRow key={item._id} hover>
                        <TableCell>
                          <Typography variant="body2" fontWeight={500}>
                            {item.name || 'N/A'}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={formatCategory(item.category)}
                            size="small"
                            color={getCategoryColor(item.category)}
                          />
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {item.quantity || 0} {item.unit || 'piece'}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {item.room?.roomNumber ? (
                              <>Room {item.room.roomNumber} {item.room.building ? `(${item.room.building})` : ''}</>
                            ) : (
                              item.location || 'General'
                            )}
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
                          <Typography variant="body2" sx={{ textTransform: 'capitalize' }}>
                            {item.condition || 'N/A'}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" color="text.secondary">
                            {formatDate(item.createdAt)}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" color="text.secondary">
                            {formatDate(item.updatedAt)}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <IconButton
                            size="small"
                            color="primary"
                            onClick={() => handleViewDetails(item)}
                          >
                            <IconEye size={18} />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Stack>
        </PresentationCard>

        {/* Item Details Dialog */}
        <Dialog
          open={detailDialogOpen}
          onClose={() => setDetailDialogOpen(false)}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Typography variant="h6">Inventory Item Details</Typography>
              <IconButton size="small" onClick={() => setDetailDialogOpen(false)}>
                <IconX size={18} />
              </IconButton>
            </Stack>
          </DialogTitle>
          <DialogContent>
            {selectedItem && (
              <Stack spacing={2} sx={{ mt: 1 }}>
                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Typography variant="body2" color="text.secondary">Item Name</Typography>
                    <Typography variant="body1" fontWeight={500}>
                      {selectedItem.name || 'N/A'}
                    </Typography>
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Typography variant="body2" color="text.secondary">Category</Typography>
                    <Chip
                      label={formatCategory(selectedItem.category)}
                      size="small"
                      color={getCategoryColor(selectedItem.category)}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Typography variant="body2" color="text.secondary">Quantity</Typography>
                    <Typography variant="body1" fontWeight={500}>
                      {selectedItem.quantity || 0} {selectedItem.unit || 'piece'}
                    </Typography>
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Typography variant="body2" color="text.secondary">Status</Typography>
                    <Chip
                      label={formatStatus(selectedItem.status)}
                      size="small"
                      color={getStatusColor(selectedItem.status)}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Typography variant="body2" color="text.secondary">Condition</Typography>
                    <Typography variant="body1" sx={{ textTransform: 'capitalize' }}>
                      {selectedItem.condition || 'N/A'}
                    </Typography>
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Typography variant="body2" color="text.secondary">Location</Typography>
                    <Typography variant="body1">
                      {selectedItem.location || 'N/A'}
                    </Typography>
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Typography variant="body2" color="text.secondary">Room</Typography>
                    <Typography variant="body1">
                      {selectedItem.room?.roomNumber ? (
                        <>Room {selectedItem.room.roomNumber} {selectedItem.room.building ? `(${selectedItem.room.building})` : ''}</>
                      ) : (
                        'General Inventory'
                      )}
                    </Typography>
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Typography variant="body2" color="text.secondary">Purchase Date</Typography>
                    <Typography variant="body1">
                      {selectedItem.purchaseDate ? formatDate(selectedItem.purchaseDate) : 'N/A'}
                    </Typography>
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Typography variant="body2" color="text.secondary">Purchase Price</Typography>
                    <Typography variant="body1" fontWeight={500}>
                      {formatPrice(selectedItem.purchasePrice)}
                    </Typography>
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Typography variant="body2" color="text.secondary">Total Value</Typography>
                    <Typography variant="body1" fontWeight={600}>
                      {formatPrice((selectedItem.purchasePrice || 0) * (selectedItem.quantity || 0))}
                    </Typography>
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Typography variant="body2" color="text.secondary">Supplier</Typography>
                    <Typography variant="body1">
                      {selectedItem.supplier || 'N/A'}
                    </Typography>
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Typography variant="body2" color="text.secondary">Managed By</Typography>
                    <Typography variant="body1">
                      {selectedItem.managedBy?.name || 'N/A'}
                    </Typography>
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Typography variant="body2" color="text.secondary">Created At</Typography>
                    <Typography variant="body1" color="text.secondary">
                      {formatDate(selectedItem.createdAt)}
                    </Typography>
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Typography variant="body2" color="text.secondary">Last Updated</Typography>
                    <Typography variant="body1" color="text.secondary">
                      {formatDate(selectedItem.updatedAt)}
                    </Typography>
                  </Grid>
                  {selectedItem.description && (
                    <Grid size={{ xs: 12 }}>
                      <Typography variant="body2" color="text.secondary">Description</Typography>
                      <Typography variant="body1">
                        {selectedItem.description}
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
        </>
        )}

        {/* STUDENT INVENTORY REQUESTS TAB */}
        {tab === 1 && (
          <PresentationCard>
            <Stack spacing={2}>
              <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap">
                <FormControl size="small" sx={{ minWidth: 180 }}>
                  <InputLabel>Status</InputLabel>
                  <Select
                    value={requestStatusFilter}
                    label="Status"
                    onChange={(e) => setRequestStatusFilter(e.target.value)}
                  >
                    <MenuItem value="all">All Status</MenuItem>
                    <MenuItem value="pending">Pending</MenuItem>
                    <MenuItem value="approved">Approved</MenuItem>
                    <MenuItem value="issued">Issued</MenuItem>
                    <MenuItem value="returned">Returned</MenuItem>
                    <MenuItem value="rejected">Rejected</MenuItem>
                  </Select>
                </FormControl>
                <Button
                  variant="outlined"
                  startIcon={<IconRefresh size={18} />}
                  onClick={fetchInventoryRequests}
                  disabled={loading}
                >
                  Refresh
                </Button>
              </Stack>

              {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                  <CircularProgress />
                </Box>
              ) : inventoryRequests.length === 0 ? (
                <Alert severity="info">No student inventory requests found.</Alert>
              ) : (
                <TableContainer component={Paper} elevation={0} sx={{ border: 1, borderColor: 'divider', borderRadius: 2 }}>
                  <Table>
                    <TableHead>
                      <TableRow sx={{ bgcolor: 'grey.50' }}>
                        <TableCell><strong>Date</strong></TableCell>
                        <TableCell><strong>Student</strong></TableCell>
                        <TableCell><strong>Room</strong></TableCell>
                        <TableCell><strong>Item</strong></TableCell>
                        <TableCell><strong>Quantity</strong></TableCell>
                        <TableCell><strong>Type</strong></TableCell>
                        <TableCell><strong>Status</strong></TableCell>
                        <TableCell><strong>Issued / Returned</strong></TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {inventoryRequests.map((req) => (
                        <TableRow key={req._id} hover>
                          <TableCell>{req.createdAt ? new Date(req.createdAt).toLocaleDateString('en-IN') : 'N/A'}</TableCell>
                          <TableCell>
                            <Stack spacing={0.5}>
                              <Typography variant="body2">
                                {req.studentIdentity?.name || req.student?.name || 'N/A'}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {req.studentIdentity?.studentId || req.student?.studentId || 'N/A'}
                              </Typography>
                            </Stack>
                          </TableCell>
                          <TableCell>
                            {req.studentIdentity?.roomNumber ||
                              req.student?.room?.roomNumber ||
                              'N/A'}
                          </TableCell>
                          <TableCell>{req.itemName}</TableCell>
                          <TableCell>
                            {req.quantity} {req.inventoryItem?.unit || 'piece'}(s)
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={req.itemType === 'permanent' ? 'Permanent' : 'Temporary'}
                              size="small"
                              color={req.itemType === 'permanent' ? 'primary' : 'default'}
                            />
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={formatRequestStatus(req.status)}
                              size="small"
                              color={
                                req.status === 'pending'
                                  ? 'warning'
                                  : req.status === 'approved'
                                  ? 'info'
                                  : req.status === 'issued'
                                  ? 'success'
                                  : req.status === 'returned'
                                  ? 'default'
                                  : 'error'
                              }
                            />
                          </TableCell>
                          <TableCell>
                            <Stack spacing={0.5}>
                              {req.issuedAt && (
                                <Typography variant="caption" color="text.secondary">
                                  Issued: {new Date(req.issuedAt).toLocaleDateString('en-IN')}
                                </Typography>
                              )}
                              {req.returnedAt && (
                                <Typography variant="caption" color="text.secondary">
                                  Returned: {new Date(req.returnedAt).toLocaleDateString('en-IN')}
                                </Typography>
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
        )}
      </Stack>
    </ComponentsWrapper>
  );
}
