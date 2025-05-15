import type { Stripe } from 'stripe';

export interface CustomerInformationProps {
  email: string | null;
  created: number;
}

export interface ActiveSubscriptionsProps {
  subscriptions: Stripe.Subscription[];
}

export interface LatestInvoiceProps {
  invoice: Stripe.Invoice | null;
}