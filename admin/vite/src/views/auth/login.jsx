import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';

// @mui
import Divider from '@mui/material/Divider';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Alert from '@mui/material/Alert';

// @project
import AuthLogin from '@/sections/auth/AuthLogin';
import AuthSocial from '@/sections/auth/AuthSocial';
import Copyright from '@/sections/auth/Copyright';

/***************************  AUTH - LOGIN  ***************************/

export default function Login() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [oauthError, setOauthError] = useState('');

  useEffect(() => {
    // Check for OAuth error messages in URL
    const error = searchParams.get('error');
    const message = searchParams.get('message');

    if (error) {
      let errorMessage = '';
      
      if (message) {
        errorMessage = decodeURIComponent(message);
      } else {
        switch (error) {
          case 'user_not_found':
            errorMessage = 'Your account has not been registered. Please contact the administrator.';
            break;
          case 'account_inactive':
            errorMessage = 'Your account is inactive. Please contact the administrator.';
            break;
          case 'oauth_failed':
            errorMessage = 'OAuth authentication failed. Please try again.';
            break;
          case 'no_email':
            errorMessage = 'Unable to retrieve email from OAuth provider. Please use a different login method.';
            break;
          default:
            errorMessage = 'An error occurred during OAuth authentication. Please try again.';
        }
      }

      setOauthError(errorMessage);
      
      // Clear URL parameters after displaying error
      setSearchParams({}, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  return (
    <Stack sx={{ height: 1, alignItems: 'center', justifyContent: 'space-between', gap: 3 }}>
      <Box sx={{ width: 1, maxWidth: 458 }}>
        <Stack sx={{ gap: { xs: 1, sm: 1.5 }, textAlign: 'center', mb: { xs: 3, sm: 8 } }}>
          <Typography variant="h1">Sign In</Typography>
          <Typography variant="body1" color="text.secondary">
            Welcome back! Please sign in to continue.
          </Typography>
        </Stack>

        {/* OAuth Error Message */}
        {oauthError && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setOauthError('')}>
            {oauthError}
          </Alert>
        )}

        {/* Login form */}
        <AuthLogin />

        <Divider sx={{ my: { xs: 4, sm: 5 } }}>
          <Typography variant="body2" color="text.secondary">
            OR
          </Typography>
        </Divider>

        {/* Social login buttons */}
        <AuthSocial />
      </Box>

      {/* Copyright section*/}
      <Copyright />
    </Stack>
  );
}
