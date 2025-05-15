import { workTimeShift, users, routes } from '#/db/schema';
import { json } from 'drizzle-orm/pg-core';
import { WorkTimeShiftType } from '#/types/WorkTimeShiftTypes';

// Why?
export type RouteType = typeof routes.$inferSelect;
export type Route = typeof routes.$inferInsert;

export interface RouteListRoutePgProps {
  initialRoutes: any;
  orgId: string;
}

export interface RouteEditAddProps {
  initialEmployees: typeof users[];
  initialRoutes: typeof routes[];
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

export type FormattedRouteType = [string, string, typeof json | undefined][];

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
