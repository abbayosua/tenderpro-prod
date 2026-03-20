import { NextResponse } from 'next/server';

export async function POST() {
  const response = NextResponse.json({ success: true, message: 'Logout berhasil' });
  
  // Clear auth cookie
  response.cookies.delete('auth-token');
  
  return response;
}
