import React, { useState, useRef, useEffect } from 'react';
import { ChevronDownIcon } from '@heroicons/react/solid';
import sampleRouteData from '#/example-data/example-route-data-1.json';
import { Route } from '#/types/RouteTypes';
import { ShiftSlot } from '#/types/UserTypes';
import { uuid } from '#/utils/dbUtils';

interface ChevronAddSampleRouteDataProps {
  onFillData: (data: Route, shifts: ShiftSlot[]) => void;
}

const ChevronAddSampleRouteData: React.FC<ChevronAddSampleRouteDataProps> = ({
  onFillData,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleFillSampleData = () => {
    const sampleRoute: Route = {
      id: uuid(),
      routeNiceName: sampleRouteData.routeNiceName,
      routeIDFromPostOffice: sampleRouteData.routeIDFromPostOffice,
      dateRouteAcquired: new Date(
        sampleRouteData.dateRouteAcquired,
      ).toISOString(),
      dateAddedToCB: new Date(sampleRouteData.dateAddedToCB).toISOString(),
      img: sampleRouteData.img,
    };

    const sampleShifts: ShiftSlot[] = sampleRouteData.shifts.map((shift) => ({
      name: shift.name,
      startTime: shift.startTime,
      endTime: shift.endTime,
    }));

    onFillData(sampleRoute, sampleShifts);
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-500 text-white hover:bg-blue-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-opacity-75"
        aria-label="Add sample route data"
      >
        <ChevronDownIcon
          className={`${isOpen ? 'rotate-180 transform' : ''} h-5 w-5`}
        />
      </button>
      {isOpen && (
        <div className="absolute right-0 z-50 mt-2 w-56 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5">
          <div className="py-1">
            <button
              onClick={handleFillSampleData}
              className="block w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100"
            >
              Fill with Sample Route Data
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChevronAddSampleRouteData;
