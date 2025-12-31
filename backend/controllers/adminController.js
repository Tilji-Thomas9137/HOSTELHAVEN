import User from '../models/User.model.js';
import Student from '../models/Student.model.js';
import Parent from '../models/Parent.model.js';
import Staff from '../models/Staff.model.js';
import Room from '../models/Room.model.js';
import Fee from '../models/Fee.model.js';
import Attendance from '../models/Attendance.model.js';
import Complaint from '../models/Complaint.model.js';
import CleaningRequest from '../models/CleaningRequest.model.js';
import Inventory from '../models/Inventory.model.js';
import InventoryRequest from '../models/InventoryRequest.model.js';
import VisitorLog from '../models/VisitorLog.model.js';
import OutingRequest from '../models/OutingRequest.model.js';
import Notification from '../models/Notification.model.js';
import RoomChangeRequest from '../models/RoomChangeRequest.model.js';
import Wallet from '../models/Wallet.model.js';
import Payment from '../models/Payment.model.js';
import { generatePassword } from '../utils/generatePassword.js';
import { generateId } from '../utils/generateId.js';
import { sendLoginCredentials, sendNotificationEmail } from '../services/mailService.js';
import { createNotification } from '../utils/notificationHelper.js';
import { calculateRoomPrice } from '../utils/amenitiesPricing.js';
import { generateRoomQRCode } from '../utils/qrCodeGenerator.js';
import Activity from '../models/Activity.model.js';

let ParentModel; // lazy-loaded Parent model for child-related notifications

// ==================== STUDENTS ====================

export const createStudent = async (req, res) => {
  try {
    const { admissionNumber, name, email, phone, address, dateOfBirth, course, year, gender, emergencyContact, parentEmail, parentName } = req.body;

    // Validate admission number
    if (!admissionNumber) {
      return res.status(400).json({ message: 'Admission number is required' });
    }

    // Validate gender
    if (!gender || (gender !== 'Boys' && gender !== 'Girls')) {
      return res.status(400).json({ message: 'Gender is required and must be either "Boys" or "Girls"' });
    }

    // Normalize admission number
    const admissionNumberUpper = admissionNumber.trim().toUpperCase();
    const usernameLower = admissionNumberUpper.toLowerCase();
    
    console.log(`[CREATE STUDENT] Checking for admission number: ${admissionNumberUpper}, username: ${usernameLower}`);

    // Check if admission number already exists in Student collection
    const existingStudent = await Student.findOne({ studentId: admissionNumberUpper });
    if (existingStudent) {
      console.log(`[CREATE STUDENT] Student conflict found:`, {
        studentId: existingStudent._id,
        studentIdField: existingStudent.studentId,
        name: existingStudent.name,
        email: existingStudent.email
      });
      return res.status(400).json({ message: 'Admission number already exists' });
    }

    // Check if username already exists in User collection (with multiple query attempts to debug)
    console.log(`[CREATE STUDENT] Searching for user with username: "${usernameLower}"`);
    
    // Try exact match first
    let existingUser = await User.findOne({ username: usernameLower });
    
    // If not found, try case-insensitive search to see if there's a case mismatch
    if (!existingUser) {
      const caseInsensitiveUser = await User.findOne({ 
        username: { $regex: new RegExp(`^${usernameLower}$`, 'i') } 
      });
      if (caseInsensitiveUser) {
        console.log(`[CREATE STUDENT] Found user with case mismatch:`, {
          foundUsername: caseInsensitiveUser.username,
          searchedUsername: usernameLower
        });
        existingUser = caseInsensitiveUser;
      }
    }
    
    // Also check if there are any users with similar usernames (for debugging)
    const similarUsers = await User.find({ 
      username: { $regex: usernameLower.replace(/[^a-z0-9]/g, ''), $options: 'i' } 
    }).limit(5);
    if (similarUsers.length > 0) {
      console.log(`[CREATE STUDENT] Found ${similarUsers.length} similar usernames:`, 
        similarUsers.map(u => ({ id: u._id, username: u.username, role: u.role }))
      );
    }
    
    if (existingUser) {
      console.log(`[CREATE STUDENT] User conflict found:`, {
        userId: existingUser._id,
        username: existingUser.username,
        email: existingUser.email,
        role: existingUser.role,
        isActive: existingUser.isActive
      });
      
      // Check if this user is linked to a student (might be orphaned)
      const linkedStudent = await Student.findOne({ user: existingUser._id });
      if (linkedStudent) {
        console.log(`[CREATE STUDENT] User is linked to student:`, {
          studentId: linkedStudent._id,
          studentIdField: linkedStudent.studentId
        });
        return res.status(400).json({ 
          message: `Admission number is already in use. A student record exists with this admission number (Student ID: ${linkedStudent._id}). Please delete the student record first.` 
        });
      } else {
        // Orphaned user - provide more helpful message
        console.log(`[CREATE STUDENT] Orphaned user found - not linked to any student`);
        return res.status(400).json({ 
          message: `Admission number is already in use as username. A user account exists with this username (User ID: ${existingUser._id}, Role: ${existingUser.role}). Please delete this user account first if you want to reuse this admission number.` 
        });
      }
    }
    
    console.log(`[CREATE STUDENT] No conflicts found, proceeding with student creation`);

    // Use admission number as student ID and username
    const studentId = admissionNumberUpper;
    const username = admissionNumberUpper.toLowerCase(); // Username is lowercase version of admission number
    const tempPassword = generatePassword(10);
    
    // Create user for student
    const user = await User.create({
      name,
      username: username,
      email: email.toLowerCase(),
      password: tempPassword,
      role: 'student',
      phone,
      firstLogin: true,
    });

    // Create student
    const student = await Student.create({
      user: user._id,
      studentId,
      name,
      email: email.toLowerCase(),
      phone,
      address,
      dateOfBirth,
      course,
      year,
      gender,
      emergencyContact,
      status: 'active',
    });

    // Create wallet for new student with zero balance
    await Wallet.create({
      student: student._id,
      balance: 0,
      transactions: [],
    });

    let parentUser = null;
    let parentAccount = null;
    let emailStatus = {
      student: { sent: false, error: null },
      parent: { sent: false, error: null },
    };

    // Create or link parent if email provided
    if (parentEmail) {
      // Check if parent with this email already exists
      parentAccount = await Parent.findOne({ email: parentEmail.toLowerCase() }).populate('user');
      
      if (parentAccount) {
        // Link existing parent to student
        if (!parentAccount.students.includes(student._id)) {
          parentAccount.students.push(student._id);
          await parentAccount.save();
        }
        parentUser = parentAccount.user;
        
        // Send notification email to existing parent about new student link
        try {
          const emailResult = await sendLoginCredentials({
            to: parentEmail.toLowerCase(),
            name: parentAccount.name || parentUser.name,
            username: parentUser.username,
            password: '*** (Your existing password)', // Don't reveal existing password
            role: 'parent',
            isNewLink: true,
            studentName: name,
          });
          emailStatus.parent.sent = emailResult.success || true;
        } catch (emailError) {
          console.error('Error sending parent notification email:', emailError);
          emailStatus.parent.error = emailError.message;
          // Don't fail student creation if email fails
        }
      } else {
        // Create new parent account
        const parentUsername = `parent_${username}`; // parent_<admission_number>
        const parentTempPassword = generatePassword(10);

        // Check if parent username already exists
        const existingParentUser = await User.findOne({ username: parentUsername });
        if (existingParentUser) {
          return res.status(400).json({ message: 'Parent username already exists' });
        }

        // Require parent name - don't default to "Student's Parent"
        if (!parentName || parentName.trim() === '') {
          return res.status(400).json({ message: 'Parent name is required. Please provide the actual parent/guardian name.' });
        }
        const finalParentName = parentName.trim();

        // Create user for parent
        parentUser = await User.create({
          name: finalParentName,
          username: parentUsername,
          email: parentEmail.toLowerCase(),
          password: parentTempPassword,
          role: 'parent',
          firstLogin: true,
        });

        // Create parent
        parentAccount = await Parent.create({
          user: parentUser._id,
          name: finalParentName,
          email: parentEmail.toLowerCase(),
          phone: phone || '',
          students: [student._id],
          status: 'active',
        });

        // Send email with credentials to parent
        try {
          const emailResult = await sendLoginCredentials({
            to: parentEmail.toLowerCase(),
            name: finalParentName,
            username: parentUsername,
            password: parentTempPassword,
            role: 'parent',
            studentName: name,
          });
          emailStatus.parent.sent = emailResult.success || true;
          if (!emailResult.success) {
            emailStatus.parent.error = emailResult.error || 'Failed to send email';
            console.error(`[CREATE STUDENT] Parent email failed: ${emailResult.error}`);
          }
        } catch (emailError) {
          console.error('Error sending parent email:', emailError);
          emailStatus.parent.error = emailError.message || 'Failed to send email';
          // Don't fail student creation if email fails
        }
      }
    }

    // Send email with credentials to student
    try {
      const emailResult = await sendLoginCredentials({
        to: email.toLowerCase(),
        name,
        username: username,
        password: tempPassword,
        role: 'student',
      });
      emailStatus.student.sent = emailResult.success || true;
      if (!emailResult.success) {
        emailStatus.student.error = emailResult.error || 'Failed to send email';
        console.error(`[CREATE STUDENT] Student email failed: ${emailResult.error}`);
      }
    } catch (emailError) {
      console.error('Error sending student email:', emailError);
      emailStatus.student.error = emailError.message || 'Failed to send email';
      // Don't fail student creation if email fails
      // Log the error but continue with creation
    }

    res.status(201).json({
      message: 'Student created successfully',
      student: {
        ...student.toObject(),
        user: {
          username: user.username,
          email: user.email,
        },
      },
      parent: parentAccount ? {
        username: parentUser.username,
        email: parentAccount.email,
      } : null,
      emailStatus,
    });
  } catch (error) {
    console.error('Create student error:', error);
    res.status(500).json({ message: 'Error creating student', error: error.message });
  }
};

export const getAllStudents = async (req, res) => {
  try {
    const { status, search, page = 1, limit = 10 } = req.query;
    const query = {};

    if (status) query.status = status;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { studentId: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    const students = await Student.find(query)
      .populate('room', 'roomNumber floor building block roomType capacity currentOccupancy gender')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });

    const total = await Student.countDocuments(query);

    res.json({
      students,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total,
    });
  } catch (error) {
    console.error('Get students error:', error);
    res.status(500).json({ message: 'Error fetching students', error: error.message });
  }
};

export const getStudentById = async (req, res) => {
  try {
    const student = await Student.findById(req.params.id)
      .populate('room', 'roomNumber floor building capacity')
      .populate('user', 'username email phone');

    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    res.json(student);
  } catch (error) {
    console.error('Get student error:', error);
    res.status(500).json({ message: 'Error fetching student', error: error.message });
  }
};

export const getStudentByStudentId = async (req, res) => {
  try {
    const { studentId } = req.params;
    
    if (!studentId) {
      return res.status(400).json({ message: 'Student ID is required' });
    }

    // Normalize studentId (uppercase)
    const normalizedStudentId = studentId.trim().toUpperCase();

    const student = await Student.findOne({ studentId: normalizedStudentId })
      .populate('room', 'roomNumber floor building block roomType capacity currentOccupancy gender')
      .populate('user', 'username email phone');

    if (!student) {
      return res.status(404).json({ message: 'Student not found with this Student ID' });
    }

    res.json(student);
  } catch (error) {
    console.error('Get student by studentId error:', error);
    res.status(500).json({ message: 'Error fetching student', error: error.message });
  }
};

export const updateStudent = async (req, res) => {
  try {
    // Validate gender if provided
    if (req.body.gender !== undefined) {
      if (req.body.gender !== 'Boys' && req.body.gender !== 'Girls') {
        return res.status(400).json({ message: 'Gender must be either "Boys" or "Girls"' });
      }
    }

    // Validate status if provided
    if (req.body.status !== undefined) {
      const validStatuses = ['active', 'graduated', 'suspended'];
      if (!validStatuses.includes(req.body.status)) {
        return res.status(400).json({ 
          message: `Status must be one of: ${validStatuses.join(', ')}` 
        });
      }
    }

    const student = await Student.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    res.json({ message: 'Student updated successfully', student });
  } catch (error) {
    console.error('Update student error:', error);
    res.status(500).json({ message: 'Error updating student', error: error.message });
  }
};

export const deleteStudent = async (req, res) => {
  try {
    const student = await Student.findById(req.params.id).populate('room');
    
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    // Prevent deletion if student has a room allocated
    if (student.room) {
      return res.status(400).json({ 
        message: `Cannot delete student. Student is currently allocated to room ${student.room.roomNumber || student.room._id}. Please deallocate the room first.` 
      });
    }

    // Delete user account
    const user = await User.findOne({ email: student.email });
    if (user) {
      await User.findByIdAndDelete(user._id);
    }

    await Student.findByIdAndDelete(req.params.id);

    res.json({ message: 'Student deleted successfully' });
  } catch (error) {
    console.error('Delete student error:', error);
    res.status(500).json({ message: 'Error deleting student', error: error.message });
  }
};

// ==================== PARENTS ====================

export const createParent = async (req, res) => {
  try {
    const { name, email, phone, address, relation, emergencyContact, studentIds } = req.body;

    // Create user
    const username = email.split('@')[0] + Math.floor(Math.random() * 1000);
    const tempPassword = generatePassword(10);
    
    const user = await User.create({
      name,
      username: username.toLowerCase(),
      email: email.toLowerCase(),
      password: tempPassword,
      role: 'parent',
      phone,
      firstLogin: true,
    });

    // Create parent
    const parent = await Parent.create({
      user: user._id,
      name,
      email: email.toLowerCase(),
      phone,
      address,
      relation,
      emergencyContact,
      students: studentIds || [],
      status: 'active',
    });

    // Send email with credentials
    await sendLoginCredentials({
      to: email,
      name,
      username: user.username,
      password: tempPassword,
      role: 'parent',
    });

    res.status(201).json({
      message: 'Parent created successfully',
      parent: {
        ...parent.toObject(),
        user: {
          username: user.username,
          email: user.email,
        },
      },
    });
  } catch (error) {
    console.error('Create parent error:', error);
    res.status(500).json({ message: 'Error creating parent', error: error.message });
  }
};

export const getAllParents = async (req, res) => {
  try {
    const parents = await Parent.find()
      .populate('students', 'name studentId email')
      .populate('user', 'username email')
      .sort({ createdAt: -1 });

    res.json(parents);
  } catch (error) {
    console.error('Get parents error:', error);
    res.status(500).json({ message: 'Error fetching parents', error: error.message });
  }
};

// ==================== STAFF ====================

export const createStaff = async (req, res) => {
  try {
    const { name, email, phone, address } = req.body;

    // Validate required fields
    if (!name || !name.trim()) {
      return res.status(400).json({ message: 'Name is required' });
    }
    if (!email || !email.trim()) {
      return res.status(400).json({ message: 'Email is required' });
    }
    if (!phone || !phone.trim()) {
      return res.status(400).json({ message: 'Phone number is required' });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: 'Invalid email format' });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const normalizedName = name.trim();

    // Check if email already exists in User collection
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res.status(400).json({ 
        message: `Email ${normalizedEmail} is already registered. Please use a different email address.` 
      });
    }

    // Check if email already exists in Staff collection
    const existingStaff = await Staff.findOne({ email: normalizedEmail });
    if (existingStaff) {
      return res.status(400).json({ 
        message: `A staff member with email ${normalizedEmail} already exists.` 
      });
    }

    // Generate staff ID
    const staffId = generateId('staff');

    // Generate unique username (try multiple times if needed)
    let username;
    let attempts = 0;
    let isUnique = false;
    
    while (!isUnique && attempts < 10) {
      const baseUsername = normalizedEmail.split('@')[0];
      const randomSuffix = Math.floor(Math.random() * 10000);
      username = `${baseUsername}${randomSuffix}`.toLowerCase();
      
      const existingUsername = await User.findOne({ username });
      if (!existingUsername) {
        isUnique = true;
      }
      attempts++;
    }

    if (!isUnique) {
      return res.status(500).json({ 
        message: 'Failed to generate unique username. Please try again.' 
      });
    }

    const tempPassword = generatePassword(10);
    
    // Create user
    const user = await User.create({
      name: normalizedName,
      username,
      email: normalizedEmail,
      password: tempPassword,
      role: 'staff',
      phone: phone.trim(),
      firstLogin: true,
    });

    // Create staff (employment fields are optional - using model defaults)
    const staff = await Staff.create({
      user: user._id,
      staffId,
      name: normalizedName,
      email: normalizedEmail,
      phone: phone.trim(),
      address: address ? address.trim() : '',
      // Employment fields will use model defaults (department: 'Housekeeping', shift: 'Full Day', salary: 0)
      status: 'active',
    });

    // Send email with credentials (don't fail if email fails)
    let emailStatus = { sent: false, error: null };
    try {
      const emailResult = await sendLoginCredentials({
        to: normalizedEmail,
        name: normalizedName,
        username: user.username,
        password: tempPassword,
        role: 'staff',
      });
      emailStatus.sent = emailResult?.success || true;
      if (!emailResult?.success) {
        emailStatus.error = emailResult?.error || 'Failed to send email';
        console.error(`[CREATE STAFF] Email failed: ${emailStatus.error}`);
      }
    } catch (emailError) {
      console.error('Error sending staff email:', emailError);
      emailStatus.error = emailError.message || 'Failed to send email';
      // Don't fail staff creation if email fails
    }

    res.status(201).json({
      message: emailStatus.sent 
        ? 'Staff created successfully. Login credentials have been sent to their email.'
        : 'Staff created successfully. However, the email with login credentials could not be sent. Please contact the administrator.',
      staff: {
        ...staff.toObject(),
        user: {
          username: user.username,
          email: user.email,
        },
      },
      emailStatus,
    });
  } catch (error) {
    console.error('Create staff error:', error);
    
    // Handle MongoDB duplicate key errors
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      return res.status(400).json({ 
        message: `${field === 'email' ? 'Email' : field === 'username' ? 'Username' : 'A field'} already exists. Please use a different value.`,
        error: error.message
      });
    }

    // Handle validation errors
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ 
        message: 'Validation error',
        errors: errors
      });
    }

    res.status(500).json({ 
      message: 'Error creating staff', 
      error: error.message 
    });
  }
};

