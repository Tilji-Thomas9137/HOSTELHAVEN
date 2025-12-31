import Student from '../models/Student.model.js';
import User from '../models/User.model.js';
import Fee from '../models/Fee.model.js';
import Payment from '../models/Payment.model.js';
import Attendance from '../models/Attendance.model.js';
import Complaint from '../models/Complaint.model.js';
import OutingRequest from '../models/OutingRequest.model.js';
import MealPreference from '../models/MealPreference.model.js';
import VisitorLog from '../models/VisitorLog.model.js';
import Room from '../models/Room.model.js';
import Notification from '../models/Notification.model.js';
import Activity from '../models/Activity.model.js';
import ActivityParticipation from '../models/ActivityParticipation.model.js';
import RoomChangeRequest from '../models/RoomChangeRequest.model.js';
import Wallet from '../models/Wallet.model.js';
import RoommateRequest from '../models/RoommateRequest.model.js';
import RoommateGroup from '../models/RoommateGroup.model.js';
import InventoryRequest from '../models/InventoryRequest.model.js';
import Inventory from '../models/Inventory.model.js';
import CleaningRequest from '../models/CleaningRequest.model.js';
import { createNotification } from '../utils/notificationHelper.js';
import { getStudentIdentity } from '../utils/studentIdentityHelper.js';
import { calculateRoomChangePrice, calculateRemainingMonths } from '../utils/roomChangeCalculator.js';
import { generatePaymentReceipt } from '../utils/receiptGenerator.js';

/**
 * Get student profile
 */
export const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const student = await Student.findOne({ user: req.user._id })
      .populate('room', 'roomNumber floor building block capacity amenities rent status roomType totalPrice basePrice amenitiesPrice')
      .populate('temporaryRoom', 'roomNumber floor building block capacity amenities rent status roomType totalPrice basePrice amenitiesPrice');

    if (!student) {
      return res.status(404).json({ message: 'Student profile not found' });
    }

    // Initialize onboardingStatus if not set (for existing students)
    if (!student.onboardingStatus) {
      if (student.room && student.roomAllocationStatus === 'confirmed') {
        student.onboardingStatus = 'confirmed';
      } else if (student.temporaryRoom || student.roomAllocationStatus === 'pending_payment') {
        student.onboardingStatus = 'room_selected';
      } else {
        student.onboardingStatus = 'pending';
      }
      await student.save();
    }

    // Find parent associated with this student
    const Parent = (await import('../models/Parent.model.js')).default;
    const parent = await Parent.findOne({ students: student._id }).select('name phone email relation');

    res.json({ user, student, parent: parent || null });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ message: 'Error fetching profile', error: error.message });
  }
};

/**
 * Update student profile
 */
export const updateProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const student = await Student.findOne({ user: req.user._id });

    // Update user fields
    if (req.body.name !== undefined) user.name = req.body.name;
    if (req.body.phone !== undefined) user.phone = req.body.phone;
    
    // Handle profile photo - only update if provided and not empty
    if (req.body.profilePhoto !== undefined) {
      if (req.body.profilePhoto === null || req.body.profilePhoto === '') {
        user.profilePhoto = null;
      } else if (typeof req.body.profilePhoto === 'string' && req.body.profilePhoto.length > 0) {
        // Validate base64 string format
        if (req.body.profilePhoto.startsWith('data:image/')) {
          user.profilePhoto = req.body.profilePhoto;
        } else {
          return res.status(400).json({ message: 'Invalid image format. Please upload a valid image.' });
        }
      }
    }

    await user.save();

    if (!student) {
      // Return response even if student profile doesn't exist
      return res.json({ 
        message: 'Profile updated successfully', 
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          profilePhoto: user.profilePhoto,
          role: user.role
        }, 
        student: null 
      });
    }

    // Update student fields
    const updateData = {};
    if (req.body.address !== undefined) updateData.address = req.body.address;
    if (req.body.emergencyContact !== undefined) updateData.emergencyContact = req.body.emergencyContact;
    if (req.body.gender !== undefined) {
      if (req.body.gender !== 'Boys' && req.body.gender !== 'Girls') {
        return res.status(400).json({ message: 'Gender must be either "Boys" or "Girls"' });
      }
      updateData.gender = req.body.gender;
    }
    
    const updatedStudent = await Student.findByIdAndUpdate(
      student._id,
      updateData,
      { new: true, runValidators: true }
    ).populate('room', 'roomNumber floor building');

    res.json({ 
      message: 'Profile updated successfully', 
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        profilePhoto: user.profilePhoto,
        role: user.role
      }, 
      student: updatedStudent 
    });
  } catch (error) {
    console.error('Update profile error:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ 
      message: 'Error updating profile', 
      error: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

/**
 * Check eligibility for room change request
 */
const checkRoomChangeEligibility = async (student) => {
  const errors = [];

  // 1. Student must have a room allocated
  if (!student.room) {
    errors.push('You must have a room allocated before requesting a room change.');
    return { eligible: false, errors };
  }

  // 2. Check if student has any pending room change requests
  const pendingRequest = await RoomChangeRequest.findOne({
    student: student._id,
    status: { $in: ['pending', 'pending_payment', 'under_review'] },
  });

  if (pendingRequest) {
    errors.push('You already have a pending room change request. Please wait for it to be processed.');
    return { eligible: false, errors };
  }

  // 3. Check if yearly hostel payment is cleared
  const yearlyFee = await Fee.findOne({
    student: student._id,
    feeType: 'rent',
    status: { $in: ['pending', 'overdue'] },
  });

  if (yearlyFee) {
    errors.push('You must clear your yearly hostel payment before requesting a room change.');
    return { eligible: false, errors };
  }

  // 4. Check for unpaid fines
  const unpaidFines = await Fee.findOne({
    student: student._id,
    feeType: 'late_fee',
    status: { $in: ['pending', 'overdue'] },
  });

  if (unpaidFines) {
    errors.push('You must clear all pending fines before requesting a room change.');
    return { eligible: false, errors };
  }

  return { eligible: true, errors: [] };
};

/**
 * Get available rooms for room change (excluding current room)
 */
export const getAvailableRoomsForChange = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const student = await Student.findOne({ user: req.user._id })
      .populate('room');

    if (!student) {
      return res.status(404).json({ message: 'Student profile not found' });
    }

    // Check eligibility
    const eligibility = await checkRoomChangeEligibility(student);
    if (!eligibility.eligible) {
      return res.status(400).json({ 
        message: 'Not eligible for room change', 
        errors: eligibility.errors 
      });
    }

    if (!student.gender || (student.gender !== 'Boys' && student.gender !== 'Girls')) {
      return res.status(400).json({ 
        message: 'Student gender is not set. Please update your profile with your gender (Boys/Girls) to view available rooms.' 
      });
    }

    // Get rooms matching student's gender, excluding current room and maintenance rooms
    // DON'T filter by occupancy in query - we count actual students instead
    const roomQuery = { 
      status: { $in: ['available', 'reserved'] },
      maintenanceStatus: { $ne: 'under_maintenance' },
      gender: student.gender,
      _id: { $ne: student.room?._id }, // Exclude current room
      // REMOVED occupancy check - we count actual students instead
    };

    const rooms = await Room.find(roomQuery)
      .select('roomNumber block floor building roomType capacity currentOccupancy occupied amenities basePrice amenitiesPrice totalPrice rent status photos gender')
      .sort({ block: 1, floor: 1, roomNumber: 1 });

    // Count ACTUAL students for each room
    const roomsWithOccupants = await Promise.all(
      rooms.map(async (room) => {
        // Count ACTUAL confirmed occupants
        const confirmedCount = await Student.countDocuments({ room: room._id });
        
        // Count ACTUAL temporary occupants (pending payment)
        const temporaryCount = await Student.countDocuments({ temporaryRoom: room._id });
        
        // Get occupant details for display
        const occupants = await Student.find({ room: room._id })
          .select('name studentId course batchYear')
          .limit(10);

        const occupantsDetails = occupants.map(occupant => ({
          name: occupant.name,
          admissionNumber: occupant.studentId,
          course: occupant.course,
          batchYear: occupant.batchYear,
        }));

        const totalOccupancy = confirmedCount + temporaryCount;
        const availableSlots = Math.max(0, room.capacity - totalOccupancy);

        return {
          ...room.toObject(),
          currentOccupants: occupantsDetails,
          currentOccupancy: confirmedCount,
          pendingOccupancy: temporaryCount,
          totalOccupancy: totalOccupancy,
          availableSlots,
          isFull: totalOccupancy >= room.capacity,
        };
      })
    );

    // Filter out fully occupied rooms
    const availableRooms = roomsWithOccupants.filter(room => !room.isFull && room.availableSlots > 0);

    res.json({ rooms: availableRooms });
  } catch (error) {
    console.error('Get available rooms for change error:', error);
    res.status(500).json({ message: 'Error fetching available rooms', error: error.message });
  }
};

/**
 * Request room change with comprehensive eligibility and payment checks
 */
export const requestRoomChange = async (req, res) => {
  try {
    const { requestedRoomId, reason } = req.body;

    if (!requestedRoomId || !reason || reason.trim() === '') {
      return res.status(400).json({ message: 'Requested room ID and reason are required' });
    }

    const user = await User.findById(req.user._id);
    const student = await Student.findOne({ user: req.user._id })
      .populate('room');

    if (!student) {
      return res.status(404).json({ message: 'Student profile not found' });
    }

    // Check eligibility
    const eligibility = await checkRoomChangeEligibility(student);
    if (!eligibility.eligible) {
      return res.status(400).json({ 
        message: 'Not eligible for room change', 
        errors: eligibility.errors 
      });
    }

    // Get current and requested rooms
    const currentRoom = await Room.findById(student.room);
    const requestedRoom = await Room.findById(requestedRoomId);

    if (!currentRoom || !requestedRoom) {
      return res.status(404).json({ message: 'Room not found' });
    }

    // Validate requested room
    if (requestedRoom.maintenanceStatus === 'under_maintenance' || requestedRoom.maintenanceStatus === 'blocked') {
      return res.status(400).json({ message: 'Requested room is under maintenance and cannot be allocated.' });
    }

    const requestedOccupancy = requestedRoom.currentOccupancy || requestedRoom.occupied || 0;
    if (requestedOccupancy >= requestedRoom.capacity) {
      return res.status(400).json({ message: 'Requested room is full. Please select another room.' });
    }

    if (requestedRoom.gender && requestedRoom.gender !== student.gender) {
      return res.status(400).json({ 
        message: `This room is restricted to ${requestedRoom.gender}. You can only select rooms for ${student.gender}.` 
      });
    }

    // Check if student has already paid for current room
    const currentRoomFee = await Fee.findOne({
      student: student._id,
      feeType: 'rent',
      status: { $in: ['pending', 'partial', 'paid'] },
    }).sort({ createdAt: -1 }); // Get the most recent rent fee

    const alreadyPaidForCurrentRoom = currentRoomFee ? (currentRoomFee.paidAmount || 0) : 0;

    // Calculate price difference
    const remainingMonths = calculateRemainingMonths();
    const priceCalculation = calculateRoomChangePrice(
      currentRoom.totalPrice,
      requestedRoom.totalPrice,
      remainingMonths
    );

    // Adjust upgrade payment if student has already paid something for current room
    let adjustedUpgradePayment = priceCalculation.upgradePaymentRequired;
    let remainingAmountToPay = 0;

    if (priceCalculation.isUpgrade && alreadyPaidForCurrentRoom > 0) {
      // New room total cost - Old room total cost
      const totalPriceDifference = requestedRoom.totalPrice - currentRoom.totalPrice;
      
      // If student has paid for old room, the remaining amount is:
      // (New room total) - (Already paid for old room)
      remainingAmountToPay = requestedRoom.totalPrice - alreadyPaidForCurrentRoom;
      
      // But we should only charge for the actual difference (not the full new room price)
      // So the upgrade payment should be: Price difference - any credit from overpayment
      if (alreadyPaidForCurrentRoom >= currentRoom.totalPrice) {
        // Student has fully paid for old room, so just pay the difference
        adjustedUpgradePayment = totalPriceDifference;
      } else {
        // Student has partially paid, so they need to pay:
        // (Remaining on old room) + (Price difference for remaining months)
        const remainingOnOldRoom = currentRoom.totalPrice - alreadyPaidForCurrentRoom;
        adjustedUpgradePayment = remainingOnOldRoom + priceCalculation.remainingMonthsDifference;
      }

      adjustedUpgradePayment = Math.max(0, adjustedUpgradePayment);
    }

    // Create room change request
    const roomChangeRequest = await RoomChangeRequest.create({
      student: student._id,
      currentRoom: currentRoom._id,
      requestedRoom: requestedRoom._id,
      reason: reason.trim(),
      status: priceCalculation.isUpgrade ? 'pending_payment' : 'pending',
      currentRoomPrice: currentRoom.totalPrice,
      requestedRoomPrice: requestedRoom.totalPrice,
      priceDifference: priceCalculation.yearlyDifference,
      upgradePaymentRequired: adjustedUpgradePayment, // Use adjusted amount
      downgradeWalletCredit: priceCalculation.downgradeWalletCredit,
      paymentStatus: priceCalculation.isUpgrade ? 'pending' : 'not_required',
      alreadyPaidAmount: alreadyPaidForCurrentRoom, // Store for reference
    });

    // If upgrade, return payment information
    if (priceCalculation.isUpgrade && adjustedUpgradePayment > 0) {
      return res.status(201).json({
        message: `Room change request created. ${alreadyPaidForCurrentRoom > 0 ? `You have already paid ₹${alreadyPaidForCurrentRoom.toLocaleString('en-IN')} for your current room. ` : ''}Payment of ₹${adjustedUpgradePayment.toLocaleString('en-IN')} is required for the upgrade.`,
        roomChangeRequest: {
          ...roomChangeRequest.toObject(),
          priceCalculation: {
            ...priceCalculation,
            upgradePaymentRequired: adjustedUpgradePayment,
            alreadyPaidAmount: alreadyPaidForCurrentRoom,
            remainingAmountToPay: adjustedUpgradePayment,
          },
        },
        requiresPayment: true,
        paymentAmount: adjustedUpgradePayment,
        alreadyPaidAmount: alreadyPaidForCurrentRoom,
      });
    }

    // If downgrade, create wallet entry (will be credited after approval)
    // Get student details for notification
    const studentDetails = {
      name: student.name,
      studentId: student.studentId,
      admissionNumber: student.studentId,
      course: student.course || null,
      batchYear: student.batchYear || null,
      roomNumber: currentRoom.roomNumber || null,
      block: currentRoom.block || null,
    };

    // Send notification to student
    await createNotification(
      {
        title: 'Room Change Request Submitted',
        message: `Your room change request from ${currentRoom.roomNumber} to ${requestedRoom.roomNumber} has been submitted. ${
          priceCalculation.isUpgrade 
            ? `${alreadyPaidForCurrentRoom > 0 ? `You have already paid ₹${alreadyPaidForCurrentRoom.toLocaleString('en-IN')} for your current room. ` : ''}Payment of ₹${adjustedUpgradePayment.toLocaleString('en-IN')} is required.`
            : `You will receive ₹${priceCalculation.downgradeWalletCredit.toLocaleString('en-IN')} wallet credit after approval.`
        }`,
        type: 'general',
        recipient: student.user,
        relatedEntity: {
          entityType: 'roomChangeRequest',
          entityId: roomChangeRequest._id,
        },
      },
      { origin: 'system' }
    );

    // Send notification to admin
    await createNotification(
      {
        title: 'Room Change Request',
        message: `${student.name} (${student.studentId}) has requested a room change from ${currentRoom.roomNumber} to ${requestedRoom.roomNumber}`,
        type: 'general',
        recipientRole: 'admin',
        relatedEntity: {
          entityType: 'roomChangeRequest',
          entityId: roomChangeRequest._id,
        },
      },
      { notifyStaff: true, origin: 'student', studentDetails }
    );

    // Send notification to parent
    try {
      const Parent = (await import('../models/Parent.model.js')).default;
      const parent = await Parent.findOne({ students: student._id }).populate('user');
      if (parent && parent.user) {
        await createNotification(
          {
            title: `Room Change Request - ${student.name}`,
            message: `${student.name} has requested a room change from ${currentRoom.roomNumber} to ${requestedRoom.roomNumber}. ${
              priceCalculation.isUpgrade 
                ? `${alreadyPaidForCurrentRoom > 0 ? `Already paid: ₹${alreadyPaidForCurrentRoom.toLocaleString('en-IN')}. ` : ''}Upgrade payment required: ₹${adjustedUpgradePayment.toLocaleString('en-IN')}`
                : `Wallet credit on approval: ₹${priceCalculation.downgradeWalletCredit.toLocaleString('en-IN')}`
            }`,
            type: 'general',
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
              roomNumber: currentRoom.roomNumber,
              block: currentRoom.block,
            },
          },
          { origin: 'student' }
        );
      }
    } catch (parentNotifError) {
      console.error('Failed to send parent notification:', parentNotifError);
      // Don't fail the request if parent notification fails
    }

    res.status(201).json({
      message: 'Room change request submitted successfully. Waiting for admin approval.',
      roomChangeRequest: {
        ...roomChangeRequest.toObject(),
        priceCalculation,
      },
      requiresPayment: false,
    });
  } catch (error) {
    console.error('Request room change error:', error);
    res.status(500).json({ message: 'Error submitting room change request', error: error.message });
  }
};

/**
 * Get room change request status
 */
export const getRoomChangeRequest = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const student = await Student.findOne({ user: req.user._id });

    if (!student) {
      return res.status(404).json({ message: 'Student profile not found' });
    }

    const roomChangeRequest = await RoomChangeRequest.findOne({
      student: student._id,
      status: { $in: ['pending', 'pending_payment', 'under_review', 'approved', 'rejected'] },
    })
      .populate('currentRoom', 'roomNumber block floor roomType totalPrice')
      .populate('requestedRoom', 'roomNumber block floor roomType totalPrice capacity currentOccupancy')
      .populate('reviewedBy', 'name')
      .sort({ createdAt: -1 });

    if (!roomChangeRequest) {
      return res.json({ roomChangeRequest: null });
    }

    res.json({ roomChangeRequest });
  } catch (error) {
    console.error('Get room change request error:', error);
    res.status(500).json({ message: 'Error fetching room change request', error: error.message });
  }
};

/**
 * Get room change request history
 */
export const getRoomChangeRequestHistory = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const student = await Student.findOne({ user: req.user._id });

    if (!student) {
      return res.status(404).json({ message: 'Student profile not found' });
    }

    const requests = await RoomChangeRequest.find({
      student: student._id,
    })
      .populate('currentRoom', 'roomNumber block floor')
      .populate('requestedRoom', 'roomNumber block floor')
      .populate('reviewedBy', 'name')
      .sort({ createdAt: -1 });

    res.json({ requests });
  } catch (error) {
    console.error('Get room change request history error:', error);
    res.status(500).json({ message: 'Error fetching room change request history', error: error.message });
  }
};

/**
 * Get fees
 */
export const getFees = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const student = await Student.findOne({ user: req.user._id });

    if (!student) {
      // Return empty array instead of 404 to allow page to render
      return res.json([]);
    }

    const fees = await Fee.find({ student: student._id }).sort({ dueDate: -1 });

    res.json(fees);
  } catch (error) {
    console.error('Get fees error:', error);
    res.status(500).json({ message: 'Error fetching fees', error: error.message });
  }
};

/**
 * Make payment
 */
