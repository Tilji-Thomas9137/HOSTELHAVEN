import api from './api';

export const studentService = {
  // Get profile
  getProfile: async () => {
    const response = await api.get('/student/profile');
    return response.data;
  },

  // Update profile
  updateProfile: async (data) => {
    const response = await api.put('/student/profile', data);
    return response.data;
  },

  // Get fees
  getFees: async () => {
    const response = await api.get('/student/fees');
    return response.data;
  },

  // Make payment
  makePayment: async (paymentData) => {
    const response = await api.post('/student/payments', paymentData);
    return response.data;
  },

  // Get payment history
  getPaymentHistory: async () => {
    const response = await api.get('/student/payments/history');
    return response.data;
  },

  // Check payment modal status (Production-ready: Auto-opens payment modal)
  checkPaymentModalStatus: async () => {
    const response = await api.get('/student/payments/modal-status');
    return response.data;
  },

  // Download payment receipt
  downloadReceipt: async (paymentId) => {
    const response = await api.get(`/student/payments/receipt/${paymentId}`, {
      responseType: 'blob', // Important for PDF download
    });
    return response.data;
  },

  // Get attendance
  getAttendance: async (params) => {
    const response = await api.get('/student/attendance', { params });
    return response.data;
  },

  // Submit complaint
  submitComplaint: async (complaintData) => {
    const response = await api.post('/student/complaints', complaintData);
    return response.data;
  },

  // Get complaints
  getComplaints: async () => {
    const response = await api.get('/student/complaints');
    return response.data;
  },

  // Request outing
  requestOuting: async (outingData) => {
    const response = await api.post('/student/outing-requests', outingData);
    return response.data;
  },

  // Get outing requests
  getOutingRequests: async () => {
    const response = await api.get('/student/outing-requests');
    return response.data;
  },

  updateOutingReturnDate: async (id, expectedReturnDate) => {
    const response = await api.put(`/student/outing-requests/${id}/return-date`, { expectedReturnDate });
    return response.data;
  },

  // Get meal preferences
  getMealPreferences: async () => {
    const response = await api.get('/student/meal-preferences');
    return response.data;
  },

  // Update meal preferences
  updateMealPreferences: async (preferences) => {
    const response = await api.put('/student/meal-preferences', preferences);
    return response.data;
  },

  // Submit meal suggestion
  submitMealSuggestion: async (suggestionData) => {
    const response = await api.post('/student/meal-suggestions', suggestionData);
    return response.data;
  },

  // Get meal suggestions
  getMealSuggestions: async () => {
    const response = await api.get('/student/meal-suggestions');
    return response.data;
  },

  // Get daily meals (menu)
  getDailyMeals: async (params) => {
    const response = await api.get('/student/daily-meals', { params });
    return response.data;
  },

  // Get notifications
  getNotifications: async (params) => {
    const response = await api.get('/student/notifications', { params });
    return response.data;
  },

  // Mark notification as read
  markNotificationAsRead: async (notificationId) => {
    const response = await api.put(`/student/notifications/${notificationId}/read`);
    return response.data;
  },

  // Get room details
  getRoomDetails: async () => {
    const response = await api.get('/student/room');
    return response.data;
  },

  // Get available rooms for room change
  getAvailableRoomsForChange: async () => {
    const response = await api.get('/student/room/change/available-rooms');
    return response.data;
  },

  // Request room change
  requestRoomChange: async (requestedRoomId, reason) => {
    const response = await api.post('/student/room/change-request', {
      requestedRoomId,
      reason,
    });
    return response.data;
  },

  // Get current room change request
  getRoomChangeRequest: async () => {
    const response = await api.get('/student/room/change-request');
    return response.data;
  },

  // Get room change request history
  getRoomChangeRequestHistory: async () => {
    const response = await api.get('/student/room/change-request/history');
    return response.data;
  },

  // Get visitor history
  getVisitorHistory: async (params) => {
    const response = await api.get('/student/visitor-history', { params });
    return response.data;
  },

  // Get available rooms
  getAvailableRooms: async () => {
    const response = await api.get('/student/rooms/available');
    return response.data;
  },

  // Select room directly (direct allocation)
  selectRoom: async (roomId) => {
    const response = await api.post('/student/rooms/select', { roomId });
    return response.data;
  },

  // Request room selection
  requestRoomSelection: async (roomId, note) => {
    const response = await api.post('/student/rooms/request', { roomId, note });
    return response.data;
  },

  // Get room selection requests
  getRoomSelectionRequests: async () => {
    const response = await api.get('/student/rooms/requests');
    return response.data;
  },

  // Get available students for roommate selection
  getAvailableStudents: async () => {
    const response = await api.get('/student/roommates/available');
    return response.data;
  },

  // Send roommate request
  sendRoommateRequest: async (recipientId, message) => {
    const response = await api.post('/student/roommates/request', { recipientId, message });
    return response.data;
  },

  // Get roommate requests
  getRoommateRequests: async () => {
    const response = await api.get('/student/roommates/requests');
    return response.data;
  },

  // Accept roommate request
  acceptRoommateRequest: async (requestId) => {
    const response = await api.post('/student/roommates/accept', { requestId });
    return response.data;
  },

  // Reject roommate request
  rejectRoommateRequest: async (requestId) => {
    const response = await api.post('/student/roommates/reject', { requestId });
    return response.data;
  },

  // NEW: Roommate Group Formation (Group-based workflow)
  // Send roommate group request (creates RoommateGroup)
  sendRoommateGroupRequest: async (recipientId, message, aiMatchingScore) => {
    const response = await api.post('/student/roommates/group/request', { 
      recipientId, 
      message: message || '', 
      aiMatchingScore 
    });
    return response.data;
  },

  // Respond to roommate group request (accept/reject)
  respondToRoommateGroupRequest: async (requestId, action) => {
    const response = await api.post('/student/roommates/group/respond', { 
      requestId, 
      action // 'accept' or 'reject'
    });
    return response.data;
  },

  // Get current roommate group
  getMyRoommateGroup: async () => {
    const response = await api.get('/student/roommates/group');
    return response.data;
  },

  // Get available rooms for group
  getAvailableRoomsForGroup: async (groupId) => {
    const response = await api.get(`/student/rooms/available-for-group?groupId=${groupId}`);
    return response.data;
  },

  // Select room for group (leader only)
  selectRoomForGroup: async (groupId, roomId) => {
    const response = await api.post('/student/roommates/group/select-room', { 
      groupId, 
      roomId 
    });
    return response.data;
  },

  // Update AI preferences
  updateAIPreferences: async (preferences) => {
    const response = await api.put('/student/roommates/ai-preferences', preferences);
    return response.data;
  },

  // Set room type
  setRoomType: async (roomType) => {
    const response = await api.post('/student/room-type', { roomType });
    return response.data;
  },

  // Set preferred roommates
  setPreferredRoommates: async (roommateIds) => {
    const response = await api.post('/student/preferred-roommates', { roommateIds });
    return response.data;
  },

  // Get AI matches
  getAIMatches: async (params) => {
    const response = await api.get('/student/roommates/ai-matches', { params });
    return response.data;
  },

  getAIMatchedGroups: async (params) => {
    const response = await api.get('/student/rooms/ai-matched-groups', { params });
    return response.data;
  },

  selectRoomWithRoommates: async (data) => {
    const response = await api.post('/student/rooms/select-with-roommates', data);
    return response.data;
  },

  // Get matching history
  getMatchingHistory: async () => {
    const response = await api.get('/student/roommates/matching-history');
    return response.data;
  },

  // Submit cleaning request
  submitCleaningRequest: async (requestData) => {
    const response = await api.post('/student/cleaning/request', requestData);
    return response.data;
  },

  // Get cleaning requests
  getCleaningRequests: async () => {
    const response = await api.get('/student/cleaning/requests');
    return response.data;
  },

  // Get cleaning frequency
  getCleaningFrequency: async () => {
    const response = await api.get('/student/cleaning/frequency');
    return response.data;
  },

  // Get cleaning schedule
  getCleaningSchedule: async () => {
    const response = await api.get('/student/cleaning/schedule');
    return response.data;
  },

  // Get dashboard stats
  getDashboardStats: async () => {
    const response = await api.get('/student/dashboard/stats');
    return response.data;
  },

  // Activities
  getActivities: async (params) => {
    const response = await api.get('/student/activities', { params });
    return response.data;
  },

  joinActivity: async (activityId) => {
    const response = await api.post(`/student/activities/${activityId}/join`);
    return response.data;
  },

  getActivityParticipations: async () => {
    const response = await api.get('/student/activities/participations');
    return response.data;
  },

  // Get notification preferences
  getNotificationPreferences: async () => {
    const response = await api.get('/student/notification-preferences');
    return response.data;
  },

  // Update notification preferences
  updateNotificationPreferences: async (preferences) => {
    const response = await api.put('/student/notification-preferences', preferences);
    return response.data;
  },

  // Get activities
  getActivities: async (params) => {
    const response = await api.get('/student/activities', { params });
    return response.data;
  },

  // Inventory requests
  getEligibleInventoryItems: async () => {
    const response = await api.get('/student/inventory/eligible-items');
    return response.data;
  },

  requestInventoryItem: async (requestData) => {
    const response = await api.post('/student/inventory/requests', requestData);
    return response.data;
  },

  getInventoryRequests: async () => {
    const response = await api.get('/student/inventory/requests');
    return response.data;
  },

  // Get wallet balance and transactions
  getWallet: async () => {
    const response = await api.get('/student/wallet');
    return response.data;
  },
};

export default studentService;