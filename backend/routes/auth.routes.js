import express from 'express';
import passport from '../config/passport.js';
import {
  login,
  refreshToken,
  logout,
  getMe,
  forgotPassword,
  resetPassword,
  changePassword,
  firstLoginReset,
  sendOTP,
  verifyOTP,
} from '../controllers/authController.js';
import {
  googleCallback,
  facebookCallback,
} from '../controllers/oauthController.js';
import { getTokens } from '../utils/tempTokenStore.js';
import { protect } from '../middleware/auth.middleware.js';

const router = express.Router();

// Public routes
router.post('/login', login);
router.post('/refresh-token', refreshToken);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.post('/send-otp', sendOTP);
router.post('/verify-otp', verifyOTP);

// OAuth token retrieval (for code-based callback)
router.get('/oauth-tokens/:code', (req, res) => {
  try {
    const { code } = req.params;
    const tokens = getTokens(code);
    
    if (!tokens) {
      return res.status(400).json({ 
        message: 'Invalid or expired code. Please try logging in again.' 
      });
    }
    
    res.json({
      token: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      user: tokens.userData,
    });
  } catch (error) {
    console.error('Error retrieving OAuth tokens:', error);
    res.status(500).json({ message: 'Error retrieving tokens' });
  }
});

// OAuth routes
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

router.get('/google/callback', 
  (req, res, next) => {
    console.log('🔍 Google OAuth callback route hit');
    console.log('🔍 Query params:', req.query);
    console.log('🔍 Callback URL should be:', `${process.env.BACKEND_URL || 'http://localhost:5000'}/api/auth/google/callback`);
    
    // Check if there's an error in query params (Google might redirect with error)
    if (req.query.error) {
      console.error('❌ Google OAuth error in query:', req.query.error);
      console.error('❌ Error description:', req.query.error_description);
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
      return res.redirect(`${frontendUrl}/auth/login?error=oauth_failed&message=${encodeURIComponent(req.query.error_description || 'Google authentication failed. Please check your callback URL configuration.')}`);
    }
    
    passport.authenticate('google', { session: false, failureRedirect: undefined }, (err, user, info) => {
      console.log('🔍 Passport authenticate callback called');
      console.log('🔍 Error:', err ? err.message : 'None');
      console.log('🔍 User:', user ? 'Present' : 'Missing');
      console.log('🔍 Info:', info);
      
      if (err) {
        console.error('❌ Google OAuth authentication error:', err);
        console.error('❌ Error stack:', err.stack);
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
        return res.redirect(`${frontendUrl}/auth/login?error=oauth_failed&message=${encodeURIComponent('Google authentication failed. Please try again.')}`);
      }
      if (!user) {
        console.error('❌ Google OAuth - No user returned from passport');
        console.error('❌ Info object:', JSON.stringify(info, null, 2));
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
        return res.redirect(`${frontendUrl}/auth/login?error=oauth_failed&message=${encodeURIComponent('Google authentication failed. Please check that your callback URL matches Google Console settings.')}`);
      }
      console.log('✅ Google OAuth - User authenticated, proceeding to callback');
      req.user = user;
      next();
    })(req, res, next);
  },
  googleCallback
);

router.get('/facebook', passport.authenticate('facebook', { scope: [] }));

router.get('/facebook/callback',
  (req, res, next) => {
    console.log('🔍 Facebook OAuth callback route hit');
    console.log('🔍 Query params:', req.query);
    console.log('🔍 Callback URL should be:', `${process.env.BACKEND_URL || 'http://localhost:5000'}/api/auth/facebook/callback`);
    
    // Check if there's an error in query params (Facebook might redirect with error)
    if (req.query.error) {
      console.error('❌ Facebook OAuth error in query:', req.query.error);
      console.error('❌ Error description:', req.query.error_description);
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
      return res.redirect(`${frontendUrl}/auth/login?error=oauth_failed&message=${encodeURIComponent(req.query.error_description || 'Facebook authentication failed. Please check your callback URL configuration.')}`);
    }
    
    passport.authenticate('facebook', { session: false, failureRedirect: undefined }, (err, user, info) => {
      console.log('🔍 Passport authenticate callback called');
      console.log('🔍 Error:', err ? err.message : 'None');
      console.log('🔍 User:', user ? 'Present' : 'Missing');
      console.log('🔍 Info:', info);
      
      if (err) {
        console.error('❌ Facebook OAuth authentication error:', err);
        console.error('❌ Error stack:', err.stack);
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
        return res.redirect(`${frontendUrl}/auth/login?error=oauth_failed&message=${encodeURIComponent('Facebook authentication failed. Please try again.')}`);
      }
      if (!user) {
        console.error('❌ Facebook OAuth - No user returned from passport');
        console.error('❌ Info object:', JSON.stringify(info, null, 2));
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
        return res.redirect(`${frontendUrl}/auth/login?error=oauth_failed&message=${encodeURIComponent('Facebook authentication failed. Please check that your callback URL matches Facebook App settings.')}`);
      }
      console.log('✅ Facebook OAuth - User authenticated, proceeding to callback');
      req.user = user;
      next();
    })(req, res, next);
  },
  facebookCallback
);

// Protected routes
router.use(protect);
router.post('/logout', logout);
router.get('/me', getMe);
router.put('/change-password', changePassword);
router.put('/first-login-reset', firstLoginReset);

export default router;
