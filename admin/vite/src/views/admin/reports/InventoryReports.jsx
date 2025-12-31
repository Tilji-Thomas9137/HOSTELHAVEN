// @mui
import Typography from '@mui/material/Typography';

// @project
import ComponentsWrapper from '@/components/ComponentsWrapper';
import PresentationCard from '@/components/cards/PresentationCard';

/***************************  INVENTORY REPORTS PAGE  ***************************/

export default function InventoryReportsPage() {
  return (
    <ComponentsWrapper title="Inventory Reports">
      <PresentationCard title="Generate Inventory Reports">
        <Typography variant="body2" color="text.secondary">
          Generate inventory reports and stock summaries. View item usage, purchase history, and inventory valuation.
        </Typography>
      </PresentationCard>
    </ComponentsWrapper>
  );
}

