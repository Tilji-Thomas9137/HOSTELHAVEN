import { useState, useEffect } from 'react';

// @mui
import Box from '@mui/material/Box';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Chip from '@mui/material/Chip';
import Button from '@mui/material/Button';
import FormControl from '@mui/material/FormControl';
import FormLabel from '@mui/material/FormLabel';
import RadioGroup from '@mui/material/RadioGroup';
import FormControlLabel from '@mui/material/FormControlLabel';
import Radio from '@mui/material/Radio';
import Grid from '@mui/material/Grid';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';
import CircularProgress from '@mui/material/CircularProgress';
import Checkbox from '@mui/material/Checkbox';
import { BarChart } from '@mui/x-charts/BarChart';
import { useTheme } from '@mui/material/styles';

// @project
import ComponentsWrapper from '@/components/ComponentsWrapper';
import PresentationCard from '@/components/cards/PresentationCard';
import TabPanel from '@/components/TabPanel';
import studentService from '@/services/studentService';
import { useSnackbar } from 'notistack';

// @icons
import { IconSoup, IconCalendar, IconSettings, IconBulb } from '@tabler/icons-react';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import Alert from '@mui/material/Alert';

/***************************  MESS & MEAL PLAN PAGE  ***************************/

export default function MessMealPage() {
  const theme = useTheme();
  const { enqueueSnackbar } = useSnackbar();
  const [value, setValue] = useState(0);
  const [loading, setLoading] = useState(true);
  const [mealPreference, setMealPreference] = useState(null);
  const [saving, setSaving] = useState(false);
  const [preferences, setPreferences] = useState({
    breakfast: true,
    lunch: true,
    dinner: true,
    dietaryRestrictions: [],
    allergies: []
  });
  const [mealSuggestion, setMealSuggestion] = useState({
    mealSlot: 'breakfast',
    suggestion: ''
  });
  const [submittingSuggestion, setSubmittingSuggestion] = useState(false);
  const [mySuggestions, setMySuggestions] = useState([]);
  const [todayMenu, setTodayMenu] = useState(null);
  const [weeklyMealPlan, setWeeklyMealPlan] = useState([]);

  useEffect(() => {
    fetchMealPreferences();
    fetchMySuggestions();
    fetchTodayMenu();
    fetchWeeklyMenu();
  }, []);

  const fetchMySuggestions = async () => {
    try {
      const data = await studentService.getMealSuggestions();
      setMySuggestions(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to fetch meal suggestions:', err);
    }
  };

  const fetchTodayMenu = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const meals = await studentService.getDailyMeals({ params: { startDate: today } });
      if (meals && meals.length > 0) {
        const meal = meals[0];
        setTodayMenu({
          breakfast: meal.breakfast?.item || 'Poha, Tea, Bread & Butter',
          lunch: meal.lunch?.item || 'Rice, Dal, Vegetable Curry, Salad, Roti',
          dinner: meal.dinner?.item || 'Rice, Chicken Curry, Vegetable Curry, Salad, Roti',
          fromSuggestion: {
            breakfast: meal.breakfast?.suggestedBy,
            lunch: meal.lunch?.suggestedBy,
            dinner: meal.dinner?.suggestedBy
          }
        });
      } else {
        // Default menu
        setTodayMenu({
          breakfast: 'Poha, Tea, Bread & Butter',
          lunch: 'Rice, Dal, Vegetable Curry, Salad, Roti',
          dinner: 'Rice, Chicken Curry, Vegetable Curry, Salad, Roti'
        });
      }
    } catch (err) {
      console.error('Failed to fetch today menu:', err);
      setTodayMenu({
        breakfast: 'Poha, Tea, Bread & Butter',
        lunch: 'Rice, Dal, Vegetable Curry, Salad, Roti',
        dinner: 'Rice, Chicken Curry, Vegetable Curry, Salad, Roti'
      });
    }
  };

  const fetchWeeklyMenu = async () => {
    try {
      const today = new Date();
      const dayOfWeek = today.getDay();
      const monday = new Date(today);
      monday.setDate(today.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
      monday.setHours(0, 0, 0, 0);

      const sunday = new Date(monday);
      sunday.setDate(monday.getDate() + 6);

      const meals = await studentService.getDailyMeals({
        params: {
          startDate: monday.toISOString().split('T')[0],
          endDate: sunday.toISOString().split('T')[0]
        }
      });

      const defaultMenu = [
        { day: 'Monday', breakfast: 'Poha, Tea', lunch: 'Rice, Dal, Veg Curry', dinner: 'Rice, Chicken, Veg Curry' },
        { day: 'Tuesday', breakfast: 'Idli, Sambar', lunch: 'Rice, Dal, Veg Curry', dinner: 'Rice, Fish, Veg Curry' },
        { day: 'Wednesday', breakfast: 'Paratha, Tea', lunch: 'Rice, Dal, Veg Curry', dinner: 'Rice, Chicken, Veg Curry' },
        { day: 'Thursday', breakfast: 'Dosa, Sambar', lunch: 'Rice, Dal, Veg Curry', dinner: 'Rice, Mutton, Veg Curry' },
        { day: 'Friday', breakfast: 'Upma, Tea', lunch: 'Rice, Dal, Veg Curry', dinner: 'Rice, Chicken, Veg Curry' },
        { day: 'Saturday', breakfast: 'Puri, Aloo', lunch: 'Rice, Dal, Veg Curry', dinner: 'Rice, Fish, Veg Curry' },
        { day: 'Sunday', breakfast: 'Special Breakfast', lunch: 'Special Lunch', dinner: 'Special Dinner' }
      ];

      const mealsMap = {};
      meals.forEach(meal => {
        mealsMap[meal.dayOfWeek] = meal;
      });

      const weeklyMenu = defaultMenu.map(day => {
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

      setWeeklyMealPlan(weeklyMenu);
    } catch (err) {
      console.error('Failed to fetch weekly menu:', err);
      setWeeklyMealPlan([
        { day: 'Monday', breakfast: 'Poha, Tea', lunch: 'Rice, Dal, Veg Curry', dinner: 'Rice, Chicken, Veg Curry' },
        { day: 'Tuesday', breakfast: 'Idli, Sambar', lunch: 'Rice, Dal, Veg Curry', dinner: 'Rice, Fish, Veg Curry' },
        { day: 'Wednesday', breakfast: 'Paratha, Tea', lunch: 'Rice, Dal, Veg Curry', dinner: 'Rice, Chicken, Veg Curry' },
        { day: 'Thursday', breakfast: 'Dosa, Sambar', lunch: 'Rice, Dal, Veg Curry', dinner: 'Rice, Mutton, Veg Curry' },
        { day: 'Friday', breakfast: 'Upma, Tea', lunch: 'Rice, Dal, Veg Curry', dinner: 'Rice, Chicken, Veg Curry' },
        { day: 'Saturday', breakfast: 'Puri, Aloo', lunch: 'Rice, Dal, Veg Curry', dinner: 'Rice, Fish, Veg Curry' },
        { day: 'Sunday', breakfast: 'Special Breakfast', lunch: 'Special Lunch', dinner: 'Special Dinner' }
      ]);
    }
  };

  const handleSubmitSuggestion = async () => {
    if (!mealSuggestion.suggestion.trim()) {
      enqueueSnackbar('Please enter a suggestion', { variant: 'warning' });
      return;
    }

    try {
      setSubmittingSuggestion(true);
      await studentService.submitMealSuggestion(mealSuggestion);
      enqueueSnackbar('Meal suggestion submitted successfully!', { variant: 'success' });
      setMealSuggestion({ mealSlot: 'breakfast', suggestion: '' });
      fetchMySuggestions();
    } catch (err) {
      enqueueSnackbar(err.response?.data?.message || 'Failed to submit suggestion', { variant: 'error' });
    } finally {
      setSubmittingSuggestion(false);
    }
  };

  const fetchMealPreferences = async () => {
    try {
      setLoading(true);
      const data = await studentService.getMealPreferences();
      if (data) {
        setMealPreference(data.dietaryRestrictions?.includes('vegetarian') ? 'veg' : 'nonveg');
        setPreferences({
          breakfast: data.breakfast !== false,
          lunch: data.lunch !== false,
          dinner: data.dinner !== false,
          dietaryRestrictions: data.dietaryRestrictions || [],
          allergies: data.allergies || []
        });
      }
    } catch (err) {
      enqueueSnackbar(err.response?.data?.message || 'Failed to load meal preferences', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (event, newValue) => {
    setValue(newValue);
  };

  const handleSavePreferences = async () => {
    try {
      setSaving(true);
      await studentService.updateMealPreferences({
        breakfast: preferences.breakfast,
        lunch: preferences.lunch,
        dinner: preferences.dinner,
        dietaryRestrictions: mealPreference === 'veg' ? ['vegetarian'] : [],
        allergies: preferences.allergies
      });
      enqueueSnackbar('Meal preferences updated successfully', { variant: 'success' });
    } catch (err) {
      enqueueSnackbar(err.response?.data?.message || 'Failed to update meal preferences', { variant: 'error' });
    } finally {
      setSaving(false);
    }
  };


  // Meal preference chart data
  const mealPreferenceData = {
    categories: ['Vegetarian', 'Non-Vegetarian'],
    counts: mealPreference === 'veg' ? [1, 0] : mealPreference === 'nonveg' ? [0, 1] : [0, 0]
  };

  return (
    <ComponentsWrapper title="Mess & Meal Plan">
      <Box sx={{ width: '100%' }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
          <Tabs value={value} onChange={handleChange}>
            <Tab label="Today's Menu" icon={<IconSoup size={18} />} iconPosition="start" />
            <Tab label="Weekly Meal Plan" icon={<IconCalendar size={18} />} iconPosition="start" />
            <Tab label="Meal Preference" icon={<IconSettings size={18} />} iconPosition="start" />
            <Tab label="Meal Suggestions" icon={<IconBulb size={18} />} iconPosition="start" />
          </Tabs>
        </Box>

        {/* Today's Menu Tab */}
        <TabPanel value={value} index={0}>
          <PresentationCard>
            <Stack spacing={3}>
              <Typography variant="h6">Today's Menu - {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</Typography>
              
              {/* Display Student's Meal Preferences */}
              {!loading && preferences && (preferences.dietaryRestrictions.length > 0 || preferences.allergies.length > 0 || mealPreference) && (
                <Alert severity="info" sx={{ bgcolor: 'primary.lighter' }}>
                  <Stack spacing={1}>
                    <Typography variant="subtitle2" fontWeight={600}>Your Meal Preferences:</Typography>
                    <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                      {mealPreference && (
                        <Chip 
                          label={mealPreference === 'veg' ? 'Vegetarian' : 'Non-Vegetarian'} 
                          size="small"
                          color={mealPreference === 'veg' ? 'success' : 'primary'}
                        />
                      )}
                      {preferences.dietaryRestrictions.map((restriction, idx) => (
                        <Chip 
                          key={idx}
                          label={restriction.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())} 
                          size="small"
                          color="info"
                        />
                      ))}
                      {preferences.allergies.map((allergy, idx) => (
                        <Chip 
                          key={idx}
                          label={`⚠️ ${allergy}`} 
                          size="small"
                          color="warning"
                        />
                      ))}
                    </Stack>
                    <Typography variant="caption" color="text.secondary">
                      Meals opted: {[
                        preferences.breakfast && 'Breakfast',
                        preferences.lunch && 'Lunch',
                        preferences.dinner && 'Dinner'
                      ].filter(Boolean).join(', ') || 'None'}
                    </Typography>
                  </Stack>
                </Alert>
              )}
              
              {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                  <CircularProgress />
                </Box>
              ) : (
                <>
                  <Card 
                    variant="outlined" 
                    sx={{ 
                      p: 2,
                      bgcolor: todayMenu?.fromSuggestion?.breakfast ? 'success.lighter' : 'background.paper',
                      borderColor: todayMenu?.fromSuggestion?.breakfast ? 'success.main' : 'divider',
                      opacity: preferences.breakfast ? 1 : 0.5
                    }}
                  >
                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Typography variant="subtitle1" gutterBottom fontWeight={600}>Breakfast</Typography>
                      {!preferences.breakfast && (
                        <Chip label="Not Opted" size="small" color="default" variant="outlined" />
                      )}
                    </Stack>
                    <Typography variant="body2" color="text.secondary">{todayMenu?.breakfast || 'Menu not available'}</Typography>
                    {todayMenu?.fromSuggestion?.breakfast && (
                      <Chip 
                        label={`Suggested by ${todayMenu.fromSuggestion.breakfast.name}`}
                        size="small"
                        color="success"
                        sx={{ mt: 1 }}
                      />
                    )}
                  </Card>

                  <Card 
                    variant="outlined" 
                    sx={{ 
                      p: 2,
                      bgcolor: todayMenu?.fromSuggestion?.lunch ? 'success.lighter' : 'background.paper',
                      borderColor: todayMenu?.fromSuggestion?.lunch ? 'success.main' : 'divider',
                      opacity: preferences.lunch ? 1 : 0.5
                    }}
                  >
                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Typography variant="subtitle1" gutterBottom fontWeight={600}>Lunch</Typography>
                      {!preferences.lunch && (
                        <Chip label="Not Opted" size="small" color="default" variant="outlined" />
                      )}
                    </Stack>
                    <Typography variant="body2" color="text.secondary">{todayMenu?.lunch || 'Menu not available'}</Typography>
                    {todayMenu?.fromSuggestion?.lunch && (
                      <Chip 
                        label={`Suggested by ${todayMenu.fromSuggestion.lunch.name}`}
                        size="small"
                        color="success"
                        sx={{ mt: 1 }}
                      />
                    )}
                  </Card>

                  <Card 
                    variant="outlined" 
                    sx={{ 
                      p: 2,
                      bgcolor: todayMenu?.fromSuggestion?.dinner ? 'success.lighter' : 'background.paper',
                      borderColor: todayMenu?.fromSuggestion?.dinner ? 'success.main' : 'divider',
                      opacity: preferences.dinner ? 1 : 0.5
                    }}
                  >
                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Typography variant="subtitle1" gutterBottom fontWeight={600}>Dinner</Typography>
                      {!preferences.dinner && (
                        <Chip label="Not Opted" size="small" color="default" variant="outlined" />
                      )}
                    </Stack>
                    <Typography variant="body2" color="text.secondary">{todayMenu?.dinner || 'Menu not available'}</Typography>
                    {todayMenu?.fromSuggestion?.dinner && (
                      <Chip 
                        label={`Suggested by ${todayMenu.fromSuggestion.dinner.name}`}
                        size="small"
                        color="success"
                        sx={{ mt: 1 }}
                      />
                    )}
                  </Card>
                </>
              )}
            </Stack>
          </PresentationCard>
        </TabPanel>

        {/* Weekly Meal Plan Tab */}
        <TabPanel value={value} index={1}>
          <PresentationCard>
            <Stack spacing={3}>
              {/* Display Student's Meal Preferences */}
              {!loading && preferences && (preferences.dietaryRestrictions.length > 0 || preferences.allergies.length > 0 || mealPreference) && (
                <Alert severity="info" sx={{ bgcolor: 'primary.lighter' }}>
                  <Stack spacing={1}>
                    <Typography variant="subtitle2" fontWeight={600}>Your Meal Preferences:</Typography>
                    <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                      {mealPreference && (
                        <Chip 
                          label={mealPreference === 'veg' ? 'Vegetarian' : 'Non-Vegetarian'} 
                          size="small"
                          color={mealPreference === 'veg' ? 'success' : 'primary'}
                        />
                      )}
                      {preferences.dietaryRestrictions.map((restriction, idx) => (
                        <Chip 
                          key={idx}
                          label={restriction.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())} 
                          size="small"
                          color="info"
                        />
                      ))}
                      {preferences.allergies.map((allergy, idx) => (
                        <Chip 
                          key={idx}
                          label={`⚠️ ${allergy}`} 
                          size="small"
                          color="warning"
                        />
                      ))}
                    </Stack>
                    <Typography variant="caption" color="text.secondary">
                      Meals opted: {[
                        preferences.breakfast && 'Breakfast',
                        preferences.lunch && 'Lunch',
                        preferences.dinner && 'Dinner'
                      ].filter(Boolean).join(', ') || 'None'}
                    </Typography>
                  </Stack>
                </Alert>
              )}
              
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                <CircularProgress />
              </Box>
            ) : (
              <TableContainer component={Paper} elevation={0} sx={{ border: 1, borderColor: 'divider', borderRadius: 2 }}>
                <Table>
                  <TableHead>
                    <TableRow sx={{ bgcolor: 'grey.50' }}>
                      <TableCell><strong>Day</strong></TableCell>
                      <TableCell><strong>Breakfast</strong></TableCell>
                      <TableCell><strong>Lunch</strong></TableCell>
                      <TableCell><strong>Dinner</strong></TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {weeklyMealPlan.map((meal, index) => (
                      <TableRow key={index} hover>
                        <TableCell><strong>{meal.day}</strong></TableCell>
                          <TableCell sx={{ opacity: preferences.breakfast ? 1 : 0.5 }}>
                          <Stack spacing={0.5}>
                            <Typography variant="body2">{meal.breakfast}</Typography>
                              {!preferences.breakfast && (
                                <Chip label="Not Opted" size="small" color="default" variant="outlined" />
                              )}
                            {meal.fromSuggestion?.breakfast && (
                              <Chip 
                                label={`by ${meal.fromSuggestion.breakfast.name}`}
                                size="small"
                                color="success"
                              />
                            )}
                          </Stack>
                        </TableCell>
                          <TableCell sx={{ opacity: preferences.lunch ? 1 : 0.5 }}>
                          <Stack spacing={0.5}>
                            <Typography variant="body2">{meal.lunch}</Typography>
                              {!preferences.lunch && (
                                <Chip label="Not Opted" size="small" color="default" variant="outlined" />
                              )}
                            {meal.fromSuggestion?.lunch && (
                              <Chip 
                                label={`by ${meal.fromSuggestion.lunch.name}`}
                                size="small"
                                color="success"
                              />
                            )}
                          </Stack>
                        </TableCell>
                          <TableCell sx={{ opacity: preferences.dinner ? 1 : 0.5 }}>
                          <Stack spacing={0.5}>
                            <Typography variant="body2">{meal.dinner}</Typography>
                              {!preferences.dinner && (
                                <Chip label="Not Opted" size="small" color="default" variant="outlined" />
                              )}
                            {meal.fromSuggestion?.dinner && (
                              <Chip 
                                label={`by ${meal.fromSuggestion.dinner.name}`}
                                size="small"
                                color="success"
                              />
                            )}
                          </Stack>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
            </Stack>
          </PresentationCard>
        </TabPanel>

        {/* Meal Preference Tab */}
        <TabPanel value={value} index={2}>
          <PresentationCard>
            <Stack spacing={3}>
              <Typography variant="h6">Select Your Meal Preference</Typography>
              
              {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                  <CircularProgress />
                </Box>
              ) : (
                <>
                  <FormControl>
                    <FormLabel>Meal Type</FormLabel>
                    <RadioGroup
                      value={mealPreference || 'veg'}
                      onChange={(e) => setMealPreference(e.target.value)}
                    >
                      <FormControlLabel value="veg" control={<Radio />} label="Vegetarian" />
                      <FormControlLabel value="nonveg" control={<Radio />} label="Non-Vegetarian" />
                    </RadioGroup>
                  </FormControl>

                  <FormControl>
                    <FormLabel>Meal Options</FormLabel>
                    <Stack spacing={1}>
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={preferences.breakfast}
                            onChange={(e) => setPreferences({ ...preferences, breakfast: e.target.checked })}
                          />
                        }
                        label="Breakfast"
                      />
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={preferences.lunch}
                            onChange={(e) => setPreferences({ ...preferences, lunch: e.target.checked })}
                          />
                        }
                        label="Lunch"
                      />
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={preferences.dinner}
                            onChange={(e) => setPreferences({ ...preferences, dinner: e.target.checked })}
                          />
                        }
                        label="Dinner"
                      />
                    </Stack>
                  </FormControl>

                  {mealPreference && (
                    <Card variant="outlined" sx={{ p: 2, bgcolor: 'grey.50' }}>
                      <Stack spacing={1}>
                        <Typography variant="subtitle2">Current Preference</Typography>
                        <Chip
                          label={mealPreference === 'veg' ? 'Vegetarian' : 'Non-Vegetarian'}
                          color={mealPreference === 'veg' ? 'success' : 'primary'}
                        />
                      </Stack>
                    </Card>
                  )}

                  {mealPreference && mealPreferenceData.counts[0] + mealPreferenceData.counts[1] > 0 && (
                    <Card variant="outlined" sx={{ p: 3 }}>
                      <Typography variant="h6" gutterBottom>Meal Preference Chart</Typography>
                      <Box sx={{ width: '100%', height: 300 }}>
                        <BarChart
                          xAxis={[{ data: mealPreferenceData.categories, scaleType: 'band' }]}
                          series={[{ data: mealPreferenceData.counts, label: 'Preference' }]}
                          height={300}
                        />
                      </Box>
                    </Card>
                  )}

                  <Button 
                    variant="contained" 
                    size="large" 
                    fullWidth
                    onClick={handleSavePreferences}
                    disabled={saving}
                  >
                    {saving ? 'Saving...' : 'Save Preference'}
                  </Button>
                </>
              )}
            </Stack>
          </PresentationCard>
        </TabPanel>

        {/* Meal Suggestions Tab */}
        <TabPanel value={value} index={3}>
          <PresentationCard>
            <Stack spacing={3}>
              <Typography variant="h6">Submit Meal Suggestion</Typography>
              <Typography variant="body2" color="text.secondary">
                Share your ideas for improving the meal menu. Your suggestions will be reviewed by staff and admin.
              </Typography>

              <TextField
                label="Meal Slot"
                select
                fullWidth
                value={mealSuggestion.mealSlot}
                onChange={(e) => setMealSuggestion({ ...mealSuggestion, mealSlot: e.target.value })}
              >
                <MenuItem value="breakfast">Breakfast</MenuItem>
                <MenuItem value="lunch">Lunch</MenuItem>
                <MenuItem value="dinner">Dinner</MenuItem>
              </TextField>

              <TextField
                label="Your Suggestion"
                multiline
                rows={4}
                fullWidth
                placeholder="E.g., Add more variety in breakfast options, Include more vegetarian dishes, etc."
                value={mealSuggestion.suggestion}
                onChange={(e) => setMealSuggestion({ ...mealSuggestion, suggestion: e.target.value })}
              />

              <Button
                variant="contained"
                size="large"
                fullWidth
                onClick={handleSubmitSuggestion}
                disabled={submittingSuggestion || !mealSuggestion.suggestion.trim()}
              >
                {submittingSuggestion ? 'Submitting...' : 'Submit Suggestion'}
              </Button>

              {mySuggestions.length > 0 && (
                <>
                  <Typography variant="h6" sx={{ mt: 3 }}>My Suggestions</Typography>
                  <Stack spacing={2}>
                    {mySuggestions.map((suggestion) => (
                      <Card key={suggestion._id} variant="outlined">
                        <CardContent>
                          <Stack spacing={1}>
                            <Stack direction="row" spacing={1} alignItems="center" justifyContent="space-between">
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
                            <Typography variant="body1">{suggestion.suggestion}</Typography>
                            <Typography variant="caption" color="text.secondary">
                              Submitted: {new Date(suggestion.createdAt).toLocaleDateString()}
                            </Typography>
                            {suggestion.reviewNotes && (
                              <Alert severity="info" sx={{ mt: 1 }}>
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
                </>
              )}
            </Stack>
          </PresentationCard>
        </TabPanel>
      </Box>
    </ComponentsWrapper>
  );
}

