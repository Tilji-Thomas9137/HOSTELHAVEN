import User from '../models/User.model.js';
import OTP from '../models/OTP.model.js';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from '../utils/jwt.js';
import { sendPasswordResetEmail } from '../services/mailService.js';
import crypto from 'crypto';

/**
 * Login user with username and password
 */
export const login = async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ message: 'Please provide username and password' });
    }

    // Normalize username input (trim and lowercase)
    const normalizedUsername = username.trim().toLowerCase();
    
    // Find user by username
    const user = await User.findOne({ username: normalizedUsername });

    if (!user) {
      console.log(`Login attempt failed: User not found for username: ${normalizedUsername}`);
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Check password
    if (!user.password) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      console.log(`Login attempt failed: Password mismatch for user: ${user.username} (ID: ${user._id})`);
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    
    console.log(`Login successful for user: ${user.username} (Role: ${user.role}, ID: ${user._id})`);

    // Check if account is active
    if (!user.isActive) {
      return res.status(401).json({ message: 'Account is inactive. Please contact administrator' });
    }

    // Check if student is suspended or graduated (for student role only)
    let studentName = user.name; // Default to user.name
    if (user.role === 'student') {
      const Student = (await import('../models/Student.model.js')).default;
      const student = await Student.findOne({ user: user._id });
      
      if (student) {
        // Use student name if available (student.name is more reliable)
        if (student.name) {
          studentName = student.name;
          // Also update user.name if it's different or empty
          if (!user.name || user.name !== student.name) {
            user.name = student.name;
          }
        }
        
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

    // Generate tokens
    const accessToken = generateAccessToken(user._id);
    const refreshToken = generateRefreshToken(user._id);

    // Save refresh token and updated name
    user.refreshToken = refreshToken;
    user.refreshTokenExpiry = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000); // 90 days
    user.lastLogin = new Date();
    await user.save();

    // Remove sensitive data
    const userData = {
      _id: user._id,
      name: studentName || user.name,
      username: user.username,
      email: user.email,
      role: user.role,
      phone: user.phone,
      profilePhoto: user.profilePhoto || null,
      firstLogin: user.firstLogin,
    };

    res.json({
      message: 'Login successful',
      user: userData,
      token: accessToken,
      refreshToken: refreshToken,
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

/**
 * Refresh access token
 */
export const refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({ message: 'Refresh token is required' });
    }

    try {
      const decoded = verifyRefreshToken(refreshToken);
      const user = await User.findById(decoded.id);

      if (!user) {
        return res.status(401).json({ message: 'User not found' });
      }

      // Verify refresh token matches
      if (user.refreshToken !== refreshToken) {
        return res.status(401).json({ message: 'Invalid refresh token' });
      }

      // Check if refresh token is expired
      if (user.refreshTokenExpiry && new Date() > user.refreshTokenExpiry) {
        return res.status(401).json({ message: 'Refresh token expired' });
      }

      // Generate new access token
      const accessToken = generateAccessToken(user._id);

      res.json({
        message: 'Token refreshed successfully',
        token: accessToken,
      });
    } catch (error) {
      return res.status(401).json({ message: 'Invalid or expired refresh token' });
    }
  } catch (error) {
    console.error('Refresh token error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

/**
 * Logout user
 */
export const logout = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    
    if (user) {
      user.refreshToken = null;
      user.refreshTokenExpiry = null;
      await user.save();
    }

    res.json({ message: 'Logout successful' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

/**
 * Get current user profile
 */
export const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password -refreshToken');
    
    // For students, ensure name is populated from Student model if user.name is missing
    if (user.role === 'student' && (!user.name || user.name.trim() === '')) {
      const Student = (await import('../models/Student.model.js')).default;
      const student = await Student.findOne({ user: user._id });
      
      if (student && student.name) {
        user.name = student.name;
        // Optionally save the updated name to User model
        await user.save();
      }
    }
    
    res.json(user);
  } catch (error) {
    console.error('Get me error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

/**
 * Forgot password - Send reset email
 */
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      // Don't reveal if user exists for security
      return res.json({ message: 'If email exists, password reset link has been sent' });
    }

    // Check if SMTP is configured
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
      console.error('❌ SMTP credentials not configured');
      return res.status(500).json({ 
        message: 'Email service is not configured. Please contact the administrator.',
        error: 'SMTP credentials missing'
      });
    }

    // Generate reset token
    const resetToken = user.generatePasswordResetToken();
    await user.save({ validateBeforeSave: false });

    // Send email (resetUrl is now handled inside sendPasswordResetEmail)
    const emailResult = await sendPasswordResetEmail({
      to: user.email,
      name: user.name,
      resetToken: resetToken,
    });

    // Check if email was sent successfully
    if (!emailResult || !emailResult.success) {
      console.error('❌ Failed to send password reset email:', emailResult?.error || 'Unknown error');
      
      // Reset the token since email failed
      user.passwordResetToken = undefined;
      user.passwordResetExpires = undefined;
      await user.save({ validateBeforeSave: false });

      return res.status(500).json({ 
        message: 'Failed to send password reset email. Please try again later or contact the administrator.',
        error: emailResult?.error || 'Email sending failed'
      });
    }

    console.log('✅ Password reset email sent successfully to:', user.email);
    res.json({ message: 'If email exists, password reset link has been sent' });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

/**
 * Reset password
 */
export const resetPassword = async (req, res) => {
  try {
    const { token, password } = req.body;

    if (!token || !password) {
      return res.status(400).json({ message: 'Token and password are required' });
    }

    // Hash token to compare
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    // Find user with valid reset token
    const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpiry: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired reset token' });
    }

    // Update password
    user.password = password;
    user.passwordResetToken = null;
    user.passwordResetExpiry = null;
    user.firstLogin = false;
    await user.save();

    res.json({ message: 'Password reset successful' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

/**
 * Change password (for authenticated users)
 */
export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Current password and new password are required' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }

    const user = await User.findById(req.user._id);

    // Verify current password
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({ message: 'Current password is incorrect' });
    }

    // Update password
    user.password = newPassword;
    user.firstLogin = false;
    await user.save();

    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

/**
 * First-time login password reset
 */
export const firstLoginReset = async (req, res) => {
  try {
    const { newPassword } = req.body;

    if (!newPassword) {
      return res.status(400).json({ message: 'New password is required' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }

    const user = await User.findById(req.user._id);

    if (!user.firstLogin) {
      return res.status(400).json({ message: 'You have already set your password' });
    }

    // Update password
    user.password = newPassword;
    user.firstLogin = false;
    await user.save();

    res.json({ message: 'Password set successfully' });
  } catch (error) {
    console.error('First login reset error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

/**
 * Send WhatsApp OTP
 */
export const sendOTP = async (req, res) => {
  try {
    const { phone } = req.body;

    if (!phone) {
      return res.status(400).json({ message: 'Phone number is required' });
    }

    // Normalize phone number (remove spaces, dashes, etc.)
    const normalizedPhone = phone.replace(/\D/g, '');

    if (normalizedPhone.length < 10) {
      return res.status(400).json({ message: 'Invalid phone number' });
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Delete any existing OTP for this phone
    await OTP.deleteMany({ phone: normalizedPhone });

    // Save new OTP
    await OTP.create({
      phone: normalizedPhone,
      otp,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
    });

    // Send OTP via Meta WhatsApp Business API
    const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
    const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
    const apiVersion = process.env.WHATSAPP_API_VERSION || 'v18.0';

    // Format phone number for WhatsApp (add country code if not present)
    // WhatsApp requires phone number in format: country_code + number (e.g., 1234567890)
    let whatsappPhone = normalizedPhone;
    // If phone doesn't start with country code, you may need to add it
    // For example, if it's a US number without country code, add +1
    // This is a simple example - adjust based on your needs
    if (!whatsappPhone.startsWith('+')) {
      // You can set a default country code in .env or detect it
      const defaultCountryCode = process.env.WHATSAPP_DEFAULT_COUNTRY_CODE || '';
      whatsappPhone = defaultCountryCode + whatsappPhone;
    }

    // Try to send via Meta WhatsApp API if credentials are configured
    if (phoneNumberId && accessToken) {
      try {
        const response = await fetch(
          `https://graph.facebook.com/${apiVersion}/${phoneNumberId}/messages`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              messaging_product: 'whatsapp',
              to: whatsappPhone,
              type: 'text',
              text: {
                body: `Your HostelHaven verification code is: ${otp}. This code expires in 10 minutes.`
              }
            })
          }
        );

        const result = await response.json();

        if (!response.ok) {
          console.error('WhatsApp API error:', result);
          // Fall back to console log if API fails
          console.log(`OTP for ${normalizedPhone}: ${otp} (WhatsApp API failed, check console)`);
        } else {
          console.log(`OTP sent via WhatsApp to ${whatsappPhone}`);
        }
      } catch (apiError) {
        console.error('Error sending WhatsApp message:', apiError);
        // Fall back to console log if API call fails
        console.log(`OTP for ${normalizedPhone}: ${otp} (WhatsApp API error, check console)`);
      }
    } else {
      // If WhatsApp API credentials not configured, log to console
      console.log(`OTP for ${normalizedPhone}: ${otp}`);
      console.log('⚠️  WhatsApp API credentials not configured. Add WHATSAPP_PHONE_NUMBER_ID and WHATSAPP_ACCESS_TOKEN to .env');
    }

    res.json({ message: 'OTP sent successfully' });
  } catch (error) {
    console.error('Send OTP error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

/**
 * Verify WhatsApp OTP and login
 */
export const verifyOTP = async (req, res) => {
  try {
    const { phone, otp } = req.body;

    if (!phone || !otp) {
      return res.status(400).json({ message: 'Phone number and OTP are required' });
    }

    // Normalize phone number
    const normalizedPhone = phone.replace(/\D/g, '');

    // Find OTP
    const otpRecord = await OTP.findOne({
      phone: normalizedPhone,
      otp,
      expiresAt: { $gt: new Date() },
    });

    if (!otpRecord) {
      return res.status(400).json({ message: 'Invalid or expired OTP' });
    }

    // Find or create user
    let user = await User.findOne({ phone: normalizedPhone });

    if (!user) {
      // Create new user with phone number
      // Generate a temporary username and email
      const tempUsername = `user_${normalizedPhone}`;
      const tempEmail = `${tempUsername}@hostelhaven.local`;

      user = await User.create({
        name: `User ${normalizedPhone}`,
        username: tempUsername,
        email: tempEmail,
        phone: normalizedPhone,
        password: crypto.randomBytes(32).toString('hex'), // Random password since OAuth login
        role: 'student', // Default role, can be updated later
        firstLogin: false, // Skip first login for OAuth users
      });
    }

    // Check if account is active
    if (!user.isActive) {
      return res.status(401).json({ message: 'Account is inactive. Please contact administrator' });
    }

    // Check if student is suspended or graduated (for student role only)
    if (user.role === 'student') {
      const Student = (await import('../models/Student.model.js')).default;
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

    // Delete used OTP
    await OTP.deleteOne({ _id: otpRecord._id });

    // Generate tokens
    const accessToken = generateAccessToken(user._id);
    const refreshToken = generateRefreshToken(user._id);

    // Save refresh token
    user.refreshToken = refreshToken;
    user.refreshTokenExpiry = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000); // 90 days
    user.lastLogin = new Date();
    await user.save();

    // Remove sensitive data
    const userData = {
      _id: user._id,
      name: user.name,
      username: user.username,
      email: user.email,
      role: user.role,
      phone: user.phone,
      profilePhoto: user.profilePhoto || null,
      firstLogin: user.firstLogin,
    };

    res.json({
      message: 'Login successful',
      user: userData,
      token: accessToken,
      refreshToken: refreshToken,
    });
  } catch (error) {
    console.error('Verify OTP error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

