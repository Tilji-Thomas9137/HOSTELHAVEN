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
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import Alert from '@mui/material/Alert';
import Card from '@mui/material/Card';
import CircularProgress from '@mui/material/CircularProgress';
import Grid from '@mui/material/Grid';

// @project
import ComponentsWrapper from '@/components/ComponentsWrapper';
import PresentationCard from '@/components/cards/PresentationCard';
import TabPanel from '@/components/TabPanel';
import studentService from '@/services/studentService';
import { useSnackbar } from 'notistack';

// @icons
import { 
  IconTool, 
  IconHistory, 
  IconSend, 
  IconFileText, 
  IconCategory, 
  IconAlertTriangle,
  IconTag,
  IconUser,
  IconId,
  IconSchool,
  IconCalendar,
  IconDoor,
  IconPhone,
  IconMail
} from '@tabler/icons-react';

// @components
import FormSection from '@/components/forms/FormSection';
import FormFieldWrapper from '@/components/forms/FormFieldWrapper';

/***************************  COMPLAINTS PAGE  ***************************/

export default function ComplaintsPage() {
  const { enqueueSnackbar } = useSnackbar();
  const [value, setValue] = useState(0);
  const [loading, setLoading] = useState(true);
  const [complaints, setComplaints] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [studentProfile, setStudentProfile] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    priority: 'medium'
  });
  const [studentDetails, setStudentDetails] = useState({
    name: '',
    registerNumber: '',
    course: '',
    year: '',
    department: '',
    hostelName: '',
    roomNumber: '',
    phone: '',
    email: ''
  });

  useEffect(() => {
    fetchStudentProfile();
    fetchComplaints();
  }, []);

  const fetchStudentProfile = async () => {
    try {
      setLoadingProfile(true);
      const data = await studentService.getProfile();
      if (data && data.student) {
        setStudentProfile(data);
        
        // Extract department from course if available
        let department = '';
        if (data.student.course) {
          const courseParts = data.student.course.split(' ');
          if (courseParts.length > 1) {
            department = courseParts.slice(1).join(' ');
          } else {
            department = data.student.course;
          }
        }
        
        // Get hostel name from room block/building
        const hostelName = data.student.room?.block || data.student.room?.building || 'Hostel';
        
        // Auto-fill student details
        setStudentDetails({
          name: data.student.name || '',
          registerNumber: data.student.studentId || data.student.admissionNumber || '',
          course: data.student.course || '',
          year: data.student.year || '',
          department: department,
          hostelName: hostelName,
          roomNumber: data.student.room?.roomNumber || '',
          phone: data.student.phone || data.user?.phone || '',
          email: data.student.email || data.user?.email || ''
        });
      }
    } catch (err) {
      console.error('Failed to fetch student profile:', err);
      enqueueSnackbar('Failed to load student profile', { variant: 'warning' });
    } finally {
      setLoadingProfile(false);
    }
  };

  const fetchComplaints = async () => {
    try {
      setLoading(true);
      const data = await studentService.getComplaints();
      setComplaints(data || []);
    } catch (err) {
      enqueueSnackbar(err.response?.data?.message || 'Failed to load complaints', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (event, newValue) => {
    setValue(newValue);
  };

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

  const handleSubmit = async () => {
    // Validate all required fields
    if (!formData.title || !formData.description || !formData.category || !formData.priority) {
      enqueueSnackbar('Please fill in all required fields (Title, Description, Category, and Priority)', { variant: 'warning' });
      return;
    }

    // Validate category is a valid value
    const validCategories = ['room_furniture', 'electrical', 'water_plumbing', 'cleanliness', 'internet_wifi', 'security', 'other'];
    if (!validCategories.includes(formData.category)) {
      enqueueSnackbar('Invalid complaint category. Please select a valid category.', { variant: 'error' });
      return;
    }

    // Validate priority is a valid value
    const validPriorities = ['low', 'medium', 'high', 'urgent'];
    if (!validPriorities.includes(formData.priority)) {
      enqueueSnackbar('Invalid priority level. Please select a valid priority.', { variant: 'error' });
      return;
    }

    // Validate student details are present
    if (!studentDetails.name || !studentDetails.registerNumber || !studentDetails.phone || !studentDetails.email) {
      enqueueSnackbar('Student information is incomplete. Please refresh the page.', { variant: 'error' });
      return;
    }

    // Validate register number format (alphanumeric, 5-15 characters)
    const registerNumberRegex = /^[A-Z0-9]{5,15}$/i;
    if (!registerNumberRegex.test(studentDetails.registerNumber)) {
      enqueueSnackbar('Invalid register number format', { variant: 'error' });
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(studentDetails.email)) {
      enqueueSnackbar('Invalid email format', { variant: 'error' });
      return;
    }

    // Validate phone number format (10 digits, may include +91 or country code)
    const phoneRegex = /^(\+91[\s-]?)?[6-9]\d{9}$/;
    if (!phoneRegex.test(studentDetails.phone.replace(/[\s-]/g, ''))) {
      enqueueSnackbar('Invalid phone number format. Please enter a valid 10-digit mobile number.', { variant: 'error' });
      return;
    }
    
    try {
      setSubmitting(true);
      // Ensure category and priority are lowercase strings
      const complaintData = {
        ...formData,
        category: String(formData.category).toLowerCase().trim(),
        priority: String(formData.priority).toLowerCase().trim()
      };
      
      await studentService.submitComplaint(complaintData);
      enqueueSnackbar('Complaint submitted successfully', { variant: 'success' });
      setFormData({ title: '', description: '', category: '', priority: 'medium' });
      fetchComplaints();
      setValue(1); // Switch to history tab
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Failed to submit complaint';
      enqueueSnackbar(errorMessage, { variant: 'error' });
      console.error('Complaint submission error:', err.response?.data || err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ComponentsWrapper title="Maintenance / Complaints">
      <Box sx={{ width: '100%' }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
          <Tabs value={value} onChange={handleChange}>
            <Tab label="Raise Complaint" icon={<IconTool size={18} />} iconPosition="start" />
            <Tab label="Complaint History" icon={<IconHistory size={18} />} iconPosition="start" />
          </Tabs>
        </Box>

        {/* Raise Complaint Tab */}
        <TabPanel value={value} index={0}>
          <PresentationCard>
            <Stack spacing={4}>
              <Alert 
                severity="info" 
                icon={<IconTool size={20} />}
                sx={{ 
                  borderRadius: 2,
                  '& .MuiAlert-message': { fontWeight: 500 }
                }}
              >
                Fill in the details below to raise a hostel-related complaint. Your student information will be automatically included.
              </Alert>

              {loadingProfile ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                  <CircularProgress />
                </Box>
              ) : (
                <>
              
              {/* Student Information Section */}
              <FormSection 
                title="Student Information" 
                icon={IconUser}
                divider={false}
              >
                <Stack spacing={3}>
                  <Grid container spacing={2}>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <FormFieldWrapper
                        label="Name"
                        required
                        icon={IconUser}
                      >
                        <TextField
                          fullWidth
                          value={studentDetails.name}
                          disabled
                          sx={{ 
                            bgcolor: 'action.disabledBackground',
                            '& .MuiInputBase-input': { cursor: 'not-allowed' }
                          }}
                        />
                      </FormFieldWrapper>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <FormFieldWrapper
                        label="Register Number / Admission Number"
                        required
                        icon={IconId}
                      >
                        <TextField
                          fullWidth
                          value={studentDetails.registerNumber}
                          disabled
                          sx={{ 
                            bgcolor: 'action.disabledBackground',
                            '& .MuiInputBase-input': { cursor: 'not-allowed' }
                          }}
                        />
                      </FormFieldWrapper>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <FormFieldWrapper
                        label="Course"
                        icon={IconSchool}
                      >
                        <TextField
                          fullWidth
                          value={studentDetails.course}
                          disabled
                          sx={{ 
                            bgcolor: 'action.disabledBackground',
                            '& .MuiInputBase-input': { cursor: 'not-allowed' }
                          }}
                        />
                      </FormFieldWrapper>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <FormFieldWrapper
                        label="Year"
                        required
                        icon={IconCalendar}
                      >
                        <TextField
                          fullWidth
                          value={studentDetails.year || 'Not specified'}
                          disabled
                          sx={{ 
                            bgcolor: 'action.disabledBackground',
                            '& .MuiInputBase-input': { cursor: 'not-allowed' }
                          }}
                        />
                      </FormFieldWrapper>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <FormFieldWrapper
                        label="Department"
                        required
                        icon={IconSchool}
                      >
                        <TextField
                          fullWidth
                          value={studentDetails.department || 'Not specified'}
                          disabled
                          sx={{ 
                            bgcolor: 'action.disabledBackground',
                            '& .MuiInputBase-input': { cursor: 'not-allowed' }
                          }}
                        />
                      </FormFieldWrapper>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <FormFieldWrapper
                        label="Hostel Name"
                        required
                        icon={IconDoor}
                      >
                        <TextField
                          fullWidth
                          value={studentDetails.hostelName || 'Not assigned'}
                          disabled
                          sx={{ 
                            bgcolor: 'action.disabledBackground',
                            '& .MuiInputBase-input': { cursor: 'not-allowed' }
                          }}
                        />
                      </FormFieldWrapper>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <FormFieldWrapper
                        label="Room Number"
                        required
                        icon={IconDoor}
                      >
                        <TextField
                          fullWidth
                          value={studentDetails.roomNumber || 'Not assigned'}
                          disabled
                          sx={{ 
                            bgcolor: 'action.disabledBackground',
                            '& .MuiInputBase-input': { cursor: 'not-allowed' }
                          }}
                        />
                      </FormFieldWrapper>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <FormFieldWrapper
                        label="Phone Number"
                        required
                        icon={IconPhone}
                      >
                        <TextField
                          fullWidth
                          value={studentDetails.phone}
                          disabled
                          sx={{ 
                            bgcolor: 'action.disabledBackground',
                            '& .MuiInputBase-input': { cursor: 'not-allowed' }
                          }}
                        />
                      </FormFieldWrapper>
                    </Grid>
                    <Grid size={{ xs: 12 }}>
                      <FormFieldWrapper
                        label="Email ID"
                        required
                        icon={IconMail}
                      >
                        <TextField
                          fullWidth
                          type="email"
                          value={studentDetails.email}
                          disabled
                          sx={{ 
                            bgcolor: 'action.disabledBackground',
                            '& .MuiInputBase-input': { cursor: 'not-allowed' }
                          }}
                        />
                      </FormFieldWrapper>
                    </Grid>
                  </Grid>
                </Stack>
              </FormSection>
              
              <FormSection 
                title="Complaint Details" 
                icon={IconFileText}
                divider={false}
              >
                <Stack spacing={3}>
                  <FormFieldWrapper
                    label="Title"
                    required
                    icon={IconFileText}
                  >
                    <TextField
                      fullWidth
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      placeholder="Brief title for the complaint"
                      required
                      sx={{ 
                        bgcolor: 'background.paper',
                        '&:hover': { bgcolor: 'action.hover' },
                        transition: 'all 0.2s'
                      }}
                    />
                  </FormFieldWrapper>

                  <FormFieldWrapper
                    label="Complaint Category"
                    required
                    icon={IconCategory}
                    helperText="Select the category that best describes your complaint"
                  >
                    <FormControl fullWidth required error={!formData.category}>
                      <InputLabel id="complaint-category-label">Category *</InputLabel>
                      <Select 
                        labelId="complaint-category-label"
                        label="Category *"
                        value={formData.category || ''}
                        onChange={(e) => {
                          const value = e.target.value;
                          setFormData({ ...formData, category: value });
                        }}
                        required
                        sx={{ 
                          bgcolor: 'background.paper',
                          '&:hover': { bgcolor: 'action.hover' },
                          transition: 'all 0.2s'
                        }}
                      >
                        <MenuItem value="room_furniture">Room/Furniture</MenuItem>
                        <MenuItem value="electrical">Electrical</MenuItem>
                        <MenuItem value="water_plumbing">Water/Plumbing</MenuItem>
                        <MenuItem value="cleanliness">Cleanliness</MenuItem>
                        <MenuItem value="internet_wifi">Internet/Wi-Fi</MenuItem>
                        <MenuItem value="security">Security</MenuItem>
                        <MenuItem value="other">Others</MenuItem>
                      </Select>
                    </FormControl>
                  </FormFieldWrapper>

                  <FormFieldWrapper
                    label="Description"
                    required
                    helperText="Please provide as much detail as possible to help us resolve the issue quickly"
                    icon={IconFileText}
                  >
                    <TextField
                      fullWidth
                      multiline
                      rows={4}
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Describe the issue in detail..."
                      required
                      sx={{ 
                        bgcolor: 'background.paper',
                        '&:hover': { bgcolor: 'action.hover' },
                        transition: 'all 0.2s'
                      }}
                    />
                  </FormFieldWrapper>

                  <FormFieldWrapper
                    label="Priority Level"
                    required
                    icon={IconAlertTriangle}
                    helperText="Select the urgency level of your complaint"
                  >
                    <FormControl fullWidth required error={!formData.priority}>
                      <InputLabel id="complaint-priority-label">Priority *</InputLabel>
                      <Select
                        labelId="complaint-priority-label"
                        label="Priority *"
                        value={formData.priority || 'medium'}
                        onChange={(e) => {
                          const value = e.target.value;
                          setFormData({ ...formData, priority: value });
                        }}
                        required
                        sx={{ 
                          bgcolor: 'background.paper',
                          '&:hover': { bgcolor: 'action.hover' },
                          transition: 'all 0.2s'
                        }}
                      >
                        <MenuItem value="low">Low</MenuItem>
                        <MenuItem value="medium">Medium</MenuItem>
                        <MenuItem value="high">High</MenuItem>
                        <MenuItem value="urgent">Urgent</MenuItem>
                      </Select>
                    </FormControl>
                  </FormFieldWrapper>

                  {/* Auto-generated Date */}
                  <FormFieldWrapper
                    label="Complaint Date"
                    icon={IconCalendar}
                  >
                    <TextField
                      fullWidth
                      value={new Date().toLocaleDateString('en-IN', { 
                        weekday: 'long', 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      })}
                      disabled
                      sx={{ 
                        bgcolor: 'action.disabledBackground',
                        '& .MuiInputBase-input': { cursor: 'not-allowed' }
                      }}
                    />
                  </FormFieldWrapper>
                </Stack>
              </FormSection>

              <Button 
                variant="contained" 
                size="large" 
                fullWidth 
                startIcon={submitting ? <CircularProgress size={20} color="inherit" /> : <IconSend size={20} />}
                onClick={handleSubmit}
                disabled={submitting || loadingProfile || !studentDetails.name}
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
                {submitting ? 'Submitting...' : 'Submit Complaint'}
              </Button>
                </>
              )}
            </Stack>
          </PresentationCard>
        </TabPanel>

        {/* Complaint History Tab */}
        <TabPanel value={value} index={1}>
          <PresentationCard>
            <TableContainer component={Paper} elevation={0} sx={{ border: 1, borderColor: 'divider', borderRadius: 2 }}>
              <Table>
                <TableHead>
                  <TableRow sx={{ bgcolor: 'grey.50' }}>
                    <TableCell><strong>Date</strong></TableCell>
                    <TableCell><strong>Category</strong></TableCell>
                    <TableCell><strong>Description</strong></TableCell>
                    <TableCell><strong>Status</strong></TableCell>
                    <TableCell><strong>Assigned To</strong></TableCell>
                    <TableCell><strong>Updates</strong></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={6} align="center">
                        <CircularProgress sx={{ py: 2 }} />
                      </TableCell>
                    </TableRow>
                  ) : complaints.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} align="center">
                        <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
                          No complaints submitted
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    complaints.map((complaint) => (
                      <TableRow key={complaint._id || complaint.id} hover>
                        <TableCell>{new Date(complaint.createdAt || complaint.date).toLocaleDateString()}</TableCell>
                        <TableCell>{complaint.category ? formatCategory(complaint.category) : 'N/A'}</TableCell>
                        <TableCell>
                          <Typography variant="body2" sx={{ maxWidth: 200 }}>
                            {complaint.description || 'No description'}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={complaint.status}
                            color={
                              complaint.status === 'resolved' ? 'success' :
                              complaint.status === 'requested' ? 'warning' : 'default'
                            }
                            size="small"
                          />
                        </TableCell>
                        <TableCell>{complaint.assignedTo?.name || 'Not assigned'}</TableCell>
                        <TableCell>
                          <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 200 }}>
                            {complaint.resolutionNotes || 'No remarks yet'}
                          </Typography>
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
    </ComponentsWrapper>
  );
}