export const getAllStaff = async (req, res) => {
  try {
    const staff = await Staff.find()
      .populate('user', 'username email')
      .sort({ createdAt: -1 });

    res.json(staff);
  } catch (error) {
    console.error('Get staff error:', error);
    res.status(500).json({ message: 'Error fetching staff', error: error.message });
  }
};

// ==================== ROOMS ====================

export const allocateRoom = async (req, res) => {
  try {
    const { studentId, roomId } = req.body;

    const student = await Student.findById(studentId);
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    const room = await Room.findById(roomId);
    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }

    // Validate room is available for allocation
    if (room.currentOccupancy >= room.capacity) {
      return res.status(400).json({ message: 'Room is full' });
    }

    if (room.status === 'maintenance' || room.maintenanceStatus === 'under_maintenance' || room.maintenanceStatus === 'blocked') {
      return res.status(400).json({ message: 'Room is under maintenance and cannot be allocated' });
    }

    if (room.status !== 'available' && room.status !== 'reserved') {
      return res.status(400).json({ message: 'Room is not available for allocation' });
    }

    // Deallocate previous room if exists
    if (student.room) {
      const oldRoom = await Room.findById(student.room);
      if (oldRoom) {
        oldRoom.currentOccupancy = Math.max(0, (oldRoom.currentOccupancy || oldRoom.occupied || 0) - 1);
        oldRoom.occupied = oldRoom.currentOccupancy; // Sync legacy field
        if (oldRoom.currentOccupancy === 0) {
          oldRoom.status = 'available';
        }
        // Remove student from occupants array
        oldRoom.occupants = oldRoom.occupants.filter(
          (id) => id.toString() !== student._id.toString()
        );
        await oldRoom.save();
      }
    }

    // Allocate room temporarily (pending payment confirmation)
    student.temporaryRoom = roomId;
    student.roomAllocationStatus = 'pending_payment';
    student.roomAllocatedAt = new Date();
    await student.save();

    // Don't update room occupancy yet - wait for payment confirmation
    // Room will be updated when payment is confirmed
    // For now, mark room as reserved
    if (room.status === 'available') {
      room.status = 'reserved'; // Reserve room until payment
    }
    await room.save();

    // Automatically generate room fee based on room type and amenities
    try {
      const now = new Date();
      const currentYear = now.getFullYear();
      
      // Calculate due date as 30 days from room allocation date
      const allocationDate = new Date();
      const dueDate = new Date(allocationDate);
      dueDate.setDate(dueDate.getDate() + 30); // 30 days from allocation

      // IMPORTANT: Recalculate room price to ensure accuracy
      // This ensures the fee is always based on current room pricing, not stale data
      const { calculateRoomPrice } = await import('../utils/amenitiesPricing.js');
      const recalculatedPrice = calculateRoomPrice(room.roomType, room.amenities || {});
      
      // Use recalculated price, but log if there's a discrepancy
      const correctTotalPrice = recalculatedPrice.totalPrice;
      if (room.totalPrice && Math.abs(room.totalPrice - correctTotalPrice) > 0.01) {
        console.warn(`⚠️ Room ${room.roomNumber} has incorrect totalPrice (₹${room.totalPrice}). Recalculating to ₹${correctTotalPrice}`);
        // Update room with correct price
        room.totalPrice = correctTotalPrice;
        room.basePrice = recalculatedPrice.basePrice;
        room.amenitiesPrice = recalculatedPrice.amenitiesPrice;
        room.rent = correctTotalPrice; // Sync legacy field
        await room.save();
      }

      // Check if fee already exists for this student and room
      const existingFee = await Fee.findOne({
        student: student._id,
        feeType: 'rent',
        status: { $in: ['pending', 'partial', 'paid'] }, // Check all statuses to avoid duplicates
        year: dueDate.getFullYear(),
      });

      if (!existingFee) {
        if (!correctTotalPrice || correctTotalPrice <= 0) {
          console.warn(`⚠️ Room ${room.roomNumber} has invalid totalPrice (₹${correctTotalPrice}). Skipping fee generation.`);
        } else {
          const roomFee = await Fee.create({
            student: student._id,
            feeType: 'rent',
            amount: correctTotalPrice, // Use recalculated totalPrice to ensure accuracy
            dueDate: dueDate,
            status: 'pending',
            description: `Yearly room fee for ${room.roomType} room (${room.roomNumber}) - Base: ₹${recalculatedPrice.basePrice.toLocaleString('en-IN')} + Amenities: ₹${recalculatedPrice.amenitiesPrice.toLocaleString('en-IN')} = ₹${correctTotalPrice.toLocaleString('en-IN')}`,
            year: dueDate.getFullYear(),
            month: null, // Yearly fee, not monthly
          });

          console.log(`✅ Room fee generated automatically for student ${student.studentId}: ₹${correctTotalPrice} (Fee ID: ${roomFee._id})`);
          console.log(`   Breakdown: Base (${room.roomType}): ₹${recalculatedPrice.basePrice.toLocaleString('en-IN')}, Amenities: ₹${recalculatedPrice.amenitiesPrice.toLocaleString('en-IN')}, Total: ₹${correctTotalPrice.toLocaleString('en-IN')}`);
        }
      } else {
        // If fee exists but amount is wrong, update it
        if (Math.abs(existingFee.amount - correctTotalPrice) > 0.01) {
          console.warn(`⚠️ Existing fee for student ${student.studentId} has incorrect amount (₹${existingFee.amount}). Updating to ₹${correctTotalPrice}`);
          existingFee.amount = correctTotalPrice;
          existingFee.description = `Yearly room fee for ${room.roomType} room (${room.roomNumber}) - Base: ₹${recalculatedPrice.basePrice.toLocaleString('en-IN')} + Amenities: ₹${recalculatedPrice.amenitiesPrice.toLocaleString('en-IN')} = ₹${correctTotalPrice.toLocaleString('en-IN')}`;
          await existingFee.save();
        } else {
          console.log(`ℹ️ Room fee already exists for student ${student.studentId} for year ${dueDate.getFullYear()}. Skipping generation.`);
        }
      }
    } catch (feeError) {
      // Log error but don't fail room allocation
      console.error('❌ Error generating room fee:', feeError);
      console.error('Error details:', {
        studentId: student.studentId,
        roomId: room._id,
        roomNumber: room.roomNumber,
        totalPrice: room.totalPrice,
        error: feeError.message,
        stack: feeError.stack,
      });
    }

    // Send notification to student about pending payment
    const { createNotification } = await import('../utils/notificationHelper.js');
    await createNotification(
      {
        title: 'Room Allocation - Payment Required',
        message: `Room ${room.roomNumber} has been allocated to you. Please complete the payment to confirm your room allocation.`,
        type: 'payment',
        recipient: student.user,
        relatedEntity: {
          entityType: 'room',
          entityId: room._id,
        },
      },
      { origin: 'admin' }
    );

    res.json({ 
      message: 'Room allocated successfully. Payment required to confirm allocation.', 
      student, 
      room,
      requiresPayment: true,
      allocationStatus: 'pending_payment'
    });
  } catch (error) {
    console.error('Allocate room error:', error);
    res.status(500).json({ message: 'Error allocating room', error: error.message });
  }
};

export const deallocateRoom = async (req, res) => {
  try {
    const { studentId } = req.body;

    const student = await Student.findById(studentId);
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    if (!student.room) {
      return res.status(400).json({ message: 'Student has no room allocated' });
    }

    const room = await Room.findById(student.room);
    if (room) {
      // Decrease occupancy
      room.currentOccupancy = Math.max(0, (room.currentOccupancy || room.occupied || 0) - 1);
      room.occupied = room.currentOccupancy; // Sync legacy field
      
      // Remove student from occupants array
      room.occupants = room.occupants.filter(
        (id) => id.toString() !== student._id.toString()
      );
      
      // Update room status
      if (room.currentOccupancy === 0) {
        room.status = 'available';
      } else if (room.currentOccupancy < room.capacity) {
        room.status = 'available'; // Partially occupied rooms are still available
      }
      
      await room.save();
    }

    // Remove room from student
    student.room = null;
    await student.save();

    res.json({ message: 'Room deallocated successfully', student, room });
  } catch (error) {
    console.error('Deallocate room error:', error);
    res.status(500).json({ message: 'Error deallocating room', error: error.message });
  }
};

// ==================== ROOMS ====================

export const createRoom = async (req, res) => {
  try {
    console.log('Create room request body:', JSON.stringify(req.body, null, 2));
    
    const {
      roomNumber,
      block,
      floor,
      roomType,
      gender,
      capacity,
      amenities,
      maintenanceStatus,
      photos,
      aiTags,
      allowRoomChanges,
      generateQRCode: shouldGenerateQR,
    } = req.body;

    // Parse JSON strings if needed
    let parsedPhotos = photos;
    if (typeof photos === 'string') {
      try {
        parsedPhotos = JSON.parse(photos);
      } catch (e) {
        parsedPhotos = [];
      }
    }
    
    let parsedAmenities = amenities;
    if (typeof amenities === 'string') {
      try {
        parsedAmenities = JSON.parse(amenities);
      } catch (e) {
        parsedAmenities = {};
      }
    }
    
    let parsedAiTags = aiTags;
    if (typeof aiTags === 'string') {
      try {
        parsedAiTags = JSON.parse(aiTags);
      } catch (e) {
        parsedAiTags = {};
      }
    }

    // Validate required fields (allow floor to be 0)
    if (!roomNumber || roomNumber.trim() === '') {
      return res.status(400).json({ 
        message: 'Room number is required' 
      });
    }
    if (floor === null || floor === undefined || floor === '') {
      return res.status(400).json({ 
        message: 'Floor is required' 
      });
    }
    if (!roomType || roomType === '') {
      return res.status(400).json({ 
        message: 'Room type is required' 
      });
    }
    if (!capacity || capacity === '' || parseInt(capacity) < 1) {
      return res.status(400).json({ 
        message: 'Capacity is required and must be at least 1' 
      });
    }
    if (!gender || (gender !== 'Boys' && gender !== 'Girls')) {
      return res.status(400).json({ 
        message: 'Gender restriction is required and must be either "Boys" or "Girls"' 
      });
    }

    // Parse numeric values
    const parsedCapacity = parseInt(capacity);
    const parsedFloor = parseInt(floor);
    
    if (isNaN(parsedCapacity) || parsedCapacity < 1) {
      return res.status(400).json({ 
        message: 'Capacity must be a valid number greater than 0' 
      });
    }
    
    if (isNaN(parsedFloor)) {
      return res.status(400).json({ 
        message: 'Floor must be a valid number' 
      });
    }
    
    if (parsedFloor < 0 || parsedFloor > 8) {
      return res.status(400).json({ 
        message: 'Floor must be between 0 and 8' 
      });
    }

    // Check if room number already exists in the same block with the same gender
    // Normalize block: treat null/undefined as empty string for consistency
    const blockValue = (block?.trim() || '').trim();
    
    // First, check all rooms with the same room number to see what exists
    const allRoomsWithSameNumber = await Room.find({ roomNumber: roomNumber.trim() });
    console.log(`Checking for room ${roomNumber.trim()}: Found ${allRoomsWithSameNumber.length} rooms with same number`);
    allRoomsWithSameNumber.forEach(r => {
      console.log(`  - Room ID: ${r._id}, Block: "${r.block || r.building || '(empty)'}", Gender: ${r.gender}, Occupancy: ${r.currentOccupancy}`);
    });
    
    // Check for existing room with same roomNumber, block, and gender
    // Also check for null/undefined block values and legacy building field
    const existingRoom = await Room.findOne({
      roomNumber: roomNumber.trim(),
      gender: gender,
      $or: [
        { block: blockValue },
        { building: blockValue }, // Check legacy building field too
        ...(blockValue === '' ? [
          { block: { $exists: false } },
          { block: null },
          { block: '' },
          { building: { $exists: false } },
          { building: null },
          { building: '' }
        ] : [])
      ]
    });
    
    if (existingRoom) {
      const existingBlock = existingRoom.block || existingRoom.building || '(no block)';
      return res.status(400).json({ 
        message: `Room number ${roomNumber.trim()} already exists in block ${existingBlock} for ${gender}. Each room number can only exist once per block and gender combination.` 
      });
    }

    // Validate capacity matches room type
    const typeCapacityMap = {
      'Single': 1,
      'Double': 2,
      'Triple': 3,
      'Quad': 4,
    };
    
    if (typeCapacityMap[roomType] && parsedCapacity !== typeCapacityMap[roomType]) {
      return res.status(400).json({ 
        message: `Capacity for ${roomType} room must be ${typeCapacityMap[roomType]}` 
      });
    }

    // Calculate pricing based on amenities - ensure all fields exist
    const amenitiesObj = {
      ac: parsedAmenities?.ac || false,
      attachedBathroom: parsedAmenities?.attachedBathroom || false,
      geyser: parsedAmenities?.geyser || false,
      wifi: parsedAmenities?.wifi || false,
      extraFurniture: parsedAmenities?.extraFurniture || false,
      fanCount: parsedAmenities?.fanCount || 0,
    };
    const { basePrice, amenitiesPrice, totalPrice } = calculateRoomPrice(roomType, amenitiesObj);

    // Determine status based on maintenance status
    let status = 'available';
    if (maintenanceStatus === 'under_maintenance' || maintenanceStatus === 'blocked') {
      status = 'maintenance';
    }

    // Generate QR code if requested
    let qrCode = null;
    if (shouldGenerateQR) {
      try {
        qrCode = await generateRoomQRCode(null, roomNumber.trim());
      } catch (qrError) {
        console.error('QR code generation failed:', qrError);
        // Continue without QR code
      }
    }

    // Handle file uploads - convert to base64 if needed
    let roomPhotos = [];
    if (req.files && req.files.length > 0) {
      // Files uploaded via multer
      roomPhotos = req.files.map(file => `/uploads/rooms/${file.filename}`);
    } else if (parsedPhotos && Array.isArray(parsedPhotos)) {
      // Base64 images from frontend
      roomPhotos = parsedPhotos.slice(0, 3); // Max 3 images
    }

    // Ensure aiTags has all required fields
    const aiTagsObj = {
      noiseTolerance: parsedAiTags?.noiseTolerance || null,
      cleanlinessExpectations: parsedAiTags?.cleanlinessExpectations || null,
      studyHabits: parsedAiTags?.studyHabits || null,
    };

    // Create room
    const room = await Room.create({
      roomNumber: roomNumber.trim(),
      block: block?.trim() || '',
      floor: parsedFloor,
      roomType,
      gender: gender,
      capacity: parsedCapacity,
      currentOccupancy: 0,
      occupants: [],
      amenities: amenitiesObj,
      basePrice,
      amenitiesPrice,
      totalPrice,
      maintenanceStatus: maintenanceStatus || 'none',
      status,
      photos: roomPhotos,
      qrCode,
      aiTags: aiTagsObj,
      allowRoomChanges: allowRoomChanges !== false, // Default to true
      // Legacy fields for backward compatibility
      building: block?.trim() || '',
      occupied: 0,
      rent: totalPrice,
    });

    // Generate QR code with room ID if not already generated
    if (shouldGenerateQR && !qrCode) {
      try {
        qrCode = await generateRoomQRCode(room._id.toString(), room.roomNumber);
        room.qrCode = qrCode;
        await room.save();
      } catch (qrError) {
        console.error('QR code generation failed:', qrError);
      }
    }

    res.status(201).json({ 
      message: 'Room created successfully', 
      room,
      pricing: {
        basePrice,
        amenitiesPrice,
        totalPrice,
      },
    });
  } catch (error) {
    console.error('Create room error:', error);
    if (error.code === 11000) {
      // MongoDB unique index violation - extract which fields conflicted
      const keyPattern = error.keyPattern || {};
      const keyValue = error.keyValue || {};
      
      let conflictFields = [];
      if (keyPattern.roomNumber) conflictFields.push(`roomNumber: ${keyValue.roomNumber}`);
      if (keyPattern.block) conflictFields.push(`block: ${keyValue.block || '(empty)'}`);
      if (keyPattern.gender) conflictFields.push(`gender: ${keyValue.gender}`);
      
      const conflictMessage = conflictFields.length > 0 
        ? `Room with ${conflictFields.join(', ')} already exists`
        : `Room number ${roomNumber?.trim() || ''} already exists in block ${block?.trim() || '(no block)'} for ${gender || ''}`;
      
      return res.status(400).json({ message: conflictMessage });
    }
    // Provide more detailed error message
    const errorMessage = error.message || 'Unknown error occurred';
    console.error('Full error details:', {
      message: errorMessage,
      name: error.name,
      errors: error.errors,
      stack: error.stack,
    });
    res.status(500).json({ 
      message: 'Error creating room', 
      error: errorMessage,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    });
  }
};