export const makePayment = async (req, res) => {
  try {
    const { feeId, amount, paymentMethod, transactionId, notes } = req.body;

    // Validate required fields
    if (!feeId) {
      return res.status(400).json({ message: 'Fee ID is required' });
    }
    if (!amount || amount <= 0) {
      return res.status(400).json({ message: 'Valid payment amount is required' });
    }

    const user = await User.findById(req.user._id);
    const student = await Student.findOne({ user: req.user._id })
      .populate('room', 'roomNumber block floor');

    if (!student) {
      return res.status(404).json({ message: 'Student profile not found' });
    }

    const fee = await Fee.findById(feeId);

    if (!fee) {
      return res.status(404).json({ message: 'Fee not found' });
    }

    // Verify fee belongs to student
    if (fee.student.toString() !== student._id.toString()) {
      return res.status(403).json({ message: 'You do not have permission to pay this fee' });
    }

    // Check if fee is already fully paid
    const remainingAmount = fee.amount - (fee.paidAmount || 0);
    if (remainingAmount <= 0) {
      return res.status(400).json({ 
        message: 'This fee is already fully paid. No additional payment is required.' 
      });
    }

    // Validate payment amount doesn't exceed remaining balance
    if (amount > remainingAmount) {
      return res.status(400).json({ 
        message: `Payment amount (₹${amount.toLocaleString('en-IN')}) cannot exceed remaining balance (₹${remainingAmount.toLocaleString('en-IN')})` 
      });
    }

    // Validate payment amount is not zero or negative
    if (amount <= 0) {
      return res.status(400).json({ 
        message: 'Payment amount must be greater than zero' 
      });
    }

    // Check for duplicate transaction ID (prevent accidental double payment)
    if (transactionId) {
      const existingPayment = await Payment.findOne({ 
        transactionId: transactionId,
        student: student._id,
        status: 'completed'
      });
      if (existingPayment) {
        return res.status(400).json({ 
          message: 'This transaction has already been processed. Please use a different transaction ID.' 
        });
      }
    }

    // Normalize payment method to match Payment model enum
    // Valid values: 'cash', 'card', 'online', 'bank_transfer', 'online_payment', 'credit_card', 'debit_card', 'upi', 'netbanking'
    let normalizedPaymentMethod = paymentMethod || 'online_payment';
    
    // Map various payment method names to valid enum values
    const paymentMethodMap = {
      'bank_transfer': 'netbanking',
      'netbanking': 'netbanking',
      'net banking': 'netbanking',
      'upi': 'upi',
      'card': 'card',
      'credit_card': 'credit_card',
      'debit_card': 'debit_card',
      'online': 'online_payment',
      'online_payment': 'online_payment',
      'cash': 'cash'
    };
    
    // Normalize to lowercase for comparison
    const methodKey = normalizedPaymentMethod.toLowerCase();
    normalizedPaymentMethod = paymentMethodMap[methodKey] || normalizedPaymentMethod;
    
    // Validate against Payment model enum
    const validMethods = ['cash', 'card', 'online', 'bank_transfer', 'online_payment', 'credit_card', 'debit_card', 'upi', 'netbanking'];
    if (!validMethods.includes(normalizedPaymentMethod)) {
      normalizedPaymentMethod = 'online_payment'; // Fallback to online_payment if invalid
    }

    // Check for duplicate payment for the same fee within the last 5 minutes
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    const recentDuplicatePayment = await Payment.findOne({
      student: student._id,
      fee: fee._id,
      amount: amount,
      paymentType: fee.feeType,
      paymentDate: { $gte: fiveMinutesAgo },
      status: 'completed'
    });
    
    if (recentDuplicatePayment) {
      return res.status(400).json({ 
        message: 'A payment for this fee was already processed recently. Please refresh the page to see the updated status.' 
      });
    }

    // Map fee type to payment type (ensure compatibility with Payment model enum)
    const feeTypeToPaymentType = {
      'rent': 'rent',
      'deposit': 'deposit',
      'utility': 'utility',
      'maintenance': 'maintenance',
      'late_fee': 'late_fee',
      'mess_fee': 'mess_fee',
      'other': 'other',
      // Add any missing mappings
      'fine': 'fine'
    };
    
    const paymentType = feeTypeToPaymentType[fee.feeType] || 'other';
    
    // Create payment record
    const payment = await Payment.create({
      student: student._id,
      fee: fee._id, // Link payment to fee
      amount,
      paymentType: paymentType, // Use mapped payment type
      paymentMethod: normalizedPaymentMethod,
      transactionId: transactionId || `TXN-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      notes: notes || `Payment for ${fee.feeType || 'fee'}`,
      status: 'completed',
      paymentDate: new Date(),
    });

    // Update fee status
    const paidAmount = (fee.paidAmount || 0) + amount;
    fee.paidAmount = paidAmount;

    if (paidAmount >= fee.amount) {
      fee.status = 'paid';
      fee.paidDate = new Date();
      
      // If this is a rent fee and student has pending room allocation, confirm it
      if (fee.feeType === 'rent' && student.roomAllocationStatus === 'pending_payment' && student.temporaryRoom) {
        const Room = (await import('../models/Room.model.js')).default;
        const room = await Room.findById(student.temporaryRoom);
        
        if (room) {
          // Check if student is in a roommate group
          let group = null;
          if (student.roommateGroup) {
            group = await RoommateGroup.findById(student.roommateGroup)
              .populate('members', 'name studentId room temporaryRoom roomAllocationStatus paymentStatus');
          }

          // Mark student payment as PAID (PRODUCTION-READY: Individual payment tracking)
          student.paymentStatus = 'PAID';
          student.roomAllocationStatus = 'confirmed';
          student.onboardingStatus = 'confirmed';
          student.roomConfirmedAt = new Date();
          
          // Move from temporaryRoom to confirmed room
          student.room = student.temporaryRoom;
          student.temporaryRoom = null;
          await student.save();
          
          // Update room occupancy
          room.currentOccupancy = (room.currentOccupancy || room.occupied || 0) + 1;
          room.occupied = room.currentOccupancy;
          if (!room.occupants.includes(student._id)) {
            room.occupants.push(student._id);
          }
          
          // PRODUCTION-READY: Check if all group members have PAID individually
          if (group && group.status === 'room_selected' && group.selectedRoom?.toString() === room._id.toString()) {
            // Refresh group members to get latest payment status
            await group.populate('members', 'name studentId paymentStatus email user');
            
            // Check if ALL members have paymentStatus === 'PAID'
            const totalMembers = group.members.length;
            const paidMembers = group.members.filter(m => m.paymentStatus === 'PAID').length;
            const allMembersPaid = paidMembers === totalMembers;

            if (allMembersPaid) {
              // ✅ ALL MEMBERS PAID - FINALIZE ALLOCATION
              group.status = 'confirmed'; // Group payment complete
              group.paymentConfirmedAt = new Date();
              room.status = 'occupied'; // Room is now fully occupied
              await group.save();

              // Send success notification to all group members
              for (const member of group.members) {
                const memberUser = await User.findOne({ _id: member.user });
                if (memberUser) {
                  await createNotification(
                    {
                      title: '🎉 Room Confirmed - All Payments Complete!',
                      message: `All ${totalMembers} group members have completed payment. Room ${room.roomNumber} is now officially yours!`,
                      type: 'payment',
                      recipient: memberUser._id,
                      relatedEntity: {
                        entityType: 'room',
                        entityId: room._id,
                      },
                    },
                    { origin: 'system' }
                  );
                }
              }
              
              console.log(`✅ Room ${room.roomNumber} finalized - All ${totalMembers} members paid`);
            } else {
              // ⏳ WAITING for other members to pay
              const remainingMembers = totalMembers - paidMembers;
              
              // Get list of members who have paid
              const paidMembersList = group.members
                .filter(m => m.paymentStatus === 'PAID')
                .map(m => m.name)
                .join(', ');
              
              const unpaidMembersList = group.members
                .filter(m => m.paymentStatus !== 'PAID')
                .map(m => m.name)
                .join(', ');
              
              // Send notification to the student who just paid
              await createNotification(
                {
                  title: '✅ Your Payment Confirmed',
                  message: `Your payment of ₹${amount.toLocaleString('en-IN')} for room ${room.roomNumber} is confirmed! 

Payment Status: ${paidMembers}/${totalMembers} members paid
✅ Paid: ${paidMembersList}
⏳ Pending: ${unpaidMembersList}

Room will be confirmed when all members complete payment.`,
                  type: 'payment',
                  recipient: req.user._id,
                  relatedEntity: {
                    entityType: 'room',
                    entityId: room._id,
                  },
                },
                { origin: 'system' }
              );
              
              // Send notification to unpaid members to remind them
              for (const member of group.members) {
                if (member.paymentStatus !== 'PAID') {
                  const memberUser = await User.findOne({ _id: member.user });
                  if (memberUser && memberUser._id.toString() !== req.user._id.toString()) {
                    await createNotification(
                      {
                        title: '⏰ Payment Reminder - Your Turn!',
                        message: `${student.name} just paid for room ${room.roomNumber}! 

Payment Status: ${paidMembers}/${totalMembers} members paid
✅ Paid: ${paidMembersList}
⏳ Pending: ${unpaidMembersList}

Please complete YOUR payment now to confirm the room allocation.`,
                        type: 'payment',
                        recipient: memberUser._id,
                        relatedEntity: {
                          entityType: 'room',
                          entityId: room._id,
                        },
                      },
                      { origin: 'system' }
                    );
                  }
                }
              }
              
              console.log(`⏳ Room ${room.roomNumber}: ${paidMembers}/${totalMembers} members paid - ${paidMembersList}`);
            }
          } else {
            // Individual allocation (not in group)
            // Send confirmation notification
            try {
              await createNotification(
                {
                  title: 'Room Allocation Confirmed',
                  message: `Your room allocation for ${room.roomNumber} has been confirmed after successful payment.`,
                  type: 'payment',
                  recipient: req.user._id,
                  relatedEntity: {
                    entityType: 'room',
                    entityId: room._id,
                  },
                },
                { origin: 'system' }
              );
            } catch (notifError) {
              console.error('Failed to send room confirmation notification:', notifError);
            }
          }

          // Update room status if full
          if (room.currentOccupancy >= room.capacity) {
            room.status = 'occupied';
          }
          await room.save();
          
          console.log(`✅ Room allocation confirmed for student ${student.studentId} after payment`);
        }
      }
    } else if (paidAmount > 0) {
      fee.status = 'partial';
    }

    fee.paymentMethod = normalizedPaymentMethod;
    fee.transactionId = payment.transactionId;
    await fee.save();

    // Send notification to student
    try {
      await createNotification(
        {
          title: 'Payment Received',
          message: `Payment of ₹${amount.toLocaleString('en-IN')} received successfully for ${fee.feeType || 'fee'}`,
          type: 'payment',
          recipient: req.user._id,
          relatedEntity: {
            entityType: 'payment',
            entityId: payment._id,
          },
        },
        { origin: 'student' }
      );
    } catch (notifError) {
      // Don't fail payment if notification fails
      console.error('Failed to send payment notification to student:', notifError);
    }

    // Send notification to admin and staff with student details
    try {
      const feeTypeDisplay = (fee.feeType || 'fee').replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
      
      // Build comprehensive student information
      const studentInfoParts = [];
      studentInfoParts.push(`Name: ${student.name || 'N/A'}`);
      studentInfoParts.push(`Student ID: ${student.studentId || 'N/A'}`);
      if (student.course) studentInfoParts.push(`Course: ${student.course}`);
      if (student.batchYear) studentInfoParts.push(`Batch: ${student.batchYear}`);
      if (student.room?.roomNumber) {
        const roomInfo = `Room: ${student.room.roomNumber}`;
        if (student.room.block) {
          studentInfoParts.push(`${roomInfo} (Block: ${student.room.block})`);
        } else {
          studentInfoParts.push(roomInfo);
        }
      }
      
      const studentInfo = studentInfoParts.join(' | ');
      
      // Get student details for notification
      const studentDetails = {
        name: student.name,
        studentId: student.studentId,
        admissionNumber: student.studentId,
        course: student.course || null,
        batchYear: student.batchYear || null,
        roomNumber: student.room?.roomNumber || null,
        block: student.room?.block || null,
      };

      // Create a clear, formatted message with student details prominently displayed
      const notificationMessage = `FROM STUDENT:
${student.name} (ID: ${student.studentId})${student.course ? ` | ${student.course}` : ''}${student.batchYear ? ` | Batch: ${student.batchYear}` : ''}${student.room?.roomNumber ? ` | Room: ${student.room.roomNumber}${student.room.block ? ` (Block: ${student.room.block})` : ''}` : ''}

PAYMENT DETAILS:
Amount: ₹${amount.toLocaleString('en-IN')}
Fee Type: ${feeTypeDisplay}
Transaction ID: ${payment.transactionId}
Payment Method: ${payment.paymentMethod?.toUpperCase() || 'N/A'}`;
      
      await createNotification(
        {
          title: `Payment Received from ${student.name} (${student.studentId})`,
          message: notificationMessage,
          type: 'payment',
          recipientRole: 'admin',
          relatedEntity: {
            entityType: 'payment',
            entityId: payment._id,
          },
        },
        { notifyStaff: true, origin: 'student', studentDetails }
      );
    } catch (notifError) {
      // Don't fail payment if notification fails
      console.error('Failed to send payment notification to admin/staff:', notifError);
    }

    console.log(`✅ Payment successful: Student ${student.studentId} paid ₹${amount} for fee ${feeId}`);

    res.status(201).json({ 
      message: 'Payment successful', 
      payment, 
      fee,
      remainingBalance: fee.amount - paidAmount,
    });
  } catch (error) {
    console.error('❌ Make payment error:', error);
    
    // Provide more specific error messages
    if (error.name === 'ValidationError') {
      return res.status(400).json({ 
        message: 'Payment validation failed', 
        error: error.message,
        details: error.errors 
      });
    }
    
    res.status(500).json({ 
      message: 'Error processing payment', 
      error: error.message 
    });
  }
};

/**
 * Get payment history
 */
export const getPaymentHistory = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const student = await Student.findOne({ user: req.user._id });

    if (!student) {
      return res.status(404).json({ message: 'Student profile not found' });
    }

    // Get all payments and filter duplicates aggressively
    const allPayments = await Payment.find({ 
      student: student._id,
      status: { $in: ['completed', 'pending'] } // Include pending as they might be processing
    })
      .populate('fee', 'feeType amount')
      .sort({ paymentDate: -1 });

    // Remove duplicates: Group by amount + type + same day, keep only the most recent one
    const uniquePayments = [];
    const seenPayments = new Set();
    
    for (const payment of allPayments) {
      const paymentDate = new Date(payment.paymentDate);
      const dateKey = paymentDate.toISOString().substring(0, 10); // YYYY-MM-DD (same day)
      const minuteKey = paymentDate.toISOString().substring(0, 16); // YYYY-MM-DDTHH:mm
      
      // Create multiple keys to catch duplicates
      const feeId = payment.fee?._id?.toString() || 'no-fee';
      
      // Key 1: Fee + amount + type + same day (most specific)
      const key1 = `${feeId}-${payment.amount}-${payment.paymentType}-${dateKey}`;
      
      // Key 2: Amount + type + same day (for old records without fee)
      const key2 = `${payment.amount}-${payment.paymentType}-${dateKey}`;
      
      // Key 3: Amount + type + same minute (catches duplicates created seconds apart)
      const key3 = `${payment.amount}-${payment.paymentType}-${minuteKey}`;
      
      // Key 4: Transaction ID (exact duplicate)
      const key4 = payment.transactionId ? `txn-${payment.transactionId}` : null;
      
      // Check if any of these keys have been seen
      const isDuplicate = seenPayments.has(key1) || 
                         seenPayments.has(key2) || 
                         seenPayments.has(key3) ||
                         (key4 && seenPayments.has(key4));
      
      if (!isDuplicate) {
        seenPayments.add(key1);
        seenPayments.add(key2);
        seenPayments.add(key3);
        if (key4) {
          seenPayments.add(key4);
        }
        uniquePayments.push(payment);
      }
    }

    res.json(uniquePayments);
  } catch (error) {
    console.error('Get payment history error:', error);
    res.status(500).json({ message: 'Error fetching payment history', error: error.message });
  }
};

/**
 * Download payment receipt as PDF
 */
export const downloadReceipt = async (req, res) => {
  try {
    const { paymentId } = req.params;
    const user = await User.findById(req.user._id);
    const student = await Student.findOne({ user: req.user._id })
      .populate('room', 'roomNumber block floor');

    if (!student) {
      return res.status(404).json({ message: 'Student profile not found' });
    }

    // Find payment and verify it belongs to the student
    const payment = await Payment.findById(paymentId)
      .populate('fee', 'feeType amount paidAmount dueDate description');

    if (!payment) {
      return res.status(404).json({ message: 'Payment not found' });
    }

    // Verify payment belongs to student
    if (payment.student.toString() !== student._id.toString()) {
      return res.status(403).json({ message: 'You do not have permission to access this receipt' });
    }

    // Generate PDF receipt
    const pdfBuffer = await generatePaymentReceipt(payment, student, payment.fee);

    // Set response headers
    const fileName = `Receipt_${payment.transactionId || payment._id}_${new Date(payment.paymentDate).toISOString().split('T')[0]}.pdf`;
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.setHeader('Content-Length', pdfBuffer.length);

    res.send(pdfBuffer);
  } catch (error) {
    console.error('Download receipt error:', error);
    res.status(500).json({ message: 'Error generating receipt', error: error.message });
  }
};

/**
 * Get attendance
 */
export const getAttendance = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const student = await Student.findOne({ user: req.user._id });

    if (!student) {
      return res.status(404).json({ message: 'Student profile not found' });
    }

    const { startDate, endDate } = req.query;
    const query = { student: student._id, type: 'student' };

    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }

    const attendance = await Attendance.find(query)
      .populate('markedBy', 'name')
      .sort({ date: -1 });

    res.json(attendance);
  } catch (error) {
    console.error('Get attendance error:', error);
    res.status(500).json({ message: 'Error fetching attendance', error: error.message });
  }
};

/**
 * Valid resolvable complaint categories (hostel-related, not mess)
 */
const VALID_COMPLAINT_CATEGORIES = [
  'room_furniture',   // Room/Furniture
  'electrical',       // Electrical
  'water_plumbing',  // Water/Plumbing
  'cleanliness',     // Cleanliness
  'internet_wifi',   // Internet/Wi-Fi
  'security',        // Security
  'other'            // Others
];

/**
 * Check if complaint is valid and resolvable
 * Mess complaints are not allowed - they should be suggestions only
 */
const isValidComplaint = (category, title, description) => {
  const lowerTitle = title.toLowerCase();
  const lowerDesc = description.toLowerCase();
  
  // Block mess-related complaints
  const messKeywords = ['mess', 'food quality', 'food taste', 'food menu', 'canteen', 'dining'];
  const isMessRelated = messKeywords.some(keyword => 
    lowerTitle.includes(keyword) || lowerDesc.includes(keyword)
  );
  
  if (isMessRelated) {
    return { valid: false, message: 'Mess-related issues should be submitted as suggestions, not complaints. Please use the feedback/suggestion feature instead.' };
  }
  
  // Validate category
  if (!VALID_COMPLAINT_CATEGORIES.includes(category)) {
    return { valid: false, message: 'Invalid complaint category. Please select a valid category.' };
  }
  
  return { valid: true };
};

/**
 * Submit complaint
 * Only allows resolvable hostel-related complaints, not mess complaints
 */
export const submitComplaint = async (req, res) => {
  try {
    const { title, description, category, priority, roomId } = req.body;

    const user = await User.findById(req.user._id);
    const student = await Student.findOne({ user: req.user._id })
      .populate('room', 'roomNumber');

    if (!student) {
      return res.status(404).json({ message: 'Student profile not found' });
    }

    // Validate required fields
    if (!category) {
      return res.status(400).json({ message: 'Category is required' });
    }
    if (!priority) {
      return res.status(400).json({ message: 'Priority is required' });
    }
    if (!title || !description) {
      return res.status(400).json({ message: 'Title and description are required' });
    }

    // Validate complaint category
    const validCategories = ['room_furniture', 'electrical', 'water_plumbing', 'cleanliness', 'internet_wifi', 'security', 'other'];
    if (!validCategories.includes(category)) {
      return res.status(400).json({ message: 'Invalid complaint category' });
    }

    // Validate priority
    const validPriorities = ['low', 'medium', 'high', 'urgent'];
    if (!validPriorities.includes(priority)) {
      return res.status(400).json({ message: 'Invalid priority level' });
    }

    // Get student identity metadata
    const studentIdentity = await getStudentIdentity(student);

    const complaint = await Complaint.create({
      student: student._id,
      room: roomId || student.room,
      title,
      description,
      category,
      priority,
      status: 'requested', // Changed from 'pending' to 'requested'
      studentIdentity, // Attach identity metadata
    });

    // Get student details for notification
    const studentDetails = {
      name: student.name,
      studentId: student.studentId,
      admissionNumber: student.studentId, // studentId is the admission number
      course: student.course || null,
      batchYear: student.batchYear || null,
      roomNumber: student.room?.roomNumber || null,
      block: student.room?.block || null,
    };

    // Send notification to admin
    await createNotification(
      {
        title: 'New Complaint',
        message: `${student.name} (${student.studentId}) submitted a complaint: ${title}`,
        type: 'complaint',
        recipientRole: 'admin',
        relatedEntity: {
          entityType: 'complaint',
          entityId: complaint._id,
        },
      },
      { notifyStaff: true, origin: 'student', studentDetails }
    );

    res.status(201).json({ message: 'Complaint submitted successfully', complaint });
  } catch (error) {
    console.error('Submit complaint error:', error);
    res.status(500).json({ message: 'Error submitting complaint', error: error.message });
  }
};

/**
 * Get complaints
 */
export const getComplaints = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const student = await Student.findOne({ user: req.user._id });

    if (!student) {
      return res.status(404).json({ message: 'Student profile not found' });
    }

    const complaints = await Complaint.find({ student: student._id })
      .populate('room', 'roomNumber block building')
      .populate('assignedTo', 'name staffId')
      .populate('resolvedBy', 'name')
      .sort({ createdAt: -1 });

    // Ensure studentIdentity is populated with complete details
    const enrichedComplaints = complaints.map(complaint => {
      const complaintObj = complaint.toObject();
      
      // Ensure studentIdentity has all required fields
      if (!complaintObj.studentIdentity || !complaintObj.studentIdentity.phone || !complaintObj.studentIdentity.email) {
        complaintObj.studentIdentity = {
          name: student.name || complaintObj.studentIdentity?.name || null,
          admissionNumber: student.studentId || complaintObj.studentIdentity?.admissionNumber || null,
          registerNumber: student.studentId || complaintObj.studentIdentity?.registerNumber || null,
          course: student.course || complaintObj.studentIdentity?.course || null,
          batchYear: student.batchYear || complaintObj.studentIdentity?.batchYear || null,
          year: student.year || complaintObj.studentIdentity?.year || null,
          roomNumber: complaint.room?.roomNumber || complaintObj.studentIdentity?.roomNumber || null,
          phone: student.phone || complaintObj.studentIdentity?.phone || null,
          email: student.email || complaintObj.studentIdentity?.email || null,
        };
      }
      
      return complaintObj;
    });

    res.json(enrichedComplaints);
  } catch (error) {
    console.error('Get complaints error:', error);
    res.status(500).json({ message: 'Error fetching complaints', error: error.message });
  }
};

/**
 * Request outing
 */
export const requestOuting = async (req, res) => {
  try {
    const { purpose, destination, departureDate, expectedReturnDate, emergencyContact } = req.body;

    const user = await User.findById(req.user._id);
    const student = await Student.findOne({ user: req.user._id});

    if (!student) {
      return res.status(404).json({ message: 'Student profile not found' });
    }

    // Check if student has an active outing (approved but not returned)
    const activeOuting = await OutingRequest.findOne({
      student: student._id,
      status: 'approved',
      exitTime: { $exists: true },
      returnTime: null
    });

    if (activeOuting) {
      const exitDate = new Date(activeOuting.exitTime).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
      return res.status(400).json({
        message: `You have an active outing (left on ${exitDate} to ${activeOuting.destination}). You must return and check in before requesting another outing pass.`,
        activeOuting: {
          destination: activeOuting.destination,
          exitTime: activeOuting.exitTime,
          expectedReturnDate: activeOuting.expectedReturnDate
        }
      });
    }

    // Check for pending approval
    const pendingOuting = await OutingRequest.findOne({
      student: student._id,
      status: 'pending'
    });

    if (pendingOuting) {
      return res.status(400).json({
        message: 'You already have a pending outing request awaiting approval. Please wait for it to be processed.',
        pendingOuting: {
          destination: pendingOuting.destination,
          departureDate: pendingOuting.departureDate
        }
      });
    }

    const outingRequest = await OutingRequest.create({
      student: student._id,
      purpose,
      destination,
      departureDate,
      expectedReturnDate,
      emergencyContact,
      status: 'pending',
    });

    // Get student details for notifications
    const studentDetails = {
      name: student.name,
      studentId: student.studentId,
      admissionNumber: student.studentId,
      course: student.course || null,
      batchYear: student.batchYear || null,
      roomNumber: student.room?.roomNumber || null,
      block: student.room?.block || null,
    };

    // Send notification to admin
    await createNotification(
      {
        title: 'New Outing Request',
        message: `${student.name} (${student.studentId}) requested outing to ${destination}. Purpose: ${purpose}`,
        type: 'outing',
        recipientRole: 'admin',
        relatedEntity: {
          entityType: 'outing',
          entityId: outingRequest._id,
        },
        studentDetails,
      },
      { notifyStaff: true, origin: 'student' }
    );

    // Send notification to parent
    const Parent = (await import('../models/Parent.model.js')).default;
    const parent = await Parent.findOne({ students: student._id }).populate('user');
    if (parent && parent.user) {
      await createNotification(
        {
          title: 'Outing Request Submitted',
          message: `${student.name} has submitted an outing request to ${destination}. Purpose: ${purpose}. Departure: ${new Date(departureDate).toLocaleDateString()}, Expected Return: ${new Date(expectedReturnDate).toLocaleDateString()}`,
          type: 'outing',
          recipient: parent.user._id,
          recipientRole: 'parent',
          relatedEntity: {
            entityType: 'outing',
            entityId: outingRequest._id,
          },
          studentDetails,
        },
        { origin: 'student' }
      );
    }

    res.status(201).json({ message: 'Outing request submitted successfully', outingRequest });
  } catch (error) {
    console.error('Request outing error:', error);
    res.status(500).json({ message: 'Error submitting outing request', error: error.message });
  }
};

/**
 * Get outing requests
 */
export const getOutingRequests = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const student = await Student.findOne({ user: req.user._id });

    if (!student) {
      return res.status(404).json({ message: 'Student profile not found' });
    }

    const requests = await OutingRequest.find({ student: student._id })
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

/**
 * Update outing request return date
 */
export const updateOutingReturnDate = async (req, res) => {
  try {
    const { expectedReturnDate } = req.body;
    const { id } = req.params;

    if (!expectedReturnDate) {
      return res.status(400).json({ message: 'Expected return date is required' });
    }

    const student = await Student.findOne({ user: req.user._id });
    if (!student) {
      return res.status(404).json({ message: 'Student profile not found' });
    }

    const request = await OutingRequest.findById(id);
    if (!request) {
      return res.status(404).json({ message: 'Outing request not found' });
    }

    // Verify the request belongs to this student
    if (request.student.toString() !== student._id.toString()) {
      return res.status(403).json({ message: 'You can only update your own outing requests' });
    }

    // Only allow update if request is approved and student hasn't returned yet
    if (request.status !== 'approved') {
      return res.status(400).json({ message: 'Can only update return date for approved requests' });
    }

    if (request.returnTime) {
      return res.status(400).json({ message: 'Cannot update return date after student has returned' });
    }

    const newReturnDate = new Date(expectedReturnDate);
    if (newReturnDate < request.departureDate) {
      return res.status(400).json({ message: 'Return date cannot be before departure date' });
    }

    request.expectedReturnDate = newReturnDate;
    await request.save();

    // Notify admin and parent about the return date change
    const studentDetails = {
      name: student.name,
      studentId: student.studentId,
      admissionNumber: student.studentId,
    };

    await createNotification(
      {
        title: 'Outing Return Date Updated',
        message: `${student.name} updated their expected return date to ${newReturnDate.toLocaleDateString('en-IN')} for outing to ${request.destination}`,
        type: 'outing',
        recipientRole: 'admin',
        relatedEntity: {
          entityType: 'outing',
          entityId: request._id,
        },
        studentDetails,
      },
      { notifyStaff: true, origin: 'student' }
    );

    const Parent = (await import('../models/Parent.model.js')).default;
    const parent = await Parent.findOne({ students: student._id }).populate('user');
    if (parent && parent.user) {
      await createNotification(
        {
          title: 'Outing Return Date Updated',
          message: `${student.name} updated their expected return date to ${newReturnDate.toLocaleDateString('en-IN')} for outing to ${request.destination}`,
          type: 'outing',
          recipient: parent.user._id,
          recipientRole: 'parent',
          relatedEntity: {
            entityType: 'outing',
            entityId: request._id,
          },
          studentDetails,
        },
        { origin: 'student' }
      );
    }

    res.json({ message: 'Return date updated successfully', request });
  } catch (error) {
    console.error('Update outing return date error:', error);
    res.status(500).json({ message: 'Error updating return date', error: error.message });
  }
};

/**
 * Get or update meal preferences
 */
export const getMealPreferences = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const student = await Student.findOne({ user: req.user._id });

    if (!student) {
      return res.status(404).json({ message: 'Student profile not found' });
    }

    let mealPreference = await MealPreference.findOne({ student: student._id });

    if (!mealPreference) {
      mealPreference = await MealPreference.create({ student: student._id });
    }

    res.json(mealPreference);
  } catch (error) {
    console.error('Get meal preferences error:', error);
    res.status(500).json({ message: 'Error fetching meal preferences', error: error.message });
  }
};

export const updateMealPreferences = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const student = await Student.findOne({ user: req.user._id });

    if (!student) {
      return res.status(404).json({ message: 'Student profile not found' });
    }

    let mealPreference = await MealPreference.findOne({ student: student._id });

    if (!mealPreference) {
      mealPreference = await MealPreference.create({ student: student._id, ...req.body });
    } else {
      mealPreference = await MealPreference.findByIdAndUpdate(
        mealPreference._id,
        { ...req.body, updatedAt: new Date() },
        { new: true, runValidators: true }
      );
    }

    res.json({ message: 'Meal preferences updated successfully', mealPreference });
  } catch (error) {
    console.error('Update meal preferences error:', error);
    res.status(500).json({ message: 'Error updating meal preferences', error: error.message });
  }
};

/**
 * Submit meal suggestion
 */
export const submitMealSuggestion = async (req, res) => {
  try {
    const { mealSlot, suggestion } = req.body;

    if (!mealSlot || !suggestion || suggestion.trim() === '') {
      return res.status(400).json({ message: 'Meal slot and suggestion are required' });
    }

    if (!['breakfast', 'lunch', 'dinner'].includes(mealSlot.toLowerCase())) {
      return res.status(400).json({ message: 'Invalid meal slot. Must be breakfast, lunch, or dinner' });
    }

    const user = await User.findById(req.user._id);
    const student = await Student.findOne({ user: req.user._id })
      .populate('room', 'roomNumber block');

    if (!student) {
      return res.status(404).json({ message: 'Student profile not found' });
    }

    // Get student identity
    const studentIdentity = await getStudentIdentity(student);

    const MealSuggestion = (await import('../models/MealSuggestion.model.js')).default;

    const mealSuggestion = await MealSuggestion.create({
      student: student._id,
      mealSlot: mealSlot.toLowerCase(),
      suggestion: suggestion.trim(),
      status: 'pending',
      studentIdentity,
    });

    // Send notification to admin and staff
    await createNotification(
      {
        title: 'New Meal Suggestion',
        message: `${student.name} (${student.studentId}) submitted a meal suggestion for ${mealSlot}: ${suggestion.substring(0, 50)}${suggestion.length > 50 ? '...' : ''}`,
        type: 'general',
        recipientRole: 'admin',
        relatedEntity: {
          entityType: 'mealSuggestion',
          entityId: mealSuggestion._id,
        },
      },
      { 
        notifyStaff: true, 
        origin: 'student',
        studentDetails: {
          name: student.name,
          studentId: student.studentId,
          admissionNumber: student.studentId,
          course: student.course || null,
          batchYear: student.batchYear || null,
          roomNumber: student.room?.roomNumber || null,
          block: student.room?.block || null,
        }
      }
    );

    res.status(201).json({ message: 'Meal suggestion submitted successfully', mealSuggestion });
  } catch (error) {
    console.error('Submit meal suggestion error:', error);
    res.status(500).json({ message: 'Error submitting meal suggestion', error: error.message });
  }
};

/**
 * Get meal suggestions (for student - their own suggestions)
 */
export const getMealSuggestions = async (req, res) => {
  try {
    const student = await Student.findOne({ user: req.user._id });

    if (!student) {
      return res.status(404).json({ message: 'Student profile not found' });
    }

    const MealSuggestion = (await import('../models/MealSuggestion.model.js')).default;

    const suggestions = await MealSuggestion.find({ student: student._id })
      .sort({ createdAt: -1 })
      .limit(50);

    res.json(suggestions);
  } catch (error) {
    console.error('Get meal suggestions error:', error);
    res.status(500).json({ message: 'Error fetching meal suggestions', error: error.message });
  }
};

/**
 * Get notifications
 */
export const getNotifications = async (req, res) => {
  try {
    const { isRead } = req.query;
    const query = {
      $and: [
        {
          $or: [
            { recipient: req.user._id },
            { recipientRole: 'student' },
          ],
        },
        // Exclude all staff-admin interaction notifications
        {
          $or: [
            { 'relatedEntity.entityType': { $nin: ['staffSchedule', 'staff', 'staffLeaveRequest', 'stockRequest'] } },
            { 'relatedEntity.entityType': { $exists: false } },
          ],
        },
      ],
    };

    if (isRead !== undefined) query.isRead = isRead === 'true';

    const notifications = await Notification.find(query)
      .sort({ sentAt: -1 })
      .limit(50);

    // Additional filtering to ensure no staff-admin interactions slip through
    const filteredNotifications = notifications.filter(notification => {
      // Exclude staff-related entity types
      const staffEntityTypes = ['staffSchedule', 'staff', 'staffLeaveRequest', 'stockRequest'];
      if (notification.relatedEntity?.entityType && 
          staffEntityTypes.includes(notification.relatedEntity.entityType)) {
        return false;
      }
      
      // Exclude notifications with recipientRole 'admin' or 'staff' that aren't directly sent to the student
      if (notification.recipientRole === 'admin' || notification.recipientRole === 'staff') {
        // Only include if directly sent to this student
        if (notification.recipient?.toString() !== req.user._id.toString()) {
          return false;
        }
      }
      
      return true;
    });

    res.json(filteredNotifications);
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
    const notification = await Notification.findByIdAndUpdate(
      req.params.id,
      { isRead: true, readAt: new Date() },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    res.json({ message: 'Notification marked as read', notification });
  } catch (error) {
    console.error('Mark notification as read error:', error);
    res.status(500).json({ message: 'Error marking notification as read', error: error.message });
  }
};

/**
 * Get notification preferences
 */
export const getNotificationPreferences = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('notificationPreferences');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Return default preferences if not set
    const preferences = user.notificationPreferences || {
      email: true,
      sms: false,
      push: true,
      paymentReminders: true,
      maintenanceUpdates: true,
      eventNotifications: true,
    };

    res.json(preferences);
  } catch (error) {
    console.error('Get notification preferences error:', error);
    res.status(500).json({ message: 'Error fetching notification preferences', error: error.message });
  }
};

/**
 * Update notification preferences
 */
export const updateNotificationPreferences = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Update notification preferences
    if (req.body.email !== undefined) user.notificationPreferences.email = req.body.email;
    if (req.body.sms !== undefined) user.notificationPreferences.sms = req.body.sms;
    if (req.body.push !== undefined) user.notificationPreferences.push = req.body.push;
    if (req.body.paymentReminders !== undefined) user.notificationPreferences.paymentReminders = req.body.paymentReminders;
    if (req.body.maintenanceUpdates !== undefined) user.notificationPreferences.maintenanceUpdates = req.body.maintenanceUpdates;
    if (req.body.eventNotifications !== undefined) user.notificationPreferences.eventNotifications = req.body.eventNotifications;

    await user.save();

    res.json({ 
      message: 'Notification preferences updated successfully', 
      preferences: user.notificationPreferences 
    });
  } catch (error) {
    console.error('Update notification preferences error:', error);
    res.status(500).json({ message: 'Error updating notification preferences', error: error.message });
  }
};

/**
 * Get room details
 */
export const getRoomDetails = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const student = await Student.findOne({ user: req.user._id })
      .populate('room');

    if (!student) {
      // Return empty data instead of 404 to allow page to render
      return res.json({
        room: null,
        roommates: []
      });
    }

    if (!student.room) {
      // Return empty data instead of 404 when no room is allocated
      return res.json({
        room: null,
        roommates: []
      });
    }

    // Get roommates
    const roommates = await Student.find({
      room: student.room._id,
      _id: { $ne: student._id },
    }).select('name studentId email phone');

    res.json({
      room: student.room,
      roommates,
    });
  } catch (error) {
    console.error('Get room details error:', error);
    res.status(500).json({ message: 'Error fetching room details', error: error.message });
  }
};

/**
 * Get visitor history
 */
export const getVisitorHistory = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const student = await Student.findOne({ user: req.user._id });

    if (!student) {
      return res.status(404).json({ message: 'Student profile not found' });
    }

    const { status, startDate, endDate } = req.query;
    const query = { student: student._id };

    if (status) query.status = status;
    if (startDate || endDate) {
      query.checkIn = {};
      if (startDate) query.checkIn.$gte = new Date(startDate);
      if (endDate) query.checkIn.$lte = new Date(endDate);
    }

    const visitorLogs = await VisitorLog.find(query)
      .populate('room', 'roomNumber floor building')
      .populate('loggedBy', 'name')
      .sort({ checkIn: -1 });

    res.json(visitorLogs);
  } catch (error) {
    console.error('Get visitor history error:', error);
    res.status(500).json({ message: 'Error fetching visitor history', error: error.message });
  }
};

/**
 * Get available rooms for selection
 * Shows room type, capacity, current occupants with full details
 */
export const getAvailableRooms = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Get student's gender to filter rooms
    const student = await Student.findOne({ user: req.user._id });
    if (!student) {
      return res.status(404).json({ message: 'Student profile not found' });
    }

    if (!student.gender || (student.gender !== 'Boys' && student.gender !== 'Girls')) {
      return res.status(400).json({ 
        message: 'Student gender is not set. Please update your profile with your gender (Boys/Girls) to view available rooms.' 
      });
    }

    // Filter rooms by student's gender - DON'T filter by occupancy in query
    // We'll filter by ACTUAL occupancy after counting students
    const roomQuery = { 
      status: { $in: ['available', 'reserved'] }, // Only available and reserved rooms
      maintenanceStatus: { $ne: 'under_maintenance' }, // Exclude maintenance rooms
      gender: student.gender, // Only show rooms matching student's gender
      // REMOVED occupancy check from query - we count actual students instead
    };

    const rooms = await Room.find(roomQuery)
      .select('roomNumber block floor building roomType capacity currentOccupancy occupied amenities basePrice amenitiesPrice totalPrice rent status photos gender')
      .sort({ block: 1, floor: 1, roomNumber: 1 });

    // Count ACTUAL students for each room (confirmed + pending)
    const roomsWithActualOccupancy = await Promise.all(
      rooms.map(async (room) => {
        // Count confirmed occupants (students with room field set)
        const confirmedCount = await Student.countDocuments({ room: room._id });
        
        // Count temporary occupants (students with temporaryRoom field - pending payment)
        const temporaryCount = await Student.countDocuments({ temporaryRoom: room._id });
        
        // Get confirmed occupant details for display
        const confirmedOccupants = await Student.find({ room: room._id })
          .select('name studentId course batchYear')
          .limit(10); // Limit to 10 for performance

        const occupantsDetails = confirmedOccupants.map(occupant => ({
          name: occupant.name,
          admissionNumber: occupant.studentId,
          course: occupant.course,
          batchYear: occupant.batchYear,
        }));

        // Calculate actual occupancy
        const totalOccupancy = confirmedCount + temporaryCount;
        const availableSlots = room.capacity - totalOccupancy;

        return {
          ...room.toObject(),
          roomType: room.roomType || 'Double',
          availableSlots: availableSlots,
          currentOccupants: occupantsDetails,
          maxCapacity: room.capacity,
          currentOccupancy: confirmedCount, // Actual confirmed count
          pendingOccupancy: temporaryCount, // Actual pending count
          totalOccupancy: totalOccupancy, // Total actual count
          totalPrice: room.totalPrice || room.rent,
          isFull: totalOccupancy >= room.capacity, // Based on ACTUAL count
        };
      })
    );

    // CRITICAL: Filter out fully occupied rooms based on ACTUAL student counts
    const availableRooms = roomsWithActualOccupancy.filter(room => {
      // Room must have at least 1 available slot
      return !room.isFull && room.availableSlots > 0 && room.totalOccupancy < room.capacity;
    });

    res.json(availableRooms);
  } catch (error) {
    console.error('Get available rooms error:', error);
    res.status(500).json({ message: 'Error fetching available rooms', error: error.message });
  }
};

/**
 * Select room with AI-matched roommates
 * Student chooses a room and accepts AI-matched roommates
 */
export const selectRoomWithRoommates = async (req, res) => {
  try {
    const { roomId, roommateIds } = req.body;
    const user = await User.findById(req.user._id);
    const student = await Student.findOne({ user: req.user._id })
      .populate('room', 'roomNumber');

    if (!student) {
      return res.status(404).json({ message: 'Student profile not found' });
    }

    // Check if student already has a room
    if (student.room || student.temporaryRoom) {
      return res.status(400).json({ 
        message: `You already have a room allocated${student.room ? `: ${student.room.roomNumber}` : ''}. Please request a room change if needed.` 
      });
    }

    const room = await Room.findById(roomId);
    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }

    // CRITICAL: Validate room capacity using ACTUAL occupancy (confirmed + pending)
    const totalStudents = 1 + (roommateIds?.length || 0); // Current student + roommates
    const confirmedCount = await Student.countDocuments({ room: room._id });
    const temporaryCount = await Student.countDocuments({ temporaryRoom: room._id });
    const actualOccupancy = confirmedCount + temporaryCount;
    
    if (actualOccupancy + totalStudents > room.capacity) {
      return res.status(400).json({ 
        message: `Room capacity (${room.capacity}) exceeded. Cannot accommodate ${totalStudents} students.`,
        details: `Current occupancy: ${actualOccupancy}, Requested students: ${totalStudents}, Total: ${actualOccupancy + totalStudents}`
      });
    }

    // Validate student's gender matches room
    if (!student.gender || (student.gender !== 'Boys' && student.gender !== 'Girls')) {
      return res.status(400).json({ 
        message: 'Student gender is not set. Please update your profile with your gender (Boys/Girls) before selecting a room.' 
      });
    }

    if (room.gender && room.gender !== student.gender) {
      return res.status(400).json({ 
        message: `This room is restricted to ${room.gender}. You can only select rooms for ${student.gender}.` 
      });
    }

    // Validate roommates if provided
    let roommates = [];
    if (roommateIds && roommateIds.length > 0) {
      roommates = await Student.find({ _id: { $in: roommateIds } });
      
      if (roommates.length !== roommateIds.length) {
        return res.status(404).json({ message: 'One or more roommates not found' });
      }

      // Validate all roommates are same gender
      if (roommates.some(r => r.gender !== student.gender)) {
        return res.status(400).json({ message: 'All roommates must be of the same gender as you' });
      }

      // Validate roommates don't have rooms
      if (roommates.some(r => r.room || r.temporaryRoom)) {
        return res.status(400).json({ message: 'One or more selected roommates already have a room allocated' });
      }
    }

    // Check maintenance status
    if (room.maintenanceStatus === 'under_maintenance' || room.maintenanceStatus === 'blocked') {
      return res.status(400).json({ message: 'Room is under maintenance and cannot be selected.' });
    }

    if (room.status !== 'available' && room.status !== 'reserved') {
      return res.status(400).json({ message: 'Room is not available for selection.' });
    }

    // Allocate room to current student and roommates temporarily (pending payment)
    const allStudents = [student, ...roommates];
    
    for (const s of allStudents) {
      s.temporaryRoom = roomId;
      s.roomAllocationStatus = 'pending_payment';
      s.onboardingStatus = 'room_selected'; // Update onboarding status
      s.roomAllocatedAt = new Date();
      await s.save();
    }

    // Update room occupancy (but don't mark as fully occupied until payment)
    room.currentOccupancy = occupancy + totalStudents;
    room.occupied = room.currentOccupancy;
    if (room.currentOccupancy >= room.capacity) {
      room.status = 'reserved'; // Reserve until payment confirmation
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

    for (const s of allStudents) {
      const existingFee = await Fee.findOne({
        student: s._id,
        feeType: 'rent',
        status: { $in: ['pending', 'partial', 'paid'] },
        year: dueDate.getFullYear(),
      });

      if (!existingFee) {
        await Fee.create({
          student: s._id,
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

    // Send notifications to all students
    const { createNotification } = await import('../utils/notificationHelper.js');
    for (const s of allStudents) {
      const sUser = await User.findById(s.user);
      if (sUser) {
        await createNotification(
          {
            title: 'Room Selected - Payment Required',
            message: `Room ${room.roomNumber} has been selected with ${allStudents.length - 1} roommate(s). Please complete the payment to confirm your room allocation.`,
            type: 'payment',
            recipient: sUser._id,
            relatedEntity: {
              entityType: 'room',
              entityId: room._id,
            },
          },
          { origin: 'student' }
        );
      }
    }

    // Get updated room details
    const updatedRoom = await Room.findById(roomId)
      .populate({
        path: 'occupants',
        select: 'name studentId course batchYear',
      });

    res.status(200).json({ 
      message: `Room ${room.roomNumber} selected successfully with ${roommates.length} roommate(s). Payment required to confirm allocation.`,
      room: updatedRoom,
      roommates: roommates.map(r => ({
        _id: r._id,
        name: r.name,
        studentId: r.studentId,
        course: r.course,
        year: r.year,
      })),
      requiresPayment: true,
      allocationStatus: 'pending_payment',
    });
  } catch (error) {
    console.error('Select room with roommates error:', error);
    res.status(500).json({ message: 'Error selecting room', error: error.message });
  }
};

/**
 * Select room manually (direct allocation)
 * Student chooses their room and it's allocated immediately
 */
export const selectRoom = async (req, res) => {
  try {
    const { roomId } = req.body;
    const user = await User.findById(req.user._id);
    const student = await Student.findOne({ user: req.user._id })
      .populate('room', 'roomNumber');

    if (!student) {
      return res.status(404).json({ message: 'Student profile not found' });
    }

    // Check if student already has a room (confirmed or temporary)
    if (student.room || student.temporaryRoom) {
      return res.status(400).json({ 
        message: `You already have a room ${student.room ? 'allocated' : 'pending payment'}. Please request a room change if needed.` 
      });
    }

    // Check if student is in an active roommate group (prevent individual selection)
    if (student.roommateGroup) {
      const group = await RoommateGroup.findById(student.roommateGroup);
      if (group && ['pending', 'confirmed', 'room_selected', 'payment_pending'].includes(group.status)) {
        return res.status(400).json({ 
          message: 'You are in an active roommate group. Please select a room through the group leader, or leave the group first.' 
        });
      }
    }

    const room = await Room.findById(roomId);
    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }

    // CRITICAL: Check ACTUAL room occupancy (confirmed + pending)
    const confirmedCount = await Student.countDocuments({ room: room._id });
    const temporaryCount = await Student.countDocuments({ temporaryRoom: room._id });
    const actualOccupancy = confirmedCount + temporaryCount;
    
    if (actualOccupancy >= room.capacity) {
      return res.status(400).json({ 
        message: 'Room is full. Please select another room.',
        details: `Room capacity: ${room.capacity}, Current occupancy: ${actualOccupancy}` 
      });
    }

    // Check if student's gender matches room's gender
    if (!student.gender || (student.gender !== 'Boys' && student.gender !== 'Girls')) {
      return res.status(400).json({ 
        message: 'Student gender is not set. Please update your profile with your gender (Boys/Girls) before selecting a room.' 
      });
    }

    if (room.gender && room.gender !== student.gender) {
      return res.status(400).json({ 
        message: `This room is restricted to ${room.gender}. You can only select rooms for ${student.gender}.` 
      });
    }

    // Check maintenance status
    if (room.maintenanceStatus === 'under_maintenance' || room.maintenanceStatus === 'blocked') {
      return res.status(400).json({ message: 'Room is under maintenance and cannot be allocated.' });
    }

    if (room.status !== 'available' && room.status !== 'reserved') {
      return res.status(400).json({ message: 'Room is not available for selection.' });
    }

    // Allocate room temporarily (pending payment confirmation) - Two-stage allocation
    student.temporaryRoom = roomId;
    student.roomAllocationStatus = 'pending_payment';
    student.onboardingStatus = 'room_selected'; // Update onboarding status
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
      
      // Calculate due date as 10 days from room allocation date
      const allocationDate = new Date();
      const dueDate = new Date(allocationDate);
      dueDate.setDate(dueDate.getDate() + 10); // Payment due in 10 days

      // IMPORTANT: Recalculate room price to ensure accuracy
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
          description: `Room fee for ${room.roomType} room (${room.roomNumber}) - Payment due within 10 days. Late fee: ₹50/day after due date.`,
          year: dueDate.getFullYear(),
          month: null,
        });
      }
    } catch (feeError) {
      console.error('Error generating room fee:', feeError);
      // Don't fail the room selection if fee generation fails
      // Fee can be generated manually later
    }

    // Send notification to student
    const { createNotification } = await import('../utils/notificationHelper.js');
    const studentUser = await User.findById(student.user);
    if (studentUser) {
      await createNotification(
        {
          title: 'Room Selected - Payment Required',
          message: `Room ${room.roomNumber} has been selected. Please complete the payment to confirm your room allocation.`,
          type: 'payment',
          recipient: studentUser._id,
          relatedEntity: {
            entityType: 'room',
            entityId: room._id,
          },
        },
        { origin: 'student' }
      );
    }

    // Send notification to admin
    await createNotification(
      {
        title: 'Room Selected',
        message: `${student.name} (${student.studentId}) selected room ${room.roomNumber} (pending payment)`,
        type: 'general',
        recipientRole: 'admin',
        relatedEntity: {
          entityType: 'room',
          entityId: room._id,
        },
      },
      { notifyStaff: true, origin: 'student' }
    );

    // Get updated room details
    const updatedRoom = await Room.findById(roomId)
      .populate({
        path: 'occupants',
        select: 'name studentId course batchYear',
      });

    res.status(200).json({ 
      message: 'Room selected successfully. Please complete payment to confirm allocation.', 
      room: updatedRoom,
      requiresPayment: true,
      allocationStatus: 'pending_payment',
      student 
    });
  } catch (error) {
    console.error('Select room error:', error);
    res.status(500).json({ message: 'Error selecting room', error: error.message });
  }
};

/**
 * Request room selection (legacy - for admin approval workflow if needed)
 */
export const requestRoomSelection = async (req, res) => {
  try {
    const { roomId, note } = req.body;
    const user = await User.findById(req.user._id);
    const student = await Student.findOne({ user: req.user._id });

    if (!student) {
      return res.status(404).json({ message: 'Student profile not found' });
    }

    const room = await Room.findById(roomId);
    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }

    // Create a complaint for room request (we'll use Complaint model for this)
    const studentIdentity = await getStudentIdentity(student);
    
    const complaint = await Complaint.create({
      student: student._id,
      room: roomId,
      title: 'Room Selection Request',
      description: `Request for room ${room.roomNumber}. ${note || ''}`,
      category: 'other',
      priority: 'medium',
      status: 'requested',
      studentIdentity,
    });

    // Get student details for notification
    const studentDetails = {
      name: student.name,
      studentId: student.studentId,
      admissionNumber: student.studentId,
      course: student.course || null,
      batchYear: student.batchYear || null,
      roomNumber: room.roomNumber || null,
      block: room.block || null,
    };

    await createNotification(
      {
        title: 'Room Selection Request',
        message: `${student.name} requested room ${room.roomNumber}`,
        type: 'complaint',
        recipientRole: 'admin',
        relatedEntity: {
          entityType: 'complaint',
          entityId: complaint._id,
        },
      },
      { notifyStaff: true, origin: 'student', studentDetails }
    );

    res.status(201).json({ message: 'Room selection request submitted successfully', complaint });
  } catch (error) {
    console.error('Request room selection error:', error);
    res.status(500).json({ message: 'Error submitting room selection request', error: error.message });
  }
};

/**
 * Get room selection requests
 */
export const getRoomSelectionRequests = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const student = await Student.findOne({ user: req.user._id });

    if (!student) {
      // Return empty array instead of 404
      return res.json([]);
    }

    const requests = await Complaint.find({
      student: student._id,
      title: 'Room Selection Request'
    })
      .populate('room', 'roomNumber floor building')
      .sort({ createdAt: -1 });

    res.json(requests);
  } catch (error) {
    console.error('Get room selection requests error:', error);
    res.status(500).json({ message: 'Error fetching room selection requests', error: error.message });
  }
};

/**
 * Get available students for roommate selection
 * Only shows students of the same gender who are not already in full groups
 */
export const getAvailableStudents = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const student = await Student.findOne({ user: req.user._id });

    if (!student) {
      return res.status(404).json({ message: 'Student profile not found' });
    }

    // Validate student has gender set
    if (!student.gender || (student.gender !== 'Boys' && student.gender !== 'Girls')) {
      return res.status(400).json({ 
        message: 'Student gender is not set. Please update your profile with your gender (Boys/Girls) to view available students for roommate selection.' 
      });
    }

    // Room type capacity mapping
    const roomCapacities = {
      'Single': 1,
      'Double': 2,
      'Triple': 3,
      'Quad': 4,
    };

    // Get all active roommate groups
    const activeGroups = await RoommateGroup.find({
      status: { $in: ['pending', 'confirmed'] }
    }).populate('members', '_id');

    // Find students who are in FULL groups
    const studentsInFullGroups = [];
    for (const group of activeGroups) {
      const groupSize = group.members.length;
      const roomType = group.roomType;
      
      // A group is "full" if:
      // 1. It has a roomType and members count equals capacity
      // 2. OR it has already selected a room (room is not null)
      const isFull = (roomType && roomCapacities[roomType] && groupSize >= roomCapacities[roomType]) || 
                     group.room;

      if (isFull) {
        // Add all members of this full group to exclusion list
        group.members.forEach(member => {
          studentsInFullGroups.push(member._id);
        });
      }
    }

    // Get students who:
    // 1. Are not the current student
    // 2. Have the same gender
    // 3. Are active
    // 4. Don't have a room (available for roommate pairing)
    // 5. Are NOT in full groups
    // 6. Don't have temporaryRoom (pending payment)
    const availableStudents = await Student.find({
      _id: { 
        $ne: student._id,
        $nin: studentsInFullGroups // Exclude students in full groups
      },
      gender: student.gender, // Only show students of the same gender
      status: 'active',
      $or: [
        { room: { $exists: false } },
        { room: null }
      ],
      $and: [
        {
          $or: [
            { temporaryRoom: { $exists: false } },
            { temporaryRoom: null }
          ]
        }
      ]
    })
      .select('name studentId email phone course year batchYear gender personalityAttributes interests hobbies')
      .limit(50)
      .sort({ name: 1 });

    res.json(availableStudents);
  } catch (error) {
    console.error('Get available students error:', error);
    res.status(500).json({ message: 'Error fetching available students', error: error.message });
  }
};

/**
 * Send roommate request
 */
export const sendRoommateRequest = async (req, res) => {
  try {
    const { recipientId, message } = req.body;
    const user = await User.findById(req.user._id);
    const requester = await Student.findOne({ user: req.user._id });

    if (!requester) {
      return res.status(404).json({ message: 'Student profile not found' });
    }

    if (!recipientId) {
      return res.status(400).json({ message: 'Recipient ID is required' });
    }

    const recipient = await Student.findById(recipientId);
    if (!recipient) {
      return res.status(404).json({ message: 'Recipient student not found' });
    }

    // Check if students have same gender
    if (requester.gender !== recipient.gender) {
      return res.status(400).json({ message: 'You can only send roommate requests to students of the same gender.' });
    }

    // Check if request already exists
    const existingRequest = await RoommateRequest.findOne({
      $or: [
        { requester: requester._id, recipient: recipient._id },
        { requester: recipient._id, recipient: requester._id }
      ],
      status: { $in: ['pending', 'accepted'] }
    });

    if (existingRequest) {
      return res.status(400).json({ message: 'A roommate request already exists between you and this student.' });
    }

    // Create roommate request
    const roommateRequest = await RoommateRequest.create({
      requester: requester._id,
      recipient: recipient._id,
      message: message?.trim() || '',
      status: 'pending',
    });

    // Send notification to recipient
    await createNotification(
      {
        title: 'New Roommate Request',
        message: `${requester.name} (${requester.studentId}) sent you a roommate request`,
        type: 'roommate',
        recipient: recipient.user,
        relatedEntity: {
          entityType: 'roommateRequest',
          entityId: roommateRequest._id,
        },
      },
      { origin: 'student' }
    );

    res.status(201).json({ 
      message: 'Roommate request sent successfully', 
      request: roommateRequest 
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: 'A roommate request already exists between you and this student.' });
    }
    console.error('Send roommate request error:', error);
    res.status(500).json({ message: 'Error sending roommate request', error: error.message });
  }
};

/**
 * Get roommate requests (sent and received)
 */
export const getRoommateRequests = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const student = await Student.findOne({ user: req.user._id });

    if (!student) {
      return res.status(404).json({ message: 'Student profile not found' });
    }

    // Get requests where student is requester or recipient
    const requests = await RoommateRequest.find({
      $or: [
        { requester: student._id },
        { recipient: student._id }
      ]
    })
      .populate('requester', 'name studentId course batchYear')
      .populate('recipient', 'name studentId course batchYear')
      .sort({ createdAt: -1 });

    // Format requests for frontend and check if they're group requests
    const formattedRequests = await Promise.all(requests.map(async (request) => {
      const isRequester = request.requester._id.toString() === student._id.toString();
      
      // Check if this is a group request by checking if requester has a pending group
      let isGroupRequest = false;
      let relatedGroupId = null;
      
      if (request.status === 'pending') {
        // Check if requester has a roommateGroup in pending status
        const requesterStudent = await Student.findById(request.requester._id).select('roommateGroup');
        if (requesterStudent?.roommateGroup) {
          const group = await RoommateGroup.findById(requesterStudent.roommateGroup);
          if (group && group.status === 'pending' && group.members.includes(request.requester._id)) {
            isGroupRequest = true;
            relatedGroupId = group._id;
          }
        }
      }
      
      return {
        _id: request._id,
        name: isRequester ? request.recipient.name : request.requester.name,
        studentId: isRequester ? request.recipient.studentId : request.requester.studentId,
        date: request.createdAt.toISOString().split('T')[0],
        type: isRequester ? 'Sent' : 'Received',
        status: request.status === 'pending' ? 'Pending' : 
                request.status === 'accepted' ? 'Approved' : 
                request.status === 'rejected' ? 'Rejected' : 'Cancelled',
        message: request.message,
        aiMatchingScore: request.aiMatchingScore,
        recipientId: request.recipient._id,
        requesterId: request.requester._id,
        isGroupRequest: isGroupRequest, // Flag to indicate this is a group request
        relatedGroupId: relatedGroupId, // Group ID if it's a group request
      };
    }));

    res.json(formattedRequests);
  } catch (error) {
    console.error('Get roommate requests error:', error);
    res.status(500).json({ message: 'Error fetching roommate requests', error: error.message });
  }
};

/**
 * Accept roommate request
 */
export const acceptRoommateRequest = async (req, res) => {
  try {
    const { requestId } = req.body;
    const user = await User.findById(req.user._id);
    const student = await Student.findOne({ user: req.user._id });

    if (!student) {
      return res.status(404).json({ message: 'Student profile not found' });
    }

    const request = await RoommateRequest.findById(requestId)
      .populate('requester', 'name studentId user')
      .populate('recipient', 'name studentId user');

    if (!request) {
      return res.status(404).json({ message: 'Roommate request not found' });
    }

    // Verify student is the recipient
    if (request.recipient._id.toString() !== student._id.toString()) {
      return res.status(403).json({ message: 'You can only accept requests sent to you.' });
    }

    if (request.status !== 'pending') {
      return res.status(400).json({ message: 'This request has already been processed.' });
    }

    // Update request status
    request.status = 'accepted';
    request.respondedAt = new Date();
    await request.save();

    // Send notification to requester
    await createNotification(
      {
        title: 'Roommate Request Accepted',
        message: `${student.name} accepted your roommate request`,
        type: 'roommate',
        recipient: request.requester.user,
        relatedEntity: {
          entityType: 'roommateRequest',
          entityId: request._id,
        },
      },
      { origin: 'student' }
    );

    res.json({ 
      message: 'Roommate request accepted successfully', 
      request 
    });
  } catch (error) {
    console.error('Accept roommate request error:', error);
    res.status(500).json({ message: 'Error accepting roommate request', error: error.message });
  }
};

/**
 * Reject roommate request
 */
export const rejectRoommateRequest = async (req, res) => {
  try {
    const { requestId } = req.body;
    const user = await User.findById(req.user._id);
    const student = await Student.findOne({ user: req.user._id });

    if (!student) {
      return res.status(404).json({ message: 'Student profile not found' });
    }

    const request = await RoommateRequest.findById(requestId)
      .populate('requester', 'name studentId user')
      .populate('recipient', 'name studentId user');

    if (!request) {
      return res.status(404).json({ message: 'Roommate request not found' });
    }

    // Verify student is the recipient
    if (request.recipient._id.toString() !== student._id.toString()) {
      return res.status(403).json({ message: 'You can only reject requests sent to you.' });
    }

    if (request.status !== 'pending') {
      return res.status(400).json({ message: 'This request has already been processed.' });
    }

    // Update request status
    request.status = 'rejected';
    request.respondedAt = new Date();
    await request.save();

    // Send notification to requester
    await createNotification(
      {
        title: 'Roommate Request Rejected',
        message: `${student.name} rejected your roommate request`,
        type: 'roommate',
        recipient: request.requester.user,
        relatedEntity: {
          entityType: 'roommateRequest',
          entityId: request._id,
        },
      },
      { origin: 'student' }
    );

    res.json({ 
      message: 'Roommate request rejected successfully', 
      request 
    });
  } catch (error) {
    console.error('Reject roommate request error:', error);
    res.status(500).json({ message: 'Error rejecting roommate request', error: error.message });
  }
};

/**
 * Send roommate group request (NEW - Group-based workflow)
 * Creates a RoommateGroup with status "pending"
 * Can be sent even if both students have no room
 */
export const sendRoommateGroupRequest = async (req, res) => {
  try {
    const { recipientId, message, aiMatchingScore } = req.body;
    const user = await User.findById(req.user._id);
    const requester = await Student.findOne({ user: req.user._id });

    if (!requester) {
      return res.status(404).json({ message: 'Student profile not found' });
    }

    if (!recipientId) {
      return res.status(400).json({ message: 'Recipient ID is required' });
    }

    const recipient = await Student.findById(recipientId).populate('user', '_id');
    if (!recipient) {
      return res.status(404).json({ message: 'Recipient student not found' });
    }

    // Ensure recipient has a user reference
    if (!recipient.user || !recipient.user._id) {
      return res.status(400).json({ message: 'Recipient student does not have a valid user account.' });
    }

    // Check if students have same gender
    if (requester.gender !== recipient.gender) {
      return res.status(400).json({ 
        message: 'You can only send roommate requests to students of the same gender.' 
      });
    }

    // Check if requester already has a room (individual allocation blocks group formation)
    if (requester.room || requester.temporaryRoom) {
      return res.status(400).json({ 
        message: 'You already have a room allocated. Cannot form a roommate group.' 
      });
    }

    // Check if recipient already has a room
    if (recipient.room || recipient.temporaryRoom) {
      return res.status(400).json({ 
        message: 'This student already has a room allocated.' 
      });
    }

    // Check if requester is already in an active group
    // First check roommateGroup reference, then check collection
    if (requester.roommateGroup) {
      const existingGroupForRequester = await RoommateGroup.findById(requester.roommateGroup);
      if (existingGroupForRequester && ['pending', 'confirmed', 'room_selected', 'payment_pending'].includes(existingGroupForRequester.status)) {
        return res.status(400).json({ 
          message: 'You are already in an active roommate group.' 
        });
      }
    }

    // Also check if requester is in any active group (in case reference is missing)
    const existingGroupForRequester = await RoommateGroup.findOne({
      members: requester._id,
      status: { $in: ['pending', 'confirmed', 'room_selected', 'payment_pending'] }
    });

    if (existingGroupForRequester) {
      return res.status(400).json({ 
        message: 'You are already in an active roommate group.' 
      });
    }

    // Check if recipient is already in an active group
    if (recipient.roommateGroup) {
      const existingGroupForRecipient = await RoommateGroup.findById(recipient.roommateGroup);
      if (existingGroupForRecipient && ['pending', 'confirmed', 'room_selected', 'payment_pending'].includes(existingGroupForRecipient.status)) {
        return res.status(400).json({ 
          message: 'This student is already in an active roommate group.' 
        });
      }
    }

    // Also check if recipient is in any active group (in case reference is missing)
    const existingGroupForRecipient = await RoommateGroup.findOne({
      members: recipient._id,
      status: { $in: ['pending', 'confirmed', 'room_selected', 'payment_pending'] }
    });

    if (existingGroupForRecipient) {
      return res.status(400).json({ 
        message: 'This student is already in an active roommate group.' 
      });
    }

    // Check if there's already a pending request between these two
    const existingRequest = await RoommateRequest.findOne({
      $or: [
        { requester: requester._id, recipient: recipient._id },
        { requester: recipient._id, recipient: requester._id }
      ],
      status: 'pending'
    });

    if (existingRequest) {
      return res.status(400).json({ 
        message: 'A roommate request already exists between you and this student.' 
      });
    }

    // Validate room type is set
    if (!requester.selectedRoomType) {
      return res.status(400).json({ 
        message: 'Please select a room type first before sending roommate requests.' 
      });
    }

    // Single room doesn't need groups
    if (requester.selectedRoomType === 'Single') {
      return res.status(400).json({ 
        message: 'Single room does not require roommate groups.' 
      });
    }

    // Create roommate request (for notification and tracking)
    const roommateRequest = await RoommateRequest.create({
      requester: requester._id,
      recipient: recipient._id,
      message: message?.trim() || '',
      status: 'pending',
      aiMatchingScore: aiMatchingScore || null,
    });

    // Create RoommateGroup with status "pending" and room type
    // Group will be confirmed when recipient accepts
    const roommateGroup = await RoommateGroup.create({
      members: [requester._id], // Start with just requester
      createdBy: requester._id,
      status: 'pending',
      roomType: requester.selectedRoomType, // Include room type
      formationMethod: aiMatchingScore ? 'ai_matched' : 'manual',
      aiMatchingScore: aiMatchingScore || null,
    });

    // Update requester's roommateGroup reference
    requester.roommateGroup = roommateGroup._id;
    await requester.save();

    // Send notification to recipient (non-blocking - don't fail if notification fails)
    try {
      const recipientUserId = recipient.user._id || recipient.user;
      if (recipientUserId) {
        await createNotification(
          {
            title: 'New Roommate Group Request',
            message: `${requester.name} (${requester.studentId}) wants to form a roommate group with you`,
            type: 'roommate',
            recipient: recipientUserId,
            relatedEntity: {
              entityType: 'roommateGroup',
              entityId: roommateGroup._id,
            },
          },
          { origin: 'student' }
        );
      }
    } catch (notifError) {
      console.error('Failed to send notification (non-critical):', notifError);
      // Don't fail the request if notification fails - group creation is more important
    }

    res.status(201).json({ 
      message: 'Roommate group request sent successfully',
      group: roommateGroup,
      request: roommateRequest
    });
  } catch (error) {
    console.error('Send roommate group request error:', error);
    res.status(500).json({ 
      message: 'Error sending roommate group request', 
      error: error.message 
    });
  }
};

/**
 * Respond to roommate group request (NEW - Group-based workflow)
 * Accept or Reject request
 * If accepted: RoommateGroup.status = "confirmed", onboardingStatus = "roommate_confirmed"
 */
export const respondToRoommateGroupRequest = async (req, res) => {
  try {
    const { requestId, action } = req.body; // action: 'accept' or 'reject'
    const user = await User.findById(req.user._id);
    const student = await Student.findOne({ user: req.user._id });

    if (!student) {
      return res.status(404).json({ message: 'Student profile not found' });
    }

    if (!['accept', 'reject'].includes(action)) {
      return res.status(400).json({ message: 'Action must be "accept" or "reject"' });
    }

    // Find the roommate request
    const request = await RoommateRequest.findById(requestId)
      .populate('requester', 'name studentId user roommateGroup')
      .populate('recipient', 'name studentId user roommateGroup');

    if (!request) {
      return res.status(404).json({ message: 'Roommate request not found' });
    }

    // Verify student is the recipient
    if (request.recipient._id.toString() !== student._id.toString()) {
      return res.status(403).json({ 
        message: 'You can only respond to requests sent to you.' 
      });
    }

    if (request.status !== 'pending') {
      return res.status(400).json({ 
        message: 'This request has already been processed.' 
      });
    }

    // Check if recipient already has a room
    if (student.room || student.temporaryRoom) {
      return res.status(400).json({ 
        message: 'You already have a room allocated. Cannot join a roommate group.' 
      });
    }

    // Check if recipient is already in an active group
    if (student.roommateGroup) {
      const existingGroup = await RoommateGroup.findById(student.roommateGroup);
      if (existingGroup && ['pending', 'confirmed', 'room_selected', 'payment_pending'].includes(existingGroup.status)) {
        return res.status(400).json({ 
          message: 'You are already in an active roommate group.' 
        });
      }
    }

    if (action === 'reject') {
      // Reject request
      request.status = 'rejected';
      request.respondedAt = new Date();
      await request.save();

      // Cancel the group if it exists
      if (request.requester.roommateGroup) {
        const group = await RoommateGroup.findById(request.requester.roommateGroup);
        if (group && group.status === 'pending') {
          await group.cancel('Request rejected by recipient');
          // Clear requester's group reference
          const requester = await Student.findById(request.requester._id);
          if (requester) {
            requester.roommateGroup = null;
            await requester.save();
          }
        }
      }

      // Send notification to requester
      await createNotification(
        {
          title: 'Roommate Group Request Rejected',
          message: `${student.name} rejected your roommate group request`,
          type: 'roommate',
          recipient: request.requester.user,
          relatedEntity: {
            entityType: 'roommateRequest',
            entityId: request._id,
          },
        },
        { origin: 'student' }
      );

      return res.json({ 
        message: 'Roommate group request rejected successfully',
        request 
      });
    }

    // ACCEPT ACTION
    // Find or create the group
    let group = null;
    if (request.requester.roommateGroup) {
      group = await RoommateGroup.findById(request.requester.roommateGroup);
    }

    // Get requester's selected room type (if set)
    const requester = await Student.findById(request.requester._id);
    const roomType = requester?.selectedRoomType || null;
    
    // If roomType is not set, infer from group size (for backward compatibility)
    let inferredRoomType = roomType;
    if (!inferredRoomType) {
      const groupSize = request.requester.roommateGroup ? 
        (await RoommateGroup.findById(request.requester.roommateGroup))?.members?.length || 2 : 2;
      if (groupSize === 2) inferredRoomType = 'Double';
      else if (groupSize === 3) inferredRoomType = 'Triple';
      else if (groupSize === 4) inferredRoomType = 'Quad';
    }

    if (!group || group.status !== 'pending') {
      // Create new group if it doesn't exist or was cancelled
      group = await RoommateGroup.create({
        members: [request.requester._id, student._id],
        createdBy: request.requester._id,
        status: 'confirmed', // Directly confirm since both are agreeing
        roomType: inferredRoomType || 'Double', // Set room type (default to Double if not set)
        formationMethod: request.aiMatchingScore ? 'ai_matched' : 'manual',
        aiMatchingScore: request.aiMatchingScore || null,
      });
    } else {
      // Add recipient to existing group and confirm
      if (!group.isMember(student._id)) {
        await group.addMember(student._id);
      }
      // Set roomType if not already set
      if (!group.roomType && inferredRoomType) {
        group.roomType = inferredRoomType;
      }
      await group.confirm();
    }

    // Update request status
    request.status = 'accepted';
    request.respondedAt = new Date();
    await request.save();

    // Update both students' roommateGroup reference and onboardingStatus
    // Note: requester was already fetched above, so we can use it directly
    if (requester) {
      requester.roommateGroup = group._id;
      requester.onboardingStatus = 'roommate_confirmed';
      await requester.save();
    }

    student.roommateGroup = group._id;
    student.onboardingStatus = 'roommate_confirmed';
    await student.save();

    // Send notification to requester
    await createNotification(
      {
        title: 'Roommate Group Confirmed',
        message: `${student.name} accepted your roommate group request. You can now select a room together.`,
        type: 'roommate',
        recipient: request.requester.user,
        relatedEntity: {
          entityType: 'roommateGroup',
          entityId: group._id,
        },
      },
      { origin: 'student' }
    );

    res.json({ 
      message: 'Roommate group confirmed successfully',
      group: await RoommateGroup.findById(group._id)
        .populate('members', 'name studentId email course year gender')
        .populate('createdBy', 'name studentId'),
      request 
    });
  } catch (error) {
    console.error('Respond to roommate group request error:', error);
    res.status(500).json({ 
      message: 'Error responding to roommate group request', 
      error: error.message 
    });
  }
};

/**
 * Get available rooms for group (NEW - Group-based workflow)
 * Returns rooms where capacity >= group size and status = "available"
 */
export const getAvailableRoomsForGroup = async (req, res) => {
  try {
    const { groupId } = req.query;
    const user = await User.findById(req.user._id);
    const student = await Student.findOne({ user: req.user._id });

    if (!student) {
      return res.status(404).json({ message: 'Student profile not found' });
    }

    if (!groupId) {
      return res.status(400).json({ message: 'Group ID is required' });
    }

    // Find the group and verify student is a member
    const group = await RoommateGroup.findById(groupId)
      .populate('members', 'name studentId gender');

    if (!group) {
      return res.status(404).json({ message: 'Roommate group not found' });
    }

    // Check membership - handle both populated and unpopulated members
    const isMember = group.members.some(member => {
      const memberId = member._id ? member._id.toString() : member.toString();
      return memberId === student._id.toString();
    });

    if (!isMember) {
      return res.status(403).json({ 
        message: 'You are not a member of this group.' 
      });
    }

    if (group.status !== 'confirmed') {
      return res.status(400).json({ 
        message: 'Group must be confirmed before selecting a room.' 
      });
    }

    // Get group size
    const groupSize = group.members.length;

    // Get all students' genders (should be same, but verify)
    const genders = [...new Set(group.members.map(m => m.gender))];
    if (genders.length !== 1) {
      return res.status(400).json({ 
        message: 'All group members must be of the same gender.' 
      });
    }
    const groupGender = genders[0];

    // Validate group size matches room type capacity (if roomType is set)
    // For backward compatibility, if roomType is not set, just validate capacity >= groupSize
    if (group.roomType) {
      const { getRoomCapacity } = await import('../utils/roomTypeAwareMatching.js');
      const requiredCapacity = getRoomCapacity(group.roomType);
      if (groupSize !== requiredCapacity) {
        return res.status(400).json({ 
          message: `Group size (${groupSize}) does not match room type ${group.roomType} capacity (${requiredCapacity}).` 
        });
      }
    }

    // Build room query - if roomType is set, filter by it; otherwise just match capacity
    const roomQuery = {
      gender: groupGender,
      capacity: groupSize, // Exact capacity match
      status: { $in: ['available', 'reserved'] },
      maintenanceStatus: 'none',
      // Room should have enough available slots
      $expr: {
        $gte: [
          { $subtract: ['$capacity', { $ifNull: ['$currentOccupancy', 0] }] },
          groupSize
        ]
      }
    };

    // If group has roomType set, filter by it
    if (group.roomType) {
      roomQuery.roomType = group.roomType;
    }

    // Find available rooms matching room type and capacity
    const rooms = await Room.find(roomQuery)
      .select('roomNumber floor block capacity roomType amenities basePrice amenitiesPrice totalPrice status currentOccupancy photos')
      .sort({ floor: 1, roomNumber: 1 });

    // Filter out rooms that are actually full (including temporary allocations)
    const roomsWithActualAvailability = await Promise.all(
      rooms.map(async (room) => {
        const confirmedOccupancy = room.currentOccupancy || 0;
        const temporaryOccupancy = await Student.countDocuments({ 
          temporaryRoom: room._id 
        });
        const totalOccupancy = confirmedOccupancy + temporaryOccupancy;
        const availableSlots = room.capacity - totalOccupancy;

        return {
          ...room.toObject(),
          confirmedOccupancy,
          temporaryOccupancy,
          totalOccupancy,
          availableSlots,
          isFull: availableSlots < groupSize
        };
      })
    );

    // Filter out fully occupied rooms
    const availableRooms = roomsWithActualAvailability.filter(room => !room.isFull);

    res.json({
      group: {
        _id: group._id,
        members: group.members,
        groupSize: groupSize,
        status: group.status,
      },
      rooms: availableRooms,
      count: availableRooms.length
    });
  } catch (error) {
    console.error('Get available rooms for group error:', error);
    res.status(500).json({ 
      message: 'Error fetching available rooms for group', 
      error: error.message 
    });
  }
};

/**
 * Select room for group (NEW - Group-based workflow)
 * Only group leader can call
 * Validates: RoommateGroup.status === "confirmed", room capacity matches group size
 * Assigns temporaryRoom to ALL group members
 */
export const selectRoomForGroup = async (req, res) => {
  try {
    const { groupId, roomId } = req.body;
    const user = await User.findById(req.user._id);
    const student = await Student.findOne({ user: req.user._id });

    if (!student) {
      return res.status(404).json({ message: 'Student profile not found' });
    }

    if (!groupId || !roomId) {
      return res.status(400).json({ 
        message: 'Group ID and Room ID are required' 
      });
    }

    // Find the group
    const group = await RoommateGroup.findById(groupId)
      .populate('members', 'name studentId gender room temporaryRoom')
      .populate('createdBy', 'name studentId');

    if (!group) {
      return res.status(404).json({ message: 'Roommate group not found' });
    }

    // Verify student is the leader (handle both populated and unpopulated createdBy)
    const creatorId =
      group.createdBy && group.createdBy._id
        ? group.createdBy._id.toString()
        : group.createdBy
        ? group.createdBy.toString()
        : null;
    if (!creatorId || creatorId !== student._id.toString()) {
      return res.status(403).json({ 
        message: 'Only the group leader can select a room for the group.' 
      });
    }

    // SAFETY AUTO-FIX:
    // Ensure group creator is part of members array (older groups might violate this invariant)
    if (group.createdBy) {
      const creatorId = group.createdBy._id ? group.createdBy._id.toString() : group.createdBy.toString();
      const memberIds = group.members.map(m => (m._id ? m._id.toString() : m.toString()));
      if (!memberIds.includes(creatorId)) {
        group.members.push(group.createdBy._id || group.createdBy);
        // Save once to satisfy RoommateGroup pre-save validation
        await group.save();
      }
    }

    // Verify group is confirmed
    if (group.status !== 'confirmed') {
      return res.status(400).json({ 
        message: 'Group must be confirmed before selecting a room.' 
      });
    }

    // Verify room is not already selected
    if (group.selectedRoom) {
      return res.status(400).json({ 
        message: 'Room already selected for this group.' 
      });
    }

    // Find the room
    const room = await Room.findById(roomId);
    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }

    // Validate room capacity matches group size exactly
    const groupSize = group.members.length;
    if (room.capacity !== groupSize) {
      return res.status(400).json({ 
        message: `Room capacity (${room.capacity}) does not match group size (${groupSize}). Please select a room with capacity ${groupSize}.` 
      });
    }

    // If group has roomType set, validate it matches room's roomType
    if (group.roomType && group.roomType !== room.roomType) {
      return res.status(400).json({ 
        message: `Room type (${room.roomType}) does not match group room type (${group.roomType}).` 
      });
    }

    // CRITICAL: Check ACTUAL available slots (confirmed + pending)
    const confirmedCount = await Student.countDocuments({ room: room._id });
    const temporaryCount = await Student.countDocuments({ temporaryRoom: room._id });
    const actualOccupancy = confirmedCount + temporaryCount;
    const availableSlots = room.capacity - actualOccupancy;
    
    if (availableSlots < groupSize) {
      return res.status(400).json({ 
        message: `Room only has ${availableSlots} available slot(s), but group size is ${groupSize}.`,
        details: `Room capacity: ${room.capacity}, Current occupancy: ${actualOccupancy}, Group size: ${groupSize}`
      });
    }
    
    // Additional safety check: Room must not be full
    if (actualOccupancy >= room.capacity) {
      return res.status(400).json({ 
        message: 'Room is full. Please select another room.',
        details: `Room capacity: ${room.capacity}, Current occupancy: ${actualOccupancy}`
      });
    }

    // Validate room status
    if (room.status !== 'available' && room.status !== 'reserved') {
      return res.status(400).json({ 
        message: 'Room is not available for selection.' 
      });
    }

    // Check maintenance status
    if (room.maintenanceStatus === 'under_maintenance' || room.maintenanceStatus === 'blocked') {
      return res.status(400).json({ 
        message: 'Room is under maintenance and cannot be selected.' 
      });
    }

    // Validate all members are same gender as room
    const memberGenders = [...new Set(group.members.map(m => m.gender))];
    if (memberGenders.length !== 1 || memberGenders[0] !== room.gender) {
      return res.status(400).json({ 
        message: 'Group members gender does not match room gender.' 
      });
    }

    // Check if any member already has a room (should not happen, but safety check)
    const membersWithRooms = group.members.filter(m => m.room || m.temporaryRoom);
    if (membersWithRooms.length > 0) {
      return res.status(400).json({ 
        message: 'One or more group members already have a room allocated.' 
      });
    }

    // Use transaction-like approach: update group first, then members, then room
    try {
      // Update group
      group.selectedRoom = roomId;
      group.status = 'room_selected';
      group.roomSelectedAt = new Date();
      await group.save();

      // Update all members: assign temporaryRoom and update status
      // CRITICAL: Set paymentStatus = 'PAYMENT_PENDING' and amountToPay = room.totalPrice (PER STUDENT)
      const memberIds = group.members.map(m => m._id);
      const perStudentAmount = room.totalPrice; // Each student pays the FULL amount
      
      await Student.updateMany(
        { _id: { $in: memberIds } },
        {
          $set: {
            temporaryRoom: roomId,
            roomAllocationStatus: 'pending_payment',
            onboardingStatus: 'payment_pending', // This triggers payment modal
            paymentStatus: 'PAYMENT_PENDING', // NEW: Individual payment status
            amountToPay: perStudentAmount, // NEW: Per-student amount (NOT shared)
            roomAllocatedAt: new Date(),
          }
        }
      );

      // Reserve room (don't update occupancy until ALL payments complete)
      if (room.status === 'available') {
        room.status = 'reserved';
      }
      await room.save();

      // Generate fees for all members (EACH pays FULL amount)
      // Payment due in 10 days from room selection
      const now = new Date();
      const dueDate = new Date(now);
      dueDate.setDate(dueDate.getDate() + 10); // Payment due in 10 days
      
      const fees = [];
      
      for (const memberId of memberIds) {
        const member = await Student.findById(memberId);
        if (member) {
          // Check if fee already exists
          const existingFee = await Fee.findOne({
            student: memberId,
            feeType: 'rent',
            status: { $in: ['pending', 'partial'] }
          });

          if (!existingFee) {
            const fee = await Fee.create({
              student: memberId,
              feeType: 'rent',
              amount: perStudentAmount, // Each student pays FULL base amount
              dueDate: dueDate, // Due in 10 days
              status: 'pending',
              description: `Room rent for ${room.roomNumber} (${room.roomType}) - Payment due within 10 days. Late fee: ₹50/day after due date.`,
              month: now.toLocaleString('default', { month: 'long' }),
              year: now.getFullYear(),
            });
            fees.push(fee);
          }
        }
      }

      // Send notifications to all members
      const totalMembers = group.members.length;
      for (const member of group.members) {
        const memberUser = await User.findOne({ _id: member.user });
        if (memberUser) {
          await createNotification(
            {
              title: '🏠 Room Selected - Payment Required',
              message: `Room ${room.roomNumber} has been selected for your ${totalMembers}-member group. IMPORTANT: Each member must pay ₹${perStudentAmount.toLocaleString('en-IN')} individually. The room will be confirmed only when all ${totalMembers} members complete payment.`,
              type: 'payment',
              recipient: memberUser._id,
              relatedEntity: {
                entityType: 'room',
                entityId: room._id,
              },
            },
            { origin: 'system' }
          );
        }
      }

      // Return updated group with populated data
      const updatedGroup = await RoommateGroup.findById(groupId)
        .populate('members', 'name studentId email course year gender paymentStatus amountToPay')
        .populate('createdBy', 'name studentId')
        .populate('selectedRoom', 'roomNumber floor block capacity roomType amenities totalPrice basePrice status');

      res.json({
        success: true,
        paymentTriggered: true, // CRITICAL: Frontend uses this to auto-open payment modal
        message: 'Room selected successfully! Payment is now required from all group members.',
        group: updatedGroup,
        feesGenerated: fees.length,
        perStudentAmount: perStudentAmount,
        roomDetails: {
          roomNumber: room.roomNumber,
          roomType: room.roomType,
          basePrice: room.basePrice,
          totalPrice: room.totalPrice,
        }
      });
    } catch (updateError) {
      // Rollback: clear group selection if member update fails
      group.selectedRoom = null;
      group.status = 'confirmed';
      await group.save();
      throw updateError;
    }
  } catch (error) {
    console.error('Select room for group error:', error);
    res.status(500).json({ 
      message: 'Error selecting room for group', 
      error: error.message 
    });
  }
};

/**
 * Get current roommate group for student
 */
export const getMyRoommateGroup = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const student = await Student.findOne({ user: req.user._id })
      .populate('roommateGroup');

    if (!student) {
      return res.status(404).json({ message: 'Student profile not found' });
    }

    let group = null;

    // First, try to get group from student's roommateGroup reference
    if (student.roommateGroup) {
      group = await RoommateGroup.findById(student.roommateGroup)
        .populate('members', 'name studentId email course year gender room temporaryRoom paymentStatus amountToPay')
        .populate('createdBy', 'name studentId')
        .populate('selectedRoom', 'roomNumber floor block capacity roomType amenities totalPrice basePrice amenitiesPrice status currentOccupancy');
    }

    // If no group found via reference, search by membership (fallback)
    // This handles cases where the reference might not be set but student is in a group
    if (!group) {
      const activeGroup = await RoommateGroup.findOne({
        members: student._id,
        status: { $in: ['pending', 'confirmed', 'room_selected', 'payment_pending'] }
      })
        .populate('members', 'name studentId email course year gender room temporaryRoom paymentStatus amountToPay')
        .populate('createdBy', 'name studentId')
        .populate('selectedRoom', 'roomNumber floor block capacity roomType amenities totalPrice basePrice amenitiesPrice status currentOccupancy');
      
      if (activeGroup) {
        // Update student's roommateGroup reference if found
        student.roommateGroup = activeGroup._id;
        await student.save();
        group = activeGroup;
      }
    }

    // Auto-fix: If group exists but doesn't have roomType, infer it from group size
    if (group && !group.roomType) {
      const groupSize = group.members.length;
      let inferredRoomType = null;
      if (groupSize === 2) inferredRoomType = 'Double';
      else if (groupSize === 3) inferredRoomType = 'Triple';
      else if (groupSize === 4) inferredRoomType = 'Quad';
      
      if (inferredRoomType) {
        group.roomType = inferredRoomType;
        await group.save();
        // Re-populate after save
        group = await RoommateGroup.findById(group._id)
          .populate('members', 'name studentId email course year gender room temporaryRoom paymentStatus amountToPay')
          .populate('createdBy', 'name studentId')
          .populate('selectedRoom', 'roomNumber floor block capacity roomType amenities totalPrice basePrice amenitiesPrice status currentOccupancy');
      }
    }

    if (!group) {
      return res.json({ group: null });
    }

    res.json({ group });
  } catch (error) {
    console.error('Get my roommate group error:', error);
    res.status(500).json({ 
      message: 'Error fetching roommate group', 
      error: error.message 
    });
  }
};

/**
 * Update AI preferences
 */
export const updateAIPreferences = async (req, res) => {
  try {
    const { sleepSchedule, cleanliness, studyHabits, noiseTolerance, lifestyle } = req.body;
    const user = await User.findById(req.user._id);
    const student = await Student.findOne({ user: req.user._id });

    if (!student) {
      return res.status(404).json({ message: 'Student profile not found' });
    }

    // Update AI preferences
    student.aiPreferences = {
      sleepSchedule: sleepSchedule || null,
      cleanliness: cleanliness || null,
      studyHabits: studyHabits || null,
      noiseTolerance: noiseTolerance || null,
      lifestyle: lifestyle || null,
    };

    await student.save();

    res.json({ 
      message: 'AI preferences updated successfully', 
      preferences: student.aiPreferences 
    });
  } catch (error) {
    console.error('Update AI preferences error:', error);
    res.status(500).json({ message: 'Error updating AI preferences', error: error.message });
  }
};

/**
 * Set selected room type for roommate matching
 * POST /api/student/room-type
 */
export const setRoomType = async (req, res) => {
  try {
    const { roomType } = req.body;
    const user = await User.findById(req.user._id);
    const student = await Student.findOne({ user: req.user._id });

    if (!student) {
      return res.status(404).json({ message: 'Student profile not found' });
    }

    // Validate room type
    const validRoomTypes = ['Single', 'Double', 'Triple', 'Quad'];
    if (!validRoomTypes.includes(roomType)) {
      return res.status(400).json({ 
        message: 'Invalid room type. Must be one of: Single, Double, Triple, Quad' 
      });
    }

    // Check if student already has a room
    if (student.room || student.temporaryRoom) {
      return res.status(400).json({ 
        message: 'You already have a room allocated. Cannot change room type.' 
      });
    }

    // Check if student is in an active group
    if (student.roommateGroup) {
      const RoommateGroup = (await import('../models/RoommateGroup.model.js')).default;
      const activeGroup = await RoommateGroup.findById(student.roommateGroup);
      if (activeGroup && ['pending', 'confirmed', 'room_selected', 'payment_pending'].includes(activeGroup.status)) {
        return res.status(400).json({ 
          message: 'You are in an active roommate group. Cannot change room type.' 
        });
      }
    }

    // Set room type
    student.selectedRoomType = roomType;
    await student.save();

    res.json({ 
      message: 'Room type set successfully', 
      roomType: student.selectedRoomType,
      capacity: roomType === 'Single' ? 1 : roomType === 'Double' ? 2 : roomType === 'Triple' ? 3 : 4,
    });
  } catch (error) {
    console.error('Set room type error:', error);
    res.status(500).json({ message: 'Error setting room type', error: error.message });
  }
};

/**
 * Set preferred roommates (siblings, best friends)
 * POST /api/student/preferred-roommates
 */
export const setPreferredRoommates = async (req, res) => {
  try {
    const { roommateIds } = req.body; // Array of student IDs
    const user = await User.findById(req.user._id);
    const student = await Student.findOne({ user: req.user._id });

    if (!student) {
      return res.status(404).json({ message: 'Student profile not found' });
    }

    // Validate room type is set
    if (!student.selectedRoomType) {
      return res.status(400).json({ 
        message: 'Please select a room type first before adding preferred roommates.' 
      });
    }

    // Single room doesn't need roommates
    if (student.selectedRoomType === 'Single') {
      return res.status(400).json({ 
        message: 'Single room does not require roommates.' 
      });
    }

    // Get room capacity
    const capacity = student.selectedRoomType === 'Double' ? 2 : 
                     student.selectedRoomType === 'Triple' ? 3 : 4;
    const maxPreferred = capacity - 1; // Excluding the student themselves

    if (roommateIds && roommateIds.length > maxPreferred) {
      return res.status(400).json({ 
        message: `Room type ${student.selectedRoomType} allows maximum ${maxPreferred} preferred roommate(s).` 
      });
    }

    // Validate preferred roommates
    if (roommateIds && roommateIds.length > 0) {
      const preferred = await Student.find({
        _id: { $in: roommateIds },
        gender: student.gender, // Must be same gender
        status: 'active',
      });

      if (preferred.length !== roommateIds.length) {
        return res.status(400).json({ 
          message: 'Some preferred roommates are invalid or not of the same gender.' 
        });
      }

      // Check if any preferred roommates already have rooms
      const withRooms = preferred.filter(p => p.room || p.temporaryRoom);
      if (withRooms.length > 0) {
        return res.status(400).json({ 
          message: `Some preferred roommates already have rooms: ${withRooms.map(s => s.name).join(', ')}` 
        });
      }

      // Check if any are in active groups
      const RoommateGroup = (await import('../models/RoommateGroup.model.js')).default;
      for (const pref of preferred) {
        const activeGroup = await RoommateGroup.findOne({
          members: pref._id,
          status: { $in: ['pending', 'confirmed', 'room_selected', 'payment_pending'] },
        });
        
        if (activeGroup) {
          return res.status(400).json({ 
            message: `${pref.name} is already in an active roommate group.` 
          });
        }
      }
    }

    // Set preferred roommates
    student.preferredRoommates = roommateIds || [];
    await student.save();

    res.json({ 
      message: 'Preferred roommates updated successfully', 
      preferredRoommates: student.preferredRoommates,
      count: student.preferredRoommates.length,
      maxAllowed: maxPreferred,
    });
  } catch (error) {
    console.error('Set preferred roommates error:', error);
    res.status(500).json({ message: 'Error setting preferred roommates', error: error.message });
  }
};

/**
 * Get AI matching suggestions for current student
 */
export const getAIMatches = async (req, res) => {
  try {
    const { minScore = 50, limit = 10, useAIService = true, roomType } = req.query;
    const user = await User.findById(req.user._id);
    const student = await Student.findOne({ user: req.user._id })
      .populate('room')
      .populate('preferredRoommates', 'name studentId course year gender');

    if (!student) {
      return res.status(404).json({ message: 'Student profile not found' });
    }

    // Check if student already has a room
    if (student.room) {
      return res.status(400).json({ 
        message: 'You already have a room allocated. Please request a room change if needed.' 
      });
    }

    // Get all students of same gender without rooms (including temporary rooms)
    const candidates = await Student.find({
      _id: { $ne: student._id },
      gender: student.gender,
      status: 'active',
      $or: [
        { room: null },
        { room: { $exists: false } },
        { roomAllocationStatus: 'none' }
      ],
      $and: [
        { $or: [{ temporaryRoom: null }, { temporaryRoom: { $exists: false } }] }
      ]
    }).select('name studentId email course year batchYear personalityAttributes aiPreferences temporaryRoom');

    // Try using Python AI service if enabled
    if (useAIService === 'true' || useAIService === true) {
      try {
        const aiMatchingService = (await import('../services/aiMatchingService.js')).default;
        
        // Check if AI service is available
        const health = await aiMatchingService.healthCheck();
        if (health) {
          const aiResults = await aiMatchingService.getMatches(student, candidates, parseInt(limit));
          
          // Filter matches to only include 50-100% compatibility scores
          const filteredMatches = aiResults.matches.filter(m => 
            m.compatibilityScore >= 50 && m.compatibilityScore <= 100
          );
          
          // Map AI service results to expected format
          return res.json({
            student: {
              _id: student._id,
              name: student.name,
              studentId: student.studentId,
            },
            matches: filteredMatches.map(m => ({
              student: {
                _id: m.student._id,
                name: m.student.name,
                studentId: m.student.studentId,
                email: m.student.email,
                course: m.student.course,
                year: m.student.year,
              },
              score: m.compatibilityScore,
              similarity: m.similarity,
              cluster: m.cluster,
            })),
            method: 'ai-service',
            cluster: aiResults.targetStudent?.cluster,
          });
        }
      } catch (aiError) {
        console.warn('AI service unavailable, falling back to JavaScript matching:', aiError.message);
        // Fall through to JavaScript implementation
      }
    }

    // Fallback to JavaScript matching implementation
    const { findBestMatches } = await import('../utils/roommateMatching.js');
    
    // Check if student has preferences
    const hasStudentPrefs = !!(student.aiPreferences || student.personalityAttributes);
    
    // Check candidates' preferences
    const candidatesWithPrefs = candidates.filter(c => !!(c.aiPreferences || c.personalityAttributes));
    
    // Allow lower scores if explicitly requested (for fallback matching)
    // But default to 50 if not specified
    const effectiveMinScore = minScore ? parseInt(minScore) : 50;
    
    const matches = findBestMatches(student, candidates, effectiveMinScore, parseInt(limit));
    
    // Provide helpful error message if no matches
    if (matches.length === 0 && candidates.length > 0) {
      console.warn(`[AI Matching] No matches found. Possible reasons:
        - Compatibility scores below 50% threshold
        - Candidates don't have preferences set
        - Student preferences don't match candidate preferences`);
    } else if (matches.length === 0 && candidates.length === 0) {
      console.warn(`[AI Matching] No eligible candidates found. Check:
        - Are there other students of the same gender (${student.gender})?
        - Do they have status 'active'?
        - Do they have rooms allocated?`);
    }

    // Provide helpful message if no matches
    let debugInfo = null;
    if (matches.length === 0) {
      debugInfo = {
        candidatesFound: candidates.length,
        candidatesWithPreferences: candidates.filter(c => !!(c.aiPreferences || c.personalityAttributes)).length,
        studentHasPreferences: !!(student.aiPreferences || student.personalityAttributes),
        minScoreRequired: effectiveMinScore,
        possibleReasons: []
      };
      
      if (candidates.length === 0) {
        debugInfo.possibleReasons.push('No eligible candidates found (check gender, status, and room allocation)');
      } else if (candidates.filter(c => !!(c.aiPreferences || c.personalityAttributes)).length === 0) {
        debugInfo.possibleReasons.push('Candidates don\'t have preferences set');
      } else if (!(student.aiPreferences || student.personalityAttributes)) {
        debugInfo.possibleReasons.push('Student doesn\'t have preferences set');
      } else {
        debugInfo.possibleReasons.push('Compatibility scores below 50% threshold - try adjusting preferences');
      }
    }
    
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
          personalityAttributes: m.student.personalityAttributes,
          aiPreferences: m.student.aiPreferences,
        },
        score: m.score,
      })),
      method: 'javascript',
      debugInfo: debugInfo, // Include debug info in response for troubleshooting
    });
  } catch (error) {
    console.error('Get AI matches error:', error);
    res.status(500).json({ message: 'Error fetching AI matches', error: error.message });
  }
};

