import { useState, useMemo } from 'react';

// @mui
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import OutlinedInput from '@mui/material/OutlinedInput';
import InputLabel from '@mui/material/InputLabel';
import FormHelperText from '@mui/material/FormHelperText';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import TextField from '@mui/material/TextField';
import Divider from '@mui/material/Divider';

// @third-party
import { useForm, Controller } from 'react-hook-form';

// @project
import ComponentsWrapper from '@/components/ComponentsWrapper';
import PresentationCard from '@/components/cards/PresentationCard';
import adminService from '@/services/adminService';
import { nameSchema, emailSchema, addressSchema } from '@/utils/validation-schema/student';
import { getPhoneValidationSchema } from '@/utils/validation-schema/phone';
import Contact from '@/components/Contact';
import { useRouter } from '@/utils/navigation';

// @icons
import { IconDeviceFloppy, IconX } from '@tabler/icons-react';

/***************************  ADD STAFF PAGE  ***************************/

export default function AddStaffPage() {
  const router = useRouter();
  const [isProcessing, setIsProcessing] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    trigger,
    formState: { errors },
    reset
  } = useForm({
    mode: 'onBlur', // Validate on blur (when user leaves the field)
    reValidateMode: 'onChange', // Re-validate on change after first error
    defaultValues: {
      dialcode: '+1',
      name: '',
      email: '',
      contact: '',
      address: ''
    }
  });

  // Watch dial code to update phone validation dynamically
  const dialCode = watch('dialcode');
  
  // Get country-specific phone validation schema
  const phoneValidationSchema = useMemo(() => {
    return getPhoneValidationSchema(dialCode || '+1');
  }, [dialCode]);

  const onSubmit = async (formData) => {
    setIsProcessing(true);
    setSubmitError('');
    setSubmitSuccess(false);

    try {
      // Get phone number - Contact component sends it as 'contact' field
      let phoneNumber = formData.contact || formData.phone || '';
      
      // If phone includes dial code, extract just the number
      // Contact component might send format like "+918760936751" or "8760936751"
      if (phoneNumber && phoneNumber.startsWith('+')) {
        // Remove the + and keep the rest
        phoneNumber = phoneNumber.substring(1);
      }
      
      const staffData = {
        name: formData.name?.trim(),
        email: formData.email?.toLowerCase().trim(),
        phone: phoneNumber.trim(),
        address: formData.address?.trim() || ''
      };

      // Form validation is handled by react-hook-form, but we can add additional checks
      // The form won't submit if validation fails (handleSubmit prevents it)

      const response = await adminService.createStaff(staffData);

      if (response) {
        setSubmitSuccess(true);
        reset();
        
        setTimeout(() => {
          router.push('/app/staff');
        }, 2000);
      }
    } catch (error) {
      console.error('Error creating staff:', error);
      setSubmitError(error.response?.data?.message || error.message || 'Failed to create staff. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <ComponentsWrapper title="Add Staff">
      <PresentationCard title="Add New Staff Member">
        <form onSubmit={handleSubmit(onSubmit)} autoComplete="off">
          <Stack spacing={3}>
            {submitSuccess && (
              <Alert severity="success" onClose={() => setSubmitSuccess(false)}>
                <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
                  Staff member created successfully!
                </Typography>
                <Typography variant="body2">
                  ✓ Login credentials (username and password) have been sent to {watch('email') || 'their email'}
                </Typography>
                <Typography variant="body2" sx={{ mt: 1, fontStyle: 'italic' }}>
                  Redirecting to staff list...
                </Typography>
              </Alert>
            )}

            {submitError && (
              <Alert severity="error" onClose={() => setSubmitError('')}>
                {submitError}
              </Alert>
            )}

            <Typography variant="h6" sx={{ fontWeight: 600, mt: 2 }}>
              Personal Information
            </Typography>

            <Grid container spacing={2.5}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <InputLabel>Full Name *</InputLabel>
                <OutlinedInput
                  {...register('name', nameSchema)}
                  placeholder="Enter staff member's full name"
                  fullWidth
                  error={Boolean(errors.name)}
                />
                {errors.name?.message && <FormHelperText error>{errors.name.message}</FormHelperText>}
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <InputLabel>Email *</InputLabel>
                <OutlinedInput
                  {...register('email', emailSchema)}
                  type="email"
                  placeholder="staff@example.com"
                  fullWidth
                  error={Boolean(errors.email)}
                />
                {errors.email?.message && <FormHelperText error>{errors.email.message}</FormHelperText>}
              </Grid>

              <Grid size={12}>
                <InputLabel>Phone Number *</InputLabel>
                <Contact
                  fullWidth
                  dialCode={dialCode}
                  onCountryChange={async (data) => {
                    setValue('dialcode', data.dialCode);
                    // Trigger re-validation of phone field when country changes
                    const currentValue = watch('contact');
                    if (currentValue) {
                      await trigger('contact');
                    }
                  }}
                  control={control}
                  isError={Boolean(errors.contact)}
                  validationRules={phoneValidationSchema}
                />
                {errors.contact?.message && <FormHelperText error>{errors.contact.message}</FormHelperText>}
              </Grid>

              <Grid size={12}>
                <InputLabel>Address</InputLabel>
                <OutlinedInput
                  {...register('address', addressSchema)}
                  placeholder="Enter address (Optional)"
                  fullWidth
                  multiline
                  rows={2}
                  error={Boolean(errors.address)}
                />
                {errors.address?.message && <FormHelperText error>{errors.address.message}</FormHelperText>}
              </Grid>
            </Grid>

            <Stack direction="row" spacing={2} justifyContent="flex-end" sx={{ mt: 3 }}>
              <Button
                variant="outlined"
                color="secondary"
                startIcon={<IconX size={18} />}
                onClick={() => router.push('/app/staff')}
                disabled={isProcessing}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="contained"
                color="primary"
                startIcon={isProcessing ? <CircularProgress size={18} color="inherit" /> : <IconDeviceFloppy size={18} />}
                disabled={isProcessing}
              >
                {isProcessing ? 'Creating...' : 'Create Staff'}
              </Button>
            </Stack>
          </Stack>
        </form>
      </PresentationCard>
    </ComponentsWrapper>
  );
}
