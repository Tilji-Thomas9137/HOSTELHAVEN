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
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import Chip from '@mui/material/Chip';
import IconButton from '@mui/material/IconButton';
import Box from '@mui/material/Box';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';

// @project
import ComponentsWrapper from '@/components/ComponentsWrapper';
import PresentationCard from '@/components/cards/PresentationCard';
import adminService from '@/services/adminService';
import { useRouter } from '@/utils/navigation';

// @icons
import { IconPlus, IconEdit, IconTrash, IconEye } from '@tabler/icons-react';
import { useSnackbar } from 'notistack';

/***************************  STUDENTS PAGE  ***************************/

export default function StudentsPage() {
  const router = useRouter();
  const { enqueueSnackbar } = useSnackbar();
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await adminService.getAllStudents();
      // API returns { students, totalPages, currentPage, total }
      // Extract the students array from the response
      setStudents(response?.students || response || []);
    } catch (err) {
      console.error('Error fetching students:', err);
      setError(err.response?.data?.message || err.message || 'Failed to load students');
      setStudents([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id, student) => {
    // Check if student has a room allocated
    if (student?.room) {
      const roomNumber = student.room?.roomNumber || student.room;
      alert(`Cannot delete student. Student is currently allocated to room ${roomNumber}. Please deallocate the room first.`);
      return;
    }

    if (!window.confirm('Are you sure you want to delete this student?')) return;

    try {
      await adminService.deleteStudent(id);
      enqueueSnackbar('Student deleted successfully', { variant: 'success' });
      fetchStudents(); // Refresh list
    } catch (err) {
      console.error('Error deleting student:', err);
      enqueueSnackbar(err.response?.data?.message || 'Failed to delete student', { variant: 'error' });
    }
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'active':
        return 'success';
      case 'graduated':
        return 'info';
      case 'suspended':
        return 'error';
      default:
        return 'default';
    }
  };

  const handleStatusChange = async (studentId, newStatus) => {
    try {
      await adminService.updateStudent(studentId, { status: newStatus });
      enqueueSnackbar('Student status updated successfully', { variant: 'success' });
      fetchStudents(); // Refresh list
    } catch (err) {
      console.error('Error updating student status:', err);
      enqueueSnackbar(err.response?.data?.message || 'Failed to update student status', { variant: 'error' });
    }
  };

  return (
    <ComponentsWrapper title="Students Management">
      <Stack spacing={3}>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Typography variant="h6">All Students</Typography>
          <Button
            variant="contained"
            startIcon={<IconPlus size={18} />}
            onClick={() => router.push('/app/students/add')}
          >
            Add Student
          </Button>
        </Stack>

        {error && (
          <Alert severity="error" onClose={() => setError('')}>
            {error}
          </Alert>
        )}

        <PresentationCard>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
              <CircularProgress />
            </Box>
          ) : students.length === 0 ? (
            <Box sx={{ textAlign: 'center', p: 4 }}>
              <Typography variant="body2" color="text.secondary">
                No students found. Click "Add Student" to create one.
              </Typography>
            </Box>
          ) : (
            <TableContainer component={Paper} elevation={0} sx={{ border: 1, borderColor: 'divider', borderRadius: 2 }}>
              <Table>
                <TableHead>
                  <TableRow sx={{ bgcolor: 'grey.50' }}>
                    <TableCell><strong>Student ID</strong></TableCell>
                    <TableCell><strong>Name</strong></TableCell>
                    <TableCell><strong>Email</strong></TableCell>
                    <TableCell><strong>Phone</strong></TableCell>
                    <TableCell><strong>Course</strong></TableCell>
                    <TableCell><strong>Year</strong></TableCell>
                    <TableCell><strong>Room</strong></TableCell>
                    <TableCell><strong>Status</strong></TableCell>
                    <TableCell align="right"><strong>Actions</strong></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {students.map((student) => (
                    <TableRow key={student._id || student.id} hover>
                      <TableCell>{student.studentId || 'N/A'}</TableCell>
                      <TableCell>{student.name}</TableCell>
                      <TableCell>{student.email}</TableCell>
                      <TableCell>{student.phone || 'N/A'}</TableCell>
                      <TableCell>{student.course || 'N/A'}</TableCell>
                      <TableCell>{student.year || 'N/A'}</TableCell>
                      <TableCell>
                        {student.room?.roomNumber ? `${student.room.roomNumber} (${student.room.building || ''})` : 'Not Allocated'}
                      </TableCell>
                      <TableCell>
                        <FormControl size="small" sx={{ minWidth: 120 }}>
                          <Select
                            value={student.status || 'active'}
                            onChange={(e) => handleStatusChange(student._id || student.id, e.target.value)}
                            sx={{
                              height: '28px',
                              fontSize: '0.75rem',
                              '& .MuiSelect-select': {
                                py: 0.5,
                                px: 1,
                              },
                            }}
                          >
                            <MenuItem value="active">Active</MenuItem>
                            <MenuItem value="graduated">Graduated</MenuItem>
                            <MenuItem value="suspended">Suspended</MenuItem>
                          </Select>
                        </FormControl>
                      </TableCell>
                      <TableCell align="right">
                        <Stack direction="row" spacing={1} justifyContent="flex-end">
                          <IconButton
                            size="small"
                            onClick={() => router.push(`/app/students/${student._id || student.id}`)}
                            title="View Details"
                          >
                            <IconEye size={18} />
                          </IconButton>
                          <IconButton
                            size="small"
                            onClick={() => router.push(`/app/students/${student._id || student.id}/edit`)}
                            title="Edit"
                          >
                            <IconEdit size={18} />
                          </IconButton>
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => handleDelete(student._id || student.id, student)}
                            disabled={!!student.room}
                            title={student.room ? `Cannot delete student. Student is allocated to room ${student.room?.roomNumber || student.room}. Please deallocate the room first.` : 'Delete student'}
                          >
                            <IconTrash size={18} />
                          </IconButton>
                        </Stack>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </PresentationCard>
      </Stack>
    </ComponentsWrapper>
  );
}
