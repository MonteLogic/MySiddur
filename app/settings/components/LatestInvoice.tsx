
// app/settings/components/LatestInvoice.tsx
"use client";

import { LatestInvoiceProps } from '../settings-types';

export function LatestInvoice({ invoice }: LatestInvoiceProps) {
  if (!invoice) return null;

  return (
    <div className="rounded-lg border p-4">
      <h3 className="text-lg font-semibold">Latest Invoice</h3>
      <div className="mt-2 space-y-2">
        <p>Amount: ${(invoice.amount_paid / 100).toFixed(2)}</p>
        <p>Date: {new Date(invoice.created * 1000).toLocaleDateString()}</p>
        <p>
          Status:{' '}
          <span className="inline-block rounded-full bg-blue-100 px-2 py-1 text-sm text-blue-800">
            {invoice.status || 'N/A'}
          </span>
        </p>
      </div>
    </div>
  );
}
