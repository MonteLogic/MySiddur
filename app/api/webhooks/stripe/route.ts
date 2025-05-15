/**
 * @file app/api/webhooks/stripe/route.ts
 * @description Webhook handler for Stripe events to update Clerk metadata
 */

import { NextResponse } from 'next/server';
import { clerkClient } from '@clerk/nextjs';
import Stripe from 'stripe';
import { headers } from 'next/headers';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-12-18.acacia',
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

/**
 * Parse raw body for Stripe webhook
 */
async function getBody(req: Request) {
  const body = await req.text();
  return body;
}

/**
 * Updates user metadata in Clerk with Stripe customer ID
 */
async function updateUserMetadata(userId: string, stripeCustomerId: string) {
  try {
    const user = await clerkClient.users.getUser(userId);
    const currentMetadata = user.privateMetadata;

    await clerkClient.users.updateUser(userId, {
      privateMetadata: {
        ...currentMetadata,
        stripeCustomerId,
      },
    });

    console.log(
      `Updated metadata for user ${userId} with Stripe customer ${stripeCustomerId}`,
    );
  } catch (error) {
    console.error('Error updating user metadata:', error);
    throw error;
  }
}

export async function POST(req: Request) {
  try {
    const body = await getBody(req);
    const signature = (await headers()).get('stripe-signature')!;

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err) {
      console.error('Webhook signature verification failed:', err);
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    // Handle the event
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;

        // Get the Clerk user ID from metadata
        const userId = session.metadata?.userId;
        if (!userId) {
          console.error('No userId in session metadata');
          return NextResponse.json(
            { error: 'No userId found' },
            { status: 400 },
          );
        }

        // Get or create Stripe customer
        const customerId = session.customer as string;

        // Update Clerk user metadata with Stripe customer ID
        await updateUserMetadata(userId, customerId);

        break;
      }

      // Handle other event types if needed
      default:
        console.log(`Unhandled event type ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 },
    );
  }
}
