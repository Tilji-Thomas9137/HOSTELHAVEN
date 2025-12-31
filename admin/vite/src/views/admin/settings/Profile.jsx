// @mui
import Typography from '@mui/material/Typography';

// @project
import ComponentsWrapper from '@/components/ComponentsWrapper';
import PresentationCard from '@/components/cards/PresentationCard';

/***************************  ADMIN PROFILE PAGE  ***************************/

export default function AdminProfilePage() {
  return (
    <ComponentsWrapper title="Admin Profile">
      <PresentationCard title="Manage Admin Profile">
        <Typography variant="body2" color="text.secondary">
          Update your admin profile information. Change name, email, phone number, and other personal details.
        </Typography>
      </PresentationCard>
    </ComponentsWrapper>
  );
}

