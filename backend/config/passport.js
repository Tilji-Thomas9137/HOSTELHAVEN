import passport from 'passport';
import GoogleStrategy from 'passport-google-oauth20';
import FacebookStrategy from 'passport-facebook';

// Initialize OAuth strategies - this function will be called after dotenv.config()
export function initializeOAuthStrategies() {
  // Google OAuth Strategy - only initialize if credentials are provided
  const googleClientId = process.env.GOOGLE_CLIENT_ID;
  const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;
  
  console.log('🔍 Initializing OAuth strategies...');
  console.log('🔍 GOOGLE_CLIENT_ID:', googleClientId ? 'Found' : 'Missing');
  console.log('🔍 GOOGLE_CLIENT_SECRET:', googleClientSecret ? 'Found' : 'Missing');
  
  if (googleClientId && googleClientSecret && 
      googleClientId !== 'your_google_client_id' && 
      googleClientSecret !== 'your_google_client_secret') {
    try {
      // Ensure callback URL is exactly http://localhost:5000/api/auth/google/callback
      const callbackURL = process.env.BACKEND_URL 
        ? `${process.env.BACKEND_URL.replace(/\/$/, '')}/api/auth/google/callback`
        : 'http://localhost:5000/api/auth/google/callback';
      
      console.log('🔍 Google OAuth Callback URL:', callbackURL);
      
      passport.use('google', new GoogleStrategy(
        {
          clientID: googleClientId,
          clientSecret: googleClientSecret,
          callbackURL: callbackURL,
        },
        async (accessToken, refreshToken, profile, done) => {
          try {
            console.log('🔍 Google OAuth profile received:');
            console.log('🔍 Profile ID:', profile.id);
            console.log('🔍 Profile emails:', profile.emails);
            console.log('🔍 Profile displayName:', profile.displayName);
            console.log('🔍 Profile photos:', profile.photos);
            return done(null, profile);
          } catch (error) {
            console.error('❌ Error in Google OAuth strategy callback:', error);
            return done(error, null);
          }
        }
      ));
      console.log('✅ Google OAuth strategy initialized');
      console.log('🔍 Callback URL configured:', callbackURL);
      console.log('⚠️  IMPORTANT: Make sure this EXACT URL is in Google Console:');
      console.log('   Authorized redirect URI:', callbackURL);
    } catch (error) {
      console.error('❌ Error initializing Google OAuth:', error.message);
    }
  } else {
    console.log('⚠️  Google OAuth not configured - GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET required');
  }

  // Facebook OAuth Strategy - only initialize if credentials are provided
  const facebookAppId = process.env.FACEBOOK_APP_ID;
  const facebookAppSecret = process.env.FACEBOOK_APP_SECRET;
  
  console.log('🔍 FACEBOOK_APP_ID:', facebookAppId ? 'Found' : 'Missing');
  console.log('🔍 FACEBOOK_APP_SECRET:', facebookAppSecret ? 'Found' : 'Missing');
  
  if (facebookAppId && facebookAppSecret && 
      facebookAppId !== 'your_facebook_app_id' && 
      facebookAppSecret !== 'your_facebook_app_secret') {
    try {
      passport.use('facebook', new FacebookStrategy(
        {
          clientID: facebookAppId,
          clientSecret: facebookAppSecret,
          callbackURL: `${process.env.BACKEND_URL || 'http://localhost:5000'}/api/auth/facebook/callback`,
          profileFields: ['id', 'displayName', 'photos', 'emails'],
        },
        async (accessToken, refreshToken, profile, done) => {
          try {
            return done(null, profile);
          } catch (error) {
            return done(error, null);
          }
        }
      ));
      console.log('✅ Facebook OAuth strategy initialized');
    } catch (error) {
      console.error('❌ Error initializing Facebook OAuth:', error.message);
    }
  } else {
    console.log('⚠️  Facebook OAuth not configured - FACEBOOK_APP_ID and FACEBOOK_APP_SECRET required');
  }
}

// Serialize user for session
passport.serializeUser((user, done) => {
  done(null, user);
});

// Deserialize user from session
passport.deserializeUser((user, done) => {
  done(null, user);
});

export default passport;

