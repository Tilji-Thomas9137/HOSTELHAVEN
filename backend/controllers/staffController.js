import Staff from '../models/Staff.model.js';
import User from '../models/User.model.js';
import Student from '../models/Student.model.js';
import Attendance from '../models/Attendance.model.js';
import Complaint from '../models/Complaint.model.js';
import CleaningRequest from '../models/CleaningRequest.model.js';
import Inventory from '../models/Inventory.model.js';
import InventoryRequest from '../models/InventoryRequest.model.js';
import VisitorLog from '../models/VisitorLog.model.js';
import Notification from '../models/Notification.model.js';
import { createNotification } from '../utils/notificationHelper.js';
import Activity from '../models/Activity.model.js';

let ParentModel; // lazy-loaded Parent model for child-related notifications

/**
 * Get staff profile
 */
export const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const staff = await Staff.findOne({ user: req.user._id });

    if (!staff) {
      return res.status(404).json({ message: 'Staff profile not found' });
    }

    res.json({ user, staff });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ message: 'Error fetching profile', error: error.message });
  }
};

/**
 * Update staff profile
 */
export const updateProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const staff = await Staff.findOne({ user: req.user._id });

    if (!staff) {
      return res.status(404).json({ message: 'Staff profile not found' });
    }

    // Update user
    if (req.body.name) user.name = req.body.name;
    if (req.body.phone) user.phone = req.body.phone;
    await user.save();

    // Update staff
    const updatedStaff = await Staff.findByIdAndUpdate(staff._id, req.body, {
      new: true,
      runValidators: true,
    });

    res.json({ message: 'Profile updated successfully', user, staff: updatedStaff });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ message: 'Error updating profile', error: error.message });
  }
};

/**
 * Get schedule/view assigned tasks
 */
export const getSchedule = async (req, res) => {
  try {
    const { date } = req.query;
    const staff = await Staff.findOne({ user: req.user._id });

    if (!staff) {
      return res.status(404).json({ message: 'Staff profile not found' });
    }

    // Get assigned complaints
    const complaints = await Complaint.find({
      assignedTo: staff._id,
      status: { $in: ['pending', 'in_progress'] },
    })
      .populate('student', 'name studentId email')
      .populate('room', 'roomNumber')
      .sort({ priority: -1, createdAt: -1 });

    // Get attendance records
    const attendance = await Attendance.find({
      staff: staff._id,
      date: date ? new Date(date) : new Date(),
    }).populate('markedBy', 'name');

    // Get visitor logs
    const visitorLogs = await VisitorLog.find({
      loggedBy: staff._id,
      status: 'checked_in',
      checkIn: date ? new Date(date) : new Date(),
    })
      .populate('student', 'name studentId')
      .populate('room', 'roomNumber');

    // Get leave requests for this staff
    const StaffLeaveRequest = (await import('../models/StaffLeaveRequest.model.js')).default;
    const leaveRequests = await StaffLeaveRequest.find({
      staff: staff._id,
    })
      .sort({ leaveDate: -1 })
      .limit(20);

    // Get detailed weekly schedule
    const StaffSchedule = (await import('../models/StaffSchedule.model.js')).default;
    const weeklySchedule = await StaffSchedule.findOne({
      staff: staff._id,
      isActive: true,
    });

    // Format weekly schedule for frontend
    let formattedWeeklySchedule = null;
    if (weeklySchedule && weeklySchedule.weeklySchedule) {
      const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
      formattedWeeklySchedule = days.map((day) => {
        const dayData = weeklySchedule.weeklySchedule[day];
        return {
          day: day.charAt(0).toUpperCase() + day.slice(1),
          shift: dayData?.shift || staff.shift || 'Full Day',
          duties: dayData?.duties || '',
          timeSlot: dayData?.timeSlot || '',
        };
      });
    }

    // Get today's schedule
    let todaySchedule = [];
    if (weeklySchedule && weeklySchedule.todaySchedule && weeklySchedule.todaySchedule.length > 0) {
      todaySchedule = weeklySchedule.todaySchedule;
    } else {
      // Fallback: generate today's schedule from complaints
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const todayComplaints = await Complaint.find({
        assignedTo: staff._id,
        status: 'requested',
        createdAt: { $gte: today, $lt: tomorrow },
      })
        .populate('student', 'name studentId')
        .populate('room', 'roomNumber block')
        .sort({ priority: -1, createdAt: -1 })
        .limit(5);

      todaySchedule = todayComplaints.map((c) => ({
        duty: c.title || c.description?.substring(0, 50) || 'Complaint',
        time: new Date(c.createdAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }),
        location: c.room?.roomNumber ? `Room ${c.room.roomNumber}${c.room.block ? ` (Block ${c.room.block})` : ''}` : 'N/A',
      }));
    }

    res.json({
      complaints,
      attendance,
      visitorLogs,
      leaveRequests,
      schedule: {
        shift: staff.shift,
        department: staff.department,
        weeklySchedule: formattedWeeklySchedule,
        todaySchedule: todaySchedule,
      },
    });
  } catch (error) {
    console.error('Get schedule error:', error);
    res.status(500).json({ message: 'Error fetching schedule', error: error.message });
  }
};

/**
 * Request leave
 */
export const requestLeave = async (req, res) => {
  try {
    const { leaveDate, reason } = req.body;

    if (!leaveDate || !reason || reason.trim() === '') {
      return res.status(400).json({ message: 'Leave date and reason are required' });
    }

    const staff = await Staff.findOne({ user: req.user._id });

    if (!staff) {
      return res.status(404).json({ message: 'Staff profile not found' });
    }

    // Check if leave date is in the past
    const leaveDateObj = new Date(leaveDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    leaveDateObj.setHours(0, 0, 0, 0);

    if (leaveDateObj < today) {
      return res.status(400).json({ message: 'Cannot request leave for past dates' });
    }

    // Check if there's already a pending leave request for this date
    const StaffLeaveRequest = (await import('../models/StaffLeaveRequest.model.js')).default;
    const existingRequest = await StaffLeaveRequest.findOne({
      staff: staff._id,
      leaveDate: leaveDateObj,
      status: 'pending',
    });

    if (existingRequest) {
      return res.status(400).json({ message: 'You already have a pending leave request for this date' });
    }

    // Get staff identity
    const staffIdentity = {
      name: staff.name,
      staffId: staff.staffId,
      department: staff.department || null,
      designation: staff.designation || null,
    };

    const leaveRequest = await StaffLeaveRequest.create({
      staff: staff._id,
      leaveDate: leaveDateObj,
      reason: reason.trim(),
      status: 'pending',
      staffIdentity,
    });

    // Send notification to admin
    await createNotification(
      {
        title: 'Staff Leave Request',
        message: `${staff.name} (${staff.staffId}) has requested leave on ${leaveDateObj.toLocaleDateString()}. Reason: ${reason.substring(0, 50)}${reason.length > 50 ? '...' : ''}`,
        type: 'general',
        recipientRole: 'admin',
        relatedEntity: {
          entityType: 'staffLeaveRequest',
          entityId: leaveRequest._id,
        },
      },
      {
        notifyStaff: false,
        origin: 'staff',
      }
    );

    res.status(201).json({ message: 'Leave request submitted successfully', leaveRequest });
  } catch (error) {
    console.error('Request leave error:', error);
    res.status(500).json({ message: 'Error submitting leave request', error: error.message });
  }
};

/**
 * Get leave requests (for staff - their own requests)
 */
export const getLeaveRequests = async (req, res) => {
  try {
    const staff = await Staff.findOne({ user: req.user._id });

    if (!staff) {
      return res.status(404).json({ message: 'Staff profile not found' });
    }

    const StaffLeaveRequest = (await import('../models/StaffLeaveRequest.model.js')).default;

    const leaveRequests = await StaffLeaveRequest.find({ staff: staff._id })
      .sort({ leaveDate: -1 })
      .limit(50);

    res.json(leaveRequests);
  } catch (error) {
    console.error('Get leave requests error:', error);
    res.status(500).json({ message: 'Error fetching leave requests', error: error.message });
  }
};

/**
 * Mark attendance for staff
 */
export const markAttendance = async (req, res) => {
  try {
    const { date, status, checkIn, checkOut, remarks } = req.body;
    const staff = await Staff.findOne({ user: req.user._id });

    if (!staff) {
      return res.status(404).json({ message: 'Staff profile not found' });
    }

    const attendanceDate = date || new Date();

    // Check if attendance already exists
    let attendance = await Attendance.findOne({
      staff: staff._id,
      date: new Date(attendanceDate).toISOString().split('T')[0],
    });

    if (attendance) {
      // Update existing
      attendance.status = status || attendance.status;
      attendance.checkIn = checkIn || attendance.checkIn;
      attendance.checkOut = checkOut || attendance.checkOut;
      attendance.remarks = remarks || attendance.remarks;
      await attendance.save();
    } else {
      // Create new
      attendance = await Attendance.create({
        staff: staff._id,
        type: 'staff',
        date: attendanceDate,
        status: status || 'present',
        checkIn: checkIn || new Date(),
        checkOut,
        remarks,
        markedBy: req.user._id,
      });
    }

    res.json({ message: 'Attendance marked successfully', attendance });
  } catch (error) {
    console.error('Mark attendance error:', error);
    res.status(500).json({ message: 'Error marking attendance', error: error.message });
  }
};

/**
 * Get staff attendance (view own attendance recorded by admin)
 */
export const getAttendance = async (req, res) => {
  try {
    const staff = await Staff.findOne({ user: req.user._id });

    if (!staff) {
      return res.status(404).json({ message: 'Staff profile not found' });
    }

    const { startDate, endDate } = req.query;
    const query = { staff: staff._id, type: 'staff' };

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
 * Get assigned complaints
 */
export const getAssignedComplaints = async (req, res) => {
  try {
    const staff = await Staff.findOne({ user: req.user._id });

    if (!staff) {
      return res.status(404).json({ message: 'Staff profile not found' });
    }

    const { status } = req.query;
    const query = { assignedTo: staff._id };

    if (status) query.status = status;

    const complaints = await Complaint.find(query)
      .populate('student', 'name studentId email phone course year batchYear')
      .populate('room', 'roomNumber block building')
      .sort({ priority: -1, createdAt: -1 });

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
    console.error('Get assigned complaints error:', error);
    res.status(500).json({ message: 'Error fetching complaints', error: error.message });
  }
};

/**
 * Update complaint status
 */
export const updateComplaintStatus = async (req, res) => {
  try {
    const { status, resolutionNotes } = req.body;
    const staff = await Staff.findOne({ user: req.user._id });

    if (!staff) {
      return res.status(404).json({ message: 'Staff profile not found' });
    }

    // Validate status - only 'requested' and 'resolved' are allowed
    if (status && !['requested', 'resolved'].includes(status)) {
      return res.status(400).json({ 
        message: 'Invalid status. Only "requested" and "resolved" statuses are allowed.' 
      });
    }

    const complaint = await Complaint.findOne({
      _id: req.params.id,
      assignedTo: staff._id,
    });

    if (!complaint) {
      return res.status(404).json({ message: 'Complaint not found or not assigned to you' });
    }

    const updateData = {};
    if (status) updateData.status = status;
    if (resolutionNotes) updateData.resolutionNotes = resolutionNotes;

    if (status === 'resolved') {
      updateData.resolvedAt = new Date();
      updateData.resolvedBy = req.user._id;
    }

    const updatedComplaint = await Complaint.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    )
      .populate('student', 'name studentId')
      .populate('assignedTo', 'name staffId')
      .populate('resolvedBy', 'name');

    // Send notification to student
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
          { origin: 'staff' }
        );
      }
    }

    res.json({ message: 'Complaint status updated successfully', complaint: updatedComplaint });
  } catch (error) {
    console.error('Update complaint status error:', error);
    res.status(500).json({ message: 'Error updating complaint status', error: error.message });
  }
};

