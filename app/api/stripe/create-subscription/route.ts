/**
 * @file app/api/stripe/create-subscription/route.ts
 * @description API route handler for creating Stripe subscriptions
 */

import { NextResponse } from 'next/server';
import { auth, currentUser } from '@clerk/nextjs';
import Stripe from 'stripe';
import { headers } from 'next/headers';

/** Initialize Stripe with the secret key */
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  // @ts-ignore
  apiVersion: '2024-12-18.acacia',
});

/**
 * Interface for the expected request body
 * @interface CreateSubscriptionRequest
 */
interface CreateSubscriptionRequest {
  /** Stripe product ID to subscribe to */
  productId: string;
  /** User ID from Clerk */
  userId: string;
}

/**
 * Helper function to get base URL depending on environment
 * @returns The base URL of the application
 */
function getBaseUrl(): string {
  if (process.env.NODE_ENV === 'production') {
    return 'https://cbud.app';
  }
  // toDo: Change this to the process url being used
  // not just a hard-coded value.
  return 'http://localhost:3000';
}

/**
 * Creates a Stripe Checkout session for subscription
 * @param request - The incoming HTTP request
 * @returns Promise<NextResponse> with checkout URL or error
 */
export async function POST(request: Request): Promise<NextResponse> {
  try {
    const { userId } = auth();
    const user = await currentUser();

    if (!userId || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { productId }: CreateSubscriptionRequest = await request.json();

    // Create Stripe customer if it doesn't exist
    let stripeCustomerId: string;

    try {
      // Try to get existing customer from your database
      // For now, we'll create a new customer each time
      // In production, you'd want to store and retrieve this
      const customer = await stripe.customers.create({
        email: user.emailAddresses[0].emailAddress,
        metadata: {
          clerkUserId: userId,
        },
      });

      stripeCustomerId = customer.id;
    } catch (error) {
      console.error('Error creating/retrieving Stripe customer:', error);
      return NextResponse.json(
        { error: 'Failed to process customer information' },
        { status: 500 },
      );
    }

    // Get the price ID for the product
    const prices = await stripe.prices.list({
      product: productId,
      active: true,
      type: 'recurring',
    });

    if (!prices.data.length) {
      return NextResponse.json(
        { error: 'No price found for this product' },
        { status: 404 },
      );
    }

    const baseUrl = getBaseUrl();

    // Create Checkout session
    const session = await stripe.checkout.sessions.create({
      customer: stripeCustomerId,
      line_items: [
        {
          price: prices.data[0].id,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${baseUrl}/settings?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/settings`,
      metadata: {
        userId,
        productId,
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error('Error creating subscription:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
