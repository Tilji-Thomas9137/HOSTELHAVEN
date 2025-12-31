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
import TextField from '@mui/material/TextField';
import Alert from '@mui/material/Alert';
import CircularProgress from '@mui/material/CircularProgress';
import Grid from '@mui/material/Grid';
import OutlinedInput from '@mui/material/OutlinedInput';
import FormHelperText from '@mui/material/FormHelperText';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import IconButton from '@mui/material/IconButton';

// @third-party
import { useForm, Controller } from 'react-hook-form';

// @project
import ComponentsWrapper from '@/components/ComponentsWrapper';
import PresentationCard from '@/components/cards/PresentationCard';
import TabPanel from '@/components/TabPanel';
import studentService from '@/services/studentService';
import { useSnackbar } from 'notistack';

// @icons
import { 
  IconArrowRight, 
  IconClock, 
  IconHistory, 
  IconSend,
  IconMapPin,
  IconCalendar,
  IconPhone,
  IconUser,
  IconFileText,
  IconEdit,
  IconX
} from '@tabler/icons-react';

// @components
import FormSection from '@/components/forms/FormSection';
import FormFieldWrapper from '@/components/forms/FormFieldWrapper';

/***************************  OUTPASS PAGE  ***************************/

export default function OutpassPage() {
  const { enqueueSnackbar } = useSnackbar();
  const [value, setValue] = useState(0);
  const [loading, setLoading] = useState(true);
  const [outpassRequests, setOutpassRequests] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [parentInfo, setParentInfo] = useState(null);
  const [updateReturnDateDialogOpen, setUpdateReturnDateDialogOpen] = useState(false);
  const [selectedOutpass, setSelectedOutpass] = useState(null);
  const [newReturnDate, setNewReturnDate] = useState('');
  const [updatingReturnDate, setUpdatingReturnDate] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
    reset,
    setValue: setFormValue,
    watch
  } = useForm({
    mode: 'onBlur',
    reValidateMode: 'onChange',
    defaultValues: {
      purpose: '',
      destination: '',
      departureDate: '',
      departureTime: '',
      expectedReturnDate: '',
      expectedReturnTime: '',
      emergencyContactName: '',
      emergencyContactPhone: ''
    }
  });

  useEffect(() => {
    fetchOutpassRequests();
    fetchParentInfo();
  }, []);

  const fetchParentInfo = async () => {
    try {
      const profile = await studentService.getProfile();
      if (profile?.parent) {
        setParentInfo(profile.parent);
        // Auto-fill emergency contact from parent
        setFormValue('emergencyContactName', profile.parent.name || '');
        setFormValue('emergencyContactPhone', profile.parent.phone || '');
      }
    } catch (err) {
      console.error('Failed to fetch parent info:', err);
      // Don't show error to user, just log it
    }
  };

  const fetchOutpassRequests = async () => {
    try {
      setLoading(true);
      const data = await studentService.getOutingRequests();
      setOutpassRequests(data || []);
    } catch (err) {
      enqueueSnackbar(err.response?.data?.message || 'Failed to load outpass requests', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (event, newValue) => {
    setValue(newValue);
  };

  const onSubmit = async (data) => {
    try {
      setSubmitting(true);
      
      // Validate dates
      const departureDate = new Date(`${data.departureDate}T${data.departureTime || '10:00'}`);
      const returnDate = new Date(`${data.expectedReturnDate}T${data.expectedReturnTime || '18:00'}`);
      
      if (departureDate >= returnDate) {
        enqueueSnackbar('Return date must be after departure date', { variant: 'error' });
        setSubmitting(false);
        return;
      }

      if (departureDate < new Date()) {
        enqueueSnackbar('Departure date cannot be in the past', { variant: 'error' });
        setSubmitting(false);
        return;
      }
      
      await studentService.requestOuting({
        purpose: data.purpose.trim(),
        destination: data.destination.trim(),
        departureDate: departureDate.toISOString(),
        expectedReturnDate: returnDate.toISOString(),
        emergencyContact: {
          name: data.emergencyContactName.trim(),
          phone: data.emergencyContactPhone.trim()
        }
      });
      
      enqueueSnackbar('Outpass request submitted successfully', { variant: 'success' });
      reset({
        purpose: '',
        destination: '',
        departureDate: '',
        departureTime: '',
        expectedReturnDate: '',
        expectedReturnTime: '',
        emergencyContactName: parentInfo?.name || '',
        emergencyContactPhone: parentInfo?.phone || ''
      });
      fetchOutpassRequests();
      setValue(1); // Switch to status tab
    } catch (err) {
      enqueueSnackbar(err.response?.data?.message || 'Failed to submit outpass request', { variant: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  // Active requests include both pending (awaiting approval) and approved (with QR)
  const activeRequests = outpassRequests.filter(r => ['pending', 'approved'].includes(r.status));
  const allRequests = outpassRequests.sort((a, b) => new Date(b.departureDate || b.createdAt) - new Date(a.departureDate || a.createdAt));

  const formatDateTime = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  return (
    <ComponentsWrapper title="Outpass / Outing">
      <Box sx={{ width: '100%' }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
          <Tabs value={value} onChange={handleChange}>
            <Tab label="Request Outpass" icon={<IconSend size={18} />} iconPosition="start" />
            <Tab label="Outpass Status" icon={<IconClock size={18} />} iconPosition="start" />
            <Tab label="Outpass History" icon={<IconHistory size={18} />} iconPosition="start" />
          </Tabs>
        </Box>

        {/* Request Outpass Tab */}
        <TabPanel value={value} index={0}>
          <PresentationCard>
            <Stack spacing={4}>
              <Alert 
                severity="info" 
                icon={<IconArrowRight size={20} />}
                sx={{ 
                  borderRadius: 2,
                  '& .MuiAlert-message': { fontWeight: 500 }
                }}
              >
                Fill in the details to request an outpass. Requests are subject to approval.
              </Alert>
              
              <form onSubmit={handleSubmit(onSubmit)} autoComplete="off">
                <FormSection 
                  title="Trip Information" 
                  icon={IconFileText}
                  divider={false}
                >
                  <Stack spacing={3}>
                    <FormFieldWrapper
                      label="Purpose"
                      required
                      error={errors.purpose?.message}
                      icon={IconFileText}
                    >
                      <OutlinedInput
                        {...register('purpose', {
                          required: 'Purpose is required',
                          minLength: { value: 3, message: 'Purpose must be at least 3 characters' },
                          maxLength: { value: 200, message: 'Purpose cannot exceed 200 characters' },
                          onBlur: (e) => { e.target.value = e.target.value.trim(); }
                        })}
                        placeholder="e.g., Family Visit, Medical Appointment"
                        fullWidth
                        error={Boolean(errors.purpose)}
                      />
                      {errors.purpose && (
                        <FormHelperText error>{errors.purpose.message}</FormHelperText>
                      )}
                    </FormFieldWrapper>

                    <FormFieldWrapper
                      label="Destination"
                      required
                      error={errors.destination?.message}
                      icon={IconMapPin}
                    >
                      <OutlinedInput
                        {...register('destination', {
                          required: 'Destination is required',
                          minLength: { value: 2, message: 'Destination must be at least 2 characters' },
                          maxLength: { value: 200, message: 'Destination cannot exceed 200 characters' },
                          onBlur: (e) => { e.target.value = e.target.value.trim(); }
                        })}
                        placeholder="Where are you going?"
                        fullWidth
                        error={Boolean(errors.destination)}
                      />
                      {errors.destination && (
                        <FormHelperText error>{errors.destination.message}</FormHelperText>
                      )}
                    </FormFieldWrapper>
                  </Stack>
                </FormSection>

                <FormSection 
                  title="Departure Details" 
                  icon={IconCalendar}
                >
                  <Stack spacing={3}>
                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={6}>
                        <FormFieldWrapper
                          label="Departure Date"
                          required
                          error={errors.departureDate?.message}
                          icon={IconCalendar}
                        >
                          <TextField
                            {...register('departureDate', {
                              required: 'Departure date is required',
                              validate: (value) => {
                                if (!value) return 'Departure date is required';
                                const date = new Date(value);
                                const today = new Date();
                                today.setHours(0, 0, 0, 0);
                                if (date < today) {
                                  return 'Departure date cannot be in the past';
                                }
                                return true;
                              }
                            })}
                            type="date"
                            fullWidth
                            InputLabelProps={{ shrink: true }}
                            error={Boolean(errors.departureDate)}
                            inputProps={{
                              min: new Date().toISOString().split('T')[0]
                            }}
                          />
                          {errors.departureDate && (
                            <FormHelperText error>{errors.departureDate.message}</FormHelperText>
                          )}
                        </FormFieldWrapper>
                      </Grid>

                      <Grid item xs={12} sm={6}>
                        <FormFieldWrapper
                          label="Departure Time"
                          error={errors.departureTime?.message}
                          icon={IconClock}
                        >
                          <TextField
                            {...register('departureTime')}
                            type="time"
                            fullWidth
                            InputLabelProps={{ shrink: true }}
                            error={Boolean(errors.departureTime)}
                          />
                          {errors.departureTime && (
                            <FormHelperText error>{errors.departureTime.message}</FormHelperText>
                          )}
                        </FormFieldWrapper>
                      </Grid>
                    </Grid>
                  </Stack>
                </FormSection>

                <FormSection 
                  title="Return Details" 
                  icon={IconCalendar}
                >
                  <Stack spacing={3}>
                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={6}>
                        <FormFieldWrapper
                          label="Expected Return Date"
                          required
                          error={errors.expectedReturnDate?.message}
                          icon={IconCalendar}
                        >
                          <TextField
                            {...register('expectedReturnDate', {
                              required: 'Expected return date is required',
                              validate: (value) => {
                                if (!value) return 'Expected return date is required';
                                const returnDate = new Date(value);
                                const departureDate = watch('departureDate');
                                if (departureDate) {
                                  const depDate = new Date(departureDate);
                                  if (returnDate <= depDate) {
                                    return 'Return date must be after departure date';
                                  }
                                }
                                return true;
                              }
                            })}
                            type="date"
                            fullWidth
                            InputLabelProps={{ shrink: true }}
                            error={Boolean(errors.expectedReturnDate)}
                            inputProps={{
                              min: watch('departureDate') || new Date().toISOString().split('T')[0]
                            }}
                          />
                          {errors.expectedReturnDate && (
                            <FormHelperText error>{errors.expectedReturnDate.message}</FormHelperText>
                          )}
                        </FormFieldWrapper>
                      </Grid>

                      <Grid item xs={12} sm={6}>
                        <FormFieldWrapper
                          label="Expected Return Time"
                          error={errors.expectedReturnTime?.message}
                          icon={IconClock}
                        >
                          <TextField
                            {...register('expectedReturnTime')}
                            type="time"
                            fullWidth
                            InputLabelProps={{ shrink: true }}
                            error={Boolean(errors.expectedReturnTime)}
                          />
                          {errors.expectedReturnTime && (
                            <FormHelperText error>{errors.expectedReturnTime.message}</FormHelperText>
                          )}
                        </FormFieldWrapper>
                      </Grid>
                    </Grid>
                  </Stack>
                </FormSection>

                <FormSection 
                  title="Emergency Contact" 
                  icon={IconPhone}
                >
                  {parentInfo && (
                    <Alert severity="info" sx={{ mb: 2 }}>
                      Emergency contact details have been auto-filled from your parent information. You can modify them if needed.
                    </Alert>
                  )}
                  <Stack spacing={3}>
                    <FormFieldWrapper
                      label="Emergency Contact Name"
                      required
                      error={errors.emergencyContactName?.message}
                      icon={IconUser}
                    >
                      <OutlinedInput
                        {...register('emergencyContactName', {
                          required: 'Emergency contact name is required',
                          minLength: { value: 2, message: 'Name must be at least 2 characters' },
                          maxLength: { value: 100, message: 'Name cannot exceed 100 characters' },
                          pattern: {
                            value: /^[a-zA-Z\s'-]+$/,
                            message: 'Name can only contain letters, spaces, hyphens, and apostrophes'
                          },
                          onBlur: (e) => { e.target.value = e.target.value.trim(); }
                        })}
                        placeholder="Emergency contact person name"
                        fullWidth
                        error={Boolean(errors.emergencyContactName)}
                      />
                      {errors.emergencyContactName && (
                        <FormHelperText error>{errors.emergencyContactName.message}</FormHelperText>
                      )}
                    </FormFieldWrapper>

                    <FormFieldWrapper
                      label="Emergency Contact Phone"
                      required
                      error={errors.emergencyContactPhone?.message}
                      icon={IconPhone}
                    >
                      <OutlinedInput
                        {...register('emergencyContactPhone', {
                          required: 'Emergency contact phone is required',
                          pattern: {
                            value: /^[0-9]{10}$/,
                            message: 'Phone number must be exactly 10 digits'
                          },
                          validate: (value) => {
                            if (!value) return 'Emergency contact phone is required';
                            const trimmed = value.trim();
                            if (!/^[0-9]+$/.test(trimmed)) {
                              return 'Phone number must contain only digits';
                            }
                            if (trimmed.length !== 10) {
                              return 'Phone number must be exactly 10 digits';
                            }
                            return true;
                          },
                          onBlur: (e) => { e.target.value = e.target.value.trim(); }
                        })}
                        placeholder="Emergency contact phone number"
                        fullWidth
                        error={Boolean(errors.emergencyContactPhone)}
                        inputProps={{ maxLength: 10 }}
                      />
                      {errors.emergencyContactPhone && (
                        <FormHelperText error>{errors.emergencyContactPhone.message}</FormHelperText>
                      )}
                    </FormFieldWrapper>
                  </Stack>
                </FormSection>

                <Button 
                  type="submit"
                  variant="contained" 
                  size="large" 
                  fullWidth 
                  startIcon={submitting ? <CircularProgress size={20} color="inherit" /> : <IconSend size={20} />}
                  disabled={submitting}
                  sx={{
                    py: 1.75,
                    borderRadius: 2,
                    textTransform: 'none',
                    fontWeight: 600,
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    boxShadow: '0 4px 15px 0 rgba(102, 126, 234, 0.4)',
                    '&:hover': {
                      background: 'linear-gradient(135deg, #764ba2 0%, #667eea 100%)',
                      boxShadow: '0 6px 20px 0 rgba(102, 126, 234, 0.6)',
                      transform: 'translateY(-2px)',
                      transition: 'all 0.2s'
                    },
                    '&:disabled': {
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      opacity: 0.6
                    }
                  }}
                >
                  {submitting ? 'Submitting...' : 'Submit Request'}
                </Button>
              </form>
            </Stack>
          </PresentationCard>
        </TabPanel>

        {/* Outpass Status Tab */}
        <TabPanel value={value} index={1}>
          <PresentationCard>
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                <CircularProgress />
              </Box>
            ) : activeRequests.length === 0 ? (
              <Alert severity="info">
                No active outpass requests
              </Alert>
            ) : (
              <Stack spacing={3}>
                {activeRequests.map((outpass) => (
                  <Paper key={outpass._id || outpass.id} variant="outlined" sx={{ p: 3 }}>
                    <Stack spacing={2}>
                      <Stack direction="row" justifyContent="space-between" alignItems="flex-start" flexWrap="wrap" gap={2}>
                        <Stack spacing={1}>
                          <Typography variant="h6">{outpass.purpose}</Typography>
                          <Typography variant="body2" color="text.secondary">
                            Destination: {outpass.destination}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Departure: {formatDateTime(outpass.departureDate)}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Expected Return: {formatDateTime(outpass.expectedReturnDate)}
                          </Typography>
                        </Stack>
                        <Chip
                          label={outpass.status}
                          color={
                            outpass.status === 'approved' ? 'success' :
                            outpass.status === 'pending' ? 'warning' :
                            outpass.status === 'rejected' ? 'error' : 'default'
                          }
                          size="medium"
                        />
                      </Stack>
                      
                      {outpass.status === 'approved' && outpass.qrCode && (
                        <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.50', borderRadius: 2 }}>
                          <Alert severity="success" sx={{ mb: 2 }}>
                            Your outpass has been approved! Show this QR code to staff at the gate to exit.
                          </Alert>
                          <Stack spacing={2} alignItems="center">
                            <Typography variant="subtitle2">Outpass QR Code</Typography>
                            <Box
                              component="img"
                              src={outpass.qrCode}
                              alt="Outpass QR Code"
                              sx={{
                                width: 250,
                                height: 250,
                                border: 2,
                                borderColor: 'divider',
                                borderRadius: 2,
                                p: 1,
                                bgcolor: 'white',
                              }}
                            />
                            <Typography variant="caption" color="text.secondary" textAlign="center">
                              {outpass.exitTime 
                                ? 'Present this QR code to staff when returning to the hostel'
                                : 'Present this QR code to staff when leaving the hostel'}
                            </Typography>
                            {outpass.exitTime && (
                              <Alert severity="success" sx={{ mt: 1 }}>
                                <Typography variant="body2">
                                  <strong>Exit Time:</strong> {formatDateTime(outpass.exitTime)}
                                </Typography>
                              </Alert>
                            )}
                            {outpass.returnTime && (
                              <Alert severity="info" sx={{ mt: 1 }}>
                                <Typography variant="body2">
                                  <strong>Return Time:</strong> {formatDateTime(outpass.returnTime)}
                                </Typography>
                              </Alert>
                            )}
                            {outpass.exitTime && !outpass.returnTime && (
                              <Alert severity="warning" sx={{ mt: 1 }}>
                                You are currently outside the hostel. Scan your QR code when returning.
                              </Alert>
                            )}
                            {outpass.status === 'approved' && !outpass.returnTime && (
                              <Button
                                variant="outlined"
                                size="small"
                                startIcon={<IconEdit size={16} />}
                                onClick={() => {
                                  setSelectedOutpass(outpass);
                                  setNewReturnDate(outpass.expectedReturnDate ? new Date(outpass.expectedReturnDate).toISOString().split('T')[0] : '');
                                  setUpdateReturnDateDialogOpen(true);
                                }}
                                sx={{ mt: 1 }}
                              >
                                Update Return Date
                              </Button>
                            )}
                          </Stack>
                        </Box>
                      )}
                    </Stack>
                  </Paper>
                ))}
              </Stack>
            )}
          </PresentationCard>
        </TabPanel>

        {/* Outpass History Tab */}
        <TabPanel value={value} index={2}>
          <PresentationCard>
            <TableContainer component={Paper} elevation={0} sx={{ border: 1, borderColor: 'divider', borderRadius: 2 }}>
              <Table>
                <TableHead>
                  <TableRow sx={{ bgcolor: 'grey.50' }}>
                    <TableCell><strong>Date</strong></TableCell>
                    <TableCell><strong>Reason</strong></TableCell>
                    <TableCell><strong>Exit Time</strong></TableCell>
                    <TableCell><strong>Return Time</strong></TableCell>
                    <TableCell><strong>Status</strong></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={5} align="center">
                        <CircularProgress sx={{ py: 2 }} />
                      </TableCell>
                    </TableRow>
                  ) : allRequests.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} align="center">
                        <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
                          No outpass history
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    allRequests.map((outpass) => (
                      <TableRow key={outpass._id || outpass.id} hover>
                        <TableCell>{formatDateTime(outpass.departureDate)}</TableCell>
                        <TableCell>{outpass.purpose}</TableCell>
                        <TableCell>{formatDateTime(outpass.departureDate)}</TableCell>
                        <TableCell>{formatDateTime(outpass.actualReturnDate || outpass.expectedReturnDate)}</TableCell>
                        <TableCell>
                          <Chip
                            label={outpass.status}
                            color={
                              outpass.status === 'approved' || outpass.status === 'completed' ? 'success' :
                              outpass.status === 'pending' ? 'warning' :
                              outpass.status === 'rejected' ? 'error' : 'default'
                            }
                            size="small"
                          />
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </PresentationCard>
        </TabPanel>
      </Box>

      {/* Update Return Date Dialog */}
      <Dialog
        open={updateReturnDateDialogOpen}
        onClose={() => setUpdateReturnDateDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Typography variant="h6">Update Return Date</Typography>
            <IconButton size="small" onClick={() => setUpdateReturnDateDialogOpen(false)}>
              <IconX size={18} />
            </IconButton>
          </Stack>
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <Alert severity="info">
              Update your expected return date. This will notify the admin and your parent.
            </Alert>
            <TextField
              fullWidth
              label="New Expected Return Date"
              type="date"
              value={newReturnDate}
              onChange={(e) => setNewReturnDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
              inputProps={{
                min: selectedOutpass?.departureDate ? new Date(selectedOutpass.departureDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]
              }}
            />
            {selectedOutpass && (
              <Typography variant="body2" color="text.secondary">
                Current expected return: {formatDateTime(selectedOutpass.expectedReturnDate)}
              </Typography>
            )}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setUpdateReturnDateDialogOpen(false)} disabled={updatingReturnDate}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={async () => {
              if (!newReturnDate) {
                enqueueSnackbar('Please select a return date', { variant: 'warning' });
                return;
              }
              if (selectedOutpass?.departureDate && new Date(newReturnDate) <= new Date(selectedOutpass.departureDate)) {
                enqueueSnackbar('Return date must be after departure date', { variant: 'error' });
                return;
              }
              try {
                setUpdatingReturnDate(true);
                await studentService.updateOutingReturnDate(selectedOutpass._id, newReturnDate);
                enqueueSnackbar('Return date updated successfully', { variant: 'success' });
                setUpdateReturnDateDialogOpen(false);
                setSelectedOutpass(null);
                setNewReturnDate('');
                await fetchOutpassRequests();
              } catch (err) {
                enqueueSnackbar(err.response?.data?.message || 'Failed to update return date', { variant: 'error' });
              } finally {
                setUpdatingReturnDate(false);
              }
            }}
            disabled={updatingReturnDate || !newReturnDate}
            startIcon={updatingReturnDate ? <CircularProgress size={18} /> : <IconEdit size={18} />}
          >
            {updatingReturnDate ? 'Updating...' : 'Update'}
          </Button>
        </DialogActions>
      </Dialog>
    </ComponentsWrapper>
  );
}

