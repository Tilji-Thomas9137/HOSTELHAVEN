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

// @project
import ComponentsWrapper from '@/components/ComponentsWrapper';
import PresentationCard from '@/components/cards/PresentationCard';
import parentService from '@/services/parentService';
import { useSnackbar } from 'notistack';

/***************************  VISITOR LOGS PAGE  ***************************/

export default function VisitorLogsPage() {
  const { enqueueSnackbar } = useSnackbar();
  const [loading, setLoading] = useState(true);
  const [visitorLogs, setVisitorLogs] = useState([]);
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterChild, setFilterChild] = useState('all');
  const [children, setChildren] = useState([]);

  useEffect(() => {
    fetchChildren();
    fetchVisitorLogs();
  }, []);

  useEffect(() => {
    fetchVisitorLogs();
  }, [filterStatus, filterChild]);

  const fetchChildren = async () => {
    try {
      const data = await parentService.getChildren();
      setChildren(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error fetching children:', err);
    }
  };

  const fetchVisitorLogs = async () => {
    try {
      setLoading(true);
      const params = {};
      
      if (filterStatus !== 'all') {
        params.status = filterStatus;
      }

      if (filterChild !== 'all') {
        params.studentId = filterChild;
      }

      const logs = await parentService.getVisitorLogs(params);
      setVisitorLogs(Array.isArray(logs) ? logs : []);
    } catch (err) {
      console.error('Error fetching visitor logs:', err);
      enqueueSnackbar(err.response?.data?.message || 'Failed to load visitor logs', { variant: 'error' });
      setVisitorLogs([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ComponentsWrapper title="Visitor Logs">
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
              <MenuItem value="checked_in">Checked In</MenuItem>
              <MenuItem value="checked_out">Checked Out</MenuItem>
            </Select>
          </FormControl>
        </Stack>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        ) : visitorLogs.length === 0 ? (
          <Alert severity="info">No visitor logs found for your children</Alert>
        ) : (
          <TableContainer component={Paper} variant="outlined">
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: 'grey.50' }}>
                  <TableCell><strong>Visitor Name</strong></TableCell>
                  <TableCell><strong>Child Name</strong></TableCell>
                  <TableCell><strong>Relation</strong></TableCell>
                  <TableCell><strong>Phone</strong></TableCell>
                  <TableCell><strong>Check In</strong></TableCell>
                  <TableCell><strong>Check Out</strong></TableCell>
                  <TableCell><strong>Status</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {visitorLogs.map((log) => (
                  <TableRow key={log._id} hover>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        {log.visitorName}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Stack>
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                          {log.student?.name || 'Unknown'}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {log.student?.studentId || log.student?.admissionNumber || 'N/A'}
                        </Typography>
                      </Stack>
                    </TableCell>
                    <TableCell>{log.relation || 'N/A'}</TableCell>
                    <TableCell>{log.visitorPhone}</TableCell>
                    <TableCell>
                      {log.checkIn ? new Date(log.checkIn).toLocaleString() : '-'}
                    </TableCell>
                    <TableCell>
                      {log.checkOut ? new Date(log.checkOut).toLocaleString() : '-'}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={log.status === 'checked_out' ? 'Checked Out' : 'Checked In'}
                        color={log.status === 'checked_out' ? 'success' : 'warning'}
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

