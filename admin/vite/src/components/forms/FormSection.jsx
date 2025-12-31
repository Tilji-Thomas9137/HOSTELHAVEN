import { Box, Typography, Stack, Divider, useTheme } from '@mui/material';
import PropTypes from 'prop-types';

/**
 * Reusable Form Section Component
 * Provides consistent styling for form sections with icons and dividers
 */
export default function FormSection({ 
  title, 
  icon: Icon, 
  children, 
  spacing = 3,
  divider = true,
  sx = {}
}) {
  const theme = useTheme();

  return (
    <Box sx={{ mb: spacing, ...sx }}>
      {divider && <Divider sx={{ mb: 3, borderWidth: 1 }} />}
      
      {title && (
        <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 2.5 }}>
          {Icon && (
            <Box
              sx={{
                p: 1,
                borderRadius: 2,
                bgcolor: theme.palette.primary.lighter,
                color: theme.palette.primary.main,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Icon size={20} />
            </Box>
          )}
          <Typography 
            variant="h6" 
            sx={{ 
              fontWeight: 600,
              color: theme.palette.text.primary,
              fontSize: '1.1rem'
            }}
          >
            {title}
          </Typography>
        </Stack>
      )}
      
      <Box sx={{ pl: Icon ? 5.5 : 0 }}>
        {children}
      </Box>
    </Box>
  );
}

FormSection.propTypes = {
  title: PropTypes.string,
  icon: PropTypes.elementType,
  children: PropTypes.node.isRequired,
  spacing: PropTypes.number,
  divider: PropTypes.bool,
  sx: PropTypes.object,
};

