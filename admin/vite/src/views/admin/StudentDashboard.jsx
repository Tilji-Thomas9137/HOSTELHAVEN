import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

// @mui
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import Fade from '@mui/material/Fade';
import Grow from '@mui/material/Grow';
import Zoom from '@mui/material/Zoom';
import Slide from '@mui/material/Slide';
import { useTheme } from '@mui/material/styles';
import { BarChart } from '@mui/x-charts/BarChart';

// @project
import OverviewCard from '@/components/cards/OverviewCard';
import MainCard from '@/components/MainCard';
import { getRadiusStyles } from '@/utils/getRadiusStyles';
import studentService from '@/services/studentService';
import { useSnackbar } from 'notistack';
import { clearRoomAllocationErrorFlag } from '@/utils/roomAllocationErrorHandler';
import { useRoomAllocation } from '@/contexts/RoomAllocationContext';
import PaymentModal from '@/components/PaymentModal';
import useAuth from '@/hooks/useAuth';

// @assets
import { IconCheck, IconCalendar, IconClipboard, IconBell, IconUser, IconAlertTriangle, IconBrain, IconUsers, IconHome } from '@tabler/icons-react';
import { BASE_ROOM_PRICES, AMENITY_PRICES, getAmenityPriceBreakdown } from '@/utils/amenitiesPricing';

/***************************  STUDENT DASHBOARD  ***************************/

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
      [theme.breakpoints.down('md')]: {
        '&:nth-of-type(1)': getRadiusStyles(radius, 'topLeft'),
        '&:nth-of-type(2)': getRadiusStyles(radius, 'topRight'),
        '&:nth-of-type(3)': getRadiusStyles(radius, 'bottomLeft'),
        '&:nth-of-type(4)': getRadiusStyles(radius, 'bottomRight')
      },
      [theme.breakpoints.up('md')]: {
        '&:first-of-type': getRadiusStyles(radius, 'topLeft', 'bottomLeft'),
        '&:last-of-type': getRadiusStyles(radius, 'topRight', 'bottomRight')
      }
    }
  };
}

