import mongoose from 'mongoose';

const mealSuggestionSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      required: true,
    },
    mealSlot: {
      type: String,
      enum: ['breakfast', 'lunch', 'dinner'],
      required: true,
    },
    suggestion: {
      type: String,
      required: true,
      trim: true,
    },
    status: {
      type: String,
      enum: ['pending', 'reviewed', 'implemented', 'rejected'],
      default: 'pending',
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    reviewedAt: {
      type: Date,
    },
    reviewNotes: {
      type: String,
      trim: true,
    },
    // When suggestion was implemented
    implementedAt: {
      type: Date,
    },
    // Which date the meal was added to
    implementedForDate: {
      type: Date,
    },
    // Store student identity for visibility
    studentIdentity: {
      name: String,
      admissionNumber: String,
      course: String,
      batchYear: String,
      roomNumber: String,
    },
  },
  {
    timestamps: true,
  }
);

// Index for efficient queries
mealSuggestionSchema.index({ student: 1, createdAt: -1 });
mealSuggestionSchema.index({ mealSlot: 1, status: 1 });
mealSuggestionSchema.index({ status: 1, createdAt: -1 });

const MealSuggestion = mongoose.model('MealSuggestion', mealSuggestionSchema);

export default MealSuggestion;

