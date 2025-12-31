import { lazy } from 'react';
import { Navigate, Link } from 'react-router-dom';

// @project
import Loadable from '@/components/Loadable';
import AdminLayout from '@/layouts/AdminLayout';
import Error404Page from '@/components/Error404';
import ProtectedRoute from '@/components/ProtectedRoute';

// Dashboard
const AnalyticsPage = Loadable(lazy(() => import('@/views/admin/dashboard')));

// Students Pages
const StudentsPage = Loadable(lazy(() => import('@/views/admin/students')));
const AddStudentPage = Loadable(lazy(() => import('@/views/admin/students/AddStudent')));
const ViewStudentPage = Loadable(lazy(() => import('@/views/admin/students/ViewStudent')));
const RoomAllocationPage = Loadable(lazy(() => import('@/views/admin/students/RoomAllocation')));
const DeallocateRoomPage = Loadable(lazy(() => import('@/views/admin/students/DeallocateRoom')));
const StudentAttendancePage = Loadable(lazy(() => import('@/views/admin/students/StudentAttendance')));
const StudentComplaintsPage = Loadable(lazy(() => import('@/views/admin/students/StudentComplaints')));
const StudentOutingsPage = Loadable(lazy(() => import('@/views/admin/students/StudentOutings')));

// Rooms Pages
const RoomsPage = Loadable(lazy(() => import('@/views/admin/rooms')));
const AllocationStatusPage = Loadable(lazy(() => import('@/views/admin/rooms/AllocationStatus')));
const VacantOccupiedPage = Loadable(lazy(() => import('@/views/admin/rooms/VacantOccupied')));
const TransferRequestsPage = Loadable(lazy(() => import('@/views/admin/rooms/TransferRequests')));
const MatchingPoolPage = Loadable(lazy(() => import('@/views/admin/rooms/MatchingPool')));

// Staff Pages
const StaffPage = Loadable(lazy(() => import('@/views/admin/staff')));
const AddStaffPage = Loadable(lazy(() => import('@/views/admin/staff/AddStaff')));
const DutyManagementPage = Loadable(lazy(() => import('@/views/admin/staff/DutyManagement')));
const ComplaintAssignmentPage = Loadable(lazy(() => import('@/views/admin/staff/ComplaintAssignment')));

// Payments Pages
const PaymentsPage = Loadable(lazy(() => import('@/views/admin/payments')));
const FeeGenerationPage = Loadable(lazy(() => import('@/views/admin/payments/FeeGeneration')));
const PendingPaymentsPage = Loadable(lazy(() => import('@/views/admin/payments/PendingPayments')));

// Inventory Pages
const InventoryPage = Loadable(lazy(() => import('@/views/admin/inventory')));
const AddInventoryPage = Loadable(lazy(() => import('@/views/admin/inventory/AddInventory')));
const InventoryLogsPage = Loadable(lazy(() => import('@/views/admin/inventory/InventoryLogs')));

// Cleaning Pages
const CleaningRequestsPage = Loadable(lazy(() => import('@/views/admin/cleaning/CleaningRequests')));

// Visitors Pages
const VisitorsPage = Loadable(lazy(() => import('@/views/admin/visitors')));
const TodayVisitorsPage = Loadable(lazy(() => import('@/views/admin/visitors/TodayVisitors')));

// Outings Pages
const OutingsPage = Loadable(lazy(() => import('@/views/admin/outings')));
const ApproveOutingsPage = Loadable(lazy(() => import('@/views/admin/outings/ApproveOutings')));

// Room Change Requests Pages
const RoomChangeRequestsPage = Loadable(lazy(() => import('@/views/admin/roomChangeRequests')));

// Meal Planner Pages
const AdminMealPlannerPage = Loadable(lazy(() => import('@/views/admin/MealPlanner')));

// Activities Pages
const AdminActivitiesPage = Loadable(lazy(() => import('@/views/admin/activities')));

