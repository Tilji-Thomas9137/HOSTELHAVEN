import Fee from '../models/Fee.model.js';
import Student from '../models/Student.model.js';
import Attendance from '../models/Attendance.model.js';
import { sendFeeNotification } from '../services/mailService.js';

/**
 * Calculate days present in hostel for a student in a given month
 * @param {string} studentId - Student ID
 * @param {number} month - Month (0-11)
 * @param {number} year - Year
 * @returns {object} Days present calculation
 */
const calculateDaysPresent = async (studentId, month, year) => {
  try {
    // Calculate month start and end dates
    const monthStart = new Date(year, month, 1);
    const monthEnd = new Date(year, month + 1, 0, 23, 59, 59, 999);

    // Get all attendance records for the student in this month
    const attendanceRecords = await Attendance.find({
      student: studentId,
      type: 'student',
      date: {
        $gte: monthStart,
        $lte: monthEnd,
      },
    });

    let daysPresent = 0;
    let daysAbsent = 0;
    let daysLate = 0;
    let daysHalfDay = 0;
    let daysExcused = 0;

    // Count days by status
    attendanceRecords.forEach((record) => {
      switch (record.status) {
        case 'present':
          daysPresent++;
          break;
        case 'absent':
          daysAbsent++;
          break;
        case 'late':
          daysLate++;
          daysPresent++; // Late still counts as present for mess fee
          break;
        case 'half_day':
          daysHalfDay++;
          daysPresent += 0.5; // Half day counts as 0.5 days
          break;
        case 'excused':
          daysExcused++;
          // Excused absence doesn't count as present
          break;
      }
    });

    // Total days in the month
    const totalDaysInMonth = monthEnd.getDate();

    return {
      daysPresent: Math.round(daysPresent * 100) / 100, // Round to 2 decimal places
      daysAbsent,
      daysLate,
      daysHalfDay,
      daysExcused,
      totalDaysInMonth,
      attendanceRecordsCount: attendanceRecords.length,
    };
  } catch (error) {
    console.error('Error calculating days present:', error);
    throw error;
  }
};

/**
 * Generate monthly mess fees for all students with allocated rooms
 * Fee is calculated based on number of days present in the hostel
 * @param {number} dailyMessFeeRate - Daily mess fee rate (default: ₹100/day)
 */
export const generateMonthlyMessFees = async (dailyMessFeeRate = 150) => {
  try {
    const now = new Date();
    const currentMonth = now.getMonth(); // 0-11
    const currentYear = now.getFullYear();
    
    // Calculate due date (end of current month)
    const dueDate = new Date(currentYear, currentMonth + 1, 0); // Last day of current month
    
    // Get month name for description
    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    const monthName = monthNames[currentMonth];

    // Find all students with allocated rooms
    const students = await Student.find({ room: { $ne: null } })
      .populate('room', 'roomNumber roomType')
      .populate('user', 'email');

    let generatedCount = 0;
    let skippedCount = 0;
    const errors = [];

    for (const student of students) {
      try {
        // Check if mess fee already exists for this month
        const existingFee = await Fee.findOne({
          student: student._id,
          feeType: 'mess_fee',
          month: monthName,
          year: currentYear,
          status: { $in: ['pending', 'partial'] },
        });

        if (existingFee) {
          skippedCount++;
          continue;
        }

        // Calculate days present in the hostel for this month
        const attendanceData = await calculateDaysPresent(student._id, currentMonth, currentYear);
        const daysPresent = attendanceData.daysPresent;

        // Calculate mess fee: daily rate × days present
        const messFeeAmount = Math.round(dailyMessFeeRate * daysPresent * 100) / 100;

        // Generate mess fee
        const messFee = await Fee.create({
          student: student._id,
          feeType: 'mess_fee',
          amount: messFeeAmount,
          dueDate: dueDate,
          status: 'pending',
          description: `Monthly mess fee for ${monthName} ${currentYear} - ${daysPresent} days present (₹${dailyMessFeeRate}/day)`,
          month: monthName,
          year: currentYear,
          daysPresent: daysPresent,
          dailyRate: dailyMessFeeRate,
        });

        generatedCount++;

        // Send email notification to student
        if (student.user && student.user.email) {
          try {
            await sendFeeNotification({
              to: student.user.email,
              name: student.name,
              feeType: 'Mess Fee',
              amount: messFeeAmount,
              dueDate: dueDate,
              month: monthName,
              year: currentYear,
              daysPresent: daysPresent,
              dailyRate: dailyMessFeeRate,
            });
          } catch (emailError) {
            console.error(`Failed to send email to ${student.user.email}:`, emailError);
            // Don't fail the fee generation if email fails
          }
        }

        console.log(`Mess fee generated for student ${student.studentId}: ₹${messFeeAmount} for ${daysPresent} days present in ${monthName} ${currentYear}`);
      } catch (error) {
        errors.push({
          studentId: student.studentId,
          error: error.message,
        });
        console.error(`Error generating mess fee for student ${student.studentId}:`, error);
      }
    }

    return {
      success: true,
      generated: generatedCount,
      skipped: skippedCount,
      total: students.length,
      errors: errors,
      month: monthName,
      year: currentYear,
      dailyRate: dailyMessFeeRate,
    };
  } catch (error) {
    console.error('Error in generateMonthlyMessFees:', error);
    throw error;
  }
};

