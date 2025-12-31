import { Box, InputLabel, FormHelperText, Stack, useTheme } from '@mui/material';
import PropTypes from 'prop-types';

/**
 * Enhanced Form Field Wrapper
 * Provides consistent styling for form fields with icons and better error display
 */
export default function FormFieldWrapper({ 
  label, 
  required = false,
  error,
  helperText,
  icon: Icon,
  children,
  sx = {}
}) {
  const theme = useTheme();

  return (
    <Box sx={{ mb: 2.5, ...sx }}>
      {label && (
        <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
          {Icon && (
            <Box
              sx={{
                color: error ? theme.palette.error.main : theme.palette.text.secondary,
                display: 'flex',
                alignItems: 'center',
              }}
            >
              <Icon size={18} />
            </Box>
          )}
          <InputLabel
            sx={{
              fontWeight: 500,
              fontSize: '0.875rem',
              color: error ? theme.palette.error.main : theme.palette.text.primary,
              mb: 0.5,
            }}
          >
            {label} {required && <span style={{ color: theme.palette.error.main }}>*</span>}
          </InputLabel>
        </Stack>
      )}
      
      {children}
      
      {error && (
        <FormHelperText 
          error 
          sx={{ 
            mt: 0.75, 
            fontSize: '0.75rem',
            display: 'flex',
            alignItems: 'center',
            gap: 0.5
          }}
        >
          {error}
        </FormHelperText>
      )}
      
      {helperText && !error && (
        <FormHelperText 
          sx={{ 
            mt: 0.75, 
            fontSize: '0.75rem',
            color: theme.palette.text.secondary
          }}
        >
          {helperText}
        </FormHelperText>
      )}
    </Box>
  );
}

FormFieldWrapper.propTypes = {
  label: PropTypes.string,
  required: PropTypes.bool,
  error: PropTypes.string,
  helperText: PropTypes.string,
  icon: PropTypes.elementType,
  children: PropTypes.node.isRequired,
  sx: PropTypes.object,
};

