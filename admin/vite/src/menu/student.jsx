/***************************  MENU ITEMS - STUDENT  ***************************/

const student = {
  id: 'group-student',
  title: 'My Hostel',
  icon: 'IconHome',
  type: 'group',
  children: [
    {
      id: 'dashboard',
      title: 'Dashboard',
      type: 'item',
      url: '/app/student/dashboard',
      icon: 'IconLayoutGrid'
    },
    {
      id: 'my-room',
      title: 'My Room',
      type: 'item',
      url: '/app/student/my-room',
      icon: 'IconDoor'
    },
    {
      id: 'payments',
      title: 'Payments',
      type: 'item',
      url: '/app/student/payments',
      icon: 'IconCurrencyDollar'
    },
    {
      id: 'maintenance',
      title: 'Maintenance / Complaints',
      type: 'item',
      url: '/app/student/complaints',
      icon: 'IconTool'
    },
    {
      id: 'inventory',
      title: 'Inventory Requests',
      type: 'item',
      url: '/app/student/inventory',
      icon: 'IconPackage'
    },
    {
      id: 'cleaning',
      title: 'Cleaning',
      type: 'item',
      url: '/app/student/cleaning',
      icon: 'IconBrush'
    },
    {
      id: 'activities',
      title: 'Activities',
      type: 'item',
      url: '/app/student/activities',
      icon: 'IconActivity'
    },
    {
      id: 'attendance',
      title: 'Attendance',
      type: 'item',
      url: '/app/student/attendance',
      icon: 'IconCalendarCheck'
    },
    {
      id: 'mess-meal',
      title: 'Mess & Meal Plan',
      type: 'item',
      url: '/app/student/mess-meal',
      icon: 'IconSoup'
    },
    {
      id: 'outpass',
      title: 'Outpass / Outing',
      type: 'item',
      url: '/app/student/outpass',
      icon: 'IconArrowRight'
    },
    {
      id: 'visitors',
      title: 'Visitors',
      type: 'item',
      url: '/app/student/visitors',
      icon: 'IconUserSearch'
    }
  ]
};

export default student;

