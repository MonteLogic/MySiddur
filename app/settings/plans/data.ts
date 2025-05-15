import * as prodProducts from '#/products/prod-products.json';
import * as testProducts from '#/products/test-products.json';

export const features = {
  basic: ["Basic timecard management", "Simple scheduling", "Single route management", "Basic reporting", "Mobile app access"],
  pro: ["Advanced timecard management", "Multi-route scheduling", "Route optimization", "Detailed analytics", "Priority support", "Employee management", "Custom notifications"],
  max: ["Enterprise-grade scheduling", "Advanced route optimization", "Real-time GPS tracking", "Advanced reporting & analytics", "API access", "Dedicated account manager", "Custom integrations", "Bulk operations"],
  enterprise: ["All Max features", "Custom deployment", "24/7 premium support", "Unlimited users", "Custom feature development", "SLA guarantees", "Training & onboarding", "Security compliance"]
};

export const prices = {
  basic: 'Free',
  pro: '$49/month',
  max: '$99/month',
  enterprise: 'Custom'
} as const;

const products = process.env.NODE_ENV === 'production' 
  ? prodProducts['prod-products']
  : testProducts['test-products'];

export const stripeProductIds = {
  basic: 'free',
  pro: products.pro.id,      // Now correctly accessing the pro object
  max: products.max.id,      // Now correctly accessing the max object
  enterprise: 'custom'
} as const;
export type PricingTier = keyof typeof stripeProductIds;