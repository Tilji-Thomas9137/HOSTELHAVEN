import express from 'express';
import Booking from '../models/Booking.model.js';
import Room from '../models/Room.model.js';
import Student from '../models/Student.model.js';
import { protect } from '../middleware/auth.middleware.js';

const router = express.Router();

// @route   GET /api/bookings
// @desc    Get all bookings
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const bookings = await Booking.find()
      .populate('student', 'name email phone studentId')
      .populate('room', 'roomNumber floor capacity')
      .sort({ createdAt: -1 });
    res.json(bookings);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/bookings/:id
// @desc    Get single booking
// @access  Private
router.get('/:id', protect, async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate('student')
      .populate('room');
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }
    res.json(booking);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   POST /api/bookings
// @desc    Create new booking
// @access  Private
router.post('/', protect, async (req, res) => {
  try {
    const { student, room, checkIn, monthlyRent, deposit } = req.body;

    // Check if room exists and is available
    const roomData = await Room.findById(room);
    if (!roomData) {
      return res.status(404).json({ message: 'Room not found' });
    }

    if (roomData.isFull) {
      return res.status(400).json({ message: 'Room is full' });
    }

    // Create booking
    const booking = await Booking.create(req.body);

    // Update room occupied count
    await Room.findByIdAndUpdate(room, { $inc: { occupied: 1 } });

    // Update student room assignment
    await Student.findByIdAndUpdate(student, { room: room });

    res.status(201).json(booking);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   PUT /api/bookings/:id
// @desc    Update booking
// @access  Private
router.put('/:id', protect, async (req, res) => {
  try {
    const booking = await Booking.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    }).populate('student').populate('room');

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    res.json(booking);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   DELETE /api/bookings/:id
// @desc    Delete booking
// @access  Private
router.delete('/:id', protect, async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    // Update room occupied count
    await Room.findByIdAndUpdate(booking.room, { $inc: { occupied: -1 } });

    // Remove room assignment from student
    await Student.findByIdAndUpdate(booking.student, { $unset: { room: 1 } });

    await Booking.findByIdAndDelete(req.params.id);

    res.json({ message: 'Booking deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

export default router;
