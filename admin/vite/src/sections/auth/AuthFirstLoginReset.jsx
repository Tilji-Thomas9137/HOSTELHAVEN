import PropTypes from 'prop-types';
import { useState } from 'react';

// @mui
import { useTheme } from '@mui/material/styles';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import FormHelperText from '@mui/material/FormHelperText';
import InputAdornment from '@mui/material/InputAdornment';
import InputLabel from '@mui/material/InputLabel';
import OutlinedInput from '@mui/material/OutlinedInput';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

// @third-party
import { useForm } from 'react-hook-form';
import { useSnackbar } from 'notistack';

// @project
import { useRouter } from '@/utils/navigation';
import { passwordSchema } from '@/utils/validation-schema/common';
import authService from '@/services/authService';

// @icons
import { IconEye, IconEyeOff, IconDeviceFloppy } from '@tabler/icons-react';

/***************************  AUTH - FIRST LOGIN RESET  ***************************/

export default function AuthFirstLoginReset({ inputSx }) {
  const router = useRouter();
  const theme = useTheme();
  const { enqueueSnackbar } = useSnackbar();

  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isConfirmPasswordVisible, setIsConfirmPasswordVisible] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');

  // Initialize react-hook-form
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors }
  } = useForm();

  const password = watch('password', '');

  // Handle form submission
  const onSubmit = async (formData) => {
    setIsProcessing(true);
    setError('');

    try {
      // Validate passwords match
      if (formData.password !== formData.confirmPassword) {
        setError('Passwords do not match');
        setIsProcessing(false);
        return;
      }

      // Call API to reset password
      await authService.firstLoginReset(formData.password);

      // Show success notification
      enqueueSnackbar('Password set successfully! Redirecting to dashboard...', {
        variant: 'success',
        autoHideDuration: 3000,
        anchorOrigin: {
          vertical: 'bottom',
          horizontal: 'right'
        }
      });

      // Redirect to dashboard after a short delay
      setTimeout(() => {
        router.replace('/app/dashboard');
      }, 1500);
    } catch (err) {
      console.error('First login reset error:', err);
      
      let errorMessage = 'Failed to set password. Please try again.';
      
      if (err.response) {
        const status = err.response.status;
        const data = err.response.data;
        
        if (status === 400) {
          errorMessage = data?.message || 'Invalid password. Please check your input.';
        } else if (status === 401) {
          errorMessage = 'Session expired. Please log in again.';
          setTimeout(() => {
            router.replace('/auth/login');
          }, 2000);
        } else if (status === 500) {
          errorMessage = 'Server error. Please try again later.';
        } else {
          errorMessage = data?.message || `Error: ${status}. Please try again.`;
        }
      } else if (err.request) {
        errorMessage = 'Network error. Please check your connection and try again.';
      } else {
        errorMessage = err.message || 'An unexpected error occurred. Please try again.';
      }
      
      setError(errorMessage);
      
      // Also show error notification
      enqueueSnackbar(errorMessage, {
        variant: 'error',
        autoHideDuration: 5000,
        anchorOrigin: {
          vertical: 'bottom',
          horizontal: 'right'
        }
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate>
      <Stack spacing={3}>
        {/* Info Alert */}
        <Alert severity="info" sx={{ mb: 2 }}>
          <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
            First Time Login
          </Typography>
          <Typography variant="body2">
            This is your first login. Please set a new password for your account. Your password must be at least 6 characters long.
          </Typography>
        </Alert>

        {/* Error Message */}
        {error && (
          <Alert severity="error" onClose={() => setError('')}>
            {error}
          </Alert>
        )}

        {/* New Password */}
        <Stack spacing={1.25}>
          <InputLabel htmlFor="password">New Password *</InputLabel>
          <OutlinedInput
            {...register('password', passwordSchema)}
            id="password"
            type={isPasswordVisible ? 'text' : 'password'}
            placeholder="Enter new password"
            fullWidth
            error={Boolean(errors.password)}
            endAdornment={
              <InputAdornment position="end">
                <Button
                  variant="text"
                  color="inherit"
                  onClick={() => setIsPasswordVisible(!isPasswordVisible)}
                  sx={{ minWidth: 'auto', p: 0.5 }}
                  aria-label="toggle password visibility"
                >
                  {isPasswordVisible ? <IconEyeOff size={20} /> : <IconEye size={20} />}
                </Button>
              </InputAdornment>
            }
            sx={inputSx}
          />
          {errors.password?.message && (
            <FormHelperText error id="password-error">
              {errors.password.message}
            </FormHelperText>
          )}
        </Stack>

        {/* Confirm Password */}
        <Stack spacing={1.25}>
          <InputLabel htmlFor="confirmPassword">Confirm Password *</InputLabel>
          <OutlinedInput
            {...register('confirmPassword', {
              required: 'Please confirm your password',
              validate: (value) => value === password || 'Passwords do not match'
            })}
            id="confirmPassword"
            type={isConfirmPasswordVisible ? 'text' : 'password'}
            placeholder="Confirm new password"
            fullWidth
            error={Boolean(errors.confirmPassword)}
            endAdornment={
              <InputAdornment position="end">
                <Button
                  variant="text"
                  color="inherit"
                  onClick={() => setIsConfirmPasswordVisible(!isConfirmPasswordVisible)}
                  sx={{ minWidth: 'auto', p: 0.5 }}
                  aria-label="toggle confirm password visibility"
                >
                  {isConfirmPasswordVisible ? <IconEyeOff size={20} /> : <IconEye size={20} />}
                </Button>
              </InputAdornment>
            }
            sx={inputSx}
          />
          {errors.confirmPassword?.message && (
            <FormHelperText error id="confirmPassword-error">
              {errors.confirmPassword.message}
            </FormHelperText>
          )}
        </Stack>

        {/* Submit Button */}
        <Button
          type="submit"
          fullWidth
          variant="contained"
          size="large"
          disabled={isProcessing}
          startIcon={isProcessing ? <CircularProgress size={20} /> : <IconDeviceFloppy size={20} />}
        >
          {isProcessing ? 'Setting Password...' : 'Set Password'}
        </Button>
      </Stack>
    </form>
  );
}

AuthFirstLoginReset.propTypes = {
  inputSx: PropTypes.object
};

