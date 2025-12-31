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
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';

// @project
import ComponentsWrapper from '@/components/ComponentsWrapper';
import PresentationCard from '@/components/cards/PresentationCard';
import TabPanel from '@/components/TabPanel';
import adminService from '@/services/adminService';
import { useSnackbar } from 'notistack';

// @icons
import { 
  IconHome, 
  IconUsers, 
  IconSearch, 
  IconX, 
  IconCheck,
  IconAlertCircle,
  IconUserPlus
} from '@tabler/icons-react';

/***************************  ROOM ALLOCATION PAGE  ***************************/

export default function RoomAllocationPage() {
  const { enqueueSnackbar } = useSnackbar();
  const [loading, setLoading] = useState(true);
  const [students, setStudents] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [tabValue, setTabValue] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterGender, setFilterGender] = useState('all');
  const [filterBlock, setFilterBlock] = useState('all');
  
  // Allocation dialog
  const [allocationDialogOpen, setAllocationDialogOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [selectedRoomId, setSelectedRoomId] = useState('');
  const [availableRoomsForAllocation, setAvailableRoomsForAllocation] = useState([]);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [studentsData, roomsData] = await Promise.all([
        adminService.getAllStudents(),
        adminService.getAllRooms()
      ]);
      
      setStudents(studentsData?.students || studentsData || []);
      setRooms(roomsData?.rooms || roomsData || []);
    } catch (err) {
      enqueueSnackbar(err.response?.data?.message || 'Failed to load data', { variant: 'error' });
      setStudents([]);
      setRooms([]);
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  // Filter students
  const getFilteredStudents = () => {
    let filtered = students.filter(student => {
      const matchesSearch = !searchTerm || 
        student.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.studentId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.email?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = filterStatus === 'all' || 
        (filterStatus === 'allocated' && student.room) ||
        (filterStatus === 'unallocated' && !student.room);
      
      const matchesGender = filterGender === 'all' || student.gender === filterGender;

      return matchesSearch && matchesStatus && matchesGender;
    });

    return filtered;
  };

  const allocatedStudents = getFilteredStudents().filter(s => s.room);
  const unallocatedStudents = getFilteredStudents().filter(s => !s.room);

  // Statistics
  const stats = {
    total: students.length,
    allocated: students.filter(s => s.room).length,
    unallocated: students.filter(s => !s.room).length,
  };

  const handleOpenAllocationDialog = async (student) => {
    setSelectedStudent(student);
    
    // Get available rooms matching student's gender
    const genderFilter = student.gender || 'all';
    const available = rooms.filter(room => {
      const hasSpace = (room.currentOccupancy || 0) < room.capacity;
      const notMaintenance = room.maintenanceStatus !== 'under_maintenance' && room.maintenanceStatus !== 'blocked';
      const genderMatch = genderFilter === 'all' || !room.gender || room.gender === genderFilter;
      return hasSpace && notMaintenance && genderMatch;
    });
    
    setAvailableRoomsForAllocation(available);
    setAllocationDialogOpen(true);
  };

  const handleAllocateRoom = async () => {
    if (!selectedStudent || !selectedRoomId) {
      enqueueSnackbar('Please select a room', { variant: 'warning' });
      return;
    }

    try {
      setProcessing(true);
      await adminService.allocateRoom(selectedStudent._id, selectedRoomId);
      enqueueSnackbar('Room allocated successfully', { variant: 'success' });
      setAllocationDialogOpen(false);
      setSelectedStudent(null);
      setSelectedRoomId('');
      await fetchData();
    } catch (err) {
      enqueueSnackbar(err.response?.data?.message || 'Failed to allocate room', { variant: 'error' });
    } finally {
      setProcessing(false);
    }
  };

  const handleDeallocateRoom = async (student) => {
    if (!window.confirm(`Are you sure you want to deallocate room from ${student.name}?`)) {
      return;
    }

    try {
      setProcessing(true);
      await adminService.deallocateRoom(student._id);
      enqueueSnackbar('Room deallocated successfully', { variant: 'success' });
      await fetchData();
    } catch (err) {
      enqueueSnackbar(err.response?.data?.message || 'Failed to deallocate room', { variant: 'error' });
    } finally {
      setProcessing(false);
    }
  };

  const getRoomDetails = (roomId) => {
    return rooms.find(r => r._id === roomId);
  };

  const uniqueBlocks = [...new Set(rooms.map(r => r.block).filter(Boolean))];

  return (
    <ComponentsWrapper title="Room Allocation">
      <Stack spacing={3}>
        {/* Statistics Cards */}
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, sm: 4 }}>
            <Card sx={{ bgcolor: 'primary.lighter', color: 'primary.main' }}>
              <CardContent>
                <Stack spacing={1}>
                  <Typography variant="h4" fontWeight={600}>{stats.total}</Typography>
                  <Typography variant="body2">Total Students</Typography>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 12, sm: 4 }}>
            <Card sx={{ bgcolor: 'success.lighter', color: 'success.main' }}>
              <CardContent>
                <Stack spacing={1}>
                  <Typography variant="h4" fontWeight={600}>{stats.allocated}</Typography>
                  <Typography variant="body2">Allocated</Typography>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 12, sm: 4 }}>
            <Card sx={{ bgcolor: 'warning.lighter', color: 'warning.main' }}>
              <CardContent>
                <Stack spacing={1}>
                  <Typography variant="h4" fontWeight={600}>{stats.unallocated}</Typography>
                  <Typography variant="body2">Unallocated</Typography>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

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
                  <InputLabel>Allocation Status</InputLabel>
                  <Select
                    value={filterStatus}
                    label="Allocation Status"
                    onChange={(e) => setFilterStatus(e.target.value)}
                  >
                    <MenuItem value="all">All Students</MenuItem>
                    <MenuItem value="allocated">Allocated</MenuItem>
                    <MenuItem value="unallocated">Unallocated</MenuItem>
                  </Select>
                </FormControl>
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
            </Grid>
          </Stack>
        </PresentationCard>

        {/* Tabs */}
        <PresentationCard>
          <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
            <Tabs value={tabValue} onChange={handleTabChange}>
              <Tab label={`Allocated Rooms (${allocatedStudents.length})`} />
              <Tab label={`Unallocated Students (${unallocatedStudents.length})`} />
            </Tabs>
          </Box>

          {/* Allocated Students Tab */}
          <TabPanel value={tabValue} index={0}>
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                <CircularProgress />
              </Box>
            ) : allocatedStudents.length === 0 ? (
              <Alert severity="info">No students with allocated rooms found.</Alert>
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
                      <TableCell><strong>Actions</strong></TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {allocatedStudents
                      .filter(student => {
                        if (filterBlock === 'all') return true;
                        const room = getRoomDetails(student.room?._id || student.room);
                        return room?.block === filterBlock;
                      })
                      .map((student) => {
                        const room = getRoomDetails(student.room?._id || student.room);
                        return (
                          <TableRow key={student._id} hover>
                            <TableCell>{student.name}</TableCell>
                            <TableCell>{student.studentId}</TableCell>
                            <TableCell>{student.course || 'N/A'}</TableCell>
                            <TableCell>{student.gender || 'N/A'}</TableCell>
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
                              <Stack direction="row" spacing={1}>
                                <Button
                                  variant="outlined"
                                  color="error"
                                  size="small"
                                  startIcon={<IconX size={16} />}
                                  onClick={() => handleDeallocateRoom(student)}
                                  disabled={processing}
                                >
                                  Deallocate
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
          </TabPanel>

          {/* Unallocated Students Tab */}
          <TabPanel value={tabValue} index={1}>
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                <CircularProgress />
              </Box>
            ) : unallocatedStudents.length === 0 ? (
              <Alert severity="success">All students have rooms allocated!</Alert>
            ) : (
              <TableContainer component={Paper} elevation={0} sx={{ border: 1, borderColor: 'divider', borderRadius: 2 }}>
                <Table>
                  <TableHead>
                    <TableRow sx={{ bgcolor: 'grey.50' }}>
                      <TableCell><strong>Student Name</strong></TableCell>
                      <TableCell><strong>Student ID</strong></TableCell>
                      <TableCell><strong>Course</strong></TableCell>
                      <TableCell><strong>Gender</strong></TableCell>
                      <TableCell><strong>Year</strong></TableCell>
                      <TableCell><strong>Status</strong></TableCell>
                      <TableCell><strong>Actions</strong></TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {unallocatedStudents.map((student) => (
                      <TableRow key={student._id} hover>
                        <TableCell>{student.name}</TableCell>
                        <TableCell>{student.studentId}</TableCell>
                        <TableCell>{student.course || 'N/A'}</TableCell>
                        <TableCell>{student.gender || 'N/A'}</TableCell>
                        <TableCell>{student.year || 'N/A'}</TableCell>
                        <TableCell>
                          <Chip
                            label={student.status || 'active'}
                            color={student.status === 'active' ? 'success' : student.status === 'suspended' ? 'error' : 'info'}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="contained"
                            color="primary"
                            size="small"
                            startIcon={<IconUserPlus size={16} />}
                            onClick={() => handleOpenAllocationDialog(student)}
                            disabled={processing || !student.gender}
                          >
                            Allocate Room
                          </Button>
                          {!student.gender && (
                            <Alert severity="warning" sx={{ mt: 1, fontSize: '0.75rem' }}>
                              Gender not set
                            </Alert>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </TabPanel>
        </PresentationCard>

        {/* Allocation Dialog */}
        <Dialog 
          open={allocationDialogOpen} 
          onClose={() => {
            setAllocationDialogOpen(false);
            setSelectedStudent(null);
            setSelectedRoomId('');
          }} 
          maxWidth="md" 
          fullWidth
        >
          <DialogTitle>
            Allocate Room to {selectedStudent?.name}
          </DialogTitle>
          <DialogContent>
            <Stack spacing={3} sx={{ mt: 2 }}>
              <Alert severity="info">
                Select an available room for {selectedStudent?.name} ({selectedStudent?.studentId}).
                Only rooms matching the student's gender ({selectedStudent?.gender}) are shown.
              </Alert>

              {availableRoomsForAllocation.length === 0 ? (
                <Alert severity="warning">
                  No available rooms found for {selectedStudent?.gender}. Please create rooms or check maintenance status.
                </Alert>
              ) : (
                <FormControl fullWidth>
                  <InputLabel>Select Room</InputLabel>
                  <Select
                    value={selectedRoomId}
                    label="Select Room"
                    onChange={(e) => setSelectedRoomId(e.target.value)}
                  >
                    {availableRoomsForAllocation.map((room) => {
                      const availableSlots = room.capacity - (room.currentOccupancy || 0);
                      return (
                        <MenuItem key={room._id} value={room._id}>
                          <Stack direction="row" spacing={2} alignItems="center" sx={{ width: '100%' }}>
                            <Box>
                              <Typography variant="body1" fontWeight={600}>
                                {room.roomNumber} - {room.block || 'N/A'}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {room.roomType} • Floor: {room.floor === 0 ? 'Ground' : `${room.floor}`} • 
                                Available: {availableSlots}/{room.capacity} • 
                                ₹{room.totalPrice?.toLocaleString()}/year
                              </Typography>
                            </Box>
                          </Stack>
                        </MenuItem>
                      );
                    })}
                  </Select>
                </FormControl>
              )}

              {selectedRoomId && (() => {
                const selectedRoom = availableRoomsForAllocation.find(r => r._id === selectedRoomId);
                if (!selectedRoom) return null;
                return (
                  <Card variant="outlined" sx={{ p: 2, bgcolor: 'primary.lighter' }}>
                    <Stack spacing={1}>
                      <Typography variant="subtitle2" fontWeight={600}>Selected Room Details:</Typography>
                      <Grid container spacing={1}>
                        <Grid size={6}>
                          <Typography variant="caption" color="text.secondary">Room Number:</Typography>
                          <Typography variant="body2" fontWeight={600}>{selectedRoom.roomNumber}</Typography>
                        </Grid>
                        <Grid size={6}>
                          <Typography variant="caption" color="text.secondary">Block:</Typography>
                          <Typography variant="body2" fontWeight={600}>{selectedRoom.block || 'N/A'}</Typography>
                        </Grid>
                        <Grid size={6}>
                          <Typography variant="caption" color="text.secondary">Type:</Typography>
                          <Typography variant="body2" fontWeight={600}>{selectedRoom.roomType}</Typography>
                        </Grid>
                        <Grid size={6}>
                          <Typography variant="caption" color="text.secondary">Price/Year:</Typography>
                          <Typography variant="body2" fontWeight={600}>₹{selectedRoom.totalPrice?.toLocaleString() || 'N/A'}</Typography>
                        </Grid>
                      </Grid>
                    </Stack>
                  </Card>
                );
              })()}
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button 
              onClick={() => {
                setAllocationDialogOpen(false);
                setSelectedStudent(null);
                setSelectedRoomId('');
              }}
              disabled={processing}
            >
              Cancel
            </Button>
            <Button
              variant="contained"
              color="primary"
              onClick={handleAllocateRoom}
              disabled={processing || !selectedRoomId || availableRoomsForAllocation.length === 0}
              startIcon={processing ? <CircularProgress size={18} /> : <IconCheck size={18} />}
            >
              {processing ? 'Allocating...' : 'Allocate Room'}
            </Button>
          </DialogActions>
        </Dialog>
      </Stack>
    </ComponentsWrapper>
  );
}
