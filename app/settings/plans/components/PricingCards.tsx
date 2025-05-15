// app/settings/plans/components/pricing-cards.tsx
import { features, prices, PricingTier } from '../data';
import { PricingCard } from './PricingCard';

interface PricingCardsProps {
  features: typeof features;
  prices: typeof prices;
}

export function PricingCards({ features, prices }: PricingCardsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <PricingCard
        tier="basic"
        title="Free Tier"
        price={prices.basic}
        features={features.basic}
        description="Basic functionality for small contractors."
      />
      
      <PricingCard
        tier="pro"
        title="Pro Tier"
        price={prices.pro}
        features={features.pro}
        description="Enhanced features for growing businesses."
      />
      
      <PricingCard
        tier="max"
        title="Max Tier"
        price={prices.max}
        features={features.max}
        description="Advanced features for large operations."
      />
      
      <PricingCard
        tier="enterprise"
        title="Enterprise Tier"
        price={prices.enterprise}
        features={features.enterprise}
        description="Custom solutions for large organizations."
      />
    </div>
  );
}