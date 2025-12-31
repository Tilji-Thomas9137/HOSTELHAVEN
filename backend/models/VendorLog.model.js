import mongoose from 'mongoose';

const vendorLogSchema = new mongoose.Schema(
  {
    vendorName: {
      type: String,
      required: true,
      trim: true,
    },
    vendorPhone: {
      type: String,
      trim: true,
    },
    vendorEmail: {
      type: String,
      lowercase: true,
      trim: true,
    },
    vendorId: {
      type: String,
      trim: true,
    },
    type: {
      type: String,
      enum: ['Visitor', 'Maintenance', 'Contractor', 'Delivery', 'Other'],
      default: 'Visitor',
    },
    direction: {
      type: String,
      enum: ['IN', 'OUT'],
      required: true,
    },
    inTime: {
      type: Date,
      default: null,
    },
    outTime: {
      type: Date,
      default: null,
    },
    purpose: {
      type: String,
      trim: true,
    },
    remarks: {
      type: String,
      trim: true,
    },
    loggedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Staff',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

vendorLogSchema.index({ loggedBy: 1, createdAt: -1 });
vendorLogSchema.index({ direction: 1, createdAt: -1 });

const VendorLog = mongoose.model('VendorLog', vendorLogSchema);

export default VendorLog;

