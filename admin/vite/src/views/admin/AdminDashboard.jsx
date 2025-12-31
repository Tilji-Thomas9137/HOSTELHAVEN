// @mui
import Grid from '@mui/material/Grid';
import { useState, useEffect } from 'react';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Alert from '@mui/material/Alert';
import CircularProgress from '@mui/material/CircularProgress';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';

// @project
import AnalyticsOverviewCard from '@/sections/dashboard/AnalyticsOverviewCard';
import AnalyticsOverviewChart from '@/sections/dashboard/AnalyticsOverviewChart';
import AnalyticsTopRef from '@/sections/dashboard/AnalyticsTopRef';
import PresentationCard from '@/components/cards/PresentationCard';
import adminService from '@/services/adminService';
import { useSnackbar } from 'notistack';
import { IconDoorExit, IconDoorEnter } from '@tabler/icons-react';

/***************************  ADMIN DASHBOARD  ***************************/

export default function AdminDashboard() {
  const { enqueueSnackbar } = useSnackbar();
  const [exitLogs, setExitLogs] = useState([]);
  const [loadingLogs, setLoadingLogs] = useState(false);

  useEffect(() => {
    fetchExitLogs();
    
    // Set up polling every 30 seconds for real-time updates
    const interval = setInterval(() => {
      fetchExitLogs();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const fetchExitLogs = async () => {
    try {
      setLoadingLogs(true);
      const logs = await adminService.getAllOutingRequests({ 
        limit: 10,
        sortBy: 'exitTime',
        sortOrder: 'desc'
      });
      // Filter to show only approved requests with exit/return times
      const filteredLogs = Array.isArray(logs) 
        ? logs.filter(log => log.status === 'approved' && (log.exitTime || log.returnTime))
        : [];
      setExitLogs(filteredLogs);
    } catch (err) {
      console.error('Error fetching exit logs:', err);
    } finally {
      setLoadingLogs(false);
    }
  };

  return (
    <Grid container spacing={{ xs: 2, md: 3 }}>
      <Grid size={12}>
        <AnalyticsOverviewCard />
      </Grid>
      <Grid size={12}>
        <AnalyticsOverviewChart />
      </Grid>
      <Grid size={12}>
        <AnalyticsTopRef />
      </Grid>
      <Grid size={12}>
        <PresentationCard 
          title="Recent Student Exit/Return Logs" 
          secondary={
            <Button size="small" onClick={() => window.location.href = '/app/admin/outings'}>
              View All
            </Button>
          }
        >
          {loadingLogs ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
              <CircularProgress size={24} />
            </Box>
          ) : exitLogs.length === 0 ? (
            <Alert severity="info">No exit/return logs found</Alert>
          ) : (
            <TableContainer component={Paper} variant="outlined">
              <Table>
                  <TableHead>
                    <TableRow sx={{ bgcolor: 'grey.50' }}>
                      <TableCell><strong>Student</strong></TableCell>
                      <TableCell><strong>Purpose</strong></TableCell>
                      <TableCell><strong>Exit Time</strong></TableCell>
                      <TableCell><strong>Return Time</strong></TableCell>
                      <TableCell><strong>Scanned By</strong></TableCell>
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
                          <Typography variant="caption" color="text.secondary">
                            {log.destination || ''}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          {log.exitTime ? (
                            <Stack>
                              <Typography variant="body2" color="error.main">
                                {new Date(log.exitTime).toLocaleString()}
                              </Typography>
                              {log.exitScannedBy && (
                                <Typography variant="caption" color="text.secondary">
                                  by {log.exitScannedBy.name}
                                </Typography>
                              )}
                            </Stack>
                          ) : (
                            <Typography variant="body2" color="text.secondary">-</Typography>
                          )}
                        </TableCell>
                        <TableCell>
                          {log.returnTime ? (
                            <Stack>
                              <Typography variant="body2" color="success.main">
                                {new Date(log.returnTime).toLocaleString()}
                              </Typography>
                              {log.returnScannedBy && (
                                <Typography variant="caption" color="text.secondary">
                                  by {log.returnScannedBy.name}
                                </Typography>
                              )}
                            </Stack>
                          ) : (
                            <Typography variant="body2" color="text.secondary">-</Typography>
                          )}
                        </TableCell>
                        <TableCell>
                          <Stack spacing={0.5}>
                            {log.exitScannedBy && (
                              <Typography variant="caption" color="text.secondary">
                                Exit: {log.exitScannedBy.name}
                              </Typography>
                            )}
                            {log.returnScannedBy && (
                              <Typography variant="caption" color="text.secondary">
                                Return: {log.returnScannedBy.name}
                              </Typography>
                            )}
                            {!log.exitScannedBy && !log.returnScannedBy && (
                              <Typography variant="caption" color="text.secondary">-</Typography>
                            )}
                          </Stack>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={log.status === 'completed' ? 'Returned' : log.exitTime ? 'Outside' : 'Pending'}
                            color={log.status === 'completed' ? 'success' : log.exitTime ? 'warning' : 'default'}
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
      </Grid>
    </Grid>
  );
}

