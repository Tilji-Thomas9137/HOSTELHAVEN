import mongoose from 'mongoose';

const feeSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      required: true,
    },
    feeType: {
      type: String,
      enum: ['rent', 'deposit', 'utility', 'maintenance', 'late_fee', 'mess_fee', 'other'],
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    dueDate: {
      type: Date,
      required: true,
    },
    paidDate: {
      type: Date,
      default: null,
    },
    status: {
      type: String,
      enum: ['pending', 'paid', 'overdue', 'partial'],
      default: 'pending',
    },
    paidAmount: {
      type: Number,
      default: 0,
    },
    paymentMethod: {
      type: String,
      enum: ['cash', 'card', 'online', 'bank_transfer', 'online_payment', 'credit_card', 'debit_card', 'upi', 'netbanking'],
      default: null,
    },
    transactionId: {
      type: String,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    month: {
      type: String,
      trim: true,
    },
    year: {
      type: Number,
    },
    // For mess fees: track days present
    daysPresent: {
      type: Number,
      default: null,
      min: 0,
    },
    dailyRate: {
      type: Number,
      default: null,
      min: 0,
    },
    // Late fee tracking
    lateFee: {
      type: Number,
      default: 0,
      min: 0,
    },
    lastLateFeeDate: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Index for efficient queries
feeSchema.index({ student: 1, status: 1 });
feeSchema.index({ dueDate: 1, status: 1 });

const Fee = mongoose.model('Fee', feeSchema);

export default Fee;

