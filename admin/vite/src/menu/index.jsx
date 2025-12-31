// @project
import manage from './manage';
import adminOther, { parentOther, studentOther, staffOther } from './other';
import staff from './staff';
import student from './student';
import parent from './parent';

/***************************  MENU ITEMS  ***************************/

/**
 * Get menu items based on user role
 * @param {string} role - User role (admin, staff, student, parent)
 * @returns {object} Menu items object
 */
export function getMenuItemsByRole(role) {
  const roleLower = (role || 'student').toLowerCase();
  
  switch (roleLower) {
    case 'admin':
      return {
        items: [manage, adminOther]
      };
    case 'staff':
      return {
        items: [staff, staffOther]
      };
    case 'student':
      return {
        items: [student, studentOther]
      };
    case 'parent':
      return {
        items: [parent, parentOther]
      };
    default:
      return {
        items: [student, studentOther]
      };
  }
}

// Default menu items (for backward compatibility)
const menuItems = {
  items: [manage, adminOther]
};

export default menuItems;
