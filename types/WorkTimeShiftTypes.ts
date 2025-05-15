import { routes, workTimeShift, users } from '#/db/schema';

// WorkTimeShiftData was here.
export type WorkTimeShiftType = typeof workTimeShift.$inferSelect;

export enum ShiftStatus {
  NOT_WORKED = '',
  SCHEDULED = 'SCHEDULED',
  WORKED = 'WORKED',
  PARTIAL = 'PARTIAL',
  // Add other statuses as needed
}
