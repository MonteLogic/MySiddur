"use client";

import Link from "next/link";
import { SectionHeader } from "./SectionHeader";


export function NoSubscriptionInfo() {
  return (
    <section className="rounded-lg border">
      <SectionHeader title="Billing & Subscription" />
      <div className="p-4">
        <div className="rounded-lg border p-4">
          <h3 className="text-lg font-semibold">No Subscription Information</h3>
          <p className="text-gray-600">
            No Stripe customer ID found. You have not set up billing yet. Upgrade <Link href="/settings/plans" className="text-blue-500 hover:underline">here</Link>
          </p>
        </div>
      </div>
    </section>
  );
}
