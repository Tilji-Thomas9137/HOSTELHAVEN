import { useState, useEffect } from 'react';

import Stack from '@mui/material/Stack';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import TableContainer from '@mui/material/TableContainer';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import Chip from '@mui/material/Chip';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import Grid from '@mui/material/Grid';

import ComponentsWrapper from '@/components/ComponentsWrapper';
import PresentationCard from '@/components/cards/PresentationCard';
import TabPanel from '@/components/TabPanel';
import adminService from '@/services/adminService';
import { useSnackbar } from 'notistack';

export default function VisitorsPage() {
  const { enqueueSnackbar } = useSnackbar();
  const [tab, setTab] = useState('vendors');
  const [loading, setLoading] = useState(false);
  const [vendorLogs, setVendorLogs] = useState([]);
  const [visitorLogs, setVisitorLogs] = useState([]);
  const [directionFilter, setDirectionFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');

  useEffect(() => {
    if (tab === 'vendors') {
      fetchVendorLogs();
    } else if (tab === 'visitors') {
      fetchVisitorLogs();
    }
  }, [tab, directionFilter, typeFilter]);

  const fetchVendorLogs = async () => {
    try {
      setLoading(true);
      const params = {};
      if (directionFilter !== 'all') params.direction = directionFilter;
      if (typeFilter !== 'all') params.type = typeFilter;
      
      const data = await adminService.getAllVendorLogs(params);
      setVendorLogs(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to fetch vendor logs:', err);
      enqueueSnackbar(err.response?.data?.message || 'Failed to load vendor logs', { variant: 'error' });
      setVendorLogs([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchVisitorLogs = async () => {
    try {
      setLoading(true);
      const data = await adminService.getAllVisitorLogs();
      setVisitorLogs(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to fetch visitor logs:', err);
      enqueueSnackbar(err.response?.data?.message || 'Failed to load visitor logs', { variant: 'error' });
      setVisitorLogs([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredVendorLogs = vendorLogs.filter(log => {
    if (directionFilter !== 'all' && log.direction !== directionFilter) return false;
    if (typeFilter !== 'all' && log.type !== typeFilter) return false;
    return true;
  });

  return (
    <ComponentsWrapper title="Visitor Logs">
      <PresentationCard>
        <Stack spacing={3}>
          <Tabs value={tab} onChange={(_e, value) => setTab(value)}>
            <Tab value="vendors" label="Vendor In/Out Logs" />
            <Tab value="visitors" label="Student Visitor Logs" />
          </Tabs>

          {/* Vendor Logs Tab */}
          <TabPanel value={tab} index="vendors">
            <Stack spacing={2}>
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, md: 4 }}>
                  <TextField
                    label="Filter by Direction"
                    select
                    fullWidth
                    value={directionFilter}
                    onChange={(e) => setDirectionFilter(e.target.value)}
                  >
                    <MenuItem value="all">All</MenuItem>
                    <MenuItem value="IN">IN</MenuItem>
                    <MenuItem value="OUT">OUT</MenuItem>
                  </TextField>
                </Grid>
                <Grid size={{ xs: 12, md: 4 }}>
                  <TextField
                    label="Filter by Type"
                    select
                    fullWidth
                    value={typeFilter}
                    onChange={(e) => setTypeFilter(e.target.value)}
                  >
                    <MenuItem value="all">All</MenuItem>
                    <MenuItem value="Visitor">Visitor</MenuItem>
                    <MenuItem value="Maintenance">Maintenance</MenuItem>
                    <MenuItem value="Contractor">Contractor</MenuItem>
                    <MenuItem value="Delivery">Delivery</MenuItem>
                    <MenuItem value="Other">Other</MenuItem>
                  </TextField>
                </Grid>
              </Grid>

              {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                  <CircularProgress />
                </Box>
              ) : filteredVendorLogs.length === 0 ? (
                <Alert severity="info">No vendor logs found.</Alert>
              ) : (
                <TableContainer component={Paper} variant="outlined">
                  <Table>
                    <TableHead>
                      <TableRow sx={{ bgcolor: 'grey.50' }}>
                        <TableCell><strong>Name</strong></TableCell>
                        <TableCell><strong>Type</strong></TableCell>
                        <TableCell><strong>Purpose</strong></TableCell>
                        <TableCell><strong>Direction</strong></TableCell>
                        <TableCell><strong>IN Time</strong></TableCell>
                        <TableCell><strong>OUT Time</strong></TableCell>
                        <TableCell><strong>Logged By</strong></TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {filteredVendorLogs.map((entry) => (
                        <TableRow key={entry._id} hover>
                          <TableCell>{entry.vendorName || 'N/A'}</TableCell>
                          <TableCell>
                            <Chip label={entry.type || 'Visitor'} size="small" />
                          </TableCell>
                          <TableCell>{entry.remarks || entry.purpose || 'N/A'}</TableCell>
                          <TableCell>
                            <Chip
                              label={entry.outTime ? 'OUT' : 'IN'}
                              size="small"
                              color={entry.outTime ? 'success' : 'warning'}
                            />
                          </TableCell>
                          <TableCell>
                            {entry.inTime
                              ? new Date(entry.inTime).toLocaleString()
                              : entry.direction === 'IN'
                                ? new Date(entry.createdAt).toLocaleString()
                                : '-'}
                          </TableCell>
                          <TableCell>
                            {entry.outTime
                              ? new Date(entry.outTime).toLocaleString()
                              : entry.direction === 'OUT' && !entry.inTime
                                ? new Date(entry.createdAt).toLocaleString()
                                : '-'}
                          </TableCell>
                          <TableCell>{entry.loggedBy?.name || 'N/A'}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </Stack>
          </TabPanel>

          {/* Student Visitor Logs Tab */}
          <TabPanel value={tab} index="visitors">
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                <CircularProgress />
              </Box>
            ) : visitorLogs.length === 0 ? (
              <Alert severity="info">No visitor logs found.</Alert>
            ) : (
              <TableContainer component={Paper} variant="outlined">
                <Table>
                  <TableHead>
                    <TableRow sx={{ bgcolor: 'grey.50' }}>
                      <TableCell><strong>Visitor Name</strong></TableCell>
                      <TableCell><strong>Student</strong></TableCell>
                      <TableCell><strong>Room</strong></TableCell>
                      <TableCell><strong>Purpose</strong></TableCell>
                      <TableCell><strong>Check In</strong></TableCell>
                      <TableCell><strong>Check Out</strong></TableCell>
                      <TableCell><strong>Status</strong></TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {visitorLogs.map((entry) => (
                      <TableRow key={entry._id} hover>
                        <TableCell>{entry.visitorName || 'N/A'}</TableCell>
                        <TableCell>
                          {entry.student?.name || 'N/A'}
                          {entry.student?.studentId && (
                            <Typography variant="caption" display="block" color="text.secondary">
                              {entry.student.studentId}
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell>{entry.room?.roomNumber || 'N/A'}</TableCell>
                        <TableCell>{entry.purpose || 'N/A'}</TableCell>
                        <TableCell>
                          {entry.checkIn ? new Date(entry.checkIn).toLocaleString() : '-'}
                        </TableCell>
                        <TableCell>
                          {entry.checkOut ? new Date(entry.checkOut).toLocaleString() : '-'}
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={entry.status || 'checked_in'}
                            size="small"
                            color={
                              entry.status === 'checked_out' ? 'success' :
                              entry.status === 'checked_in' ? 'warning' : 'default'
                            }
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </TabPanel>
        </Stack>
      </PresentationCard>
    </ComponentsWrapper>
  );
}
