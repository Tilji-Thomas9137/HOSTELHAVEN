import { useState, useEffect } from 'react';

// @mui
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';
import Chip from '@mui/material/Chip';
import Button from '@mui/material/Button';
import Grid from '@mui/material/Grid';
import TextField from '@mui/material/TextField';
import Alert from '@mui/material/Alert';
import CircularProgress from '@mui/material/CircularProgress';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';

// @project
import ComponentsWrapper from '@/components/ComponentsWrapper';
import PresentationCard from '@/components/cards/PresentationCard';
import studentService from '@/services/studentService';
import { useSnackbar } from 'notistack';
import { useRoomAllocation } from '@/contexts/RoomAllocationContext';

// @icons
import { IconHome, IconArrowRight, IconCheck, IconX, IconAlertCircle, IconWallet, IconCreditCard } from '@tabler/icons-react';

export default function RoomChangeRequestPage() {
  const { enqueueSnackbar } = useSnackbar();
  const { hasRoom, checkRoomAllocation } = useRoomAllocation();
  const [loading, setLoading] = useState(true);
  const [availableRooms, setAvailableRooms] = useState([]);
  const [currentRequest, setCurrentRequest] = useState(null);
  const [requestHistory, setRequestHistory] = useState([]);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [eligibilityErrors, setEligibilityErrors] = useState([]);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState(0);

  useEffect(() => {
    if (hasRoom) {
      fetchData();
    } else {
      setLoading(false);
    }
  }, [hasRoom]);

  const fetchData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        fetchAvailableRooms(),
        fetchCurrentRequest(),
        fetchRequestHistory(),
      ]);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableRooms = async () => {
    try {
      const response = await studentService.getAvailableRoomsForChange();
      setAvailableRooms(response.rooms || []);
      if (response.errors && response.errors.length > 0) {
        setEligibilityErrors(response.errors);
      }
    } catch (error) {
      if (error.response?.status === 400 && error.response?.data?.errors) {
        setEligibilityErrors(error.response.data.errors);
      } else {
        enqueueSnackbar('Failed to fetch available rooms', { variant: 'error' });
      }
    }
  };

  const fetchCurrentRequest = async () => {
    try {
      const response = await studentService.getRoomChangeRequest();
      setCurrentRequest(response.roomChangeRequest || null);
    } catch (error) {
      console.error('Error fetching current request:', error);
    }
  };

  const fetchRequestHistory = async () => {
    try {
      const response = await studentService.getRoomChangeRequestHistory();
      setRequestHistory(response.requests || []);
    } catch (error) {
      console.error('Error fetching request history:', error);
    }
  };

  const handleSelectRoom = (room) => {
    setSelectedRoom(room);
    setReason('');
  };

  const handleSubmitRequest = async () => {
    if (!selectedRoom) {
      enqueueSnackbar('Please select a room', { variant: 'warning' });
      return;
    }

    if (!reason.trim()) {
      enqueueSnackbar('Please provide a reason for room change', { variant: 'warning' });
      return;
    }

    try {
      setSubmitting(true);
      const response = await studentService.requestRoomChange(selectedRoom._id || selectedRoom.id, reason.trim());

      if (response.requiresPayment && response.paymentAmount > 0) {
        // Show payment dialog for upgrades
        setPaymentAmount(response.paymentAmount);
        setPaymentDialogOpen(true);
      } else {
        enqueueSnackbar('Room change request submitted successfully', { variant: 'success' });
        await fetchData();
        setSelectedRoom(null);
        setReason('');
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to submit room change request';
      if (error.response?.data?.errors) {
        setEligibilityErrors(error.response.data.errors);
      }
      enqueueSnackbar(errorMessage, { variant: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  const handlePaymentComplete = async () => {
    setPaymentDialogOpen(false);
    await fetchData();
    setSelectedRoom(null);
    setReason('');
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

  if (!hasRoom) {
    return (
      <ComponentsWrapper>
        <Alert severity="warning">
          You must have a room allocated before requesting a room change.
        </Alert>
      </ComponentsWrapper>
    );
  }

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
        {/* Eligibility Errors */}
        {eligibilityErrors.length > 0 && (
          <Alert severity="error">
            <Typography variant="subtitle2" gutterBottom>You are not eligible for room change:</Typography>
            <ul style={{ margin: 0, paddingLeft: 20 }}>
              {eligibilityErrors.map((error, idx) => (
                <li key={idx}>{error}</li>
              ))}
            </ul>
          </Alert>
        )}

        {/* Current Request Status */}
        {currentRequest && (
          <PresentationCard title="Current Room Change Request">
            <Stack spacing={2}>
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, md: 6 }}>
                  <Card variant="outlined" sx={{ p: 2 }}>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      Current Room
                    </Typography>
                    <Typography variant="h6">
                      {currentRequest.currentRoom?.roomNumber || 'N/A'}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {currentRequest.currentRoom?.block && `${currentRequest.currentRoom.block}, `}
                      {currentRequest.currentRoom?.floor !== null && currentRequest.currentRoom?.floor !== undefined
                        ? currentRequest.currentRoom.floor === 0
                          ? 'Ground Floor'
                          : `${currentRequest.currentRoom.floor}${currentRequest.currentRoom.floor === 1 ? 'st' : currentRequest.currentRoom.floor === 2 ? 'nd' : currentRequest.currentRoom.floor === 3 ? 'rd' : 'th'} Floor`
                        : 'N/A'}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {formatPrice(currentRequest.currentRoomPrice)}
                    </Typography>
                  </Card>
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <Card variant="outlined" sx={{ p: 2 }}>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      Requested Room
                    </Typography>
                    <Typography variant="h6">
                      {currentRequest.requestedRoom?.roomNumber || 'N/A'}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {currentRequest.requestedRoom?.block && `${currentRequest.requestedRoom.block}, `}
                      {currentRequest.requestedRoom?.floor !== null && currentRequest.requestedRoom?.floor !== undefined
                        ? currentRequest.requestedRoom.floor === 0
                          ? 'Ground Floor'
                          : `${currentRequest.requestedRoom.floor}${currentRequest.requestedRoom.floor === 1 ? 'st' : currentRequest.requestedRoom.floor === 2 ? 'nd' : currentRequest.requestedRoom.floor === 3 ? 'rd' : 'th'} Floor`
                        : 'N/A'}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {formatPrice(currentRequest.requestedRoomPrice)}
                    </Typography>
                  </Card>
                </Grid>
              </Grid>

              <Divider />

              <Stack direction="row" spacing={2} alignItems="center">
                <Chip
                  label={currentRequest.status.replace('_', ' ').toUpperCase()}
                  color={getStatusColor(currentRequest.status)}
                  size="small"
                />
                {currentRequest.paymentStatus === 'pending' && currentRequest.upgradePaymentRequired > 0 && (
                  <Chip
                    icon={<IconCreditCard size={16} />}
                    label={`Payment Required: ${formatPrice(currentRequest.upgradePaymentRequired)}`}
                    color="warning"
                    size="small"
                  />
                )}
                {currentRequest.downgradeWalletCredit > 0 && (
                  <Chip
                    icon={<IconWallet size={16} />}
                    label={`Wallet Credit: ${formatPrice(currentRequest.downgradeWalletCredit)}`}
                    color="info"
                    size="small"
                  />
                )}
              </Stack>

              {currentRequest.reason && (
                <Box>
                  <Typography variant="subtitle2" gutterBottom>Reason:</Typography>
                  <Typography variant="body2">{currentRequest.reason}</Typography>
                </Box>
              )}

              {currentRequest.rejectionReason && (
                <Alert severity="error">
                  <Typography variant="subtitle2" gutterBottom>Rejection Reason:</Typography>
                  <Typography variant="body2">{currentRequest.rejectionReason}</Typography>
                </Alert>
              )}

              {currentRequest.status === 'pending_payment' && currentRequest.upgradePaymentRequired > 0 && (
                <Alert severity="warning" action={
                  <Button
                    size="small"
                    variant="contained"
                    startIcon={<IconCreditCard size={18} />}
                    onClick={() => {
                      setPaymentAmount(currentRequest.upgradePaymentRequired);
                      setPaymentDialogOpen(true);
                    }}
                  >
                    Pay Now
                  </Button>
                }>
                  Payment of {formatPrice(currentRequest.upgradePaymentRequired)} is required to proceed with your room change request.
                </Alert>
              )}
            </Stack>
          </PresentationCard>
        )}

        {/* Available Rooms for Change */}
        {!currentRequest && eligibilityErrors.length === 0 && (
          <PresentationCard title="Available Rooms for Change">
            {availableRooms.length === 0 ? (
              <Alert severity="info">No available rooms for change at the moment.</Alert>
            ) : (
              <Grid container spacing={2}>
                {availableRooms.map((room) => (
                  <Grid key={room._id || room.id} size={{ xs: 12, md: 6 }}>
                    <Card
                      variant={selectedRoom?._id === room._id || selectedRoom?.id === room.id ? 'outlined' : 'outlined'}
                      sx={{
                        p: 2,
                        border: selectedRoom?._id === room._id || selectedRoom?.id === room.id ? 2 : 1,
                        borderColor: selectedRoom?._id === room._id || selectedRoom?.id === room.id ? 'primary.main' : 'divider',
                        cursor: 'pointer',
                        '&:hover': {
                          borderColor: 'primary.main',
                          boxShadow: 2,
                        },
                      }}
                      onClick={() => handleSelectRoom(room)}
                    >
                      <Stack spacing={2}>
                        <Stack direction="row" justifyContent="space-between" alignItems="center">
                          <Typography variant="h6">{room.roomNumber}</Typography>
                          <Chip
                            label={`${room.availableSlots || 0} available`}
                            color={room.availableSlots > 0 ? 'success' : 'error'}
                            size="small"
                          />
                        </Stack>

                        <Stack spacing={0.5}>
                          <Typography variant="body2">
                            <strong>Type:</strong> {room.roomType || 'Double'}
                          </Typography>
                          <Typography variant="body2">
                            <strong>Block:</strong> {room.block || 'N/A'}
                          </Typography>
                          <Typography variant="body2">
                            <strong>Floor:</strong>{' '}
                            {room.floor !== null && room.floor !== undefined
                              ? room.floor === 0
                                ? 'Ground Floor'
                                : `${room.floor}${room.floor === 1 ? 'st' : room.floor === 2 ? 'nd' : room.floor === 3 ? 'rd' : 'th'} Floor`
                              : 'N/A'}
                          </Typography>
                          <Typography variant="body2">
                            <strong>Capacity:</strong> {room.capacity} students
                          </Typography>
                          <Typography variant="body2">
                            <strong>Occupancy:</strong> {room.currentOccupancy || room.occupied} / {room.capacity}
                          </Typography>
                          <Typography variant="body2">
                            <strong>Yearly Fee:</strong> {formatPrice(room.totalPrice || room.rent || 0)}
                          </Typography>
                        </Stack>

                        {room.currentOccupants && room.currentOccupants.length > 0 && (
                          <Box>
                            <Divider sx={{ my: 1 }} />
                            <Typography variant="subtitle2" gutterBottom>Current Occupants:</Typography>
                            <Stack spacing={0.5}>
                              {room.currentOccupants.map((occupant, idx) => (
                                <Typography key={idx} variant="body2" color="text.secondary">
                                  • {occupant.name} ({occupant.admissionNumber}) - {occupant.course}
                                  {occupant.batchYear && ` - Batch ${occupant.batchYear}`}
                                </Typography>
                              ))}
                            </Stack>
                          </Box>
                        )}

                        {selectedRoom?._id === room._id || selectedRoom?.id === room.id ? (
                          <Button
                            variant="contained"
                            fullWidth
                            startIcon={<IconCheck size={18} />}
                            color="success"
                          >
                            Selected
                          </Button>
                        ) : (
                          <Button
                            variant="outlined"
                            fullWidth
                            startIcon={<IconHome size={18} />}
                            onClick={() => handleSelectRoom(room)}
                          >
                            Select This Room
                          </Button>
                        )}
                      </Stack>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            )}

            {selectedRoom && (
              <Box sx={{ mt: 3 }}>
                <Divider sx={{ mb: 2 }} />
                <Typography variant="h6" gutterBottom>Request Room Change</Typography>
                <Stack spacing={2}>
                  <TextField
                    label="Reason for Room Change"
                    multiline
                    rows={4}
                    fullWidth
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="Please provide a detailed reason for requesting this room change..."
                    required
                  />
                  <Button
                    variant="contained"
                    size="large"
                    fullWidth
                    onClick={handleSubmitRequest}
                    disabled={submitting || !reason.trim()}
                    startIcon={submitting ? <CircularProgress size={20} /> : <IconArrowRight size={18} />}
                  >
                    {submitting ? 'Submitting...' : 'Submit Room Change Request'}
                  </Button>
                </Stack>
              </Box>
            )}
          </PresentationCard>
        )}

        {/* Request History */}
        {requestHistory.length > 0 && (
          <PresentationCard title="Request History">
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell><strong>From</strong></TableCell>
                    <TableCell><strong>To</strong></TableCell>
                    <TableCell><strong>Date</strong></TableCell>
                    <TableCell><strong>Status</strong></TableCell>
                    <TableCell><strong>Reason</strong></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {requestHistory.map((request) => (
                    <TableRow key={request._id}>
                      <TableCell>{request.currentRoom?.roomNumber || 'N/A'}</TableCell>
                      <TableCell>{request.requestedRoom?.roomNumber || 'N/A'}</TableCell>
                      <TableCell>
                        {new Date(request.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={request.status.replace('_', ' ').toUpperCase()}
                          color={getStatusColor(request.status)}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" noWrap sx={{ maxWidth: 200 }}>
                          {request.reason}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </PresentationCard>
        )}

        {/* Payment Dialog */}
        <Dialog open={paymentDialogOpen} onClose={() => setPaymentDialogOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Room Upgrade Payment Required</DialogTitle>
          <DialogContent>
            <Stack spacing={2}>
              <Alert severity="info">
                You are upgrading to a more expensive room. Payment is required before your request can be approved.
              </Alert>
              <Typography variant="h6" align="center">
                Amount to Pay: {formatPrice(paymentAmount)}
              </Typography>
              <Typography variant="body2" color="text.secondary" align="center">
                This payment covers the price difference for the remaining months of the academic year.
              </Typography>
              <Alert severity="warning">
                Please complete the payment to proceed with your room change request. The request will remain pending until payment is completed.
              </Alert>
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setPaymentDialogOpen(false)}>Cancel</Button>
            <Button
              variant="contained"
              onClick={() => {
                // TODO: Integrate with payment gateway
                enqueueSnackbar('Payment integration coming soon. Please contact admin for manual payment.', { variant: 'info' });
                setPaymentDialogOpen(false);
              }}
              startIcon={<IconCreditCard size={18} />}
            >
              Proceed to Payment
            </Button>
          </DialogActions>
        </Dialog>
      </Stack>
    </ComponentsWrapper>
  );
}

