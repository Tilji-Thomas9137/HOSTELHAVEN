import api from './api';

export const staffService = {
  // Profile
  getProfile: async () => {
    const response = await api.get('/staff/profile');
    return response.data;
  },

  updateProfile: async (data) => {
    const response = await api.put('/staff/profile', data);
    return response.data;
  },

  // Schedule
  getSchedule: async (params) => {
    const response = await api.get('/staff/schedule', { params });
    return response.data;
  },

  // Attendance
  markAttendance: async (attendanceData) => {
    const response = await api.post('/staff/attendance', attendanceData);
    return response.data;
  },

  markStudentAttendance: async (attendanceData) => {
    const response = await api.post('/staff/attendance/student', attendanceData);
    return response.data;
  },

  // Complaints
  getAssignedComplaints: async (params) => {
    const response = await api.get('/staff/complaints', { params });
    return response.data;
  },

  updateComplaintStatus: async (id, data) => {
    const response = await api.put(`/staff/complaints/${id}/status`, data);
    return response.data;
  },

  // Inventory
  getInventoryItems: async (params) => {
    const response = await api.get('/staff/inventory', { params });
    return response.data;
  },

  updateInventoryItem: async (id, data) => {
    const response = await api.put(`/staff/inventory/${id}`, data);
    return response.data;
  },

  // Visitor Logs
  logVisitor: async (visitorData) => {
    const response = await api.post('/staff/visitors', visitorData);
    return response.data;
  },

  getVisitorLogs: async (params) => {
    const response = await api.get('/staff/visitors', { params });
    return response.data;
  },

  checkoutVisitor: async (id) => {
    const response = await api.put(`/staff/visitors/${id}/checkout`);
    return response.data;
  },

  // Students
  getStudents: async (params) => {
    const response = await api.get('/staff/students', { params });
    return response.data;
  },

  // Notifications
  getNotifications: async (params) => {
    const response = await api.get('/staff/notifications', { params });
    return response.data;
  },

  markNotificationAsRead: async (id) => {
    const response = await api.put(`/staff/notifications/${id}/read`);
    return response.data;
  },

  // Dashboard
  getDashboardStats: async () => {
    const response = await api.get('/staff/dashboard/stats');
    return response.data;
  },

  // Meal suggestions
  getMealSuggestions: async (params) => {
    const response = await api.get('/staff/meal-suggestions', { params });
    return response.data;
  },

  getMealSuggestionPreferences: async (params) => {
    const response = await api.get('/staff/meal-suggestions/preferences', { params });
    return response.data;
  },

  // Get daily meals (menu)
  getDailyMeals: async (params) => {
    const response = await api.get('/staff/daily-meals', { params });
    return response.data;
  },

  updateMealSuggestionStatus: async (id, data) => {
    const response = await api.put(`/staff/meal-suggestions/${id}/status`, data);
    return response.data;
  },

  // Leave requests
  requestLeave: async (leaveData) => {
    const response = await api.post('/staff/leave-requests', leaveData);
    return response.data;
  },

  getLeaveRequests: async () => {
    const response = await api.get('/staff/leave-requests');
    return response.data;
  },

  // Stock requests
  createStockRequest: async (requestData) => {
    const response = await api.post('/staff/stock-requests', requestData);
    return response.data;
  },

  getStockRequests: async (params) => {
    const response = await api.get('/staff/stock-requests', { params });
    return response.data;
  },

  // Outpass QR scan
  scanOutpassQR: async (data) => {
    const response = await api.post('/staff/outpass/scan', data);
    return response.data;
  },

  // Manual student exit/return
  manualStudentExit: async (data) => {
    const response = await api.post('/staff/outpass/manual', data);
    return response.data;
  },

  // Get student by admission number
  getStudentByAdmissionNumber: async (admissionNumber) => {
    const response = await api.get(`/staff/students/${admissionNumber}`);
    return response.data;
  },

  // Get student exit/return logs
  getStudentExitLogs: async (params) => {
    const response = await api.get('/staff/outpass/logs', { params });
    return response.data;
  },

  // Student visitor management
  createStudentVisitorLog: async (data) => {
    const response = await api.post('/staff/student-visitors', data);
    return response.data;
  },

  getStudentVisitorLogs: async (params) => {
    const response = await api.get('/staff/student-visitors', { params });
    return response.data;
  },

  checkoutStudentVisitor: async (id) => {
    const response = await api.put(`/staff/student-visitors/${id}/checkout`);
    return response.data;
  },

  // Get activities
  getActivities: async (params) => {
    const response = await api.get('/staff/activities', { params });
    return response.data;
  },

  // Inventory request management
  getInventoryRequests: async (params) => {
    const response = await api.get('/staff/inventory-requests', { params });
    return response.data;
  },

  approveInventoryRequest: async (id) => {
    const response = await api.put(`/staff/inventory-requests/${id}/approve`);
    return response.data;
  },

  rejectInventoryRequest: async (id, rejectionReason) => {
    const response = await api.put(`/staff/inventory-requests/${id}/reject`, { rejectionReason });
    return response.data;
  },

  issueInventoryItem: async (id) => {
    const response = await api.put(`/staff/inventory-requests/${id}/issue`);
    return response.data;
  },

  returnInventoryItem: async (id, returnNotes) => {
    const response = await api.put(`/staff/inventory-requests/${id}/return`, { returnNotes });
    return response.data;
  },

  // Cleaning request management
  getAssignedCleaningRequests: async (params) => {
    const response = await api.get('/staff/cleaning-requests', { params });
    return response.data;
  },

  completeCleaningRequest: async (id, completionNotes) => {
    const response = await api.put(`/staff/cleaning-requests/${id}/complete`, { completionNotes });
    return response.data;
  },
};

export default staffService;