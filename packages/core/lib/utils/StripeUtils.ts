import Stripe from 'stripe';

/**
 * Initialize Stripe with the secret key from environment variables
 * @remarks Make sure STRIPE_SECRET_KEY is set in your environment
 */
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  //@ts-ignore
  apiVersion: '2024-12-18.acacia',
});
/**
 * Interface for customer metadata from Clerk
 * @interface
 */
export interface ClerkMetadata {
  /** Stripe customer ID stored in Clerk metadata */
  stripeCustomerId?: string;
  /** Any additional random metadata */
  randomMetaData?: number;
}

/**
 * Interface for the complete customer data response
 * @interface
 */
export interface CustomerDataResponse {
  /** The full Stripe customer object */
  customer: Stripe.Customer;
  /** Array of active subscriptions for the customer */
  activeSubscriptions: Stripe.Subscription[];
  /** The most recent invoice for the customer, if any */
  latestInvoice: Stripe.Invoice | null;
}

/**
 * Retrieves detailed customer information from Stripe
 * @param stripeCustomerId - The Stripe customer ID to lookup
 * @returns Promise resolving to customer details including subscriptions and latest invoice
 * @throws Will throw an error if the Stripe API request fails
 * @example
 * ```typescript
 * const customerData = await getCustomerDetails('cus_123456789');
 * console.log(customerData.customer.email);
 * ```
 */
export async function getCustomerDetails(
  stripeCustomerId: string,
): Promise<CustomerDataResponse> {
  try {
    // Fetch the customer details
    const customer = await stripe.customers.retrieve(stripeCustomerId);

    if (customer.deleted) {
      throw new Error('Customer has been deleted');
    }

    // Fetch active subscriptions for the customer
    const subscriptions = await stripe.subscriptions.list({
      customer: stripeCustomerId,
      status: 'active',
      expand: ['data.default_payment_method'],
    });

    // Get the most recent invoice
    const invoices = await stripe.invoices.list({
      customer: stripeCustomerId,
      limit: 1,
    });

    return {
      customer,
      activeSubscriptions: subscriptions.data,
      latestInvoice: invoices.data[0] || null,
    };
  } catch (error) {
    console.error('Error fetching customer details:', error);
    throw error;
  }
}
