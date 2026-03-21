import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Get token from authorization header
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
    
    // Also check cookie
    const cookieToken = request.cookies.get('auth-token')?.value;
    const tokenToUse = token || cookieToken;
    
    if (!tokenToUse) {
      return NextResponse.json(
        { success: false, authenticated: false, message: 'Token tidak ditemukan' },
        { status: 401 }
      );
    }
    
    // Import verify function dynamically to avoid issues
    const { verifyToken } = await import('@/lib/auth');
    const decoded = await verifyToken(tokenToUse);
    
    if (!decoded) {
      return NextResponse.json(
        { success: false, authenticated: false, message: 'Token tidak valid' },
        { status: 401 }
      );
    }
    
    return NextResponse.json({
      success: true,
      authenticated: true,
      user: {
        id: decoded.userId,
        email: decoded.email,
        role: decoded.role,
      },
    });
  } catch (error) {
    console.error('Auth verify error:', error);
    return NextResponse.json(
      { success: false, authenticated: false, message: 'Terjadi kesalahan' },
      { status: 500 }
    );
  }
}
