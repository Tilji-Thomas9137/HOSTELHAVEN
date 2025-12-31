import { useState, useEffect } from 'react';

// @mui
import Box from '@mui/material/Box';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';

// @project
import ComponentsWrapper from '@/components/ComponentsWrapper';
import PresentationCard from '@/components/cards/PresentationCard';
import TabPanel from '@/components/TabPanel';
import studentService from '@/services/studentService';
import { useSnackbar } from 'notistack';

// @icons
import { IconUserSearch, IconCheck } from '@tabler/icons-react';

/***************************  VISITORS PAGE  ***************************/

export default function VisitorsPage() {
  const { enqueueSnackbar } = useSnackbar();
  const [value, setValue] = useState(0);
  const [loading, setLoading] = useState(true);
  const [visitorLogs, setVisitorLogs] = useState([]);

  useEffect(() => {
    fetchVisitorHistory();
  }, []);

  const fetchVisitorHistory = async () => {
    try {
      setLoading(true);
      const data = await studentService.getVisitorHistory();
      setVisitorLogs(data || []);
    } catch (err) {
      enqueueSnackbar(err.response?.data?.message || 'Failed to load visitor history', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (event, newValue) => {
    setValue(newValue);
  };

  const formatTime = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  const allVisitors = visitorLogs.sort((a, b) => new Date(b.checkIn || b.date) - new Date(a.checkIn || a.date));
  // Approved visitors are those who have checked in (currently visiting or have completed visit)
  const approvedVisitors = visitorLogs.filter(v => v.status === 'checked_in' || v.status === 'checked_out');

  return (
    <ComponentsWrapper title="Visitors">
      <Box sx={{ width: '100%' }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
          <Tabs value={value} onChange={handleChange}>
            <Tab label="Visitor Logs" icon={<IconUserSearch size={18} />} iconPosition="start" />
            <Tab label="Approved Visitors" icon={<IconCheck size={18} />} iconPosition="start" />
          </Tabs>
        </Box>

        {/* Visitor Logs Tab */}
        <TabPanel value={value} index={0}>
          <PresentationCard>
            <TableContainer component={Paper} elevation={0} sx={{ border: 1, borderColor: 'divider', borderRadius: 2 }}>
              <Table>
                <TableHead>
                  <TableRow sx={{ bgcolor: 'grey.50' }}>
                    <TableCell><strong>Name</strong></TableCell>
                    <TableCell><strong>Relation</strong></TableCell>
                    <TableCell><strong>Phone</strong></TableCell>
                    <TableCell><strong>Date</strong></TableCell>
                    <TableCell><strong>IN Time</strong></TableCell>
                    <TableCell><strong>OUT Time</strong></TableCell>
                    <TableCell><strong>Status</strong></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={7} align="center">
                        <CircularProgress sx={{ py: 2 }} />
                      </TableCell>
                    </TableRow>
                  ) : allVisitors.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} align="center">
                        <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
                          No visitor logs found
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    allVisitors.map((visitor) => (
                      <TableRow key={visitor._id || visitor.id} hover>
                        <TableCell>{visitor.visitorName || visitor.name}</TableCell>
                        <TableCell>{visitor.relation || 'N/A'}</TableCell>
                        <TableCell>{visitor.visitorPhone || visitor.phone || 'N/A'}</TableCell>
                        <TableCell>{new Date(visitor.checkIn || visitor.date).toLocaleDateString()}</TableCell>
                        <TableCell>{formatTime(visitor.checkIn)}</TableCell>
                        <TableCell>{formatTime(visitor.checkOut)}</TableCell>
                        <TableCell>
                          <Chip
                            label={visitor.status === 'checked_in' ? 'Checked In' : visitor.status === 'checked_out' ? 'Checked Out' : visitor.status}
                            color={visitor.status === 'checked_out' ? 'success' : visitor.status === 'checked_in' ? 'warning' : 'default'}
                            size="small"
                            icon={visitor.status === 'checked_out' ? <IconCheck size={16} /> : null}
                          />
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </PresentationCard>
        </TabPanel>

        {/* Approved Visitors Tab */}
        <TabPanel value={value} index={1}>
          <PresentationCard>
            <TableContainer component={Paper} elevation={0} sx={{ border: 1, borderColor: 'divider', borderRadius: 2 }}>
              <Table>
                <TableHead>
                  <TableRow sx={{ bgcolor: 'grey.50' }}>
                    <TableCell><strong>Name</strong></TableCell>
                    <TableCell><strong>Relation</strong></TableCell>
                    <TableCell><strong>Phone</strong></TableCell>
                    <TableCell><strong>Approved Date</strong></TableCell>
                    <TableCell><strong>Status</strong></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={5} align="center">
                        <CircularProgress sx={{ py: 2 }} />
                      </TableCell>
                    </TableRow>
                  ) : approvedVisitors.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} align="center">
                        <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
                          No approved visitors
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    approvedVisitors.map((visitor) => (
                      <TableRow key={visitor._id || visitor.id} hover>
                        <TableCell>{visitor.visitorName || visitor.name}</TableCell>
                        <TableCell>{visitor.relation || 'N/A'}</TableCell>
                        <TableCell>{visitor.visitorPhone || visitor.phone || 'N/A'}</TableCell>
                        <TableCell>{new Date(visitor.checkIn || visitor.approvedDate).toLocaleDateString()}</TableCell>
                        <TableCell>
                          <Chip
                            label={visitor.status === 'checked_in' ? 'Checked In' : visitor.status === 'checked_out' ? 'Checked Out' : visitor.status}
                            color={visitor.status === 'checked_out' ? 'success' : 'warning'}
                            size="small"
                            icon={visitor.status === 'checked_out' ? <IconCheck size={16} /> : null}
                          />
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </PresentationCard>
        </TabPanel>
      </Box>
    </ComponentsWrapper>
  );
}

