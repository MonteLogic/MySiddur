/**
 * @fileoverview API route handler for checking Stripe subscription status
 * @module CheckSubscriptionRoute
 */

import { NextResponse } from 'next/server';
import { auth, clerkClient } from '@clerk/nextjs';
import Stripe from 'stripe';

/** Initialize Stripe client */
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-12-18.acacia'
});

/**
 * GET handler for subscription status check
 * @async
 * @returns {Promise<NextResponse>} JSON response with subscription status
 */
export async function GET(): Promise<NextResponse> {
  try {
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's Stripe customer ID from Clerk metadata
    const user = await clerkClient.users.getUser(userId);
    const stripeCustomerId = user.privateMetadata.stripeCustomerId as string;

    if (!stripeCustomerId) {
      return NextResponse.json({ isActive: false });
    }

    // Check for active subscriptions
    const subscriptions = await stripe.subscriptions.list({
      customer: stripeCustomerId,
      status: 'active',
      limit: 1
    });

    if (!subscriptions.data.length) {
      return NextResponse.json({ isActive: false });
    }

    const subscription = subscriptions.data[0];

    return NextResponse.json({
      isActive: true,
      planId: subscription.items.data[0].price.product,
      expiresAt: new Date(subscription.current_period_end * 1000).toISOString()
    });
  } catch (error) {
    console.error('Error checking subscription:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}