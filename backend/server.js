import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import session from 'express-session';

// Load environment variables FIRST
dotenv.config();

import connectDB from './config/db.js';
import passport, { initializeOAuthStrategies } from './config/passport.js';

// Routes
import authRoutes from './routes/auth.routes.js';
import adminRoutes from './routes/admin.routes.js';
import studentRoutes from './routes/student.routes.js';
import staffRoutes from './routes/staff.routes.js';
import parentRoutes from './routes/parent.routes.js';

// Legacy routes
import roomRoutes from './routes/room.routes.js';
import bookingRoutes from './routes/booking.routes.js';
import paymentRoutes from './routes/payment.routes.js';

const app = express();
const PORT = process.env.PORT || 5000;

/* -------------------- DATABASE -------------------- */
connectDB();

/* -------------------- SCHEDULER -------------------- */
import('./utils/scheduler.js')
  .then(({ initializeScheduler }) => initializeScheduler())
  .catch((err) => console.error('Scheduler error:', err));

/* -------------------- CORS (VERY IMPORTANT) -------------------- */
app.use(
  cors({
    origin: [
      'http://localhost:3000',
      'https://hostelhaven-fend.s3-website.eu-north-1.amazonaws.com',
      'http://hostelhaven-fend.s3-website.eu-north-1.amazonaws.com',
      'https://d37t6kanf6zu9x.cloudfront.net',
    ],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  })
);

/* -------------------- BODY PARSERS -------------------- */
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

/* -------------------- SESSION (FOR OAUTH) -------------------- */
app.use(
  session({
    secret: process.env.SESSION_SECRET || 'change-this-secret',
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: false, // true only if HTTPS
      sameSite: 'lax',
    },
  })
);

/* -------------------- PASSPORT -------------------- */
initializeOAuthStrategies();
app.use(passport.initialize());
app.use(passport.session());

/* -------------------- ROUTES -------------------- */

// Auth (public)
app.use('/api/auth', authRoutes);

// Role-based (protected inside routes)
app.use('/api/admin', adminRoutes);
app.use('/api/student', studentRoutes);
app.use('/api/staff', staffRoutes);
app.use('/api/parent', parentRoutes);

// Legacy
app.use('/api/students', studentRoutes);
app.use('/api/rooms', roomRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/payments', paymentRoutes);

/* -------------------- HEALTH CHECK -------------------- */
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'HostelHaven API is running',
  });
});

/* -------------------- TEST ROUTE -------------------- */
app.get('/api/test/student-routes', (req, res) => {
  res.json({
    message: 'Student routes working',
  });
});

/* -------------------- 404 HANDLER -------------------- */
app.use('/api/*', (req, res) => {
  res.status(404).json({
    message: 'Route not found',
    method: req.method,
    path: req.originalUrl,
  });
});

/* -------------------- ERROR HANDLER -------------------- */
app.use((err, req, res, next) => {
  console.error('❌ Error:', err.message);
  console.error(err.stack);

  if (res.headersSent) return next(err);

  res.status(err.statusCode || 500).json({
    message: err.message || 'Internal Server Error',
  });
});

/* -------------------- START SERVER -------------------- */
const server = app.listen(PORT, () => {
  console.log(`🚀 Backend running on port ${PORT}`);
  console.log(`🌐 API: http://localhost:${PORT}/api`);
});

/* -------------------- SERVER ERRORS -------------------- */
server.on('error', (err) => {
  console.error('Server error:', err);
  process.exit(1);
});
