'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Zap } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

interface SubscriptionData {
  status: {
    isActive: boolean;
    planId?: string;
    planName?: string;
    expiresAt?: string;
    error?: string;
  };
}

interface UpgradePromptProps {
  subscriptionData: SubscriptionData;
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, children }) => {
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    },
    [onClose],
  );

  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : '';

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.body.style.overflow = '';
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, handleKeyDown]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center"
    >
      <div
        className="bg-gray-1100/90 fixed inset-0"
        onClick={onClose}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            onClose();
          }
        }}
        aria-label="Close modal"
      />
      <div className="bg-vc-border-gradient z-50 w-full max-w-md rounded-lg p-px shadow-lg shadow-black/20">
        <div className="rounded-lg bg-black p-6">{children}</div>
      </div>
    </div>
  );
};

const UpgradePrompt: React.FC<UpgradePromptProps> = ({ subscriptionData }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
    const INTERVAL = 5 * 60 * 1000; // 8.5 minutes in milliseconds
//   const INTERVAL = 30 * 1000; // 30 seconds for testing

  useEffect(() => {
    // Only show for non-subscribed users
    if (subscriptionData?.status?.isActive) return;

    // Show modal initially after 8.5 minutes
    const initialTimeout = setTimeout(() => {
      setIsModalOpen(true);
    }, INTERVAL);

    // Set up recurring interval
    const intervalId = setInterval(() => {
      setIsModalOpen(true);
    }, INTERVAL);

    // Cleanup
    return () => {
      clearTimeout(initialTimeout);
      clearInterval(intervalId);
    };
  }, [subscriptionData, INTERVAL]);

  const handleClose = () => {
    setIsModalOpen(false);
  };

  if (subscriptionData?.status?.isActive) return null;

  return (
    <Modal isOpen={isModalOpen} onClose={handleClose}>
      <div className="flex flex-col items-center space-y-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-900">
          <Zap className="h-6 w-6 text-yellow-400" aria-hidden="true" />
        </div>

        <h2 id="modal-title" className="text-xl font-semibold text-white">
          Upgrade Contractor Bud
        </h2>

        <p className="text-center text-gray-400">
          Get access to advanced features including route management, enhanced
          scheduling, and unlimited timecards.
        </p>

        <div className="flex space-x-4">
          <button
            onClick={handleClose}
            className="rounded-md bg-gray-800 px-4 py-2 text-gray-300 transition-colors hover:bg-gray-700"
          >
            Not Now
          </button>
          <button
            onClick={() => {
              window.location.href = '/settings/plans';
            }}
            className="rounded-md bg-yellow-500 px-4 py-2 font-medium text-black transition-colors hover:bg-yellow-400"
          >
            Upgrade Now
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default UpgradePrompt;
