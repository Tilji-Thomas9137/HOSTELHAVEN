import { useState, useEffect } from 'react';

// @mui
import Button from '@mui/material/Button';
import Container from '@mui/material/Container';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import { useTheme, alpha } from '@mui/material/styles';
import Fade from '@mui/material/Fade';
import Chip from '@mui/material/Chip';

// @project
import RouterLink from '@/components/Link';
import Logo from '@/components/logo';

// @assets
import { 
  IconArrowRight, 
  IconCalendar,
  IconWifi,
  IconMap,
  IconSettings,
  IconUser,
  IconDeviceTablet,
  IconDeviceDesktop,
  IconCurrencyDollar,
  IconChartBar,
  IconBuilding,
  IconUsers,
  IconDoor,
  IconDashboard,
  IconReport,
  IconCheck,
  IconTrendingUp,
  IconClock,
  IconHome,
  IconLock,
  IconClipboardCheck,
  IconWashDry,
  IconBook,
  IconBarbell,
  IconCar,
  IconShield,
  IconCoffee,
  IconTools,
  IconDeviceTv,
  IconWind,
  IconDroplet,
  IconBed
} from '@tabler/icons-react';

/***************************  LANDING - PAGE  ***************************/

// Floating icon positions - matching the design with various shapes
const floatingIcons = [
  { icon: IconLock, x: '75%', y: '12%', shape: 'square' },
  { icon: IconCalendar, x: '50%', y: '18%', shape: 'rectangle' },
  { icon: IconUser, x: '78%', y: '45%', shape: 'square' },
  { icon: IconUsers, x: '18%', y: '48%', shape: 'rectangle' },
  { icon: IconChartBar, x: '52%', y: '78%', shape: 'rectangle' },
  { icon: IconCurrencyDollar, x: '75%', y: '82%', shape: 'rectangle' },
  { icon: IconClipboardCheck, x: '22%', y: '85%', shape: 'square' },
  { icon: IconDashboard, x: '12%', y: '25%', shape: 'rectangle' }
];

const features = [
  {
    icon: <IconUsers size={28} />,
    title: 'Student Management',
    description: 'Efficiently manage student profiles and information in one place.'
  },
  {
    icon: <IconDoor size={28} />,
    title: 'Room Management',
    description: 'Track availability and manage allocations seamlessly.'
  },
  {
    icon: <IconCalendar size={28} />,
    title: 'Booking System',
    description: 'Handle bookings, check-ins, and check-outs with ease.'
  },
  {
    icon: <IconCurrencyDollar size={28} />,
    title: 'Payment Tracking',
    description: 'Track payments and generate receipts automatically.'
  },
  {
    icon: <IconDashboard size={28} />,
    title: 'Analytics',
    description: 'Get insights with comprehensive dashboards and metrics.'
  },
  {
    icon: <IconReport size={28} />,
    title: 'Reports & Insights',
    description: 'Generate detailed reports on occupancy and revenue.'
  }
];

const stats = [
  { label: 'Students', value: '500+', icon: <IconUsers size={24} /> },
  { label: 'Rooms', value: '200+', icon: <IconHome size={24} /> },
  { label: 'Success Rate', value: '98%', icon: <IconTrendingUp size={24} /> },
  { label: 'Uptime', value: '99.9%', icon: <IconClock size={24} /> }
];

// Hostel Facilities
const facilities = [
  {
    icon: <IconWifi size={32} />,
    title: 'High-Speed WiFi',
    description: 'Free high-speed internet access throughout the hostel',
    color: '#4CAF50'
  },
  {
    icon: <IconWashDry size={32} />,
    title: 'Laundry Service',
    description: 'Modern laundry facilities with washing and drying machines',
    color: '#2196F3'
  },
  {
    icon: <IconBook size={32} />,
    title: 'Study Room',
    description: 'Quiet study spaces with comfortable seating and good lighting',
    color: '#9C27B0'
  },
  {
    icon: <IconBarbell size={32} />,
    title: 'Fitness Center',
    description: 'Well-equipped gym with modern exercise equipment',
    color: '#F44336'
  },
  {
    icon: <IconCar size={32} />,
    title: 'Parking Space',
    description: 'Secure parking facilities for residents and visitors',
    color: '#FF9800'
  },
  {
    icon: <IconShield size={32} />,
    title: '24/7 Security',
    description: 'Round-the-clock security with CCTV surveillance',
    color: '#607D8B'
  },
  {
    icon: <IconCoffee size={32} />,
    title: 'Cafeteria',
    description: 'On-site cafeteria serving delicious meals and snacks',
    color: '#795548'
  },
  {
    icon: <IconTools size={32} />,
    title: 'Common Kitchen',
    description: 'Shared kitchen facilities for cooking your favorite meals',
    color: '#E91E63'
  },
  {
    icon: <IconDeviceTv size={32} />,
    title: 'Recreation Room',
    description: 'Common room with TV, games, and entertainment facilities',
    color: '#00BCD4'
  },
  {
    icon: <IconWind size={32} />,
    title: 'AC Rooms',
    description: 'Air-conditioned rooms for comfortable living',
    color: '#009688'
  },
  {
    icon: <IconDroplet size={32} />,
    title: 'Modern Bathrooms',
    description: 'Clean, modern bathrooms with hot water facilities',
    color: '#3F51B5'
  },
  {
    icon: <IconBed size={32} />,
    title: 'Comfortable Beds',
    description: 'Quality mattresses and bedding for a good night\'s sleep',
    color: '#8BC34A'
  }
];

