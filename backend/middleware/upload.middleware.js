import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '../uploads/rooms');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `room-${uniqueSuffix}${path.extname(file.originalname)}`);
  },
});

// File filter - only images
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error('Only image files are allowed (jpeg, jpg, png, gif, webp)'));
  }
};

// Configure multer - make it optional for JSON requests
const multerConfig = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max file size
  },
  fileFilter: fileFilter,
});

// Middleware that handles both file uploads and JSON data
export const uploadRoomImages = (req, res, next) => {
  // Check if request has files (multipart/form-data)
  const contentType = req.headers['content-type'] || '';
  if (contentType.includes('multipart/form-data')) {
    // Use multer for file uploads
    multerConfig.array('photos', 3)(req, res, (err) => {
      if (err) {
        console.error('Multer error:', err);
        return res.status(400).json({ message: err.message });
      }
      next();
    });
  } else {
    // Skip multer for JSON requests - express.json() will handle the body
    // Multer would consume the body stream, so we skip it for JSON
    next();
  }
};

// Middleware to handle base64 images (alternative to file upload)
export const handleBase64Images = (req, res, next) => {
  // This middleware just passes through - photos are handled in the controller
  next();
};

