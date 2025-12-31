/**
 * Temporary token store for OAuth callbacks
 * Stores tokens temporarily with a short code to avoid URL length issues
 */

import crypto from 'crypto';

const tokenStore = new Map();

/**
 * Store tokens temporarily and return a short code
 * @param {string} accessToken - JWT access token
 * @param {string} refreshToken - JWT refresh token
 * @param {object} userData - User data object
 * @returns {string} - Short code to retrieve tokens
 */
export function storeTokens(accessToken, refreshToken, userData) {
  const code = crypto.randomBytes(32).toString('hex');
  const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes
  
  tokenStore.set(code, {
    accessToken,
    refreshToken,
    userData,
    expiresAt,
  });
  
  // Clean up expired entries
  setTimeout(() => {
    tokenStore.delete(code);
  }, 5 * 60 * 1000);
  
  return code;
}

/**
 * Retrieve and delete tokens by code
 * @param {string} code - Short code
 * @returns {object|null} - Tokens and user data, or null if not found/expired
 */
export function getTokens(code) {
  const entry = tokenStore.get(code);
  
  if (!entry) {
    return null;
  }
  
  if (Date.now() > entry.expiresAt) {
    tokenStore.delete(code);
    return null;
  }
  
  // Delete after retrieval (one-time use)
  tokenStore.delete(code);
  
  return {
    accessToken: entry.accessToken,
    refreshToken: entry.refreshToken,
    userData: entry.userData,
  };
}

/**
 * Clean up expired entries (run periodically)
 */
export function cleanup() {
  const now = Date.now();
  for (const [code, entry] of tokenStore.entries()) {
    if (now > entry.expiresAt) {
      tokenStore.delete(code);
    }
  }
}

// Clean up every 10 minutes
setInterval(cleanup, 10 * 60 * 1000);

