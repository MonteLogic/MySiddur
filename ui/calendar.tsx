// Calendar.tsx
import React from 'react';

interface CalendarProps {
  calendar: (Date | null)[][];
  isInPayPeriod: (date: Date | null) => boolean;
}

const Calendar: React.FC<CalendarProps> = ({ calendar, isInPayPeriod }) => {
  return (
    <div className="mt-4">
      <h3 className="mb-2 text-lg font-semibold">Pay Period Calendar</h3>
      <div className="grid grid-cols-7 gap-1">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
          <div key={day} className="text-center font-bold">
            {day}
          </div>
        ))}
        {calendar.flat().map((date, index) => (
          <div
            key={index}
            className={`
              border p-2 text-center
              ${
                date
                  ? isInPayPeriod(date)
                    ? 'bg-blue-200 text-blue-800'
                    : 'bg-gray-100'
                  : 'bg-gray-50'
              }
            `}
          >
            {date ? date.getDate() : ''}
          </div>
        ))}
      </div>
    </div>
  );
};

export default Calendar;
