import { useState, useEffect, useCallback } from 'react';

// @mui
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Grid';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import Autocomplete from '@mui/material/Autocomplete';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';
import Chip from '@mui/material/Chip';

// @project
import ComponentsWrapper from '@/components/ComponentsWrapper';
import PresentationCard from '@/components/cards/PresentationCard';
import TabPanel from '@/components/TabPanel';
import adminService from '@/services/adminService';
import { useSnackbar } from 'notistack';

// @icons
import { 
  IconCheck, 
  IconX, 
  IconSearch,
  IconCalendar,
  IconUser,
  IconBook
} from '@tabler/icons-react';

/***************************  STUDENT ATTENDANCE PAGE  ***************************/

export default function StudentAttendancePage() {
  const { enqueueSnackbar } = useSnackbar();
  const [tabValue, setTabValue] = useState(0);
  const [loading, setLoading] = useState(false);
  const [fetchingStudent, setFetchingStudent] = useState(false);
  
  // Helper function to get today's date in local timezone (YYYY-MM-DD format)
  const getTodayDate = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Form state
  const [formData, setFormData] = useState({
    studentId: '',
    studentName: '',
    course: '',
    year: '',
    date: getTodayDate(), // Format as YYYY-MM-DD for date input
    status: 'Present',
  });

  // Attendance history
  const [attendanceHistory, setAttendanceHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [viewMode, setViewMode] = useState('grouped'); // 'grouped' or 'flat'
  const [historyFilters, setHistoryFilters] = useState({
    date: null,
    status: 'all',
    search: '',
  });

  // Debounce timer for student ID lookup
  const [studentIdTimer, setStudentIdTimer] = useState(null);

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    // Auto-fetch student details when student ID is entered
    if (field === 'studentId') {
      // Clear previous timer
      if (studentIdTimer) {
        clearTimeout(studentIdTimer);
        setStudentIdTimer(null);
      }

      // Only fetch if value exists and has at least 3 characters
      if (value && value.trim().length >= 3) {
        // Set new timer for debounced search
        const timer = setTimeout(() => {
          fetchStudentByStudentId(value.trim());
        }, 500); // Wait 500ms after user stops typing

        setStudentIdTimer(timer);
      } else {
        // Clear student fields if input is too short or empty
        if (!value || value.trim().length === 0) {
          setFormData(prev => ({
            ...prev,
            studentName: '',
            course: '',
            year: '',
          }));
        }
      }
    }
  };

  const fetchStudentByStudentId = async (studentId) => {
    // Double-check validation before making API call
    if (!studentId || !studentId.trim() || studentId.trim().length < 3) {
      return;
    }

    try {
      setFetchingStudent(true);
      const student = await adminService.getStudentByStudentId(studentId);
      
      // Check if student has a room allocated
      if (!student.room) {
        enqueueSnackbar('This student does not have a room allocated. Attendance can only be marked for students with allocated rooms.', { variant: 'warning' });
        // Clear fields if student doesn't have a room
        setFormData(prev => ({
          ...prev,
          studentName: '',
          course: '',
          year: '',
        }));
        return;
      }

      // Auto-populate form fields
      setFormData(prev => ({
        ...prev,
        studentId: student.studentId || prev.studentId,
        studentName: student.name || '',
        course: student.course || '',
        year: student.year || student.batchYear || '',
      }));

      enqueueSnackbar('Student details loaded successfully', { variant: 'success' });
    } catch (err) {
      // Only show error if we actually tried to fetch (studentId is valid)
      // Don't show error if studentId is empty or too short
      if (!studentId || !studentId.trim() || studentId.trim().length < 3) {
        return;
      }

      // Show specific error message for student not found
      if (err.response?.status === 404) {
        enqueueSnackbar('Not an authorized admission entry', { variant: 'error' });
        // Clear fields if student not found
        setFormData(prev => ({
          ...prev,
          studentName: '',
          course: '',
          year: '',
        }));
      } else {
        enqueueSnackbar(err.response?.data?.message || 'Failed to fetch student details', { variant: 'error' });
      }
    } finally {
      setFetchingStudent(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation
    if (!formData.studentId || !formData.studentName) {
      enqueueSnackbar('Please enter a valid Student ID and ensure student details are loaded', { variant: 'warning' });
      return;
    }

    if (!formData.date) {
      enqueueSnackbar('Please select a date', { variant: 'warning' });
      return;
    }

    try {
      setLoading(true);
      
      // First, get the student by studentId to get their _id
      const student = await adminService.getStudentByStudentId(formData.studentId);
      
      // Check if student has a room allocated
      if (!student.room) {
        enqueueSnackbar('Attendance can only be marked for students with allocated rooms. Please allocate a room to this student first.', { variant: 'error' });
        setLoading(false);
        return;
      }
      
      // Map frontend status to backend status (lowercase)
      const statusMap = {
        'Present': 'present',
        'Absent': 'absent',
        'Late': 'late',
        'Excused': 'excused',
      };
      
      // Prepare attendance data
      const attendanceData = {
        type: 'student',
        studentId: student._id,
        date: formData.date,
        status: statusMap[formData.status] || 'present',
        remarks: '',
      };
      
      await adminService.markAttendance(attendanceData);
      
      enqueueSnackbar('Attendance marked successfully', { variant: 'success' });
      
      // Reset form
      setFormData({
        studentId: '',
        studentName: '',
        course: '',
        year: '',
        date: getTodayDate(),
        status: 'Present',
      });
      
      // Refresh attendance history if on that tab
      if (tabValue === 1) {
        await fetchAttendanceHistory();
      }
    } catch (err) {
      enqueueSnackbar(err.response?.data?.message || 'Failed to mark attendance', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const fetchAttendanceHistory = async () => {
    try {
      setHistoryLoading(true);
      
      // Build query parameters
      const params = {
        type: 'student',
      };
      
      // Add date filter if provided
      if (historyFilters.date) {
        const dateStr = historyFilters.date instanceof Date 
          ? historyFilters.date.toISOString().split('T')[0]
          : historyFilters.date;
        params.startDate = dateStr;
        params.endDate = dateStr;
      }
      
      // Fetch attendance records
      const attendanceRecords = await adminService.getAttendance(params);
      
      // Filter by status if not 'all'
      let filteredRecords = attendanceRecords;
      if (historyFilters.status !== 'all') {
        const statusMap = {
          'Present': 'present',
          'Absent': 'absent',
          'Late': 'late',
          'Excused': 'excused',
        };
        filteredRecords = attendanceRecords.filter(record => 
          record.status === statusMap[historyFilters.status]
        );
      }
      
      // Filter by search term if provided
      if (historyFilters.search) {
        const searchLower = historyFilters.search.toLowerCase();
        filteredRecords = filteredRecords.filter(record => 
          record.student?.name?.toLowerCase().includes(searchLower) ||
          record.student?.studentId?.toLowerCase().includes(searchLower) ||
          record.remarks?.toLowerCase().includes(searchLower)
        );
      }
      
      // Transform records for display
      const transformedRecords = filteredRecords.map(record => ({
        _id: record._id,
        date: record.date,
        studentId: record.student?.studentId || 'N/A',
        studentName: record.student?.name || 'N/A',
        course: record.student?.course || 'N/A',
        status: record.status.charAt(0).toUpperCase() + record.status.slice(1),
        markedBy: record.markedBy?.name || 'N/A',
      }));
      
      setAttendanceHistory(transformedRecords);
    } catch (err) {
      enqueueSnackbar(err.response?.data?.message || 'Failed to fetch attendance history', { variant: 'error' });
      setAttendanceHistory([]);
    } finally {
      setHistoryLoading(false);
    }
  };

  useEffect(() => {
    if (tabValue === 1) {
      fetchAttendanceHistory();
    }
  }, [tabValue]);

  // Refresh attendance when filters change
  useEffect(() => {
    if (tabValue === 1) {
      const timer = setTimeout(() => {
        fetchAttendanceHistory();
      }, 300); // Debounce filter changes
      return () => clearTimeout(timer);
    }
  }, [historyFilters]);

  // Cleanup timer on unmount and when component unmounts
  useEffect(() => {
    return () => {
      if (studentIdTimer) {
        clearTimeout(studentIdTimer);
        setStudentIdTimer(null);
      }
    };
  }, [studentIdTimer]);

  // Clear timer when switching tabs
  useEffect(() => {
    if (tabValue !== 0 && studentIdTimer) {
      clearTimeout(studentIdTimer);
      setStudentIdTimer(null);
    }
  }, [tabValue]);

  const courseOptions = [
    'Computer Science',
    'Electronics',
    'Mechanical',
    'Civil',
    'Electrical',
    'Information Technology',
    'Business Administration',
    'Commerce',
  ];

  const yearOptions = [
    '1st Year',
    '2nd Year',
    '3rd Year',
    '4th Year',
  ];

  return (
    <ComponentsWrapper title="Student Attendance">
      <Stack spacing={3}>
        <PresentationCard>
          <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
            <Tabs value={tabValue} onChange={handleTabChange}>
              <Tab label="Mark Attendance" />
              <Tab label="View Attendance" />
            </Tabs>
          </Box>

          {/* Mark Attendance Tab */}
          <TabPanel value={tabValue} index={0}>
            <form onSubmit={handleSubmit}>
              <Grid container spacing={3}>
                {/* Student ID */}
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Stack spacing={1}>
                    <Typography variant="subtitle2" fontWeight={600}>
                      Student ID <span style={{ color: 'red' }}>*</span>
                    </Typography>
                    <TextField
                      fullWidth
                      placeholder="Enter Student ID"
                      value={formData.studentId}
                      onChange={(e) => handleInputChange('studentId', e.target.value)}
                      InputProps={{
                        startAdornment: (
                          <Box sx={{ mr: 1, display: 'flex', alignItems: 'center' }}>
                            {fetchingStudent ? (
                              <CircularProgress size={18} />
                            ) : (
                              <IconUser size={18} style={{ color: '#999' }} />
                            )}
                          </Box>
                        ),
                      }}
                      helperText={fetchingStudent ? 'Fetching student details...' : 'Enter student ID to auto-load details'}
                    />
                  </Stack>
                </Grid>

                {/* Student Name */}
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Stack spacing={1}>
                    <Typography variant="subtitle2" fontWeight={600}>
                      Student Name
                    </Typography>
                    <TextField
                      fullWidth
                      placeholder="Auto-filled from Student ID"
                      value={formData.studentName}
                      onChange={(e) => handleInputChange('studentName', e.target.value)}
                      disabled={!formData.studentId}
                      InputProps={{
                        startAdornment: <IconUser size={18} style={{ marginRight: 8, color: '#999' }} />,
                      }}
                    />
                  </Stack>
                </Grid>

                {/* Course */}
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Stack spacing={1}>
                    <Typography variant="subtitle2" fontWeight={600}>
                      Course
                    </Typography>
                    <FormControl fullWidth>
                      <Select
                        value={formData.course}
                        onChange={(e) => handleInputChange('course', e.target.value)}
                        disabled={!formData.studentId}
                        startAdornment={<IconBook size={18} style={{ marginRight: 8, color: '#999' }} />}
                      >
                        <MenuItem value="">Select Course</MenuItem>
                        {courseOptions.map((course) => (
                          <MenuItem key={course} value={course}>
                            {course}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Stack>
                </Grid>

                {/* Year */}
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Stack spacing={1}>
                    <Typography variant="subtitle2" fontWeight={600}>
                      Year
                    </Typography>
                    <FormControl fullWidth>
                      <Select
                        value={formData.year}
                        onChange={(e) => handleInputChange('year', e.target.value)}
                        disabled={!formData.studentId}
                      >
                        <MenuItem value="">Select Year</MenuItem>
                        {yearOptions.map((year) => (
                          <MenuItem key={year} value={year}>
                            {year}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Stack>
                </Grid>

                {/* Date */}
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Stack spacing={1}>
                    <Typography variant="subtitle2" fontWeight={600}>
                      Date <span style={{ color: 'red' }}>*</span>
                    </Typography>
                    <TextField
                      fullWidth
                      type="date"
                      value={formData.date}
                      onChange={(e) => handleInputChange('date', e.target.value)}
                      InputLabelProps={{
                        shrink: true,
                      }}
                      InputProps={{
                        startAdornment: <IconCalendar size={18} style={{ marginRight: 8, color: '#999' }} />,
                      }}
                    />
                  </Stack>
                </Grid>

                {/* Status */}
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Stack spacing={1}>
                    <Typography variant="subtitle2" fontWeight={600}>
                      Status <span style={{ color: 'red' }}>*</span>
                    </Typography>
                    <FormControl fullWidth>
                      <Select
                        value={formData.status}
                        onChange={(e) => handleInputChange('status', e.target.value)}
                      >
                        <MenuItem value="Present">Present</MenuItem>
                        <MenuItem value="Absent">Absent</MenuItem>
                        <MenuItem value="Late">Late</MenuItem>
                        <MenuItem value="Excused">Excused</MenuItem>
                      </Select>
                    </FormControl>
                  </Stack>
                </Grid>

                {/* Submit Button */}
                <Grid size={{ xs: 12 }}>
                  <Button
                    type="submit"
                    variant="contained"
                    color="primary"
                    size="large"
                    fullWidth
                    disabled={loading || !formData.studentId || !formData.studentName}
                    startIcon={loading ? <CircularProgress size={20} /> : <IconCheck size={20} />}
                    sx={{ py: 1.5 }}
                  >
                    {loading ? 'Saving...' : 'Save Attendance'}
                  </Button>
                </Grid>
              </Grid>
            </form>
          </TabPanel>

          {/* View Attendance Tab */}
          <TabPanel value={tabValue} index={1}>
            <Stack spacing={3}>
              {/* Summary Statistics */}
              {attendanceHistory.length > 0 && (
                <Card variant="outlined" sx={{ bgcolor: 'background.default' }}>
                  <CardContent>
                    <Grid container spacing={2}>
                      <Grid size={{ xs: 6, sm: 3 }}>
                        <Stack alignItems="center">
                          <Typography variant="h4" fontWeight={600} color="primary.main">
                            {attendanceHistory.length}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Total Records
                          </Typography>
                        </Stack>
                      </Grid>
                      <Grid size={{ xs: 6, sm: 3 }}>
                        <Stack alignItems="center">
                          <Typography variant="h4" fontWeight={600} color="success.main">
                            {attendanceHistory.filter(r => r.status === 'Present').length}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Present
                          </Typography>
                        </Stack>
                      </Grid>
                      <Grid size={{ xs: 6, sm: 3 }}>
                        <Stack alignItems="center">
                          <Typography variant="h4" fontWeight={600} color="error.main">
                            {attendanceHistory.filter(r => r.status === 'Absent').length}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Absent
                          </Typography>
                        </Stack>
                      </Grid>
                      <Grid size={{ xs: 6, sm: 3 }}>
                        <Stack alignItems="center">
                          <Typography variant="h4" fontWeight={600} color="warning.main">
                            {attendanceHistory.filter(r => r.status === 'Late').length}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Late
                          </Typography>
                        </Stack>
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              )}

              {/* Filters and View Toggle */}
              <Grid container spacing={2} alignItems="center">
                <Grid size={{ xs: 12, sm: 3 }}>
                  <TextField
                    fullWidth
                    type="date"
                    label="Reference Date"
                    value={historyFilters.date ? (historyFilters.date instanceof Date ? historyFilters.date.toISOString().split('T')[0] : historyFilters.date) : ''}
                    onChange={(e) => setHistoryFilters(prev => ({ ...prev, date: e.target.value ? new Date(e.target.value) : null }))}
                    InputLabelProps={{
                      shrink: true,
                    }}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 3 }}>
                  <FormControl fullWidth>
                    <InputLabel>Filter by Status</InputLabel>
                    <Select
                      value={historyFilters.status}
                      label="Filter by Status"
                      onChange={(e) => setHistoryFilters(prev => ({ ...prev, status: e.target.value }))}
                    >
                      <MenuItem value="all">All</MenuItem>
                      <MenuItem value="Present">Present</MenuItem>
                      <MenuItem value="Absent">Absent</MenuItem>
                      <MenuItem value="Late">Late</MenuItem>
                      <MenuItem value="Excused">Excused</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid size={{ xs: 12, sm: 4 }}>
                  <TextField
                    fullWidth
                    placeholder="Search by name or ID..."
                    value={historyFilters.search}
                    onChange={(e) => setHistoryFilters(prev => ({ ...prev, search: e.target.value }))}
                    InputProps={{
                      startAdornment: <IconSearch size={18} style={{ marginRight: 8, color: '#999' }} />,
                    }}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 2 }}>
                  <FormControl fullWidth>
                    <InputLabel>View</InputLabel>
                    <Select
                      value={viewMode}
                      label="View"
                      onChange={(e) => setViewMode(e.target.value)}
                    >
                      <MenuItem value="grouped">By Date</MenuItem>
                      <MenuItem value="flat">Flat List</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>

              {/* Attendance History */}
              {historyLoading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                  <CircularProgress />
                </Box>
              ) : attendanceHistory.length === 0 ? (
                <Alert severity="info">No attendance records found.</Alert>
              ) : viewMode === 'flat' ? (
                <TableContainer component={Paper} elevation={0} sx={{ border: 1, borderColor: 'divider', borderRadius: 2 }}>
                  <Table>
                    <TableHead>
                      <TableRow sx={{ bgcolor: 'grey.50' }}>
                        <TableCell><strong>Date</strong></TableCell>
                        <TableCell><strong>Student ID</strong></TableCell>
                        <TableCell><strong>Student Name</strong></TableCell>
                        <TableCell><strong>Course</strong></TableCell>
                        <TableCell><strong>Status</strong></TableCell>
                        <TableCell><strong>Marked By</strong></TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {attendanceHistory.map((record) => (
                        <TableRow key={record._id} hover>
                          <TableCell>
                            {new Date(record.date).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric'
                            })}
                          </TableCell>
                          <TableCell>{record.studentId}</TableCell>
                          <TableCell>{record.studentName}</TableCell>
                          <TableCell>{record.course}</TableCell>
                          <TableCell>
                            <Chip
                              label={record.status}
                              color={
                                record.status === 'Present' ? 'success' :
                                record.status === 'Absent' ? 'error' :
                                record.status === 'Late' ? 'warning' : 'info'
                              }
                              size="small"
                            />
                          </TableCell>
                          <TableCell>
                            <Typography variant="caption" color="text.secondary">
                              {record.markedBy}
                            </Typography>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              ) : (
                <Stack spacing={2}>
                  {/* Group attendance by date */}
                  {(() => {
                    // Group records by date
                    const groupedByDate = attendanceHistory.reduce((acc, record) => {
                      const dateKey = new Date(record.date).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      });
                      const dateKeyISO = new Date(record.date).toISOString().split('T')[0];
                      
                      if (!acc[dateKeyISO]) {
                        acc[dateKeyISO] = {
                          date: dateKey,
                          dateISO: dateKeyISO,
                          records: [],
                          presentCount: 0,
                          absentCount: 0,
                          lateCount: 0,
                          excusedCount: 0,
                        };
                      }
                      
                      acc[dateKeyISO].records.push(record);
                      
                      // Count by status
                      if (record.status === 'Present') acc[dateKeyISO].presentCount++;
                      else if (record.status === 'Absent') acc[dateKeyISO].absentCount++;
                      else if (record.status === 'Late') acc[dateKeyISO].lateCount++;
                      else if (record.status === 'Excused') acc[dateKeyISO].excusedCount++;
                      
                      return acc;
                    }, {});
                    
                    // Sort dates descending (most recent first)
                    const sortedDates = Object.keys(groupedByDate).sort((a, b) => new Date(b) - new Date(a));
                    
                    return sortedDates.map((dateISO) => {
                      const group = groupedByDate[dateISO];
                      // Sort records within each date by student name
                      const sortedRecords = group.records.sort((a, b) => 
                        a.studentName.localeCompare(b.studentName)
                      );
                      
                      return (
                        <Card key={dateISO} variant="outlined" sx={{ overflow: 'hidden' }}>
                          {/* Date Header */}
                          <Box sx={{ 
                            bgcolor: 'primary.main', 
                            color: 'primary.contrastText',
                            p: 2,
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            flexWrap: 'wrap',
                            gap: 2
                          }}>
                            <Stack direction="row" spacing={2} alignItems="center">
                              <IconCalendar size={20} />
                              <Typography variant="h6" fontWeight={600}>
                                {group.date}
                              </Typography>
                              <Chip 
                                label={`${group.records.length} ${group.records.length === 1 ? 'Student' : 'Students'}`}
                                size="small"
                                sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white' }}
                              />
                            </Stack>
                            <Stack direction="row" spacing={1} flexWrap="wrap">
                              {group.presentCount > 0 && (
                                <Chip 
                                  label={`${group.presentCount} Present`}
                                  size="small"
                                  sx={{ bgcolor: 'rgba(76,175,80,0.3)', color: 'white' }}
                                />
                              )}
                              {group.absentCount > 0 && (
                                <Chip 
                                  label={`${group.absentCount} Absent`}
                                  size="small"
                                  sx={{ bgcolor: 'rgba(244,67,54,0.3)', color: 'white' }}
                                />
                              )}
                              {group.lateCount > 0 && (
                                <Chip 
                                  label={`${group.lateCount} Late`}
                                  size="small"
                                  sx={{ bgcolor: 'rgba(255,152,0,0.3)', color: 'white' }}
                                />
                              )}
                              {group.excusedCount > 0 && (
                                <Chip 
                                  label={`${group.excusedCount} Excused`}
                                  size="small"
                                  sx={{ bgcolor: 'rgba(33,150,243,0.3)', color: 'white' }}
                                />
                              )}
                            </Stack>
                          </Box>
                          
                          {/* Students Table for this date */}
                          <TableContainer>
                            <Table size="small">
                              <TableHead>
                                <TableRow sx={{ bgcolor: 'grey.50' }}>
                                  <TableCell><strong>Student ID</strong></TableCell>
                                  <TableCell><strong>Student Name</strong></TableCell>
                                  <TableCell><strong>Course</strong></TableCell>
                                  <TableCell><strong>Status</strong></TableCell>
                                  <TableCell><strong>Marked By</strong></TableCell>
                                </TableRow>
                              </TableHead>
                              <TableBody>
                                {sortedRecords.map((record, idx) => (
                                  <TableRow 
                                    key={record._id} 
                                    hover
                                    sx={{ 
                                      bgcolor: idx % 2 === 0 ? 'background.paper' : 'grey.50'
                                    }}
                                  >
                                    <TableCell>
                                      <Typography variant="body2" fontWeight={500}>
                                        {record.studentId}
                                      </Typography>
                                    </TableCell>
                                    <TableCell>
                                      <Typography variant="body2">
                                        {record.studentName}
                                      </Typography>
                                    </TableCell>
                                    <TableCell>
                                      <Typography variant="body2" color="text.secondary">
                                        {record.course}
                                      </Typography>
                                    </TableCell>
                                    <TableCell>
                                      <Chip
                                        label={record.status}
                                        color={
                                          record.status === 'Present' ? 'success' :
                                          record.status === 'Absent' ? 'error' :
                                          record.status === 'Late' ? 'warning' : 'info'
                                        }
                                        size="small"
                                      />
                                    </TableCell>
                                    <TableCell>
                                      <Typography variant="caption" color="text.secondary">
                                        {record.markedBy || 'System'}
                                      </Typography>
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </TableContainer>
                        </Card>
                      );
                    });
                  })()}
                </Stack>
              )}
            </Stack>
          </TabPanel>
        </PresentationCard>
      </Stack>
    </ComponentsWrapper>
  );
}
