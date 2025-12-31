import { useState, useEffect } from 'react';

import Stack from '@mui/material/Stack';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Select from '@mui/material/Select';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import { BarChart } from '@mui/x-charts/BarChart';
import { PieChart } from '@mui/x-charts/PieChart';

import ComponentsWrapper from '@/components/ComponentsWrapper';
import PresentationCard from '@/components/cards/PresentationCard';
import TabPanel from '@/components/TabPanel';
import staffService from '@/services/staffService';
import { useSnackbar } from 'notistack';

const defaultWeeklyMenu = [
  { day: 'Monday', breakfast: 'Poha & Milk', lunch: 'Rice, Dal, Fish curry', dinner: 'Chapati & Paneer' },
  { day: 'Tuesday', breakfast: 'Pancakes', lunch: 'Biriyani', dinner: 'Idiyappam & Stew' },
  { day: 'Wednesday', breakfast: 'Idli & Sambar', lunch: 'Meals with poriyal', dinner: 'Parotta & Kurma' },
  { day: 'Thursday', breakfast: 'Oats & Fruits', lunch: 'Curd rice', dinner: 'Fried rice & Gobi' },
  { day: 'Friday', breakfast: 'Upma', lunch: 'Veg thali', dinner: 'Chicken curry & Rice' }
];

