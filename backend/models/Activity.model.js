import mongoose from 'mongoose';

const activitySchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    category: {
      type: String,
      enum: ['Sports', 'Cultural', 'Academic', 'Community', 'Meeting', 'Other'],
      default: 'Other',
    },
    date: {
      type: Date,
      required: true,
    },
    time: {
      type: String,
      required: true,
      trim: true,
    },
    duration: {
      type: String,
      trim: true,
    },
    location: {
      type: String,
      required: true,
      trim: true,
    },
    organizer: {
      type: String,
      trim: true,
    },
    expectedParticipants: {
      type: Number,
      default: 0,
    },
    requirements: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: ['upcoming', 'ongoing', 'completed', 'cancelled'],
      default: 'upcoming',
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    notified: {
      type: Boolean,
      default: false,
    },
    notifiedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Index for efficient querying
activitySchema.index({ date: 1, status: 1 });
activitySchema.index({ status: 1, date: -1 });
activitySchema.index({ category: 1 });

const Activity = mongoose.model('Activity', activitySchema);

export default Activity;

