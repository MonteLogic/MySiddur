'use client';

import {
  searchForSummaryNoURL,
  handleSubmitSummaryModalSchedule,
} from '#/network-fns/SummaryNetworkFns';
import React, { useState } from 'react';
import Link from 'next/link';
import TextareaAutosize from 'react-textarea-autosize';

interface SwiperModalProps {
  id: string;
  workTimeSummaryForEmployee: any;
  shiftSlots: {
    allocatedShifts: {
      [key: string]: {
        end: string;
        start: string;
        active: number;
      };
    };
  };
  routeID: string;
  dateSelection: Date;
}

// We need to drill prop above to get it good.
const SummaryModalSchedule: React.FC<SwiperModalProps> = ({
  id,
  workTimeSummaryForEmployee,
  shiftSlots,
  routeID,
  dateSelection,
}) => {
  console.log(220, workTimeSummaryForEmployee);
  console.log(221, shiftSlots);

  const { allocatedShifts } = shiftSlots;
  const [summaries, setSummaries] = useState<{ [key: string]: string }>({});
  console.log(38, summaries);
  // allocated shifts may be better because summaries is what is being sent.

  // Convert the allocatedShifts object to an array and sort it based on start times
  const sortedShifts = Object.entries(allocatedShifts).sort(([, a], [, b]) => {
    const startTimeA = parseInt(a.start, 10);
    const startTimeB = parseInt(b.start, 10);
    return startTimeA - startTimeB;
  });

  const handleSubmit = async () => {
    try {
      const updatedData = await handleSubmitSummaryModalSchedule(
        id,
        routeID,
        dateSelection.getDate().toString(),
        summaries,
        setSummaries,
      );

      console.log('Updated data:', updatedData);
      // Update the summaries state with the updated data
      console.log('Summaries after submit:', updatedData.summary);
      // Update the summaries state with the updated data
      setSummaries(updatedData);
    } catch (error) {
      console.error('Error submitting summary:', error);
      // Handle the error state or display an error message
    }
  };

  return (
    <div>
      <h1 className="text-lg" style={{ marginBottom: '10px' }}>
        Shift Summary:
      </h1>
      {sortedShifts.map(([shiftName, shiftData]) => (
        <div key={shiftName} style={{ marginBottom: '20px' }}>
          <h3>{shiftName}</h3>
          <p>
            {shiftData.start} - {shiftData.end}
          </p>
          {shiftData.active === 1 && (
            <div>
              <TextareaAutosize
                id={`summary-${shiftName}`}
                name={`summary-${shiftName}`}
                minRows={3}
                placeholder={`Write a summary of what occurred during ${shiftName} shift`}
                value={
                  summaries[shiftName] ||
                  workTimeSummaryForEmployee[shiftName] ||
                  ''
                }
                onChange={(e) => {
                  const newSummaries = {
                    ...summaries,
                    [shiftName]: e.target.value,
                  };
                  setSummaries(newSummaries);
                  // Update the workTimeSummaryForEmployee prop with the new value
                  workTimeSummaryForEmployee[shiftName] = e.target.value;
                }}
              />
            </div>
          )}
        </div>
      ))}
      <div className="flex justify-between">
        <button
          className="mt-4 rounded bg-blue-500 px-4 py-2 text-white"
          onClick={handleSubmit}
        >
          Submit Summaries
        </button>
        <Link
          href={`/main/summary?date=${dateSelection
            .toISOString()
            .slice(0, 10)}&route=${routeID}`}
          className="mt-4 rounded bg-black px-4 py-2 text-white"
        >
          Go to Summary Page
        </Link>
      </div>
    </div>
  );
};

export default SummaryModalSchedule;
