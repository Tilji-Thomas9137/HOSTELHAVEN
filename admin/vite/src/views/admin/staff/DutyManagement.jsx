import { useState, useEffect } from 'react';

import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import TextField from '@mui/material/TextField';
import Grid from '@mui/material/Grid';
import Divider from '@mui/material/Divider';

import ComponentsWrapper from '@/components/ComponentsWrapper';
import PresentationCard from '@/components/cards/PresentationCard';
import TabPanel from '@/components/TabPanel';
import adminService from '@/services/adminService';
import { useSnackbar } from 'notistack';

export default function DutyManagementPage() {
  const { enqueueSnackbar } = useSnackbar();
  const [tab, setTab] = useState('schedules');
  const [loading, setLoading] = useState(false);
  const [staff, setStaff] = useState([]);
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [reviewDialog, setReviewDialog] = useState({ open: false, request: null });
  const [reviewData, setReviewData] = useState({ status: 'pending', reviewNotes: '' });
  const [scheduleDialog, setScheduleDialog] = useState({ open: false, staff: null });
  const [scheduleData, setScheduleData] = useState({ shift: '', department: '', status: '' });
  const [weeklyScheduleDialog, setWeeklyScheduleDialog] = useState({ open: false, staff: null });
  const [weeklyScheduleData, setWeeklyScheduleData] = useState({
    monday: { shift: 'Full Day', duties: '', timeSlot: '' },
    tuesday: { shift: 'Full Day', duties: '', timeSlot: '' },
    wednesday: { shift: 'Full Day', duties: '', timeSlot: '' },
    thursday: { shift: 'Full Day', duties: '', timeSlot: '' },
    friday: { shift: 'Full Day', duties: '', timeSlot: '' },
    saturday: { shift: 'Full Day', duties: '', timeSlot: '' },
    sunday: { shift: 'Full Day', duties: '', timeSlot: '' },
  });
  const [todayScheduleData, setTodayScheduleData] = useState([]);
  const [loadingSchedule, setLoadingSchedule] = useState(false);

  useEffect(() => {
    if (tab === 'leave') {
      fetchLeaveRequests();
    } else if (tab === 'schedules') {
      fetchStaff();
    }
  }, [tab, selectedStatus]);

  const fetchStaff = async () => {
    try {
      setLoading(true);
      const data = await adminService.getAllStaff();
      setStaff(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to fetch staff:', err);
      enqueueSnackbar(err.response?.data?.message || 'Failed to load staff', { variant: 'error' });
      setStaff([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchLeaveRequests = async () => {
    try {
      setLoading(true);
      const params = {};
      if (selectedStatus !== 'all') params.status = selectedStatus;
      const data = await adminService.getAllStaffLeaveRequests(params);
      setLeaveRequests(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to fetch leave requests:', err);
      enqueueSnackbar(err.response?.data?.message || 'Failed to load leave requests', { variant: 'error' });
      setLeaveRequests([]);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenReview = (request) => {
    setReviewDialog({ open: true, request });
    setReviewData({
      status: request.status || 'pending',
      reviewNotes: request.reviewNotes || ''
    });
  };

  const handleCloseReview = () => {
    setReviewDialog({ open: false, request: null });
    setReviewData({ status: 'pending', reviewNotes: '' });
  };

  const handleUpdateStatus = async () => {
    try {
      await adminService.updateStaffLeaveRequestStatus(reviewDialog.request._id, reviewData);
      enqueueSnackbar('Leave request status updated successfully', { variant: 'success' });
      handleCloseReview();
      fetchLeaveRequests();
    } catch (err) {
      enqueueSnackbar(err.response?.data?.message || 'Failed to update status', { variant: 'error' });
    }
  };

  const handleOpenSchedule = (staffMember) => {
    setScheduleDialog({ open: true, staff: staffMember });
    setScheduleData({
      shift: staffMember.shift || '',
      department: staffMember.department || '',
      status: staffMember.status || 'active'
    });
  };

  const handleCloseSchedule = () => {
    setScheduleDialog({ open: false, staff: null });
    setScheduleData({ shift: '', department: '', status: '' });
  };

  const handleUpdateSchedule = async () => {
    try {
      if (!scheduleData.shift && !scheduleData.department && !scheduleData.status) {
        enqueueSnackbar('Please update at least one field', { variant: 'warning' });
        return;
      }
      await adminService.updateStaffSchedule(scheduleDialog.staff._id, scheduleData);
      enqueueSnackbar('Staff schedule updated successfully', { variant: 'success' });
      handleCloseSchedule();
      fetchStaff();
    } catch (err) {
      enqueueSnackbar(err.response?.data?.message || 'Failed to update schedule', { variant: 'error' });
    }
  };

  const handleOpenWeeklySchedule = async (staffMember) => {
    setWeeklyScheduleDialog({ open: true, staff: staffMember });
    setLoadingSchedule(true);
    try {
      const data = await adminService.getStaffWeeklySchedule(staffMember._id);
      if (data.schedule && data.schedule.weeklySchedule) {
        setWeeklyScheduleData(data.schedule.weeklySchedule);
        setTodayScheduleData(data.schedule.todaySchedule || []);
      } else {
        // Initialize with default values
        setWeeklyScheduleData({
          monday: { shift: staffMember.shift || 'Full Day', duties: '', timeSlot: '' },
          tuesday: { shift: staffMember.shift || 'Full Day', duties: '', timeSlot: '' },
          wednesday: { shift: staffMember.shift || 'Full Day', duties: '', timeSlot: '' },
          thursday: { shift: staffMember.shift || 'Full Day', duties: '', timeSlot: '' },
          friday: { shift: staffMember.shift || 'Full Day', duties: '', timeSlot: '' },
          saturday: { shift: staffMember.shift || 'Full Day', duties: '', timeSlot: '' },
          sunday: { shift: staffMember.shift || 'Full Day', duties: '', timeSlot: '' },
        });
        setTodayScheduleData([]);
      }
    } catch (err) {
      console.error('Failed to load weekly schedule:', err);
      // Initialize with default values
      setWeeklyScheduleData({
        monday: { shift: staffMember.shift || 'Full Day', duties: '', timeSlot: '' },
        tuesday: { shift: staffMember.shift || 'Full Day', duties: '', timeSlot: '' },
        wednesday: { shift: staffMember.shift || 'Full Day', duties: '', timeSlot: '' },
        thursday: { shift: staffMember.shift || 'Full Day', duties: '', timeSlot: '' },
        friday: { shift: staffMember.shift || 'Full Day', duties: '', timeSlot: '' },
        saturday: { shift: staffMember.shift || 'Full Day', duties: '', timeSlot: '' },
        sunday: { shift: staffMember.shift || 'Full Day', duties: '', timeSlot: '' },
      });
      setTodayScheduleData([]);
    } finally {
      setLoadingSchedule(false);
    }
  };

  const handleCloseWeeklySchedule = () => {
    setWeeklyScheduleDialog({ open: false, staff: null });
    setWeeklyScheduleData({
      monday: { shift: 'Full Day', duties: '', timeSlot: '' },
      tuesday: { shift: 'Full Day', duties: '', timeSlot: '' },
      wednesday: { shift: 'Full Day', duties: '', timeSlot: '' },
      thursday: { shift: 'Full Day', duties: '', timeSlot: '' },
      friday: { shift: 'Full Day', duties: '', timeSlot: '' },
      saturday: { shift: 'Full Day', duties: '', timeSlot: '' },
      sunday: { shift: 'Full Day', duties: '', timeSlot: '' },
    });
    setTodayScheduleData([]);
  };

  const handleUpdateWeeklySchedule = async () => {
    try {
      await adminService.setStaffWeeklySchedule(weeklyScheduleDialog.staff._id, {
        weeklySchedule: weeklyScheduleData,
        todaySchedule: todayScheduleData,
      });
      enqueueSnackbar('Weekly schedule set successfully', { variant: 'success' });
      handleCloseWeeklySchedule();
      fetchStaff();
    } catch (err) {
      enqueueSnackbar(err.response?.data?.message || 'Failed to set weekly schedule', { variant: 'error' });
    }
  };

  const handleAddTodayScheduleItem = () => {
    setTodayScheduleData([...todayScheduleData, { duty: '', time: '', location: '' }]);
  };

  const handleRemoveTodayScheduleItem = (index) => {
    setTodayScheduleData(todayScheduleData.filter((_, i) => i !== index));
  };

  const handleUpdateTodayScheduleItem = (index, field, value) => {
    const updated = [...todayScheduleData];
    updated[index] = { ...updated[index], [field]: value };
    setTodayScheduleData(updated);
  };

  const filteredLeaveRequests = leaveRequests.filter(r => {
    if (selectedStatus !== 'all' && r.status !== selectedStatus) return false;
    return true;
  });

  return (
    <ComponentsWrapper title="Staff Duty Management">
      <PresentationCard>
        <Stack spacing={3}>
          <Tabs value={tab} onChange={(_e, value) => setTab(value)}>
            <Tab value="schedules" label="Manage Schedules" />
            <Tab value="leave" label="Leave Requests" />
          </Tabs>

          <TabPanel value={tab} index="schedules">
            <Stack spacing={3}>
              <Typography variant="h6">Staff Schedules</Typography>
              <Typography variant="body2" color="text.secondary">
                Manage staff schedules, shift assignments, and duty rosters. Assign duties, view schedules, and track staff availability.
              </Typography>

              {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                  <CircularProgress />
                </Box>
              ) : staff.length === 0 ? (
                <Alert severity="info">No staff members found</Alert>
              ) : (
                <TableContainer component={Paper} elevation={0} sx={{ border: 1, borderColor: 'divider' }}>
                  <Table>
                    <TableHead>
                      <TableRow sx={{ bgcolor: 'grey.50' }}>
                        <TableCell><strong>Staff Name</strong></TableCell>
                        <TableCell><strong>Staff ID</strong></TableCell>
                        <TableCell><strong>Department</strong></TableCell>
                        <TableCell><strong>Shift</strong></TableCell>
                        <TableCell><strong>Status</strong></TableCell>
                        <TableCell><strong>Actions</strong></TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {staff.map((member) => (
                        <TableRow key={member._id} hover>
                          <TableCell>{member.name}</TableCell>
                          <TableCell>{member.staffId}</TableCell>
                          <TableCell>{member.department || 'N/A'}</TableCell>
                          <TableCell>
                            <Chip label={member.shift || 'N/A'} size="small" color="primary" />
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={member.status || 'active'}
                              size="small"
                              color={
                                member.status === 'active' ? 'success' :
                                member.status === 'suspended' ? 'error' : 'default'
                              }
                            />
                          </TableCell>
                          <TableCell>
                            <Stack direction="row" spacing={1}>
                              <Button 
                                size="small" 
                                variant="outlined"
                                onClick={() => handleOpenSchedule(member)}
                              >
                                Basic Info
                              </Button>
                              <Button 
                                size="small" 
                                variant="contained"
                                onClick={() => handleOpenWeeklySchedule(member)}
                              >
                                Weekly Schedule
                              </Button>
                            </Stack>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </Stack>
          </TabPanel>

          <TabPanel value={tab} index="leave">
            <Stack spacing={3}>
              <Grid container spacing={2} alignItems="center">
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Typography variant="h6">Staff Leave Requests</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Review and manage staff leave requests. Approve or reject requests to update duty schedules.
                  </Typography>
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <FormControl fullWidth>
                    <InputLabel>Filter by Status</InputLabel>
                    <Select
                      value={selectedStatus}
                      onChange={(e) => setSelectedStatus(e.target.value)}
                      label="Filter by Status"
                    >
                      <MenuItem value="all">All Status</MenuItem>
                      <MenuItem value="pending">Pending</MenuItem>
                      <MenuItem value="approved">Approved</MenuItem>
                      <MenuItem value="rejected">Rejected</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>

              {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                  <CircularProgress />
                </Box>
              ) : filteredLeaveRequests.length === 0 ? (
                <Alert severity="info">No leave requests found</Alert>
              ) : (
                <Stack spacing={2}>
                  {filteredLeaveRequests.map((request) => (
                    <Card key={request._id} variant="outlined">
                      <CardContent>
                        <Stack spacing={2}>
                          <Stack direction="row" spacing={1} alignItems="center" justifyContent="space-between" flexWrap="wrap">
                            <Stack spacing={0.5}>
                              <Typography variant="subtitle1">
                                {request.staff?.name || request.staffIdentity?.name || 'Unknown Staff'}
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                {request.staff?.staffId || request.staffIdentity?.staffId || 'N/A'} • {request.staff?.department || request.staffIdentity?.department || 'N/A'}
                              </Typography>
                            </Stack>
                            <Stack direction="row" spacing={1} alignItems="center">
                              <Chip
                                label={request.status}
                                size="small"
                                color={
                                  request.status === 'approved' ? 'success' :
                                  request.status === 'rejected' ? 'error' : 'default'
                                }
                              />
                              {request.status === 'pending' && (
                                <Button
                                  size="small"
                                  variant="outlined"
                                  onClick={() => handleOpenReview(request)}
                                >
                                  Review
                                </Button>
                              )}
                            </Stack>
                          </Stack>

                          <Typography variant="body1" fontWeight={500}>
                            Leave Date: {new Date(request.leaveDate).toLocaleDateString('en-US', {
                              weekday: 'long',
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })}
                          </Typography>

                          <Typography variant="body2" color="text.secondary">
                            <strong>Reason:</strong> {request.reason}
                          </Typography>

                          <Typography variant="caption" color="text.secondary">
                            Submitted: {new Date(request.createdAt).toLocaleString()}
                          </Typography>

                          {request.reviewNotes && (
                            <Alert severity="info">
                              <Typography variant="caption">
                                <strong>Review Note:</strong> {request.reviewNotes}
                              </Typography>
                            </Alert>
                          )}
                        </Stack>
                      </CardContent>
                    </Card>
                  ))}
                </Stack>
              )}
            </Stack>
          </TabPanel>
        </Stack>
      </PresentationCard>

      {/* Schedule Management Dialog */}
      <Dialog open={scheduleDialog.open} onClose={handleCloseSchedule} maxWidth="sm" fullWidth>
        <DialogTitle>Manage Staff Schedule</DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ mt: 1 }}>
            {scheduleDialog.staff && (
              <>
                <Typography variant="body2" color="text.secondary">
                  <strong>Staff:</strong> {scheduleDialog.staff.name} ({scheduleDialog.staff.staffId})
                </Typography>
              </>
            )}
            <FormControl fullWidth>
              <InputLabel>Shift</InputLabel>
              <Select
                value={scheduleData.shift}
                onChange={(e) => setScheduleData({ ...scheduleData, shift: e.target.value })}
                label="Shift"
              >
                <MenuItem value="Morning">Morning</MenuItem>
                <MenuItem value="Evening">Evening</MenuItem>
                <MenuItem value="Night">Night</MenuItem>
                <MenuItem value="Full Day">Full Day</MenuItem>
              </Select>
            </FormControl>
            <FormControl fullWidth>
              <InputLabel>Department</InputLabel>
              <Select
                value={scheduleData.department}
                onChange={(e) => setScheduleData({ ...scheduleData, department: e.target.value })}
                label="Department"
              >
                <MenuItem value="Housekeeping">Housekeeping</MenuItem>
                <MenuItem value="Maintenance">Maintenance</MenuItem>
                <MenuItem value="Security">Security</MenuItem>
                <MenuItem value="Admin">Admin</MenuItem>
                <MenuItem value="Warden">Warden</MenuItem>
                <MenuItem value="Other">Other</MenuItem>
              </Select>
            </FormControl>
            <FormControl fullWidth>
              <InputLabel>Status</InputLabel>
              <Select
                value={scheduleData.status}
                onChange={(e) => setScheduleData({ ...scheduleData, status: e.target.value })}
                label="Status"
              >
                <MenuItem value="active">Active</MenuItem>
                <MenuItem value="inactive">Inactive</MenuItem>
                <MenuItem value="suspended">Suspended</MenuItem>
              </Select>
            </FormControl>
            <Alert severity="info">
              <Typography variant="caption">
                Changes to shift or department will notify the staff member. Status changes affect their access to the system.
              </Typography>
            </Alert>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseSchedule}>Cancel</Button>
          <Button onClick={handleUpdateSchedule} variant="contained">Update Schedule</Button>
        </DialogActions>
      </Dialog>

      {/* Review Dialog */}
      <Dialog open={reviewDialog.open} onClose={handleCloseReview} maxWidth="sm" fullWidth>
        <DialogTitle>Review Leave Request</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            {reviewDialog.request && (
              <>
                <Typography variant="body2" color="text.secondary">
                  <strong>Staff:</strong> {reviewDialog.request.staff?.name || reviewDialog.request.staffIdentity?.name || 'Unknown'}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  <strong>Leave Date:</strong> {new Date(reviewDialog.request.leaveDate).toLocaleDateString()}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  <strong>Reason:</strong> {reviewDialog.request.reason}
                </Typography>
              </>
            )}
            <FormControl fullWidth>
              <InputLabel>Status</InputLabel>
              <Select
                value={reviewData.status}
                onChange={(e) => setReviewData({ ...reviewData, status: e.target.value })}
                label="Status"
              >
                <MenuItem value="pending">Pending</MenuItem>
                <MenuItem value="approved">Approve</MenuItem>
                <MenuItem value="rejected">Reject</MenuItem>
              </Select>
            </FormControl>
            <TextField
              label="Review Notes (Optional)"
              multiline
              rows={3}
              fullWidth
              value={reviewData.reviewNotes}
              onChange={(e) => setReviewData({ ...reviewData, reviewNotes: e.target.value })}
              placeholder="Add any notes about this leave request..."
            />
            <Alert severity="info">
              <Typography variant="caption">
                When you approve a leave request, the staff member will be removed from duty for that day. Make sure to reassign their duties if needed.
              </Typography>
            </Alert>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseReview}>Cancel</Button>
          <Button onClick={handleUpdateStatus} variant="contained">Update Status</Button>
        </DialogActions>
      </Dialog>

      {/* Weekly Schedule Dialog */}
      <Dialog open={weeklyScheduleDialog.open} onClose={handleCloseWeeklySchedule} maxWidth="md" fullWidth>
        <DialogTitle>Set Weekly Schedule - {weeklyScheduleDialog.staff?.name}</DialogTitle>
        <DialogContent>
          {loadingSchedule ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          ) : (
            <Stack spacing={3} sx={{ mt: 1 }}>
              <Alert severity="info">
                <Typography variant="caption">
                  Set the weekly schedule for this staff member. Each day can have a different shift, duties, and time slot.
                </Typography>
              </Alert>

              {['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].map((day) => (
                <Card key={day} variant="outlined">
                  <CardContent>
                    <Stack spacing={2}>
                      <Typography variant="subtitle1" sx={{ textTransform: 'capitalize' }}>
                        {day}
                      </Typography>
                      <Grid container spacing={2}>
                        <Grid size={{ xs: 12, sm: 4 }}>
                          <FormControl fullWidth>
                            <InputLabel>Shift</InputLabel>
                            <Select
                              value={weeklyScheduleData[day]?.shift || 'Full Day'}
                              onChange={(e) =>
                                setWeeklyScheduleData({
                                  ...weeklyScheduleData,
                                  [day]: { ...weeklyScheduleData[day], shift: e.target.value },
                                })
                              }
                              label="Shift"
                            >
                              <MenuItem value="Morning">Morning</MenuItem>
                              <MenuItem value="Evening">Evening</MenuItem>
                              <MenuItem value="Night">Night</MenuItem>
                              <MenuItem value="Full Day">Full Day</MenuItem>
                              <MenuItem value="Off">Off</MenuItem>
                            </Select>
                          </FormControl>
                        </Grid>
                        <Grid size={{ xs: 12, sm: 8 }}>
                          <TextField
                            fullWidth
                            label="Time Slot (e.g., 06:00 - 14:00)"
                            value={weeklyScheduleData[day]?.timeSlot || ''}
                            onChange={(e) =>
                              setWeeklyScheduleData({
                                ...weeklyScheduleData,
                                [day]: { ...weeklyScheduleData[day], timeSlot: e.target.value },
                              })
                            }
                            placeholder="e.g., 06:00 - 14:00"
                          />
                        </Grid>
                        <Grid size={{ xs: 12 }}>
                          <TextField
                            fullWidth
                            multiline
                            rows={2}
                            label="Duties"
                            value={weeklyScheduleData[day]?.duties || ''}
                            onChange={(e) =>
                              setWeeklyScheduleData({
                                ...weeklyScheduleData,
                                [day]: { ...weeklyScheduleData[day], duties: e.target.value },
                              })
                            }
                            placeholder="e.g., Morning round, Mess supervision"
                          />
                        </Grid>
                      </Grid>
                    </Stack>
                  </CardContent>
                </Card>
              ))}

              <Divider />

              <Typography variant="subtitle1">Today's Specific Tasks</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Add specific tasks for today (optional)
              </Typography>

              {todayScheduleData.map((item, index) => (
                <Card key={index} variant="outlined">
                  <CardContent>
                    <Stack spacing={2}>
                      <Stack direction="row" justifyContent="space-between" alignItems="center">
                        <Typography variant="subtitle2">Task {index + 1}</Typography>
                        <Button
                          size="small"
                          color="error"
                          onClick={() => handleRemoveTodayScheduleItem(index)}
                        >
                          Remove
                        </Button>
                      </Stack>
                      <Grid container spacing={2}>
                        <Grid size={{ xs: 12, sm: 4 }}>
                          <TextField
                            fullWidth
                            label="Duty"
                            value={item.duty || ''}
                            onChange={(e) => handleUpdateTodayScheduleItem(index, 'duty', e.target.value)}
                            placeholder="e.g., Morning inspection"
                          />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 4 }}>
                          <TextField
                            fullWidth
                            label="Time"
                            value={item.time || ''}
                            onChange={(e) => handleUpdateTodayScheduleItem(index, 'time', e.target.value)}
                            placeholder="e.g., 06:00"
                          />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 4 }}>
                          <TextField
                            fullWidth
                            label="Location"
                            value={item.location || ''}
                            onChange={(e) => handleUpdateTodayScheduleItem(index, 'location', e.target.value)}
                            placeholder="e.g., Block A"
                          />
                        </Grid>
                      </Grid>
                    </Stack>
                  </CardContent>
                </Card>
              ))}

              <Button
                variant="outlined"
                onClick={handleAddTodayScheduleItem}
              >
                + Add Today's Task
              </Button>
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseWeeklySchedule}>Cancel</Button>
          <Button onClick={handleUpdateWeeklySchedule} variant="contained" disabled={loadingSchedule}>
            Save Schedule
          </Button>
        </DialogActions>
      </Dialog>
    </ComponentsWrapper>
  );
}
