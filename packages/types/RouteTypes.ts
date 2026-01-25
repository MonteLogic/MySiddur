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

export type RouteType = Route;

export interface RouteListRoutePgProps {
  initialRoutes: any;
  orgId: string;
}

export interface RouteEditAddProps {
  initialEmployees: User[];
  initialRoutes: Route[];
}

export interface RouteListProps {
  initialRoutes: Route[];
  workTime: WorkTimeShiftType[];
  selectedEmployeeName: string;
  selectedEmployeeID: string;
  handleButtonClick: (
    date: Date,
    routeId: string,
    workTimeData: WorkTimeShiftType[] | undefined,
  ) => void;
}

export type FormattedRouteType = [string, string, any | undefined][];

export interface AddRouteComponentProps {
  handleRouteAdd: (newRoute: AddRouteType) => void;
}

export type AddRouteType = {
  id: string;
  routeNiceName: string;
  routeIDFromPostOffice: string;
  organizationID?: string | null;
  dateRouteAcquired: string;
  dateAddedToCB: string;
  img?: string | null;
};

// Import types from other files
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