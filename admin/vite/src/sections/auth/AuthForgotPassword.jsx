import PropTypes from 'prop-types';
import { useState } from 'react';

// @mui
import { useTheme } from '@mui/material/styles';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import FormHelperText from '@mui/material/FormHelperText';
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

/***************************  AUTH - FORGOT PASSWORD  ***************************/

export default function AuthForgotPassword({ inputSx }) {
  const router = useRouter();
  const theme = useTheme();
  const { enqueueSnackbar } = useSnackbar();

  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // Initialize react-hook-form
  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm();

  // Handle form submission
  const onSubmit = async (formData) => {
    setIsProcessing(true);
    setIsSuccess(false);

    try {
      await authService.forgotPassword(formData.email);
      setIsSuccess(true);
      enqueueSnackbar('Password reset link has been sent to your email', { variant: 'success' });
    } catch (error) {
      console.error('Forgot password error:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to send reset link. Please try again.';
      enqueueSnackbar(errorMessage, { variant: 'error' });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <>
      <Typography variant="h3" gutterBottom>
        Forgot Password?
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Enter your email address and we'll send you a link to reset your password.
      </Typography>

      {isSuccess ? (
        <Alert severity="success" sx={{ mb: 2 }}>
          If an account exists with this email, a password reset link has been sent. Please check your email.
        </Alert>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)}>
          <Stack gap={2}>
            <Box>
              <InputLabel>Email Address</InputLabel>
              <OutlinedInput
                {...register('email', {
                  required: 'Email is required',
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                    message: 'Invalid email address'
                  }
                })}
                type="email"
                placeholder="Enter your email"
                fullWidth
                error={Boolean(errors.email)}
                sx={inputSx}
              />
              {errors.email?.message && <FormHelperText error>{errors.email.message}</FormHelperText>}
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
            {isProcessing ? 'Sending...' : 'Send Reset Link'}
          </Button>
        </form>
      )}

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

AuthForgotPassword.propTypes = { inputSx: PropTypes.any };