export default function StudentDashboard() {
  const theme = useTheme();
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();
  const { user } = useAuth();
  
  // Get room allocation context - will throw if not in provider, but that's ok for now
  // The provider should be wrapping the layout
  let hasRoom = false;
  let roomLoading = true;
  let checkRoomAllocation = null;
  try {
    const roomAllocation = useRoomAllocation();
    hasRoom = roomAllocation?.hasRoom || false;
    roomLoading = roomAllocation?.loading !== false;
    checkRoomAllocation = roomAllocation?.checkRoomAllocation;
  } catch (error) {
    // Context not available - will use dashboard data instead
    roomLoading = false;
  }
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dashboardData, setDashboardData] = useState(null);
  const [attendanceData, setAttendanceData] = useState({ days: [], inCount: [], outCount: [] });
  const [outpassData, setOutpassData] = useState({ pending: 0, recent: null });
  const [showRoomAllocationModal, setShowRoomAllocationModal] = useState(false); // Start with false, show only if no room found
  const [showPaymentModal, setShowPaymentModal] = useState(false); // State for payment info modal
  const [showPaymentGatewayModal, setShowPaymentGatewayModal] = useState(false); // State for payment gateway modal
  const [unpaidRoomFee, setUnpaidRoomFee] = useState(null);
  const [fees, setFees] = useState([]);
  const [studentInfo, setStudentInfo] = useState(null); // Student info for payment modal
  const [onboardingStatus, setOnboardingStatus] = useState(null); // Track onboarding status
  const [roommateGroup, setRoommateGroup] = useState(null); // Roommate group with payment status
  const [roomIntroCompleted, setRoomIntroCompleted] = useState(() => {
    if (typeof window === 'undefined') return false;
    return sessionStorage.getItem('roomAllocationIntroCompleted') === 'true';
  });

  // Fetch student profile to get onboarding status (fetch immediately on mount)
  useEffect(() => {
    const fetchOnboardingStatus = async () => {
      try {
        const profile = await studentService.getProfile();
        if (profile?.student?.onboardingStatus) {
          setOnboardingStatus(profile.student.onboardingStatus);
        } else {
          // If onboardingStatus is not set, check if student has room
          // If no room, default to 'pending' for first-time users
          const hasRoomFromProfile = profile?.student?.room || profile?.student?.temporaryRoom;
          if (!hasRoomFromProfile) {
            // Student has no room and no onboardingStatus - treat as first-time login
            setOnboardingStatus('pending');
          } else {
            // Student has room but no onboardingStatus - set to confirmed
            setOnboardingStatus('confirmed');
          }
        }
      } catch (err) {
        // If error fetching profile, check hasRoom from context
        // If no room, default to 'pending' for first-time users
        if (!hasRoom) {
          setOnboardingStatus('pending');
        }
      }
    };
    // Only fetch if user is a student
    if (user?.role === 'student') {
      fetchOnboardingStatus();
    }
  }, [user?.role, hasRoom]); // Re-fetch if hasRoom changes

  // Initial data fetch on mount and when room allocation changes
  useEffect(() => {
    // Wait for context to finish loading room status
    if (roomLoading) {
      return; // Wait for context to determine room status
    }
    
    // Check if student has selected a room (temporary room or force flag)
    const forceOpen = sessionStorage.getItem('openRoomPaymentAfterSelection') === 'true';
    
    // If context already determined no room, check if payment is pending
    if (!hasRoom) {
      // If room was just selected or payment is pending, fetch student info and fees
      if (forceOpen) {
        setShowRoomAllocationModal(false); // Don't show room allocation modal
        setLoading(false);
        fetchFees();
        fetchStudentInfo();
        // Try to fetch dashboard data anyway to get temporaryRoom info
        fetchDashboardData();
      } else {
        // No room selected yet, show room allocation modal
        setShowRoomAllocationModal(true);
        setLoading(false);
      }
      return;
    }
    
    // Room is allocated - hide modal immediately and fetch full dashboard data
    setShowRoomAllocationModal(false);
    fetchDashboardData();
    fetchStudentInfo(); // Fetch student info for payment modal
  }, [hasRoom, roomLoading]);
  
  // Force refresh dashboard data when user navigates back to dashboard
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && hasRoom && !roomLoading) {
        // Page is visible again and user has a room - refresh data
        fetchDashboardData();
        if (checkRoomAllocation) {
          checkRoomAllocation();
        }
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [hasRoom, roomLoading]);
  
  // Fetch attendance and outpass data only after room is confirmed
  useEffect(() => {
    if (!loading && dashboardData) {
      const student = dashboardData.student;
      const roomAllocated = (student?.room && student.room !== null) || 
                           (dashboardData.stats?.room && dashboardData.stats.room !== null);
      const hasPendingRoom =
        student?.temporaryRoom ||
        student?.onboardingStatus === 'room_selected' ||
        student?.roomAllocationStatus === 'pending_payment';
      
      // Fetch additional data if room is allocated or pending payment (temporary room selected)
      if (roomAllocated || hasPendingRoom) {
        fetchAttendanceChart();
        fetchOutpassStatus();
        fetchFees(); // Fetch fees to check for unpaid room fees
      }
    }
  }, [loading, dashboardData]);

  // AUTO-OPEN PAYMENT MODAL: Check on dashboard load and when fees change
  useEffect(() => {
    if (showRoomAllocationModal) return;

    const checkPaymentStatus = async () => {
      // Check if forced open flag is set (set when room is selected)
      const forceOpen = sessionStorage.getItem('openRoomPaymentAfterSelection') === 'true';
      
      // Check if student has temporary room or pending payment status
      const student = dashboardData?.student;
      const hasTemporaryRoom = student?.temporaryRoom;
      const hasPendingPaymentStatus = student?.onboardingStatus === 'room_selected' || 
                                      student?.onboardingStatus === 'payment_pending' ||
                                      student?.roomAllocationStatus === 'pending_payment';

      // PRIORITY CHECK: If forceOpen flag is set, show modal immediately
      if (forceOpen) {
        // If we don't have student info yet, wait for it
        if (!studentInfo && !dashboardData) {
          // Dashboard data and student info are still loading, don't remove the flag yet
          return;
        }

        const unpaidFee = fees.find(fee => 
          (fee.feeType === 'rent' || fee.feeType === 'mess_fee') &&
          fee.status !== 'paid' &&
          (fee.amount - (fee.paidAmount || 0)) > 0
        );
        
        // Get amount from unpaidFee first, then student, then default to 0
        const amount = unpaidFee?.amount || student?.amountToPay || 64000; // Default room rent
        
        setUnpaidRoomFee(unpaidFee || {
          feeType: 'rent',
          status: 'pending',
          amount: amount,
          paidAmount: 0,
          description: '🎉 Room selected successfully! Please complete the payment to confirm your allocation.',
        });
        setShowPaymentModal(true);
        sessionStorage.removeItem('openRoomPaymentAfterSelection');
        return;
      }

      // 1) Try backend check (works even if dashboard stats 403)
      try {
        const status = await studentService.checkPaymentModalStatus();
        if (status?.showModal) {
          const unpaid = status.unpaidFees?.find(fee => fee.feeType === 'rent' && fee.status !== 'paid');
          const placeholder = unpaid || {
            feeType: 'rent',
            status: 'pending',
            amount: status.amountToPay || 0,
            paidAmount: 0,
            description: 'Room allocation payment pending. Please proceed to payment.',
          };
          setUnpaidRoomFee(placeholder);
          setShowPaymentModal(true);
          sessionStorage.removeItem('openRoomPaymentAfterSelection');
          return;
        }
      } catch (err) {
        // Fall back to local fee check
      }

      // 2) Fallback: Find unpaid rent or mess fee from local fees
      const unpaidFee = fees.find(fee => 
        (fee.feeType === 'rent' || fee.feeType === 'mess_fee') &&
        fee.status !== 'paid' &&
        (fee.amount - (fee.paidAmount || 0)) > 0
      );

      if (unpaidFee) {
        setUnpaidRoomFee(unpaidFee);
        setShowPaymentModal(true);
        sessionStorage.removeItem('openRoomPaymentAfterSelection');
        return;
      }

      // 3) Check student's payment status directly
      const hasUnpaidStatus = student?.paymentStatus === 'PAYMENT_PENDING' || 
                             student?.paymentStatus === 'NOT_STARTED';

      // 4) If student has temporary room or pending payment status, show modal
      if (hasTemporaryRoom || hasPendingPaymentStatus || hasUnpaidStatus) {
        setUnpaidRoomFee({
          feeType: 'rent',
          status: 'pending',
          amount: student?.amountToPay || 0,
          paidAmount: 0,
          description: 'Room allocation payment pending. Please complete the payment to confirm your room.',
        });
        setShowPaymentModal(true);
        sessionStorage.removeItem('openRoomPaymentAfterSelection');
        return;
      }

      // 4) If forceOpen is set but no fee found yet, show modal with placeholder
      if (forceOpen) {
        setUnpaidRoomFee({
          feeType: 'rent',
          status: 'pending',
          amount: 0,
          paidAmount: 0,
          description: 'Room allocation payment pending. Please proceed to payment.',
        });
        setShowPaymentModal(true);
        sessionStorage.removeItem('openRoomPaymentAfterSelection');
        return;
      }

      // No unpaid fee and no force open
      setUnpaidRoomFee(null);
      setShowPaymentModal(false);
    };

    checkPaymentStatus();
  }, [fees, hasRoom, showRoomAllocationModal, dashboardData, studentInfo]);

  const fetchFees = async () => {
    try {
      const data = await studentService.getFees();
      setFees(data || []);
    } catch (err) {
      // Suppress expected 403 errors (room not allocated)
      if (err.response?.status === 403 && err.response?.data?.message?.includes('room is allocated')) {
        return;
      }
    }
  };

  const fetchStudentInfo = async () => {
    try {
      const profile = await studentService.getProfile();
      if (profile?.student) {
        setStudentInfo({
          name: profile.student.name,
          email: profile.user?.email || profile.student.email,
          phone: profile.user?.phone || profile.student.phone
        });
        
        // If student has a roommate group, fetch it
        if (profile.student.roommateGroup) {
          fetchRoommateGroup();
        }
      }
    } catch (err) {
      // Ignore errors
    }
  };

  const fetchRoommateGroup = async () => {
    try {
      const response = await studentService.getMyRoommateGroup();
      if (response?.group) {
        setRoommateGroup(response.group);
      }
    } catch (err) {
      // Ignore errors
    }
  };

  // Show modal only if no room allocated, hide if room allocated
  useEffect(() => {
    // Check room allocation from dashboard data first (faster), then context
    if (!loading && dashboardData) {
      const student = dashboardData.student;
      const roomAllocated = (student?.room && student.room !== null) || 
                           (dashboardData.stats?.room && dashboardData.stats.room !== null);
      
      if (roomAllocated) {
        // If room is allocated, clear the flags and hide modal
        sessionStorage.removeItem('roomAllocationModalShown');
        clearRoomAllocationErrorFlag();
        setShowRoomAllocationModal(false);
      } else {
        // Show modal if no room allocated
        setShowRoomAllocationModal(true);
      }
    } else if (!loading && !roomLoading) {
      // If context has finished loading, use its result
      if (hasRoom) {
        // If context says room is allocated, hide modal
        setShowRoomAllocationModal(false);
      } else if (hasRoom === false) {
        // If context explicitly says no room, show modal
        setShowRoomAllocationModal(true);
      }
    }
    // If still loading, keep modal hidden (will show if no room found)
  }, [loading, dashboardData, hasRoom, roomLoading]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      let data;
      try {
        data = await studentService.getDashboardStats();
      } catch (err) {
        // Handle 403 room allocation errors gracefully
        if (err.response?.status === 403 && err.response?.data?.message?.includes('room is allocated')) {
          // Show modal for room allocation errors, but don't log to console
          setShowRoomAllocationModal(true);
          // NEW: Still fetch fees/student info so payment modal can show when pending
          fetchFees();
          fetchStudentInfo();
          setLoading(false);
          return;
        }
        // Re-throw other errors
        throw err;
      }
      
      // Check if student profile exists
      if (!data.student) {
        setError('Student profile not found. Please contact administrator to create your student profile.');
        // Don't show snackbar - we'll show modal instead if needed
      }
      
      setDashboardData(data);
      
      // Immediately check room allocation and hide modal if room found
      const student = data.student;
      const roomAllocated = (student?.room && student.room !== null) || 
                           (data.stats?.room && data.stats.room !== null);
      
      if (roomAllocated) {
        // Hide modal if room is allocated
        setShowRoomAllocationModal(false);
        sessionStorage.removeItem('roomAllocationModalShown');
        clearRoomAllocationErrorFlag();
      } else {
        // Show modal if no room allocated
        setShowRoomAllocationModal(true);
      }
      
      // If student has a roommate group, fetch the latest group data
      if (student?.roommateGroup) {
        fetchRoommateGroup();
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to load dashboard data';
      setError(errorMessage);
      
      // Don't show snackbar for room allocation errors - modal will handle it
      if (err.response?.status === 403 && errorMessage.includes('room is allocated')) {
        // Show modal for room allocation errors
        setShowRoomAllocationModal(true);
        // NEW: Still fetch fees/student info so payment modal can show when pending
        fetchFees();
        fetchStudentInfo();
        // Don't log expected 403 errors
        return;
      }
      
      // Only show snackbar for non-404 errors (404 means student profile not found)
      if (err.response?.status !== 404) {
        enqueueSnackbar(errorMessage, { variant: 'error' });
      } else {
        // For 404, show a more helpful message
        enqueueSnackbar('Student profile not found. Please contact administrator.', { variant: 'warning' });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleViewAvailableRooms = () => {
    setShowRoomAllocationModal(false);
    // Mark intro as completed so the big onboarding modal won't show again in this session
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('roomAllocationIntroCompleted', 'true');
    }
    setRoomIntroCompleted(true);
    navigate('/app/student/my-room');
  };

  const handleAIBasedMatching = () => {
    setShowRoomAllocationModal(false);
    // Mark intro as completed so the big onboarding modal won't show again in this session
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('roomAllocationIntroCompleted', 'true');
    }
    setRoomIntroCompleted(true);
    // Navigate to My Room page with AI Matching tab (tab index 2, roomSelectionTab 2)
    navigate('/app/student/my-room?tab=2&subtab=2');
  };

  const handleManualSelection = () => {
    setShowRoomAllocationModal(false);
    // Mark intro as completed so the big onboarding modal won't show again in this session
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('roomAllocationIntroCompleted', 'true');
    }
    setRoomIntroCompleted(true);
    // Navigate to My Room page with Room Selection tab (tab index 2, roomSelectionTab 0)
    navigate('/app/student/my-room?tab=2&subtab=0');
  };

  const handlePayNow = () => {
    // Navigate to payments page
    setShowPaymentModal(false);
    navigate('/app/student/payments');
  };

  const [processingPayment, setProcessingPayment] = useState(false); // Prevent duplicate payment processing

  const handlePaymentSuccess = async (paymentResult) => {
    // Prevent duplicate processing
    if (processingPayment) {
      return;
    }

    try {
      setProcessingPayment(true);
      
      if (!unpaidRoomFee) {
        enqueueSnackbar('Fee not found', { variant: 'error' });
        setProcessingPayment(false);
        return;
      }

      // Check if fee is already fully paid (prevent duplicate payment)
      const remainingAmount = unpaidRoomFee.amount - (unpaidRoomFee.paidAmount || 0);
      if (remainingAmount <= 0) {
        enqueueSnackbar('This fee is already fully paid', { variant: 'warning' });
        setProcessingPayment(false);
        await fetchFees(); // Refresh to get updated fee status
        return;
      }
      
      // Process payment through backend
      // Map payment method correctly (gateway returns 'netbanking', 'upi', etc.)
      const methodMapping = {
        'upi': 'upi',
        'netbanking': 'netbanking',
        'card': 'card',
        'credit_card': 'credit_card',
        'debit_card': 'debit_card'
      };
      
      await studentService.makePayment({
        feeId: unpaidRoomFee._id,
        amount: remainingAmount,
        paymentMethod: methodMapping[paymentResult.method] || 'online_payment',
        transactionId: paymentResult.transactionId,
        notes: `Payment for ${unpaidRoomFee.feeType?.charAt(0).toUpperCase() + unpaidRoomFee.feeType?.slice(1).replace('_', ' ') || 'Fee'} - Gateway: ${paymentResult.paymentId}`
      });
      
      enqueueSnackbar('Payment processed successfully!', { variant: 'success' });
      
      // Check if student is in a group to show appropriate message
      if (dashboardData?.student?.roommateGroup) {
        enqueueSnackbar('✅ Your payment confirmed! Other group members must also pay to finalize room allocation.', { 
          variant: 'info',
          autoHideDuration: 8000 
        });
        // Refresh roommate group to show updated payment status
        await fetchRoommateGroup();
      }
      
      // Close payment gateway modal
      setShowPaymentGatewayModal(false);
      
      // Refresh fees to update the unpaid fee status
      await fetchFees();
      
      // Refresh dashboard to get updated payment status
      await fetchDashboardData();
      
      // Refresh room allocation context
      if (checkRoomAllocation) {
        await checkRoomAllocation();
      }
      
      // Clear session storage so modal can show again if needed
      sessionStorage.removeItem('paymentModalShown');
    } catch (err) {
      // If error is about duplicate transaction, show appropriate message
      if (err.response?.data?.message?.includes('already been processed') || 
          err.response?.data?.message?.includes('already fully paid')) {
        enqueueSnackbar('This payment has already been processed', { variant: 'warning' });
        await fetchFees(); // Refresh to get updated fee status
      } else {
        enqueueSnackbar(err.response?.data?.message || 'Failed to record payment', { variant: 'error' });
      }
    } finally {
      setProcessingPayment(false);
    }
  };

  const handleClosePaymentModal = () => {
    setShowPaymentModal(false);
    // Allow closing, but will show again on next session if still unpaid
  };

  // Don't allow closing modal - user must select a room
  // const handleCloseModal = () => {
  //   setShowRoomAllocationModal(false);
  // };

  const fetchAttendanceChart = async () => {
    try {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 7);
      
      const attendance = await studentService.getAttendance({
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0]
      });

      // Process attendance data for chart
      const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
      const inCount = new Array(7).fill(0);
      const outCount = new Array(7).fill(0);

      attendance.forEach((record) => {
        const dayIndex = new Date(record.date).getDay();
        const adjustedIndex = dayIndex === 0 ? 6 : dayIndex - 1; // Convert Sunday=0 to Sunday=6
        if (record.status === 'present' && record.checkIn) {
          inCount[adjustedIndex]++;
        }
        if (record.status === 'present' && record.checkOut) {
          outCount[adjustedIndex]++;
        }
      });

      setAttendanceData({ days, inCount, outCount });
    } catch (err) {
      // Suppress expected 403 errors (room not allocated)
      if (err.response?.status === 403 && err.response?.data?.message?.includes('room is allocated')) {
        // Expected error - room not allocated, don't log
        return;
      }
    }
  };

  const fetchOutpassStatus = async () => {
    try {
      const requests = await studentService.getOutingRequests();
      const pending = requests.filter(r => r.status === 'pending').length;
      const recent = requests.length > 0 ? requests[0] : null;
      setOutpassData({ pending, recent });
    } catch (err) {
      // Suppress expected 403 errors (room not allocated)
      if (err.response?.status === 403 && err.response?.data?.message?.includes('room is allocated')) {
        // Expected error - room not allocated, don't log
        return;
      }
    }
  };

  // Don't return early - we need to show the modal even during loading
  // The modal will be shown/hidden based on showRoomAllocationModal state

  const stats = dashboardData?.stats || {};
  const student = dashboardData?.student || {};
  const notifications = dashboardData?.notifications || [];

  // Derived flags to control when the onboarding popup should appear
  const hasRoomAllocated =
    !!hasRoom ||
    !!student.room ||
    !!student.temporaryRoom ||
    !!stats.room;

  const hasStartedOnboarding =
    roomIntroCompleted ||
    (!!onboardingStatus && onboardingStatus !== 'pending') ||
    !!student.roommateGroup ||
    !!student.selectedRoomType;

  const shouldShowRoomIntro = !hasRoomAllocated && !hasStartedOnboarding;

  // If loading and no data, show modal with loading indicator
  if (loading && !dashboardData) {
    return (
      <>
        {/* Onboarding Popup - Show only while student has no room and has not started the onboarding flow. */}
        {shouldShowRoomIntro ? (
          <Dialog
            open={showRoomAllocationModal && shouldShowRoomIntro}
            onClose={() => {}}
            maxWidth="sm"
            fullWidth
            disableEscapeKeyDown={true}
            TransitionComponent={Zoom}
            TransitionProps={{ timeout: 500 }}
          >
            <DialogTitle>
              <Stack direction="row" spacing={2} alignItems="center">
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: 56,
                    height: 56,
                    borderRadius: '50%',
                    bgcolor: 'primary.lighter',
                    color: 'primary.main',
                  }}
                >
                  <IconHome size={28} />
                </Box>
                <Typography variant="h5" component="div" fontWeight={600}>
                  🏠 Room Allocation Required
                </Typography>
              </Stack>
            </DialogTitle>
            <DialogContent>
              <Typography variant="body1" sx={{ mt: 2, mb: 3, lineHeight: 1.6, textAlign: 'center' }}>
                How would you like to proceed with your room allocation?
              </Typography>
              <Stack spacing={2} sx={{ mt: 2 }}>
                <Button
                  variant="contained"
                  fullWidth
                  size="large"
                  startIcon={<IconBrain size={20} />}
                  onClick={handleAIBasedMatching}
                  sx={{
                    py: 2,
                    fontSize: '1rem',
                    fontWeight: 600,
                    textTransform: 'none',
                    bgcolor: 'primary.main',
                    '&:hover': {
                      bgcolor: 'primary.dark',
                    },
                  }}
                >
                  🤖 Find AI-Based Roommate Matches
                </Button>
                <Button
                  variant="outlined"
                  fullWidth
                  size="large"
                  startIcon={<IconUsers size={20} />}
                  onClick={handleManualSelection}
                  sx={{
                    py: 2,
                    fontSize: '1rem',
                    fontWeight: 600,
                    textTransform: 'none',
                    borderWidth: 2,
                    '&:hover': {
                      borderWidth: 2,
                    },
                  }}
                >
                  👥 Choose Room Manually
                </Button>
              </Stack>
            </DialogContent>
          </Dialog>
        ) : (
          /* Fallback Modal for non-pending students (kept for safety, but also hidden once intro is completed) */
          <Dialog
            open={showRoomAllocationModal && !roomIntroCompleted}
            onClose={() => {}}
            maxWidth="sm"
            fullWidth
            disableEscapeKeyDown={true}
            TransitionComponent={Zoom}
            TransitionProps={{ timeout: 500 }}
          >
            <DialogTitle>
              <Stack direction="row" spacing={2} alignItems="center">
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: 56,
                    height: 56,
                    borderRadius: '50%',
                    bgcolor: 'error.lighter',
                    color: 'error.main',
                  }}
                >
                  <IconAlertTriangle size={28} />
                </Box>
                <Typography variant="h5" component="div" fontWeight={600}>
                  Room Allocation Required
                </Typography>
              </Stack>
            </DialogTitle>
            <DialogContent>
              <Typography variant="body1" sx={{ mt: 2, mb: 1, lineHeight: 1.6 }}>
                You can access your dashboard features only after your room is allocated.
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Please select a room to continue using the dashboard.
              </Typography>
            </DialogContent>
            <DialogActions sx={{ p: 3, pt: 2, justifyContent: 'center' }}>
              <Button
                variant="contained"
                onClick={handleViewAvailableRooms}
                size="large"
                sx={{
                  py: 1.5,
                  px: 4,
                  fontSize: '1rem',
                  fontWeight: 600,
                  textTransform: 'none',
                }}
              >
                View Available Rooms
              </Button>
            </DialogActions>
          </Dialog>
        )}
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
          <CircularProgress />
        </Box>
      </>
    );
  }

  const studentOverviewData = [
    {
      title: 'My Room',
      value: stats.room?.number || student.room?.roomNumber || 'N/A',
      compare: (stats.room || student.room) ? 'Currently assigned' : 'Not allocated',
      chip: {
        label: (stats.room || student.room) ? 'Active' : 'Pending',
        color: (stats.room || student.room) ? 'success' : 'warning',
        avatar: <IconCheck />
      }
    },
    {
      title: 'Wallet Balance',
      value: `₹${(stats.walletBalance || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`,
      compare: stats.walletBalance > 0 ? 'Available credit' : 'No balance',
      chip: {
        label: stats.walletBalance > 0 ? 'Credit Available' : 'Empty',
        color: stats.walletBalance > 0 ? 'success' : 'default',
        avatar: <Typography variant="body2" fontWeight={700} sx={{ lineHeight: 1, fontFamily: 'system-ui, -apple-system, sans-serif' }}>₹</Typography>
      }
    },
    {
      title: 'Pending Payment',
      value: `₹${(stats.fees?.pending || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`,
      compare: stats.fees?.pending > 0 ? 'Due soon' : 'All paid',
      chip: {
        label: stats.fees?.pending > 0 ? 'Due soon' : 'Paid',
        color: stats.fees?.pending > 0 ? 'warning' : 'success',
        avatar: <Typography variant="body2" fontWeight={700} sx={{ lineHeight: 1, fontFamily: 'system-ui, -apple-system, sans-serif' }}>₹</Typography>
      }
    },
    {
      title: 'Attendance',
      value: `${stats.attendance?.percentage || 0}%`,
      compare: 'This month',
      chip: {
        label: (stats.attendance?.percentage || 0) >= 75 ? 'Good' : 'Low',
        color: (stats.attendance?.percentage || 0) >= 75 ? 'success' : 'warning',
        avatar: <IconCalendar />
      }
    },
    {
      title: 'Complaints',
      value: `${stats.complaints?.pending || 0}`,
      compare: 'Pending',
      chip: {
        label: stats.complaints?.pending > 0 ? 'Active' : 'None',
        color: stats.complaints?.pending > 0 ? 'info' : 'success',
        avatar: <IconClipboard />
      }
    }
  ];

  // Use stats.room first, fall back to student.room for consistency
  const roomData = stats.room || (student.room ? {
    number: student.room.roomNumber,
    building: student.room.building || student.room.block,
    floor: student.room.floor
  } : null);
  
  const myInfo = {
    name: student.name || student.user?.name || 'N/A',
    studentId: student.studentId || 'N/A',
    room: roomData?.number || 'N/A',
    building: roomData?.building || 'N/A',
    floor: roomData?.floor !== null && roomData?.floor !== undefined
      ? roomData.floor === 0
        ? 'Ground Floor'
        : `${roomData.floor}${roomData.floor === 1 ? 'st' : roomData.floor === 2 ? 'nd' : roomData.floor === 3 ? 'rd' : 'th'} Floor`
      : 'N/A',
  };

  return (
    <>
      {/* Payment Modal - Shows if room is allocated but rent fee is unpaid */}
      <Dialog
        open={showPaymentModal && !showRoomAllocationModal && unpaidRoomFee}
        onClose={(event, reason) => {
          // Prevent closing by clicking outside or pressing ESC
          if (reason === 'backdropClick' || reason === 'escapeKeyDown') {
            return;
          }
          handleClosePaymentModal();
        }}
        maxWidth="sm"
        fullWidth
        disableEscapeKeyDown={true}
        TransitionComponent={Zoom}
        TransitionProps={{ 
          timeout: 600,
        }}
        PaperProps={{
          sx: {
            borderRadius: 3,
            boxShadow: theme.shadows[24],
            animation: 'modalEnter 0.5s ease-out',
            '@keyframes modalEnter': {
              '0%': {
                transform: 'scale(0.8) translateY(-20px)',
                opacity: 0,
              },
              '50%': {
                transform: 'scale(1.05) translateY(5px)',
              },
              '100%': {
                transform: 'scale(1) translateY(0)',
                opacity: 1,
              },
            },
          }
        }}
        sx={{
          '& .MuiBackdrop-root': {
            backgroundColor: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(6px)',
            animation: 'backdropFadeIn 0.4s ease-out',
            '@keyframes backdropFadeIn': {
              '0%': {
                opacity: 0,
              },
              '100%': {
                opacity: 1,
              },
            },
          }
        }}
      >
        <DialogTitle>
          <Stack direction="row" spacing={2} alignItems="center">
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 56,
                height: 56,
                borderRadius: '50%',
                bgcolor: 'warning.lighter',
                color: 'warning.main',
                animation: 'iconPulse 2s ease-in-out infinite, iconBounce 0.6s ease-out 0.3s',
                '@keyframes iconPulse': {
                  '0%, 100%': {
                    transform: 'scale(1)',
                    opacity: 1,
                  },
                  '50%': {
                    transform: 'scale(1.1)',
                    opacity: 0.9,
                  },
                },
                '@keyframes iconBounce': {
                  '0%': {
                    transform: 'scale(0) rotate(-180deg)',
                    opacity: 0,
                  },
                  '50%': {
                    transform: 'scale(1.2) rotate(10deg)',
                  },
                  '100%': {
                    transform: 'scale(1) rotate(0deg)',
                    opacity: 1,
                  },
                },
              }}
            >
              <Typography variant="h4" fontWeight={700} sx={{ lineHeight: 1, fontFamily: 'system-ui, -apple-system, sans-serif' }}>
                ₹
              </Typography>
            </Box>
            <Typography 
              variant="h5" 
              component="div" 
              fontWeight={600}
              sx={{
                animation: 'textSlideIn 0.5s ease-out 0.2s both',
                '@keyframes textSlideIn': {
                  '0%': {
                    opacity: 0,
                    transform: 'translateX(-20px)',
                  },
                  '100%': {
                    opacity: 1,
                    transform: 'translateX(0)',
                  },
                },
              }}
            >
              Payment Required
            </Typography>
          </Stack>
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <Alert 
              severity="warning"
              sx={{
                animation: 'alertPulse 2s ease-in-out infinite',
                '@keyframes alertPulse': {
                  '0%, 100%': {
                    boxShadow: '0 0 0 0 rgba(237, 108, 2, 0.4)',
                  },
                  '50%': {
                    boxShadow: '0 0 0 8px rgba(237, 108, 2, 0)',
                  },
                },
              }}
            >
              <Typography variant="body2" fontWeight={600}>
                🏠 Room Selected! Each student must complete their individual payment to confirm room allocation.
              </Typography>
              {dashboardData?.student?.roommateGroup && (
                <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                  ⚠️ Note: This is your individual payment. All group members must pay separately to confirm the room.
                </Typography>
              )}
            </Alert>
            {unpaidRoomFee && (
              <Card variant="outlined" sx={{ p: 2, bgcolor: 'grey.50' }}>
                <Stack spacing={1}>
                  {dashboardData?.student?.roommateGroup && (
                    <Alert severity="info" sx={{ mb: 1 }}>
                      <Typography variant="caption" fontWeight={600}>
                        💡 Individual Payment: This is YOUR personal payment. Each group member must pay the full amount separately.
                      </Typography>
                    </Alert>
                  )}
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2" color="text.secondary">Fee Type:</Typography>
                    <Typography variant="body2" fontWeight={600}>
                      {unpaidRoomFee.feeType?.charAt(0).toUpperCase() + unpaidRoomFee.feeType?.slice(1).replace('_', ' ')}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2" color="text.secondary">Total Amount:</Typography>
                    <Typography variant="body2" fontWeight={600}>
                      ₹{unpaidRoomFee.amount?.toLocaleString('en-IN')}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2" color="text.secondary">Paid Amount:</Typography>
                    <Typography variant="body2" fontWeight={600} color="success.main">
                      ₹{(unpaidRoomFee.paidAmount || 0).toLocaleString('en-IN')}
                    </Typography>
                  </Box>
                  <Divider />
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="h6" fontWeight={600}>Pending Amount:</Typography>
                    <Typography variant="h6" fontWeight={600} color="error.main">
                      ₹{(unpaidRoomFee.amount - (unpaidRoomFee.paidAmount || 0)).toLocaleString('en-IN')}
                    </Typography>
                  </Box>
                  {unpaidRoomFee.dueDate && (
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2" color="text.secondary">Due Date:</Typography>
                      <Typography 
                        variant="body2" 
                        color={new Date(unpaidRoomFee.dueDate) < new Date() ? 'error.main' : 'text.secondary'}
                        fontWeight={new Date(unpaidRoomFee.dueDate) < new Date() ? 600 : 400}
                      >
                        {new Date(unpaidRoomFee.dueDate).toLocaleDateString('en-IN', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })}
                        {new Date(unpaidRoomFee.dueDate) < new Date() && ' (Overdue)'}
                      </Typography>
                    </Box>
                  )}
                  {unpaidRoomFee.lateFee && unpaidRoomFee.lateFee > 0 && (
                    <Alert severity="error" sx={{ mt: 1 }}>
                      <Typography variant="body2" fontWeight={600}>
                        ⚠️ Late Fee Applied: ₹{unpaidRoomFee.lateFee.toLocaleString('en-IN')}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Late fee of ₹50/day is being added for overdue payments. Please pay as soon as possible to avoid further charges.
                      </Typography>
                    </Alert>
                  )}
                  {unpaidRoomFee.description && (
                    <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>
                      {unpaidRoomFee.description}
                    </Typography>
                  )}
                  {/* Room Amenities Breakdown */}
                  {dashboardData?.student?.room && dashboardData.student.room.amenities && (
                    <>
                      <Divider sx={{ my: 1 }} />
                      <Typography variant="subtitle2" fontWeight={600} color="text.secondary" sx={{ mb: 0.5 }}>
                        Room Amenities:
                      </Typography>
                      <Stack spacing={0.5}>
                        {dashboardData.student.room.amenities.ac && (
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', pl: 1 }}>
                            <Typography variant="body2" color="text.secondary">• AC</Typography>
                            <Typography variant="body2" color="text.secondary">+₹{AMENITY_PRICES.ac.toLocaleString('en-IN')}</Typography>
                          </Box>
                        )}
                        {dashboardData.student.room.amenities.attachedBathroom && (
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', pl: 1 }}>
                            <Typography variant="body2" color="text.secondary">• Attached Bathroom</Typography>
                            <Typography variant="body2" color="text.secondary">+₹{AMENITY_PRICES.attachedBathroom.toLocaleString('en-IN')}</Typography>
                          </Box>
                        )}
                        {dashboardData.student.room.amenities.geyser && (
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', pl: 1 }}>
                            <Typography variant="body2" color="text.secondary">• Geyser</Typography>
                            <Typography variant="body2" color="text.secondary">+₹{AMENITY_PRICES.geyser.toLocaleString('en-IN')}</Typography>
                          </Box>
                        )}
                        {dashboardData.student.room.amenities.wifi && (
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', pl: 1 }}>
                            <Typography variant="body2" color="text.secondary">• Wi-Fi</Typography>
                            <Typography variant="body2" color="text.secondary">+₹{AMENITY_PRICES.wifi.toLocaleString('en-IN')}</Typography>
                          </Box>
                        )}
                        {dashboardData.student.room.amenities.extraFurniture && (
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', pl: 1 }}>
                            <Typography variant="body2" color="text.secondary">• Extra Furniture</Typography>
                            <Typography variant="body2" color="text.secondary">+₹{AMENITY_PRICES.extraFurniture.toLocaleString('en-IN')}</Typography>
                          </Box>
                        )}
                        {dashboardData.student.room.amenities.fanCount > 0 && (
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', pl: 1 }}>
                            <Typography variant="body2" color="text.secondary">• Fans ({dashboardData.student.room.amenities.fanCount})</Typography>
                            <Typography variant="body2" color="text.secondary">+₹{(AMENITY_PRICES.fan * dashboardData.student.room.amenities.fanCount).toLocaleString('en-IN')}</Typography>
                          </Box>
                        )}
                      </Stack>
                      <Divider sx={{ my: 1 }} />
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="body2" fontWeight={600}>Base Price ({dashboardData.student.room.roomType || 'Room'}):</Typography>
                        <Typography variant="body2" fontWeight={600}>
                          ₹{(BASE_ROOM_PRICES[dashboardData.student.room.roomType] || 0).toLocaleString('en-IN')}
                        </Typography>
                      </Box>
                    </>
                  )}
                </Stack>
              </Card>
            )}
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 3, pt: 2, justifyContent: 'center', gap: 2 }}>
          <Button
            variant="outlined"
            onClick={handleClosePaymentModal}
            size="large"
            sx={{
              py: 1.5,
              px: 4,
              fontSize: '1rem',
              fontWeight: 600,
              textTransform: 'none',
            }}
          >
            Pay Later
          </Button>
          <Button
            variant="contained"
            onClick={handlePayNow}
            size="large"
            sx={{
              py: 1.5,
              px: 4,
              fontSize: '1rem',
              fontWeight: 600,
              textTransform: 'none',
              boxShadow: theme.shadows[4],
              animation: 'buttonSlideUp 0.5s ease-out 0.5s both',
              '@keyframes buttonSlideUp': {
                '0%': {
                  opacity: 0,
                  transform: 'translateY(20px) scale(0.9)',
                },
                '100%': {
                  opacity: 1,
                  transform: 'translateY(0) scale(1)',
                },
              },
              '&:hover': {
                boxShadow: theme.shadows[12],
                transform: 'translateY(-3px) scale(1.02)',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              },
              '&:active': {
                transform: 'translateY(-1px) scale(0.98)',
              },
            }}
            startIcon={<Typography variant="body1" fontWeight={700} sx={{ lineHeight: 1, fontFamily: 'system-ui, -apple-system, sans-serif' }}>₹</Typography>}
          >
            Complete Payment Now
          </Button>
        </DialogActions>
      </Dialog>

      {/* Room Allocation Modal - Blocks all interaction until room is allocated */}
      <Dialog 
        open={showRoomAllocationModal && shouldShowRoomIntro} 
        onClose={() => {}} // Prevent closing by clicking outside
        maxWidth="sm"
        fullWidth
        disableEscapeKeyDown={true} // Prevent closing with ESC key
        TransitionComponent={Zoom}
        TransitionProps={{ 
          timeout: 500,
          style: {
            transitionDelay: showRoomAllocationModal ? '100ms' : '0ms',
          }
        }}
        PaperProps={{
          sx: {
            borderRadius: 3,
            boxShadow: theme.shadows[24],
            animation: 'modalEnter 0.5s ease-out',
            '@keyframes modalEnter': {
              '0%': {
                transform: 'scale(0.8) translateY(-20px)',
                opacity: 0,
              },
              '50%': {
                transform: 'scale(1.05) translateY(5px)',
              },
              '100%': {
                transform: 'scale(1) translateY(0)',
                opacity: 1,
              },
            },
          }
        }}
        sx={{
          '& .MuiBackdrop-root': {
            backgroundColor: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(6px)',
            animation: 'backdropFadeIn 0.4s ease-out',
            '@keyframes backdropFadeIn': {
              '0%': {
                opacity: 0,
              },
              '100%': {
                opacity: 1,
              },
            },
          }
        }}
      >
        <DialogTitle>
          <Stack direction="row" spacing={2} alignItems="center">
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 56,
                height: 56,
                borderRadius: '50%',
                bgcolor: (onboardingStatus === 'pending' || (!onboardingStatus && !hasRoom)) ? 'primary.lighter' : 'error.lighter',
                color: (onboardingStatus === 'pending' || (!onboardingStatus && !hasRoom)) ? 'primary.main' : 'error.main',
                animation: 'iconPulse 2s ease-in-out infinite, iconBounce 0.6s ease-out 0.3s',
                '@keyframes iconPulse': {
                  '0%, 100%': {
                    transform: 'scale(1)',
                    opacity: 1,
                  },
                  '50%': {
                    transform: 'scale(1.1)',
                    opacity: 0.9,
                  },
                },
                '@keyframes iconBounce': {
                  '0%': {
                    transform: 'scale(0) rotate(-180deg)',
                    opacity: 0,
                  },
                  '50%': {
                    transform: 'scale(1.2) rotate(10deg)',
                  },
                  '100%': {
                    transform: 'scale(1) rotate(0deg)',
                    opacity: 1,
                  },
                },
              }}
            >
              {shouldShowRoomIntro ? (
                <IconHome size={28} />
              ) : (
                <IconAlertTriangle size={28} />
              )}
            </Box>
            <Typography 
              variant="h5" 
              component="div" 
              fontWeight={600}
              sx={{
                animation: 'textSlideIn 0.5s ease-out 0.2s both',
                '@keyframes textSlideIn': {
                  '0%': {
                    opacity: 0,
                    transform: 'translateX(-20px)',
                  },
                  '100%': {
                    opacity: 1,
                    transform: 'translateX(0)',
                  },
                },
              }}
            >
              {shouldShowRoomIntro ? '🏠 Room Allocation Required' : 'Room Allocation Required'}
            </Typography>
          </Stack>
        </DialogTitle>
        <DialogContent>
          {/* Show new popup for ALL students without rooms - unified experience */}
          <>
            <Typography 
              variant="body1" 
              sx={{ 
                mt: 2, 
                mb: 3, 
                lineHeight: 1.6,
                textAlign: 'center',
                animation: 'fadeInUp 0.5s ease-out 0.3s both',
                '@keyframes fadeInUp': {
                  '0%': {
                    opacity: 0,
                    transform: 'translateY(10px)',
                  },
                  '100%': {
                    opacity: 1,
                    transform: 'translateY(0)',
                  },
                },
              }}
            >
              How would you like to proceed with your room allocation?
            </Typography>
            <Stack spacing={2} sx={{ mt: 2 }}>
              <Button
                variant="contained"
                fullWidth
                size="large"
                startIcon={<IconBrain size={20} />}
                onClick={handleAIBasedMatching}
                sx={{
                  py: 2,
                  fontSize: '1rem',
                  fontWeight: 600,
                  textTransform: 'none',
                  bgcolor: 'primary.main',
                  boxShadow: theme.shadows[4],
                  animation: 'buttonSlideUp 0.5s ease-out 0.4s both',
                  '@keyframes buttonSlideUp': {
                    '0%': {
                      opacity: 0,
                      transform: 'translateY(20px) scale(0.9)',
                    },
                    '100%': {
                      opacity: 1,
                      transform: 'translateY(0) scale(1)',
                    },
                  },
                  '&:hover': {
                    bgcolor: 'primary.dark',
                    boxShadow: theme.shadows[12],
                    transform: 'translateY(-3px) scale(1.02)',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  },
                  '&:active': {
                    transform: 'translateY(-1px) scale(0.98)',
                  },
                }}
              >
                🤖 Find AI-Based Roommate Matches
              </Button>
              <Button
                variant="outlined"
                fullWidth
                size="large"
                startIcon={<IconUsers size={20} />}
                onClick={handleManualSelection}
                sx={{
                  py: 2,
                  fontSize: '1rem',
                  fontWeight: 600,
                  textTransform: 'none',
                  borderWidth: 2,
                  animation: 'buttonSlideUp 0.5s ease-out 0.5s both',
                  '@keyframes buttonSlideUp': {
                    '0%': {
                      opacity: 0,
                      transform: 'translateY(20px) scale(0.9)',
                    },
                    '100%': {
                      opacity: 1,
                      transform: 'translateY(0) scale(1)',
                    },
                  },
                  '&:hover': {
                    borderWidth: 2,
                    transform: 'translateY(-3px) scale(1.02)',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  },
                  '&:active': {
                    transform: 'translateY(-1px) scale(0.98)',
                  },
                }}
              >
                👥 Choose Room Manually
              </Button>
            </Stack>
          </>
        </DialogContent>
      </Dialog>

      {/* Hide dashboard content if room not allocated or payment pending */}
      <Box sx={{ 
        opacity: (showRoomAllocationModal && shouldShowRoomIntro) || showPaymentModal ? 0.3 : 1,
        pointerEvents: (showRoomAllocationModal && shouldShowRoomIntro) || showPaymentModal ? 'none' : 'auto',
        filter: (showRoomAllocationModal && shouldShowRoomIntro) || showPaymentModal ? 'blur(3px)' : 'none',
        transition: 'all 0.3s ease-in-out',
        position: 'relative',
      }}>
      {showRoomAllocationModal && shouldShowRoomIntro ? (
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          minHeight: '60vh',
        }}>
          <Typography variant="h6" color="text.secondary">
            Please allocate a room to access dashboard features
          </Typography>
        </Box>
      ) : showPaymentModal ? (
        <Box sx={{ 
          display: 'flex', 
          flexDirection: 'column',
          justifyContent: 'center', 
          alignItems: 'center', 
          minHeight: '60vh',
          gap: 2,
        }}>
          <Typography variant="h5" color="warning.main" fontWeight={600}>
            Payment Required
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ textAlign: 'center', maxWidth: 500 }}>
            Please complete your room payment to unlock all dashboard features and confirm your room allocation.
          </Typography>
        </Box>
      ) : (
      <Grid container spacing={{ xs: 2, md: 3 }}>
        <Grid size={12}>
          <Typography variant="h4" sx={{ mb: 2 }}>Student Dashboard</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Welcome back! Here's your hostel information and activities
          </Typography>
        </Grid>

      <Grid size={12}>
        <Grid container sx={{ borderRadius: 4, boxShadow: theme.customShadows.section, ...applyBorderWithRadius(16, theme) }}>
          {studentOverviewData.map((item, index) => (
            <Grid key={index} size={{ xs: 6, sm: 6, md: 3 }}>
              <OverviewCard {...{ ...item, cardProps: { sx: { border: 'none', borderRadius: 0, boxShadow: 'none' } } }} />
            </Grid>
          ))}
        </Grid>
      </Grid>

      {/* Room Change Request Banner */}
      {stats.pendingRoomChangeRequest && (
        <Grid size={12}>
          <Alert 
            severity={
              stats.pendingRoomChangeRequest.status === 'pending_payment' 
                ? 'warning' 
                : stats.pendingRoomChangeRequest.status === 'approved' 
                  ? 'success' 
                  : 'info'
            }
            sx={{ 
              borderRadius: 2,
              '& .MuiAlert-message': { width: '100%' }
            }}
          >
            <Stack spacing={1.5}>
              <Typography variant="h6" fontWeight={600}>
                Room Change Request - {stats.pendingRoomChangeRequest.status.replace(/_/g, ' ').toUpperCase()}
              </Typography>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} divider={<Divider orientation="vertical" flexItem />}>
                <Box>
                  <Typography variant="caption" color="text.secondary">Current Room</Typography>
                  <Typography variant="body2" fontWeight={600}>
                    {stats.pendingRoomChangeRequest.currentRoom?.roomNumber} ({stats.pendingRoomChangeRequest.currentRoom?.roomType})
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">Requested Room</Typography>
                  <Typography variant="body2" fontWeight={600}>
                    {stats.pendingRoomChangeRequest.requestedRoom?.roomNumber} ({stats.pendingRoomChangeRequest.requestedRoom?.roomType})
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">Price Difference</Typography>
                  <Typography 
                    variant="body2" 
                    fontWeight={600}
                    color={stats.pendingRoomChangeRequest.priceDifference > 0 ? 'error.main' : stats.pendingRoomChangeRequest.priceDifference < 0 ? 'success.main' : 'text.primary'}
                  >
                    {stats.pendingRoomChangeRequest.priceDifference > 0 ? '+' : ''}
                    ₹{Math.abs(stats.pendingRoomChangeRequest.priceDifference).toLocaleString('en-IN')}
                    {stats.pendingRoomChangeRequest.priceDifference > 0 && ' (Upgrade)'}
                    {stats.pendingRoomChangeRequest.priceDifference < 0 && ' (Downgrade)'}
                  </Typography>
                </Box>
              </Stack>

              {/* Payment/Credit Information */}
              {stats.pendingRoomChangeRequest.upgradePaymentRequired > 0 && (
                <Alert severity="warning" sx={{ mt: 1 }}>
                  <Stack spacing={0.5}>
                    {stats.pendingRoomChangeRequest.alreadyPaidAmount > 0 && (
                      <Typography variant="caption" color="text.secondary">
                        Already Paid for Current Room: ₹{stats.pendingRoomChangeRequest.alreadyPaidAmount.toLocaleString('en-IN')}
                      </Typography>
                    )}
                    <Typography variant="body2" fontWeight={600}>
                      Remaining Payment Required: ₹{stats.pendingRoomChangeRequest.upgradePaymentRequired.toLocaleString('en-IN')}
                    </Typography>
                    <Typography variant="caption">
                      Please complete the payment to proceed with the room upgrade.
                    </Typography>
                  </Stack>
                </Alert>
              )}

              {stats.pendingRoomChangeRequest.downgradeWalletCredit > 0 && (
                <Alert severity="success" sx={{ mt: 1 }}>
                  <Typography variant="body2" fontWeight={600}>
                    Wallet Credit: ₹{stats.pendingRoomChangeRequest.downgradeWalletCredit.toLocaleString('en-IN')}
                  </Typography>
                  <Typography variant="caption">
                    {stats.pendingRoomChangeRequest.status === 'approved' 
                      ? 'This amount has been credited to your wallet and can be used for future payments (mess fees, hostel fees, etc.).'
                      : 'This amount will be credited to your wallet upon approval and can be used for future payments (mess fees, hostel fees, etc.).'}
                  </Typography>
                </Alert>
              )}

              {/* Reason */}
              {stats.pendingRoomChangeRequest.reason && (
                <Box>
                  <Typography variant="caption" color="text.secondary">Reason</Typography>
                  <Typography variant="body2">{stats.pendingRoomChangeRequest.reason}</Typography>
                </Box>
              )}

              {/* Submitted Date */}
              <Typography variant="caption" color="text.secondary">
                Submitted on: {new Date(stats.pendingRoomChangeRequest.createdAt).toLocaleDateString('en-IN', { 
                  day: 'numeric', 
                  month: 'long', 
                  year: 'numeric' 
                })}
              </Typography>
            </Stack>
          </Alert>
        </Grid>
      )}

      <Grid size={{ xs: 12, md: 8 }}>
        <MainCard title="My Information" sx={{ mb: 3 }}>
          <Grid container spacing={3}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <Stack spacing={1}>
                <Typography variant="caption" color="text.secondary">Name</Typography>
                <Typography variant="body1" fontWeight={600}>{myInfo.name}</Typography>
              </Stack>
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <Stack spacing={1}>
                <Typography variant="caption" color="text.secondary">Student ID</Typography>
                <Typography variant="body1" fontWeight={600}>{myInfo.studentId}</Typography>
              </Stack>
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <Stack spacing={1}>
                <Typography variant="caption" color="text.secondary">Room</Typography>
                <Typography variant="body1" fontWeight={600}>{myInfo.room}</Typography>
              </Stack>
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <Stack spacing={1}>
                <Typography variant="caption" color="text.secondary">Building & Floor</Typography>
                <Typography variant="body1" fontWeight={600}>{myInfo.building} - {myInfo.floor}</Typography>
              </Stack>
            </Grid>
          </Grid>
        </MainCard>

        {/* Roommate Group Payment Status */}
        {roommateGroup && roommateGroup.status === 'room_selected' && (
          <MainCard title="🏠 Group Payment Status" sx={{ mb: 3 }}>
            <Stack spacing={2}>
              <Alert severity="info">
                <Typography variant="body2" fontWeight={600}>
                  Each member must pay ₹{dashboardData?.student?.amountToPay?.toLocaleString('en-IN') || '0'} individually to confirm room {roommateGroup.selectedRoom?.roomNumber}
                </Typography>
              </Alert>
              
              <Typography variant="subtitle2" fontWeight={600} color="text.secondary">
                Payment Progress: {roommateGroup.members?.filter(m => m.paymentStatus === 'PAID').length || 0} / {roommateGroup.members?.length || 0} members paid
              </Typography>
              
              <Grid container spacing={2}>
                {roommateGroup.members?.map((member) => (
                  <Grid key={member._id} size={{ xs: 12, sm: 6 }}>
                    <Card variant="outlined" sx={{ p: 2, bgcolor: member.paymentStatus === 'PAID' ? 'success.lighter' : 'warning.lighter' }}>
                      <Stack direction="row" justifyContent="space-between" alignItems="center">
                        <Box>
                          <Typography variant="body2" fontWeight={600}>
                            {member.name}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {member.studentId}
                          </Typography>
                        </Box>
                        <Chip 
                          label={member.paymentStatus === 'PAID' ? '✅ Paid' : '⏳ Pending'} 
                          color={member.paymentStatus === 'PAID' ? 'success' : 'warning'}
                          size="small"
                        />
                      </Stack>
                    </Card>
                  </Grid>
                ))}
              </Grid>
              
              {dashboardData?.student?.paymentStatus !== 'PAID' && (
                <Button 
                  variant="contained" 
                  color="primary"
                  onClick={() => navigate('/app/student/payments')}
                  fullWidth
                  sx={{ mt: 2 }}
                >
                  Complete Your Payment Now
                </Button>
              )}
            </Stack>
          </MainCard>
        )}

        <MainCard title="Attendance Overview" sx={{ mb: 3 }}>
          <Stack spacing={2}>
            <Typography variant="body2" color="text.secondary">
              Daily IN/OUT count for the last 7 days
            </Typography>
            <Box sx={{ width: '100%', height: 300 }}>
              <BarChart
                xAxis={[
                  {
                    scaleType: 'band',
                    data: attendanceData.days,
                    label: 'Days'
                  }
                ]}
                series={[
                  {
                    data: attendanceData.inCount,
                    label: 'IN',
                    color: theme.palette.success.main
                  },
                  {
                    data: attendanceData.outCount,
                    label: 'OUT',
                    color: theme.palette.primary.main
                  }
                ]}
                height={300}
                margin={{ top: 20, right: 20, bottom: 40, left: 40 }}
              />
            </Box>
          </Stack>
        </MainCard>

        <MainCard title="Notifications" sx={{ height: 1 }}>
          <Stack spacing={2}>
            {notifications.length === 0 ? (
              <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 3 }}>
                No new notifications
              </Typography>
            ) : (
              notifications.map((notification) => (
                <Card key={notification._id} variant="outlined" sx={{ p: 2 }}>
                  <Stack spacing={1}>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <IconBell size={20} />
                      <Typography variant="subtitle2">{notification.title}</Typography>
                      <Chip label={notification.type} size="small" color="primary" variant="outlined" sx={{ ml: 'auto' }} />
                    </Stack>
                    <Typography variant="body2" color="text.secondary">
                      {notification.message}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {notification.sentAt ? new Date(notification.sentAt).toLocaleString() : 'Recently'}
                    </Typography>
                  </Stack>
                </Card>
              ))
            )}
          </Stack>
        </MainCard>
      </Grid>

      <Grid size={{ xs: 12, md: 4 }}>
        <MainCard title="Upcoming Meal Plan" sx={{ mb: 3 }}>
          <Stack spacing={2}>
            <Box>
              <Typography variant="subtitle2" gutterBottom>Today's Menu</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                Check Mess & Meal Plan section for today's menu
              </Typography>
            </Box>
          </Stack>
        </MainCard>

        <MainCard title="Outpass Status" sx={{ mb: 3 }}>
          <Stack spacing={2}>
            {outpassData.pending > 0 && outpassData.recent && (
              <Box>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Pending Requests: {outpassData.pending}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Recent: {outpassData.recent.purpose} ({outpassData.recent.status})
                </Typography>
              </Box>
            )}
            {outpassData.pending === 0 && (
              <Typography variant="body2" color="text.secondary">No pending outpass requests</Typography>
            )}
          </Stack>
        </MainCard>

        <MainCard title="Cleaning Schedule" sx={{ height: 1 }}>
          <Stack spacing={2}>
            <Box>
              <Typography variant="subtitle2" gutterBottom>Cleaning Information</Typography>
              <Typography variant="body2" color="text.secondary">
                Check Cleaning section for schedule details
              </Typography>
            </Box>
          </Stack>
        </MainCard>
      </Grid>
    </Grid>
      )}
      </Box>

      {/* Payment Gateway Modal */}
      {unpaidRoomFee && (
        <PaymentModal
          open={showPaymentGatewayModal}
          onClose={() => setShowPaymentGatewayModal(false)}
          fee={unpaidRoomFee}
          onPaymentSuccess={handlePaymentSuccess}
          studentInfo={studentInfo}
        />
      )}
    </>
  );
}

