import mongoose from 'mongoose';

const outingRequestSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      required: true,
    },
    purpose: {
      type: String,
      required: true,
      trim: true,
    },
    destination: {
      type: String,
      required: true,
      trim: true,
    },
    departureDate: {
      type: Date,
      required: true,
    },
    expectedReturnDate: {
      type: Date,
      required: true,
    },
    actualReturnDate: {
      type: Date,
      default: null,
    },
    emergencyContact: {
      name: String,
      phone: String,
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'completed', 'overdue'],
      default: 'pending',
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    approvedAt: {
      type: Date,
      default: null,
    },
    rejectionReason: {
      type: String,
      trim: true,
    },
    remarks: {
      type: String,
      trim: true,
    },
    qrCode: {
      type: String,
      default: null,
    },
    qrCodeData: {
      type: String,
      default: null,
    },
    exitTime: {
      type: Date,
      default: null,
    },
    exitScannedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Staff',
      default: null,
    },
    exitScannedAt: {
      type: Date,
      default: null,
    },
    returnTime: {
      type: Date,
      default: null,
    },
    returnScannedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Staff',
      default: null,
    },
    returnScannedAt: {
      type: Date,
      default: null,
    },
    // Legacy field for backward compatibility
    scannedAt: {
      type: Date,
      default: null,
    },
    scannedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Staff',
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

outingRequestSchema.index({ student: 1, status: 1 });
outingRequestSchema.index({ departureDate: 1, status: 1 });

const OutingRequest = mongoose.model('OutingRequest', outingRequestSchema);

export default OutingRequest;

