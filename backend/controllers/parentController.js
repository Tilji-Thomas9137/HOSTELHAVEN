import Parent from '../models/Parent.model.js';
import User from '../models/User.model.js';
import Student from '../models/Student.model.js';
import Fee from '../models/Fee.model.js';
import Payment from '../models/Payment.model.js';
import Attendance from '../models/Attendance.model.js';
import Complaint from '../models/Complaint.model.js';
import OutingRequest from '../models/OutingRequest.model.js';
import Notification from '../models/Notification.model.js';
import Activity from '../models/Activity.model.js';
import Wallet from '../models/Wallet.model.js';
import RoomChangeRequest from '../models/RoomChangeRequest.model.js';
import { generateFeeReport, generateAttendanceReport, generateComplaintReport } from '../utils/reportGenerator.js';

/**
 * Get parent profile
 */
export const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const parent = await Parent.findOne({ user: req.user._id }).populate('students', 'name studentId email phone room status');

    if (!parent) {
      return res.status(404).json({ message: 'Parent profile not found' });
    }

    // Populate room details for students
    const studentsWithRooms = await Student.find({ _id: { $in: parent.students } })
      .populate('room', 'roomNumber floor building capacity');

    res.json({
      user,
      parent: {
        ...parent.toObject(),
        students: studentsWithRooms,
      },
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ message: 'Error fetching profile', error: error.message });
  }
};

/**
 * Update parent profile
 */
export const updateProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const parent = await Parent.findOne({ user: req.user._id });

    if (!parent) {
      return res.status(404).json({ message: 'Parent profile not found' });
    }

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

    // Update parent (exclude profilePhoto from parent update as it's stored in User)
    const parentUpdateData = { ...req.body };
    delete parentUpdateData.profilePhoto;
    delete parentUpdateData.name;
    delete parentUpdateData.phone;

    const updatedParent = await Parent.findByIdAndUpdate(parent._id, parentUpdateData, {
      new: true,
      runValidators: true,
    }).populate('students', 'name studentId email');

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
      parent: updatedParent
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
 * Get children details
 */
export const getChildren = async (req, res) => {
  try {
    const parent = await Parent.findOne({ user: req.user._id });

    if (!parent) {
      return res.status(404).json({ message: 'Parent profile not found' });
    }

    const children = await Student.find({ _id: { $in: parent.students } })
      .populate('room', 'roomNumber floor building capacity amenities rent status')
      .sort({ name: 1 });

    res.json(children);
  } catch (error) {
    console.error('Get children error:', error);
    res.status(500).json({ message: 'Error fetching children', error: error.message });
  }
};

/**
 * Get child details by ID
 */
export const getChildById = async (req, res) => {
  try {
    const parent = await Parent.findOne({ user: req.user._id });

    if (!parent) {
      return res.status(404).json({ message: 'Parent profile not found' });
    }

    if (!parent.students.includes(req.params.id)) {
      return res.status(403).json({ message: 'Access denied. This student is not your child' });
    }

    const child = await Student.findById(req.params.id)
      .populate('room', 'roomNumber floor building capacity amenities rent status roomType totalPrice');

    if (!child) {
      return res.status(404).json({ message: 'Student not found' });
    }

    // Get wallet balance for this child
    let wallet = await Wallet.findOne({ student: child._id });
    const walletBalance = wallet ? wallet.balance : 0;

    // Get pending room change request for this child
    const pendingRoomChangeRequest = await RoomChangeRequest.findOne({
      student: child._id,
      status: { $in: ['pending', 'pending_payment', 'under_review'] }
    })
      .populate('currentRoom', 'roomNumber block floor roomType totalPrice')
      .populate('requestedRoom', 'roomNumber block floor roomType totalPrice');

    // Return child data with wallet and room change info
    res.json({
      ...child.toObject(),
      walletBalance,
      pendingRoomChangeRequest: pendingRoomChangeRequest ? {
        _id: pendingRoomChangeRequest._id,
        status: pendingRoomChangeRequest.status,
        currentRoom: pendingRoomChangeRequest.currentRoom,
        requestedRoom: pendingRoomChangeRequest.requestedRoom,
        priceDifference: pendingRoomChangeRequest.priceDifference,
        upgradePaymentRequired: pendingRoomChangeRequest.upgradePaymentRequired,
        downgradeWalletCredit: pendingRoomChangeRequest.downgradeWalletCredit,
        paymentStatus: pendingRoomChangeRequest.paymentStatus,
        reason: pendingRoomChangeRequest.reason,
        createdAt: pendingRoomChangeRequest.createdAt,
      } : null,
    });
  } catch (error) {
    console.error('Get child error:', error);
    res.status(500).json({ message: 'Error fetching child details', error: error.message });
  }
};

