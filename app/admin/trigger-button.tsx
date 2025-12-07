'use client';

import { useState, useTransition } from 'react'; // Added useTransition
import { triggerGenerationAction } from './actions';
import clsx from 'clsx'; // Added clsx import

export default function TriggerButton({
  style = 'Recommended',
  printBlackAndWhite = false
}: {
  style?: string;
  printBlackAndWhite?: boolean;
}) {
  const [isPending, startTransition] = useTransition();

  return (
    <button
      onClick={() => {
        startTransition(() => {
          (async () => {
            try {
              const result = await triggerGenerationAction(style, printBlackAndWhite);
              if (result.success) {
                alert(result.message);
              } else {
                alert(result.message);
              }
            } catch (e) {
              alert('An unexpected error occurred.');
            }
          })();
        });
      }}
      disabled={isPending}
      className={clsx(
        'rounded-lg px-4 py-2 text-sm font-medium transition-colors',
        'bg-blue-600 text-white hover:bg-blue-500 active:bg-blue-700',
        'disabled:opacity-50 disabled:cursor-not-allowed'
      )}
    >
      {isPending ? 'Generating...' : 'Trigger Generation Now'}
    </button>
  );
}
