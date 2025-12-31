import api from './api';

export const parentService = {
  // Profile
  getProfile: async () => {
    const response = await api.get('/parent/profile');
    return response.data;
  },

  updateProfile: async (data) => {
    const response = await api.put('/parent/profile', data);
    return response.data;
  },

  // Children
  getChildren: async () => {
    const response = await api.get('/parent/children');
    return response.data;
  },

  getChildById: async (id) => {
    const response = await api.get(`/parent/children/${id}`);
    return response.data;
  },

  // Fees
  getFees: async (params) => {
    const response = await api.get('/parent/fees', { params });
    return response.data;
  },

  getPaymentStatus: async (params) => {
    const response = await api.get('/parent/fees/status', { params });
    return response.data;
  },

  getPaymentHistory: async (params) => {
    const response = await api.get('/parent/payments/history', { params });
    return response.data;
  },

  // Attendance
  getAttendance: async (params) => {
    const response = await api.get('/parent/attendance', { params });
    return response.data;
  },

  // Complaints
  getComplaints: async (params) => {
    const response = await api.get('/parent/complaints', { params });
    return response.data;
  },

  // Outing Requests
  getOutingRequests: async (params) => {
    const response = await api.get('/parent/outing-requests', { params });
    return response.data;
  },

  // Visitor Logs
  getVisitorLogs: async (params) => {
    const response = await api.get('/parent/visitor-logs', { params });
    return response.data;
  },

  // Notifications
  getNotifications: async (params) => {
    const response = await api.get('/parent/notifications', { params });
    return response.data;
  },

  markNotificationAsRead: async (id) => {
    const response = await api.put(`/parent/notifications/${id}/read`);
    return response.data;
  },

  // Dashboard
  getDashboardStats: async () => {
    const response = await api.get('/parent/dashboard/stats');
    return response.data;
  },

  // Reports
  downloadFeeReport: async (params) => {
    const response = await api.get('/parent/reports/fee', {
      params,
      responseType: 'blob',
    });
    return response.data;
  },

  downloadAttendanceReport: async (params) => {
    const response = await api.get('/parent/reports/attendance', {
      params,
      responseType: 'blob',
    });
    return response.data;
  },

  downloadComplaintReport: async (params) => {
    const response = await api.get('/parent/reports/complaint', {
      params,
      responseType: 'blob',
    });
    return response.data;
  },

  // Get activities
  getActivities: async (params) => {
    const response = await api.get('/parent/activities', { params });
    return response.data;
  },

  // Get activities that children have joined
  getChildrenActivities: async () => {
    const response = await api.get('/parent/activities/children');
    return response.data;
  },
};

export default parentService;