// @mui
import Typography from '@mui/material/Typography';

// @project
import ComponentsWrapper from '@/components/ComponentsWrapper';
import PresentationCard from '@/components/cards/PresentationCard';

/***************************  SETTINGS PAGE  ***************************/

export default function SettingsPage() {
  return (
    <ComponentsWrapper title="Settings">
      <PresentationCard title="System Settings">
        <Typography variant="body2" color="text.secondary">
          Configure system settings, user preferences, hostel details, and other administrative options.
        </Typography>
      </PresentationCard>
    </ComponentsWrapper>
  );
}
