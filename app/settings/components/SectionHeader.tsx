// components/stripe/SectionHeader.tsx
"use client";

import { CreditCard } from 'lucide-react';

type SectionHeaderProps = {
  title: string;
};

export function SectionHeader({ title }: SectionHeaderProps) {
  return (
    <div className="border-b bg-gray-50 p-4">
      <div className="flex items-center gap-2">
        <CreditCard className="h-5 w-5" />
        <h2 className="text-lg font-semibold text-gray-700">{title}</h2>
      </div>
    </div>
  );
}
