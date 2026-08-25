import { NextResponse } from 'next/server';

export async function POST() {
  const response = NextResponse.json({ success: true }, { status: 200 });
  
  // Clear the auth cookies
  response.cookies.delete('auth_token');
  response.cookies.delete('user_role');
  
  return response;
}
