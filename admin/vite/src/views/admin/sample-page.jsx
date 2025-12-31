// @mui
import Typography from '@mui/material/Typography';

// @project
import ComponentsWrapper from '@/components/ComponentsWrapper';
import PresentationCard from '@/components/cards/PresentationCard';

/***************************  SAMPLE PAGE  ***************************/

export default function SamplePage() {
  return (
    <ComponentsWrapper title="Sample Page">
      <PresentationCard title="Basic Card">
        <Typography variant="body2" color="text.secondary">
          HostelHaven is a comprehensive hostel management system designed to streamline student accommodation operations.
          Manage rooms, bookings, payments, and student information all in one place.
        </Typography>
      </PresentationCard>
    </ComponentsWrapper>
  );
}