export default function StaffMealPlanner() {
  const { enqueueSnackbar } = useSnackbar();
  const [tab, setTab] = useState('today');
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [preferences, setPreferences] = useState(null);
  const [selectedMealSlot, setSelectedMealSlot] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [reviewDialog, setReviewDialog] = useState({ open: false, suggestion: null });
  const [reviewData, setReviewData] = useState({ status: 'pending', reviewNotes: '' });
  const [dailyMeals, setDailyMeals] = useState([]);
  const [todayMeal, setTodayMeal] = useState(null);

  useEffect(() => {
    if (tab === 'today') {
      fetchTodayMeal();
    } else if (tab === 'week') {
      fetchWeeklyMeals();
    } else if (tab === 'suggestions' || tab === 'preferences') {
      fetchSuggestions();
      fetchPreferences();
    }
  }, [tab, selectedMealSlot, selectedStatus]);

  const fetchSuggestions = async () => {
    try {
      setLoading(true);
      const params = {};
      if (selectedMealSlot !== 'all') params.mealSlot = selectedMealSlot;
      if (selectedStatus !== 'all') params.status = selectedStatus;
      const data = await staffService.getMealSuggestions(params);
      setSuggestions(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to fetch suggestions:', err);
      enqueueSnackbar(err.response?.data?.message || 'Failed to load suggestions', { variant: 'error' });
      setSuggestions([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchPreferences = async () => {
    try {
      const data = await staffService.getMealSuggestionPreferences();
      setPreferences(data);
    } catch (err) {
      console.error('Failed to fetch preferences:', err);
    }
  };

  const fetchTodayMeal = async () => {
    try {
      setLoading(true);
      const today = new Date().toISOString().split('T')[0];
      const meals = await staffService.getDailyMeals({ startDate: today });
      if (meals && meals.length > 0) {
        setTodayMeal(meals[0]);
      } else {
        const dayIndex = new Date().getDay() - 1;
        const fallback = defaultWeeklyMenu[dayIndex >= 0 && dayIndex < 5 ? dayIndex : 0];
        setTodayMeal({
          breakfast: { item: fallback.breakfast },
          lunch: { item: fallback.lunch },
          dinner: { item: fallback.dinner },
          dayOfWeek: fallback.day
        });
      }
    } catch (err) {
      console.error('Failed to fetch today meal:', err);
      const dayIndex = new Date().getDay() - 1;
      const fallback = defaultWeeklyMenu[dayIndex >= 0 && dayIndex < 5 ? dayIndex : 0];
      setTodayMeal({
        breakfast: { item: fallback.breakfast },
        lunch: { item: fallback.lunch },
        dinner: { item: fallback.dinner },
        dayOfWeek: fallback.day
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchWeeklyMeals = async () => {
    try {
      setLoading(true);
      const today = new Date();
      const dayOfWeek = today.getDay();
      const monday = new Date(today);
      monday.setDate(today.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
      monday.setHours(0, 0, 0, 0);

      const sunday = new Date(monday);
      sunday.setDate(monday.getDate() + 6);

      const meals = await staffService.getDailyMeals({
        startDate: monday.toISOString().split('T')[0],
        endDate: sunday.toISOString().split('T')[0]
      });

      const mealsMap = {};
      meals.forEach(meal => {
        mealsMap[meal.dayOfWeek] = meal;
      });

      const weeklyMeals = defaultWeeklyMenu.map(day => {
        if (mealsMap[day.day]) {
          return {
            day: day.day,
            breakfast: mealsMap[day.day].breakfast?.item || day.breakfast,
            lunch: mealsMap[day.day].lunch?.item || day.lunch,
            dinner: mealsMap[day.day].dinner?.item || day.dinner,
            fromSuggestion: {
              breakfast: mealsMap[day.day].breakfast?.suggestedBy,
              lunch: mealsMap[day.day].lunch?.suggestedBy,
              dinner: mealsMap[day.day].dinner?.suggestedBy
            }
          };
        }
        return day;
      });

      setDailyMeals(weeklyMeals);
    } catch (err) {
      console.error('Failed to fetch weekly meals:', err);
      setDailyMeals(defaultWeeklyMenu);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenReview = (suggestion) => {
    setReviewDialog({ open: true, suggestion });
    setReviewData({
      status: suggestion.status || 'pending',
      reviewNotes: suggestion.reviewNotes || ''
    });
  };

  const handleCloseReview = () => {
    setReviewDialog({ open: false, suggestion: null });
    setReviewData({ status: 'pending', reviewNotes: '' });
  };

  const handleUpdateStatus = async () => {
    try {
      await staffService.updateMealSuggestionStatus(reviewDialog.suggestion._id, reviewData);
      enqueueSnackbar('Suggestion status updated successfully', { variant: 'success' });
      handleCloseReview();
      fetchSuggestions();
      fetchPreferences();
    } catch (err) {
      enqueueSnackbar(err.response?.data?.message || 'Failed to update status', { variant: 'error' });
    }
  };

  const filteredSuggestions = suggestions.filter(s => {
    if (selectedMealSlot !== 'all' && s.mealSlot !== selectedMealSlot) return false;
    if (selectedStatus !== 'all' && s.status !== selectedStatus) return false;
    return true;
  });

  return (
    <ComponentsWrapper title="Meal Planner">
      <PresentationCard>
        <Stack spacing={3}>
          <Tabs value={tab} onChange={(_e, value) => setTab(value)}>
            <Tab value="today" label="Today's Menu" />
            <Tab value="week" label="Weekly Menu" />
            <Tab value="suggestions" label="Student Suggestions" />
            <Tab value="preferences" label="Preference Chart" />
          </Tabs>

          <TabPanel value={tab} index="today">
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                <CircularProgress />
              </Box>
            ) : (
              <Grid container spacing={2}>
                {['Breakfast', 'Lunch', 'Dinner'].map((meal) => {
                  const mealKey = meal.toLowerCase();
                  const mealData = todayMeal?.[mealKey];
                  const fromSuggestion = mealData?.suggestedBy;
                  return (
                    <Grid key={meal} size={{ xs: 12, md: 4 }}>
                      <Card 
                        variant="outlined"
                        sx={{
                          bgcolor: fromSuggestion ? 'success.lighter' : 'background.paper',
                          borderColor: fromSuggestion ? 'success.main' : 'divider'
                        }}
                      >
                        <CardContent>
                          <Stack spacing={1}>
                            <Typography variant="subtitle1" fontWeight={600}>{meal}</Typography>
                            <Typography variant="body2" color="text.secondary">
                              {mealData?.item || 'Menu not available'}
                            </Typography>
                            {fromSuggestion && (
                              <Chip 
                                label={`Suggested by ${fromSuggestion.name}`}
                                size="small"
                                color="success"
                              />
                            )}
                          </Stack>
                        </CardContent>
                      </Card>
                    </Grid>
                  );
                })}
              </Grid>
            )}
          </TabPanel>

          <TabPanel value={tab} index="week">
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                <CircularProgress />
              </Box>
            ) : (
              <Stack spacing={2}>
                {(dailyMeals.length > 0 ? dailyMeals : defaultWeeklyMenu).map((day) => (
                  <Card key={day.day} variant="outlined">
                    <CardContent>
                      <Typography variant="subtitle1" fontWeight={600} gutterBottom>{day.day}</Typography>
                      <Stack spacing={1}>
                        <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
                          <Typography variant="body2"><strong>Breakfast:</strong> {day.breakfast}</Typography>
                          {day.fromSuggestion?.breakfast && (
                            <Chip 
                              label={`by ${day.fromSuggestion.breakfast.name}`}
                              size="small"
                              color="success"
                            />
                          )}
                        </Stack>
                        <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
                          <Typography variant="body2"><strong>Lunch:</strong> {day.lunch}</Typography>
                          {day.fromSuggestion?.lunch && (
                            <Chip 
                              label={`by ${day.fromSuggestion.lunch.name}`}
                              size="small"
                              color="success"
                            />
                          )}
                        </Stack>
                        <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
                          <Typography variant="body2"><strong>Dinner:</strong> {day.dinner}</Typography>
                          {day.fromSuggestion?.dinner && (
                            <Chip 
                              label={`by ${day.fromSuggestion.dinner.name}`}
                              size="small"
                              color="success"
                            />
                          )}
                        </Stack>
                      </Stack>
                    </CardContent>
                  </Card>
                ))}
              </Stack>
            )}
          </TabPanel>

          <TabPanel value={tab} index="suggestions">
            <Stack spacing={3}>
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <FormControl fullWidth>
                    <InputLabel>Filter by Meal Slot</InputLabel>
                    <Select
                      value={selectedMealSlot}
                      onChange={(e) => setSelectedMealSlot(e.target.value)}
                      label="Filter by Meal Slot"
                    >
                      <MenuItem value="all">All Slots</MenuItem>
                      <MenuItem value="breakfast">Breakfast</MenuItem>
                      <MenuItem value="lunch">Lunch</MenuItem>
                      <MenuItem value="dinner">Dinner</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <FormControl fullWidth>
                    <InputLabel>Filter by Status</InputLabel>
                    <Select
                      value={selectedStatus}
                      onChange={(e) => setSelectedStatus(e.target.value)}
                      label="Filter by Status"
                    >
                      <MenuItem value="all">All Status</MenuItem>
                      <MenuItem value="pending">Pending</MenuItem>
                      <MenuItem value="reviewed">Reviewed</MenuItem>
                      <MenuItem value="implemented">Implemented</MenuItem>
                      <MenuItem value="rejected">Rejected</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>

              {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                  <CircularProgress />
                </Box>
              ) : filteredSuggestions.length === 0 ? (
                <Alert severity="info">No suggestions found</Alert>
              ) : (
                <Stack spacing={2}>
                  {filteredSuggestions.map((suggestion) => (
                    <Card key={suggestion._id} variant="outlined">
                      <CardContent>
                        <Stack spacing={2}>
                          <Stack direction="row" spacing={1} alignItems="center" justifyContent="space-between" flexWrap="wrap">
                            <Stack direction="row" spacing={1} alignItems="center">
                              <Chip
                                label={suggestion.mealSlot.charAt(0).toUpperCase() + suggestion.mealSlot.slice(1)}
                                size="small"
                                color="primary"
                              />
                              <Chip
                                label={suggestion.status}
                                size="small"
                                color={
                                  suggestion.status === 'implemented' ? 'success' :
                                  suggestion.status === 'rejected' ? 'error' :
                                  suggestion.status === 'reviewed' ? 'info' : 'default'
                                }
                              />
                            </Stack>
                            <Button
                              size="small"
                              variant="outlined"
                              onClick={() => handleOpenReview(suggestion)}
                            >
                              Update Status
                            </Button>
                          </Stack>

                          <Typography variant="body1" fontWeight={500}>
                            {suggestion.suggestion}
                          </Typography>

                          {suggestion.studentIdentity && (
                            <Stack direction="row" spacing={2} flexWrap="wrap">
                              <Typography variant="caption" color="text.secondary">
                                <strong>Student:</strong> {suggestion.studentIdentity.name} ({suggestion.studentIdentity.admissionNumber || suggestion.studentIdentity.studentId || 'N/A'})
                              </Typography>
                              {suggestion.studentIdentity.course && (
                                <Typography variant="caption" color="text.secondary">
                                  <strong>Course:</strong> {suggestion.studentIdentity.course}
                                </Typography>
                              )}
                              {suggestion.studentIdentity.roomNumber && (
                                <Typography variant="caption" color="text.secondary">
                                  <strong>Room:</strong> {suggestion.studentIdentity.roomNumber}
                                  {suggestion.studentIdentity.block && ` (Block ${suggestion.studentIdentity.block})`}
                                </Typography>
                              )}
                            </Stack>
                          )}

                          <Typography variant="caption" color="text.secondary">
                            Submitted: {new Date(suggestion.createdAt).toLocaleString()}
                          </Typography>

                          {suggestion.reviewNotes && (
                            <Alert severity="info">
                              <Typography variant="caption">
                                <strong>Review Note:</strong> {suggestion.reviewNotes}
                              </Typography>
                            </Alert>
                          )}
                        </Stack>
                      </CardContent>
                    </Card>
                  ))}
                </Stack>
              )}
            </Stack>
          </TabPanel>

          <TabPanel value={tab} index="preferences">
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                <CircularProgress />
              </Box>
            ) : !preferences ? (
              <Alert severity="info">No preference data available</Alert>
            ) : (
              <Stack spacing={3}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="h6" gutterBottom>Overall Statistics</Typography>
                    <Grid container spacing={2}>
                      <Grid size={{ xs: 6, sm: 3 }}>
                        <Typography variant="h4" color="primary">
                          {preferences.totalSuggestions || 0}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">Total Suggestions</Typography>
                      </Grid>
                      <Grid size={{ xs: 6, sm: 3 }}>
                        <Typography variant="h4" color="primary">
                          {preferences.uniqueSuggestions || 0}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">Unique Suggestions</Typography>
                      </Grid>
                      <Grid size={{ xs: 6, sm: 3 }}>
                        <Typography variant="h4" color="success.main">
                          {preferences.chartData?.breakfast?.length || 0}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">Breakfast Ideas</Typography>
                      </Grid>
                      <Grid size={{ xs: 6, sm: 3 }}>
                        <Typography variant="h4" color="success.main">
                          {preferences.chartData?.lunch?.length || 0}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">Lunch Ideas</Typography>
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>

                {preferences.chartData && (
                  <Grid container spacing={2}>
                    {['breakfast', 'lunch', 'dinner'].map((slot) => {
                      const slotData = preferences.chartData[slot] || [];
                      if (slotData.length === 0) return null;

                      return (
                        <Grid key={slot} size={{ xs: 12, md: 6 }}>
                          <Card variant="outlined">
                            <CardContent>
                              <Typography variant="h6" gutterBottom>
                                {slot.charAt(0).toUpperCase() + slot.slice(1)} Preferences
                              </Typography>
                              <Box sx={{ width: '100%', height: 300 }}>
                                <BarChart
                                  xAxis={[{
                                    data: slotData.slice(0, 10).map((p, idx) => `Suggestion ${idx + 1}`),
                                    scaleType: 'band'
                                  }]}
                                  series={[{
                                    data: slotData.slice(0, 10).map(p => p.count),
                                    label: 'Number of Requests'
                                  }]}
                                  height={300}
                                />
                              </Box>
                            </CardContent>
                          </Card>
                        </Grid>
                      );
                    })}
                  </Grid>
                )}

                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="h6" gutterBottom>Top Suggestions by Popularity</Typography>
                    <TableContainer component={Paper} elevation={0} sx={{ border: 1, borderColor: 'divider' }}>
                      <Table>
                        <TableHead>
                          <TableRow sx={{ bgcolor: 'grey.50' }}>
                            <TableCell><strong>Meal Slot</strong></TableCell>
                            <TableCell><strong>Suggestion</strong></TableCell>
                            <TableCell align="right"><strong>Requests</strong></TableCell>
                            <TableCell><strong>Requested By</strong></TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {preferences.preferences?.slice(0, 20).map((pref, idx) => (
                            <TableRow key={idx} hover>
                              <TableCell>
                                <Chip
                                  label={pref.mealSlot.charAt(0).toUpperCase() + pref.mealSlot.slice(1)}
                                  size="small"
                                  color="primary"
                                />
                              </TableCell>
                              <TableCell>{pref.suggestion}</TableCell>
                              <TableCell align="right">
                                <Chip label={pref.count} size="small" color="secondary" />
                              </TableCell>
                              <TableCell>
                                <Typography variant="caption">
                                  {pref.students?.slice(0, 3).map(s => s.name).join(', ')}
                                  {pref.students?.length > 3 && ` +${pref.students.length - 3} more`}
                                </Typography>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </CardContent>
                </Card>
              </Stack>
            )}
          </TabPanel>
        </Stack>
      </PresentationCard>

      {/* Review Dialog */}
      <Dialog open={reviewDialog.open} onClose={handleCloseReview} maxWidth="sm" fullWidth>
        <DialogTitle>Update Suggestion Status</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            {reviewDialog.suggestion && (
              <>
                <Typography variant="body2" color="text.secondary">
                  <strong>Suggestion:</strong> {reviewDialog.suggestion.suggestion}
                </Typography>
                {reviewDialog.suggestion.studentIdentity && (
                  <Typography variant="body2" color="text.secondary">
                    <strong>From:</strong> {reviewDialog.suggestion.studentIdentity.name} ({reviewDialog.suggestion.studentIdentity.admissionNumber || reviewDialog.suggestion.studentIdentity.studentId || 'N/A'})
                  </Typography>
                )}
              </>
            )}
            <FormControl fullWidth>
              <InputLabel>Status</InputLabel>
              <Select
                value={reviewData.status}
                onChange={(e) => setReviewData({ ...reviewData, status: e.target.value })}
                label="Status"
              >
                <MenuItem value="pending">Pending</MenuItem>
                <MenuItem value="reviewed">Reviewed</MenuItem>
                <MenuItem value="implemented">Implemented</MenuItem>
                <MenuItem value="rejected">Rejected</MenuItem>
              </Select>
            </FormControl>
            <TextField
              label="Review Notes (Optional)"
              multiline
              rows={3}
              fullWidth
              value={reviewData.reviewNotes}
              onChange={(e) => setReviewData({ ...reviewData, reviewNotes: e.target.value })}
              placeholder="Add any notes about this suggestion..."
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseReview}>Cancel</Button>
          <Button onClick={handleUpdateStatus} variant="contained">Update Status</Button>
        </DialogActions>
      </Dialog>
    </ComponentsWrapper>
  );
}
