import { NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

// Define which routes to protect
// Here we protect everything except the login page, API login route, and static assets
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api/auth/login (login API)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - login (login page)
     */
    '/((?!api/auth/login|_next/static|_next/image|favicon.ico|login).*)',
  ],
};

export async function middleware(request) {
  const token = request.cookies.get('auth_token')?.value;

  // Paths that don't require authentication
  const isLoginPage = request.nextUrl.pathname === '/login';
  
  if (isLoginPage) {
    // If user is already logged in and tries to access login page, redirect to dashboard
    if (token) {
      try {
        const secretKey = process.env.JWT_SECRET || 'default_secret';
        const key = new TextEncoder().encode(secretKey);
        await jwtVerify(token, key, { algorithms: ['HS256'] });
        return NextResponse.redirect(new URL('/', request.url));
      } catch (e) {
        // Token invalid, let them see login page
      }
    }
    return NextResponse.next();
  }

  // If no token is present, redirect to login (or return 401 for APIs)
  if (!token) {
    if (request.nextUrl.pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Verify the token
  try {
    const secretKey = process.env.JWT_SECRET || 'default_secret';
    const key = new TextEncoder().encode(secretKey);
    const { payload } = await jwtVerify(token, key, { algorithms: ['HS256'] });
    
    // Role-based access control
    const role = payload.role;
    const path = request.nextUrl.pathname;

    if (role === 'volunteer') {
      const forbiddenPages = ['/participants', '/tickets', '/designer', '/checkins', '/settings'];
      const forbiddenApis = ['/api/tickets', '/api/email-config', '/api/template', '/api/upload'];

      const isForbiddenPage = forbiddenPages.some(p => path.startsWith(p));
      const isForbiddenApi = forbiddenApis.some(p => path.startsWith(p));

      if (isForbiddenPage) {
        return NextResponse.redirect(new URL('/', request.url));
      }
      
      if (isForbiddenApi) {
        return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
      }
    }
    
    return NextResponse.next();
  } catch (error) {
    // Token is invalid or expired
    if (request.nextUrl.pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Clear invalid token and redirect to login
    const response = NextResponse.redirect(new URL('/login', request.url));
    response.cookies.delete('auth_token');
    return response;
  }
}