export default function LandingPage() {
  const theme = useTheme();
  const [fadeIn, setFadeIn] = useState(false);
  const [floatingVisible, setFloatingVisible] = useState(Array(floatingIcons.length).fill(false));
  const [animatedStats, setAnimatedStats] = useState([false, false, false, false]);

  useEffect(() => {
    setFadeIn(true);
    
    // Animate floating icons sequentially
    floatingIcons.forEach((_, index) => {
      setTimeout(() => {
        setFloatingVisible(prev => {
          const newState = [...prev];
          newState[index] = true;
          return newState;
        });
      }, 300 * (index + 1));
    });

    // Animate stats sequentially
    stats.forEach((_, index) => {
      setTimeout(() => {
        setAnimatedStats(prev => {
          const newState = [...prev];
          newState[index] = true;
          return newState;
        });
      }, 200 * (index + 1));
    });
  }, []);

  return (
    <Box sx={{ bgcolor: 'background.default', position: 'relative', overflow: 'auto' }}>
      {/* Gradient Background with Stars */}
      <Box
        sx={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          width: '100%',
          height: '100%',
          zIndex: 0,
          pointerEvents: 'none',
          background: `
            radial-gradient(ellipse at top, ${alpha(theme.palette.primary.main, 0.08)} 0%, transparent 50%),
            radial-gradient(ellipse at bottom, ${alpha(theme.palette.primary.dark, 0.15)} 0%, transparent 50%),
            linear-gradient(180deg, ${alpha('#fff', 0.95)} 0%, ${alpha(theme.palette.primary.light, 0.05)} 100%)
          `,
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundImage: `
              radial-gradient(2px 2px at 20% 30%, ${alpha('#000', 0.05)}, transparent),
              radial-gradient(2px 2px at 60% 70%, ${alpha('#000', 0.05)}, transparent),
              radial-gradient(1px 1px at 50% 50%, ${alpha('#000', 0.08)}, transparent),
              radial-gradient(1px 1px at 80% 10%, ${alpha('#000', 0.06)}, transparent),
              radial-gradient(2px 2px at 90% 40%, ${alpha('#000', 0.05)}, transparent),
              radial-gradient(1px 1px at 30% 80%, ${alpha('#000', 0.07)}, transparent)
            `,
            backgroundSize: '200% 200%',
            animation: 'twinkle 20s ease-in-out infinite',
            '@keyframes twinkle': {
              '0%, 100%': { opacity: 1 },
              '50%': { opacity: 0.7 }
            }
          }
        }}
      />

      {/* Navigation Bar */}
      <AppBar 
        position="sticky"
        elevation={0} 
        sx={{ 
          bgcolor: alpha(theme.palette.background.paper, 0.9),
          backdropFilter: 'blur(20px)',
          borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
          position: 'relative',
          zIndex: 10
        }}
      >
        <Container maxWidth="lg">
          <Toolbar sx={{ justifyContent: 'space-between', py: 2, minHeight: { xs: 64, md: 72 } }}>
            <Logo />
            <Button
              component={RouterLink}
              to="/auth/login"
              variant="contained"
              sx={{ 
                borderRadius: 3,
                fontWeight: 600,
                px: 3,
                py: 1,
                textTransform: 'none',
                boxShadow: `0 4px 14px ${alpha(theme.palette.primary.main, 0.3)}`,
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                '&:hover': {
                  transform: 'translateY(-2px)',
                  boxShadow: `0 8px 24px ${alpha(theme.palette.primary.main, 0.4)}`
                }
              }}
            >
              Sign In
            </Button>
          </Toolbar>
        </Container>
      </AppBar>

      {/* Hero Section */}
      <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1, py: { xs: 8, md: 12 } }}>
        <Grid container spacing={4} sx={{ alignItems: 'center', mb: { xs: 10, md: 16 } }}>
          {/* Left Side - Text Content */}
          <Grid size={{ xs: 12, md: 6 }}>
            <Fade in={fadeIn} timeout={600}>
              <Stack spacing={4}>
                {/* Badge */}
                <Box sx={{ display: 'inline-flex' }}>
                  <Chip
                    label="Modern Hostel Management"
                    sx={{
                      bgcolor: 'transparent',
                      color: 'primary.main',
                      fontWeight: 600,
                      px: 2,
                      py: 2.5,
                      fontSize: '0.875rem',
                      border: `2px solid ${alpha(theme.palette.primary.main, 0.3)}`,
                      borderRadius: 3
                    }}
                  />
                </Box>

                {/* Main Heading */}
                <Typography
                  variant="h1"
                  sx={{
                    fontSize: { xs: '2.5rem', sm: '3.5rem', md: '4.5rem', lg: '5rem' },
                    fontWeight: 800,
                    lineHeight: 1.1,
                    letterSpacing: '-0.03em',
                    color: 'text.primary'
                  }}
                >
                  Smart Hostel Management
                </Typography>

                {/* Tagline */}
                <Typography
                  variant="h6"
                  color="text.secondary"
                  sx={{
                    fontSize: { xs: '1rem', md: '1.25rem' },
                    fontWeight: 400,
                    lineHeight: 1.7,
                    maxWidth: 500
                  }}
                >
                  Streamline operations with our comprehensive platform. Manage students, rooms, bookings, and payments effortlessly.
                </Typography>

                 {/* CTA Button */}
                 <Box sx={{ mt: 2 }}>
                   <Button
                     component={RouterLink}
                     to="/auth/login"
                     variant="contained"
                     size="large"
                     endIcon={<IconArrowRight size={20} />}
                     sx={{
                       px: 4,
                       py: 1.5,
                       borderRadius: 3,
                       fontSize: '1rem',
                       fontWeight: 600,
                       textTransform: 'none',
                       boxShadow: `0 8px 24px ${alpha(theme.palette.primary.main, 0.3)}`,
                       transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                       '&:hover': {
                         transform: 'translateY(-2px)',
                         boxShadow: `0 12px 32px ${alpha(theme.palette.primary.main, 0.4)}`
                       }
                     }}
                   >
                     Sign In
                   </Button>
                 </Box>
              </Stack>
            </Fade>
          </Grid>

          {/* Right Side - Floating Icons Illustration */}
          <Grid size={{ xs: 12, md: 6 }}>
            <Box
              sx={{
                position: 'relative',
                width: '100%',
                height: { xs: 500, md: 700 },
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: { xs: 500, md: 700 }
              }}
            >
              {/* Floating Icons with Interconnected Design */}
              {floatingIcons.map((item, index) => {
                const IconComponent = item.icon;
                const isRectangle = item.shape === 'rectangle';
                const isSquare = item.shape === 'square';
                
                return (
                  <Fade key={index} in={floatingVisible[index]} timeout={600}>
                    <Box
                      sx={{
                        position: 'absolute',
                        left: item.x,
                        top: item.y,
                        transform: 'translate(-50%, -50%)',
                        zIndex: index + 1,
                        animation: `floatIcon ${4 + index * 0.5}s ease-in-out infinite`,
                        animationDelay: `${index * 0.2}s`,
                        '@keyframes floatIcon': {
                          '0%, 100%': { transform: 'translate(-50%, -50%) translateY(0px) rotate(0deg)' },
                          '50%': { transform: `translate(-50%, -50%) translateY(-${8 + index * 2}px) rotate(${index % 2 === 0 ? '3' : '-3'}deg)` }
                        }
                      }}
                    >
                      {/* Dashed Connection Lines - Connecting to nearby icons */}
                      {index < floatingIcons.length - 1 && (
                        <Box
                          sx={{
                            position: 'absolute',
                            top: '50%',
                            left: '50%',
                            width: '120%',
                            height: 2,
                            borderTop: `2px dashed ${alpha(theme.palette.primary.main, 0.2)}`,
                            transformOrigin: '0 0',
                            transform: `rotate(${(index * 45) % 360}deg)`,
                            zIndex: 0,
                            opacity: 0.6,
                            animation: `drawLine 1s ease-out ${index * 0.3}s both`,
                            '@keyframes drawLine': {
                              '0%': { width: 0, opacity: 0 },
                              '100%': { width: '120%', opacity: 0.6 }
                            }
                          }}
                        />
                      )}
                      
                      {/* Icon Container - Rectangle or Square */}
                      <Box
                        sx={{
                          position: 'relative',
                          width: isRectangle ? { xs: 80, md: 100 } : { xs: 64, md: 80 },
                          height: isRectangle ? { xs: 48, md: 60 } : { xs: 64, md: 80 },
                          borderRadius: 2,
                          background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
                          boxShadow: `0 8px 24px ${alpha(theme.palette.primary.main, 0.3)},
                                      0 0 0 1px ${alpha('#fff', 0.1)}`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          transition: 'all 0.3s ease',
                          zIndex: 1,
                          '&:hover': {
                            transform: 'scale(1.1) rotate(5deg)',
                            boxShadow: `0 12px 32px ${alpha(theme.palette.primary.main, 0.4)},
                                        0 0 0 2px ${alpha('#fff', 0.2)}`
                          },
                          '&::before': {
                            content: '""',
                            position: 'absolute',
                            inset: 0,
                            borderRadius: 2,
                            background: `linear-gradient(135deg, ${alpha('#fff', 0.1)} 0%, transparent 100%)`,
                            pointerEvents: 'none'
                          }
                        }}
                      >
                        <IconComponent
                          size={isRectangle ? 28 : 32}
                          color="#fff"
                          stroke={2}
                        />
                      </Box>
                    </Box>
                  </Fade>
                );
              })}

              {/* Connecting Dots Pattern */}
              <Box
                sx={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  width: '80%',
                  height: '80%',
                  zIndex: 0,
                  opacity: 0.3,
                  backgroundImage: `
                    radial-gradient(circle 2px, ${theme.palette.primary.main} 1px, transparent 1px)
                  `,
                  backgroundSize: '40px 40px',
                  pointerEvents: 'none'
                }}
              />
            </Box>
          </Grid>
        </Grid>

        {/* Stats Section */}
        <Fade in={fadeIn} timeout={1000}>
          <Grid container spacing={3} sx={{ mb: { xs: 12, md: 16 }, mt: 8 }}>
            {stats.map((stat, index) => (
              <Grid size={{ xs: 6, md: 3 }} key={index}>
                <Fade in={animatedStats[index]} timeout={600}>
                  <Box
                    sx={{
                      textAlign: 'center',
                      p: 3,
                      borderRadius: 3,
                      bgcolor: alpha(theme.palette.background.paper, 0.6),
                      backdropFilter: 'blur(10px)',
                      border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        transform: 'translateY(-4px)',
                        boxShadow: `0 8px 24px ${alpha(theme.palette.primary.main, 0.1)}`,
                        borderColor: alpha(theme.palette.primary.main, 0.2)
                      }
                    }}
                  >
                    <Box sx={{ color: 'primary.main', mb: 1.5, display: 'flex', justifyContent: 'center' }}>
                      {stat.icon}
                    </Box>
                    <Typography variant="h4" sx={{ fontWeight: 700, color: 'text.primary', mb: 0.5 }}>
                      {stat.value}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
                      {stat.label}
                    </Typography>
                  </Box>
                </Fade>
              </Grid>
            ))}
          </Grid>
        </Fade>

        {/* Features Section */}
        <Box sx={{ mb: { xs: 12, md: 16 }, position: 'relative', zIndex: 1 }}>
          <Stack spacing={1} sx={{ textAlign: 'center', mb: 8 }}>
            <Typography 
              variant="h2" 
              sx={{ 
                fontWeight: 700, 
                fontSize: { xs: '2rem', md: '2.75rem' },
                letterSpacing: '-0.02em'
              }}
            >
              Everything You Need
            </Typography>
            <Typography 
              variant="body1" 
              color="text.secondary" 
              sx={{ maxWidth: 500, mx: 'auto', fontSize: '1.1rem' }}
            >
              Powerful features to manage your hostel efficiently
            </Typography>
          </Stack>

          <Grid container spacing={3}>
            {features.map((feature, index) => (
              <Grid size={{ xs: 12, sm: 6, md: 4 }} key={index}>
                <Fade in={fadeIn} timeout={600} style={{ transitionDelay: `${index * 100}ms` }}>
                  <Card 
                    sx={{ 
                      height: '100%', 
                      p: 3, 
                      borderRadius: 3,
                      bgcolor: alpha(theme.palette.background.paper, 0.6),
                      backdropFilter: 'blur(10px)',
                      border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                      '&:hover': { 
                        transform: 'translateY(-8px)', 
                        boxShadow: `0 16px 48px ${alpha(theme.palette.primary.main, 0.12)}`,
                        borderColor: alpha(theme.palette.primary.main, 0.3)
                      } 
                    }}
                  >
                    <CardContent sx={{ p: 0 }}>
                      <Box 
                        sx={{ 
                          color: 'primary.main', 
                          mb: 2.5, 
                          display: 'inline-flex',
                          p: 1.5,
                          borderRadius: 2,
                          bgcolor: alpha(theme.palette.primary.main, 0.08),
                          transition: 'all 0.3s ease'
                        }}
                      >
                        {feature.icon}
                      </Box>
                      <Typography variant="h6" sx={{ mb: 1, fontWeight: 600, fontSize: '1.125rem' }}>
                        {feature.title}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.7 }}>
                        {feature.description}
                      </Typography>
                    </CardContent>
                  </Card>
                </Fade>
              </Grid>
            ))}
          </Grid>
        </Box>

        {/* CTA Section */}
        <Fade in={fadeIn} timeout={1200}>
          <Box 
            sx={{ 
              borderRadius: 4,
              p: { xs: 6, md: 10 },
              textAlign: 'center',
              position: 'relative',
              overflow: 'hidden',
              background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
              mb: 12,
              '&::before': {
                content: '""',
                position: 'absolute',
                top: '-50%',
                right: '-20%',
                width: 500,
                height: 500,
                borderRadius: '50%',
                background: alpha('#fff', 0.1),
                zIndex: 0
              }
            }}
          >
            <Box sx={{ position: 'relative', zIndex: 1 }}>
               <Typography 
                 variant="h3" 
                 sx={{ 
                   color: 'white', 
                   mb: 2, 
                   fontWeight: 700, 
                   fontSize: { xs: '1.75rem', md: '2.5rem' },
                   letterSpacing: '-0.02em'
                 }}
               >
                 Ready to Sign In?
               </Typography>
              <Typography 
                variant="body1" 
                sx={{ 
                  color: alpha('#fff', 0.9), 
                  mb: 4, 
                  maxWidth: 500, 
                  mx: 'auto',
                  fontSize: '1.125rem'
                }}
              >
                Join hostels worldwide using HostelHaven to streamline operations
              </Typography>
              <Button
                component={RouterLink}
                to="/auth/login"
                variant="contained"
                size="large"
                endIcon={<IconArrowRight size={20} />}
                sx={{ 
                  bgcolor: 'white',
                  color: 'primary.main',
                  px: 5, 
                  py: 1.75, 
                  borderRadius: 3,
                  fontSize: '1rem',
                  fontWeight: 600,
                  textTransform: 'none',
                  boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  '&:hover': {
                    bgcolor: alpha('#fff', 0.95),
                    transform: 'translateY(-2px)',
                    boxShadow: '0 12px 32px rgba(0,0,0,0.3)'
                  }
                }}
              >
                 Sign In
               </Button>
            </Box>
          </Box>
        </Fade>

        {/* Hostel Facilities Section */}
        <Box sx={{ mb: { xs: 12, md: 16 }, position: 'relative', zIndex: 1 }}>
          <Stack spacing={1} sx={{ textAlign: 'center', mb: 8 }}>
            <Typography 
              variant="h2" 
              sx={{ 
                fontWeight: 700, 
                fontSize: { xs: '2rem', md: '2.75rem' },
                letterSpacing: '-0.02em'
              }}
            >
              Hostel Facilities
            </Typography>
            <Typography 
              variant="body1" 
              color="text.secondary" 
              sx={{ maxWidth: 600, mx: 'auto', fontSize: '1.1rem' }}
            >
              Modern amenities and facilities for a comfortable stay
            </Typography>
          </Stack>

          <Grid container spacing={3}>
            {facilities.map((facility, index) => (
              <Grid size={{ xs: 6, sm: 4, md: 3 }} key={index}>
                <Fade in={fadeIn} timeout={600} style={{ transitionDelay: `${index * 50}ms` }}>
                  <Card 
                    sx={{ 
                      height: '100%', 
                      p: 3, 
                      borderRadius: 3,
                      bgcolor: alpha(theme.palette.background.paper, 0.8),
                      backdropFilter: 'blur(10px)',
                      border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                      textAlign: 'center',
                      position: 'relative',
                      overflow: 'hidden',
                      '&::before': {
                        content: '""',
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        height: 4,
                        background: `linear-gradient(90deg, ${facility.color}, ${alpha(facility.color, 0.5)})`,
                        transform: 'scaleX(0)',
                        transformOrigin: 'left',
                        transition: 'transform 0.3s ease'
                      },
                      '&:hover': { 
                        transform: 'translateY(-8px)', 
                        boxShadow: `0 16px 48px ${alpha(facility.color, 0.2)}`,
                        borderColor: alpha(facility.color, 0.3),
                        '&::before': {
                          transform: 'scaleX(1)'
                        }
                      } 
                    }}
                  >
                    <CardContent sx={{ p: 0 }}>
                      <Box 
                        sx={{ 
                          color: facility.color, 
                          mb: 2, 
                          display: 'inline-flex',
                          p: 2,
                          borderRadius: 3,
                          bgcolor: alpha(facility.color, 0.1),
                          transition: 'all 0.3s ease',
                          '&:hover': {
                            transform: 'scale(1.1) rotate(5deg)',
                            bgcolor: alpha(facility.color, 0.15)
                          }
                        }}
                      >
                        {facility.icon}
                      </Box>
                      <Typography 
                        variant="h6" 
                        sx={{ 
                          mb: 1, 
                          fontWeight: 600, 
                          fontSize: '1rem',
                          color: 'text.primary'
                        }}
                      >
                        {facility.title}
                      </Typography>
                      <Typography 
                        variant="body2" 
                        color="text.secondary" 
                        sx={{ 
                          lineHeight: 1.6,
                          fontSize: '0.875rem'
                        }}
                      >
                        {facility.description}
                      </Typography>
                    </CardContent>
                  </Card>
                </Fade>
              </Grid>
            ))}
          </Grid>
        </Box>

        {/* Benefits Section */}
        <Box 
          sx={{ 
            bgcolor: alpha(theme.palette.grey[50], 0.5),
            borderRadius: 4, 
            p: { xs: 4, md: 8 }, 
            mb: 12,
            border: `1px solid ${alpha(theme.palette.divider, 0.1)}`
          }}
        >
          <Stack spacing={1} sx={{ textAlign: 'center', mb: 6 }}>
            <Typography variant="h3" sx={{ fontWeight: 800, fontSize: { xs: '2rem', md: '2.5rem' } }}>
              Why Choose HostelHaven?
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 600, mx: 'auto' }}>
              Experience the difference with our comprehensive hostel management solution
            </Typography>
          </Stack>
          <Grid container spacing={4}>
            {[
              'Real-time room availability tracking',
              'Automated booking and payment management',
              'Comprehensive student profile management',
              'Detailed analytics and reporting',
              'Secure payment processing',
              'Easy-to-use interface for all roles'
            ].map((benefit, index) => (
              <Grid size={{ xs: 12, sm: 6 }} key={index}>
                <Stack direction="row" spacing={2} alignItems="flex-start">
                  <Box 
                    sx={{ 
                      color: 'success.main', 
                      mt: 0.5,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: 24,
                      height: 24,
                      borderRadius: '50%',
                      bgcolor: 'success.lighter',
                      flexShrink: 0
                    }}
                  >
                    <IconCheck size={16} />
                  </Box>
                  <Typography variant="body1" sx={{ fontWeight: 500 }}>
                    {benefit}
                  </Typography>
                </Stack>
              </Grid>
            ))}
          </Grid>
        </Box>
      </Container>

      {/* Footer */}
      <Box 
        sx={{ 
          py: 6, 
          mt: 8,
          borderTop: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
          position: 'relative',
          zIndex: 1,
          bgcolor: alpha(theme.palette.background.paper, 0.5),
          backdropFilter: 'blur(10px)'
        }}
      >
        <Container maxWidth="lg">
          <Stack spacing={3} alignItems="center" textAlign="center">
            <Logo />
            <Typography variant="body2" color="text.secondary">
              © {new Date().getFullYear()} HostelHaven. All rights reserved.
            </Typography>
          </Stack>
        </Container>
      </Box>
    </Box>
  );
}
