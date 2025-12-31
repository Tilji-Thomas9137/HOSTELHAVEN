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

// @project
import ComponentsWrapper from '@/components/ComponentsWrapper';
import PresentationCard from '@/components/cards/PresentationCard';
import { studentService } from '@/services/studentService';
import { useSnackbar } from 'notistack';

// @icons
import { IconCalendar, IconUsers, IconTrophy, IconMapPin, IconUser, IconClock } from '@tabler/icons-react';

/***************************  ACTIVITIES PAGE  ***************************/

export default function ActivitiesPage() {
  const [selectedActivity, setSelectedActivity] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [upcomingActivities, setUpcomingActivities] = useState([]);
  const [pastActivities, setPastActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [joinedActivityIds, setJoinedActivityIds] = useState(new Set());
  const { enqueueSnackbar } = useSnackbar();

  useEffect(() => {
    fetchActivities();
  }, []);

  const fetchActivities = async () => {
    try {
      setLoading(true);
      const [activities, participations] = await Promise.all([
        studentService.getActivities(),
        studentService.getActivityParticipations()
      ]);
      
      const now = new Date();
      const upcoming = activities.filter(activity => {
        const activityDate = new Date(activity.date);
        return activityDate >= now && activity.status !== 'cancelled';
      });
      const past = activities.filter(activity => {
        const activityDate = new Date(activity.date);
        return activityDate < now || activity.status === 'completed';
      });

      setUpcomingActivities(upcoming);
      setPastActivities(past);

      const joinedIds = new Set(
        (participations || [])
          .filter((p) => p.status === 'joined' && p.activity?._id)
          .map((p) => p.activity._id.toString())
      );
      setJoinedActivityIds(joinedIds);
    } catch (error) {
      console.error('Error fetching activities:', error);
      enqueueSnackbar(error.response?.data?.message || 'Failed to fetch activities', { variant: 'error' });
    } finally {
      setLoading(false);
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

  const formatTime = (timeString) => {
    // If time is already formatted, return as is
    if (timeString && timeString.includes(':')) {
      return timeString;
    }
    return timeString || '';
  };


  const handleViewDetails = (activity) => {
    setSelectedActivity(activity);
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setSelectedActivity(null);
  };

  const handleJoinActivity = async () => {
    if (!selectedActivity?._id) return;
    try {
      setJoining(true);
      await studentService.joinActivity(selectedActivity._id);
      enqueueSnackbar('You have successfully joined this activity. Your parent will be notified.', {
        variant: 'success'
      });
      await fetchActivities(); // refresh lists & joined flags
      setDialogOpen(false);
    } catch (error) {
      console.error('Error joining activity:', error);
      enqueueSnackbar(
        error.response?.data?.message || 'Failed to join activity. Please try again.',
        { variant: 'error' }
      );
    } finally {
      setJoining(false);
    }
  };

  if (loading) {
    return (
      <ComponentsWrapper title="Activities">
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
          <CircularProgress />
        </Box>
      </ComponentsWrapper>
    );
  }

  return (
    <ComponentsWrapper title="Activities">
      <Stack spacing={3}>
        <Typography variant="h6">Upcoming Activities</Typography>
        
        {upcomingActivities.length === 0 ? (
          <Alert severity="info">No upcoming activities at the moment.</Alert>
        ) : (
          <Grid container spacing={3}>
            {upcomingActivities.map((activity) => (
              <Grid key={activity._id || activity.id} size={12} md={6} lg={4}>
                <Card variant="outlined" sx={{ p: 2, height: '100%' }}>
                  <Stack spacing={2}>
                    <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                      <Typography variant="h6">{activity.title}</Typography>
                      <Stack direction="row" spacing={1}>
                        <Chip label={activity.category} size="small" color="primary" />
                        {joinedActivityIds.has((activity._id || activity.id)?.toString()) && (
                          <Chip label="Joined" size="small" color="success" variant="outlined" />
                        )}
                      </Stack>
                    </Stack>
                    <Stack spacing={0.5}>
                      <Typography variant="body2" color="text.secondary">
                        <IconCalendar size={16} style={{ verticalAlign: 'middle', marginRight: 4 }} />
                        {formatDate(activity.date)} at {formatTime(activity.time)}
                      </Typography>
                      {activity.expectedParticipants > 0 && (
                        <Typography variant="body2" color="text.secondary">
                          <IconUsers size={16} style={{ verticalAlign: 'middle', marginRight: 4 }} />
                          {activity.expectedParticipants} expected participants
                        </Typography>
                      )}
                    </Stack>
                    <Button 
                      variant="outlined" 
                      size="small" 
                      fullWidth
                      onClick={() => handleViewDetails(activity)}
                    >
                      {joinedActivityIds.has((activity._id || activity.id)?.toString())
                        ? 'View / Joined'
                        : 'View & Join'}
                    </Button>
                  </Stack>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}

        <Typography variant="h6" sx={{ mt: 4 }}>Past Activities</Typography>
        
        {pastActivities.length === 0 ? (
          <Alert severity="info">No past activities to display.</Alert>
        ) : (
          <PresentationCard>
            <Stack spacing={2}>
              {pastActivities.map((activity) => (
                <Card key={activity._id || activity.id} variant="outlined" sx={{ p: 2 }}>
                  <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Stack>
                      <Typography variant="subtitle1">{activity.title}</Typography>
                      <Typography variant="body2" color="text.secondary">
                        {formatDate(activity.date)} • {activity.category}
                      </Typography>
                    </Stack>
                    <Chip label={activity.status} color="success" size="small" />
                  </Stack>
                </Card>
              ))}
            </Stack>
          </PresentationCard>
        )}
      </Stack>

      {/* Activity Details Dialog */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Typography variant="h5">{selectedActivity?.title}</Typography>
            <Chip label={selectedActivity?.category} color="primary" size="small" />
          </Stack>
        </DialogTitle>
        <DialogContent>
          {selectedActivity && (
            <Stack spacing={3} sx={{ mt: 1 }}>
              {/* Description */}
              <Box>
                <Typography variant="subtitle2" gutterBottom color="text.secondary">
                  Description
                </Typography>
                <Typography variant="body1">
                  {selectedActivity.description}
                </Typography>
              </Box>

              <Divider />

              {/* Date and Time */}
              <Stack spacing={2}>
                <Stack direction="row" spacing={1} alignItems="center">
                  <IconCalendar size={20} style={{ color: 'inherit' }} />
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      Date & Time
                    </Typography>
                    <Typography variant="body1">
                      {formatDate(selectedActivity.date)} at {formatTime(selectedActivity.time)}
                    </Typography>
                  </Box>
                </Stack>

                {selectedActivity.duration && (
                  <Stack direction="row" spacing={1} alignItems="center">
                    <IconClock size={20} style={{ color: 'inherit' }} />
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        Duration
                      </Typography>
                      <Typography variant="body1">
                        {selectedActivity.duration}
                      </Typography>
                    </Box>
                  </Stack>
                )}

                <Stack direction="row" spacing={1} alignItems="center">
                  <IconMapPin size={20} style={{ color: 'inherit' }} />
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      Location
                    </Typography>
                    <Typography variant="body1">
                      {selectedActivity.location}
                    </Typography>
                  </Box>
                </Stack>

                {selectedActivity.expectedParticipants > 0 && (
                  <Stack direction="row" spacing={1} alignItems="center">
                    <IconUsers size={20} style={{ color: 'inherit' }} />
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        Expected Participants
                      </Typography>
                      <Typography variant="body1">
                        {selectedActivity.expectedParticipants} participants
                      </Typography>
                    </Box>
                  </Stack>
                )}

                {selectedActivity.organizer && (
                  <Stack direction="row" spacing={1} alignItems="center">
                    <IconUser size={20} style={{ color: 'inherit' }} />
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        Organizer
                      </Typography>
                      <Typography variant="body1">
                        {selectedActivity.organizer}
                      </Typography>
                    </Box>
                  </Stack>
                )}
              </Stack>

              {/* Requirements */}
              {selectedActivity.requirements && (
                <>
                  <Divider />
                  <Box>
                    <Typography variant="subtitle2" gutterBottom color="text.secondary">
                      Requirements
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {selectedActivity.requirements}
                    </Typography>
                  </Box>
                </>
              )}
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Close</Button>
          {selectedActivity &&
            (selectedActivity.status === 'upcoming' || selectedActivity.status === 'ongoing') && (
              <Button
                variant="contained"
                onClick={handleJoinActivity}
                disabled={
                  joining || joinedActivityIds.has((selectedActivity._id || selectedActivity.id)?.toString())
                }
              >
                {joinedActivityIds.has((selectedActivity._id || selectedActivity.id)?.toString())
                  ? 'Already Joined'
                  : joining
                  ? 'Joining...'
                  : 'Join Activity'}
              </Button>
            )}
        </DialogActions>
      </Dialog>
    </ComponentsWrapper>
  );
}

