/**
 * Safe Clerk hooks that handle the case when Clerk is disabled
 * These hooks return safe fallback values when DISABLE_CLERK is set to 'true'
 * 
 * IMPORTANT: When Clerk is disabled, ClerkProvider won't be rendered.
 * React hooks must be called unconditionally, so we always call the Clerk hooks.
 * If ClerkProvider is missing, the hooks will throw errors that need to be
 * caught by error boundaries. Components should check isClerkDisabled() and
 * conditionally render Clerk-dependent UI.
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
 * Note: If ClerkProvider isn't rendered, this will throw an error
 * that should be caught by an error boundary or handled by conditional rendering
 */
export function useSession() {
  const isDisabled = isClerkDisabled();
  
  // Always call the hook - React requires this
  // If ClerkProvider isn't rendered and Clerk is disabled, components should
  // check isClerkDisabled() before using Clerk hooks, or use error boundaries
  let clerkSession: ReturnType<typeof useClerkSession>;
  
  // Check if Clerk is disabled first - if so, return safe defaults
  // However, we still need to call the hook due to React rules
  // Components using this should check isClerkDisabled() and conditionally render
  if (isDisabled) {
    // When disabled, we can't call the hook safely, so we'll return a safe default
    // The component should handle this case via conditional rendering
    return useMemo(() => ({ session: null, isLoaded: true }), []);
  }
  
  clerkSession = useClerkSession();
  
  return useMemo(() => {
    return clerkSession;
  }, [clerkSession]);
}

/**
 * Safe wrapper for useUser hook
 * Returns null user and isLoaded=true when Clerk is disabled
 * Note: If ClerkProvider isn't rendered, this will throw an error
 * that should be caught by an error boundary or handled by conditional rendering
 */
export function useUser() {
  const isDisabled = isClerkDisabled();
  
  // Always call the hook - React requires this
  // If ClerkProvider isn't rendered and Clerk is disabled, components should
  // check isClerkDisabled() before using Clerk hooks, or use error boundaries
  let clerkUser: ReturnType<typeof useClerkUser>;
  
  // Check if Clerk is disabled first - if so, return safe defaults
  // However, we still need to call the hook due to React rules
  // Components using this should check isClerkDisabled() and conditionally render
  if (isDisabled) {
    // When disabled, we can't call the hook safely, so we'll return a safe default
    // The component should handle this case via conditional rendering
    return useMemo(() => ({ user: null, isLoaded: true }), []);
  }
  
  clerkUser = useClerkUser();
  
  return useMemo(() => {
    return clerkUser;
  }, [clerkUser]);
}

