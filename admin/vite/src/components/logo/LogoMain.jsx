// @mui
import { useTheme } from '@mui/material/styles';
import CardMedia from '@mui/material/CardMedia';
import Box from '@mui/material/Box';

// @project
import branding from '@/branding.json';

// @assets
import { IconHome } from '@tabler/icons-react';

/***************************  LOGO - MAIN  ***************************/

export default function LogoMain() {
  const theme = useTheme();
  const logoMainPath = branding.logo.main;

  return logoMainPath ? (
    <CardMedia src={logoMainPath} component="img" alt="logo" sx={{ width: { xs: 112, lg: 140 } }} />
  ) : (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
      <Box
        sx={{
          width: { xs: 32, lg: 40 },
          height: { xs: 32, lg: 40 },
          borderRadius: 1,
          bgcolor: 'primary.main',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white'
        }}
      >
        <IconHome size={20} stroke={2} />
      </Box>
      <Box
        component="span"
        sx={{
          fontWeight: 700,
          fontSize: { xs: 18, lg: 22 },
          color: 'primary.main',
          letterSpacing: '-0.5px'
        }}
      >
        HostelHaven
      </Box>
    </Box>
  );
}
