import express from 'express';
import {
  getProfile,
  updateProfile,
  getFees,
  makePayment,
  getPaymentHistory,
  getAttendance,
  submitComplaint,
  getComplaints,
  requestOuting,
  getOutingRequests,
  updateOutingReturnDate,
  getMealPreferences,
  updateMealPreferences,
  submitMealSuggestion,
  getMealSuggestions,
  getDailyMeals,
  getNotifications,
  markNotificationAsRead,
  getRoomDetails,
  getVisitorHistory,
  getAvailableRooms,
  selectRoom,
  selectRoomWithRoommates,
  requestRoomSelection,
  getRoomSelectionRequests,
  getAvailableStudents,
  sendRoommateRequest,
  getRoommateRequests,
  acceptRoommateRequest,
  rejectRoommateRequest,
  sendRoommateGroupRequest,
  respondToRoommateGroupRequest,
  getAvailableRoomsForGroup,
  selectRoomForGroup,
  getMyRoommateGroup,
  updateAIPreferences,
  setRoomType,
  setPreferredRoommates,
  getAIMatches,
  getAIMatchedGroups,
  getMatchingHistory,
  submitCleaningRequest,
  getCleaningRequests,
  getCleaningFrequency,
  getCleaningSchedule,
  getDashboardStats,
  getNotificationPreferences,
  updateNotificationPreferences,
  getAvailableRoomsForChange,
  requestRoomChange,
  getRoomChangeRequest,
  getRoomChangeRequestHistory,
  downloadReceipt,
  getActivities,
  joinActivity,
  getActivityParticipations,
  getEligibleInventoryItems,
  requestInventoryItem,
  getInventoryRequests,
  checkPaymentModalStatus,
  getWallet,
} from '../controllers/studentController.js';
import { protect, authorize, requireRoomAllocation } from '../middleware/auth.middleware.js';

const router = express.Router();

// All routes require authentication and student role
router.use(protect);
router.use(authorize('student'));

// Profile routes (no room allocation required)
router.get('/profile', getProfile);
router.put('/profile', updateProfile);

// Room selection routes (no room allocation required - students need to select room first)
router.get('/rooms/available', getAvailableRooms);
router.post('/rooms/select', selectRoom); // Direct room selection
router.post('/rooms/select-with-roommates', selectRoomWithRoommates); // Select room with AI-matched roommates
router.post('/rooms/request', requestRoomSelection); // Request-based selection
router.get('/rooms/requests', getRoomSelectionRequests);
// AI matching routes (no room allocation required)
router.get('/rooms/ai-matched-groups', getAIMatchedGroups); // Get AI-matched roommate groups
// AI preferences routes (no room allocation required - students need to set preferences before getting room)
router.put('/roommates/ai-preferences', updateAIPreferences); // Save AI preferences
router.get('/roommates/ai-matches', getAIMatches); // Get AI matches
// Room type and preferred roommates (no room allocation required)
router.post('/room-type', setRoomType);
router.post('/preferred-roommates', setPreferredRoommates);

// Roommate group formation routes (no room allocation required - students form groups before room selection)
router.post('/roommates/group/request', sendRoommateGroupRequest); // Send roommate group request
router.post('/roommates/group/respond', respondToRoommateGroupRequest); // Accept/reject group request
router.get('/roommates/group', getMyRoommateGroup); // Get current roommate group
router.get('/rooms/available-for-group', getAvailableRoomsForGroup); // Get available rooms for group
router.post('/roommates/group/select-room', selectRoomForGroup); // Select room for group (leader only)

// Roommate request routes (no room allocation required - students can send requests before room allocation)
// NOTE: These are legacy routes. New code should use /roommates/group/request for group-based workflow
router.get('/roommates/available', getAvailableStudents);
router.post('/roommates/request', sendRoommateRequest); // Legacy: individual roommate request
router.get('/roommates/requests', getRoommateRequests);
router.post('/roommates/accept', acceptRoommateRequest);
router.post('/roommates/reject', rejectRoommateRequest);

// Fees and payments (no room allocation required - students need to pay for room)
router.get('/fees', getFees);
router.post('/payments', makePayment);
router.get('/payments/history', getPaymentHistory);
router.get('/payments/modal-status', checkPaymentModalStatus); // Check if payment modal should show
router.get('/wallet', getWallet); // Get wallet balance and transactions

// Notification routes (no room allocation required - students should see notifications even without room)
router.get('/notifications', getNotifications);
router.put('/notifications/:id/read', markNotificationAsRead);

// All routes below require room allocation
router.use(requireRoomAllocation);

// Room routes (require room allocation)
router.get('/room', getRoomDetails);
// Room change routes (require room allocation)
router.get('/room/change/available-rooms', getAvailableRoomsForChange);
router.post('/room/change-request', requestRoomChange);
router.get('/room/change-request', getRoomChangeRequest);
router.get('/room/change-request/history', getRoomChangeRequestHistory);

// Payment receipt download (require room allocation)
router.get('/payments/receipt/:paymentId', downloadReceipt);

// Attendance routes (require room allocation)
router.get('/attendance', getAttendance);

// Complaint routes (require room allocation)
router.post('/complaints', submitComplaint);
router.get('/complaints', getComplaints);

// Outing request routes (require room allocation)
router.post('/outing-requests', requestOuting);
router.get('/outing-requests', getOutingRequests);
router.put('/outing-requests/:id/return-date', updateOutingReturnDate);

// Meal preference routes (require room allocation)
router.get('/meal-preferences', getMealPreferences);
router.put('/meal-preferences', updateMealPreferences);

// Meal suggestion routes (require room allocation)
router.post('/meal-suggestions', requireRoomAllocation, submitMealSuggestion);
router.get('/meal-suggestions', requireRoomAllocation, getMealSuggestions);

// Daily meals route (accessible to all students)
router.get('/daily-meals', getDailyMeals);

// Visitor history routes (require room allocation)
router.get('/visitor-history', getVisitorHistory);

// Roommate matching history (require room allocation - for viewing past matches)
router.get('/roommates/matching-history', getMatchingHistory);

// Cleaning routes (require room allocation)
router.post('/cleaning/request', submitCleaningRequest);
router.get('/cleaning/requests', getCleaningRequests);
router.get('/cleaning/frequency', getCleaningFrequency);
router.get('/cleaning/schedule', getCleaningSchedule);

// Dashboard routes (require room allocation)
router.get('/dashboard/stats', getDashboardStats);

// Notification preferences routes (require room allocation)
router.get('/notification-preferences', getNotificationPreferences);
router.put('/notification-preferences', updateNotificationPreferences);

// Activity routes (require room allocation)
router.get('/activities', getActivities);
router.post('/activities/:id/join', joinActivity);
router.get('/activities/participations', getActivityParticipations);

// Inventory request routes (require room allocation)
router.get('/inventory/eligible-items', getEligibleInventoryItems);
router.post('/inventory/requests', requestInventoryItem);
router.get('/inventory/requests', getInventoryRequests);

export default router;
