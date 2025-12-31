import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';

import Stack from '@mui/material/Stack';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Grid from '@mui/material/Grid';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import FormControlLabel from '@mui/material/FormControlLabel';
import Switch from '@mui/material/Switch';
import Avatar from '@mui/material/Avatar';
import Typography from '@mui/material/Typography';

import ComponentsWrapper from '@/components/ComponentsWrapper';
import PresentationCard from '@/components/cards/PresentationCard';
import TabPanel from '@/components/TabPanel';

export default function StaffSettings() {
  const [searchParams, setSearchParams] = useSearchParams();
  
  const getInitialTab = () => {
    const tab = searchParams.get('tab');
    if (tab === 'profile') return 'profile';
    if (tab === 'password') return 'password';
    if (tab === 'notifications') return 'notifications';
    return 'profile';
  };
  
  const [tab, setTab] = useState(getInitialTab);
  
  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam && ['profile', 'password', 'notifications'].includes(tabParam) && tabParam !== tab) {
      setTab(tabParam);
    }
  }, [searchParams, tab]);
  
  const handleChange = (event, newValue) => {
    setTab(newValue);
    const tabNames = { profile: 'profile', password: 'password', notifications: 'notifications' };
    if (tabNames[newValue]) {
      setSearchParams({ tab: tabNames[newValue] });
    } else {
      setSearchParams({});
    }
  };

  return (
    <ComponentsWrapper title="Settings">
      <PresentationCard>
        <Stack spacing={3}>
          <Tabs value={tab} onChange={handleChange}>
            <Tab value="profile" label="Profile" />
            <Tab value="password" label="Change Password" />
            <Tab value="notifications" label="Notification Preferences" />
          </Tabs>

          <TabPanel value={tab} index="profile">
            <Stack spacing={3}>
              <Stack direction="row" spacing={2} alignItems="center">
                <Avatar sx={{ width: 80, height: 80 }}>S</Avatar>
                <div>
                  <Typography variant="subtitle1">Staff Name</Typography>
                  <Typography variant="body2" color="text.secondary">
                    staff@hostelhaven.com
                  </Typography>
                </div>
              </Stack>
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField label="Full Name" placeholder="Update full name" fullWidth />
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField label="Phone Number" placeholder="Primary contact" fullWidth />
                </Grid>
                <Grid size={12}>
                  <TextField label="Address" placeholder="Residence / quarters" fullWidth multiline rows={3} />
                </Grid>
              </Grid>
              <Button variant="contained">Save profile</Button>
            </Stack>
          </TabPanel>

          <TabPanel value={tab} index="password">
            <Stack spacing={2}>
              <TextField label="Current password" type="password" />
              <TextField label="New password" type="password" />
              <TextField label="Confirm new password" type="password" />
              <Button variant="contained">Update password</Button>
            </Stack>
          </TabPanel>

          <TabPanel value={tab} index="notifications">
            <Stack spacing={1}>
              {['Duty updates', 'Inventory alerts', 'Complaint notifications', 'Meal plan updates', 'Attendance reminders'].map((label) => (
                <FormControlLabel key={label} control={<Switch defaultChecked />} label={label} />
              ))}
            </Stack>
          </TabPanel>
        </Stack>
      </PresentationCard>
    </ComponentsWrapper>
  );
}


