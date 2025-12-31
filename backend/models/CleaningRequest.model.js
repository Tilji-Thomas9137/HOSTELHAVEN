import mongoose from 'mongoose';

const cleaningRequestSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      required: true,
    },
    room: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Room',
    },
    requestType: {
      type: String,
      enum: ['room_cleaning', 'bathroom_cleaning', 'common_area_cleaning'],
      required: true,
    },
    urgency: {
      type: String,
      enum: ['normal', 'high'],
      default: 'normal',
      required: true,
    },
    preferredDate: {
      type: Date,
      required: true,
    },
    preferredTimeSlot: {
      type: String,
      enum: ['morning', 'afternoon', 'evening'],
      required: true,
    },
    description: {
      type: String,
      trim: true,
    },
    attachments: [
      {
        url: String,
        filename: String,
      },
    ],
    status: {
      type: String,
      enum: ['pending', 'assigned', 'completed', 'cancelled'],
      default: 'pending',
    },
    // Store student identity for visibility
    studentIdentity: {
      name: String,
      studentId: String,
      admissionNumber: String,
      roomNumber: String,
      phone: String,
      email: String,
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Staff',
    },
    assignedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    assignedAt: {
      type: Date,
    },
    scheduledDate: {
      type: Date,
    },
    scheduledTime: {
      type: String,
    },
    completedAt: {
      type: Date,
    },
    completedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Staff',
    },
    completionNotes: {
      type: String,
      trim: true,
    },
    cancelledAt: {
      type: Date,
    },
    cancelledBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    cancellationReason: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for efficient queries
cleaningRequestSchema.index({ student: 1, status: 1 });
cleaningRequestSchema.index({ assignedTo: 1, status: 1 });
cleaningRequestSchema.index({ status: 1, createdAt: -1 });
cleaningRequestSchema.index({ urgency: 1, status: 1 });
cleaningRequestSchema.index({ preferredDate: 1 });

const CleaningRequest = mongoose.model('CleaningRequest', cleaningRequestSchema);

export default CleaningRequest;