export const getAllRooms = async (req, res) => {
  try {
    const { 
      status, 
      building, 
      block,
      floor, 
      roomType, 
      gender,
      maintenanceStatus,
      search, 
      page = 1, 
      limit = 50,
      excludeMaintenance = false, // For student view - exclude maintenance rooms
    } = req.query;
    const query = {};

    if (status) query.status = status;
    if (building) query.building = { $regex: building, $options: 'i' };
    if (block) query.block = { $regex: block, $options: 'i' };
    if (floor) query.floor = parseInt(floor);
    if (roomType) query.roomType = roomType;
    if (gender) query.gender = gender;
    if (maintenanceStatus) query.maintenanceStatus = maintenanceStatus;
    
    // Exclude maintenance rooms for student view
    if (excludeMaintenance === 'true' || excludeMaintenance === true) {
      query.maintenanceStatus = { $ne: 'under_maintenance' };
      query.status = { $ne: 'maintenance' };
    }
    
    if (search) {
      query.$or = [
        { roomNumber: { $regex: search, $options: 'i' } },
        { building: { $regex: search, $options: 'i' } },
        { block: { $regex: search, $options: 'i' } },
      ];
    }

    const rooms = await Room.find(query)
      .populate('occupants', 'name studentId email course year')
      .sort({ block: 1, floor: 1, roomNumber: 1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    // Calculate actual occupancy for each room
    const roomsWithOccupancy = await Promise.all(
      rooms.map(async (room) => {
        // Count confirmed occupants (students with room field set)
        const confirmedCount = await Student.countDocuments({ room: room._id });
        
        // Count temporary occupants (students with temporaryRoom field set - pending payment)
        const temporaryCount = await Student.countDocuments({ temporaryRoom: room._id });
        
        const totalOccupancy = confirmedCount + temporaryCount;
        const availableSlots = room.capacity - totalOccupancy;
        
        // Update room status based on actual occupancy
        let roomStatus = room.status;
        if (totalOccupancy >= room.capacity) {
          roomStatus = 'occupied';
        } else if (totalOccupancy > 0) {
          roomStatus = 'reserved';
        } else if (room.maintenanceStatus === 'under_maintenance') {
          roomStatus = 'maintenance';
        } else {
          roomStatus = 'available';
        }

        // Update the room document if occupancy or status changed
        if (room.currentOccupancy !== confirmedCount || room.occupied !== confirmedCount || room.status !== roomStatus) {
          await Room.findByIdAndUpdate(room._id, {
            currentOccupancy: confirmedCount,
            occupied: confirmedCount,
            status: roomStatus
          });
        }

        return {
          ...room.toObject(),
          currentOccupancy: confirmedCount,
          occupied: confirmedCount,
          temporaryOccupancy: temporaryCount,
          totalOccupancy: totalOccupancy,
          availableSlots: availableSlots,
          status: roomStatus,
        };
      })
    );

    const total = await Room.countDocuments(query);

    res.json({
      rooms: roomsWithOccupancy,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      total,
    });
  } catch (error) {
    console.error('Get rooms error:', error);
    res.status(500).json({ message: 'Error fetching rooms', error: error.message });
  }
};

export const getRoomById = async (req, res) => {
  try {
    const room = await Room.findById(req.params.id)
      .populate({
        path: 'students',
        select: 'name studentId email course year',
        populate: {
          path: 'user',
          select: 'name email phone',
        },
      });

    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }

    // Get students in this room
    const students = await Student.find({ room: room._id })
      .populate('user', 'name email phone')
      .select('name studentId email course year batchYear');

    res.json({ room, students });
  } catch (error) {
    console.error('Get room error:', error);
    res.status(500).json({ message: 'Error fetching room', error: error.message });
  }
};

export const updateRoom = async (req, res) => {
  try {
    const {
      roomNumber,
      block,
      floor,
      roomType,
      gender,
      capacity,
      amenities,
      maintenanceStatus,
      photos,
      aiTags,
      allowRoomChanges,
      generateQRCode: shouldGenerateQR,
    } = req.body;

    const room = await Room.findById(req.params.id);
    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }

    // Prevent editing occupied rooms
    if (room.currentOccupancy > 0 || room.occupied > 0) {
      return res.status(400).json({ 
        message: 'Cannot edit occupied rooms. Please deallocate students first.' 
      });
    }

    // For available rooms (occupancy = 0), only allow maintenance status changes
    const isAvailable = (room.currentOccupancy || room.occupied || 0) === 0;
    if (isAvailable) {
      // Check if any field other than maintenanceStatus is being changed
      const hasOtherChanges = 
        (roomNumber !== undefined && roomNumber.trim() !== room.roomNumber) ||
        (block !== undefined && (block?.trim() || '') !== (room.block || '')) ||
        (floor !== undefined && parseInt(floor) !== room.floor) ||
        (roomType !== undefined && roomType !== room.roomType) ||
        (gender !== undefined && gender !== room.gender) ||
        (capacity !== undefined && parseInt(capacity) !== room.capacity) ||
        (amenities !== undefined) ||
        (photos !== undefined) ||
        (aiTags !== undefined) ||
        (allowRoomChanges !== undefined && allowRoomChanges !== room.allowRoomChanges);
      
      // Only maintenanceStatus is allowed to change for available rooms
      if (hasOtherChanges && maintenanceStatus === undefined) {
        return res.status(400).json({ 
          message: 'For available rooms, only maintenance status can be changed. Other details are locked.' 
        });
      }
      
      // If maintenanceStatus is the only change, allow it
      if (hasOtherChanges && maintenanceStatus !== undefined) {
        // Check if only maintenanceStatus is actually changing
        const maintenanceOnlyChange = 
          !(roomNumber !== undefined && roomNumber.trim() !== room.roomNumber) &&
          !(block !== undefined && (block?.trim() || '') !== (room.block || '')) &&
          !(floor !== undefined && parseInt(floor) !== room.floor) &&
          !(roomType !== undefined && roomType !== room.roomType) &&
          !(gender !== undefined && gender !== room.gender) &&
          !(capacity !== undefined && parseInt(capacity) !== room.capacity) &&
          !(amenities !== undefined) &&
          !(photos !== undefined) &&
          !(aiTags !== undefined) &&
          !(allowRoomChanges !== undefined && allowRoomChanges !== room.allowRoomChanges);
        
        if (!maintenanceOnlyChange) {
          return res.status(400).json({ 
            message: 'For available rooms, only maintenance status can be changed. Other details are locked.' 
          });
        }
      }
    }

    // Check if room number, block, or gender is being changed and if the combination already exists
    const newRoomNumber = roomNumber?.trim() || room.roomNumber;
    const newBlock = block?.trim() || room.block || '';
    const newGender = gender || room.gender;
    const roomNumberChanged = roomNumber && roomNumber.trim() !== room.roomNumber;
    const blockChanged = block !== undefined && (block?.trim() || '') !== (room.block || '');
    const genderChanged = gender && gender !== room.gender;
    
    if (roomNumberChanged || blockChanged || genderChanged) {
      const existingRoom = await Room.findOne({ 
        roomNumber: newRoomNumber,
        block: newBlock,
        gender: newGender,
        _id: { $ne: room._id } // Exclude the current room being updated
      });
      if (existingRoom) {
        return res.status(400).json({ 
          message: `Room number ${newRoomNumber} already exists in block ${newBlock || '(no block specified)'} for ${newGender}` 
        });
      }
    }

    // Validate capacity if room type is being changed
    if (roomType && capacity) {
      const typeCapacityMap = {
        'Single': 1,
        'Double': 2,
        'Triple': 3,
        'Quad': 4,
      };
      
      if (typeCapacityMap[roomType] && capacity !== typeCapacityMap[roomType]) {
        return res.status(400).json({ 
          message: `Capacity for ${roomType} room must be ${typeCapacityMap[roomType]}` 
        });
      }
    }

    // Don't allow reducing capacity below current occupancy
    if (capacity && capacity < room.currentOccupancy) {
      return res.status(400).json({ 
        message: `Cannot reduce capacity below current occupancy (${room.currentOccupancy} students)` 
      });
    }

    // Recalculate pricing if amenities or room type changed (but keep base price fixed)
    const amenitiesObj = amenities !== undefined ? amenities : room.amenities;
    const finalRoomType = roomType || room.roomType;
    const { basePrice, amenitiesPrice, totalPrice } = calculateRoomPrice(finalRoomType, amenitiesObj);
    
    // Base price should remain fixed (use existing basePrice if room type hasn't changed)
    const finalBasePrice = (roomType && roomType !== room.roomType) ? basePrice : room.basePrice;
    const finalAmenitiesPrice = amenitiesPrice;
    const finalTotalPrice = finalBasePrice + finalAmenitiesPrice;

    // Handle photos
    if (req.files && req.files.length > 0) {
      // Files uploaded via multer
      const newPhotos = req.files.map(file => `/uploads/rooms/${file.filename}`);
      room.photos = [...(room.photos || []), ...newPhotos].slice(0, 3); // Max 3 images
    } else if (photos !== undefined) {
      // Base64 images from frontend or array replacement
      room.photos = Array.isArray(photos) ? photos.slice(0, 3) : [];
    }

    // Generate QR code if requested and not already exists
    if (shouldGenerateQR && !room.qrCode) {
      try {
        room.qrCode = await generateRoomQRCode(room._id.toString(), room.roomNumber);
      } catch (qrError) {
        console.error('QR code generation failed:', qrError);
      }
    }

    // Validate gender if being updated
    if (gender !== undefined) {
      if (gender !== 'Boys' && gender !== 'Girls') {
        return res.status(400).json({ 
          message: 'Gender must be either "Boys" or "Girls"' 
        });
      }
    }

    // Update room fields
    if (roomNumber) room.roomNumber = roomNumber.trim();
    if (block !== undefined) {
      room.block = block?.trim() || '';
      room.building = block?.trim() || ''; // Sync with legacy field
    }
    if (floor !== undefined) {
      const parsedFloor = parseInt(floor);
      if (isNaN(parsedFloor) || parsedFloor < 0 || parsedFloor > 8) {
        return res.status(400).json({ 
          message: 'Floor must be between 0 and 8' 
        });
      }
      room.floor = parsedFloor;
    }
    if (roomType) room.roomType = roomType;
    if (gender !== undefined) room.gender = gender;
    if (capacity !== undefined) room.capacity = parseInt(capacity);
    if (amenities !== undefined) room.amenities = amenitiesObj;
    if (maintenanceStatus !== undefined) room.maintenanceStatus = maintenanceStatus;
    if (aiTags !== undefined) room.aiTags = aiTags;
    if (allowRoomChanges !== undefined) room.allowRoomChanges = allowRoomChanges;

    // Update pricing (base price fixed, only recalculate if room type changed)
    room.basePrice = finalBasePrice;
    room.amenitiesPrice = finalAmenitiesPrice;
    room.totalPrice = finalTotalPrice;
    room.rent = finalTotalPrice; // Sync with legacy field

    // Update status based on maintenance and occupancy
    if (maintenanceStatus === 'under_maintenance' || maintenanceStatus === 'blocked') {
      room.status = 'maintenance';
    } else if (room.currentOccupancy >= room.capacity) {
      room.status = 'occupied';
    } else if (room.currentOccupancy === 0 && room.status === 'occupied') {
      room.status = 'available';
    } else if (room.status === 'maintenance' && maintenanceStatus === 'none') {
      room.status = room.currentOccupancy > 0 ? 'occupied' : 'available';
    }

    await room.save();

    res.json({ 
      message: 'Room updated successfully', 
      room,
      pricing: {
        basePrice,
        amenitiesPrice,
        totalPrice,
      },
    });
  } catch (error) {
    console.error('Update room error:', error);
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Room number already exists' });
    }
    res.status(500).json({ message: 'Error updating room', error: error.message });
  }
};

export const deleteRoom = async (req, res) => {
  try {
    const room = await Room.findById(req.params.id);
    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }

    // Check if room has students (confirmed allocation)
    const studentsInRoom = await Student.countDocuments({ room: room._id });
    if (studentsInRoom > 0) {
      return res.status(400).json({ 
        message: `Cannot delete room. ${studentsInRoom} student(s) are currently allocated to this room. Please deallocate students first or set room to maintenance status.` 
      });
    }

    // Check if room has students with temporary allocation (pending payment)
    const studentsWithTempRoom = await Student.countDocuments({ temporaryRoom: room._id });
    if (studentsWithTempRoom > 0) {
      return res.status(400).json({ 
        message: `Cannot delete room. ${studentsWithTempRoom} student(s) have selected this room (pending payment). Please resolve allocations first or set room to maintenance status.` 
      });
    }

    // Check if room is occupied or reserved
    if (room.status === 'occupied' || room.status === 'reserved') {
      return res.status(400).json({ 
        message: `Cannot delete ${room.status} room. Current occupancy: ${room.currentOccupancy || 0}/${room.capacity}. Consider setting room to maintenance status instead of deleting.` 
      });
    }

    // Prevent deletion - suggest maintenance instead
    return res.status(400).json({
      message: 'Room deletion is not recommended. Instead, you can:\n1. Set room to "Under Maintenance" to block it from students\n2. Set room to "Blocked" to mark it unavailable\n3. Update room status to manage availability',
      suggestion: 'Use room status management instead of deletion'
    });

    // The following code is unreachable but kept for reference if policy changes
    // await Room.findByIdAndDelete(req.params.id);
    // res.json({ message: 'Room deleted successfully' });
  } catch (error) {
    console.error('Delete room error:', error);
    res.status(500).json({ message: 'Error deleting room', error: error.message });
  }
};

// ==================== FEES ====================

export const createFee = async (req, res) => {
  try {
    const fee = await Fee.create(req.body);
    res.status(201).json({ message: 'Fee created successfully', fee });
  } catch (error) {
    console.error('Create fee error:', error);
    res.status(500).json({ message: 'Error creating fee', error: error.message });
  }
};

export const generateRoomFeesForAllocatedStudents = async (req, res) => {
  try {
    // Find all students with allocated rooms but no pending rent fees
    const students = await Student.find({ room: { $ne: null } })
      .populate('room');

    let generatedCount = 0;
    let skippedCount = 0;
    const errors = [];

    const now = new Date();
    const currentYear = now.getFullYear();
    let dueDate = new Date(currentYear, 4, 31); // May 31st of current year
    if (now.getMonth() >= 5) {
      dueDate = new Date(currentYear + 1, 4, 31); // May 31st of next year
    }

    for (const student of students) {
      try {
        if (!student.room) continue;

        const room = student.room;
        if (!room.totalPrice || room.totalPrice <= 0) {
          errors.push({
            studentId: student.studentId,
            error: `Room ${room.roomNumber} has no totalPrice set`,
          });
          continue;
        }

        // Check if fee already exists
        const existingFee = await Fee.findOne({
          student: student._id,
          feeType: 'rent',
          status: { $in: ['pending', 'partial', 'paid'] },
          year: dueDate.getFullYear(),
        });

        if (existingFee) {
          skippedCount++;
          continue;
        }

        // Generate room fee
        const roomFee = await Fee.create({
          student: student._id,
          feeType: 'rent',
          amount: room.totalPrice,
          dueDate: dueDate,
          status: 'pending',
          description: `Yearly room fee for ${room.roomType} room (${room.roomNumber}) - Includes: ${room.roomType} room base + amenities`,
          year: dueDate.getFullYear(),
          month: null,
        });

        generatedCount++;
        console.log(`✅ Room fee generated for student ${student.studentId}: ₹${room.totalPrice}`);
      } catch (error) {
        errors.push({
          studentId: student.studentId,
          error: error.message,
        });
        console.error(`Error generating room fee for student ${student.studentId}:`, error);
      }
    }

    res.json({
      message: 'Room fees generated for allocated students',
      generated: generatedCount,
      skipped: skippedCount,
      total: students.length,
      errors: errors,
    });
  } catch (error) {
    console.error('Generate room fees error:', error);
    res.status(500).json({ message: 'Error generating room fees', error: error.message });
  }
};

export const generateMessFees = async (req, res) => {
  try {
    const { month, year, dailyRate } = req.body;
    const { generateMonthlyMessFees, generateMessFeesForMonth } = await import('../utils/feeGenerator.js');
    
    // Default daily rate: ₹150/day (can be configured)
    // This means if a student is present all 30 days, they pay ₹4500/month
    const defaultDailyRate = 150;
    const messFeeDailyRate = dailyRate || defaultDailyRate;
    
    let result;
    if (month && year) {
      // Generate for specific month
      result = await generateMessFeesForMonth(month, year, messFeeDailyRate);
    } else {
      // Generate for current month
      result = await generateMonthlyMessFees(messFeeDailyRate);
    }

    res.json({
      message: 'Mess fees generated successfully based on attendance',
      ...result,
    });
  } catch (error) {
    console.error('Generate mess fees error:', error);
    res.status(500).json({ message: 'Error generating mess fees', error: error.message });
  }
};

export const getAllFees = async (req, res) => {
  try {
    const { status, student, page = 1, limit = 1000 } = req.query; // Increased default limit for admin view
    const query = {};

    if (status) query.status = status;
    if (student) query.student = student;

    const fees = await Fee.find(query)
      .populate('student', 'name studentId email')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 }); // Sort by creation date to show newest first

    const total = await Fee.countDocuments(query);

    res.json({
      fees,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total,
    });
  } catch (error) {
    console.error('Get fees error:', error);
    res.status(500).json({ message: 'Error fetching fees', error: error.message });
  }
};

// ==================== ATTENDANCE ====================

