// @mui
import Typography from '@mui/material/Typography';

// @project
import ComponentsWrapper from '@/components/ComponentsWrapper';
import PresentationCard from '@/components/cards/PresentationCard';

/***************************  FEE REPORTS PAGE  ***************************/

export default function FeeReportsPage() {
  return (
    <ComponentsWrapper title="Fee Reports">
      <PresentationCard title="Generate Fee Reports">
        <Typography variant="body2" color="text.secondary">
          Generate comprehensive fee reports. View fee collection statistics, pending payments, and financial summaries.
        </Typography>
      </PresentationCard>
    </ComponentsWrapper>
  );
}

