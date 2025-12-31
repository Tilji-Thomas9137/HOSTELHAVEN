import mongoose from 'mongoose';

const dailyMealSchema = new mongoose.Schema(
  {
    date: {
      type: Date,
      required: true,
    },
    dayOfWeek: {
      type: String,
      enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
      required: true,
    },
    breakfast: {
      type: String,
      required: true,
      trim: true,
    },
    lunch: {
      type: String,
      required: true,
      trim: true,
    },
    dinner: {
      type: String,
      required: true,
      trim: true,
    },
    // Track if meal was from a student suggestion
    fromSuggestion: {
      breakfast: {
        suggestionId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'MealSuggestion',
        },
        studentName: String,
      },
      lunch: {
        suggestionId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'MealSuggestion',
        },
        studentName: String,
      },
      dinner: {
        suggestionId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'MealSuggestion',
        },
        studentName: String,
      },
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

// Index for efficient queries
dailyMealSchema.index({ date: 1 }, { unique: true });
dailyMealSchema.index({ dayOfWeek: 1 });

const DailyMeal = mongoose.model('DailyMeal', dailyMealSchema);

export default DailyMeal;

