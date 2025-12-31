import mongoose from 'mongoose';

const roomChangeRequestSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      required: true,
    },
    currentRoom: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Room',
      required: true,
    },
    requestedRoom: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Room',
      required: true,
    },
    reason: {
      type: String,
      required: true,
      trim: true,
      maxLength: 500,
    },
    status: {
      type: String,
      enum: ['pending', 'pending_payment', 'under_review', 'approved', 'rejected', 'completed', 'cancelled'],
      default: 'pending',
    },
    // Payment information
    currentRoomPrice: {
      type: Number,
      required: true,
      min: 0,
    },
    requestedRoomPrice: {
      type: Number,
      required: true,
      min: 0,
    },
    priceDifference: {
      type: Number,
      required: true,
      // Positive for upgrade (student pays), negative for downgrade (goes to wallet)
    },
    upgradePaymentRequired: {
      type: Number,
      default: 0,
      min: 0,
    },
    downgradeWalletCredit: {
      type: Number,
      default: 0,
      min: 0,
    },
    paymentStatus: {
      type: String,
      enum: ['not_required', 'pending', 'completed', 'failed'],
      default: 'not_required',
    },
    paymentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Payment',
    },
    alreadyPaidAmount: {
      type: Number,
      default: 0,
      min: 0,
      // Amount student has already paid for current room
    },
    // Admin review
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    reviewedAt: {
      type: Date,
    },
    rejectionReason: {
      type: String,
      trim: true,
      maxLength: 500,
    },
    adminNotes: {
      type: String,
      trim: true,
      maxLength: 1000,
    },
    // AI matching score (for future)
    aiMatchingScore: {
      type: Number,
      min: 0,
      max: 100,
    },
    // Completion tracking
    completedAt: {
      type: Date,
    },
    oldRoomOccupancyBefore: {
      type: Number,
    },
    newRoomOccupancyBefore: {
      type: Number,
    },
  },
  {
    timestamps: true,
  }
);

// Index for efficient queries
roomChangeRequestSchema.index({ student: 1, status: 1 });
roomChangeRequestSchema.index({ status: 1 });
roomChangeRequestSchema.index({ currentRoom: 1 });
roomChangeRequestSchema.index({ requestedRoom: 1 });

const RoomChangeRequest = mongoose.model('RoomChangeRequest', roomChangeRequestSchema);

export default RoomChangeRequest;

