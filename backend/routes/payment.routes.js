import express from 'express';
import Payment from '../models/Payment.model.js';
import { protect } from '../middleware/auth.middleware.js';

const router = express.Router();

// @route   GET /api/payments
// @desc    Get all payments
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const payments = await Payment.find()
      .populate('student', 'name email studentId')
      .populate('booking')
      .sort({ createdAt: -1 });
    res.json(payments);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/payments/:id
// @desc    Get single payment
// @access  Private
router.get('/:id', protect, async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id)
      .populate('student')
      .populate('booking');
    if (!payment) {
      return res.status(404).json({ message: 'Payment not found' });
    }
    res.json(payment);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   POST /api/payments
// @desc    Create new payment
// @access  Private
router.post('/', protect, async (req, res) => {
  try {
    const payment = await Payment.create(req.body);
    const populatedPayment = await Payment.findById(payment._id)
      .populate('student')
      .populate('booking');
    res.status(201).json(populatedPayment);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   PUT /api/payments/:id
// @desc    Update payment
// @access  Private
router.put('/:id', protect, async (req, res) => {
  try {
    const payment = await Payment.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    })
      .populate('student')
      .populate('booking');

    if (!payment) {
      return res.status(404).json({ message: 'Payment not found' });
    }
    res.json(payment);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/payments/student/:studentId
// @desc    Get payments by student
// @access  Private
router.get('/student/:studentId', protect, async (req, res) => {
  try {
    const payments = await Payment.find({ student: req.params.studentId })
      .populate('booking')
      .sort({ createdAt: -1 });
    res.json(payments);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

export default router;
