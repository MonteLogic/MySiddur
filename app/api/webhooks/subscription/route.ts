// Example usage in an API route:
// app/api/webhooks/subscription/route.ts
import { updateUserSubscriptionMetadata } from '#/utils/SyncClerkStripeMetadata';
import { NextResponse } from 'next/server';
// import { updateUserSubscriptionMetadata } from '@/utils/clerk-metadata';
import { SubscriptionMetadata } from '#/types/StripeClerkTypes';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { userId, subscription } = body;

    // Example of processing a webhook from your payment provider
    const subscriptionMetadata: Partial<SubscriptionMetadata> = {
      planId: subscription.plan_id,
      status: subscription.status,
      currentPeriodStart: subscription.current_period_start,
      currentPeriodEnd: subscription.current_period_end,
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
      lastPaymentDate: subscription.last_payment_date,
      nextBillingDate: subscription.next_billing_date,
    };

    await updateUserSubscriptionMetadata(userId, subscriptionMetadata);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Webhook processing error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
