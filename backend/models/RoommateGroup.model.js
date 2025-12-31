import mongoose from 'mongoose';

const roommateGroupSchema = new mongoose.Schema(
  {
    // Group members (array of student IDs)
    members: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Student',
        required: true,
      },
    ],
    // Group leader (who created the group and can select room)
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      required: true,
    },
    // Group status
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'cancelled', 'room_selected', 'payment_pending'],
      default: 'pending',
    },
    // Selected room (null initially, set when group selects a room)
    selectedRoom: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Room',
      default: null,
    },
    // Room selection timestamp
    roomSelectedAt: {
      type: Date,
    },
    // Payment confirmation timestamp
    paymentConfirmedAt: {
      type: Date,
    },
    // Cancellation reason (if cancelled)
    cancellationReason: {
      type: String,
      trim: true,
      maxLength: 500,
    },
    // AI matching metadata (optional)
    aiMatchingScore: {
      type: Number,
      min: 0,
      max: 100,
    },
    // Group formation method
    formationMethod: {
      type: String,
      enum: ['ai_matched', 'manual', 'mixed'],
      default: 'manual',
    },
    // Room type for this group (Double, Triple, Quad)
    roomType: {
      type: String,
      enum: ['Double', 'Triple', 'Quad'],
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for efficient queries
roommateGroupSchema.index({ members: 1 });
roommateGroupSchema.index({ createdBy: 1 });
roommateGroupSchema.index({ status: 1 });
roommateGroupSchema.index({ selectedRoom: 1 });

// Compound index to find active groups for a student
roommateGroupSchema.index(
  { members: 1, status: 1 },
  { 
    partialFilterExpression: { 
      status: { $in: ['pending', 'confirmed', 'room_selected', 'payment_pending'] } 
    } 
  }
);

// Virtual to get group size
roommateGroupSchema.virtual('groupSize').get(function () {
  return this.members.length;
});

// Virtual to check if group is confirmed
roommateGroupSchema.virtual('isConfirmed').get(function () {
  return this.status === 'confirmed' || this.status === 'room_selected' || this.status === 'payment_pending';
});

// Virtual to check if room is selected
roommateGroupSchema.virtual('hasSelectedRoom').get(function () {
  return !!this.selectedRoom;
});

// Pre-save middleware to validate / auto-fix group invariants
roommateGroupSchema.pre('save', async function (next) {
  // Ensure createdBy is in members array (auto-fix instead of throwing)
  if (this.createdBy) {
    const creatorId = this.createdBy._id ? this.createdBy._id.toString() : this.createdBy.toString();
    const memberIds = this.members.map(m => (m._id ? m._id.toString() : m.toString()));
    if (!memberIds.includes(creatorId)) {
      this.members.push(this.createdBy._id || this.createdBy);
    }
  }

  // Validate group size (minimum 1, maximum based on room capacity)
  if (this.members.length < 1) {
    return next(new Error('Group must have at least one member'));
  }

  // If room is selected, validate capacity
  if (this.selectedRoom && this.status === 'room_selected') {
    const Room = mongoose.model('Room');
    const room = await Room.findById(this.selectedRoom);
    if (room && this.members.length > room.capacity) {
      return next(new Error('Group size exceeds room capacity'));
    }
  }

  next();
});

// Method to check if student is in group
roommateGroupSchema.methods.isMember = function (studentId) {
  return this.members.some(memberId => memberId.toString() === studentId.toString());
};

// Method to check if student is leader
roommateGroupSchema.methods.isLeader = function (studentId) {
  return this.createdBy.toString() === studentId.toString();
};

// Method to add member (only if pending)
roommateGroupSchema.methods.addMember = async function (studentId) {
  if (this.status !== 'pending') {
    throw new Error('Cannot add members to a non-pending group');
  }
  if (this.isMember(studentId)) {
    throw new Error('Student is already a member of this group');
  }
  this.members.push(studentId);
  await this.save();
};

// Method to confirm group (all members accepted)
roommateGroupSchema.methods.confirm = async function () {
  if (this.status !== 'pending') {
    throw new Error('Group is not in pending status');
  }
  this.status = 'confirmed';
  await this.save();
};

// Method to cancel group
roommateGroupSchema.methods.cancel = async function (reason) {
  if (this.status === 'cancelled') {
    return; // Already cancelled
  }
  this.status = 'cancelled';
  this.cancellationReason = reason || 'Group cancelled';
  this.selectedRoom = null;
  await this.save();
};

// Method to select room (only leader can call)
roommateGroupSchema.methods.selectRoom = async function (roomId, leaderId) {
  if (!this.isLeader(leaderId)) {
    throw new Error('Only group leader can select room');
  }
  if (this.status !== 'confirmed') {
    throw new Error('Group must be confirmed before selecting room');
  }
  if (this.selectedRoom) {
    throw new Error('Room already selected for this group');
  }

  const Room = mongoose.model('Room');
  const room = await Room.findById(roomId);
  
  if (!room) {
    throw new Error('Room not found');
  }
  if (room.capacity < this.members.length) {
    throw new Error('Room capacity is less than group size');
  }
  if (room.status !== 'available' && room.status !== 'reserved') {
    throw new Error('Room is not available for selection');
  }
  if (room.maintenanceStatus === 'under_maintenance' || room.maintenanceStatus === 'blocked') {
    throw new Error('Room is under maintenance');
  }

  this.selectedRoom = roomId;
  this.status = 'room_selected';
  this.roomSelectedAt = new Date();
  await this.save();
};

// Static method to find active groups for a student
roommateGroupSchema.statics.findActiveGroupsForStudent = function (studentId) {
  return this.find({
    members: studentId,
    status: { $in: ['pending', 'confirmed', 'room_selected', 'payment_pending'] }
  }).populate('members', 'name studentId email course year gender')
    .populate('createdBy', 'name studentId')
    .populate('selectedRoom', 'roomNumber floor block capacity roomType amenities totalPrice status');
};

// Static method to find confirmed groups ready for room selection
roommateGroupSchema.statics.findConfirmedGroups = function () {
  return this.find({
    status: 'confirmed',
    selectedRoom: null
  }).populate('members', 'name studentId email course year gender')
    .populate('createdBy', 'name studentId');
};

roommateGroupSchema.set('toJSON', { virtuals: true });

const RoommateGroup = mongoose.model('RoommateGroup', roommateGroupSchema);

export default RoommateGroup;

