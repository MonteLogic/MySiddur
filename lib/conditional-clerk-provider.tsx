/**
 * Conditional ClerkProvider that only renders ClerkProvider when enabled
 * When disabled, uses a minimal mock provider to satisfy Clerk hooks
 */

'use client';

import { ClerkProvider } from '@clerk/nextjs';
import { ReactNode, createContext, useContext } from 'react';

// Check if Clerk is disabled
const isClerkDisabled = () => {
  if (typeof window !== 'undefined') {
    return process.env.NEXT_PUBLIC_DISABLE_CLERK === 'true';
  }
  return process.env.DISABLE_CLERK === 'true' || process.env.NEXT_PUBLIC_DISABLE_CLERK === 'true';
};

interface ConditionalClerkProviderProps {
  children: ReactNode;
  publishableKey?: string;
}

/**
 * Conditionally renders ClerkProvider only when Clerk is enabled and a valid key is provided
 * When disabled, we need to provide a minimal context to prevent hook errors
 * However, since Clerk validates keys, we'll skip ClerkProvider entirely when disabled
 * and let components handle the missing context via conditional rendering
 */
export function ConditionalClerkProvider({ children, publishableKey }: ConditionalClerkProviderProps) {
  const disabled = isClerkDisabled();
  
  // If Clerk is disabled or no valid key, render children without ClerkProvider
  // Components using Clerk hooks will need to handle this via error boundaries
  // or conditional rendering (which they already do via isClerkDisabled checks)
  if (disabled || !publishableKey) {
    return <>{children}</>;
  }
  
  // Only render ClerkProvider when enabled and we have a valid key
  return (
    <ClerkProvider publishableKey={publishableKey} afterSignInUrl="/" afterSignUpUrl="/">
      {children}
    </ClerkProvider>
  );
}

