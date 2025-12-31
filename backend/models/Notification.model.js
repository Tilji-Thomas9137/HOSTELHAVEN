import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    message: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      enum: ['payment', 'maintenance', 'attendance', 'complaint', 'outing', 'general', 'event', 'system', 'inventory', 'cleaning'],
      default: 'general',
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'urgent'],
      default: 'medium',
    },
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    recipientRole: {
      type: String,
      enum: ['admin', 'staff', 'student', 'parent', 'all'],
      default: 'all',
    },
    relatedEntity: {
      entityType: {
        type: String,
        enum: ['student', 'room', 'booking', 'payment', 'complaint', 'outing', 'mealSuggestion', 'roomChangeRequest', 'staffLeaveRequest', 'staff', 'staffSchedule', 'stockRequest', 'activity', 'cleaningRequest', 'inventoryRequest', null],
      },
      entityId: {
        type: mongoose.Schema.Types.ObjectId,
      },
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    readAt: {
      type: Date,
      default: null,
    },
    sentAt: {
      type: Date,
      default: Date.now,
    },
    expiresAt: {
      type: Date,
      default: null,
    },
    origin: {
      type: String,
      enum: ['admin', 'staff', 'student', 'system'],
      default: 'system',
    },
    studentDetails: {
      name: String,
      studentId: String,
      admissionNumber: String,
      course: String,
      batchYear: String,
      roomNumber: String,
      block: String,
    },
    parentDetails: {
      name: String,
      email: String,
    },
  },
  {
    timestamps: true,
  }
);

notificationSchema.index({ recipient: 1, isRead: 1, sentAt: -1 });
notificationSchema.index({ recipientRole: 1, sentAt: -1 });
notificationSchema.index({ 'relatedEntity.entityType': 1, 'relatedEntity.entityId': 1 });

const Notification = mongoose.model('Notification', notificationSchema);

export default Notification;

