// In #/types/employee.ts

import { InferSelectModel } from 'drizzle-orm';
import { users, routes, workTimeShift } from '#/db/schema';
import { WorkTimeShiftType } from '#/types/WorkTimeShiftTypes';


type EmployeeSchema = InferSelectModel<typeof users>;
export type Route = typeof routes.$inferInsert;
export type User = typeof users.$inferInsert;
export type UserType = typeof users.$inferInsert;

export interface EmployeesWorkingInfo {
  [key: string]: EmployeeShiftInfo;
}

export interface SliderComponentProps {
  initialWorkTime: WorkTimeShiftType[];
  initialRoutes: Route[];
  selectedEmployeeID: string;
  selectedEmployeeName: string;
}

export interface SerializedEmployee extends EmployeeSchema {
  firstName?: string;
  lastName?: string;
  emailAddress?: string | null;
  createdAt?: string;
  updatedAt?: string;
  privateMetadata?: string;
}

export interface EmployeeShiftInfo {
  selectedEmployeeID: string;
  selectedEmployeeName: string;
  shiftsWorking: {
    [shiftName: string]: [boolean, [number, number]];
  };
  workDate: string;
}

export interface ShiftSlot {
  name: string;
  startTime: string;
  endTime: string;
}
