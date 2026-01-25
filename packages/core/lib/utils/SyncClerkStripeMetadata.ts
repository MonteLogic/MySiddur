
// packages/core/src/server/subscription.ts
import 'server-only'; 
import { clerkClient } from '@clerk/nextjs/server'; // Explicit server import
import type { SubscriptionMetadata } from '@mysiddur/types'; // Use workspace protocol

/**
 * Updates subscription metadata in Clerk.
 * Note: This must only be called from Server Actions or API Routes.
 */
export async function updateUserSubscriptionMetadata(
  userId: string,
  subscriptionData: Partial<SubscriptionMetadata>,
): Promise<void> {
  try {
    const client = clerkClient; // clerkClient is an object in v4/v5 nextjs SDK
    const user = await client.users.getUser(userId);

    // Deep merge the specific 'subscription' key
    const existingSubscription = (user.privateMetadata?.subscription as SubscriptionMetadata) || {};
    
    const updatedSubscription = {
      ...existingSubscription,
      ...subscriptionData,
      updatedAt: new Date().toISOString(),
    };

    await client.users.updateUser(userId, {
      privateMetadata: {
        ...user.privateMetadata, // Preserve other keys (e.g., 'role', 'onboarding')
        subscription: updatedSubscription,
      },
    });
  } catch (error) {
    // Log the actual error for debugging, but throw a clean message for the UI
    console.error(`[Clerk/Stripe Sync Error] for user ${userId}:`, error);
    throw new Error('Failed to synchronize subscription data.');
  }
}