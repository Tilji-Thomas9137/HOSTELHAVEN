import PropTypes from 'prop-types';

// @mui
import Button from '@mui/material/Button';
import CardMedia from '@mui/material/CardMedia';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

// @project
import GetImagePath from '@/utils/GetImagePath';
import { SocialTypes } from '@/enum';

// @assets
import googleIcon from '@/assets/images/social/google.svg';
import facebookIcon from '@/assets/images/social/facebook.svg';

/***************************  AUTH - SOCIAL  ***************************/

export default function AuthSocial({ type = SocialTypes.VERTICAL, buttonSx }) {
  const handleGoogleLogin = async () => {
    try {
      window.location.href = `${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/auth/google`;
    } catch (error) {
      console.error('Google login error:', error);
    }
  };

  const handleFacebookLogin = async () => {
    try {
      window.location.href = `${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/auth/facebook`;
    } catch (error) {
      console.error('Facebook login error:', error);
    }
  };

  const authButtons = [
    {
      label: 'Google',
      icon: googleIcon,
      title: 'Sign in with Google',
      onClick: handleGoogleLogin
    },
    {
      label: 'Facebook',
      icon: facebookIcon,
      title: 'Sign in with Facebook',
      onClick: handleFacebookLogin
    }
  ];

  return (
    <Stack direction={type === SocialTypes.VERTICAL ? 'column' : 'row'} sx={{ gap: 1 }}>
      {authButtons.map((item, index) => (
        <Button
          key={index}
          variant="outlined"
          fullWidth
          size="small"
          color="secondary"
          onClick={item.onClick}
          sx={{ ...(type === SocialTypes.HORIZONTAL && { '.MuiButton-startIcon': { m: 0 } }), ...buttonSx }}
          startIcon={<CardMedia component="img" src={GetImagePath(item.icon)} sx={{ width: 16, height: 16 }} alt={item.label} />}
        >
          {type === SocialTypes.VERTICAL && (
            <Typography variant="caption1" sx={{ textTransform: 'none' }}>
              {item.title}
            </Typography>
          )}
        </Button>
      ))}
    </Stack>
  );
}

AuthSocial.propTypes = { type: PropTypes.any, SocialTypes: PropTypes.any, VERTICAL: PropTypes.any, buttonSx: PropTypes.any };
