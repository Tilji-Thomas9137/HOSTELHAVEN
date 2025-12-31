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
import Link from '@mui/material/Link';
import OutlinedInput from '@mui/material/OutlinedInput';
import Stack from '@mui/material/Stack';
import Box from '@mui/material/Box';

// @third-party
import { useForm } from 'react-hook-form';

// @project
import { APP_DEFAULT_PATH } from '@/config';
import RouterLink from '@/components/Link';
import { useRouter } from '@/utils/navigation';
import { usernameSchema, passwordSchema } from '@/utils/validation-schema/common';
import useAuth from '@/hooks/useAuth';
import authService from '@/services/authService';

// @icons
import { IconEye, IconEyeOff } from '@tabler/icons-react';

/***************************  AUTH - LOGIN  ***************************/

export default function AuthLogin({ inputSx }) {
  const router = useRouter();
  const theme = useTheme();
  const { login } = useAuth();

  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [loginError, setLoginError] = useState('');

  // Initialize react-hook-form
  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm({ defaultValues: { username: '', password: '' } });

  // Handle form submission
  const onSubmit = async (formData) => {
    setIsProcessing(true);
    setLoginError('');

    try {
      // Call the actual API for authentication
      const { user, token, refreshToken } = await authService.login(formData.username, formData.password);
      
      // Update auth state and localStorage (including refresh token)
      await login(user, token, refreshToken);
      
      // Wait a bit longer to ensure:
      // 1. State has propagated and ProtectedRoute recognizes auth
      // 2. Header component has mounted and set up event listeners
      // 3. localStorage is available for immediate reading
      await new Promise(resolve => setTimeout(resolve, 200));
      
      // Check if first login - redirect to password reset if needed
      if (user.firstLogin) {
        router.replace('/auth/first-login-reset');
        return;
      }
      
      // Redirect based on role
      let redirectPath = '/app/dashboard';
      switch (user.role) {
        case 'admin':
          redirectPath = '/app/dashboard';
          break;
        case 'staff':
          redirectPath = '/app/dashboard';
          break;
        case 'student':
          // Send students directly to their dashboard so payment prompts appear
          redirectPath = '/app/student/dashboard';
          break;
        case 'parent':
          redirectPath = '/app/dashboard';
          break;
        default:
          redirectPath = '/app/dashboard';
      }
      
      // Use replace instead of push to avoid back button issues
      router.replace(redirectPath);
      setIsProcessing(false);
    } catch (error) {
      console.error('Login error:', error);
      
      // Handle different error types
      let errorMessage = 'Login failed. Please try again.';
      
      // Check if it's the error message from authService
      if (error.message) {
        errorMessage = error.message;
      } else if (error.response) {
        const status = error.response.status;
        const data = error.response.data;
        
        if (status === 401) {
          errorMessage = data?.message || 'Invalid username or password. Please try again.';
        } else if (status === 400) {
          errorMessage = data?.message || 'Invalid request. Please check your input.';
        } else if (status === 500) {
          errorMessage = 'Server error. Please try again later.';
        } else if (status === 404) {
          errorMessage = 'API endpoint not found. Please check if the backend server is running.';
        } else {
          errorMessage = data?.message || `Login failed. Error: ${status}`;
        }
      } else if (error.request) {
        errorMessage = 'Cannot connect to server. Please ensure the backend is running on http://localhost:5000';
      } else {
        errorMessage = error.message || 'An unexpected error occurred. Please try again.';
      }
      
      setLoginError(errorMessage);
      setIsProcessing(false);
    }
  };

  const commonIconProps = { size: 16, color: theme.palette.grey[700] };

  return (
    <>
      <form onSubmit={handleSubmit(onSubmit)}>
        <Stack gap={2}>
          <Box>
            <InputLabel>Username</InputLabel>
            <OutlinedInput
              {...register('username', usernameSchema)}
              placeholder="Enter your username"
              fullWidth
              type="text"
              error={Boolean(errors.username)}
              sx={inputSx}
            />
            {errors.username?.message && <FormHelperText error>{errors.username.message}</FormHelperText>}
          </Box>

          <Box>
            <InputLabel>Password</InputLabel>
            <OutlinedInput
              {...register('password', passwordSchema)}
              type={isPasswordVisible ? 'text' : 'password'}
              placeholder="Enter your password"
              fullWidth
              error={Boolean(errors.password)}
              endAdornment={
                <InputAdornment position="end" sx={{ cursor: 'pointer' }} onClick={() => setIsPasswordVisible(!isPasswordVisible)}>
                  {isPasswordVisible ? <IconEye {...commonIconProps} /> : <IconEyeOff {...commonIconProps} />}
                </InputAdornment>
              }
              sx={inputSx}
            />
            <Stack direction="row" alignItems="center" justifyContent={errors.password ? 'space-between' : 'flex-end'} width={1}>
              {errors.password?.message && <FormHelperText error>{errors.password.message}</FormHelperText>}
              <Link
                component={RouterLink}
                underline="hover"
                variant="caption"
                to="/auth/forgot-password"
                textAlign="right"
                sx={{ '&:hover': { color: 'primary.dark' }, mt: 0.75 }}
              >
                Forgot Password?
              </Link>
            </Stack>
          </Box>
        </Stack>

        <Button
          type="submit"
          color="primary"
          variant="contained"
          disabled={isProcessing}
          endIcon={isProcessing && <CircularProgress color="secondary" size={16} />}
          sx={{ minWidth: 120, mt: { xs: 1, sm: 4 }, '& .MuiButton-endIcon': { ml: 1 } }}
        >
          Sign In
        </Button>

        {loginError && (
          <Alert sx={{ mt: 2 }} severity="error" variant="filled" icon={false}>
            {loginError}
          </Alert>
        )}
      </form>
    </>
  );
}

AuthLogin.propTypes = { inputSx: PropTypes.any };
