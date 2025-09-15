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

// Jewish Learning Profile Types
export interface JewishLearningProfile {
  gender?: 'man' | 'woman';
  nusach?: 'Ashkenaz' | 'Sefard' | 'EdotHaMizrach';
  hebrewName?: string;
  learningLevel?: 'beginner' | 'intermediate' | 'advanced';
  preferredLanguage?: 'hebrew' | 'english' | 'both';
  includeTransliteration?: boolean;
  includeEnglishTranslation?: boolean;
  customPrayers?: string[];
  notes?: string;
  updatedAt?: string;
}

export interface UserProfile extends User {
  firstName?: string;
  lastName?: string;
  emailAddress?: string | null;
  imageUrl?: string;
  createdAt?: string;
  updatedAt?: string;
  privateMetadata?: {
    subscription?: any;
    stripeCustomerId?: string;
    [key: string]: any;
  } & JewishLearningProfile;
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