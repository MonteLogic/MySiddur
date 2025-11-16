import { authMiddleware } from '@clerk/nextjs';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Check if Clerk is disabled via environment variable
const isClerkDisabled = process.env.DISABLE_CLERK === 'true' || process.env.NEXT_PUBLIC_DISABLE_CLERK === 'true';

// This example protects all routes including api/trpc routes
// Please edit this to allow other routes to be public as needed.
// See https://clerk.com/docs/references/nextjs/auth-middleware for more information about configuring your Middleware
const clerkMiddleware = authMiddleware({
  publicRoutes: [
    /^\/blog(\/.*)?$/, // This is the key change

    '/',
    '/api/webhooks(.*)',
    '/api/generate-basic-siddur',
  ],
});

// If Clerk is disabled, create a passthrough middleware
const passthroughMiddleware = (req: NextRequest) => {
  return NextResponse.next();
};

// Export the appropriate middleware based on the environment variable
export default isClerkDisabled ? passthroughMiddleware : clerkMiddleware;

export const config = {
  matcher: ['/((?!.+\\.[\\w]+$|_next).*)', '/', '/(api|trpc)(.*)'],
};
