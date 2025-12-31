// @mui
import Typography from '@mui/material/Typography';

// @project
import ComponentsWrapper from '@/components/ComponentsWrapper';
import PresentationCard from '@/components/cards/PresentationCard';

/***************************  VISITOR REPORTS PAGE  ***************************/

export default function VisitorReportsPage() {
  return (
    <ComponentsWrapper title="Visitor Reports">
      <PresentationCard title="Generate Visitor Reports">
        <Typography variant="body2" color="text.secondary">
          Generate visitor reports and statistics. View visit patterns, frequent visitors, and visitor log summaries.
        </Typography>
      </PresentationCard>
    </ComponentsWrapper>
  );
}

