import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';

// @mui
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import Typography from '@mui/material/Typography';
import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';

// @project
import useAuth from '@/hooks/useAuth';

/***************************  OAUTH CALLBACK  ***************************/

export default function OAuthCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { login } = useAuth();
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const handleOAuthCallback = async () => {
      try {
        const code = searchParams.get('code');
        const token = searchParams.get('token');
        const refreshToken = searchParams.get('refreshToken');
        const userParam = searchParams.get('user');
        const errorParam = searchParams.get('error');

        // Check for OAuth errors
        if (errorParam) {
          setError(getErrorMessage(errorParam, searchParams));
          setLoading(false);
          setTimeout(() => {
            navigate('/auth/login');
          }, 5000); // Give user more time to read the message
          return;
        }

        let user, finalToken, finalRefreshToken;

        // New code-based flow (to avoid URL length issues)
        if (code) {
          try {
            // Use the same API base URL as the rest of the app
            // api.js uses 'http://localhost:5000/api' but we need just the base URL here
            const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
            const baseUrl = apiUrl.replace('/api', '') || 'http://localhost:5000';
            const response = await fetch(`${baseUrl}/api/auth/oauth-tokens/${code}`, {
              method: 'GET',
              headers: {
                'Content-Type': 'application/json',
              },
            });
            const data = await response.json();
            
            if (!response.ok) {
              throw new Error(data.message || 'Failed to retrieve tokens');
            }
            
            user = data.user;
            finalToken = data.token;
            finalRefreshToken = data.refreshToken;
          } catch (fetchError) {
            console.error('Error fetching OAuth tokens:', fetchError);
            setError('Failed to retrieve authentication tokens. Please try again.');
            setLoading(false);
            setTimeout(() => {
              navigate('/auth/login');
            }, 3000);
            return;
          }
        } 
        // Legacy flow (backward compatibility)
        else if (token && userParam) {
          // Parse user data
          try {
            user = JSON.parse(decodeURIComponent(userParam));
            finalToken = token;
            finalRefreshToken = refreshToken;
          } catch (parseError) {
            setError('Failed to parse user data. Please try again.');
            setLoading(false);
            setTimeout(() => {
              navigate('/auth/login');
            }, 3000);
            return;
          }
        } else {
          setError('Invalid OAuth response. Please try again.');
          setLoading(false);
          setTimeout(() => {
            navigate('/auth/login');
          }, 3000);
          return;
        }

        // Login user
        await login(user, finalToken, finalRefreshToken);

        // Wait for state to propagate
        await new Promise(resolve => setTimeout(resolve, 200));

        // Check if first login - redirect to password reset if needed
        if (user.firstLogin) {
          navigate('/auth/first-login-reset');
          return;
        }

        // Redirect to dashboard
        navigate('/app/dashboard', { replace: true });
      } catch (err) {
        console.error('OAuth callback error:', err);
        setError('An error occurred during login. Please try again.');
        setLoading(false);
        setTimeout(() => {
          navigate('/auth/login');
        }, 3000);
      }
    };

    handleOAuthCallback();
  }, [searchParams, navigate, login]);

  const getErrorMessage = (errorCode, searchParams) => {
    // Check if there's a custom message from the backend
    const customMessage = searchParams.get('message');
    if (customMessage) {
      return decodeURIComponent(customMessage);
    }

    switch (errorCode) {
      case 'oauth_failed':
        return 'OAuth authentication failed. Please try again.';
      case 'no_email':
        return 'Unable to retrieve email from OAuth provider. Please use a different login method.';
      case 'user_not_found':
        return 'Your account has not been registered. Please contact the administrator.';
      case 'account_inactive':
        return 'Your account is inactive. Please contact the administrator.';
      case 'oauth_error':
        return 'An error occurred during OAuth authentication. Please try again.';
      default:
        return 'An error occurred during login. Please try again.';
    }
  };

  if (error) {
    return (
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          p: 3,
        }}
      >
        <Stack spacing={2} sx={{ maxWidth: 400, width: '100%' }}>
          <Alert severity="error">{error}</Alert>
          <Typography variant="body2" color="text.secondary" textAlign="center">
            Redirecting to login page...
          </Typography>
        </Stack>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        gap: 2,
      }}
    >
      <CircularProgress />
      <Typography variant="body1" color="text.secondary">
        Completing login...
      </Typography>
    </Box>
  );
}

