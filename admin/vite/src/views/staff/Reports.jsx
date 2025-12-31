import { useState } from 'react';

import Stack from '@mui/material/Stack';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';

import { IconDownload } from '@tabler/icons-react';

import ComponentsWrapper from '@/components/ComponentsWrapper';
import PresentationCard from '@/components/cards/PresentationCard';
import TabPanel from '@/components/TabPanel';

const attendanceReport = [
  { date: '2025-02-05', duty: 'Morning round', hours: 8 },
  { date: '2025-02-04', duty: 'Evening supervision', hours: 8 }
];

const complaintReport = [
  { id: 'HST-221', status: 'Resolved', sla: '12 hrs' },
  { id: 'HST-222', status: 'In Progress', sla: '6 hrs' }
];

const inventoryReport = [
  { item: 'Brooms', movement: '-5', note: 'Issued to Block B' },
  { item: 'Bedsheets', movement: '+20', note: 'New stock received' }
];

export default function StaffReports() {
  const [tab, setTab] = useState('attendance');

  const reportTables = {
    attendance: {
      data: attendanceReport,
      columns: [
        { label: 'Date', field: 'date' },
        { label: 'Duty', field: 'duty' },
        { label: 'Hours', field: 'hours' }
      ]
    },
    complaints: {
      data: complaintReport,
      columns: [
        { label: 'ID', field: 'id' },
        { label: 'Status', field: 'status' },
        { label: 'Resolution Time', field: 'sla' }
      ]
    },
    inventory: {
      data: inventoryReport,
      columns: [
        { label: 'Item', field: 'item' },
        { label: 'Movement', field: 'movement' },
        { label: 'Notes', field: 'note' }
      ]
    }
  };

  return (
    <ComponentsWrapper title="Reports">
      <PresentationCard>
        <Stack spacing={3}>
          <Tabs value={tab} onChange={(_e, value) => setTab(value)}>
            <Tab value="attendance" label="Attendance Report" />
            <Tab value="complaints" label="Complaint Report" />
            <Tab value="inventory" label="Inventory Report" />
          </Tabs>

          {['attendance', 'complaints', 'inventory'].map((key) => {
            const table = reportTables[key];
            return (
            <TabPanel value={tab} index={key} key={key}>
              <Stack spacing={2}>
                <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" spacing={2}>
                  <Typography variant="subtitle1">{`${key.charAt(0).toUpperCase() + key.slice(1)} summary`}</Typography>
                  <Button variant="outlined" startIcon={<IconDownload size={18} />}>
                    Download PDF
                  </Button>
                </Stack>
                <Paper variant="outlined">
                  <Table>
                    <TableHead>
                      <TableRow>
                        {table.columns.map((col) => (
                          <TableCell key={col.label}>{col.label}</TableCell>
                        ))}
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {table.data.map((row, idx) => (
                        <TableRow key={idx}>
                          {table.columns.map((col) => (
                            <TableCell key={col.field}>{row[col.field]}</TableCell>
                          ))}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </Paper>
              </Stack>
            </TabPanel>
)})}
        </Stack>
      </PresentationCard>
    </ComponentsWrapper>
  );
}


