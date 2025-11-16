/**
 * Conditional ClerkProvider that always renders ClerkProvider
 * When disabled, uses a valid test key format that Clerk will accept
 */

'use client';

import { ClerkProvider } from '@clerk/nextjs';
import { ReactNode } from 'react';

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
 * Always renders ClerkProvider to ensure hooks have context
 * When disabled, uses a test key that Clerk accepts but won't initialize
 */
export function ConditionalClerkProvider({ children, publishableKey }: ConditionalClerkProviderProps) {
  const disabled = isClerkDisabled();
  
  // Use a valid test key format when disabled - Clerk will accept this format
  // but won't actually initialize, providing empty context
  const effectiveKey = disabled 
    ? 'pk_test_00000000000000000000000000000000' // Valid format but fake key
    : (publishableKey || 'pk_test_00000000000000000000000000000000');
  
  return (
    <ClerkProvider publishableKey={effectiveKey} afterSignInUrl="/" afterSignUpUrl="/">
      {children}
    </ClerkProvider>
  );
}