/**
 * Get AI-matched room groups for current student
 */
export const getAIMatchedGroups = async (req, res) => {
  try {
    const { roomType, minScore = 50 } = req.query;
    const user = await User.findById(req.user._id);
    const student = await Student.findOne({ user: req.user._id })
      .populate('preferredRoommates', 'name studentId course year gender');

    if (!student) {
      return res.status(404).json({ message: 'Student profile not found' });
    }

    // Check if student already has a room
    if (student.room || student.temporaryRoom) {
      return res.status(400).json({ 
        message: 'You already have a room allocated or pending.' 
      });
    }

    // Get room type (from query or student's selection)
    const effectiveRoomType = roomType || student.selectedRoomType;
    if (!effectiveRoomType) {
      return res.status(400).json({ 
        message: 'Please select a room type first before finding matched groups.',
        requiresRoomType: true,
      });
    }

    // Single room doesn't need groups
    if (effectiveRoomType === 'Single') {
      return res.json({
        student: {
          _id: student._id,
          name: student.name,
          studentId: student.studentId,
        },
        groups: [],
        message: 'Single room selected - no roommate groups required',
        roomType: 'Single',
      });
    }

    // Determine room capacity based on roomType
    let capacity = 2; // Default to Double
    if (effectiveRoomType === 'Triple') capacity = 3;
    else if (effectiveRoomType === 'Quad') capacity = 4;

    // Get all students of same gender without rooms (including temporary rooms)
    const candidates = await Student.find({
      _id: { $ne: student._id },
      gender: student.gender,
      status: 'active',
      $or: [
        { room: null },
        { room: { $exists: false } },
        { roomAllocationStatus: 'none' }
      ],
      $and: [
        { $or: [{ temporaryRoom: null }, { temporaryRoom: { $exists: false } }] }
      ]
    }).select('name studentId email course year batchYear personalityAttributes aiPreferences temporaryRoom');

    // Try using Python AI service if enabled
    const useAIService = req.query.useAIService !== 'false';
    
    if (useAIService) {
      try {
        const aiMatchingService = (await import('../services/aiMatchingService.js')).default;
        
        // Check if AI service is available
        const health = await aiMatchingService.healthCheck();
        if (health) {
          const allStudents = [student, ...candidates];
          // Ensure minScore is at least 60
          const effectiveMinScore = Math.max(60, parseInt(minScore));
          const aiResults = await aiMatchingService.formGroups(allStudents, capacity, effectiveMinScore);
          
          // Filter groups that include current student and have 50-100% average score
          const studentGroups = aiResults.groups.filter(group => 
            group.students.some(s => s._id === student._id.toString()) &&
            group.averageScore >= 50 &&
            group.averageScore <= 100
          );
          
          // Format groups for response
          const formattedGroups = studentGroups.map(group => ({
            groupId: group.students.map(s => s._id).sort().join('-'),
            students: group.students.map(s => {
              const fullStudent = allStudents.find(st => st._id.toString() === s._id);
              return {
                _id: s._id,
                name: s.name || fullStudent?.name,
                studentId: s.studentId || fullStudent?.studentId,
                email: fullStudent?.email,
                course: fullStudent?.course,
                year: fullStudent?.year,
                aiPreferences: fullStudent?.aiPreferences,
              };
            }),
            averageScore: group.averageScore,
            cluster: group.cluster,
            recommendedRoomType: roomType || 'Double',
          }));
          
          return res.json({
            student: {
              _id: student._id,
              name: student.name,
              studentId: student.studentId,
            },
            groups: formattedGroups,
            totalGroups: formattedGroups.length,
            method: 'ai-service',
          });
        }
      } catch (aiError) {
        console.warn('AI service unavailable, falling back to JavaScript matching:', aiError.message);
        // Fall through to JavaScript implementation
      }
    }

    // Fallback to JavaScript matching implementation
    const { formRoommateGroups } = await import('../utils/roommateMatching.js');
    const allStudents = [student, ...candidates];
    
    // Ensure minScore is at least 50
    const effectiveMinScore = Math.max(50, parseInt(minScore));
    
    const groups = formRoommateGroups(allStudents, capacity, effectiveMinScore);
    
    // Filter groups that include current student and have 50-100% average score
    const studentGroups = groups.filter(group => 
      group.students.some(s => s._id.toString() === student._id.toString()) &&
      group.averageScore >= 50 &&
      group.averageScore <= 100
    );

    // Format groups for response
    const formattedGroups = studentGroups.map(group => ({
      groupId: group.students.map(s => s._id.toString()).sort().join('-'),
      students: group.students.map(s => ({
        _id: s._id,
        name: s.name,
        studentId: s.studentId,
        email: s.email,
        course: s.course,
        year: s.year,
        personalityAttributes: s.personalityAttributes,
        aiPreferences: s.aiPreferences,
      })),
      averageScore: group.averageScore,
      scores: group.scores,
      recommendedRoomType: roomType || 'Double',
    }));

    res.json({
      student: {
        _id: student._id,
        name: student.name,
        studentId: student.studentId,
      },
      groups: formattedGroups,
      totalGroups: formattedGroups.length,
    });
  } catch (error) {
    console.error('Get AI matched groups error:', error);
    res.status(500).json({ message: 'Error fetching AI matched groups', error: error.message });
  }
};

