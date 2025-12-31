import PropTypes from 'prop-types';
import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';

// @mui
import { useTheme } from '@mui/material/styles';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import FormHelperText from '@mui/material/FormHelperText';
import InputAdornment from '@mui/material/InputAdornment';
import InputLabel from '@mui/material/InputLabel';
import Link from '@mui/material/Link';
import OutlinedInput from '@mui/material/OutlinedInput';
import Stack from '@mui/material/Stack';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';

// @third-party
import { useForm } from 'react-hook-form';

// @project
import RouterLink from '@/components/Link';
import { useRouter } from '@/utils/navigation';
import authService from '@/services/authService';
import { useSnackbar } from 'notistack';

// @icons
import { IconEye, IconEyeOff } from '@tabler/icons-react';

/***************************  AUTH - RESET PASSWORD  ***************************/

export default function AuthResetPassword({ inputSx }) {
  const router = useRouter();
  const theme = useTheme();
  const { enqueueSnackbar } = useSnackbar();
  const [searchParams] = useSearchParams();

  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isConfirmPasswordVisible, setIsConfirmPasswordVisible] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [resetToken, setResetToken] = useState(null);

  useEffect(() => {
    const token = searchParams.get('token');
    if (token) {
      setResetToken(token);
    } else {
      enqueueSnackbar('Invalid reset link. Please request a new password reset.', { variant: 'error' });
    }
  }, [searchParams, enqueueSnackbar]);

  // Initialize react-hook-form
  const {
    register,
    watch,
    handleSubmit,
    formState: { errors }
  } = useForm();

  const password = watch('password');
  const confirmPassword = watch('confirmPassword');

  // Handle form submission
  const onSubmit = async (formData) => {
    if (!resetToken) {
      enqueueSnackbar('Invalid reset token', { variant: 'error' });
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      enqueueSnackbar('Passwords do not match', { variant: 'error' });
      return;
    }

    setIsProcessing(true);
    setIsSuccess(false);

    try {
      await authService.resetPassword(resetToken, formData.password);
      setIsSuccess(true);
      enqueueSnackbar('Password reset successful! Redirecting to login...', { variant: 'success' });
      
      // Redirect to login after 2 seconds
      setTimeout(() => {
        router.replace('/auth/login');
      }, 2000);
    } catch (error) {
      console.error('Reset password error:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to reset password. Please try again.';
      enqueueSnackbar(errorMessage, { variant: 'error' });
    } finally {
      setIsProcessing(false);
    }
  };

  const commonIconProps = { size: 16, color: theme.palette.grey[700] };

  if (!resetToken) {
    return (
      <Alert severity="error" sx={{ mb: 2 }}>
        Invalid or missing reset token. Please request a new password reset link.
      </Alert>
    );
  }

  if (isSuccess) {
    return (
      <Alert severity="success" sx={{ mb: 2 }}>
        Password reset successful! Redirecting to login page...
      </Alert>
    );
  }

  return (
    <>
      <Typography variant="h3" gutterBottom>
        Reset Password
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Enter your new password below.
      </Typography>

      <form onSubmit={handleSubmit(onSubmit)}>
        <Stack gap={2}>
          <Box>
            <InputLabel>New Password</InputLabel>
            <OutlinedInput
              {...register('password', {
                required: 'Password is required',
                minLength: {
                  value: 6,
                  message: 'Password must be at least 6 characters'
                }
              })}
              type={isPasswordVisible ? 'text' : 'password'}
              placeholder="Enter new password"
              fullWidth
              error={Boolean(errors.password)}
              endAdornment={
                <InputAdornment position="end" sx={{ cursor: 'pointer' }} onClick={() => setIsPasswordVisible(!isPasswordVisible)}>
                  {isPasswordVisible ? <IconEye {...commonIconProps} /> : <IconEyeOff {...commonIconProps} />}
                </InputAdornment>
              }
              sx={inputSx}
            />
            {errors.password?.message && <FormHelperText error>{errors.password.message}</FormHelperText>}
          </Box>

          <Box>
            <InputLabel>Confirm New Password</InputLabel>
            <OutlinedInput
              {...register('confirmPassword', {
                required: 'Please confirm your password',
                validate: (value) => value === password || 'Passwords do not match'
              })}
              type={isConfirmPasswordVisible ? 'text' : 'password'}
              placeholder="Confirm new password"
              fullWidth
              error={Boolean(errors.confirmPassword)}
              endAdornment={
                <InputAdornment position="end" sx={{ cursor: 'pointer' }} onClick={() => setIsConfirmPasswordVisible(!isConfirmPasswordVisible)}>
                  {isConfirmPasswordVisible ? <IconEye {...commonIconProps} /> : <IconEyeOff {...commonIconProps} />}
                </InputAdornment>
              }
              sx={inputSx}
            />
            {errors.confirmPassword?.message && <FormHelperText error>{errors.confirmPassword.message}</FormHelperText>}
          </Box>
        </Stack>

        <Button
          type="submit"
          color="primary"
          variant="contained"
          disabled={isProcessing}
          endIcon={isProcessing && <CircularProgress color="secondary" size={16} />}
          fullWidth
          sx={{ minWidth: 120, mt: { xs: 1, sm: 4 }, '& .MuiButton-endIcon': { ml: 1 } }}
        >
          {isProcessing ? 'Resetting...' : 'Reset Password'}
        </Button>
      </form>

      <Stack direction="row" alignItems="center" justifyContent="center" spacing={1} sx={{ mt: 3 }}>
        <Typography variant="body2">Remember your password?</Typography>
        <Link
          component={RouterLink}
          underline="hover"
          variant="body2"
          to="/auth/login"
          sx={{ '&:hover': { color: 'primary.dark' } }}
        >
          Sign In
        </Link>
      </Stack>
    </>
  );
}

AuthResetPassword.propTypes = { inputSx: PropTypes.any };

