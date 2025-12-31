import mongoose from 'mongoose';

const otpSchema = new mongoose.Schema(
  {
    phone: {
      type: String,
      required: true,
      trim: true,
    },
    otp: {
      type: String,
      required: true,
    },
    expiresAt: {
      type: Date,
      required: true,
      default: () => new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
      index: { expireAfterSeconds: 0 },
    },
  },
  {
    timestamps: true,
  }
);

// Index for faster lookups
otpSchema.index({ phone: 1, otp: 1 });

const OTP = mongoose.model('OTP', otpSchema);

export default OTP;

