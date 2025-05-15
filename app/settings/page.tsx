import { ExternalLink } from '#/ui/external-link';
import { getCustomerDetails, ClerkMetadata } from '#/utils/StripeUtils';
import { currentUser } from '@clerk/nextjs';
import { ErrorDisplay } from './components/ErrorDisplay';
import { ActiveSubscriptions } from './components/ActiveSubscription';
import { CustomerInformation } from './components/CustomerInformation';
import { LatestInvoice } from './components/LatestInvoice';
import { NoSubscriptionInfo } from './components/NoSubInfo';
import { OrganizationSection } from './components/OrganizationSection';
import { SectionHeader } from './components/SectionHeader';
import { Suspense } from 'react';
import { InternalLink } from '#/ui/internal-link';

// Separate component for the Stripe settings content
const StripeSettings = async () => {
  const user = await currentUser();
  const metadata = user?.privateMetadata as ClerkMetadata;

  if (!metadata?.stripeCustomerId) {
    return (
      <div className="space-y-6">
        <NoSubscriptionInfo />
        <div className="rounded-lg border border-gray-700 bg-gray-800 p-4">
          <OrganizationSection />
        </div>
      </div>
    );
  }

  try {
    const customerData = await getCustomerDetails(metadata.stripeCustomerId);
    return (
      <section className="rounded-lg border border-gray-700">
        <SectionHeader title="Billing & Subscription" />
        <div className="space-y-4 p-4">
          <CustomerInformation
            email={customerData.customer.email}
            created={customerData.customer.created}
          />
          <ActiveSubscriptions
            subscriptions={customerData.activeSubscriptions}
          />
          {customerData.latestInvoice && (
            <LatestInvoice invoice={customerData.latestInvoice || null} />
          )}
          <div className="rounded-lg border border-gray-700 bg-gray-800 p-4">
            <OrganizationSection />
          </div>
        </div>
      </section>
    );
  } catch (error) {
    return <ErrorDisplay />;
  }
};

// Main page component
export default function Page() {
  return (
    <div className="text-white">
      <div className="mb-8">
        <h1 className="mb-4 text-2xl font-bold">Settings Page</h1>
        <ul className="mb-4 space-y-2">
          <li className="text-gray-200">
            Here is the settings page, adjust your plan and make other changes
            to your CBud account.
          </li>
          <li className="text-gray-200">
            To view the full CBud documentation, or view Plans view the links
            below.
          </li>
        </ul>
        <div className="flex gap-4">
          <ExternalLink href="https://info.cbud.app/posts/how-to-setup-cbud">
            <span className="text-blue-400 hover:text-blue-300">Full Docs</span>
          </ExternalLink>
          <InternalLink href="settings/plans">
            <span className="text-blue-400 hover:text-blue-300">Plans</span>
          </InternalLink>
        </div>
      </div>
      <Suspense fallback={<div className="text-white">Loading...</div>}>
        {/* @ts-expect-error Async Server Component */}
        <StripeSettings />
      </Suspense>
    </div>
  );
}
