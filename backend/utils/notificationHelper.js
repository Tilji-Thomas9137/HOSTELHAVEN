import Notification from '../models/Notification.model.js';

/**
 * Create a notification and optionally broadcast a copy to staff members.
 *
 * @param {object} data - Notification payload (title, message, type, recipient/recipientRole, etc.)
 * @param {object} options
 * @param {boolean} options.notifyStaff - When true, a copy is also sent to all staff.
 * @param {'admin'|'staff'|'student'|'system'} [options.origin='system'] - Source of the notification.
 * @param {object} [options.studentDetails] - Student details to attach to notification (name, studentId, course, etc.)
 * @returns {Promise<object>} The created notification document.
 */
export async function createNotification(data, options = {}) {
  const origin = options.origin || data.origin || 'system';
  
  // Include student details if provided
  const notificationData = {
    ...data,
    origin
  };
  
  if (options.studentDetails) {
    notificationData.studentDetails = options.studentDetails;
  }

  const notification = await Notification.create(notificationData);

  if (options.notifyStaff && data.recipientRole !== 'staff' && data.recipientRole !== 'all') {
    await Notification.create({
      ...notificationData,
      recipient: undefined,
      recipientRole: 'staff',
    });
  }

  return notification;
}


