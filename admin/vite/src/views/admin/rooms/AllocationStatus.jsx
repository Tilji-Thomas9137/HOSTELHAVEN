import { useState, useEffect } from 'react';

// @mui
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Grid';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import Alert from '@mui/material/Alert';

// @project
import ComponentsWrapper from '@/components/ComponentsWrapper';
import PresentationCard from '@/components/cards/PresentationCard';
import adminService from '@/services/adminService';
import { useSnackbar } from 'notistack';

// @icons
import { IconHome, IconUsers, IconAlertTriangle, IconSearch, IconFilter } from '@tabler/icons-react';

/***************************  ROOM ALLOCATION STATUS PAGE  ***************************/

export default function AllocationStatusPage() {
  const { enqueueSnackbar } = useSnackbar();
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterBlock, setFilterBlock] = useState('all');
  const [filterGender, setFilterGender] = useState('all');

  useEffect(() => {
    fetchRooms();
  }, []);

  const fetchRooms = async () => {
    try {
      setLoading(true);
      const data = await adminService.getAllRooms();
      setRooms(data.rooms || data || []);
    } catch (err) {
      enqueueSnackbar(err.response?.data?.message || 'Failed to load rooms', { variant: 'error' });
      setRooms([]);
    } finally {
      setLoading(false);
    }
  };

  // Calculate statistics
  const stats = {
    total: rooms.length,
    occupied: rooms.filter(r => {
      const totalOcc = (r.totalOccupancy !== undefined ? r.totalOccupancy : r.currentOccupancy) || 0;
      return totalOcc > 0 && totalOcc >= r.capacity;
    }).length,
    partiallyOccupied: rooms.filter(r => {
      const totalOcc = (r.totalOccupancy !== undefined ? r.totalOccupancy : r.currentOccupancy) || 0;
      return totalOcc > 0 && totalOcc < r.capacity;
    }).length,
    vacant: rooms.filter(r => {
      const totalOcc = (r.totalOccupancy !== undefined ? r.totalOccupancy : r.currentOccupancy) || 0;
      return totalOcc === 0;
    }).length,
    maintenance: rooms.filter(r => r.maintenanceStatus === 'under_maintenance' || r.maintenanceStatus === 'blocked').length,
  };

  // Filter rooms
  const filteredRooms = rooms.filter(room => {
    const totalOcc = (room.totalOccupancy !== undefined ? room.totalOccupancy : room.currentOccupancy) || 0;
    
    const matchesSearch = !searchTerm || 
      room.roomNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      room.block?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = filterStatus === 'all' || 
      (filterStatus === 'occupied' && totalOcc >= room.capacity) ||
      (filterStatus === 'partially' && totalOcc > 0 && totalOcc < room.capacity) ||
      (filterStatus === 'vacant' && totalOcc === 0) ||
      (filterStatus === 'maintenance' && (room.maintenanceStatus === 'under_maintenance' || room.maintenanceStatus === 'blocked'));
    
    const matchesBlock = filterBlock === 'all' || room.block === filterBlock;
    const matchesGender = filterGender === 'all' || room.gender === filterGender;

    return matchesSearch && matchesStatus && matchesBlock && matchesGender;
  });

  const uniqueBlocks = [...new Set(rooms.map(r => r.block).filter(Boolean))];

  const getStatusColor = (room) => {
    if (room.maintenanceStatus === 'under_maintenance' || room.maintenanceStatus === 'blocked') {
      return 'error';
    }
    const totalOcc = (room.totalOccupancy !== undefined ? room.totalOccupancy : room.currentOccupancy) || 0;
    if (totalOcc >= room.capacity) {
      return 'success';
    }
    if (totalOcc > 0) {
      return 'warning';
    }
    return 'default';
  };

  const getStatusLabel = (room) => {
    if (room.maintenanceStatus === 'under_maintenance') {
      return 'Under Maintenance';
    }
    if (room.maintenanceStatus === 'blocked') {
      return 'Blocked';
    }
    const totalOcc = (room.totalOccupancy !== undefined ? room.totalOccupancy : room.currentOccupancy) || 0;
    if (totalOcc >= room.capacity) {
      return 'Fully Occupied';
    }
    if (totalOcc > 0) {
      return 'Partially Occupied';
    }
    return 'Vacant';
  };

  return (
    <ComponentsWrapper title="Room Allocation Status">
      <Stack spacing={3}>
        {/* Statistics Cards */}
        <Grid container spacing={2}>
          <Grid size={{ xs: 6, sm: 4, md: 2.4 }}>
            <Card sx={{ bgcolor: 'primary.lighter', color: 'primary.main' }}>
              <CardContent>
                <Stack spacing={1}>
                  <Typography variant="h4" fontWeight={600}>{stats.total}</Typography>
                  <Typography variant="body2">Total Rooms</Typography>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 6, sm: 4, md: 2.4 }}>
            <Card sx={{ bgcolor: 'success.lighter', color: 'success.main' }}>
              <CardContent>
                <Stack spacing={1}>
                  <Typography variant="h4" fontWeight={600}>{stats.occupied}</Typography>
                  <Typography variant="body2">Fully Occupied</Typography>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 6, sm: 4, md: 2.4 }}>
            <Card sx={{ bgcolor: 'warning.lighter', color: 'warning.main' }}>
              <CardContent>
                <Stack spacing={1}>
                  <Typography variant="h4" fontWeight={600}>{stats.partiallyOccupied}</Typography>
                  <Typography variant="body2">Partially Occupied</Typography>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 6, sm: 4, md: 2.4 }}>
            <Card sx={{ bgcolor: 'grey.100', color: 'grey.700' }}>
              <CardContent>
                <Stack spacing={1}>
                  <Typography variant="h4" fontWeight={600}>{stats.vacant}</Typography>
                  <Typography variant="body2">Vacant</Typography>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 6, sm: 4, md: 2.4 }}>
            <Card sx={{ bgcolor: 'error.lighter', color: 'error.main' }}>
              <CardContent>
                <Stack spacing={1}>
                  <Typography variant="h4" fontWeight={600}>{stats.maintenance}</Typography>
                  <Typography variant="body2">Maintenance</Typography>
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
                  placeholder="Search rooms..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  InputProps={{
                    startAdornment: <IconSearch size={18} style={{ marginRight: 8, color: '#999' }} />
                  }}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <FormControl fullWidth>
                  <InputLabel>Status</InputLabel>
                  <Select
                    value={filterStatus}
                    label="Status"
                    onChange={(e) => setFilterStatus(e.target.value)}
                  >
                    <MenuItem value="all">All Status</MenuItem>
                    <MenuItem value="occupied">Fully Occupied</MenuItem>
                    <MenuItem value="partially">Partially Occupied</MenuItem>
                    <MenuItem value="vacant">Vacant</MenuItem>
                    <MenuItem value="maintenance">Maintenance</MenuItem>
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
            </Grid>
          </Stack>
        </PresentationCard>

        {/* Rooms Table */}
        <PresentationCard>
          <Stack spacing={2}>
            <Typography variant="h6">Room Allocation Details</Typography>
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                <CircularProgress />
              </Box>
            ) : filteredRooms.length === 0 ? (
              <Alert severity="info">No rooms found matching the filters.</Alert>
            ) : (
              <TableContainer component={Paper} elevation={0} sx={{ border: 1, borderColor: 'divider', borderRadius: 2 }}>
                <Table>
                  <TableHead>
                    <TableRow sx={{ bgcolor: 'grey.50' }}>
                      <TableCell><strong>Room Number</strong></TableCell>
                      <TableCell><strong>Block</strong></TableCell>
                      <TableCell><strong>Floor</strong></TableCell>
                      <TableCell><strong>Type</strong></TableCell>
                      <TableCell><strong>Gender</strong></TableCell>
                      <TableCell><strong>Capacity</strong></TableCell>
                      <TableCell><strong>Occupied</strong></TableCell>
                      <TableCell><strong>Available</strong></TableCell>
                      <TableCell><strong>Status</strong></TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredRooms.map((room) => {
                      const confirmedOcc = room.currentOccupancy || 0;
                      const temporaryOcc = room.temporaryOccupancy || 0;
                      const totalOcc = (room.totalOccupancy !== undefined ? room.totalOccupancy : confirmedOcc) || 0;
                      const available = room.capacity - totalOcc;

                      return (
                        <TableRow key={room._id} hover>
                          <TableCell>{room.roomNumber}</TableCell>
                          <TableCell>{room.block || 'N/A'}</TableCell>
                          <TableCell>
                            {room.floor !== null && room.floor !== undefined
                              ? room.floor === 0
                                ? 'Ground Floor'
                                : `${room.floor}${room.floor === 1 ? 'st' : room.floor === 2 ? 'nd' : room.floor === 3 ? 'rd' : 'th'} Floor`
                              : 'N/A'}
                          </TableCell>
                          <TableCell>{room.roomType}</TableCell>
                          <TableCell>{room.gender}</TableCell>
                          <TableCell>{room.capacity}</TableCell>
                          <TableCell>
                            <Stack direction="row" spacing={0.5} alignItems="center">
                              <Typography variant="body2" fontWeight={totalOcc > 0 ? 600 : 400}>
                                {totalOcc}
                              </Typography>
                              {temporaryOcc > 0 && (
                                <Chip 
                                  label={`${confirmedOcc} + ${temporaryOcc} pending`} 
                                  size="small" 
                                  color="info"
                                  sx={{ fontSize: '0.7rem', height: '20px' }}
                                />
                              )}
                            </Stack>
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={available}
                              size="small"
                              color={available > 0 ? 'success' : available === 0 ? 'error' : 'default'}
                            />
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={getStatusLabel(room)}
                              color={getStatusColor(room)}
                              size="small"
                            />
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
      </Stack>
    </ComponentsWrapper>
  );
}
