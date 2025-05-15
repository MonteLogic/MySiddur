/**
 * @file PaymentStatusSwitcher.tsx
 * @description A dropdown component that displays user payment and subscription information
 */

import React, { Suspense, useState, useRef, useEffect } from 'react';
import { ChevronDown, CreditCard, CheckCircle, X } from 'lucide-react';
import { useSession } from '@clerk/nextjs';
import { checkUserRole } from '#/utils/UserUtils';
import { useRouter } from 'next/navigation';
import {
  PaymentStatusEnum,
  StripeSubscriptionStatus,
} from '#/types/StripeClerkTypes';
import { useTimecardsMetadata } from '#/ui/clerk/clerk-metadata';

import Link from 'next/link';

/** Interface for a single transaction record */
interface Transaction {
  id: string;
  date: string;
  amount: number;
  status: 'succeeded' | 'failed' | 'pending';
}

/** Interface for the complete payment information */
interface PaymentInfo {
  status: PaymentStatusEnum;
  plan: string;
  nextBilling: string;
  recentTransactions: Transaction[];
}

/** Props interface for the PaymentStatusSwitcher component */
interface PaymentStatusSwitcherProps {
  /** Payment and subscription information */
  paymentInfo?: {
    status: {
      isActive: boolean;
      planId: string;
      expiresAt: string;
      planName: string;
      recentTransactions: Transaction[];
    };
  };
  /** Optional callback for when the manage subscription button is clicked */
  onManageSubscription?: () => void;
  /** Optional class name for additional styling */
  className?: string;
}

/**
 * Get the appropriate text color class based on payment status
 * @param status - The current payment status
 * @returns Tailwind color class string
 */
const getStatusColor = (status: any): string => {
  if (status?.isActive) {
    return 'text-green-600';
  }
  return 'text-gray-600';
};

const getStatusDisplay = (status: any): string => {
  return status?.isActive ? 'Active' : 'Inactive';
};

/**
 * Determines icon component to display based on subscription status
 * @param status - Current subscription status object from Stripe
 * @returns React component for status icon
 */
const getStatusIcon = (status: any): React.ReactNode => {
  if (status?.isActive) {
    return <CheckCircle className="h-5 w-5 text-green-600" />;
  }
  return <CreditCard className="h-5 w-5 text-gray-600" />;
};

/**
 * PaymentStatusSwitcher component displays payment and subscription information in a dropdown
 * Similar to Clerk's OrgSwitcher but focused on payment status
 */

const TaskBar: React.FC<PaymentStatusSwitcherProps> = ({
  paymentInfo,
  onManageSubscription,
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const { session } = useSession();
  const userRole = session ? checkUserRole(session) : null;
  const router = useRouter();
  useEffect(() => {
    if (isOpen && dialogRef.current && !dialogRef.current.open) {
      dialogRef.current.showModal();
    } else if (!isOpen && dialogRef.current?.open) {
      dialogRef.current.close();
    }
  }, [isOpen]);

  const handleDialogClick = (e: React.MouseEvent) => {
    const dialogDimensions = dialogRef.current?.getBoundingClientRect();
    if (dialogDimensions) {
      const clickX = e.clientX;
      const clickY = e.clientY;

      // Check if click is outside the dialog boundaries
      if (
        clickX < dialogDimensions.left ||
        clickX > dialogDimensions.right ||
        clickY < dialogDimensions.top ||
        clickY > dialogDimensions.bottom
      ) {
        setIsOpen(false);
      }
    }
  };
  const { count } = useTimecardsMetadata();

  return (
    <div className={`relative ${className}`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center justify-between rounded-lg border bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        aria-expanded={isOpen}
        aria-haspopup="dialog"
      >
        <div className="flex items-center space-x-3">
          {paymentInfo ? getStatusIcon(paymentInfo.status) : <CreditCard className="h-5 w-5 text-gray-600" />}
          <span>User Details</span>
        </div>
        <ChevronDown
          className={`h-5 w-5 transition-transform ${
            isOpen ? 'rotate-180 transform' : ''
          }`}
          aria-hidden="true"
        />
      </button>

      <dialog
        ref={dialogRef}
        className="fixed right-0 mt-2 w-80 rounded-lg border border-gray-200 bg-white p-0 shadow-lg"
        onClick={handleDialogClick}
      >
        <button
          onClick={() => setIsOpen(false)}
          className="absolute right-2 top-2 rounded-full p-1 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
          aria-label="Close dialog"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="p-4" onClick={(e) => e.stopPropagation()}>
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-medium text-gray-600">Plan Details</h3>
          </div>

          <div className="space-y-4">
            <div>
              <p className="text-sm font-medium text-gray-500">Current Plan:</p>
              <p className="mt-1 text-sm text-gray-500">
                <Link className='text-blue-600 hover:text-blue-800' href="/docs/plans" >
                  {paymentInfo?.status.planName || 'No Plan'}
                </Link>
              </p>
            </div>
            <div>
              <p className="mt-1 text-sm text-gray-500">
                Subscription Active: {paymentInfo?.status?.isActive ? 'Yes' : 'No'}
              </p>
            </div>

            <div>
              <p className="mt-1 text-sm text-gray-500">
                Expires:{' '}
                {paymentInfo?.status.expiresAt
                  ? new Date(paymentInfo.status.expiresAt)
                      .toISOString()
                      .split('T')[0]
                  : 'N/A'}
              </p>
            </div>

            <Suspense>
              {/* toDo: make this have role: on it without pre-loading a role: which will get in the way of "Loading..." */}
              <h2 className="text-xl font-medium text-gray-300">{userRole}</h2>
            </Suspense>
            <div>
              <p className="text-sm font-medium text-gray-500">
                Payment Method
              </p>
              <p className="mt-1 flex items-center text-sm">
                <CreditCard className="mr-2 h-4 w-4" aria-hidden="true" />
              </p>
            </div>

            <div>
              <p className="mb-2 text-sm font-medium text-gray-500">
                Timecards Generated: {count ?? 'Loading...'}
              </p>
              <p className="mb-2 text-sm font-medium text-gray-500">
                Timecards Left: 2
              </p>
              <p className="mb-2 text-sm font-medium text-gray-500">
                Employees: X
              </p>
              <Link href="/settings" className="block">
                <div className="mb-2 text-sm font-medium text-gray-500">
                  View Organization
                </div>
              </Link>
              <div className="space-y-2">
                {paymentInfo?.status.recentTransactions.map((transaction) => (
                  <div
                    key={transaction.id}
                    className="flex justify-between text-sm"
                  >
                    <span className="font-medium">
                      ${transaction.amount.toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-4 border-t pt-4">
            <button
              onClick={() => {
                onManageSubscription?.();
                setIsOpen(false);
                router.push('/settings');
              }}
              className="w-full rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              Manage Subscription
            </button>
          </div>
        </div>
      </dialog>
    </div>
  );
};

export default TaskBar;