/**
 * Get matching history
 */
export const getMatchingHistory = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const student = await Student.findOne({ user: req.user._id });

    if (!student) {
      return res.status(404).json({ message: 'Student profile not found' });
    }

    // Get accepted roommate requests as matching history
    const history = await RoommateRequest.find({
      $or: [
        { requester: student._id, status: 'accepted' },
        { recipient: student._id, status: 'accepted' }
      ]
    })
      .populate('requester', 'name studentId')
      .populate('recipient', 'name studentId')
      .sort({ createdAt: -1 });

    const formattedHistory = history.map(request => {
      const isRequester = request.requester._id.toString() === student._id.toString();
      return {
        _id: request._id,
        name: isRequester ? request.recipient.name : request.requester.name,
        studentId: isRequester ? request.recipient.studentId : request.requester.studentId,
        date: request.createdAt.toISOString().split('T')[0],
        matchScore: request.aiMatchingScore || null,
        status: 'Accepted',
        aiScore: request.aiMatchingScore 
          ? request.aiMatchingScore >= 80 ? 'High Compatibility' 
            : request.aiMatchingScore >= 60 ? 'Moderate Compatibility' 
            : 'Low Compatibility'
          : 'N/A',
      };
    });

    res.json(formattedHistory);
  } catch (error) {
    console.error('Get matching history error:', error);
    res.status(500).json({ message: 'Error fetching matching history', error: error.message });
  }
};

