import mongoose from 'mongoose';

const roomSchema = new mongoose.Schema(
  {
    roomNumber: {
      type: String,
      required: true,
      trim: true,
    },
    block: {
      type: String,
      trim: true,
    },
    floor: {
      type: Number,
      required: true,
      min: 0,
      max: 8,
    },
    roomType: {
      type: String,
      enum: ['Single', 'Double', 'Triple', 'Quad'],
      required: true,
    },
    gender: {
      type: String,
      enum: ['Boys', 'Girls'],
      required: true,
    },
    capacity: {
      type: Number,
      required: true,
      min: 1,
      max: 6,
    },
    currentOccupancy: {
      type: Number,
      default: 0,
      min: 0,
    },
    occupants: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Student',
      },
    ],
    // Amenities as object with pricing
    amenities: {
      ac: { type: Boolean, default: false },
      attachedBathroom: { type: Boolean, default: false },
      geyser: { type: Boolean, default: false },
      wifi: { type: Boolean, default: false },
      extraFurniture: { type: Boolean, default: false },
      fanCount: { type: Number, default: 0, min: 0, max: 5 },
    },
    // Pricing (PER STUDENT - NOT SHARED)
    // IMPORTANT: Each student pays the FULL basePrice + amenitiesPrice
    // Example: Double room ₹30,000 means EACH student pays ₹30,000, NOT ₹15,000 each
    basePrice: {
      type: Number,
      required: true,
      min: 0,
      // Single: 40000, Double: 30000, Triple: 25000, Quad: 20000
    },
    amenitiesPrice: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalPrice: {
      type: Number,
      required: true,
      min: 0,
      // totalPrice = basePrice + amenitiesPrice (PER STUDENT)
    },
    // Status and maintenance
    status: {
      type: String,
      enum: ['available', 'occupied', 'maintenance', 'reserved', 'blocked'],
      default: 'available',
    },
    maintenanceStatus: {
      type: String,
      enum: ['none', 'under_maintenance', 'blocked'],
      default: 'none',
    },
    // Images
    photos: [
      {
        type: String, // URLs or base64
      },
    ],
    // QR Code
    qrCode: {
      type: String, // Base64 or file path
    },
    // AI Roommate Matching Tags
    aiTags: {
      noiseTolerance: {
        type: String,
        enum: ['low', 'medium', 'high', null],
        default: null,
      },
      cleanlinessExpectations: {
        type: String,
        enum: ['low', 'medium', 'high', null],
        default: null,
      },
      studyHabits: {
        type: String,
        enum: ['quiet', 'moderate', 'social', null],
        default: null,
      },
    },
    // Room change flag
    allowRoomChanges: {
      type: Boolean,
      default: true,
    },
    // Legacy fields for backward compatibility
    building: {
      type: String,
      trim: true,
    },
    occupied: {
      type: Number,
      default: 0,
      min: 0,
    },
    rent: {
      type: Number,
    },
  },
  {
    timestamps: true,
  }
);

// Virtual to check if room is full
roomSchema.virtual('isFull').get(function () {
  return this.currentOccupancy >= this.capacity;
});

// Virtual for available slots
roomSchema.virtual('availableSlots').get(function () {
  return Math.max(0, this.capacity - this.currentOccupancy);
});

// Virtual to check if room is available for allocation
roomSchema.virtual('isAvailableForAllocation').get(function () {
  return (
    this.status === 'available' &&
    this.maintenanceStatus === 'none' &&
    this.currentOccupancy < this.capacity
  );
});

// Pre-save middleware to sync occupied with currentOccupancy for backward compatibility
// and normalize block value (null/undefined -> empty string)
roomSchema.pre('save', function (next) {
  // Normalize block: treat null/undefined as empty string for consistency
  if (this.block === null || this.block === undefined) {
    this.block = '';
  } else if (typeof this.block === 'string') {
    this.block = this.block.trim();
  }
  
  // Sync legacy fields
  if (this.isModified('currentOccupancy')) {
    this.occupied = this.currentOccupancy;
  }
  if (this.isModified('totalPrice') && !this.rent) {
    this.rent = this.totalPrice; // Sync rent with totalPrice for backward compatibility
  }
  if (this.isModified('block') && !this.building) {
    this.building = this.block; // Sync building with block for backward compatibility
  }
  next();
});

roomSchema.set('toJSON', { virtuals: true });

// Compound unique index: roomNumber + block + gender combination must be unique
// This allows same room number in different blocks OR different genders in same block
roomSchema.index({ roomNumber: 1, block: 1, gender: 1 }, { unique: true });

const Room = mongoose.model('Room', roomSchema);

// Drop old roomNumber_1 index if it exists (one-time migration)
// This runs when the model is first loaded
Room.collection.getIndexes().then(indexes => {
  if (indexes.roomNumber_1) {
    console.log('⚠️  Found old roomNumber_1 index. Dropping it...');
    Room.collection.dropIndex('roomNumber_1')
      .then(() => {
        console.log('✓ Successfully dropped old roomNumber_1 index');
      })
      .catch(err => {
        if (err.code !== 27 && err.codeName !== 'IndexNotFound') {
          console.error('Error dropping old index:', err);
        }
      });
  }
}).catch(err => {
  // Ignore errors during index check (collection might not exist yet)
});

export default Room;
