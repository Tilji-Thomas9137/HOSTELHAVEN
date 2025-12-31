import mongoose from 'mongoose';

const stockRequestSchema = new mongoose.Schema(
  {
    requestedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Staff',
      required: true,
    },
    type: {
      type: String,
      enum: ['stock_request', 'stock_out_report'],
      required: true,
    },
    itemName: {
      type: String,
      required: true,
      trim: true,
    },
    category: {
      type: String,
      enum: ['furniture', 'electronics', 'appliances', 'bedding', 'utensils', 'cleaning', 'other'],
      default: 'other',
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
      max: 500,
    },
    unit: {
      type: String,
      enum: ['piece', 'set', 'kg', 'liter', 'meter'],
      default: 'piece',
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'urgent'],
      default: 'medium',
    },
    reason: {
      type: String,
      required: true,
      trim: true,
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'fulfilled'],
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
    fulfilledAt: {
      type: Date,
    },
    // Store staff identity for visibility
    staffIdentity: {
      name: String,
      staffId: String,
      department: String,
    },
  },
  {
    timestamps: true,
  }
);

// Index for efficient queries
stockRequestSchema.index({ requestedBy: 1, status: 1 });
stockRequestSchema.index({ status: 1, createdAt: -1 });
stockRequestSchema.index({ type: 1, status: 1 });

const StockRequest = mongoose.model('StockRequest', stockRequestSchema);

export default StockRequest;

