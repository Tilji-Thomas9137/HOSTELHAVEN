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
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Alert from '@mui/material/Alert';

// @project
import ComponentsWrapper from '@/components/ComponentsWrapper';
import PresentationCard from '@/components/cards/PresentationCard';
import TabPanel from '@/components/TabPanel';
import adminService from '@/services/adminService';
import { useSnackbar } from 'notistack';

// @icons
import { IconHome, IconUsers, IconSearch } from '@tabler/icons-react';

/***************************  VACANT OCCUPIED ROOMS PAGE  ***************************/

export default function VacantOccupiedPage() {
  const { enqueueSnackbar } = useSnackbar();
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tabValue, setTabValue] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterBlock, setFilterBlock] = useState('all');
  const [filterRoomType, setFilterRoomType] = useState('all');
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

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  // Filter rooms based on tab
  const getFilteredRooms = (status) => {
    let baseFilter = rooms.filter(room => {
      const matchesSearch = !searchTerm || 
        room.roomNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        room.block?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesBlock = filterBlock === 'all' || room.block === filterBlock;
      const matchesRoomType = filterRoomType === 'all' || room.roomType === filterRoomType;
      const matchesGender = filterGender === 'all' || room.gender === filterGender;

      return matchesSearch && matchesBlock && matchesRoomType && matchesGender;
    });

    if (status === 'vacant') {
      return baseFilter.filter(r => r.currentOccupancy === 0 && r.maintenanceStatus !== 'under_maintenance' && r.maintenanceStatus !== 'blocked');
    } else if (status === 'occupied') {
      return baseFilter.filter(r => r.currentOccupancy > 0);
    }
    return baseFilter;
  };

  const vacantRooms = getFilteredRooms('vacant');
  const occupiedRooms = getFilteredRooms('occupied');

  const uniqueBlocks = [...new Set(rooms.map(r => r.block).filter(Boolean))];
  const uniqueRoomTypes = [...new Set(rooms.map(r => r.roomType).filter(Boolean))];

  return (
    <ComponentsWrapper title="Vacant / Occupied Rooms">
      <Stack spacing={3}>
        {/* Statistics */}
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, sm: 6 }}>
            <Card sx={{ bgcolor: 'grey.100', border: 2, borderColor: 'grey.300' }}>
              <CardContent>
                <Stack direction="row" spacing={2} alignItems="center">
                  <Box sx={{ p: 2, borderRadius: 2, bgcolor: 'grey.200' }}>
                    <IconHome size={32} />
                  </Box>
                  <Stack>
                    <Typography variant="h4" fontWeight={600}>{vacantRooms.length}</Typography>
                    <Typography variant="body2" color="text.secondary">Vacant Rooms</Typography>
                  </Stack>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <Card sx={{ bgcolor: 'success.lighter', border: 2, borderColor: 'success.main' }}>
              <CardContent>
                <Stack direction="row" spacing={2} alignItems="center">
                  <Box sx={{ p: 2, borderRadius: 2, bgcolor: 'success.main', color: 'white' }}>
                    <IconUsers size={32} />
                  </Box>
                  <Stack>
                    <Typography variant="h4" fontWeight={600}>{occupiedRooms.length}</Typography>
                    <Typography variant="body2" color="text.secondary">Occupied Rooms</Typography>
                  </Stack>
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

        {/* Tabs */}
        <PresentationCard>
          <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
            <Tabs value={tabValue} onChange={handleTabChange}>
              <Tab label={`Vacant Rooms (${vacantRooms.length})`} />
              <Tab label={`Occupied Rooms (${occupiedRooms.length})`} />
            </Tabs>
          </Box>

          <TabPanel value={tabValue} index={0}>
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                <CircularProgress />
              </Box>
            ) : vacantRooms.length === 0 ? (
              <Alert severity="info">No vacant rooms found.</Alert>
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
                      <TableCell><strong>Price/Year</strong></TableCell>
                      <TableCell><strong>Amenities</strong></TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {vacantRooms.map((room) => (
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
                        <TableCell>₹{room.totalPrice?.toLocaleString() || 'N/A'}</TableCell>
                        <TableCell>
                          <Stack direction="row" spacing={0.5} flexWrap="wrap">
                            {room.amenities?.ac && <Chip label="AC" size="small" />}
                            {room.amenities?.attachedBathroom && <Chip label="Bath" size="small" />}
                            {room.amenities?.geyser && <Chip label="Geyser" size="small" />}
                            {room.amenities?.wifi && <Chip label="WiFi" size="small" />}
                          </Stack>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </TabPanel>

          <TabPanel value={tabValue} index={1}>
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                <CircularProgress />
              </Box>
            ) : occupiedRooms.length === 0 ? (
              <Alert severity="info">No occupied rooms found.</Alert>
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
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {occupiedRooms.map((room) => (
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
                          <Chip label={room.currentOccupancy || 0} color="success" size="small" />
                        </TableCell>
                        <TableCell>
                          <Chip label={room.capacity - (room.currentOccupancy || 0)} color="default" size="small" />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </TabPanel>
        </PresentationCard>
      </Stack>
    </ComponentsWrapper>
  );
}