// Reports Pages
const ReportsPage = Loadable(lazy(() => import('@/views/admin/reports')));
const AttendanceReportsPage = Loadable(lazy(() => import('@/views/admin/reports/AttendanceReports')));
const FeeReportsPage = Loadable(lazy(() => import('@/views/admin/reports/FeeReports')));
const RoomReportsPage = Loadable(lazy(() => import('@/views/admin/reports/RoomReports')));
const InventoryReportsPage = Loadable(lazy(() => import('@/views/admin/reports/InventoryReports')));
const VisitorReportsPage = Loadable(lazy(() => import('@/views/admin/reports/VisitorReports')));

// Settings Pages
const SettingsPage = Loadable(lazy(() => import('@/views/admin/settings')));
const AdminProfilePage = Loadable(lazy(() => import('@/views/admin/settings/Profile')));
const ChangePasswordPage = Loadable(lazy(() => import('@/views/admin/settings/Password')));

// Student Pages (Student Portal)
const StudentPortalDashboardPage = Loadable(lazy(() => import('@/views/admin/StudentDashboard')));
const StudentPortalMyRoomPage = Loadable(lazy(() => import('@/views/student/MyRoom')));
const StudentPortalRoomChangeRequestPage = Loadable(lazy(() => import('@/views/student/RoomChangeRequest')));
const StudentPortalPaymentsPage = Loadable(lazy(() => import('@/views/student/Payments')));
const StudentPortalComplaintsPage = Loadable(lazy(() => import('@/views/student/Complaints')));
const StudentPortalCleaningPage = Loadable(lazy(() => import('@/views/student/Cleaning')));
const StudentPortalActivitiesPage = Loadable(lazy(() => import('@/views/student/Activities')));
const StudentPortalAttendancePage = Loadable(lazy(() => import('@/views/student/Attendance')));
const StudentPortalMessMealPage = Loadable(lazy(() => import('@/views/student/MessMeal')));
const StudentPortalOutpassPage = Loadable(lazy(() => import('@/views/student/Outpass')));
const StudentPortalVisitorsPage = Loadable(lazy(() => import('@/views/student/Visitors')));
const StudentPortalInventoryPage = Loadable(lazy(() => import('@/views/student/Inventory')));
const StudentPortalReportsPage = Loadable(lazy(() => import('@/views/student/Reports')));
const StudentPortalSettingsPage = Loadable(lazy(() => import('@/views/student/Settings')));

// Parent Pages (Parent Portal)
const ParentDashboardPage = Loadable(lazy(() => import('@/views/parent/Dashboard')));
const ParentMyChildrenPage = Loadable(lazy(() => import('@/views/parent/MyChildren')));
const ParentPaymentsPage = Loadable(lazy(() => import('@/views/parent/Payments')));
const ParentAttendancePage = Loadable(lazy(() => import('@/views/parent/Attendance')));
const ParentComplaintsPage = Loadable(lazy(() => import('@/views/parent/Complaints')));
const ParentNotificationsPage = Loadable(lazy(() => import('@/views/parent/Notifications')));
const ParentExitReturnLogsPage = Loadable(lazy(() => import('@/views/parent/ExitReturnLogs')));
const ParentVisitorLogsPage = Loadable(lazy(() => import('@/views/parent/VisitorLogs')));
const ParentReportsPage = Loadable(lazy(() => import('@/views/parent/Reports')));
const ParentSettingsPage = Loadable(lazy(() => import('@/views/parent/Settings')));

// Staff Portal Pages
const StaffPortalDashboardPage = Loadable(lazy(() => import('@/views/staff/Dashboard')));
const StaffPortalSchedulesPage = Loadable(lazy(() => import('@/views/staff/Schedules')));
const StaffPortalComplaintsPage = Loadable(lazy(() => import('@/views/staff/Complaints')));
const StaffPortalInventoryPage = Loadable(lazy(() => import('@/views/staff/Inventory')));
const StaffPortalInventoryRequestsPage = Loadable(lazy(() => import('@/views/staff/InventoryRequests')));
const StaffPortalCleaningRequestsPage = Loadable(lazy(() => import('@/views/staff/CleaningRequests')));
const StaffPortalRegisterLogPage = Loadable(lazy(() => import('@/views/staff/RegisterLog')));
const StaffPortalMealPlannerPage = Loadable(lazy(() => import('@/views/staff/MealPlanner')));
const StaffPortalNotificationsPage = Loadable(lazy(() => import('@/views/staff/Notifications')));
const StaffPortalReportsPage = Loadable(lazy(() => import('@/views/staff/Reports')));
const StaffPortalSettingsPage = Loadable(lazy(() => import('@/views/staff/Settings')));