export const markAttendance = async (req, res) => {
  try {
    const { studentId, staffId, type, date, status, checkIn, checkOut, remarks } = req.body;

    // For students, check if they have a room allocated and are not away
    if (type === 'student') {
      const student = await Student.findById(studentId);
      if (!student) {
        return res.status(404).json({ message: 'Student not found' });
      }
      
      if (!student.room) {
        return res.status(400).json({ 
          message: 'Attendance can only be marked for students with allocated rooms. Please allocate a room to this student first.' 
        });
      }

      // Check if student is away from hostel (has exited but not returned)
      const OutingRequest = (await import('../models/OutingRequest.model.js')).default;
      const activeOuting = await OutingRequest.findOne({
        student: studentId,
        status: 'approved',
        exitTime: { $exists: true },
        returnTime: null,
      });

      if (activeOuting) {
        const exitDate = new Date(activeOuting.exitTime);
        const today = new Date(date || new Date());
        const daysAway = Math.floor((today - exitDate) / (1000 * 60 * 60 * 24));
        
        return res.status(400).json({
          message: `Cannot mark attendance. Student left the hostel on ${exitDate.toLocaleDateString('en-IN')} and has not returned yet.`,
          daysAway,
          exitDate: exitDate.toISOString(),
          expectedReturnDate: activeOuting.expectedReturnDate ? activeOuting.expectedReturnDate.toISOString() : null,
        });
      }
    }

    const attendanceData = {
      type,
      date: date || new Date(),
      status,
      checkIn,
      checkOut,
      remarks,
      markedBy: req.user._id,
    };

    if (type === 'student') {
      attendanceData.student = studentId;
    } else {
      attendanceData.staff = staffId;
    }

    // Check if attendance already exists
    const existingAttendance = await Attendance.findOne({
      [type]: type === 'student' ? studentId : staffId,
      date: new Date(attendanceData.date).toISOString().split('T')[0],
    });

    if (existingAttendance) {
      // Update existing
      const attendance = await Attendance.findByIdAndUpdate(
        existingAttendance._id,
        attendanceData,
        { new: true, runValidators: true }
      ).populate(type, 'name');
      return res.json({ message: 'Attendance updated successfully', attendance });
    }

    // Create new
    const attendance = await Attendance.create(attendanceData);
    const populatedAttendance = await Attendance.findById(attendance._id).populate(type, 'name');

    res.status(201).json({ message: 'Attendance marked successfully', attendance: populatedAttendance });
  } catch (error) {
    console.error('Mark attendance error:', error);
    res.status(500).json({ message: 'Error marking attendance', error: error.message });
  }
};

export const getAttendance = async (req, res) => {
  try {
    const { type, startDate, endDate, studentId, staffId } = req.query;
    const query = { type };

    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }

    if (type === 'student' && studentId) query.student = studentId;
    if (type === 'staff' && staffId) query.staff = staffId;

    let attendance = await Attendance.find(query)
      .populate('student', 'name studentId course year batchYear room')
      .populate('staff', 'name staffId')
      .populate('markedBy', 'name')
      .sort({ date: -1 });

    // Filter to only show attendance for students with allocated rooms
    if (type === 'student') {
      attendance = attendance.filter(record => {
        // Check if student exists and has a room
        return record.student && record.student.room;
      });
    }

    res.json(attendance);
  } catch (error) {
    console.error('Get attendance error:', error);
    res.status(500).json({ message: 'Error fetching attendance', error: error.message });
  }
};

// ==================== COMPLAINTS ====================

export const getAllComplaints = async (req, res) => {
  try {
    const { status, priority, assignedTo } = req.query;
    const query = {};

    if (status) query.status = status;
    if (priority) query.priority = priority;
    if (assignedTo) query.assignedTo = assignedTo;

    const complaints = await Complaint.find(query)
      .populate('student', 'name studentId email phone course year batchYear')
      .populate('room', 'roomNumber block building')
      .populate('assignedTo', 'name staffId')
      .populate('resolvedBy', 'name')
      .sort({ createdAt: -1 });

    // Ensure studentIdentity is populated with complete details
    const enrichedComplaints = complaints.map(complaint => {
      const complaintObj = complaint.toObject();
      
      // If studentIdentity is missing or incomplete, populate from student
      if (complaint.student) {
        if (!complaintObj.studentIdentity || !complaintObj.studentIdentity.phone || !complaintObj.studentIdentity.email) {
          complaintObj.studentIdentity = {
            name: complaint.student.name || complaintObj.studentIdentity?.name || null,
            admissionNumber: complaint.student.studentId || complaintObj.studentIdentity?.admissionNumber || null,
            registerNumber: complaint.student.studentId || complaintObj.studentIdentity?.registerNumber || null,
            course: complaint.student.course || complaintObj.studentIdentity?.course || null,
            batchYear: complaint.student.batchYear || complaintObj.studentIdentity?.batchYear || null,
            year: complaint.student.year || complaintObj.studentIdentity?.year || null,
            roomNumber: complaint.room?.roomNumber || complaintObj.studentIdentity?.roomNumber || null,
            phone: complaint.student.phone || complaintObj.studentIdentity?.phone || null,
            email: complaint.student.email || complaintObj.studentIdentity?.email || null,
          };
        }
      }
      
      return complaintObj;
    });

    res.json(enrichedComplaints);
  } catch (error) {
    console.error('Get complaints error:', error);
    res.status(500).json({ message: 'Error fetching complaints', error: error.message });
  }
};

export const updateComplaint = async (req, res) => {
  try {
    const { status, assignedTo, resolutionNotes } = req.body;

    // Validate status - only 'requested' and 'resolved' are allowed
    if (status && !['requested', 'resolved'].includes(status)) {
      return res.status(400).json({ 
        message: 'Invalid status. Only "requested" and "resolved" statuses are allowed.' 
      });
    }

    const updateData = {};
    if (status) updateData.status = status;
    if (assignedTo) updateData.assignedTo = assignedTo;
    if (resolutionNotes) updateData.resolutionNotes = resolutionNotes;

    if (status === 'resolved') {
      updateData.resolvedAt = new Date();
      updateData.resolvedBy = req.user._id;
    }

    const complaint = await Complaint.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
      runValidators: true,
    })
      .populate('student', 'name studentId')
      .populate('assignedTo', 'name staffId')
      .populate('resolvedBy', 'name');

    if (!complaint) {
      return res.status(404).json({ message: 'Complaint not found' });
    }

    // Send notification to student if resolved
    if (status === 'resolved') {
      const student = await Student.findById(complaint.student).populate('user');
      if (student && student.user) {
        await createNotification(
          {
            title: 'Complaint Resolved',
            message: `Your complaint "${complaint.title}" has been resolved`,
            type: 'complaint',
            recipient: student.user._id,
            relatedEntity: {
              entityType: 'complaint',
              entityId: complaint._id,
            },
          },
          { origin: 'admin' }
        );
      }
    }

    res.json({ message: 'Complaint updated successfully', complaint });
  } catch (error) {
    console.error('Update complaint error:', error);
    res.status(500).json({ message: 'Error updating complaint', error: error.message });
  }
};

// ==================== INVENTORY ====================

export const createInventoryItem = async (req, res) => {
  try {
    const { name, isStudentEligible } = req.body;
    
    // Auto-detect student eligibility based on item name
    const studentEligibleItems = ['chair', 'table', 'lamp', 'bucket', 'mug', 'plate', 'cup', 'bed', 'broom', 'dustbin', 'dustpan'];
    const itemNameLower = name?.toLowerCase().trim();
    const isEligibleItem = studentEligibleItems.some(item => itemNameLower === item.toLowerCase());
    
    // Validate: if isStudentEligible is explicitly set to true, item must be in eligible list
    if (isStudentEligible && !isEligibleItem) {
      return res.status(400).json({ 
        message: `Only these items can be student-eligible: ${studentEligibleItems.join(', ')}` 
      });
    }
    
    // Auto-set isStudentEligible if item name matches eligible items
    const finalIsStudentEligible = isEligibleItem ? (isStudentEligible !== false) : false;

    // Set default location if not provided
    const inventoryData = {
      ...req.body,
      location: req.body.location || 'General Store',
      isStudentEligible: finalIsStudentEligible,
      managedBy: req.user._id,
    };

    const inventory = await Inventory.create(inventoryData);
    res.status(201).json({ message: 'Inventory item created successfully', inventory });
  } catch (error) {
    console.error('Create inventory error:', error);
    res.status(500).json({ message: 'Error creating inventory item', error: error.message });
  }
};

export const getAllInventory = async (req, res) => {
  try {
    const { category, status, room } = req.query;
    const query = {};

    if (category) query.category = category;
    if (status) query.status = status;
    if (room) query.room = room;

    const inventory = await Inventory.find(query)
      .populate('room', 'roomNumber building')
      .populate('managedBy', 'name')
      .sort({ createdAt: -1 });

    res.json(inventory);
  } catch (error) {
    console.error('Get inventory error:', error);
    res.status(500).json({ message: 'Error fetching inventory', error: error.message });
  }
};

// ==================== INVENTORY REQUESTS (STUDENT) ====================

/**
 * Get all student inventory requests (for admin visibility)
 */
export const getAllInventoryRequests = async (req, res) => {
  try {
    const { status } = req.query;
    const query = {};

    if (status) {
      query.status = status;
    }

    const requests = await InventoryRequest.find(query)
      .populate('student', 'name studentId room')
      .populate('student.room', 'roomNumber block building')
      .populate('inventoryItem', 'name category unit')
      .populate('reviewedBy', 'name staffId')
      .populate('issuedBy', 'name staffId')
      .populate('returnedBy', 'name staffId')
      .sort({ createdAt: -1 });

    res.json(requests);
  } catch (error) {
    console.error('Get all inventory requests error:', error);
    res.status(500).json({ message: 'Error fetching inventory requests', error: error.message });
  }
};

export const updateInventoryItem = async (req, res) => {
  try {
    const inventory = await Inventory.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    })
      .populate('room', 'roomNumber')
      .populate('managedBy', 'name');

    if (!inventory) {
      return res.status(404).json({ message: 'Inventory item not found' });
    }

    res.json({ message: 'Inventory item updated successfully', inventory });
  } catch (error) {
    console.error('Update inventory error:', error);
    res.status(500).json({ message: 'Error updating inventory item', error: error.message });
  }
};

// ==================== STOCK REQUESTS ====================

export const getAllStockRequests = async (req, res) => {
  try {
    const { status, type } = req.query;
    const query = {};

    if (status) query.status = status;
    if (type) query.type = type;

    const StockRequest = (await import('../models/StockRequest.model.js')).default;
    const requests = await StockRequest.find(query)
      .populate('requestedBy', 'name staffId department')
      .populate('reviewedBy', 'name')
      .sort({ createdAt: -1 });

    res.json(requests);
  } catch (error) {
    console.error('Get stock requests error:', error);
    res.status(500).json({ message: 'Error fetching stock requests', error: error.message });
  }
};

export const updateStockRequestStatus = async (req, res) => {
  try {
    const { status, reviewNotes } = req.body;
    const { id } = req.params;

    if (!status || !['pending', 'approved', 'rejected', 'fulfilled'].includes(status)) {
      return res.status(400).json({ message: 'Valid status is required' });
    }

    const StockRequest = (await import('../models/StockRequest.model.js')).default;
    const request = await StockRequest.findById(id).populate('requestedBy', 'name staffId user');

    if (!request) {
      return res.status(404).json({ message: 'Stock request not found' });
    }

    request.status = status;
    if (reviewNotes) request.reviewNotes = reviewNotes.trim();
    request.reviewedBy = req.user._id;
    request.reviewedAt = new Date();

    if (status === 'fulfilled') {
      request.fulfilledAt = new Date();
    }

    await request.save();

    const populatedRequest = await StockRequest.findById(request._id)
      .populate('requestedBy', 'name staffId department')
      .populate('reviewedBy', 'name');

    // Send notification to staff
    if (request.requestedBy && request.requestedBy.user) {
      await createNotification(
        {
          title: `Stock Request ${status === 'approved' ? 'Approved' : status === 'rejected' ? 'Rejected' : 'Fulfilled'}`,
          message: `Your ${request.type === 'stock_out_report' ? 'stock out report' : 'stock request'} for ${request.itemName} has been ${status}.${reviewNotes ? ` Note: ${reviewNotes}` : ''}`,
          type: 'inventory',
          recipient: request.requestedBy.user,
          relatedEntity: {
            entityType: 'stockRequest',
            entityId: request._id,
          },
        },
        { origin: 'admin' }
      );
    }

    res.json({ message: `Stock request ${status} successfully`, request: populatedRequest });
  } catch (error) {
    console.error('Update stock request status error:', error);
    res.status(500).json({ message: 'Error updating stock request status', error: error.message });
  }
};

// ==================== VISITOR LOGS ====================

export const createVisitorLog = async (req, res) => {
  try {
    const visitorLog = await VisitorLog.create({
      ...req.body,
      loggedBy: req.user._id,
    });

    const populatedLog = await VisitorLog.findById(visitorLog._id)
      .populate('student', 'name studentId')
      .populate('room', 'roomNumber')
      .populate('loggedBy', 'name');

    res.status(201).json({ message: 'Visitor logged successfully', visitorLog: populatedLog });
  } catch (error) {
    console.error('Create visitor log error:', error);
    res.status(500).json({ message: 'Error logging visitor', error: error.message });
  }
};

export const getAllVisitorLogs = async (req, res) => {
  try {
    const { status, student, startDate, endDate } = req.query;
    const query = {};

    if (status) query.status = status;
    if (student) query.student = student;
    if (startDate || endDate) {
      query.checkIn = {};
      if (startDate) query.checkIn.$gte = new Date(startDate);
      if (endDate) query.checkIn.$lte = new Date(endDate);
    }

    const visitorLogs = await VisitorLog.find(query)
      .populate('student', 'name studentId')
      .populate('room', 'roomNumber')
      .populate('loggedBy', 'name')
      .sort({ checkIn: -1 });

    res.json(visitorLogs);
  } catch (error) {
    console.error('Get visitor logs error:', error);
    res.status(500).json({ message: 'Error fetching visitor logs', error: error.message });
  }
};

/**
 * Get all vendor logs (vendors only, with IN/OUT times)
 * Returns one entry per vendor visit (entries with inTime)
 */
export const getAllVendorLogs = async (req, res) => {
  try {
    const VendorLog = (await import('../models/VendorLog.model.js')).default;
    const { direction, type, startDate, endDate } = req.query;
    const query = { inTime: { $exists: true } }; // Only entries that have inTime (actual visits)

    if (direction === 'IN') {
      query.outTime = null; // Only entries that haven't checked out
    } else if (direction === 'OUT') {
      query.outTime = { $exists: true, $ne: null }; // Only entries that have checked out
    }

    if (type) query.type = type;
    if (startDate || endDate) {
      query.inTime = query.inTime || {};
      if (startDate) query.inTime.$gte = new Date(startDate);
      if (endDate) query.inTime.$lte = new Date(endDate);
    }

    const vendorLogs = await VendorLog.find(query)
      .populate('loggedBy', 'name')
      .sort({ inTime: -1 })
      .limit(500);

    res.json(vendorLogs);
  } catch (error) {
    console.error('Get vendor logs error:', error);
    res.status(500).json({ message: 'Error fetching vendor logs', error: error.message });
  }
};

export const checkoutVisitor = async (req, res) => {
  try {
    const visitorLog = await VisitorLog.findByIdAndUpdate(
      req.params.id,
      {
        checkOut: new Date(),
        status: 'checked_out',
      },
      { new: true }
    )
      .populate('student', 'name studentId')
      .populate('room', 'roomNumber');

    if (!visitorLog) {
      return res.status(404).json({ message: 'Visitor log not found' });
    }

    res.json({ message: 'Visitor checked out successfully', visitorLog });
  } catch (error) {
    console.error('Checkout visitor error:', error);
    res.status(500).json({ message: 'Error checking out visitor', error: error.message });
  }
};

// ==================== OUTING REQUESTS ====================

export const getAllOutingRequests = async (req, res) => {
  try {
    const { status, student } = req.query;
    const query = {};

    if (status) query.status = status;
    if (student) query.student = student;

    const requests = await OutingRequest.find(query)
      .populate('student', 'name studentId email')
      .populate('approvedBy', 'name')
      .populate('exitScannedBy', 'name')
      .populate('returnScannedBy', 'name')
      .sort({ departureDate: -1 });

    res.json(requests);
  } catch (error) {
    console.error('Get outing requests error:', error);
    res.status(500).json({ message: 'Error fetching outing requests', error: error.message });
  }
};

