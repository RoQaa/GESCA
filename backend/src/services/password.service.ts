import bcrypt from 'bcryptjs';
import { env } from '../config/env.config';
import crypto from 'crypto';

export class PasswordService {
  /**
   * Hashes a plain text password using bcrypt.
   * Uses salt rounds from the environment configuration.
   */
  async hashPassword(password: string): Promise<string> {
    const saltRounds = env.BCRYPT_SALT_ROUNDS || 12;
    return bcrypt.hash(password, saltRounds);
  }

  /**
   * Verifies a plain text password against a bcrypt hash.
   */
  async verifyPassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  /**
   * Generates a secure random reset token and its hash.
   * Returns both the plain token (to send via email) and the hash (to save to the database).
   */
  generateResetToken(): { plainToken: string; tokenHash: string } {
    const plainToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(plainToken).digest('hex');
    return { plainToken, tokenHash };
  }

  /**
   * Hashes a given plain token (e.g., from an email link) to compare against the DB hash.
   */
  hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }
}

export const passwordService = new PasswordService();
