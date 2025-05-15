// components/stripe/OrganizationSection.tsx
"use client";

import { OrganizationSwitcher } from '@clerk/nextjs';
import { SectionHeader } from './SectionHeader';

export function OrganizationSection() {
  return (
    <section className="rounded-lg border">
      <SectionHeader title="Organization" />
      <div className="p-4">
        <div className="rounded-lg border p-4">
          <OrganizationSwitcher />
        </div>
      </div>
    </section>
  );
}