export const approveOutingRequest = async (req, res) => {
  try {
    const { remarks } = req.body;

    const request = await OutingRequest.findById(req.params.id)
      .populate('student', 'name studentId email');

    if (!request) {
      return res.status(404).json({ message: 'Outing request not found' });
    }

    // Generate QR code for approved outpass
    const { generateOutpassQRCode } = await import('../utils/qrCodeGenerator.js');
    const { qrCode, qrCodeData } = await generateOutpassQRCode(
      request._id.toString(),
      request.student._id.toString(),
      request.student.name
    );

    // Update request with approval and QR code
    request.status = 'approved';
    request.approvedBy = req.user._id;
    request.approvedAt = new Date();
    request.qrCode = qrCode;
    request.qrCodeData = qrCodeData;
    if (remarks) request.remarks = remarks;
    
    await request.save();

    const updatedRequest = await OutingRequest.findById(request._id)
      .populate('student', 'name studentId email')
      .populate('approvedBy', 'name');

    // Get student user for notification
    const student = await Student.findById(request.student._id).populate('user');
    if (student && student.user) {
      await createNotification(
        {
          title: 'Outpass Request Approved',
          message: `Your outpass request for ${request.destination} has been approved. Please check your dashboard for the QR code.`,
          type: 'outing',
          recipient: student.user._id,
          recipientRole: 'student',
          relatedEntity: {
            entityType: 'outing',
            entityId: request._id,
          },
        },
        { origin: 'admin' }
      );
    } else {
      // Fallback: send to all students if user not found
      await createNotification(
        {
          title: 'Outpass Request Approved',
          message: `Your outpass request for ${request.destination} has been approved. Please check your dashboard for the QR code.`,
          type: 'outing',
          recipientRole: 'student',
          relatedEntity: {
            entityType: 'outing',
            entityId: request._id,
          },
        },
        { origin: 'admin' }
      );
    }

    // Send email notification to parent when admin approves
    const parent = await Parent.findOne({ students: student._id }).populate('user');
    if (parent && parent.user && parent.user.email) {
      try {
        const departureDateStr = new Date(request.departureDate).toLocaleString('en-IN', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        });
        const expectedReturnDateStr = new Date(request.expectedReturnDate).toLocaleString('en-IN', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        });

        const emailMessage = `
          <p>Dear ${parent.name},</p>
          
          <p>This is to inform you that your child <strong>${student.name}</strong> (ID: ${student.studentId || student.admissionNumber}) has been approved to leave the hostel.</p>
          
          <div style="background: white; padding: 20px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #667eea;">
            <table style="width: 100%; margin: 10px 0;">
              <tr>
                <td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold; width: 40%;">Student Name:</td>
                <td style="padding: 8px; border-bottom: 1px solid #eee;">${student.name}</td>
              </tr>
              <tr>
                <td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;">Student ID:</td>
                <td style="padding: 8px; border-bottom: 1px solid #eee;">${student.studentId || student.admissionNumber}</td>
              </tr>
              <tr>
                <td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;">Destination:</td>
                <td style="padding: 8px; border-bottom: 1px solid #eee;">${request.destination || 'N/A'}</td>
              </tr>
              <tr>
                <td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;">Purpose:</td>
                <td style="padding: 8px; border-bottom: 1px solid #eee;">${request.purpose || 'N/A'}</td>
              </tr>
              <tr>
                <td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;">Departure Date:</td>
                <td style="padding: 8px; border-bottom: 1px solid #eee;">${departureDateStr}</td>
              </tr>
              <tr>
                <td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;">Expected Return Date:</td>
                <td style="padding: 8px; border-bottom: 1px solid #eee;">${expectedReturnDateStr}</td>
              </tr>
              ${request.emergencyContact ? `
              <tr>
                <td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;">Emergency Contact:</td>
                <td style="padding: 8px; border-bottom: 1px solid #eee;">${request.emergencyContact.name || 'N/A'} - ${request.emergencyContact.phone || 'N/A'}</td>
              </tr>
              ` : ''}
            </table>
          </div>
          
          <div style="background: #fff3cd; border: 1px solid #ffc107; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <p><strong>Note:</strong> Your child's outpass request has been approved. You will receive another notification when they actually exit the hostel and when they return.</p>
          </div>
          
          <p>If you have any concerns, please contact the hostel administration.</p>
        `;

        await sendNotificationEmail({
          to: parent.user.email,
          subject: `Outpass Request Approved for ${student.name}`,
          message: emailMessage,
        });
        console.log(`✅ Parent notification email sent to ${parent.user.email} for outing approval`);
      } catch (emailError) {
        console.error('❌ Error sending email to parent on approval:', emailError);
        // Don't fail the request if email fails
      }
    }

    res.json({ message: 'Outpass request approved successfully. QR code generated.', request: updatedRequest });
  } catch (error) {
    console.error('Approve outing request error:', error);
    res.status(500).json({ message: 'Error approving outing request', error: error.message });
  }
};

export const rejectOutingRequest = async (req, res) => {
  try {
    const { rejectionReason } = req.body;

    const request = await OutingRequest.findByIdAndUpdate(
      req.params.id,
      {
        status: 'rejected',
        rejectionReason,
      },
      { new: true }
    )
      .populate('student', 'name studentId email');

    if (!request) {
      return res.status(404).json({ message: 'Outing request not found' });
    }

    // Get student user for notification
    const student = await Student.findById(request.student).populate('user');
    if (student && student.user) {
      await createNotification(
        {
          title: 'Outing Request Rejected',
          message: `Your outing request has been rejected. Reason: ${rejectionReason}`,
          type: 'outing',
          recipient: student.user._id,
          recipientRole: 'student',
          relatedEntity: {
            entityType: 'outing',
            entityId: request._id,
          },
        },
        { origin: 'admin' }
      );
    } else {
      // Fallback: send to all students if user not found
      await createNotification(
        {
          title: 'Outing Request Rejected',
          message: `Your outing request has been rejected. Reason: ${rejectionReason}`,
          type: 'outing',
          recipientRole: 'student',
          relatedEntity: {
            entityType: 'outing',
            entityId: request._id,
          },
        },
        { origin: 'admin' }
      );
    }

    res.json({ message: 'Outing request rejected successfully', request });
  } catch (error) {
    console.error('Reject outing request error:', error);
    res.status(500).json({ message: 'Error rejecting outing request', error: error.message });
  }
};

// ==================== NOTIFICATIONS ====================

export const sendNotification = async (req, res) => {
  try {
    const { title, message, type, recipientId, recipientRole, relatedEntity, notifyStaff: notifyStaffFlag } = req.body;

    const notifyStaff =
      notifyStaffFlag === true ||
      recipientRole === 'student' ||
      recipientRole === 'admin' ||
      (!recipientRole && !!recipientId);

    const notification = await createNotification(
      {
        title,
        message,
        type,
        recipient: recipientId,
        recipientRole: recipientRole || 'all',
        relatedEntity,
      },
      { notifyStaff, origin: 'admin' }
    );

    res.status(201).json({ message: 'Notification sent successfully', notification });
  } catch (error) {
    console.error('Send notification error:', error);
    res.status(500).json({ message: 'Error sending notification', error: error.message });
  }
};

export const getAllNotifications = async (req, res) => {
  try {
    const { recipientRole, type, isRead } = req.query;
    const query = {
      // Admin can see notifications for all roles: student, staff, parent, and admin
      // Also include notifications sent directly to admin or with 'all' role
      $or: [
        { recipientRole: 'student' },
        { recipientRole: 'staff' },
        { recipientRole: 'parent' },
        { recipientRole: 'admin' },
        { recipientRole: 'all' },
        { recipient: req.user._id }, // Direct notifications to admin
      ],
    };

    // Optional filters
    if (recipientRole) {
      // If filtering by specific role, override the $or condition
      query.$or = [
        { recipientRole: recipientRole },
        { recipient: req.user._id },
      ];
    }
    if (type) query.type = type;
    if (isRead !== undefined) query.isRead = isRead === 'true';

    const notifications = await Notification.find(query)
      .populate('recipient', 'name email')
      .sort({ sentAt: -1 })
      .limit(50);

    // Populate student and parent details from related entities
    const Student = (await import('../models/Student.model.js')).default;
    const Payment = (await import('../models/Payment.model.js')).default;
    const Complaint = (await import('../models/Complaint.model.js')).default;
    const RoomChangeRequest = (await import('../models/RoomChangeRequest.model.js')).default;
    const Parent = (await import('../models/Parent.model.js')).default;

    const enrichedNotifications = await Promise.all(
      notifications.map(async (notification) => {
        // If student details already exist, keep them
        if (notification.studentDetails && notification.studentDetails.name) {
          return notification;
        }

        // Try to populate from related entity
        if (notification.relatedEntity && notification.relatedEntity.entityId) {
          try {
            let student = null;

            if (notification.relatedEntity.entityType === 'payment') {
              const payment = await Payment.findById(notification.relatedEntity.entityId)
                .populate({
                  path: 'student',
                  populate: {
                    path: 'room',
                    select: 'roomNumber block'
                  }
                });
              if (payment && payment.student) {
                student = payment.student;
              }
            } else if (notification.relatedEntity.entityType === 'complaint') {
              const complaint = await Complaint.findById(notification.relatedEntity.entityId)
                .populate('student')
                .populate('room', 'roomNumber block');
              if (complaint && complaint.student) {
                student = complaint.student;
                if (complaint.room) {
                  student = { ...student.toObject(), room: complaint.room };
                }
              }
            } else if (notification.relatedEntity.entityType === 'roomChangeRequest') {
              const roomChangeRequest = await RoomChangeRequest.findById(notification.relatedEntity.entityId)
                .populate('student')
                .populate('currentRoom', 'roomNumber block');
              if (roomChangeRequest && roomChangeRequest.student) {
                student = roomChangeRequest.student;
                if (roomChangeRequest.currentRoom) {
                  student = { ...student.toObject(), room: roomChangeRequest.currentRoom };
                }
              }
            }

            // If we found a student, populate student details
            if (student) {
              const studentObj = student.toObject ? student.toObject() : student;
              notification.studentDetails = {
                name: studentObj.name || null,
                studentId: studentObj.studentId || null,
                admissionNumber: studentObj.studentId || null,
                course: studentObj.course || null,
                batchYear: studentObj.batchYear || null,
                roomNumber: studentObj.room?.roomNumber || null,
                block: studentObj.room?.block || null,
              };
            }

            // Populate parent details if origin is parent
            if (notification.origin === 'parent' && notification.recipient) {
              const recipientUser = notification.recipient;
              const parentAccount = await Parent.findOne({ user: recipientUser._id });
              if (parentAccount) {
                notification.parentDetails = {
                  name: parentAccount.name || recipientUser.name,
                  email: parentAccount.email || recipientUser.email,
                };
              }
            }
          } catch (populateError) {
            console.error('Error populating details for notification:', populateError);
          }
        }

        return notification;
      })
    );

    res.json(enrichedNotifications);
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({ message: 'Error fetching notifications', error: error.message });
  }
};

/**
 * Mark notification as read
 */
export const markNotificationAsRead = async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id);

    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    notification.isRead = true;
    notification.readAt = new Date();
    await notification.save();

    res.json({ message: 'Notification marked as read', notification });
  } catch (error) {
    console.error('Mark notification as read error:', error);
    res.status(500).json({ message: 'Error marking notification as read', error: error.message });
  }
};

/**
 * Get meal suggestions
 */
export const getMealSuggestions = async (req, res) => {
  try {
    const { mealSlot, status } = req.query;
    const MealSuggestion = (await import('../models/MealSuggestion.model.js')).default;
    const Student = (await import('../models/Student.model.js')).default;
    const Room = (await import('../models/Room.model.js')).default;

    const query = {};
    if (mealSlot) query.mealSlot = mealSlot.toLowerCase();
    if (status) query.status = status;

    const suggestions = await MealSuggestion.find(query)
      .populate('student', 'name studentId course batchYear')
      .populate('reviewedBy', 'name')
      .sort({ createdAt: -1 })
      .limit(100);

    // Enhance suggestions with student identity and room info
    const enhancedSuggestions = await Promise.all(
      suggestions.map(async (suggestion) => {
        const suggestionObj = suggestion.toObject();
        
        // If studentIdentity is not populated, populate it from student
        if (suggestion.student && !suggestionObj.studentIdentity) {
          const student = await Student.findById(suggestion.student._id).populate('room');
          if (student) {
            suggestionObj.studentIdentity = {
              name: student.name,
              admissionNumber: student.admissionNumber || student.studentId,
              studentId: student.studentId,
              course: student.course,
              batchYear: student.batchYear,
              roomNumber: student.room?.roomNumber,
              block: student.room?.block || student.room?.building,
            };
          }
        }
        
        return suggestionObj;
      })
    );

    res.json(enhancedSuggestions);
  } catch (error) {
    console.error('Get meal suggestions error:', error);
    res.status(500).json({ message: 'Error fetching meal suggestions', error: error.message });
  }
};

/**
 * Get meal suggestion preference chart (aggregated data)
 */
export const getMealSuggestionPreferences = async (req, res) => {
  try {
    const { mealSlot } = req.query;
    const MealSuggestion = (await import('../models/MealSuggestion.model.js')).default;
    const Student = (await import('../models/Student.model.js')).default;

    const query = { status: { $in: ['pending', 'reviewed'] } };
    if (mealSlot) query.mealSlot = mealSlot.toLowerCase();

    const suggestions = await MealSuggestion.find(query)
      .populate('student', 'name studentId admissionNumber course batchYear');

    // Aggregate suggestions by text (case-insensitive, normalized)
    const suggestionMap = new Map();

    suggestions.forEach((suggestion) => {
      const normalizedText = suggestion.suggestion.trim().toLowerCase();
      const studentName = suggestion.studentIdentity?.name || suggestion.student?.name || 'Unknown';
      const studentId = suggestion.studentIdentity?.admissionNumber || 
                       suggestion.studentIdentity?.studentId || 
                       suggestion.student?.admissionNumber || 
                       suggestion.student?.studentId || 
                       'N/A';
      
      if (suggestionMap.has(normalizedText)) {
        const existing = suggestionMap.get(normalizedText);
        existing.count += 1;
        existing.students.push({
          name: studentName,
          studentId: studentId,
        });
      } else {
        suggestionMap.set(normalizedText, {
          suggestion: suggestion.suggestion.trim(),
          mealSlot: suggestion.mealSlot,
          count: 1,
          students: [{
            name: studentName,
            studentId: studentId,
          }],
          status: suggestion.status,
        });
      }
    });

    // Convert to array and sort by count (most popular first)
    const preferences = Array.from(suggestionMap.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 20); // Top 20 most common suggestions

    // Group by meal slot for chart data
    const chartData = {
      breakfast: preferences.filter(p => p.mealSlot === 'breakfast'),
      lunch: preferences.filter(p => p.mealSlot === 'lunch'),
      dinner: preferences.filter(p => p.mealSlot === 'dinner'),
    };

    res.json({
      preferences,
      chartData,
      totalSuggestions: suggestions.length,
      uniqueSuggestions: preferences.length,
    });
  } catch (error) {
    console.error('Get meal suggestion preferences error:', error);
    res.status(500).json({ message: 'Error fetching meal suggestion preferences', error: error.message });
  }
};

/**
 * Update meal suggestion status
 */
export const updateMealSuggestionStatus = async (req, res) => {
  try {
    const { status, reviewNotes, implementDate } = req.body;
    const { id } = req.params;

    if (!status || !['pending', 'reviewed', 'implemented', 'rejected'].includes(status)) {
      return res.status(400).json({ message: 'Valid status is required' });
    }

    const MealSuggestion = (await import('../models/MealSuggestion.model.js')).default;
    const DailyMeal = (await import('../models/DailyMeal.model.js')).default;
    const Student = (await import('../models/Student.model.js')).default;

    const suggestion = await MealSuggestion.findById(id).populate('student', 'name');

    if (!suggestion) {
      return res.status(404).json({ message: 'Meal suggestion not found' });
    }

    const previousStatus = suggestion.status;
    suggestion.status = status;
    if (reviewNotes) suggestion.reviewNotes = reviewNotes.trim();
    suggestion.reviewedBy = req.user._id;
    suggestion.reviewedAt = new Date();

    // If marking as implemented, set implementedAt and update the meal
    if (status === 'implemented' && previousStatus !== 'implemented') {
      suggestion.implementedAt = new Date();
      
      // Set the implementation date (default to today if not provided)
      const targetDate = implementDate ? new Date(implementDate) : new Date();
      targetDate.setHours(0, 0, 0, 0); // Reset time to midnight
      suggestion.implementedForDate = targetDate;

      // Get day of week
      const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      const dayOfWeek = dayNames[targetDate.getDay()];

      // Find or create daily meal for that date
      let dailyMeal = await DailyMeal.findOne({ date: targetDate });
      
      if (!dailyMeal) {
        // Create new daily meal with default values
        dailyMeal = new DailyMeal({
          date: targetDate,
          dayOfWeek: dayOfWeek,
          breakfast: 'Poha & Milk',
          lunch: 'Rice, Dal, Curry',
          dinner: 'Chapati & Paneer',
          updatedBy: req.user._id,
        });
      }

      // Update the specific meal slot
      const mealSlot = suggestion.mealSlot.toLowerCase();
      dailyMeal[mealSlot] = suggestion.suggestion;
      
      // Track that this meal is from a suggestion
      if (!dailyMeal.fromSuggestion) {
        dailyMeal.fromSuggestion = {
          breakfast: {},
          lunch: {},
          dinner: {},
        };
      }
      
      dailyMeal.fromSuggestion[mealSlot] = {
        suggestionId: suggestion._id,
        studentName: suggestion.student?.name || suggestion.studentIdentity?.name || 'Unknown Student',
      };
      
      dailyMeal.updatedBy = req.user._id;
      await dailyMeal.save();
    }

    await suggestion.save();

    res.json({ 
      message: status === 'implemented' 
        ? `Meal suggestion implemented successfully! ${suggestion.mealSlot.charAt(0).toUpperCase() + suggestion.mealSlot.slice(1)} menu updated for ${suggestion.implementedForDate?.toDateString()}.`
        : 'Meal suggestion status updated successfully',
      suggestion 
    });
  } catch (error) {
    console.error('Update meal suggestion status error:', error);
    res.status(500).json({ message: 'Error updating meal suggestion status', error: error.message });
  }
};

/**
 * Get daily meals for a date range
 */
export const getDailyMeals = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const DailyMeal = (await import('../models/DailyMeal.model.js')).default;

    const query = {};
    
    if (startDate && endDate) {
      query.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    } else if (startDate) {
      // Get single day
      const date = new Date(startDate);
      date.setHours(0, 0, 0, 0);
      query.date = date;
    } else {
      // Default to current week
      const today = new Date();
      const startOfWeek = new Date(today);
      startOfWeek.setDate(today.getDate() - today.getDay()); // Sunday
      startOfWeek.setHours(0, 0, 0, 0);
      
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6); // Saturday
      endOfWeek.setHours(23, 59, 59, 999);
      
      query.date = {
        $gte: startOfWeek,
        $lte: endOfWeek,
      };
    }

    const meals = await DailyMeal.find(query)
      .populate('updatedBy', 'name')
      .sort({ date: 1 });

    res.json(meals);
  } catch (error) {
    console.error('Get daily meals error:', error);
    res.status(500).json({ message: 'Error fetching daily meals', error: error.message });
  }
};

