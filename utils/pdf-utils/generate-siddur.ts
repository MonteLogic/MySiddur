// src/utils/timecardUtils.ts
import { WorkTimeShiftType } from '#/types/WorkTimeShiftTypes'; // Adjust path as needed
import { RouteShiftInfoType } from '#/types/RouteShiftInfoTypes'; // Adjust path as needed
import { RouteType } from '#/types/RouteTypes'; // Adjust path as needed
import { GenerateTemplateB } from '#/utils/timecards/GenerateTemplateB'; // Ensure this path is correct from the utils file
import { CBudTemplatePDF } from '#/utils/timecards/standard'; // Ensure this path is correct

// (TemplateType enum and formatDate function are already here from step 2)

interface GenerateTimecardPDFParams {
  dateSelection: string;
  startPayPeriod: number;
  endPayPeriod: number;
  workTimeTop: WorkTimeShiftType[] | (() => WorkTimeShiftType[]); // Keep the flexible type
  timeCardTemplate: TemplateType;
  selectedMonth: number | null;
  selectedEmployeeID: string;
  selectedEmployeeName: string;
  initialRoutes: RouteType[];
  routeShiftInfoData: RouteShiftInfoType[];
  // Callback for actions to be performed after successful generation in the component's context
  onGenerationSuccessActions?: () => Promise<void> | void;
}

export const generateTimecardPDF = async ({
  dateSelection,
  startPayPeriod,
  endPayPeriod,
  workTimeTop,
  timeCardTemplate,
  selectedMonth,
  selectedEmployeeID,
  selectedEmployeeName,
  initialRoutes,
  routeShiftInfoData,
  onGenerationSuccessActions,
}: GenerateTimecardPDFParams): Promise<void> => { // Added Promise<void> for async nature
  const selectedDate = new Date(dateSelection);
  const startPayPeriodDate = new Date(
    selectedDate.getFullYear(),
    selectedDate.getMonth(),
    startPayPeriod,
  );
  const endPayPeriodDate = new Date(
    selectedDate.getFullYear(),
    selectedDate.getMonth(),
    endPayPeriod,
  );

  // Use the formatDate function (already in this file or imported)
  const startPayPeriodFormatted = formatDate(startPayPeriodDate);
  const endPayPeriodFormatted = formatDate(endPayPeriodDate);

  // Resolve workTimeTop if it's a function
  const workTimeArray: WorkTimeShiftType[] = Array.isArray(workTimeTop)
    ? workTimeTop
    : workTimeTop();

  switch (timeCardTemplate) {
    case TemplateType.Acme:
      CBudTemplatePDF(
        workTimeArray,
        selectedEmployeeID,
        selectedEmployeeName,
        initialRoutes,
        startPayPeriodFormatted,
        endPayPeriodFormatted,
        routeShiftInfoData,
      );
      break;
    case TemplateType.Standard:
      if (selectedMonth !== null) {
        GenerateTemplateB(
          workTimeArray,
          selectedMonth,
          selectedEmployeeID,
          selectedEmployeeName,
        );
      } else {
        // It's good practice to handle potential issues if selectedMonth is unexpectedly null
        console.error("Standard template generation called without a selectedMonth.");
        // Optionally throw an error or return early
        // throw new Error("selectedMonth is required for Standard template.");
        return;
      }
      break;
    default:
      console.error("Unknown timecard template selected:", timeCardTemplate);
      // Optionally throw an error
      // throw new Error(`Unknown template type: ${timeCardTemplate}`);
      return;
  }

  // If there's a callback for post-generation actions (like incrementing a counter in Clerk), call it.
  if (onGenerationSuccessActions) {
    await onGenerationSuccessActions();
  }
};