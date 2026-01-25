import React from 'react';

// Updated types for Clerk metadata-based storage

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
  workTimeForEmployee: WorkTimeShiftType[];
  setWorkTimeForEmployee: React.Dispatch<
    React.SetStateAction<WorkTimeShiftType[]>
  >;
  selectedDate: Date;
  selectedSwiperInfo: string;
  orgID: string;
}

export interface EmployeeInfo {
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

export interface DropdownUsersSwiperProps {
  initialRouteShiftInfo: RouteShiftInfoType[];
  initialUsers: User[];
  initialRoutes: Route[];
  initialWorkTime: WorkTimeShiftType[];
  organizationID: string;
}

// Import types from other files
export interface ShiftSlot {
  name: string;
  startTime: string;
  endTime: string;
}

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

export interface RouteShiftInfoType {
  id: string;
  organizationID: string;
  routeId: string;
  shiftName: string;
  startTime: string;
  endTime: string;
  dateAddedToCB: string;
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

export interface Route {
  id: string;
  organizationID: string;
  routeNiceName: string;
  routeIDFromPostOffice?: string;
  dateRouteAcquired: string;
  dateAddedToCB: string;
  img?: string;
}