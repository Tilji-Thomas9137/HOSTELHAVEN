import mongoose from 'mongoose';

const walletSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      required: true,
      unique: true,
    },
    balance: {
      type: Number,
      default: 0,
      min: 0,
    },
    transactions: [
      {
        type: {
          type: String,
          enum: ['credit', 'debit'],
          required: true,
        },
        amount: {
          type: Number,
          required: true,
          min: 0,
        },
        reason: {
          type: String,
          required: true,
          enum: ['room_downgrade', 'mess_fee', 'hostel_fee', 'refund', 'adjustment'],
        },
        description: {
          type: String,
          trim: true,
        },
        roomChangeRequest: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'RoomChangeRequest',
        },
        payment: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Payment',
        },
        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Method to add credit
walletSchema.methods.addCredit = function (amount, reason, description, roomChangeRequest = null, payment = null) {
  this.balance += amount;
  this.transactions.push({
    type: 'credit',
    amount,
    reason,
    description,
    roomChangeRequest,
    payment,
  });
  return this.save();
};

// Method to deduct (for mess fee, hostel fee, etc.)
walletSchema.methods.deduct = function (amount, reason, description, payment = null) {
  if (this.balance < amount) {
    throw new Error('Insufficient wallet balance');
  }
  this.balance -= amount;
  this.transactions.push({
    type: 'debit',
    amount,
    reason,
    description,
    payment,
  });
  return this.save();
};

const Wallet = mongoose.model('Wallet', walletSchema);

export default Wallet;

