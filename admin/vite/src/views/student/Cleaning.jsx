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
import Card from '@mui/material/Card';
import Grid from '@mui/material/Grid';
import CircularProgress from '@mui/material/CircularProgress';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import { useTheme } from '@mui/material/styles';
import { BarChart } from '@mui/x-charts/BarChart';

// @project
import ComponentsWrapper from '@/components/ComponentsWrapper';
import PresentationCard from '@/components/cards/PresentationCard';
import TabPanel from '@/components/TabPanel';
import studentService from '@/services/studentService';
import { useSnackbar } from 'notistack';

// @icons
import { IconCalendar, IconFileText, IconClock, IconCheck, IconX, IconUpload, IconBrush } from '@tabler/icons-react';

/***************************  CLEANING PAGE  ***************************/

export default function CleaningPage() {
  const theme = useTheme();
  const { enqueueSnackbar } = useSnackbar();
  const [value, setValue] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingSchedule, setLoadingSchedule] = useState(true);
  const [cleaningRequests, setCleaningRequests] = useState([]);
  const [cleaningSchedule, setCleaningSchedule] = useState([]);
  const [nextCleaning, setNextCleaning] = useState(null);
  const [cleaningFrequencyData, setCleaningFrequencyData] = useState({
    weeks: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
    cleaningCount: [0, 0, 0, 0]
  });
  const [submitting, setSubmitting] = useState(false);
  const [studentDetails, setStudentDetails] = useState(null);
  const [cleaningForm, setCleaningForm] = useState({
    requestType: '',
    urgency: 'normal',
    preferredDate: '',
    preferredTimeSlot: '',
    description: ''
  });
  const [attachments, setAttachments] = useState([]);

  useEffect(() => {
    fetchStudentDetails();
    if (value === 0) {
      fetchCleaningSchedule();
      fetchCleaningFrequency();
    } else if (value === 2) {
      fetchCleaningRequests();
    }
  }, [value]);

  // Real-time updates: refresh data every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      if (value === 0) {
        fetchCleaningSchedule();
        fetchCleaningFrequency();
      } else if (value === 2) {
        fetchCleaningRequests();
      }
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, [value]);

  const fetchStudentDetails = async () => {
    try {
      const data = await studentService.getProfile();
      setStudentDetails(data);
    } catch (err) {
      console.error('Failed to fetch student details:', err);
      // Don't show error snackbar as this is auto-called
    }
  };

  const fetchCleaningRequests = async () => {
    try {
      setLoading(true);
      const data = await studentService.getCleaningRequests();
      setCleaningRequests(data || []);
    } catch (err) {
      enqueueSnackbar(err.response?.data?.message || 'Failed to load cleaning requests', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const fetchCleaningSchedule = async () => {
    try {
      setLoadingSchedule(true);
      const data = await studentService.getCleaningSchedule();
      setCleaningSchedule(data.schedule || []);
      setNextCleaning(data.nextCleaning || null);
    } catch (err) {
      console.error('Failed to load cleaning schedule:', err);
      // Don't show error snackbar for schedule as it's auto-refreshing
    } finally {
      setLoadingSchedule(false);
    }
  };

  const fetchCleaningFrequency = async () => {
    try {
      const data = await studentService.getCleaningFrequency();
      if (data && data.weeks && data.cleaningCount) {
        setCleaningFrequencyData(data);
      }
    } catch (err) {
      console.error('Failed to load cleaning frequency:', err);
      // Don't show error snackbar for frequency as it's auto-refreshing
    }
  };

  const handleChange = (event, newValue) => {
    setValue(newValue);
  };

  const handleSubmitCleaningRequest = async () => {
    if (!cleaningForm.requestType || !cleaningForm.preferredDate || !cleaningForm.preferredTimeSlot) {
      enqueueSnackbar('Please fill in all required fields (Request Type, Preferred Date, and Time Slot)', { variant: 'warning' });
      return;
    }

    // Validate preferred date is not in the past
    const preferredDateObj = new Date(cleaningForm.preferredDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (preferredDateObj < today) {
      enqueueSnackbar('Preferred date cannot be in the past', { variant: 'warning' });
      return;
    }

    try {
      setSubmitting(true);
      
      // Format attachments - if files are selected, we need to handle them
      // For now, send empty array as file upload needs backend support
      const formattedAttachments = attachments.map(att => ({
        url: att.url || '',
        filename: att.filename || att.name || 'image.jpg'
      }));

      // Ensure date is in ISO format
      const preferredDateISO = cleaningForm.preferredDate 
        ? new Date(cleaningForm.preferredDate).toISOString().split('T')[0]
        : cleaningForm.preferredDate;

      const requestData = {
        requestType: cleaningForm.requestType,
        urgency: cleaningForm.urgency || 'normal',
        preferredDate: preferredDateISO,
        preferredTimeSlot: cleaningForm.preferredTimeSlot,
        description: cleaningForm.description.trim() || '',
        attachments: formattedAttachments
      };

      await studentService.submitCleaningRequest(requestData);
      enqueueSnackbar('Cleaning request submitted successfully', { variant: 'success' });
      setCleaningForm({
        requestType: '',
        urgency: 'normal',
        preferredDate: '',
        preferredTimeSlot: '',
        description: ''
      });
      setAttachments([]);
      fetchCleaningRequests();
      fetchCleaningSchedule(); // Refresh schedule after new request
      fetchCleaningFrequency(); // Refresh frequency after new request
      setValue(2); // Switch to status tab
    } catch (err) {
      console.error('Cleaning request submission error:', err);
      const errorMessage = err.response?.data?.message || err.message || 'Failed to submit cleaning request';
      enqueueSnackbar(errorMessage, { variant: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 5) {
      enqueueSnackbar('Maximum 5 images allowed', { variant: 'warning' });
      return;
    }
    
    const validFiles = files.filter(file => {
      if (file.size > 5 * 1024 * 1024) {
        enqueueSnackbar(`${file.name} exceeds 5MB limit`, { variant: 'warning' });
        return false;
      }
      return true;
    });

    // Store file objects for now - in production, these would be uploaded to a storage service first
    // For now, we'll send empty attachments array and handle file upload separately if needed
    setAttachments(validFiles.map(file => ({ 
      filename: file.name, 
      url: '',
      file: file // Keep file reference for potential future upload
    })));
  };


  return (
    <ComponentsWrapper title="Cleaning">
      <Box sx={{ width: '100%' }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
          <Tabs value={value} onChange={handleChange}>
            <Tab label="Cleaning Schedule" icon={<IconCalendar size={18} />} iconPosition="start" />
            <Tab label="Cleaning Request" icon={<IconFileText size={18} />} iconPosition="start" />
            <Tab label="Cleaning Request Status" icon={<IconClock size={18} />} iconPosition="start" />
          </Tabs>
        </Box>

        {/* Cleaning Schedule Tab */}
        <TabPanel value={value} index={0}>
          <PresentationCard>
            <Stack spacing={3}>
              {/* Cleaning Frequency Chart */}
              <Card variant="outlined" sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>Cleaning Frequency</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Weekly count of cleaning activities
                </Typography>
                <Box sx={{ width: '100%', height: 300 }}>
                  <BarChart
                    xAxis={[
                      {
                        scaleType: 'band',
                        data: cleaningFrequencyData.weeks,
                        label: 'Weeks'
                      }
                    ]}
                    series={[
                      {
                        data: cleaningFrequencyData.cleaningCount,
                        label: 'Cleanings',
                        color: theme.palette.primary.main
                      }
                    ]}
                    height={300}
                    margin={{ top: 20, right: 20, bottom: 40, left: 40 }}
                  />
                </Box>
              </Card>

              {/* Upcoming Cleaning */}
              <Card variant="outlined" sx={{ p: 2, bgcolor: 'info.lighter' }}>
                <Stack spacing={1}>
                  <Typography variant="subtitle2" fontWeight={600}>Next Cleaning</Typography>
                  {loadingSchedule ? (
                    <CircularProgress size={20} />
                  ) : nextCleaning ? (
                    <>
                      <Typography variant="body2">
                        <strong>Date:</strong> {nextCleaning.date || 'N/A'}
                      </Typography>
                      <Typography variant="body2">
                        <strong>Time:</strong> {nextCleaning.time || 'N/A'}
                      </Typography>
                      <Typography variant="body2">
                        <strong>Task:</strong> {nextCleaning.task || 'N/A'}
                      </Typography>
                      <Typography variant="body2">
                        <strong>Assigned:</strong> {nextCleaning.assigned || 'N/A'}
                      </Typography>
                    </>
                  ) : (
                    <Typography variant="body2" color="text.secondary">
                      No upcoming cleaning scheduled
                    </Typography>
                  )}
                </Stack>
              </Card>

              {/* Weekly Schedule Table */}
              <Typography variant="h6">Weekly Cleaning Schedule</Typography>
              {loadingSchedule ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                  <CircularProgress />
                </Box>
              ) : (
                <TableContainer component={Paper} elevation={0} sx={{ border: 1, borderColor: 'divider', borderRadius: 2 }}>
                  <Table>
                    <TableHead>
                      <TableRow sx={{ bgcolor: 'grey.50' }}>
                        <TableCell><strong>Day</strong></TableCell>
                        <TableCell><strong>Date</strong></TableCell>
                        <TableCell><strong>Time</strong></TableCell>
                        <TableCell><strong>Task</strong></TableCell>
                        <TableCell><strong>Assigned Staff</strong></TableCell>
                        <TableCell><strong>Status</strong></TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {cleaningSchedule.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} align="center">
                            <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
                              No cleaning schedule available
                            </Typography>
                          </TableCell>
                        </TableRow>
                      ) : (
                        cleaningSchedule.map((schedule) => (
                          <TableRow key={schedule.id} hover>
                            <TableCell>{schedule.day}</TableCell>
                            <TableCell>{schedule.date}</TableCell>
                            <TableCell>{schedule.time}</TableCell>
                            <TableCell>{schedule.task}</TableCell>
                            <TableCell>{schedule.assigned}</TableCell>
                            <TableCell>
                              <Chip
                                label={schedule.status}
                                color={schedule.status === 'Completed' ? 'success' : schedule.status === 'In Progress' ? 'info' : 'warning'}
                                size="small"
                                icon={schedule.status === 'Completed' ? <IconCheck size={16} /> : <IconX size={16} />}
                              />
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </Stack>
          </PresentationCard>
        </TabPanel>

        {/* Cleaning Request Tab */}
        <TabPanel value={value} index={1}>
          <PresentationCard>
            <Stack spacing={3}>
              <Alert severity="info">
                Request extra cleaning service if your room needs immediate attention. Your request will be reviewed and assigned to staff.
              </Alert>

              {/* Student Details (Read-only) */}
              <Card variant="outlined" sx={{ p: 2, bgcolor: 'grey.50' }}>
                <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 600 }}>Student Information</Typography>
                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, md: 4 }}>
                    <TextField
                      fullWidth
                      label="Name"
                      value={studentDetails?.student?.name || 'Loading...'}
                      disabled
                      variant="outlined"
                    />
                  </Grid>
                  <Grid size={{ xs: 12, md: 4 }}>
                    <TextField
                      fullWidth
                      label="Student ID"
                      value={studentDetails?.student?.studentId || studentDetails?.student?.admissionNumber || 'Loading...'}
                      disabled
                      variant="outlined"
                    />
                  </Grid>
                  <Grid size={{ xs: 12, md: 4 }}>
                    <TextField
                      fullWidth
                      label="Room Number"
                      value={studentDetails?.student?.room?.roomNumber || 'N/A'}
                      disabled
                      variant="outlined"
                    />
                  </Grid>
                </Grid>
              </Card>

              {/* Request Type */}
              <FormControl fullWidth required>
                <InputLabel>Request Type *</InputLabel>
                <Select
                  value={cleaningForm.requestType}
                  label="Request Type *"
                  onChange={(e) => setCleaningForm({ ...cleaningForm, requestType: e.target.value })}
                >
                  <MenuItem value="room_cleaning">Room Cleaning</MenuItem>
                  <MenuItem value="bathroom_cleaning">Bathroom Cleaning</MenuItem>
                  <MenuItem value="common_area_cleaning">Common Area Cleaning</MenuItem>
                </Select>
              </FormControl>

              {/* Urgency Level */}
              <FormControl fullWidth required>
                <InputLabel>Urgency Level *</InputLabel>
                <Select
                  value={cleaningForm.urgency}
                  label="Urgency Level *"
                  onChange={(e) => setCleaningForm({ ...cleaningForm, urgency: e.target.value })}
                >
                  <MenuItem value="normal">Normal</MenuItem>
                  <MenuItem value="high">High</MenuItem>
                </Select>
              </FormControl>

              <Grid container spacing={2}>
                {/* Preferred Date */}
                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField
                    fullWidth
                    label="Preferred Date *"
                    type="date"
                    value={cleaningForm.preferredDate}
                    onChange={(e) => setCleaningForm({ ...cleaningForm, preferredDate: e.target.value })}
                    required
                    slotProps={{
                      inputLabel: {
                        shrink: true
                      }
                    }}
                    inputProps={{
                      min: new Date().toISOString().split('T')[0]
                    }}
                  />
                </Grid>

                {/* Preferred Time Slot */}
                <Grid size={{ xs: 12, md: 6 }}>
                  <FormControl fullWidth required>
                    <InputLabel>Preferred Time Slot *</InputLabel>
                    <Select
                      value={cleaningForm.preferredTimeSlot}
                      label="Preferred Time Slot *"
                      onChange={(e) => setCleaningForm({ ...cleaningForm, preferredTimeSlot: e.target.value })}
                    >
                      <MenuItem value="morning">Morning</MenuItem>
                      <MenuItem value="afternoon">Afternoon</MenuItem>
                      <MenuItem value="evening">Evening</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>

              {/* Description */}
              <TextField
                fullWidth
                label="Description (Optional)"
                multiline
                rows={4}
                value={cleaningForm.description}
                onChange={(e) => setCleaningForm({ ...cleaningForm, description: e.target.value })}
                placeholder="Please provide any additional details about the cleaning requirement..."
                helperText="Be specific about the cleaning requirement"
              />

              {/* Photo Upload */}
              <Card variant="outlined" sx={{ p: 2 }}>
                <Stack spacing={2}>
                  <Typography variant="subtitle2">Upload Image (Optional)</Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    Upload photos to show the condition of the room
                  </Typography>
                  <Button
                    variant="outlined"
                    startIcon={<IconUpload size={18} />}
                    component="label"
                    fullWidth
                  >
                    Choose Image
                    <input
                      type="file"
                      hidden
                      accept="image/*"
                      multiple
                      onChange={handleFileChange}
                    />
                  </Button>
                  {attachments.length > 0 && (
                    <Typography variant="body2" color="text.secondary">
                      {attachments.length} file(s) selected
                    </Typography>
                  )}
                  <Typography variant="caption" color="text.secondary">
                    You can upload multiple images (Max 5 images, 5MB each)
                  </Typography>
                </Stack>
              </Card>

              <Button 
                variant="contained" 
                size="large" 
                fullWidth 
                startIcon={<IconFileText size={18} />}
                onClick={handleSubmitCleaningRequest}
                disabled={submitting || !cleaningForm.requestType || !cleaningForm.preferredDate || !cleaningForm.preferredTimeSlot}
              >
                {submitting ? 'Submitting...' : 'Submit Request'}
              </Button>
            </Stack>
          </PresentationCard>
        </TabPanel>

        {/* Cleaning Request Status Tab */}
        <TabPanel value={value} index={2}>
          <PresentationCard>
            <TableContainer component={Paper} elevation={0} sx={{ border: 1, borderColor: 'divider', borderRadius: 2 }}>
              <Table>
                <TableHead>
                  <TableRow sx={{ bgcolor: 'grey.50' }}>
                    <TableCell><strong>Date</strong></TableCell>
                    <TableCell><strong>Reason</strong></TableCell>
                    <TableCell><strong>Status</strong></TableCell>
                    <TableCell><strong>Assigned To</strong></TableCell>
                    <TableCell><strong>Completed Date</strong></TableCell>
                  </TableRow>
                </TableHead>
                      <TableBody>
                        {loading ? (
                          <TableRow>
                            <TableCell colSpan={5} align="center">
                              <CircularProgress sx={{ py: 2 }} />
                            </TableCell>
                          </TableRow>
                        ) : cleaningRequests.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={5} align="center">
                              <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
                                No cleaning requests submitted
                              </Typography>
                            </TableCell>
                          </TableRow>
                        ) : (
                          cleaningRequests.map((request) => {
                            const formatRequestType = (type) => {
                              return type?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'N/A';
                            };
                            return (
                              <TableRow key={request._id || request.id} hover>
                                <TableCell>{new Date(request.createdAt || request.date).toLocaleDateString()}</TableCell>
                                <TableCell>
                                  <Stack spacing={0.5}>
                                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                      {formatRequestType(request.requestType)}
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary">
                                      {request.description || 'No description'}
                                    </Typography>
                                    {request.urgency === 'high' && (
                                      <Chip label="High Priority" size="small" color="error" sx={{ width: 'fit-content' }} />
                                    )}
                                  </Stack>
                                </TableCell>
                                <TableCell>
                                  <Chip
                                    label={request.status === 'pending' ? 'Pending' : request.status === 'assigned' ? 'Assigned' : request.status === 'completed' ? 'Completed' : request.status}
                                    color={
                                      request.status === 'completed' ? 'success' :
                                      request.status === 'assigned' ? 'info' :
                                      'warning'
                                    }
                                    size="small"
                                    icon={
                                      request.status === 'completed' ? <IconCheck size={16} /> :
                                      request.status === 'assigned' ? <IconClock size={16} /> :
                                      <IconClock size={16} />
                                    }
                                  />
                                </TableCell>
                                <TableCell>{request.assignedTo?.name || 'Not Assigned'}</TableCell>
                                <TableCell>
                                  {request.completedAt ? new Date(request.completedAt).toLocaleDateString() : 
                                   request.scheduledDate ? `${new Date(request.scheduledDate).toLocaleDateString()} ${request.scheduledTime || ''}` : 
                                   'N/A'}
                                </TableCell>
                              </TableRow>
                            );
                          })
                        )}
                      </TableBody>
              </Table>
            </TableContainer>
          </PresentationCard>
        </TabPanel>
      </Box>
    </ComponentsWrapper>
  );
}

