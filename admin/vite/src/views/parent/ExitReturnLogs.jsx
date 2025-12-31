import { useState, useEffect } from 'react';

// @mui
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import Grid from '@mui/material/Grid';

// @project
import ComponentsWrapper from '@/components/ComponentsWrapper';
import PresentationCard from '@/components/cards/PresentationCard';
import parentService from '@/services/parentService';
import { useSnackbar } from 'notistack';

// @icons
import { IconDoorExit, IconDoorEnter } from '@tabler/icons-react';

/***************************  EXIT/RETURN LOGS PAGE  ***************************/

export default function ExitReturnLogsPage() {
  const { enqueueSnackbar } = useSnackbar();
  const [loading, setLoading] = useState(true);
  const [exitLogs, setExitLogs] = useState([]);
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterChild, setFilterChild] = useState('all');
  const [children, setChildren] = useState([]);

  useEffect(() => {
    fetchChildren();
    fetchExitLogs();
  }, []);

  useEffect(() => {
    fetchExitLogs();
  }, [filterStatus, filterChild]);

  const fetchChildren = async () => {
    try {
      const data = await parentService.getChildren();
      setChildren(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error fetching children:', err);
    }
  };

  const fetchExitLogs = async () => {
    try {
      setLoading(true);
      const params = {};
      
      if (filterStatus !== 'all') {
        if (filterStatus === 'pending') {
          params.status = 'pending';
        } else if (filterStatus === 'approved') {
          params.status = 'approved';
        } else if (filterStatus === 'rejected') {
          params.status = 'rejected';
        } else if (filterStatus === 'exited') {
          params.status = 'approved';
        } else if (filterStatus === 'returned') {
          params.status = 'completed';
        }
      }

      if (filterChild !== 'all') {
        params.studentId = filterChild;
      }

      const logs = await parentService.getOutingRequests(params);
      // Show all outing requests (pending, approved, rejected, completed)
      setExitLogs(Array.isArray(logs) ? logs : []);
    } catch (err) {
      console.error('Error fetching exit logs:', err);
      enqueueSnackbar(err.response?.data?.message || 'Failed to load exit/return logs', { variant: 'error' });
      setExitLogs([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ComponentsWrapper title="Exit/Return Logs">
      <PresentationCard>
        {/* Filters */}
        <Stack direction="row" spacing={2} sx={{ mb: 3 }}>
          <FormControl sx={{ minWidth: 200 }}>
            <InputLabel>Filter by Child</InputLabel>
            <Select
              value={filterChild}
              label="Filter by Child"
              onChange={(e) => setFilterChild(e.target.value)}
            >
              <MenuItem value="all">All Children</MenuItem>
              {children.map((child) => (
                <MenuItem key={child._id} value={child._id}>
                  {child.name} ({child.studentId || child.admissionNumber})
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl sx={{ minWidth: 200 }}>
            <InputLabel>Filter by Status</InputLabel>
            <Select
              value={filterStatus}
              label="Filter by Status"
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <MenuItem value="all">All</MenuItem>
              <MenuItem value="pending">Pending</MenuItem>
              <MenuItem value="approved">Approved</MenuItem>
              <MenuItem value="rejected">Rejected</MenuItem>
              <MenuItem value="exited">Exited Only</MenuItem>
              <MenuItem value="returned">Returned</MenuItem>
            </Select>
          </FormControl>
        </Stack>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        ) : exitLogs.length === 0 ? (
          <Alert severity="info">No exit/return logs found for your children</Alert>
        ) : (
          <TableContainer component={Paper} variant="outlined">
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: 'grey.50' }}>
                  <TableCell><strong>Child Name</strong></TableCell>
                  <TableCell><strong>Purpose</strong></TableCell>
                  <TableCell><strong>Destination</strong></TableCell>
                  <TableCell><strong>Exit Time</strong></TableCell>
                  <TableCell><strong>Return Time</strong></TableCell>
                  <TableCell><strong>Status</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {exitLogs.map((log) => (
                  <TableRow key={log._id} hover>
                    <TableCell>
                      <Stack direction="row" spacing={1} alignItems="center">
                        {log.exitTime && !log.returnTime ? (
                          <IconDoorExit size={18} color="#ef4444" />
                        ) : log.returnTime ? (
                          <IconDoorEnter size={18} color="#22c55e" />
                        ) : null}
                        <Stack>
                          <Typography variant="body2" sx={{ fontWeight: 500 }}>
                            {log.student?.name || 'Unknown'}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {log.student?.studentId || log.student?.admissionNumber || 'N/A'}
                          </Typography>
                        </Stack>
                      </Stack>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">{log.purpose || 'N/A'}</Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">{log.destination || 'N/A'}</Typography>
                    </TableCell>
                    <TableCell>
                      {log.exitTime ? (
                        <Typography variant="body2" color="error.main">
                          {new Date(log.exitTime).toLocaleString()}
                        </Typography>
                      ) : (
                        <Typography variant="body2" color="text.secondary">-</Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      {log.returnTime ? (
                        <Typography variant="body2" color="success.main">
                          {new Date(log.returnTime).toLocaleString()}
                        </Typography>
                      ) : (
                        <Typography variant="body2" color="text.secondary">-</Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={
                          log.status === 'completed' ? 'Returned' : 
                          log.status === 'rejected' ? 'Rejected' :
                          log.status === 'approved' && log.exitTime ? 'Outside' : 
                          log.status === 'approved' ? 'Approved' : 
                          'Pending'
                        }
                        color={
                          log.status === 'completed' ? 'success' : 
                          log.status === 'rejected' ? 'error' :
                          log.status === 'approved' && log.exitTime ? 'warning' : 
                          log.status === 'approved' ? 'info' : 
                          'default'
                        }
                        size="small"
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </PresentationCard>
    </ComponentsWrapper>
  );
}

