import { useState, useEffect } from 'react';

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
import FormControl from '@mui/material/FormControl';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import Divider from '@mui/material/Divider';

// @third-party
import { useForm, Controller } from 'react-hook-form';

// @project
import ComponentsWrapper from '@/components/ComponentsWrapper';
import PresentationCard from '@/components/cards/PresentationCard';
import adminService from '@/services/adminService';
import { useRouter } from '@/utils/navigation';
import { useSnackbar } from 'notistack';

// @icons
import { IconDeviceFloppy, IconX } from '@tabler/icons-react';

/***************************  ADD INVENTORY PAGE  ***************************/

export default function AddInventoryPage() {
  const router = useRouter();
  const { enqueueSnackbar } = useSnackbar();
  const [isProcessing, setIsProcessing] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [rooms, setRooms] = useState([]);
  const [loadingRooms, setLoadingRooms] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    watch,
    formState: { errors },
    reset
  } = useForm({
    mode: 'onBlur',
    reValidateMode: 'onChange',
    defaultValues: {
      category: 'other',
      unit: 'piece',
      condition: 'good',
      status: 'available',
      quantity: 1,
      location: 'General Store',
      itemType: 'temporary',
      isStudentEligible: false
    }
  });

  useEffect(() => {
    fetchRooms();
  }, []);

  const fetchRooms = async () => {
    try {
      setLoadingRooms(true);
      const data = await adminService.getAllRooms();
      setRooms(data.rooms || data || []);
    } catch (err) {
      console.error('Failed to fetch rooms:', err);
    } finally {
      setLoadingRooms(false);
    }
  };

  const onSubmit = async (formData) => {
    setIsProcessing(true);
    setSubmitError('');
    setSubmitSuccess(false);

    try {
      const inventoryData = {
        name: formData.name?.trim(),
        category: formData.category || 'other',
        quantity: parseInt(formData.quantity) || 1,
        unit: formData.unit || 'piece',
        location: formData.location?.trim() || '',
        room: formData.room || null,
        purchaseDate: formData.purchaseDate || null,
        purchasePrice: formData.purchasePrice ? parseFloat(formData.purchasePrice) : null,
        condition: formData.condition || 'good',
        status: formData.status || 'available',
        supplier: formData.supplier?.trim() || '',
        description: formData.description?.trim() || '',
        location: formData.location?.trim() || 'General Store',
        itemType: formData.itemType || 'temporary',
        isStudentEligible: formData.isStudentEligible || false
      };

      // Validate required fields
      if (!inventoryData.name) {
        setSubmitError('Item name is required');
        setIsProcessing(false);
        return;
      }
      if (inventoryData.quantity < 1) {
        setSubmitError('Quantity must be at least 1');
        setIsProcessing(false);
        return;
      }

      const response = await adminService.createInventoryItem(inventoryData);

      if (response) {
        setSubmitSuccess(true);
        enqueueSnackbar('Inventory item created successfully', { variant: 'success' });
        reset();
        
        setTimeout(() => {
          router.push('/app/inventory');
        }, 2000);
      }
    } catch (error) {
      console.error('Error creating inventory item:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to create inventory item. Please try again.';
      setSubmitError(errorMessage);
      enqueueSnackbar(errorMessage, { variant: 'error' });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <ComponentsWrapper title="Add Inventory">
      <PresentationCard title="Add New Inventory Item">
        <form onSubmit={handleSubmit(onSubmit)} autoComplete="off">
          <Stack spacing={3}>
            {submitSuccess && (
              <Alert severity="success" onClose={() => setSubmitSuccess(false)}>
                <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
                  Inventory item created successfully!
                </Typography>
                <Typography variant="body2" sx={{ mt: 1, fontStyle: 'italic' }}>
                  Redirecting to inventory list...
                </Typography>
              </Alert>
            )}

            {submitError && (
              <Alert severity="error" onClose={() => setSubmitError('')}>
                {submitError}
              </Alert>
            )}

            <Typography variant="h6" sx={{ fontWeight: 600, mt: 2 }}>
              Item Information
            </Typography>

            <Grid container spacing={2.5}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <InputLabel>Item Name *</InputLabel>
                <OutlinedInput
                  {...register('name', {
                    required: 'Item name is required',
                    minLength: { value: 2, message: 'Item name must be at least 2 characters' },
                    maxLength: { value: 100, message: 'Item name cannot exceed 100 characters' }
                  })}
                  placeholder="Enter item name"
                  fullWidth
                  error={Boolean(errors.name)}
                />
                {errors.name?.message && <FormHelperText error>{errors.name.message}</FormHelperText>}
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <InputLabel>Category *</InputLabel>
                <FormControl fullWidth error={Boolean(errors.category)}>
                  <Controller
                    name="category"
                    control={control}
                    rules={{ required: 'Category is required' }}
                    render={({ field }) => (
                      <Select {...field} label="Category *">
                        <MenuItem value="furniture">Furniture</MenuItem>
                        <MenuItem value="electronics">Electronics</MenuItem>
                        <MenuItem value="appliances">Appliances</MenuItem>
                        <MenuItem value="bedding">Bedding</MenuItem>
                        <MenuItem value="utensils">Utensils</MenuItem>
                        <MenuItem value="cleaning">Cleaning</MenuItem>
                        <MenuItem value="other">Other</MenuItem>
                      </Select>
                    )}
                  />
                </FormControl>
                {errors.category?.message && <FormHelperText error>{errors.category.message}</FormHelperText>}
              </Grid>

              <Grid size={{ xs: 12, sm: 4 }}>
                <InputLabel>Quantity *</InputLabel>
                <Controller
                  name="quantity"
                  control={control}
                  rules={{
                    required: 'Quantity is required',
                    min: { value: 1, message: 'Quantity must be at least 1' },
                    validate: (value) => {
                      const numValue = parseInt(value);
                      if (isNaN(numValue) || numValue < 1) {
                        return 'Quantity must be at least 1';
                      }
                      return true;
                    }
                  }}
                  render={({ field }) => (
                <OutlinedInput
                  type="number"
                      min="1"
                      step="1"
                      placeholder="1"
                  fullWidth
                  error={Boolean(errors.quantity)}
                      value={field.value ?? ''}
                      onChange={(e) => {
                        const inputValue = e.target.value;
                        
                        // Allow empty string for user to clear and type
                        if (inputValue === '' || inputValue === null || inputValue === undefined) {
                          field.onChange('');
                          return;
                        }
                        
                        // Prevent negative sign, decimal point, or the value "0" from being entered
                        if (inputValue.includes('-') || inputValue.includes('.') || inputValue === '0') {
                          // Reset to previous valid value or empty
                          e.target.value = field.value || '';
                          return;
                        }
                        
                        // Parse the value
                        const numValue = parseInt(inputValue);
                        
                        // Only update if it's a valid number >= 1
                        if (!isNaN(numValue) && numValue >= 1) {
                          field.onChange(numValue);
                        } else {
                          // For any other invalid input, reset to previous valid value
                          e.target.value = field.value || '';
                        }
                      }}
                      onBlur={(e) => {
                        // On blur, ensure value is at least 1
                        const value = parseInt(e.target.value);
                        if (isNaN(value) || value < 1) {
                          field.onChange(1);
                        }
                        field.onBlur();
                      }}
                      inputProps={{
                        min: 1,
                        step: 1
                      }}
                    />
                  )}
                />
                {errors.quantity?.message && <FormHelperText error>{errors.quantity.message}</FormHelperText>}
              </Grid>

              <Grid size={{ xs: 12, sm: 4 }}>
                <InputLabel>Unit *</InputLabel>
                <FormControl fullWidth error={Boolean(errors.unit)}>
                  <Controller
                    name="unit"
                    control={control}
                    rules={{ required: 'Unit is required' }}
                    render={({ field }) => (
                      <Select {...field} label="Unit *">
                        <MenuItem value="piece">Piece</MenuItem>
                        <MenuItem value="set">Set</MenuItem>
                        <MenuItem value="kg">Kilogram (kg)</MenuItem>
                        <MenuItem value="liter">Liter</MenuItem>
                        <MenuItem value="meter">Meter</MenuItem>
                      </Select>
                    )}
                  />
                </FormControl>
                {errors.unit?.message && <FormHelperText error>{errors.unit.message}</FormHelperText>}
              </Grid>

              <Grid size={{ xs: 12, sm: 4 }}>
                <InputLabel>Condition *</InputLabel>
                <FormControl fullWidth error={Boolean(errors.condition)}>
                  <Controller
                    name="condition"
                    control={control}
                    rules={{ required: 'Condition is required' }}
                    render={({ field }) => (
                      <Select {...field} label="Condition *">
                        <MenuItem value="new">New</MenuItem>
                        <MenuItem value="good">Good</MenuItem>
                        <MenuItem value="fair">Fair</MenuItem>
                        <MenuItem value="poor">Poor</MenuItem>
                        <MenuItem value="damaged">Damaged</MenuItem>
                      </Select>
                    )}
                  />
                </FormControl>
                {errors.condition?.message && <FormHelperText error>{errors.condition.message}</FormHelperText>}
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <InputLabel>Status *</InputLabel>
                <FormControl fullWidth error={Boolean(errors.status)}>
                  <Controller
                    name="status"
                    control={control}
                    rules={{ required: 'Status is required' }}
                    render={({ field }) => (
                      <Select {...field} label="Status *">
                        <MenuItem value="available">Available</MenuItem>
                        <MenuItem value="in_use">In Use</MenuItem>
                        <MenuItem value="maintenance">Maintenance</MenuItem>
                        <MenuItem value="damaged">Damaged</MenuItem>
                        <MenuItem value="disposed">Disposed</MenuItem>
                      </Select>
                    )}
                  />
                </FormControl>
                {errors.status?.message && <FormHelperText error>{errors.status.message}</FormHelperText>}
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <InputLabel>Location</InputLabel>
                <OutlinedInput
                  {...register('location', {
                    maxLength: { value: 200, message: 'Location cannot exceed 200 characters' }
                  })}
                  placeholder="General Store"
                  fullWidth
                  error={Boolean(errors.location)}
                  defaultValue="General Store"
                />
                {errors.location?.message && <FormHelperText error>{errors.location.message}</FormHelperText>}
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <InputLabel>Item Type *</InputLabel>
                <FormControl fullWidth error={Boolean(errors.itemType)}>
                  <Controller
                    name="itemType"
                    control={control}
                    rules={{ required: 'Item type is required' }}
                    render={({ field }) => (
                      <Select {...field} label="Item Type *">
                        <MenuItem value="temporary">Temporary (Can be returned)</MenuItem>
                        <MenuItem value="permanent">Permanent (Cannot be returned, e.g., bed)</MenuItem>
                      </Select>
                    )}
                  />
                </FormControl>
                {errors.itemType?.message && <FormHelperText error>{errors.itemType.message}</FormHelperText>}
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <InputLabel>Student Eligible</InputLabel>
                <FormControl fullWidth error={Boolean(errors.isStudentEligible)}>
                  <Controller
                    name="isStudentEligible"
                    control={control}
                    render={({ field }) => {
                      const itemName = watch('name')?.toLowerCase().trim() || '';
                      const eligibleItems = ['chair', 'table', 'lamp', 'bucket', 'mug', 'plate', 'cup', 'bed', 'broom', 'dustbin', 'dustpan'];
                      const isEligibleItem = eligibleItems.some(item => itemName === item.toLowerCase());
                      
                      return (
                        <Select 
                          label="Student Eligible"
                          disabled={!isEligibleItem}
                          value={isEligibleItem ? (field.value ? 'true' : 'false') : 'false'}
                          onChange={(e) => field.onChange(e.target.value === 'true')}
                        >
                          <MenuItem value="false">No (Staff/Admin only)</MenuItem>
                          <MenuItem value="true">Yes (Students can request)</MenuItem>
                        </Select>
                      );
                    }}
                  />
                </FormControl>
                <FormHelperText>
                  {watch('name') && (['chair', 'table', 'lamp', 'bucket', 'mug', 'plate', 'cup', 'bed', 'broom', 'dustbin', 'dustpan'].some(item => 
                    watch('name')?.toLowerCase().trim() === item.toLowerCase()
                  )) 
                    ? 'This item can be made available for student requests'
                    : 'Only items: chair, table, lamp, bucket, mug, plate, cup, bed, broom, dustbin, dustpan can be student-eligible'}
                </FormHelperText>
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <InputLabel>Room (Optional)</InputLabel>
                <FormControl fullWidth error={Boolean(errors.room)}>
                  <Controller
                    name="room"
                    control={control}
                    render={({ field }) => (
                      <Select 
                        {...field} 
                        label="Room"
                        disabled={loadingRooms}
                        displayEmpty
                      >
                        <MenuItem value="">None (General Inventory)</MenuItem>
                        {rooms.map((room) => (
                          <MenuItem key={room._id} value={room._id}>
                            {room.roomNumber} {room.block ? `(${room.block})` : ''}
                          </MenuItem>
                        ))}
                      </Select>
                    )}
                  />
                </FormControl>
                {errors.room?.message && <FormHelperText error>{errors.room.message}</FormHelperText>}
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <InputLabel>Purchase Date</InputLabel>
                <TextField
                  {...register('purchaseDate')}
                  type="date"
                  fullWidth
                  error={Boolean(errors.purchaseDate)}
                  slotProps={{
                    inputLabel: {
                      shrink: true
                    },
                    input: {
                      max: new Date().toISOString().split('T')[0],
                      sx: { py: 1.25 }
                    }
                  }}
                />
                {errors.purchaseDate?.message && <FormHelperText error>{errors.purchaseDate.message}</FormHelperText>}
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <InputLabel>Purchase Price (₹)</InputLabel>
                <OutlinedInput
                  {...register('purchasePrice', {
                    min: { value: 0, message: 'Price must be 0 or greater' },
                    valueAsNumber: true
                  })}
                  type="number"
                  placeholder="0.00"
                  fullWidth
                  error={Boolean(errors.purchasePrice)}
                />
                {errors.purchasePrice?.message && <FormHelperText error>{errors.purchasePrice.message}</FormHelperText>}
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <InputLabel>Supplier</InputLabel>
                <OutlinedInput
                  {...register('supplier', {
                    maxLength: { value: 100, message: 'Supplier name cannot exceed 100 characters' }
                  })}
                  placeholder="Enter supplier name"
                  fullWidth
                  error={Boolean(errors.supplier)}
                />
                {errors.supplier?.message && <FormHelperText error>{errors.supplier.message}</FormHelperText>}
              </Grid>

              <Grid size={12}>
                <InputLabel>Description</InputLabel>
                <OutlinedInput
                  {...register('description', {
                    maxLength: { value: 500, message: 'Description cannot exceed 500 characters' }
                  })}
                  placeholder="Enter item description (Optional)"
                  fullWidth
                  multiline
                  rows={3}
                  error={Boolean(errors.description)}
                />
                {errors.description?.message && <FormHelperText error>{errors.description.message}</FormHelperText>}
              </Grid>
            </Grid>

            <Stack direction="row" spacing={2} justifyContent="flex-end" sx={{ mt: 3 }}>
              <Button
                variant="outlined"
                color="secondary"
                startIcon={<IconX size={18} />}
                onClick={() => router.push('/app/inventory')}
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
                {isProcessing ? 'Creating...' : 'Create Inventory Item'}
              </Button>
            </Stack>
          </Stack>
        </form>
      </PresentationCard>
    </ComponentsWrapper>
  );
}
