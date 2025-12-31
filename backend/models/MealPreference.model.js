import mongoose from 'mongoose';

const mealPreferenceSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      required: true,
      unique: true,
    },
    breakfast: {
      type: Boolean,
      default: true,
    },
    lunch: {
      type: Boolean,
      default: true,
    },
    dinner: {
      type: Boolean,
      default: true,
    },
    dietaryRestrictions: [
      {
        type: String,
        enum: ['vegetarian', 'vegan', 'halal', 'kosher', 'gluten_free', 'lactose_free', 'nut_allergy', 'other'],
      },
    ],
    allergies: [
      {
        type: String,
        trim: true,
      },
    ],
    preferences: {
      type: String,
      trim: true,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

const MealPreference = mongoose.model('MealPreference', mealPreferenceSchema);

export default MealPreference;

