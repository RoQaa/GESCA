/**
 * @module crypto.util
 * @description Cryptographic utility functions.
 * All random token generation and hashing lives here.
 */

import crypto from 'crypto';

/**
 * Generate a cryptographically secure random token (hex string).
 * Used for password reset tokens, email verification tokens.
 * @param bytes - Number of random bytes (output length = bytes * 2)
 */
export function generateSecureToken(bytes = 32): string {
  return crypto.randomBytes(bytes).toString('hex');
}

/**
 * Hash a token with SHA-256 for secure database storage.
 * We store the HASH in the DB, never the raw token.
 * The user holds the raw token (in their email/URL).
 *
 * Pattern: store hash → compare hash(userInput) === storedHash
 */
export function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

/**
 * Generate a secure 6-digit OTP for email verification / 2FA.
 */
export function generateOtp(): string {
  const otp = crypto.randomInt(100_000, 999_999);
  return otp.toString();
}

/**
 * Constant-time string comparison to prevent timing attacks.
 * Use this instead of === when comparing tokens.
 */
export function safeCompare(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b));
}
