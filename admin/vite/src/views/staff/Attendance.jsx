import { useState } from 'react';

import Stack from '@mui/material/Stack';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import Button from '@mui/material/Button';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';
import InputAdornment from '@mui/material/InputAdornment';

import { IconSearch } from '@tabler/icons-react';

import ComponentsWrapper from '@/components/ComponentsWrapper';
import PresentationCard from '@/components/cards/PresentationCard';
import TabPanel from '@/components/TabPanel';

const attendanceLog = [
  { date: '2025-02-07', student: 'Tilji Thomas', course: 'Computer Science', year: '4th Year', session: 'Morning', status: 'Present', markedBy: 'Sindhu P' },
  { date: '2025-02-07', student: 'Rahul S', course: 'Mechanical', year: '2nd Year', session: 'Morning', status: 'Late', markedBy: 'Sindhu P' },
  { date: '2025-02-06', student: 'Divya R', course: 'Electronics', year: '3rd Year', session: 'Evening', status: 'Absent', markedBy: 'Anita G' },
  { date: '2025-02-06', student: 'Arjun P', course: 'Computer Science', year: '1st Year', session: 'Evening', status: 'Present', markedBy: 'Anita G' }
];

export default function StaffAttendance() {
  const [tab, setTab] = useState('mark');

  return (
    <ComponentsWrapper title="Student Attendance">
      <PresentationCard>
        <Stack spacing={3}>
          <Tabs value={tab} onChange={(_e, value) => setTab(value)}>
            <Tab value="mark" label="Mark Attendance" />
            <Tab value="view" label="View Attendance" />
          </Tabs>

          <TabPanel value={tab} index="mark">
            <Grid container spacing={3}>
              <Grid size={{ xs: 12, md: 7 }}>
                <Typography variant="subtitle1" gutterBottom>
                  Mark student attendance
                </Typography>
                <Stack spacing={2}>
                  <TextField label="Student ID" placeholder="Enter admission number" fullWidth />
                  <TextField label="Student name" placeholder="Search by name" fullWidth />
                  <Grid container spacing={2}>
                    <Grid size={{ xs: 12, md: 6 }}>
                      <TextField select label="Course" fullWidth defaultValue="Computer Science">
                        {['Computer Science', 'Mechanical', 'Electronics', 'Civil', 'Business'].map((option) => (
                          <MenuItem key={option} value={option}>
                            {option}
                          </MenuItem>
                        ))}
                      </TextField>
                    </Grid>
                    <Grid size={{ xs: 12, md: 6 }}>
                      <TextField select label="Year" fullWidth defaultValue="4th Year">
                        {['1st Year', '2nd Year', '3rd Year', '4th Year'].map((option) => (
                          <MenuItem key={option} value={option}>
                            {option}
                          </MenuItem>
                        ))}
                      </TextField>
                    </Grid>
                  </Grid>
                  <Grid container spacing={2}>
                    <Grid size={{ xs: 12, md: 6 }}>
                      <TextField type="date" label="Date" InputLabelProps={{ shrink: true }} fullWidth />
                    </Grid>
                    <Grid size={{ xs: 12, md: 6 }}>
                      <TextField select label="Session" fullWidth defaultValue="Morning">
                        {['Morning', 'Afternoon', 'Evening', 'Night'].map((session) => (
                          <MenuItem key={session} value={session}>
                            {session}
                          </MenuItem>
                        ))}
                      </TextField>
                    </Grid>
                  </Grid>
                  <TextField select label="Status" fullWidth defaultValue="Present">
                    {['Present', 'Late', 'Absent', 'On Leave'].map((status) => (
                      <MenuItem key={status} value={status}>
                        {status}
                      </MenuItem>
                    ))}
                  </TextField>
                  <TextField label="Notes" placeholder="Add remarks (optional)" multiline rows={3} />
                  <Button variant="contained">Save attendance</Button>
                </Stack>
              </Grid>
              <Grid size={{ xs: 12, md: 5 }}>
                <Typography variant="subtitle1" gutterBottom>
                  Quick reference
                </Typography>
                <Stack spacing={1}>
                  <TextField type="date" label="Reference date" InputLabelProps={{ shrink: true }} fullWidth />
                  <TextField select label="Filter by status" fullWidth defaultValue="All">
                    {['All', 'Present', 'Late', 'Absent', 'On Leave'].map((status) => (
                      <MenuItem key={status} value={status}>
                        {status}
                      </MenuItem>
                    ))}
                  </TextField>
                  <TextField
                    placeholder="Search recent entries"
                    InputProps={{ startAdornment: <InputAdornment position="start"><IconSearch size={18} /></InputAdornment> }}
                    fullWidth
                  />
                </Stack>
              </Grid>
            </Grid>
          </TabPanel>

          <TabPanel value={tab} index="view">
            <Stack spacing={2}>
              <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
                <TextField type="date" label="From" InputLabelProps={{ shrink: true }} fullWidth />
                <TextField type="date" label="To" InputLabelProps={{ shrink: true }} fullWidth />
                <TextField placeholder="Search by date/status" fullWidth InputProps={{ startAdornment: <InputAdornment position="start"><IconSearch size={18} /></InputAdornment> }} />
              </Stack>
              <Paper variant="outlined">
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Date</TableCell>
                      <TableCell>Student</TableCell>
                      <TableCell>Course / Year</TableCell>
                      <TableCell>Session</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Marked By</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {attendanceLog.map((row) => (
                      <TableRow key={`${row.date}-${row.student}`}>
                        <TableCell>{row.date}</TableCell>
                        <TableCell>{row.student}</TableCell>
                        <TableCell>{`${row.course} / ${row.year}`}</TableCell>
                        <TableCell>{row.session}</TableCell>
                        <TableCell>{row.status}</TableCell>
                        <TableCell>{row.markedBy}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Paper>
            </Stack>
          </TabPanel>
        </Stack>
      </PresentationCard>
    </ComponentsWrapper>
  );
}


