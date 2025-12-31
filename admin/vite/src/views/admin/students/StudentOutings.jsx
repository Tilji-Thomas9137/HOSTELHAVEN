// @mui
import Typography from '@mui/material/Typography';

// @project
import ComponentsWrapper from '@/components/ComponentsWrapper';
import PresentationCard from '@/components/cards/PresentationCard';

/***************************  STUDENT OUTING REQUESTS PAGE  ***************************/

export default function StudentOutingsPage() {
  return (
    <ComponentsWrapper title="Student Outing Requests">
      <PresentationCard title="Manage Student Outing Requests">
        <Typography variant="body2" color="text.secondary">
          View and manage outing requests from students. Approve or reject outing requests and track outing history.
        </Typography>
      </PresentationCard>
    </ComponentsWrapper>
  );
}

