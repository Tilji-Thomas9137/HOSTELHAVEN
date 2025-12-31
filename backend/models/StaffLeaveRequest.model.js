import mongoose from 'mongoose';

const staffLeaveRequestSchema = new mongoose.Schema(
  {
    staff: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Staff',
      required: true,
    },
    leaveDate: {
      type: Date,
      required: true,
    },
    reason: {
      type: String,
      required: true,
      trim: true,
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    reviewedAt: {
      type: Date,
    },
    reviewNotes: {
      type: String,
      trim: true,
    },
    // Store staff identity for visibility
    staffIdentity: {
      name: String,
      staffId: String,
      department: String,
      designation: String,
    },
  },
  {
    timestamps: true,
  }
);

// Index for efficient queries
staffLeaveRequestSchema.index({ staff: 1, leaveDate: 1 });
staffLeaveRequestSchema.index({ status: 1, leaveDate: 1 });
staffLeaveRequestSchema.index({ leaveDate: 1 });

const StaffLeaveRequest = mongoose.model('StaffLeaveRequest', staffLeaveRequestSchema);

export default StaffLeaveRequest;

