import { useState, useEffect } from 'react';

// @mui
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import Grid from '@mui/material/Grid';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Avatar from '@mui/material/Avatar';
import AvatarGroup from '@mui/material/AvatarGroup';
import Divider from '@mui/material/Divider';
import LinearProgress from '@mui/material/LinearProgress';
import { useSnackbar } from 'notistack';

// @project
import ComponentsWrapper from '@/components/ComponentsWrapper';
import PresentationCard from '@/components/cards/PresentationCard';
import adminService from '@/services/adminService';

// @icons
import { 
  IconUsers, 
  IconBrain, 
  IconRefresh, 
  IconHome, 
  IconCheck, 
  IconX,
  IconSparkles,
  IconUser
} from '@tabler/icons-react';

/***************************  ROOMMATE MATCHING POOL  ***************************/

function TabPanel({ children, value, index, ...other }) {
  return (
    <div role="tabpanel" hidden={value !== index} {...other}>
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );
}

export default function RoommateMatchingPool() {
  const { enqueueSnackbar } = useSnackbar();
  const [loading, setLoading] = useState(true);
  const [tabValue, setTabValue] = useState(0);
  const [students, setStudents] = useState([]);
  const [matchedGroups, setMatchedGroups] = useState([]);
  const [activeGroups, setActiveGroups] = useState([]);
  const [allocatedGroups, setAllocatedGroups] = useState([]);
  const [runningAI, setRunningAI] = useState(false);

  useEffect(() => {
    fetchMatchingPoolData();
    // Auto-refresh every 30 seconds for real-time updates
    const interval = setInterval(fetchMatchingPoolData, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchMatchingPoolData = async () => {
    try {
      setLoading(true);
      
      // Fetch students from the matching pool collection (students who are looking for roommates)
      const poolEntries = await adminService.getMatchingPool({ status: 'active' });
      
      // Extract student data from pool entries
      const poolStudents = poolEntries.map(entry => entry.student).filter(Boolean);
      
      // Also fetch students who don't have a room and aren't in a group
      // (they might not be in the formal matching pool but are eligible)
      let eligibleStudents = [];
      try {
        const studentsResponse = await adminService.getAllStudents({ 
          page: 1,
          limit: 1000 // Get all students
        });
        
        // Filter students who don't have a room or temporaryRoom and aren't in a group
        eligibleStudents = (studentsResponse.students || []).filter(student => 
          !student.room && 
          !student.temporaryRoom && 
          !student.roommateGroup &&
          student.status === 'active'
        );
      } catch (err) {
        console.error('Error fetching eligible students:', err);
      }
      
      // Combine pool students and eligible students (remove duplicates)
      const allStudentIds = new Set();
      const combinedStudents = [];
      
      [...poolStudents, ...eligibleStudents].forEach(student => {
        if (student && !allStudentIds.has(student._id)) {
          allStudentIds.add(student._id);
          combinedStudents.push(student);
        }
      });
      
      setStudents(combinedStudents);
      
      // Fetch all roommate groups
      const groupsResponse = await adminService.getRoommateGroups();
      
      // Separate groups by status
      const groups = groupsResponse.groups || [];
      setActiveGroups(groups.filter(g => 
        g.status === 'pending' || 
        g.status === 'confirmed' || 
        g.status === 'roommate_confirmed'
      ));
      setMatchedGroups(groups.filter(g => 
        g.matchType === 'ai' && 
        (g.status === 'pending' || g.status === 'confirmed' || g.status === 'roommate_confirmed')
      ));
      setAllocatedGroups(groups.filter(g => 
        g.status === 'room_selected' || 
        g.status === 'payment_pending' || 
        g.status === 'confirmed'
      ));
      
    } catch (err) {
      console.error('Fetch matching pool error:', err);
      enqueueSnackbar(err.response?.data?.message || 'Failed to load matching pool data', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleRunAIMatching = async () => {
    try {
      setRunningAI(true);
      await adminService.runAIMatching();
      enqueueSnackbar('AI matching completed successfully!', { variant: 'success' });
      await fetchMatchingPoolData();
    } catch (err) {
      enqueueSnackbar(err.response?.data?.message || 'Failed to run AI matching', { variant: 'error' });
    } finally {
      setRunningAI(false);
    }
  };

  const getCompatibilityColor = (score) => {
    if (score >= 80) return 'success';
    if (score >= 60) return 'info';
    if (score >= 40) return 'warning';
    return 'error';
  };

  const getCompatibilityLabel = (score) => {
    if (score >= 80) return 'Excellent Match';
    if (score >= 60) return 'Good Match';
    if (score >= 40) return 'Fair Match';
    return 'Poor Match';
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <ComponentsWrapper>
      <Stack spacing={3}>
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box>
            <Typography variant="h4">Roommate Matching Pool</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              AI-powered roommate matching and group management
            </Typography>
          </Box>
          <Stack direction="row" spacing={2}>
            <Button
              variant="outlined"
              startIcon={<IconRefresh size={18} />}
              onClick={fetchMatchingPoolData}
            >
              Refresh
            </Button>
            <Button
              variant="contained"
              startIcon={runningAI ? <CircularProgress size={18} /> : <IconBrain size={18} />}
              onClick={handleRunAIMatching}
              disabled={runningAI || students.length === 0}
            >
              {runningAI ? 'Running AI...' : 'Run AI Matching'}
            </Button>
          </Stack>
        </Box>

        {/* Statistics */}
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ p: 2, bgcolor: 'primary.lighter' }}>
              <Stack direction="row" spacing={2} alignItems="center">
                <Avatar sx={{ bgcolor: 'primary.main' }}>
                  <IconUsers />
                </Avatar>
                <Box>
                  <Typography variant="h4">{students.length}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Students in Pool
                  </Typography>
                </Box>
              </Stack>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ p: 2, bgcolor: 'success.lighter' }}>
              <Stack direction="row" spacing={2} alignItems="center">
                <Avatar sx={{ bgcolor: 'success.main' }}>
                  <IconSparkles />
                </Avatar>
                <Box>
                  <Typography variant="h4">{matchedGroups.length}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    AI Matched Groups
                  </Typography>
                </Box>
              </Stack>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ p: 2, bgcolor: 'info.lighter' }}>
              <Stack direction="row" spacing={2} alignItems="center">
                <Avatar sx={{ bgcolor: 'info.main' }}>
                  <IconUsers />
                </Avatar>
                <Box>
                  <Typography variant="h4">{activeGroups.length}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Active Groups
                  </Typography>
                </Box>
              </Stack>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ p: 2, bgcolor: 'warning.lighter' }}>
              <Stack direction="row" spacing={2} alignItems="center">
                <Avatar sx={{ bgcolor: 'warning.main' }}>
                  <IconHome />
                </Avatar>
                <Box>
                  <Typography variant="h4">{allocatedGroups.length}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Allocated Groups
                  </Typography>
                </Box>
              </Stack>
            </Card>
          </Grid>
        </Grid>

        {/* Tabs */}
        <PresentationCard>
          <Tabs value={tabValue} onChange={(e, newValue) => setTabValue(newValue)}>
            <Tab label={`Active Pool (${students.length})`} icon={<IconUsers size={18} />} iconPosition="start" />
            <Tab label={`AI Matched (${matchedGroups.length})`} icon={<IconBrain size={18} />} iconPosition="start" />
            <Tab label={`All Groups (${activeGroups.length})`} icon={<IconUsers size={18} />} iconPosition="start" />
          </Tabs>

          {/* Active Pool Tab */}
          <TabPanel value={tabValue} index={0}>
            {students.length === 0 ? (
              <Alert severity="info">
                No active students in matching pool. Students will appear here when they:
                <ul style={{ marginTop: '8px', marginBottom: 0 }}>
                  <li>Have not selected a room yet</li>
                  <li>Are not part of any roommate group</li>
                  <li>Have their student profile active</li>
                </ul>
              </Alert>
            ) : (
              <Grid container spacing={2}>
                {students.map((student) => (
                  <Grid item xs={12} sm={6} md={4} key={student._id}>
                    <Card variant="outlined" sx={{ p: 2 }}>
                      <Stack spacing={2}>
                        <Stack direction="row" spacing={2} alignItems="center">
                          <Avatar>{student.name?.charAt(0)}</Avatar>
                          <Box flex={1}>
                            <Typography variant="subtitle1" fontWeight={600}>
                              {student.name}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {student.studentId} • {student.course}
                            </Typography>
                          </Box>
                          <Chip 
                            label={student.gender} 
                            size="small" 
                            color={student.gender === 'Boys' ? 'primary' : 'secondary'} 
                          />
                        </Stack>
                        <Divider />
                        <Typography variant="caption" color="text.secondary">
                          AI Preferences:
                        </Typography>
                        <Stack spacing={0.5}>
                          {student.aiPreferences?.sleepSchedule && (
                            <Chip label={`Sleep: ${student.aiPreferences.sleepSchedule}`} size="small" variant="outlined" />
                          )}
                          {student.aiPreferences?.cleanliness && (
                            <Chip label={`Cleanliness: ${student.aiPreferences.cleanliness}`} size="small" variant="outlined" />
                          )}
                          {student.aiPreferences?.studyHabits && (
                            <Chip label={`Study: ${student.aiPreferences.studyHabits}`} size="small" variant="outlined" />
                          )}
                        </Stack>
                      </Stack>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            )}
          </TabPanel>

          {/* AI Matched Tab */}
          <TabPanel value={tabValue} index={1}>
            {matchedGroups.length === 0 ? (
              <Alert severity="info" icon={<IconBrain />}>
                No AI-matched groups yet. Click "Run AI Matching" to create compatible roommate groups automatically.
              </Alert>
            ) : (
              <Stack spacing={2}>
                {matchedGroups.map((group) => (
                  <Card key={group._id} variant="outlined" sx={{ p: 3 }}>
                    <Stack spacing={2}>
                      <Stack direction="row" justifyContent="space-between" alignItems="center">
                        <Stack direction="row" spacing={2} alignItems="center">
                          <Avatar sx={{ bgcolor: 'success.main' }}>
                            <IconSparkles />
                          </Avatar>
                          <Box>
                            <Typography variant="h6">
                              AI Matched Group - {group.roomType}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              Created: {new Date(group.createdAt).toLocaleDateString()}
                            </Typography>
                          </Box>
                        </Stack>
                        <Stack direction="row" spacing={1} alignItems="center">
                          <Chip 
                            label={getCompatibilityLabel(group.compatibilityScore || 70)} 
                            color={getCompatibilityColor(group.compatibilityScore || 70)}
                            icon={<IconCheck size={16} />}
                          />
                          <Box sx={{ minWidth: 100 }}>
                            <Typography variant="caption" color="text.secondary">
                              Compatibility
                            </Typography>
                            <LinearProgress 
                              variant="determinate" 
                              value={group.compatibilityScore || 70} 
                              color={getCompatibilityColor(group.compatibilityScore || 70)}
                              sx={{ height: 8, borderRadius: 1 }}
                            />
                            <Typography variant="caption" fontWeight={600}>
                              {group.compatibilityScore || 70}%
                            </Typography>
                          </Box>
                        </Stack>
                      </Stack>

                      <Divider />

                      <Grid container spacing={2}>
                        {group.members?.map((member) => (
                          <Grid item xs={12} sm={6} md={3} key={member._id}>
                            <Card variant="outlined" sx={{ p: 2, bgcolor: 'grey.50' }}>
                              <Stack spacing={1}>
                                <Stack direction="row" spacing={1} alignItems="center">
                                  <Avatar sx={{ width: 32, height: 32 }}>
                                    {member.name?.charAt(0)}
                                  </Avatar>
                                  <Box flex={1}>
                                    <Typography variant="body2" fontWeight={600}>
                                      {member.name}
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary">
                                      {member.studentId}
                                    </Typography>
                                  </Box>
                                </Stack>
                                <Typography variant="caption" color="text.secondary">
                                  {member.course} • Year {member.year}
                                </Typography>
                              </Stack>
                            </Card>
                          </Grid>
                        ))}
                      </Grid>
                    </Stack>
                  </Card>
                ))}
              </Stack>
            )}
          </TabPanel>

          {/* All Groups Tab */}
          <TabPanel value={tabValue} index={2}>
            {activeGroups.length === 0 ? (
              <Alert severity="info">
                No active groups. Groups will appear here when students create or get matched into roommate groups.
              </Alert>
            ) : (
              <Stack spacing={2}>
                {activeGroups.map((group) => (
                  <Card key={group._id} variant="outlined" sx={{ p: 2 }}>
                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                      <Stack direction="row" spacing={2} alignItems="center">
                        <AvatarGroup max={4}>
                          {group.members?.map((member) => (
                            <Avatar key={member._id} title={member.name}>
                              {member.name?.charAt(0)}
                            </Avatar>
                          ))}
                        </AvatarGroup>
                        <Box>
                          <Typography variant="subtitle1" fontWeight={600}>
                            {group.roomType} Group ({group.members?.length} members)
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Leader: {group.createdBy?.name} • Status: {group.status}
                          </Typography>
                        </Box>
                      </Stack>
                      <Stack direction="row" spacing={1}>
                        <Chip 
                          label={group.matchType === 'ai' ? 'AI Matched' : 'Manual'} 
                          size="small"
                          color={group.matchType === 'ai' ? 'success' : 'default'}
                          icon={group.matchType === 'ai' ? <IconBrain size={14} /> : <IconUser size={14} />}
                        />
                        <Chip 
                          label={group.status} 
                          size="small"
                          color={
                            group.status === 'confirmed' ? 'success' : 
                            group.status === 'room_selected' ? 'info' : 
                            'default'
                          }
                        />
                        {group.selectedRoom && (
                          <Chip 
                            label={`Room: ${group.selectedRoom.roomNumber}`} 
                            size="small"
                            color="primary"
                            icon={<IconHome size={14} />}
                          />
                        )}
                      </Stack>
                    </Stack>
                  </Card>
                ))}
              </Stack>
            )}
          </TabPanel>
        </PresentationCard>
      </Stack>
    </ComponentsWrapper>
  );
}

