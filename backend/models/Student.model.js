import mongoose from 'mongoose';

const studentSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    studentId: {
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
    dateOfBirth: {
      type: Date,
    },
    course: {
      type: String,
      trim: true,
    },
    year: {
      type: String,
      enum: ['1st Year', '2nd Year', '3rd Year', '4th Year'],
    },
    batchYear: {
      type: String,
      trim: true,
      // e.g., "2024", "2025" - for future AI roommate matching
    },
    gender: {
      type: String,
      enum: ['Boys', 'Girls'],
      required: true,
    },
    room: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Room',
    },
    // Room allocation status
    roomAllocationStatus: {
      type: String,
      enum: ['none', 'pending_payment', 'confirmed'],
      default: 'none',
    },
    // Onboarding status for multi-stage workflow
    onboardingStatus: {
      type: String,
      enum: ['pending', 'matching', 'roommate_confirmed', 'room_selected', 'payment_pending', 'confirmed'],
      default: 'pending',
    },
    // Payment status (individual per student)
    paymentStatus: {
      type: String,
      enum: ['NOT_STARTED', 'PAYMENT_PENDING', 'PAID', 'FAILED'],
      default: 'NOT_STARTED',
    },
    // Amount to pay (per student, NOT shared)
    amountToPay: {
      type: Number,
      default: 0,
      min: 0,
    },
    // Reference to roommate group (if student is in a group)
    roommateGroup: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'RoommateGroup',
      default: null,
    },
    // Selected room type for roommate matching (Single, Double, Triple, Quad)
    selectedRoomType: {
      type: String,
      enum: ['Single', 'Double', 'Triple', 'Quad'],
      default: null,
    },
    // Preferred roommates (siblings, best friends) - prioritized over AI matching
    preferredRoommates: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Student',
      },
    ],
    // Temporary room allocation (before payment confirmation)
    temporaryRoom: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Room',
    },
    // Room allocation date
    roomAllocatedAt: {
      type: Date,
    },
    // Room confirmed date (after payment)
    roomConfirmedAt: {
      type: Date,
    },
    // Personality attributes for future AI roommate matching (optional now)
    personalityAttributes: {
      sleepingHabits: {
        type: String,
        enum: ['early', 'late', null],
        default: null,
      },
      studyPreference: {
        type: String,
        enum: ['quiet', 'music', null],
        default: null,
      },
      cleanlinessLevel: {
        type: String,
        enum: ['low', 'medium', 'high', null],
        default: null,
      },
      sociability: {
        type: String,
        enum: ['introvert', 'ambivert', 'extrovert', null],
        default: null,
      },
      acFanPreference: {
        type: String,
        enum: ['ac', 'fan', 'both', null],
        default: null,
      },
      noiseTolerance: {
        type: String,
        enum: ['low', 'medium', 'high', null],
        default: null,
      },
    },
    // AI Matching Preferences (for future AI roommate matching)
    aiPreferences: {
      sleepSchedule: {
        type: String,
        trim: true,
        default: null,
      },
      cleanliness: {
        type: Number,
        min: 1,
        max: 10,
        default: null,
      },
      studyHabits: {
        type: String,
        trim: true,
        default: null,
      },
      noiseTolerance: {
        type: Number,
        min: 1,
        max: 10,
        default: null,
      },
      lifestyle: {
        type: String,
        trim: true,
        default: null,
      },
    },
    emergencyContact: {
      name: String,
      phone: String,
      relation: String,
    },
    status: {
      type: String,
      enum: ['active', 'graduated', 'suspended'],
      default: 'active',
    },
  },
  {
    timestamps: true,
  }
);

const Student = mongoose.model('Student', studentSchema);

export default Student;
