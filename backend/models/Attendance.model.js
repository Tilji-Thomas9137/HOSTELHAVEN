import mongoose from 'mongoose';

const attendanceSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
    },
    staff: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Staff',
    },
    date: {
      type: Date,
      required: true,
    },
    type: {
      type: String,
      enum: ['student', 'staff'],
      required: true,
    },
    status: {
      type: String,
      enum: ['present', 'absent', 'late', 'excused', 'half_day'],
      required: true,
    },
    checkIn: {
      type: Date,
      default: null,
    },
    checkOut: {
      type: Date,
      default: null,
    },
    remarks: {
      type: String,
      trim: true,
    },
    markedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

// Compound index to prevent duplicate attendance entries
attendanceSchema.index({ student: 1, date: 1 }, { unique: true, partialFilterExpression: { student: { $exists: true } } });
attendanceSchema.index({ staff: 1, date: 1 }, { unique: true, partialFilterExpression: { staff: { $exists: true } } });
attendanceSchema.index({ date: 1, type: 1 });

const Attendance = mongoose.model('Attendance', attendanceSchema);

export default Attendance;

