'use client';

import { useSession as useClerkSession, useUser as useClerkUser } from '@clerk/nextjs';

export function useSession() {
  return useClerkSession();
}

export function useUser() {
  return useClerkUser();
}

