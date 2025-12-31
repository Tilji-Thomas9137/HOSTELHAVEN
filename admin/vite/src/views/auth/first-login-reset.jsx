// @mui
import Divider from '@mui/material/Divider';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';

// @project
import AuthFirstLoginReset from '@/sections/auth/AuthFirstLoginReset';
import Copyright from '@/sections/auth/Copyright';

/***************************  AUTH - FIRST LOGIN RESET  ***************************/

export default function FirstLoginReset() {
  return (
    <Stack sx={{ height: 1, alignItems: 'center', justifyContent: 'space-between', gap: 3 }}>
      <Box sx={{ width: 1, maxWidth: 458 }}>
        <Stack sx={{ gap: { xs: 1, sm: 1.5 }, textAlign: 'center', mb: { xs: 3, sm: 8 } }}>
          <Typography variant="h1">Set Your Password</Typography>
          <Typography variant="body1" color="text.secondary">
            Please create a secure password for your account.
          </Typography>
        </Stack>

        {/* Password reset form */}
        <AuthFirstLoginReset />
      </Box>

      {/* Copyright section */}
      <Copyright />
    </Stack>
  );
}

