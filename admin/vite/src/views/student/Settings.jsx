import { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';

// @mui
import Box from '@mui/material/Box';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import FormControlLabel from '@mui/material/FormControlLabel';
import Switch from '@mui/material/Switch';
import Card from '@mui/material/Card';
import Grid from '@mui/material/Grid';
import CircularProgress from '@mui/material/CircularProgress';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';
import Alert from '@mui/material/Alert';
import Avatar from '@mui/material/Avatar';

// @project
import ComponentsWrapper from '@/components/ComponentsWrapper';
import PresentationCard from '@/components/cards/PresentationCard';
import TabPanel from '@/components/TabPanel';
import studentService from '@/services/studentService';
import authService from '@/services/authService';
import useAuth from '@/hooks/useAuth';
import { useSnackbar } from 'notistack';

// @icons
import { IconUser, IconLock, IconBell, IconEye, IconEyeOff, IconCamera, IconX } from '@tabler/icons-react';

/***************************  SETTINGS PAGE  ***************************/

export default function SettingsPage() {
  const { enqueueSnackbar } = useSnackbar();
  const { user, updateUser } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const isStudent = user?.role === 'student';

  const tabConfig = useMemo(
    () => ({
      profile: { label: 'Profile', icon: <IconUser size={18} /> },
      password: { label: 'Change Password', icon: <IconLock size={18} /> },
      notifications: { label: 'Notification Preferences', icon: <IconBell size={18} /> }
    }),
    []
  );

  const availableTabs = useMemo(() => (isStudent ? ['profile', 'password', 'notifications'] : ['password']), [isStudent]);

  const getInitialTab = () => {
    const tab = searchParams.get('tab');
    if (tab && availableTabs.includes(tab)) return tab;
    return availableTabs[0];
  };
  
  const [value, setValue] = useState(getInitialTab);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState(null);
  const [profileData, setProfileData] = useState({
    name: '',
    phone: '',
    profilePhoto: null
  });
  const [photoPreview, setPhotoPreview] = useState(null);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });
  const [notifications, setNotifications] = useState({
    email: true,
    sms: false,
    push: true,
    paymentReminders: true,
    maintenanceUpdates: true,
    eventNotifications: true
  });

  // Sync selected tab with URL/search params
  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab && availableTabs.includes(tab) && tab !== value) {
      setValue(tab);
    }
  }, [searchParams, availableTabs, value]);

  // Ensure selected tab is valid when available tabs change (e.g., role switches)
  useEffect(() => {
    if (!availableTabs.includes(value)) {
      setValue(availableTabs[0]);
    }
  }, [availableTabs, value]);

  useEffect(() => {
    if (!isStudent) {
      setLoading(false);
      return;
    }

    if (value === 'profile') {
      fetchProfile();
    } else if (value === 'notifications') {
      fetchNotificationPreferences();
    }
  }, [value, isStudent]);

  const fetchProfile = async () => {
    if (!isStudent) {
      return;
    }
    try {
      setLoading(true);
      const data = await studentService.getProfile();
      
      // Handle case where student profile might not exist yet
      if (data) {
        setProfile(data);
        setProfileData({
          name: data.user?.name || data.student?.name || '',
          phone: data.user?.phone || data.student?.phone || '',
          profilePhoto: data.user?.profilePhoto || null
        });
        setPhotoPreview(data.user?.profilePhoto || null);
      } else {
        // If no profile data, still allow editing user info
        const storedUser = localStorage.getItem('hostelhaven_user');
        if (storedUser) {
          const user = JSON.parse(storedUser);
          setProfile({ user, student: null });
          setProfileData({
            name: user.name || '',
            phone: user.phone || '',
            profilePhoto: user.profilePhoto || null
          });
          setPhotoPreview(user.profilePhoto || null);
        }
      }
    } catch (err) {
      console.error('Profile fetch error:', err);
      // Try to get user info from localStorage as fallback
      try {
        const storedUser = localStorage.getItem('hostelhaven_user');
        if (storedUser) {
          const user = JSON.parse(storedUser);
          setProfile({ user, student: null });
          setProfileData({
            name: user.name || '',
            phone: user.phone || '',
            profilePhoto: user.profilePhoto || null
          });
          setPhotoPreview(user.profilePhoto || null);
        }
      } catch (localErr) {
        console.error('Error parsing user from localStorage:', localErr);
      }
      enqueueSnackbar(err.response?.data?.message || 'Failed to load profile. You can still update your information.', { variant: 'warning' });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (_event, newValue) => {
    setValue(newValue);
    if (newValue !== availableTabs[0]) {
      setSearchParams({ tab: newValue });
    } else {
      setSearchParams({});
    }
  };

  const handlePhotoChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        enqueueSnackbar('Please select an image file', { variant: 'error' });
        return;
      }
      // Validate file size (max 2MB)
      if (file.size > 2 * 1024 * 1024) {
        enqueueSnackbar('Image size should be less than 2MB', { variant: 'error' });
        return;
      }
      
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result;
        setPhotoPreview(base64String);
        setProfileData({ ...profileData, profilePhoto: base64String });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemovePhoto = () => {
    setPhotoPreview(null);
    setProfileData({ ...profileData, profilePhoto: null });
  };

  const handleProfileUpdate = async () => {
    if (!isStudent) {
      enqueueSnackbar('Student account required to update this profile', { variant: 'warning' });
      return;
    }
    try {
      setSaving(true);
      
      // Prepare data for update - only send profilePhoto if it's actually set
      const updateData = {
        name: profileData.name,
        phone: profileData.phone
      };
      
      // Only include profilePhoto if it's been set (not null/undefined)
      if (profileData.profilePhoto !== null && profileData.profilePhoto !== undefined) {
        updateData.profilePhoto = profileData.profilePhoto;
      } else if (photoPreview === null && profile?.user?.profilePhoto) {
        // If user removed photo, explicitly set to null
        updateData.profilePhoto = null;
      }
      
      const response = await studentService.updateProfile(updateData);
      
      // Update user data immediately
      const storedUser = localStorage.getItem('hostelhaven_user');
      if (storedUser) {
        const user = JSON.parse(storedUser);
        if (response.user) {
          // Use response data which includes updated profilePhoto
          user.name = response.user.name;
          user.phone = response.user.phone;
          user.profilePhoto = response.user.profilePhoto;
        } else {
          // Fallback to updateData
          user.name = updateData.name;
          user.phone = updateData.phone;
          if (updateData.profilePhoto !== undefined) {
            user.profilePhoto = updateData.profilePhoto;
          }
        }
        localStorage.setItem('hostelhaven_user', JSON.stringify(user));
        
        // Update AuthContext immediately - this will trigger re-renders everywhere
        updateUser(user);
      }
      
      // Force immediate update of photoPreview and profile state
      if (response.user?.profilePhoto) {
        setPhotoPreview(response.user.profilePhoto);
        setProfileData(prev => ({ ...prev, profilePhoto: response.user.profilePhoto }));
      } else if (updateData.profilePhoto) {
        setPhotoPreview(updateData.profilePhoto);
        setProfileData(prev => ({ ...prev, profilePhoto: updateData.profilePhoto }));
      }
      
      // Update profile state immediately
      if (response.user) {
        setProfile(prev => ({
          ...prev,
          user: {
            ...prev?.user,
            ...response.user
          }
        }));
      }
      
      enqueueSnackbar('Profile updated successfully', { variant: 'success' });
      
      // Refresh profile data from API to ensure consistency
      await fetchProfile();
    } catch (err) {
      console.error('Profile update error:', err);
      const errorMessage = err.response?.data?.message || err.message || 'Failed to update profile';
      enqueueSnackbar(errorMessage, { variant: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordChange = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      enqueueSnackbar('New passwords do not match', { variant: 'error' });
      return;
    }
    if (passwordData.newPassword.length < 6) {
      enqueueSnackbar('Password must be at least 6 characters', { variant: 'error' });
      return;
    }
    try {
      setSaving(true);
      await authService.changePassword(passwordData.currentPassword, passwordData.newPassword);
      enqueueSnackbar('Password changed successfully', { variant: 'success' });
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      enqueueSnackbar(err.response?.data?.message || 'Failed to change password', { variant: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const handleNotificationChange = (key) => (event) => {
    setNotifications({ ...notifications, [key]: event.target.checked });
  };

  const fetchNotificationPreferences = async () => {
    if (!isStudent) {
      return;
    }
    try {
      setLoading(true);
      const prefs = await studentService.getNotificationPreferences();
      setNotifications({
        email: prefs.email ?? true,
        sms: prefs.sms ?? false,
        push: prefs.push ?? true,
        paymentReminders: prefs.paymentReminders ?? true,
        maintenanceUpdates: prefs.maintenanceUpdates ?? true,
        eventNotifications: prefs.eventNotifications ?? true,
      });
    } catch (err) {
      enqueueSnackbar(err.response?.data?.message || 'Failed to load notification preferences', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveNotifications = async () => {
    if (!isStudent) {
      enqueueSnackbar('Student account required to update notification preferences', { variant: 'warning' });
      return;
    }
    try {
      setSaving(true);
      await studentService.updateNotificationPreferences(notifications);
      enqueueSnackbar('Notification preferences saved successfully', { variant: 'success' });
    } catch (err) {
      enqueueSnackbar(err.response?.data?.message || 'Failed to save notification preferences', { variant: 'error' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <ComponentsWrapper title="Settings">
      <Box sx={{ width: '100%' }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
          <Tabs value={value} onChange={handleChange}>
            {availableTabs.map((tabKey) => (
              <Tab
                key={tabKey}
                value={tabKey}
                label={tabConfig[tabKey].label}
                icon={tabConfig[tabKey].icon}
                iconPosition="start"
              />
            ))}
          </Tabs>
        </Box>

        {/* Profile Tab */}
        {isStudent && (
          <TabPanel value={value} index="profile">
            <PresentationCard>
              <Stack spacing={3}>
                <Typography variant="h6">Profile Information</Typography>
                {loading ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                    <CircularProgress />
                  </Box>
                ) : (
                  <>
                    {!profile && (
                      <Alert severity="info" sx={{ mb: 2 }}>
                        Profile information will be displayed here once your student profile is created.
                      </Alert>
                    )}
                    
                    {/* Profile Photo Section */}
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 3 }}>
                      <Box sx={{ position: 'relative', display: 'inline-block' }}>
                        <Avatar
                          src={photoPreview || profile?.user?.profilePhoto}
                          alt={profileData.name || 'Profile'}
                          sx={{ width: 120, height: 120, mb: 2, border: '3px solid', borderColor: 'primary.main' }}
                        >
                          {!photoPreview && !profile?.user?.profilePhoto && (
                            <IconUser size={60} />
                          )}
                        </Avatar>
                        <input
                          accept="image/*"
                          style={{ display: 'none' }}
                          id="profile-photo-upload"
                          type="file"
                          onChange={handlePhotoChange}
                        />
                        <label htmlFor="profile-photo-upload">
                          <IconButton
                            color="primary"
                            component="span"
                            sx={{
                              position: 'absolute',
                              bottom: 0,
                              right: 0,
                              bgcolor: 'primary.main',
                              color: 'white',
                              '&:hover': { bgcolor: 'primary.dark' }
                            }}
                          >
                            <IconCamera size={20} />
                          </IconButton>
                        </label>
                        {photoPreview && (
                          <IconButton
                            color="error"
                            onClick={handleRemovePhoto}
                            sx={{
                              position: 'absolute',
                              top: 0,
                              right: 0,
                              bgcolor: 'error.main',
                              color: 'white',
                              '&:hover': { bgcolor: 'error.dark' }
                            }}
                          >
                            <IconX size={20} />
                          </IconButton>
                        )}
                      </Box>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        Click camera icon to upload profile photo (Max 2MB)
                      </Typography>
                    </Box>

                    <Grid container spacing={3}>
                      <Grid size={12} sm={6}>
                        <TextField
                          fullWidth
                          label="Name"
                          value={profileData.name}
                          onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                        />
                      </Grid>
                      <Grid size={12} sm={6}>
                        <TextField
                          fullWidth
                          label="Phone"
                          value={profileData.phone}
                          onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                        />
                      </Grid>
                      <Grid size={12} sm={6}>
                        <TextField
                          fullWidth
                          label="Email"
                          value={profile?.user?.email || profile?.student?.email || ''}
                          disabled
                          helperText="Email cannot be changed"
                        />
                      </Grid>
                      <Grid size={12} sm={6}>
                        <TextField
                          fullWidth
                          label="Student ID"
                          value={profile?.student?.studentId || 'Not assigned yet'}
                          disabled
                          helperText="Student ID cannot be changed"
                        />
                      </Grid>
                    </Grid>
                    <Button 
                      variant="contained" 
                      size="large" 
                      onClick={handleProfileUpdate}
                      disabled={saving || !profileData.name}
                    >
                      {saving ? 'Saving...' : 'Update Profile'}
                    </Button>
                  </>
                )}
              </Stack>
            </PresentationCard>
          </TabPanel>
        )}

        {/* Change Password Tab */}
        <TabPanel value={value} index="password">
          <PresentationCard>
            <Stack spacing={3}>
              <Typography variant="h6">Change Password</Typography>
              <Alert severity="info">Enter your current password and set a new secure password.</Alert>
              
              <TextField
                fullWidth
                label="Current Password"
                type={showPasswords.current ? 'text' : 'password'}
                value={passwordData.currentPassword}
                onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton onClick={() => setShowPasswords({ ...showPasswords, current: !showPasswords.current })}>
                        {showPasswords.current ? <IconEyeOff size={20} /> : <IconEye size={20} />}
                      </IconButton>
                    </InputAdornment>
                  )
                }}
              />

              <TextField
                fullWidth
                label="New Password"
                type={showPasswords.new ? 'text' : 'password'}
                value={passwordData.newPassword}
                onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                helperText="Password must be at least 6 characters"
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton onClick={() => setShowPasswords({ ...showPasswords, new: !showPasswords.new })}>
                        {showPasswords.new ? <IconEyeOff size={20} /> : <IconEye size={20} />}
                      </IconButton>
                    </InputAdornment>
                  )
                }}
              />

              <TextField
                fullWidth
                label="Confirm New Password"
                type={showPasswords.confirm ? 'text' : 'password'}
                value={passwordData.confirmPassword}
                onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton onClick={() => setShowPasswords({ ...showPasswords, confirm: !showPasswords.confirm })}>
                        {showPasswords.confirm ? <IconEyeOff size={20} /> : <IconEye size={20} />}
                      </IconButton>
                    </InputAdornment>
                  )
                }}
              />

              <Button 
                variant="contained" 
                size="large" 
                fullWidth
                onClick={handlePasswordChange}
                disabled={saving || !passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword}
              >
                {saving ? 'Changing...' : 'Change Password'}
              </Button>
            </Stack>
          </PresentationCard>
        </TabPanel>

        {/* Notification Preferences Tab */}
        {isStudent && (
          <TabPanel value={value} index="notifications">
            <PresentationCard>
              <Stack spacing={3}>
                <Typography variant="h6">Notification Preferences</Typography>
                <Typography variant="body2" color="text.secondary">
                  Manage how you receive notifications from the hostel management system.
                </Typography>
                {loading ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                    <CircularProgress />
                  </Box>
                ) : (
                  <>

                <Card variant="outlined" sx={{ p: 3 }}>
                  <Stack spacing={2}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={notifications.email}
                          onChange={handleNotificationChange('email')}
                        />
                      }
                      label="Email Notifications"
                    />
                    <FormControlLabel
                      control={
                        <Switch
                          checked={notifications.sms}
                          onChange={handleNotificationChange('sms')}
                        />
                      }
                      label="SMS Notifications"
                    />
                    <FormControlLabel
                      control={
                        <Switch
                          checked={notifications.push}
                          onChange={handleNotificationChange('push')}
                        />
                      }
                      label="Push Notifications"
                    />
                  </Stack>
                </Card>

                <Card variant="outlined" sx={{ p: 3 }}>
                  <Typography variant="subtitle1" gutterBottom fontWeight={600}>Notification Types</Typography>
                  <Stack spacing={2} sx={{ mt: 2 }}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={notifications.paymentReminders}
                          onChange={handleNotificationChange('paymentReminders')}
                        />
                      }
                      label="Payment Reminders"
                    />
                    <FormControlLabel
                      control={
                        <Switch
                          checked={notifications.maintenanceUpdates}
                          onChange={handleNotificationChange('maintenanceUpdates')}
                        />
                      }
                      label="Maintenance Updates"
                    />
                    <FormControlLabel
                      control={
                        <Switch
                          checked={notifications.eventNotifications}
                          onChange={handleNotificationChange('eventNotifications')}
                        />
                      }
                      label="Event Notifications"
                    />
                  </Stack>
                </Card>

                <Button 
                  variant="contained" 
                  size="large" 
                  fullWidth
                  onClick={handleSaveNotifications}
                  disabled={saving}
                >
                  {saving ? 'Saving...' : 'Save Preferences'}
                </Button>
                  </>
                )}
              </Stack>
            </PresentationCard>
          </TabPanel>
        )}
      </Box>
    </ComponentsWrapper>
  );
}

