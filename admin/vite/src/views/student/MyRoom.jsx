import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

// @mui
import Box from '@mui/material/Box';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Grid from '@mui/material/Grid';
import Card from '@mui/material/Card';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';
import Chip from '@mui/material/Chip';
import Button from '@mui/material/Button';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';
import TextField from '@mui/material/TextField';
import Alert from '@mui/material/Alert';
import FormControl from '@mui/material/FormControl';
import FormLabel from '@mui/material/FormLabel';
import RadioGroup from '@mui/material/RadioGroup';
import FormControlLabel from '@mui/material/FormControlLabel';
import Radio from '@mui/material/Radio';
import Slider from '@mui/material/Slider';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import InputLabel from '@mui/material/InputLabel';
import CircularProgress from '@mui/material/CircularProgress';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';

// @project
import ComponentsWrapper from '@/components/ComponentsWrapper';
import PresentationCard from '@/components/cards/PresentationCard';
import TabPanel from '@/components/TabPanel';
import studentService from '@/services/studentService';
import { useSnackbar } from 'notistack';
import { clearRoomAllocationErrorFlag } from '@/utils/roomAllocationErrorHandler';
import { useRoomAllocation } from '@/contexts/RoomAllocationContext';
import { BASE_ROOM_PRICES, AMENITY_PRICES, getAmenityPriceBreakdown, formatPrice } from '@/utils/amenitiesPricing';

// @icons
import { IconDoor, IconUsers, IconFileText, IconHome, IconCheck, IconX, IconUserSearch, IconBrain, IconClock, IconHistory, IconAlertTriangle } from '@tabler/icons-react';

/***************************  MY ROOM PAGE  ***************************/

