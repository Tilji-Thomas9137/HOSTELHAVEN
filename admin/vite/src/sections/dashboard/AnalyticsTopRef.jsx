import PropTypes from 'prop-types';
import { useState, useEffect } from 'react';

// @mui
import { useTheme } from '@mui/material/styles';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';

// @project
import ProgressCard from '@/components/cards/ProgressCard';
import { TabsType } from '@/enum';
import { getRadiusStyles } from '@/utils/getRadiusStyles';
import adminService from '@/services/adminService';

/***************************  TABS - DATA  ***************************/

/***************************  TABS - A11Y  ***************************/

function a11yProps(value) {
  return { value: value, id: `simple-tab-${value}`, 'aria-controls': `simple-tabpanel-${value}` };
}

/***************************  TABS - PANEL  ***************************/

function TabPanel({ children, value, index, ...other }) {
  return (
    <div role="tabpanel" hidden={value !== index} id={`simple-tabpanel-${index}`} aria-labelledby={`simple-tab-${index}`} {...other}>
      {value === index && <Box sx={{ pt: 1.5 }}>{children}</Box>}
    </div>
  );
}

/***************************  TABS - CONTENT  ***************************/

function TabContent({ data }) {
  return (
    <Stack sx={{ gap: 1.25 }}>
      {data.map((item, index) => (
        <ProgressCard key={index} {...item} />
      ))}
    </Stack>
  );
}

/***************************  CARDS - BORDER WITH RADIUS  ***************************/

export function applyBorderWithRadius(radius, theme) {
  return {
    overflow: 'hidden',
    '--Grid-borderWidth': '1px',
    borderTop: 'var(--Grid-borderWidth) solid',
    borderLeft: 'var(--Grid-borderWidth) solid',
    borderColor: 'divider',
    '& > div': {
      overflow: 'hidden',
      borderRight: 'var(--Grid-borderWidth) solid',
      borderBottom: 'var(--Grid-borderWidth) solid',
      borderColor: 'divider',
      [theme.breakpoints.only('xs')]: {
        '&:first-of-type': getRadiusStyles(radius, 'topLeft', 'topRight'),
        '&:last-of-type': getRadiusStyles(radius, 'bottomLeft', 'bottomRight')
      },
      [theme.breakpoints.between('sm', 'md')]: {
        '&:nth-of-type(1)': getRadiusStyles(radius, 'topLeft'),
        '&:nth-of-type(2)': getRadiusStyles(radius, 'topRight'),
        '&:nth-of-type(3)': getRadiusStyles(radius, 'bottomLeft', 'bottomRight')
      },
      [theme.breakpoints.up('md')]: {
        '&:first-of-type': getRadiusStyles(radius, 'topLeft', 'bottomLeft'),
        '&:last-of-type': getRadiusStyles(radius, 'topRight', 'bottomRight')
      }
    }
  };
}

