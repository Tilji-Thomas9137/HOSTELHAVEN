import User from '../models/User.model.js';
import { generateAccessToken, generateRefreshToken } from '../utils/jwt.js';
import { storeTokens } from '../utils/tempTokenStore.js';
import crypto from 'crypto';

/**
 * Helper function to generate user response and tokens
 */
const generateUserResponse = async (user, res) => {
  try {
    // Check if account is active
    if (!user.isActive) {
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
      return res.redirect(`${frontendUrl}/auth/login?error=account_inactive&message=Your account is inactive. Please contact the administrator.`);
    }

    // Check if student is suspended or graduated (for student role only)
    if (user.role === 'student') {
      const Student = (await import('../models/Student.model.js')).default;
      const student = await Student.findOne({ user: user._id });
      
      if (student) {
        if (student.status === 'suspended') {
          const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
          return res.redirect(`${frontendUrl}/auth/login?error=account_suspended&message=Your account has been suspended. Please contact the administrator for more information.`);
        }
        if (student.status === 'graduated') {
          const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
          return res.redirect(`${frontendUrl}/auth/login?error=account_graduated&message=You have graduated. You have vacated from the hostel.`);
        }
      }
    }

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
      _id: user._id.toString(),
      name: user.name,
      username: user.username,
      email: user.email,
      role: user.role,
      phone: user.phone,
      profilePhoto: user.profilePhoto || null,
      firstLogin: user.firstLogin,
    };

    // Store tokens temporarily and get a short code (to avoid URL length issues)
    const code = storeTokens(accessToken, refreshToken, userData);
    
    // Redirect to frontend with short code instead of full tokens
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const redirectUrl = `${frontendUrl}/auth/oauth-callback?code=${code}`;
    
    console.log(`✅ OAuth login successful for user: ${user.email} (${user.role})`);
    res.redirect(redirectUrl);
  } catch (error) {
    console.error('Error in generateUserResponse:', error);
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    res.redirect(`${frontendUrl}/auth/login?error=oauth_error&message=An error occurred during login. Please try again.`);
  }
};

/**
 * Google OAuth callback
 */
export const googleCallback = async (req, res) => {
  try {
    console.log('🔍 Google OAuth callback received');
    
    if (!req.user) {
      console.log('❌ No user in request');
      return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/auth/login?error=oauth_failed`);
    }

    const { id, displayName, emails, photos } = req.user;
    const email = emails?.[0]?.value;
    const profilePhoto = photos?.[0]?.value;

    console.log(`🔍 Google OAuth - Email: ${email}, ID: ${id}`);

    if (!email) {
      console.log('❌ No email in Google profile');
      return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/auth/login?error=no_email`);
    }

    const normalizedEmail = email.toLowerCase().trim();
    console.log(`🔍 Looking up user with email: ${normalizedEmail} or googleId: ${id}`);

    // Find existing user - DO NOT create new users
    // Only allow login if user already exists (verified by admin)
    const user = await User.findOne({ 
      $or: [
        { googleId: id },
        { email: normalizedEmail }
      ]
    });

    console.log(`🔍 User lookup result: ${user ? 'Found' : 'Not found'}`);
    if (user) {
      console.log(`🔍 Found user: ${user.email}, role: ${user.role}, isActive: ${user.isActive}`);
    } else {
      // Debug: Check if any users exist with similar emails
      const allUsers = await User.find({}, { email: 1, googleId: 1 }).limit(5);
      console.log('🔍 Sample users in database:', allUsers.map(u => ({ email: u.email, googleId: u.googleId })));
    }

    if (!user) {
      // User doesn't exist - redirect with error message
      console.log(`❌ Google OAuth login attempt for unregistered email: ${normalizedEmail}`);
      return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/auth/login?error=user_not_found&message=${encodeURIComponent('Your account has not been registered. Please contact the administrator.')}`);
    }

    // Check if account is active
    if (!user.isActive) {
      console.log(`❌ Account inactive for: ${normalizedEmail}`);
      return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/auth/login?error=account_inactive&message=${encodeURIComponent('Your account is inactive. Please contact the administrator.')}`);
    }

    // Update Google ID if not set (for existing users)
    if (!user.googleId) {
      user.googleId = id;
      await user.save();
      console.log(`✅ Linked Google ID to user: ${normalizedEmail}`);
    }
    
    // Update profile photo if available and not set
    if (profilePhoto && !user.profilePhoto) {
      user.profilePhoto = profilePhoto;
      await user.save();
    }

    await generateUserResponse(user, res);
  } catch (error) {
    console.error('❌ Google OAuth callback error:', error);
    console.error('Error stack:', error.stack);
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    res.redirect(`${frontendUrl}/auth/login?error=oauth_error&message=${encodeURIComponent('An error occurred during authentication. Please try again.')}`);
  }
};

