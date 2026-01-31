/**
 * @fileoverview Utility functions for syncing Clerk user metadata with Stripe subscription data
 * @module SyncClerkStripeMetadata
 */

import { clerkClient } from '@clerk/nextjs/server';
import { SubscriptionMetadata } from '#/packages/types/StripeClerkTypes';

/**
 * Updates a user's subscription metadata in Clerk
 * @param userId - The Clerk user ID
 * @param metadata - Partial subscription metadata to update
 * @returns Promise that resolves when the update is complete
 */
export async function updateUserSubscriptionMetadata(
  userId: string,
  metadata: Partial<SubscriptionMetadata>,
): Promise<void> {
  try {
    const client = await clerkClient();
    await client.users.updateUserMetadata(userId, {
      privateMetadata: {
        subscription: metadata,
      },
    });
  } catch (error) {
    console.error('Failed to update user subscription metadata:', error);
    throw error;
  }
}

/**
 * Gets a user's subscription metadata from Clerk
 * @param userId - The Clerk user ID
 * @returns Promise with the subscription metadata or null
 */
export async function getUserSubscriptionMetadata(
  userId: string,
): Promise<Partial<SubscriptionMetadata> | null> {
  try {
    const client = await clerkClient();
    const user = await client.users.getUser(userId);
    return (user.privateMetadata?.subscription as Partial<SubscriptionMetadata>) || null;
  } catch (error) {
    console.error('Failed to get user subscription metadata:', error);
    return null;
  }
}
