/***************************  MENU ITEMS - ADMIN MANAGEMENT  ***************************/

const manage = {
  id: 'group-manage',
  title: 'Hostel Management',
  icon: 'IconBuilding',
  type: 'group',
  children: [
    {
      id: 'dashboard',
      title: 'Dashboard',
      type: 'item',
      url: '/app/dashboard',
      icon: 'IconLayoutGrid'
    },
    {
      id: 'students',
      title: 'Students',
      type: 'collapse',
      icon: 'IconUsers',
      children: [
        {
          id: 'view-students',
          title: 'View All Students',
          type: 'item',
          url: '/app/students',
          icon: 'IconUsers'
        },
        {
          id: 'add-student',
          title: 'Add Student',
          type: 'item',
          url: '/app/students/add',
          icon: 'IconUserPlus'
        },
        {
          id: 'room-allocation',
          title: 'Room Allocation',
          type: 'item',
          url: '/app/students/room-allocation',
          icon: 'IconDoor'
        },
        {
          id: 'deallocate-room',
          title: 'Deallocate Room',
          type: 'item',
          url: '/app/students/deallocate-room',
          icon: 'IconDoorOff'
        },
        {
          id: 'student-attendance',
          title: 'Student Attendance',
          type: 'item',
          url: '/app/students/attendance',
          icon: 'IconCalendarCheck'
        },
        {
          id: 'student-complaints',
          title: 'Student Complaints',
          type: 'item',
          url: '/app/students/complaints',
          icon: 'IconAlertCircle'
        },
        {
          id: 'student-outings',
          title: 'Student Outing Requests',
          type: 'item',
          url: '/app/students/outings',
          icon: 'IconArrowRight'
        }
      ]
    },
    {
      id: 'rooms',
      title: 'Rooms',
      type: 'collapse',
      icon: 'IconDoor',
      children: [
        {
          id: 'room-list',
          title: 'Room List',
          type: 'item',
          url: '/app/rooms',
          icon: 'IconList'
        },
        {
          id: 'room-allocation-status',
          title: 'Room Allocation Status',
          type: 'item',
          url: '/app/rooms/allocation-status',
          icon: 'IconChartBar'
        },
        {
          id: 'vacant-occupied',
          title: 'Vacant / Occupied Rooms',
          type: 'item',
          url: '/app/rooms/vacant-occupied',
          icon: 'IconBed'
        },
        {
          id: 'room-transfer-requests',
          title: 'Room Transfer Requests',
          type: 'item',
          url: '/app/rooms/transfer-requests',
          icon: 'IconArrowRightCircle'
        },
        {
          id: 'roommate-matching',
          title: 'Roommate Matching Pool',
          type: 'item',
          url: '/app/rooms/matching-pool',
          icon: 'IconUsersGroup'
        }
      ]
    },
    {
      id: 'staff',
      title: 'Staff',
      type: 'collapse',
      icon: 'IconUsersGroup',
      children: [
        {
          id: 'view-staff',
          title: 'View All Staff',
          type: 'item',
          url: '/app/staff',
          icon: 'IconUsers'
        },
        {
          id: 'add-staff',
          title: 'Add Staff',
          type: 'item',
          url: '/app/staff/add',
          icon: 'IconUserPlus'
        },
        {
          id: 'staff-duty-management',
          title: 'Staff Duty Management',
          type: 'item',
          url: '/app/staff/duty-management',
          icon: 'IconCalendarTime'
        },
        {
          id: 'complaint-assignment',
          title: 'Complaint Assignment',
          type: 'item',
          url: '/app/staff/complaint-assignment',
          icon: 'IconUserCheck'
        }
      ]
    },
    {
      id: 'payments',
      title: 'Payments',
      type: 'collapse',
      icon: 'IconCurrencyDollar',
      children: [
        {
          id: 'fee-generation',
          title: 'Fee Generation',
          type: 'item',
          url: '/app/payments/fee-generation',
          icon: 'IconFileInvoice'
        },
        {
          id: 'fee-collection-status',
          title: 'Fee Collection Status',
          type: 'item',
          url: '/app/payments',
          icon: 'IconChartBar'
        },
        {
          id: 'pending-payments',
          title: 'Pending Payments',
          type: 'item',
          url: '/app/payments/pending',
          icon: 'IconClockHour4'
        }
      ]
    },
    {
      id: 'inventory',
      title: 'Inventory',
      type: 'collapse',
      icon: 'IconBox',
      children: [
        {
          id: 'add-inventory',
          title: 'Add Inventory',
          type: 'item',
          url: '/app/inventory/add',
          icon: 'IconPlus'
        },
        {
          id: 'update-stock',
          title: 'Update Stock',
          type: 'item',
          url: '/app/inventory',
          icon: 'IconEdit'
        },
        {
          id: 'inventory-logs',
          title: 'View Inventory Logs',
          type: 'item',
          url: '/app/inventory/logs',
          icon: 'IconHistory'
        }
      ]
    },
    {
      id: 'cleaning-requests',
      title: 'Cleaning Requests',
      type: 'item',
      url: '/app/cleaning-requests',
      icon: 'IconBrush'
    },
    {
      id: 'visitors',
      title: 'Visitors',
      type: 'collapse',
      icon: 'IconUserSearch',
      children: [
        {
          id: 'visitor-logs',
          title: 'Visitor Logs',
          type: 'item',
          url: '/app/visitors',
          icon: 'IconList'
        },
        {
          id: 'todays-visitors',
          title: "Today's Visitors",
          type: 'item',
          url: '/app/visitors/today',
          icon: 'IconCalendarToday'
        }
      ]
    },
    {
      id: 'outings',
      title: 'Outings',
      type: 'collapse',
      icon: 'IconArrowRight',
      children: [
        {
          id: 'approve-outing-requests',
          title: 'Approve Outing Requests',
          type: 'item',
          url: '/app/outings/approve',
          icon: 'IconCheck'
        },
        {
          id: 'outing-history',
          title: 'Outing History',
          type: 'item',
          url: '/app/outings',
          icon: 'IconHistory'
        }
      ]
    },
    {
      id: 'meal-planner',
      title: 'Meal Planner',
      type: 'item',
      url: '/app/meal-planner',
      icon: 'IconToolsKitchen'
    },
    {
      id: 'activities',
      title: 'Activities',
      type: 'item',
      url: '/app/activities',
      icon: 'IconActivity'
    }
  ]
};

export default manage;
