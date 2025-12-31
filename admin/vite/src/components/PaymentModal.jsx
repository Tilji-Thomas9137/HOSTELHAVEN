import { useState, useEffect } from 'react';

// @mui
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import FormControl from '@mui/material/FormControl';
import FormControlLabel from '@mui/material/FormControlLabel';
import RadioGroup from '@mui/material/RadioGroup';
import Radio from '@mui/material/Radio';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Divider from '@mui/material/Divider';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import Chip from '@mui/material/Chip';
import IconButton from '@mui/material/IconButton';
import Fade from '@mui/material/Fade';
import Zoom from '@mui/material/Zoom';

// @icons
import { IconX, IconCheck, IconCreditCard, IconDeviceMobile, IconBuildingBank, IconWallet, IconLock } from '@tabler/icons-react';

// @project
import { initializePayment, processPayment, getPaymentMethods } from '@/services/paymentGateway';

/***************************  PAYMENT MODAL  ***************************/

export default function PaymentModal({ open, onClose, fee, onPaymentSuccess, studentInfo }) {
  const [step, setStep] = useState('method'); // 'method', 'details', 'processing', 'success', 'failed'
  const [paymentMethod, setPaymentMethod] = useState('upi'); // Default to UPI
  const [cardDetails, setCardDetails] = useState({
    number: '',
    name: '',
    expiry: '',
    cvv: ''
  });
  const [upiId, setUpiId] = useState('');
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [paymentResult, setPaymentResult] = useState(null);
  const [paymentProcessed, setPaymentProcessed] = useState(false); // Flag to prevent duplicate processing

  const paymentMethods = getPaymentMethods();
  const amount = fee ? (fee.amount - (fee.paidAmount || 0)) : 0;

  const handleClose = () => {
    if (!processing) {
      setStep('method');
      setPaymentMethod('upi');
      setCardDetails({ number: '', name: '', expiry: '', cvv: '' });
      setUpiId('');
      setError(null);
      setPaymentResult(null);
      setPaymentProcessed(false); // Reset payment processed flag
      onClose();
    }
  };

  // Reset state when modal opens
  useEffect(() => {
    if (open) {
      setStep('method');
      setPaymentMethod('upi');
      setCardDetails({ number: '', name: '', expiry: '', cvv: '' });
      setUpiId('');
      setError(null);
      setPaymentResult(null);
      setPaymentProcessed(false);
      setProcessing(false);
    }
  }, [open]);

  const handleMethodSelect = (method) => {
    setPaymentMethod(method);
    setError(null);
  };

  const handleProceedToPayment = () => {
    if (paymentMethod === 'upi') {
      if (!upiId || !upiId.includes('@')) {
        setError('Please enter a valid UPI ID (e.g., yourname@paytm)');
        return;
      }
    } else if (paymentMethod === 'netbanking') {
      // Net banking doesn't need additional validation - will be handled by gateway
    }
    
    setStep('processing');
    setError(null);
    processPaymentFlow();
  };

  const processPaymentFlow = async () => {
    try {
      setProcessing(true);
      
      // Step 1: Initialize payment with gateway
      const initResponse = await initializePayment({
        amount: amount,
        description: `Payment for ${fee?.feeType || 'Fee'}`,
        studentName: studentInfo?.name || 'Student',
        email: studentInfo?.email || 'student@hostelhaven.com',
        phone: studentInfo?.phone || '9999999999'
      });

      if (!initResponse.success) {
        throw new Error('Failed to initialize payment');
      }

      // Step 2: Process payment
      const paymentResponse = await processPayment({
        orderId: initResponse.orderId,
        amount: amount,
        paymentMethod: paymentMethod,
        upiId: paymentMethod === 'upi' ? upiId : null,
        netbanking: paymentMethod === 'netbanking' ? true : null
      });

      if (paymentResponse.success) {
        setPaymentResult(paymentResponse);
        setStep('success');
        
        // Prevent duplicate processing
        if (!paymentProcessed) {
          setPaymentProcessed(true);
          
          // Call success callback after a delay
          setTimeout(() => {
            onPaymentSuccess(paymentResponse);
            handleClose();
          }, 2000);
        }
      } else {
        setError(paymentResponse.error?.description || 'Payment failed. Please try again.');
        setStep('failed');
      }
    } catch (err) {
      setError(err.message || 'Payment processing failed. Please try again.');
      setStep('failed');
    } finally {
      setProcessing(false);
    }
  };


  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      TransitionComponent={Zoom}
      TransitionProps={{ timeout: 300 }}
      PaperProps={{
        sx: {
          borderRadius: 3,
          boxShadow: 24,
        }
      }}
    >
      <DialogTitle>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Stack direction="row" spacing={2} alignItems="center">
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 48,
                height: 48,
                borderRadius: '50%',
                bgcolor: 'primary.lighter',
                color: 'primary.main',
              }}
            >
              <IconLock size={24} />
            </Box>
            <Typography variant="h5" fontWeight={600}>
              Secure Payment
            </Typography>
          </Stack>
          <IconButton size="small" onClick={handleClose} disabled={processing}>
            <IconX size={20} />
          </IconButton>
        </Stack>
      </DialogTitle>

      <DialogContent>
        <Stack spacing={3} sx={{ mt: 1 }}>
          {/* Payment Amount Summary */}
          <Card variant="outlined" sx={{ bgcolor: 'primary.lighter', p: 2 }}>
            <Stack spacing={1}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2" color="text.secondary">Amount to Pay:</Typography>
                <Typography variant="h5" fontWeight={700} color="primary.main">
                  ₹{amount.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                </Typography>
              </Box>
              {fee && (
                <>
                  <Divider />
                  <Typography variant="caption" color="text.secondary">
                    {fee.feeType?.charAt(0).toUpperCase() + fee.feeType?.slice(1).replace('_', ' ')} Fee
                  </Typography>
                </>
              )}
            </Stack>
          </Card>

          {/* Error Display */}
          {error && (
            <Alert severity="error" onClose={() => setError(null)}>
              {error}
            </Alert>
          )}

          {/* Payment Method Selection */}
          {step === 'method' && (
            <Box>
              <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                Select Payment Method
              </Typography>
              <RadioGroup value={paymentMethod} onChange={(e) => handleMethodSelect(e.target.value)}>
                <Stack spacing={1}>
                  {paymentMethods.map((method) => (
                    <Card
                      key={method.id}
                      variant="outlined"
                      sx={{
                        p: 2,
                        cursor: 'pointer',
                        border: paymentMethod === method.id ? 2 : 1,
                        borderColor: paymentMethod === method.id ? 'primary.main' : 'divider',
                        bgcolor: paymentMethod === method.id ? 'primary.lighter' : 'background.paper',
                        '&:hover': {
                          borderColor: 'primary.main',
                          bgcolor: 'action.hover'
                        }
                      }}
                      onClick={() => handleMethodSelect(method.id)}
                    >
                      <FormControlLabel
                        value={method.id}
                        control={<Radio />}
                        label={
                          <Stack direction="row" spacing={2} alignItems="center" sx={{ width: '100%' }}>
                            <Typography variant="h4">{method.icon}</Typography>
                            <Stack>
                              <Typography variant="body1" fontWeight={600}>
                                {method.name}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {method.description}
                              </Typography>
                            </Stack>
                          </Stack>
                        }
                        sx={{ m: 0, width: '100%' }}
                      />
                    </Card>
                  ))}
                </Stack>
              </RadioGroup>
            </Box>
          )}

          {/* Payment Details Form */}
          {step === 'method' && (
            <Box>
              <Button
                variant="contained"
                fullWidth
                size="large"
                onClick={handleProceedToPayment}
                disabled={!paymentMethod}
                sx={{ py: 1.5 }}
              >
                Continue to Payment
              </Button>
            </Box>
          )}

          {/* UPI Payment Details */}
          {step === 'method' && paymentMethod === 'upi' && (
            <Fade in={paymentMethod === 'upi'}>
              <Card variant="outlined" sx={{ p: 2, bgcolor: 'grey.50' }}>
                <Stack spacing={2}>
                  <Typography variant="subtitle2" fontWeight={600}>
                    UPI Details
                  </Typography>
                  <TextField
                    fullWidth
                    label="UPI ID"
                    placeholder="yourname@paytm"
                    value={upiId}
                    onChange={(e) => setUpiId(e.target.value)}
                    InputProps={{
                      startAdornment: <IconDeviceMobile size={20} style={{ marginRight: 8, color: '#666' }} />
                    }}
                    helperText="Enter your UPI ID (e.g., yourname@paytm, yourname@ybl)"
                  />
                  <Alert severity="info" icon={false}>
                    <Typography variant="caption">
                      📱 Use any UPI ID for testing. Example: test@paytm
                    </Typography>
                  </Alert>
                </Stack>
              </Card>
            </Fade>
          )}

          {/* Net Banking Payment Details */}
          {step === 'method' && paymentMethod === 'netbanking' && (
            <Fade in={paymentMethod === 'netbanking'}>
              <Card variant="outlined" sx={{ p: 2, bgcolor: 'grey.50' }}>
                <Stack spacing={2}>
                  <Typography variant="subtitle2" fontWeight={600}>
                    Net Banking
                  </Typography>
                  <Alert severity="info" icon={false}>
                    <Typography variant="body2">
                      You will be redirected to your bank's secure payment page to complete the transaction.
                    </Typography>
                  </Alert>
                  <Alert severity="info" icon={false}>
                    <Typography variant="caption">
                      🏦 Select your bank and complete the payment on the bank's website.
                    </Typography>
                  </Alert>
                </Stack>
              </Card>
            </Fade>
          )}

          {/* Processing State */}
          {step === 'processing' && (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <CircularProgress size={60} sx={{ mb: 2 }} />
              <Typography variant="h6" gutterBottom>
                Processing Payment...
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Please wait while we process your payment securely
              </Typography>
            </Box>
          )}

          {/* Success State */}
          {step === 'success' && paymentResult && (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 80,
                  height: 80,
                  borderRadius: '50%',
                  bgcolor: 'success.lighter',
                  color: 'success.main',
                  mx: 'auto',
                  mb: 2,
                }}
              >
                <IconCheck size={48} />
              </Box>
              <Typography variant="h5" fontWeight={600} color="success.main" gutterBottom>
                Payment Successful!
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Your payment has been processed successfully
              </Typography>
              <Card variant="outlined" sx={{ mt: 2, p: 2, bgcolor: 'grey.50' }}>
                <Stack spacing={1}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2" color="text.secondary">Transaction ID:</Typography>
                    <Typography variant="body2" fontWeight={600} fontFamily="monospace">
                      {paymentResult.transactionId}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2" color="text.secondary">Payment ID:</Typography>
                    <Typography variant="body2" fontWeight={600} fontFamily="monospace">
                      {paymentResult.paymentId}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2" color="text.secondary">Amount:</Typography>
                    <Typography variant="body2" fontWeight={600}>
                      ₹{paymentResult.amount.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                    </Typography>
                  </Box>
                </Stack>
              </Card>
            </Box>
          )}

          {/* Failed State */}
          {step === 'failed' && (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 80,
                  height: 80,
                  borderRadius: '50%',
                  bgcolor: 'error.lighter',
                  color: 'error.main',
                  mx: 'auto',
                  mb: 2,
                }}
              >
                <IconX size={48} />
              </Box>
              <Typography variant="h5" fontWeight={600} color="error.main" gutterBottom>
                Payment Failed
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {error || 'Your payment could not be processed. Please try again.'}
              </Typography>
            </Box>
          )}
        </Stack>
      </DialogContent>

      <DialogActions sx={{ p: 3, pt: 2 }}>
        {step === 'failed' && (
          <Button
            variant="contained"
            fullWidth
            onClick={() => {
              setStep('method');
              setError(null);
            }}
          >
            Try Again
          </Button>
        )}
        {(step === 'method' || step === 'success') && (
          <Button
            variant="outlined"
            fullWidth
            onClick={handleClose}
            disabled={processing}
          >
            {step === 'success' ? 'Close' : 'Cancel'}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}

