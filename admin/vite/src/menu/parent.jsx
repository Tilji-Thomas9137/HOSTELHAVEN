/***************************  MENU ITEMS - PARENT  ***************************/

const parent = {
  id: 'group-parent',
  title: 'Parent Portal',
  icon: 'IconUsers',
  type: 'group',
  children: [
    {
      id: 'dashboard',
      title: 'Dashboard',
      type: 'item',
      url: '/app/parent/dashboard',
      icon: 'IconLayoutGrid'
    },
    {
      id: 'children',
      title: 'My Children',
      type: 'item',
      url: '/app/parent/children',
      icon: 'IconUsers'
    },
    {
      id: 'payments',
      title: 'Payments',
      type: 'item',
      url: '/app/parent/payments',
      icon: 'IconCurrencyDollar'
    },
    {
      id: 'attendance',
      title: 'Attendance',
      type: 'item',
      url: '/app/parent/attendance',
      icon: 'IconCalendarCheck'
    },
    {
      id: 'complaints',
      title: 'Complaints',
      type: 'item',
      url: '/app/parent/complaints',
      icon: 'IconTool'
    },
    {
      id: 'notifications',
      title: 'Notifications',
      type: 'item',
      url: '/app/parent/notifications',
      icon: 'IconBell'
    },
    {
      id: 'exit-return-logs',
      title: 'Exit/Return Logs',
      type: 'item',
      url: '/app/parent/exit-return-logs',
      icon: 'IconArrowRight'
    },
    {
      id: 'visitor-logs',
      title: 'Visitor Logs',
      type: 'item',
      url: '/app/parent/visitor-logs',
      icon: 'IconUserSearch'
    }
  ]
};

export default parent;

