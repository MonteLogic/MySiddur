/**
 * @fileoverview StripeSubscriptionSection component for managing subscription status and purchases
 * @module StripeSubscriptionSection
 */

'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import {
  XCircle,
  CheckCircle,
  Loader2,
  CreditCard,
  Package,
} from 'lucide-react';
import type { ProductPlan, PlanId, ProductConfig } from '#/types/ProductTypes';
import products from '#/example-data/products.json' assert { type: 'json' };

const typedProducts = products as ProductConfig;

/**
 * Interface representing the current state of a user's subscription
 * @interface SubscriptionStatus
 */
interface SubscriptionStatus {
  /** Whether the subscription is currently active */
  isActive: boolean;
  /** ISO string of when the subscription expires/renews */
  expiresAt?: string;
  /** ID of the subscribed plan */
  planId?: string;
}

/**
 * Gets the appropriate product details based on environment
 * @param {PlanId} planId - The ID of the plan to retrieve
 * @returns {ProductPlan} Product plan configuration for the current environment
 */
const getPlanDetails = (planId: PlanId = 'base'): ProductPlan => {
  const env =
    process.env.NEXT_PUBLIC_APP_ENV === 'production'
      ? 'production'
      : 'development';
  return typedProducts[env][planId];
};

/**
 * Component for displaying subscription status and handling plan purchases
 * @component
 * @returns {JSX.Element} The rendered subscription section
 */
export default function StripeSubscriptionSection(): JSX.Element {
  const { user, isLoaded } = useUser();
  const [loading, setLoading] = useState<boolean>(false);
  const [subscriptionStatus, setSubscriptionStatus] =
    useState<SubscriptionStatus | null>(null);
  const [statusLoading, setStatusLoading] = useState<boolean>(true);
  const plan = getPlanDetails();

  /**
   * Checks the user's current subscription status
   * @async
   */
  useEffect(() => {
    async function checkSubscription() {
      if (!user) return;
      try {
        const response = await fetch('/api/stripe/check-subscription');
        const data = await response.json();
        setSubscriptionStatus(data);
      } catch (error) {
        console.error('Error checking subscription:', error);
      } finally {
        setStatusLoading(false);
      }
    }
    checkSubscription();
  }, [user]);

  /**
   * Initiates the subscription purchase process
   * @async
   */
  const handleSubscribe = async (): Promise<void> => {
    if (!user || subscriptionStatus?.isActive) return;

    setLoading(true);
    try {
      const response = await fetch('/api/stripe/create-subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: plan.id,
          userId: user.id,
        }),
      });

      const data = await response.json();
      if (!response.ok)
        throw new Error(data.error || 'Failed to create subscription');
      if (data.url) window.location.href = data.url;
    } catch (error) {
      console.error('Error creating subscription:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isLoaded || statusLoading) {
    return (
      <div className="rounded-lg border p-6">
        <div className="flex items-center gap-2 text-gray-500">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 rounded-lg border p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Package className="h-5 w-5 text-gray-700" />
          <h2 className="text-xl font-semibold">{plan.name}</h2>
          {plan.env === 'test' && (
            <div className="rounded-full bg-yellow-100 px-2 py-1 text-xs text-yellow-800">
              Test Mode
            </div>
          )}
        </div>
      </div>

      {plan.description && (
        <p className="text-sm text-gray-600">{plan.description}</p>
      )}

      <div className="space-y-4">
        <div className="flex items-center gap-2 text-gray-600">
          {subscriptionStatus?.isActive ? (
            <>
              <CheckCircle className="h-5 w-5 text-green-500" />
              <span>Active subscription</span>
              {subscriptionStatus.expiresAt && (
                <span className="text-sm text-gray-500">
                  (Renews:{' '}
                  {new Date(subscriptionStatus.expiresAt).toLocaleDateString()})
                </span>
              )}
            </>
          ) : (
            <>
              <XCircle className="h-5 w-5" />
              <span>Not subscribed</span>
            </>
          )}
        </div>

        <button
          onClick={handleSubscribe}
          disabled={loading || subscriptionStatus?.isActive}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Processing...
            </>
          ) : subscriptionStatus?.isActive ? (
            'Already subscribed'
          ) : (
            <>
              <CreditCard className="h-4 w-4" />
              Subscribe Now
            </>
          )}
        </button>
      </div>
    </div>
  );
}
