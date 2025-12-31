# HostelHaven Backend Integration Guide

## 📋 Table of Contents
1. [Setup Instructions](#setup-instructions)
2. [API Endpoints](#api-endpoints)
3. [Frontend Integration](#frontend-integration)
4. [Authentication Flow](#authentication-flow)
5. [Example Axios Services](#example-axios-services)

## 🚀 Setup Instructions

### 1. Install Dependencies
```bash
cd backend
npm install
```

### 2. Environment Variables
Create a `.env` file in the `backend` directory with the following variables:

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/hostelhaven
JWT_SECRET=your_super_secret_jwt_key
JWT_REFRESH_SECRET=your_super_secret_refresh_jwt_key
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
FRONTEND_URL=http://localhost:3002
```

### 3. Run the Server
```bash
# Development mode
npm run dev

# Production mode
npm start
```

## 📡 API Endpoints

### Authentication Endpoints

#### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "username": "admin",
  "password": "Admin@123"
}
```

**Response:**
```json
{
  "message": "Login successful",
  "user": {
    "_id": "...",
    "name": "Admin",
    "username": "admin",
    "email": "admin@hostelhaven.com",
    "role": "admin"
  },
  "token": "eyJhbGc...",
  "refreshToken": "eyJhbGc..."
}
```

#### Refresh Token
```http
POST /api/auth/refresh-token
Content-Type: application/json

{
  "refreshToken": "eyJhbGc..."
}
```

#### First Login Password Reset
```http
PUT /api/auth/first-login-reset
Authorization: Bearer <token>
Content-Type: application/json

{
  "newPassword": "NewPassword@123"
}
```

#### Change Password
```http
PUT /api/auth/change-password
Authorization: Bearer <token>
Content-Type: application/json

{
  "currentPassword": "OldPassword@123",
  "newPassword": "NewPassword@123"
}
```

#### Forgot Password
```http
POST /api/auth/forgot-password
Content-Type: application/json

{
  "email": "user@example.com"
}
```

#### Reset Password
```http
POST /api/auth/reset-password
Content-Type: application/json

{
  "token": "reset_token_from_email",
  "password": "NewPassword@123"
}
```

### Admin Endpoints

#### Create Student
```http
POST /api/admin/students
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "1234567890",
  "address": "123 Main St",
  "dateOfBirth": "2000-01-15",
  "course": "Computer Science",
  "year": "2nd Year",
  "emergencyContact": {
    "name": "Jane Doe",
    "phone": "0987654321",
    "relation": "Mother"
  }
}
```

#### Get All Students
```http
GET /api/admin/students?status=active&page=1&limit=10&search=john
Authorization: Bearer <admin_token>
```

#### Allocate Room
```http
POST /api/admin/rooms/allocate
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "studentId": "student_id",
  "roomId": "room_id"
}
```

#### Mark Attendance
```http
POST /api/admin/attendance
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "studentId": "student_id",
  "type": "student",
  "date": "2024-03-15",
  "status": "present",
  "checkIn": "2024-03-15T09:00:00Z",
  "remarks": "On time"
}
```

#### Approve Outing Request
```http
PUT /api/admin/outing-requests/:id/approve
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "remarks": "Approved"
}
```

### Student Endpoints

#### Get Profile
```http
GET /api/student/profile
Authorization: Bearer <student_token>
```

#### Update Profile
```http
PUT /api/student/profile
Authorization: Bearer <student_token>
Content-Type: application/json

{
  "name": "Updated Name",
  "phone": "9876543210"
}
```

#### Get Fees
```http
GET /api/student/fees
Authorization: Bearer <student_token>
```

#### Make Payment
```http
POST /api/student/payments
Authorization: Bearer <student_token>
Content-Type: application/json

{
  "feeId": "fee_id",
  "amount": 450,
  "paymentMethod": "online_payment",
  "transactionId": "TXN123456"
}
```

#### Submit Complaint
```http
POST /api/student/complaints
Authorization: Bearer <student_token>
Content-Type: application/json

{
  "title": "AC Not Working",
  "description": "AC in room is not working properly",
  "category": "maintenance",
  "priority": "high"
}
```

#### Request Outing
```http
POST /api/student/outing-requests
Authorization: Bearer <student_token>
Content-Type: application/json

{
  "purpose": "Medical appointment",
  "destination": "City Hospital",
  "departureDate": "2024-03-20T10:00:00Z",
  "expectedReturnDate": "2024-03-20T14:00:00Z",
  "emergencyContact": {
    "name": "Jane Doe",
    "phone": "1234567890"
  }
}
```

#### Update Meal Preferences
```http
PUT /api/student/meal-preferences
Authorization: Bearer <student_token>
Content-Type: application/json

{
  "breakfast": true,
  "lunch": true,
  "dinner": true,
  "dietaryRestrictions": ["vegetarian"],
  "allergies": ["nuts"]
}
```

### Staff Endpoints

#### Get Schedule
```http
GET /api/staff/schedule?date=2024-03-15
Authorization: Bearer <staff_token>
```

#### Mark Student Attendance
```http
POST /api/staff/attendance/student
Authorization: Bearer <staff_token>
Content-Type: application/json

{
  "studentId": "student_id",
  "status": "present",
  "date": "2024-03-15"
}
```

#### Update Complaint Status
```http
PUT /api/staff/complaints/:id/status
Authorization: Bearer <staff_token>
Content-Type: application/json

{
  "status": "in_progress",
  "resolutionNotes": "Working on it"
}
```

#### Log Visitor
```http
POST /api/staff/visitors
Authorization: Bearer <staff_token>
Content-Type: application/json

{
  "visitorName": "Jane Doe",
  "visitorPhone": "1234567890",
  "studentId": "student_id",
  "purpose": "visit"
}
```

### Parent Endpoints

#### Get Children
```http
GET /api/parent/children
Authorization: Bearer <parent_token>
```

#### Get Payment Status
```http
GET /api/parent/fees/status?studentId=student_id
Authorization: Bearer <parent_token>
```

#### Get Child Attendance
```http
GET /api/parent/attendance?studentId=student_id&startDate=2024-03-01&endDate=2024-03-31
Authorization: Bearer <parent_token>
```

## 🔐 Authentication Flow

### Login Flow
1. User submits username/email and password
2. Backend validates credentials
3. Backend generates access token (30 days) and refresh token (90 days)
4. Tokens are returned to frontend
5. Frontend stores tokens in localStorage/sessionStorage

### Token Refresh Flow
1. When access token expires, frontend calls `/api/auth/refresh-token`
2. Backend validates refresh token
3. Backend generates new access token
4. Frontend updates stored access token

### First Login Flow
1. Admin creates user → Email sent with temporary password
2. User logs in with temporary credentials → `firstLogin: true`
3. User must change password on first login
4. Call `/api/auth/first-login-reset` to set new password

## 💻 Frontend Integration

### Axios Service Setup

Create `admin/vite/src/services/api.js`:

```javascript
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - Add token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('hostelhaven_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - Handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If token expired, try to refresh
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('hostelhaven_refresh_token');
        if (!refreshToken) {
          throw new Error('No refresh token');
        }

        const response = await axios.post(`${API_URL}/auth/refresh-token`, {
          refreshToken,
        });

        const { token } = response.data;
        localStorage.setItem('hostelhaven_token', token);

        // Retry original request with new token
        originalRequest.headers.Authorization = `Bearer ${token}`;
        return api(originalRequest);
      } catch (refreshError) {
        // Refresh failed, logout user
        localStorage.removeItem('hostelhaven_token');
        localStorage.removeItem('hostelhaven_refresh_token');
        localStorage.removeItem('hostelhaven_user');
        window.location.href = '/auth/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default api;
```

### Auth Service

Create `admin/vite/src/services/authService.js`:

```javascript
import api from './api';

export const authService = {
  // Login
  login: async (username, password) => {
    const response = await api.post('/auth/login', { username, password });
    const { user, token, refreshToken } = response.data;

    // Store tokens and user data
    localStorage.setItem('hostelhaven_token', token);
    localStorage.setItem('hostelhaven_refresh_token', refreshToken);
    localStorage.setItem('hostelhaven_user', JSON.stringify(user));

    return { user, token, refreshToken };
  },

  // Logout
  logout: async () => {
    try {
      await api.post('/auth/logout');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem('hostelhaven_token');
      localStorage.removeItem('hostelhaven_refresh_token');
      localStorage.removeItem('hostelhaven_user');
    }
  },

  // Get current user
  getMe: async () => {
    const response = await api.get('/auth/me');
    return response.data;
  },

  // First login password reset
  firstLoginReset: async (newPassword) => {
    const response = await api.put('/auth/first-login-reset', { newPassword });
    return response.data;
  },

  // Change password
  changePassword: async (currentPassword, newPassword) => {
    const response = await api.put('/auth/change-password', {
      currentPassword,
      newPassword,
    });
    return response.data;
  },

  // Forgot password
  forgotPassword: async (email) => {
    const response = await api.post('/auth/forgot-password', { email });
    return response.data;
  },

  // Reset password
  resetPassword: async (token, password) => {
    const response = await api.post('/auth/reset-password', { token, password });
    return response.data;
  },
};

export default authService;
```

### Student Service

Create `admin/vite/src/services/studentService.js`:

```javascript
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

  // Request room change
  requestRoomChange: async (newRoomId, reason) => {
    const response = await api.post('/student/room/change-request', {
      newRoomId,
      reason,
    });
    return response.data;
  },

  // Get visitor history
  getVisitorHistory: async (params) => {
    const response = await api.get('/student/visitor-history', { params });
    return response.data;
  },
};

export default studentService;
```

### Admin Service

Create `admin/vite/src/services/adminService.js`:

```javascript
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

  // Inventory
  createInventoryItem: async (itemData) => {
    const response = await api.post('/admin/inventory', itemData);
    return response.data;
  },

  getAllInventory: async (params) => {
    const response = await api.get('/admin/inventory', { params });
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
};

export default adminService;
```

### Staff Service

Create `admin/vite/src/services/staffService.js`:

```javascript
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
};

export default staffService;
```

### Parent Service

Create `admin/vite/src/services/parentService.js`:

```javascript
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

  // Notifications
  getNotifications: async (params) => {
    const response = await api.get('/parent/notifications', { params });
    return response.data;
  },

  markNotificationAsRead: async (id) => {
    const response = await api.put(`/parent/notifications/${id}/read`);
    return response.data;
  },
};

export default parentService;
```

## 📝 Example Usage in React Components

### Login Component Example

```javascript
import { useState } from 'react';
import authService from '@/services/authService';
import { useAuth } from '@/hooks/useAuth';

export default function LoginForm() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { user, token } = await authService.login(username, password);
      
      // Update auth context
      login(user, token);
      
      // Check if first login
      if (user.firstLogin) {
        // Redirect to password reset page
        router.push('/auth/first-login-reset');
      } else {
        // Redirect to dashboard
        router.push('/app/dashboard');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* Form fields */}
    </form>
  );
}
```

### Fetch Student Data Example

```javascript
import { useEffect, useState } from 'react';
import studentService from '@/services/studentService';

export default function StudentDashboard() {
  const [profile, setProfile] = useState(null);
  const [fees, setFees] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [profileData, feesData] = await Promise.all([
          studentService.getProfile(),
          studentService.getFees(),
        ]);
        
        setProfile(profileData);
        setFees(feesData);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      {/* Render profile and fees */}
    </div>
  );
}
```

## 🔧 Update AuthContext

Update your `admin/vite/src/contexts/AuthContext.jsx` to use the API:

```javascript
import { createContext, useState, useEffect } from 'react';
import authService from '@/services/authService';

export const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = localStorage.getItem('hostelhaven_token');
        if (token) {
          const userData = await authService.getMe();
          setUser(userData);
          setIsAuthenticated(true);
        }
      } catch (error) {
        // Token invalid or expired
        localStorage.removeItem('hostelhaven_token');
        localStorage.removeItem('hostelhaven_refresh_token');
        localStorage.removeItem('hostelhaven_user');
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  const login = async (userData, token) => {
    setUser(userData);
    setIsAuthenticated(true);
    localStorage.setItem('hostelhaven_token', token);
    localStorage.setItem('hostelhaven_user', JSON.stringify(userData));
  };

  const logout = async () => {
    await authService.logout();
    setUser(null);
    setIsAuthenticated(false);
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
```

## 🎯 Next Steps

1. Install axios in frontend: `npm install axios`
2. Update `.env` files with API URL
3. Replace mock data with real API calls
4. Handle error responses appropriately
5. Add loading states for better UX

## ⚠️ Important Notes

- Always include `Authorization: Bearer <token>` header for protected routes
- Handle token expiration and refresh automatically
- Implement proper error handling
- Show loading states during API calls
- Validate responses before using data

