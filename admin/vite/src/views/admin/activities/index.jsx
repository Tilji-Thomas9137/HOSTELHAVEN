import { useState, useEffect } from 'react';

// @mui
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Grid from '@mui/material/Grid';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Divider from '@mui/material/Divider';
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import TextField from '@mui/material/TextField';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import IconButton from '@mui/material/IconButton';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';

// @project
import ComponentsWrapper from '@/components/ComponentsWrapper';
import PresentationCard from '@/components/cards/PresentationCard';
import { adminService } from '@/services/adminService';
import { useSnackbar } from 'notistack';

// @icons
import { IconCalendar, IconUsers, IconMapPin, IconUser, IconClock, IconPlus, IconEdit, IconTrash, IconX } from '@tabler/icons-react';

/***************************  ADMIN ACTIVITIES MANAGEMENT PAGE  ***************************/

export default function AdminActivitiesPage() {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedActivity, setSelectedActivity] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [participantsDialogOpen, setParticipantsDialogOpen] = useState(false);
  const [participants, setParticipants] = useState([]);
  const [loadingParticipants, setLoadingParticipants] = useState(false);
  const [tabValue, setTabValue] = useState(0);
  const [statusFilter, setStatusFilter] = useState('all');
  const { enqueueSnackbar } = useSnackbar();

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'Other',
    date: '',
    time: '',
    duration: '',
    location: '',
    organizer: '',
    expectedParticipants: '',
    requirements: '',
    status: 'upcoming'
  });

  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    fetchActivities();
  }, [statusFilter]);

  const fetchActivities = async () => {
    try {
      setLoading(true);
      const params = {};
      if (statusFilter !== 'all') {
        params.status = statusFilter;
      }
      const data = await adminService.getAllActivities(params);
      setActivities(data || []);
    } catch (error) {
      console.error('Error fetching activities:', error);
      enqueueSnackbar(error.response?.data?.message || 'Failed to fetch activities', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const fetchActivityParticipants = async (activityId) => {
    try {
      setLoadingParticipants(true);
      const data = await adminService.getActivityParticipants(activityId);
      setParticipants(data || []);
    } catch (error) {
      console.error('Error fetching participants:', error);
      enqueueSnackbar(error.response?.data?.message || 'Failed to fetch participants', { variant: 'error' });
      setParticipants([]);
    } finally {
      setLoadingParticipants(false);
    }
  };

  const handleOpenCreateDialog = () => {
    setIsEditing(false);
    setFormData({
      title: '',
      description: '',
      category: 'Other',
      date: '',
      time: '',
      duration: '',
      location: '',
      organizer: '',
      expectedParticipants: '',
      requirements: '',
      status: 'upcoming'
    });
    setDialogOpen(true);
  };

  const handleOpenEditDialog = (activity) => {
    setIsEditing(true);
    setSelectedActivity(activity);
    setFormData({
      title: activity.title || '',
      description: activity.description || '',
      category: activity.category || 'Other',
      date: activity.date ? new Date(activity.date).toISOString().split('T')[0] : '',
      time: activity.time || '',
      duration: activity.duration || '',
      location: activity.location || '',
      organizer: activity.organizer || '',
      expectedParticipants: activity.expectedParticipants || '',
      requirements: activity.requirements || '',
      status: activity.status || 'upcoming'
    });
    setDialogOpen(true);
  };

  const handleOpenParticipantsDialog = async (activity) => {
    setSelectedActivity(activity);
    setParticipantsDialogOpen(true);
    await fetchActivityParticipants(activity._id);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setSelectedActivity(null);
    setIsEditing(false);
  };

  const handleCloseParticipantsDialog = () => {
    setParticipantsDialogOpen(false);
    setSelectedActivity(null);
    setParticipants([]);
  };

  const handleSubmit = async () => {
    try {
      if (!formData.title || !formData.description || !formData.date || !formData.time || !formData.location) {
        enqueueSnackbar('Please fill in all required fields', { variant: 'error' });
        return;
      }

      if (isEditing) {
        await adminService.updateActivity(selectedActivity._id, formData);
        enqueueSnackbar('Activity updated successfully', { variant: 'success' });
      } else {
        await adminService.createActivity(formData);
        enqueueSnackbar('Activity created successfully', { variant: 'success' });
      }

      handleCloseDialog();
      fetchActivities();
    } catch (error) {
      console.error('Error saving activity:', error);
      enqueueSnackbar(error.response?.data?.message || 'Failed to save activity', { variant: 'error' });
    }
  };

  const handleDelete = async (activity) => {
    if (!window.confirm(`Are you sure you want to delete "${activity.title}"?`)) {
      return;
    }

    try {
      await adminService.deleteActivity(activity._id);
      enqueueSnackbar('Activity deleted successfully', { variant: 'success' });
      fetchActivities();
    } catch (error) {
      console.error('Error deleting activity:', error);
      enqueueSnackbar(error.response?.data?.message || 'Failed to delete activity', { variant: 'error' });
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'upcoming': return 'info';
      case 'ongoing': return 'warning';
      case 'completed': return 'success';
      case 'cancelled': return 'error';
      default: return 'default';
    }
  };

  const getCategoryColor = (category) => {
    switch (category) {
      case 'Sports': return 'error';
      case 'Cultural': return 'warning';
      case 'Academic': return 'info';
      case 'Community': return 'success';
      case 'Meeting': return 'secondary';
      default: return 'default';
    }
  };

  const filteredActivities = activities.filter(activity => {
    if (tabValue === 0) {
      const activityDate = new Date(activity.date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return activityDate >= today && activity.status !== 'cancelled' && activity.status !== 'completed';
    } else if (tabValue === 1) {
      const activityDate = new Date(activity.date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return activityDate < today || activity.status === 'completed' || activity.status === 'cancelled';
    }
    return true;
  });

  if (loading) {
    return (
      <ComponentsWrapper title="Activities Management">
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
          <CircularProgress />
        </Box>
      </ComponentsWrapper>
    );
  }

  return (
    <ComponentsWrapper title="Activities Management">
      <Stack spacing={3}>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h4">Activities</Typography>
          <Button
            variant="contained"
            startIcon={<IconPlus size={20} />}
            onClick={handleOpenCreateDialog}
          >
            Create Activity
          </Button>
        </Box>

        <Card>
          <Tabs value={tabValue} onChange={(e, newValue) => setTabValue(newValue)}>
            <Tab label="Upcoming" />
            <Tab label="Past" />
          </Tabs>
        </Card>

        {filteredActivities.length === 0 ? (
          <Alert severity="info">
            {tabValue === 0 ? 'No upcoming activities.' : 'No past activities.'}
          </Alert>
        ) : (
          <Grid container spacing={3}>
            {filteredActivities.map((activity) => (
              <Grid key={activity._id} size={12} md={6} lg={4}>
                <Card variant="outlined" sx={{ p: 2, height: '100%' }}>
                  <Stack spacing={2}>
                    <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                      <Typography variant="h6" sx={{ flex: 1 }}>{activity.title}</Typography>
                      <Stack direction="row" spacing={1}>
                        <Chip 
                          label={activity.category} 
                          size="small" 
                          color={getCategoryColor(activity.category)} 
                        />
                        <Chip 
                          label={activity.status} 
                          size="small" 
                          color={getStatusColor(activity.status)} 
                        />
                      </Stack>
                    </Stack>

                    <Stack spacing={0.5}>
                      <Typography variant="body2" color="text.secondary">
                        <IconCalendar size={16} style={{ verticalAlign: 'middle', marginRight: 4 }} />
                        {formatDate(activity.date)} at {activity.time}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        <IconMapPin size={16} style={{ verticalAlign: 'middle', marginRight: 4 }} />
                        {activity.location}
                      </Typography>
                      {activity.expectedParticipants > 0 && (
                        <Typography variant="body2" color="text.secondary">
                          <IconUsers size={16} style={{ verticalAlign: 'middle', marginRight: 4 }} />
                          {activity.expectedParticipants} expected participants
                        </Typography>
                      )}
                    </Stack>

                    <Stack direction="row" spacing={1}>
                      <Button
                        variant="outlined"
                        size="small"
                        startIcon={<IconUsers size={16} />}
                        onClick={() => handleOpenParticipantsDialog(activity)}
                        sx={{ flex: 1 }}
                      >
                        Participants
                      </Button>
                      <Button
                        variant="outlined"
                        size="small"
                        startIcon={<IconEdit size={16} />}
                        onClick={() => handleOpenEditDialog(activity)}
                      >
                        Edit
                      </Button>
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => handleDelete(activity)}
                      >
                        <IconTrash size={16} />
                      </IconButton>
                    </Stack>
                  </Stack>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
      </Stack>

      {/* Create/Edit Activity Dialog */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Typography variant="h5">{isEditing ? 'Edit Activity' : 'Create Activity'}</Typography>
            <IconButton onClick={handleCloseDialog} size="small">
              <IconX size={20} />
            </IconButton>
          </Stack>
        </DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ mt: 1 }}>
            <TextField
              label="Title"
              required
              fullWidth
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            />

            <TextField
              label="Description"
              required
              fullWidth
              multiline
              rows={4}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />

            <Grid container spacing={2}>
              <Grid size={6}>
                <FormControl fullWidth>
                  <InputLabel>Category</InputLabel>
                  <Select
                    value={formData.category}
                    label="Category"
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  >
                    <MenuItem value="Sports">Sports</MenuItem>
                    <MenuItem value="Cultural">Cultural</MenuItem>
                    <MenuItem value="Academic">Academic</MenuItem>
                    <MenuItem value="Community">Community</MenuItem>
                    <MenuItem value="Meeting">Meeting</MenuItem>
                    <MenuItem value="Other">Other</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid size={6}>
                <FormControl fullWidth>
                  <InputLabel>Status</InputLabel>
                  <Select
                    value={formData.status}
                    label="Status"
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  >
                    <MenuItem value="upcoming">Upcoming</MenuItem>
                    <MenuItem value="ongoing">Ongoing</MenuItem>
                    <MenuItem value="completed">Completed</MenuItem>
                    <MenuItem value="cancelled">Cancelled</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>

            <Grid container spacing={2}>
              <Grid size={6}>
                <TextField
                  label="Date"
                  type="date"
                  required
                  fullWidth
                  InputLabelProps={{ shrink: true }}
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                />
              </Grid>
              <Grid size={6}>
                <TextField
                  label="Time"
                  type="time"
                  required
                  fullWidth
                  InputLabelProps={{ shrink: true }}
                  value={formData.time}
                  onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                />
              </Grid>
            </Grid>

            <Grid container spacing={2}>
              <Grid size={6}>
                <TextField
                  label="Duration"
                  fullWidth
                  placeholder="e.g., 2 hours"
                  value={formData.duration}
                  onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                />
              </Grid>
              <Grid size={6}>
                <TextField
                  label="Expected Participants"
                  type="number"
                  fullWidth
                  value={formData.expectedParticipants}
                  onChange={(e) => setFormData({ ...formData, expectedParticipants: e.target.value })}
                />
              </Grid>
            </Grid>

            <TextField
              label="Location"
              required
              fullWidth
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
            />

            <TextField
              label="Organizer"
              fullWidth
              value={formData.organizer}
              onChange={(e) => setFormData({ ...formData, organizer: e.target.value })}
            />

            <TextField
              label="Requirements"
              fullWidth
              multiline
              rows={2}
              placeholder="Any special requirements or instructions"
              value={formData.requirements}
              onChange={(e) => setFormData({ ...formData, requirements: e.target.value })}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button variant="contained" onClick={handleSubmit}>
            {isEditing ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Participants Dialog */}
      <Dialog open={participantsDialogOpen} onClose={handleCloseParticipantsDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Typography variant="h5">
              Participants - {selectedActivity?.title}
            </Typography>
            <IconButton onClick={handleCloseParticipantsDialog} size="small">
              <IconX size={20} />
            </IconButton>
          </Stack>
        </DialogTitle>
        <DialogContent>
          {loadingParticipants ? (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
              <CircularProgress />
            </Box>
          ) : participants.length === 0 ? (
            <Alert severity="info">No participants have joined this activity yet.</Alert>
          ) : (
            <TableContainer component={Paper} variant="outlined">
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Student Name</TableCell>
                    <TableCell>Student ID</TableCell>
                    <TableCell>Course</TableCell>
                    <TableCell>Room</TableCell>
                    <TableCell>Joined At</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {participants.map((participation) => (
                    <TableRow key={participation._id}>
                      <TableCell>{participation.studentIdentity?.name || 'N/A'}</TableCell>
                      <TableCell>{participation.studentIdentity?.studentId || 'N/A'}</TableCell>
                      <TableCell>{participation.studentIdentity?.course || 'N/A'}</TableCell>
                      <TableCell>
                        {participation.studentIdentity?.roomNumber 
                          ? `${participation.studentIdentity.roomNumber}${participation.studentIdentity.block ? ` (${participation.studentIdentity.block})` : ''}`
                          : 'N/A'}
                      </TableCell>
                      <TableCell>
                        {participation.joinedAt 
                          ? new Date(participation.joinedAt).toLocaleString('en-IN')
                          : 'N/A'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseParticipantsDialog}>Close</Button>
        </DialogActions>
      </Dialog>
    </ComponentsWrapper>
  );
}

