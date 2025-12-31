import { useState, useEffect } from 'react';

// @mui
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
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Select from '@mui/material/Select';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CircularProgress from '@mui/material/CircularProgress';
import Box from '@mui/material/Box';
import Alert from '@mui/material/Alert';
import Divider from '@mui/material/Divider';
import Grid from '@mui/material/Grid';

// @project
import ComponentsWrapper from '@/components/ComponentsWrapper';
import PresentationCard from '@/components/cards/PresentationCard';
import adminService from '@/services/adminService';
import { useSnackbar } from 'notistack';

// @icons
import { IconUser, IconPhone, IconMail, IconSchool, IconDoor, IconId } from '@tabler/icons-react';

/***************************  STUDENT COMPLAINTS PAGE  ***************************/

export default function StudentComplaintsPage() {
  const { enqueueSnackbar } = useSnackbar();
  const [loading, setLoading] = useState(false);
  const [complaints, setComplaints] = useState([]);
  const [filteredComplaints, setFilteredComplaints] = useState([]);
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [updateDialogOpen, setUpdateDialogOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [assignedFilter, setAssignedFilter] = useState('all');
  const [staffList, setStaffList] = useState([]);
  const [updateForm, setUpdateForm] = useState({
    status: 'requested',
    assignedTo: '',
    resolutionNotes: ''
  });
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    fetchComplaints();
    fetchStaff();
  }, []);

  useEffect(() => {
    filterComplaints();
  }, [complaints, statusFilter, priorityFilter, assignedFilter]);

  const fetchComplaints = async () => {
    try {
      setLoading(true);
      const data = await adminService.getAllComplaints();
      setComplaints(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to fetch complaints:', err);
      enqueueSnackbar(err.response?.data?.message || 'Failed to load complaints', { variant: 'error' });
      setComplaints([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchStaff = async () => {
    try {
      const data = await adminService.getAllStaff();
      setStaffList(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to fetch staff:', err);
    }
  };

  const filterComplaints = () => {
    let filtered = [...complaints];
    
    if (statusFilter !== 'all') {
      filtered = filtered.filter(c => c.status === statusFilter);
    }
    
    if (priorityFilter !== 'all') {
      filtered = filtered.filter(c => c.priority === priorityFilter);
    }
    
    if (assignedFilter === 'assigned') {
      filtered = filtered.filter(c => c.assignedTo);
    } else if (assignedFilter === 'unassigned') {
      filtered = filtered.filter(c => !c.assignedTo);
    }
    
    setFilteredComplaints(filtered);
  };

  const handleViewDetails = (complaint) => {
    setSelectedComplaint(complaint);
    setDetailDialogOpen(true);
  };

  const handleOpenUpdate = (complaint) => {
    setSelectedComplaint(complaint);
    setUpdateForm({
      status: complaint.status || 'requested',
      assignedTo: complaint.assignedTo?._id || '',
      resolutionNotes: complaint.resolutionNotes || ''
    });
    setUpdateDialogOpen(true);
  };

  const handleCloseUpdate = () => {
    setUpdateDialogOpen(false);
    setSelectedComplaint(null);
    setUpdateForm({ status: 'requested', assignedTo: '', resolutionNotes: '' });
  };

  const handleUpdateComplaint = async () => {
    if (!selectedComplaint) return;

    try {
      setUpdating(true);
      await adminService.updateComplaint(selectedComplaint._id, {
        status: updateForm.status,
        assignedTo: updateForm.assignedTo || undefined,
        resolutionNotes: updateForm.resolutionNotes.trim() || undefined
      });
      enqueueSnackbar('Complaint updated successfully', { variant: 'success' });
      handleCloseUpdate();
      fetchComplaints();
    } catch (err) {
      enqueueSnackbar(err.response?.data?.message || 'Failed to update complaint', { variant: 'error' });
    } finally {
      setUpdating(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'resolved':
        return 'success';
      case 'requested':
        return 'warning';
      default:
        return 'default';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'urgent':
        return 'error';
      case 'high':
        return 'warning';
      case 'medium':
        return 'info';
      case 'low':
        return 'default';
      default:
        return 'default';
    }
  };

  // Format category for display
  const formatCategory = (category) => {
    const categoryMap = {
      'room_furniture': 'Room/Furniture',
      'electrical': 'Electrical',
      'water_plumbing': 'Water/Plumbing',
      'cleanliness': 'Cleanliness',
      'internet_wifi': 'Internet/Wi-Fi',
      'security': 'Security',
      'other': 'Others'
    };
    return categoryMap[category] || category;
  };

  // Get student details from complaint (prioritize studentIdentity, fallback to student)
  const getStudentDetails = (complaint) => {
    if (complaint.studentIdentity) {
      return {
        name: complaint.studentIdentity.name,
        registerNumber: complaint.studentIdentity.registerNumber || complaint.studentIdentity.admissionNumber,
        admissionNumber: complaint.studentIdentity.admissionNumber,
        course: complaint.studentIdentity.course,
        year: complaint.studentIdentity.year,
        department: complaint.studentIdentity.department,
        hostelName: complaint.studentIdentity.hostelName,
        roomNumber: complaint.studentIdentity.roomNumber,
        phone: complaint.studentIdentity.phone,
        email: complaint.studentIdentity.email,
      };
    }
    
    // Fallback to populated student field
    if (complaint.student) {
      // Extract department from course
      let department = '';
      if (complaint.student.course) {
        const courseParts = complaint.student.course.split(' ');
        if (courseParts.length > 1) {
          department = courseParts.slice(1).join(' ');
        } else {
          department = complaint.student.course;
        }
      }
      
      return {
        name: complaint.student.name,
        registerNumber: complaint.student.studentId,
        admissionNumber: complaint.student.studentId,
        course: complaint.student.course,
        year: complaint.student.year,
        department: department,
        hostelName: complaint.room?.block || complaint.room?.building || 'Hostel',
        roomNumber: complaint.room?.roomNumber,
        phone: complaint.student.phone,
        email: complaint.student.email,
      };
    }
    
    return {
      name: 'N/A',
      registerNumber: 'N/A',
      admissionNumber: 'N/A',
      course: 'N/A',
      year: 'N/A',
      department: 'N/A',
      hostelName: 'N/A',
      roomNumber: 'N/A',
      phone: 'N/A',
      email: 'N/A',
    };
  };

  return (
    <ComponentsWrapper title="Student Complaints">
      <PresentationCard title="Manage Student Complaints">
        <Stack spacing={3}>
          {/* Filters */}
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 4 }}>
              <FormControl fullWidth>
                <InputLabel>Filter by Status</InputLabel>
                <Select
                  value={statusFilter}
                  label="Filter by Status"
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <MenuItem value="all">All Status</MenuItem>
                  <MenuItem value="requested">Requested</MenuItem>
                  <MenuItem value="resolved">Resolved</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <FormControl fullWidth>
                <InputLabel>Filter by Priority</InputLabel>
                <Select
                  value={priorityFilter}
                  label="Filter by Priority"
                  onChange={(e) => setPriorityFilter(e.target.value)}
                >
                  <MenuItem value="all">All Priorities</MenuItem>
                  <MenuItem value="urgent">Urgent</MenuItem>
                  <MenuItem value="high">High</MenuItem>
                  <MenuItem value="medium">Medium</MenuItem>
                  <MenuItem value="low">Low</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <FormControl fullWidth>
                <InputLabel>Filter by Assignment</InputLabel>
                <Select
                  value={assignedFilter}
                  label="Filter by Assignment"
                  onChange={(e) => setAssignedFilter(e.target.value)}
                >
                  <MenuItem value="all">All</MenuItem>
                  <MenuItem value="assigned">Assigned</MenuItem>
                  <MenuItem value="unassigned">Unassigned</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>

          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          ) : filteredComplaints.length === 0 ? (
            <Alert severity="info">No complaints found matching the filters.</Alert>
          ) : (
            <TableContainer component={Paper} variant="outlined">
              <Table>
                <TableHead>
                  <TableRow sx={{ bgcolor: 'grey.50' }}>
                    <TableCell><strong>Date</strong></TableCell>
                    <TableCell><strong>Student Details</strong></TableCell>
                    <TableCell><strong>Title</strong></TableCell>
                    <TableCell><strong>Category</strong></TableCell>
                    <TableCell><strong>Priority</strong></TableCell>
                    <TableCell><strong>Status</strong></TableCell>
                    <TableCell><strong>Assigned To</strong></TableCell>
                    <TableCell><strong>Actions</strong></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredComplaints.map((complaint) => {
                    const studentDetails = getStudentDetails(complaint);
                    return (
                      <TableRow key={complaint._id} hover>
                        <TableCell>
                          {new Date(complaint.createdAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <Stack spacing={0.5}>
                            <Typography variant="body2" sx={{ fontWeight: 500 }}>
                              {studentDetails.name}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              Reg: {studentDetails.registerNumber}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              Room: {studentDetails.roomNumber || 'N/A'}
                            </Typography>
                          </Stack>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" sx={{ maxWidth: 200 }}>
                            {complaint.title}
        </Typography>
                        </TableCell>
                        <TableCell>{formatCategory(complaint.category) || 'N/A'}</TableCell>
                        <TableCell>
                          <Chip
                            label={complaint.priority || 'medium'}
                            size="small"
                            color={getPriorityColor(complaint.priority)}
                          />
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={complaint.status}
                            size="small"
                            color={getStatusColor(complaint.status)}
                          />
                        </TableCell>
                        <TableCell>
                          {complaint.assignedTo?.name || 'Unassigned'}
                        </TableCell>
                        <TableCell>
                          <Stack direction="row" spacing={1}>
                            <Button
                              size="small"
                              variant="outlined"
                              onClick={() => handleViewDetails(complaint)}
                            >
                              View
                            </Button>
                            <Button
                              size="small"
                              variant="contained"
                              onClick={() => handleOpenUpdate(complaint)}
                            >
                              Update
                            </Button>
                          </Stack>
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

      {/* View Details Dialog */}
      <Dialog open={detailDialogOpen} onClose={() => setDetailDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Complaint Details</DialogTitle>
        <DialogContent>
          {selectedComplaint && (
            <Stack spacing={3} sx={{ mt: 1 }}>
              {/* Student Information Card */}
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <IconUser size={20} />
                    Student Information
                  </Typography>
                  <Divider sx={{ my: 2 }} />
                  <Grid container spacing={2}>
                    {(() => {
                      const studentDetails = getStudentDetails(selectedComplaint);
                      return (
                        <>
                          <Grid size={{ xs: 12, sm: 6 }}>
                            <Typography variant="caption" color="text.secondary">Name</Typography>
                            <Typography variant="body2" sx={{ fontWeight: 500, mt: 0.5 }}>
                              {studentDetails.name}
                            </Typography>
                          </Grid>
                          <Grid size={{ xs: 12, sm: 6 }}>
                            <Typography variant="caption" color="text.secondary">Register Number</Typography>
                            <Typography variant="body2" sx={{ fontWeight: 500, mt: 0.5 }}>
                              {studentDetails.registerNumber}
                            </Typography>
                          </Grid>
                          <Grid size={{ xs: 12, sm: 6 }}>
                            <Typography variant="caption" color="text.secondary">Course</Typography>
                            <Typography variant="body2" sx={{ fontWeight: 500, mt: 0.5 }}>
                              {studentDetails.course || 'N/A'}
                            </Typography>
                          </Grid>
                          <Grid size={{ xs: 12, sm: 6 }}>
                            <Typography variant="caption" color="text.secondary">Year</Typography>
                            <Typography variant="body2" sx={{ fontWeight: 500, mt: 0.5 }}>
                              {studentDetails.year || studentDetails.batchYear || 'N/A'}
                            </Typography>
                          </Grid>
                          <Grid size={{ xs: 12, sm: 6 }}>
                            <Typography variant="caption" color="text.secondary">Department</Typography>
                            <Typography variant="body2" sx={{ fontWeight: 500, mt: 0.5 }}>
                              {studentDetails.department || 'N/A'}
                            </Typography>
                          </Grid>
                          <Grid size={{ xs: 12, sm: 6 }}>
                            <Typography variant="caption" color="text.secondary">Hostel Name</Typography>
                            <Typography variant="body2" sx={{ fontWeight: 500, mt: 0.5 }}>
                              {studentDetails.hostelName || 'N/A'}
                            </Typography>
                          </Grid>
                          <Grid size={{ xs: 12, sm: 6 }}>
                            <Typography variant="caption" color="text.secondary">Room Number</Typography>
                            <Typography variant="body2" sx={{ fontWeight: 500, mt: 0.5 }}>
                              {studentDetails.roomNumber || 'Not assigned'}
                            </Typography>
                          </Grid>
                          <Grid size={{ xs: 12, sm: 6 }}>
                            <Typography variant="caption" color="text.secondary">Phone Number</Typography>
                            <Typography variant="body2" sx={{ fontWeight: 500, mt: 0.5 }}>
                              {studentDetails.phone || 'N/A'}
                            </Typography>
                          </Grid>
                          <Grid size={{ xs: 12 }}>
                            <Typography variant="caption" color="text.secondary">Email ID</Typography>
                            <Typography variant="body2" sx={{ fontWeight: 500, mt: 0.5 }}>
                              {studentDetails.email || 'N/A'}
                            </Typography>
                          </Grid>
                        </>
                      );
                    })()}
                  </Grid>
                </CardContent>
              </Card>

              {/* Complaint Details Card */}
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="h6" gutterBottom>Complaint Information</Typography>
                  <Divider sx={{ my: 2 }} />
                  <Stack spacing={2}>
                    <Box>
                      <Typography variant="caption" color="text.secondary">Title</Typography>
                      <Typography variant="body1" sx={{ fontWeight: 500, mt: 0.5 }}>
                        {selectedComplaint.title}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="caption" color="text.secondary">Description</Typography>
                      <Typography variant="body2" sx={{ mt: 0.5, whiteSpace: 'pre-wrap' }}>
                        {selectedComplaint.description}
                      </Typography>
                    </Box>
                    <Stack direction="row" spacing={2}>
                      <Box>
                        <Typography variant="caption" color="text.secondary">Category</Typography>
                        <Chip label={formatCategory(selectedComplaint.category)} size="small" sx={{ mt: 0.5 }} />
                      </Box>
                      <Box>
                        <Typography variant="caption" color="text.secondary">Priority</Typography>
                        <Chip
                          label={selectedComplaint.priority}
                          size="small"
                          color={getPriorityColor(selectedComplaint.priority)}
                          sx={{ mt: 0.5 }}
                        />
                      </Box>
                      <Box>
                        <Typography variant="caption" color="text.secondary">Status</Typography>
                        <Chip
                          label={selectedComplaint.status}
                          size="small"
                          color={getStatusColor(selectedComplaint.status)}
                          sx={{ mt: 0.5 }}
                        />
                      </Box>
                    </Stack>
                    {selectedComplaint.assignedTo && (
                      <Box>
                        <Typography variant="caption" color="text.secondary">Assigned To</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 500, mt: 0.5 }}>
                          {selectedComplaint.assignedTo.name} ({selectedComplaint.assignedTo.staffId || 'N/A'})
                        </Typography>
                      </Box>
                    )}
                    {selectedComplaint.resolutionNotes && (
                      <Box>
                        <Typography variant="caption" color="text.secondary">Resolution Notes / Remarks</Typography>
                        <Typography variant="body2" sx={{ mt: 0.5, whiteSpace: 'pre-wrap' }}>
                          {selectedComplaint.resolutionNotes}
                        </Typography>
                      </Box>
                    )}
                    {selectedComplaint.resolvedAt && (
                      <Box>
                        <Typography variant="caption" color="text.secondary">Resolved On</Typography>
                        <Typography variant="body2" sx={{ mt: 0.5 }}>
                          {new Date(selectedComplaint.resolvedAt).toLocaleString()}
                        </Typography>
                      </Box>
                    )}
                    <Box>
                      <Typography variant="caption" color="text.secondary">Submitted On</Typography>
                      <Typography variant="body2" sx={{ mt: 0.5 }}>
                        {new Date(selectedComplaint.createdAt).toLocaleString()}
                      </Typography>
                    </Box>
                  </Stack>
                </CardContent>
              </Card>
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailDialogOpen(false)}>Close</Button>
          <Button onClick={() => {
            setDetailDialogOpen(false);
            handleOpenUpdate(selectedComplaint);
          }} variant="contained">
            Update Complaint
          </Button>
        </DialogActions>
      </Dialog>

      {/* Update Complaint Dialog */}
      <Dialog open={updateDialogOpen} onClose={handleCloseUpdate} maxWidth="sm" fullWidth>
        <DialogTitle>Update Complaint</DialogTitle>
        <DialogContent>
          {selectedComplaint && (
            <Stack spacing={3} sx={{ mt: 1 }}>
              <Alert severity="info">
                <Typography variant="subtitle2" gutterBottom>
                  Student: {getStudentDetails(selectedComplaint).name} ({getStudentDetails(selectedComplaint).registerNumber})
                </Typography>
                <Typography variant="body2">
                  Complaint: {selectedComplaint.title}
                </Typography>
              </Alert>

              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  value={updateForm.status}
                  label="Status"
                  onChange={(e) => setUpdateForm({ ...updateForm, status: e.target.value })}
                >
                  <MenuItem value="requested">Requested</MenuItem>
                  <MenuItem value="resolved">Resolved</MenuItem>
                </Select>
              </FormControl>

              <FormControl fullWidth>
                <InputLabel>Assign To Staff</InputLabel>
                <Select
                  value={updateForm.assignedTo}
                  label="Assign To Staff"
                  onChange={(e) => setUpdateForm({ ...updateForm, assignedTo: e.target.value })}
                  displayEmpty
                >
                  <MenuItem value="">Unassign</MenuItem>
                  {staffList.map((staff) => (
                    <MenuItem key={staff._id} value={staff._id}>
                      {staff.name} ({staff.staffId || 'N/A'})
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <TextField
                label="Resolution Notes / Remarks"
                placeholder="Add resolution details, inspection notes, or remarks..."
                multiline
                rows={4}
                fullWidth
                value={updateForm.resolutionNotes}
                onChange={(e) => setUpdateForm({ ...updateForm, resolutionNotes: e.target.value })}
              />

              {selectedComplaint.resolutionNotes && (
                <Alert severity="info">
                  <Typography variant="subtitle2" gutterBottom>
                    Previous Notes:
                  </Typography>
                  <Typography variant="body2">
                    {selectedComplaint.resolutionNotes}
                  </Typography>
                </Alert>
              )}
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseUpdate} disabled={updating}>
            Cancel
          </Button>
          <Button
            onClick={handleUpdateComplaint}
            variant="contained"
            disabled={updating}
          >
            {updating ? 'Updating...' : 'Update Complaint'}
          </Button>
        </DialogActions>
      </Dialog>
    </ComponentsWrapper>
  );
}