/**
 * Manage inventory items
 */
export const getInventoryItems = async (req, res) => {
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

export const updateInventoryItem = async (req, res) => {
  try {
    const inventory = await Inventory.findByIdAndUpdate(
      req.params.id,
      { ...req.body, managedBy: req.user._id },
      { new: true, runValidators: true }
    )
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

/**
 * Create stock request or report stock out
 */
export const createStockRequest = async (req, res) => {
  try {
    const { type, itemName, category, quantity, unit, priority, reason } = req.body;

    if (!type || !itemName || !quantity || !reason) {
      return res.status(400).json({ message: 'Type, item name, quantity, and reason are required' });
    }

    // Validate quantity
    const quantityNum = parseInt(quantity);
    if (isNaN(quantityNum) || quantityNum < 1) {
      return res.status(400).json({ message: 'Quantity must be at least 1' });
    }
    if (quantityNum > 500) {
      return res.status(400).json({ message: 'Quantity cannot exceed 500' });
    }

    const staff = await Staff.findOne({ user: req.user._id });

    if (!staff) {
      return res.status(404).json({ message: 'Staff profile not found' });
    }

    // Get staff identity
    const staffIdentity = {
      name: staff.name,
      staffId: staff.staffId,
      department: staff.department,
    };

    const StockRequest = (await import('../models/StockRequest.model.js')).default;

    const stockRequest = await StockRequest.create({
      requestedBy: staff._id,
      type,
      itemName,
      category: category || 'other',
      quantity: quantityNum,
      unit: unit || 'piece',
      priority: priority || 'medium',
      reason,
      staffIdentity,
    });

    // Send notification to admin
    await createNotification(
      {
        title: type === 'stock_out_report' ? 'Stock Out Reported' : 'Stock Request Submitted',
        message: `${staff.name} ${type === 'stock_out_report' ? 'reported stock out' : 'requested stock'} for ${itemName} (${quantity} ${unit || 'piece'})`,
        type: 'inventory',
        recipientRole: 'admin',
        relatedEntity: {
          entityType: 'stockRequest',
          entityId: stockRequest._id,
        },
      },
      { origin: 'staff' }
    );

    const populatedRequest = await StockRequest.findById(stockRequest._id)
      .populate('requestedBy', 'name staffId department');

    res.status(201).json({ message: 'Stock request submitted successfully', stockRequest: populatedRequest });
  } catch (error) {
    console.error('Create stock request error:', error);
    
    // Handle validation errors
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(err => err.message).join(', ');
      return res.status(400).json({ message: `Validation error: ${validationErrors}`, error: error.message });
    }
    
    res.status(500).json({ message: 'Error creating stock request', error: error.message });
  }
};

/**
 * Get stock requests by staff
 */
export const getStockRequests = async (req, res) => {
  try {
    const staff = await Staff.findOne({ user: req.user._id });

    if (!staff) {
      return res.status(404).json({ message: 'Staff profile not found' });
    }

    const StockRequest = (await import('../models/StockRequest.model.js')).default;
    const { status, type } = req.query;
    const query = { requestedBy: staff._id };

    if (status) query.status = status;
    if (type) query.type = type;

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

/**
 * Log visitor entry
 */
export const logVisitor = async (req, res) => {
  try {
    const staff = await Staff.findOne({ user: req.user._id });

    if (!staff) {
      return res.status(404).json({ message: 'Staff profile not found' });
    }

    const {
      visitorName,
      visitorPhone,
      visitorEmail,
      visitorId,
      direction,
      type,
      purpose,
      remarks,
    } = req.body;

    // Use VendorLog for vendor entries
    const VendorLog = (await import('../models/VendorLog.model.js')).default;
    const now = new Date();

    let vendorLog;
    
    if (direction === 'IN' || !direction) {
      // Create new IN entry
      vendorLog = await VendorLog.create({
        vendorName: visitorName.trim(),
        vendorPhone: visitorPhone || '',
        vendorEmail: visitorEmail,
        vendorId: visitorId,
        type: type || 'Visitor',
        direction: 'IN',
        inTime: now,
        purpose: purpose || remarks || '',
        remarks: remarks || '',
        loggedBy: staff._id,
      });
    } else {
      // For OUT, find the most recent IN entry for this vendor that doesn't have an outTime
      const lastInEntry = await VendorLog.findOne({
        vendorName: visitorName.trim(),
        inTime: { $exists: true },
        outTime: null,
      }).sort({ inTime: -1 });

      if (!lastInEntry) {
        return res.status(404).json({ 
          message: `No active IN entry found for ${visitorName}. Please log IN first.` 
        });
      }

      // Update the IN entry with OUT time
      lastInEntry.outTime = now;
      if (remarks) {
        lastInEntry.remarks = (lastInEntry.remarks || '') + (lastInEntry.remarks ? ' | ' : '') + remarks;
      }
      await lastInEntry.save();
      vendorLog = lastInEntry;
    }

    const populatedLog = await VendorLog.findById(vendorLog._id)
      .populate('loggedBy', 'name');

    res.status(201).json({ 
      message: direction === 'IN' ? 'Vendor checked in successfully' : 'Vendor checked out successfully', 
      visitorLog: populatedLog 
    });
  } catch (error) {
    console.error('Log visitor error:', error);
    res.status(500).json({ message: 'Error logging vendor entry', error: error.message });
  }
};

/**
 * Scan outpass QR code and log student exit or return
 */
export const scanOutpassQR = async (req, res) => {
  try {
    const { outpassId } = req.body;
    const staff = await Staff.findOne({ user: req.user._id });

    if (!staff) {
      return res.status(404).json({ message: 'Staff profile not found' });
    }

    const OutingRequest = (await import('../models/OutingRequest.model.js')).default;
    const { sendOutpassNotification } = await import('../services/mailService.js');
    const Parent = (await import('../models/Parent.model.js')).default;
    
    const outpass = await OutingRequest.findById(outpassId)
      .populate('student', 'name studentId admissionNumber email');

    if (!outpass) {
      return res.status(404).json({ message: 'Outpass not found' });
    }

    if (outpass.status !== 'approved') {
      return res.status(400).json({ message: 'Outpass is not approved' });
    }

    const now = new Date();
    let action = 'exit';
    let message = 'Student exit logged successfully';

    // Check if student is exiting or returning
    if (!outpass.exitTime) {
      // Student is exiting
      outpass.exitTime = now;
      outpass.exitScannedBy = staff._id;
      outpass.exitScannedAt = now;
      // Legacy fields
      outpass.scannedAt = now;
      outpass.scannedBy = staff._id;
      action = 'exit';
      message = 'Student exit logged successfully';
    } else if (!outpass.returnTime) {
      // Student is returning
      outpass.returnTime = now;
      outpass.returnScannedBy = staff._id;
      outpass.returnScannedAt = now;
      outpass.status = 'completed';
      outpass.actualReturnDate = now;
      action = 'return';
      message = 'Student return logged successfully';
    } else {
      return res.status(400).json({ message: 'Student has already exited and returned' });
    }

    await outpass.save();

    // Get student with user info
    const student = await Student.findById(outpass.student._id).populate('user');

    // Send notification to student
    if (student && student.user) {
      await createNotification(
        {
          title: action === 'exit' ? 'Outpass Exit Logged' : 'Outpass Return Logged',
          message: action === 'exit' 
            ? `Your exit has been logged. You may now leave the hostel.` 
            : `Your return has been logged. Welcome back to the hostel.`,
          type: 'outing',
          recipient: student.user._id,
          relatedEntity: {
            entityType: 'outing',
            entityId: outpass._id,
          },
        },
        { origin: 'staff' }
      );
    }

    // Find parent and send notifications/emails
    const parent = await Parent.findOne({ students: student._id }).populate('user');
    
    if (parent && parent.user) {
      // Send notification to parent (for both exit and return)
      await createNotification(
        {
          title: action === 'exit' ? 'Student Left Hostel' : 'Student Returned to Hostel',
          message: action === 'exit'
            ? `${student.name} (${student.studentId || student.admissionNumber}) has left the hostel for ${outpass.destination}. Exit time: ${now.toLocaleString('en-IN')}. Expected return: ${new Date(outpass.expectedReturnDate).toLocaleString('en-IN')}`
            : `${student.name} (${student.studentId || student.admissionNumber}) has returned to the hostel from ${outpass.destination}. Return time: ${now.toLocaleString('en-IN')}`,
          type: 'outing',
          recipient: parent.user._id,
          recipientRole: 'parent',
          relatedEntity: {
            entityType: 'outing',
            entityId: outpass._id,
          },
          studentDetails: {
            name: student.name,
            studentId: student.studentId || student.admissionNumber,
            admissionNumber: student.studentId || student.admissionNumber,
          },
        },
        { origin: 'staff' }
      );

      // Send email notification to parent (for both exit and return)
      if (parent.user.email) {
        try {
          await sendOutpassNotification({
            to: parent.user.email,
            parentName: parent.name,
            studentName: student.name,
            studentId: student.studentId || student.admissionNumber,
            type: action, // 'exit' or 'return'
            time: now,
            destination: outpass.destination,
            purpose: outpass.purpose,
            departureDate: outpass.departureDate,
            expectedReturnDate: outpass.expectedReturnDate,
            emergencyContact: outpass.emergencyContact,
          });
        } catch (emailError) {
          console.error('Error sending email to parent:', emailError);
          // Don't fail the request if email fails
        }
      }

      // Send notification to admin (for both exit and return)
      await createNotification(
        {
          title: action === 'exit' ? 'Student Left Hostel' : 'Student Returned to Hostel',
          message: action === 'exit'
            ? `${student.name} (${student.studentId || student.admissionNumber}) has left the hostel for ${outpass.destination}. Exit time: ${now.toLocaleString('en-IN')}. Expected return: ${new Date(outpass.expectedReturnDate).toLocaleString('en-IN')}`
            : `${student.name} (${student.studentId || student.admissionNumber}) has returned to the hostel from ${outpass.destination}. Return time: ${now.toLocaleString('en-IN')}`,
          type: 'outing',
          recipientRole: 'admin',
          relatedEntity: {
            entityType: 'outing',
            entityId: outpass._id,
          },
          studentDetails: {
            name: student.name,
            studentId: student.studentId || student.admissionNumber,
            admissionNumber: student.studentId || student.admissionNumber,
          },
        },
        { origin: 'staff' }
      );
    }

    res.json({ 
      message, 
      action,
      outpass: {
        ...outpass.toObject(),
        student: outpass.student,
      }
    });
  } catch (error) {
    console.error('Scan outpass QR error:', error);
    res.status(500).json({ message: 'Error scanning QR code', error: error.message });
  }
};

/**
 * Manually log student exit or return by admission number
 */
export const manualStudentExit = async (req, res) => {
  try {
    const { admissionNumber, action } = req.body; // action: 'exit' or 'return'
    const staff = await Staff.findOne({ user: req.user._id });

    if (!staff) {
      return res.status(404).json({ message: 'Staff profile not found' });
    }

    if (!admissionNumber || !action) {
      return res.status(400).json({ message: 'Admission number and action (exit/return) are required' });
    }

    if (!['exit', 'return'].includes(action)) {
      return res.status(400).json({ message: 'Action must be either "exit" or "return"' });
    }

    const OutingRequest = (await import('../models/OutingRequest.model.js')).default;
    const { sendOutpassNotification } = await import('../services/mailService.js');
    const Parent = (await import('../models/Parent.model.js')).default;

    // Find student by admission number
    const student = await Student.findOne({ 
      $or: [
        { admissionNumber: admissionNumber.trim() },
        { studentId: admissionNumber.trim() }
      ]
    }).populate('user');

    if (!student) {
      return res.status(404).json({ message: 'Student not found with the provided admission number' });
    }

    // Find active approved outpass for this student
    const outpass = await OutingRequest.findOne({
      student: student._id,
      status: 'approved',
    }).sort({ createdAt: -1 });

    if (!outpass) {
      return res.status(404).json({ 
        message: `No approved outpass found for ${student.name}. Please ensure the student has an approved outpass request.` 
      });
    }

    const now = new Date();

    if (action === 'exit') {
      if (outpass.exitTime) {
        return res.status(400).json({ message: 'Student has already exited' });
      }
      outpass.exitTime = now;
      outpass.exitScannedBy = staff._id;
      outpass.exitScannedAt = now;
      // Legacy fields
      outpass.scannedAt = now;
      outpass.scannedBy = staff._id;
    } else {
      if (!outpass.exitTime) {
        return res.status(400).json({ message: 'Student must exit first before returning' });
      }
      if (outpass.returnTime) {
        return res.status(400).json({ message: 'Student has already returned' });
      }
      outpass.returnTime = now;
      outpass.returnScannedBy = staff._id;
      outpass.returnScannedAt = now;
      outpass.status = 'completed';
      outpass.actualReturnDate = now;
    }

    await outpass.save();

    // Send notification to student
    if (student && student.user) {
      await createNotification(
        {
          title: action === 'exit' ? 'Outpass Exit Logged' : 'Outpass Return Logged',
          message: action === 'exit' 
            ? `Your exit has been logged manually. You may now leave the hostel.` 
            : `Your return has been logged manually. Welcome back to the hostel.`,
          type: 'outing',
          recipient: student.user._id,
          relatedEntity: {
            entityType: 'outing',
            entityId: outpass._id,
          },
        },
        { origin: 'staff' }
      );
    }

    // Find parent and send email notification (for both exit and return)
    const parent = await Parent.findOne({ students: student._id }).populate('user');
    if (parent && parent.user && parent.user.email) {
      try {
        await sendOutpassNotification({
          to: parent.user.email,
          parentName: parent.name,
          studentName: student.name,
          studentId: student.studentId || student.admissionNumber,
          type: action, // 'exit' or 'return'
          time: now,
          destination: outpass.destination,
          purpose: outpass.purpose,
          departureDate: outpass.departureDate,
          expectedReturnDate: outpass.expectedReturnDate,
          emergencyContact: outpass.emergencyContact,
        });
      } catch (emailError) {
        console.error('Error sending email to parent:', emailError);
        // Don't fail the request if email fails
      }
    }

    res.json({ 
      message: `Student ${action} logged successfully`,
      action,
      student: {
        name: student.name,
        studentId: student.studentId,
        admissionNumber: student.admissionNumber,
      },
      outpass: {
        exitTime: outpass.exitTime,
        returnTime: outpass.returnTime,
        destination: outpass.destination,
        purpose: outpass.purpose,
      }
    });
  } catch (error) {
    console.error('Manual student exit error:', error);
    res.status(500).json({ message: 'Error logging student exit/return', error: error.message });
  }
};

/**
 * Get student exit/return logs for staff dashboard
 */
export const getStudentExitLogs = async (req, res) => {
  try {
    const OutingRequest = (await import('../models/OutingRequest.model.js')).default;
    const { status, startDate, endDate } = req.query;
    
    const query = {
      status: { $in: ['approved', 'completed'] },
    };

    if (status) {
      if (status === 'exited') {
        query.exitTime = { $exists: true };
        query.returnTime = null;
      } else if (status === 'returned') {
        query.returnTime = { $exists: true };
      } else if (status === 'completed') {
        query.status = 'completed';
      }
    }

    if (startDate || endDate) {
      query.exitTime = query.exitTime || {};
      if (startDate) query.exitTime.$gte = new Date(startDate);
      if (endDate) query.exitTime.$lte = new Date(endDate);
    }

    const logs = await OutingRequest.find(query)
      .populate('student', 'name studentId admissionNumber email')
      .populate('exitScannedBy', 'name')
      .populate('returnScannedBy', 'name')
      .populate('approvedBy', 'name')
      .sort({ exitTime: -1, createdAt: -1 })
      .limit(100);

    res.json(logs);
  } catch (error) {
    console.error('Get student exit logs error:', error);
    res.status(500).json({ message: 'Error fetching student exit logs', error: error.message });
  }
};

/**
 * Get student details by admission number with active outpass
 */
export const getStudentByAdmissionNumber = async (req, res) => {
  try {
    const { admissionNumber } = req.params;
    
    if (!admissionNumber) {
      return res.status(400).json({ message: 'Admission number is required' });
    }

    const OutingRequest = (await import('../models/OutingRequest.model.js')).default;
    
    // Find student by admission number or studentId
    const student = await Student.findOne({
      $or: [
        { admissionNumber: admissionNumber.trim() },
        { studentId: admissionNumber.trim() }
      ]
    })
      .populate('user', 'name email')
      .populate('room', 'roomNumber block floor')
      .select('name studentId admissionNumber email course batchYear year room');

    if (!student) {
      return res.status(404).json({ message: 'Student not found with the provided admission number' });
    }

    // Find active approved outpass for this student
    const outpass = await OutingRequest.findOne({
      student: student._id,
      status: 'approved',
    })
      .populate('approvedBy', 'name')
      .sort({ createdAt: -1 });

    if (!outpass) {
      return res.status(404).json({ 
        message: 'No approved outpass found for this student',
        student: {
          name: student.name,
          studentId: student.studentId,
          admissionNumber: student.admissionNumber,
          course: student.course,
          batchYear: student.batchYear,
          year: student.year,
          room: student.room,
        }
      });
    }

    res.json({
      student: {
        name: student.name,
        studentId: student.studentId,
        admissionNumber: student.admissionNumber,
        email: student.email,
        course: student.course,
        batchYear: student.batchYear,
        year: student.year,
        room: student.room,
      },
      outpass: {
        _id: outpass._id,
        purpose: outpass.purpose,
        destination: outpass.destination,
        departureDate: outpass.departureDate,
        expectedReturnDate: outpass.expectedReturnDate,
        exitTime: outpass.exitTime,
        returnTime: outpass.returnTime,
        status: outpass.status,
        approvedBy: outpass.approvedBy,
        approvedAt: outpass.approvedAt,
        qrCode: outpass.qrCode,
      }
    });
  } catch (error) {
    console.error('Get student by admission number error:', error);
    res.status(500).json({ message: 'Error fetching student details', error: error.message });
  }
};

/**
 * Get vendor logs (vendors only, no students)
 * Returns one entry per vendor visit (entries with inTime)
 */
export const getVendorLogs = async (req, res) => {
  try {
    const VendorLog = (await import('../models/VendorLog.model.js')).default;
    const { direction, startDate, endDate } = req.query;
    const query = { inTime: { $exists: true } }; // Only entries that have inTime (actual visits)

    if (direction === 'IN') {
      query.outTime = null; // Only entries that haven't checked out
    } else if (direction === 'OUT') {
      query.outTime = { $exists: true, $ne: null }; // Only entries that have checked out
    }

    if (startDate || endDate) {
      query.inTime = query.inTime || {};
      if (startDate) query.inTime.$gte = new Date(startDate);
      if (endDate) query.inTime.$lte = new Date(endDate);
    }

    const vendorLogs = await VendorLog.find(query)
      .populate('loggedBy', 'name')
      .sort({ inTime: -1 })
      .limit(100);

    res.json(vendorLogs);
  } catch (error) {
    console.error('Get vendor logs error:', error);
    res.status(500).json({ message: 'Error fetching vendor logs', error: error.message });
  }
};

/**
 * Create vendor log entry
 * For IN: Creates a new entry
 * For OUT: Updates the most recent IN entry for that vendor
 */
export const createVendorLog = async (req, res) => {
  try {
    const staff = await Staff.findOne({ user: req.user._id });

    if (!staff) {
      return res.status(404).json({ message: 'Staff profile not found' });
    }

    const { vendorName, vendorPhone, vendorEmail, vendorId, type, direction, purpose, remarks } = req.body;

    if (!vendorName || !direction) {
      return res.status(400).json({ message: 'Vendor name and direction are required' });
    }

    const VendorLog = (await import('../models/VendorLog.model.js')).default;
    const now = new Date();

    let vendorLog;
    
    if (direction === 'IN') {
      // Create new IN entry
      vendorLog = await VendorLog.create({
        vendorName: vendorName.trim(),
        vendorPhone,
        vendorEmail,
        vendorId,
        type: type || 'Visitor',
        direction: 'IN',
        inTime: now,
        purpose,
        remarks,
        loggedBy: staff._id,
      });
    } else {
      // For OUT, find the most recent IN entry for this vendor that doesn't have an outTime
      const lastInEntry = await VendorLog.findOne({
        vendorName: vendorName.trim(),
        inTime: { $exists: true },
        outTime: null,
      }).sort({ inTime: -1 });

      if (!lastInEntry) {
        return res.status(404).json({ 
          message: `No active IN entry found for ${vendorName}. Please log IN first.` 
        });
      }

      // Update the IN entry with OUT time
      lastInEntry.outTime = now;
      if (remarks) {
        lastInEntry.remarks = (lastInEntry.remarks || '') + (lastInEntry.remarks ? ' | ' : '') + remarks;
      }
      await lastInEntry.save();
      vendorLog = lastInEntry;
    }

    const populatedLog = await VendorLog.findById(vendorLog._id)
      .populate('loggedBy', 'name');

    res.status(201).json({ 
      message: direction === 'IN' ? 'Vendor checked in successfully' : 'Vendor checked out successfully', 
      vendorLog: populatedLog 
    });
  } catch (error) {
    console.error('Create vendor log error:', error);
    res.status(500).json({ message: 'Error logging vendor entry', error: error.message });
  }
};

/**
 * Create student visitor log (for staff to log visitors visiting students)
 */
export const createStudentVisitorLog = async (req, res) => {
  try {
    const staff = await Staff.findOne({ user: req.user._id });

    if (!staff) {
      return res.status(404).json({ message: 'Staff profile not found' });
    }

    const { visitorName, visitorPhone, visitorEmail, visitorId, studentId, admissionNumber, relation, purpose, remarks } = req.body;

    if (!visitorName || !visitorPhone) {
      return res.status(400).json({ message: 'Visitor name and phone are required' });
    }

    // Find student by studentId or admissionNumber
    let student;
    if (studentId) {
      student = await Student.findOne({ studentId: studentId.trim() });
    } else if (admissionNumber) {
      student = await Student.findOne({ 
        $or: [
          { admissionNumber: admissionNumber.trim() },
          { studentId: admissionNumber.trim() }
        ]
      });
    } else {
      return res.status(400).json({ message: 'Student ID or admission number is required' });
    }

    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    const VisitorLog = (await import('../models/VisitorLog.model.js')).default;

    const visitorLog = await VisitorLog.create({
      visitorName: visitorName.trim(),
      visitorPhone: visitorPhone.trim(),
      visitorEmail: visitorEmail?.trim(),
      visitorId: visitorId?.trim(),
      student: student._id,
      room: student.room,
      relation: relation || 'Other',
      purpose: purpose || 'visit',
      checkIn: new Date(),
      status: 'checked_in',
      remarks: remarks?.trim(),
      loggedBy: staff._id,
    });

    const populatedLog = await VisitorLog.findById(visitorLog._id)
      .populate('student', 'name studentId admissionNumber')
      .populate('room', 'roomNumber block')
      .populate('loggedBy', 'name');

    // Send notification to parents
    const Parent = (await import('../models/Parent.model.js')).default;
    const populatedStudent = await Student.findById(student._id).populate('parents');
    
    if (populatedStudent && populatedStudent.parents && populatedStudent.parents.length > 0) {
      for (const parentRef of populatedStudent.parents) {
        const parent = await Parent.findById(parentRef._id || parentRef).populate('user');
        if (parent && parent.user) {
          await createNotification(
            {
              title: 'Visitor Checked In',
              message: `${visitorName} (${relation || 'Visitor'}) has checked in to visit ${populatedStudent.name} (${populatedStudent.studentId || populatedStudent.admissionNumber}). Room: ${populatedLog.room?.roomNumber || 'N/A'}`,
              type: 'general',
              recipient: parent.user._id,
              recipientRole: 'parent',
              relatedEntity: {
                entityType: 'student',
                entityId: populatedStudent._id,
              },
              studentDetails: {
                name: populatedStudent.name,
                studentId: populatedStudent.studentId || populatedStudent.admissionNumber,
                admissionNumber: populatedStudent.admissionNumber || populatedStudent.studentId,
                roomNumber: populatedLog.room?.roomNumber || null,
                block: populatedLog.room?.block || null,
              },
            },
            { origin: 'staff' }
          );
        }
      }
    }

    res.status(201).json({ 
      message: 'Student visitor logged successfully', 
      visitorLog: populatedLog 
    });
  } catch (error) {
    console.error('Create student visitor log error:', error);
    res.status(500).json({ message: 'Error logging student visitor', error: error.message });
  }
};

/**
 * Checkout student visitor (mark as checked out)
 */
export const checkoutStudentVisitor = async (req, res) => {
  try {
    const staff = await Staff.findOne({ user: req.user._id });

    if (!staff) {
      return res.status(404).json({ message: 'Staff profile not found' });
    }

    const VisitorLog = (await import('../models/VisitorLog.model.js')).default;
    const visitorLog = await VisitorLog.findById(req.params.id);

    if (!visitorLog) {
      return res.status(404).json({ message: 'Visitor log not found' });
    }

    if (visitorLog.status === 'checked_out') {
      return res.status(400).json({ message: 'Visitor has already checked out' });
    }

    visitorLog.checkOut = new Date();
    visitorLog.status = 'checked_out';
    await visitorLog.save();

    const populatedLog = await VisitorLog.findById(visitorLog._id)
      .populate('student', 'name studentId admissionNumber')
      .populate('room', 'roomNumber block')
      .populate('loggedBy', 'name');

    // Send notification to parents
    const Student = (await import('../models/Student.model.js')).default;
    const Parent = (await import('../models/Parent.model.js')).default;
    const populatedStudent = await Student.findById(visitorLog.student);
    
    if (populatedStudent) {
      // Find parents associated with this student (relationship is reversed - Parent has students array)
      const parents = await Parent.find({ students: populatedStudent._id }).populate('user');
      
      if (parents && parents.length > 0) {
        for (const parent of parents) {
          if (parent && parent.user) {
            await createNotification(
              {
                title: 'Visitor Checked Out',
                message: `${visitorLog.visitorName} (${visitorLog.relation || 'Visitor'}) has checked out after visiting ${populatedStudent.name} (${populatedStudent.studentId || populatedStudent.admissionNumber}).`,
                type: 'general',
                recipient: parent.user._id,
                recipientRole: 'parent',
                relatedEntity: {
                  entityType: 'student',
                  entityId: populatedStudent._id,
                },
                studentDetails: {
                  name: populatedStudent.name,
                  studentId: populatedStudent.studentId || populatedStudent.admissionNumber,
                  admissionNumber: populatedStudent.admissionNumber || populatedStudent.studentId,
                  roomNumber: populatedLog.room?.roomNumber || null,
                  block: populatedLog.room?.block || null,
                },
              },
              { origin: 'staff' }
            );
          }
        }
      }
    }

    res.json({ 
      message: 'Visitor checked out successfully', 
      visitorLog: populatedLog 
    });
  } catch (error) {
    console.error('Checkout student visitor error:', error);
    res.status(500).json({ message: 'Error checking out visitor', error: error.message });
  }
};

/**
 * Get all student visitor logs (for staff to view all student visitors)
 */
export const getStudentVisitorLogs = async (req, res) => {
  try {
    const VisitorLog = (await import('../models/VisitorLog.model.js')).default;
    const { studentId, status, startDate, endDate } = req.query;
    
    const query = {};

    if (studentId) {
      const student = await Student.findOne({ 
        $or: [
          { studentId: studentId.trim() },
          { admissionNumber: studentId.trim() }
        ]
      });
      if (student) {
        query.student = student._id;
      }
    }

    if (status) query.status = status;
    
    if (startDate || endDate) {
      query.checkIn = {};
      if (startDate) query.checkIn.$gte = new Date(startDate);
      if (endDate) query.checkIn.$lte = new Date(endDate);
    }

    const visitorLogs = await VisitorLog.find(query)
      .populate('student', 'name studentId admissionNumber')
      .populate('room', 'roomNumber block')
      .populate('loggedBy', 'name')
      .sort({ checkIn: -1 })
      .limit(100);

    res.json(visitorLogs);
  } catch (error) {
    console.error('Get student visitor logs error:', error);
    res.status(500).json({ message: 'Error fetching student visitor logs', error: error.message });
  }
};

/**
 * Get visitor logs (for backward compatibility - returns vendor logs)
 * Returns one entry per vendor visit (entries with inTime)
 */
export const getVisitorLogs = async (req, res) => {
  try {
    // Return vendor logs instead of visitor logs
    const VendorLog = (await import('../models/VendorLog.model.js')).default;
    const { direction, startDate, endDate } = req.query;
    const query = { inTime: { $exists: true } }; // Only entries that have inTime (actual visits)

    if (direction === 'IN') {
      query.outTime = null; // Only entries that haven't checked out
    } else if (direction === 'OUT') {
      query.outTime = { $exists: true, $ne: null }; // Only entries that have checked out
    }

    if (startDate || endDate) {
      query.inTime = query.inTime || {};
      if (startDate) query.inTime.$gte = new Date(startDate);
      if (endDate) query.inTime.$lte = new Date(endDate);
    }

    const vendorLogs = await VendorLog.find(query)
      .populate('loggedBy', 'name')
      .sort({ inTime: -1 })
      .limit(100);

    // Transform to match expected format with IN and OUT times
    const transformedLogs = vendorLogs.map(log => ({
      _id: log._id,
      name: log.vendorName,
      vendorName: log.vendorName,
      visitorName: log.vendorName,
      type: log.type,
      purpose: log.type.toLowerCase(),
      direction: log.outTime ? 'OUT' : 'IN',
      inTime: log.inTime,
      outTime: log.outTime,
      status: log.outTime ? 'checked_out' : 'checked_in',
      checkIn: log.inTime || log.createdAt,
      createdAt: log.createdAt,
      remarks: log.remarks || log.purpose,
      loggedBy: log.loggedBy,
    }));

    res.json(transformedLogs);
  } catch (error) {
    console.error('Get visitor logs error:', error);
    res.status(500).json({ message: 'Error fetching visitor logs', error: error.message });
  }
};

/**
 * Checkout visitor
 */
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

/**
 * Get meal suggestions
 */
export const getMealSuggestions = async (req, res) => {
  try {
    const { mealSlot, status } = req.query;
    const MealSuggestion = (await import('../models/MealSuggestion.model.js')).default;

    const query = {};
    if (mealSlot) query.mealSlot = mealSlot.toLowerCase();
    if (status) query.status = status;

    const suggestions = await MealSuggestion.find(query)
      .populate('student', 'name studentId course batchYear')
      .populate('reviewedBy', 'name')
      .sort({ createdAt: -1 })
      .limit(100);

    res.json(suggestions);
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

    const query = { status: { $in: ['pending', 'reviewed'] } };
    if (mealSlot) query.mealSlot = mealSlot.toLowerCase();

    const suggestions = await MealSuggestion.find(query);

    // Aggregate suggestions by text (case-insensitive, normalized)
    const suggestionMap = new Map();

    suggestions.forEach((suggestion) => {
      const normalizedText = suggestion.suggestion.trim().toLowerCase();
      if (suggestionMap.has(normalizedText)) {
        const existing = suggestionMap.get(normalizedText);
        existing.count += 1;
        existing.students.push({
          name: suggestion.studentIdentity?.name || 'Unknown',
          studentId: suggestion.studentIdentity?.admissionNumber || suggestion.studentIdentity?.studentId || 'N/A',
        });
      } else {
        suggestionMap.set(normalizedText, {
          suggestion: suggestion.suggestion.trim(),
          mealSlot: suggestion.mealSlot,
          count: 1,
          students: [{
            name: suggestion.studentIdentity?.name || 'Unknown',
            studentId: suggestion.studentIdentity?.admissionNumber || suggestion.studentIdentity?.studentId || 'N/A',
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
    const { status, reviewNotes } = req.body;
    const { id } = req.params;

    if (!status || !['pending', 'reviewed', 'implemented', 'rejected'].includes(status)) {
      return res.status(400).json({ message: 'Valid status is required' });
    }

    const MealSuggestion = (await import('../models/MealSuggestion.model.js')).default;

    const suggestion = await MealSuggestion.findById(id);

    if (!suggestion) {
      return res.status(404).json({ message: 'Meal suggestion not found' });
    }

    suggestion.status = status;
    if (reviewNotes) suggestion.reviewNotes = reviewNotes.trim();
    suggestion.reviewedBy = req.user._id;
    suggestion.reviewedAt = new Date();

    await suggestion.save();

    res.json({ message: 'Meal suggestion status updated successfully', suggestion });
  } catch (error) {
    console.error('Update meal suggestion status error:', error);
    res.status(500).json({ message: 'Error updating meal suggestion status', error: error.message });
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
            { recipientRole: 'staff' },
          ],
        },
        // Exclude student-specific notifications (approvals, rejections, etc.)
        {
          $or: [
            { recipientRole: 'staff' },
            { recipient: req.user._id },
          ],
        },
        // Exclude notifications with student-specific titles that shouldn't be shown to staff
        {
          $nor: [
            { title: { $regex: /outpass request approved|outing request approved|outing request rejected/i } },
            { message: { $regex: /^Your outpass request|^Your outing request|your outpass request.*approved|your outing request.*approved|please check your dashboard for the qr code/i } },
          ],
        },
      ],
    };

    if (isRead !== undefined) query.isRead = isRead === 'true';

    const notifications = await Notification.find(query)
      .sort({ sentAt: -1 })
      .limit(50);

    // Enrich outing notifications with student details if missing (ensures staff see requester info)
    const notificationsWithDetails = await Promise.all(
      notifications.map(async (notificationDoc) => {
        const notification = notificationDoc.toObject ? notificationDoc.toObject() : notificationDoc;

        if (
          !notification.studentDetails &&
          notification.relatedEntity?.entityType === 'outing' &&
          notification.relatedEntity?.entityId
        ) {
          try {
            const OutingRequest = (await import('../models/OutingRequest.model.js')).default;
            const outing = await OutingRequest.findById(notification.relatedEntity.entityId).populate({
              path: 'student',
              select: 'name studentId course batchYear room',
              populate: { path: 'room', select: 'roomNumber block' },
            });
            if (outing?.student) {
              notification.studentDetails = {
                name: outing.student.name,
                studentId: outing.student.studentId,
                admissionNumber: outing.student.studentId,
                course: outing.student.course || null,
                batchYear: outing.student.batchYear || null,
                roomNumber: outing.student.room?.roomNumber || null,
                block: outing.student.room?.block || null,
              };
            }
          } catch (err) {
            console.error('Error enriching outing notification with student details:', err);
          }
        }
        return notification;
      })
    );

    // Additional filtering to exclude student-specific notifications that shouldn't be shown to staff
    const filteredNotifications = notificationsWithDetails.filter(notification => {
      // Exclude notifications with recipientRole 'student' that aren't directly sent to this staff member
      if (notification.recipientRole === 'student' && 
          notification.recipient?.toString() !== req.user._id.toString()) {
        return false;
      }
      
      // Exclude notifications with student-specific titles (approvals, rejections)
      const studentSpecificTitles = [
        /outpass request approved/i,
        /outing request approved/i,
        /outing request rejected/i,
        /outpass.*approved/i,
      ];
      
      if (studentSpecificTitles.some(pattern => pattern.test(notification.title))) {
        return false;
      }
      
      // Exclude notifications with student-specific messages (approvals, rejections)
      const studentSpecificPatterns = [
        /^Your outpass request/i,
        /^Your outing request/i,
        /your outpass request.*approved/i,
        /your outing request.*approved/i,
        /your outing request.*rejected/i,
        /outpass request.*approved/i,
        /outing request.*approved/i,
        /outing request.*rejected/i,
        /please check your dashboard for the qr code/i,
      ];
      
      if (studentSpecificPatterns.some(pattern => pattern.test(notification.message))) {
        return false;
      }
      
      return true;
    });

    // Populate student details from related entities if not already present
    const Student = (await import('../models/Student.model.js')).default;
    const Payment = (await import('../models/Payment.model.js')).default;
    const Complaint = (await import('../models/Complaint.model.js')).default;
    const RoomChangeRequest = (await import('../models/RoomChangeRequest.model.js')).default;

    const enrichedNotifications = await Promise.all(
      filteredNotifications.map(async (notification) => {
        // If student details already exist, return as is
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
                // Also get room info from complaint
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
          } catch (populateError) {
            console.error('Error populating student details for notification:', populateError);
            // Continue without student details if population fails
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
 * Mark student attendance
 */
export const markStudentAttendance = async (req, res) => {
  try {
    const { studentId, date, status, checkIn, checkOut, remarks } = req.body;

    const attendanceDate = date || new Date();

    // Check if student is away from hostel
    const OutingRequest = (await import('../models/OutingRequest.model.js')).default;
    const activeOuting = await OutingRequest.findOne({
      student: studentId,
      status: 'approved',
      exitTime: { $exists: true },
      returnTime: null,
    });

    if (activeOuting) {
      const exitDate = new Date(activeOuting.exitTime);
      const today = new Date(attendanceDate);
      const daysAway = Math.floor((today - exitDate) / (1000 * 60 * 60 * 24));
      
      return res.status(400).json({
        message: `Cannot mark attendance. Student left the hostel on ${exitDate.toLocaleDateString('en-IN')} and has not returned yet.`,
        daysAway,
        exitDate: exitDate.toISOString(),
        expectedReturnDate: activeOuting.expectedReturnDate ? activeOuting.expectedReturnDate.toISOString() : null,
      });
    }

    // Check if attendance already exists
    let attendance = await Attendance.findOne({
      student: studentId,
      date: new Date(attendanceDate).toISOString().split('T')[0],
    });

    if (attendance) {
      // Update existing
      attendance.status = status || attendance.status;
      attendance.checkIn = checkIn || attendance.checkIn;
      attendance.checkOut = checkOut || attendance.checkOut;
      attendance.remarks = remarks || attendance.remarks;
      attendance.markedBy = req.user._id;
      await attendance.save();
    } else {
      // Create new
      attendance = await Attendance.create({
        student: studentId,
        type: 'student',
        date: attendanceDate,
        status: status || 'present',
        checkIn: checkIn || new Date(),
        checkOut,
        remarks,
        markedBy: req.user._id,
      });
    }

    const populatedAttendance = await Attendance.findById(attendance._id)
      .populate('student', 'name studentId')
      .populate('markedBy', 'name');

    res.json({ message: 'Student attendance marked successfully', attendance: populatedAttendance });
  } catch (error) {
    console.error('Mark student attendance error:', error);
    res.status(500).json({ message: 'Error marking student attendance', error: error.message });
  }
};

/**
 * Get all students for attendance marking
 */
export const getStudents = async (req, res) => {
  try {
    const { search } = req.query;
    const query = { status: 'active' };

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { studentId: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    const students = await Student.find(query)
      .populate('room', 'roomNumber floor building')
      .select('name studentId email phone room')
      .sort({ name: 1 });

    res.json(students);
  } catch (error) {
    console.error('Get students error:', error);
    res.status(500).json({ message: 'Error fetching students', error: error.message });
  }
};

/**
 * Get staff dashboard stats
 */
export const getDashboardStats = async (req, res) => {
  try {
    const staff = await Staff.findOne({ user: req.user._id });

    if (!staff) {
      return res.status(404).json({ message: 'Staff profile not found' });
    }

    // Get assigned complaints
    const assignedComplaints = await Complaint.find({ assignedTo: staff._id });
    const activeAssignments = assignedComplaints.filter(c => 
      c.status === 'requested'
    ).length;
    const newAssignments = assignedComplaints.filter(c => {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      return c.createdAt >= sevenDaysAgo && c.status === 'requested';
    }).length;

    // Get check-ins today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const checkInsToday = await Attendance.countDocuments({
      markedBy: req.user._id,
      date: { $gte: today, $lt: tomorrow },
      type: 'student'
    });
    
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const checkInsYesterday = await Attendance.countDocuments({
      markedBy: req.user._id,
      date: { $gte: yesterday, $lt: today },
      type: 'student'
    });
    
    const checkInChange = checkInsYesterday > 0
      ? (((checkInsToday - checkInsYesterday) / checkInsYesterday) * 100).toFixed(1)
      : checkInsToday > 0 ? '100' : '0';

    // Get pending requests (complaints + visitor checkouts)
    const pendingComplaints = assignedComplaints.filter(c => c.status === 'requested').length;
    const urgentComplaints = assignedComplaints.filter(c => 
      c.status === 'requested' && (c.priority === 'high' || c.priority === 'urgent')
    ).length;

    // Get room inspections this week
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const inspectionsThisWeek = await Complaint.countDocuments({
      assignedTo: staff._id,
      type: 'inspection',
      createdAt: { $gte: weekAgo }
    });
    
    const totalInspections = await Complaint.countDocuments({
      assignedTo: staff._id,
      type: 'inspection',
      createdAt: { $gte: weekAgo }
    });
    const completedInspections = await Complaint.countDocuments({
      assignedTo: staff._id,
      type: 'inspection',
      status: 'resolved',
      createdAt: { $gte: weekAgo }
    });
    const inspectionProgress = totalInspections > 0
      ? Math.round((completedInspections / totalInspections) * 100)
      : 0;

    // Get recent activities
    const recentComplaints = await Complaint.find({ assignedTo: staff._id })
      .populate('student', 'name studentId')
      .populate('room', 'roomNumber')
      .sort({ createdAt: -1 })
      .limit(5);

    const recentAttendance = await Attendance.find({
      markedBy: req.user._id
    })
      .populate('student', 'name studentId')
      .sort({ date: -1 })
      .limit(5);

    const recentVisitors = await VisitorLog.find({
      loggedBy: req.user._id
    })
      .populate('student', 'name studentId')
      .populate('room', 'roomNumber')
      .sort({ checkIn: -1 })
      .limit(5);

    // Combine and format recent activities
    const recentActivities = [
      ...recentComplaints.map(c => ({
        id: c._id,
        type: c.type === 'inspection' ? 'Inspection' : 'Complaint',
        student: c.student?.name,
        room: c.room?.roomNumber,
        description: c.title || c.description,
        time: c.createdAt,
        status: c.status
      })),
      ...recentAttendance.map(a => ({
        id: a._id,
        type: 'Check-in',
        student: a.student?.name,
        room: a.student?.room?.roomNumber,
        description: `Marked ${a.status}`,
        time: a.date,
        status: 'completed'
      })),
      ...recentVisitors.map(v => ({
        id: v._id,
        type: v.status === 'checked_out' ? 'Check-out' : 'Check-in',
        student: v.student?.name,
        room: v.room?.roomNumber,
        description: `Visitor: ${v.visitorName}`,
        time: v.checkIn,
        status: v.status === 'checked_out' ? 'completed' : 'pending'
      }))
    ]
      .sort((a, b) => new Date(b.time) - new Date(a.time))
      .slice(0, 5)
      .map(activity => ({
        ...activity,
        time: getTimeAgo(activity.time)
      }));

    // Get today's schedule (assigned complaints and duties)
    // Reuse the 'today' variable already declared above
    const todayScheduleStart = new Date(today);
    const todayScheduleEnd = new Date(tomorrow);
    
    const todayComplaints = await Complaint.find({
      assignedTo: staff._id,
      status: 'requested',
      createdAt: { $gte: todayScheduleStart, $lt: todayScheduleEnd }
    })
      .populate('student', 'name studentId')
      .populate('room', 'roomNumber block')
      .sort({ priority: -1, createdAt: -1 })
      .limit(10);

    // Get attendance data for this week (for chart)
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - weekStart.getDay()); // Start of week (Sunday)
    weekStart.setHours(0, 0, 0, 0);
    
    const weekAttendance = [];
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    
    for (let i = 0; i < 7; i++) {
      const dayStart = new Date(weekStart);
      dayStart.setDate(dayStart.getDate() + i);
      const dayEnd = new Date(dayStart);
      dayEnd.setDate(dayEnd.getDate() + 1);
      
      const count = await Attendance.countDocuments({
        markedBy: req.user._id,
        date: { $gte: dayStart, $lt: dayEnd },
        type: 'student'
      });
      
      weekAttendance.push({
        day: dayNames[i],
        count
      });
    }

    // Get complaint resolution stats
    const allAssignedComplaints = await Complaint.find({ assignedTo: staff._id });
    const complaintStats = {
      pending: allAssignedComplaints.filter(c => c.status === 'pending' || c.status === 'requested').length,
      resolved: allAssignedComplaints.filter(c => c.status === 'resolved').length,
      total: allAssignedComplaints.length
    };

    // Get alerts (urgent complaints and low inventory)
    const alerts = [];
    const urgentPendingComplaints = assignedComplaints.filter(c => 
      c.status === 'requested' && (c.priority === 'high' || c.priority === 'urgent')
    );
    
    urgentPendingComplaints.forEach(complaint => {
      alerts.push({
        title: `Complaint ${complaint.title || complaint._id.toString().substring(0, 8)} is waiting for acknowledgement`,
        severity: 'warning',
        type: 'complaint',
        id: complaint._id
      });
    });

    // Get inventory alerts (low stock items)
    const lowStockItems = await Inventory.find({
      quantity: { $lte: 20 }, // Assuming 20 is low stock threshold
      status: 'active'
    }).limit(5);
    
    lowStockItems.forEach(item => {
      alerts.push({
        title: `Inventory alert: ${item.name} stock below 20%`,
        severity: 'error',
        type: 'inventory',
        id: item._id
      });
    });

    // Get attendance checklist (check if attendance was marked today)
    const todayAttendanceMarked = await Attendance.countDocuments({
      markedBy: req.user._id,
      date: { $gte: today, $lt: tomorrow },
      type: 'student'
    }) > 0;

    const morningRoundTime = new Date();
    morningRoundTime.setHours(6, 30, 0, 0);
    const morningRoundDone = todayAttendanceMarked && new Date() >= morningRoundTime;

    const middayTime = new Date();
    middayTime.setHours(12, 0, 0, 0);
    const middayDone = false; // Can be enhanced with mess inspection tracking

    const nightTime = new Date();
    nightTime.setHours(19, 30, 0, 0);
    const nightScheduled = new Date() < nightTime;

    // Calculate attendance streak (consecutive days with attendance marked)
    let attendanceStreak = 0;
    let checkDate = new Date(today);
    while (true) {
      const dayStart = new Date(checkDate);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(dayStart);
      dayEnd.setDate(dayEnd.getDate() + 1);
      
      const hasAttendance = await Attendance.countDocuments({
        markedBy: req.user._id,
        date: { $gte: dayStart, $lt: dayEnd },
        type: 'student'
      }) > 0;
      
      if (hasAttendance) {
        attendanceStreak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }

    // Get meal services count (can be enhanced with actual meal plan data)
    const mealServicesCount = 3; // Placeholder - can be enhanced

    res.json({
      stats: {
        myAssignments: activeAssignments,
        newAssignments,
        checkInsToday,
        checkInChange: parseFloat(checkInChange),
        pendingRequests: pendingComplaints,
        urgentRequests: urgentComplaints,
        roomInspections: inspectionsThisWeek,
        inspectionProgress,
        attendanceStreak,
        mealServicesCount
      },
      todaySchedule: todayComplaints.map(c => ({
        time: new Date(c.createdAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }),
        duty: c.title || c.description?.substring(0, 50) || 'Complaint',
        location: c.room?.roomNumber ? `Room ${c.room.roomNumber}${c.room.block ? ` (Block ${c.room.block})` : ''}` : 'N/A',
        priority: c.priority,
        student: c.student?.name
      })),
      alerts: alerts.slice(0, 5), // Limit to 5 most recent
      attendanceChart: {
        days: weekAttendance.map(w => w.day),
        onDuty: weekAttendance.map(w => w.count)
      },
      complaintChart: {
        stages: ['Pending', 'Resolved'],
        values: [complaintStats.pending, complaintStats.resolved]
      },
      attendanceChecklist: [
        { task: 'Morning round completed', done: morningRoundDone },
        { task: 'Mid-day mess inspection pending', done: middayDone },
        { task: 'Night roll call scheduled', done: nightScheduled }
      ],
      recentActivities
    });
  } catch (error) {
    console.error('Get staff dashboard stats error:', error);
    res.status(500).json({ message: 'Error fetching dashboard stats', error: error.message });
  }
};

/**
 * Get activities
 */
export const getActivities = async (req, res) => {
  try {
    const { status, category } = req.query;
    const query = {};

    if (status) query.status = status;
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

// ==================== INVENTORY REQUESTS MANAGEMENT ====================

/**
 * Get all pending inventory requests
 */
export const getInventoryRequests = async (req, res) => {
  try {
    const { status } = req.query;
    const query = {};
    
    // If a specific status is provided, filter by it; otherwise, return ALL requests
    if (status) {
      query.status = status;
    }

    const requests = await InventoryRequest.find(query)
      .populate('student', 'name studentId email phone room')
      .populate('student.room', 'roomNumber block building')
      .populate('inventoryItem', 'name category quantity unit status location')
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
 * Approve inventory request
 */
export const approveInventoryRequest = async (req, res) => {
  try {
    const { id } = req.params;

    const staff = await Staff.findOne({ user: req.user._id });
    if (!staff) {
      return res.status(404).json({ message: 'Staff profile not found' });
    }

    const request = await InventoryRequest.findById(id)
      .populate({
        path: 'student',
        select: 'name studentId email room user',
        populate: {
          path: 'room',
          select: 'roomNumber block building'
        }
      })
      .populate('inventoryItem');

    if (!request) {
      return res.status(404).json({ message: 'Inventory request not found' });
    }

    if (request.status !== 'pending') {
      return res.status(400).json({ message: `Request is already ${request.status}` });
    }

    // Check inventory availability
    if (request.inventoryItem.quantity < request.quantity) {
      return res.status(400).json({ 
        message: `Insufficient inventory. Available: ${request.inventoryItem.quantity}, Requested: ${request.quantity}` 
      });
    }

    // Update request status
    request.status = 'approved';
    request.reviewedBy = staff._id;
    request.reviewedAt = new Date();
    await request.save();

    // Send notification to student
    if (request.student.user) {
      await createNotification(
        {
          title: 'Inventory Request Approved',
          message: `Your request for ${request.quantity} ${request.inventoryItem.unit}(s) of ${request.itemName} has been approved. Please collect from General Store.`,
          type: 'inventory',
          recipient: request.student.user._id,
          relatedEntity: {
            entityType: 'inventoryRequest',
            entityId: request._id,
          },
        },
        { origin: 'staff' }
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
          title: 'Child Inventory Request Approved',
          message: `Your child ${request.student.name} (${request.student.studentId})'s request for ${request.quantity} ${request.inventoryItem.unit}(s) of ${request.itemName} has been approved by ${staff.name}.`,
          type: 'inventory',
          recipient: parent.user._id,
          recipientRole: 'parent',
          relatedEntity: {
            entityType: 'inventoryRequest',
            entityId: request._id,
          },
        },
        { origin: 'staff' }
      );
    }

    res.json({ 
      message: 'Inventory request approved successfully',
      request 
    });
  } catch (error) {
    console.error('Approve inventory request error:', error);
    res.status(500).json({ message: 'Error approving inventory request', error: error.message });
  }
};

/**
 * Reject inventory request
 */
export const rejectInventoryRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const { rejectionReason } = req.body;

    if (!rejectionReason || !rejectionReason.trim()) {
      return res.status(400).json({ message: 'Rejection reason is required' });
    }

    const staff = await Staff.findOne({ user: req.user._id });
    if (!staff) {
      return res.status(404).json({ message: 'Staff profile not found' });
    }

    const request = await InventoryRequest.findById(id)
      .populate('student', 'name studentId email user')
      .populate('inventoryItem');

    if (!request) {
      return res.status(404).json({ message: 'Inventory request not found' });
    }

    if (request.status !== 'pending') {
      return res.status(400).json({ message: `Request is already ${request.status}` });
    }

    // Update request status
    request.status = 'rejected';
    request.reviewedBy = staff._id;
    request.reviewedAt = new Date();
    request.rejectionReason = rejectionReason.trim();
    await request.save();

    // Send notification to student
    if (request.student.user) {
      const unit = request.inventoryItem?.unit || 'piece';
      await createNotification(
        {
          title: 'Inventory Request Rejected',
          message: `Your request for ${request.quantity} ${unit}(s) of ${request.itemName} has been rejected. Reason: ${rejectionReason}`,
          type: 'inventory',
          recipient: request.student.user._id,
          relatedEntity: {
            entityType: 'inventoryRequest',
            entityId: request._id,
          },
        },
        { origin: 'staff' }
      );
    }

    res.json({ 
      message: 'Inventory request rejected successfully',
      request 
    });
  } catch (error) {
    console.error('Reject inventory request error:', error);
    res.status(500).json({ message: 'Error rejecting inventory request', error: error.message });
  }
};

/**
 * Issue inventory item to student
 */
export const issueInventoryItem = async (req, res) => {
  try {
    const { id } = req.params;

    const staff = await Staff.findOne({ user: req.user._id });
    if (!staff) {
      return res.status(404).json({ message: 'Staff profile not found' });
    }

    const request = await InventoryRequest.findById(id)
      .populate({
        path: 'student',
        select: 'name studentId email room user',
        populate: {
          path: 'room',
          select: 'roomNumber block building'
        }
      })
      .populate('inventoryItem');

    if (!request) {
      return res.status(404).json({ message: 'Inventory request not found' });
    }

    if (request.status !== 'approved') {
      return res.status(400).json({ message: `Request must be approved before issuing. Current status: ${request.status}` });
    }

    // Check inventory availability again
    if (request.inventoryItem.quantity < request.quantity) {
      return res.status(400).json({ 
        message: `Insufficient inventory. Available: ${request.inventoryItem.quantity}, Requested: ${request.quantity}` 
      });
    }

    // Update inventory
    const inventoryItem = await Inventory.findById(request.inventoryItem._id);
    
    // Reduce quantity (items are issued from General Store)
    inventoryItem.quantity -= request.quantity;
    
    // Location stays as "General Store" - it represents where bulk inventory is stored
    // Individual issued items are tracked via the InventoryRequest
    
    // Update status if all items are issued
    if (inventoryItem.quantity === 0) {
      inventoryItem.status = request.itemType === 'permanent' ? 'in_use' : 'issued';
    } else {
      // If some items remain, status depends on remaining items
      // Keep as available if items remain in General Store
      inventoryItem.status = 'available';
    }
    
    await inventoryItem.save();

    // Update request status
    request.status = 'issued';
    request.issuedBy = staff._id;
    request.issuedAt = new Date();
    await request.save();

    // Get room location for notification
    const roomLocation = request.student.room 
      ? `Room ${request.student.room.roomNumber}${request.student.room.block ? `, Block ${request.student.room.block}` : ''}`
      : 'Your Room';
    
    // Send notification to student
    if (request.student.user) {
      const unit = request.inventoryItem?.unit || 'piece';
      await createNotification(
        {
          title: 'Inventory Item Issued',
          message: `${request.quantity} ${unit}(s) of ${request.itemName} has been issued to you. Location: ${roomLocation}`,
          type: 'inventory',
          recipient: request.student.user._id,
          relatedEntity: {
            entityType: 'inventoryRequest',
            entityId: request._id,
          },
        },
        { origin: 'staff' }
      );
    }

    const populatedRequest = await InventoryRequest.findById(request._id)
      .populate('student', 'name studentId room')
      .populate('student.room', 'roomNumber block')
      .populate('inventoryItem', 'name category quantity unit status location')
      .populate('issuedBy', 'name staffId');

    res.json({ 
      message: 'Inventory item issued successfully',
      request: populatedRequest
    });
  } catch (error) {
    console.error('Issue inventory item error:', error);
    res.status(500).json({ message: 'Error issuing inventory item', error: error.message });
  }
};

/**
 * Confirm return of temporary inventory item
 */
export const returnInventoryItem = async (req, res) => {
  try {
    const { id } = req.params;
    const { returnNotes } = req.body;

    const staff = await Staff.findOne({ user: req.user._id });
    if (!staff) {
      return res.status(404).json({ message: 'Staff profile not found' });
    }

    const request = await InventoryRequest.findById(id)
      .populate({
        path: 'student',
        select: 'name studentId email room user',
        populate: {
          path: 'room',
          select: 'roomNumber block building'
        }
      })
      .populate('inventoryItem');

    if (!request) {
      return res.status(404).json({ message: 'Inventory request not found' });
    }

    if (request.status !== 'issued') {
      return res.status(400).json({ message: `Only issued items can be returned. Current status: ${request.status}` });
    }

    if (request.itemType === 'permanent') {
      return res.status(400).json({ message: 'Permanent items (like beds) cannot be returned' });
    }

    // Restore inventory quantity
    const inventoryItem = await Inventory.findById(request.inventoryItem._id);
    inventoryItem.quantity += request.quantity;
    inventoryItem.location = 'General Store';
    inventoryItem.status = 'available';
    await inventoryItem.save();

    // Update request status
    request.status = 'returned';
    request.returnedBy = staff._id;
    request.returnedAt = new Date();
    request.returnNotes = returnNotes || '';
    await request.save();

    // Send notification to student
    if (request.student.user) {
      const unit = request.inventoryItem?.unit || 'piece';
      await createNotification(
        {
          title: 'Inventory Item Returned',
          message: `Return of ${request.quantity} ${unit}(s) of ${request.itemName} has been confirmed.`,
          type: 'inventory',
          recipient: request.student.user._id,
          relatedEntity: {
            entityType: 'inventoryRequest',
            entityId: request._id,
          },
        },
        { origin: 'staff' }
      );
    }

    const populatedRequest = await InventoryRequest.findById(request._id)
      .populate('student', 'name studentId room')
      .populate('student.room', 'roomNumber block')
      .populate('inventoryItem', 'name category quantity unit status location')
      .populate('returnedBy', 'name staffId');

    res.json({ 
      message: 'Inventory item return confirmed successfully',
      request: populatedRequest
    });
  } catch (error) {
    console.error('Return inventory item error:', error);
    res.status(500).json({ message: 'Error confirming inventory return', error: error.message });
  }
};

// ==================== CLEANING REQUESTS MANAGEMENT ====================

/**
 * Get assigned cleaning requests
 */
export const getAssignedCleaningRequests = async (req, res) => {
  try {
    const staff = await Staff.findOne({ user: req.user._id });

    if (!staff) {
      return res.status(404).json({ message: 'Staff profile not found' });
    }

    const { status } = req.query;
    const query = { assignedTo: staff._id };

    if (status) {
      query.status = status;
    } else {
      // Default to pending and assigned
      query.status = { $in: ['assigned'] };
    }

    const requests = await CleaningRequest.find(query)
      .populate('student', 'name studentId email phone room')
      .populate('student.room', 'roomNumber block building')
      .populate('room', 'roomNumber block building')
      .sort({ scheduledDate: 1, urgency: -1 });

    res.json(requests);
  } catch (error) {
    console.error('Get assigned cleaning requests error:', error);
    res.status(500).json({ message: 'Error fetching assigned cleaning requests', error: error.message });
  }
};

/**
 * Complete cleaning request
 */
export const completeCleaningRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const { completionNotes } = req.body;

    const staff = await Staff.findOne({ user: req.user._id });

    if (!staff) {
      return res.status(404).json({ message: 'Staff profile not found' });
    }

    const request = await CleaningRequest.findById(id)
      .populate('student', 'name studentId email user')
      .populate('room', 'roomNumber block');

    if (!request) {
      return res.status(404).json({ message: 'Cleaning request not found' });
    }

    if (request.assignedTo.toString() !== staff._id.toString()) {
      return res.status(403).json({ message: 'You are not assigned to this cleaning request' });
    }

    if (request.status !== 'assigned') {
      return res.status(400).json({ message: `Request is ${request.status}. Only assigned requests can be completed.` });
    }

    // Update request
    request.status = 'completed';
    request.completedBy = staff._id;
    request.completedAt = new Date();
    request.completionNotes = completionNotes || '';
    await request.save();

    // Send notification to student
    if (request.student.user) {
      await createNotification(
        {
          title: 'Cleaning Request Completed',
          message: `Your ${request.requestType.replace(/_/g, ' ')} request has been completed by ${staff.name}.${completionNotes ? ` Notes: ${completionNotes}` : ''}`,
          type: 'cleaning',
          recipient: request.student.user._id,
          relatedEntity: {
            entityType: 'cleaningRequest',
            entityId: request._id,
          },
        },
        { origin: 'staff' }
      );
    }

    const populatedRequest = await CleaningRequest.findById(request._id)
      .populate('student', 'name studentId room')
      .populate('room', 'roomNumber block')
      .populate('assignedTo', 'name staffId')
      .populate('completedBy', 'name staffId');

    res.json({ 
      message: 'Cleaning request marked as completed successfully',
      request: populatedRequest
    });
  } catch (error) {
    console.error('Complete cleaning request error:', error);
    res.status(500).json({ message: 'Error completing cleaning request', error: error.message });
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

// Helper function to format time ago
function getTimeAgo(date) {
  const now = new Date();
  const diff = now - new Date(date);
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
  if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
  return 'Just now';
}

