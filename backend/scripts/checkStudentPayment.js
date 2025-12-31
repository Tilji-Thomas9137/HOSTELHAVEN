import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Student from '../models/Student.model.js';
import Fee from '../models/Fee.model.js';
import Payment from '../models/Payment.model.js';
import User from '../models/User.model.js';
import Room from '../models/Room.model.js';

dotenv.config();

const checkStudentPayment = async (studentId) => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Find student by studentId
    const student = await Student.findOne({ studentId: studentId.toUpperCase() })
      .populate('user', 'username email')
      .populate('room', 'roomNumber block floor roomType totalPrice');

    if (!student) {
      console.log(`❌ Student with ID ${studentId} not found`);
      process.exit(1);
    }

    console.log('\n📋 STUDENT INFORMATION:');
    console.log('─'.repeat(50));
    console.log(`Name: ${student.name}`);
    console.log(`Student ID: ${student.studentId}`);
    console.log(`Email: ${student.user?.email || 'N/A'}`);
    console.log(`Course: ${student.course || 'N/A'}`);
    console.log(`Batch Year: ${student.batchYear || 'N/A'}`);
    if (student.room) {
      console.log(`Room: ${student.room.roomNumber} (${student.room.block || 'N/A'})`);
      console.log(`Room Type: ${student.room.roomType || 'N/A'}`);
    } else {
      console.log(`Room: Not allocated`);
    }
    console.log('─'.repeat(50));

    // Get all fees for this student
    const fees = await Fee.find({ student: student._id })
      .sort({ createdAt: -1 });

    console.log('\n💰 FEE INFORMATION:');
    console.log('─'.repeat(50));
    
    if (fees.length === 0) {
      console.log('No fees found for this student.');
    } else {
      let totalAmount = 0;
      let totalPaid = 0;
      let totalPending = 0;

      fees.forEach((fee, index) => {
        const pendingAmount = fee.amount - (fee.paidAmount || 0);
        totalAmount += fee.amount;
        totalPaid += fee.paidAmount || 0;
        totalPending += pendingAmount;

        console.log(`\nFee ${index + 1}:`);
        console.log(`  Type: ${fee.feeType}`);
        console.log(`  Amount: ₹${fee.amount.toLocaleString('en-IN')}`);
        console.log(`  Paid: ₹${(fee.paidAmount || 0).toLocaleString('en-IN')}`);
        console.log(`  Pending: ₹${pendingAmount.toLocaleString('en-IN')}`);
        console.log(`  Status: ${fee.status.toUpperCase()}`);
        console.log(`  Due Date: ${fee.dueDate ? new Date(fee.dueDate).toLocaleDateString('en-IN') : 'N/A'}`);
        if (fee.paidDate) {
          console.log(`  Paid Date: ${new Date(fee.paidDate).toLocaleDateString('en-IN')}`);
        }
        if (fee.month) {
          console.log(`  Month: ${fee.month} ${fee.year}`);
        }
        if (fee.daysPresent !== null && fee.daysPresent !== undefined) {
          console.log(`  Days Present: ${fee.daysPresent} days`);
        }
        if (fee.description) {
          console.log(`  Description: ${fee.description}`);
        }
      });

      console.log('\n📊 SUMMARY:');
      console.log('─'.repeat(50));
      console.log(`Total Fees: ₹${totalAmount.toLocaleString('en-IN')}`);
      console.log(`Total Paid: ₹${totalPaid.toLocaleString('en-IN')}`);
      console.log(`Total Pending: ₹${totalPending.toLocaleString('en-IN')}`);
      
      if (totalPending > 0) {
        console.log(`\n⚠️  STUDENT HAS UNPAID FEES: ₹${totalPending.toLocaleString('en-IN')}`);
      } else {
        console.log(`\n✅ ALL FEES PAID`);
      }
    }

    // Get payment history
    const payments = await Payment.find({ student: student._id })
      .sort({ paymentDate: -1 })
      .limit(10);

    console.log('\n💳 RECENT PAYMENT HISTORY (Last 10):');
    console.log('─'.repeat(50));
    
    if (payments.length === 0) {
      console.log('No payment records found.');
    } else {
      payments.forEach((payment, index) => {
        console.log(`\nPayment ${index + 1}:`);
        console.log(`  Amount: ₹${payment.amount.toLocaleString('en-IN')}`);
        console.log(`  Type: ${payment.paymentType}`);
        console.log(`  Method: ${payment.paymentMethod}`);
        console.log(`  Date: ${new Date(payment.paymentDate).toLocaleDateString('en-IN')}`);
        console.log(`  Status: ${payment.status}`);
        if (payment.transactionId) {
          console.log(`  Transaction ID: ${payment.transactionId}`);
        }
      });
    }

    console.log('\n' + '─'.repeat(50));
    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    await mongoose.disconnect();
    process.exit(1);
  }
};

// Get studentId from command line argument
const studentId = process.argv[2];

if (!studentId) {
  console.log('Usage: node checkStudentPayment.js <studentId>');
  console.log('Example: node checkStudentPayment.js 13218');
  process.exit(1);
}

checkStudentPayment(studentId);

