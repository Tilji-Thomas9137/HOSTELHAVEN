import { Outlet } from 'react-router-dom';

// @mui
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';

// @project
import LogoMain from '@/components/logo/LogoMain';

/***************************  AUTH LAYOUT  ***************************/

export default function AuthLayout() {
  return (
    <Grid container sx={{ height: '100vh' }}>
      <Grid size={{ xs: 12, md: 6, lg: 7 }} sx={{ p: { xs: 3, sm: 7 } }}>
        <Outlet />
      </Grid>
      <Grid size={{ xs: 12, md: 6, lg: 5 }} sx={{ bgcolor: 'grey.100', pt: 7, display: { xs: 'none', md: 'block' } }}>
        <Stack sx={{ height: 1, justifyContent: 'center', alignItems: 'center', gap: 4, px: 4 }}>
          <LogoMain />
          <Stack sx={{ alignItems: 'center', gap: 2, maxWidth: 400 }}>
            <Typography variant="h4" color="primary.main" sx={{ fontWeight: 600, textAlign: 'center' }}>
              Smart Hostel Management System
            </Typography>
            <Typography variant="body1" color="grey.700" align="center">
              Streamline your hostel operations with our comprehensive management platform. Manage students, rooms, bookings, and payments all in one place.
            </Typography>
          </Stack>
          <Box
            sx={{
              width: '100%',
              height: 300,
              borderRadius: 4,
              bgcolor: 'primary.lighter',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundImage: 'url(https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=800&auto=format&fit=crop)',
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              border: '2px solid',
              borderColor: 'grey.300'
            }}
          >
            <Box
              sx={{
                bgcolor: 'rgba(255, 255, 255, 0.9)',
                p: 3,
                borderRadius: 2,
                textAlign: 'center',
                maxWidth: 350
              }}
            >
              <Typography variant="h6" color="primary.main" sx={{ fontWeight: 600, mb: 1 }}>
                Welcome to HostelHaven
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Efficiently manage your hostel with our all-in-one platform
              </Typography>
            </Box>
          </Box>
        </Stack>
      </Grid>
    </Grid>
  );
}
