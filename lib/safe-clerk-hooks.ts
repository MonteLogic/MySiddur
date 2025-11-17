/**
 * Safe Clerk hooks that handle the case when Clerk is disabled
 * 
 * IMPORTANT: These hooks must always call the underlying Clerk hooks (React rules).
 * When Clerk is disabled, ClerkProvider won't be rendered, so calling these hooks
 * will throw errors. Components using these hooks should check isClerkDisabled()
 * and conditionally render, or wrap the component tree in an error boundary.
 * 
 * For now, we check isClerkDisabled() and return safe defaults without calling
 * the Clerk hooks. This violates React's rules of hooks but is necessary when
 * ClerkProvider isn't available. Components should handle this gracefully.
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
 * 
 * WARNING: This hook conditionally calls useClerkSession, which violates
 * React's rules of hooks. This is necessary when ClerkProvider isn't rendered.
 * Components should check isClerkDisabled() before rendering components that use this hook.
 */
export function useSession() {
  const isDisabled = isClerkDisabled();
  
  // When Clerk is disabled, ClerkProvider won't be rendered, so we can't call the hook
  // Return safe defaults instead. This violates React's rules but is necessary.
  if (isDisabled) {
    return useMemo(() => ({ session: null, isLoaded: true }), []);
  }
  
  // When enabled, always call the hook
  const clerkSession = useClerkSession();
  return useMemo(() => clerkSession, [clerkSession]);
}

/**
 * Safe wrapper for useUser hook
 * Returns null user and isLoaded=true when Clerk is disabled
 * 
 * WARNING: This hook conditionally calls useClerkUser, which violates
 * React's rules of hooks. This is necessary when ClerkProvider isn't rendered.
 * Components should check isClerkDisabled() before rendering components that use this hook.
 */
export function useUser() {
  const isDisabled = isClerkDisabled();
  
  // When Clerk is disabled, ClerkProvider won't be rendered, so we can't call the hook
  // Return safe defaults instead. This violates React's rules but is necessary.
  if (isDisabled) {
    return useMemo(() => ({ user: null, isLoaded: true }), []);
  }
  
  // When enabled, always call the hook
  const clerkUser = useClerkUser();
  return useMemo(() => clerkUser, [clerkUser]);
}

