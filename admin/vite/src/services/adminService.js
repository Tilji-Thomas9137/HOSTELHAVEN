import api from './api';

export const adminService = {
  // Students
  createStudent: async (studentData) => {
    const response = await api.post('/admin/students', studentData);
    return response.data;
  },

  getAllStudents: async (params) => {
    const response = await api.get('/admin/students', { params });
    return response.data;
  },

  getStudentById: async (id) => {
    const response = await api.get(`/admin/students/${id}`);
    return response.data;
  },

  getStudentByStudentId: async (studentId) => {
    const response = await api.get(`/admin/students/by-student-id/${studentId}`);
    return response.data;
  },

  updateStudent: async (id, data) => {
    const response = await api.put(`/admin/students/${id}`, data);
    return response.data;
  },

  deleteStudent: async (id) => {
    const response = await api.delete(`/admin/students/${id}`);
    return response.data;
  },

  // Parents
  createParent: async (parentData) => {
    const response = await api.post('/admin/parents', parentData);
    return response.data;
  },

  getAllParents: async () => {
    const response = await api.get('/admin/parents');
    return response.data;
  },

  // Staff
  createStaff: async (staffData) => {
    const response = await api.post('/admin/staff', staffData);
    return response.data;
  },

  getAllStaff: async () => {
    const response = await api.get('/admin/staff');
    return response.data;
  },

  // Room management
  createRoom: async (roomData) => {
    const response = await api.post('/admin/rooms', roomData);
    return response.data;
  },

  getAllRooms: async (params) => {
    const response = await api.get('/admin/rooms', { params });
    return response.data;
  },

  getRoomById: async (id) => {
    const response = await api.get(`/admin/rooms/${id}`);
    return response.data;
  },

  updateRoom: async (id, roomData) => {
    const response = await api.put(`/admin/rooms/${id}`, roomData);
    return response.data;
  },

  deleteRoom: async (id) => {
    const response = await api.delete(`/admin/rooms/${id}`);
    return response.data;
  },

  // Room allocation
  allocateRoom: async (studentId, roomId) => {
    const response = await api.post('/admin/rooms/allocate', { studentId, roomId });
    return response.data;
  },

  deallocateRoom: async (studentId) => {
    const response = await api.post('/admin/rooms/deallocate', { studentId });
    return response.data;
  },

  // Fees
  createFee: async (feeData) => {
    const response = await api.post('/admin/fees', feeData);
    return response.data;
  },

  getAllFees: async (params) => {
    const response = await api.get('/admin/fees', { params });
    return response.data;
  },

  // Attendance
  markAttendance: async (attendanceData) => {
    const response = await api.post('/admin/attendance', attendanceData);
    return response.data;
  },

  getAttendance: async (params) => {
    const response = await api.get('/admin/attendance', { params });
    return response.data;
  },

  // Complaints
  getAllComplaints: async (params) => {
    const response = await api.get('/admin/complaints', { params });
    return response.data;
  },

  updateComplaint: async (id, data) => {
    const response = await api.put(`/admin/complaints/${id}`, data);
    return response.data;
  },

  // Cleaning Requests
  getAllCleaningRequests: async (params) => {
    const response = await api.get('/admin/cleaning-requests', { params });
    return response.data;
  },

  assignCleaningRequest: async (id, data) => {
    const response = await api.put(`/admin/cleaning-requests/${id}/assign`, data);
    return response.data;
  },

  cancelCleaningRequest: async (id, cancellationReason) => {
    const response = await api.put(`/admin/cleaning-requests/${id}/cancel`, { cancellationReason });
    return response.data;
  },

  // Inventory
  createInventoryItem: async (itemData) => {
    const response = await api.post('/admin/inventory', itemData);
    return response.data;
  },

  getAllInventory: async (params) => {
    const response = await api.get('/admin/inventory', { params });
    return response.data;
  },

  getAllInventoryRequests: async (params) => {
    const response = await api.get('/admin/inventory-requests', { params });
    return response.data;
  },

  updateInventoryItem: async (id, data) => {
    const response = await api.put(`/admin/inventory/${id}`, data);
    return response.data;
  },

  // Visitor Logs
  createVisitorLog: async (logData) => {
    const response = await api.post('/admin/visitors', logData);
    return response.data;
  },

  getAllVisitorLogs: async (params) => {
    const response = await api.get('/admin/visitors', { params });
    return response.data;
  },

  checkoutVisitor: async (id) => {
    const response = await api.put(`/admin/visitors/${id}/checkout`);
    return response.data;
  },

  // Outing Requests
  getAllOutingRequests: async (params) => {
    const response = await api.get('/admin/outing-requests', { params });
    return response.data;
  },

  approveOutingRequest: async (id, remarks) => {
    const response = await api.put(`/admin/outing-requests/${id}/approve`, { remarks });
    return response.data;
  },

  rejectOutingRequest: async (id, rejectionReason) => {
    const response = await api.put(`/admin/outing-requests/${id}/reject`, { rejectionReason });
    return response.data;
  },

  // Notifications
  sendNotification: async (notificationData) => {
    const response = await api.post('/admin/notifications', notificationData);
    return response.data;
  },

  getAllNotifications: async (params) => {
    const response = await api.get('/admin/notifications', { params });
    return response.data;
  },

  markNotificationAsRead: async (id) => {
    const response = await api.put(`/admin/notifications/${id}/read`);
    return response.data;
  },

  // Meal suggestions
  getMealSuggestions: async (params) => {
    const response = await api.get('/admin/meal-suggestions', { params });
    return response.data;
  },

  getMealSuggestionPreferences: async (params) => {
    const response = await api.get('/admin/meal-suggestions/preferences', { params });
    return response.data;
  },

  updateMealSuggestionStatus: async (id, data) => {
    const response = await api.put(`/admin/meal-suggestions/${id}/status`, data);
    return response.data;
  },

  // Get daily meals
  getDailyMeals: async (params) => {
    const response = await api.get('/admin/daily-meals', { params });
    return response.data;
  },

  // Dashboard
  getDashboardStats: async () => {
    const response = await api.get('/admin/dashboard/stats');
    return response.data;
  },

  getDashboardWidgets: async (params) => {
    const response = await api.get('/admin/dashboard/widgets', { params });
    return response.data;
  },

  // Room Change Requests
  getAllRoomChangeRequests: async (params) => {
    const response = await api.get('/admin/room-change-requests', { params });
    return response.data;
  },

  getRoomChangeRequestById: async (id) => {
    const response = await api.get(`/admin/room-change-requests/${id}`);
    return response.data;
  },

  approveRoomChangeRequest: async (id, adminNotes) => {
    const response = await api.put(`/admin/room-change-requests/${id}/approve`, { adminNotes });
    return response.data;
  },

  rejectRoomChangeRequest: async (id, rejectionReason, adminNotes) => {
    const response = await api.put(`/admin/room-change-requests/${id}/reject`, { rejectionReason, adminNotes });
    return response.data;
  },

  // Staff leave requests
  getAllStaffLeaveRequests: async (params) => {
    const response = await api.get('/admin/staff/leave-requests', { params });
    return response.data;
  },

  updateStaffLeaveRequestStatus: async (id, data) => {
    const response = await api.put(`/admin/staff/leave-requests/${id}/status`, data);
    return response.data;
  },

  // Staff schedule management
  updateStaffSchedule: async (id, data) => {
    const response = await api.put(`/admin/staff/${id}/schedule`, data);
    return response.data;
  },

  setStaffWeeklySchedule: async (id, scheduleData) => {
    const response = await api.post(`/admin/staff/${id}/weekly-schedule`, scheduleData);
    return response.data;
  },

  getStaffWeeklySchedule: async (id) => {
    const response = await api.get(`/admin/staff/${id}/weekly-schedule`);
    return response.data;
  },

  // Vendor logs
  getAllVendorLogs: async (params) => {
    const response = await api.get('/admin/vendor-logs', { params });
    return response.data;
  },

  // Stock Requests
  getAllStockRequests: async (params) => {
    const response = await api.get('/admin/stock-requests', { params });
    return response.data;
  },

  updateStockRequestStatus: async (id, data) => {
    const response = await api.put(`/admin/stock-requests/${id}/status`, data);
    return response.data;
  },

  // Activities
  createActivity: async (activityData) => {
    const response = await api.post('/admin/activities', activityData);
    return response.data;
  },

  getAllActivities: async (params) => {
    const response = await api.get('/admin/activities', { params });
    return response.data;
  },

  getActivityById: async (id) => {
    const response = await api.get(`/admin/activities/${id}`);
    return response.data;
  },

  updateActivity: async (id, data) => {
    const response = await api.put(`/admin/activities/${id}`, data);
    return response.data;
  },

  deleteActivity: async (id) => {
    const response = await api.delete(`/admin/activities/${id}`);
    return response.data;
  },

  getActivityParticipants: async (activityId) => {
    const response = await api.get(`/admin/activities/${activityId}/participants`);
    return response.data;
  },

  // Matching Pool
  addToMatchingPool: async (data) => {
    const response = await api.post('/admin/matching-pool', data);
    return response.data;
  },

  getMatchingPool: async (params) => {
    const response = await api.get('/admin/matching-pool', { params });
    return response.data;
  },

  removeFromMatchingPool: async (studentId) => {
    const response = await api.delete(`/admin/matching-pool/${studentId}`);
    return response.data;
  },

  runAIMatching: async (data) => {
    const response = await api.post('/admin/matching-pool/ai-match', data);
    return response.data;
  },

  getAIMatches: async (studentId, params) => {
    const response = await api.get(`/admin/matching-pool/ai-matches/${studentId}`, { params });
    return response.data;
  },

  assignRoomToGroup: async (data) => {
    const response = await api.post('/admin/matching-pool/assign-room', data);
    return response.data;
  },

  getRoommateGroups: async (params) => {
    const response = await api.get('/admin/roommate-groups', { params });
    return response.data;
  },
};

export default adminService;