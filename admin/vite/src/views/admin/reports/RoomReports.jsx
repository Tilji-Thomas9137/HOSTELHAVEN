// @mui
import Typography from '@mui/material/Typography';

// @project
import ComponentsWrapper from '@/components/ComponentsWrapper';
import PresentationCard from '@/components/cards/PresentationCard';

/***************************  ROOM ALLOCATION REPORTS PAGE  ***************************/

export default function RoomReportsPage() {
  return (
    <ComponentsWrapper title="Room Allocation Reports">
      <PresentationCard title="Generate Room Allocation Reports">
        <Typography variant="body2" color="text.secondary">
          Generate reports on room allocation and occupancy. View room utilization statistics, vacancy rates, and allocation history.
        </Typography>
      </PresentationCard>
    </ComponentsWrapper>
  );
}

