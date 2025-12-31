import mongoose from 'mongoose';

const staffScheduleSchema = new mongoose.Schema(
  {
    staff: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Staff',
      required: true,
    },
    weeklySchedule: {
      monday: {
        shift: {
          type: String,
          enum: ['Morning', 'Evening', 'Night', 'Full Day', 'Off'],
          default: 'Full Day',
        },
        duties: {
          type: String,
          trim: true,
          default: '',
        },
        timeSlot: {
          type: String,
          trim: true,
          default: '',
        },
      },
      tuesday: {
        shift: {
          type: String,
          enum: ['Morning', 'Evening', 'Night', 'Full Day', 'Off'],
          default: 'Full Day',
        },
        duties: {
          type: String,
          trim: true,
          default: '',
        },
        timeSlot: {
          type: String,
          trim: true,
          default: '',
        },
      },
      wednesday: {
        shift: {
          type: String,
          enum: ['Morning', 'Evening', 'Night', 'Full Day', 'Off'],
          default: 'Full Day',
        },
        duties: {
          type: String,
          trim: true,
          default: '',
        },
        timeSlot: {
          type: String,
          trim: true,
          default: '',
        },
      },
      thursday: {
        shift: {
          type: String,
          enum: ['Morning', 'Evening', 'Night', 'Full Day', 'Off'],
          default: 'Full Day',
        },
        duties: {
          type: String,
          trim: true,
          default: '',
        },
        timeSlot: {
          type: String,
          trim: true,
          default: '',
        },
      },
      friday: {
        shift: {
          type: String,
          enum: ['Morning', 'Evening', 'Night', 'Full Day', 'Off'],
          default: 'Full Day',
        },
        duties: {
          type: String,
          trim: true,
          default: '',
        },
        timeSlot: {
          type: String,
          trim: true,
          default: '',
        },
      },
      saturday: {
        shift: {
          type: String,
          enum: ['Morning', 'Evening', 'Night', 'Full Day', 'Off'],
          default: 'Full Day',
        },
        duties: {
          type: String,
          trim: true,
          default: '',
        },
        timeSlot: {
          type: String,
          trim: true,
          default: '',
        },
      },
      sunday: {
        shift: {
          type: String,
          enum: ['Morning', 'Evening', 'Night', 'Full Day', 'Off'],
          default: 'Full Day',
        },
        duties: {
          type: String,
          trim: true,
          default: '',
        },
        timeSlot: {
          type: String,
          trim: true,
          default: '',
        },
      },
    },
    todaySchedule: [
      {
        duty: {
          type: String,
          required: true,
          trim: true,
        },
        time: {
          type: String,
          required: true,
          trim: true,
        },
        location: {
          type: String,
          trim: true,
          default: '',
        },
      },
    ],
    effectiveFrom: {
      type: Date,
      default: Date.now,
    },
    effectiveTo: {
      type: Date,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Index for efficient queries
staffScheduleSchema.index({ staff: 1, isActive: 1 });
staffScheduleSchema.index({ effectiveFrom: 1, effectiveTo: 1 });

const StaffSchedule = mongoose.model('StaffSchedule', staffScheduleSchema);

export default StaffSchedule;

