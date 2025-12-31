import mongoose from 'mongoose';

const inventoryRequestSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      required: true,
    },
    inventoryItem: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Inventory',
      required: true,
    },
    itemName: {
      type: String,
      required: true,
      trim: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
      default: 1,
    },
    requestReason: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'issued', 'returned', 'cancelled'],
      default: 'pending',
    },
    itemType: {
      type: String,
      enum: ['temporary', 'permanent'],
      required: true,
      default: 'temporary',
    },
    // Staff who reviewed the request
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Staff',
    },
    reviewedAt: {
      type: Date,
    },
    rejectionReason: {
      type: String,
      trim: true,
    },
    // Staff who issued the item
    issuedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Staff',
    },
    issuedAt: {
      type: Date,
    },
    // Staff who confirmed return
    returnedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Staff',
    },
    returnedAt: {
      type: Date,
    },
    returnNotes: {
      type: String,
      trim: true,
    },
    // Store student identity for visibility
    studentIdentity: {
      name: String,
      studentId: String,
      admissionNumber: String,
      roomNumber: String,
      block: String,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for efficient queries
inventoryRequestSchema.index({ student: 1, status: 1 });
inventoryRequestSchema.index({ status: 1, createdAt: -1 });
inventoryRequestSchema.index({ inventoryItem: 1 });
inventoryRequestSchema.index({ reviewedBy: 1, status: 1 });

const InventoryRequest = mongoose.model('InventoryRequest', inventoryRequestSchema);

export default InventoryRequest;
