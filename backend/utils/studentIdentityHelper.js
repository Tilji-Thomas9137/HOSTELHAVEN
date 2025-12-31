import Student from '../models/Student.model.js';
import Room from '../models/Room.model.js';

/**
 * Get student identity metadata
 * Returns: {name, admissionNumber, registerNumber, course, year, department, hostelName, roomNumber, phone, email}
 * @param {Object} student - Student document
 * @returns {Object} Student identity metadata
 */
export const getStudentIdentity = async (student) => {
  try {
    let roomNumber = null;
    let hostelName = null;
    let block = null;
    
    if (student.room) {
      // If room is populated, use it directly
      if (typeof student.room === 'object' && student.room.roomNumber) {
        roomNumber = student.room.roomNumber;
        block = student.room.block || student.room.building;
        hostelName = block || 'Hostel';
      } else {
        // If room is just an ID, populate it
        const room = await Room.findById(student.room).select('roomNumber block building');
        if (room) {
          roomNumber = room.roomNumber;
          block = room.block || room.building;
          hostelName = block || 'Hostel';
        }
      }
    }

    // Extract department from course if available (e.g., "Computer Science" from "B.Tech Computer Science")
    let department = null;
    if (student.course) {
      // Try to extract department from course name
      const courseParts = student.course.split(' ');
      if (courseParts.length > 1) {
        department = courseParts.slice(1).join(' '); // Everything after the degree type
      } else {
        department = student.course;
      }
    }

    return {
      name: student.name || null,
      admissionNumber: student.studentId || null,
      registerNumber: student.studentId || null, // Register number is same as admission number
      course: student.course || null,
      year: student.year || null, // Course year (1st Year, 2nd Year, etc.)
      department: department,
      hostelName: hostelName,
      roomNumber: roomNumber,
      phone: student.phone || null,
      email: student.email || null,
    };
  } catch (error) {
    console.error('Error getting student identity:', error);
    return {
      name: student.name || null,
      admissionNumber: student.studentId || null,
      registerNumber: student.studentId || null,
      course: student.course || null,
      year: student.year || null,
      department: null,
      hostelName: null,
      roomNumber: null,
      phone: student.phone || null,
      email: student.email || null,
    };
  }
};

/**
 * Attach student identity to a document
 * @param {Object} document - Document to attach identity to
 * @param {Object} student - Student document
 * @returns {Object} Document with studentIdentity attached
 */
export const attachStudentIdentity = async (document, student) => {
  const identity = await getStudentIdentity(student);
  document.studentIdentity = identity;
  return document;
};

