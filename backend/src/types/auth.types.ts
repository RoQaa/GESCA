/**
 * @module auth.types
 * @description Authentication-related type definitions.
 */

import { Role } from '../constants/roles.constants';

// ─── JWT Payload ──────────────────────────────────────────────────────────────

export interface JwtPayload {
  /** User UUID */
  sub: string;
  /** User email */
  email: string;
  /** User role */
  role: Role;
  /** Token issued at (Unix timestamp) */
  iat?: number;
  /** Token expiration (Unix timestamp) */
  exp?: number;
  /** JWT ID — used for token blacklisting on logout */
  jti?: string;
}

// ─── Refresh Token Payload ────────────────────────────────────────────────────

export interface RefreshTokenPayload {
  sub: string;
  tokenFamily: string; // For refresh token rotation — detect replay attacks
  iat?: number;
  exp?: number;
  jti?: string;
}

// ─── Auth Service Results ─────────────────────────────────────────────────────

export interface AuthTokenPair {
  accessToken: string;
  refreshToken: string;
  expiresIn: number; // Access token TTL in seconds
}

export interface AuthenticatedUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: Role;
  isEmailVerified: boolean;
  avatarUrl: string | null;
}

export interface LoginResult {
  user: AuthenticatedUser;
  tokens: AuthTokenPair;
}
