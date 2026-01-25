'use client'
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  CreditCard, 
  Settings, 
  Check, 
  Users, 
  Calendar, 
  DollarSign,
  Loader2,
  Package
} from 'lucide-react';

interface SubscriptionPlan {
  name: string;
  price: string;
  interval: string;
  currency: string;
  active: boolean;
}

interface PaymentStatusProps {
  plan: SubscriptionPlan | null;
  orgSize: number;
}

export default function PaymentStatus({ plan, orgSize }: PaymentStatusProps) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubscriptionAction = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      const data = await response.json();
      if (data.url) {
        router.push(data.url);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleManageSubscription = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/create-portal', {
        method: 'POST',
      });
      const data = await response.json();
      if (data.url) {
        router.push(data.url);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto bg-white rounded-lg shadow-sm border p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Package className="h-5 w-5" />
            Subscription Status
          </h2>
          {plan?.active && (
            <span className="px-2 py-1 bg-green-100 text-green-800 text-sm rounded-full flex items-center gap-1">
              <Check className="h-4 w-4" />
              Active
            </span>
          )}
        </div>
        <p className="text-gray-500">
          Manage your subscription and billing information
        </p>
      </div>

      {/* Content */}
      <div className="space-y-4">
        {plan ? (
          <div className="space-y-4">
            <div className="grid gap-4">
              <div className="flex items-center justify-between py-2 border-b">
                <div className="flex items-center gap-2">
                  <Package className="h-4 w-4 text-gray-500" />
                  <span className="text-gray-600">Current Plan</span>
                </div>
                <span className="font-medium">{plan.name}</span>
              </div>
              
              <div className="flex items-center justify-between py-2 border-b">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-gray-500" />
                  <span className="text-gray-600">Price</span>
                </div>
                <span className="font-medium">
                  {plan.price} {plan.currency.toUpperCase()}/{plan.interval}
                </span>
              </div>
              
              <div className="flex items-center justify-between py-2 border-b">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-gray-500" />
                  <span className="text-gray-600">Organization Size</span>
                </div>
                <span className="font-medium">{orgSize} users</span>
              </div>

              <div className="flex items-center justify-between py-2 border-b">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-gray-500" />
                  <span className="text-gray-600">Billing Interval</span>
                </div>
                <span className="font-medium capitalize">{plan.interval}ly</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-6">
            <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 mb-4">
              {orgSize > 1 ? (
                "Your organization has multiple users. Please subscribe to continue."
              ) : (
                "No active subscription. Subscribe when you're ready to add more users."
              )}
            </p>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="mt-6 flex justify-end">
        {plan?.active ? (
          <button
            onClick={handleManageSubscription}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Settings className="h-4 w-4" />
            )}
            Manage Subscription
          </button>
        ) : (
          <button
            onClick={handleSubscriptionAction}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <CreditCard className="h-4 w-4" />
            )}
            {orgSize > 1 ? 'Subscribe Now' : 'Upgrade'}
          </button>
        )}
      </div>
    </div>
  );
}