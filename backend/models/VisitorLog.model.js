import mongoose from 'mongoose';

const visitorLogSchema = new mongoose.Schema(
  {
    visitorName: {
      type: String,
      required: true,
      trim: true,
    },
    visitorPhone: {
      type: String,
      required: true,
      trim: true,
    },
    visitorEmail: {
      type: String,
      lowercase: true,
      trim: true,
    },
    visitorId: {
      type: String,
      trim: true,
    },
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      required: true,
    },
    room: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Room',
    },
    relation: {
      type: String,
      trim: true,
      default: 'Other',
    },
    purpose: {
      type: String,
      enum: ['visit', 'delivery', 'maintenance', 'official', 'other'],
      default: 'visit',
    },
    checkIn: {
      type: Date,
      default: Date.now,
    },
    checkOut: {
      type: Date,
      default: null,
    },
    status: {
      type: String,
      enum: ['checked_in', 'checked_out', 'pending'],
      default: 'checked_in',
    },
    remarks: {
      type: String,
      trim: true,
    },
    loggedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Staff',
    },
  },
  {
    timestamps: true,
  }
);

visitorLogSchema.index({ student: 1, checkIn: -1 });
visitorLogSchema.index({ status: 1, checkIn: -1 });

const VisitorLog = mongoose.model('VisitorLog', visitorLogSchema);

export default VisitorLog;

