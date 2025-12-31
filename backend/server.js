import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import session from 'express-session';

// Load environment variables FIRST, before importing passport
dotenv.config();

import connectDB from './config/db.js';
import passport, { initializeOAuthStrategies } from './config/passport.js';

// Auth routes
import authRoutes from './routes/auth.routes.js';

// Role-based routes
import adminRoutes from './routes/admin.routes.js';
import studentRoutes from './routes/student.routes.js';
import staffRoutes from './routes/staff.routes.js';
import parentRoutes from './routes/parent.routes.js';

// Legacy routes (if needed)
import roomRoutes from './routes/room.routes.js';
import bookingRoutes from './routes/booking.routes.js';
import paymentRoutes from './routes/payment.routes.js';

const app = express();
const PORT = process.env.PORT || 5000;

// Connect to MongoDB
connectDB();

// Initialize scheduled tasks (mess fee generation)
import('./utils/scheduler.js').then(({ initializeScheduler }) => {
  initializeScheduler();
}).catch((error) => {
  console.error('Error initializing scheduler:', error);
});

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
}));
app.use(express.json({ limit: '10mb' })); // Increase limit for base64 images
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Session configuration for OAuth
app.use(
  session({
    secret: process.env.SESSION_SECRET || 'your-secret-key-change-in-production',
    resave: false,
    saveUninitialized: false,
  })
);

// Initialize OAuth strategies (must be called after dotenv.config())
initializeOAuthStrategies();

// Initialize Passport
app.use(passport.initialize());
app.use(passport.session());

// Routes
// Auth routes (public)
app.use('/api/auth', authRoutes);

// Role-based routes (protected)
app.use('/api/admin', adminRoutes);
app.use('/api/student', studentRoutes);
app.use('/api/staff', staffRoutes);
app.use('/api/parent', parentRoutes);

// Legacy routes (for backward compatibility)
app.use('/api/students', studentRoutes);
app.use('/api/rooms', roomRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/payments', paymentRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'HostelHaven API is running' });
});

// Debug route to test student routes
app.get('/api/test/student-routes', (req, res) => {
  res.json({ 
    message: 'Student routes test endpoint',
    routes: [
      '/api/student/profile',
      '/api/student/room',
      '/api/student/rooms/available',
      '/api/student/rooms/requests',
      '/api/student/dashboard/stats'
    ]
  });
});

// 404 handler for undefined routes
app.use('/api/*', (req, res) => {
  console.log(`❌ 404 - Route not found: ${req.method} ${req.originalUrl}`);
  res.status(404).json({ 
    message: 'Route not found',
    method: req.method,
    path: req.originalUrl,
    availableRoutes: [
      '/api/health',
      '/api/auth/*',
      '/api/student/*',
      '/api/admin/*'
    ]
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('❌ Error:', err.message);
  console.error('Error stack:', err.stack);
  
  // If response was already sent, don't send another response
  if (res.headersSent) {
    return next(err);
  }
  
  // For OAuth routes, redirect to login page instead of JSON error
  if (req.path && req.path.includes('/auth/') && (req.path.includes('/google') || req.path.includes('/facebook'))) {
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    return res.redirect(`${frontendUrl}/auth/login?error=oauth_error&message=${encodeURIComponent('An error occurred during authentication. Please try again.')}`);
  }
  
  // Default error response
  const statusCode = err.statusCode || err.status || 500;
  res.status(statusCode).json({ 
    message: statusCode === 400 ? 'Bad Request' : 'Something went wrong!', 
    error: err.message 
  });
});

const server = app.listen(PORT, () => {
  console.log(`🚀 HostelHaven Backend Server running on port ${PORT}`);
  console.log(`📍 API endpoint: http://localhost:${PORT}/api`);
});

// Handle server errors
server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`❌ Port ${PORT} is already in use. Please stop the other process or use a different port.`);
    console.error(`💡 Tip: Run 'netstat -ano | findstr :${PORT}' to find the process using this port.`);
  } else {
    console.error('❌ Server error:', err);
  }
  process.exit(1);
});
