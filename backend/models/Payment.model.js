import mongoose from 'mongoose';

const paymentSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      required: true,
    },
    fee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Fee',
    },
    booking: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Booking',
    },
    amount: {
      type: Number,
      required: true,
    },
    paymentType: {
      type: String,
      enum: ['rent', 'deposit', 'fine', 'utility', 'mess_fee', 'maintenance', 'late_fee', 'other'],
      required: true,
    },
    paymentMethod: {
      type: String,
      enum: ['cash', 'card', 'online', 'bank_transfer', 'online_payment', 'credit_card', 'debit_card', 'upi', 'netbanking'],
      default: 'cash',
    },
    paymentDate: {
      type: Date,
      default: Date.now,
    },
    month: {
      type: String,
    },
    year: {
      type: Number,
    },
    status: {
      type: String,
      enum: ['pending', 'completed', 'failed', 'refunded'],
      default: 'pending',
    },
    transactionId: {
      type: String,
      trim: true,
    },
    notes: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

const Payment = mongoose.model('Payment', paymentSchema);

export default Payment;
