import { workTimeShift } from '#/db/schema';
import { InferSelectModel } from 'drizzle-orm';
import { users } from '#/db/schema';
import { ShiftSlot } from '#/types/UserTypes';
import { RouteShiftInfoType } from '#/types/RouteShiftInfoTypes';
import { User } from '#/types/UserTypes';
import { Route } from '#/types/RouteTypes';
import { WorkTimeShiftType } from '#/types/WorkTimeShiftTypes';

export interface AllocatedShifts {
  [key: string]: ShiftSlot;
}

export interface ShiftSlotsData {
  allocatedShifts: AllocatedShifts;
}
export interface SwiperSlideComponentProps {
  date: Date;
  isScheduled: boolean;
  isWorked: boolean;
  employeeName: string;
  workTimeData: WorkTimeShiftType | undefined;
  onButtonClick: () => void;
}

export interface SwiperModalScheduleProps {
  routeName: string;
  employeeID: string;
  employeeName: string;
  shiftSlots: any;
  setIsOpen: React.Dispatch<React.SetStateAction<boolean>>;
  isOpen: boolean;
  closeModal: () => void;
  workTimeForEmployee: Array<typeof workTimeShift.$inferSelect>;
  setWorkTimeForEmployee: React.Dispatch<
    React.SetStateAction<Array<typeof workTimeShift.$inferSelect>>
  >;
  selectedDate: Date;
  selectedSwiperInfo: string;
  orgID: string;
}

export type EmployeeInfo = InferSelectModel<typeof users>;

export interface DropdownUsersSwiperProps {
  initialRouteShiftInfo: RouteShiftInfoType[];
  initialUsers: User[];
  initialRoutes: Route[];
  initialWorkTime: WorkTimeShiftType[];
  organizationID: string;
}
