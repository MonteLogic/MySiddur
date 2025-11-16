/**
 * Safe Clerk hooks that handle the case when Clerk is disabled
 * These hooks return safe fallback values when DISABLE_CLERK is set to 'true'
 * 
 * IMPORTANT: These hooks must always call the Clerk hooks (React rules),
 * but when Clerk is disabled, ClerkProvider won't be rendered, so we need
 * to handle the missing context gracefully via error boundaries or by
 * ensuring ClerkProvider always renders (even with a dummy key).
 */

'use client';

import { useSession as useClerkSession, useUser as useClerkUser } from '@clerk/nextjs';
import { useMemo } from 'react';

const isClerkDisabled = () => {
  if (typeof window !== 'undefined') {
    return process.env.NEXT_PUBLIC_DISABLE_CLERK === 'true';
  }
  return process.env.DISABLE_CLERK === 'true' || process.env.NEXT_PUBLIC_DISABLE_CLERK === 'true';
};

/**
 * Safe wrapper for useSession hook
 * Returns null session and isLoaded=true when Clerk is disabled
 * Note: Hooks must always be called (React rules), so we always call useClerkSession
 */
export function useSession() {
  const isDisabled = isClerkDisabled();
  
  // Always call the hook - React requires this
  // If ClerkProvider isn't rendered, this will throw, which should be caught by error boundary
  const clerkSession = useClerkSession();
  
  return useMemo(() => {
    if (isDisabled) {
      return { session: null, isLoaded: true };
    }
    return clerkSession;
  }, [isDisabled, clerkSession]);
}

/**
 * Safe wrapper for useUser hook
 * Returns null user and isLoaded=true when Clerk is disabled
 * Note: Hooks must always be called (React rules), so we always call useClerkUser
 */
export function useUser() {
  const isDisabled = isClerkDisabled();
  
  // Always call the hook - React requires this
  // If ClerkProvider isn't rendered, this will throw, which should be caught by error boundary
  const clerkUser = useClerkUser();
  
  return useMemo(() => {
    if (isDisabled) {
      return { user: null, isLoaded: true };
    }
    return clerkUser;
  }, [isDisabled, clerkUser]);
}

