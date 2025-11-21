// lib/calendar/hebrewCalendar.ts
import * as HebcalCore from '@hebcal/core'; // Try importing everything as a namespace
import { CalendarInfo } from '../siddur/types/siddurTypes'; // Keep your defined type

// --- Attempt to access Hebcal components safely ---
// These will try to use named exports if available, or fallback to properties on the namespace.
const HDate = HebcalCore.HDate || (HebcalCore as any).default?.HDate;
const Sedra = HebcalCore.Sedra || (HebcalCore as any).default?.Sedra;
const Locale = HebcalCore.Locale || (HebcalCore as any).default?.Locale;
const OmerEvent =
  HebcalCore.OmerEvent || (HebcalCore as any).default?.OmerEvent;
const HolidayEvent =
  HebcalCore.HolidayEvent || (HebcalCore as any).default?.HolidayEvent; // The class for instanceof checks
const ParshaEvent =
  HebcalCore.ParshaEvent || (HebcalCore as any).default?.ParshaEvent;
const flags = HebcalCore.flags || (HebcalCore as any).default?.flags;

const isValidFn = (fn: any) => typeof fn === 'function';
const isValidObj = (obj: any) => typeof obj === 'object' && obj !== null;

export const getCalendarInfo = async (date: Date): Promise<CalendarInfo> => {
  if (!isValidFn(HDate)) {
    throw new Error(
      'HDate class not found from @hebcal/core. Please check your Hebcal installation/version.',
    );
  }

  const hdate = new HDate(date);
  const year = hdate.getFullYear(); // Assumes HDate and getFullYear() are valid
  const month = hdate.getMonth(); // Assumes getMonth() exists
  const day = hdate.getDate(); // Assumes getDate() exists

  let dailyHolidays: any[] = [];

  // --- CRITICAL SECTION: Fetching Daily Holidays ---
  // The previous errors indicate that neither hdate.holidays() nor HolidayEvent.getEvents() work.
  // This section needs to be adapted to how YOUR specific version of Hebcal provides daily events.
  // This might involve instantiating a main 'Hebcal' class (if it's the default export)
  // or finding another static method.
  // Example of what might have been for a very old version (highly speculative):
  /*
  if (typeof HebcalCore.default === 'function') { // If 'Hebcal' is a class via default export
      const hebcalInstance = new (HebcalCore.default as any)({ year: year, il: false });
      if (isValidFn(hebcalInstance.getHolidaysForMonth)) {
          const monthHolidays = hebcalInstance.getHolidaysForMonth(month); // Method name is a guess
          dailyHolidays = monthHolidays.filter((ev: any) => ev.getDate && ev.getDate().getDate() === day);
      } else if (isValidObj(hebcalInstance.holidays) && hebcalInstance.holidays[month] && hebcalInstance.holidays[month][day]) {
          // Very old style: hebcal.holidays[month_idx_1_based][day_of_month]
           dailyHolidays = hebcalInstance.holidays[month][day];
      }
  } else if (isValidObj(HebcalCore) && isValidFn(HebcalCore.getHolidaysForMonth)) { // If main export is an object with methods
      const monthHolidays = (HebcalCore as any).getHolidaysForMonth(month, year, { il: false }); // Method name is a guess
      dailyHolidays = monthHolidays.filter((ev: any) => ev.getDate && ev.getDate().getDate() === day);
  }
  */
  // If you cannot find how to populate `dailyHolidays`, the rest of this function will be inaccurate.
  // For now, we proceed assuming dailyHolidays might get populated by one of the above (unlikely to work without specific API knowledge)
  // or it remains empty.

  let holidayName: string | undefined = undefined;
  let isYomTov = false;
  let isCholHaMoed = false; // Flag name for this is unknown from error logs
  let fastDayName: string | undefined = undefined; // Flag name for this is unknown
  let isRoshChodesh = false;
  let omerDay: number | undefined = undefined;

  let currentLocaleName: string | undefined = undefined;
  if (isValidObj(Locale) && isValidFn(Locale.getLocaleName)) {
    currentLocaleName = Locale.getLocaleName(); // Using deprecated if nothing else.
  }

  if (dailyHolidays && dailyHolidays.length > 0) {
    holidayName = dailyHolidays
      .map((ev: any) => {
        if (isValidFn(ev.render)) return ev.render(currentLocaleName);
        if (isValidFn(ev.getDesc)) return ev.getDesc(); // Common in older versions
        return ev.desc || ev.toString();
      })
      .join(', ');

    if (isValidObj(flags) && flags.CHAG) {
      // CHAG was identified in your error for YOM_TOV
      isYomTov = dailyHolidays.some(
        (ev: any) => isValidFn(ev.getFlags) && ev.getFlags() & flags.CHAG,
      );
    }
    if (isValidObj(flags) && flags.ROSH_CHODESH) {
      // ROSH_CHODESH was identified
      isRoshChodesh = dailyHolidays.some(
        (ev: any) =>
          isValidFn(ev.getFlags) && ev.getFlags() & flags.ROSH_CHODESH,
      );
    }

    // For CHOL_HAMOED and FAST_DAY, the flags are unknown from your error message.
    // You would need to find the correct flag constant from your 'flags' object.
    // Example if you found them:
    // if (isValidObj(flags) && (flags as any).CHOL_HAMOED_FLAG_NAME) {
    //   isCholHaMoed = dailyHolidays.some((ev: any) => ev.getFlags && (ev.getFlags() & (flags as any).CHOL_HAMOED_FLAG_NAME));
    // }
    // const fastDayFlag = (flags as any).FAST_DAY_FLAG_NAME || (flags as any).MAJOR_FAST_FLAG_NAME;
    // if (isValidObj(flags) && fastDayFlag) {
    //   const fastEvent = dailyHolidays.find((ev: any) => ev.getFlags && (ev.getFlags() & fastDayFlag));
    //   if (fastEvent) {
    //     fastDayName = isValidFn(fastEvent.render) ? fastEvent.render(currentLocaleName) : (fastEvent.desc || fastEvent.toString());
    //   }
    // }

    if (isValidFn(OmerEvent)) {
      // Check if OmerEvent class/constructor is available
      const omerEventInstance = dailyHolidays.find(
        (ev: any) => ev instanceof OmerEvent,
      );
      if (omerEventInstance) {
        // Based on the provided omer.d.ts, the day of the Omer is stored in the 'omer' property.
        if (typeof (omerEventInstance as any).omer === 'number') {
          omerDay = (omerEventInstance as any).omer;
        } else {
          // This case should ideally not be reached if 'omerEventInstance' is truly an OmerEvent
          // conforming to the provided .d.ts file.
          console.warn(
            "OmerEvent instance found, but 'omer' property is not a number:",
            omerEventInstance,
          );
        }
      }
    }
  }

  // Fallback Rosh Chodesh determination if events couldn't be processed or flag wasn't found,
  // and if the direct HDate.isRoshChodesh() method failed.
  if (
    !isRoshChodesh &&
    isValidFn(hdate.getDate) &&
    (hdate.getDate() === 1 || hdate.getDate() === 30)
  ) {
    // This is a very basic check and not a reliable way to determine Rosh Chodesh.
    // True Rosh Chodesh detection needs proper event data.
    // Consider this a placeholder if flag-based detection fails.
  }

  if (
    isRoshChodesh &&
    !(
      holidayName &&
      (holidayName.includes('Rosh Chodesh') ||
        holidayName.includes(hdate.getMonthName ? hdate.getMonthName() : ''))
    )
  ) {
    const monthStr = isValidFn(hdate.getMonthName) ? hdate.getMonthName() : ''; // Called with no args
    const rcText =
      isValidObj(Locale) && isValidFn(Locale.lookupTranslation)
        ? Locale.lookupTranslation('Rosh Chodesh', currentLocaleName)
        : 'Rosh Chodesh';
    holidayName = holidayName
      ? `${rcText} ${monthStr}, ${holidayName}`
      : `${rcText} ${monthStr}`;
  }

  let parsha: string | undefined = undefined;
  if (isValidFn(Sedra)) {
    // Check if Sedra class is available
    const sedraInstance = new Sedra(year, false); // false for Diaspora
    if (isValidFn(sedraInstance.lookup)) {
      const parshaLookupResult = sedraInstance.lookup(hdate);
      if (parshaLookupResult) {
        const renderOrConvertToString = (p: any) => {
          if (isValidFn(p.render)) return p.render(currentLocaleName);
          // For ParshaEvent in older versions, .render() might not exist or SedraResult is different
          // Sometimes .toString() gives a good representation, or you might need to access specific properties.
          if (isValidFn(p.toString) && p.toString() !== '[object Object]')
            return p.toString();
          if (p.name) return p.name; // Common property
          if (Array.isArray(p.sections) && p.sections.length > 0)
            return p.sections.join(' - '); // Hebcal v2 parsha format
          return '';
        };
        if (Array.isArray(parshaLookupResult)) {
          parsha = parshaLookupResult.map(renderOrConvertToString).join(' & ');
        } else {
          parsha = renderOrConvertToString(parshaLookupResult);
        }
      }
    }
  }

  return {
    gregorianDate: date,
    hebrewDateStr: isValidFn(hdate.render)
      ? hdate.render(currentLocaleName)
      : isValidFn(hdate.toString)
      ? hdate.toString()
      : String(hdate),
    dayOfWeek: isValidFn(hdate.getDay) ? hdate.getDay() : -1,
    isShabbos: isValidFn(hdate.getDay) ? hdate.getDay() === 6 : false,
    isYomTov,
    isRoshChodesh,
    isCholHaMoed,
    fastDay: fastDayName,
    holiday: holidayName,
    parsha,
    omerDay,
  };
};
