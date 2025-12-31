// @mui
import Typography from '@mui/material/Typography';

// @project
import ComponentsWrapper from '@/components/ComponentsWrapper';
import PresentationCard from '@/components/cards/PresentationCard';

/***************************  COMPLAINT ASSIGNMENT PAGE  ***************************/

export default function ComplaintAssignmentPage() {
  return (
    <ComponentsWrapper title="Complaint Assignment">
      <PresentationCard title="Assign Complaints to Staff">
        <Typography variant="body2" color="text.secondary">
          Assign complaints to appropriate staff members. View assigned complaints and track their resolution status.
        </Typography>
      </PresentationCard>
    </ComponentsWrapper>
  );
}

