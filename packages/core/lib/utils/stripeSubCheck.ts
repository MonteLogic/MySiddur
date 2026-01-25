/**
* @fileoverview Server component that checks Stripe subscription status
* @module SubscriptionCheck
*/

import { auth, clerkClient } from '@clerk/nextjs';
import Stripe from 'stripe';

/** Initialize Stripe client */
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  //@ts-ignore
 apiVersion: '2024-12-18.acacia'
});

/** 
* Subscription status response type
* @typedef {Object} SubscriptionStatus
* @property {boolean} isActive - Whether subscription is active
* @property {string} [planId] - ID of subscribed plan
* @property {string} [expiresAt] - ISO timestamp of subscription expiration
* @property {string} [error] - Error message if check failed
*/

async function getSubscriptionStatus() {
 try {
   const { userId } = auth();
   if (!userId) return { isActive: false };
   
   const user = await clerkClient.users.getUser(userId);
   const stripeCustomerId = user.privateMetadata.stripeCustomerId as string;
   if (!stripeCustomerId) return { isActive: false };

   const subscriptions = await stripe.subscriptions.list({
     customer: stripeCustomerId,
     status: 'active',
     limit: 1,
     expand: ['data.items.data.price']
   });

   if (!subscriptions.data.length) return { isActive: false };
   
   const subscription = subscriptions.data[0];
   const priceId = subscription.items.data[0].price.product as string;
   
   // Fetch product details separately
   const product = await stripe.products.retrieve(priceId);

   console.log(48, product.name);
   return {
     isActive: true,
     planId: priceId,
     planName: product.name,
     expiresAt: new Date(subscription.current_period_end * 1000).toISOString()
   };
 } catch (error) {
   console.error('Error checking subscription:', error);
   return { isActive: false, error: 'Failed to check subscription' };
 }
}

/**
* Server component that provides subscription status
* @async
* @returns {Promise<{status: SubscriptionStatus}>} Wrapped subscription status
*/
export default async function SubscriptionCheck() {
 const status = await getSubscriptionStatus();
 return { status };
}