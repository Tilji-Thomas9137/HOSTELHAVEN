import { useState, useEffect, useMemo } from 'react';

// @mui
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Grid from '@mui/material/Grid';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import TextField from '@mui/material/TextField';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Chip from '@mui/material/Chip';
import IconButton from '@mui/material/IconButton';
import Stack from '@mui/material/Stack';
import Alert from '@mui/material/Alert';
import CircularProgress from '@mui/material/CircularProgress';
import Checkbox from '@mui/material/Checkbox';
import FormControlLabel from '@mui/material/FormControlLabel';
import FormGroup from '@mui/material/FormGroup';
import Divider from '@mui/material/Divider';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Avatar from '@mui/material/Avatar';
import { useSnackbar } from 'notistack';

// @project
import ComponentsWrapper from '@/components/ComponentsWrapper';
import PresentationCard from '@/components/cards/PresentationCard';
import adminService from '@/services/adminService';
import { calculateRoomPrice, formatPrice } from '@/utils/amenitiesPricing';

// @icons
import { IconPlus, IconEdit, IconTrash, IconSearch, IconFilter, IconX, IconPhoto, IconQrcode } from '@tabler/icons-react';

/***************************  ROOMS PAGE  ***************************/

export default function RoomsPage() {
  const { enqueueSnackbar } = useSnackbar();
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingRoom, setEditingRoom] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterBuilding, setFilterBuilding] = useState('');
  const [filterRoomType, setFilterRoomType] = useState('');
  const [filterMaintenance, setFilterMaintenance] = useState('');

  // Form state
  const [formData, setFormData] = useState({
    roomNumber: '',
    block: '',
    floor: '',
    roomType: '',
    gender: '',
    capacity: '',
    amenities: {
      ac: false,
      attachedBathroom: false,
      geyser: false,
      wifi: false,
      extraFurniture: false,
      fanCount: 0,
    },
    maintenanceStatus: 'none',
    photos: [],
    aiTags: {
      noiseTolerance: '',
      cleanlinessExpectations: '',
      studyHabits: '',
    },
    allowRoomChanges: true,
    generateQRCode: false,
  });

  // Calculate pricing in real-time
  const pricing = useMemo(() => {
    if (!formData.roomType) {
      return { basePrice: 0, amenitiesPrice: 0, totalPrice: 0 };
    }
    return calculateRoomPrice(formData.roomType, formData.amenities);
  }, [formData.roomType, formData.amenities]);

  useEffect(() => {
    fetchRooms();
  }, []);

  const fetchRooms = async () => {
    try {
      setLoading(true);
      const params = {};
      if (searchTerm) params.search = searchTerm;
      if (filterStatus) params.status = filterStatus;
      if (filterBuilding) params.building = filterBuilding;
      if (filterBuilding) params.block = filterBuilding;
      if (filterRoomType) params.roomType = filterRoomType;
      if (filterMaintenance) params.maintenanceStatus = filterMaintenance;

      const response = await adminService.getAllRooms(params);
      setRooms(response.rooms || []);
    } catch (error) {
      enqueueSnackbar(error.response?.data?.message || 'Failed to load rooms', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (room = null) => {
    if (room) {
      const isOccupied = (room.currentOccupancy || room.occupied || 0) > 0;
      const isAvailable = !isOccupied;
      
      setEditingRoom(room);
      setFormData({
        roomNumber: room.roomNumber || '',
        block: room.block || room.building || '',
        floor: room.floor !== null && room.floor !== undefined ? room.floor : '',
        roomType: room.roomType || '',
        gender: room.gender === 'Male' ? 'Boys' : room.gender === 'Female' ? 'Girls' : (room.gender || 'Boys'),
        capacity: room.capacity || '',
        amenities: room.amenities || {
          ac: false,
          attachedBathroom: false,
          geyser: false,
          wifi: false,
          extraFurniture: false,
          fanCount: 0,
        },
        maintenanceStatus: room.maintenanceStatus || 'none',
        photos: room.photos || [],
        aiTags: room.aiTags || {
          noiseTolerance: '',
          cleanlinessExpectations: '',
          studyHabits: '',
        },
        allowRoomChanges: room.allowRoomChanges !== false,
        generateQRCode: false,
        _isOccupied: isOccupied, // Store occupancy status for form disabling
        _isAvailable: isAvailable, // Store availability status
      });
    } else {
      setEditingRoom(null);
      setFormData({
        roomNumber: '',
        block: '',
        floor: '',
        roomType: '',
        gender: 'Boys',
        capacity: '',
        amenities: {
          ac: false,
          attachedBathroom: false,
          geyser: false,
          wifi: false,
          extraFurniture: false,
          fanCount: 0,
        },
        maintenanceStatus: 'none',
        photos: [],
        aiTags: {
          noiseTolerance: '',
          cleanlinessExpectations: '',
          studyHabits: '',
        },
        allowRoomChanges: true,
        generateQRCode: false,
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingRoom(null);
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (name.startsWith('amenities.')) {
      const amenityKey = name.split('.')[1];
      setFormData((prev) => ({
        ...prev,
        amenities: {
          ...prev.amenities,
          [amenityKey]: type === 'checkbox' ? checked : value,
        },
      }));
    } else if (name.startsWith('aiTags.')) {
      const tagKey = name.split('.')[1];
      setFormData((prev) => ({
        ...prev,
        aiTags: {
          ...prev.aiTags,
          [tagKey]: value,
        },
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value,
      }));
    }

    // Auto-set capacity based on room type
    if (name === 'roomType') {
      const capacityMap = {
        Single: 1,
        Double: 2,
        Triple: 3,
        Quad: 4,
      };
      if (capacityMap[value]) {
        setFormData((prev) => ({
          ...prev,
          roomType: value,
          capacity: capacityMap[value],
        }));
      }
    }
  };

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files).slice(0, 3 - formData.photos.length);
    
    files.forEach((file) => {
      if (file.size > 5 * 1024 * 1024) {
        enqueueSnackbar(`Image ${file.name} is too large. Maximum size is 5MB.`, { variant: 'warning' });
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData((prev) => ({
          ...prev,
          photos: [...prev.photos, reader.result].slice(0, 3),
        }));
      };
      reader.readAsDataURL(file);
    });
  };

  const handleRemoveImage = (index) => {
    setFormData((prev) => ({
      ...prev,
      photos: prev.photos.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async () => {
    try {
      // For available rooms, only allow maintenance status changes (skip other validations)
      if (editingRoom && formData._isAvailable) {
        // Only send maintenanceStatus to backend
        const updateData = {
          maintenanceStatus: formData.maintenanceStatus,
        };
        await adminService.updateRoom(editingRoom._id, updateData);
        enqueueSnackbar('Room status updated successfully', { variant: 'success' });
        handleCloseDialog();
        fetchRooms();
        return;
      }
      
      // Validate required fields (check for empty strings and null, but allow 0 for floor)
      if (!formData.roomNumber || formData.roomNumber.trim() === '') {
        enqueueSnackbar('Room number is required', { variant: 'warning' });
        return;
      }
      if (formData.floor === '' || formData.floor === null || formData.floor === undefined) {
        enqueueSnackbar('Floor is required', { variant: 'warning' });
        return;
      }
      const floorNum = parseInt(formData.floor);
      if (isNaN(floorNum) || floorNum < 0 || floorNum > 8) {
        enqueueSnackbar('Floor must be between 0 and 8', { variant: 'warning' });
        return;
      }
      if (!formData.roomType || formData.roomType === '') {
        enqueueSnackbar('Room type is required', { variant: 'warning' });
        return;
      }
      if (!formData.capacity || formData.capacity === '' || parseInt(formData.capacity) < 1) {
        enqueueSnackbar('Capacity is required and must be at least 1', { variant: 'warning' });
        return;
      }

      const roomData = {
        roomNumber: formData.roomNumber.trim(),
        block: formData.block?.trim() || '',
        floor: parseInt(formData.floor),
        roomType: formData.roomType,
        gender: formData.gender,
        capacity: parseInt(formData.capacity),
        amenities: formData.amenities,
        maintenanceStatus: formData.maintenanceStatus,
        photos: formData.photos,
        aiTags: formData.aiTags,
        allowRoomChanges: formData.allowRoomChanges,
        generateQRCode: formData.generateQRCode,
      };

      if (editingRoom) {
        await adminService.updateRoom(editingRoom._id, roomData);
        enqueueSnackbar('Room updated successfully', { variant: 'success' });
      } else {
        await adminService.createRoom(roomData);
        enqueueSnackbar('Room created successfully', { variant: 'success' });
      }

      handleCloseDialog();
      fetchRooms();
    } catch (error) {
      enqueueSnackbar(error.response?.data?.message || 'Failed to save room', { variant: 'error' });
    }
  };

  const handleDelete = async (roomId) => {
    const room = rooms.find(r => r._id === roomId);
    const occupancy = room?.currentOccupancy || room?.occupied || 0;
    
    // Prevent deletion of occupied rooms
    if (occupancy > 0) {
      enqueueSnackbar(
        `Cannot delete occupied room. ${occupancy} student(s) are currently in this room. Set room to maintenance status instead.`,
        { variant: 'warning' }
      );
      return;
    }

    // Show informative message about room management
    if (!window.confirm(
      'Room deletion is not recommended.\n\n' +
      'Instead, you can:\n' +
      '• Set room to "Under Maintenance" to block it from students\n' +
      '• Set room to "Blocked" to mark it unavailable\n\n' +
      'This preserves room history and allows reactivation later.\n\n' +
      'Continue with deletion anyway?'
    )) {
      return;
    }

    try {
      await adminService.deleteRoom(roomId);
      enqueueSnackbar('Room deleted successfully', { variant: 'success' });
      fetchRooms();
    } catch (error) {
      const errorMsg = error.response?.data?.message || 'Failed to delete room';
      const suggestion = error.response?.data?.suggestion;
      
      enqueueSnackbar(
        suggestion ? `${errorMsg}\n${suggestion}` : errorMsg,
        { variant: 'error', autoHideDuration: 6000 }
      );
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      available: 'success',
      occupied: 'error',
      maintenance: 'warning',
      reserved: 'info',
      blocked: 'error',
    };
    return colors[status] || 'default';
  };

  const getRoomTypeColor = (type) => {
    const colors = {
      Single: 'primary',
      Double: 'secondary',
      Triple: 'info',
      Quad: 'warning',
    };
    return colors[type] || 'default';
  };

  // Get unique buildings/blocks and room types for filters
  const buildings = [...new Set(rooms.map((r) => r.block || r.building).filter(Boolean))];
  const roomTypes = ['Single', 'Double', 'Triple', 'Quad'];

  const filteredRooms = rooms.filter((room) => {
    const matchesSearch = !searchTerm || 
      room.roomNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (room.block && room.block.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (room.building && room.building.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStatus = !filterStatus || room.status === filterStatus;
    const matchesBuilding = !filterBuilding || room.block === filterBuilding || room.building === filterBuilding;
    const matchesRoomType = !filterRoomType || room.roomType === filterRoomType;
    const matchesMaintenance = !filterMaintenance || room.maintenanceStatus === filterMaintenance;
    
    return matchesSearch && matchesStatus && matchesBuilding && matchesRoomType && matchesMaintenance;
  });

  return (
    <ComponentsWrapper title="Rooms Management">
      <Stack spacing={3}>
        {/* Header with Add Button */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h4">Rooms</Typography>
          <Button
            variant="contained"
            startIcon={<IconPlus size={20} />}
            onClick={() => handleOpenDialog()}
          >
            Add New Room
          </Button>
        </Box>

        {/* Filters */}
        <PresentationCard>
          <Stack spacing={2}>
            <Typography variant="h6">Filters</Typography>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, md: 3 }}>
                <TextField
                  fullWidth
                  label="Search"
                  placeholder="Room number, block..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  InputProps={{
                    startAdornment: <IconSearch size={20} style={{ marginRight: 8, color: '#999' }} />,
                  }}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 2 }}>
                <FormControl fullWidth>
                  <InputLabel>Status</InputLabel>
                  <Select
                    value={filterStatus}
                    label="Status"
                    onChange={(e) => setFilterStatus(e.target.value)}
                  >
                    <MenuItem value="">All</MenuItem>
                    <MenuItem value="available">Available</MenuItem>
                    <MenuItem value="occupied">Occupied</MenuItem>
                    <MenuItem value="maintenance">Maintenance</MenuItem>
                    <MenuItem value="reserved">Reserved</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid size={{ xs: 12, md: 2 }}>
                <FormControl fullWidth>
                  <InputLabel>Maintenance</InputLabel>
                  <Select
                    value={filterMaintenance}
                    label="Maintenance"
                    onChange={(e) => setFilterMaintenance(e.target.value)}
                  >
                    <MenuItem value="">All</MenuItem>
                    <MenuItem value="none">None</MenuItem>
                    <MenuItem value="under_maintenance">Under Maintenance</MenuItem>
                    <MenuItem value="blocked">Blocked</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid size={{ xs: 12, md: 2 }}>
                <FormControl fullWidth>
                  <InputLabel>Block/Building</InputLabel>
                  <Select
                    value={filterBuilding}
                    label="Block/Building"
                    onChange={(e) => setFilterBuilding(e.target.value)}
                  >
                    <MenuItem value="">All</MenuItem>
                    {buildings.map((building) => (
                      <MenuItem key={building} value={building}>
                        {building}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid size={{ xs: 12, md: 3 }}>
                <FormControl fullWidth>
                  <InputLabel>Room Type</InputLabel>
                  <Select
                    value={filterRoomType}
                    label="Room Type"
                    onChange={(e) => setFilterRoomType(e.target.value)}
                  >
                    <MenuItem value="">All Types</MenuItem>
                    {roomTypes.map((type) => (
                      <MenuItem key={type} value={type}>
                        {type}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                variant="outlined"
                startIcon={<IconFilter size={18} />}
                onClick={fetchRooms}
              >
                Apply Filters
              </Button>
              <Button
                variant="text"
                onClick={() => {
                  setSearchTerm('');
                  setFilterStatus('');
                  setFilterBuilding('');
                  setFilterRoomType('');
                  setFilterMaintenance('');
                  fetchRooms();
                }}
              >
                Clear
              </Button>
            </Box>
          </Stack>
        </PresentationCard>

        {/* Rooms Table */}
        <PresentationCard>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
              <CircularProgress />
            </Box>
          ) : filteredRooms.length === 0 ? (
            <Alert severity="info">No rooms found. Create your first room to get started.</Alert>
          ) : (
            <TableContainer>
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
                    <TableCell><strong>Yearly Fee</strong></TableCell>
                    <TableCell><strong>Status</strong></TableCell>
                    <TableCell><strong>Maintenance</strong></TableCell>
                    <TableCell><strong>Actions</strong></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredRooms.map((room) => {
                    const occupancy = room.currentOccupancy || room.occupied || 0;
                    const totalPrice = room.totalPrice || room.rent || 0;
                    return (
                      <TableRow key={room._id} hover>
                        <TableCell><strong>{room.roomNumber}</strong></TableCell>
                        <TableCell>{room.block || room.building || 'N/A'}</TableCell>
                        <TableCell>{room.floor}</TableCell>
                        <TableCell>
                          <Chip
                            label={room.roomType}
                            size="small"
                            color={getRoomTypeColor(room.roomType)}
                          />
                        </TableCell>
                        <TableCell>
                          {room.gender === 'Boys' || room.gender === 'Male' ? 'Boys' : 
                           room.gender === 'Girls' || room.gender === 'Female' ? 'Girls' : 
                           'Not Set'}
                        </TableCell>
                        <TableCell>{room.capacity}</TableCell>
                        <TableCell>{occupancy}</TableCell>
                        <TableCell>
                          <Chip
                            label={room.capacity - occupancy}
                            size="small"
                            color={room.capacity - occupancy > 0 ? 'success' : 'error'}
                          />
                        </TableCell>
                        <TableCell>{formatPrice(totalPrice)}</TableCell>
                        <TableCell>
                          <Chip
                            label={room.status}
                            size="small"
                            color={getStatusColor(room.status)}
                          />
                        </TableCell>
                        <TableCell>
                          {room.maintenanceStatus === 'under_maintenance' || room.maintenanceStatus === 'blocked' ? (
                            <Chip
                              label={room.maintenanceStatus === 'under_maintenance' ? 'Under Maintenance' : 'Blocked'}
                              size="small"
                              color="warning"
                            />
                          ) : (
                            <Chip label="None" size="small" color="success" />
                          )}
                        </TableCell>
                        <TableCell>
                          <Stack direction="row" spacing={1}>
                            <IconButton
                              size="small"
                              color="primary"
                              onClick={() => handleOpenDialog(room)}
                              disabled={(room.currentOccupancy || room.occupied || 0) > 0}
                              title={(room.currentOccupancy || room.occupied || 0) > 0 ? 'Cannot edit occupied rooms' : 'Edit room'}
                            >
                              <IconEdit size={18} />
                            </IconButton>
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => handleDelete(room._id)}
                              disabled={(room.currentOccupancy || room.occupied || 0) > 0}
                              title={(room.currentOccupancy || room.occupied || 0) > 0 ? 'Cannot delete occupied rooms' : 'Delete room'}
                            >
                              <IconTrash size={18} />
                            </IconButton>
                          </Stack>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </PresentationCard>

        {/* Create/Edit Room Dialog */}
        <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="lg" fullWidth>
          <DialogTitle>
            {editingRoom ? 'Edit Room' : 'Add New Room'}
          </DialogTitle>
          <DialogContent>
            <Stack spacing={3} sx={{ mt: 1 }}>
              {/* Show alert for occupied or available rooms */}
              {editingRoom && formData._isOccupied && (
                <Alert severity="error">
                  This room is occupied. Editing and deletion are not allowed.
                </Alert>
              )}
              {editingRoom && formData._isAvailable && (
                <Alert severity="info">
                  This room is available. Only the maintenance status can be changed. Other details are locked.
                </Alert>
              )}
              
              {/* Basic Information */}
              <Typography variant="h6">Basic Information</Typography>
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, md: 4 }}>
                  <TextField
                    fullWidth
                    label="Room Number"
                    name="roomNumber"
                    value={formData.roomNumber || ''}
                    onChange={handleInputChange}
                    required
                    placeholder="e.g., A-101"
                    disabled={editingRoom && (formData._isOccupied || formData._isAvailable)}
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 4 }}>
                  <TextField
                    fullWidth
                    label="Block/Wing"
                    name="block"
                    value={formData.block || ''}
                    onChange={handleInputChange}
                    placeholder="e.g., Block A"
                    disabled={editingRoom && (formData._isOccupied || formData._isAvailable)}
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 4 }}>
                  <TextField
                    fullWidth
                    label="Floor"
                    name="floor"
                    type="number"
                    value={formData.floor !== null && formData.floor !== undefined ? formData.floor : ''}
                    onChange={handleInputChange}
                    required={!editingRoom || !formData._isAvailable}
                    inputProps={{ min: 0, max: 8 }}
                    helperText="Floor must be between 0 and 8"
                    disabled={editingRoom && (formData._isOccupied || formData._isAvailable)}
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 4 }}>
                  <FormControl fullWidth required>
                    <InputLabel>Room Type</InputLabel>
                    <Select
                      name="roomType"
                      value={formData.roomType || ''}
                      label="Room Type"
                      onChange={handleInputChange}
                      disabled={editingRoom && (formData._isOccupied || formData._isAvailable)}
                    >
                      <MenuItem value="Single">Single</MenuItem>
                      <MenuItem value="Double">Double</MenuItem>
                      <MenuItem value="Triple">Triple</MenuItem>
                      <MenuItem value="Quad">Quad</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid size={{ xs: 12, md: 4 }}>
                    <TextField
                      fullWidth
                      label="Capacity"
                      name="capacity"
                      type="number"
                      value={formData.capacity || ''}
                      onChange={handleInputChange}
                      required
                      inputProps={{ min: 1, max: 6 }}
                      disabled={!!formData.roomType || (editingRoom && (formData._isOccupied || formData._isAvailable))}
                      helperText={formData.roomType ? 'Auto-set based on room type' : 'Set capacity manually'}
                    />
                </Grid>
                <Grid size={{ xs: 12, md: 4 }}>
                  <FormControl fullWidth required>
                    <InputLabel>Gender Restriction</InputLabel>
                    <Select
                      name="gender"
                      value={formData.gender || ''}
                      label="Gender Restriction"
                      onChange={handleInputChange}
                      disabled={editingRoom && (formData._isOccupied || formData._isAvailable)}
                    >
                      <MenuItem value="Boys">Boys</MenuItem>
                      <MenuItem value="Girls">Girls</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <FormControl fullWidth>
                    <InputLabel>Maintenance Status</InputLabel>
                    <Select
                      name="maintenanceStatus"
                      value={formData.maintenanceStatus || 'none'}
                      label="Maintenance Status"
                      onChange={handleInputChange}
                      disabled={editingRoom && formData._isOccupied}
                    >
                      <MenuItem value="none">None</MenuItem>
                      <MenuItem value="under_maintenance">Under Maintenance</MenuItem>
                      <MenuItem value="blocked">Blocked</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        name="allowRoomChanges"
                        checked={formData.allowRoomChanges}
                        onChange={handleInputChange}
                      />
                    }
                    label="Allow Room Changes"
                  />
                </Grid>
              </Grid>

              <Divider />

              {/* Amenities */}
              <Typography variant="h6">Amenities</Typography>
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, md: 6 }}>
                  <FormGroup>
                    <FormControlLabel
                      control={
                        <Checkbox
                          name="amenities.ac"
                          checked={formData.amenities.ac}
                          onChange={handleInputChange}
                          disabled={editingRoom && (formData._isOccupied || formData._isAvailable)}
                        />
                      }
                      label="AC (+₹12,000/year)"
                    />
                    <FormControlLabel
                      control={
                        <Checkbox
                          name="amenities.attachedBathroom"
                          checked={formData.amenities.attachedBathroom}
                          onChange={handleInputChange}
                          disabled={editingRoom && (formData._isOccupied || formData._isAvailable)}
                        />
                      }
                      label="Attached Bathroom (+₹8,000/year)"
                    />
                    <FormControlLabel
                      control={
                        <Checkbox
                          name="amenities.geyser"
                          checked={formData.amenities.geyser}
                          onChange={handleInputChange}
                          disabled={editingRoom && (formData._isOccupied || formData._isAvailable)}
                        />
                      }
                      label="Geyser (+₹5,000/year)"
                    />
                    <FormControlLabel
                      control={
                        <Checkbox
                          name="amenities.wifi"
                          checked={formData.amenities.wifi}
                          onChange={handleInputChange}
                          disabled={editingRoom && (formData._isOccupied || formData._isAvailable)}
                        />
                      }
                      label="Wi-Fi (+₹3,000/year)"
                    />
                    <FormControlLabel
                      control={
                        <Checkbox
                          name="amenities.extraFurniture"
                          checked={formData.amenities.extraFurniture}
                          onChange={handleInputChange}
                          disabled={editingRoom && (formData._isOccupied || formData._isAvailable)}
                        />
                      }
                      label="Extra Furniture (+₹4,000/year)"
                    />
                  </FormGroup>
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField
                    fullWidth
                    label="Fan Count"
                    name="amenities.fanCount"
                    type="number"
                    value={formData.amenities.fanCount}
                    onChange={handleInputChange}
                    inputProps={{ min: 0, max: 5 }}
                    helperText="₹2,000 per fan per year"
                    disabled={editingRoom && (formData._isOccupied || formData._isAvailable)}
                  />
                </Grid>
              </Grid>

              <Divider />

              {/* Pricing Breakdown */}
              {formData.roomType && (
                <Card variant="outlined" sx={{ bgcolor: 'grey.50' }}>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>Pricing Breakdown (Per Year)</Typography>
                    <Stack spacing={1}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography>Base Price ({formData.roomType}):</Typography>
                        <Typography fontWeight="bold">{formatPrice(pricing.basePrice)}</Typography>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography>Amenities:</Typography>
                        <Typography fontWeight="bold">{formatPrice(pricing.amenitiesPrice)}</Typography>
                      </Box>
                      <Divider />
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="h6">Total Yearly Fee:</Typography>
                        <Typography variant="h6" color="primary" fontWeight="bold">
                          {formatPrice(pricing.totalPrice)}
                        </Typography>
                      </Box>
                    </Stack>
                  </CardContent>
                </Card>
              )}

              <Divider />

              {/* Images */}
              <Typography variant="h6">Room Photos (Max 3)</Typography>
              <Stack spacing={2}>
                <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                  {formData.photos.map((photo, index) => (
                    <Box key={index} sx={{ position: 'relative' }}>
                      <Avatar
                        src={photo}
                        variant="rounded"
                        sx={{ width: 120, height: 120 }}
                      />
                      <IconButton
                        size="small"
                        sx={{ position: 'absolute', top: -8, right: -8, bgcolor: 'error.main', color: 'white' }}
                        onClick={() => handleRemoveImage(index)}
                      >
                        <IconX size={16} />
                      </IconButton>
                    </Box>
                  ))}
                </Box>
                {formData.photos.length < 3 && (
                  <Button
                    variant="outlined"
                    component="label"
                    startIcon={<IconPhoto size={18} />}
                  >
                    Upload Image
                    <input
                      type="file"
                      hidden
                      accept="image/*"
                      multiple
                      onChange={handleImageUpload}
                    />
                  </Button>
                )}
              </Stack>

              <Divider />

              {/* AI Tags */}
              <Typography variant="h6">AI Roommate Matching Tags</Typography>
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, md: 4 }}>
                  <FormControl fullWidth>
                    <InputLabel>Noise Tolerance</InputLabel>
                    <Select
                      name="aiTags.noiseTolerance"
                      value={formData.aiTags?.noiseTolerance || ''}
                      label="Noise Tolerance"
                      onChange={handleInputChange}
                    >
                      <MenuItem value="">Not Set</MenuItem>
                      <MenuItem value="low">Low</MenuItem>
                      <MenuItem value="medium">Medium</MenuItem>
                      <MenuItem value="high">High</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid size={{ xs: 12, md: 4 }}>
                  <FormControl fullWidth>
                    <InputLabel>Cleanliness Expectations</InputLabel>
                    <Select
                      name="aiTags.cleanlinessExpectations"
                      value={formData.aiTags?.cleanlinessExpectations || ''}
                      label="Cleanliness Expectations"
                      onChange={handleInputChange}
                    >
                      <MenuItem value="">Not Set</MenuItem>
                      <MenuItem value="low">Low</MenuItem>
                      <MenuItem value="medium">Medium</MenuItem>
                      <MenuItem value="high">High</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid size={{ xs: 12, md: 4 }}>
                  <FormControl fullWidth>
                    <InputLabel>Study Habits</InputLabel>
                    <Select
                      name="aiTags.studyHabits"
                      value={formData.aiTags?.studyHabits || ''}
                      label="Study Habits"
                      onChange={handleInputChange}
                    >
                      <MenuItem value="">Not Set</MenuItem>
                      <MenuItem value="quiet">Quiet</MenuItem>
                      <MenuItem value="moderate">Moderate</MenuItem>
                      <MenuItem value="social">Social</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>

              <Divider />

              {/* QR Code */}
              <FormControlLabel
                control={
                  <Checkbox
                    name="generateQRCode"
                    checked={formData.generateQRCode}
                    onChange={handleInputChange}
                  />
                }
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <IconQrcode size={18} />
                    <Typography>Generate QR Code for this room</Typography>
                  </Box>
                }
              />
            </Stack>
          </DialogContent>
          <DialogActions sx={{ p: 3 }}>
            <Button onClick={handleCloseDialog}>Cancel</Button>
            <Button variant="contained" onClick={handleSubmit}>
              {editingRoom ? 'Update' : 'Create'}
            </Button>
          </DialogActions>
        </Dialog>
      </Stack>
    </ComponentsWrapper>
  );
}