/**
 * Submit cleaning request
 */
export const submitCleaningRequest = async (req, res) => {
  try {
    const { requestType, urgency, preferredDate, preferredTimeSlot, description, attachments } = req.body;

    if (!requestType || !preferredDate || !preferredTimeSlot) {
      return res.status(400).json({ message: 'Request type, preferred date, and time slot are required' });
    }

    const validRequestTypes = ['room_cleaning', 'bathroom_cleaning', 'common_area_cleaning'];
    if (!validRequestTypes.includes(requestType)) {
      return res.status(400).json({ message: 'Invalid request type' });
    }

    const validUrgency = ['normal', 'high'];
    if (urgency && !validUrgency.includes(urgency)) {
      return res.status(400).json({ message: 'Invalid urgency level' });
    }

    const validTimeSlots = ['morning', 'afternoon', 'evening'];
    if (!validTimeSlots.includes(preferredTimeSlot)) {
      return res.status(400).json({ message: 'Invalid time slot' });
    }

    const user = await User.findById(req.user._id);
    const student = await Student.findOne({ user: req.user._id })
      .populate('room', 'roomNumber block building');

    if (!student) {
      return res.status(404).json({ message: 'Student profile not found' });
    }

    if (!student.room) {
      return res.status(400).json({ message: 'You must have a room allocated to submit cleaning requests' });
    }

    // Validate and parse preferred date
    let preferredDateObj;
    try {
      // Handle date string in YYYY-MM-DD format
      if (typeof preferredDate === 'string' && preferredDate.match(/^\d{4}-\d{2}-\d{2}$/)) {
        // Parse as local date to avoid timezone issues
        const [year, month, day] = preferredDate.split('-').map(Number);
        preferredDateObj = new Date(year, month - 1, day);
      } else {
        preferredDateObj = new Date(preferredDate);
      }
      
      if (isNaN(preferredDateObj.getTime())) {
        return res.status(400).json({ message: 'Invalid preferred date format' });
      }
    } catch (error) {
      console.error('Date parsing error:', error);
      return res.status(400).json({ message: 'Invalid preferred date format' });
    }

    // Validate preferred date is not in the past
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    preferredDateObj.setHours(0, 0, 0, 0);
    if (preferredDateObj < today) {
      return res.status(400).json({ message: 'Preferred date cannot be in the past' });
    }

    // Get student identity
    let studentIdentity;
    try {
      studentIdentity = await getStudentIdentity(student);
    } catch (identityError) {
      console.error('Error getting student identity:', identityError);
      // Fallback to basic identity
      studentIdentity = {
        name: student.name || null,
        studentId: student.studentId || student.admissionNumber || null,
        admissionNumber: student.studentId || student.admissionNumber || null,
        registerNumber: student.studentId || student.admissionNumber || null,
        course: student.course || null,
        year: student.year || null,
        department: null,
        hostelName: student.room?.block || student.room?.building || null,
        roomNumber: student.room?.roomNumber || null,
        phone: student.phone || null,
        email: student.email || null,
      };
    }

    const cleaningRequest = await CleaningRequest.create({
      student: student._id,
      room: student.room._id,
      requestType,
      urgency: urgency || 'normal',
      preferredDate: preferredDateObj,
      preferredTimeSlot,
      description: description || '',
      attachments: attachments || [],
      status: 'pending',
      studentIdentity,
    });

    // Send notification to admin
    await createNotification(
      {
        title: 'New Cleaning Request',
        message: `${student.name} (${student.studentId}) submitted a ${urgency === 'high' ? 'high priority' : ''} ${requestType.replace(/_/g, ' ')} request`,
        type: 'cleaning',
        recipientRole: 'admin',
        relatedEntity: {
          entityType: 'cleaningRequest',
          entityId: cleaningRequest._id,
        },
      },
      { origin: 'student', studentDetails: studentIdentity }
    );

    const populatedRequest = await CleaningRequest.findById(cleaningRequest._id)
      .populate('student', 'name studentId room')
      .populate('room', 'roomNumber block')
      .populate('assignedTo', 'name staffId');

    res.status(201).json({ 
      message: 'Cleaning request submitted successfully', 
      request: populatedRequest 
    });
  } catch (error) {
    console.error('Submit cleaning request error:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    
    // Provide more specific error messages
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors || {}).map(err => err.message).join(', ');
      return res.status(400).json({ 
        message: `Validation error: ${validationErrors}`,
        error: error.message 
      });
    }
    
    res.status(500).json({ 
      message: 'Error submitting cleaning request', 
      error: error.message 
    });
  }
};

