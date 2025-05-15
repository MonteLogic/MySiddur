import React from 'react';
import { Check } from 'lucide-react';

export default function Page() {
  const features = {
    basic: [
      "Basic timecard management",
      "Simple scheduling",
      "Single route management",
      "Basic reporting",
      "Mobile app access"
    ],
    pro: [
      "Advanced timecard management",
      "Multi-route scheduling",
      "Route optimization",
      "Detailed analytics",
      "Priority support",
      "Employee management",
      "Custom notifications"
    ],
    max: [
      "Enterprise-grade scheduling",
      "Advanced route optimization",
      "Real-time GPS tracking",
      "Advanced reporting & analytics",
      "API access",
      "Dedicated account manager",
      "Custom integrations",
      "Bulk operations"
    ],
    enterprise: [
      "All Max features",
      "Custom deployment",
      "24/7 premium support",
      "Unlimited users",
      "Custom feature development",
      "SLA guarantees",
      "Training & onboarding",
      "Security compliance"
    ]
  };

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="mb-12">
        <h1 className="text-2xl font-bold mb-4 text-blue-600">Plans & Features</h1>
        <p className="text-gray-200">
          Contractor Bud offers four tiers of service to meet different organizational needs. 
          Each tier builds upon the previous one, adding more advanced features and capabilities.
        </p>
      </div>

      <div className="space-y-8">
        {/* Free Tier */}
        <section className="border-l-4 border-blue-500 pl-4">
          <h2 className="text-xl font-semibold text-blue-600 mb-2">Free Tier</h2>
          <p className="text-gray-200 mb-4">Basic functionality for small contractors and individual users.</p>
          <ul className="space-y-2">
            {features.basic.map((feature, index) => (
              <li key={index} className="flex items-center gap-2">
                <Check className="text-blue-500 h-4 w-4" />
                <span className="text-gray-200">{feature}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* Pro Tier */}
        <section className="border-l-4 border-blue-600 pl-4">
          <h2 className="text-xl font-semibold text-blue-600 mb-2">Pro Tier</h2>
          <p className="text-gray-200 mb-4">Enhanced features for growing contractor businesses.</p>
          <ul className="space-y-2">
            {features.pro.map((feature, index) => (
              <li key={index} className="flex items-center gap-2">
                <Check className="text-blue-500 h-4 w-4" />
                <span className="text-gray-200">{feature}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* Max Tier */}
        <section className="border-l-4 border-blue-700 pl-4">
          <h2 className="text-xl font-semibold text-blue-600 mb-2">Max Tier</h2>
          <p className="text-gray-200 mb-4">Advanced features for large contracting operations.</p>
          <ul className="space-y-2">
            {features.max.map((feature, index) => (
              <li key={index} className="flex items-center gap-2">
                <Check className="text-blue-500 h-4 w-4" />
                <span className="text-gray-200">{feature}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* Enterprise Tier */}
        <section className="border-l-4 border-blue-800 pl-4">
          <h2 className="text-xl font-semibold text-blue-600 mb-2">Enterprise Tier</h2>
          <p className="text-gray-200 mb-4">Custom solutions for large organizations with specific needs.</p>
          <ul className="space-y-2">
            {features.enterprise.map((feature, index) => (
              <li key={index} className="flex items-center gap-2">
                <Check className="text-blue-500 h-4 w-4" />
                <span className="text-gray-200">{feature}</span>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <div className="mt-12">
        <p className="text-gray-200 text-sm">
          For detailed pricing information and custom enterprise solutions, please contact our sales team.
        </p>
      </div>
    </div>
  );
}