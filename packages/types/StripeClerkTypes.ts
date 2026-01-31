/** Status values for a subscription */
export type SubscriptionStatus = 'active' | 'canceled' | 'past_due' | 'unpaid';

/** Metadata for a subscription */
export interface SubscriptionMetadata {
  /** Stripe product ID */
  planId: string;
  /** Current subscription status */
  status: SubscriptionStatus;
  /** Stripe customer ID */
  customerId: string;
  /** ISO timestamp when current period started */
  currentPeriodStart: string;
  /** ISO timestamp when current period ends */
  currentPeriodEnd: string;
  /** Whether subscription will cancel at period end */
  cancelAtPeriodEnd: boolean;
  /** ISO timestamp of last payment */
  lastPaymentDate: string;
  /** ISO timestamp of next billing date */
  nextBillingDate: string;
}

/** Enum for payment status values */
export enum PaymentStatusEnum {
  ACTIVE = 'active',
  PAST_DUE = 'past_due',
  CANCELED = 'canceled',
}

/** Current subscription status information */
export interface StripeSubscriptionStatus {
  status: {
    /** Whether subscription is currently active
     * "active" | or another option
     */
    isActive: boolean;
    /** Stripe product ID for subscription plan */
    planId: string;

    planName?: string;

    /** ISO timestamp when subscription expires */
    expiresAt: string;
    /** Array for transactions **/
    recentTransactions: Array<{
      id: string;
      amount: number;
      date: string;
    }>;
  };
}
