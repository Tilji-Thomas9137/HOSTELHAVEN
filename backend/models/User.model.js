import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    username: {
      type: String,
      required: function() {
        return !this.googleId && !this.facebookId && !this.phone;
      },
      unique: true,
      sparse: true,
      lowercase: true,
      trim: true,
    },
    email: {
      type: String,
      required: function() {
        return !this.googleId && !this.facebookId;
      },
      unique: true,
      sparse: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: function() {
        return !this.googleId && !this.facebookId && !this.phone;
      },
      minlength: 6,
    },
    googleId: {
      type: String,
      unique: true,
      sparse: true,
    },
    facebookId: {
      type: String,
      unique: true,
      sparse: true,
    },
    role: {
      type: String,
      enum: ['admin', 'staff', 'student', 'parent'],
      required: true,
    },
    phone: {
      type: String,
      trim: true,
    },
    profilePhoto: {
      type: String,
      default: null,
    },
    refreshToken: {
      type: String,
      default: null,
    },
    refreshTokenExpiry: {
      type: Date,
      default: null,
    },
    passwordResetToken: {
      type: String,
      default: null,
    },
    passwordResetExpiry: {
      type: Date,
      default: null,
    },
    firstLogin: {
      type: Boolean,
      default: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    lastLogin: {
      type: Date,
      default: null,
    },
    notificationPreferences: {
      email: {
        type: Boolean,
        default: true,
      },
      sms: {
        type: Boolean,
        default: false,
      },
      push: {
        type: Boolean,
        default: true,
      },
      paymentReminders: {
        type: Boolean,
        default: true,
      },
      maintenanceUpdates: {
        type: Boolean,
        default: true,
      },
      eventNotifications: {
        type: Boolean,
        default: true,
      },
    },
  },
  {
    timestamps: true,
  }
);

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password') || !this.password) {
    return next();
  }
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

// Compare password method
userSchema.methods.comparePassword = async function (candidatePassword) {
  if (!this.password) {
    return false;
  }
  return await bcrypt.compare(candidatePassword, this.password);
};

// Generate password reset token
userSchema.methods.generatePasswordResetToken = function () {
  const resetToken = crypto.randomBytes(32).toString('hex');
  this.passwordResetToken = crypto.createHash('sha256').update(resetToken).digest('hex');
  this.passwordResetExpiry = Date.now() + 10 * 60 * 1000; // 10 minutes
  return resetToken;
};

const User = mongoose.model('User', userSchema);

export default User;
