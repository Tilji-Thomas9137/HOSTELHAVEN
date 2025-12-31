import mongoose from 'mongoose';

const complaintSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      required: true,
    },
    room: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Room',
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    category: {
      type: String,
      enum: [
        'room_furniture',   // Room/Furniture
        'electrical',       // Electrical
        'water_plumbing',  // Water/Plumbing
        'cleanliness',     // Cleanliness
        'internet_wifi',   // Internet/Wi-Fi
        'security',        // Security
        'other'            // Others
      ],
      required: true,
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'urgent'],
      required: true,
    },
    status: {
      type: String,
      enum: ['requested', 'resolved'],
      default: 'requested',
    },
    // Store student identity metadata for visibility
    studentIdentity: {
      name: String,
      admissionNumber: String,
      registerNumber: String, // Same as admissionNumber, kept for clarity
      course: String,
      year: String, // Course year (1st Year, 2nd Year, etc.)
      department: String,
      hostelName: String, // Hostel name (from room block/building)
      roomNumber: String,
      phone: String,
      email: String,
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Staff',
    },
    resolvedAt: {
      type: Date,
      default: null,
    },
    resolvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    resolutionNotes: {
      type: String,
      trim: true,
    },
    attachments: [
      {
        url: String,
        filename: String,
      },
    ],
  },
  {
    timestamps: true,
  }
);

complaintSchema.index({ student: 1, status: 1 });
complaintSchema.index({ assignedTo: 1, status: 1 });
complaintSchema.index({ priority: 1, status: 1 });

const Complaint = mongoose.model('Complaint', complaintSchema);

export default Complaint;