/**
 * Get cleaning requests
 */
export const getCleaningRequests = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const student = await Student.findOne({ user: req.user._id });

    if (!student) {
      return res.status(404).json({ message: 'Student profile not found' });
    }

    const requests = await CleaningRequest.find({
      student: student._id
    })
      .populate('assignedTo', 'name staffId')
      .populate('completedBy', 'name staffId')
      .populate('room', 'roomNumber block')
      .sort({ createdAt: -1 });

    res.json(requests);
  } catch (error) {
    console.error('Get cleaning requests error:', error);
    res.status(500).json({ message: 'Error fetching cleaning requests', error: error.message });
  }
};

/**
 * Get cleaning frequency data (last 4 weeks)
 */
export const getCleaningFrequency = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const student = await Student.findOne({ user: req.user._id });

    if (!student) {
      return res.status(404).json({ message: 'Student profile not found' });
    }

    const now = new Date();
    const fourWeeksAgo = new Date(now);
    fourWeeksAgo.setDate(fourWeeksAgo.getDate() - 28);

    // Get all completed cleaning requests in the last 4 weeks
    const cleaningRequests = await CleaningRequest.find({
      student: student._id,
      status: 'completed',
      completedAt: { $gte: fourWeeksAgo }
    }).sort({ completedAt: 1 });

    // Group by week
    const weeks = [];
    const cleaningCount = [0, 0, 0, 0];
    
    for (let i = 0; i < 4; i++) {
      const weekStart = new Date(now);
      weekStart.setDate(weekStart.getDate() - (7 * (4 - i)));
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 7);
      
      weeks.push(`Week ${i + 1}`);
      
      cleaningRequests.forEach(request => {
        if (request.completedAt && request.completedAt >= weekStart && request.completedAt < weekEnd) {
          cleaningCount[i]++;
        }
      });
    }

    res.json({
      weeks,
      cleaningCount
    });
  } catch (error) {
    console.error('Get cleaning frequency error:', error);
    res.status(500).json({ message: 'Error fetching cleaning frequency', error: error.message });
  }
};

