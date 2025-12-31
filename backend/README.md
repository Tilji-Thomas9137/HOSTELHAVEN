# HostelHaven Backend API

Backend server for HostelHaven - Smart Hostel Management System

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create a `.env` file based on `.env.example`:
```bash
cp .env.example .env
```

3. Update the `.env` file with your MongoDB connection string and JWT secret.

4. Make sure MongoDB is running on your system or use MongoDB Atlas.

5. Start the server:
```bash
# Development mode (with nodemon)
npm run dev

# Production mode
npm start
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login user

### Students
- `GET /api/students` - Get all students
- `GET /api/students/:id` - Get single student
- `POST /api/students` - Create new student
- `PUT /api/students/:id` - Update student
- `DELETE /api/students/:id` - Delete student

### Rooms
- `GET /api/rooms` - Get all rooms
- `GET /api/rooms/:id` - Get single room
- `POST /api/rooms` - Create new room
- `PUT /api/rooms/:id` - Update room
- `DELETE /api/rooms/:id` - Delete room
- `GET /api/rooms/available/list` - Get available rooms

### Bookings
- `GET /api/bookings` - Get all bookings
- `GET /api/bookings/:id` - Get single booking
- `POST /api/bookings` - Create new booking
- `PUT /api/bookings/:id` - Update booking
- `DELETE /api/bookings/:id` - Delete booking

### Payments
- `GET /api/payments` - Get all payments
- `GET /api/payments/:id` - Get single payment
- `POST /api/payments` - Create new payment
- `PUT /api/payments/:id` - Update payment
- `GET /api/payments/student/:studentId` - Get payments by student

## Models

- **User** - Admin/Warden/Staff accounts
- **Student** - Student information
- **Room** - Room details and availability
- **Booking** - Room bookings and allocations
- **Payment** - Payment records

## Authentication

Most endpoints require authentication. Include the JWT token in the Authorization header:
```
Authorization: Bearer <your_jwt_token>
```
