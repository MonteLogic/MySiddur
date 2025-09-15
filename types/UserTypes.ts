// Updated types for Clerk metadata-based storage

export interface Route {
  id: string;
  organizationID: string;
  routeNiceName: string;
  routeIDFromPostOffice?: string;
  dateRouteAcquired: string;
  dateAddedToCB: string;
  img?: string;
}

export interface User {
  id: string;
  clerkID: string;
  organizationID: string;
  userNiceName: string;
  email: string;
  phone: string;
  dateHired: string;
  dateAddedToCB: string;
  img?: string;
}

export type UserType = User;

export interface EmployeesWorkingInfo {
  [key: string]: EmployeeShiftInfo;
}

export interface SliderComponentProps {
  initialWorkTime: WorkTimeShiftType[];
  initialRoutes: Route[];
  selectedEmployeeID: string;
  selectedEmployeeName: string;
}

export interface SerializedEmployee extends User {
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

// Import WorkTimeShiftType from the appropriate file
export interface WorkTimeShiftType {
  id: string;
  organizationID: string;
  occupied: boolean;
  userId: string;
  shiftWorked: string;
  dayScheduled: string;
  dateAddedToCB: string;
  routeId: string;
  summary?: string;
}