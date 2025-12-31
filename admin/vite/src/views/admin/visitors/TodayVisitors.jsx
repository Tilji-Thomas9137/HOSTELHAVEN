// @mui
import Typography from '@mui/material/Typography';

// @project
import ComponentsWrapper from '@/components/ComponentsWrapper';
import PresentationCard from '@/components/cards/PresentationCard';

/***************************  TODAY'S VISITORS PAGE  ***************************/

export default function TodayVisitorsPage() {
  return (
    <ComponentsWrapper title="Today's Visitors">
      <PresentationCard title="Today's Visitor Log">
        <Typography variant="body2" color="text.secondary">
          View all visitors who have checked in today. See current visitors, check-out pending visitors, and today's visit statistics.
        </Typography>
      </PresentationCard>
    </ComponentsWrapper>
  );
}

