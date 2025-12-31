import { useState, useEffect } from 'react';

// @mui
import Box from '@mui/material/Box';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Grid from '@mui/material/Grid';
import Card from '@mui/material/Card';
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
import Button from '@mui/material/Button';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import { useTheme } from '@mui/material/styles';
import { PieChart } from '@mui/x-charts/PieChart';

// @project
import ComponentsWrapper from '@/components/ComponentsWrapper';
import PresentationCard from '@/components/cards/PresentationCard';
import TabPanel from '@/components/TabPanel';
import parentService from '@/services/parentService';
import { useSnackbar } from 'notistack';

// @icons
import { IconCurrencyDollar, IconHistory, IconDownload, IconUser } from '@tabler/icons-react';

/***************************  PAYMENTS PAGE  ***************************/

export default function PaymentsPage() {
  const theme = useTheme();
  const { enqueueSnackbar } = useSnackbar();
  const [value, setValue] = useState(0);
  const [loading, setLoading] = useState(true);
  const [paymentStatus, setPaymentStatus] = useState(null);
  const [paymentHistory, setPaymentHistory] = useState([]);
  const [children, setChildren] = useState([]);
  const [selectedChildId, setSelectedChildId] = useState('all'); // 'all' means show all children

  useEffect(() => {
    fetchChildren();
  }, []);

  useEffect(() => {
    if (children.length > 0) {
      fetchPaymentStatus();
      fetchPaymentHistory();
    }
  }, [selectedChildId, children]);

  const fetchChildren = async () => {
    try {
      const data = await parentService.getChildren();
      setChildren(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Fetch children error:', err);
      enqueueSnackbar(err.response?.data?.message || 'Failed to load children', { variant: 'error' });
    }
  };

  const fetchPaymentStatus = async () => {
    try {
      setLoading(true);
      const params = selectedChildId !== 'all' ? { studentId: selectedChildId } : {};
      const data = await parentService.getPaymentStatus(params);
      setPaymentStatus(data);
    } catch (err) {
      console.error('Fetch payment status error:', err);
      enqueueSnackbar(err.response?.data?.message || 'Failed to load payment status', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const fetchPaymentHistory = async () => {
    try {
      const params = selectedChildId !== 'all' ? { studentId: selectedChildId } : {};
      const data = await parentService.getPaymentHistory(params);
      setPaymentHistory(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Fetch payment history error:', err);
      enqueueSnackbar(err.response?.data?.message || 'Failed to load payment history', { variant: 'error' });
    }
  };

  const handleChange = (event, newValue) => {
    setValue(newValue);
  };

  const paymentStatusData = paymentStatus?.summary ? [
    { id: 0, value: paymentStatus.summary.totalPaid, label: 'Paid', color: theme.palette.success.main },
    { id: 1, value: paymentStatus.summary.totalDue - paymentStatus.summary.totalPaid, label: 'Pending', color: theme.palette.warning.main }
  ] : [];

  return (
    <ComponentsWrapper title="Payments">
      <Box sx={{ width: '100%' }}>
        {/* Child Filter */}
        <PresentationCard sx={{ mb: 3 }}>
          <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap">
            <FormControl size="small" sx={{ minWidth: 250 }}>
              <InputLabel>
                <Stack direction="row" spacing={1} alignItems="center">
                  <IconUser size={16} />
                  <span>Filter by Child</span>
                </Stack>
              </InputLabel>
              <Select
                value={selectedChildId}
                label={
                  <Stack direction="row" spacing={1} alignItems="center">
                    <IconUser size={16} />
                    <span>Filter by Child</span>
                  </Stack>
                }
                onChange={(e) => setSelectedChildId(e.target.value)}
              >
                <MenuItem value="all">
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Typography>All Children</Typography>
                    {children.length > 0 && (
                      <Chip label={children.length} size="small" color="primary" />
                    )}
                  </Stack>
                </MenuItem>
                {children.map((child) => (
                  <MenuItem key={child._id} value={child._id}>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Typography>{child.name}</Typography>
                      <Chip 
                        label={child.studentId || child._id} 
                        size="small" 
                        variant="outlined" 
                        sx={{ fontSize: '0.7rem' }}
                      />
                    </Stack>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            {selectedChildId !== 'all' && (
              <Chip
                label={`Showing payments for: ${children.find(c => c._id === selectedChildId)?.name || 'Selected Child'}`}
                color="primary"
                onDelete={() => setSelectedChildId('all')}
                deleteIcon={<IconUser size={16} />}
              />
            )}
          </Stack>
        </PresentationCard>

        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
          <Tabs value={value} onChange={handleChange}>
            <Tab label="Fee Status" icon={<IconCurrencyDollar size={18} />} iconPosition="start" />
            <Tab label="Payment History" icon={<IconHistory size={18} />} iconPosition="start" />
          </Tabs>
        </Box>

        {/* Fee Status Tab */}
        <TabPanel value={value} index={0}>
          <PresentationCard>
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                <CircularProgress />
              </Box>
            ) : paymentStatus ? (
              <Stack spacing={3}>
                {/* Summary Cards */}
                <Grid container spacing={3}>
                  <Grid item xs={12} sm={6} md={3}>
                    <Card variant="outlined" sx={{ p: 2, bgcolor: 'grey.50' }}>
                      <Typography variant="body2" color="text.secondary" gutterBottom>Total Fee</Typography>
                      <Typography variant="h5" fontWeight={600}>
                        ₹{(paymentStatus.summary?.totalDue || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                      </Typography>
                    </Card>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <Card variant="outlined" sx={{ p: 2, bgcolor: 'success.lighter' }}>
                      <Typography variant="body2" color="text.secondary" gutterBottom>Paid Amount</Typography>
                      <Typography variant="h5" fontWeight={600} color="success.main">
                        ₹{(paymentStatus.summary?.totalPaid || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                      </Typography>
                    </Card>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <Card variant="outlined" sx={{ p: 2, bgcolor: 'warning.lighter' }}>
                      <Typography variant="body2" color="text.secondary" gutterBottom>Pending Amount</Typography>
                      <Typography variant="h5" fontWeight={600} color="warning.main">
                        ₹{((paymentStatus.summary?.totalDue || 0) - (paymentStatus.summary?.totalPaid || 0)).toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                      </Typography>
                    </Card>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <Card variant="outlined" sx={{ p: 2, bgcolor: 'error.lighter' }}>
                      <Typography variant="body2" color="text.secondary" gutterBottom>Overdue Fees</Typography>
                      <Typography variant="h5" fontWeight={600} color="error.main">
                        {paymentStatus.summary?.overdueFees || 0}
                      </Typography>
                    </Card>
                  </Grid>
                </Grid>

                {/* Payment Status Chart */}
                {paymentStatusData.length > 0 && (
                  <Card variant="outlined" sx={{ p: 3 }}>
                    <Typography variant="h6" gutterBottom>Payment Status Overview</Typography>
                    <Box sx={{ width: '100%', height: 300, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                      <PieChart
                        series={[
                          {
                            data: paymentStatusData,
                            innerRadius: 30,
                            outerRadius: 100,
                            paddingAngle: 2,
                            cornerRadius: 5,
                            cx: 150,
                            cy: 150
                          }
                        ]}
                        width={300}
                        height={300}
                        slotProps={{
                          legend: {
                            direction: 'column',
                            position: { vertical: 'bottom', horizontal: 'middle' },
                            padding: 0
                          }
                        }}
                      />
                    </Box>
                  </Card>
                )}

                {/* Fees by Student */}
                {paymentStatus.fees && paymentStatus.fees.length > 0 ? (
                  <Card variant="outlined" sx={{ p: 3 }}>
                    <Typography variant="h6" gutterBottom>Fees by Child</Typography>
                    <TableContainer>
                      <Table>
                        <TableHead>
                          <TableRow sx={{ bgcolor: 'grey.50' }}>
                            <TableCell><strong>Child</strong></TableCell>
                            <TableCell><strong>Fee Type</strong></TableCell>
                            <TableCell><strong>Total Amount</strong></TableCell>
                            <TableCell><strong>Paid</strong></TableCell>
                            <TableCell><strong>Pending</strong></TableCell>
                            <TableCell><strong>Due Date</strong></TableCell>
                            <TableCell><strong>Status</strong></TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {paymentStatus.fees.map((fee) => {
                            const remaining = fee.amount - (fee.paidAmount || 0);
                            return (
                              <TableRow key={fee._id} hover>
                                <TableCell>{fee.student?.name || 'N/A'}</TableCell>
                                <TableCell>
                                  {fee.feeType?.charAt(0).toUpperCase() + fee.feeType?.slice(1).replace('_', ' ')}
                                </TableCell>
                                <TableCell>₹{fee.amount.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</TableCell>
                                <TableCell>₹{(fee.paidAmount || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}</TableCell>
                                <TableCell>₹{remaining.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</TableCell>
                                <TableCell>{new Date(fee.dueDate).toLocaleDateString()}</TableCell>
                                <TableCell>
                                  <Chip
                                    label={fee.status}
                                    color={
                                      fee.status === 'paid' ? 'success' :
                                      fee.status === 'overdue' ? 'error' :
                                      fee.status === 'partial' ? 'warning' : 'default'
                                    }
                                    size="small"
                                  />
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </Card>
                ) : (
                  <Alert severity="info">No fees found</Alert>
                )}
              </Stack>
            ) : (
              <Alert severity="info">No payment status data available</Alert>
            )}
          </PresentationCard>
        </TabPanel>

        {/* Payment History Tab */}
        <TabPanel value={value} index={1}>
          <PresentationCard>
            {paymentHistory.length === 0 ? (
              <Alert severity="info">No payment history found</Alert>
            ) : (
              <TableContainer component={Paper} elevation={0} sx={{ border: 1, borderColor: 'divider', borderRadius: 2 }}>
                <Table>
                  <TableHead>
                    <TableRow sx={{ bgcolor: 'grey.50' }}>
                      <TableCell><strong>Date</strong></TableCell>
                      <TableCell><strong>Child</strong></TableCell>
                      <TableCell><strong>Type</strong></TableCell>
                      <TableCell><strong>Amount</strong></TableCell>
                      <TableCell><strong>Method</strong></TableCell>
                      <TableCell><strong>Transaction ID</strong></TableCell>
                      <TableCell><strong>Status</strong></TableCell>
                      <TableCell><strong>Receipt</strong></TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {paymentHistory
                      .filter((payment, index, self) => {
                        // Additional frontend duplicate filtering as backup
                        const paymentDate = new Date(payment.paymentDate || payment.date);
                        const dateKey = paymentDate.toISOString().substring(0, 10);
                        const minuteKey = paymentDate.toISOString().substring(0, 16);
                        const feeId = payment.fee?._id?.toString() || 'no-fee';
                        
                        const firstIndex = self.findIndex(p => {
                          const pDate = new Date(p.paymentDate || p.date);
                          const pDateKey = pDate.toISOString().substring(0, 10);
                          const pMinuteKey = pDate.toISOString().substring(0, 16);
                          const pFeeId = p.fee?._id?.toString() || 'no-fee';
                          
                          return (
                            (pFeeId === feeId && p.amount === payment.amount && p.paymentType === payment.paymentType && pDateKey === dateKey) ||
                            (p.amount === payment.amount && p.paymentType === payment.paymentType && pDateKey === dateKey) ||
                            (p.amount === payment.amount && p.paymentType === payment.paymentType && pMinuteKey === minuteKey) ||
                            (p.transactionId && p.transactionId === payment.transactionId)
                          );
                        });
                        
                        return firstIndex === index;
                      })
                      .map((payment) => {
                        // Normalize payment method display
                        const method = payment.paymentMethod || payment.method || '';
                        const methodDisplay = method === 'upi' || method.toLowerCase().includes('upi') 
                          ? 'UPI' 
                          : method === 'netbanking' || method.toLowerCase().includes('netbanking') || method.toLowerCase().includes('net banking')
                          ? 'Net Banking'
                          : method === 'online' || method.toLowerCase().includes('online')
                          ? 'UPI' // Normalize old "online" to "UPI"
                          : method || 'N/A';
                        
                        return (
                          <TableRow key={payment._id} hover>
                            <TableCell>{new Date(payment.paymentDate || payment.date).toLocaleDateString()}</TableCell>
                            <TableCell>{payment.student?.name || 'N/A'}</TableCell>
                            <TableCell>{payment.paymentType || payment.type || 'N/A'}</TableCell>
                            <TableCell>₹{payment.amount.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</TableCell>
                            <TableCell>{methodDisplay}</TableCell>
                            <TableCell>{payment.transactionId || 'N/A'}</TableCell>
                            <TableCell>
                              <Chip
                                label={payment.status}
                                color={payment.status === 'completed' ? 'success' : 'default'}
                                size="small"
                              />
                            </TableCell>
                            <TableCell>
                              <Button size="small" startIcon={<IconDownload size={16} />}>
                                Download
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </PresentationCard>
        </TabPanel>
      </Box>
    </ComponentsWrapper>
  );
}

