import { useEffect, useMemo, useState } from 'react';

// @mui
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Grid from '@mui/material/Grid';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import Divider from '@mui/material/Divider';
import Paper from '@mui/material/Paper';
import Box from '@mui/material/Box';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';

// @icons
import { IconArrowLeft, IconEdit, IconTrash, IconChartBar } from '@tabler/icons-react';

// @project
import ComponentsWrapper from '@/components/ComponentsWrapper';
import PresentationCard from '@/components/cards/PresentationCard';
import adminService from '@/services/adminService';
import { useRouter } from '@/utils/navigation';
import TabPanel from '@/components/TabPanel';

/***************************  VIEW STUDENT PAGE  ***************************/

export default function ViewStudentPage() {
  const router = useRouter();
  const { studentId } = router.params || {};
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tab, setTab] = useState(0);
  const [reportLoading, setReportLoading] = useState(false);
  const [feeReport, setFeeReport] = useState(null);
  const [attendanceReport, setAttendanceReport] = useState(null);
  const [complaintReport, setComplaintReport] = useState(null);
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [complaints, setComplaints] = useState([]);

  useEffect(() => {
    if (!studentId) {
      setError('Invalid student id.');
      setLoading(false);
      return;
    }

    const fetchStudent = async () => {
      try {
        setLoading(true);
        const data = await adminService.getStudentById(studentId);
        setStudent(data);
        setError('');
      } catch (err) {
        console.error('Error fetching student', err);
        setError(err.response?.data?.message || 'Failed to load student details.');
      } finally {
        setLoading(false);
      }
    };

    fetchStudent();
  }, [studentId]);

  // Load per-student reports when switching tabs
  useEffect(() => {
    const fetchReports = async () => {
      if (!student?._id) return;
      try {
        setReportLoading(true);
        const studentMongoId = student._id;

        // Overview: load all summaries so we can show a quick snapshot
        if (tab === 0) {
          // Fees
          const feeRes = await adminService.getAllFees({ student: studentMongoId, limit: 100 });
          const fees = feeRes?.fees || [];
          const total = fees.reduce((sum, f) => sum + (f.amount || 0), 0);
          const paid = fees.reduce((sum, f) => sum + (f.paidAmount || 0), 0);
          setFeeReport({ total, paid, pending: total - paid, items: fees });

          // Attendance (last 30 days)
          const endDate = new Date();
          const startDate = new Date();
          startDate.setDate(startDate.getDate() - 30);
          const attendance = await adminService.getAttendance({
            type: 'student',
            student: studentMongoId,
            startDate: startDate.toISOString().split('T')[0],
            endDate: endDate.toISOString().split('T')[0]
          });
          const records = Array.isArray(attendance) ? attendance : attendance?.records || [];
          setAttendanceRecords(records);
          const present = records.filter(a => a.status === 'present').length;
          const windowDays = 30;
          const totalDays = windowDays;
          const percentage = totalDays > 0 ? ((present / totalDays) * 100).toFixed(1) : 0;
          setAttendanceReport({
            windowDays,
            totalDays,
            present,
            percentage: parseFloat(percentage)
          });

          // Complaints
          const allComplaints = await adminService.getAllComplaints();
          const studentComplaints = (Array.isArray(allComplaints) ? allComplaints : []).filter(
            (c) => c.student?._id === studentMongoId || c.student === studentMongoId
          );
          setComplaints(studentComplaints);
          const resolved = studentComplaints.filter(c => c.status === 'resolved').length;
          const pending = studentComplaints.filter(c => c.status === 'pending' || c.status === 'requested').length;
          setComplaintReport({
            total: studentComplaints.length,
            resolved,
            pending
          });
        } else if (tab === 1) {
          // Fee report for this student
          const feeRes = await adminService.getAllFees({ student: studentMongoId, limit: 100 });
          const fees = feeRes?.fees || [];
          const total = fees.reduce((sum, f) => sum + (f.amount || 0), 0);
          const paid = fees.reduce((sum, f) => sum + (f.paidAmount || 0), 0);
          setFeeReport({ total, paid, pending: total - paid, items: fees });
        } else if (tab === 2) {
          // Attendance report for this student (last 30 days)
          const endDate = new Date();
          const startDate = new Date();
          startDate.setDate(startDate.getDate() - 30);
          const attendance = await adminService.getAttendance({
            type: 'student',
            student: studentMongoId,
            startDate: startDate.toISOString().split('T')[0],
            endDate: endDate.toISOString().split('T')[0]
          });
          const records = Array.isArray(attendance) ? attendance : attendance?.records || [];
          setAttendanceRecords(records);
          const present = records.filter(a => a.status === 'present').length;
          const windowDays = 30;
          const totalDays = windowDays;
          const percentage = totalDays > 0 ? ((present / totalDays) * 100).toFixed(1) : 0;
          setAttendanceReport({
            windowDays,
            totalDays,
            present,
            percentage: parseFloat(percentage)
          });
        } else if (tab === 3) {
          // Complaint report for this student
          const allComplaints = await adminService.getAllComplaints();
          const studentComplaints = (Array.isArray(allComplaints) ? allComplaints : []).filter(
            (c) => c.student?._id === studentMongoId || c.student === studentMongoId
          );
          setComplaints(studentComplaints);
          const resolved = studentComplaints.filter(c => c.status === 'resolved').length;
          const pending = studentComplaints.filter(c => c.status === 'pending' || c.status === 'requested').length;
          setComplaintReport({
            total: studentComplaints.length,
            resolved,
            pending
          });
        }
      } catch (err) {
        console.error('Error loading student reports', err);
      } finally {
        setReportLoading(false);
      }
    };

    if (tab >= 0) {
      fetchReports();
    }
  }, [tab, student]);

  const handleDelete = async () => {
    if (!studentId) return;
    
    // Check if student has a room allocated
    if (student?.room) {
      const roomNumber = student.room?.roomNumber || student.room;
      alert(`Cannot delete student. Student is currently allocated to room ${roomNumber}. Please deallocate the room first.`);
      return;
    }

    if (!window.confirm('Are you sure you want to delete this student?')) return;

    try {
      await adminService.deleteStudent(studentId);
      router.replace('/app/students');
    } catch (err) {
      console.error('Error deleting student', err);
      alert(err.response?.data?.message || 'Failed to delete student');
    }
  };

  const DetailRow = ({ label, value }) => (
    <Grid container spacing={1}>
      <Grid size={{ xs: 12, sm: 4 }}>
        <Typography variant="subtitle2" color="text.secondary">
          {label}
        </Typography>
      </Grid>
      <Grid size={{ xs: 12, sm: 8 }}>
        <Typography variant="body1">{value || '—'}</Typography>
      </Grid>
    </Grid>
  );

  return (
    <ComponentsWrapper title="Student Details">
      <Stack spacing={3}>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Button variant="text" startIcon={<IconArrowLeft size={18} />} onClick={() => router.back()}>
            Back to Students
          </Button>
          <Stack direction="row" spacing={1}>
            <Button
              variant="contained"
              startIcon={<IconEdit size={18} />}
              onClick={() => router.push(`/app/students/${studentId}/edit`)}
              disabled={!studentId}
            >
              Edit
            </Button>
            <Button 
              variant="outlined" 
              color="error" 
              startIcon={<IconTrash size={18} />} 
              onClick={handleDelete}
              disabled={!!student?.room}
              title={student?.room ? `Cannot delete student. Student is allocated to room ${student.room?.roomNumber || student.room}. Please deallocate the room first.` : 'Delete student'}
            >
              Delete
            </Button>
          </Stack>
        </Stack>

        <PresentationCard>
          {loading ? (
            <Stack alignItems="center" sx={{ py: 6 }}>
              <CircularProgress />
            </Stack>
          ) : error ? (
            <Alert severity="error">{error}</Alert>
          ) : (
            <Stack spacing={3}>
              <Paper variant="outlined" sx={{ p: 3 }}>
                <Stack spacing={1}>
                  <Typography variant="h6">{student.name}</Typography>
                  <Stack direction="row" spacing={2} alignItems="center">
                    <Typography variant="body2" color="text.secondary">
                      {student.email}
                    </Typography>
                    <Chip
                      label={student.status || 'active'}
                      color={(student.status || '').toLowerCase() === 'active' ? 'success' : 'default'}
                      size="small"
                    />
                  </Stack>
                </Stack>

                <Divider sx={{ my: 3 }} />
                <Stack spacing={2}>
                  <DetailRow label="Student ID" value={student.studentId} />
                  <DetailRow label="Phone" value={student.phone} />
                  <DetailRow label="Course" value={student.course} />
                  <DetailRow label="Year" value={student.year} />
                  <DetailRow
                    label="Room"
                    value={
                      student.room?.roomNumber
                        ? `${student.room.roomNumber} • ${student.room.building || ''}`
                        : 'Not Allocated'
                    }
                  />
                  <DetailRow label="Address" value={student.address} />
                  <DetailRow
                    label="Date of Birth"
                    value={student.dateOfBirth ? new Date(student.dateOfBirth).toLocaleDateString() : ''}
                  />
                </Stack>
              </Paper>
              <Paper variant="outlined" sx={{ p: 3 }}>
                <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                  Emergency Contact
                </Typography>
                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, sm: 4 }}>
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        Name
                      </Typography>
                      <Typography variant="body1">{student.emergencyContact?.name || '—'}</Typography>
                    </Box>
                  </Grid>
                  <Grid size={{ xs: 12, sm: 4 }}>
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        Phone
                      </Typography>
                      <Typography variant="body1">{student.emergencyContact?.phone || '—'}</Typography>
                    </Box>
                  </Grid>
                  <Grid size={{ xs: 12, sm: 4 }}>
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        Relation
                      </Typography>
                      <Typography variant="body1">{student.emergencyContact?.relation || '—'}</Typography>
                    </Box>
                  </Grid>
                </Grid>
              </Paper>

              {/* Reports Tabs */}
              <Paper variant="outlined" sx={{ p: 3 }}>
                <Stack spacing={2}>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <IconChartBar size={18} />
                    <Typography variant="subtitle1" fontWeight={600}>
                      Student Reports
                    </Typography>
                  </Stack>
                  <Tabs
                    value={tab}
                    onChange={(_, v) => setTab(v)}
                    variant="scrollable"
                    scrollButtons="auto"
                  >
                    <Tab label="Overview" />
                    <Tab label="Fee Report" />
                    <Tab label="Attendance Report" />
                    <Tab label="Complaint Report" />
                  </Tabs>

                  <TabPanel value={tab} index={0}>
                    {reportLoading && !feeReport && !attendanceReport && !complaintReport ? (
                      <Stack alignItems="center" sx={{ py: 3 }}>
                        <CircularProgress size={24} />
                      </Stack>
                    ) : (
                      <Stack spacing={2}>
                        <Typography variant="body2" color="text.secondary">
                          Quick summary of this student's fees, attendance, and complaints.
                        </Typography>
                        <Grid container spacing={2}>
                          <Grid size={{ xs: 12, sm: 4 }}>
                            <Card sx={{ bgcolor: 'grey.50' }}>
                              <CardContent>
                                <Typography variant="caption" color="text.secondary">
                                  Fee Status
                                </Typography>
                                <Typography variant="h6">
                                  ₹{(feeReport?.pending || 0).toLocaleString('en-IN')} pending
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  Total: ₹{(feeReport?.total || 0).toLocaleString('en-IN')}
                                </Typography>
                              </CardContent>
                            </Card>
                          </Grid>
                          <Grid size={{ xs: 12, sm: 4 }}>
                            <Card sx={{ bgcolor: 'success.lighter', color: 'success.main' }}>
                              <CardContent>
                                <Typography variant="caption">
                                  Attendance (last 30 days)
                                </Typography>
                                <Typography variant="h6">
                                  {attendanceReport?.percentage ?? 0}%
                                </Typography>
                                <Typography variant="caption">
                                  Present days: {attendanceReport?.present ?? 0}
                                </Typography>
                              </CardContent>
                            </Card>
                          </Grid>
                          <Grid size={{ xs: 12, sm: 4 }}>
                            <Card sx={{ bgcolor: 'warning.lighter', color: 'warning.main' }}>
                              <CardContent>
                                <Typography variant="caption">
                                  Complaints
                                </Typography>
                                <Typography variant="h6">
                                  {complaintReport?.total ?? 0} total
                                </Typography>
                                <Typography variant="caption">
                                  Pending: {complaintReport?.pending ?? 0}, Resolved: {complaintReport?.resolved ?? 0}
                                </Typography>
                              </CardContent>
                            </Card>
                          </Grid>
                        </Grid>
                      </Stack>
                    )}
                  </TabPanel>

                  <TabPanel value={tab} index={1}>
                    {reportLoading ? (
                      <Stack alignItems="center" sx={{ py: 3 }}>
                        <CircularProgress size={24} />
                      </Stack>
                    ) : !feeReport ? (
                      <Typography variant="body2" color="text.secondary">
                        No fee data available for this student.
                      </Typography>
                    ) : (
                      <Stack spacing={2}>
                        <Grid container spacing={2}>
                          <Grid size={{ xs: 12, sm: 4 }}>
                            <Card sx={{ bgcolor: 'grey.50' }}>
                              <CardContent>
                                <Typography variant="caption" color="text.secondary">
                                  Total Fees
                                </Typography>
                                <Typography variant="h6">
                                  ₹{feeReport.total.toLocaleString('en-IN')}
                                </Typography>
                              </CardContent>
                            </Card>
                          </Grid>
                          <Grid size={{ xs: 12, sm: 4 }}>
                            <Card sx={{ bgcolor: 'success.lighter', color: 'success.main' }}>
                              <CardContent>
                                <Typography variant="caption">
                                  Collected
                                </Typography>
                                <Typography variant="h6">
                                  ₹{feeReport.paid.toLocaleString('en-IN')}
                                </Typography>
                              </CardContent>
                            </Card>
                          </Grid>
                          <Grid size={{ xs: 12, sm: 4 }}>
                            <Card sx={{ bgcolor: 'error.lighter', color: 'error.main' }}>
                              <CardContent>
                                <Typography variant="caption">
                                  Pending
                                </Typography>
                                <Typography variant="h6">
                                  ₹{feeReport.pending.toLocaleString('en-IN')}
                                </Typography>
                              </CardContent>
                            </Card>
                          </Grid>
                        </Grid>

                        {feeReport.items?.length > 0 && (
                          <TableContainer component={Paper} variant="outlined">
                            <Table size="small">
                              <TableHead>
                                <TableRow>
                                  <TableCell><strong>Fee Type</strong></TableCell>
                                  <TableCell><strong>Amount</strong></TableCell>
                                  <TableCell><strong>Status</strong></TableCell>
                                  <TableCell><strong>Due Date</strong></TableCell>
                                </TableRow>
                              </TableHead>
                              <TableBody>
                                {feeReport.items.map((fee) => (
                                  <TableRow key={fee._id}>
                                    <TableCell>{fee.feeType || 'Fee'}</TableCell>
                                    <TableCell>₹{(fee.amount || 0).toLocaleString('en-IN')}</TableCell>
                                    <TableCell>
                                      <Chip
                                        label={fee.status}
                                        size="small"
                                        color={
                                          fee.status === 'paid'
                                            ? 'success'
                                            : fee.status === 'overdue'
                                            ? 'error'
                                            : 'warning'
                                        }
                                      />
                                    </TableCell>
                                    <TableCell>
                                      {fee.dueDate ? new Date(fee.dueDate).toLocaleDateString() : '—'}
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </TableContainer>
                        )}
                      </Stack>
                    )}
                  </TabPanel>

                  <TabPanel value={tab} index={2}>
                    {reportLoading ? (
                      <Stack alignItems="center" sx={{ py: 3 }}>
                        <CircularProgress size={24} />
                      </Stack>
                    ) : !attendanceReport ? (
                      <Typography variant="body2" color="text.secondary">
                        No attendance data available for this student.
                      </Typography>
                    ) : (
                      <Stack spacing={2}>
                        <Grid container spacing={2}>
                          <Grid size={{ xs: 12, sm: 4 }}>
                            <Card sx={{ bgcolor: 'grey.50' }}>
                              <CardContent>
                                <Typography variant="caption" color="text.secondary">
                                  Period
                                </Typography>
                                <Typography variant="h6">
                                  Last {attendanceReport.windowDays} days
                                </Typography>
                              </CardContent>
                            </Card>
                          </Grid>
                          <Grid size={{ xs: 12, sm: 4 }}>
                            <Card sx={{ bgcolor: 'success.lighter', color: 'success.main' }}>
                              <CardContent>
                                <Typography variant="caption">
                                  Present Days
                                </Typography>
                                <Typography variant="h6">
                                  {attendanceReport.present}
                                </Typography>
                              </CardContent>
                            </Card>
                          </Grid>
                          <Grid size={{ xs: 12, sm: 4 }}>
                            <Card sx={{ bgcolor: 'info.lighter', color: 'info.main' }}>
                              <CardContent>
                                <Typography variant="caption">
                                  Attendance %
                                </Typography>
                                <Typography variant="h6">
                                  {attendanceReport.percentage}%
                                </Typography>
                              </CardContent>
                            </Card>
                          </Grid>
                        </Grid>

                        {attendanceRecords.length > 0 && (
                          <TableContainer component={Paper} variant="outlined">
                            <Table size="small">
                              <TableHead>
                                <TableRow>
                                  <TableCell><strong>Date</strong></TableCell>
                                  <TableCell><strong>Status</strong></TableCell>
                                  <TableCell><strong>Check In</strong></TableCell>
                                  <TableCell><strong>Check Out</strong></TableCell>
                                </TableRow>
                              </TableHead>
                              <TableBody>
                                {attendanceRecords.map((rec) => (
                                  <TableRow key={rec._id}>
                                    <TableCell>{rec.date ? new Date(rec.date).toLocaleDateString() : '—'}</TableCell>
                                    <TableCell>
                                      <Chip
                                        label={rec.status}
                                        size="small"
                                        color={rec.status === 'present' ? 'success' : 'error'}
                                      />
                                    </TableCell>
                                    <TableCell>
                                      {rec.checkIn ? new Date(rec.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}
                                    </TableCell>
                                    <TableCell>
                                      {rec.checkOut ? new Date(rec.checkOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </TableContainer>
                        )}
                      </Stack>
                    )}
                  </TabPanel>

                  <TabPanel value={tab} index={3}>
                    {reportLoading ? (
                      <Stack alignItems="center" sx={{ py: 3 }}>
                        <CircularProgress size={24} />
                      </Stack>
                    ) : !complaintReport ? (
                      <Typography variant="body2" color="text.secondary">
                        No complaint data available for this student.
                      </Typography>
                    ) : (
                      <Stack spacing={2}>
                        <Grid container spacing={2}>
                          <Grid size={{ xs: 12, sm: 4 }}>
                            <Card sx={{ bgcolor: 'grey.50' }}>
                              <CardContent>
                                <Typography variant="caption" color="text.secondary">
                                  Total Complaints
                                </Typography>
                                <Typography variant="h6">
                                  {complaintReport.total}
                                </Typography>
                              </CardContent>
                            </Card>
                          </Grid>
                          <Grid size={{ xs: 12, sm: 4 }}>
                            <Card sx={{ bgcolor: 'success.lighter', color: 'success.main' }}>
                              <CardContent>
                                <Typography variant="caption">
                                  Resolved
                                </Typography>
                                <Typography variant="h6">
                                  {complaintReport.resolved}
                                </Typography>
                              </CardContent>
                            </Card>
                          </Grid>
                          <Grid size={{ xs: 12, sm: 4 }}>
                            <Card sx={{ bgcolor: 'warning.lighter', color: 'warning.main' }}>
                              <CardContent>
                                <Typography variant="caption">
                                  Pending
                                </Typography>
                                <Typography variant="h6">
                                  {complaintReport.pending}
                                </Typography>
                              </CardContent>
                            </Card>
                          </Grid>
                        </Grid>

                        {complaints.length > 0 && (
                          <TableContainer component={Paper} variant="outlined">
                            <Table size="small">
                              <TableHead>
                                <TableRow>
                                  <TableCell><strong>Date</strong></TableCell>
                                  <TableCell><strong>Category</strong></TableCell>
                                  <TableCell><strong>Priority</strong></TableCell>
                                  <TableCell><strong>Status</strong></TableCell>
                                </TableRow>
                              </TableHead>
                              <TableBody>
                                {complaints.map((c) => (
                                  <TableRow key={c._id}>
                                    <TableCell>{c.createdAt ? new Date(c.createdAt).toLocaleDateString() : '—'}</TableCell>
                                    <TableCell>{c.category || '—'}</TableCell>
                                    <TableCell>
                                      <Chip
                                        label={c.priority || 'medium'}
                                        size="small"
                                        color={
                                          c.priority === 'high'
                                            ? 'error'
                                            : c.priority === 'low'
                                            ? 'default'
                                            : 'warning'
                                        }
                                      />
                                    </TableCell>
                                    <TableCell>
                                      <Chip
                                        label={c.status || 'pending'}
                                        size="small"
                                        color={
                                          c.status === 'resolved'
                                            ? 'success'
                                            : c.status === 'pending' || c.status === 'requested'
                                            ? 'warning'
                                            : 'default'
                                        }
                                      />
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </TableContainer>
                        )}
                      </Stack>
                    )}
                  </TabPanel>
                </Stack>
              </Paper>
            </Stack>
          )}
        </PresentationCard>
      </Stack>
    </ComponentsWrapper>
  );
}


