import { workTimeShift } from '#/db/schema';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { WorkTimeShiftType } from '#/types/WorkTimeShiftTypes';

export const GenerateTemplateB = async (
  workTimeForEmployee: WorkTimeShiftType[],
  monthDateInt: number,
  selectedEmployeeID: string,
  selectedEmployeeName: string,
): Promise<string> => {
  try {
    console.log(7, workTimeForEmployee);
    const pdfBase64 = await drawBorders(
      workTimeForEmployee,
      monthDateInt,
      selectedEmployeeID,
      selectedEmployeeName,
    );

    console.log(7, workTimeForEmployee);

    // Convert the base64 string to a Blob
    const pdfBlob = new Blob([Buffer.from(pdfBase64, 'base64')], {
      type: 'application/pdf',
    });

    // Create a URL for the Blob
    const pdfUrl = URL.createObjectURL(pdfBlob);

    // Create an anchor element to trigger the download
    const a = document.createElement('a');
    a.href = pdfUrl;
    a.download = 'template_b.pdf';
    a.click();

    // Revoke the URL to free up resources
    URL.revokeObjectURL(pdfUrl);

    return pdfBase64;
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw error;
  }
};

const distinguishEmployeeWorkShifts = (
  workTimeForEmployeeShifts: WorkTimeShiftType,
  selectedEmployeeID: string,
): string[] => {
  console.log(43, workTimeForEmployeeShifts);

  if (!workTimeForEmployeeShifts.summary) {
    return [];
  }

  const shiftsArray = JSON.parse(workTimeForEmployeeShifts.summary);

  const shiftsArrayKeys = Object.keys(shiftsArray);

  console.log(53, shiftsArrayKeys);

  return shiftsArrayKeys;
};

const drawBorders = async (
  workTimeForEmployee: WorkTimeShiftType[],
  monthDateInt: number,
  selectedEmployeeID: string,
  selectedEmployeeName: string,
): Promise<string> => {
  const filteredEmployeeNodes: WorkTimeShiftType[] = workTimeForEmployee.filter(
    (node) => node.userId === selectedEmployeeID,
  );

  console.log(26, filteredEmployeeNodes);

  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([600, 800]);

  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontSize = 12;
  const lineHeight = fontSize * 1.5;

  const textOptions = {
    font,
    size: fontSize,
    color: rgb(0, 0, 0),
  };

  const lineSpacing = fontSize + 10;

  let y = 800 - 100;

  page.drawText('Employee Work Times', {
    ...textOptions,
    x: 50,
    y: 800 - 50,
  });
  page.drawText(selectedEmployeeName, {
    ...textOptions,
    x: 250,
    y: 800 - 50,
  });
  page.drawText(selectedEmployeeID, {
    ...textOptions,
    x: 400,
    y: 800 - 50,
  });

  // Table Headers
  page.drawText('Day', { ...textOptions, x: 50, y });
  page.drawText('Date', { ...textOptions, x: 100, y });
  page.drawText('Early Morning', { ...textOptions, x: 140, y });
  page.drawText('Mid Morning', { ...textOptions, x: 240, y });
  page.drawText('Mid Day', { ...textOptions, x: 360, y });
  page.drawText('Afternoon', { ...textOptions, x: 460, y });

  y -= lineHeight;

  // Create a Set to store unique dates
  const uniqueDates = new Set<string>();

  // Table Rows
  const sortedEmployeeNodes = filteredEmployeeNodes.sort((a, b) => {
    const dateA = new Date(a.dayScheduled);
    const dateB = new Date(b.dayScheduled);
    return dateA.getTime() - dateB.getTime();
  });
  console.log(119, sortedEmployeeNodes);

  for (const workTime of sortedEmployeeNodes) {
    const inputDate: Date = new Date(workTime.dayScheduled);
    const routeIDAffiliated = workTime.routeId;
    console.log(197, workTime.routeId);

    const date: Date = new Date(inputDate);
    date.setDate(date.getDate() + 1);
    const nextDay: string = date.toISOString().slice(0, 10);
    const formattedDate: Date = new Date(nextDay);

    // Check if the date is already added to the Set
    if (uniqueDates.has(formattedDate.toISOString())) {
      continue; // Skip this iteration if the date is already added
    }

    uniqueDates.add(formattedDate.toISOString()); // Add the date to the Set

    // Turn this into an integer.
    const month = formattedDate.getMonth() + 1;

    // Check if the month is February
    if (month !== monthDateInt) {
      continue; // Skip this iteration if the month is not February
    }

    const dayOfWeek = formattedDate.toLocaleString('en-US', {
      weekday: 'short',
    });
    const dateStr = formattedDate.toLocaleString('en-US', {
      month: 'numeric',
      day: 'numeric',
    });

    const shiftsWorkedCurrentArray = distinguishEmployeeWorkShifts(
      workTime,
      selectedEmployeeID,
    );
    console.log(163, shiftsWorkedCurrentArray);

    const earlyMorningWorked = shiftsWorkedCurrentArray.includes('earlyMorning')
      ? 'Worked - ' + routeIDAffiliated
      : '';
    const midMorningWorked = shiftsWorkedCurrentArray.includes('midMorning')
      ? 'Worked - ' + routeIDAffiliated
      : '';
    const midDayWorked = shiftsWorkedCurrentArray.includes('midDay')
      ? 'Worked - ' + routeIDAffiliated
      : '';
    const afternoonWorked = shiftsWorkedCurrentArray.includes('afternoon')
      ? 'Worked - ' + routeIDAffiliated
      : '';

    page.drawText(dayOfWeek, { ...textOptions, x: 50, y });
    page.drawText(dateStr, { ...textOptions, x: 100, y });
    page.drawText(earlyMorningWorked, { ...textOptions, x: 140, y });
    page.drawText(midMorningWorked, { ...textOptions, x: 240, y });
    page.drawText(midDayWorked, { ...textOptions, x: 360, y });
    page.drawText(afternoonWorked, { ...textOptions, x: 460, y });

    y -= lineSpacing; // Move to the next row
  }

  const pdfBytes = await pdfDoc.save();
  const pdfBase64 = Buffer.from(pdfBytes).toString('base64');
  return pdfBase64;
};
