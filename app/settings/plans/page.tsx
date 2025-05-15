// app/settings/plans/page.tsx
import { PricingCards } from './components/PricingCards';
import { features, prices } from './data';

export default async function Page() {
  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="mb-12">
        <h1 className="text-2xl font-bold mb-4 text-blue-600">Plans & Features</h1>
        <p className="text-gray-200">
          Contractor Bud offers four tiers of service to meet different organizational needs. 
          Each tier builds upon the previous one, adding more advanced features and capabilities.
        </p>
      </div>

      <PricingCards features={features} prices={prices} />

      <div className="mt-12">
        <p className="text-gray-200 text-sm">
          For detailed pricing information and custom enterprise solutions, please contact our sales team.
        </p>
      </div>
    </div>
  );
}