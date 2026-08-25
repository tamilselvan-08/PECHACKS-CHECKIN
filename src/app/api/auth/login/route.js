import { NextResponse } from 'next/server';
import { signToken } from '@/lib/auth';

export async function POST(request) {
  try {
    const { password } = await request.json();
    
    if (!password) {
      return NextResponse.json({ error: 'Password is required' }, { status: 400 });
    }

    const adminPassword = process.env.ADMIN_PASSWORD;
    const volunteerPassword = process.env.VOLUNTEER_PASSWORD;
    
    let role = null;
    if (password === adminPassword) {
      role = 'admin';
    } else if (password === volunteerPassword) {
      role = 'volunteer';
    }

    if (role) {
      // Create JWT token
      const token = await signToken({ role });
      
      const response = NextResponse.json({ success: true, role }, { status: 200 });
      
      // Set HTTP-only cookie for secure auth
      response.cookies.set({
        name: 'auth_token',
        value: token,
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 24, // 24 hours
      });

      // Set accessible cookie for UI state
      response.cookies.set({
        name: 'user_role',
        value: role,
        httpOnly: false,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 24,
      });
      
      return response;
    } else {
      return NextResponse.json({ error: 'Invalid password' }, { status: 401 });
    }
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