/**
 * Facebook OAuth callback
 */
export const facebookCallback = async (req, res) => {
  try {
    console.log('🔍 Facebook OAuth callback received');
    
    if (!req.user) {
      console.log('❌ No user in request');
      return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/auth/login?error=oauth_failed`);
    }

    const { id, displayName, emails, photos } = req.user;
    const email = emails?.[0]?.value;
    const profilePhoto = photos?.[0]?.value;

    console.log(`🔍 Facebook OAuth - Email: ${email || 'Not provided'}, ID: ${id}`);
    console.log('🔍 Facebook profile:', JSON.stringify(req.user, null, 2));

    // Try to find user by Facebook ID first (works even without email)
    let user = await User.findOne({ facebookId: id });

    // If not found by Facebook ID and we have email, try by email
    if (!user && email) {
      const normalizedEmail = email.toLowerCase().trim();
      user = await User.findOne({ email: normalizedEmail });
      
      // If found by email, link the Facebook ID
      if (user && !user.facebookId) {
        user.facebookId = id;
        await user.save();
        console.log(`✅ Linked Facebook ID to existing user: ${normalizedEmail}`);
      }
    }

    // If still no user found, check if email is required
    if (!user) {
      if (!email) {
        console.log('❌ No email in Facebook profile and user not found by Facebook ID');
        console.log('💡 Note: Facebook may not provide email if:');
        console.log('   1. The app does not have email permission approved');
        console.log('   2. The user has not verified their email');
        console.log('   3. The user\'s privacy settings restrict email sharing');
        return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/auth/login?error=user_not_found&message=${encodeURIComponent('Your account has not been registered. Please contact the administrator. If you have an account, try logging in with email/password first, then link your Facebook account.')}`);
      }
      
      // User doesn't exist - redirect with error message
      const normalizedEmail = email.toLowerCase().trim();
      console.log(`❌ Facebook OAuth login attempt for unregistered email: ${normalizedEmail}`);
      return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/auth/login?error=user_not_found&message=${encodeURIComponent('Your account has not been registered. Please contact the administrator.')}`);
    }

    console.log(`🔍 User lookup result: ${user ? 'Found' : 'Not found'}`);
    if (user) {
      console.log(`🔍 Found user: ${user.email || 'No email'}, role: ${user.role}, isActive: ${user.isActive}`);
    }

    // Check if account is active (user is guaranteed to exist here due to check above)
    if (!user.isActive) {
      const userIdentifier = user.email || `Facebook ID: ${id}`;
      console.log(`❌ Account inactive for: ${userIdentifier}`);
      return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/auth/login?error=account_inactive&message=${encodeURIComponent('Your account is inactive. Please contact the administrator.')}`);
    }

    // Update Facebook ID if not set (for existing users)
    if (!user.facebookId) {
      user.facebookId = id;
      await user.save();
      const userIdentifier = user.email || `Facebook ID: ${id}`;
      console.log(`✅ Linked Facebook ID to user: ${userIdentifier}`);
    }
    
    // Update profile photo if available and not set
    if (profilePhoto && !user.profilePhoto) {
      user.profilePhoto = profilePhoto;
      await user.save();
    }

    await generateUserResponse(user, res);
  } catch (error) {
    console.error('❌ Facebook OAuth callback error:', error);
    console.error('Error stack:', error.stack);
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    res.redirect(`${frontendUrl}/auth/login?error=oauth_error&message=${encodeURIComponent('An error occurred during authentication. Please try again.')}`);
  }
};


