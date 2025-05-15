import { AllocatedShifts, ShiftSlotsData } from '#/types/ScheduleTypes';
import { ShiftSlot } from '#/types/UserTypes';

export const getActiveShifts = (shiftsSlots: any) => {
  const activeShifts: AllocatedShifts = {};

  if (shiftsSlots && shiftsSlots.allocatedShifts) {
    Object.entries(shiftsSlots.allocatedShifts).forEach(
      ([shiftName, shift]) => {
        // @ts-ignore
        if (shift.active === 1) {
          // @ts-ignore
          activeShifts[shiftName] = shift;
        }
      },
    );
  }

  return activeShifts;
};
