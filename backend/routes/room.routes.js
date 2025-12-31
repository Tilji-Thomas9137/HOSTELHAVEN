import express from 'express';
import Room from '../models/Room.model.js';
import { protect } from '../middleware/auth.middleware.js';

const router = express.Router();

// @route   GET /api/rooms
// @desc    Get all rooms
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const rooms = await Room.find().sort({ floor: 1, roomNumber: 1 });
    res.json(rooms);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/rooms/:id
// @desc    Get single room
// @access  Private
router.get('/:id', protect, async (req, res) => {
  try {
    const room = await Room.findById(req.params.id);
    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }
    res.json(room);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   POST /api/rooms
// @desc    Create new room
// @access  Private
router.post('/', protect, async (req, res) => {
  try {
    const room = await Room.create(req.body);
    res.status(201).json(room);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   PUT /api/rooms/:id
// @desc    Update room
// @access  Private
router.put('/:id', protect, async (req, res) => {
  try {
    const room = await Room.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }
    res.json(room);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   DELETE /api/rooms/:id
// @desc    Delete room
// @access  Private
router.delete('/:id', protect, async (req, res) => {
  try {
    const room = await Room.findByIdAndDelete(req.params.id);
    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }
    res.json({ message: 'Room deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/rooms/available/list
// @desc    Get available rooms
// @access  Private
router.get('/available/list', protect, async (req, res) => {
  try {
    const rooms = await Room.find({ status: 'available' }).sort({ floor: 1, roomNumber: 1 });
    const availableRooms = rooms.filter((room) => !room.isFull);
    res.json(availableRooms);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

export default router;
