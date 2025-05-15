import { WorkTimeShiftType } from '#/types/WorkTimeShiftTypes';
import { checkShiftStatus } from './shiftUtils';

const SLIDER_ITERATOR = 20;

export const generateSlides = (
  workTimeArray: WorkTimeShiftType[],
  routeIDFromPostOffice: string,
  selectedEmployeeName: string,
) => {
  const slides = [];
  const currentDate = new Date();

  for (let i = -SLIDER_ITERATOR; i <= SLIDER_ITERATOR; i++) {
    const date = new Date(currentDate.getTime() + i * 24 * 60 * 60 * 1000);

    const { isScheduled, isWorked } = checkShiftStatus(
      workTimeArray,
      routeIDFromPostOffice,
      date,
      selectedEmployeeName,
    );

    slides.push({
      date,
      isScheduled,
      isWorked,
      employeeName: selectedEmployeeName,
      workTimeData: workTimeArray.find(
        (shift) =>
          shift.routeId === routeIDFromPostOffice &&
          new Date(shift.dayScheduled).toDateString() === date.toDateString(),
      ),
    });
  }

  return slides;
};
