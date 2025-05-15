'use client';
import { SectionHeader } from './SectionHeader';

export function ErrorDisplay() {
  return (
    <section className="rounded-lg border">
      <SectionHeader title="Billing & Subscription" />
      <div className="p-4">
        <div className="rounded-lg border border-red-200 bg-red-50 p-4">
          <h3 className="text-lg font-semibold text-red-700">
            Error Loading Customer Data
          </h3>
          <p className="text-red-600">
            Unable to fetch customer information. Please try again later.
          </p>
        </div>
      </div>
    </section>
  );
}
