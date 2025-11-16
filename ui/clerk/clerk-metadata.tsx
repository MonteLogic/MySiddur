'use client';

import { useUser } from '#/lib/safe-clerk-hooks';
import { useState, useEffect } from 'react';

/**
 * Hook for managing timecard generation metadata
 * @returns Object containing count and increment function
 */
export const useTimecardsMetadata = () => {
  const { user } = useUser();
  const isClerkDisabled = process.env.NEXT_PUBLIC_DISABLE_CLERK === 'true';
  const [count, setCount] = useState<number | null>(null);

  useEffect(() => {
    if (user && !isClerkDisabled) {
      const currentCount =
        (user.unsafeMetadata?.timecardsGenerated as number) || 0;
      setCount(currentCount);
    }
  }, [user, isClerkDisabled]);

  const incrementTimecardsGenerated = async () => {
    if (!user || isClerkDisabled) return;

    try {
      const currentCount =
        (user.unsafeMetadata?.timecardsGenerated as number) || 0;
      const newCount = currentCount + 1;

      await user.update({
        unsafeMetadata: {
          ...user.unsafeMetadata,
          timecardsGenerated: newCount,
        },
      });

      setCount(newCount);
    } catch (err) {
      console.error('Error updating timecardsGenerated:', err);
    }
  };

  return { count, incrementTimecardsGenerated };
};

/**
 * Component for displaying timecard metadata
 */
export default function UpdateTimecardsMetadata() {
  const { count } = useTimecardsMetadata();

  return (
    <div className="p-4">
      <div>Current timecards generated: {count ?? 'Loading...'}</div>
    </div>
  );
}
