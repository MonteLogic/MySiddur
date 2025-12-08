import { authMiddleware } from '@clerk/nextjs';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// This example protects all routes including api/trpc routes
// Please edit this to allow other routes to be public as needed.
// See https://clerk.com/docs/references/nextjs/auth-middleware for more information about configuring your Middleware
const clerkMiddleware = authMiddleware({
  publicRoutes: [
    /^\/blog(\/.*)?$/, // This is the key change

    '/',
    '/api/webhooks(.*)',
    '/api/generate-basic-siddur',
    '/api/siddur/latest',
  ],
});

export default clerkMiddleware;

export const config = {
  matcher: ['/((?!.+\\.[\\w]+$|_next).*)', '/', '/(api|trpc)(.*)'],
};
