import mongoose from 'mongoose';

const staffSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    staffId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    phone: {
      type: String,
      required: true,
      trim: true,
    },
    address: {
      type: String,
      trim: true,
    },
    department: {
      type: String,
      enum: ['Housekeeping', 'Maintenance', 'Security', 'Admin', 'Warden', 'Other'],
      default: 'Housekeeping',
    },
    designation: {
      type: String,
      trim: true,
    },
    shift: {
      type: String,
      enum: ['Morning', 'Evening', 'Night', 'Full Day'],
      default: 'Full Day',
    },
    salary: {
      type: Number,
      default: 0,
    },
    hireDate: {
      type: Date,
      default: Date.now,
    },
    status: {
      type: String,
      enum: ['active', 'inactive', 'suspended'],
      default: 'active',
    },
  },
  {
    timestamps: true,
  }
);

const Staff = mongoose.model('Staff', staffSchema);

export default Staff;

