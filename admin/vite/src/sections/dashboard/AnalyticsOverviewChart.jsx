import { useState, useEffect } from 'react';

// @mui
import { useTheme } from '@mui/material/styles';
import { LineChart } from '@mui/x-charts/LineChart';
import Stack from '@mui/material/Stack';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';
import Box from '@mui/material/Box';

// @project
import MainCard from '@/components/MainCard';
import Legend from '@/components/third-party/chart/Legend';
import { TabsType, ViewMode } from '@/enum';
import adminService from '@/services/adminService';

/***************************  CHART - DATA  ***************************/

const timeFilter = ['Daily', 'Monthly', 'Yearly'];

const valueFormatter = (date, view) => {
  switch (view) {
    case ViewMode.DAILY:
      return date.toLocaleDateString('en-us', { weekday: 'short' });
    case ViewMode.MONTHLY:
      return date.toLocaleDateString('en-US', { month: 'short' });
    case ViewMode.YEARLY:
    default:
      return date.getFullYear().toString();
  }
};

const tickInterval = (date, view) => {
  switch (view) {
    case ViewMode.MONTHLY:
      return date.getDate() === 15;
    case ViewMode.YEARLY:
      return date.getMonth() === 5;
    case ViewMode.DAILY:
    default:
      return true;
  }
};

/***************************  CHART - 1  ***************************/

export default function Chart1() {
  const theme = useTheme();
  const [loading, setLoading] = useState(true);
  const [trendsData, setTrendsData] = useState(null);

  const [view, setView] = useState(ViewMode.MONTHLY);
  const [visibilityOption, setVisibilityOption] = useState({
    page_views: true,
    unique_visitor: true
  });

  useEffect(() => {
    fetchTrendsData();
    
    // Set up polling every 30 seconds for real-time updates
    const interval = setInterval(() => {
      fetchTrendsData();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const fetchTrendsData = async () => {
    try {
      setLoading(true);
      const data = await adminService.getDashboardStats();
      setTrendsData(data.trends);
    } catch (error) {
      console.error('Failed to fetch trends data:', error);
      setTrendsData({ occupancy: [], registrations: [] });
    } finally {
      setLoading(false);
    }
  };

  const handleViewChange = (_event, newValue) => {
    setView(newValue);
  };

  const toggleVisibility = (id) => {
    setVisibilityOption((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // Process data based on view mode
  const getProcessedData = () => {
    if (!trendsData) return { occupancy: [], registrations: [], dates: [] };

    const occupancy = trendsData.occupancy || [];
    const registrations = trendsData.registrations || [];

    if (view === ViewMode.DAILY) {
      // Last 7 days
      const last7Days = occupancy.slice(-7);
      return {
        occupancy: last7Days.map(d => d.occupied),
        registrations: registrations.slice(-7).map(d => d.newStudents),
        dates: last7Days.map(d => new Date(d.date))
      };
    } else if (view === ViewMode.MONTHLY) {
      // Last 30 days (grouped by week)
      const weeklyData = [];
      for (let i = 0; i < occupancy.length; i += 7) {
        const week = occupancy.slice(i, i + 7);
        const weekReg = registrations.slice(i, i + 7);
        weeklyData.push({
          date: new Date(week[0]?.date || occupancy[i]?.date),
          occupied: Math.round(week.reduce((sum, d) => sum + (d.occupied || 0), 0) / week.length),
          newStudents: weekReg.reduce((sum, d) => sum + (d.newStudents || 0), 0)
        });
      }
      return {
        occupancy: weeklyData.map(d => d.occupied),
        registrations: weeklyData.map(d => d.newStudents),
        dates: weeklyData.map(d => d.date)
      };
    } else {
      // Yearly - use all 30 days as monthly average
      const monthlyAvg = Math.round(occupancy.reduce((sum, d) => sum + (d.occupied || 0), 0) / occupancy.length);
      const totalNew = registrations.reduce((sum, d) => sum + (d.newStudents || 0), 0);
      return {
        occupancy: [monthlyAvg],
        registrations: [totalNew],
        dates: [new Date()]
      };
    }
  };

  const processedData = getProcessedData();

  const seriesData = [
    {
      id: 'page_views',
      data: processedData.occupancy,
      color: theme.palette.primary.light,
      visible: visibilityOption['page_views'],
      label: 'Room Occupancy'
    },
    {
      id: 'unique_visitor',
      data: processedData.registrations,
      color: theme.palette.primary.main,
      visible: visibilityOption['unique_visitor'],
      label: 'New Students'
    }
  ];

  const visibleSeries = seriesData.filter((s) => s.visible);
  const lagendItems = seriesData.map((series) => ({ label: series.label, color: series.color, visible: series.visible, id: series.id }));

  const xData = processedData.dates;

  if (loading) {
    return (
      <MainCard>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 300 }}>
          <CircularProgress />
        </Box>
      </MainCard>
    );
  }

  // Dynamic styles for visible series
  const dynamicSeriesStyles = visibleSeries.reduce((acc, series) => {
    acc[`& .MuiAreaElement-series-${series.id}`] = { fill: `url(#${series.id})`, opacity: series.id === 'page_views' ? 0 : 0.15 };
    return acc;
  }, {});

  return (
    <MainCard>
      <Stack sx={{ gap: 3 }}>
        <Stack direction="row" sx={{ alignItems: 'end', justifyContent: 'space-between', gap: 2, flexWrap: 'wrap' }}>
          <Stack sx={{ gap: 0.5 }}>
            <Typography variant="h4" sx={{ fontWeight: 400 }}>
              Hostel Activity
            </Typography>
            <Typography variant="caption" sx={{ color: 'grey.700' }}>
              Track room occupancy, student registrations, and hostel activities with real-time analytics.
            </Typography>
          </Stack>
          <Tabs value={view} onChange={handleViewChange} aria-label="filter tabs" type={TabsType.SEGMENTED} sx={{ width: 'fit-content' }}>
            {timeFilter.map((filter, index) => (
              <Tab label={filter} value={filter} key={index} />
            ))}
          </Tabs>
        </Stack>

        <Legend items={lagendItems} onToggle={toggleVisibility} />
      </Stack>

      <LineChart
        series={visibleSeries.map((series) => ({ ...series, showMark: false, curve: 'linear', area: true }))}
        height={261}
        grid={{ horizontal: true }}
        margin={{ top: 25, right: 0, bottom: -4, left: 0 }}
        xAxis={[
          {
            data: xData,
            scaleType: 'point',
            disableLine: true,
            disableTicks: true,
            valueFormatter: (value) => valueFormatter(value, view),
            tickInterval: (time) => tickInterval(time, view)
          }
        ]}
        yAxis={[{ scaleType: 'linear', disableLine: true, disableTicks: true, label: 'Count' }]}
        hideLegend
        sx={{ '& .MuiLineElement-root': { strokeDasharray: '0', strokeWidth: 2 }, ...dynamicSeriesStyles }}
      >
        <defs>
          {visibleSeries.map((series, index) => (
            <linearGradient id={series.id} key={index} gradientTransform="rotate(90)">
              <stop offset="10%" stopColor={series.color} stopOpacity={1} />
              <stop offset="86%" stopColor={series.color} stopOpacity={0.1} />
            </linearGradient>
          ))}
        </defs>
      </LineChart>
    </MainCard>
  );
}
