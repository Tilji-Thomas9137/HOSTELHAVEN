/***************************  MENU ITEMS - REPORTS & SETTINGS  ***************************/

const adminOther = {
  id: 'group-other',
  title: 'Reports & Settings',
  icon: 'IconSettings',
  type: 'group',
  children: [
    {
      id: 'reports',
      title: 'Reports',
      type: 'item',
      url: '/app/reports',
      icon: 'IconChartBar'
    },
    {
      id: 'settings',
      title: 'Settings',
      type: 'collapse',
      icon: 'IconSettings',
      children: [
        {
          id: 'change-password',
          title: 'Change Password',
          type: 'item',
          url: '/app/student/settings?tab=password',
          icon: 'IconLock'
        },
        {
          id: 'system-preferences',
          title: 'System Preferences',
          type: 'item',
          url: '/app/student/settings',
          icon: 'IconSettings'
        }
      ]
    }
  ]
};

const studentOther = {
  id: 'group-other',
  title: 'Reports & Settings',
  icon: 'IconSettings',
  type: 'group',
  children: [
    {
      id: 'reports',
      title: 'Reports',
      type: 'item',
      url: '/app/student/reports',
      icon: 'IconChartBar'
    },
    {
      id: 'settings',
      title: 'Settings',
      type: 'collapse',
      icon: 'IconSettings',
      children: [
        {
          id: 'profile',
          title: 'Profile',
          type: 'item',
          url: '/app/student/settings?tab=profile',
          icon: 'IconUser'
        },
        {
          id: 'change-password',
          title: 'Change Password',
          type: 'item',
          url: '/app/student/settings?tab=password',
          icon: 'IconLock'
        },
        {
          id: 'notification-preferences',
          title: 'Notification Preferences',
          type: 'item',
          url: '/app/student/settings?tab=notifications',
          icon: 'IconBell'
        },
        {
          id: 'system-preferences',
          title: 'System Preferences',
          type: 'item',
          url: '/app/student/settings',
          icon: 'IconSettings'
        }
      ]
    }
  ]
};

// Parent-specific Reports & Settings menu
const parentOther = {
  id: 'group-other',
  title: 'Reports & Settings',
  icon: 'IconSettings',
  type: 'group',
  children: [
    {
      id: 'reports',
      title: 'Reports',
      type: 'item',
      url: '/app/parent/reports',
      icon: 'IconChartBar'
    },
    {
      id: 'settings',
      title: 'Settings',
      type: 'collapse',
      icon: 'IconSettings',
      children: [
        {
          id: 'change-password',
          title: 'Change Password',
          type: 'item',
          url: '/app/parent/settings?tab=password',
          icon: 'IconLock'
        },
        {
          id: 'notification-preferences',
          title: 'Notification Preferences',
          type: 'item',
          url: '/app/parent/settings?tab=notifications',
          icon: 'IconBell'
        },
        {
          id: 'system-preferences',
          title: 'System Preferences',
          type: 'item',
          url: '/app/parent/settings',
          icon: 'IconSettings'
        }
      ]
    }
  ]
};

// Staff-specific Reports & Settings menu
const staffOther = {
  id: 'group-other',
  title: 'Reports & Settings',
  icon: 'IconSettings',
  type: 'group',
  children: [
    {
      id: 'reports',
      title: 'Reports',
      type: 'item',
      url: '/app/staff/reports',
      icon: 'IconChartBar'
    },
    {
      id: 'settings',
      title: 'Settings',
      type: 'collapse',
      icon: 'IconSettings',
      children: [
        {
          id: 'profile',
          title: 'Profile',
          type: 'item',
          url: '/app/staff/settings?tab=profile',
          icon: 'IconUser'
        },
        {
          id: 'change-password',
          title: 'Change Password',
          type: 'item',
          url: '/app/staff/settings?tab=password',
          icon: 'IconLock'
        },
        {
          id: 'notification-preferences',
          title: 'Notification Preferences',
          type: 'item',
          url: '/app/staff/settings?tab=notifications',
          icon: 'IconBell'
        }
      ]
    }
  ]
};

export default adminOther;
export { parentOther, studentOther, staffOther };
