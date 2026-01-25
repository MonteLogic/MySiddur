/**
 * @mysiddur/types
 * Central export file for all shared types in the workspace.
 */

// Export all types from clean files
export * from './ImageGalleryTypes';
export * from './ModalTypes';
export * from './ProductTypes';
export * from './SiddurTypes';
export * from './StripeClerkTypes';
export * from './SummaryTypes';
export * from './RouteShiftInfoTypes';
export * from './WorkTimeShiftTypes';

// Selective exports to avoid duplicates

// From RouteTypes.ts
export type {
  Route,
  RouteType,
  RouteListRoutePgProps,
  RouteEditAddProps,
  RouteListProps,
  FormattedRouteType,
  AddRouteComponentProps,
  AddRouteType
} from './RouteTypes';

// From UserTypes.ts
// Exclude: Route, WorkTimeShiftType (defined elsewhere)
// Exclude: ShiftSlot (defined in ScheduleTypes)
export type {
  User,
  UserType,
  EmployeesWorkingInfo,
  SliderComponentProps,
  SerializedEmployee,
  JewishLearningProfile,
  UserProfile,
  EmployeeShiftInfo
} from './UserTypes';

// From ScheduleTypes.ts
// Exclude: User, Route, WorkTimeShiftType, RouteShiftInfoType
export type {
  AllocatedShifts,
  ShiftSlotsData,
  SwiperSlideComponentProps,
  SwiperModalScheduleProps,
  EmployeeInfo,
  DropdownUsersSwiperProps,
  ShiftSlot
} from './ScheduleTypes';
