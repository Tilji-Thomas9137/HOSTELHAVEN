// @mui
import Typography from '@mui/material/Typography';

// @project
import ComponentsWrapper from '@/components/ComponentsWrapper';
import PresentationCard from '@/components/cards/PresentationCard';

/***************************  CHANGE PASSWORD PAGE  ***************************/

export default function ChangePasswordPage() {
  return (
    <ComponentsWrapper title="Change Password">
      <PresentationCard title="Change Your Password">
        <Typography variant="body2" color="text.secondary">
          Update your account password. Enter your current password and set a new secure password.
        </Typography>
      </PresentationCard>
    </ComponentsWrapper>
  );
}