/**
 * Get fees for all children
 */
export const getFees = async (req, res) => {
  try {
    const parent = await Parent.findOne({ user: req.user._id });

    if (!parent) {
      return res.status(404).json({ message: 'Parent profile not found' });
    }

    const { status, studentId } = req.query;
    const query = { student: { $in: parent.students } };

    if (status) query.status = status;
    if (studentId) query.student = studentId;

    const fees = await Fee.find(query)
      .populate('student', 'name studentId email')
      .sort({ dueDate: -1 });

    res.json(fees);
  } catch (error) {
    console.error('Get fees error:', error);
    res.status(500).json({ message: 'Error fetching fees', error: error.message });
  }
};

/**
 * Get payment status/summary
 */
export const getPaymentStatus = async (req, res) => {
  try {
    const parent = await Parent.findOne({ user: req.user._id });

    if (!parent) {
      return res.status(404).json({ message: 'Parent profile not found' });
    }

    const { studentId } = req.query;
    const query = { student: { $in: parent.students } };
    if (studentId) query.student = studentId;

    // Get all fees
    const fees = await Fee.find(query).populate('student', 'name studentId email');

    // Calculate summary
    const summary = {
      totalDue: 0,
      totalPaid: 0,
      pendingFees: 0,
      overdueFees: 0,
      byStudent: {},
    };

    fees.forEach((fee) => {
      const studentName = fee.student.name;
      if (!summary.byStudent[studentName]) {
        summary.byStudent[studentName] = {
          studentId: fee.student.studentId,
          totalDue: 0,
          totalPaid: 0,
          pendingFees: 0,
          overdueFees: 0,
        };
      }

      summary.totalDue += fee.amount;
      summary.totalPaid += fee.paidAmount || 0;
      summary.byStudent[studentName].totalDue += fee.amount;
      summary.byStudent[studentName].totalPaid += fee.paidAmount || 0;

      if (fee.status === 'pending') {
        summary.pendingFees += 1;
        summary.byStudent[studentName].pendingFees += 1;
      }
      if (fee.status === 'overdue') {
        summary.overdueFees += 1;
        summary.byStudent[studentName].overdueFees += 1;
      }
    });

    res.json({ fees, summary });
  } catch (error) {
    console.error('Get payment status error:', error);
    res.status(500).json({ message: 'Error fetching payment status', error: error.message });
  }
};

/**
 * Get payment history
 */
