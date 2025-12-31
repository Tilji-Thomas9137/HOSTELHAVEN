import express from 'express';
import {
  // Students
  createStudent,
  getAllStudents,
  getStudentById,
  getStudentByStudentId,
  updateStudent,
  deleteStudent,
  // Parents
  createParent,
  getAllParents,
  // Staff
  createStaff,
  getAllStaff,
  // Rooms
  allocateRoom,
  deallocateRoom,
  createRoom,
  getAllRooms,
  getRoomById,
  updateRoom,
  deleteRoom,
  // Fees
  createFee,
  getAllFees,
  generateMessFees,
  generateRoomFeesForAllocatedStudents,
  // Attendance
  markAttendance,
  getAttendance,
  // Complaints
  getAllComplaints,
  updateComplaint,
  // Cleaning Requests
  getAllCleaningRequests,
  assignCleaningRequest,
  cancelCleaningRequest,
  // Inventory
  createInventoryItem,
  getAllInventory,
  updateInventoryItem,
  // Stock Requests
  getAllStockRequests,
  updateStockRequestStatus,
  // Visitor Logs
  createVisitorLog,
  getAllVisitorLogs,
  checkoutVisitor,
  // Vendor Logs
  getAllVendorLogs,
  // Outing Requests
  getAllOutingRequests,
  approveOutingRequest,
  rejectOutingRequest,
  // Notifications
  sendNotification,
  getAllNotifications,
  markNotificationAsRead,
  getMealSuggestions,
  getMealSuggestionPreferences,
  updateMealSuggestionStatus,
  getDailyMeals,
  getAllStaffLeaveRequests,
  updateStaffLeaveRequestStatus,
  updateStaffSchedule,
  setStaffWeeklySchedule,
  getStaffWeeklySchedule,
  // Dashboard
  getDashboardStats,
  getDashboardWidgets,
  getAllInventoryRequests,
  // Room Change Requests
  getAllRoomChangeRequests,
  getRoomChangeRequestById,
  approveRoomChangeRequest,
  rejectRoomChangeRequest,
  // Roommate Groups
  getAllRoommateGroups,
  // Activities
  createActivity,
  getAllActivities,
  getActivityById,
  updateActivity,
  deleteActivity,
  getActivityParticipants,
  // Matching Pool
  addToMatchingPool,
  getMatchingPool,
  removeFromMatchingPool,
  runAIMatching,
  getAIMatches,
  assignRoomToGroup,
} from '../controllers/adminController.js';
import { protect, authorize } from '../middleware/auth.middleware.js';
import { uploadRoomImages, handleBase64Images } from '../middleware/upload.middleware.js';

const router = express.Router();

// All routes require authentication and admin role
router.use(protect);
router.use(authorize('admin'));

// Student routes
router.post('/students', createStudent);
router.get('/students', getAllStudents);
router.get('/students/by-student-id/:studentId', getStudentByStudentId);
router.get('/students/:id', getStudentById);
router.put('/students/:id', updateStudent);
router.delete('/students/:id', deleteStudent);

// Parent routes
router.post('/parents', createParent);
router.get('/parents', getAllParents);

// Staff routes
router.post('/staff', createStaff);
router.get('/staff', getAllStaff);

// Room management routes
router.post('/rooms', uploadRoomImages, handleBase64Images, createRoom);
router.get('/rooms', getAllRooms);
router.get('/rooms/:id', getRoomById);
router.put('/rooms/:id', uploadRoomImages, handleBase64Images, updateRoom);
router.delete('/rooms/:id', deleteRoom);

// Room allocation routes
router.post('/rooms/allocate', allocateRoom);
router.post('/rooms/deallocate', deallocateRoom);

// Fee routes
router.post('/fees', createFee);
router.get('/fees', getAllFees);
router.post('/fees/generate-mess-fees', generateMessFees);
router.post('/fees/generate-room-fees', generateRoomFeesForAllocatedStudents);

// Attendance routes
router.post('/attendance', markAttendance);
router.get('/attendance', getAttendance);

// Complaint routes
router.get('/complaints', getAllComplaints);
router.put('/complaints/:id', updateComplaint);

// Cleaning Requests
router.get('/cleaning-requests', getAllCleaningRequests);
router.put('/cleaning-requests/:id/assign', assignCleaningRequest);
router.put('/cleaning-requests/:id/cancel', cancelCleaningRequest);

// Inventory routes
router.post('/inventory', createInventoryItem);
router.get('/inventory', getAllInventory);
router.put('/inventory/:id', updateInventoryItem);

// Stock request routes
router.get('/stock-requests', getAllStockRequests);
router.put('/stock-requests/:id/status', updateStockRequestStatus);

// Visitor log routes
router.post('/visitors', createVisitorLog);
router.get('/visitors', getAllVisitorLogs);
router.put('/visitors/:id/checkout', checkoutVisitor);

// Vendor log routes
router.get('/vendor-logs', getAllVendorLogs);

// Outing request routes
router.get('/outing-requests', getAllOutingRequests);
router.put('/outing-requests/:id/approve', approveOutingRequest);
router.put('/outing-requests/:id/reject', rejectOutingRequest);

// Room change request routes
router.get('/room-change-requests', getAllRoomChangeRequests);
router.get('/room-change-requests/:id', getRoomChangeRequestById);
router.put('/room-change-requests/:id/approve', approveRoomChangeRequest);
router.put('/room-change-requests/:id/reject', rejectRoomChangeRequest);

// Roommate group routes
router.get('/roommate-groups', getAllRoommateGroups);

// Notification routes
router.post('/notifications', sendNotification);
router.get('/notifications', getAllNotifications);
router.put('/notifications/:id/read', markNotificationAsRead);

// Meal suggestion routes
router.get('/meal-suggestions', getMealSuggestions);
router.get('/meal-suggestions/preferences', getMealSuggestionPreferences);
router.put('/meal-suggestions/:id/status', updateMealSuggestionStatus);

// Daily meal routes
router.get('/daily-meals', getDailyMeals);

// Staff leave request routes
router.get('/staff/leave-requests', getAllStaffLeaveRequests);
router.put('/staff/leave-requests/:id/status', updateStaffLeaveRequestStatus);

// Staff schedule management routes
router.put('/staff/:id/schedule', updateStaffSchedule);
router.post('/staff/:id/weekly-schedule', setStaffWeeklySchedule);
router.get('/staff/:id/weekly-schedule', getStaffWeeklySchedule);

// Dashboard routes
router.get('/dashboard/stats', getDashboardStats);
router.get('/dashboard/widgets', getDashboardWidgets);

// Student inventory requests (issue/return log)
router.get('/inventory-requests', getAllInventoryRequests);

// Activity routes
router.post('/activities', createActivity);
router.get('/activities', getAllActivities);
router.get('/activities/:id', getActivityById);
router.put('/activities/:id', updateActivity);
router.delete('/activities/:id', deleteActivity);
router.get('/activities/:id/participants', getActivityParticipants);

// Matching Pool routes
router.post('/matching-pool', addToMatchingPool);
router.get('/matching-pool', getMatchingPool);
router.delete('/matching-pool/:studentId', removeFromMatchingPool);
router.post('/matching-pool/ai-match', runAIMatching);
router.get('/matching-pool/ai-matches/:studentId', getAIMatches);
router.post('/matching-pool/assign-room', assignRoomToGroup);

export default router;

