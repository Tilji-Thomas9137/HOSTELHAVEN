import QRCode from 'qrcode';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Generate QR code for a room
 * @param {String} roomId - Room ID
 * @param {String} roomNumber - Room number
 * @returns {Promise<String>} - Base64 encoded QR code image or file path
 */
export const generateRoomQRCode = async (roomId, roomNumber) => {
  try {
    // Create QR code data - can include room info or link
    const qrData = JSON.stringify({
      roomId,
      roomNumber,
      type: 'hostel_room',
      timestamp: new Date().toISOString(),
    });

    // Generate QR code as base64
    const qrCodeBase64 = await QRCode.toDataURL(qrData, {
      errorCorrectionLevel: 'M',
      type: 'image/png',
      width: 300,
      margin: 2,
    });

    return qrCodeBase64;
  } catch (error) {
    console.error('Error generating QR code:', error);
    throw error;
  }
};

/**
 * Generate QR code and save to file (optional)
 */
export const generateAndSaveQRCode = async (roomId, roomNumber) => {
  try {
    const qrData = JSON.stringify({
      roomId,
      roomNumber,
      type: 'hostel_room',
      timestamp: new Date().toISOString(),
    });

    // Ensure uploads directory exists
    const uploadsDir = path.join(__dirname, '../uploads/qrcodes');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    const filePath = path.join(uploadsDir, `room-${roomId}.png`);
    
    await QRCode.toFile(filePath, qrData, {
      errorCorrectionLevel: 'M',
      width: 300,
      margin: 2,
    });

    return `/uploads/qrcodes/room-${roomId}.png`;
  } catch (error) {
    console.error('Error generating and saving QR code:', error);
    throw error;
  }
};

/**
 * Generate QR code for outpass request
 * @param {String} outpassId - Outpass request ID
 * @param {String} studentId - Student ID
 * @param {String} studentName - Student name
 * @returns {Promise<Object>} - Object with qrCode (base64) and qrCodeData (JSON string)
 */
export const generateOutpassQRCode = async (outpassId, studentId, studentName) => {
  try {
    // Create QR code data
    const qrData = {
      outpassId,
      studentId,
      studentName,
      type: 'outpass',
      timestamp: new Date().toISOString(),
    };

    const qrDataString = JSON.stringify(qrData);

    // Generate QR code as base64
    const qrCodeBase64 = await QRCode.toDataURL(qrDataString, {
      errorCorrectionLevel: 'M',
      type: 'image/png',
      width: 300,
      margin: 2,
    });

    return {
      qrCode: qrCodeBase64,
      qrCodeData: qrDataString,
    };
  } catch (error) {
    console.error('Error generating outpass QR code:', error);
    throw error;
  }
};

