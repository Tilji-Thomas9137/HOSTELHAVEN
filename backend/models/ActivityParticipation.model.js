import mongoose from 'mongoose';

const activityParticipationSchema = new mongoose.Schema(
  {
    activity: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Activity',
      required: true
    },
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      required: true
    },
    studentIdentity: {
      name: String,
      studentId: String,
      admissionNumber: String,
      course: String,
      batchYear: String,
      year: String,
      roomNumber: String,
      block: String
    },
    status: {
      type: String,
      enum: ['joined', 'cancelled'],
      default: 'joined'
    },
    joinedAt: {
      type: Date,
      default: Date.now
    },
    cancelledAt: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: true
  }
);

// Prevent duplicate active participation per student per activity
activityParticipationSchema.index({ activity: 1, student: 1 }, { unique: true });

const ActivityParticipation = mongoose.model('ActivityParticipation', activityParticipationSchema);

export default ActivityParticipation;

