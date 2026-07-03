import { Request, Response } from 'express';
import { authService } from '../services/auth.service';
import { catchAsync } from '../helpers/catchAsync';

export const register = catchAsync(async (req: Request, res: Response) => {
  const user = await authService.register(req.body);
  res.status(201).json({
    success: true,
    message: 'User registered successfully',
    data: user,
  });
});

export const login = catchAsync(async (req: Request, res: Response) => {
  const deviceInfo = req.headers['user-agent'];
  const ipAddress = req.ip;

  const result = await authService.login(req.body, deviceInfo, ipAddress);

  // Consider setting refresh token in HTTP-only cookie in production
  // res.cookie('refreshToken', result.refreshToken, { httpOnly: true, secure: true, sameSite: 'strict' });

  res.status(200).json({
    success: true,
    message: 'Login successful',
    data: result,
  });
});

export const logout = catchAsync(async (req: Request, res: Response) => {
  const { refreshToken } = req.body;
  
  if (refreshToken) {
    await authService.logout(refreshToken);
  }

  // If using cookies, clear it
  // res.clearCookie('refreshToken');

  res.status(200).json({
    success: true,
    message: 'Logged out successfully',
  });
});

export const refreshToken = catchAsync(async (req: Request, res: Response) => {
  const { refreshToken: token } = req.body;
  const deviceInfo = req.headers['user-agent'];
  const ipAddress = req.ip;

  const result = await authService.refreshToken(token, deviceInfo, ipAddress);

  res.status(200).json({
    success: true,
    message: 'Token refreshed',
    data: result,
  });
});

export const forgotPassword = catchAsync(async (req: Request, res: Response) => {
  await authService.forgotPassword(req.body.email);
  
  res.status(200).json({
    success: true,
    message: 'If the email exists, a password reset link has been sent',
  });
});

export const resetPassword = catchAsync(async (req: Request, res: Response) => {
  await authService.resetPassword(req.body);

  res.status(200).json({
    success: true,
    message: 'Password has been reset successfully',
  });
});
