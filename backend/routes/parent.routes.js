import express from 'express';
import {
  getProfile,
  updateProfile,
  getChildren,
  getChildById,
  getFees,
  getPaymentStatus,
  getPaymentHistory,
  getAttendance,
  getComplaints,
  getOutingRequests,
  getVisitorLogs,
  getNotifications,
  markNotificationAsRead,
  getDashboardStats,
  downloadFeeReport,
  downloadAttendanceReport,
  downloadComplaintReport,
  getActivities,
  getChildrenActivities,
} from '../controllers/parentController.js';
import { protect, authorize } from '../middleware/auth.middleware.js';

const router = express.Router();

// All routes require authentication and parent role
router.use(protect);
router.use(authorize('parent'));

// Profile routes
router.get('/profile', getProfile);
router.put('/profile', updateProfile);

// Children routes
router.get('/children', getChildren);
router.get('/children/:id', getChildById);

// Fee routes
router.get('/fees', getFees);
router.get('/fees/status', getPaymentStatus);

// Payment routes
router.get('/payments/history', getPaymentHistory);

// Attendance routes
router.get('/attendance', getAttendance);

// Complaint routes
router.get('/complaints', getComplaints);

// Outing request routes
router.get('/outing-requests', getOutingRequests);

// Visitor log routes
router.get('/visitor-logs', getVisitorLogs);

// Notification routes
router.get('/notifications', getNotifications);
router.put('/notifications/:id/read', markNotificationAsRead);

// Dashboard routes
router.get('/dashboard/stats', getDashboardStats);

// Report download routes
router.get('/reports/fee', downloadFeeReport);
router.get('/reports/attendance', downloadAttendanceReport);
router.get('/reports/complaint', downloadComplaintReport);

// Activity routes
router.get('/activities', getActivities);
router.get('/activities/children', getChildrenActivities);

export default router;

