import { verifyAccessToken } from '../utils/jwt.js';
import User from '../models/User.model.js';
import Student from '../models/Student.model.js';

/**
 * Protect routes - Verify JWT token
 */
export const protect = async (req, res, next) => {
  try {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({ message: 'Not authorized, no token provided' });
    }

    try {
      const decoded = verifyAccessToken(token);
      const user = await User.findById(decoded.id).select('-password -refreshToken');
      
      if (!user) {
        return res.status(401).json({ message: 'User not found' });
      }

      if (!user.isActive) {
        return res.status(401).json({ message: 'Account is inactive' });
      }

      // Check if student is suspended or graduated (for student role only)
      if (user.role === 'student') {
        const student = await Student.findOne({ user: user._id });
        
        if (student) {
          if (student.status === 'suspended') {
            return res.status(403).json({ 
              message: 'Your account has been suspended. Please contact the administrator for more information.' 
            });
          }
          if (student.status === 'graduated') {
            return res.status(403).json({ 
              message: 'You have graduated. You have vacated from the hostel.' 
            });
          }
        }
      }

      req.user = user;
      next();
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({ message: 'Token expired, please login again' });
      }
      return res.status(401).json({ message: 'Not authorized, invalid token' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

/**
 * Role-Based Access Control (RBAC)
 * @param {...string} roles - Allowed roles
 */
export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        message: `Access denied. Required roles: ${roles.join(', ')}` 
      });
    }

    next();
  };
};

/**
 * Check if user owns the resource or is admin
 * @param {string} userIdField - Field name in req that contains user ID to check
 */
export const checkOwnership = (userIdField = 'userId') => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    // Admin can access all resources
    if (req.user.role === 'admin') {
      return next();
    }

    // Check if user owns the resource
    const resourceUserId = req.params[userIdField] || req.body[userIdField] || req.query[userIdField];
    
    if (resourceUserId && resourceUserId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied. You can only access your own resources' });
    }

    next();
  };
};

/**
 * Optional authentication - doesn't fail if no token
 */
export const optionalAuth = async (req, res, next) => {
  try {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (token) {
      try {
        const decoded = verifyAccessToken(token);
        const user = await User.findById(decoded.id).select('-password -refreshToken');
        
        if (user && user.isActive) {
          req.user = user;
        }
      } catch (error) {
        // Ignore token errors for optional auth
      }
    }

    next();
  } catch (error) {
    next();
  }
};

/**
 * Check if student has room allocated
 * Blocks access to features if room is not allocated
 */
export const requireRoomAllocation = async (req, res, next) => {
  try {
    if (!req.user || req.user.role !== 'student') {
      return res.status(403).json({ message: 'Access denied. Student role required.' });
    }

    const student = await Student.findOne({ user: req.user._id });
    
    if (!student) {
      return res.status(404).json({ message: 'Student profile not found' });
    }

    // Allow access if student has room or temporaryRoom (payment pending)
    if (!student.room && !student.temporaryRoom) {
      return res.status(403).json({ 
        message: 'You can access this feature after your room is allocated.' 
      });
    }

    req.student = student;
    next();
  } catch (error) {
    console.error('Room allocation check error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