/**
 * Generate mess fees for a specific month (for manual generation or catch-up)
 * Fee is calculated based on number of days present in the hostel
 * @param {string} month - Month name (e.g., "January", "February")
 * @param {number} year - Year
 * @param {number} dailyMessFeeRate - Daily mess fee rate (default: ₹100/day)
 */
export const generateMessFeesForMonth = async (month, year, dailyMessFeeRate = 150) => {
  try {
    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    
    const monthIndex = monthNames.indexOf(month);
    if (monthIndex === -1) {
      throw new Error('Invalid month name. Use full month name (e.g., "January", "February")');
    }

    const dueDate = new Date(year, monthIndex + 1, 0); // Last day of the month

    const students = await Student.find({ room: { $ne: null } })
      .populate('room', 'roomNumber roomType')
      .populate('user', 'email');

    let generatedCount = 0;
    let skippedCount = 0;
    const errors = [];

    for (const student of students) {
      try {
        const existingFee = await Fee.findOne({
          student: student._id,
          feeType: 'mess_fee',
          month: month,
          year: year,
          status: { $in: ['pending', 'partial'] },
        });

        if (existingFee) {
          skippedCount++;
          continue;
        }

        // Calculate days present in the hostel for this month
        const attendanceData = await calculateDaysPresent(student._id, monthIndex, year);
        const daysPresent = attendanceData.daysPresent;

        // Calculate mess fee: daily rate × days present
        const messFeeAmount = Math.round(dailyMessFeeRate * daysPresent * 100) / 100;

        const messFee = await Fee.create({
          student: student._id,
          feeType: 'mess_fee',
          amount: messFeeAmount,
          dueDate: dueDate,
          status: 'pending',
          description: `Monthly mess fee for ${month} ${year} - ${daysPresent} days present (₹${dailyMessFeeRate}/day)`,
          month: month,
          year: year,
          daysPresent: daysPresent,
          dailyRate: dailyMessFeeRate,
        });

        generatedCount++;

        if (student.user && student.user.email) {
          try {
            await sendFeeNotification({
              to: student.user.email,
              name: student.name,
              feeType: 'Mess Fee',
              amount: messFeeAmount,
              dueDate: dueDate,
              month: month,
              year: year,
              daysPresent: daysPresent,
              dailyRate: dailyMessFeeRate,
            });
          } catch (emailError) {
            console.error(`Failed to send email to ${student.user.email}:`, emailError);
          }
        }
      } catch (error) {
        errors.push({
          studentId: student.studentId,
          error: error.message,
        });
      }
    }

    return {
      success: true,
      generated: generatedCount,
      skipped: skippedCount,
      total: students.length,
      errors: errors,
      month: month,
      year: year,
      dailyRate: dailyMessFeeRate,
    };
  } catch (error) {
    console.error('Error in generateMessFeesForMonth:', error);
    throw error;
  }
};
