/**
 * Safe Clerk hooks that handle the case when Clerk is disabled
 * These hooks return safe fallback values when DISABLE_CLERK is set to 'true'
 * 
 * IMPORTANT: When Clerk is disabled, ClerkProvider won't be rendered, so
 * calling Clerk hooks will throw errors. We check if Clerk is disabled first
 * and return safe defaults, but we still need to call the hooks conditionally.
 * However, React requires hooks to be called unconditionally, so we use a
 * try-catch pattern with useState to handle errors gracefully.
 */

'use client';

import { useSession as useClerkSession, useUser as useClerkUser } from '@clerk/nextjs';
import { useMemo, useState, useEffect } from 'react';

const isClerkDisabled = () => {
  if (typeof window !== 'undefined') {
    return process.env.NEXT_PUBLIC_DISABLE_CLERK === 'true';
  }
  return process.env.DISABLE_CLERK === 'true' || process.env.NEXT_PUBLIC_DISABLE_CLERK === 'true';
};

/**
 * Safe wrapper for useSession hook
 * Returns null session and isLoaded=true when Clerk is disabled
 * Uses error handling to gracefully handle missing ClerkProvider
 */
export function useSession() {
  const isDisabled = isClerkDisabled();
  const [error, setError] = useState<Error | null>(null);
  const [sessionData, setSessionData] = useState<any>(null);
  
  // Try to call the hook, but catch errors if ClerkProvider isn't available
  let clerkSession: any = null;
  try {
    clerkSession = useClerkSession();
  } catch (err) {
    // If ClerkProvider isn't rendered, the hook will throw
    // We'll handle this by returning safe defaults
    if (!error && err instanceof Error) {
      setError(err);
    }
  }
  
  useEffect(() => {
    if (clerkSession) {
      setSessionData(clerkSession);
      setError(null);
    }
  }, [clerkSession]);
  
  return useMemo(() => {
    if (isDisabled || error || !clerkSession) {
      return { session: null, isLoaded: true };
    }
    return clerkSession;
  }, [isDisabled, error, clerkSession]);
}

/**
 * Safe wrapper for useUser hook
 * Returns null user and isLoaded=true when Clerk is disabled
 * Uses error handling to gracefully handle missing ClerkProvider
 */
export function useUser() {
  const isDisabled = isClerkDisabled();
  const [error, setError] = useState<Error | null>(null);
  const [userData, setUserData] = useState<any>(null);
  
  // Try to call the hook, but catch errors if ClerkProvider isn't available
  let clerkUser: any = null;
  try {
    clerkUser = useClerkUser();
  } catch (err) {
    // If ClerkProvider isn't rendered, the hook will throw
    // We'll handle this by returning safe defaults
    if (!error && err instanceof Error) {
      setError(err);
    }
  }
  
  useEffect(() => {
    if (clerkUser) {
      setUserData(clerkUser);
      setError(null);
    }
  }, [clerkUser]);
  
  return useMemo(() => {
    if (isDisabled || error || !clerkUser) {
      return { user: null, isLoaded: true };
    }
    return clerkUser;
  }, [isDisabled, error, clerkUser]);
}

