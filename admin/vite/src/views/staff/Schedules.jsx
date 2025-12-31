import { useState, useEffect } from 'react';

import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import Chip from '@mui/material/Chip';
import Alert from '@mui/material/Alert';
import CircularProgress from '@mui/material/CircularProgress';
import Box from '@mui/material/Box';

import ComponentsWrapper from '@/components/ComponentsWrapper';
import PresentationCard from '@/components/cards/PresentationCard';
import TabPanel from '@/components/TabPanel';
import staffService from '@/services/staffService';
import { useSnackbar } from 'notistack';

export default function StaffSchedules() {
  const { enqueueSnackbar } = useSnackbar();
  const [tab, setTab] = useState('view');
  const [loading, setLoading] = useState(false);
  const [schedule, setSchedule] = useState(null);
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [leaveForm, setLeaveForm] = useState({
    leaveDate: '',
    reason: ''
  });
  const [submittingLeave, setSubmittingLeave] = useState(false);

  useEffect(() => {
    if (tab === 'view') {
      fetchSchedule();
    } else if (tab === 'leave') {
      fetchLeaveRequests();
    }
  }, [tab]);

  const fetchSchedule = async () => {
    try {
      setLoading(true);
      const data = await staffService.getSchedule();
      setSchedule(data);
      if (data.leaveRequests) {
        setLeaveRequests(data.leaveRequests);
      }
    } catch (err) {
      console.error('Failed to fetch schedule:', err);
      enqueueSnackbar(err.response?.data?.message || 'Failed to load schedule', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const fetchLeaveRequests = async () => {
    try {
      setLoading(true);
      const data = await staffService.getLeaveRequests();
      setLeaveRequests(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to fetch leave requests:', err);
      enqueueSnackbar(err.response?.data?.message || 'Failed to load leave requests', { variant: 'error' });
      setLeaveRequests([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitLeave = async () => {
    if (!leaveForm.leaveDate || !leaveForm.reason.trim()) {
      enqueueSnackbar('Please fill in all required fields', { variant: 'warning' });
      return;
    }

    try {
      setSubmittingLeave(true);
      await staffService.requestLeave({
        leaveDate: leaveForm.leaveDate,
        reason: leaveForm.reason.trim()
      });
      enqueueSnackbar('Leave request submitted successfully! Admin will be notified.', { variant: 'success' });
      setLeaveForm({ leaveDate: '', reason: '' });
      fetchLeaveRequests();
    } catch (err) {
      enqueueSnackbar(err.response?.data?.message || 'Failed to submit leave request', { variant: 'error' });
    } finally {
      setSubmittingLeave(false);
    }
  };

  // Get weekly schedule from backend, fallback to default if not set
  const weeklySchedule = schedule?.schedule?.weeklySchedule && Array.isArray(schedule.schedule.weeklySchedule) && schedule.schedule.weeklySchedule.length > 0
    ? schedule.schedule.weeklySchedule
    : [
        { day: 'Monday', shift: schedule?.schedule?.shift || 'Full Day', duties: 'No schedule set by admin', timeSlot: '' },
        { day: 'Tuesday', shift: schedule?.schedule?.shift || 'Full Day', duties: 'No schedule set by admin', timeSlot: '' },
        { day: 'Wednesday', shift: schedule?.schedule?.shift || 'Full Day', duties: 'No schedule set by admin', timeSlot: '' },
        { day: 'Thursday', shift: schedule?.schedule?.shift || 'Full Day', duties: 'No schedule set by admin', timeSlot: '' },
        { day: 'Friday', shift: schedule?.schedule?.shift || 'Full Day', duties: 'No schedule set by admin', timeSlot: '' },
        { day: 'Saturday', shift: schedule?.schedule?.shift || 'Full Day', duties: 'No schedule set by admin', timeSlot: '' },
        { day: 'Sunday', shift: schedule?.schedule?.shift || 'Full Day', duties: 'No schedule set by admin', timeSlot: '' },
      ];

  return (
    <ComponentsWrapper title="Staff Schedules">
      <PresentationCard>
        <Stack spacing={3}>
          <Tabs value={tab} onChange={(_e, value) => setTab(value)}>
            <Tab value="view" label="View Schedule" />
            <Tab value="leave" label="Request Leave" />
          </Tabs>

          <TabPanel value={tab} index="view">
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                <CircularProgress />
              </Box>
            ) : (
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, md: 7 }}>
                  <Typography variant="subtitle1" gutterBottom>
                    Weekly plan
                  </Typography>
                  <Stack spacing={2}>
                    {weeklySchedule.map((slot) => (
                      <Card key={slot.day} variant="outlined">
                        <CardContent>
                          <Stack direction="row" justifyContent="space-between" flexWrap="wrap" gap={1}>
                            <Typography variant="subtitle2">{slot.day}</Typography>
                            <Chip 
                              label={slot.shift || 'Full Day'} 
                              size="small" 
                              color={slot.shift === 'Off' ? 'default' : 'primary'}
                            />
                          </Stack>
                          {slot.timeSlot && (
                            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                              {slot.timeSlot}
                            </Typography>
                          )}
                          <Typography variant="body2" color="text.secondary" sx={{ mt: slot.timeSlot ? 0.5 : 1 }}>
                            {slot.duties || 'No duties assigned'}
                          </Typography>
                        </CardContent>
                      </Card>
                    ))}
                  </Stack>
                </Grid>
                <Grid size={{ xs: 12, md: 5 }}>
                  <Typography variant="subtitle1" gutterBottom>
                    Today
                  </Typography>
                  {schedule?.schedule?.todaySchedule && schedule.schedule.todaySchedule.length > 0 ? (
                    <List dense>
                      {schedule.schedule.todaySchedule.map((item, idx) => (
                        <ListItem key={idx} divider>
                          <ListItemText 
                            primary={item.duty || item.primary} 
                            secondary={item.time && item.location ? `${item.time} - ${item.location}` : item.time || item.secondary || 'No time specified'} 
                          />
                        </ListItem>
                      ))}
                    </List>
                  ) : (
                    <Alert severity="info" sx={{ mb: 2 }}>
                      <Typography variant="body2">No specific tasks scheduled for today.</Typography>
                    </Alert>
                  )}
                  <Divider sx={{ my: 2 }} />
                  <Alert severity="info" sx={{ mb: 2 }}>
                    <Typography variant="body2">
                      Your schedule is managed by the admin. If you need to request leave, use the "Request Leave" tab.
                    </Typography>
                  </Alert>
                  <Typography variant="body2" color="text.secondary">
                    Shift timings can change based on duty assignments by the admin. Always confirm your slots before starting a shift.
                  </Typography>
                </Grid>
              </Grid>
            )}
          </TabPanel>

          <TabPanel value={tab} index="leave">
            <Stack spacing={3}>
              <Typography variant="h6">Request Leave</Typography>
              <Typography variant="body2" color="text.secondary">
                Submit a leave request for a specific date. The admin will be notified and can remove you from duty for that day.
              </Typography>

              <TextField
                label="Leave Date"
                type="date"
                fullWidth
                required
                value={leaveForm.leaveDate}
                onChange={(e) => setLeaveForm({ ...leaveForm, leaveDate: e.target.value })}
                InputLabelProps={{
                  shrink: true,
                }}
                inputProps={{
                  min: new Date().toISOString().split('T')[0],
                }}
              />

              <TextField
                label="Reason for Leave"
                multiline
                rows={4}
                fullWidth
                required
                placeholder="Please provide a reason for your leave request..."
                value={leaveForm.reason}
                onChange={(e) => setLeaveForm({ ...leaveForm, reason: e.target.value })}
              />

              <Button
                variant="contained"
                size="large"
                fullWidth
                onClick={handleSubmitLeave}
                disabled={submittingLeave || !leaveForm.leaveDate || !leaveForm.reason.trim()}
              >
                {submittingLeave ? 'Submitting...' : 'Submit Leave Request'}
              </Button>

              {leaveRequests.length > 0 && (
                <>
                  <Divider />
                  <Typography variant="h6">My Leave Requests</Typography>
                  <Stack spacing={2}>
                    {leaveRequests.map((request) => (
                      <Card key={request._id} variant="outlined">
                        <CardContent>
                          <Stack spacing={1}>
                            <Stack direction="row" spacing={1} alignItems="center" justifyContent="space-between" flexWrap="wrap">
                              <Typography variant="subtitle2">
                                {new Date(request.leaveDate).toLocaleDateString('en-US', {
                                  weekday: 'long',
                                  year: 'numeric',
                                  month: 'long',
                                  day: 'numeric'
                                })}
                              </Typography>
                              <Chip
                                label={request.status}
                                size="small"
                                color={
                                  request.status === 'approved' ? 'success' :
                                  request.status === 'rejected' ? 'error' : 'default'
                                }
                              />
                            </Stack>
                            <Typography variant="body2" color="text.secondary">
                              <strong>Reason:</strong> {request.reason}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              Submitted: {new Date(request.createdAt).toLocaleString()}
                            </Typography>
                            {request.reviewNotes && (
                              <Alert severity="info" sx={{ mt: 1 }}>
                                <Typography variant="caption">
                                  <strong>Admin Note:</strong> {request.reviewNotes}
                                </Typography>
                              </Alert>
                            )}
                          </Stack>
                        </CardContent>
                      </Card>
                    ))}
                  </Stack>
                </>
              )}
            </Stack>
          </TabPanel>
        </Stack>
      </PresentationCard>
    </ComponentsWrapper>
  );
}
