import { RouteShiftInfoType } from '#/types/RouteShiftInfoTypes';
import { Route } from '#/types/RouteTypes';

export const findSelectedRouteInfo = (
  shiftTimes: RouteShiftInfoType[],
  loopRelevantRoute: string,
  routes: Route[],
): [string, RouteShiftInfoType[]] | undefined => {
  const matchedRoute = routes.find((route) => route.id === loopRelevantRoute);

  if (!matchedRoute) return undefined;

  const filteredShifts = shiftTimes.filter(
    (shift) => shift.routeId === matchedRoute.id,
  );

  if (typeof matchedRoute.routeIDFromPostOffice === 'string') {
    return [matchedRoute.routeNiceName, filteredShifts];
  }

  try {
    const parsedData = JSON.parse(matchedRoute.routeIDFromPostOffice || '[]');
    if (Array.isArray(parsedData)) {
      const processedShifts: RouteShiftInfoType[] = parsedData
        .filter(
          (
            shift,
          ): shift is {
            id: string;
            shiftName: string;
            startTime: string;
            endTime: string;
          } =>
            typeof shift.id === 'number' &&
            typeof shift.shiftName === 'string' &&
            typeof shift.startTime === 'string' &&
            typeof shift.endTime === 'string',
        )
        .map((shift) => ({
          id: shift.id,
          organizationID: matchedRoute.organizationID ?? null,
          routeId: matchedRoute.id ?? 0,
          dateAddedToCB: new Date().toISOString(),
          shiftName: shift.shiftName,
          startTime: shift.startTime,
          endTime: shift.endTime,
        }));

      return [matchedRoute.routeNiceName, processedShifts];
    }
  } catch (error) {
    console.error('Error parsing routeIDFromPostOffice:', error);
  }

  return [matchedRoute.routeNiceName, filteredShifts];
};
