import jwt from 'jsonwebtoken';
import { env } from '../config/env.config';
import crypto from 'crypto';
import { prisma } from '../config/database.config';
import { AppError } from '../exceptions/AppError';

export interface TokenPayload {
  sub: string; // User ID
  role?: string;
}

export class TokenService {
  /**
   * Generates an access token (JWT)
   */
  generateAccessToken(payload: TokenPayload): string {
    return jwt.sign(payload, env.JWT_SECRET, {
      expiresIn: env.JWT_EXPIRES_IN as any,
    });
  }

  /**
   * Generates a secure refresh token (opaque string) and stores its hash in the database.
   */
  async generateRefreshToken(userId: string, deviceInfo?: string, ipAddress?: string): Promise<string> {
    const plainToken = crypto.randomBytes(40).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(plainToken).digest('hex');
    const tokenFamily = crypto.randomUUID(); // For rotation family tracking
    
    // Calculate expiration date manually based on string (e.g., '7d')
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // Default 7 days

    await prisma.refreshToken.create({
      data: {
        userId,
        tokenHash,
        tokenFamily,
        deviceInfo,
        ipAddress,
        expiresAt,
      },
    });

    return plainToken;
  }

  /**
   * Verifies an access token
   */
  verifyAccessToken(token: string): TokenPayload {
    try {
      return jwt.verify(token, env.JWT_SECRET) as TokenPayload;
    } catch (error) {
      throw new AppError('Invalid or expired token', 401);
    }
  }

  /**
   * Hashes a plain refresh token to query the database.
   */
  hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  /**
   * Validates a refresh token and rotates it if valid.
   */
  async rotateRefreshToken(plainToken: string, deviceInfo?: string, ipAddress?: string) {
    const tokenHash = this.hashToken(plainToken);

    const storedToken = await prisma.refreshToken.findUnique({
      where: { tokenHash },
    });

    if (!storedToken) {
      throw new AppError('Invalid refresh token', 401);
    }

    if (storedToken.isRevoked) {
      // Replay attack detection: if a revoked token is used, revoke the entire family!
      await prisma.refreshToken.updateMany({
        where: { tokenFamily: storedToken.tokenFamily },
        data: { isRevoked: true },
      });
      throw new AppError('Invalid refresh token (revoked)', 401);
    }

    if (new Date() > storedToken.expiresAt) {
      throw new AppError('Refresh token expired', 401);
    }

    // Revoke current token
    await prisma.refreshToken.update({
      where: { id: storedToken.id },
      data: { isRevoked: true },
    });

    // Generate new access and refresh tokens
    const user = await prisma.user.findUnique({ where: { id: storedToken.userId } });
    if (!user) throw new AppError('User not found', 404);

    const newAccessToken = this.generateAccessToken({ sub: user.id });
    
    // Create new refresh token using same family
    const newPlainRefreshToken = crypto.randomBytes(40).toString('hex');
    const newTokenHash = this.hashToken(newPlainRefreshToken);
    
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await prisma.refreshToken.create({
      data: {
        userId: user.id,
        tokenHash: newTokenHash,
        tokenFamily: storedToken.tokenFamily, // Maintain family for rotation tracking
        deviceInfo,
        ipAddress,
        expiresAt,
      },
    });

    return {
      accessToken: newAccessToken,
      refreshToken: newPlainRefreshToken,
    };
  }

  /**
   * Revokes a specific refresh token (Logout)
   */
  async revokeToken(plainToken: string) {
    const tokenHash = this.hashToken(plainToken);
    await prisma.refreshToken.updateMany({
      where: { tokenHash },
      data: { isRevoked: true },
    });
  }
}

export const tokenService = new TokenService();
