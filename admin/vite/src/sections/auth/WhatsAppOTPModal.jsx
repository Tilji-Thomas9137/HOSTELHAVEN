import { useState } from 'react';

// @mui
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';

// @third-party
import { useForm } from 'react-hook-form';

// @project
import { contactSchema, otpSchema } from '@/utils/validation-schema/common';
import authService from '@/services/authService';

/***************************  WHATSAPP OTP MODAL  ***************************/

export default function WhatsAppOTPModal({ open, onClose, onSuccess }) {
  const [step, setStep] = useState('phone'); // 'phone' or 'otp'
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [otpSent, setOtpSent] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset
  } = useForm();

  const handlePhoneSubmit = async (data) => {
    setIsLoading(true);
    setError('');

    try {
      await authService.sendOTP(data.phone);
      setPhoneNumber(data.phone);
      setOtpSent(true);
      setStep('otp');
      reset();
    } catch (err) {
      setError(err.message || 'Failed to send OTP. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOTPSubmit = async (data) => {
    setIsLoading(true);
    setError('');

    try {
      const result = await authService.verifyOTP(phoneNumber, data.otp);
      onSuccess(result.user, result.token, result.refreshToken);
      handleClose();
    } catch (err) {
      setError(err.message || 'Invalid OTP. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setStep('phone');
    setPhoneNumber('');
    setError('');
    setOtpSent(false);
    reset();
    onClose();
  };

  const handleResendOTP = async () => {
    setIsLoading(true);
    setError('');

    try {
      await authService.sendOTP(phoneNumber);
      setError('');
      reset();
    } catch (err) {
      setError(err.message || 'Failed to resend OTP. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Typography variant="h6">Sign in with WhatsApp</Typography>
      </DialogTitle>
      <DialogContent>
        <Stack spacing={3} sx={{ mt: 1 }}>
          {error && (
            <Alert severity="error" onClose={() => setError('')}>
              {error}
            </Alert>
          )}

          {step === 'phone' && (
            <form onSubmit={handleSubmit(handlePhoneSubmit)} id="phone-form">
              <Stack spacing={2}>
                <Typography variant="body2" color="text.secondary">
                  Enter your WhatsApp number to receive a verification code
                </Typography>
                <TextField
                  {...register('phone', contactSchema)}
                  label="Phone Number"
                  placeholder="1234567890"
                  fullWidth
                  error={Boolean(errors.phone)}
                  helperText={errors.phone?.message}
                  disabled={isLoading}
                  inputProps={{ maxLength: 15 }}
                />
              </Stack>
            </form>
          )}

          {step === 'otp' && (
            <form onSubmit={handleSubmit(handleOTPSubmit)} id="otp-form">
              <Stack spacing={2}>
                <Typography variant="body2" color="text.secondary">
                  Enter the 6-digit code sent to {phoneNumber}
                </Typography>
                <TextField
                  {...register('otp', otpSchema)}
                  label="OTP Code"
                  placeholder="123456"
                  fullWidth
                  error={Boolean(errors.otp)}
                  helperText={errors.otp?.message}
                  disabled={isLoading}
                  inputProps={{ maxLength: 6 }}
                />
                <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <Button
                    size="small"
                    onClick={handleResendOTP}
                    disabled={isLoading}
                    sx={{ textTransform: 'none' }}
                  >
                    Resend OTP
                  </Button>
                </Box>
              </Stack>
            </form>
          )}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={isLoading}>
          Cancel
        </Button>
        <Button
          type="submit"
          form={step === 'phone' ? 'phone-form' : 'otp-form'}
          variant="contained"
          disabled={isLoading}
          startIcon={isLoading && <CircularProgress size={16} />}
        >
          {step === 'phone' ? 'Send OTP' : 'Verify OTP'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