/**
 * Get all staff leave requests
 */
export const getAllStaffLeaveRequests = async (req, res) => {
  try {
    const { status, date } = req.query;
    const StaffLeaveRequest = (await import('../models/StaffLeaveRequest.model.js')).default;

    const query = {};
    if (status) query.status = status;
    if (date) {
      const dateObj = new Date(date);
      dateObj.setHours(0, 0, 0, 0);
      const nextDay = new Date(dateObj);
      nextDay.setDate(nextDay.getDate() + 1);
      query.leaveDate = { $gte: dateObj, $lt: nextDay };
    }

    const leaveRequests = await StaffLeaveRequest.find(query)
      .populate('staff', 'name staffId department designation')
      .populate('reviewedBy', 'name')
      .sort({ leaveDate: 1, createdAt: -1 })
      .limit(100);

    res.json(leaveRequests);
  } catch (error) {
    console.error('Get staff leave requests error:', error);
    res.status(500).json({ message: 'Error fetching staff leave requests', error: error.message });
  }
};

/**
 * Update staff leave request status
 */
export const updateStaffLeaveRequestStatus = async (req, res) => {
  try {
    const { status, reviewNotes } = req.body;
    const { id } = req.params;

    if (!status || !['pending', 'approved', 'rejected'].includes(status)) {
      return res.status(400).json({ message: 'Valid status is required' });
    }

    const StaffLeaveRequest = (await import('../models/StaffLeaveRequest.model.js')).default;

    const leaveRequest = await StaffLeaveRequest.findById(id).populate('staff', 'name staffId');

    if (!leaveRequest) {
      return res.status(404).json({ message: 'Leave request not found' });
    }

    leaveRequest.status = status;
    if (reviewNotes) leaveRequest.reviewNotes = reviewNotes.trim();
    leaveRequest.reviewedBy = req.user._id;
    leaveRequest.reviewedAt = new Date();

    await leaveRequest.save();

    // Send notification to staff
    if (leaveRequest.staff && leaveRequest.staff.user) {
      await createNotification(
        {
          title: `Leave Request ${status === 'approved' ? 'Approved' : 'Rejected'}`,
          message: `Your leave request for ${new Date(leaveRequest.leaveDate).toLocaleDateString()} has been ${status === 'approved' ? 'approved' : 'rejected'}.${reviewNotes ? ` Note: ${reviewNotes}` : ''}`,
          type: 'general',
          recipient: leaveRequest.staff.user,
          relatedEntity: {
            entityType: 'staffLeaveRequest',
            entityId: leaveRequest._id,
          },
        },
        { origin: 'admin' }
      );
    }

    res.json({ message: `Leave request ${status} successfully`, leaveRequest });
  } catch (error) {
    console.error('Update staff leave request status error:', error);
    res.status(500).json({ message: 'Error updating leave request status', error: error.message });
  }
};

/**
 * Update staff schedule (shift, department, status)
 */
export const updateStaffSchedule = async (req, res) => {
  try {
    const { id } = req.params;
    const { shift, department, status } = req.body;

    const staff = await Staff.findById(id);

    if (!staff) {
      return res.status(404).json({ message: 'Staff not found' });
    }

    // Validate shift if provided
    if (shift && !['Morning', 'Evening', 'Night', 'Full Day'].includes(shift)) {
      return res.status(400).json({ message: 'Invalid shift. Must be one of: Morning, Evening, Night, Full Day' });
    }

    // Validate department if provided
    if (department && !['Housekeeping', 'Maintenance', 'Security', 'Admin', 'Warden', 'Other'].includes(department)) {
      return res.status(400).json({ message: 'Invalid department' });
    }

    // Validate status if provided
    if (status && !['active', 'inactive', 'suspended'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status. Must be one of: active, inactive, suspended' });
    }

    // Update only provided fields
    if (shift) staff.shift = shift;
    if (department) staff.department = department;
    if (status) staff.status = status;

    await staff.save();

    // Send notification to staff if schedule was changed
    // staff.user is already an ObjectId reference, no need to populate
    if (staff.user && (shift || department)) {
      await createNotification(
        {
          title: 'Schedule Updated',
          message: `Your schedule has been updated. ${shift ? `Shift: ${shift}` : ''} ${department ? `Department: ${department}` : ''}`,
          type: 'general',
          recipient: staff.user, // staff.user is already the ObjectId
          relatedEntity: {
            entityType: 'staff',
            entityId: staff._id,
          },
        },
        { origin: 'admin' }
      );
    }

    res.json({ message: 'Staff schedule updated successfully', staff });
  } catch (error) {
    console.error('Update staff schedule error:', error);
    res.status(500).json({ message: 'Error updating staff schedule', error: error.message });
  }
};

/**
 * Set detailed weekly schedule for a staff member
 */
export const setStaffWeeklySchedule = async (req, res) => {
  try {
    const { id } = req.params;
    const { weeklySchedule, todaySchedule, effectiveFrom, effectiveTo } = req.body;

    const staff = await Staff.findById(id);

    if (!staff) {
      return res.status(404).json({ message: 'Staff not found' });
    }

    const StaffSchedule = (await import('../models/StaffSchedule.model.js')).default;

    // Deactivate existing active schedules for this staff
    await StaffSchedule.updateMany(
      { staff: id, isActive: true },
      { isActive: false }
    );

    // Create new schedule
    const scheduleData = {
      staff: id,
      weeklySchedule: weeklySchedule || {},
      todaySchedule: todaySchedule || [],
      isActive: true,
    };

    if (effectiveFrom) scheduleData.effectiveFrom = new Date(effectiveFrom);
    if (effectiveTo) scheduleData.effectiveTo = new Date(effectiveTo);

    const newSchedule = await StaffSchedule.create(scheduleData);

    // Send notification to staff
    if (staff.user) {
      await createNotification(
        {
          title: 'Weekly Schedule Updated',
          message: 'Your weekly schedule has been updated. Please check your schedule page for details.',
          type: 'general',
          recipient: staff.user,
          relatedEntity: {
            entityType: 'staffSchedule',
            entityId: newSchedule._id,
          },
        },
        { origin: 'admin' }
      );
    }

    res.json({ message: 'Staff weekly schedule set successfully', schedule: newSchedule });
  } catch (error) {
    console.error('Set staff weekly schedule error:', error);
    res.status(500).json({ message: 'Error setting staff weekly schedule', error: error.message });
  }
};

/**
 * Get detailed weekly schedule for a staff member
 */
export const getStaffWeeklySchedule = async (req, res) => {
  try {
    const { id } = req.params;

    const StaffSchedule = (await import('../models/StaffSchedule.model.js')).default;

    const schedule = await StaffSchedule.findOne({
      staff: id,
      isActive: true,
    }).populate('staff', 'name staffId department shift');

    if (!schedule) {
      return res.json({ schedule: null });
    }

    res.json({ schedule });
  } catch (error) {
    console.error('Get staff weekly schedule error:', error);
    res.status(500).json({ message: 'Error fetching staff weekly schedule', error: error.message });
  }
};

/**
 * Get admin dashboard stats
 */
export const getDashboardStats = async (req, res) => {
  try {
    // Get total students
    const totalStudents = await Student.countDocuments({ status: 'active' });
    
    // Get total rooms and occupied rooms
    const totalRooms = await Room.countDocuments();
    const occupiedRooms = await Student.countDocuments({ 
      room: { $exists: true, $ne: null },
      status: 'active' 
    });
    
    // Get pending payments (fees with status pending or overdue)
    const pendingPayments = await Fee.countDocuments({
      status: { $in: ['pending', 'overdue'] }
    });
    
    // Get active bookings (students with rooms allocated)
    const activeBookings = await Student.countDocuments({
      room: { $exists: true, $ne: null },
      status: 'active'
    });
    
    // Get total fees (all time)
    const allFees = await Fee.find({});
    const totalFeesAmount = allFees.reduce((sum, fee) => sum + fee.amount, 0);
    const paidFeesAmount = allFees.reduce((sum, fee) => sum + (fee.paidAmount || 0), 0);
    const pendingFeesAmount = totalFeesAmount - paidFeesAmount;
    
    // Get recent registrations (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const recentStudents = await Student.countDocuments({
      createdAt: { $gte: thirtyDaysAgo }
    });
    
    // Get room occupancy trend (last 30 days)
    const occupancyData = [];
    for (let i = 29; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const startOfDay = new Date(date.setHours(0, 0, 0, 0));
      const endOfDay = new Date(date.setHours(23, 59, 59, 999));
      
      const occupied = await Student.countDocuments({
        room: { $exists: true, $ne: null },
        status: 'active',
        updatedAt: { $lte: endOfDay }
      });
      
      occupancyData.push({
        date: startOfDay,
        occupied
      });
    }
    
    // Get student registration trend (last 30 days)
    const registrationData = [];
    for (let i = 29; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const startOfDay = new Date(date.setHours(0, 0, 0, 0));
      const endOfDay = new Date(date.setHours(23, 59, 59, 999));
      
      const newStudents = await Student.countDocuments({
        createdAt: { $gte: startOfDay, $lte: endOfDay }
      });
      
      registrationData.push({
        date: startOfDay,
        newStudents
      });
    }
    
    // Calculate percentage changes (compare to previous month)
    const sixtyDaysAgo = new Date();
    sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);
    const previousMonthStudents = await Student.countDocuments({
      createdAt: { $gte: sixtyDaysAgo, $lt: thirtyDaysAgo },
      status: 'active'
    });
    const studentChange = previousMonthStudents > 0 
      ? ((totalStudents - previousMonthStudents) / previousMonthStudents * 100).toFixed(1)
      : '0';
    
    const previousMonthOccupied = await Student.countDocuments({
      room: { $exists: true, $ne: null },
      status: 'active',
      updatedAt: { $lt: thirtyDaysAgo }
    });
    const roomChange = previousMonthOccupied > 0
      ? ((occupiedRooms - previousMonthOccupied) / previousMonthOccupied * 100).toFixed(1)
      : '0';
    
    const previousMonthPending = await Fee.countDocuments({
      status: { $in: ['pending', 'overdue'] },
      createdAt: { $lt: thirtyDaysAgo }
    });
    const paymentChange = previousMonthPending > 0
      ? ((pendingPayments - previousMonthPending) / previousMonthPending * 100).toFixed(1)
      : '0';
    
    const previousMonthBookings = await Student.countDocuments({
      room: { $exists: true, $ne: null },
      status: 'active',
      updatedAt: { $lt: thirtyDaysAgo }
    });
    const bookingChange = previousMonthBookings > 0
      ? ((activeBookings - previousMonthBookings) / previousMonthBookings * 100).toFixed(1)
      : '0';

    res.json({
      stats: {
        totalStudents,
        occupiedRooms,
        totalRooms,
        pendingPayments,
        activeBookings,
        totalFeesAmount,
        paidFeesAmount,
        pendingFeesAmount,
        recentStudents,
        changes: {
          students: parseFloat(studentChange),
          rooms: parseFloat(roomChange),
          payments: parseFloat(paymentChange),
          bookings: parseFloat(bookingChange)
        }
      },
      trends: {
        occupancy: occupancyData,
        registrations: registrationData
      }
    });
  } catch (error) {
    console.error('Get admin dashboard stats error:', error);
    res.status(500).json({ message: 'Error fetching dashboard stats', error: error.message });
  }
};

/**
 * Get dashboard widget data (room utilization, room types, transactions)
 */
export const getDashboardWidgets = async (req, res) => {
  try {
    const { period = 'days' } = req.query; // 'days', 'month', 'year' for room utilization
    const { roomPeriod = 'routes' } = req.query; // 'routes' (week), 'pages' (month) for room types
    const { transactionType = 'affiliate' } = req.query; // 'affiliate' (payment methods), 'marketing' (payment types)

    const now = new Date();
    let startDate, endDate;

    // Calculate date ranges based on period
    if (period === 'days') {
      startDate = new Date(now);
      startDate.setDate(startDate.getDate() - 7);
      endDate = now;
    } else if (period === 'month') {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
    } else if (period === 'year') {
      startDate = new Date(now.getFullYear(), 0, 1);
      endDate = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
    } else {
      startDate = new Date(now);
      startDate.setDate(startDate.getDate() - 7);
      endDate = now;
    }

    // Room Utilization by Building
    const blocks = await Room.distinct('block');
    const buildings = await Room.distinct('building');
    const allBuildings = [...new Set([...blocks.filter(b => b), ...buildings.filter(b => b && !blocks.includes(b))])];

    const roomUtilizationData = await Promise.all(
      allBuildings.map(async (building) => {
        const rooms = await Room.find({
          $or: [{ block: building }, { building: building }]
        });
        
        const totalRooms = rooms.length;
        const occupiedRooms = rooms.filter(r => {
          const occupancy = r.currentOccupancy || r.occupied || 0;
          return occupancy > 0;
        }).length;
        
        return {
          title: building || 'Unknown Building',
          value: occupiedRooms.toString(),
          totalRooms,
          occupiedRooms
        };
      })
    );

    // Calculate max for progress percentage
    const maxOccupied = Math.max(...roomUtilizationData.map(b => b.occupiedRooms), 1);
    const roomUtilization = roomUtilizationData
      .map(b => ({
        title: b.title,
        value: b.value,
        progress: { value: maxOccupied > 0 ? Math.round((b.occupiedRooms / maxOccupied) * 100) : 0 }
      }))
      .sort((a, b) => parseInt(b.value) - parseInt(a.value))
      .slice(0, 6);

    // Most Booked Room Types
    let roomTypeStartDate, roomTypeEndDate;
    if (roomPeriod === 'routes') {
      roomTypeStartDate = new Date(now);
      roomTypeStartDate.setDate(roomTypeStartDate.getDate() - 7);
      roomTypeEndDate = now;
    } else {
      roomTypeStartDate = new Date(now.getFullYear(), now.getMonth(), 1);
      roomTypeEndDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
    }

    const roomTypes = ['Single', 'Double', 'Triple', 'Quad'];
    const roomTypeData = await Promise.all(
      roomTypes.map(async (roomType) => {
        const rooms = await Room.find({ roomType });
        const roomIds = rooms.map(r => r._id);
        const bookings = await Student.countDocuments({
          room: { $in: roomIds },
          createdAt: { $gte: roomTypeStartDate, $lte: roomTypeEndDate }
        });
        
        return {
          title: `${roomType} Room`,
          value: bookings.toString(),
          bookings
        };
      })
    );

    const maxBookings = Math.max(...roomTypeData.map(r => r.bookings), 1);
    const roomTypeBookings = roomTypeData.map(r => ({
      title: r.title,
      value: r.value,
      progress: { value: maxBookings > 0 ? Math.round((r.bookings / maxBookings) * 100) : 0 }
    }));

    // Transaction Details
    let transactions = [];

    if (transactionType === 'affiliate') {
      // Payment Methods
      const paymentMethods = ['cash', 'bank_transfer', 'credit_card', 'debit_card', 'online_payment', 'upi'];
      const transactionData = await Promise.all(
        paymentMethods.map(async (method) => {
          const count = await Payment.countDocuments({
            paymentMethod: method,
            status: 'completed',
            createdAt: { $gte: startDate, $lte: endDate }
          });
          
          return {
            title: method.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
            value: count.toString(),
            count
          };
        })
      );

      const maxCount = Math.max(...transactionData.map(t => t.count), 1);
      transactions = transactionData.map(t => ({
        title: t.title,
        value: t.value,
        progress: { value: maxCount > 0 ? Math.round((t.count / maxCount) * 100) : 0 }
      }));
    } else {
      // Payment Types
      const paymentTypes = ['rent', 'deposit', 'utility', 'maintenance', 'late_fee', 'other'];
      const transactionData = await Promise.all(
        paymentTypes.map(async (type) => {
          const count = await Payment.countDocuments({
            paymentType: type,
            status: 'completed',
            createdAt: { $gte: startDate, $lte: endDate }
          });
          
          return {
            title: type.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
            value: count.toString(),
            count
          };
        })
      );

      const maxCount = Math.max(...transactionData.map(t => t.count), 1);
      transactions = transactionData.map(t => ({
        title: t.title,
        value: t.value,
        progress: { value: maxCount > 0 ? Math.round((t.count / maxCount) * 100) : 0 }
      }));
    }

    res.json({
      roomUtilization,
      roomTypes: roomTypeBookings,
      transactions
    });
  } catch (error) {
    console.error('Get dashboard widgets error:', error);
    res.status(500).json({ message: 'Error fetching dashboard widgets', error: error.message });
  }
};

// ==================== ROOM CHANGE REQUESTS ====================

/**
 * Get all room change requests
 */
export const getAllRoomChangeRequests = async (req, res) => {
  try {
    const { status } = req.query;
    const query = {};
    if (status) {
      query.status = status;
    }

    const requests = await RoomChangeRequest.find(query)
      .populate('student', 'name studentId course batchYear email phone')
      .populate('currentRoom', 'roomNumber block floor roomType totalPrice capacity currentOccupancy')
      .populate('requestedRoom', 'roomNumber block floor roomType totalPrice capacity currentOccupancy')
      .populate('reviewedBy', 'name')
      .sort({ createdAt: -1 });

    res.json({ requests });
  } catch (error) {
    console.error('Get all room change requests error:', error);
    res.status(500).json({ message: 'Error fetching room change requests', error: error.message });
  }
};

/**
 * Get room change request by ID
 */
