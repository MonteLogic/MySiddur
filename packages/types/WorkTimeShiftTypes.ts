// Updated types for Clerk metadata-based storage

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

export enum ShiftStatus {
  NOT_WORKED = '',
  SCHEDULED = 'SCHEDULED',
  WORKED = 'WORKED',
  PARTIAL = 'PARTIAL',
  // Add other statuses as needed
}