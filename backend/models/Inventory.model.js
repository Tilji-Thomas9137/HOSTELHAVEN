import mongoose from 'mongoose';

const inventorySchema = new mongoose.Schema(
  {
    name: {
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
    },
    unit: {
      type: String,
      enum: ['piece', 'set', 'kg', 'liter', 'meter'],
      default: 'piece',
    },
    location: {
      type: String,
      trim: true,
      default: 'General Store',
    },
    room: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Room',
    },
    purchaseDate: {
      type: Date,
    },
    purchasePrice: {
      type: Number,
      min: 0,
    },
    condition: {
      type: String,
      enum: ['new', 'good', 'fair', 'poor', 'damaged'],
      default: 'good',
    },
    status: {
      type: String,
      enum: ['available', 'in_use', 'issued', 'maintenance', 'damaged', 'disposed'],
      default: 'available',
    },
    itemType: {
      type: String,
      enum: ['temporary', 'permanent'],
      default: 'temporary',
    },
    isStudentEligible: {
      type: Boolean,
      default: false,
    },
    supplier: {
      type: String,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    managedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Staff',
    },
  },
  {
    timestamps: true,
  }
);

inventorySchema.index({ category: 1, status: 1 });
inventorySchema.index({ room: 1 });

const Inventory = mongoose.model('Inventory', inventorySchema);

export default Inventory;

