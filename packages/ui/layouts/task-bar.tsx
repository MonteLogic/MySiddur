/**
 * @file PaymentStatusSwitcher.tsx
 */
'use client';

import React, { Suspense, useState, useEffect, useRef } from 'react';
import { ChevronDown, CreditCard, CheckCircle } from 'lucide-react';
import { useSession } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { useTimecardsMetadata } from '#/ui/features/auth/clerk-metadata';
import Link from 'next/link';
// import { checkUserRole } from '#/packages/core/lib/utils/UserUtils';
import { checkUserRole } from '@mysiddur/core';

// Helper for status icons
const StatusIcon = ({ active }: { active?: boolean }) => 
  active ? <CheckCircle className="h-5 w-5 text-green-600" /> : <CreditCard className="h-5 w-5 text-gray-600" />;

const TaskBar: React.FC<PaymentStatusSwitcherProps> = ({ paymentInfo, onManageSubscription, className = '', embedded = false }) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const { session } = useSession();
  const router = useRouter();
  const { count } = useTimecardsMetadata();
  const userRole = session ? checkUserRole(session) : null;

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const Content = (
    <>
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-medium text-gray-600 dark:text-gray-300">Plan Details</h3>
      </div>
      <div className="space-y-4 text-sm text-gray-500 dark:text-gray-400">
        <div>
          <p className="font-medium">Current Plan:</p>
          <Link className='text-blue-600 hover:text-blue-800' href="/docs/plans">{paymentInfo?.status.planName || 'No Plan'}</Link>
        </div>
        <div>Subscription Active: {paymentInfo?.status?.isActive ? 'Yes' : 'No'}</div>
        <div>Expires: {paymentInfo?.status.expiresAt ? new Date(paymentInfo.status.expiresAt).toISOString().split('T')[0] : 'N/A'}</div>
        <Suspense><h2 className="text-xl font-medium text-gray-300 dark:text-gray-500">{userRole}</h2></Suspense>
        <div>
          <p className="font-medium">Timecards Generated: {count ?? 'Loading...'}</p>
          <Link href="/settings" className="mt-2 block font-medium">View Organization</Link>
          <div className="mt-2 space-y-1">
            {paymentInfo?.status.recentTransactions.map((t) => (
              <div key={t.id} className="flex justify-between font-medium"><span>${t.amount.toFixed(2)}</span></div>
            ))}
          </div>
        </div>
      </div>
      <div className="mt-4 border-t border-gray-700 pt-4">
        {/* If you have a SignOutButton component, place it here */}
        <button
          onClick={() => { onManageSubscription?.(); if (!embedded) setIsOpen(false); router.push('/settings'); }}
          className="w-full rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          Manage Subscription
        </button>
      </div>
    </>
  );

  if (embedded) return <div className={className}>{Content}</div>;

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center justify-between rounded-lg border bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
      >
        <div className="flex items-center space-x-3">
          <StatusIcon active={paymentInfo?.status?.isActive} />
          <span>User Details</span>
        </div>
        <ChevronDown className={`h-5 w-5 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-80 rounded-lg border border-gray-200 bg-white p-4 shadow-lg z-50">
          {Content}
        </div>
      )}
    </div>
  );
};

export default TaskBar;

// --- Interfaces ---
interface Transaction { id: string; date: string; amount: number; status: 'succeeded' | 'failed' | 'pending'; }
interface PaymentStatusSwitcherProps {
  paymentInfo?: { status: { isActive: boolean; planId: string; expiresAt: string; planName: string; recentTransactions: Transaction[]; }; };
  onManageSubscription?: () => void;
  className?: string;
  embedded?: boolean;
}