/***************************  CARDS - TOP REFERRERS  ***************************/
export default function TopReferrers() {
  const theme = useTheme();
  const [httpReferrers, setHttpReferrers] = useState('days');
  const [pages, setPages] = useState('routes');
  const [sources, setSources] = useState('affiliate');
  const [loading, setLoading] = useState(true);
  const [widgetData, setWidgetData] = useState({
    roomUtilization: { days: [], month: [], year: [] },
    roomTypes: { routes: [], pages: [] },
    transactions: { affiliate: [], marketing: [] }
  });

  // Fetch widget data
  const fetchWidgetData = async () => {
    try {
      setLoading(true);
      
      // Fetch all periods in parallel
      const [daysData, monthData, yearData, weekData, monthRoomData, paymentMethodsData, paymentTypesData] = await Promise.all([
        adminService.getDashboardWidgets({ period: 'days' }),
        adminService.getDashboardWidgets({ period: 'month' }),
        adminService.getDashboardWidgets({ period: 'year' }),
        adminService.getDashboardWidgets({ roomPeriod: 'routes' }),
        adminService.getDashboardWidgets({ roomPeriod: 'pages' }),
        adminService.getDashboardWidgets({ transactionType: 'affiliate' }),
        adminService.getDashboardWidgets({ transactionType: 'marketing' })
      ]);

      setWidgetData({
        roomUtilization: {
          days: daysData.roomUtilization || [],
          month: monthData.roomUtilization || [],
          year: yearData.roomUtilization || []
        },
        roomTypes: {
          routes: weekData.roomTypes || [],
          pages: monthRoomData.roomTypes || []
        },
        transactions: {
          affiliate: paymentMethodsData.transactions || [],
          marketing: paymentTypesData.transactions || []
        }
      });
    } catch (error) {
      console.error('Failed to fetch widget data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWidgetData();
    
    // Set up polling every 30 seconds
    const interval = setInterval(() => {
      fetchWidgetData();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  // Separate handleChange functions
  const handleHTTPReferrers = (event, newValue) => {
    setHttpReferrers(newValue);
  };

  const handlePages = (event, newValue) => {
    setPages(newValue);
  };

  const handleSources = (event, newValue) => {
    setSources(newValue);
  };

  // Get current data based on selected tabs
  const getRoomUtilizationData = () => {
    if (httpReferrers === 'days') return widgetData.roomUtilization.days;
    if (httpReferrers === 'month') return widgetData.roomUtilization.month;
    return widgetData.roomUtilization.year;
  };

  const getRoomTypesData = () => {
    return pages === 'routes' ? widgetData.roomTypes.routes : widgetData.roomTypes.pages;
  };

  const getTransactionsData = () => {
    return sources === 'affiliate' ? widgetData.transactions.affiliate : widgetData.transactions.marketing;
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 200 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <>
      <Grid container sx={{ borderRadius: 4, boxShadow: theme.customShadows.section, ...applyBorderWithRadius(16, theme) }}>
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <Stack sx={{ gap: 2.5, p: 3 }}>
            <Typography variant="subtitle1">Room Utilization by Building</Typography>
            <Box>
              <Tabs
                variant="fullWidth"
                value={httpReferrers}
                onChange={handleHTTPReferrers}
                aria-label="basic tabs example"
                type={TabsType.SEGMENTED}
              >
                <Tab label="Last 7 days" {...a11yProps('days')} />
                <Tab label="Last Month" {...a11yProps('month')} />
                <Tab label="Last Year" {...a11yProps('year')} />
              </Tabs>
              <TabPanel value={httpReferrers} index="days">
                <TabContent data={getRoomUtilizationData()} />
              </TabPanel>
              <TabPanel value={httpReferrers} index="month">
                <TabContent data={getRoomUtilizationData()} />
              </TabPanel>
              <TabPanel value={httpReferrers} index="year">
                <TabContent data={getRoomUtilizationData()} />
              </TabPanel>
            </Box>
          </Stack>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <Stack sx={{ gap: 2.5, p: 3 }}>
            <Typography variant="subtitle1">Most Booked Room Types</Typography>
            <Box>
              <Tabs variant="fullWidth" value={pages} onChange={handlePages} aria-label="basic tabs example" type={TabsType.SEGMENTED}>
                <Tab label="Last Week" {...a11yProps('routes')} />
                <Tab label="Last Month" {...a11yProps('pages')} />
              </Tabs>
              <TabPanel value={pages} index="routes">
                <TabContent data={getRoomTypesData()} />
              </TabPanel>
              <TabPanel value={pages} index="pages">
                <TabContent data={getRoomTypesData()} />
              </TabPanel>
            </Box>
          </Stack>
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <Stack sx={{ gap: 2.5, p: 3 }}>
            <Typography variant="subtitle1">Transaction Details</Typography>
            <Box>
              <Tabs variant="fullWidth" value={sources} onChange={handleSources} aria-label="basic tabs example" type={TabsType.SEGMENTED}>
                <Tab label="Payment Methods" {...a11yProps('affiliate')} />
                <Tab label="Payment Types" {...a11yProps('marketing')} />
              </Tabs>
              <TabPanel value={sources} index="affiliate">
                <TabContent data={getTransactionsData()} />
              </TabPanel>
              <TabPanel value={sources} index="marketing">
                <TabContent data={getTransactionsData()} />
              </TabPanel>
            </Box>
          </Stack>
        </Grid>
      </Grid>
    </>
  );
}

TabPanel.propTypes = {
  children: PropTypes.any,
  value: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  index: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  other: PropTypes.any
};

TabContent.propTypes = { data: PropTypes.array };
