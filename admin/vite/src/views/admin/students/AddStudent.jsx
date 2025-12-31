import { useState, useEffect } from 'react';

// @mui
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import OutlinedInput from '@mui/material/OutlinedInput';
import InputLabel from '@mui/material/InputLabel';
import FormHelperText from '@mui/material/FormHelperText';
import FormControl from '@mui/material/FormControl';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import TextField from '@mui/material/TextField';
import Divider from '@mui/material/Divider';

// @third-party
import { useForm, Controller } from 'react-hook-form';
import { useSnackbar } from 'notistack';

// @project
import ComponentsWrapper from '@/components/ComponentsWrapper';
import PresentationCard from '@/components/cards/PresentationCard';
import adminService from '@/services/adminService';
import { 
  nameSchema, 
  emailSchema, 
  courseSchema, 
  yearSchema, 
  addressSchema,
  admissionNumberSchema,
  dateOfBirthSchema,
  emergencyContactNameSchema,
  emergencyContactPhoneSchema,
  parentEmailSchema
} from '@/utils/validation-schema/student';
import { contactSchema } from '@/utils/validation-schema/common';
import Contact from '@/components/Contact';
import { useRouter } from '@/utils/navigation';

// @icons
import { 
  IconDeviceFloppy, 
  IconX, 
  IconUser, 
  IconSchool, 
  IconPhone, 
  IconUsers,
  IconId,
  IconMail,
  IconCalendar,
  IconMapPin,
  IconGenderBigender,
  IconBook,
  IconClock,
  IconShield,
  IconUserCheck
} from '@tabler/icons-react';

// @components
import FormSection from '@/components/forms/FormSection';
import FormFieldWrapper from '@/components/forms/FormFieldWrapper';

/***************************  ADD STUDENT PAGE  ***************************/

