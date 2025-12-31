/**
 * Generate unique ID based on type and role
 * @param {string} type - Type of ID (student, staff, parent)
 * @returns {string} Generated ID
 */
export const generateId = (type) => {
  const prefix = type.toUpperCase().substring(0, 3);
  const year = new Date().getFullYear();
  const random = Math.floor(1000 + Math.random() * 9000); // 4-digit random number
  return `${prefix}-${year}-${random}`;
};

