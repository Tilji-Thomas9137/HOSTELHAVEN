# HostelHaven - Smart Hostel Management System

A comprehensive hostel management system built with MERN stack (MongoDB, Express, React, Node.js).

## Features

- 🏠 **Dashboard** - Overview of hostel statistics and key metrics
- 👥 **Student Management** - Manage student information and profiles
- 🚪 **Room Management** - Track room availability, capacity, and amenities
- 📅 **Booking Management** - Handle room bookings, allocations, and check-ins/check-outs
- 💰 **Payment Management** - Track rent, deposits, fees, and generate receipts
- 📊 **Reports** - Generate comprehensive reports and analytics
- ⚙️ **Settings** - Configure system settings and preferences

## Tech Stack

### Frontend
- React 19
- Vite
- Material UI v7
- React Router DOM
- React Hook Form
- SWR for data fetching

### Backend
- Node.js
- Express.js
- MongoDB with Mongoose
- JWT Authentication
- bcryptjs for password hashing

## Prerequisites

- Node.js (v18 or higher)
- MongoDB (local installation or MongoDB Atlas)
- npm or yarn

## Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd saasable-ui
   ```

2. **Install all dependencies**
   ```bash
   npm run install-all
   ```
   
   Or install separately:
   ```bash
   # Install backend dependencies
   cd backend
   npm install
   
   # Install frontend dependencies
   cd ../admin/vite
npm install
```

3. **Set up environment variables**

   Backend (create `backend/.env`):
   ```env
   PORT=5000
   NODE_ENV=development
   MONGODB_URI=mongodb://localhost:27017/hostelhaven
   JWT_SECRET=your_super_secret_jwt_key
   ```

   Frontend (create `admin/vite/.env`):
   ```env
   VITE_APP_BASE_URL=/
   VITE_API_URL=/
   ```

4. **Start MongoDB**
   - If using local MongoDB, make sure the MongoDB service is running
   - Or use MongoDB Atlas and update the `MONGODB_URI` in `.env`

## Running the Application

### Option 1: Run Both Frontend and Backend Together
```bash
npm run dev
```
This will start both the backend (port 5000) and frontend (port 3000) concurrently.

### Option 2: Run Separately

**Backend:**
```bash
cd backend
npm run dev
```
Backend will run on http://localhost:5000

**Frontend:**
```bash
cd admin/vite
npm start
```
Frontend will run on http://localhost:3000

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

## Project Structure

```
├── backend/
│   ├── config/
│   │   └── db.js              # MongoDB connection
│   ├── middleware/
│   │   └── auth.middleware.js # Authentication middleware
│   ├── models/
│   │   ├── User.model.js      # User model
│   │   ├── Student.model.js   # Student model
│   │   ├── Room.model.js      # Room model
│   │   ├── Booking.model.js   # Booking model
│   │   └── Payment.model.js   # Payment model
│   ├── routes/
│   │   ├── auth.routes.js     # Authentication routes
│   │   ├── student.routes.js  # Student routes
│   │   ├── room.routes.js     # Room routes
│   │   ├── booking.routes.js  # Booking routes
│   │   └── payment.routes.js  # Payment routes
│   └── server.js              # Express server
│
├── admin/
│   └── vite/
│       ├── src/
│       │   ├── components/    # Reusable components
│       │   ├── views/         # Page components
│       │   ├── routes/        # Route configuration
│       │   ├── menu/          # Menu configuration
│       │   └── ...
│       └── package.json
│
└── package.json               # Root package.json for running both
```

## Default Login

After setting up, you can register a new admin user via the registration endpoint or create one manually in the database.

## Development

- Backend uses nodemon for auto-reloading
- Frontend uses Vite for fast HMR (Hot Module Replacement)
- Both run concurrently with `npm run dev`

## License

MIT License

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