/**
 * Get cleaning schedule (upcoming and recent cleanings)
 */
export const getCleaningSchedule = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const student = await Student.findOne({ user: req.user._id });

    if (!student) {
      return res.status(404).json({ message: 'Student profile not found' });
    }

    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setDate(weekStart.getDate() - weekStart.getDay()); // Start of current week (Sunday)
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 7); // End of current week

    // Get all cleaning requests for this week and next week
    const nextWeekEnd = new Date(weekEnd);
    nextWeekEnd.setDate(nextWeekEnd.getDate() + 7);

    const cleaningRequests = await CleaningRequest.find({
      student: student._id,
      $or: [
        { preferredDate: { $gte: weekStart, $lte: nextWeekEnd } },
        { scheduledDate: { $gte: weekStart, $lte: nextWeekEnd } }
      ]
    })
      .populate('assignedTo', 'name staffId')
      .sort({ preferredDate: 1, scheduledDate: 1 });

    // Format schedule
    const schedule = [];
    const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    
    // Generate schedule for current week
    for (let i = 0; i < 7; i++) {
      const dayDate = new Date(weekStart);
      dayDate.setDate(dayDate.getDate() + i);
      
      // Find cleaning requests for this day (by scheduled date or preferred date)
      const dayRequests = cleaningRequests.filter(req => {
        const reqDate = req.scheduledDate ? new Date(req.scheduledDate) : new Date(req.preferredDate);
        return reqDate.toDateString() === dayDate.toDateString();
      });

      if (dayRequests.length > 0) {
        dayRequests.forEach((req, idx) => {
          const reqDate = req.scheduledDate ? new Date(req.scheduledDate) : new Date(req.preferredDate);
          const formatRequestType = (type) => {
            return type?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'Room Cleaning';
          };
          const formatTimeSlot = (slot) => {
            const slotMap = { 'morning': '9:00 AM', 'afternoon': '2:00 PM', 'evening': '6:00 PM' };
            return slotMap[slot] || '9:00 AM';
          };
          schedule.push({
            id: `${dayDate.getTime()}-${idx}`,
            day: daysOfWeek[reqDate.getDay()],
            date: reqDate.toISOString().split('T')[0],
            time: req.scheduledTime ? formatTimeSlot(req.scheduledTime) : formatTimeSlot(req.preferredTimeSlot),
            task: formatRequestType(req.requestType),
            assigned: req.assignedTo?.name || 'Not Assigned',
            status: req.status === 'completed' ? 'Completed' : req.status === 'assigned' ? 'Assigned' : 'Pending'
          });
        });
      }
    }

    // Find next pending/assigned cleaning
    const nextCleaning = cleaningRequests
      .filter(req => (req.status === 'pending' || req.status === 'assigned') && 
                      (req.scheduledDate ? new Date(req.scheduledDate) >= now : new Date(req.preferredDate) >= now))
      .sort((a, b) => {
        const dateA = a.scheduledDate ? new Date(a.scheduledDate) : new Date(a.preferredDate);
        const dateB = b.scheduledDate ? new Date(b.scheduledDate) : new Date(b.preferredDate);
        return dateA - dateB;
      })[0];

    const formatRequestType = (type) => {
      return type?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'Room Cleaning';
    };
    const formatTimeSlot = (slot) => {
      const slotMap = { 'morning': 'Morning', 'afternoon': 'Afternoon', 'evening': 'Evening' };
      return slotMap[slot] || 'Morning';
    };

    const nextCleaningFormatted = nextCleaning ? {
      date: (nextCleaning.scheduledDate ? new Date(nextCleaning.scheduledDate) : new Date(nextCleaning.preferredDate)).toISOString().split('T')[0],
      time: nextCleaning.scheduledTime ? formatTimeSlot(nextCleaning.scheduledTime) : formatTimeSlot(nextCleaning.preferredTimeSlot),
      task: formatRequestType(nextCleaning.requestType),
      assigned: nextCleaning.assignedTo?.name || 'Not Assigned'
    } : null;

    res.json({
      schedule,
      nextCleaning: nextCleaningFormatted
    });
  } catch (error) {
    console.error('Get cleaning schedule error:', error);
    res.status(500).json({ message: 'Error fetching cleaning schedule', error: error.message });
  }
};

/**
 * Get dashboard stats
 */