export const getRoomChangeRequestById = async (req, res) => {
  try {
    const request = await RoomChangeRequest.findById(req.params.id)
      .populate('student', 'name studentId course batchYear email phone gender')
      .populate('currentRoom', 'roomNumber block floor roomType totalPrice capacity currentOccupancy amenities photos')
      .populate('requestedRoom', 'roomNumber block floor roomType totalPrice capacity currentOccupancy amenities photos')
      .populate('reviewedBy', 'name')
      .populate('paymentId');

    if (!request) {
      return res.status(404).json({ message: 'Room change request not found' });
    }

    // Get current occupants of both rooms
    const currentRoomOccupants = await Student.find({ room: request.currentRoom._id })
      .select('name studentId course batchYear')
      .populate('room', 'roomNumber');

    const requestedRoomOccupants = await Student.find({ room: request.requestedRoom._id })
      .select('name studentId course batchYear')
      .populate('room', 'roomNumber');

    res.json({
      request: {
        ...request.toObject(),
        currentRoomOccupants: currentRoomOccupants.map(s => ({
          name: s.name,
          admissionNumber: s.studentId,
          course: s.course,
          batchYear: s.batchYear,
        })),
        requestedRoomOccupants: requestedRoomOccupants.map(s => ({
          name: s.name,
          admissionNumber: s.studentId,
          course: s.course,
          batchYear: s.batchYear,
        })),
      },
    });
  } catch (error) {
    console.error('Get room change request by ID error:', error);
    res.status(500).json({ message: 'Error fetching room change request', error: error.message });
  }
};

/**
 * Approve room change request
 */
export const approveRoomChangeRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const { adminNotes } = req.body;

    const roomChangeRequest = await RoomChangeRequest.findById(id)
      .populate('student')
      .populate('currentRoom')
      .populate('requestedRoom');

    if (!roomChangeRequest) {
      return res.status(404).json({ message: 'Room change request not found' });
    }

    if (roomChangeRequest.status === 'approved' || roomChangeRequest.status === 'completed') {
      return res.status(400).json({ message: 'Room change request has already been approved' });
    }

    if (roomChangeRequest.status === 'rejected') {
      return res.status(400).json({ message: 'Room change request has been rejected' });
    }

    // Check if payment is required and completed (for upgrades)
    if (roomChangeRequest.paymentStatus === 'pending' && roomChangeRequest.upgradePaymentRequired > 0) {
      return res.status(400).json({ 
        message: 'Payment is required before approval. Student must complete the upgrade payment first.' 
      });
    }

    const student = await Student.findById(roomChangeRequest.student._id);
    const currentRoom = await Room.findById(roomChangeRequest.currentRoom._id);
    const requestedRoom = await Room.findById(roomChangeRequest.requestedRoom._id);

    // Store occupancy before changes
    roomChangeRequest.oldRoomOccupancyBefore = currentRoom.currentOccupancy || currentRoom.occupied || 0;
    roomChangeRequest.newRoomOccupancyBefore = requestedRoom.currentOccupancy || requestedRoom.occupied || 0;

    // Update student's room
    student.room = requestedRoom._id;
    await student.save();

    // Update old room occupancy
    currentRoom.currentOccupancy = Math.max(0, (currentRoom.currentOccupancy || currentRoom.occupied || 0) - 1);
    currentRoom.occupied = currentRoom.currentOccupancy;
    currentRoom.occupants = currentRoom.occupants.filter(
      (id) => id.toString() !== student._id.toString()
    );
    if (currentRoom.currentOccupancy === 0) {
      currentRoom.status = 'available';
    }
    await currentRoom.save();

    // Update new room occupancy
    requestedRoom.currentOccupancy = (requestedRoom.currentOccupancy || requestedRoom.occupied || 0) + 1;
    requestedRoom.occupied = requestedRoom.currentOccupancy;
    if (!requestedRoom.occupants.includes(student._id)) {
      requestedRoom.occupants.push(student._id);
    }
    if (requestedRoom.currentOccupancy >= requestedRoom.capacity) {
      requestedRoom.status = 'occupied';
    } else {
      requestedRoom.status = 'available';
    }
    await requestedRoom.save();

    // Handle wallet credit for downgrades
    if (roomChangeRequest.downgradeWalletCredit > 0) {
      let wallet = await Wallet.findOne({ student: student._id });
      if (!wallet) {
        wallet = await Wallet.create({ student: student._id, balance: 0 });
      }
      await wallet.addCredit(
        roomChangeRequest.downgradeWalletCredit,
        'room_downgrade',
        `Room downgrade credit from ${currentRoom.roomNumber} to ${requestedRoom.roomNumber}`,
        roomChangeRequest._id
      );
    }

    // Update room change request status
    roomChangeRequest.status = 'approved';
    roomChangeRequest.reviewedBy = req.user._id;
    roomChangeRequest.reviewedAt = new Date();
    roomChangeRequest.completedAt = new Date();
    if (adminNotes) {
      roomChangeRequest.adminNotes = adminNotes;
    }
    await roomChangeRequest.save();

    // Send notification to student
    await createNotification(
      {
        title: 'Room Change Approved',
        message: `Your room change request from ${currentRoom.roomNumber} to ${requestedRoom.roomNumber} has been approved.${
          roomChangeRequest.downgradeWalletCredit > 0 
            ? ` ₹${roomChangeRequest.downgradeWalletCredit} has been credited to your wallet.`
            : ''
        }`,
        type: 'general',
        recipient: student.user,
        relatedEntity: {
          entityType: 'roomChangeRequest',
          entityId: roomChangeRequest._id,
        },
      },
      { origin: 'admin' }
    );

    // Send notification to parent
    try {
      const Parent = (await import('../models/Parent.model.js')).default;
      const parent = await Parent.findOne({ students: student._id }).populate('user');
      if (parent && parent.user) {
        let parentMessage = `Room change for ${student.name} from ${currentRoom.roomNumber} to ${requestedRoom.roomNumber} has been approved.`;
        
        if (roomChangeRequest.downgradeWalletCredit > 0) {
          parentMessage += ` ₹${roomChangeRequest.downgradeWalletCredit} has been credited to ${student.name}'s wallet and can be used for future payments.`;
        } else if (roomChangeRequest.upgradePaymentRequired > 0) {
          parentMessage += ` Upgrade payment of ₹${roomChangeRequest.upgradePaymentRequired} has been processed.`;
        }
        
        await createNotification(
          {
            title: `Room Change Approved - ${student.name}`,
            message: parentMessage,
            type: roomChangeRequest.downgradeWalletCredit > 0 ? 'payment' : 'general',
            recipient: parent.user._id,
            recipientRole: 'parent',
            relatedEntity: {
              entityType: 'roomChangeRequest',
              entityId: roomChangeRequest._id,
            },
            studentDetails: {
              name: student.name,
              studentId: student.studentId,
              admissionNumber: student.studentId,
              course: student.course,
              roomNumber: requestedRoom.roomNumber,
              block: requestedRoom.block,
            },
          },
          { origin: 'admin' }
        );
      }
    } catch (parentNotifError) {
      console.error('Failed to send parent notification:', parentNotifError);
      // Don't fail the request if parent notification fails
    }

    res.json({
      message: 'Room change request approved successfully',
      roomChangeRequest,
    });
  } catch (error) {
    console.error('Approve room change request error:', error);
    res.status(500).json({ message: 'Error approving room change request', error: error.message });
  }
};

/**
 * Reject room change request
 */
export const rejectRoomChangeRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const { rejectionReason, adminNotes } = req.body;

    if (!rejectionReason || rejectionReason.trim() === '') {
      return res.status(400).json({ message: 'Rejection reason is required' });
    }

    const roomChangeRequest = await RoomChangeRequest.findById(id)
      .populate('student')
      .populate('currentRoom')
      .populate('requestedRoom');

    if (!roomChangeRequest) {
      return res.status(404).json({ message: 'Room change request not found' });
    }

    if (roomChangeRequest.status === 'rejected') {
      return res.status(400).json({ message: 'Room change request has already been rejected' });
    }

    if (roomChangeRequest.status === 'completed') {
      return res.status(400).json({ message: 'Room change request has already been completed' });
    }

    // Update room change request status
    roomChangeRequest.status = 'rejected';
    roomChangeRequest.reviewedBy = req.user._id;
    roomChangeRequest.reviewedAt = new Date();
    roomChangeRequest.rejectionReason = rejectionReason.trim();
    if (adminNotes) {
      roomChangeRequest.adminNotes = adminNotes;
    }
    await roomChangeRequest.save();

    // Send notification to student
    await createNotification(
      {
        title: 'Room Change Request Rejected',
        message: `Your room change request has been rejected. Reason: ${rejectionReason}`,
        type: 'general',
        recipient: roomChangeRequest.student.user,
        relatedEntity: {
          entityType: 'roomChangeRequest',
          entityId: roomChangeRequest._id,
        },
      },
      { origin: 'admin' }
    );

    // Send notification to parent
    try {
      const Parent = (await import('../models/Parent.model.js')).default;
      const parent = await Parent.findOne({ students: roomChangeRequest.student._id }).populate('user');
      if (parent && parent.user) {
        await createNotification(
          {
            title: `Room Change Rejected - ${roomChangeRequest.student.name}`,
            message: `Room change request for ${roomChangeRequest.student.name} from ${roomChangeRequest.currentRoom.roomNumber} to ${roomChangeRequest.requestedRoom.roomNumber} has been rejected. Reason: ${rejectionReason}`,
            type: 'general',
            recipient: parent.user._id,
            recipientRole: 'parent',
            relatedEntity: {
              entityType: 'roomChangeRequest',
              entityId: roomChangeRequest._id,
            },
            studentDetails: {
              name: roomChangeRequest.student.name,
              studentId: roomChangeRequest.student.studentId,
              admissionNumber: roomChangeRequest.student.studentId,
              course: roomChangeRequest.student.course,
              roomNumber: roomChangeRequest.currentRoom.roomNumber,
              block: roomChangeRequest.currentRoom.block,
            },
          },
          { origin: 'admin' }
        );
      }
    } catch (parentNotifError) {
      console.error('Failed to send parent notification:', parentNotifError);
      // Don't fail the request if parent notification fails
    }

    res.json({
      message: 'Room change request rejected successfully',
      roomChangeRequest,
    });
  } catch (error) {
    console.error('Reject room change request error:', error);
    res.status(500).json({ message: 'Error rejecting room change request', error: error.message });
  }
};

// ==================== ROOMMATE GROUPS ====================

/**
 * Get all roommate groups (for admin viewing)
 */
export const getAllRoommateGroups = async (req, res) => {
  try {
    const { status, matchType, roomType } = req.query;
    const query = {};
    
    if (status) {
      query.status = status;
    }
    if (matchType) {
      query.matchType = matchType;
    }
    if (roomType) {
      query.roomType = roomType;
    }

    const groups = await RoommateGroup.find(query)
      .populate('members', 'name studentId email course year gender room temporaryRoom paymentStatus amountToPay aiPreferences')
      .populate('createdBy', 'name studentId email')
      .populate('selectedRoom', 'roomNumber block floor roomType capacity currentOccupancy totalPrice basePrice amenitiesPrice status')
      .sort({ createdAt: -1 });

    res.json({ groups });
  } catch (error) {
    console.error('Get all roommate groups error:', error);
    res.status(500).json({ message: 'Error fetching roommate groups', error: error.message });
  }
};

// ==================== ACTIVITIES ====================

/**
 * Create a new activity
 */
export const createActivity = async (req, res) => {
  try {
    const { title, description, category, date, time, duration, location, organizer, expectedParticipants, requirements } = req.body;

    if (!title || !description || !date || !time || !location) {
      return res.status(400).json({ message: 'Title, description, date, time, and location are required' });
    }

    const activity = await Activity.create({
      title,
      description,
      category: category || 'Other',
      date: new Date(date),
      time,
      duration,
      location,
      organizer,
      expectedParticipants: expectedParticipants || 0,
      requirements,
      createdBy: req.user._id,
      status: 'upcoming',
    });

    // Send notifications to students, staff, and parents
    const activityDate = new Date(date);
    const formattedDate = activityDate.toLocaleDateString('en-IN', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });

    // Notify all students
    await createNotification(
      {
        title: 'New Activity: ' + title,
        message: `A new ${category || 'activity'} event "${title}" is scheduled for ${formattedDate} at ${time}. Location: ${location}. ${description.substring(0, 100)}${description.length > 100 ? '...' : ''}`,
        type: 'event',
        recipientRole: 'student',
        relatedEntity: {
          entityType: 'activity',
          entityId: activity._id,
        },
      },
      { origin: 'admin' }
    );

    // Notify all staff
    await createNotification(
      {
        title: 'New Activity: ' + title,
        message: `A new ${category || 'activity'} event "${title}" is scheduled for ${formattedDate} at ${time}. Location: ${location}.`,
        type: 'event',
        recipientRole: 'staff',
        relatedEntity: {
          entityType: 'activity',
          entityId: activity._id,
        },
      },
      { origin: 'admin' }
    );

    // Notify all parents
    await createNotification(
      {
        title: 'New Activity: ' + title,
        message: `A new ${category || 'activity'} event "${title}" is scheduled for ${formattedDate} at ${time}. Location: ${location}.`,
        type: 'event',
        recipientRole: 'parent',
        relatedEntity: {
          entityType: 'activity',
          entityId: activity._id,
        },
      },
      { origin: 'admin' }
    );

    activity.notified = true;
    activity.notifiedAt = new Date();
    await activity.save();

    const populatedActivity = await Activity.findById(activity._id)
      .populate('createdBy', 'name email');

    res.status(201).json({ message: 'Activity created and notifications sent successfully', activity: populatedActivity });
  } catch (error) {
    console.error('Create activity error:', error);
    res.status(500).json({ message: 'Error creating activity', error: error.message });
  }
};

/**
 * Get all activities
 */
export const getAllActivities = async (req, res) => {
  try {
    const { status, category, startDate, endDate } = req.query;
    const query = {};

    if (status) query.status = status;
    if (category) query.category = category;
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }

    const activities = await Activity.find(query)
      .populate('createdBy', 'name email')
      .sort({ date: 1, time: 1 });

    res.json(activities);
  } catch (error) {
    console.error('Get all activities error:', error);
    res.status(500).json({ message: 'Error fetching activities', error: error.message });
  }
};

/**
 * Get activity by ID
 */
export const getActivityById = async (req, res) => {
  try {
    const activity = await Activity.findById(req.params.id)
      .populate('createdBy', 'name email');

    if (!activity) {
      return res.status(404).json({ message: 'Activity not found' });
    }

    res.json(activity);
  } catch (error) {
    console.error('Get activity by ID error:', error);
    res.status(500).json({ message: 'Error fetching activity', error: error.message });
  }
};

/**
 * Update activity
 */
export const updateActivity = async (req, res) => {
  try {
    const { title, description, category, date, time, duration, location, organizer, expectedParticipants, requirements, status } = req.body;

    const activity = await Activity.findById(req.params.id);

    if (!activity) {
      return res.status(404).json({ message: 'Activity not found' });
    }

    if (title) activity.title = title;
    if (description) activity.description = description;
    if (category) activity.category = category;
    if (date) activity.date = new Date(date);
    if (time) activity.time = time;
    if (duration !== undefined) activity.duration = duration;
    if (location) activity.location = location;
    if (organizer !== undefined) activity.organizer = organizer;
    if (expectedParticipants !== undefined) activity.expectedParticipants = expectedParticipants;
    if (requirements !== undefined) activity.requirements = requirements;
    if (status) activity.status = status;

    await activity.save();

    const updatedActivity = await Activity.findById(activity._id)
      .populate('createdBy', 'name email');

    res.json({ message: 'Activity updated successfully', activity: updatedActivity });
  } catch (error) {
    console.error('Update activity error:', error);
    res.status(500).json({ message: 'Error updating activity', error: error.message });
  }
};

/**
 * Delete activity
 */
export const deleteActivity = async (req, res) => {
  try {
    const activity = await Activity.findById(req.params.id);

    if (!activity) {
      return res.status(404).json({ message: 'Activity not found' });
    }

    await Activity.findByIdAndDelete(req.params.id);

    res.json({ message: 'Activity deleted successfully' });
  } catch (error) {
    console.error('Delete activity error:', error);
    res.status(500).json({ message: 'Error deleting activity', error: error.message });
  }
};

/**
 * Get activity participants
 */
export const getActivityParticipants = async (req, res) => {
  try {
    const ActivityParticipation = (await import('../models/ActivityParticipation.model.js')).default;
    
    const participations = await ActivityParticipation.find({
      activity: req.params.id,
      status: 'joined'
    })
      .populate('student', 'name studentId course batchYear year')
      .populate('student.room', 'roomNumber block building')
      .sort({ joinedAt: -1 });

    res.json(participations);
  } catch (error) {
    console.error('Get activity participants error:', error);
    res.status(500).json({ message: 'Error fetching participants', error: error.message });
  }
};

// ==================== MATCHING POOL & ROOMMATE MATCHING ====================

/**
 * Add student to matching pool
 */
export const addToMatchingPool = async (req, res) => {
  try {
    const { studentId, preferences } = req.body;

    const student = await Student.findById(studentId);
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    if (student.room) {
      return res.status(400).json({ message: 'Student already has a room allocated' });
    }

    const MatchingPool = (await import('../models/MatchingPool.model.js')).default;

    // Check if student is already in pool
    let poolEntry = await MatchingPool.findOne({ student: studentId });

    if (poolEntry) {
      // Update existing entry
      if (preferences) {
        poolEntry.preferences = { ...poolEntry.preferences, ...preferences };
      }
      poolEntry.status = 'active';
      await poolEntry.save();
    } else {
      // Create new entry
      poolEntry = await MatchingPool.create({
        student: studentId,
        preferences: preferences || {},
        status: 'active',
        allocationStatus: 'pending',
      });
    }

    const populatedEntry = await MatchingPool.findById(poolEntry._id)
      .populate('student', 'name studentId email gender course year batchYear personalityAttributes aiPreferences');

    res.json({ message: 'Student added to matching pool', poolEntry: populatedEntry });
  } catch (error) {
    console.error('Add to matching pool error:', error);
    res.status(500).json({ message: 'Error adding student to matching pool', error: error.message });
  }
};

