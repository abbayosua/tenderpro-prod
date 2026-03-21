import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, extractTokenFromHeader, JWTPayload } from './auth';

// Routes that don't require authentication
const PUBLIC_ROUTES = [
  '/api/auth/login',
  '/api/auth/register',
  '/api/auth/forgot-password',
  '/api/auth/reset-password',
  '/api/health',
  '/api/seed',
];

// Routes that require specific roles
const ROLE_RESTRICTED_ROUTES: Record<string, string[]> = {
  '/api/projects/create': ['OWNER'],
  '/api/bids/accept': ['OWNER'],
  '/api/bids/reject': ['OWNER'],
  '/api/payments': ['OWNER'],
  '/api/contractors/verify': ['ADMIN'],
};

export interface AuthenticatedRequest extends NextRequest {
  user?: JWTPayload;
}

/**
 * Middleware to check authentication
 */
export async function authMiddleware(request: NextRequest): Promise<NextResponse | null> {
  const pathname = request.nextUrl.pathname;
  
  // Allow public routes
  if (PUBLIC_ROUTES.some(route => pathname.startsWith(route))) {
    return null; // Continue to next middleware/handler
  }
  
  // Extract token from header
  const authHeader = request.headers.get('authorization');
  const token = extractTokenFromHeader(authHeader);
  
  if (!token) {
    // Also check cookie for server-side requests
    const cookieToken = request.cookies.get('auth-token')?.value;
    if (!cookieToken) {
      return NextResponse.json(
        { success: false, message: 'Tidak terautentikasi' },
        { status: 401 }
      );
    }
    
    const decoded = await verifyToken(cookieToken);
    if (!decoded) {
      return NextResponse.json(
        { success: false, message: 'Token tidak valid atau sudah expired' },
        { status: 401 }
      );
    }
    
    // Add user to request headers for handlers
    const response = NextResponse.next();
    response.headers.set('x-user-id', decoded.userId);
    response.headers.set('x-user-email', decoded.email);
    response.headers.set('x-user-role', decoded.role);
    return null;
  }
  
  // Verify token from header
  const decoded = await verifyToken(token);
  if (!decoded) {
    return NextResponse.json(
      { success: false, message: 'Token tidak valid atau sudah expired' },
      { status: 401 }
    );
  }
  
  // Check role restrictions
  for (const [route, allowedRoles] of Object.entries(ROLE_RESTRICTED_ROUTES)) {
    if (pathname.startsWith(route) && !allowedRoles.includes(decoded.role)) {
      return NextResponse.json(
        { success: false, message: 'Tidak memiliki akses ke resource ini' },
        { status: 403 }
      );
    }
  }
  
  return null; // Continue to handler
}

/**
 * Extract user from request headers (set by middleware)
 */
export function getUserFromHeaders(request: NextRequest): JWTPayload | null {
  const userId = request.headers.get('x-user-id');
  const email = request.headers.get('x-user-email');
  const role = request.headers.get('x-user-role');
  
  if (!userId || !email || !role) {
    return null;
  }
  
  return {
    userId,
    email,
    role,
    iat: 0,
    exp: 0,
  };
}

/**
 * Verify token and return user for API route handlers
 */
export async function getAuthenticatedUser(request: NextRequest): Promise<JWTPayload | null> {
  // First check headers (set by middleware)
  const headerUser = getUserFromHeaders(request);
  if (headerUser) {
    return headerUser;
  }
  
  // Then check authorization header
  const authHeader = request.headers.get('authorization');
  const token = extractTokenFromHeader(authHeader);
  
  if (!token) {
    // Check cookie
    const cookieToken = request.cookies.get('auth-token')?.value;
    if (!cookieToken) {
      return null;
    }
    return verifyToken(cookieToken);
  }
  
  return verifyToken(token);
}

/**
 * Require authentication - throws error if not authenticated
 */
export async function requireAuth(request: NextRequest): Promise<JWTPayload> {
  const user = await getAuthenticatedUser(request);
  if (!user) {
    throw new Error('UNAUTHORIZED');
  }
  return user;
}

/**
 * Require specific role
 */
export async function requireRole(request: NextRequest, roles: string[]): Promise<JWTPayload> {
  const user = await requireAuth(request);
  if (!roles.includes(user.role)) {
    throw new Error('FORBIDDEN');
  }
  return user;
}

/**
 * Require owner role
 */
export async function requireOwner(request: NextRequest): Promise<JWTPayload> {
  return requireRole(request, ['OWNER', 'ADMIN']);
}

/**
 * Require contractor role
 */
export async function requireContractor(request: NextRequest): Promise<JWTPayload> {
  return requireRole(request, ['CONTRACTOR', 'ADMIN']);
}
