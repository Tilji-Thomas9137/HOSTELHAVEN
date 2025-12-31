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
import TextField from '@mui/material/TextField';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';

// @project
import ComponentsWrapper from '@/components/ComponentsWrapper';
import PresentationCard from '@/components/cards/PresentationCard';
import adminService from '@/services/adminService';
import { useRouter } from '@/utils/navigation';

// @icons
import { IconPlus, IconSearch } from '@tabler/icons-react';
import { useSnackbar } from 'notistack';

/***************************  STAFF PAGE  ***************************/

export default function StaffPage() {
  const router = useRouter();
  const { enqueueSnackbar } = useSnackbar();
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  useEffect(() => {
    fetchStaff();
  }, []);

  const fetchStaff = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await adminService.getAllStaff();
      setStaff(Array.isArray(response) ? response : []);
    } catch (err) {
      console.error('Error fetching staff:', err);
      setError(err.response?.data?.message || err.message || 'Failed to load staff');
      setStaff([]);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'active':
        return 'success';
      case 'inactive':
        return 'default';
      case 'suspended':
        return 'error';
      default:
        return 'default';
    }
  };


  // Filter staff based on search and filters
  const filteredStaff = staff.filter((member) => {
    // Search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch = 
        member.name?.toLowerCase().includes(searchLower) ||
        member.staffId?.toLowerCase().includes(searchLower) ||
        member.email?.toLowerCase().includes(searchLower) ||
        member.phone?.toLowerCase().includes(searchLower);
      if (!matchesSearch) return false;
    }

    // Status filter
    if (filterStatus !== 'all' && member.status !== filterStatus) {
      return false;
    }

    return true;
  });

  return (
    <ComponentsWrapper title="Staff Management">
      <Stack spacing={3}>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Typography variant="h6">All Staff</Typography>
          <Button
            variant="contained"
            startIcon={<IconPlus size={18} />}
            onClick={() => router.push('/app/staff/add')}
          >
            Add Staff
          </Button>
        </Stack>

        {error && (
          <Alert severity="error" onClose={() => setError('')}>
            {error}
          </Alert>
        )}

        <PresentationCard>
          {/* Filters */}
          <Stack direction="row" spacing={2} sx={{ mb: 3 }}>
            <TextField
              fullWidth
              placeholder="Search by name, ID, email, phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: <IconSearch size={18} style={{ marginRight: 8, color: '#999' }} />,
              }}
            />
            <FormControl sx={{ minWidth: 150 }}>
              <InputLabel>Status</InputLabel>
              <Select
                value={filterStatus}
                label="Status"
                onChange={(e) => setFilterStatus(e.target.value)}
              >
                <MenuItem value="all">All Status</MenuItem>
                <MenuItem value="active">Active</MenuItem>
                <MenuItem value="inactive">Inactive</MenuItem>
                <MenuItem value="suspended">Suspended</MenuItem>
              </Select>
            </FormControl>
          </Stack>

          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
              <CircularProgress />
            </Box>
          ) : filteredStaff.length === 0 ? (
            <Box sx={{ textAlign: 'center', p: 4 }}>
              <Typography variant="body2" color="text.secondary">
                {staff.length === 0 
                  ? 'No staff members found. Click "Add Staff" to create one.'
                  : 'No staff members match your filters.'}
              </Typography>
            </Box>
          ) : (
            <TableContainer component={Paper} elevation={0} sx={{ border: 1, borderColor: 'divider', borderRadius: 2 }}>
              <Table>
                <TableHead>
                  <TableRow sx={{ bgcolor: 'grey.50' }}>
                    <TableCell><strong>Staff ID</strong></TableCell>
                    <TableCell><strong>Name</strong></TableCell>
                    <TableCell><strong>Email</strong></TableCell>
                    <TableCell><strong>Phone</strong></TableCell>
                    <TableCell><strong>Status</strong></TableCell>
                    <TableCell><strong>Hire Date</strong></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredStaff.map((member) => (
                    <TableRow key={member._id} hover>
                      <TableCell>
                        <Typography variant="body2" fontWeight={500}>
                          {member.staffId}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {member.name}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" color="text.secondary">
                          {member.email}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" color="text.secondary">
                          {member.phone}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={member.status || 'active'}
                          size="small"
                          color={getStatusColor(member.status)}
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" color="text.secondary">
                          {member.hireDate ? new Date(member.hireDate).toLocaleDateString() : 'N/A'}
                        </Typography>
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
