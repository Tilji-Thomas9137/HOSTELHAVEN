import { useState, useEffect } from 'react';

// @mui
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Grid';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
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
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import TextField from '@mui/material/TextField';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import IconButton from '@mui/material/IconButton';

// @project
import ComponentsWrapper from '@/components/ComponentsWrapper';
import PresentationCard from '@/components/cards/PresentationCard';
import adminService from '@/services/adminService';
import { useSnackbar } from 'notistack';

// @icons
import { 
  IconHome, 
  IconUsers, 
  IconSearch, 
  IconX, 
  IconAlertTriangle,
  IconUserMinus
} from '@tabler/icons-react';

/***************************  DEALLOCATE ROOM PAGE  ***************************/

export default function DeallocateRoomPage() {
  const { enqueueSnackbar } = useSnackbar();
  const [loading, setLoading] = useState(true);
  const [students, setStudents] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterGender, setFilterGender] = useState('all');
  const [filterBlock, setFilterBlock] = useState('all');
  const [filterRoomType, setFilterRoomType] = useState('all');
  
  // Deallocation dialog
  const [deallocationDialogOpen, setDeallocationDialogOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [deallocationReason, setDeallocationReason] = useState('');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [studentsData, roomsData] = await Promise.all([
        adminService.getAllStudents({ limit: 1000 }), // Get all students
        adminService.getAllRooms()
      ]);
      
      const allStudents = studentsData?.students || studentsData || [];
      // Filter to only show students with allocated rooms
      const allocatedStudents = allStudents.filter(s => s.room);
      
      setStudents(allocatedStudents);
      setRooms(roomsData?.rooms || roomsData || []);
    } catch (err) {
      enqueueSnackbar(err.response?.data?.message || 'Failed to load data', { variant: 'error' });
      setStudents([]);
      setRooms([]);
    } finally {
      setLoading(false);
    }
  };

  // Filter students
  const filteredStudents = students.filter(student => {
    const matchesSearch = !searchTerm || 
      student.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.studentId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.email?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesGender = filterGender === 'all' || student.gender === filterGender;

    if (filterBlock !== 'all' || filterRoomType !== 'all') {
      const room = getRoomDetails(student.room?._id || student.room);
      const matchesBlock = filterBlock === 'all' || room?.block === filterBlock;
      const matchesRoomType = filterRoomType === 'all' || room?.roomType === filterRoomType;
      return matchesSearch && matchesGender && matchesBlock && matchesRoomType;
    }

    return matchesSearch && matchesGender;
  });

  // Statistics
  const stats = {
    total: students.length,
    byGender: {
      boys: students.filter(s => s.gender === 'Boys').length,
      girls: students.filter(s => s.gender === 'Girls').length,
    }
  };

  const getRoomDetails = (roomId) => {
    return rooms.find(r => r._id === roomId);
  };

  const handleOpenDeallocationDialog = (student) => {
    setSelectedStudent(student);
    setDeallocationReason('');
    setDeallocationDialogOpen(true);
  };

  const handleDeallocateRoom = async () => {
    if (!selectedStudent) return;

    try {
      setProcessing(true);
      await adminService.deallocateRoom(selectedStudent._id);
      enqueueSnackbar(`Room deallocated successfully from ${selectedStudent.name}`, { variant: 'success' });
      setDeallocationDialogOpen(false);
      setSelectedStudent(null);
      setDeallocationReason('');
      await fetchData();
    } catch (err) {
      enqueueSnackbar(err.response?.data?.message || 'Failed to deallocate room', { variant: 'error' });
    } finally {
      setProcessing(false);
    }
  };

  const handleBulkDeallocate = async (studentIds) => {
    if (!window.confirm(`Are you sure you want to deallocate rooms from ${studentIds.length} student(s)?`)) {
      return;
    }

    try {
      setProcessing(true);
      const promises = studentIds.map(id => adminService.deallocateRoom(id));
      await Promise.all(promises);
      enqueueSnackbar(`Successfully deallocated rooms from ${studentIds.length} student(s)`, { variant: 'success' });
      await fetchData();
    } catch (err) {
      enqueueSnackbar(err.response?.data?.message || 'Failed to deallocate rooms', { variant: 'error' });
    } finally {
      setProcessing(false);
    }
  };

  const uniqueBlocks = [...new Set(rooms.map(r => r.block).filter(Boolean))];
  const uniqueRoomTypes = [...new Set(rooms.map(r => r.roomType).filter(Boolean))];

  return (
    <ComponentsWrapper title="Deallocate Room">
      <Stack spacing={3}>
        {/* Statistics Cards */}
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, sm: 4 }}>
            <Card sx={{ bgcolor: 'primary.lighter', color: 'primary.main' }}>
              <CardContent>
                <Stack spacing={1}>
                  <Typography variant="h4" fontWeight={600}>{stats.total}</Typography>
                  <Typography variant="body2">Students with Rooms</Typography>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 12, sm: 4 }}>
            <Card sx={{ bgcolor: 'info.lighter', color: 'info.main' }}>
              <CardContent>
                <Stack spacing={1}>
                  <Typography variant="h4" fontWeight={600}>{stats.byGender.boys}</Typography>
                  <Typography variant="body2">Boys</Typography>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 12, sm: 4 }}>
            <Card sx={{ bgcolor: 'warning.lighter', color: 'warning.main' }}>
              <CardContent>
                <Stack spacing={1}>
                  <Typography variant="h4" fontWeight={600}>{stats.byGender.girls}</Typography>
                  <Typography variant="body2">Girls</Typography>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Info Alert */}
        <Alert 
          severity="info" 
          icon={<IconAlertTriangle size={20} />}
          sx={{ borderRadius: 2 }}
        >
          <Typography variant="body2" fontWeight={600} gutterBottom>
            Deallocate Room from Students
          </Typography>
          <Typography variant="body2">
            Remove room allocation from students. This action will free up the room for other students. 
            Use this when students leave, graduate, or need to change rooms.
          </Typography>
        </Alert>

        {/* Filters */}
        <PresentationCard>
          <Stack spacing={2}>
            <Typography variant="h6">Filters</Typography>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <TextField
                  fullWidth
                  placeholder="Search students..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  InputProps={{
                    startAdornment: <IconSearch size={18} style={{ marginRight: 8, color: '#999' }} />
                  }}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <FormControl fullWidth>
                  <InputLabel>Gender</InputLabel>
                  <Select
                    value={filterGender}
                    label="Gender"
                    onChange={(e) => setFilterGender(e.target.value)}
                  >
                    <MenuItem value="all">All</MenuItem>
                    <MenuItem value="Boys">Boys</MenuItem>
                    <MenuItem value="Girls">Girls</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <FormControl fullWidth>
                  <InputLabel>Block</InputLabel>
                  <Select
                    value={filterBlock}
                    label="Block"
                    onChange={(e) => setFilterBlock(e.target.value)}
                  >
                    <MenuItem value="all">All Blocks</MenuItem>
                    {uniqueBlocks.map(block => (
                      <MenuItem key={block} value={block}>{block}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <FormControl fullWidth>
                  <InputLabel>Room Type</InputLabel>
                  <Select
                    value={filterRoomType}
                    label="Room Type"
                    onChange={(e) => setFilterRoomType(e.target.value)}
                  >
                    <MenuItem value="all">All Types</MenuItem>
                    {uniqueRoomTypes.map(type => (
                      <MenuItem key={type} value={type}>{type}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </Stack>
        </PresentationCard>

        {/* Students Table */}
        <PresentationCard>
          <Stack spacing={2}>
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Typography variant="h6">Students with Allocated Rooms</Typography>
              {filteredStudents.length > 0 && (
                <Button
                  variant="outlined"
                  color="error"
                  size="small"
                  startIcon={<IconUserMinus size={16} />}
                  onClick={() => handleBulkDeallocate(filteredStudents.map(s => s._id))}
                  disabled={processing}
                >
                  Bulk Deallocate ({filteredStudents.length})
                </Button>
              )}
            </Stack>

            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                <CircularProgress />
              </Box>
            ) : filteredStudents.length === 0 ? (
              <Alert severity="info">
                {students.length === 0 
                  ? 'No students with allocated rooms found.' 
                  : 'No students match the current filters.'}
              </Alert>
            ) : (
              <TableContainer component={Paper} elevation={0} sx={{ border: 1, borderColor: 'divider', borderRadius: 2 }}>
                <Table>
                  <TableHead>
                    <TableRow sx={{ bgcolor: 'grey.50' }}>
                      <TableCell><strong>Student Name</strong></TableCell>
                      <TableCell><strong>Student ID</strong></TableCell>
                      <TableCell><strong>Course</strong></TableCell>
                      <TableCell><strong>Gender</strong></TableCell>
                      <TableCell><strong>Room Number</strong></TableCell>
                      <TableCell><strong>Block</strong></TableCell>
                      <TableCell><strong>Floor</strong></TableCell>
                      <TableCell><strong>Room Type</strong></TableCell>
                      <TableCell><strong>Occupancy</strong></TableCell>
                      <TableCell><strong>Actions</strong></TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredStudents.map((student) => {
                      const room = getRoomDetails(student.room?._id || student.room);
                      return (
                        <TableRow key={student._id} hover>
                          <TableCell>{student.name}</TableCell>
                          <TableCell>{student.studentId}</TableCell>
                          <TableCell>{student.course || 'N/A'}</TableCell>
                          <TableCell>
                            <Chip 
                              label={student.gender || 'N/A'} 
                              size="small"
                              color={student.gender === 'Boys' ? 'info' : 'warning'}
                            />
                          </TableCell>
                          <TableCell>
                            {room ? (
                              <Chip label={room.roomNumber} color="success" size="small" />
                            ) : (
                              'N/A'
                            )}
                          </TableCell>
                          <TableCell>{room?.block || 'N/A'}</TableCell>
                          <TableCell>
                            {room?.floor !== null && room?.floor !== undefined
                              ? room.floor === 0
                                ? 'Ground Floor'
                                : `${room.floor}${room.floor === 1 ? 'st' : room.floor === 2 ? 'nd' : room.floor === 3 ? 'rd' : 'th'} Floor`
                              : 'N/A'}
                          </TableCell>
                          <TableCell>{room?.roomType || 'N/A'}</TableCell>
                          <TableCell>
                            {room ? (
                              <Chip 
                                label={`${room.currentOccupancy || 0}/${room.capacity}`}
                                color={room.currentOccupancy >= room.capacity ? 'success' : 'warning'}
                                size="small"
                              />
                            ) : (
                              'N/A'
                            )}
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="outlined"
                              color="error"
                              size="small"
                              startIcon={<IconX size={16} />}
                              onClick={() => handleOpenDeallocationDialog(student)}
                              disabled={processing}
                            >
                              Deallocate
                            </Button>
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

        {/* Deallocation Confirmation Dialog */}
        <Dialog 
          open={deallocationDialogOpen} 
          onClose={() => {
            setDeallocationDialogOpen(false);
            setSelectedStudent(null);
            setDeallocationReason('');
          }} 
          maxWidth="sm" 
          fullWidth
        >
          <DialogTitle>
            <Stack direction="row" spacing={1} alignItems="center">
              <IconAlertTriangle size={24} color="error" />
              <Typography variant="h6">Confirm Room Deallocation</Typography>
            </Stack>
          </DialogTitle>
          <DialogContent>
            <Stack spacing={3} sx={{ mt: 1 }}>
              <Alert severity="warning">
                You are about to deallocate the room from this student. This action will:
                <ul style={{ marginTop: 8, marginBottom: 0, paddingLeft: 20 }}>
                  <li>Remove the student from the room</li>
                  <li>Decrease the room's occupancy count</li>
                  <li>Make the room available for other students</li>
                </ul>
              </Alert>

              {selectedStudent && (() => {
                const room = getRoomDetails(selectedStudent.room?._id || selectedStudent.room);
                return (
                  <Card variant="outlined" sx={{ p: 2, bgcolor: 'grey.50' }}>
                    <Stack spacing={2}>
                      <Typography variant="subtitle2" fontWeight={600}>Student Details:</Typography>
                      <Grid container spacing={1}>
                        <Grid size={6}>
                          <Typography variant="caption" color="text.secondary">Name:</Typography>
                          <Typography variant="body2" fontWeight={600}>{selectedStudent.name}</Typography>
                        </Grid>
                        <Grid size={6}>
                          <Typography variant="caption" color="text.secondary">Student ID:</Typography>
                          <Typography variant="body2" fontWeight={600}>{selectedStudent.studentId}</Typography>
                        </Grid>
                        <Grid size={6}>
                          <Typography variant="caption" color="text.secondary">Course:</Typography>
                          <Typography variant="body2">{selectedStudent.course || 'N/A'}</Typography>
                        </Grid>
                        <Grid size={6}>
                          <Typography variant="caption" color="text.secondary">Gender:</Typography>
                          <Typography variant="body2">{selectedStudent.gender || 'N/A'}</Typography>
                        </Grid>
                      </Grid>
                    </Stack>
                  </Card>
                );
              })()}

              {selectedStudent && (() => {
                const room = getRoomDetails(selectedStudent.room?._id || selectedStudent.room);
                if (!room) return null;
                return (
                  <Card variant="outlined" sx={{ p: 2, bgcolor: 'error.lighter' }}>
                    <Stack spacing={2}>
                      <Typography variant="subtitle2" fontWeight={600} color="error.main">Room Details:</Typography>
                      <Grid container spacing={1}>
                        <Grid size={6}>
                          <Typography variant="caption" color="text.secondary">Room Number:</Typography>
                          <Typography variant="body2" fontWeight={600}>{room.roomNumber}</Typography>
                        </Grid>
                        <Grid size={6}>
                          <Typography variant="caption" color="text.secondary">Block:</Typography>
                          <Typography variant="body2" fontWeight={600}>{room.block || 'N/A'}</Typography>
                        </Grid>
                        <Grid size={6}>
                          <Typography variant="caption" color="text.secondary">Type:</Typography>
                          <Typography variant="body2">{room.roomType}</Typography>
                        </Grid>
                        <Grid size={6}>
                          <Typography variant="caption" color="text.secondary">Current Occupancy:</Typography>
                          <Typography variant="body2">{room.currentOccupancy || 0}/{room.capacity}</Typography>
                        </Grid>
                      </Grid>
                    </Stack>
                  </Card>
                );
              })()}

              <TextField
                fullWidth
                label="Reason for Deallocation (Optional)"
                multiline
                rows={3}
                value={deallocationReason}
                onChange={(e) => setDeallocationReason(e.target.value)}
                placeholder="e.g., Student graduated, Room change requested, etc."
              />
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button 
              onClick={() => {
                setDeallocationDialogOpen(false);
                setSelectedStudent(null);
                setDeallocationReason('');
              }}
              disabled={processing}
            >
              Cancel
            </Button>
            <Button
              variant="contained"
              color="error"
              onClick={handleDeallocateRoom}
              disabled={processing}
              startIcon={processing ? <CircularProgress size={18} /> : <IconX size={18} />}
            >
              {processing ? 'Deallocating...' : 'Confirm Deallocation'}
            </Button>
          </DialogActions>
        </Dialog>
      </Stack>
    </ComponentsWrapper>
  );
}
