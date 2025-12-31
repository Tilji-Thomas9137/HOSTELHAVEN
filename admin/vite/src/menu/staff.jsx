/***************************  MENU ITEMS - STAFF  ***************************/

const staff = {
  id: 'group-staff',
  title: 'Staff Workspace',
  icon: 'IconUsersGroup',
  type: 'group',
  children: [
    {
      id: 'staff-dashboard',
      title: 'Dashboard',
      type: 'item',
      url: '/app/staff/dashboard',
      icon: 'IconLayoutGrid'
    },
    {
      id: 'staff-schedules',
      title: 'Schedules',
      type: 'item',
      url: '/app/staff/schedules',
      icon: 'IconCalendarTime'
    },
    {
      id: 'staff-complaints',
      title: 'Complaints',
      type: 'item',
      url: '/app/staff/complaints',
      icon: 'IconAlertCircle'
    },
    {
      id: 'staff-cleaning-requests',
      title: 'Cleaning Requests',
      type: 'item',
      url: '/app/staff/cleaning-requests',
      icon: 'IconBrush'
    },
    {
      id: 'staff-inventory',
      title: 'Inventory',
      type: 'collapse',
      icon: 'IconBox',
      children: [
        {
          id: 'staff-inventory-items',
          title: 'View Inventory',
          type: 'item',
          url: '/app/staff/inventory',
          icon: 'IconBox'
        },
        {
          id: 'staff-inventory-requests',
          title: 'Student Requests',
          type: 'item',
          url: '/app/staff/inventory-requests',
          icon: 'IconPackage'
        }
      ]
    },
    {
      id: 'staff-register',
      title: 'Register Log',
      type: 'item',
      url: '/app/staff/register-log',
      icon: 'IconBook'
    },
    {
      id: 'staff-meal-planner',
      title: 'Meal Planner',
      type: 'item',
      url: '/app/staff/meal-planner',
      icon: 'IconToolsKitchen'
    },
    {
      id: 'staff-notifications',
      title: 'Notifications',
      type: 'item',
      url: '/app/staff/notifications',
      icon: 'IconBell'
    }
  ]
};

export default staff;

