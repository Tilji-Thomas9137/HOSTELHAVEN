import mongoose from 'mongoose';

const roommateRequestSchema = new mongoose.Schema(
  {
    requester: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      required: true,
    },
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'rejected', 'cancelled'],
      default: 'pending',
    },
    message: {
      type: String,
      trim: true,
      maxLength: 500,
    },
    // AI matching score (for future)
    aiMatchingScore: {
      type: Number,
      min: 0,
      max: 100,
    },
    // When request was accepted/rejected
    respondedAt: {
      type: Date,
    },
    // If both students accept, they can be paired
    isPaired: {
      type: Boolean,
      default: false,
    },
    pairedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for efficient queries
roommateRequestSchema.index({ requester: 1, status: 1 });
roommateRequestSchema.index({ recipient: 1, status: 1 });

// Prevent duplicate pending requests between same students
roommateRequestSchema.index(
  { requester: 1, recipient: 1 },
  { 
    unique: true,
    partialFilterExpression: { status: 'pending' }
  }
);

const RoommateRequest = mongoose.model('RoommateRequest', roommateRequestSchema);

export default RoommateRequest;

