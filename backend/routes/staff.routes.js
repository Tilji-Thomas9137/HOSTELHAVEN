import express from 'express';
import {
  getProfile,
  updateProfile,
  getSchedule,
  markAttendance,
  getAttendance,
  getAssignedComplaints,
  updateComplaintStatus,
  getInventoryItems,
  updateInventoryItem,
  logVisitor,
  getVisitorLogs,
  checkoutVisitor,
  getNotifications,
  markNotificationAsRead,
  markStudentAttendance,
  getStudents,
  getDashboardStats,
  getMealSuggestions,
  getMealSuggestionPreferences,
  updateMealSuggestionStatus,
  getDailyMeals,
  requestLeave,
  getLeaveRequests,
  createStockRequest,
  getStockRequests,
  scanOutpassQR,
  manualStudentExit,
  getStudentExitLogs,
  getStudentByAdmissionNumber,
  createStudentVisitorLog,
  checkoutStudentVisitor,
  getStudentVisitorLogs,
  getActivities,
  getInventoryRequests,
  approveInventoryRequest,
  rejectInventoryRequest,
  issueInventoryItem,
  returnInventoryItem,
  getAssignedCleaningRequests,
  completeCleaningRequest,
} from '../controllers/staffController.js';
import { protect, authorize } from '../middleware/auth.middleware.js';

const router = express.Router();

// All routes require authentication and staff role
router.use(protect);
router.use(authorize('staff'));

// Profile routes
router.get('/profile', getProfile);
router.put('/profile', updateProfile);

// Schedule routes
router.get('/schedule', getSchedule);

// Leave request routes
router.post('/leave-requests', requestLeave);
router.get('/leave-requests', getLeaveRequests);

// Attendance routes
router.post('/attendance', markAttendance);
router.get('/attendance', getAttendance);
router.post('/attendance/student', markStudentAttendance);

// Complaint routes
router.get('/complaints', getAssignedComplaints);
router.put('/complaints/:id/status', updateComplaintStatus);

// Inventory routes
router.get('/inventory', getInventoryItems);
router.put('/inventory/:id', updateInventoryItem);

// Stock request routes
router.post('/stock-requests', createStockRequest);
router.get('/stock-requests', getStockRequests);

// Visitor log routes (now vendor logs)
router.post('/visitors', logVisitor);
router.get('/visitors', getVisitorLogs);
router.put('/visitors/:id/checkout', checkoutVisitor);

// Outpass QR scan route
router.post('/outpass/scan', scanOutpassQR);

// Manual student exit/return route
router.post('/outpass/manual', manualStudentExit);

// Get student exit/return logs
router.get('/outpass/logs', getStudentExitLogs);

// Get student details by admission number
router.get('/students/:admissionNumber', getStudentByAdmissionNumber);

// Student visitor log routes
router.post('/student-visitors', createStudentVisitorLog);
router.get('/student-visitors', getStudentVisitorLogs);
router.put('/student-visitors/:id/checkout', checkoutStudentVisitor);

// Student routes (for attendance marking)
router.get('/students', getStudents);

// Notification routes
router.get('/notifications', getNotifications);
router.put('/notifications/:id/read', markNotificationAsRead);

// Dashboard routes
router.get('/dashboard/stats', getDashboardStats);

// Meal suggestion routes
router.get('/meal-suggestions', getMealSuggestions);
router.get('/meal-suggestions/preferences', getMealSuggestionPreferences);
router.put('/meal-suggestions/:id/status', updateMealSuggestionStatus);

// Daily meals route
router.get('/daily-meals', getDailyMeals);

// Activity routes
router.get('/activities', getActivities);

// Inventory request management routes
router.get('/inventory-requests', getInventoryRequests);
router.put('/inventory-requests/:id/approve', approveInventoryRequest);
router.put('/inventory-requests/:id/reject', rejectInventoryRequest);
router.put('/inventory-requests/:id/issue', issueInventoryItem);
router.put('/inventory-requests/:id/return', returnInventoryItem);

// Cleaning request management routes
router.get('/cleaning-requests', getAssignedCleaningRequests);
router.put('/cleaning-requests/:id/complete', completeCleaningRequest);

export default router;

