import mongoose from 'mongoose';

const matchingPoolSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      required: true,
      unique: true,
    },
    // Matching preferences
    preferences: {
      roomType: {
        type: String,
        enum: ['Single', 'Double', 'Triple', 'Quad', null],
        default: null,
      },
      preferredRoommates: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Student',
      }],
      avoidRoommates: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Student',
      }],
      preferredBlock: {
        type: String,
        trim: true,
      },
      preferredFloor: {
        type: Number,
        min: 0,
        max: 8,
      },
    },
    // AI matching data
    aiMatchingScore: {
      type: Number,
      min: 0,
      max: 100,
      default: null,
    },
    // Status in matching pool
    status: {
      type: String,
      enum: ['active', 'matched', 'allocated', 'removed'],
      default: 'active',
    },
    // Matched group (if AI matched)
    matchedGroup: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
    }],
    matchedAt: {
      type: Date,
    },
    // Room assigned after matching
    assignedRoom: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Room',
    },
    // Allocation status
    allocationStatus: {
      type: String,
      enum: ['pending', 'pending_payment', 'confirmed', 'cancelled'],
      default: 'pending',
    },
    // Notes
    notes: {
      type: String,
      trim: true,
      maxLength: 500,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for efficient queries
matchingPoolSchema.index({ status: 1, createdAt: -1 });
matchingPoolSchema.index({ student: 1 });
matchingPoolSchema.index({ allocationStatus: 1 });

const MatchingPool = mongoose.model('MatchingPool', matchingPoolSchema);

export default MatchingPool;