export default function AddStudentPage() {
  const router = useRouter();
  const { enqueueSnackbar } = useSnackbar();
  const { studentId } = router.params || {};
  const isEditMode = Boolean(studentId);
  const [isProcessing, setIsProcessing] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [initialLoading, setInitialLoading] = useState(isEditMode);

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors },
    reset
  } = useForm({
    mode: 'onBlur', // Validate on blur (when user leaves the field)
    reValidateMode: 'onChange', // Re-validate on change after first error
    defaultValues: {
      dialcode: '+1',
      year: '',
      course: '',
      gender: '', // Added to prevent controlled/uncontrolled warning
      dateOfBirth: '',
      relation: 'Mother',
      status: 'active'
    }
  });

  useEffect(() => {
    if (!isEditMode) return;

    let isMounted = true;

    const loadStudent = async () => {
      try {
        setInitialLoading(true);
        const data = await adminService.getStudentById(studentId);
        if (!isMounted) return;

        reset({
          admissionNumber: data.studentId || '',
          name: data.name || '',
          email: data.email || '',
          contact: data.phone || '',
          address: data.address || '',
          dateOfBirth: data.dateOfBirth ? data.dateOfBirth.substring(0, 10) : '',
          course: data.course || '',
          year: data.year || '',
          gender: data.gender || '',
          status: data.status || 'active',
          emergencyContactName: data.emergencyContact?.name || '',
          emergencyContactPhone: data.emergencyContact?.phone || '',
          relation: data.emergencyContact?.relation || 'Mother',
          parentEmail: data.parent?.email || '',
          parentName: data.parent?.name || '',
          dialcode: '+1'
        });
      } catch (error) {
        console.error('Error loading student:', error);
        const message = error.response?.data?.message || 'Failed to load student details.';
        setSubmitError(message);
        enqueueSnackbar(message, { variant: 'error' });
      } finally {
        if (isMounted) {
          setInitialLoading(false);
        }
      }
    };

    loadStudent();

    return () => {
      isMounted = false;
    };
  }, [isEditMode, studentId, reset, enqueueSnackbar]);

  const onSubmit = async (formData) => {
    setIsProcessing(true);
    setSubmitError('');

    try {
      // Validate gender is either "Boys" or "Girls"
      if (!formData.gender || (formData.gender !== 'Boys' && formData.gender !== 'Girls')) {
        setSubmitError('Please select a valid gender (Boys or Girls)');
        enqueueSnackbar('Please select a valid gender', { variant: 'error' });
        setIsProcessing(false);
        return;
      }

      // Validate: If parent email is provided, parent name is required
      if (formData.parentEmail && (!formData.parentName || formData.parentName.trim() === '')) {
        setSubmitError('Parent name is required when parent email is provided. Please enter the actual parent/guardian name.');
        enqueueSnackbar('Parent name is required when parent email is provided', { variant: 'error' });
        setIsProcessing(false);
        return;
      }

      // Validate parent name format if provided
      if (formData.parentName && formData.parentName.trim()) {
        const parentNamePattern = /^[a-zA-Z\s.'-]+$/;
        if (!parentNamePattern.test(formData.parentName.trim())) {
          setSubmitError('Parent name can only contain letters, spaces, dots, apostrophes, and hyphens');
          enqueueSnackbar('Parent name contains invalid characters', { variant: 'error' });
          setIsProcessing(false);
          return;
        }
        if (formData.parentName.trim().length < 2) {
          setSubmitError('Parent name must be at least 2 characters');
          enqueueSnackbar('Parent name must be at least 2 characters', { variant: 'error' });
          setIsProcessing(false);
          return;
        }
      }

      // Prepare student data for API
      const requestData = {
        admissionNumber: formData.admissionNumber.trim().toUpperCase(),
        studentId: formData.admissionNumber.trim().toUpperCase(),
        name: formData.name.trim(),
        email: formData.email.trim().toLowerCase(),
        phone: (formData.contact || formData.phone || '').trim(),
        address: (formData.address || '').trim(),
        dateOfBirth: formData.dateOfBirth || null,
        course: (formData.course || '').trim(),
        year: formData.year || '',
        gender: formData.gender,
        status: formData.status || 'active',
        emergencyContact: {
          name: formData.emergencyContactName || '',
          phone: formData.emergencyContactPhone || '',
          relation: formData.relation || 'Mother'
        },
        parentEmail: formData.parentEmail || null,
        parentName: formData.parentName ? formData.parentName.trim() : null
      };

      let response;

      if (isEditMode) {
        response = await adminService.updateStudent(studentId, requestData);
        enqueueSnackbar(response?.message || 'Student updated successfully', { variant: 'success' });
        router.replace('/app/students');
        return;
      }

      response = await adminService.createStudent(requestData);

      if (response) {
        // Show success notification using Notistack
        let notificationMessage = 'Student created successfully!';
        
        if (response.emailStatus) {
          const emailParts = [];
          if (response.emailStatus.student?.sent) {
            emailParts.push('Student credentials sent');
          } else if (response.emailStatus.student?.error) {
            emailParts.push('Student email failed');
          }
          if (response.emailStatus.parent?.sent) {
            emailParts.push('Parent credentials sent');
          } else if (response.emailStatus.parent?.error) {
            emailParts.push('Parent email failed');
          }
          if (emailParts.length > 0) {
            notificationMessage += ` (${emailParts.join(', ')})`;
          }
        }
        
        enqueueSnackbar(notificationMessage, {
          variant: 'success',
          autoHideDuration: 15000, // 15 seconds
          anchorOrigin: {
            vertical: 'bottom',
            horizontal: 'right'
          }
        });
        
        reset();
        
        // Redirect immediately to students list
        // Use replace to avoid back button issues
        router.replace('/app/students');
      }
    } catch (error) {
      console.error('Error creating student:', error);
      
      // Handle different error types
      let errorMessage = 'Failed to create student. Please try again.';
      
      if (error.response) {
        // Server responded with error
        const status = error.response.status;
        const data = error.response.data;
        
        if (status === 401 || status === 403) {
          errorMessage = 'Authentication failed. Please log in again.';
          // Set a flag to prevent immediate redirect, show error first
          sessionStorage.setItem('showAuthError', 'true');
          // Clear auth and redirect after showing error
          setTimeout(() => {
            localStorage.removeItem('hostelhaven_token');
            localStorage.removeItem('hostelhaven_refresh_token');
            localStorage.removeItem('hostelhaven_user');
            sessionStorage.removeItem('showAuthError');
            router.replace('/auth/login');
          }, 3000);
        } else if (status === 400) {
          errorMessage = data?.message || 'Invalid data. Please check your input and try again.';
        } else if (status === 500) {
          errorMessage = 'Server error. Please try again later or contact support.';
        } else {
          errorMessage = data?.message || `Error: ${status}. Please try again.`;
        }
      } else if (error.request) {
        // Request made but no response
        errorMessage = 'Network error. Please check your connection and try again.';
      } else {
        // Error in request setup
        errorMessage = error.message || 'An unexpected error occurred. Please try again.';
      }
      
      setSubmitError(errorMessage);
      
      // Also show error notification
      enqueueSnackbar(errorMessage, {
        variant: 'error',
        autoHideDuration: 15000, // 15 seconds
        anchorOrigin: {
          vertical: 'bottom',
          horizontal: 'right'
        }
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <ComponentsWrapper title={isEditMode ? 'Edit Student' : 'Add Student'}>
      <PresentationCard title={isEditMode ? 'Edit Student' : 'Add New Student'}>
        {initialLoading ? (
          <Stack alignItems="center" sx={{ py: 6 }}>
            <CircularProgress />
          </Stack>
        ) : (
        <form onSubmit={handleSubmit(onSubmit)} autoComplete="off">
          <Stack spacing={3}>
            {/* Error Message */}
            {submitError && (
              <Alert 
                severity="error" 
                onClose={() => setSubmitError('')}
                sx={{ mb: 2 }}
              >
                <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5, fontSize: '1.1rem' }}>
                  ❌ Error Creating Student
                </Typography>
                <Typography variant="body2">
                  {submitError}
                </Typography>
                {submitError.includes('Authentication failed') && (
                  <Typography variant="body2" sx={{ mt: 1, fontStyle: 'italic' }}>
                    You will be redirected to the login page in a moment...
                  </Typography>
                )}
              </Alert>
            )}

            {/* Personal Information Section */}
            <FormSection 
              title="Personal Information" 
              icon={IconUser}
              divider={false}
            >
              <Grid container spacing={3}>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <FormFieldWrapper
                    label="Admission Number"
                    required
                    error={errors.admissionNumber?.message}
                    helperText="This will be used as the student's username for login"
                    icon={IconId}
                  >
                    <OutlinedInput
                      {...register('admissionNumber', admissionNumberSchema)}
                      placeholder="e.g., STU2024001"
                      fullWidth
                      error={Boolean(errors.admissionNumber)}
                      disabled={isEditMode}
                      sx={{ 
                        bgcolor: 'background.paper',
                        '&:hover': { bgcolor: 'action.hover' },
                        transition: 'all 0.2s'
                      }}
                    />
                  </FormFieldWrapper>
                </Grid>

                <Grid size={{ xs: 12, sm: 6 }}>
                  <FormFieldWrapper
                    label="Full Name"
                    required
                    error={errors.name?.message}
                    icon={IconUser}
                  >
                    <OutlinedInput
                      {...register('name', nameSchema)}
                      placeholder="Enter student's full name"
                      fullWidth
                      error={Boolean(errors.name)}
                      sx={{ 
                        bgcolor: 'background.paper',
                        '&:hover': { bgcolor: 'action.hover' },
                        transition: 'all 0.2s'
                      }}
                    />
                  </FormFieldWrapper>
                </Grid>

                <Grid size={{ xs: 12, sm: 6 }}>
                  <FormFieldWrapper
                    label="Email"
                    required
                    error={errors.email?.message}
                    icon={IconMail}
                  >
                    <OutlinedInput
                      {...register('email', emailSchema)}
                      type="email"
                      placeholder="student@example.com"
                      fullWidth
                      error={Boolean(errors.email)}
                      sx={{ 
                        bgcolor: 'background.paper',
                        '&:hover': { bgcolor: 'action.hover' },
                        transition: 'all 0.2s'
                      }}
                    />
                  </FormFieldWrapper>
                </Grid>

                <Grid size={12}>
                  <FormFieldWrapper
                    label="Phone Number"
                    required
                    error={errors.contact?.message}
                    icon={IconPhone}
                  >
                    <Contact
                      fullWidth
                      dialCode={watch('dialcode')}
                      onCountryChange={(data) => setValue('dialcode', data.dialCode)}
                      control={control}
                      isError={Boolean(errors.contact)}
                    />
                  </FormFieldWrapper>
                </Grid>

                <Grid size={{ xs: 12, sm: 6 }}>
                  <FormFieldWrapper
                    label="Date of Birth"
                    error={errors.dateOfBirth?.message}
                    helperText="Student must be at least 15 years old"
                    icon={IconCalendar}
                  >
                    <TextField
                      {...register('dateOfBirth', dateOfBirthSchema)}
                      type="date"
                      fullWidth
                      error={Boolean(errors.dateOfBirth)}
                      slotProps={{
                        inputLabel: {
                          shrink: true
                        },
                        input: {
                          max: new Date().toISOString().split('T')[0],
                          sx: { py: 1.25 }
                        }
                      }}
                      sx={{ 
                        bgcolor: 'background.paper',
                        '&:hover': { bgcolor: 'action.hover' },
                        transition: 'all 0.2s'
                      }}
                    />
                  </FormFieldWrapper>
                </Grid>

                <Grid size={{ xs: 12, sm: 6 }}>
                  <FormFieldWrapper
                    label="Gender"
                    required
                    error={errors.gender?.message}
                    icon={IconGenderBigender}
                  >
                    <FormControl fullWidth required error={Boolean(errors.gender)}>
                      <Controller
                        name="gender"
                        control={control}
                        rules={{ 
                          required: 'Gender is required',
                          validate: {
                            validValue: (value) => {
                              if (!value || value === '') {
                                return 'Gender is required';
                              }
                              if (value !== 'Boys' && value !== 'Girls') {
                                return 'Please select either Boys or Girls';
                              }
                              return true;
                            }
                          }
                        }}
                        render={({ field }) => (
                          <Select 
                            {...field} 
                            value={field.value || ''}
                            label="Gender *"
                            sx={{ 
                              bgcolor: 'background.paper',
                              '&:hover': { bgcolor: 'action.hover' },
                              transition: 'all 0.2s'
                            }}
                          >
                            <MenuItem value="">Select Gender</MenuItem>
                            <MenuItem value="Boys">Boys</MenuItem>
                            <MenuItem value="Girls">Girls</MenuItem>
                          </Select>
                        )}
                      />
                    </FormControl>
                  </FormFieldWrapper>
                </Grid>

                <Grid size={12}>
                  <FormFieldWrapper
                    label="Address"
                    error={errors.address?.message}
                    icon={IconMapPin}
                  >
                    <OutlinedInput
                      {...register('address', addressSchema)}
                      placeholder="Enter address"
                      fullWidth
                      multiline
                      rows={2}
                      error={Boolean(errors.address)}
                      sx={{ 
                        bgcolor: 'background.paper',
                        '&:hover': { bgcolor: 'action.hover' },
                        transition: 'all 0.2s'
                      }}
                    />
                  </FormFieldWrapper>
                </Grid>
              </Grid>
            </FormSection>

            {/* Academic Information Section */}
            <FormSection 
              title="Academic Information" 
              icon={IconSchool}
            >
              <Grid container spacing={3}>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <FormFieldWrapper
                    label="Course"
                    required
                    error={errors.course?.message}
                    icon={IconBook}
                  >
                    <FormControl fullWidth error={Boolean(errors.course)}>
                      <Controller
                        name="course"
                        control={control}
                        rules={courseSchema}
                        render={({ field }) => (
                          <Select 
                            {...field} 
                            value={field.value || ''}
                            label="Course *"
                            sx={{ 
                              bgcolor: 'background.paper',
                              '&:hover': { bgcolor: 'action.hover' },
                              transition: 'all 0.2s'
                            }}
                          >
                            <MenuItem value="">Select Course</MenuItem>
                            <MenuItem value="Computer Science">Computer Science</MenuItem>
                            <MenuItem value="Information Technology">Information Technology</MenuItem>
                            <MenuItem value="Electronics">Electronics</MenuItem>
                            <MenuItem value="Mechanical Engineering">Mechanical Engineering</MenuItem>
                            <MenuItem value="Civil Engineering">Civil Engineering</MenuItem>
                            <MenuItem value="Business Administration">Business Administration</MenuItem>
                            <MenuItem value="Other">Other</MenuItem>
                          </Select>
                        )}
                      />
                    </FormControl>
                  </FormFieldWrapper>
                </Grid>

                <Grid size={{ xs: 12, sm: 6 }}>
                  <FormFieldWrapper
                    label="Year"
                    required
                    error={errors.year?.message}
                    icon={IconClock}
                  >
                    <FormControl fullWidth error={Boolean(errors.year)}>
                      <Controller
                        name="year"
                        control={control}
                        rules={yearSchema}
                        render={({ field }) => (
                          <Select 
                            {...field} 
                            value={field.value || ''}
                            label="Year *"
                            sx={{ 
                              bgcolor: 'background.paper',
                              '&:hover': { bgcolor: 'action.hover' },
                              transition: 'all 0.2s'
                            }}
                          >
                            <MenuItem value="">Select Year</MenuItem>
                            <MenuItem value="1st Year">1st Year</MenuItem>
                            <MenuItem value="2nd Year">2nd Year</MenuItem>
                            <MenuItem value="3rd Year">3rd Year</MenuItem>
                            <MenuItem value="4th Year">4th Year</MenuItem>
                          </Select>
                        )}
                      />
                    </FormControl>
                  </FormFieldWrapper>
                </Grid>

                {isEditMode && (
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <FormFieldWrapper
                      label="Status"
                      icon={IconShield}
                    >
                      <FormControl fullWidth>
                        <Controller
                          name="status"
                          control={control}
                          render={({ field }) => (
                            <Select 
                              {...field} 
                              label="Status"
                              sx={{ 
                                bgcolor: 'background.paper',
                                '&:hover': { bgcolor: 'action.hover' },
                                transition: 'all 0.2s'
                              }}
                            >
                              <MenuItem value="active">Active</MenuItem>
                              <MenuItem value="graduated">Graduated</MenuItem>
                              <MenuItem value="suspended">Suspended</MenuItem>
                            </Select>
                          )}
                        />
                      </FormControl>
                    </FormFieldWrapper>
                  </Grid>
                )}
              </Grid>
            </FormSection>

            {/* Emergency Contact Section */}
            <FormSection 
              title="Emergency Contact" 
              icon={IconPhone}
            >
              <Grid container spacing={3}>
                <Grid size={{ xs: 12, sm: 4 }}>
                  <FormFieldWrapper
                    label="Contact Name"
                    error={errors.emergencyContactName?.message}
                    icon={IconUser}
                  >
                    <OutlinedInput
                      {...register('emergencyContactName', emergencyContactNameSchema)}
                      placeholder="Enter contact name"
                      fullWidth
                      error={Boolean(errors.emergencyContactName)}
                      sx={{ 
                        bgcolor: 'background.paper',
                        '&:hover': { bgcolor: 'action.hover' },
                        transition: 'all 0.2s'
                      }}
                    />
                  </FormFieldWrapper>
                </Grid>

                <Grid size={{ xs: 12, sm: 4 }}>
                  <FormFieldWrapper
                    label="Contact Phone"
                    error={errors.emergencyContactPhone?.message}
                    icon={IconPhone}
                  >
                    <OutlinedInput
                      {...register('emergencyContactPhone', emergencyContactPhoneSchema)}
                      placeholder="Enter contact phone"
                      fullWidth
                      error={Boolean(errors.emergencyContactPhone)}
                      sx={{ 
                        bgcolor: 'background.paper',
                        '&:hover': { bgcolor: 'action.hover' },
                        transition: 'all 0.2s'
                      }}
                    />
                  </FormFieldWrapper>
                </Grid>

                <Grid size={{ xs: 12, sm: 4 }}>
                  <FormFieldWrapper
                    label="Relation"
                    icon={IconUsers}
                  >
                    <FormControl fullWidth>
                      <Controller
                        name="relation"
                        control={control}
                        render={({ field }) => (
                          <Select 
                            {...field} 
                            value={field.value || 'Mother'}
                            label="Relation"
                            sx={{ 
                              bgcolor: 'background.paper',
                              '&:hover': { bgcolor: 'action.hover' },
                              transition: 'all 0.2s'
                            }}
                          >
                            <MenuItem value="Father">Father</MenuItem>
                            <MenuItem value="Mother">Mother</MenuItem>
                            <MenuItem value="Guardian">Guardian</MenuItem>
                            <MenuItem value="Other">Other</MenuItem>
                          </Select>
                        )}
                      />
                    </FormControl>
                  </FormFieldWrapper>
                </Grid>
              </Grid>
            </FormSection>

            {/* Parent Link Section */}
            <FormSection 
              title="Parent Information (Optional)" 
              icon={IconUserCheck}
            >
              <Grid container spacing={3}>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <FormFieldWrapper
                    label="Parent Name"
                    error={errors.parentName?.message}
                    helperText={watch('parentEmail') && !watch('parentName')
                      ? 'Parent name is required when parent email is provided'
                      : "Parent's full name (required if creating new parent account)"}
                    icon={IconUser}
                  >
                    <OutlinedInput
                      {...register('parentName', {
                        validate: {
                          requiredIfEmail: (value) => {
                            const parentEmail = watch('parentEmail');
                            if (parentEmail && (!value || value.trim() === '')) {
                              return 'Parent name is required when parent email is provided';
                            }
                            return true;
                          },
                          validFormat: (value) => {
                            if (!value || value.trim() === '') return true;
                            const namePattern = /^[a-zA-Z\s.'-]+$/;
                            return namePattern.test(value.trim()) || 'Parent name can only contain letters, spaces, dots, apostrophes, and hyphens';
                          },
                          minLength: (value) => {
                            if (!value || value.trim() === '') return true;
                            return value.trim().length >= 2 || 'Parent name must be at least 2 characters';
                          },
                          maxLength: (value) => {
                            if (!value || value.trim() === '') return true;
                            return value.trim().length <= 100 || 'Parent name cannot exceed 100 characters';
                          }
                        }
                      })}
                      placeholder="Enter parent's full name (Optional)"
                      fullWidth
                      error={Boolean(errors.parentName)}
                      sx={{ 
                        bgcolor: 'background.paper',
                        '&:hover': { bgcolor: 'action.hover' },
                        transition: 'all 0.2s'
                      }}
                    />
                  </FormFieldWrapper>
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <FormFieldWrapper
                    label="Parent Email"
                    error={errors.parentEmail?.message}
                    helperText="If parent already exists, student will be linked to their account. Otherwise, a new parent account will be created."
                    icon={IconMail}
                  >
                    <OutlinedInput
                      {...register('parentEmail', parentEmailSchema)}
                      type="email"
                      placeholder="parent@example.com (Optional)"
                      fullWidth
                      error={Boolean(errors.parentEmail)}
                      sx={{ 
                        bgcolor: 'background.paper',
                        '&:hover': { bgcolor: 'action.hover' },
                        transition: 'all 0.2s'
                      }}
                    />
                  </FormFieldWrapper>
                </Grid>
              </Grid>
            </FormSection>

            {/* Action Buttons */}
            <Divider sx={{ my: 4 }} />
            <Stack 
              direction="row" 
              spacing={2} 
              justifyContent="flex-end" 
              sx={{ 
                mt: 4,
                pt: 3,
                borderTop: 1,
                borderColor: 'divider'
              }}
            >
              <Button
                variant="outlined"
                color="secondary"
                size="large"
                startIcon={<IconX size={20} />}
                onClick={() => router.push('/app/students')}
                disabled={isProcessing}
                sx={{
                  minWidth: 120,
                  px: 3,
                  py: 1.5,
                  borderRadius: 2,
                  textTransform: 'none',
                  fontWeight: 600,
                  boxShadow: 'none',
                  '&:hover': {
                    boxShadow: 2,
                    transform: 'translateY(-2px)',
                    transition: 'all 0.2s'
                  }
                }}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="contained"
                color="primary"
                size="large"
                startIcon={isProcessing ? <CircularProgress size={20} color="inherit" /> : <IconDeviceFloppy size={20} />}
                disabled={isProcessing}
                sx={{
                  minWidth: 180,
                  px: 4,
                  py: 1.5,
                  borderRadius: 2,
                  textTransform: 'none',
                  fontWeight: 600,
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  boxShadow: '0 4px 15px 0 rgba(102, 126, 234, 0.4)',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #764ba2 0%, #667eea 100%)',
                    boxShadow: '0 6px 20px 0 rgba(102, 126, 234, 0.6)',
                    transform: 'translateY(-2px)',
                    transition: 'all 0.2s'
                  },
                  '&:disabled': {
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    opacity: 0.6
                  }
                }}
              >
                {isProcessing ? (isEditMode ? 'Saving...' : 'Creating...') : isEditMode ? 'Save Changes' : 'Create Student'}
              </Button>
            </Stack>
          </Stack>
        </form>
        )}
      </PresentationCard>
    </ComponentsWrapper>
  );
}
