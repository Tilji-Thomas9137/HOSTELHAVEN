import { useState, useEffect } from 'react';

// @mui
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';
import Card from '@mui/material/Card';
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
import Grid from '@mui/material/Grid';
import Checkbox from '@mui/material/Checkbox';

// @project
import ComponentsWrapper from '@/components/ComponentsWrapper';
import PresentationCard from '@/components/cards/PresentationCard';
import adminService from '@/services/adminService';
import { useSnackbar } from 'notistack';

// @icons
import { 
  IconUsers, 
  IconBrain, 
  IconX, 
  IconCheck,
  IconTrash,
  IconUserPlus,
  IconSearch,
  IconDoor
} from '@tabler/icons-react';

/***************************  MATCHING POOL MANAGEMENT PAGE  ***************************/

export default function MatchingPoolPage() {
  const { enqueueSnackbar } = useSnackbar();
  const [loading, setLoading] = useState(true);
  const [poolEntries, setPoolEntries] = useState([]);
  const [tabValue, setTabValue] = useState(0);
  const [aiMatchingDialogOpen, setAiMatchingDialogOpen] = useState(false);
  const [assignRoomDialogOpen, setAssignRoomDialogOpen] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [availableRooms, setAvailableRooms] = useState([]);
  const [selectedRoom, setSelectedRoom] = useState('');
  const [matchingResults, setMatchingResults] = useState(null);
  const [matchingLoading, setMatchingLoading] = useState(false);
  const [matchingParams, setMatchingParams] = useState({
    roomType: 'Double',
    minScore: 50,
  });

  useEffect(() => {
    fetchMatchingPool();
  }, [tabValue]);

  const fetchMatchingPool = async () => {
    try {
      setLoading(true);
      const status = tabValue === 0 ? 'active' : tabValue === 1 ? 'matched' : tabValue === 2 ? 'allocated' : 'all';
      const data = await adminService.getMatchingPool({ status });
      setPoolEntries(data || []);
    } catch (error) {
      console.error('Error fetching matching pool:', error);
      enqueueSnackbar(error.response?.data?.message || 'Failed to fetch matching pool', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleRunAIMatching = async () => {
    try {
      setMatchingLoading(true);
      const result = await adminService.runAIMatching(matchingParams);
      setMatchingResults(result);
      enqueueSnackbar(`AI matching completed. Found ${result.groups.length} compatible groups.`, { variant: 'success' });
      await fetchMatchingPool();
    } catch (error) {
      console.error('Error running AI matching:', error);
      enqueueSnackbar(error.response?.data?.message || 'Failed to run AI matching', { variant: 'error' });
    } finally {
      setMatchingLoading(false);
    }
  };

  const handleOpenAssignRoomDialog = async (group) => {
    setSelectedGroup(group);
    try {
      const rooms = await adminService.getAllRooms({ 
        status: 'available',
        gender: group.gender,
        roomType: matchingParams.roomType,
      });
      // Filter rooms that have capacity
      const available = (rooms || []).filter(room => 
        (room.currentOccupancy || 0) + group.students.length <= room.capacity
      );
      setAvailableRooms(available);
    } catch (error) {
      console.error('Error fetching rooms:', error);
      enqueueSnackbar('Failed to fetch available rooms', { variant: 'error' });
    }
    setAssignRoomDialogOpen(true);
  };

  const handleAssignRoom = async () => {
    if (!selectedRoom || !selectedGroup) {
      enqueueSnackbar('Please select a room', { variant: 'warning' });
      return;
    }

    try {
      const studentIds = selectedGroup.students.map(s => s._id);
      await adminService.assignRoomToGroup({
        studentIds,
        roomId: selectedRoom,
      });
      enqueueSnackbar(`Room assigned to ${selectedGroup.students.length} students. Payment required to confirm.`, { variant: 'success' });
      setAssignRoomDialogOpen(false);
      setSelectedGroup(null);
      setSelectedRoom('');
      await fetchMatchingPool();
      if (matchingResults) {
        setMatchingResults({
          ...matchingResults,
          groups: matchingResults.groups.filter(g => 
            g.students.map(s => s._id).join(',') !== studentIds.join(',')
          ),
        });
      }
    } catch (error) {
      console.error('Error assigning room:', error);
      enqueueSnackbar(error.response?.data?.message || 'Failed to assign room', { variant: 'error' });
    }
  };

  const handleRemoveFromPool = async (studentId) => {
    if (!window.confirm('Are you sure you want to remove this student from the matching pool?')) {
      return;
    }

    try {
      await adminService.removeFromMatchingPool(studentId);
      enqueueSnackbar('Student removed from matching pool', { variant: 'success' });
      await fetchMatchingPool();
    } catch (error) {
      console.error('Error removing from pool:', error);
      enqueueSnackbar(error.response?.data?.message || 'Failed to remove student', { variant: 'error' });
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <ComponentsWrapper title="Roommate Matching Pool">
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
          <CircularProgress />
        </Box>
      </ComponentsWrapper>
    );
  }

  return (
    <ComponentsWrapper title="Roommate Matching Pool">
      <Stack spacing={3}>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h4">Matching Pool</Typography>
          <Button
            variant="contained"
            startIcon={<IconBrain size={20} />}
            onClick={() => setAiMatchingDialogOpen(true)}
          >
            Run AI Matching
          </Button>
        </Box>

        <Card>
          <Tabs value={tabValue} onChange={(e, newValue) => setTabValue(newValue)}>
            <Tab label={`Active (${poolEntries.filter(e => e.status === 'active').length})`} />
            <Tab label={`Matched (${poolEntries.filter(e => e.status === 'matched').length})`} />
            <Tab label={`Allocated (${poolEntries.filter(e => e.status === 'allocated').length})`} />
          </Tabs>
        </Card>

        {tabValue === 0 && poolEntries.length === 0 ? (
          <Alert severity="info">No active students in matching pool.</Alert>
        ) : (
          <TableContainer component={Paper} variant="outlined">
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: 'grey.50' }}>
                  <TableCell><strong>Student</strong></TableCell>
                  <TableCell><strong>Gender</strong></TableCell>
                  <TableCell><strong>Course/Year</strong></TableCell>
                  <TableCell><strong>AI Score</strong></TableCell>
                  <TableCell><strong>Matched Group</strong></TableCell>
                  <TableCell><strong>Status</strong></TableCell>
                  <TableCell><strong>Actions</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {poolEntries.map((entry) => (
                  <TableRow key={entry._id} hover>
                    <TableCell>
                      <Stack>
                        <Typography variant="body2" fontWeight={500}>
                          {entry.student?.name || 'N/A'}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {entry.student?.studentId || 'N/A'}
                        </Typography>
                      </Stack>
                    </TableCell>
                    <TableCell>{entry.student?.gender || 'N/A'}</TableCell>
                    <TableCell>
                      {entry.student?.course || 'N/A'} {entry.student?.year ? `• ${entry.student.year}` : ''}
                    </TableCell>
                    <TableCell>
                      {entry.aiMatchingScore ? (
                        <Chip 
                          label={`${entry.aiMatchingScore}%`} 
                          size="small" 
                          color={entry.aiMatchingScore >= 80 ? 'success' : entry.aiMatchingScore >= 60 ? 'warning' : 'default'}
                        />
                      ) : (
                        'N/A'
                      )}
                    </TableCell>
                    <TableCell>
                      {entry.matchedGroup && entry.matchedGroup.length > 0 ? (
                        <Typography variant="body2">
                          {entry.matchedGroup.length} roommate(s)
                        </Typography>
                      ) : (
                        'None'
                      )}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={entry.status}
                        size="small"
                        color={
                          entry.status === 'active' ? 'info' :
                          entry.status === 'matched' ? 'warning' :
                          entry.status === 'allocated' ? 'success' : 'default'
                        }
                      />
                    </TableCell>
                    <TableCell>
                      {entry.status === 'active' && (
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => handleRemoveFromPool(entry.student._id)}
                        >
                          <IconTrash size={16} />
                        </IconButton>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}

        {/* AI Matching Results */}
        {matchingResults && matchingResults.groups.length > 0 && (
          <PresentationCard>
            <Typography variant="h6" gutterBottom>
              AI Matching Results ({matchingResults.groups.length} groups)
            </Typography>
            <Stack spacing={2} sx={{ mt: 2 }}>
              {matchingResults.groups.map((group, idx) => (
                <Card key={idx} variant="outlined" sx={{ p: 2 }}>
                  <Stack spacing={2}>
                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                      <Stack>
                        <Typography variant="subtitle1" fontWeight={600}>
                          Group {idx + 1} - {group.gender}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Compatibility Score: {group.averageScore}%
                        </Typography>
                      </Stack>
                      <Button
                        variant="contained"
                        startIcon={<IconDoor size={16} />}
                        onClick={() => handleOpenAssignRoomDialog(group)}
                      >
                        Assign Room
                      </Button>
                    </Stack>
                    <Stack spacing={1}>
                      {group.students.map((student) => (
                        <Typography key={student._id} variant="body2">
                          • {student.name} ({student.studentId}) - {student.course}
                        </Typography>
                      ))}
                    </Stack>
                  </Stack>
                </Card>
              ))}
            </Stack>
          </PresentationCard>
        )}
      </Stack>

      {/* AI Matching Dialog */}
      <Dialog open={aiMatchingDialogOpen} onClose={() => setAiMatchingDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Typography variant="h5">Run AI Matching</Typography>
            <IconButton onClick={() => setAiMatchingDialogOpen(false)} size="small">
              <IconX size={20} />
            </IconButton>
          </Stack>
        </DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ mt: 1 }}>
            <FormControl fullWidth>
              <InputLabel>Room Type</InputLabel>
              <Select
                value={matchingParams.roomType}
                label="Room Type"
                onChange={(e) => setMatchingParams({ ...matchingParams, roomType: e.target.value })}
              >
                <MenuItem value="Single">Single</MenuItem>
                <MenuItem value="Double">Double</MenuItem>
                <MenuItem value="Triple">Triple</MenuItem>
                <MenuItem value="Quad">Quad</MenuItem>
              </Select>
            </FormControl>
            <TextField
              label="Minimum Compatibility Score"
              type="number"
              fullWidth
              value={matchingParams.minScore}
              onChange={(e) => setMatchingParams({ ...matchingParams, minScore: parseInt(e.target.value) || 50 })}
              inputProps={{ min: 0, max: 100 }}
              helperText="Minimum compatibility score (0-100) for matching"
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAiMatchingDialogOpen(false)}>Cancel</Button>
          <Button 
            variant="contained" 
            onClick={handleRunAIMatching}
            disabled={matchingLoading}
            startIcon={matchingLoading ? <CircularProgress size={16} /> : <IconBrain size={16} />}
          >
            {matchingLoading ? 'Matching...' : 'Run Matching'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Assign Room Dialog */}
      <Dialog open={assignRoomDialogOpen} onClose={() => setAssignRoomDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Typography variant="h5">Assign Room to Group</Typography>
            <IconButton onClick={() => setAssignRoomDialogOpen(false)} size="small">
              <IconX size={20} />
            </IconButton>
          </Stack>
        </DialogTitle>
        <DialogContent>
          {selectedGroup && (
            <Stack spacing={3} sx={{ mt: 1 }}>
              <Box>
                <Typography variant="subtitle2" gutterBottom>Selected Group:</Typography>
                {selectedGroup.students.map((student) => (
                  <Typography key={student._id} variant="body2">
                    • {student.name} ({student.studentId})
                  </Typography>
                ))}
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  Compatibility: {selectedGroup.averageScore}%
                </Typography>
              </Box>
              <FormControl fullWidth>
                <InputLabel>Select Room</InputLabel>
                <Select
                  value={selectedRoom}
                  label="Select Room"
                  onChange={(e) => setSelectedRoom(e.target.value)}
                >
                  {availableRooms.map((room) => (
                    <MenuItem key={room._id} value={room._id}>
                      {room.roomNumber} - {room.block} - Floor {room.floor} - {room.roomType} 
                      ({room.currentOccupancy}/{room.capacity}) - ₹{room.totalPrice?.toLocaleString('en-IN')}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              {availableRooms.length === 0 && (
                <Alert severity="warning">No available rooms found for this room type and gender.</Alert>
              )}
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAssignRoomDialogOpen(false)}>Cancel</Button>
          <Button 
            variant="contained" 
            onClick={handleAssignRoom}
            disabled={!selectedRoom}
            startIcon={<IconDoor size={16} />}
          >
            Assign Room
          </Button>
        </DialogActions>
      </Dialog>
    </ComponentsWrapper>
  );
}

