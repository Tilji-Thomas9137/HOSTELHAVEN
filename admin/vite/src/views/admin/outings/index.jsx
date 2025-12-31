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
  IconRefresh,
  IconEye,
  IconX,
  IconQrcode,
  IconCalendar,
  IconMapPin,
  IconUser,
  IconPhone,
} from '@tabler/icons-react';

/***************************  OUTING HISTORY PAGE  ***************************/

export default function OutingsPage() {
  const { enqueueSnackbar } = useSnackbar();
  const [loading, setLoading] = useState(true);
  const [requests, setRequests] = useState([]);
  const [filteredRequests, setFilteredRequests] = useState([]);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);

  // Filters
  const [statusFilter, setStatusFilter] = useState('all');
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
      const data = await adminService.getAllOutingRequests();
      setRequests(Array.isArray(data) ? data : []);
    } catch (err) {
      enqueueSnackbar(err.response?.data?.message || 'Failed to load outing history', { variant: 'error' });
      setRequests([]);
    } finally {
      setLoading(false);
    }
  };

  const filterRequests = () => {
    let filtered = [...requests];

    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter((req) => req.status === statusFilter);
    }

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

  const handleViewDetails = (request) => {
    setSelectedRequest(request);
    setDetailDialogOpen(true);
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
    <ComponentsWrapper title="Outing History">
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
              <Select value={statusFilter} label="Status" onChange={(e) => setStatusFilter(e.target.value)}>
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
            <Typography variant="h6">All Outing Requests</Typography>
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
                        <strong>Exit Time</strong>
                      </TableCell>
                      <TableCell>
                        <strong>Return Time</strong>
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
                        <TableCell>{request.exitTime ? formatDate(request.exitTime) : 'N/A'}</TableCell>
                        <TableCell>{request.returnTime ? formatDate(request.returnTime) : 'N/A'}</TableCell>
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
                  {selectedRequest.exitScannedBy && (
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2" color="text.secondary">
                        Exit Scanned By
                      </Typography>
                      <Typography variant="body1">
                        {selectedRequest.exitScannedBy?.name || 'N/A'}
                      </Typography>
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
                  {selectedRequest.returnScannedBy && (
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2" color="text.secondary">
                        Return Scanned By
                      </Typography>
                      <Typography variant="body1">
                        {selectedRequest.returnScannedBy?.name || 'N/A'}
                      </Typography>
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
      </Stack>
    </ComponentsWrapper>
  );
}
