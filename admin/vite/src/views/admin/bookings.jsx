// @mui
import Typography from '@mui/material/Typography';

// @project
import ComponentsWrapper from '@/components/ComponentsWrapper';
import PresentationCard from '@/components/cards/PresentationCard';

/***************************  BOOKINGS PAGE  ***************************/

export default function BookingsPage() {
  return (
    <ComponentsWrapper title="Bookings Management">
      <PresentationCard title="Bookings">
        <Typography variant="body2" color="text.secondary">
          Manage room bookings, allocations, check-ins, and check-outs. Track booking status and history.
        </Typography>
      </PresentationCard>
    </ComponentsWrapper>
  );
}
