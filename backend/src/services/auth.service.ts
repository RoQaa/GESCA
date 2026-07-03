import { userRepository } from '../repositories/user.repository';
import { passwordService } from './password.service';
import { tokenService } from './token.service';
import { AppError } from '../exceptions/AppError';
import { LoginInput, RegisterInput, ResetPasswordInput } from '../validators/auth.validator';
import { prisma } from '../config/database.config';

export class AuthService {
  async register(data: RegisterInput) {
    const existingUser = await userRepository.findByEmail(data.email);
    if (existingUser) {
      throw new AppError('Email is already registered', 409);
    }

    const passwordHash = await passwordService.hashPassword(data.password);

    const user = await userRepository.create({
      email: data.email,
      passwordHash,
      firstName: data.firstName,
      lastName: data.lastName,
      phone: data.phone,
      status: 'PENDING_VERIFICATION', // based on Prisma schema
    });

    // TODO: Send verification email here

    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
    };
  }

  async login(data: LoginInput, deviceInfo?: string, ipAddress?: string) {
    const user = await userRepository.findByEmail(data.email);
    if (!user) {
      throw new AppError('Invalid email or password', 401);
    }

    if (user.status === 'SUSPENDED') {
      throw new AppError('Account is suspended', 403);
    }

    const isPasswordValid = await passwordService.verifyPassword(data.password, user.passwordHash);
    if (!isPasswordValid) {
      throw new AppError('Invalid email or password', 401);
    }

    const accessToken = tokenService.generateAccessToken({ sub: user.id });
    const refreshToken = await tokenService.generateRefreshToken(user.id, deviceInfo, ipAddress);

    return {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
      },
      accessToken,
      refreshToken,
    };
  }

  async logout(refreshToken: string) {
    await tokenService.revokeToken(refreshToken);
  }

  async refreshToken(token: string, deviceInfo?: string, ipAddress?: string) {
    return tokenService.rotateRefreshToken(token, deviceInfo, ipAddress);
  }

  async forgotPassword(email: string) {
    const user = await userRepository.findByEmail(email);
    if (!user) {
      // Do not reveal if the user exists or not for security
      return;
    }

    const { plainToken, tokenHash } = passwordService.generateResetToken();
    // In a real app, send plainToken via email
    console.log('RESET TOKEN (For Dev/Test):', plainToken);

    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 15);

    await prisma.passwordReset.create({
      data: {
        userId: user.id,
        tokenHash,
        expiresAt,
      },
    });

    // TODO: Send password reset email with plainToken
  }

  async resetPassword(data: ResetPasswordInput) {
    const tokenHash = passwordService.hashToken(data.token);

    const passwordReset = await prisma.passwordReset.findUnique({
      where: { tokenHash },
    });

    if (!passwordReset || passwordReset.isUsed || new Date() > passwordReset.expiresAt) {
      throw new AppError('Invalid or expired reset token', 400);
    }

    const newPasswordHash = await passwordService.hashPassword(data.newPassword);

    // Use transaction to ensure both operations succeed
    await prisma.$transaction([
      prisma.user.update({
        where: { id: passwordReset.userId },
        data: { passwordHash: newPasswordHash },
      }),
      prisma.passwordReset.update({
        where: { id: passwordReset.id },
        data: { isUsed: true, usedAt: new Date() },
      }),
      // Revoke all refresh tokens for security
      prisma.refreshToken.updateMany({
        where: { userId: passwordReset.userId },
        data: { isRevoked: true },
      }),
    ]);
  }
}

export const authService = new AuthService();