/**
 * Get all students in matching pool
 */
export const getMatchingPool = async (req, res) => {
  try {
    const { status } = req.query;
    const MatchingPool = (await import('../models/MatchingPool.model.js')).default;

    const query = {};
    if (status) {
      query.status = status;
    } else {
      query.status = 'active'; // Default to active only
    }

    const poolEntries = await MatchingPool.find(query)
      .populate('student', 'name studentId email gender course year batchYear personalityAttributes aiPreferences')
      .populate('temporaryRoom', 'roomNumber block floor roomType')
      .populate('assignedRoom', 'roomNumber block floor roomType')
      .populate('matchedGroup', 'name studentId email')
      .sort({ createdAt: -1 });

    res.json(poolEntries);
  } catch (error) {
    console.error('Get matching pool error:', error);
    res.status(500).json({ message: 'Error fetching matching pool', error: error.message });
  }
};

/**
 * Remove student from matching pool
 */
export const removeFromMatchingPool = async (req, res) => {
  try {
    const { studentId } = req.params;

    const MatchingPool = (await import('../models/MatchingPool.model.js')).default;
    const poolEntry = await MatchingPool.findOne({ student: studentId });

    if (!poolEntry) {
      return res.status(404).json({ message: 'Student not found in matching pool' });
    }

    poolEntry.status = 'removed';
    await poolEntry.save();

    res.json({ message: 'Student removed from matching pool' });
  } catch (error) {
    console.error('Remove from matching pool error:', error);
    res.status(500).json({ message: 'Error removing student from matching pool', error: error.message });
  }
};

/**
 * Run AI matching for students in pool
 */
export const runAIMatching = async (req, res) => {
  try {
    const { roomType, minScore = 50 } = req.body;

    const MatchingPool = (await import('../models/MatchingPool.model.js')).default;
    const { findBestMatches, formRoommateGroups } = await import('../utils/roommateMatching.js');

    // Get active students in matching pool
    const poolEntries = await MatchingPool.find({ status: 'active' })
      .populate('student', 'name studentId email gender course year batchYear personalityAttributes aiPreferences status room');

    // Filter students without rooms
    const unallocatedStudents = poolEntries
      .filter(entry => !entry.student.room && entry.student.status === 'active')
      .map(entry => entry.student);

    if (unallocatedStudents.length === 0) {
      return res.json({ message: 'No unallocated students in matching pool', groups: [] });
    }

    // Determine room capacity based on roomType
    let capacity = 2; // Default to Double
    if (roomType === 'Single') capacity = 1;
    else if (roomType === 'Triple') capacity = 3;
    else if (roomType === 'Quad') capacity = 4;

    // Group students by gender
    const boys = unallocatedStudents.filter(s => s.gender === 'Boys');
    const girls = unallocatedStudents.filter(s => s.gender === 'Girls');

    const allGroups = [];

    // Match boys
    if (boys.length > 0) {
      const boysGroups = formRoommateGroups(boys, capacity, minScore);
      allGroups.push(...boysGroups.map(g => ({ ...g, gender: 'Boys' })));
    }

    // Match girls
    if (girls.length > 0) {
      const girlsGroups = formRoommateGroups(girls, capacity, minScore);
      allGroups.push(...girlsGroups.map(g => ({ ...g, gender: 'Girls' })));
    }

    // Update matching pool entries with matched groups
    for (const group of allGroups) {
      const studentIds = group.students.map(s => s._id);
      
      for (const student of group.students) {
        const poolEntry = await MatchingPool.findOne({ student: student._id });
        if (poolEntry) {
          poolEntry.matchedGroup = studentIds.filter(id => id.toString() !== student._id.toString());
          poolEntry.aiMatchingScore = group.averageScore;
          poolEntry.matchedAt = new Date();
          poolEntry.status = 'matched';
          await poolEntry.save();
        }
      }
    }

    res.json({
      message: `AI matching completed. Found ${allGroups.length} compatible groups.`,
      groups: allGroups.map(g => ({
        students: g.students.map(s => ({
          _id: s._id,
          name: s.name,
          studentId: s.studentId,
          email: s.email,
          course: s.course,
          year: s.year,
        })),
        averageScore: g.averageScore,
        gender: g.gender,
        scores: g.scores,
      })),
      totalStudents: unallocatedStudents.length,
      matchedStudents: allGroups.reduce((sum, g) => sum + g.students.length, 0),
    });
  } catch (error) {
    console.error('Run AI matching error:', error);
    res.status(500).json({ message: 'Error running AI matching', error: error.message });
  }
};

/**
 * Get AI matches for a specific student
 */
export const getAIMatches = async (req, res) => {
  try {
    const { studentId } = req.params;
    const { minScore = 50, limit = 10 } = req.query;

    const student = await Student.findById(studentId);
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    // Get all students of same gender without rooms
    const candidates = await Student.find({
      _id: { $ne: studentId },
      gender: student.gender,
      status: 'active',
      room: null,
    }).select('name studentId email course year batchYear personalityAttributes aiPreferences');

    const { findBestMatches } = await import('../utils/roommateMatching.js');
    const matches = findBestMatches(student, candidates, parseInt(minScore), parseInt(limit));

    res.json({
      student: {
        _id: student._id,
        name: student.name,
        studentId: student.studentId,
      },
      matches: matches.map(m => ({
        student: {
          _id: m.student._id,
          name: m.student.name,
          studentId: m.student.studentId,
          email: m.student.email,
          course: m.student.course,
          year: m.student.year,
        },
        score: m.score,
      })),
    });
  } catch (error) {
    console.error('Get AI matches error:', error);
    res.status(500).json({ message: 'Error fetching AI matches', error: error.message });
  }
};

/**
 * Assign room to matched group
 */
export const assignRoomToGroup = async (req, res) => {
  try {
    const { studentIds, roomId } = req.body;

    if (!Array.isArray(studentIds) || studentIds.length === 0) {
      return res.status(400).json({ message: 'Student IDs array is required' });
    }

    const room = await Room.findById(roomId);
    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }

    // Validate room capacity
    if (room.currentOccupancy + studentIds.length > room.capacity) {
      return res.status(400).json({ 
        message: `Room capacity (${room.capacity}) exceeded. Cannot assign ${studentIds.length} students.` 
      });
    }

    // Validate all students are of same gender as room
    const students = await Student.find({ _id: { $in: studentIds } })
      .populate('user', '_id');
    if (students.length !== studentIds.length) {
      return res.status(404).json({ message: 'One or more students not found' });
    }

    const firstStudentGender = students[0].gender;
    if (students.some(s => s.gender !== firstStudentGender)) {
      return res.status(400).json({ message: 'All students must be of the same gender' });
    }

    if (room.gender && room.gender !== firstStudentGender) {
      return res.status(400).json({ 
        message: `Room is for ${room.gender}, but students are ${firstStudentGender}` 
      });
    }

    const MatchingPool = (await import('../models/MatchingPool.model.js')).default;
    const allocatedStudents = [];

    // Allocate room to all students in group
    for (const student of students) {
      // Deallocate previous room if exists
      if (student.room) {
        const oldRoom = await Room.findById(student.room);
        if (oldRoom) {
          oldRoom.currentOccupancy = Math.max(0, (oldRoom.currentOccupancy || 0) - 1);
          oldRoom.occupants = oldRoom.occupants.filter(id => id.toString() !== student._id.toString());
          if (oldRoom.currentOccupancy === 0) {
            oldRoom.status = 'available';
          }
          await oldRoom.save();
        }
      }

      // Allocate temporarily (pending payment)
      student.temporaryRoom = roomId;
      student.roomAllocationStatus = 'pending_payment';
      student.roomAllocatedAt = new Date();
      await student.save();

      // Update matching pool
      const poolEntry = await MatchingPool.findOne({ student: student._id });
      if (poolEntry) {
        poolEntry.assignedRoom = roomId;
        poolEntry.allocationStatus = 'pending_payment';
        poolEntry.status = 'allocated';
        await poolEntry.save();
      }

      // Send notification to student
      const { createNotification } = await import('../utils/notificationHelper.js');
      const studentUser = await User.findById(student.user);
      if (studentUser) {
        await createNotification(
          {
            title: 'Room Allocation - Payment Required',
            message: `Room ${room.roomNumber} has been allocated to you. Please complete the payment to confirm your room allocation.`,
            type: 'payment',
            recipient: studentUser._id,
            relatedEntity: {
              entityType: 'room',
              entityId: room._id,
            },
          },
          { origin: 'admin' }
        );
      }

      allocatedStudents.push(student);
    }

    // Update room status
    room.currentOccupancy = (room.currentOccupancy || 0) + students.length;
    room.occupied = room.currentOccupancy;
    if (room.currentOccupancy >= room.capacity) {
      room.status = 'occupied';
    } else {
      room.status = 'reserved';
    }
    await room.save();

    // Generate fees for all students
    const { calculateRoomPrice } = await import('../utils/amenitiesPricing.js');
    const recalculatedPrice = calculateRoomPrice(room.roomType, room.amenities || {});
    const correctTotalPrice = recalculatedPrice.totalPrice;

    const now = new Date();
    const dueDate = new Date(now);
    dueDate.setDate(dueDate.getDate() + 30);

    for (const student of students) {
      const Fee = (await import('../models/Fee.model.js')).default;
      const existingFee = await Fee.findOne({
        student: student._id,
        feeType: 'rent',
        status: { $in: ['pending', 'partial', 'paid'] },
        year: dueDate.getFullYear(),
      });

      if (!existingFee) {
        await Fee.create({
          student: student._id,
          feeType: 'rent',
          amount: correctTotalPrice,
          dueDate: dueDate,
          status: 'pending',
          description: `Yearly room fee for ${room.roomType} room (${room.roomNumber})`,
          year: dueDate.getFullYear(),
          month: null,
        });
      }
    }

    res.json({
      message: `Room ${room.roomNumber} allocated to ${students.length} students. Payment required to confirm.`,
      room,
      students: allocatedStudents,
      requiresPayment: true,
    });
  } catch (error) {
    console.error('Assign room to group error:', error);
    res.status(500).json({ message: 'Error assigning room to group', error: error.message });
  }
};

// ==================== CLEANING REQUESTS MANAGEMENT ====================

/**
 * Get all cleaning requests
 */
export const getAllCleaningRequests = async (req, res) => {
  try {
    const { status, urgency, requestType } = req.query;
    const query = {};

    if (status) query.status = status;
    if (urgency) query.urgency = urgency;
    if (requestType) query.requestType = requestType;

    const requests = await CleaningRequest.find(query)
      .populate('student', 'name studentId email phone room')
      .populate('student.room', 'roomNumber block building')
      .populate('room', 'roomNumber block building')
      .populate('assignedTo', 'name staffId department')
      .populate('completedBy', 'name staffId')
      .populate('assignedBy', 'name')
      .sort({ urgency: -1, createdAt: -1 }); // Sort by urgency (high first), then by date

    res.json(requests);
  } catch (error) {
    console.error('Get all cleaning requests error:', error);
    res.status(500).json({ message: 'Error fetching cleaning requests', error: error.message });
  }
};

/**
 * Assign cleaning request to staff
 */
export const assignCleaningRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const { staffId, scheduledDate, scheduledTime } = req.body;

    if (!staffId || !scheduledDate) {
      return res.status(400).json({ message: 'Staff ID and scheduled date are required' });
    }

    const Staff = (await import('../models/Staff.model.js')).default;
    const staff = await Staff.findById(staffId);
    if (!staff) {
      return res.status(404).json({ message: 'Staff member not found' });
    }

    const request = await CleaningRequest.findById(id)
      .populate('student', 'name studentId email user')
      .populate('room', 'roomNumber block');

    if (!request) {
      return res.status(404).json({ message: 'Cleaning request not found' });
    }

    if (request.status !== 'pending') {
      return res.status(400).json({ message: `Request is already ${request.status}` });
    }

    // Update request
    request.status = 'assigned';
    request.assignedTo = staff._id;
    request.assignedBy = req.user._id;
    request.assignedAt = new Date();
    request.scheduledDate = new Date(scheduledDate);
    request.scheduledTime = scheduledTime || request.preferredTimeSlot;
    await request.save();

    // Send notification to staff
    if (staff.user) {
      await createNotification(
        {
          title: 'Cleaning Request Assigned',
          message: `You have been assigned a ${request.requestType.replace(/_/g, ' ')} request for ${request.student.name} (Room ${request.room?.roomNumber || 'N/A'})`,
          type: 'cleaning',
          recipient: staff.user._id,
          relatedEntity: {
            entityType: 'cleaningRequest',
            entityId: request._id,
          },
        },
        { origin: 'admin' }
      );
    }

    // Send notification to student
    if (request.student.user) {
      const formatTimeSlot = (slot) => {
        const slotMap = { 'morning': 'Morning', 'afternoon': 'Afternoon', 'evening': 'Evening' };
        return slotMap[slot] || slot;
      };
      await createNotification(
        {
          title: 'Cleaning Request Assigned',
          message: `Your ${request.requestType.replace(/_/g, ' ')} request has been assigned to ${staff.name}. Scheduled: ${new Date(scheduledDate).toLocaleDateString()} at ${formatTimeSlot(scheduledTime || request.preferredTimeSlot)}`,
          type: 'cleaning',
          recipient: request.student.user._id,
          relatedEntity: {
            entityType: 'cleaningRequest',
            entityId: request._id,
          },
        },
        { origin: 'admin' }
      );
    }

    // Notify parent (if linked)
    if (!ParentModel) {
      ParentModel = (await import('../models/Parent.model.js')).default;
    }
    const parent = await ParentModel.findOne({ students: request.student._id }).populate('user');
    if (parent?.user) {
      const formatTimeSlot = (slot) => {
        const slotMap = { 'morning': 'Morning', 'afternoon': 'Afternoon', 'evening': 'Evening' };
        return slotMap[slot] || slot;
      };
      const roomLabel =
        request.room?.roomNumber
          ? `Room ${request.room.roomNumber}${request.room.block ? `, Block ${request.room.block}` : ''}`
          : request.studentIdentity?.roomNumber
          ? `Room ${request.studentIdentity.roomNumber}${request.studentIdentity.block ? `, Block ${request.studentIdentity.block}` : ''}`
          : 'Room not available';

      await createNotification(
        {
          title: 'Child Cleaning Request Assigned',
          message: `Your child ${request.student.name} (${request.student.studentId}) has a ${request.requestType.replace(/_/g, ' ')} request assigned to ${staff.name}. Scheduled on ${new Date(scheduledDate).toLocaleDateString()} (${formatTimeSlot(scheduledTime || request.preferredTimeSlot)}) at ${roomLabel}.`,
          type: 'cleaning',
          recipient: parent.user._id,
          recipientRole: 'parent',
          relatedEntity: {
            entityType: 'cleaningRequest',
            entityId: request._id,
          },
        },
        { origin: 'admin', studentDetails: request.studentIdentity || undefined }
      );
    }

    const populatedRequest = await CleaningRequest.findById(request._id)
      .populate('student', 'name studentId room')
      .populate('student.room', 'roomNumber block')
      .populate('room', 'roomNumber block')
      .populate('assignedTo', 'name staffId')
      .populate('assignedBy', 'name');

    res.json({ 
      message: 'Cleaning request assigned successfully',
      request: populatedRequest
    });
  } catch (error) {
    console.error('Assign cleaning request error:', error);
    res.status(500).json({ message: 'Error assigning cleaning request', error: error.message });
  }
};

/**
 * Cancel cleaning request
 */
export const cancelCleaningRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const { cancellationReason } = req.body;

    const request = await CleaningRequest.findById(id)
      .populate('student', 'name studentId email user');

    if (!request) {
      return res.status(404).json({ message: 'Cleaning request not found' });
    }

    if (request.status === 'completed') {
      return res.status(400).json({ message: 'Cannot cancel a completed request' });
    }

    request.status = 'cancelled';
    request.cancelledBy = req.user._id;
    request.cancelledAt = new Date();
    request.cancellationReason = cancellationReason || '';
    await request.save();

  // Send notification to student
  if (request.student.user) {
    await createNotification(
      {
        title: 'Cleaning Request Cancelled',
        message: `Your cleaning request has been cancelled.${cancellationReason ? ` Reason: ${cancellationReason}` : ''}`,
        type: 'cleaning',
        recipient: request.student.user._id,
        relatedEntity: {
          entityType: 'cleaningRequest',
          entityId: request._id,
        },
      },
      { origin: 'admin' }
    );
  }

  // Notify parent (if linked)
  if (!ParentModel) {
    ParentModel = (await import('../models/Parent.model.js')).default;
  }
  const parent = await ParentModel.findOne({ students: request.student._id }).populate('user');
  if (parent?.user) {
    await createNotification(
      {
        title: 'Child Cleaning Request Cancelled',
        message: `Your child ${request.student.name} (${request.student.studentId})'s cleaning request has been cancelled.${cancellationReason ? ` Reason: ${cancellationReason}` : ''}`,
        type: 'cleaning',
        recipient: parent.user._id,
        recipientRole: 'parent',
        relatedEntity: {
          entityType: 'cleaningRequest',
          entityId: request._id,
        },
      },
      { origin: 'admin', studentDetails: request.studentIdentity || undefined }
    );
  }

  res.json({ 
    message: 'Cleaning request cancelled successfully',
    request
  });
  } catch (error) {
    console.error('Cancel cleaning request error:', error);
    res.status(500).json({ message: 'Error cancelling cleaning request', error: error.message });
  }
};

