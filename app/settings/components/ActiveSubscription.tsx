// app/settings/components/ActiveSubscription.tsx
"use client";

import type { Stripe } from 'stripe';
import { ActiveSubscriptionsProps } from '../settings-types';

export function ActiveSubscriptions({ subscriptions }: ActiveSubscriptionsProps) {
  if (subscriptions.length === 0) return null;

  const getProductName = (product: string | Stripe.Product | Stripe.DeletedProduct) => {
    if (typeof product === 'string') return product;
    if ('name' in product) return product.name;
    return 'Deleted Product';
  };

  return (
    <div className="rounded-lg border p-4">
      <h3 className="text-lg font-semibold">Active Subscriptions</h3>
      {subscriptions.map((sub) => (
        <div key={sub.id} className="mt-2 space-y-1">
          <p>Plan: {getProductName(sub.items.data[0].price.product)}</p>
          <p>
            Status:{' '}
            <span className="inline-block rounded-full bg-green-100 px-2 py-1 text-sm text-green-800">
              {sub.status}
            </span>
          </p>
          <p>
            Current Period End:{' '}
            {new Date(sub.current_period_end * 1000).toLocaleDateString()}
          </p>
        </div>
      ))}
    </div>
  );
}