export const getDashboardStats = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const student = await Student.findOne({ user: req.user._id })
      .populate('room', 'roomNumber floor building block roomType amenities totalPrice basePrice amenitiesPrice');

    if (!student) {
      // Return empty stats instead of 404 to allow dashboard to render
      return res.json({
        student: null,
        stats: {
          room: null,
          fees: {
            total: 0,
            paid: 0,
            pending: 0
          },
          attendance: {
            percentage: 0,
            present: 0,
            total: 0
          },
          complaints: {
            pending: 0
          }
        },
        notifications: []
      });
    }

    // Get fees summary
    const fees = await Fee.find({ student: student._id });
    const totalFees = fees.reduce((sum, fee) => sum + fee.amount, 0);
    const paidFees = fees.filter(f => f.status === 'paid').reduce((sum, fee) => sum + fee.amount, 0);
    const pendingFees = totalFees - paidFees;

    // Get attendance summary (last 30 days)
    // Attendance summary for last 30 days (counts missing days as absent)
    const endDate = new Date();
    endDate.setHours(0, 0, 0, 0);
    const startDate = new Date(endDate);
    startDate.setDate(startDate.getDate() - 29); // last 30 days inclusive

    const attendanceRecords = await Attendance.find({
      student: student._id,
      date: { $gte: startDate, $lte: endDate },
      type: 'student'
    });

    const presentCount = attendanceRecords.filter(a => a.status === 'present').length;
    const absentRecorded = attendanceRecords.filter(a => a.status === 'absent').length;

    // Total calendar days in window
    const totalDays = Math.max(1, Math.round((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1);

    // Days with any record
    const recordedDays = new Set(attendanceRecords.map(a => new Date(a.date).toDateString())).size;
    const inferredAbsent = Math.max(0, totalDays - recordedDays);
    const totalAbsent = absentRecorded + inferredAbsent;

    const attendancePercentage = totalDays > 0
      ? Math.round((presentCount / totalDays) * 100)
      : 0;

    // Get pending complaints count
    const pendingComplaints = await Complaint.countDocuments({
      student: student._id,
      status: 'pending'
    });

    // Get wallet balance
    let wallet = await Wallet.findOne({ student: student._id });
    const walletBalance = wallet ? wallet.balance : 0;

    // Get active room change request
    const activeRoomChangeRequest = await RoomChangeRequest.findOne({
      student: student._id,
      status: { $in: ['pending', 'pending_payment', 'under_review'] },
    })
      .populate('currentRoom', 'roomNumber block')
      .populate('requestedRoom', 'roomNumber block');

    // Get notifications (excluding staff-admin interactions)
    const notifications = await Notification.find({
      $and: [
        {
          $or: [
            { recipient: req.user._id },
            { recipientRole: 'student' },
            { recipientRole: 'all' }
          ],
        },
        // Exclude all staff-admin interaction notifications
        {
          $or: [
            { 'relatedEntity.entityType': { $nin: ['staffSchedule', 'staff', 'staffLeaveRequest', 'stockRequest'] } },
            { 'relatedEntity.entityType': { $exists: false } },
          ],
        },
        { isRead: false }
      ]
    })
      .sort({ sentAt: -1 })
      .limit(10);
    
    // Additional filtering to ensure no staff-admin interactions slip through
    const filteredNotifications = notifications.filter(notification => {
      const staffEntityTypes = ['staffSchedule', 'staff', 'staffLeaveRequest', 'stockRequest'];
      if (notification.relatedEntity?.entityType && 
          staffEntityTypes.includes(notification.relatedEntity.entityType)) {
        return false;
      }
      if ((notification.recipientRole === 'admin' || notification.recipientRole === 'staff') &&
          notification.recipient?.toString() !== req.user._id.toString()) {
        return false;
      }
      return true;
    });

    res.json({
      student,
      wallet: {
        balance: walletBalance,
        hasBalance: walletBalance > 0,
      },
      roomChangeRequest: activeRoomChangeRequest,
      stats: {
        room: student.room ? {
          number: student.room.roomNumber,
          floor: student.room.floor,
          building: student.room.building || student.room.block || null,
          roomType: student.room.roomType,
          amenities: student.room.amenities,
          totalPrice: student.room.totalPrice,
          basePrice: student.room.basePrice,
          amenitiesPrice: student.room.amenitiesPrice
        } : null,
        fees: {
          total: totalFees,
          paid: paidFees,
          pending: pendingFees
        },
        attendance: {
          percentage: attendancePercentage,
          present: presentCount,
          total: attendanceRecords.length
        },
        complaints: {
          pending: pendingComplaints
        }
      },
      notifications: filteredNotifications
    });
  } catch (error) {
    console.error('Get dashboard stats error:', error);
    res.status(500).json({ message: 'Error fetching dashboard stats', error: error.message });
  }
};

/**
 * Get student wallet balance and transactions
 */
export const getWallet = async (req, res) => {
  try {
    const student = await Student.findOne({ user: req.user._id });
    
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }
    
    let wallet = await Wallet.findOne({ student: student._id })
      .populate('transactions.roomChangeRequest', 'currentRoom requestedRoom currentRoomPrice requestedRoomPrice')
      .populate('transactions.payment', 'amount transactionId');
    
    if (!wallet) {
      wallet = await Wallet.create({ student: student._id, balance: 0 });
    }
    
    // Sort transactions by date (newest first)
    const sortedTransactions = wallet.transactions.sort((a, b) => 
      new Date(b.createdAt) - new Date(a.createdAt)
    );
    
    res.json({
      balance: wallet.balance,
      transactions: sortedTransactions,
    });
  } catch (error) {
    console.error('Get wallet error:', error);
    res.status(500).json({ message: 'Error fetching wallet', error: error.message });
  }
};

/**
 * Get activities
 */
export const getActivities = async (req, res) => {
  try {
    const { status, category } = req.query;
    const query = {};

    // Only show upcoming and ongoing activities to students
    if (!status) {
      query.status = { $in: ['upcoming', 'ongoing'] };
    } else {
      query.status = status;
    }

    if (category) query.category = category;

    const activities = await Activity.find(query)
      .populate('createdBy', 'name email')
      .sort({ date: 1, time: 1 });

    res.json(activities);
  } catch (error) {
    console.error('Get activities error:', error);
    res.status(500).json({ message: 'Error fetching activities', error: error.message });
  }
};

/**
 * Join an activity
 * Stores participation and notifies parent(s)
 */
export const joinActivity = async (req, res) => {
  try {
    const { id } = req.params; // activity id

    const user = await User.findById(req.user._id);
    const student = await Student.findOne({ user: req.user._id }).populate('room', 'roomNumber block building');

    if (!student) {
      return res.status(404).json({ message: 'Student profile not found' });
    }

    const activity = await Activity.findById(id);
    if (!activity) {
      return res.status(404).json({ message: 'Activity not found' });
    }

    // Only allow joining upcoming or ongoing activities
    if (!['upcoming', 'ongoing'].includes(activity.status)) {
      return res.status(400).json({ message: `You can only join upcoming or ongoing activities (current status: ${activity.status}).` });
    }

    const today = new Date();
    if (activity.date && new Date(activity.date) < today.setHours(0, 0, 0, 0)) {
      return res.status(400).json({ message: 'This activity has already passed and cannot be joined.' });
    }

    // Prevent duplicate participation
    const existing = await ActivityParticipation.findOne({
      activity: activity._id,
      student: student._id,
      status: 'joined'
    });

    if (existing) {
      return res.status(400).json({ message: 'You have already joined this activity.' });
    }

    // Build student identity for parent notifications
    let studentIdentity;
    try {
      studentIdentity = await getStudentIdentity(student);
    } catch (e) {
      console.error('Error building student identity for activity participation:', e);
      studentIdentity = {
        name: student.name,
        studentId: student.studentId,
        admissionNumber: student.studentId,
        course: student.course,
        batchYear: student.batchYear,
        year: student.year,
        roomNumber: student.room?.roomNumber,
        block: student.room?.block || student.room?.building
      };
    }

    const participation = await ActivityParticipation.create({
      activity: activity._id,
      student: student._id,
      studentIdentity,
      status: 'joined'
    });

    // Notify parent(s) that child joined the activity
    const Parent = (await import('../models/Parent.model.js')).default;
    const parents = await Parent.find({ students: student._id }).populate('user');

    if (parents && parents.length > 0) {
      const activityDate = activity.date ? new Date(activity.date) : null;
      const formattedDate = activityDate
        ? activityDate.toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })
        : 'upcoming date';

      const message = `${student.name} (${student.studentId}) has joined the hostel activity "${activity.title}" scheduled on ${formattedDate} at ${activity.location}.`;

      await Promise.all(
        parents
          .filter((p) => p.user)
          .map((p) =>
            createNotification(
              {
                title: 'Child Joined Activity',
                message,
                type: 'event',
                recipient: p.user._id,
                recipientRole: 'parent',
                relatedEntity: {
                  entityType: 'activity',
                  entityId: activity._id
                }
              },
              { origin: 'student', studentDetails: studentIdentity }
            )
          )
      );
    }

    res.status(201).json({ message: 'You have successfully joined the activity.', participation });
  } catch (error) {
    console.error('Join activity error:', error);
    if (error.code === 11000) {
      return res.status(400).json({ message: 'You have already joined this activity.' });
    }
    res.status(500).json({ message: 'Error joining activity', error: error.message });
  }
};

/**
 * Get current student's activity participations
 */
export const getActivityParticipations = async (req, res) => {
  try {
    const student = await Student.findOne({ user: req.user._id });
    if (!student) {
      return res.status(404).json({ message: 'Student profile not found' });
    }

    const participations = await ActivityParticipation.find({ student: student._id, status: 'joined' })
      .populate('activity', 'title date time location category status');

    res.json(participations);
  } catch (error) {
    console.error('Get activity participations error:', error);
    res.status(500).json({ message: 'Error fetching activity participations', error: error.message });
  }
};

// ==================== INVENTORY REQUESTS ====================

/**
 * Get eligible inventory items for students
 * Only returns predefined student-eligible items
 */
export const getEligibleInventoryItems = async (req, res) => {
  try {
    const studentEligibleItems = ['chair', 'table', 'lamp', 'bucket', 'mug', 'plate', 'cup', 'bed', 'broom', 'dustbin', 'dustpan'];

    // Ensure any existing eligible items in the DB are flagged as student-eligible (helps old records)
    await Inventory.updateMany(
      {
        name: { $in: studentEligibleItems.map(item => new RegExp(`^${item}$`, 'i')) },
        isStudentEligible: { $ne: true }
      },
      { $set: { isStudentEligible: true } }
    );

    const items = await Inventory.find({
      name: { $in: studentEligibleItems.map(item => new RegExp(`^${item}$`, 'i')) },
      isStudentEligible: true,
      status: { $in: ['available', 'in_use'] },
      quantity: { $gt: 0 }
    })
      .select('name category quantity unit location status itemType')
      .sort({ name: 1 });

    res.json(items);
  } catch (error) {
    console.error('Get eligible inventory items error:', error);
    res.status(500).json({ message: 'Error fetching eligible inventory items', error: error.message });
  }
};

/**
 * Request inventory item
 */
export const requestInventoryItem = async (req, res) => {
  try {
    const { inventoryItemId, quantity, requestReason } = req.body;

    if (!inventoryItemId || !quantity) {
      return res.status(400).json({ message: 'Inventory item ID and quantity are required' });
    }

    const quantityNum = parseInt(quantity);
    if (isNaN(quantityNum) || quantityNum < 1) {
      return res.status(400).json({ message: 'Quantity must be at least 1' });
    }

    const user = await User.findById(req.user._id);
    const student = await Student.findOne({ user: req.user._id })
      .populate('room', 'roomNumber block building');

    if (!student) {
      return res.status(404).json({ message: 'Student profile not found' });
    }

    // Check if student has a room allocated
    if (!student.room) {
      return res.status(400).json({ message: 'You must have a room allocated to request inventory items' });
    }

    // Find the inventory item
    const inventoryItem = await Inventory.findById(inventoryItemId);
    if (!inventoryItem) {
      return res.status(404).json({ message: 'Inventory item not found' });
    }

    // Ensure the student has not already requested this item (only one active request per item)
    const existingActiveRequest = await InventoryRequest.findOne({
      student: student._id,
      inventoryItem: inventoryItem._id,
      status: { $in: ['pending', 'approved', 'issued'] }
    });

    if (existingActiveRequest) {
      return res.status(400).json({
        message: 'You already have an active request for this item. Please wait for it to be processed or returned before requesting again.'
      });
    }

    // Verify item is student-eligible
    const studentEligibleItems = ['chair', 'table', 'lamp', 'bucket', 'mug', 'plate', 'cup', 'bed', 'broom', 'dustbin', 'dustpan'];
    const itemNameLower = inventoryItem.name.toLowerCase().trim();
    const isEligible = studentEligibleItems.some(item => itemNameLower === item.toLowerCase());
    
    if (!isEligible || !inventoryItem.isStudentEligible) {
      return res.status(403).json({ message: 'This item is not available for student requests' });
    }

    // Check availability
    if (inventoryItem.quantity < quantityNum) {
      return res.status(400).json({ 
        message: `Only ${inventoryItem.quantity} ${inventoryItem.unit}(s) available. Requested: ${quantityNum}` 
      });
    }

    // Check if item is available (not in maintenance or damaged)
    if (inventoryItem.status !== 'available' && inventoryItem.status !== 'in_use') {
      return res.status(400).json({ message: 'Item is not available for request at this time' });
    }

    // Determine item type (bed is permanent, others are temporary)
    const itemType = itemNameLower === 'bed' ? 'permanent' : 'temporary';

    // Get student identity
    const studentIdentity = await getStudentIdentity(student);

    // Create inventory request
    const inventoryRequest = await InventoryRequest.create({
      student: student._id,
      inventoryItem: inventoryItem._id,
      itemName: inventoryItem.name,
      quantity: quantityNum,
      requestReason: requestReason || '',
      itemType,
      status: 'pending',
      studentIdentity,
    });

    // Send notification to staff
    await createNotification(
      {
        title: 'New Inventory Request',
        message: `${student.name} (${student.studentId}) requested ${quantityNum} ${inventoryItem.unit}(s) of ${inventoryItem.name}`,
        type: 'inventory',
        recipientRole: 'staff',
        relatedEntity: {
          entityType: 'inventoryRequest',
          entityId: inventoryRequest._id,
        },
      },
      { origin: 'student', studentDetails: studentIdentity }
    );

    const populatedRequest = await InventoryRequest.findById(inventoryRequest._id)
      .populate('inventoryItem', 'name category quantity unit status')
      .populate('student', 'name studentId room')
      .populate('student.room', 'roomNumber block');

    res.status(201).json({ 
      message: 'Inventory request submitted successfully',
      request: populatedRequest
    });
  } catch (error) {
    console.error('Request inventory item error:', error);
    res.status(500).json({ message: 'Error submitting inventory request', error: error.message });
  }
};

/**
 * Get student's inventory requests
 */
export const getInventoryRequests = async (req, res) => {
  try {
    const student = await Student.findOne({ user: req.user._id });

    if (!student) {
      return res.status(404).json({ message: 'Student profile not found' });
    }

    const requests = await InventoryRequest.find({ student: student._id })
      .populate('inventoryItem', 'name category unit status')
      .populate('reviewedBy', 'name staffId')
      .populate('issuedBy', 'name staffId')
      .populate('returnedBy', 'name staffId')
      .sort({ createdAt: -1 });

    res.json(requests);
  } catch (error) {
    console.error('Get inventory requests error:', error);
    res.status(500).json({ message: 'Error fetching inventory requests', error: error.message });
  }
};

/**
 * Check if payment modal should be shown (Production-ready payment flow)
 * This endpoint is called by frontend to determine if payment modal should auto-open
 */
export const checkPaymentModalStatus = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const student = await Student.findOne({ user: req.user._id })
      .populate('temporaryRoom', 'roomNumber roomType basePrice amenitiesPrice totalPrice')
      .populate('roommateGroup');

    if (!student) {
      return res.status(404).json({ message: 'Student profile not found' });
    }

    // Check if payment is pending
    const shouldShowModal = 
      student.paymentStatus === 'PAYMENT_PENDING' &&
      student.onboardingStatus === 'payment_pending' &&
      student.temporaryRoom !== null;

    if (!shouldShowModal) {
      return res.json({
        showModal: false,
        paymentStatus: student.paymentStatus,
        onboardingStatus: student.onboardingStatus
      });
    }

    // Get unpaid fees
    const unpaidFees = await Fee.find({
      student: student._id,
      status: { $in: ['pending', 'partial'] }
    }).sort({ dueDate: 1 });

    // Get roommate group status to check if others have paid
    let groupPaymentStatus = null;
    if (student.roommateGroup) {
      const group = await RoommateGroup.findById(student.roommateGroup)
        .populate('members', 'name studentId paymentStatus amountToPay');
      
      if (group) {
        const totalMembers = group.members.length;
        const paidMembers = group.members.filter(m => m.paymentStatus === 'PAID').length;
        groupPaymentStatus = {
          totalMembers,
          paidMembers,
          pendingMembers: totalMembers - paidMembers,
        };
      }
    }

    res.json({
      showModal: true,
      paymentStatus: student.paymentStatus,
      onboardingStatus: student.onboardingStatus,
      amountToPay: student.amountToPay,
      temporaryRoom: student.temporaryRoom,
      unpaidFees,
      groupPaymentStatus,
      studentInfo: {
        name: student.name,
        email: student.email,
        phone: student.phone,
        studentId: student.studentId,
      }
    });
  } catch (error) {
    console.error('Check payment modal status error:', error);
    res.status(500).json({ 
      message: 'Error checking payment status', 
      error: error.message 
    });
  }
};

/**
 * Process late fees for overdue payments
 * This function should be run daily via cron job
 * Adds ₹50 per day for each day after the due date
 */
export const processLateFees = async () => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Find all pending fees that are past due date
    const overdueFees = await Fee.find({
      status: { $in: ['pending', 'partial'] },
      dueDate: { $lt: today }
    }).populate('student');

    let processedCount = 0;
    let lateFeeTotal = 0;

    for (const fee of overdueFees) {
      // Calculate days overdue
      const dueDate = new Date(fee.dueDate);
      dueDate.setHours(0, 0, 0, 0);
      const daysOverdue = Math.floor((today - dueDate) / (1000 * 60 * 60 * 24));

      if (daysOverdue <= 0) continue; // Skip if not actually overdue

      // Check if we've already added late fee for today
      const lastLateFeeDate = fee.lastLateFeeDate ? new Date(fee.lastLateFeeDate) : null;
      if (lastLateFeeDate) {
        lastLateFeeDate.setHours(0, 0, 0, 0);
        if (lastLateFeeDate.getTime() === today.getTime()) {
          continue; // Already processed today
        }
      }

      // Add ₹50 late fee
      const lateFeeAmount = 50;
      fee.amount = (fee.amount || 0) + lateFeeAmount;
      fee.lateFee = (fee.lateFee || 0) + lateFeeAmount;
      fee.lastLateFeeDate = today;
      fee.status = 'overdue';
      
      // Update description to include late fee info
      const originalDesc = fee.description || '';
      if (!originalDesc.includes('Late fee:')) {
        fee.description = `${originalDesc} | Late fee applied: ₹${fee.lateFee} (${daysOverdue} days overdue)`;
      } else {
        // Update existing late fee description
        fee.description = originalDesc.replace(/Late fee applied: ₹\d+ \(\d+ days overdue\)/, 
          `Late fee applied: ₹${fee.lateFee} (${daysOverdue} days overdue)`);
      }

      await fee.save();

      // Send notification to student
      if (fee.student) {
        await createNotification(
          {
            title: '⚠️ Late Fee Applied',
            message: `A late fee of ₹${lateFeeAmount} has been added to your pending payment for being ${daysOverdue} day(s) overdue. Current outstanding amount: ₹${fee.amount.toLocaleString('en-IN')}. Please complete your payment as soon as possible to avoid further charges.`,
            type: 'payment',
            recipient: fee.student.user,
            relatedEntity: {
              entityType: 'fee',
              entityId: fee._id,
            },
          },
          { origin: 'system' }
        );
      }

      processedCount++;
      lateFeeTotal += lateFeeAmount;
    }

    console.log(`✅ Late fees processed: ${processedCount} students charged ₹${lateFeeTotal} total`);
    return {
      success: true,
      processedCount,
      lateFeeTotal,
    };
  } catch (error) {
    console.error('Error processing late fees:', error);
    return {
      success: false,
      error: error.message,
    };
  }
};

/**
 * Get daily meals (menu)
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

    const meals = await DailyMeal.find(query).sort({ date: 1 });

    // Transform to include day of week and format meal data for frontend
    const mealsWithDay = meals.map(meal => {
      const mealObj = meal.toObject();
      const dayOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][meal.date.getDay()];
      
      return {
        _id: mealObj._id,
        date: mealObj.date,
        dayOfWeek,
        breakfast: {
          item: mealObj.breakfast,
          suggestedBy: mealObj.fromSuggestion?.breakfast?.studentName ? {
            name: mealObj.fromSuggestion.breakfast.studentName
          } : null
        },
        lunch: {
          item: mealObj.lunch,
          suggestedBy: mealObj.fromSuggestion?.lunch?.studentName ? {
            name: mealObj.fromSuggestion.lunch.studentName
          } : null
        },
        dinner: {
          item: mealObj.dinner,
          suggestedBy: mealObj.fromSuggestion?.dinner?.studentName ? {
            name: mealObj.fromSuggestion.dinner.studentName
          } : null
        },
        createdAt: mealObj.createdAt,
        updatedAt: mealObj.updatedAt
      };
    });

    res.json(mealsWithDay);
  } catch (error) {
    console.error('Get daily meals error:', error);
    res.status(500).json({ message: 'Error fetching daily meals', error: error.message });
  }
};

