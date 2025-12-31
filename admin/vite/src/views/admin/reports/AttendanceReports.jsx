// @mui
import Typography from '@mui/material/Typography';

// @project
import ComponentsWrapper from '@/components/ComponentsWrapper';
import PresentationCard from '@/components/cards/PresentationCard';

/***************************  ATTENDANCE REPORTS PAGE  ***************************/

export default function AttendanceReportsPage() {
  return (
    <ComponentsWrapper title="Attendance Reports">
      <PresentationCard title="Generate Attendance Reports">
        <Typography variant="body2" color="text.secondary">
          Generate detailed attendance reports for students and staff. Filter by date range, view statistics, and export reports.
        </Typography>
      </PresentationCard>
    </ComponentsWrapper>
  );
}

