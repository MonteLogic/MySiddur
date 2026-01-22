import { WorkTimeShiftType } from '#/types/WorkTimeShiftTypes';
import { isSameDay } from './dateUtils';

export const checkShiftStatus = (
  workTimeArray: WorkTimeShiftType[],
  routeId: string,
  date: Date,
  employeeId: string,
): { isScheduled: boolean; isWorked: boolean } => {
  const today = new Date();
  let isScheduled = false;
  let isWorked = false;

  const relevantShift = workTimeArray.find((shift) => {
    const routeMatch = shift.routeId === routeId;
    const dateMatch = isSameDay(new Date(shift.dayScheduled), date);
    const employeeMatch = shift.userId === employeeId;
    return routeMatch && dateMatch && employeeMatch;
  });

  if (relevantShift?.occupied) {
    const shiftDate = new Date(relevantShift.dayScheduled);

    if (shiftDate > today) {
      // Scheduled for after today
      isScheduled = true;
    } else if (isSameDay(shiftDate, today)) {
      // Scheduled for today
      isScheduled = true;
    } else {
      // Scheduled for before today
      isWorked = true;
    }
  }

  return { isScheduled, isWorked };
};