export const getPaymentHistory = async (req, res) => {
  try {
    const parent = await Parent.findOne({ user: req.user._id });

    if (!parent) {
      return res.status(404).json({ message: 'Parent profile not found' });
    }

    const { studentId } = req.query;
    const query = { student: { $in: parent.students } };
    if (studentId) query.student = studentId;

    // Get all payments and filter duplicates aggressively
    const allPayments = await Payment.find(query)
      .populate('student', 'name studentId email')
      .populate('fee', 'feeType amount')
      .sort({ paymentDate: -1 });

    // Filter duplicates using the same logic as student payment history
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
 * Get attendance for children
 */
export const getAttendance = async (req, res) => {
  try {
    const parent = await Parent.findOne({ user: req.user._id });

    if (!parent) {
      return res.status(404).json({ message: 'Parent profile not found' });
    }

    const { studentId, startDate, endDate } = req.query;
    const query = {
      student: { $in: parent.students },
      type: 'student',
    };

    if (studentId) query.student = studentId;
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }

    const attendance = await Attendance.find(query)
      .populate('student', 'name studentId email')
      .populate('markedBy', 'name')
      .sort({ date: -1 });

    res.json(attendance);
  } catch (error) {
    console.error('Get attendance error:', error);
    res.status(500).json({ message: 'Error fetching attendance', error: error.message });
  }
};

/**
 * Get complaints for children
 */
export const getComplaints = async (req, res) => {
  try {
    const parent = await Parent.findOne({ user: req.user._id });

    if (!parent) {
      return res.status(404).json({ message: 'Parent profile not found' });
    }

    const { studentId, status } = req.query;
    const query = { student: { $in: parent.students } };

    if (studentId) query.student = studentId;
    if (status) query.status = status;

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

/**
 * Get outing requests for children
 */
export const getOutingRequests = async (req, res) => {
  try {
    const parent = await Parent.findOne({ user: req.user._id });

    if (!parent) {
      return res.status(404).json({ message: 'Parent profile not found' });
    }

    const { studentId, status } = req.query;
    const query = { student: { $in: parent.students } };

    if (studentId) query.student = studentId;
    if (status) query.status = status;

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

/**
 * Get visitor logs for parent's children
 */
export const getVisitorLogs = async (req, res) => {
  try {
    const parent = await Parent.findOne({ user: req.user._id }).populate('students');

    if (!parent) {
      return res.status(404).json({ message: 'Parent profile not found' });
    }

    if (!parent.students || parent.students.length === 0) {
      return res.json([]);
    }

    const { studentId, status, startDate, endDate, limit } = req.query;
    const query = { student: { $in: parent.students } };

    if (studentId) {
      const student = await Student.findById(studentId);
      if (student && parent.students.some(s => s._id.toString() === student._id.toString())) {
        query.student = student._id;
      }
    }

    if (status) query.status = status;
    
    if (startDate || endDate) {
      query.checkIn = {};
      if (startDate) query.checkIn.$gte = new Date(startDate);
      if (endDate) query.checkIn.$lte = new Date(endDate);
    }

    const VisitorLog = (await import('../models/VisitorLog.model.js')).default;
    let queryBuilder = VisitorLog.find(query)
      .populate('student', 'name studentId admissionNumber')
      .populate('room', 'roomNumber block')
      .populate('loggedBy', 'name')
      .sort({ checkIn: -1 });

    if (limit) {
      queryBuilder = queryBuilder.limit(parseInt(limit));
    }

    const visitorLogs = await queryBuilder;

    res.json(visitorLogs);
  } catch (error) {
    console.error('Get visitor logs error:', error);
    res.status(500).json({ message: 'Error fetching visitor logs', error: error.message });
  }
};

/**
 * Get notifications
 */
/**
 * Get dashboard stats for parent (consolidated data for all children)
 */
export const getDashboardStats = async (req, res) => {
  try {
    const parent = await Parent.findOne({ user: req.user._id });

    if (!parent) {
      // Return empty stats instead of 404
      return res.json({
        parent: null,
        children: [],
        stats: {
          totalFeesPaid: 0,
          totalFeesPending: 0,
          totalMessFeesPaid: 0,
          totalMessFeesPending: 0,
          attendanceSummary: { present: 0, absent: 0, total: 0 },
          latestComplaints: [],
          latestNotifications: [],
          upcomingDueDates: [],
          monthlyPaymentHistory: [],
          monthlyMessFeePaymentHistory: []
        }
      });
    }

    const children = await Student.find({ _id: { $in: parent.students } })
      .populate('room', 'roomNumber floor building')
      .populate('user');

    // Get fees summary for all children
    const fees = await Fee.find({ student: { $in: parent.students } });
    const totalFeesPaid = fees.reduce((sum, fee) => sum + (fee.paidAmount || 0), 0);
    const totalFeesPending = fees.reduce((sum, fee) => {
      const remaining = fee.amount - (fee.paidAmount || 0);
      return sum + (remaining > 0 ? remaining : 0);
    }, 0);

    // Get mess fees summary separately
    const messFees = fees.filter(fee => fee.feeType === 'mess_fee');
    const totalMessFeesPaid = messFees.reduce((sum, fee) => sum + (fee.paidAmount || 0), 0);
    const totalMessFeesPending = messFees.reduce((sum, fee) => {
      const remaining = fee.amount - (fee.paidAmount || 0);
      return sum + (remaining > 0 ? remaining : 0);
    }, 0);

    // Get monthly payment history (last 6 months) - filter duplicates
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    
    const allPayments = await Payment.find({
      student: { $in: parent.students },
      status: 'completed',
      paymentDate: { $gte: sixMonthsAgo }
    })
      .populate('fee', 'feeType amount')
      .sort({ paymentDate: 1 });

    // Filter duplicates using the same logic as payment history
    const uniquePayments = [];
    const seenPayments = new Set();
    
    for (const payment of allPayments) {
      const paymentDate = new Date(payment.paymentDate);
      const dateKey = paymentDate.toISOString().substring(0, 10); // YYYY-MM-DD
      const minuteKey = paymentDate.toISOString().substring(0, 16); // YYYY-MM-DDTHH:mm
      
      // Create keys to catch duplicates
      const feeId = payment.fee?._id?.toString() || 'no-fee';
      const key1 = `${feeId}-${payment.amount}-${payment.paymentType}-${dateKey}`;
      const key2 = `${payment.amount}-${payment.paymentType}-${dateKey}`;
      const key3 = `${payment.amount}-${payment.paymentType}-${minuteKey}`;
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

    // Separate mess fee payments from other payments
    const messFeePayments = uniquePayments.filter(payment => 
      payment.fee?.feeType === 'mess_fee' || payment.paymentType === 'mess_fee'
    );
    const otherPayments = uniquePayments.filter(payment => 
      payment.fee?.feeType !== 'mess_fee' && payment.paymentType !== 'mess_fee'
    );

    // Group other payments by month (for general fee payment history)
    const monthlyPayments = {};
    otherPayments.forEach(payment => {
      const paymentDate = new Date(payment.paymentDate);
      const monthKey = `${paymentDate.getFullYear()}-${String(paymentDate.getMonth() + 1).padStart(2, '0')}`;
      if (!monthlyPayments[monthKey]) {
        monthlyPayments[monthKey] = 0;
      }
      monthlyPayments[monthKey] += payment.amount;
    });

    // Group mess fee payments by month
    const monthlyMessFeePayments = {};
    messFeePayments.forEach(payment => {
      const paymentDate = new Date(payment.paymentDate);
      const monthKey = `${paymentDate.getFullYear()}-${String(paymentDate.getMonth() + 1).padStart(2, '0')}`;
      if (!monthlyMessFeePayments[monthKey]) {
        monthlyMessFeePayments[monthKey] = 0;
      }
      monthlyMessFeePayments[monthKey] += payment.amount;
    });

    // Generate last 6 months array with payment data
    const monthlyPaymentHistory = [];
    const monthlyMessFeePaymentHistory = [];
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    for (let i = 5; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const monthName = monthNames[date.getMonth()];
      monthlyPaymentHistory.push({
        month: monthName,
        amount: monthlyPayments[monthKey] || 0
      });
      monthlyMessFeePaymentHistory.push({
        month: monthName,
        amount: monthlyMessFeePayments[monthKey] || 0
      });
    }

    // Get attendance summary (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const attendanceRecords = await Attendance.find({
      student: { $in: parent.students },
      date: { $gte: thirtyDaysAgo },
      type: 'student'
    }).populate('student', 'name studentId');
    const presentCount = attendanceRecords.filter(a => a.status === 'present').length;
    const absentCount = attendanceRecords.filter(a => a.status === 'absent').length;

    // Get latest complaints (last 5)
    const latestComplaints = await Complaint.find({
      student: { $in: parent.students }
    })
      .populate('student', 'name studentId')
      .populate('room', 'roomNumber')
      .sort({ createdAt: -1 })
      .limit(5);

    // Get latest notifications (last 10) - only for this parent or their children
    const childrenUserIds = children.filter(c => c.user).map(c => c.user._id);
    
    const latestNotifications = await Notification.find({
      $or: [
        { recipient: req.user._id },
        { recipient: { $in: childrenUserIds } },
        // Only include parent role notifications if specifically sent to this parent
        { recipientRole: 'parent', recipient: req.user._id }
      ]
    })
      .sort({ sentAt: -1 })
      .limit(10);
    
    // Filter to ensure notifications are only about parent's children
    const filteredLatestNotifications = latestNotifications.filter(notification => {
      // If directly sent to parent or one of their children, include it
      if (notification.recipient) {
        const recipientId = notification.recipient._id?.toString() || notification.recipient.toString();
        if (recipientId === req.user._id.toString() || 
            childrenUserIds.some(uid => uid.toString() === recipientId)) {
          return true;
        }
      }
      
      // If has studentDetails, check if it matches one of parent's children
      if (notification.studentDetails) {
        return children.some(c => 
          (c.studentId && c.studentId === notification.studentDetails.studentId) ||
          (c.admissionNumber && c.admissionNumber === notification.studentDetails.admissionNumber)
        );
      }
      
      return false;
    });

    // Get upcoming due dates (next 30 days)
    const next30Days = new Date();
    next30Days.setDate(next30Days.getDate() + 30);
    const upcomingDueDates = await Fee.find({
      student: { $in: parent.students },
      dueDate: { $gte: new Date(), $lte: next30Days },
      status: { $in: ['pending', 'overdue'] }
    })
      .populate('student', 'name studentId')
      .sort({ dueDate: 1 })
      .limit(10);

    res.json({
      parent,
      children,
      stats: {
        totalFeesPaid,
        totalFeesPending,
        totalMessFeesPaid,
        totalMessFeesPending,
        attendanceSummary: {
          present: presentCount,
          absent: absentCount,
          total: attendanceRecords.length
        },
        latestComplaints,
        latestNotifications: filteredLatestNotifications,
        upcomingDueDates,
        monthlyPaymentHistory, // General fee payment history
        monthlyMessFeePaymentHistory // Mess fee payment history
      }
    });
  } catch (error) {
    console.error('Get dashboard stats error:', error);
    res.status(500).json({ message: 'Error fetching dashboard stats', error: error.message });
  }
};

/**
 * Download Fee Report as PDF
 */
export const downloadFeeReport = async (req, res) => {
  try {
    const parent = await Parent.findOne({ user: req.user._id });

    if (!parent) {
      return res.status(404).json({ message: 'Parent profile not found' });
    }

    const { studentId } = req.query;
    const query = { student: { $in: parent.students } };
    if (studentId) query.student = studentId;

    // Get all fees
    const fees = await Fee.find(query)
      .populate('student', 'name studentId email')
      .sort({ dueDate: -1 });

    // Generate PDF report
    const pdfBuffer = await generateFeeReport(fees, parent);

    // Set response headers
    const fileName = `Fee_Report_${new Date().toISOString().split('T')[0]}.pdf`;
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.setHeader('Content-Length', pdfBuffer.length);

    res.send(pdfBuffer);
  } catch (error) {
    console.error('Download fee report error:', error);
    res.status(500).json({ message: 'Error generating fee report', error: error.message });
  }
};

/**
 * Download Attendance Report as PDF
 */
export const downloadAttendanceReport = async (req, res) => {
  try {
    const parent = await Parent.findOne({ user: req.user._id });

    if (!parent) {
      return res.status(404).json({ message: 'Parent profile not found' });
    }

    const { studentId, startDate, endDate } = req.query;
    const query = { student: { $in: parent.students }, type: 'student' };

    if (studentId) query.student = studentId;
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }

    // Get attendance records
    const attendanceRecords = await Attendance.find(query)
      .populate('student', 'name studentId email')
      .sort({ date: -1 });

    // Generate PDF report
    const pdfBuffer = await generateAttendanceReport(attendanceRecords, parent);

    // Set response headers
    const fileName = `Attendance_Report_${new Date().toISOString().split('T')[0]}.pdf`;
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.setHeader('Content-Length', pdfBuffer.length);

    res.send(pdfBuffer);
  } catch (error) {
    console.error('Download attendance report error:', error);
    res.status(500).json({ message: 'Error generating attendance report', error: error.message });
  }
};

/**
 * Download Complaint Report as PDF
 */
export const downloadComplaintReport = async (req, res) => {
  try {
    const parent = await Parent.findOne({ user: req.user._id });

    if (!parent) {
      return res.status(404).json({ message: 'Parent profile not found' });
    }

    const { studentId } = req.query;
    const query = { student: { $in: parent.students } };

    if (studentId) query.student = studentId;

    // Get complaints
    const complaints = await Complaint.find(query)
      .populate('student', 'name studentId email')
      .populate('room', 'roomNumber')
      .sort({ createdAt: -1 });

    // Generate PDF report
    const pdfBuffer = await generateComplaintReport(complaints, parent);

    // Set response headers
    const fileName = `Complaint_Report_${new Date().toISOString().split('T')[0]}.pdf`;
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.setHeader('Content-Length', pdfBuffer.length);

    res.send(pdfBuffer);
  } catch (error) {
    console.error('Download complaint report error:', error);
    res.status(500).json({ message: 'Error generating complaint report', error: error.message });
  }
};

export const getNotifications = async (req, res) => {
  try {
    const { isRead, childId } = req.query;
    const parent = await Parent.findOne({ user: req.user._id }).populate('students');

    if (!parent) {
      return res.status(404).json({ message: 'Parent profile not found' });
    }

    // Get all children's user IDs
    const Student = (await import('../models/Student.model.js')).default;
    const children = await Student.find({ _id: { $in: parent.students } }).populate('user');
    const childrenUserIds = children.filter(c => c.user).map(c => c.user._id);
    const childrenIds = children.map(c => c._id);

    // Build query - only notifications sent directly to parent or to parent's children
    const query = {
      $and: [
        {
          $or: [
            // Directly sent to parent
            { recipient: req.user._id },
            // Sent to parent's children
            { recipient: { $in: childrenUserIds } },
            // Only include parent role notifications if specifically sent to this parent
            { recipientRole: 'parent', recipient: req.user._id },
          ],
        },
        // Exclude all staff-related entity types
        {
          $or: [
            { 'relatedEntity.entityType': { $nin: ['staffSchedule', 'staff', 'staffLeaveRequest', 'stockRequest'] } },
            { 'relatedEntity.entityType': { $exists: false } },
          ],
        },
        // Exclude notifications with recipientRole 'parent' that don't have a specific recipient
        {
          $or: [
            { recipientRole: { $ne: 'parent' } },
            { recipientRole: 'parent', recipient: req.user._id },
            { recipient: { $in: childrenUserIds } },
          ],
        },
      ],
    };

    if (isRead !== undefined) query.isRead = isRead === 'true';

    // If filtering by specific child
    if (childId) {
      const child = children.find(c => c._id.toString() === childId);
      if (child && child.user) {
        query.$and[0].$or = [
          { recipient: req.user._id },
          { recipient: child.user._id },
        ];
      }
    }

    const notifications = await Notification.find(query)
      .populate('recipient', 'name email')
      .sort({ sentAt: -1 })
      .limit(100); // Get more to filter

    // Populate parent and student details from related entities
    const Payment = (await import('../models/Payment.model.js')).default;
    const Complaint = (await import('../models/Complaint.model.js')).default;
    const OutingRequest = (await import('../models/OutingRequest.model.js')).default;
    const VisitorLog = (await import('../models/VisitorLog.model.js')).default;

    const enrichedNotifications = await Promise.all(
      notifications.map(async (notification) => {
        // If student details already exist, verify it's one of parent's children
        if (notification.studentDetails && notification.studentDetails.name) {
          // Check if this student is one of parent's children
          const studentMatch = children.find(c => 
            (c.studentId && c.studentId === notification.studentDetails.studentId) ||
            (c.admissionNumber && c.admissionNumber === notification.studentDetails.admissionNumber)
          );
          
          if (!studentMatch && notification.recipient?._id?.toString() !== req.user._id.toString()) {
            return null; // Not related to parent's children
          }

          // Also populate parent name if this is a parent notification
          if (notification.origin === 'parent' && notification.recipient) {
            const recipientUser = notification.recipient;
            const parentAccount = await Parent.findOne({ user: recipientUser._id });
            if (parentAccount && !notification.parentDetails) {
              notification.parentDetails = {
                name: parentAccount.name || recipientUser.name,
                email: parentAccount.email || recipientUser.email,
              };
            }
          }
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
            } else if (notification.relatedEntity.entityType === 'outing') {
              const outing = await OutingRequest.findById(notification.relatedEntity.entityId)
                .populate('student');
              if (outing && outing.student) {
                student = outing.student;
              }
            } else if (notification.relatedEntity.entityType === 'student') {
              student = await Student.findById(notification.relatedEntity.entityId);
            }

            // Verify student is one of parent's children
            if (student) {
              const studentId = student._id?.toString() || student.toString();
              const isParentChild = childrenIds.some(cid => cid.toString() === studentId);
              
              if (!isParentChild && notification.recipient?._id?.toString() !== req.user._id.toString()) {
                return null; // Not related to parent's children
              }

              const studentObj = student.toObject ? student.toObject() : student;
              notification.studentDetails = {
                name: studentObj.name || null,
                studentId: studentObj.studentId || null,
                admissionNumber: studentObj.admissionNumber || studentObj.studentId || null,
                course: studentObj.course || null,
                batchYear: studentObj.batchYear || null,
                roomNumber: studentObj.room?.roomNumber || null,
                block: studentObj.room?.block || null,
              };
            } else {
              // If no student found and notification is not directly sent to parent, exclude it
              if (notification.recipient?._id?.toString() !== req.user._id.toString() &&
                  !childrenUserIds.some(uid => uid.toString() === notification.recipient?._id?.toString())) {
                return null;
              }
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
            return null; // Exclude notifications with errors
          }
        } else {
          // No related entity - only include if directly sent to parent or child
          if (notification.recipient?._id?.toString() !== req.user._id.toString() &&
              !childrenUserIds.some(uid => uid.toString() === notification.recipient?._id?.toString())) {
            return null;
          }
        }

        return notification;
      })
    );

    // Filter out null values and staff-related notifications
    const filteredNotifications = enrichedNotifications.filter(notification => {
      if (!notification) return false;
      
      // Exclude staff-related entity types
      const staffEntityTypes = ['staffSchedule', 'staff', 'staffLeaveRequest', 'stockRequest'];
      if (notification.relatedEntity?.entityType && 
          staffEntityTypes.includes(notification.relatedEntity.entityType)) {
        return false;
      }

      // Exclude notifications with recipientRole 'parent' that aren't specifically sent to this parent
      if (notification.recipientRole === 'parent') {
        const recipientId = notification.recipient?._id?.toString() || notification.recipient?.toString();
        if (recipientId !== req.user._id.toString()) {
          return false; // This is a parent notification but not for this specific parent
        }
      }
      
      // Only include if:
      // 1. Directly sent to parent, OR
      // 2. Sent to one of parent's children, OR
      // 3. Has studentDetails matching one of parent's children, OR
      // 4. Is a visitor notification (title contains "Visitor") related to parent's child
      const isDirectToParent = notification.recipient?._id?.toString() === req.user._id.toString();
      const isToChild = childrenUserIds.some(uid => {
        const recipientId = notification.recipient?._id?.toString() || notification.recipient?.toString();
        return uid.toString() === recipientId;
      });
      const hasChildStudentDetails = notification.studentDetails && 
        children.some(c => 
          (c.studentId && c.studentId === notification.studentDetails.studentId) ||
          (c.admissionNumber && c.admissionNumber === notification.studentDetails.admissionNumber)
        );
      
      // For visitor notifications, only include if related to parent's child
      const isVisitorNotification = notification.title?.toLowerCase().includes('visitor');
      const isVisitorForChild = isVisitorNotification && (isToChild || hasChildStudentDetails);

      return isDirectToParent || isToChild || hasChildStudentDetails || isVisitorForChild;
    });

    res.json(filteredNotifications.slice(0, 50)); // Limit to 50
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
 * Get activities
 */
export const getActivities = async (req, res) => {
  try {
    const { status, category } = req.query;
    const query = {};

    // Only show upcoming and ongoing activities to parents
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
 * Get activities that parent's children have joined
 */
export const getChildrenActivities = async (req, res) => {
  try {
    const parent = await Parent.findOne({ user: req.user._id });

    if (!parent) {
      return res.status(404).json({ message: 'Parent profile not found' });
    }

    if (!parent.students || parent.students.length === 0) {
      return res.json([]);
    }

    const ActivityParticipation = (await import('../models/ActivityParticipation.model.js')).default;

    // Get all participations for parent's children
    const participations = await ActivityParticipation.find({
      student: { $in: parent.students },
      status: 'joined'
    })
      .populate({
        path: 'activity',
        populate: {
          path: 'createdBy',
          select: 'name email'
        }
      })
      .populate('student', 'name studentId')
      .sort({ joinedAt: -1 });

    // Group by activity and include which children joined
    const activityMap = new Map();

    participations.forEach(participation => {
      if (participation.activity) {
        const activityId = participation.activity._id.toString();
        
        if (!activityMap.has(activityId)) {
          activityMap.set(activityId, {
            activity: participation.activity,
            children: []
          });
        }
        
        activityMap.get(activityId).children.push({
          student: participation.student,
          joinedAt: participation.joinedAt,
          studentIdentity: participation.studentIdentity
        });
      }
    });

    // Convert map to array and sort by activity date
    const result = Array.from(activityMap.values())
      .map(item => ({
        ...item.activity.toObject(),
        children: item.children
      }))
      .sort((a, b) => {
        const dateA = new Date(a.date);
        const dateB = new Date(b.date);
        return dateA - dateB;
      });

    res.json(result);
  } catch (error) {
    console.error('Get children activities error:', error);
    res.status(500).json({ message: 'Error fetching children activities', error: error.message });
  }
};

