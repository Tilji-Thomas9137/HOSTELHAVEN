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
import { useTheme } from '@mui/material/styles';
import { PieChart } from '@mui/x-charts/PieChart';

// @project
import ComponentsWrapper from '@/components/ComponentsWrapper';
import PresentationCard from '@/components/cards/PresentationCard';
import adminService from '@/services/adminService';
import { useSnackbar } from 'notistack';

// @icons
import { IconEye, IconRefresh, IconX, IconAlertCircle, IconClock, IconChartBar } from '@tabler/icons-react';

/***************************  FEE COLLECTION STATUS PAGE  ***************************/

export default function PaymentsPage() {
  const theme = useTheme();
  const { enqueueSnackbar } = useSnackbar();
  const [loading, setLoading] = useState(true);
  const [fees, setFees] = useState([]);
  const [filteredFees, setFilteredFees] = useState([]);
  const [selectedFee, setSelectedFee] = useState(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  
  // Filters
  const [statusFilter, setStatusFilter] = useState('all');
  const [feeTypeFilter, setFeeTypeFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchFees();
  }, []);

  useEffect(() => {
    filterFees();
  }, [fees, statusFilter, feeTypeFilter, searchQuery]);

  const fetchFees = async () => {
    try {
      setLoading(true);
      const data = await adminService.getAllFees();
      setFees(data.fees || data || []);
    } catch (err) {
      enqueueSnackbar(err.response?.data?.message || 'Failed to load fees', { variant: 'error' });
      setFees([]);
    } finally {
      setLoading(false);
    }
  };

  const filterFees = () => {
    let filtered = [...fees];

    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(fee => fee.status === statusFilter);
    }

    // Filter by fee type
    if (feeTypeFilter !== 'all') {
      filtered = filtered.filter(fee => fee.feeType === feeTypeFilter);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(fee => {
        const studentName = fee.student?.name?.toLowerCase() || '';
        const studentId = fee.student?.studentId?.toLowerCase() || '';
        const feeType = fee.feeType?.toLowerCase() || '';
        return studentName.includes(query) || studentId.includes(query) || feeType.includes(query);
      });
    }

    setFilteredFees(filtered);
  };

  const handleViewDetails = (fee) => {
    setSelectedFee(fee);
    setDetailDialogOpen(true);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'paid':
        return 'success';
      case 'pending':
        return 'warning';
      case 'overdue':
        return 'error';
      case 'partial':
        return 'info';
      default:
        return 'default';
    }
  };

  const getFeeTypeColor = (feeType) => {
    switch (feeType) {
      case 'rent':
        return 'primary';
      case 'mess_fee':
        return 'secondary';
      case 'deposit':
        return 'info';
      case 'utility':
        return 'warning';
      case 'maintenance':
        return 'error';
      default:
        return 'default';
    }
  };

  const formatFeeType = (feeType) => {
    if (!feeType) return 'N/A';
    return feeType
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const formatPrice = (amount) => {
    return `₹${amount?.toLocaleString('en-IN') || '0'}`;
  };

  const formatDate = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const isOverdue = (dueDate) => {
    if (!dueDate) return false;
    return new Date(dueDate) < new Date() && new Date(dueDate).toDateString() !== new Date().toDateString();
  };

  // Calculate statistics
  const stats = {
    total: fees.length,
    paid: fees.filter(f => f.status === 'paid').length,
    pending: fees.filter(f => f.status === 'pending').length,
    overdue: fees.filter(f => f.status === 'overdue' || (f.status === 'pending' && isOverdue(f.dueDate))).length,
    partial: fees.filter(f => f.status === 'partial').length,
    totalAmount: fees.reduce((sum, f) => sum + (f.amount || 0), 0),
    totalPaid: fees.reduce((sum, f) => sum + (f.paidAmount || 0), 0),
    totalPending: fees.reduce((sum, f) => sum + (f.amount - (f.paidAmount || 0)), 0),
    overdueAmount: fees
      .filter(f => f.status === 'overdue' || (f.status === 'pending' && isOverdue(f.dueDate)))
      .reduce((sum, f) => sum + (f.amount - (f.paidAmount || 0)), 0),
  };

  // Chart data
  const paymentStatusData = [
    { id: 0, value: stats.totalPaid, label: 'Paid', color: theme.palette.success.main },
    { id: 1, value: stats.totalPending, label: 'Pending', color: theme.palette.warning.main },
    { id: 2, value: stats.overdueAmount, label: 'Overdue', color: theme.palette.error.main },
  ].filter(item => item.value > 0);

  return (
    <ComponentsWrapper title="Fee Collection Status">
      <Stack spacing={3}>
        {/* Statistics Cards */}
        <Grid container spacing={2}>
          <Grid size={{ xs: 6, sm: 4, md: 2.4 }}>
            <Card sx={{ bgcolor: 'primary.lighter', color: 'primary.main' }}>
              <CardContent>
                <Stack spacing={1}>
                  <Typography variant="h4" fontWeight={600}>{stats.total}</Typography>
                  <Typography variant="body2">Total Fees</Typography>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 6, sm: 4, md: 2.4 }}>
            <Card sx={{ bgcolor: 'success.lighter', color: 'success.main' }}>
              <CardContent>
                <Stack spacing={1}>
                  <Typography variant="h4" fontWeight={600}>{stats.paid}</Typography>
                  <Typography variant="body2">Paid</Typography>
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
            <Card sx={{ bgcolor: 'error.lighter', color: 'error.main' }}>
              <CardContent>
                <Stack spacing={1}>
                  <Typography variant="h4" fontWeight={600}>{stats.overdue}</Typography>
                  <Typography variant="body2">Overdue</Typography>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 6, sm: 4, md: 2.4 }}>
            <Card sx={{ bgcolor: 'info.lighter', color: 'info.main' }}>
              <CardContent>
                <Stack spacing={1}>
                  <Typography variant="h4" fontWeight={600}>{stats.partial}</Typography>
                  <Typography variant="body2">Partial</Typography>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Amount Statistics */}
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, sm: 4 }}>
            <Card sx={{ bgcolor: 'grey.50' }}>
              <CardContent>
                <Stack spacing={1}>
                  <Typography variant="body2" color="text.secondary">Total Amount</Typography>
                  <Typography variant="h5" fontWeight={600}>
                    {formatPrice(stats.totalAmount)}
                  </Typography>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 12, sm: 4 }}>
            <Card sx={{ bgcolor: 'success.lighter' }}>
              <CardContent>
                <Stack spacing={1}>
                  <Typography variant="body2" color="text.secondary">Total Paid</Typography>
                  <Typography variant="h5" fontWeight={600} color="success.main">
                    {formatPrice(stats.totalPaid)}
                  </Typography>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 12, sm: 4 }}>
            <Card sx={{ bgcolor: 'error.lighter' }}>
              <CardContent>
                <Stack spacing={1}>
                  <Typography variant="body2" color="text.secondary">Total Pending</Typography>
                  <Typography variant="h5" fontWeight={600} color="error.main">
                    {formatPrice(stats.totalPending)}
                  </Typography>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Chart */}
        {paymentStatusData.length > 0 && (
          <PresentationCard>
            <Stack spacing={2}>
              <Typography variant="h6">Payment Status Overview</Typography>
              <Box sx={{ width: '100%', height: 300, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                <PieChart
                  series={[
                    {
                      data: paymentStatusData,
                      innerRadius: 30,
                      outerRadius: 100,
                      paddingAngle: 2,
                      cornerRadius: 5,
                      cx: 150,
                      cy: 150
                    }
                  ]}
                  width={300}
                  height={300}
                  slotProps={{
                    legend: {
                      direction: 'column',
                      position: { vertical: 'bottom', horizontal: 'middle' },
                      padding: 0
                    }
                  }}
                />
              </Box>
            </Stack>
          </PresentationCard>
        )}

        {/* Filters */}
        <PresentationCard>
          <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap">
            <TextField
              size="small"
              placeholder="Search by student name or ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              sx={{ minWidth: 250, flexGrow: 1 }}
            />
            <FormControl size="small" sx={{ minWidth: 150 }}>
              <InputLabel>Status</InputLabel>
              <Select
                value={statusFilter}
                label="Status"
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <MenuItem value="all">All Status</MenuItem>
                <MenuItem value="paid">Paid</MenuItem>
                <MenuItem value="pending">Pending</MenuItem>
                <MenuItem value="overdue">Overdue</MenuItem>
                <MenuItem value="partial">Partial</MenuItem>
              </Select>
            </FormControl>
            <FormControl size="small" sx={{ minWidth: 150 }}>
              <InputLabel>Fee Type</InputLabel>
              <Select
                value={feeTypeFilter}
                label="Fee Type"
                onChange={(e) => setFeeTypeFilter(e.target.value)}
              >
                <MenuItem value="all">All Types</MenuItem>
                <MenuItem value="rent">Rent</MenuItem>
                <MenuItem value="mess_fee">Mess Fee</MenuItem>
                <MenuItem value="deposit">Deposit</MenuItem>
                <MenuItem value="utility">Utility</MenuItem>
                <MenuItem value="maintenance">Maintenance</MenuItem>
                <MenuItem value="late_fee">Late Fee</MenuItem>
                <MenuItem value="other">Other</MenuItem>
              </Select>
            </FormControl>
            <Button
              variant="outlined"
              startIcon={<IconRefresh size={18} />}
              onClick={fetchFees}
              disabled={loading}
            >
              Refresh
            </Button>
          </Stack>
        </PresentationCard>

        {/* Fees Table */}
        <PresentationCard>
          <Stack spacing={2}>
            <Typography variant="h6">Fee Collection Status</Typography>
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                <CircularProgress />
              </Box>
            ) : filteredFees.length === 0 ? (
              <Alert severity="info">No fees found matching the filters.</Alert>
            ) : (
              <TableContainer component={Paper} elevation={0} sx={{ border: 1, borderColor: 'divider', borderRadius: 2 }}>
                <Table>
                  <TableHead>
                    <TableRow sx={{ bgcolor: 'grey.50' }}>
                      <TableCell><strong>Student</strong></TableCell>
                      <TableCell><strong>Student ID</strong></TableCell>
                      <TableCell><strong>Fee Type</strong></TableCell>
                      <TableCell><strong>Total Amount</strong></TableCell>
                      <TableCell><strong>Paid</strong></TableCell>
                      <TableCell><strong>Pending</strong></TableCell>
                      <TableCell><strong>Due Date</strong></TableCell>
                      <TableCell><strong>Status</strong></TableCell>
                      <TableCell><strong>Actions</strong></TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredFees.map((fee) => {
                      const pendingAmount = fee.amount - (fee.paidAmount || 0);
                      const overdue = isOverdue(fee.dueDate) && fee.status !== 'paid';
                      return (
                        <TableRow 
                          key={fee._id} 
                          hover
                          sx={{
                            bgcolor: overdue ? 'error.lighter' : 'transparent',
                            '&:hover': {
                              bgcolor: overdue ? 'error.lighter' : 'action.hover',
                            }
                          }}
                        >
                          <TableCell>
                            <Stack direction="row" spacing={1} alignItems="center">
                              <Typography variant="body2" fontWeight={500}>
                                {fee.student?.name || 'N/A'}
                              </Typography>
                              {overdue && (
                                <IconAlertCircle size={16} color="error" />
                              )}
                            </Stack>
                          </TableCell>
                          <TableCell>{fee.student?.studentId || 'N/A'}</TableCell>
                          <TableCell>
                            <Chip
                              label={formatFeeType(fee.feeType)}
                              size="small"
                              color={getFeeTypeColor(fee.feeType)}
                            />
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" fontWeight={600}>
                              {formatPrice(fee.amount)}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" color="success.main" fontWeight={500}>
                              {formatPrice(fee.paidAmount || 0)}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" color={pendingAmount > 0 ? 'error.main' : 'success.main'} fontWeight={600}>
                              {formatPrice(pendingAmount)}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Stack direction="row" spacing={0.5} alignItems="center">
                              {overdue && <IconClock size={14} color="error" />}
                              <Typography variant="body2" color={overdue ? 'error.main' : 'text.primary'}>
                                {formatDate(fee.dueDate)}
                              </Typography>
                            </Stack>
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={overdue ? 'OVERDUE' : fee.status?.toUpperCase() || 'N/A'}
                              size="small"
                              color={overdue ? 'error' : getStatusColor(fee.status)}
                            />
                          </TableCell>
                          <TableCell>
                            <IconButton
                              size="small"
                              color="primary"
                              onClick={() => handleViewDetails(fee)}
                            >
                              <IconEye size={18} />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Stack>
        </PresentationCard>

        {/* Fee Details Dialog */}
        <Dialog
          open={detailDialogOpen}
          onClose={() => setDetailDialogOpen(false)}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Typography variant="h6">Payment Details</Typography>
              <IconButton size="small" onClick={() => setDetailDialogOpen(false)}>
                <IconX size={18} />
              </IconButton>
            </Stack>
          </DialogTitle>
          <DialogContent>
            {selectedFee && (
              <Stack spacing={2} sx={{ mt: 1 }}>
                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Typography variant="body2" color="text.secondary">Student Name</Typography>
                    <Typography variant="body1" fontWeight={500}>
                      {selectedFee.student?.name || 'N/A'}
                    </Typography>
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Typography variant="body2" color="text.secondary">Student ID</Typography>
                    <Typography variant="body1" fontWeight={500}>
                      {selectedFee.student?.studentId || 'N/A'}
                    </Typography>
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Typography variant="body2" color="text.secondary">Fee Type</Typography>
                    <Chip
                      label={formatFeeType(selectedFee.feeType)}
                      size="small"
                      color={getFeeTypeColor(selectedFee.feeType)}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Typography variant="body2" color="text.secondary">Status</Typography>
                    <Chip
                      label={isOverdue(selectedFee.dueDate) && selectedFee.status !== 'paid' ? 'OVERDUE' : selectedFee.status?.toUpperCase() || 'N/A'}
                      size="small"
                      color={isOverdue(selectedFee.dueDate) && selectedFee.status !== 'paid' ? 'error' : getStatusColor(selectedFee.status)}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Typography variant="body2" color="text.secondary">Total Amount</Typography>
                    <Typography variant="h6" fontWeight={600}>
                      {formatPrice(selectedFee.amount)}
                    </Typography>
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Typography variant="body2" color="text.secondary">Paid Amount</Typography>
                    <Typography variant="h6" fontWeight={600} color="success.main">
                      {formatPrice(selectedFee.paidAmount || 0)}
                    </Typography>
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Typography variant="body2" color="text.secondary">Pending Amount</Typography>
                    <Typography variant="h6" fontWeight={600} color="error.main">
                      {formatPrice(selectedFee.amount - (selectedFee.paidAmount || 0))}
                    </Typography>
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Typography variant="body2" color="text.secondary">Due Date</Typography>
                    <Typography variant="body1" color={isOverdue(selectedFee.dueDate) ? 'error.main' : 'text.primary'}>
                      {formatDate(selectedFee.dueDate)}
                      {isOverdue(selectedFee.dueDate) && selectedFee.status !== 'paid' && (
                        <Chip label="OVERDUE" size="small" color="error" sx={{ ml: 1 }} />
                      )}
                    </Typography>
                  </Grid>
                  {selectedFee.paidDate && (
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <Typography variant="body2" color="text.secondary">Paid Date</Typography>
                      <Typography variant="body1">
                        {formatDate(selectedFee.paidDate)}
                      </Typography>
                    </Grid>
                  )}
                  {selectedFee.description && (
                    <Grid size={{ xs: 12 }}>
                      <Typography variant="body2" color="text.secondary">Description</Typography>
                      <Typography variant="body1">
                        {selectedFee.description}
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
      </Stack>
    </ComponentsWrapper>
  );
}
