import React, { createContext, useState, useContext, useEffect, useMemo, useCallback } from 'react';
import { WorkTimeShiftType } from '#/types/WorkTimeShiftTypes';

interface WorkTimeContextType {
  workTime: WorkTimeShiftType[];
  setWorkTime: React.Dispatch<React.SetStateAction<WorkTimeShiftType[]>>;
  updateWorkTime: (updatedWorkTime: WorkTimeShiftType) => void;
  fetchWorkTime: () => Promise<void>;
}

const WorkTimeContext = createContext<WorkTimeContextType | undefined>(undefined);

export const WorkTimeProvider: React.FC<{
  children: React.ReactNode;
  organizationID: string;
}> = ({ children, organizationID }) => {
  const [workTime, setWorkTime] = useState<WorkTimeShiftType[]>([]);

  const fetchWorkTime = useCallback(async () => {
    try {
      const url = `/api/get-work-time?organizationID=${organizationID}`;
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache',
        },
      });
      if (response.ok) {
        const responseData = await response.json();
        if (Array.isArray(responseData) && responseData.length > 0) {
          setWorkTime(responseData);
        } else {
          console.warn('Fetched work time data is empty or not an array:', responseData);
          setWorkTime([]);
        }
      } else {
        const errorText = await response.text();
        console.error('Error fetching work time. Status:', response.status, 'Error:', errorText);
      }
    } catch (error) {
      console.error('Error in fetchWorkTime:', error);
    }
  }, [organizationID]);

  const updateWorkTime = useCallback((updatedWorkTime: WorkTimeShiftType) => {
    setWorkTime((prevWorkTime) => {
      const index = prevWorkTime.findIndex((wt) => wt.id === updatedWorkTime.id);
      if (index !== -1) {
        const newWorkTime = [...prevWorkTime];
        newWorkTime[index] = updatedWorkTime;
        return newWorkTime;
      }
      return [...prevWorkTime, updatedWorkTime];
    });
  }, []);

  useEffect(() => {
    if (organizationID) {
      fetchWorkTime();
    }
  }, [organizationID, fetchWorkTime]);

  const contextValue = useMemo(() => ({
    workTime,
    setWorkTime,
    updateWorkTime,
    fetchWorkTime,
  }), [workTime, updateWorkTime, fetchWorkTime]);

  return (
    <WorkTimeContext.Provider value={contextValue}>
      {children}
    </WorkTimeContext.Provider>
  );
};

export const useWorkTime = () => {
  const context = useContext(WorkTimeContext);
  if (context === undefined) {
    throw new Error('useWorkTime must be used within a WorkTimeProvider');
  }
  return context;
};