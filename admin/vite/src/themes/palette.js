// @mui
import { alpha } from '@mui/material/styles';

/***************************  DEFAULT - PALETTE  ***************************/

export default function palette(mode) {
  const textPrimary = '#1B1B1F'; // Hosting/neutral/10 - on surface
  const textSecondary = '#46464F'; // Hosting/neutral variant/30 - on surface variant

  const secondaryMain = '#5A5C78'; // Hosting/secondary/40 - secondary

  const divider = '#EFEDF4'; // Hosting/neutral/94 - surface container
  const background = '#FFF';

  const disabled = '#777680'; // Hosting/neutral variant/50 - outline
  const disabledBackground = '#E4E1E6'; // Hosting/neutral/90 - surface container highest

  const lightPalette = {
    primary: {
      lighter: '#E0E0FF', // Hosting/primary/90 - primary container / primary fixed
      light: '#BDC2FF', // Hosting/primary/80 - primary fixed dim
      main: '#606BDF', // Hosting/primary/40 - primary
      dark: '#3944B8', // Hosting/primary/30 - on primary fixed variant
      darker: '#000668' // Hosting/primary/10 - on primary container / on primary fixed
    },
    secondary: {
      lighter: '#E0E0FF', // Hosting/secondary/90 - secondary container / secondary fixed
      light: '#C3C4E4', // Hosting/secondary/80 - secondary fixed dim
      main: secondaryMain, // Hosting/secondary/40 - secondary
      dark: '#43455F', // Hosting/secondary/30 - on secondary fixed variant
      darker: '#171A31' // Hosting/secondary/10 - on secondary container / on secondary fixed
    },
    error: {
      lighter: '#FFEDEA', // error/90 - error container / error fixed
      light: '#FFDAD6', // error/80 - error fixed dim
      main: '#DE3730', // error/40 - error
      dark: '#BA1A1A', // error/30 - on error fixed variant
      darker: '#690005' // error/10 - on error container / on error fixed
    },
    warning: {
      lighter: '#FFEEE1', // warning/90 - warning container / warning fixed
      light: '#FFDCBE', // warning/80 - warning fixed dim
      main: '#AE6600', // warning/40 - warning
      dark: '#8B5000', // warning/30 - on warning fixed variant
      darker: '#4A2800' // warning/10 - on warning container / on warning fixed
    },
    success: {
      lighter: '#C8FFC0', // success/90 - success container / success fixed
      light: '#B6F2AF', // success/80 - success fixed dim
      main: '#22892F', // success/40 - success
      dark: '#006E1C', // success/30 - on success fixed variant
      darker: '#00390A' // success/10 - on success container / on success fixed
    },
    info: {
      lighter: '#D4F7FF', // info/90 - info container / info fixed
      light: '#A1EFFF', // info/80 - info fixed dim
      main: '#008394', // info/40 - info
      dark: '#006876', // info/30 - on info fixed variant
      darker: '#00363E' // info/10 - on info container / on info fixed
    },
    grey: {
      50: '#FBF8FF', // Hosting/neutral/98 - surface / surface bright
      100: '#F5F2FA', // Hosting/neutral/96 - surface container low
      200: divider, // Hosting/neutral/94 - surface container
      300: '#EAE7EF', // Hosting/neutral/92 - surface container high
      400: disabledBackground, // Hosting/neutral/90 - surface container highest
      500: '#DBD9E0', // Hosting/neutral/87 - surface dim
      600: '#C7C5D0', // Hosting/neutral variant/80 - outline variant
      700: disabled, // Hosting/neutral variant/50 - outline
      800: textSecondary, // Hosting/neutral variant/30 - on surface variant
      900: textPrimary // Hosting/neutral/10 - on surface
    },
    text: {
      primary: textPrimary, // Hosting/neutral/10 - on surface
      secondary: textSecondary, // Hosting/neutral variant/30 - on surface variant
      disabled: disabled
    },
    divider,
    background: {
      default: background
    },
    action: {
      hover: alpha(secondaryMain, 0.05),
      disabled: alpha(disabled, 0.6),
      disabledBackground: alpha(disabledBackground, 0.9)
    }
  };

  const darkPalette = {
    primary: {
      lighter: '#1A1B3F', // Dark primary/90
      light: '#2A2B5F', // Dark primary/80
      main: '#606BDF', // Same primary
      dark: '#8A95FF', // Dark primary/30
      darker: '#E0E0FF' // Dark primary/10
    },
    secondary: {
      lighter: '#1A1B2F', // Dark secondary/90
      light: '#2A2B4F', // Dark secondary/80
      main: '#8A8CA8', // Dark secondary/40
      dark: '#C3C4E4', // Dark secondary/30
      darker: '#E0E0FF' // Dark secondary/10
    },
    error: {
      lighter: '#3A1A1A', // Dark error/90
      light: '#5A2A2A', // Dark error/80
      main: '#FF6B6B', // Dark error/40
      dark: '#FF9B9B', // Dark error/30
      darker: '#FFEDEA' // Dark error/10
    },
    warning: {
      lighter: '#3A2A1A', // Dark warning/90
      light: '#5A4A2A', // Dark warning/80
      main: '#FFB84D', // Dark warning/40
      dark: '#FFD89B', // Dark warning/30
      darker: '#FFEEE1' // Dark warning/10
    },
    success: {
      lighter: '#1A3A1A', // Dark success/90
      light: '#2A5A2A', // Dark success/80
      main: '#4CAF50', // Dark success/40
      dark: '#7BC87F', // Dark success/30
      darker: '#C8FFC0' // Dark success/10
    },
    info: {
      lighter: '#1A2A3A', // Dark info/90
      light: '#2A4A5A', // Dark info/80
      main: '#29B6F6', // Dark info/40
      dark: '#5BC8F6', // Dark info/30
      darker: '#D4F7FF' // Dark info/10
    },
    grey: {
      50: '#1B1B1F', // Dark neutral/10
      100: '#2A2A2F', // Dark neutral/20
      200: '#3A3A3F', // Dark neutral/30
      300: '#4A4A4F', // Dark neutral/40
      400: '#5A5A5F', // Dark neutral/50
      500: '#6A6A6F', // Dark neutral/60
      600: '#7A7A7F', // Dark neutral/70
      700: '#8A8A8F', // Dark neutral/80
      800: '#9A9A9F', // Dark neutral/90
      900: '#EAEAEF' // Dark neutral/98
    },
    text: {
      primary: '#EAEAEF', // Dark on surface
      secondary: '#B0B0B5', // Dark on surface variant
      disabled: '#6A6A6F'
    },
    divider: alpha('#FFF', 0.12),
    background: {
      default: '#121212' // Dark background
    },
    action: {
      hover: alpha('#FFF', 0.08),
      disabled: alpha('#FFF', 0.3),
      disabledBackground: alpha('#FFF', 0.12)
    }
  };

  return {
    mode,
    ...(mode === 'dark' ? darkPalette : lightPalette)
  };
}