export default function MyRoomPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { enqueueSnackbar } = useSnackbar();
  const { checkRoomAllocation, hasRoom, loading: roomLoading } = useRoomAllocation();
  const [value, setValue] = useState(0);
  const [roomSelectionTab, setRoomSelectionTab] = useState(0);
  
  // Handle URL parameters for tab navigation from onboarding popup
  useEffect(() => {
    const tabParam = searchParams.get('tab');
    const subtabParam = searchParams.get('subtab');
    
    if (tabParam !== null) {
      const tabIndex = parseInt(tabParam);
      if (!isNaN(tabIndex) && tabIndex >= 0 && tabIndex <= 3) {
        setValue(tabIndex);
        
        // If navigating to Room Selection tab (index 2), also set subtab
        if (tabIndex === 2 && subtabParam !== null) {
          const subtabIndex = parseInt(subtabParam);
          if (!isNaN(subtabIndex) && subtabIndex >= 0 && subtabIndex <= 4) {
            setRoomSelectionTab(subtabIndex);
          }
        }
      }
    }
    
    // Clean up URL params after navigation
    if (tabParam || subtabParam) {
      setSearchParams({});
    }
  }, [searchParams, setSearchParams]);
  const [loading, setLoading] = useState(true);
  const [roomDetails, setRoomDetails] = useState(null);
  const [roommates, setRoommates] = useState([]);
  const [availableRooms, setAvailableRooms] = useState([]);
  const [roomRequests, setRoomRequests] = useState([]);
  const [availableStudents, setAvailableStudents] = useState([]);
  const [roommateRequests, setRoommateRequests] = useState([]);
  const [matchingHistory, setMatchingHistory] = useState([]);
  const [aiMatches, setAiMatches] = useState([]);
  const [aiMatchedGroups, setAiMatchedGroups] = useState([]);
  const [loadingGroups, setLoadingGroups] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [selectRoomDialogOpen, setSelectRoomDialogOpen] = useState(false);
  const [currentRoommateGroup, setCurrentRoommateGroup] = useState(null); // Current active roommate group
  const [loadingCurrentGroup, setLoadingCurrentGroup] = useState(false);
  const [currentStudentId, setCurrentStudentId] = useState(null); // Current student's ID
  const [selectedRoomForGroup, setSelectedRoomForGroup] = useState('');
  const [roomChangeReason, setRoomChangeReason] = useState('');
  const [selectedRoomId, setSelectedRoomId] = useState('');
  const [roomRequestNote, setRoomRequestNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [roomChangeRequest, setRoomChangeRequest] = useState({
    status: 'None',
    requestedDate: null,
    reason: null
  });
  const [aiPreferences, setAiPreferences] = useState({
    sleepSchedule: '10 PM - 7 AM',
    cleanliness: 5,
    studyHabits: 'Quiet',
    noiseTolerance: 5,
    lifestyle: 'Balanced'
  });
  
  // Ensure Select values are never undefined
  const sleepScheduleValue = aiPreferences.sleepSchedule || '10 PM - 7 AM';
  const studyHabitsValue = aiPreferences.studyHabits || 'Quiet';
  const lifestyleValue = aiPreferences.lifestyle || 'Balanced';
  const [studentGender, setStudentGender] = useState(null);
  const [onboardingStatus, setOnboardingStatus] = useState('pending');
  const [selectedRoomType, setSelectedRoomType] = useState(null);
  const [preferredRoommates, setPreferredRoommates] = useState([]);

  useEffect(() => {
    // Fetch student profile to get gender, onboarding status, room type, and preferred roommates
    const fetchStudentProfile = async () => {
      try {
        const profile = await studentService.getProfile();
        if (profile?.student?.gender) {
          setStudentGender(profile.student.gender);
        }
        if (profile?.student?.onboardingStatus) {
          setOnboardingStatus(profile.student.onboardingStatus);
        }
        if (profile?.student?._id) {
          setCurrentStudentId(profile.student._id);
        }
        if (profile?.student?.selectedRoomType) {
          setSelectedRoomType(profile.student.selectedRoomType);
        }
        if (profile?.student?.preferredRoommates) {
          setPreferredRoommates(profile.student.preferredRoommates);
        }
        // Always try to fetch roommate group (backend will search by membership if reference not set)
        await fetchCurrentRoommateGroup();
      } catch (err) {
        // Ignore errors - gender will be set from rooms if available
      }
    };
    
    fetchStudentProfile();
  }, []);

  useEffect(() => {
    // Wait for room allocation status to be determined
    if (roomLoading) return;
    
    // Only fetch room details if room is allocated
    if (value === 0) {
      if (hasRoom) {
        fetchRoomDetails();
      } else {
        // Don't fetch if room not allocated - prevents 403 errors
        setRoomDetails(null);
        setRoommates([]);
        setLoading(false);
      }
    } else if (value === 2 && roomSelectionTab === 0) {
      // Room selection is always available (doesn't require room allocation)
      fetchAvailableRooms();
      fetchRoomRequests();
    } else if (value === 2 && roomSelectionTab === 1) {
      // Roommate Selection tab - available even without room (for group formation)
      fetchRoommateRequests(); // Always fetch requests (group requests don't require room)
      // Fetch current group first, then fetch AI-matched groups (which checks for active groups)
      fetchCurrentRoommateGroup().then(() => {
        // Fetch AI-matched groups to show in this tab (only if no active group)
        if (!hasRoom) {
          fetchAIMatchedGroups();
        }
      });
      if (hasRoom) {
        fetchAvailableStudents();
      }
    } else if (value === 2 && roomSelectionTab === 2) {
      // AI Matching tab - available even without room
      fetchAIPreferences();
      // Fetch roommate requests to show in AI Matching tab
      fetchRoommateRequests();
      // Fetch current roommate group (always, regardless of room status)
      fetchCurrentRoommateGroup();
      // Only fetch matches if student doesn't have a room
      if (!hasRoom) {
        fetchAIMatches();
        fetchAIMatchedGroups();
      }
    } else if (value === 2 && roomSelectionTab === 4) {
      // Matching History tab
      if (hasRoom) {
        fetchMatchingHistory();
      }
    } else if (value === 3) {
      if (hasRoom) {
        fetchRoomChangeRequest();
      }
    }
  }, [value, roomSelectionTab, hasRoom, roomLoading]);

  // Don't show modal on My Room page - only on dashboard
  // Modal is handled by dashboard component

  const fetchRoomChangeRequest = async () => {
    try {
      const response = await studentService.getRoomChangeRequest();
      if (response.roomChangeRequest) {
        const request = response.roomChangeRequest;
        setRoomChangeRequest({
          status: request.status === 'pending' ? 'Pending' : 
                  request.status === 'pending_payment' ? 'Pending Payment' :
                  request.status === 'under_review' ? 'Under Review' :
                  request.status === 'approved' ? 'Approved' :
                  request.status === 'rejected' ? 'Rejected' : 'None',
          requestedDate: request.createdAt ? new Date(request.createdAt).toISOString().split('T')[0] : null,
          reason: request.reason || null
        });
      } else {
        setRoomChangeRequest({
          status: 'None',
          requestedDate: null,
          reason: null
        });
      }
    } catch (err) {
      // Suppress expected 403 errors
      if (err.response?.status === 403) {
        setRoomChangeRequest({
          status: 'None',
          requestedDate: null,
          reason: null
        });
        return;
      }
      setRoomChangeRequest({
        status: 'None',
        requestedDate: null,
        reason: null
      });
    }
  };

  const fetchRoomDetails = async () => {
    try {
      setLoading(true);
      const data = await studentService.getRoomDetails();
      setRoomDetails(data.room);
      setRoommates(data.roommates || []);
    } catch (err) {
      // Suppress expected 403 errors (room not allocated)
      if (err.response?.status === 403 && err.response?.data?.message?.includes('room is allocated')) {
        // Expected error - room not allocated, don't show toast
        setRoomDetails(null);
        setRoommates([]);
        return;
      }
      enqueueSnackbar(err.response?.data?.message || 'Failed to load room details', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableRooms = async () => {
    try {
      const rooms = await studentService.getAvailableRooms();
      setAvailableRooms(rooms);
      
      // Extract student gender from first room or profile if available
      if (rooms.length > 0 && rooms[0].gender) {
        setStudentGender(rooms[0].gender);
      } else {
        // Try to get gender from student profile
        try {
          const profile = await studentService.getProfile();
          if (profile?.student?.gender) {
            setStudentGender(profile.student.gender);
          }
        } catch (profileErr) {
          // Ignore profile fetch errors
        }
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Failed to load available rooms';
      
      // Check if error is about gender not being set
      if (errorMessage.includes('gender') || errorMessage.includes('Gender')) {
        enqueueSnackbar(
          'Please update your profile with your gender (Boys/Girls) to view available rooms.',
          { variant: 'warning', autoHideDuration: 6000 }
        );
        setAvailableRooms([]);
      } else {
        enqueueSnackbar(errorMessage, { variant: 'error' });
      }
    }
  };

  const fetchRoomRequests = async () => {
    try {
      const requests = await studentService.getRoomSelectionRequests();
      setRoomRequests(requests);
    } catch (err) {
      enqueueSnackbar(err.response?.data?.message || 'Failed to load room requests', { variant: 'error' });
    }
  };

  const fetchAvailableStudents = async () => {
    try {
      const students = await studentService.getAvailableStudents();
      setAvailableStudents(students || []);
    } catch (err) {
      if (err.response?.status === 400 && err.response?.data?.message?.includes('gender')) {
        enqueueSnackbar(err.response.data.message, { variant: 'warning' });
      } else {
        enqueueSnackbar(err.response?.data?.message || 'Failed to load available students', { variant: 'error' });
      }
      setAvailableStudents([]);
    }
  };

  const fetchRoommateRequests = async () => {
    try {
      const requests = await studentService.getRoommateRequests();
      setRoommateRequests(requests || []);
    } catch (err) {
      enqueueSnackbar(err.response?.data?.message || 'Failed to load roommate requests', { variant: 'error' });
      setRoommateRequests([]);
    }
  };

  const fetchMatchingHistory = async () => {
    try {
      const history = await studentService.getMatchingHistory();
      setMatchingHistory(history || []);
    } catch (err) {
      setMatchingHistory([]);
    }
  };

  const handleChange = (event, newValue) => {
    setValue(newValue);
  };

  const handleRoomSelectionTabChange = (event, newValue) => {
    setRoomSelectionTab(newValue);
  };

  const handleRoomSelection = async (roomId) => {
    // Prevent selection if student already has a room
    if (hasRoom) {
      enqueueSnackbar('You already have a room allocated. Please request a room change if needed.', { variant: 'warning' });
      return;
    }
    
    try {
      setSubmitting(true);
      // Use direct room selection (selectRoom) instead of request
      const response = await studentService.selectRoom(roomId);
      enqueueSnackbar('Room selected successfully! Please proceed to payment.', { variant: 'success' });
      setRoomRequestNote('');
      
      // Set flag to open payment modal
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('openRoomPaymentAfterSelection', 'true');
        sessionStorage.removeItem('paymentModalShown');
      }
      
      // Clear modal flags and refresh room allocation context
      sessionStorage.removeItem('roomAllocationModalShown');
      clearRoomAllocationErrorFlag();
      // Refresh room allocation status in context
      await checkRoomAllocation();
      
      // Navigate to dashboard where payment modal will pop up
      navigate('/app/dashboard');
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Failed to select room';
      enqueueSnackbar(errorMessage, { variant: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleRoomRequest = async (roomId) => {
    try {
      setSubmitting(true);
      await studentService.requestRoomSelection(roomId, roomRequestNote);
      enqueueSnackbar('Room request submitted successfully', { variant: 'success' });
      setRoomRequestNote('');
      fetchRoomRequests();
    } catch (err) {
      enqueueSnackbar(err.response?.data?.message || 'Failed to submit room request', { variant: 'error' });
    } finally {
      setSubmitting(false);
    }
  };


  const handleRoomChangeRequest = () => {
    // Navigate to dedicated room change request page
    navigate('/app/student/room-change-request');
  };

  const fetchAIPreferences = async () => {
    try {
      const profile = await studentService.getProfile();
      if (profile?.student?.aiPreferences) {
        setAiPreferences({
          sleepSchedule: profile.student.aiPreferences.sleepSchedule || '10 PM - 7 AM',
          cleanliness: profile.student.aiPreferences.cleanliness || 5,
          studyHabits: profile.student.aiPreferences.studyHabits || 'Quiet',
          noiseTolerance: profile.student.aiPreferences.noiseTolerance || 5,
          lifestyle: profile.student.aiPreferences.lifestyle || 'Balanced',
        });
      }
    } catch (err) {
      // Ignore errors
    }
  };

  const fetchAIMatches = async () => {
    try {
      // Don't fetch if room type is not selected or is Single
      if (!selectedRoomType || selectedRoomType === 'Single') {
        setAiMatches([]);
        return;
      }
      const response = await studentService.getAIMatches({ 
        minScore: 50,
        roomType: selectedRoomType 
      });
      setAiMatches(response.matches || []);
    } catch (err) {
      // If 400 error (already has room or requires room type), just set empty matches
      if (err.response?.status === 400) {
        setAiMatches([]);
        return;
      }
      setAiMatches([]);
    }
  };

  const fetchCurrentRoommateGroup = async () => {
    try {
      setLoadingCurrentGroup(true);
      const response = await studentService.getMyRoommateGroup();
      if (response && response.group) {
        setCurrentRoommateGroup(response.group);
      } else {
        setCurrentRoommateGroup(null);
      }
    } catch (err) {
      setCurrentRoommateGroup(null);
    } finally {
      setLoadingCurrentGroup(false);
    }
  };

  const fetchAIMatchedGroups = async () => {
    try {
      setLoadingGroups(true);
      // Don't fetch if student already has a room
      if (hasRoom) {
        setAiMatchedGroups([]);
        return;
      }
      // Don't fetch if room type is not selected
      if (!selectedRoomType || selectedRoomType === 'Single') {
        setAiMatchedGroups([]);
        return;
      }
      // Don't fetch if student is already in a confirmed/active group (they can't join another)
      if (currentRoommateGroup && ['confirmed', 'room_selected', 'payment_pending'].includes(currentRoommateGroup.status)) {
        setAiMatchedGroups([]);
        return;
      }
      const response = await studentService.getAIMatchedGroups({ 
        roomType: selectedRoomType, 
        minScore: 50 
      });
      setAiMatchedGroups(response.groups || []);
    } catch (err) {
      // If 400 error (already has room or requires room type), just set empty groups
      if (err.response?.status === 400) {
        setAiMatchedGroups([]);
        return;
      }
      setAiMatchedGroups([]);
    } finally {
      setLoadingGroups(false);
    }
  };

  const handleSelectRoomWithGroup = async () => {
    if (!selectedGroup || !selectedRoomForGroup) {
      enqueueSnackbar('Please select a room', { variant: 'warning' });
      return;
    }

    try {
      setSubmitting(true);
      
      // Check if this is a current roommate group (has _id and members) or an AI-matched group (has students)
      if (selectedGroup._id && (selectedGroup.members || currentRoommateGroup?._id === selectedGroup._id)) {
        // Use new group-based endpoint (PRODUCTION-READY)
        const response = await studentService.selectRoomForGroup(selectedGroup._id, selectedRoomForGroup);
        
        // Check if payment was triggered
        if (response.paymentTriggered) {
          enqueueSnackbar('🎉 Room selected! Opening payment modal...', { variant: 'success' });
        } else {
          enqueueSnackbar('Room selected successfully! All members need to complete payment to confirm allocation.', { variant: 'success' });
        }
        
        await fetchCurrentRoommateGroup(); // Refresh group status
      } else if (selectedGroup.students) {
        // Fallback to old endpoint for AI-matched groups (legacy)
        const profile = await studentService.getProfile();
        const currentStudentId = profile?.student?._id;
        
        const roommateIds = selectedGroup.students
          .filter(s => s._id.toString() !== currentStudentId?.toString())
          .map(s => s._id);
        
        await studentService.selectRoomWithRoommates({
          roomId: selectedRoomForGroup,
          roommateIds: roommateIds,
        });
        
        enqueueSnackbar('Room selected successfully! Please complete payment to confirm allocation.', { variant: 'success' });
      } else {
        enqueueSnackbar('Invalid group data. Please try again.', { variant: 'error' });
        return;
      }
      
      setSelectRoomDialogOpen(false);
      setSelectedGroup(null);
      setSelectedRoomForGroup('');
      await fetchAvailableRooms();
      await fetchAIMatchedGroups();

      // After successful room selection for group, force payment modal on dashboard
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('openRoomPaymentAfterSelection', 'true');
        sessionStorage.removeItem('paymentModalShown');
      }
      // Refresh room allocation context so dashboard shows correct data
      if (checkRoomAllocation) {
        try {
          await checkRoomAllocation();
        } catch (e) {
          // Ignore errors
        }
      }
      navigate('/app/dashboard');
    } catch (error) {
      enqueueSnackbar(error.response?.data?.message || 'Failed to select room', { variant: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  // For non-leader group members: when group status becomes 'room_selected',
  // redirect them to dashboard where payment modal will pop up automatically.
  useEffect(() => {
    if (!currentRoommateGroup || hasRoom) return;
    if (
      currentRoommateGroup.status === 'room_selected' &&
      currentRoommateGroup.selectedRoom
    ) {
      if (typeof window === 'undefined') return;
      const alreadyQueued = sessionStorage.getItem('openRoomPaymentAfterSelection') === 'true';
      if (!alreadyQueued) {
        sessionStorage.setItem('openRoomPaymentAfterSelection', 'true');
        sessionStorage.removeItem('paymentModalShown');
        navigate('/app/dashboard');
      }
    }
  }, [currentRoommateGroup, hasRoom, navigate]);

  // Compute room allocation data from real room details
  const roomAllocation = useMemo(() => {
    if (!roomDetails) {
      return {
        roomNumber: 'N/A',
        building: 'N/A',
        floor: 'N/A',
        roommate: 'No roommates',
        allocationDate: 'N/A',
        status: 'Not Allocated'
      };
    }

    // Get first roommate name (or show count if multiple)
    let roommateDisplay = 'No roommates';
    if (roommates && roommates.length > 0) {
      if (roommates.length === 1) {
        roommateDisplay = roommates[0].name || 'N/A';
      } else {
        roommateDisplay = `${roommates.length} roommates`;
      }
    }

    // Format floor
    const floorDisplay = roomDetails.floor !== null && roomDetails.floor !== undefined
      ? roomDetails.floor === 0
        ? 'Ground Floor'
        : `${roomDetails.floor}${roomDetails.floor === 1 ? 'st' : roomDetails.floor === 2 ? 'nd' : roomDetails.floor === 3 ? 'rd' : 'th'} Floor`
      : 'N/A';

    // Get building/block
    const buildingDisplay = roomDetails.block || roomDetails.building || 'N/A';

    // Get allocation date from room's createdAt or student's room assignment date
    // For now, we'll use room's createdAt or show N/A
    const allocationDate = roomDetails.createdAt 
      ? new Date(roomDetails.createdAt).toLocaleDateString()
      : 'N/A';

    return {
      roomNumber: roomDetails.roomNumber || 'N/A',
      building: buildingDisplay,
      floor: floorDisplay,
      roommate: roommateDisplay,
      allocationDate: allocationDate,
      status: roomDetails.status === 'occupied' || roomDetails.currentOccupancy > 0 ? 'Allocated' : 'Available'
    };
  }, [roomDetails, roommates]);

  // Handler functions for roommate requests
  // NEW: Use group-based endpoint to create RoommateGroup
  const handleSendRoommateRequest = async (recipientId, aiMatchingScore = null) => {
    try {
      setSubmitting(true);
      
      // Check if already in an active group before sending request
      if (currentRoommateGroup && ['pending', 'confirmed', 'room_selected', 'payment_pending'].includes(currentRoommateGroup.status)) {
        enqueueSnackbar(
          `You are already in an active roommate group (${currentRoommateGroup.status}). Please wait for the current group to be finalized or cancelled before sending new requests.`, 
          { variant: 'info', autoHideDuration: 6000 }
        );
        return;
      }
      
      // Use new group-based endpoint that creates RoommateGroup
      const response = await studentService.sendRoommateGroupRequest(recipientId, '', aiMatchingScore);
      enqueueSnackbar('Roommate group request sent successfully', { variant: 'success' });
      await fetchRoommateRequests();
      await fetchAvailableStudents(); // Refresh list
      // Refresh current group status
      await fetchCurrentRoommateGroup();
    } catch (err) {
      // Provide more helpful error messages
      const errorMessage = err.response?.data?.message || 'Failed to send roommate group request';
      if (errorMessage.includes('already in an active roommate group')) {
        enqueueSnackbar(
          'You are already in an active roommate group. Your current group is displayed above. Please wait for it to be finalized or cancelled.', 
          { variant: 'info', autoHideDuration: 6000 }
        );
        // Refresh group to ensure UI is up to date
        await fetchCurrentRoommateGroup();
      } else {
        enqueueSnackbar(errorMessage, { variant: 'error' });
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleAcceptRoommateRequest = async (requestId, isGroupRequest = false) => {
    try {
      setSubmitting(true);
      
      // Find the request in current state to check if it's still pending
      const currentRequest = roommateRequests.find(r => (r._id || r.id) === requestId);
      if (currentRequest && currentRequest.status !== 'Pending') {
        enqueueSnackbar('This request has already been processed.', { variant: 'warning' });
        await fetchRoommateRequests(); // Refresh to get latest status
        return;
      }
      
      // Use group-based endpoint if it's a group request
      if (isGroupRequest) {
        await studentService.respondToRoommateGroupRequest(requestId, 'accept');
        enqueueSnackbar('Roommate group request accepted successfully! Group is now confirmed.', { variant: 'success' });
        await fetchCurrentRoommateGroup(); // Refresh group status
      } else {
        // Use old endpoint for individual requests (legacy)
        await studentService.acceptRoommateRequest(requestId);
        enqueueSnackbar('Roommate request accepted successfully', { variant: 'success' });
      }
      
      // Refresh all data to ensure UI is up to date
      await Promise.all([
        fetchRoommateRequests(),
        fetchMatchingHistory(),
        fetchCurrentRoommateGroup()
      ]);
    } catch (err) {
      // Handle specific error messages
      const errorMessage = err.response?.data?.message || 'Failed to accept roommate request';
      if (errorMessage.includes('already been processed')) {
        enqueueSnackbar('This request has already been processed. Refreshing...', { variant: 'warning' });
        await fetchRoommateRequests(); // Refresh to get latest status
      } else {
        enqueueSnackbar(errorMessage, { variant: 'error' });
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleRejectRoommateRequest = async (requestId, isGroupRequest = false) => {
    try {
      setSubmitting(true);
      
      // Find the request in current state to check if it's still pending
      const currentRequest = roommateRequests.find(r => (r._id || r.id) === requestId);
      if (currentRequest && currentRequest.status !== 'Pending') {
        enqueueSnackbar('This request has already been processed.', { variant: 'warning' });
        await fetchRoommateRequests(); // Refresh to get latest status
        return;
      }
      
      // Use group-based endpoint if it's a group request
      if (isGroupRequest) {
        await studentService.respondToRoommateGroupRequest(requestId, 'reject');
        enqueueSnackbar('Roommate group request rejected', { variant: 'info' });
        await fetchCurrentRoommateGroup(); // Refresh group status (should be null now)
      } else {
        // Use old endpoint for individual requests (legacy)
        await studentService.rejectRoommateRequest(requestId);
        enqueueSnackbar('Roommate request rejected', { variant: 'info' });
      }
      
      // Refresh all data to ensure UI is up to date
      await Promise.all([
        fetchRoommateRequests(),
        fetchCurrentRoommateGroup()
      ]);
    } catch (err) {
      // Handle specific error messages
      const errorMessage = err.response?.data?.message || 'Failed to reject roommate request';
      if (errorMessage.includes('already been processed')) {
        enqueueSnackbar('This request has already been processed. Refreshing...', { variant: 'warning' });
        await fetchRoommateRequests(); // Refresh to get latest status
      } else {
        enqueueSnackbar(errorMessage, { variant: 'error' });
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleSetRoomType = async (roomType) => {
    try {
      setSubmitting(true);
      
      // Call API to set room type
      const response = await studentService.setRoomType(roomType);
      
      // Update local state
      setSelectedRoomType(roomType);
      
      enqueueSnackbar(`${roomType} room type selected successfully`, { variant: 'success' });
      
      // If Single room, navigate to room selection tab
      if (roomType === 'Single') {
        setValue(2); // Room Selection tab group
        setRoomSelectionTab(0); // Choose Room sub-tab
        await fetchAvailableRooms();
      }
      // For shared rooms, the preferences section will automatically show
      // The UI will re-render because selectedRoomType state changed
    } catch (err) {
      enqueueSnackbar(err.response?.data?.message || 'Failed to set room type', { variant: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleSaveAIPreferences = async () => {
    try {
      setSubmitting(true);
      await studentService.updateAIPreferences(aiPreferences);
      enqueueSnackbar('AI preferences saved successfully', { variant: 'success' });
    } catch (err) {
      enqueueSnackbar(err.response?.data?.message || 'Failed to save AI preferences', { variant: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleFindAIMatches = async () => {
    try {
      setSubmitting(true);
      
      // Check if room type is selected
      if (!selectedRoomType) {
        enqueueSnackbar('Please select a room type first before finding matches', { variant: 'warning' });
        return;
      }

      // Single room doesn't need matching
      if (selectedRoomType === 'Single') {
        enqueueSnackbar('Single room selected. You can directly select a room.', { variant: 'info' });
        setValue(2);
        setRoomSelectionTab(0);
        await fetchAvailableRooms();
        return;
      }

      // First save preferences
      await studentService.updateAIPreferences(aiPreferences);
      enqueueSnackbar('Preferences saved successfully', { variant: 'success' });
      
      // Only get matches if student doesn't have a room
      if (hasRoom) {
        enqueueSnackbar('You already have a room allocated. Preferences saved for future reference.', { variant: 'info' });
        return;
      }
      
      // Get matches with room type
      const response = await studentService.getAIMatches({ 
        minScore: 50, 
        roomType: selectedRoomType 
      });
      const matches = response.matches || [];
      setAiMatches(matches);
      
      // Also fetch AI-matched groups with selected room type
      const groupsResponse = await studentService.getAIMatchedGroups({ 
        roomType: selectedRoomType, 
        minScore: 50 
      });
      const groups = groupsResponse.groups || [];
      setAiMatchedGroups(groups);
      
      // IMMEDIATELY navigate to Roommate Selection tab so user can see matches and send requests
      // Do this synchronously right after setting the matches
      setValue(2); // Ensure we're on the Room Selection tab group
      setRoomSelectionTab(1); // Navigate to Roommate Selection sub-tab
      
      // Fetch roommate requests and current group (non-blocking, happens in background)
      // This ensures navigation happens immediately while data loads in the background
      setTimeout(() => {
        fetchRoommateRequests();
        fetchCurrentRoommateGroup();
      }, 100);
      
      // Show appropriate messages based on results
      if (matches.length === 0 && groups.length === 0) {
        // Show debug info if available
        if (response.debugInfo) {
          const reasons = response.debugInfo.possibleReasons?.join(', ') || 'Unknown reason';
          enqueueSnackbar(
            `No matches found. ${reasons}`, 
            { variant: 'info', autoHideDuration: 8000 }
          );
        } else {
          enqueueSnackbar('No matches found. Try adjusting your preferences or check if other students have set their preferences.', { variant: 'info', autoHideDuration: 6000 });
        }
      } else {
        const matchCount = matches.length;
        const groupCount = groups.length;
        enqueueSnackbar(
          `Found ${matchCount} individual match${matchCount !== 1 ? 'es' : ''} and ${groupCount} group${groupCount !== 1 ? 's' : ''}. Navigated to Roommate Selection tab - you can now send requests!`, 
          { variant: 'success', autoHideDuration: 6000 }
        );
      }
    } catch (err) {
      // Check if error is about room type
      if (err.response?.data?.requiresRoomType) {
        enqueueSnackbar('Please select a room type first', { variant: 'warning' });
      } else if (err.response?.status === 400) {
        enqueueSnackbar(err.response?.data?.message || 'You already have a room allocated. Preferences saved for future reference.', { variant: 'info' });
      } else {
        enqueueSnackbar(err.response?.data?.message || 'Failed to find AI matches', { variant: 'error' });
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ComponentsWrapper title="My Room">
      <Box sx={{ width: '100%' }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
          <Tabs value={value} onChange={handleChange}>
            <Tab label="Room Details" icon={<IconDoor size={18} />} iconPosition="start" />
            <Tab label="Roommates" icon={<IconUsers size={18} />} iconPosition="start" />
            <Tab label="Room Selection" icon={<IconHome size={18} />} iconPosition="start" />
            <Tab label="Room Change Request" icon={<IconFileText size={18} />} iconPosition="start" />
          </Tabs>
        </Box>

              {/* Room Details Tab */}
              <TabPanel value={value} index={0}>
                <PresentationCard>
                  {loading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                      <CircularProgress />
                    </Box>
                  ) : onboardingStatus !== 'confirmed' ? (
                    <Alert severity="info">
                      {onboardingStatus === 'pending' 
                        ? 'Please complete roommate matching and room selection first. Your room details will be visible after payment confirmation.'
                        : 'Room selected! Please complete payment to view your room details.'}
                    </Alert>
                  ) : !roomDetails ? (
                    <Alert severity="info">No room allocated yet. Please contact administration.</Alert>
                  ) : (
                    <Grid container spacing={3}>
                      <Grid size={{ xs: 12, md: 6 }}>
                        <Stack spacing={2}>
                          <Typography variant="h6">Room Information</Typography>
                          <Stack spacing={1.5}>
                            <Stack direction="row" justifyContent="space-between">
                              <Typography variant="body2" color="text.secondary">Room Number:</Typography>
                              <Typography variant="body1" fontWeight={600}>{roomDetails.roomNumber}</Typography>
                            </Stack>
                            <Stack direction="row" justifyContent="space-between">
                              <Typography variant="body2" color="text.secondary">Building:</Typography>
                              <Typography variant="body1" fontWeight={600}>{roomDetails.building || 'N/A'}</Typography>
                            </Stack>
                            <Stack direction="row" justifyContent="space-between">
                              <Typography variant="body2" color="text.secondary">Floor:</Typography>
                              <Typography variant="body1" fontWeight={600}>{roomDetails.floor !== null && roomDetails.floor !== undefined ? (roomDetails.floor === 0 ? 'Ground Floor' : `${roomDetails.floor}${roomDetails.floor === 1 ? 'st' : roomDetails.floor === 2 ? 'nd' : roomDetails.floor === 3 ? 'rd' : 'th'} Floor`) : 'N/A'}</Typography>
                            </Stack>
                            <Stack direction="row" justifyContent="space-between">
                              <Typography variant="body2" color="text.secondary">Capacity:</Typography>
                              <Typography variant="body1" fontWeight={600}>{roomDetails.capacity} students</Typography>
                            </Stack>
                            <Stack direction="row" justifyContent="space-between">
                              <Typography variant="body2" color="text.secondary">Status:</Typography>
                              <Chip label={roomDetails.status || 'Occupied'} color="success" size="small" />
                            </Stack>
                          </Stack>
                        </Stack>
                      </Grid>
                      <Grid size={{ xs: 12, md: 6 }}>
                        <Stack spacing={2}>
                          <Typography variant="h6">Room Amenities</Typography>
                          {roomDetails.amenities && (
                            <Card variant="outlined" sx={{ p: 2, bgcolor: 'grey.50' }}>
                              <Stack spacing={1.5}>
                                {roomDetails.amenities.ac && (
                                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <Stack direction="row" spacing={1} alignItems="center">
                                      <Chip label="AC" color="primary" size="small" variant="outlined" />
                                    </Stack>
                                    <Typography variant="body2" color="text.secondary" fontWeight={500}>
                                      +₹{AMENITY_PRICES.ac.toLocaleString('en-IN')}/year
                                    </Typography>
                                  </Box>
                                )}
                                {roomDetails.amenities.attachedBathroom && (
                                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <Stack direction="row" spacing={1} alignItems="center">
                                      <Chip label="Attached Bathroom" color="primary" size="small" variant="outlined" />
                                    </Stack>
                                    <Typography variant="body2" color="text.secondary" fontWeight={500}>
                                      +₹{AMENITY_PRICES.attachedBathroom.toLocaleString('en-IN')}/year
                                    </Typography>
                                  </Box>
                                )}
                                {roomDetails.amenities.geyser && (
                                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <Stack direction="row" spacing={1} alignItems="center">
                                      <Chip label="Geyser" color="primary" size="small" variant="outlined" />
                                    </Stack>
                                    <Typography variant="body2" color="text.secondary" fontWeight={500}>
                                      +₹{AMENITY_PRICES.geyser.toLocaleString('en-IN')}/year
                                    </Typography>
                                  </Box>
                                )}
                                {roomDetails.amenities.wifi && (
                                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <Stack direction="row" spacing={1} alignItems="center">
                                      <Chip label="Wi-Fi" color="primary" size="small" variant="outlined" />
                                    </Stack>
                                    <Typography variant="body2" color="text.secondary" fontWeight={500}>
                                      +₹{AMENITY_PRICES.wifi.toLocaleString('en-IN')}/year
                                    </Typography>
                                  </Box>
                                )}
                                {roomDetails.amenities.extraFurniture && (
                                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <Stack direction="row" spacing={1} alignItems="center">
                                      <Chip label="Extra Furniture" color="primary" size="small" variant="outlined" />
                                    </Stack>
                                    <Typography variant="body2" color="text.secondary" fontWeight={500}>
                                      +₹{AMENITY_PRICES.extraFurniture.toLocaleString('en-IN')}/year
                                    </Typography>
                                  </Box>
                                )}
                                {roomDetails.amenities.fanCount > 0 && (
                                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <Stack direction="row" spacing={1} alignItems="center">
                                      <Chip label={`Fan (${roomDetails.amenities.fanCount}x)`} color="primary" size="small" variant="outlined" />
                                    </Stack>
                                    <Typography variant="body2" color="text.secondary" fontWeight={500}>
                                      +₹{(AMENITY_PRICES.fan * roomDetails.amenities.fanCount).toLocaleString('en-IN')}/year
                                    </Typography>
                                  </Box>
                                )}
                                {!roomDetails.amenities.ac && 
                                 !roomDetails.amenities.attachedBathroom && 
                                 !roomDetails.amenities.geyser && 
                                 !roomDetails.amenities.wifi && 
                                 !roomDetails.amenities.extraFurniture && 
                                 (!roomDetails.amenities.fanCount || roomDetails.amenities.fanCount === 0) && (
                                  <Typography variant="body2" color="text.secondary">
                                    No additional amenities
                                  </Typography>
                                )}
                              </Stack>
                            </Card>
                          )}
                          {roomDetails.amenities && (roomDetails.amenities.ac || roomDetails.amenities.attachedBathroom || roomDetails.amenities.geyser || roomDetails.amenities.wifi || roomDetails.amenities.extraFurniture || (roomDetails.amenities.fanCount > 0)) && (
                            <Card variant="outlined" sx={{ p: 2, bgcolor: 'primary.lighter' }}>
                              <Stack spacing={1}>
                                <Typography variant="subtitle2" fontWeight={600}>Rent Breakdown:</Typography>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                  <Typography variant="body2">Base Price ({roomDetails.roomType || 'Room'}):</Typography>
                                  <Typography variant="body2" fontWeight={600}>
                                    ₹{(BASE_ROOM_PRICES[roomDetails.roomType] || 0).toLocaleString('en-IN')}
                                  </Typography>
                                </Box>
                                {roomDetails.amenitiesPrice > 0 && (
                                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <Typography variant="body2">Amenities:</Typography>
                                    <Typography variant="body2" fontWeight={600}>
                                      +₹{(roomDetails.amenitiesPrice || 0).toLocaleString('en-IN')}
                                    </Typography>
                                  </Box>
                                )}
                                <Divider />
                                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                  <Typography variant="h6" fontWeight={600}>Total Yearly Rent:</Typography>
                                  <Typography variant="h6" fontWeight={600} color="primary.main">
                                    ₹{(roomDetails.totalPrice || roomDetails.rent || 0).toLocaleString('en-IN')}
                                  </Typography>
                                </Box>
                              </Stack>
                            </Card>
                          )}
                        </Stack>
                      </Grid>
                    </Grid>
                  )}
                </PresentationCard>
              </TabPanel>

        {/* Roommates Tab */}
        <TabPanel value={value} index={1}>
          <PresentationCard>
            {onboardingStatus !== 'confirmed' ? (
              <Alert severity="info">
                {onboardingStatus === 'pending' 
                  ? 'Please complete roommate matching and room selection first. Roommate details will be visible after payment confirmation.'
                  : 'Room selected! Please complete payment to view your roommates.'}
              </Alert>
            ) : (
              <TableContainer component={Paper} elevation={0} sx={{ border: 1, borderColor: 'divider', borderRadius: 2 }}>
                <Table>
                  <TableHead>
                    <TableRow sx={{ bgcolor: 'grey.50' }}>
                      <TableCell><strong>Name</strong></TableCell>
                      <TableCell><strong>Student ID</strong></TableCell>
                      <TableCell><strong>Bed</strong></TableCell>
                      <TableCell><strong>Phone</strong></TableCell>
                      <TableCell><strong>Email</strong></TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {roommates.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} align="center">
                          <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
                            No roommates assigned
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ) : (
                      roommates.map((roommate) => (
                        <TableRow key={roommate._id || roommate.id} hover>
                          <TableCell>{roommate.name}</TableCell>
                          <TableCell>{roommate.studentId}</TableCell>
                          <TableCell>N/A</TableCell>
                          <TableCell>{roommate.phone || 'N/A'}</TableCell>
                          <TableCell>{roommate.email || 'N/A'}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </PresentationCard>
        </TabPanel>

        {/* Room Selection Tab */}
        <TabPanel value={value} index={2}>
          <PresentationCard>
            <Box sx={{ width: '100%' }}>
              <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
                <Tabs value={roomSelectionTab} onChange={handleRoomSelectionTabChange}>
                  <Tab label="Choose Room" icon={<IconHome size={16} />} iconPosition="start" />
                  <Tab label="Roommate Selection" icon={<IconUserSearch size={16} />} iconPosition="start" />
                  <Tab label="AI Matching" icon={<IconBrain size={16} />} iconPosition="start" />
                  <Tab label="Allocation Status" icon={<IconClock size={16} />} iconPosition="start" />
                  <Tab label="Matching History" icon={<IconHistory size={16} />} iconPosition="start" />
                </Tabs>
              </Box>

              {/* Choose Room Tab */}
              <TabPanel value={roomSelectionTab} index={0}>
                {onboardingStatus === 'confirmed' ? (
                  <Alert severity="warning">
                    You already have a room allocated. If you need to change your room, please use the room change request feature.
                  </Alert>
                ) : onboardingStatus === 'room_selected' ? (
                  <Alert severity="info">
                    Room selected! Please complete payment to confirm your room allocation. Once payment is confirmed, your room details will be visible.
                  </Alert>
                ) : (
                  <Stack spacing={3}>
                    {onboardingStatus === 'matching' ? (
                      <Alert severity="info">
                        <Typography variant="body2" fontWeight={600} gutterBottom>
                          Roommate group finalized! Now select an available room.
                        </Typography>
                        <Typography variant="body2">
                          {studentGender 
                            ? `Viewing available ${studentGender} rooms that match your group size.`
                            : 'View available rooms that match your group size and select your preferred room.'}
                        </Typography>
                      </Alert>
                    ) : (
                      <Alert severity="info">
                        {studentGender 
                          ? `Viewing available ${studentGender} rooms. You can see current occupants and room details.`
                          : 'View available rooms and select your preferred room. You can see current occupants and room details.'
                        }
                      </Alert>
                    )}
                    
                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                      <Typography variant="h6">Available Rooms</Typography>
                      {studentGender && (
                        <Chip 
                          label={`${studentGender} Rooms Only`} 
                          color="primary" 
                          variant="outlined" 
                          size="small"
                        />
                      )}
                    </Stack>
                    {availableRooms.length === 0 ? (
                      <Alert severity="info">
                        {studentGender 
                          ? `No available ${studentGender} rooms at the moment. Please check back later.`
                          : 'No available rooms at the moment. Please check back later.'
                        }
                      </Alert>
                    ) : (
                    <Grid container spacing={2}>
                      {availableRooms.map((room) => (
                        <Grid key={room._id || room.id} size={{ xs: 12, md: 6 }}>
                          <Card 
                            variant="outlined" 
                            sx={{ 
                              p: 2,
                              border: '2px solid',
                              borderColor: 'primary.main',
                              '&:hover': {
                                boxShadow: 4,
                                transform: 'translateY(-2px)',
                                transition: 'all 0.3s ease-in-out'
                              }
                            }}
                          >
                            <Stack spacing={2}>
                              <Stack direction="row" justifyContent="space-between" alignItems="center">
                                <Stack>
                                  <Typography variant="h5" fontWeight={700} color="primary.main">
                                    Room {room.roomNumber}
                                  </Typography>
                                  <Typography variant="caption" color="text.secondary">
                                    {room.block || room.building || 'N/A'} • {room.floor !== null && room.floor !== undefined ? (room.floor === 0 ? 'Ground Floor' : `${room.floor}${room.floor === 1 ? 'st' : room.floor === 2 ? 'nd' : room.floor === 3 ? 'rd' : 'th'} Floor`) : 'N/A'}
                                  </Typography>
                                </Stack>
                                <Stack alignItems="flex-end" spacing={0.5}>
                                  <Chip 
                                    label={`${room.availableSlots || 0} available`} 
                                    color={room.availableSlots > 0 ? "success" : "error"} 
                                    size="medium"
                                    sx={{ fontWeight: 600 }}
                                  />
                                  <Typography variant="h6" fontWeight={700} color="primary.main">
                                    ₹{(room.totalPrice || room.rent || 0).toLocaleString('en-IN')}/year
                                  </Typography>
                                </Stack>
                              </Stack>
                              <Stack spacing={0.5}>
                                <Typography variant="body2"><strong>Room Type:</strong> {room.roomType || 'Double'}</Typography>
                                <Typography variant="body2"><strong>Block:</strong> {room.block || room.building || 'N/A'}</Typography>
                                <Typography variant="body2"><strong>Floor:</strong> {room.floor !== null && room.floor !== undefined ? (room.floor === 0 ? 'Ground Floor' : `${room.floor}${room.floor === 1 ? 'st' : room.floor === 2 ? 'nd' : room.floor === 3 ? 'rd' : 'th'} Floor`) : 'N/A'}</Typography>
                                <Typography variant="body2"><strong>Capacity:</strong> {room.maxCapacity || room.capacity} students</Typography>
                                <Typography variant="body2"><strong>Current Occupancy:</strong> {room.currentOccupancy || room.occupied} / {room.maxCapacity || room.capacity}</Typography>
                              </Stack>
                              
                              {/* Pricing Breakdown - Enhanced Display */}
                              <Box>
                                <Divider sx={{ my: 1 }} />
                                <Typography variant="subtitle2" gutterBottom fontWeight={600} color="primary.main">
                                  Yearly Rent Breakdown:
                                </Typography>
                                <Card variant="outlined" sx={{ bgcolor: 'primary.lighter', p: 1.5, borderRadius: 1, border: '2px solid', borderColor: 'primary.main' }}>
                                  <Stack spacing={0.5}>
                                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <Typography variant="body2">
                                      Base Price ({room.roomType}):
                                    </Typography>
                                    <Typography variant="body2" fontWeight={500}>
                                      ₹{(BASE_ROOM_PRICES[room.roomType] || 0).toLocaleString('en-IN')}
                                    </Typography>
                                  </Box>
                                  {room.amenities && (room.amenities.ac || room.amenities.attachedBathroom || room.amenities.geyser || room.amenities.wifi || room.amenities.extraFurniture || (room.amenities.fanCount > 0)) && (
                                    <>
                                      <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, fontWeight: 500 }}>Amenities:</Typography>
                                      {room.amenities.ac && (
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', pl: 2 }}>
                                          <Typography variant="body2" color="text.secondary">• AC</Typography>
                                          <Typography variant="body2" color="text.secondary">+₹{AMENITY_PRICES.ac.toLocaleString('en-IN')}</Typography>
                                        </Box>
                                      )}
                                      {room.amenities.attachedBathroom && (
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', pl: 2 }}>
                                          <Typography variant="body2" color="text.secondary">• Attached Bathroom</Typography>
                                          <Typography variant="body2" color="text.secondary">+₹{AMENITY_PRICES.attachedBathroom.toLocaleString('en-IN')}</Typography>
                                        </Box>
                                      )}
                                      {room.amenities.geyser && (
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', pl: 2 }}>
                                          <Typography variant="body2" color="text.secondary">• Geyser</Typography>
                                          <Typography variant="body2" color="text.secondary">+₹{AMENITY_PRICES.geyser.toLocaleString('en-IN')}</Typography>
                                        </Box>
                                      )}
                                      {room.amenities.wifi && (
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', pl: 2 }}>
                                          <Typography variant="body2" color="text.secondary">• Wi-Fi</Typography>
                                          <Typography variant="body2" color="text.secondary">+₹{AMENITY_PRICES.wifi.toLocaleString('en-IN')}</Typography>
                                        </Box>
                                      )}
                                      {room.amenities.extraFurniture && (
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', pl: 2 }}>
                                          <Typography variant="body2" color="text.secondary">• Extra Furniture</Typography>
                                          <Typography variant="body2" color="text.secondary">+₹{AMENITY_PRICES.extraFurniture.toLocaleString('en-IN')}</Typography>
                                        </Box>
                                      )}
                                      {room.amenities.fanCount > 0 && (
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', pl: 2 }}>
                                          <Typography variant="body2" color="text.secondary">• Fan ({room.amenities.fanCount}x)</Typography>
                                          <Typography variant="body2" color="text.secondary">+₹{(AMENITY_PRICES.fan * room.amenities.fanCount).toLocaleString('en-IN')}</Typography>
                                        </Box>
                                      )}
                                    </>
                                  )}
                                  {(!room.amenities || (!room.amenities.ac && !room.amenities.attachedBathroom && !room.amenities.geyser && !room.amenities.wifi && !room.amenities.extraFurniture && (!room.amenities.fanCount || room.amenities.fanCount === 0))) && (
                                    <Typography variant="body2" color="text.secondary" sx={{ pl: 2 }}>No additional amenities</Typography>
                                  )}
                                    <Divider sx={{ my: 0.5 }} />
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 1, bgcolor: 'background.paper', borderRadius: 1 }}>
                                      <Typography variant="h6" fontWeight={700}>Total Yearly Rent:</Typography>
                                      <Typography variant="h6" fontWeight={700} color="primary.main">
                                        ₹{(room.totalPrice || room.rent || 0).toLocaleString('en-IN')}
                                      </Typography>
                                    </Box>
                                  </Stack>
                                </Card>
                              </Box>
                              
                              {/* Show Amenities Chips - Enhanced Display */}
                              {room.amenities && (
                                <Box>
                                  <Divider sx={{ my: 1 }} />
                                  <Typography variant="subtitle2" gutterBottom fontWeight={600}>
                                    Room Amenities:
                                  </Typography>
                                  <Card variant="outlined" sx={{ bgcolor: 'success.lighter', p: 1.5, borderRadius: 1, mt: 1 }}>
                                    <Stack direction="row" spacing={1} flexWrap="wrap" gap={1}>
                                      {room.amenities.ac && (
                                        <Chip 
                                          label="AC" 
                                          color="success" 
                                          size="medium" 
                                          variant="filled"
                                          sx={{ fontWeight: 600 }}
                                        />
                                      )}
                                      {room.amenities.attachedBathroom && (
                                        <Chip 
                                          label="Attached Bathroom" 
                                          color="success" 
                                          size="medium" 
                                          variant="filled"
                                          sx={{ fontWeight: 600 }}
                                        />
                                      )}
                                      {room.amenities.geyser && (
                                        <Chip 
                                          label="Geyser" 
                                          color="success" 
                                          size="medium" 
                                          variant="filled"
                                          sx={{ fontWeight: 600 }}
                                        />
                                      )}
                                      {room.amenities.wifi && (
                                        <Chip 
                                          label="Wi-Fi" 
                                          color="success" 
                                          size="medium" 
                                          variant="filled"
                                          sx={{ fontWeight: 600 }}
                                        />
                                      )}
                                      {room.amenities.extraFurniture && (
                                        <Chip 
                                          label="Extra Furniture" 
                                          color="success" 
                                          size="medium" 
                                          variant="filled"
                                          sx={{ fontWeight: 600 }}
                                        />
                                      )}
                                      {room.amenities.fanCount > 0 && (
                                        <Chip 
                                          label={`${room.amenities.fanCount} Fan(s)`} 
                                          color="success" 
                                          size="medium" 
                                          variant="filled"
                                          sx={{ fontWeight: 600 }}
                                        />
                                      )}
                                      {(!room.amenities.ac && !room.amenities.attachedBathroom && !room.amenities.geyser && !room.amenities.wifi && !room.amenities.extraFurniture && (!room.amenities.fanCount || room.amenities.fanCount === 0)) && (
                                        <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                                          No additional amenities available
                                        </Typography>
                                      )}
                                    </Stack>
                                  </Card>
                                </Box>
                              )}
                              
                              {/* Show current occupants if room is partially occupied */}
                              {room.currentOccupants && room.currentOccupants.length > 0 && (
                                <Box>
                                  <Divider sx={{ my: 1 }} />
                                  <Typography variant="subtitle2" gutterBottom fontWeight={600}>
                                    Current Occupants ({room.currentOccupants.length}):
                                  </Typography>
                                  <Card variant="outlined" sx={{ bgcolor: 'info.lighter', p: 1.5, mt: 1 }}>
                                    <Stack spacing={1}>
                                      {room.currentOccupants.map((occupant, idx) => (
                                        <Box key={idx} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 1, bgcolor: 'background.paper', borderRadius: 1 }}>
                                          <Stack spacing={0.5}>
                                            <Typography variant="body2" fontWeight={600}>
                                              {occupant.name}
                                            </Typography>
                                            <Stack direction="row" spacing={1} flexWrap="wrap" gap={0.5}>
                                              <Chip label={`ID: ${occupant.admissionNumber}`} size="small" variant="outlined" />
                                              <Chip label={occupant.course || 'N/A'} size="small" variant="outlined" color="primary" />
                                              {occupant.batchYear && (
                                                <Chip label={`Batch ${occupant.batchYear}`} size="small" variant="outlined" color="secondary" />
                                              )}
                                              {occupant.roomNumber && (
                                                <Chip label={`Room: ${occupant.roomNumber}`} size="small" variant="outlined" />
                                              )}
                                            </Stack>
                                          </Stack>
                                        </Box>
                                      ))}
                                    </Stack>
                                  </Card>
                                </Box>
                              )}
                              
                              <Button 
                                variant="contained" 
                                size="medium" 
                                fullWidth
                                onClick={() => handleRoomSelection(room._id || room.id)}
                                disabled={submitting || hasRoom || (room.availableSlots || 0) === 0}
                                startIcon={<IconCheck size={18} />}
                                title={hasRoom ? 'You already have a room allocated' : ''}
                              >
                                {submitting ? 'Selecting...' : 'Select This Room'}
                              </Button>
                            </Stack>
                          </Card>
                        </Grid>
                      ))}
                    </Grid>
                    )}

                    <Typography variant="h6">My Room Requests</Typography>
                    <TableContainer component={Paper} elevation={0} sx={{ border: 1, borderColor: 'divider', borderRadius: 2 }}>
                      <Table>
                        <TableHead>
                          <TableRow sx={{ bgcolor: 'grey.50' }}>
                            <TableCell><strong>Room Number</strong></TableCell>
                            <TableCell><strong>Date</strong></TableCell>
                            <TableCell><strong>Note</strong></TableCell>
                            <TableCell><strong>Status</strong></TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {roomRequests.length === 0 ? (
                            <TableRow>
                              <TableCell colSpan={4} align="center">
                                <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
                                  No room requests submitted
                                </Typography>
                              </TableCell>
                            </TableRow>
                          ) : (
                            roomRequests.map((request) => (
                              <TableRow key={request._id || request.id} hover>
                                <TableCell>{request.room?.roomNumber || 'N/A'}</TableCell>
                                <TableCell>{new Date(request.createdAt || request.date).toLocaleDateString()}</TableCell>
                                <TableCell>{request.description || request.note || 'N/A'}</TableCell>
                                <TableCell>
                                  <Chip
                                    label={request.status}
                                    color={
                                      request.status === 'resolved' ? 'success' :
                                      request.status === 'rejected' ? 'error' : 'warning'
                                    }
                                    size="small"
                                  />
                                </TableCell>
                              </TableRow>
                            ))
                          )}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </Stack>
                )}
              </TabPanel>

              {/* Roommate Selection Tab */}
              <TabPanel value={roomSelectionTab} index={1}>
                <Stack spacing={3}>
                  <Alert severity="info">Browse available students and send roommate requests. Both students must approve to confirm pairing.</Alert>
                  
                  <Typography variant="h6">Available Students</Typography>
                  <TableContainer component={Paper} elevation={0} sx={{ border: 1, borderColor: 'divider', borderRadius: 2 }}>
                    <Table>
                      <TableHead>
                        <TableRow sx={{ bgcolor: 'grey.50' }}>
                          <TableCell><strong>Name</strong></TableCell>
                          <TableCell><strong>Student ID</strong></TableCell>
                          <TableCell><strong>Year</strong></TableCell>
                          <TableCell><strong>Course</strong></TableCell>
                          <TableCell><strong>Interests</strong></TableCell>
                          <TableCell><strong>Action</strong></TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                              {availableStudents.length === 0 ? (
                                <TableRow>
                                  <TableCell colSpan={6} align="center">
                                    <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
                                      No available students for roommate selection
                                    </Typography>
                                  </TableCell>
                                </TableRow>
                              ) : (
                                availableStudents.map((student) => (
                                  <TableRow key={student._id || student.id} hover>
                                    <TableCell>{student.name}</TableCell>
                                    <TableCell>{student.studentId}</TableCell>
                                    <TableCell>{student.year || 'N/A'}</TableCell>
                                    <TableCell>{student.course || 'N/A'}</TableCell>
                                    <TableCell>N/A</TableCell>
                                    <TableCell>
                                      <Button 
                                        variant="outlined" 
                                        size="small"
                                        onClick={() => handleSendRoommateRequest(student._id || student.id, null)}
                                        disabled={submitting}
                                      >
                                        Send Request
                                      </Button>
                                    </TableCell>
                                  </TableRow>
                                ))
                              )}
                      </TableBody>
                    </Table>
                  </TableContainer>

                  <Typography variant="h6">Roommate Requests</Typography>
                  <TableContainer component={Paper} elevation={0} sx={{ border: 1, borderColor: 'divider', borderRadius: 2 }}>
                    <Table>
                      <TableHead>
                        <TableRow sx={{ bgcolor: 'grey.50' }}>
                          <TableCell><strong>Name</strong></TableCell>
                          <TableCell><strong>Student ID</strong></TableCell>
                          <TableCell><strong>Date</strong></TableCell>
                          <TableCell><strong>Type</strong></TableCell>
                          <TableCell><strong>Status</strong></TableCell>
                          <TableCell><strong>Action</strong></TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {roommateRequests.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={6} align="center">
                              <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
                                No roommate requests
                              </Typography>
                            </TableCell>
                          </TableRow>
                        ) : (
                          roommateRequests.map((request) => (
                            <TableRow key={request._id || request.id} hover>
                              <TableCell>
                                <Stack direction="row" spacing={1} alignItems="center">
                                  <Typography variant="body2">{request.name}</Typography>
                                  {request.isGroupRequest && (
                                    <Chip label="Group" size="small" color="primary" variant="outlined" />
                                  )}
                                </Stack>
                              </TableCell>
                              <TableCell>{request.studentId}</TableCell>
                              <TableCell>{request.date}</TableCell>
                              <TableCell>
                                <Stack direction="row" spacing={1} alignItems="center">
                                  <Typography variant="body2">{request.type}</Typography>
                                  {request.isGroupRequest && (
                                    <Chip label="Group Request" size="small" color="info" />
                                  )}
                                </Stack>
                              </TableCell>
                              <TableCell>
                                <Chip
                                  label={request.status}
                                  color={request.status === 'Approved' ? 'success' : request.status === 'Rejected' ? 'error' : 'warning'}
                                  size="small"
                                />
                              </TableCell>
                              <TableCell>
                                {request.status === 'Pending' && request.type === 'Received' && (
                                  <Stack direction="row" spacing={1}>
                                    <Button 
                                      variant="contained" 
                                      size="small" 
                                      color="success"
                                      onClick={() => handleAcceptRoommateRequest(request._id || request.id, request.isGroupRequest)}
                                      disabled={submitting || request.status !== 'Pending'}
                                    >
                                      {request.isGroupRequest ? 'Accept Group' : 'Accept'}
                                    </Button>
                                    <Button 
                                      variant="outlined" 
                                      size="small" 
                                      color="error"
                                      onClick={() => handleRejectRoommateRequest(request._id || request.id, request.isGroupRequest)}
                                      disabled={submitting || request.status !== 'Pending'}
                                    >
                                      Reject
                                    </Button>
                                  </Stack>
                                )}
                                {request.status === 'Pending' && request.type === 'Sent' && (
                                  <Chip label="Waiting for response" size="small" color="warning" />
                                )}
                                {request.status !== 'Pending' && (
                                  <Chip 
                                    label={request.status} 
                                    size="small" 
                                    color={request.status === 'Approved' ? 'success' : 'default'} 
                                  />
                                )}
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </TableContainer>

                  {/* AI Matched Roommate Groups Section */}
                  <Divider sx={{ my: 3 }} />
                  <Typography variant="h6">AI Matched Roommate Groups</Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Select a group and choose a room to be allocated together with compatible roommates.
                  </Typography>
                  
                  {/* Display Current Active Roommate Group */}
                  {loadingCurrentGroup ? (
                    <Box display="flex" justifyContent="center" py={2}>
                      <CircularProgress size={24} />
                    </Box>
                  ) : currentRoommateGroup ? (
                    <Card variant="outlined" sx={{ p: 2, mb: 3, border: '2px solid', borderColor: 'primary.main', bgcolor: 'primary.lighter' }}>
                      <Stack spacing={2}>
                        <Stack direction="row" justifyContent="space-between" alignItems="center">
                          <Typography variant="h6">Your Active Roommate Group</Typography>
                          <Chip 
                            label={
                              currentRoommateGroup.status === 'pending' ? 'Pending' :
                              currentRoommateGroup.status === 'confirmed' ? 'Confirmed' :
                              currentRoommateGroup.status === 'room_selected' ? 'Room Selected' :
                              currentRoommateGroup.status === 'payment_pending' ? 'Payment Pending' :
                              'Active'
                            }
                            color={
                              currentRoommateGroup.status === 'pending' ? 'warning' :
                              currentRoommateGroup.status === 'confirmed' ? 'success' :
                              currentRoommateGroup.status === 'room_selected' ? 'info' :
                              'default'
                            }
                            size="small"
                          />
                        </Stack>
                        
                        <Typography variant="body2" color="text.secondary">
                          {currentRoommateGroup.status === 'pending' && 'Waiting for group members to accept the request.'}
                          {currentRoommateGroup.status === 'confirmed' && 'Group is confirmed! The leader can now select a room for the group.'}
                          {currentRoommateGroup.status === 'room_selected' && currentRoommateGroup.selectedRoom && `Room ${currentRoommateGroup.selectedRoom.roomNumber} selected. Payment required to confirm.`}
                          {currentRoommateGroup.status === 'payment_pending' && 'All members have paid. Room allocation will be confirmed soon.'}
                        </Typography>

                        <Divider />

                        <Typography variant="subtitle2" fontWeight={600}>Group Members ({currentRoommateGroup.members?.length || 0}):</Typography>
                        <Stack spacing={1}>
                          {currentRoommateGroup.members?.map((member) => (
                            <Box key={member._id} sx={{ p: 1.5, bgcolor: 'background.paper', borderRadius: 1, border: '1px solid', borderColor: 'divider' }}>
                              <Stack direction="row" justifyContent="space-between" alignItems="center">
                                <Box>
                                  <Stack direction="row" alignItems="center" spacing={1}>
                                  <Typography variant="body2" fontWeight={500}>
                                    {member.name} ({member.studentId})
                                    </Typography>
                                    {currentRoommateGroup.createdBy?._id?.toString() === member._id?.toString() && (
                                      <Chip label="Leader" size="small" color="primary" />
                                    )}
                                  </Stack>
                                  <Typography variant="caption" color="text.secondary">
                                    {member.course || 'N/A'} • {member.year || 'N/A'}
                                  </Typography>
                                </Box>
                              </Stack>
                            </Box>
                          ))}
                        </Stack>

                        {currentRoommateGroup.status === 'confirmed' && (
                          <Box>
                            <Divider sx={{ my: 2 }} />
                            {currentRoommateGroup.createdBy?._id?.toString() === currentStudentId?.toString() ? (
                              <Button
                                variant="contained"
                                fullWidth
                                startIcon={<IconHome size={16} />}
                                onClick={async () => {
                                  // Fetch available rooms for group
                                  try {
                                    const roomsResponse = await studentService.getAvailableRoomsForGroup(currentRoommateGroup._id);
                                    if (roomsResponse.rooms && roomsResponse.rooms.length > 0) {
                                      setAvailableRooms(roomsResponse.rooms);
                                      setSelectRoomDialogOpen(true);
                                      setSelectedGroup({ _id: currentRoommateGroup._id, members: currentRoommateGroup.members });
                                    } else {
                                      enqueueSnackbar('No available rooms for your group size', { variant: 'warning' });
                                    }
                                  } catch (err) {
                                    enqueueSnackbar(err.response?.data?.message || 'Failed to fetch available rooms', { variant: 'error' });
                                  }
                                }}
                              >
                                Choose Room Together (Leader Only)
                              </Button>
                            ) : (
                              <Alert severity="info">
                                Waiting for group leader to select a room for the group.
                              </Alert>
                            )}
                          </Box>
                        )}

                        {currentRoommateGroup.status === 'room_selected' && currentRoommateGroup.selectedRoom && (
                          <Box>
                            <Divider sx={{ my: 2 }} />
                            <Alert severity="info">
                              Room {currentRoommateGroup.selectedRoom.roomNumber} has been selected. Please complete payment to confirm your room allocation.
                            </Alert>
                          </Box>
                        )}
                      </Stack>
                    </Card>
                  ) : null}

                  {/* Display AI Matched Groups */}
                  {loadingGroups ? (
                    <Box display="flex" justifyContent="center" py={2}>
                      <CircularProgress size={24} />
                    </Box>
                  ) : currentRoommateGroup && ['confirmed', 'room_selected', 'payment_pending'].includes(currentRoommateGroup.status) ? (
                    <Alert severity="info">
                      You are already in an active roommate group. Complete your current group's room selection and payment before joining another group.
                    </Alert>
                  ) : aiMatchedGroups.length === 0 ? (
                    <Alert severity="info">
                      No matched groups available. Fill in your preferences in the AI Matching tab and click "Find AI Matches" to get group suggestions.
                    </Alert>
                  ) : (
                    <Grid container spacing={2}>
                      {aiMatchedGroups.map((group, idx) => (
                        <Grid key={group.groupId || idx} size={{ xs: 12, md: 6 }}>
                          <Card variant="outlined" sx={{ p: 2, border: '2px solid', borderColor: 'primary.main' }}>
                            <Stack spacing={2}>
                              <Stack direction="row" justifyContent="space-between" alignItems="center">
                                <Typography variant="h6">Group {idx + 1}</Typography>
                                <Chip 
                                  label={`${group.averageScore}% Compatibility`} 
                                  color={group.averageScore >= 80 ? 'success' : group.averageScore >= 60 ? 'warning' : 'default'} 
                                  size="small" 
                                />
                              </Stack>
                              <Typography variant="body2" color="text.secondary">
                                Recommended Room Type: {group.recommendedRoomType}
                              </Typography>
                              <Divider />
                              <Typography variant="subtitle2" fontWeight={600}>Roommates in this group:</Typography>
                              <Stack spacing={1}>
                                {group.students?.map((student) => (
                                  <Box key={student._id} sx={{ p: 1, bgcolor: 'background.default', borderRadius: 1 }}>
                                    <Typography variant="body2" fontWeight={500}>
                                      {student.name} ({student.studentId})
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary">
                                      {student.course || 'N/A'} • {student.year || 'N/A'}
                                    </Typography>
                                  </Box>
                                ))}
                              </Stack>
                              <Button
                                variant="contained"
                                fullWidth
                                startIcon={<IconUsers size={16} />}
                                onClick={async () => {
                                  // Send group request to all members in the group
                                  try {
                                    setSubmitting(true);
                                    let successCount = 0;
                                    let errorCount = 0;
                                    
                                    for (const student of group.students || []) {
                                      if (student._id === currentStudentId) continue; // Skip self
                                      
                                      try {
                                        await studentService.sendRoommateGroupRequest(
                                          student._id,
                                          `AI-matched group with ${group.averageScore}% compatibility`,
                                          group.averageScore
                                        );
                                        successCount++;
                                      } catch (err) {
                                        errorCount++;
                                      }
                                    }
                                    
                                    if (successCount > 0) {
                                      enqueueSnackbar(`Sent group requests to ${successCount} student(s)`, { variant: 'success' });
                                      await fetchRoommateRequests();
                                      await fetchCurrentRoommateGroup();
                                    }
                                    if (errorCount > 0) {
                                      enqueueSnackbar(`Failed to send ${errorCount} request(s)`, { variant: 'warning' });
                                    }
                                  } catch (err) {
                                    enqueueSnackbar(err.response?.data?.message || 'Failed to send group requests', { variant: 'error' });
                                  } finally {
                                    setSubmitting(false);
                                  }
                                }}
                                disabled={submitting || hasRoom || (currentRoommateGroup && ['pending', 'confirmed', 'room_selected', 'payment_pending'].includes(currentRoommateGroup.status))}
                              >
                                {hasRoom ? 'Already Have Room' : 
                                 (currentRoommateGroup && ['pending', 'confirmed', 'room_selected', 'payment_pending'].includes(currentRoommateGroup.status)) ? 'In Active Group' : 
                                 'Request to Join This Group'}
                              </Button>
                            </Stack>
                          </Card>
                        </Grid>
                      ))}
                    </Grid>
                  )}
                </Stack>
              </TabPanel>

              {/* AI Roommate Matching Tab */}
              <TabPanel value={roomSelectionTab} index={2}>
                <Stack spacing={3}>
                  {onboardingStatus === 'pending' && (
                    <Alert severity="info">
                      <Typography variant="body2" fontWeight={600} gutterBottom>
                        Welcome! Start by selecting your room type.
                      </Typography>
                      <Typography variant="body2">
                        Choose your preferred room type first. Then fill in your preferences and let AI suggest compatible roommates based on your lifestyle and habits. 
                        You can also manually select preferred roommates (like siblings or best friends).
                      </Typography>
                    </Alert>
                  )}
                  {onboardingStatus !== 'pending' && !selectedRoomType && (
                    <Alert severity="warning">
                      Please select a room type first before finding matches.
                    </Alert>
                  )}
                  
                  {/* Room Type Selection */}
                  <Typography variant="h6">Step 1: Select Room Type</Typography>
                  {!selectedRoomType ? (
                    <Card variant="outlined" sx={{ p: 3 }}>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                        Choose your preferred room type. This will determine how many roommates you need and the base price per student.
                      </Typography>
                      <Grid container spacing={2}>
                        {['Single', 'Double', 'Triple', 'Quad'].map((roomType) => {
                          const capacity = roomType === 'Single' ? 1 : roomType === 'Double' ? 2 : roomType === 'Triple' ? 3 : 4;
                          const basePrice = BASE_ROOM_PRICES[roomType];
                          const roommatesNeeded = capacity - 1;
                          
                          return (
                            <Grid key={roomType} size={{ xs: 12, md: 6 }}>
                              <Card 
                                variant="outlined" 
                                sx={{ 
                                  p: 2, 
                                  cursor: 'pointer',
                                  border: '2px solid',
                                  borderColor: 'divider',
                                  '&:hover': {
                                    borderColor: 'primary.main',
                                    bgcolor: 'action.hover',
                                  },
                                }}
                                onClick={() => handleSetRoomType(roomType)}
                              >
                                <Stack spacing={1}>
                                  <Stack direction="row" justifyContent="space-between" alignItems="center">
                                    <Typography variant="h6">{roomType} Room</Typography>
                                    <Chip label={`Capacity: ${capacity}`} size="small" color="primary" />
                                  </Stack>
                                  <Typography variant="body2" color="text.secondary">
                                    {roomType === 'Single' 
                                      ? 'Private room - no roommates needed'
                                      : `Requires ${roommatesNeeded} roommate${roommatesNeeded > 1 ? 's' : ''}`}
                                  </Typography>
                                  <Divider />
                                  <Stack direction="row" justifyContent="space-between" alignItems="center">
                                    <Typography variant="body2" fontWeight={600}>
                                      Base Price:
                                    </Typography>
                                    <Typography variant="h6" color="primary">
                                      {formatPrice(basePrice)}
                                      {roomType !== 'Single' && <Typography component="span" variant="caption" sx={{ ml: 0.5 }}>per student</Typography>}
                                    </Typography>
                                  </Stack>
                                  {roomType !== 'Single' && (
                                    <Typography variant="caption" color="text.secondary">
                                      Total for {capacity} students: {formatPrice(basePrice * capacity)}
                                    </Typography>
                                  )}
                                </Stack>
                              </Card>
                            </Grid>
                          );
                        })}
                      </Grid>
                    </Card>
                  ) : (
                    <Card variant="outlined" sx={{ p: 2, bgcolor: 'success.lighter', border: '2px solid', borderColor: 'success.main' }}>
                      <Stack direction="row" justifyContent="space-between" alignItems="center">
                        <Box>
                          <Typography variant="h6">{selectedRoomType} Room Selected</Typography>
                          <Typography variant="body2" color="text.secondary">
                            Capacity: {selectedRoomType === 'Single' ? 1 : selectedRoomType === 'Double' ? 2 : selectedRoomType === 'Triple' ? 3 : 4} • 
                            Base Price: {formatPrice(BASE_ROOM_PRICES[selectedRoomType])}
                            {selectedRoomType !== 'Single' && ' per student'}
                          </Typography>
                        </Box>
                        <Button 
                          variant="outlined" 
                          size="small"
                          onClick={() => handleSetRoomType(null)}
                          disabled={submitting}
                        >
                          Change
                        </Button>
                      </Stack>
                    </Card>
                  )}

                  {/* Show preferences and matching only if room type is selected and not Single */}
                  {selectedRoomType && selectedRoomType !== 'Single' && (
                    <>
                      <Typography variant="h6">Step 2: Your Preferences</Typography>
                  <Card variant="outlined" sx={{ p: 3 }}>
                    <Stack spacing={3}>
                      <FormControl fullWidth>
                        <InputLabel>Sleep Schedule</InputLabel>
                        <Select
                          value={sleepScheduleValue}
                          label="Sleep Schedule"
                          onChange={(e) => setAiPreferences({ ...aiPreferences, sleepSchedule: e.target.value || '10 PM - 7 AM' })}
                        >
                          <MenuItem value="9 PM - 6 AM">9 PM - 6 AM (Early Bird)</MenuItem>
                          <MenuItem value="10 PM - 7 AM">10 PM - 7 AM (Normal)</MenuItem>
                          <MenuItem value="11 PM - 8 AM">11 PM - 8 AM (Night Owl)</MenuItem>
                          <MenuItem value="12 AM - 9 AM">12 AM - 9 AM (Late Night)</MenuItem>
                        </Select>
                      </FormControl>

                      <Box>
                        <Typography gutterBottom>Cleanliness Level</Typography>
                        <Slider
                          value={aiPreferences.cleanliness}
                          onChange={(e, val) => setAiPreferences({ ...aiPreferences, cleanliness: val })}
                          min={1}
                          max={10}
                          marks
                          valueLabelDisplay="auto"
                        />
                        <Stack direction="row" justifyContent="space-between">
                          <Typography variant="caption">Messy</Typography>
                          <Typography variant="caption">Very Clean</Typography>
                        </Stack>
                      </Box>

                      <FormControl fullWidth>
                        <InputLabel>Study Habits</InputLabel>
                        <Select
                          value={studyHabitsValue}
                          label="Study Habits"
                          onChange={(e) => setAiPreferences({ ...aiPreferences, studyHabits: e.target.value || 'Quiet' })}
                        >
                          <MenuItem value="Quiet">Quiet (Library Style)</MenuItem>
                          <MenuItem value="Moderate">Moderate (Some Background Noise OK)</MenuItem>
                          <MenuItem value="Social">Social (Study Groups Welcome)</MenuItem>
                        </Select>
                      </FormControl>

                      <Box>
                        <Typography gutterBottom>Noise Tolerance</Typography>
                        <Slider
                          value={aiPreferences.noiseTolerance}
                          onChange={(e, val) => setAiPreferences({ ...aiPreferences, noiseTolerance: val })}
                          min={1}
                          max={10}
                          marks
                          valueLabelDisplay="auto"
                        />
                        <Stack direction="row" justifyContent="space-between">
                          <Typography variant="caption">Very Quiet</Typography>
                          <Typography variant="caption">Noise Friendly</Typography>
                        </Stack>
                      </Box>

                      <FormControl fullWidth>
                        <InputLabel>Lifestyle</InputLabel>
                        <Select
                          value={lifestyleValue}
                          label="Lifestyle"
                          onChange={(e) => setAiPreferences({ ...aiPreferences, lifestyle: e.target.value || 'Balanced' })}
                        >
                          <MenuItem value="Quiet">Quiet & Reserved</MenuItem>
                          <MenuItem value="Balanced">Balanced</MenuItem>
                          <MenuItem value="Social">Social & Active</MenuItem>
                        </Select>
                      </FormControl>

                      <Stack direction="row" spacing={2}>
                        <Button 
                          variant="outlined" 
                          size="large" 
                          fullWidth 
                          onClick={handleSaveAIPreferences}
                          disabled={submitting}
                        >
                          {submitting ? 'Saving...' : 'Save Preferences'}
                        </Button>
                        <Button 
                          variant="contained" 
                          size="large" 
                          fullWidth 
                          startIcon={submitting ? <CircularProgress size={18} /> : <IconBrain size={18} />}
                          onClick={handleFindAIMatches}
                          disabled={submitting}
                        >
                          {submitting ? 'Finding Matches...' : 'Find AI Matches'}
                        </Button>
                      </Stack>
                    </Stack>
                  </Card>

                      <Divider sx={{ my: 3 }} />

                      {/* Roommate Requests Section in AI Matching Tab */}
                      <Typography variant="h6">Step 2.5: Your Roommate Requests</Typography>
                      <Card variant="outlined" sx={{ p: 2 }}>
                        {roommateRequests.length === 0 ? (
                          <Alert severity="info">
                            <Typography variant="body2">
                              No roommate requests yet. After finding AI matches, you can send requests to compatible roommates.
                            </Typography>
                          </Alert>
                        ) : (
                          <TableContainer component={Paper} elevation={0} sx={{ border: 1, borderColor: 'divider', borderRadius: 2 }}>
                            <Table size="small">
                              <TableHead>
                                <TableRow sx={{ bgcolor: 'grey.50' }}>
                                  <TableCell><strong>Name</strong></TableCell>
                                  <TableCell><strong>Student ID</strong></TableCell>
                                  <TableCell><strong>Date</strong></TableCell>
                                  <TableCell><strong>Type</strong></TableCell>
                                  <TableCell><strong>Status</strong></TableCell>
                                  <TableCell><strong>Action</strong></TableCell>
                                </TableRow>
                              </TableHead>
                              <TableBody>
                                {roommateRequests.map((request) => (
                                  <TableRow key={request._id || request.id} hover>
                                    <TableCell>
                                      <Stack direction="row" spacing={1} alignItems="center">
                                        <Typography variant="body2">{request.name}</Typography>
                                        {request.isGroupRequest && (
                                          <Chip label="Group" size="small" color="primary" variant="outlined" />
                                        )}
                                      </Stack>
                                    </TableCell>
                                    <TableCell>{request.studentId}</TableCell>
                                    <TableCell>{request.date}</TableCell>
                                    <TableCell>
                                      <Stack direction="row" spacing={1} alignItems="center">
                                        <Typography variant="body2">{request.type}</Typography>
                                        {request.isGroupRequest && (
                                          <Chip label="Group Request" size="small" color="primary" />
                                        )}
                                      </Stack>
                                    </TableCell>
                                    <TableCell>
                                      <Chip 
                                        label={request.status} 
                                        size="small" 
                                        color={
                                          request.status === 'Approved' ? 'success' : 
                                          request.status === 'Pending' ? 'warning' : 
                                          'default'
                                        } 
                                      />
                                    </TableCell>
                                    <TableCell>
                                      {request.status === 'Pending' && request.type === 'Received' && (
                                        <Stack direction="row" spacing={1}>
                                          <Button
                                            variant="contained" 
                                            size="small" 
                                            color="success"
                                            onClick={() => handleAcceptRoommateRequest(request._id || request.id, request.isGroupRequest)}
                                            disabled={submitting || request.status !== 'Pending'}
                                          >
                                            {request.isGroupRequest ? 'Accept Group' : 'Accept'}
                                          </Button>
                                          <Button 
                                            variant="outlined" 
                                            size="small" 
                                            color="error"
                                            onClick={() => handleRejectRoommateRequest(request._id || request.id, request.isGroupRequest)}
                                            disabled={submitting || request.status !== 'Pending'}
                                          >
                                            Reject
                                          </Button>
                                        </Stack>
                                      )}
                                      {request.status === 'Pending' && request.type === 'Sent' && (
                                        <Chip label="Waiting for response" size="small" color="warning" />
                                      )}
                                      {request.status !== 'Pending' && (
                                        <Chip 
                                          label={request.status} 
                                          size="small" 
                                          color={request.status === 'Approved' ? 'success' : 'default'} 
                                        />
                                      )}
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </TableContainer>
                        )}
                      </Card>

                      <Divider sx={{ my: 3 }} />

                      <Typography variant="h6">Step 3: AI Suggested Individual Matches</Typography>
                      {aiMatches.length === 0 ? (
                    <Alert severity="info">
                      <Typography variant="body2" component="div">
                        No individual matches found with 50-100% compatibility.
                        <br />
                        <strong>Possible reasons:</strong>
                        <ul style={{ marginTop: 8, marginBottom: 0, paddingLeft: 20 }}>
                          <li>No other students of the same gender without rooms</li>
                          <li>Other students haven't set their preferences yet</li>
                          <li>Compatibility scores are below 50% - try adjusting your preferences</li>
                        </ul>
                        Try adjusting your preferences or check the matched groups below.
                      </Typography>
                    </Alert>
                  ) : (
                    <>
                      {aiMatches.some(m => m.score < 50) && (
                        <Alert severity="warning" sx={{ mb: 2 }}>
                          <Typography variant="body2">
                            <strong>Note:</strong> Some matches shown below have compatibility scores below 50%. 
                            These are shown because no higher compatibility matches were found. 
                            Consider adjusting your preferences for better matches.
                          </Typography>
                        </Alert>
                      )}
                      <Grid container spacing={2}>
                        {aiMatches.map((match) => (
                        <Grid key={match.student._id} size={{ xs: 12, md: 6 }}>
                          <Card variant="outlined" sx={{ p: 2 }}>
                            <Stack spacing={2}>
                              <Stack direction="row" justifyContent="space-between" alignItems="center">
                                <Typography variant="h6">{match.student.name}</Typography>
                                <Chip 
                                  label={`${match.score}% Match`} 
                                  color={match.score >= 80 ? 'success' : match.score >= 50 ? 'warning' : 'error'} 
                                  size="small"
                                  title={match.score < 50 ? 'Below recommended threshold (50%)' : ''}
                                />
                              </Stack>
                            <Typography variant="body2"><strong>Student ID:</strong> {match.student.studentId}</Typography>
                            <Typography variant="body2"><strong>Course:</strong> {match.student.course || 'N/A'}</Typography>
                            <Typography variant="body2"><strong>Year:</strong> {match.student.year || 'N/A'}</Typography>
                            <Stack direction="row" spacing={1}>
                              <Button 
                                variant="contained" 
                                size="small" 
                                fullWidth 
                                startIcon={<IconCheck size={16} />}
                                onClick={() => handleSendRoommateRequest(match.student._id, match.score)}
                                disabled={submitting || hasRoom || (currentRoommateGroup && ['pending', 'confirmed', 'room_selected', 'payment_pending'].includes(currentRoommateGroup.status))}
                              >
                                {hasRoom ? 'Already Have Room' : 
                                 (currentRoommateGroup && ['pending', 'confirmed', 'room_selected', 'payment_pending'].includes(currentRoommateGroup.status)) ? 'In Active Group' : 
                                 'Send Request'}
                              </Button>
                            </Stack>
                          </Stack>
                          </Card>
                        </Grid>
                        ))}
                      </Grid>
                    </>
                  )}

                      <Divider sx={{ my: 3 }} />

                      <Typography variant="h6">Step 4: AI Matched Roommate Groups</Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        Select a group and choose a room to be allocated together with compatible roommates.
                      </Typography>
                      
                      {/* Display Current Active Roommate Group */}
                      {loadingCurrentGroup ? (
                        <Box display="flex" justifyContent="center" py={2}>
                          <CircularProgress size={24} />
                        </Box>
                      ) : currentRoommateGroup ? (
                        <Card variant="outlined" sx={{ p: 2, mb: 3, border: '2px solid', borderColor: 'primary.main', bgcolor: 'primary.lighter' }}>
                      <Stack spacing={2}>
                        <Stack direction="row" justifyContent="space-between" alignItems="center">
                          <Typography variant="h6">Your Active Roommate Group</Typography>
                          <Chip 
                            label={
                              currentRoommateGroup.status === 'pending' ? 'Pending' :
                              currentRoommateGroup.status === 'confirmed' ? 'Confirmed' :
                              currentRoommateGroup.status === 'room_selected' ? 'Room Selected' :
                              currentRoommateGroup.status === 'payment_pending' ? 'Payment Pending' :
                              'Active'
                            }
                            color={
                              currentRoommateGroup.status === 'pending' ? 'warning' :
                              currentRoommateGroup.status === 'confirmed' ? 'success' :
                              currentRoommateGroup.status === 'room_selected' ? 'info' :
                              'default'
                            }
                            size="small"
                          />
                        </Stack>
                        
                        <Typography variant="body2" color="text.secondary">
                          {currentRoommateGroup.status === 'pending' && 'Waiting for group members to accept the request.'}
                          {currentRoommateGroup.status === 'confirmed' && 'Group is confirmed! The leader can now select a room for the group.'}
                          {currentRoommateGroup.status === 'room_selected' && currentRoommateGroup.selectedRoom && `Room ${currentRoommateGroup.selectedRoom.roomNumber} selected. Payment required to confirm.`}
                          {currentRoommateGroup.status === 'payment_pending' && 'All members have paid. Room allocation will be confirmed soon.'}
                        </Typography>

                        <Divider />

                        <Typography variant="subtitle2" fontWeight={600}>Group Members ({currentRoommateGroup.members?.length || 0}):</Typography>
                        <Stack spacing={1}>
                          {currentRoommateGroup.members?.map((member) => (
                            <Box key={member._id} sx={{ p: 1.5, bgcolor: 'background.paper', borderRadius: 1, border: '1px solid', borderColor: 'divider' }}>
                              <Stack direction="row" justifyContent="space-between" alignItems="center">
                                <Box>
                                  <Stack direction="row" alignItems="center" spacing={1}>
                                  <Typography variant="body2" fontWeight={500}>
                                    {member.name} ({member.studentId})
                                    </Typography>
                                    {currentRoommateGroup.createdBy?._id?.toString() === member._id?.toString() && (
                                      <Chip label="Leader" size="small" color="primary" />
                                    )}
                                  </Stack>
                                  <Typography variant="caption" color="text.secondary">
                                    {member.course || 'N/A'} • {member.year || 'N/A'}
                                  </Typography>
                                </Box>
                              </Stack>
                            </Box>
                          ))}
                        </Stack>

                        {currentRoommateGroup.status === 'confirmed' && (
                          <Box>
                            <Divider sx={{ my: 2 }} />
                            {currentRoommateGroup.createdBy?._id?.toString() === currentStudentId?.toString() ? (
                              <Button
                                variant="contained"
                                fullWidth
                                startIcon={<IconHome size={16} />}
                                onClick={async () => {
                                  // Fetch available rooms for group
                                  try {
                                    const roomsResponse = await studentService.getAvailableRoomsForGroup(currentRoommateGroup._id);
                                    if (roomsResponse.rooms && roomsResponse.rooms.length > 0) {
                                      setAvailableRooms(roomsResponse.rooms);
                                      setSelectRoomDialogOpen(true);
                                      setSelectedGroup({ _id: currentRoommateGroup._id, members: currentRoommateGroup.members });
                                    } else {
                                      enqueueSnackbar('No available rooms for your group size', { variant: 'warning' });
                                    }
                                  } catch (err) {
                                    enqueueSnackbar(err.response?.data?.message || 'Failed to fetch available rooms', { variant: 'error' });
                                  }
                                }}
                              >
                                Choose Room Together (Leader Only)
                              </Button>
                            ) : (
                              <Alert severity="info">
                                Waiting for group leader to select a room for the group.
                              </Alert>
                            )}
                          </Box>
                        )}

                        {currentRoommateGroup.status === 'room_selected' && currentRoommateGroup.selectedRoom && (
                          <Box>
                            <Divider sx={{ my: 2 }} />
                            <Alert severity="info">
                              Room {currentRoommateGroup.selectedRoom.roomNumber} has been selected. Please complete payment to confirm your room allocation.
                            </Alert>
                          </Box>
                        )}
                        </Stack>
                      </Card>
                      ) : null}

                      {loadingGroups ? (
                        <Box display="flex" justifyContent="center" py={3}>
                          <CircularProgress />
                        </Box>
                      ) : aiMatchedGroups.length === 0 ? (
                        <Alert severity="info">
                          No matched groups available. Fill in your preferences above and click "Find AI Matches" to get group suggestions.
                        </Alert>
                      ) : (
                        <Grid container spacing={2}>
                          {aiMatchedGroups.map((group, idx) => (
                            <Grid key={group.groupId || idx} size={{ xs: 12, md: 6 }}>
                              <Card variant="outlined" sx={{ p: 2, border: '2px solid', borderColor: 'primary.main' }}>
                                <Stack spacing={2}>
                                  <Stack direction="row" justifyContent="space-between" alignItems="center">
                                    <Typography variant="h6">Group {idx + 1}</Typography>
                                    <Chip 
                                      label={`${group.averageScore}% Compatibility`} 
                                      color={group.averageScore >= 80 ? 'success' : group.averageScore >= 60 ? 'warning' : 'default'} 
                                      size="small" 
                                    />
                                  </Stack>
                                  <Typography variant="body2" color="text.secondary">
                                    Recommended Room Type: {group.recommendedRoomType}
                                  </Typography>
                                  <Divider />
                                  <Typography variant="subtitle2" fontWeight={600}>Roommates in this group:</Typography>
                                  <Stack spacing={1}>
                                    {group.students?.map((student) => (
                                      <Box key={student._id} sx={{ p: 1, bgcolor: 'background.default', borderRadius: 1 }}>
                                        <Typography variant="body2" fontWeight={500}>
                                          {student.name} ({student.studentId})
                                        </Typography>
                                        <Typography variant="caption" color="text.secondary">
                                          {student.course || 'N/A'} • {student.year || 'N/A'}
                                        </Typography>
                                      </Box>
                                    ))}
                                  </Stack>
                                  <Button
                                    variant="contained"
                                    fullWidth
                                    startIcon={<IconUsers size={16} />}
                                    onClick={async () => {
                                      // Send group request to all members in the group
                                      try {
                                        setSubmitting(true);
                                        let successCount = 0;
                                        let errorCount = 0;
                                        
                                        for (const student of group.students || []) {
                                          if (student._id === currentStudentId) continue; // Skip self
                                          
                                          try {
                                            await studentService.sendRoommateGroupRequest(
                                              student._id,
                                              `AI-matched group with ${group.averageScore}% compatibility`,
                                              group.averageScore
                                            );
                                            successCount++;
                                          } catch (err) {
                                            errorCount++;
                                          }
                                        }
                                        
                                        if (successCount > 0) {
                                          enqueueSnackbar(`Sent group requests to ${successCount} student(s)`, { variant: 'success' });
                                          await fetchRoommateRequests();
                                          await fetchCurrentRoommateGroup();
                                        }
                                        if (errorCount > 0) {
                                          enqueueSnackbar(`Failed to send ${errorCount} request(s)`, { variant: 'warning' });
                                        }
                                      } catch (err) {
                                        enqueueSnackbar(err.response?.data?.message || 'Failed to send group requests', { variant: 'error' });
                                      } finally {
                                        setSubmitting(false);
                                      }
                                    }}
                                    disabled={submitting || hasRoom || (currentRoommateGroup && ['pending', 'confirmed', 'room_selected', 'payment_pending'].includes(currentRoommateGroup.status))}
                                  >
                                    {hasRoom ? 'Already Have Room' : 
                                     (currentRoommateGroup && ['pending', 'confirmed', 'room_selected', 'payment_pending'].includes(currentRoommateGroup.status)) ? 'In Active Group' : 
                                     'Request to Join This Group'}
                                  </Button>
                                </Stack>
                              </Card>
                            </Grid>
                          ))}
                        </Grid>
                      )}
                    </>
                  )}
                </Stack>
              </TabPanel>

              {/* Room Allocation Status Tab */}
              <TabPanel value={roomSelectionTab} index={3}>
                <Stack spacing={3}>
                  {loading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                      <CircularProgress />
                    </Box>
                  ) : !roomDetails ? (
                    <Alert severity="info">
                      No room allocated yet. Please select a room from the "Choose Room" tab or contact administration.
                    </Alert>
                  ) : (
                    <>
                      <Card variant="outlined" sx={{ p: 3, bgcolor: 'success.lighter' }}>
                        <Stack spacing={2}>
                          <Typography variant="h6">Current Room Allocation</Typography>
                          <Grid container spacing={2}>
                            <Grid size={{ xs: 12, sm: 6 }}>
                              <Stack spacing={1}>
                                <Typography variant="body2" color="text.secondary">Room Number</Typography>
                                <Typography variant="h6">{roomAllocation.roomNumber}</Typography>
                              </Stack>
                            </Grid>
                            <Grid size={{ xs: 12, sm: 6 }}>
                              <Stack spacing={1}>
                                <Typography variant="body2" color="text.secondary">Building & Floor</Typography>
                                <Typography variant="h6">
                                  {roomAllocation.building !== 'N/A' && roomAllocation.floor !== 'N/A'
                                    ? `${roomAllocation.building} - ${roomAllocation.floor}`
                                    : roomAllocation.building !== 'N/A'
                                    ? roomAllocation.building
                                    : roomAllocation.floor !== 'N/A'
                                    ? roomAllocation.floor
                                    : 'N/A'}
                                </Typography>
                              </Stack>
                            </Grid>
                            <Grid size={{ xs: 12, sm: 6 }}>
                              <Stack spacing={1}>
                                <Typography variant="body2" color="text.secondary">Roommate(s)</Typography>
                                <Typography variant="h6">{roomAllocation.roommate}</Typography>
                                {roommates && roommates.length > 1 && (
                                  <Stack spacing={0.5} sx={{ mt: 1 }}>
                                    {roommates.map((mate, idx) => (
                                      <Typography key={idx} variant="body2" color="text.secondary">
                                        • {mate.name} ({mate.studentId || 'N/A'})
                                      </Typography>
                                    ))}
                                  </Stack>
                                )}
                              </Stack>
                            </Grid>
                            <Grid size={{ xs: 12, sm: 6 }}>
                              <Stack spacing={1}>
                                <Typography variant="body2" color="text.secondary">Allocation Date</Typography>
                                <Typography variant="h6">{roomAllocation.allocationDate}</Typography>
                              </Stack>
                            </Grid>
                            <Grid size={12}>
                              <Chip 
                                label={roomAllocation.status} 
                                color={roomAllocation.status === 'Allocated' ? 'success' : 'default'} 
                                size="medium" 
                              />
                            </Grid>
                          </Grid>
                        </Stack>
                      </Card>
                      <Alert severity="info">
                        Your room allocation is managed by the administration. Contact admin for any changes.
                      </Alert>
                    </>
                  )}
                </Stack>
              </TabPanel>

              {/* Matching History Tab */}
              <TabPanel value={roomSelectionTab} index={4}>
                <Stack spacing={3}>
                  <Typography variant="h6">Matching History</Typography>
                  <TableContainer component={Paper} elevation={0} sx={{ border: 1, borderColor: 'divider', borderRadius: 2 }}>
                    <Table>
                      <TableHead>
                        <TableRow sx={{ bgcolor: 'grey.50' }}>
                          <TableCell><strong>Name</strong></TableCell>
                          <TableCell><strong>Date</strong></TableCell>
                          <TableCell><strong>Match Score</strong></TableCell>
                          <TableCell><strong>AI Score</strong></TableCell>
                          <TableCell><strong>Status</strong></TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {matchingHistory.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={5} align="center">
                              <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
                                No matching history available
                              </Typography>
                            </TableCell>
                          </TableRow>
                        ) : (
                          matchingHistory.map((match) => (
                            <TableRow key={match._id || match.id} hover>
                              <TableCell>{match.name}</TableCell>
                              <TableCell>{match.date}</TableCell>
                              <TableCell>
                                <Chip 
                                  label={match.matchScore ? `${match.matchScore}%` : 'N/A'} 
                                  color={match.matchScore && match.matchScore >= 85 ? 'success' : 'warning'} 
                                  size="small" 
                                />
                              </TableCell>
                              <TableCell>{match.aiScore || 'N/A'}</TableCell>
                              <TableCell>
                                <Chip
                                  label={match.status}
                                  color={match.status === 'Accepted' ? 'success' : 'error'}
                                  size="small"
                                />
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Stack>
              </TabPanel>
            </Box>
          </PresentationCard>
        </TabPanel>

        {/* Room Change Request Tab */}
        <TabPanel value={value} index={3}>
          <PresentationCard>
            <Stack spacing={3}>
              {roomChangeRequest.status === 'None' ? (
                <>
                  <Alert severity="info">You don't have any active room change request.</Alert>
                  <Typography variant="h6">Request Room Change</Typography>
                        <TextField
                          fullWidth
                          multiline
                          rows={4}
                          label="Reason for Room Change"
                          placeholder="Please provide a valid reason for requesting a room change..."
                          helperText="Your request will be reviewed by the administration"
                          value={roomChangeReason}
                          onChange={(e) => setRoomChangeReason(e.target.value)}
                        />
                        <Button 
                          variant="contained" 
                          size="large" 
                          startIcon={<IconFileText size={18} />}
                          onClick={handleRoomChangeRequest}
                          disabled={submitting}
                        >
                          {submitting ? 'Submitting...' : 'Submit Request'}
                        </Button>
                </>
              ) : (
                <Stack spacing={2}>
                  <Alert severity={roomChangeRequest.status === 'Approved' ? 'success' : roomChangeRequest.status === 'Rejected' ? 'error' : 'info'}>
                    Your room change request is {roomChangeRequest.status}
                  </Alert>
                  <Stack spacing={1.5}>
                    <Stack direction="row" justifyContent="space-between">
                      <Typography variant="body2" color="text.secondary">Status:</Typography>
                      <Chip label={roomChangeRequest.status} color={roomChangeRequest.status === 'Approved' ? 'success' : roomChangeRequest.status === 'Rejected' ? 'error' : 'warning'} />
                    </Stack>
                    <Stack direction="row" justifyContent="space-between">
                      <Typography variant="body2" color="text.secondary">Requested Date:</Typography>
                      <Typography variant="body1">{roomChangeRequest.requestedDate || 'N/A'}</Typography>
                    </Stack>
                    <Stack direction="row" justifyContent="space-between">
                      <Typography variant="body2" color="text.secondary">Reason:</Typography>
                      <Typography variant="body1">{roomChangeRequest.reason || 'N/A'}</Typography>
                    </Stack>
                  </Stack>
                </Stack>
              )}
            </Stack>
          </PresentationCard>
        </TabPanel>
      </Box>

      {/* Dialog for selecting room with AI-matched group */}
      <Dialog open={selectRoomDialogOpen} onClose={() => setSelectRoomDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Typography variant="h5">Select Room for Group</Typography>
            <IconButton onClick={() => setSelectRoomDialogOpen(false)} size="small">
              <IconX size={20} />
            </IconButton>
          </Stack>
        </DialogTitle>
        <DialogContent>
          {selectedGroup && (
            <Stack spacing={3} sx={{ mt: 1 }}>
              <Box>
                <Typography variant="subtitle2" gutterBottom>Selected Group:</Typography>
                {/* Handle both members (from currentRoommateGroup) and students (from AI-matched groups) */}
                {(selectedGroup.members || selectedGroup.students || []).map((student, idx) => (
                  <Typography key={student._id || student.id || idx} variant="body2">
                    • {student.name} ({student.studentId || student.admissionNumber})
                  </Typography>
                ))}
                {selectedGroup.averageScore && (
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    Compatibility: {selectedGroup.averageScore}%
                  </Typography>
                )}
              </Box>
              <FormControl fullWidth>
                <InputLabel>Select Room</InputLabel>
                <Select
                  value={selectedRoomForGroup}
                  label="Select Room"
                  onChange={(e) => setSelectedRoomForGroup(e.target.value)}
                >
                  {availableRooms
                    .filter(room => {
                      // Get group size from either members or students
                      const groupSize = (selectedGroup.members || selectedGroup.students || []).length;
                      const availableSlots = (room.capacity || room.maxCapacity) - (room.currentOccupancy || room.occupied || 0);
                      // If recommendedRoomType exists (AI-matched group), filter by it; otherwise just check capacity
                      if (selectedGroup.recommendedRoomType) {
                        return availableSlots >= groupSize && room.roomType === selectedGroup.recommendedRoomType;
                      }
                      // For current roommate groups, just check capacity matches
                      return availableSlots >= groupSize;
                    })
                    .map((room) => (
                      <MenuItem key={room._id || room.id} value={room._id || room.id}>
                        {room.roomNumber} - {room.block || room.building} - Floor {room.floor} - {room.roomType} 
                        ({room.currentOccupancy || room.occupied || 0}/{room.capacity || room.maxCapacity}) - ₹{(room.totalPrice || room.rent || 0).toLocaleString('en-IN')}
                      </MenuItem>
                    ))}
                </Select>
              </FormControl>
              {availableRooms.filter(room => {
                const groupSize = (selectedGroup.members || selectedGroup.students || []).length;
                const availableSlots = (room.capacity || room.maxCapacity) - (room.currentOccupancy || room.occupied || 0);
                if (selectedGroup.recommendedRoomType) {
                  return availableSlots >= groupSize && room.roomType === selectedGroup.recommendedRoomType;
                }
                return availableSlots >= groupSize;
              }).length === 0 && (
                <Alert severity="warning">
                  No available rooms found for {(selectedGroup.members || selectedGroup.students || []).length} students.
                  {selectedGroup.recommendedRoomType && ` Room type: ${selectedGroup.recommendedRoomType}`}
                </Alert>
              )}
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSelectRoomDialogOpen(false)}>Cancel</Button>
          <Button 
            variant="contained" 
            onClick={handleSelectRoomWithGroup}
            disabled={!selectedRoomForGroup || submitting}
            startIcon={submitting ? <CircularProgress size={16} /> : <IconHome size={16} />}
          >
            {submitting ? 'Selecting...' : 'Select Room'}
          </Button>
        </DialogActions>
      </Dialog>
    </ComponentsWrapper>
  );
}

