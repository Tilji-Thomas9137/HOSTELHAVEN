import { useState, useEffect } from 'react';

// @mui
import Box from '@mui/material/Box';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Grid from '@mui/material/Grid';
import Card from '@mui/material/Card';
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
import Chip from '@mui/material/Chip';
import TextField from '@mui/material/TextField';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import Alert from '@mui/material/Alert';
import CircularProgress from '@mui/material/CircularProgress';
import { useTheme } from '@mui/material/styles';
import { PieChart } from '@mui/x-charts/PieChart';

// @project
import ComponentsWrapper from '@/components/ComponentsWrapper';
import PresentationCard from '@/components/cards/PresentationCard';
import TabPanel from '@/components/TabPanel';
import studentService from '@/services/studentService';
import { useSnackbar } from 'notistack';

// @icons
import { IconCurrencyDollar, IconHistory, IconDownload, IconCheck, IconX } from '@tabler/icons-react';
import PaymentModal from '@/components/PaymentModal';

/***************************  PAYMENTS PAGE  ***************************/

export default function PaymentsPage() {
  const theme = useTheme();
  const { enqueueSnackbar } = useSnackbar();
  const [value, setValue] = useState(0);
  const [loading, setLoading] = useState(true);
  const [fees, setFees] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [selectedFee, setSelectedFee] = useState('');
  const [paymentAmount, setPaymentAmount] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [studentInfo, setStudentInfo] = useState(null);
  const [walletBalance, setWalletBalance] = useState(0);
  const [roomChangeRequest, setRoomChangeRequest] = useState(null);

  useEffect(() => {
    fetchFees();
    fetchPaymentHistory();
    fetchStudentInfo();
    fetchWalletAndRoomChange();
  }, []);

  const fetchStudentInfo = async () => {
    try {
      const profile = await studentService.getProfile();
      if (profile?.student) {
        setStudentInfo({
          name: profile.student.name,
          email: profile.user?.email || profile.student.email,
          phone: profile.user?.phone || profile.student.phone
        });
      }
    } catch (err) {
      // Ignore errors
    }
  };

  const fetchWalletAndRoomChange = async () => {
    try {
      // Fetch wallet balance
      const walletData = await studentService.getWallet();
      setWalletBalance(walletData?.balance || 0);

      // Fetch dashboard stats to get room change request
      const dashboardData = await studentService.getDashboardStats();
      setRoomChangeRequest(dashboardData?.stats?.pendingRoomChangeRequest || null);
    } catch (err) {
      // Ignore errors - these are optional enhancements
    }
  };

  const fetchFees = async () => {
    try {
      setLoading(true);
      const data = await studentService.getFees();
      setFees(data || []);
    } catch (err) {
      enqueueSnackbar(err.response?.data?.message || 'Failed to load fees', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const fetchPaymentHistory = async () => {
    try {
      const data = await studentService.getPaymentHistory();
      setTransactions(data || []);
    } catch (err) {
      enqueueSnackbar(err.response?.data?.message || 'Failed to load payment history', { variant: 'error' });
    }
  };

  const handleChange = (event, newValue) => {
    setValue(newValue);
  };

  const handlePayment = () => {
    if (!selectedFee) {
      enqueueSnackbar('Please select a fee to pay', { variant: 'warning' });
      return;
    }
    
    const fee = fees.find(f => f._id === selectedFee);
    if (!fee) {
      enqueueSnackbar('Selected fee not found', { variant: 'error' });
      return;
    }

    // Open payment modal
    setShowPaymentModal(true);
  };

  const [processingPayment, setProcessingPayment] = useState(false); // Prevent duplicate payment processing

  const handleDownloadReceipt = async (paymentId) => {
    try {
      setSubmitting(true);
      const blob = await studentService.downloadReceipt(paymentId);
      
      // Create a download link
      const url = window.URL.createObjectURL(new Blob([blob], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      
      // Get payment details for filename
      const payment = transactions.find(t => (t._id || t.id) === paymentId);
      const fileName = payment 
        ? `Receipt_${payment.transactionId || paymentId}_${new Date(payment.paymentDate || payment.date).toISOString().split('T')[0]}.pdf`
        : `Receipt_${paymentId}.pdf`;
      
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      enqueueSnackbar('Receipt downloaded successfully', { variant: 'success' });
    } catch (err) {
      enqueueSnackbar(err.response?.data?.message || 'Failed to download receipt', { variant: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  const handlePaymentSuccess = async (paymentResult) => {
    // Prevent duplicate processing
    if (processingPayment) {
      return;
    }

    try {
      setProcessingPayment(true);
      
      const fee = fees.find(f => f._id === selectedFee);
      if (!fee) {
        enqueueSnackbar('Selected fee not found', { variant: 'error' });
        setProcessingPayment(false);
        return;
      }

      // Check if fee is already fully paid (prevent duplicate payment)
      const remainingAmount = fee.amount - (fee.paidAmount || 0);
      if (remainingAmount <= 0) {
        enqueueSnackbar('This fee is already fully paid', { variant: 'warning' });
        setProcessingPayment(false);
        return;
      }
      
      // Process payment through backend
      // Map payment method correctly (gateway returns 'netbanking', 'upi', 'card', etc.)
      const methodMapping = {
        'upi': 'upi',
        'netbanking': 'netbanking',
        'card': 'card',
        'credit_card': 'credit_card',
        'debit_card': 'debit_card'
      };
      
      await studentService.makePayment({
        feeId: selectedFee,
        amount: remainingAmount,
        paymentMethod: methodMapping[paymentResult.method] || 'online_payment',
        transactionId: paymentResult.transactionId,
        notes: `Payment for ${fee.feeType?.charAt(0).toUpperCase() + fee.feeType?.slice(1).replace('_', ' ') || 'Fee'} - Gateway: ${paymentResult.paymentId}`
      });
      
      enqueueSnackbar('Payment processed successfully!', { variant: 'success' });
      setSelectedFee('');
      setPaymentAmount('');
      await fetchFees();
      await fetchPaymentHistory();
      await fetchWalletAndRoomChange(); // Refresh wallet and room change status
    } catch (err) {
      // If error is about duplicate transaction, show appropriate message
      if (err.response?.data?.message?.includes('already been processed') || 
          err.response?.data?.message?.includes('already fully paid')) {
        enqueueSnackbar('This payment has already been processed', { variant: 'warning' });
        await fetchFees();
        await fetchPaymentHistory();
        await fetchWalletAndRoomChange(); // Refresh wallet and room change status
      } else {
        enqueueSnackbar(err.response?.data?.message || 'Failed to record payment', { variant: 'error' });
      }
    } finally {
      setProcessingPayment(false);
    }
  };

  // Calculate totals from fees (source of truth) instead of transactions
  // This ensures accuracy even if multiple payments were made for the same fee
  const totalPaid = fees.reduce((sum, f) => sum + (f.paidAmount || 0), 0);
  const totalAmount = fees.reduce((sum, f) => sum + (f.amount || 0), 0);
  const totalPending = totalAmount - totalPaid;
  
  const pendingFees = fees.filter(f => f.status !== 'paid' && f.status !== 'overdue');
  const pendingFeesAmount = pendingFees.reduce((sum, f) => sum + (f.amount - (f.paidAmount || 0)), 0);
  
  const paymentStatusData = [
    { id: 0, value: totalPaid, label: 'Paid', color: theme.palette.success.main },
    { id: 1, value: pendingFeesAmount, label: 'Pending', color: theme.palette.warning.main }
  ];

  return (
    <ComponentsWrapper title="Payments">
      <Box sx={{ width: '100%' }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
          <Tabs value={value} onChange={handleChange}>
            <Tab label="Pay Fee" icon={<IconCurrencyDollar size={18} />} iconPosition="start" />
            <Tab label="Transaction History" icon={<IconHistory size={18} />} iconPosition="start" />
            <Tab label="Download Receipts" icon={<IconDownload size={18} />} iconPosition="start" />
          </Tabs>
        </Box>

        {/* Pay Fee Tab */}
        <TabPanel value={value} index={0}>
          <PresentationCard>
            <Stack spacing={3}>
              <Alert severity="info">
                Select a fee assigned by the administrator to make payment. The amount is automatically set based on the fee record.
              </Alert>
              
              {/* Fee Payment Status Chart */}
              <Card variant="outlined" sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>Fee Payment Status</Typography>
                <Grid container spacing={3} alignItems="center">
                  <Grid size={12} md={6}>
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
                  </Grid>
                  <Grid size={12} md={6}>
                    <Stack spacing={2}>
                      <Card variant="outlined" sx={{ p: 2, bgcolor: 'success.lighter' }}>
                        <Stack direction="row" justifyContent="space-between" alignItems="center">
                          <Typography variant="body2" fontWeight={600}>Total Paid</Typography>
                          <Typography variant="h6" color="success.main">₹{totalPaid.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</Typography>
                        </Stack>
                      </Card>
                      <Card variant="outlined" sx={{ p: 2, bgcolor: 'warning.lighter' }}>
                        <Stack direction="row" justifyContent="space-between" alignItems="center">
                          <Typography variant="body2" fontWeight={600}>Total Pending</Typography>
                          <Typography variant="h6" color="warning.main">₹{pendingFeesAmount.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</Typography>
                        </Stack>
                      </Card>
                      <Card variant="outlined" sx={{ p: 2, bgcolor: 'grey.50' }}>
                        <Stack direction="row" justifyContent="space-between" alignItems="center">
                          <Typography variant="body2" fontWeight={600}>Total Amount</Typography>
                          <Typography variant="h6">₹{totalAmount.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</Typography>
                        </Stack>
                      </Card>
                      <Card variant="outlined" sx={{ p: 2, bgcolor: walletBalance > 0 ? 'success.lighter' : 'grey.50' }}>
                        <Stack direction="row" justifyContent="space-between" alignItems="center">
                          <Typography variant="body2" fontWeight={600}>Wallet Balance</Typography>
                          <Typography variant="h6" color={walletBalance > 0 ? 'success.main' : 'text.secondary'}>₹{walletBalance.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</Typography>
                        </Stack>
                      </Card>
                    </Stack>
                  </Grid>
                </Grid>
              </Card>

              {/* Room Change Request Banner */}
              {roomChangeRequest && (
                <Alert 
                  severity={
                    roomChangeRequest.status === 'pending_payment' 
                      ? 'warning' 
                      : roomChangeRequest.status === 'approved' 
                        ? 'success' 
                        : 'info'
                  }
                  sx={{ mb: 2 }}
                >
                  <Stack spacing={1.5}>
                    <Typography variant="h6" fontWeight={600}>
                      Room Change Request - {roomChangeRequest.status.replace(/_/g, ' ').toUpperCase()}
                    </Typography>
                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ flexWrap: 'wrap' }}>
                      <Box>
                        <Typography variant="caption" color="text.secondary">Current Room</Typography>
                        <Typography variant="body2" fontWeight={600}>
                          {roomChangeRequest.currentRoom?.roomNumber} ({roomChangeRequest.currentRoom?.roomType})
                        </Typography>
                      </Box>
                      <Box>
                        <Typography variant="caption" color="text.secondary">Requested Room</Typography>
                        <Typography variant="body2" fontWeight={600}>
                          {roomChangeRequest.requestedRoom?.roomNumber} ({roomChangeRequest.requestedRoom?.roomType})
                        </Typography>
                      </Box>
                      <Box>
                        <Typography variant="caption" color="text.secondary">Price Difference</Typography>
                        <Typography 
                          variant="body2" 
                          fontWeight={600}
                          color={roomChangeRequest.priceDifference > 0 ? 'error.main' : roomChangeRequest.priceDifference < 0 ? 'success.main' : 'text.primary'}
                        >
                          {roomChangeRequest.priceDifference > 0 ? '+' : ''}
                          ₹{Math.abs(roomChangeRequest.priceDifference).toLocaleString('en-IN')}
                          {roomChangeRequest.priceDifference > 0 && ' (Upgrade)'}
                          {roomChangeRequest.priceDifference < 0 && ' (Downgrade)'}
                        </Typography>
                      </Box>
                    </Stack>

                    {/* Payment/Credit Information */}
                    {roomChangeRequest.upgradePaymentRequired > 0 && (
                      <Alert severity="warning" sx={{ mt: 1 }}>
                        <Stack spacing={0.5}>
                          {roomChangeRequest.alreadyPaidAmount > 0 && (
                            <Typography variant="caption" color="text.secondary">
                              Already Paid for Current Room: ₹{roomChangeRequest.alreadyPaidAmount.toLocaleString('en-IN')}
                            </Typography>
                          )}
                          <Typography variant="body2" fontWeight={600}>
                            Remaining Payment Required: ₹{roomChangeRequest.upgradePaymentRequired.toLocaleString('en-IN')}
                          </Typography>
                          <Typography variant="caption">
                            Please complete the payment to proceed with the room upgrade.
                          </Typography>
                        </Stack>
                      </Alert>
                    )}

                    {roomChangeRequest.downgradeWalletCredit > 0 && (
                      <Alert severity="success" sx={{ mt: 1 }}>
                        <Typography variant="body2" fontWeight={600}>
                          Wallet Credit: ₹{roomChangeRequest.downgradeWalletCredit.toLocaleString('en-IN')}
                        </Typography>
                        <Typography variant="caption">
                          {roomChangeRequest.status === 'approved' 
                            ? 'This amount has been credited to your wallet and can be used for future payments (mess fees, hostel fees, etc.).'
                            : 'This amount will be credited to your wallet upon approval and can be used for future payments (mess fees, hostel fees, etc.).'}
                        </Typography>
                      </Alert>
                    )}

                    {/* Submitted Date */}
                    <Typography variant="caption" color="text.secondary">
                      Submitted on: {new Date(roomChangeRequest.createdAt).toLocaleDateString('en-IN', { 
                        day: 'numeric', 
                        month: 'long', 
                        year: 'numeric' 
                      })}
                    </Typography>
                  </Stack>
                </Alert>
              )}

              {/* Late Fee Policy Alert */}
              <Alert severity="warning" sx={{ mb: 2 }}>
                <Typography variant="body2" fontWeight={600} gutterBottom>
                  ⚠️ Late Fee Policy
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Payment is due within <strong>10 days</strong> of room selection. A late fee of <strong>₹50 per day</strong> will be automatically added for overdue payments. Please complete your payment on time to avoid additional charges.
                </Typography>
              </Alert>

              {/* Pending Fees List */}
              {pendingFees.length > 0 ? (
                <Card variant="outlined" sx={{ p: 2, bgcolor: 'grey.50' }}>
                  <Typography variant="subtitle1" fontWeight={600} gutterBottom>Pending Fees</Typography>
                  <Stack spacing={2}>
                    {pendingFees.map((fee) => {
                      const remainingAmount = fee.amount - (fee.paidAmount || 0);
                      return (
                        <Card 
                          key={fee._id} 
                          variant="outlined" 
                          sx={{ 
                            p: 2, 
                            border: selectedFee === fee._id ? 2 : 1,
                            borderColor: selectedFee === fee._id ? 'primary.main' : 'divider',
                            cursor: 'pointer',
                            '&:hover': { bgcolor: 'action.hover' }
                          }}
                          onClick={() => {
                            setSelectedFee(fee._id);
                            setPaymentAmount(remainingAmount.toFixed(2));
                          }}
                        >
                          <Stack direction="row" justifyContent="space-between" alignItems="center">
                            <Stack>
                              <Typography variant="body1" fontWeight={600}>
                                {fee.feeType?.charAt(0).toUpperCase() + fee.feeType?.slice(1).replace('_', ' ')}
                              </Typography>
                              <Typography 
                                variant="caption" 
                                color={fee.dueDate && new Date(fee.dueDate) < new Date() ? 'error.main' : 'text.secondary'}
                                fontWeight={fee.dueDate && new Date(fee.dueDate) < new Date() ? 600 : 400}
                              >
                                Due: {fee.dueDate ? new Date(fee.dueDate).toLocaleDateString() : 'N/A'}
                                {fee.dueDate && new Date(fee.dueDate) < new Date() && ' (Overdue)'}
                              </Typography>
                              {fee.lateFee && fee.lateFee > 0 && (
                                <Typography variant="caption" color="error.main" fontWeight={600}>
                                  ⚠️ Late Fee: ₹{fee.lateFee.toLocaleString('en-IN')} (₹50/day)
                                </Typography>
                              )}
                              {fee.description && (
                                <Typography variant="caption" color="text.secondary">
                                  {fee.description}
                                </Typography>
                              )}
                            </Stack>
                            <Stack alignItems="flex-end">
                              <Typography variant="h6" fontWeight={600}>
                                ₹{remainingAmount.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                Total: ₹{fee.amount.toLocaleString('en-IN', { maximumFractionDigits: 0 })} | Paid: ₹{(fee.paidAmount || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                              </Typography>
                              <Chip 
                                label={fee.status} 
                                color={fee.status === 'overdue' ? 'error' : 'warning'} 
                                size="small" 
                                sx={{ mt: 0.5 }}
                              />
                            </Stack>
                          </Stack>
                        </Card>
                      );
                    })}
                  </Stack>
                </Card>
              ) : (
                <Alert severity="info">No pending fees. All fees have been paid.</Alert>
              )}

              {/* Payment Form - Only show when fee is selected */}
              {selectedFee && (
                <Card variant="outlined" sx={{ p: 3, bgcolor: 'primary.lighter' }}>
                  <Typography variant="h6" gutterBottom>Payment Details</Typography>
                  <Stack spacing={2}>
                    {(() => {
                      const selectedFeeData = fees.find(f => f._id === selectedFee);
                      const remainingAmount = selectedFeeData ? (selectedFeeData.amount - (selectedFeeData.paidAmount || 0)) : 0;
                      return (
                        <>
                          <FormControl fullWidth>
                            <InputLabel>Fee Type</InputLabel>
                            <Select 
                              label="Fee Type" 
                              value={selectedFee}
                              onChange={(e) => {
                                setSelectedFee(e.target.value);
                                const fee = fees.find(f => f._id === e.target.value);
                                if (fee) {
                                  setPaymentAmount((fee.amount - (fee.paidAmount || 0)).toFixed(2));
                                }
                              }}
                            >
                              {pendingFees.map((fee) => {
                                const remaining = fee.amount - (fee.paidAmount || 0);
                                return (
                                  <MenuItem key={fee._id} value={fee._id}>
                                    {fee.feeType?.charAt(0).toUpperCase() + fee.feeType?.slice(1).replace('_', ' ')} - ₹{remaining.toLocaleString('en-IN', { maximumFractionDigits: 0 })} remaining
                                  </MenuItem>
                                );
                              })}
                            </Select>
                          </FormControl>

                          <TextField
                            fullWidth
                            label="Amount to Pay"
                            type="number"
                            value={paymentAmount}
                            disabled
                            helperText={`Remaining balance for this fee. Amount is set by administrator.`}
                            InputProps={{
                              startAdornment: <Typography sx={{ mr: 1 }}>₹</Typography>
                            }}
                          />

                          {selectedFeeData && (
                            <Alert severity="info">
                              <Typography variant="body2">
                                <strong>Fee Details:</strong><br />
                                Total Amount: ₹{selectedFeeData.amount.toLocaleString('en-IN', { maximumFractionDigits: 0 })}<br />
                                Already Paid: ₹{(selectedFeeData.paidAmount || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}<br />
                                <strong>Remaining: ₹{remainingAmount.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</strong>
                              </Typography>
                            </Alert>
                          )}
                        </>
                      );
                    })()}
                  </Stack>
                </Card>
              )}

              {/* Payment Button - Only show when fee is selected */}
              {selectedFee && (
                <Button 
                  variant="contained" 
                  size="large" 
                  fullWidth 
                  startIcon={<IconCurrencyDollar size={18} />}
                  onClick={handlePayment}
                  disabled={submitting || !selectedFee || !paymentAmount}
                  sx={{ mt: 2 }}
                >
                  {submitting ? 'Processing...' : 'Proceed to Payment'}
                </Button>
              )}
            </Stack>
          </PresentationCard>
        </TabPanel>

        {/* Transaction History Tab */}
        <TabPanel value={value} index={1}>
          <PresentationCard>
            <TableContainer component={Paper} elevation={0} sx={{ border: 1, borderColor: 'divider', borderRadius: 2 }}>
              <Table>
                <TableHead>
                  <TableRow sx={{ bgcolor: 'grey.50' }}>
                    <TableCell><strong>Date</strong></TableCell>
                    <TableCell><strong>Type</strong></TableCell>
                    <TableCell><strong>Amount</strong></TableCell>
                    <TableCell><strong>Method</strong></TableCell>
                    <TableCell><strong>Status</strong></TableCell>
                    <TableCell><strong>Receipt</strong></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {transactions.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} align="center">
                        <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
                          No payment history
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    transactions
                      .filter((transaction, index, self) => {
                        // Aggressive duplicate removal: same amount + type + same day = duplicate
                        const transactionDate = new Date(transaction.paymentDate || transaction.date);
                        const dateKey = transactionDate.toISOString().substring(0, 10); // YYYY-MM-DD
                        const minuteKey = transactionDate.toISOString().substring(0, 16); // YYYY-MM-DDTHH:mm
                        
                        const firstIndex = self.findIndex(t => {
                          const tDate = new Date(t.paymentDate || t.date);
                          const tDateKey = tDate.toISOString().substring(0, 10);
                          const tMinuteKey = tDate.toISOString().substring(0, 16);
                          
                          // Check for exact duplicates
                          if (t._id && transaction._id && t._id.toString() === transaction._id.toString()) {
                            return true;
                          }
                          
                          // Check for same transaction ID
                          if (t.transactionId && transaction.transactionId && t.transactionId === transaction.transactionId) {
                            return true;
                          }
                          
                          // Check for same amount + type + same day (most aggressive - catches all duplicates on same day)
                          if (
                            t.amount === transaction.amount &&
                            t.paymentType === transaction.paymentType &&
                            dateKey === tDateKey &&
                            self.indexOf(t) < index
                          ) {
                            return true;
                          }
                          
                          // Check for same amount + type + same minute (catches duplicates created seconds apart)
                          if (
                            t.amount === transaction.amount &&
                            t.paymentType === transaction.paymentType &&
                            minuteKey === tMinuteKey &&
                            self.indexOf(t) < index
                          ) {
                            return true;
                          }
                          
                          return false;
                        });
                        return firstIndex === index;
                      })
                      .map((transaction) => {
                        // Format payment method display
                        let methodDisplay = transaction.paymentMethod || transaction.method || 'N/A';
                        if (methodDisplay === 'bank_transfer' || methodDisplay === 'netbanking') {
                          methodDisplay = 'Net Banking';
                        } else if (methodDisplay === 'upi') {
                          methodDisplay = 'UPI';
                        } else if (methodDisplay === 'card' || methodDisplay === 'credit_card') {
                          methodDisplay = 'Credit Card';
                        } else if (methodDisplay === 'debit_card') {
                          methodDisplay = 'Debit Card';
                        } else if (methodDisplay === 'online' || methodDisplay === 'online_payment') {
                          methodDisplay = 'Online Payment';
                        } else if (methodDisplay === 'cash') {
                          methodDisplay = 'Cash';
                        } else {
                          // Capitalize first letter of any other method
                          methodDisplay = methodDisplay.charAt(0).toUpperCase() + methodDisplay.slice(1).replace('_', ' ');
                        }
                        
                        return (
                          <TableRow key={transaction._id || transaction.id} hover>
                            <TableCell>{new Date(transaction.paymentDate || transaction.date).toLocaleDateString()}</TableCell>
                            <TableCell>{transaction.paymentType || transaction.type}</TableCell>
                            <TableCell>₹{transaction.amount?.toLocaleString('en-IN', { maximumFractionDigits: 0 }) || '0'}</TableCell>
                            <TableCell>{methodDisplay}</TableCell>
                            <TableCell>
                              <Chip
                                label={transaction.status}
                                color={transaction.status === 'completed' ? 'success' : 'error'}
                                size="small"
                                icon={transaction.status === 'completed' ? <IconCheck size={16} /> : <IconX size={16} />}
                              />
                            </TableCell>
                            <TableCell>
                              <Button 
                                size="small" 
                                startIcon={<IconDownload size={16} />}
                                onClick={() => handleDownloadReceipt(transaction._id || transaction.id)}
                                disabled={submitting}
                              >
                                Download
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </PresentationCard>
        </TabPanel>

        {/* Download Receipts Tab */}
        <TabPanel value={value} index={2}>
          <PresentationCard>
            <Stack spacing={3}>
              <Alert severity="info">Download receipts for your completed payments.</Alert>
              
              <TableContainer component={Paper} elevation={0} sx={{ border: 1, borderColor: 'divider', borderRadius: 2 }}>
                <Table>
                  <TableHead>
                    <TableRow sx={{ bgcolor: 'grey.50' }}>
                      <TableCell><strong>Receipt Number</strong></TableCell>
                      <TableCell><strong>Date</strong></TableCell>
                      <TableCell><strong>Amount</strong></TableCell>
                      <TableCell><strong>Type</strong></TableCell>
                      <TableCell><strong>Action</strong></TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {transactions.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} align="center">
                          <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
                            No receipts available
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ) : (
                    transactions
                      .filter((transaction, index, self) => {
                        // Aggressive duplicate removal: same amount + type + same day = duplicate
                        const transactionDate = new Date(transaction.paymentDate || transaction.date);
                        const dateKey = transactionDate.toISOString().substring(0, 10); // YYYY-MM-DD
                        const minuteKey = transactionDate.toISOString().substring(0, 16); // YYYY-MM-DDTHH:mm
                        
                        const firstIndex = self.findIndex(t => {
                          const tDate = new Date(t.paymentDate || t.date);
                          const tDateKey = tDate.toISOString().substring(0, 10);
                          const tMinuteKey = tDate.toISOString().substring(0, 16);
                          
                          // Check for exact duplicates
                          if (t._id && transaction._id && t._id.toString() === transaction._id.toString()) {
                            return true;
                          }
                          
                          // Check for same transaction ID
                          if (t.transactionId && transaction.transactionId && t.transactionId === transaction.transactionId) {
                            return true;
                          }
                          
                          // Check for same amount + type + same day (most aggressive - catches all duplicates on same day)
                          if (
                            t.amount === transaction.amount &&
                            t.paymentType === transaction.paymentType &&
                            dateKey === tDateKey &&
                            self.indexOf(t) < index
                          ) {
                            return true;
                          }
                          
                          // Check for same amount + type + same minute (catches duplicates created seconds apart)
                          if (
                            t.amount === transaction.amount &&
                            t.paymentType === transaction.paymentType &&
                            minuteKey === tMinuteKey &&
                            self.indexOf(t) < index
                          ) {
                            return true;
                          }
                          
                          return false;
                        });
                        return firstIndex === index;
                      })
                      .map((transaction) => (
                        <TableRow key={transaction._id || transaction.id} hover>
                          <TableCell>{transaction.transactionId || transaction.receipt || 'N/A'}</TableCell>
                          <TableCell>{new Date(transaction.paymentDate || transaction.date).toLocaleDateString()}</TableCell>
                          <TableCell>₹{transaction.amount?.toLocaleString('en-IN', { maximumFractionDigits: 0 }) || '0'}</TableCell>
                          <TableCell>{transaction.paymentType || transaction.type}</TableCell>
                          <TableCell>
                            <Button
                              variant="outlined"
                              size="small"
                              startIcon={<IconDownload size={16} />}
                              onClick={() => handleDownloadReceipt(transaction._id || transaction.id)}
                              disabled={submitting}
                            >
                              Download PDF
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </Stack>
          </PresentationCard>
        </TabPanel>
      </Box>

      {/* Payment Modal */}
      {selectedFee && (
        <PaymentModal
          open={showPaymentModal}
          onClose={() => setShowPaymentModal(false)}
          fee={fees.find(f => f._id === selectedFee)}
          onPaymentSuccess={handlePaymentSuccess}
          studentInfo={studentInfo}
        />
      )}
    </ComponentsWrapper>
  );
}

