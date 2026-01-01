'use client';

import PropTypes from 'prop-types';

// Next.js
import NextLink from 'next/link';
import { useRouter } from 'next/navigation';

// React
import { useState } from 'react';

// MUI
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

// Third-party
import { useForm } from 'react-hook-form';

// Project
import { APP_DEFAULT_PATH } from '@/config';
import { emailSchema, passwordSchema } from '@/utils/validation-schema/common';
import api from '@/config/api'; // ✅ use api helper, NOT axios

// Icons
import { IconEye, IconEyeOff } from '@tabler/icons-react';

/*************************** AUTH LOGIN ***************************/

export default function AuthLogin({ inputSx }) {
  const router = useRouter();
  const theme = useTheme();

  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [loginError, setLoginError] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm({
    defaultValues: { email: '', password: '' }
  });

  // ✅ FIXED onSubmit
  const onSubmit = async (formData) => {
    try {
      setIsProcessing(true);
      setLoginError('');

      const response = await api.post('/auth/login', {
        username: formData.email, // or 'email' if backend expects email
        password: formData.password,
      });

      const { token, refreshToken, user } = response.data;

      localStorage.setItem('hostelhaven_token', token);
      localStorage.setItem('hostelhaven_refresh_token', refreshToken);
      localStorage.setItem('hostelhaven_user', JSON.stringify(user));

      router.push(APP_DEFAULT_PATH);
    } catch (error) {
      setLoginError(
        error.response?.data?.message || 'Cannot connect to server'
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const commonIconProps = { size: 16, color: theme.palette.grey[700] };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Stack gap={2}>
        {/* Email Field */}
        <Box>
          <InputLabel>Email</InputLabel>
          <OutlinedInput
            {...register('email', emailSchema)}
            placeholder="Enter email"
            fullWidth
            error={Boolean(errors.email)}
            sx={inputSx}
          />
          {errors.email?.message && (
            <FormHelperText error>{errors.email.message}</FormHelperText>
          )}
        </Box>

        {/* Password Field */}
        <Box>
          <InputLabel>Password</InputLabel>
          <OutlinedInput
            {...register('password', passwordSchema)}
            type={isPasswordVisible ? 'text' : 'password'}
            placeholder="Enter password"
            fullWidth
            error={Boolean(errors.password)}
            endAdornment={
              <InputAdornment
                position="end"
                sx={{ cursor: 'pointer' }}
                onClick={() => setIsPasswordVisible(!isPasswordVisible)}
              >
                {isPasswordVisible ? (
                  <IconEye {...commonIconProps} />
                ) : (
                  <IconEyeOff {...commonIconProps} />
                )}
              </InputAdornment>
            }
            sx={inputSx}
          />
          {errors.password?.message && (
            <FormHelperText error>{errors.password.message}</FormHelperText>
          )}
        </Box>

        {/* Submit Button */}
        <Button
          type="submit"
          variant="contained"
          disabled={isProcessing}
          endIcon={
            isProcessing && <CircularProgress color="secondary" size={16} />
          }
        >
          Sign In
        </Button>

        {/* Error Alert */}
        {loginError && (
          <Alert severity="error" variant="filled">
            {loginError}
          </Alert>
        )}

        {/* Forgot Password Link */}
        <Link
          component={NextLink}
          underline="hover"
          variant="caption"
          href="#"
          textAlign="center"
        >
          Forgot Password?
        </Link>
      </Stack>
    </form>
  );
}

AuthLogin.propTypes = {
  inputSx: PropTypes.any
};
