// @mui
import Typography from '@mui/material/Typography';

// @project
import ComponentsWrapper from '@/components/ComponentsWrapper';
import PresentationCard from '@/components/cards/PresentationCard';

/***************************  STAFF ATTENDANCE PAGE  ***************************/

export default function StaffAttendancePage() {
  return (
    <ComponentsWrapper title="Staff Attendance">
      <PresentationCard title="Manage Staff Attendance">
        <Typography variant="body2" color="text.secondary">
          Track and manage staff attendance records. Mark attendance, view attendance history, and generate staff attendance reports.
        </Typography>
      </PresentationCard>
    </ComponentsWrapper>
  );
}

