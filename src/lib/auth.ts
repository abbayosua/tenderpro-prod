import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';

const JWT_SECRET = process.env.JWT_SECRET || 'tenderpro-jwt-secret-key-change-in-production';
const SECRET_KEY = new TextEncoder().encode(JWT_SECRET);

export interface JWTPayload {
  userId: string;
  email: string;
  role: string;
  iat: number;
  exp: number;
}

// Token expiration times
export const TOKEN_EXPIRY = {
  ACCESS_TOKEN: '1h',  // 1 hour
  REFRESH_TOKEN: '7d', // 7 days
};

/**
 * Generate a JWT access token
 */
export async function generateAccessToken(payload: { userId: string; email: string; role: string }): Promise<string> {
  const token = await new SignJWT({
    userId: payload.userId,
    email: payload.email,
    role: payload.role,
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(TOKEN_EXPIRY.ACCESS_TOKEN)
    .sign(SECRET_KEY);
  
  return token;
}

/**
 * Generate a refresh token
 */
export async function generateRefreshToken(payload: { userId: string }): Promise<string> {
  const token = await new SignJWT({
    userId: payload.userId,
    type: 'refresh',
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(TOKEN_EXPIRY.REFRESH_TOKEN)
    .sign(SECRET_KEY);
  
  return token;
}

/**
 * Verify and decode a JWT token
 */
export async function verifyToken(token: string): Promise<JWTPayload | null> {
  try {
    const { payload } = await jwtVerify(token, SECRET_KEY);
    return payload as JWTPayload;
  } catch (error) {
    console.error('Token verification failed:', error);
    return null;
  }
}

/**
 * Extract token from Authorization header
 */
export function extractTokenFromHeader(authHeader: string | null): string | null {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  return authHeader.slice(7);
}

/**
 * Get current user from cookies (for server components)
 */
export async function getCurrentUser(): Promise<JWTPayload | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth-token')?.value;
    
    if (!token) {
      return null;
    }
    
    return await verifyToken(token);
  } catch {
    return null;
  }
}

/**
 * Set auth cookie
 */
export async function setAuthCookie(token: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set('auth-token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60, // 1 hour
    path: '/',
  });
}

/**
 * Clear auth cookie
 */
export async function clearAuthCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete('auth-token');
}
