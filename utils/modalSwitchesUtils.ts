// Util file for ui/slider/modal/modal-switches.tsx

/**
 * Description placeholder
 *
 * @param {*} localWorkTime
 * @param {string} shiftId
 * @returns {boolean}
 */
export const isShiftAssigned = (
  localWorkTime: any,
  shiftId: string,
): boolean => {
  console.log(8, localWorkTime);
  const shift = localWorkTime.find(
    (wt: any) => wt.shiftWorked === shiftId.toString(),
  );
  return shift ? shift.occupied : false;
};