// Legacy Pages (kept for backward compatibility)
const BookingsPage = Loadable(lazy(() => import('@/views/admin/bookings')));

const MainRoutes = {
  path: '/app',
  element: (
    <ProtectedRoute>
      <AdminLayout />
    </ProtectedRoute>
  ),
  errorElement: <Error404Page heading="404 - Page Not Found" primaryBtn={{ component: Link, to: '/app/dashboard', children: 'Go to Dashboard' }} />,
  children: [
    { index: true, element: <Navigate to="/app/dashboard" replace /> },

    // Dashboard
    { path: 'dashboard', element: <AnalyticsPage /> },

    // Student Portal Routes (must come before 'students' to avoid route conflicts)
    { path: 'student/dashboard', element: <StudentPortalDashboardPage /> },
    { path: 'student/my-room', element: <StudentPortalMyRoomPage /> },
    { path: 'student/room-change-request', element: <StudentPortalRoomChangeRequestPage /> },
    { path: 'student/payments', element: <StudentPortalPaymentsPage /> },
    { path: 'student/complaints', element: <StudentPortalComplaintsPage /> },
    { path: 'student/cleaning', element: <StudentPortalCleaningPage /> },
    { path: 'student/activities', element: <StudentPortalActivitiesPage /> },
    { path: 'student/attendance', element: <StudentPortalAttendancePage /> },
    { path: 'student/mess-meal', element: <StudentPortalMessMealPage /> },
    { path: 'student/outpass', element: <StudentPortalOutpassPage /> },
    { path: 'student/visitors', element: <StudentPortalVisitorsPage /> },
    { path: 'student/inventory', element: <StudentPortalInventoryPage /> },
    { path: 'student/reports', element: <StudentPortalReportsPage /> },
    { path: 'student/settings', element: <StudentPortalSettingsPage /> },

    // Parent Portal Routes (must come before admin routes to avoid conflicts)
    { path: 'parent/dashboard', element: <ParentDashboardPage /> },
    { path: 'parent/children', element: <ParentMyChildrenPage /> },
    { path: 'parent/payments', element: <ParentPaymentsPage /> },
    { path: 'parent/attendance', element: <ParentAttendancePage /> },
    { path: 'parent/complaints', element: <ParentComplaintsPage /> },
    { path: 'parent/notifications', element: <ParentNotificationsPage /> },
    { path: 'parent/exit-return-logs', element: <ParentExitReturnLogsPage /> },
    { path: 'parent/visitor-logs', element: <ParentVisitorLogsPage /> },
    { path: 'parent/reports', element: <ParentReportsPage /> },
    { path: 'parent/settings', element: <ParentSettingsPage /> },

    // Staff Portal Routes
    { path: 'staff/dashboard', element: <StaffPortalDashboardPage /> },
    { path: 'staff/schedules', element: <StaffPortalSchedulesPage /> },
    { path: 'staff/complaints', element: <StaffPortalComplaintsPage /> },
    { path: 'staff/inventory', element: <StaffPortalInventoryPage /> },
    { path: 'staff/inventory-requests', element: <StaffPortalInventoryRequestsPage /> },
    { path: 'staff/cleaning-requests', element: <StaffPortalCleaningRequestsPage /> },
    { path: 'staff/register-log', element: <StaffPortalRegisterLogPage /> },
    { path: 'staff/meal-planner', element: <StaffPortalMealPlannerPage /> },
    { path: 'staff/notifications', element: <StaffPortalNotificationsPage /> },
    { path: 'staff/reports', element: <StaffPortalReportsPage /> },
    { path: 'staff/settings', element: <StaffPortalSettingsPage /> },

    // Students Routes (Admin)
    { path: 'students', element: <StudentsPage /> },
    { path: 'students/add', element: <AddStudentPage /> },
    { path: 'students/:studentId', element: <ViewStudentPage /> },
    { path: 'students/:studentId/edit', element: <AddStudentPage /> },
    { path: 'students/room-allocation', element: <RoomAllocationPage /> },
    { path: 'students/deallocate-room', element: <DeallocateRoomPage /> },
    { path: 'students/attendance', element: <StudentAttendancePage /> },
    { path: 'students/complaints', element: <StudentComplaintsPage /> },
    { path: 'students/outings', element: <StudentOutingsPage /> },

    // Rooms Routes
    { path: 'rooms', element: <RoomsPage /> },
    { path: 'rooms/allocation-status', element: <AllocationStatusPage /> },
    { path: 'rooms/vacant-occupied', element: <VacantOccupiedPage /> },
    { path: 'rooms/transfer-requests', element: <TransferRequestsPage /> },
    { path: 'rooms/matching-pool', element: <MatchingPoolPage /> },

    // Staff Routes
    { path: 'staff', element: <StaffPage /> },
    { path: 'staff/add', element: <AddStaffPage /> },
    { path: 'staff/duty-management', element: <DutyManagementPage /> },
    { path: 'staff/complaint-assignment', element: <ComplaintAssignmentPage /> },

    // Payments Routes
    { path: 'payments', element: <PaymentsPage /> },
    { path: 'payments/fee-generation', element: <FeeGenerationPage /> },
    { path: 'payments/pending', element: <PendingPaymentsPage /> },

    // Meal Planner Routes
    { path: 'meal-planner', element: <AdminMealPlannerPage /> },

    // Activities Routes
    { path: 'activities', element: <AdminActivitiesPage /> },

    // Inventory Routes
    { path: 'inventory', element: <InventoryPage /> },
    { path: 'inventory/add', element: <AddInventoryPage /> },
    { path: 'inventory/logs', element: <InventoryLogsPage /> },

    // Cleaning Requests Routes
    { path: 'cleaning-requests', element: <CleaningRequestsPage /> },

    // Visitors Routes
    { path: 'visitors', element: <VisitorsPage /> },
    { path: 'visitors/today', element: <TodayVisitorsPage /> },

    // Outings Routes
    { path: 'outings', element: <OutingsPage /> },
    { path: 'outings/approve', element: <ApproveOutingsPage /> },

    // Room Change Requests Routes
    { path: 'room-change-requests', element: <RoomChangeRequestsPage /> },

    // Reports Routes
    { path: 'reports', element: <ReportsPage /> },
    { path: 'reports/attendance', element: <AttendanceReportsPage /> },
    { path: 'reports/fees', element: <FeeReportsPage /> },
    { path: 'reports/rooms', element: <RoomReportsPage /> },
    { path: 'reports/inventory', element: <InventoryReportsPage /> },
    { path: 'reports/visitors', element: <VisitorReportsPage /> },

    // Settings Routes
    { path: 'settings', element: <SettingsPage /> },
    { path: 'settings/profile', element: <AdminProfilePage /> },
    { path: 'settings/password', element: <ChangePasswordPage /> },
    { path: 'settings/notifications', element: <SettingsPage /> },

    // Legacy routes (for backward compatibility)
    { path: 'bookings', element: <BookingsPage /> },
    
    // Redirect old routes to dashboard
    { path: 'utils/*', element: <Navigate to="/app/dashboard" replace /> },
    { path: 'sample-page', element: <Navigate to="/app/dashboard" replace /> },
    
    // Catch-all 404
    { path: '*', element: <Error404Page heading="404 - Page Not Found" primaryBtn={{ component: Link, to: '/app/dashboard', children: 'Go to Dashboard' }} /> }
  ]
};

export default MainRoutes;
