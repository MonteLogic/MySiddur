// lib/siddur-pdf-utils/ashkenaz/ashkenaz-content-generation.ts
import { PDFPage, rgb } from 'pdf-lib';
import ashPrayerInfo from '@mysiddur/prayer/content/ashkenazi-prayer-info.json';
import siddurConfig from './siddur-formatting-config.json';
import {
  AshkenazContentGenerationParams,
  PdfDrawingContext,
  Prayer,
} from './drawing/types';
import { drawPrayer } from './drawing/prayer-drawing';
import { drawDividerLine } from './drawing/drawing-helpers';
import { drawReadingGuide } from './drawing/reading-guide';
import { loadGeneratedLayout } from '@mysiddur/core/custom-siddur-date-gen/layout-resolver';

// Service display names mapping
const SERVICE_DISPLAY_NAMES: Record<string, string> = {
  wakingPrayers: 'Waking Prayers',
  shacharis: 'Shacharis',
  mincha: 'Mincha',
  maariv: 'Maariv',
  retiringPrayers: 'Retiring Prayers'
};

// oxlint-disable-next-line max-lines-per-function
export const generateAshkenazContent = (
  params: AshkenazContentGenerationParams & { selectedDate?: Date },
): { page: PDFPage; y: number; pageServiceMap: Map<number, string> } => {
  const {
    pdfDoc,
    page,
    y,
    width,
    height,
    margin,
    englishFont,
    englishBoldFont,
    hebrewFont,
    style = 'Recommended',
    calculateTextLines,
    ensureSpaceAndDraw,
    selectedDate,
  } = params;

  let context: PdfDrawingContext = {
    pdfDoc,
    page,
    y,
    width,
    height,
    margin,
    fonts: {
      english: englishFont,
      englishBold: englishBoldFont,
      hebrew: hebrewFont,
    },
  };

  // Track which service is on which page
  const pageServiceMap = new Map<number, string>();

  // Try to load generated layout for the selected date
  const generatedLayout = selectedDate ? loadGeneratedLayout(selectedDate) : null;

  if (generatedLayout) {
    // Use generated layout with all 5 services
    console.log('[INFO] Using generated layout for PDF generation');
    
    const serviceSections: Array<{name: string, prayers: Array<{id: string, title: string}>}> = [
      { name: 'wakingPrayers', prayers: generatedLayout.wakingPrayers },
      { name: 'shacharis', prayers: generatedLayout.shacharis },
      { name: 'mincha', prayers: generatedLayout.mincha },
      { name: 'maariv', prayers: generatedLayout.maariv },
      { name: 'retiringPrayers', prayers: generatedLayout.retiringPrayers },
    ];

    for (const [serviceIndex, service] of serviceSections.entries()) {
      if (!service.prayers || service.prayers.length === 0) continue;

      const displayName = SERVICE_DISPLAY_NAMES[service.name] || service.name;
      
      // Track the current page for this service
      const currentPageIndex = pdfDoc.getPages().indexOf(context.page);
      pageServiceMap.set(currentPageIndex, displayName);
      
      // Draw service title
      const serviceTitle = `Service: ${displayName}`;
      let lines = calculateTextLines(
        serviceTitle,
        context.fonts.englishBold,
        siddurConfig.fontSizes.service,
        context.width - context.margin * 2,
        siddurConfig.lineSpacing.service,
      );

      const beforePage = context.page;
      ({ page: context.page, y: context.y } = ensureSpaceAndDraw(
        context,
        lines.map((l) => ({
          ...l,
          font: context.fonts.englishBold,
          size: siddurConfig.fontSizes.service,
          lineHeight: siddurConfig.lineSpacing.service,
        })),
        serviceTitle,
      ));

      // If page changed during title drawing, update mapping
      if (context.page !== beforePage) {
        const newPageIndex = pdfDoc.getPages().indexOf(context.page);
        pageServiceMap.set(newPageIndex, displayName);
      }

      context.y -= siddurConfig.verticalSpacing.afterSiddurTitle;

      // Draw Reading Guide if instructions are enabled
      if (params.includeInstructions !== false) {
         context = drawReadingGuide(context, params);
         context = drawDividerLine(context); // Add a divider after the guide
      }

      // Draw each prayer in this service
      for (const prayerEntry of service.prayers) {
        // Check if we're on a new page and update service mapping
        const prayerPageIndex = pdfDoc.getPages().indexOf(context.page);
        if (!pageServiceMap.has(prayerPageIndex)) {
          pageServiceMap.set(prayerPageIndex, displayName);
        }
        
        const prayer = {
          'prayer-id': prayerEntry.id,
          title: prayerEntry.title,
        } as Prayer;
        
        context = drawPrayer(context, prayer, { ...params, style });
      }

      // Add divider between services (except after last service)
      if (serviceIndex < serviceSections.length - 1) {
        context = drawDividerLine(context);
      }
    }
  } else {
    // Fallback to old static structure (only waking-prayers and shacharis)
    console.log('[INFO] Using fallback static structure for PDF generation');
    
    const allServices = [
      ashPrayerInfo.services['waking-prayers'],
      ashPrayerInfo.services.shacharis,
    ];

    for (const [serviceIndex, service] of allServices.entries()) {
      if (!service || !Array.isArray(service.sections)) continue;

      const currentServiceName = service['display-name'];
      
      const serviceTitle = `Service: ${service['display-name']}`;
      let lines = calculateTextLines(
        serviceTitle,
        context.fonts.englishBold,
        siddurConfig.fontSizes.service,
        context.width - context.margin * 2,
        siddurConfig.lineSpacing.service,
      );

      const beforePage = context.page;
      ({ page: context.page, y: context.y } = ensureSpaceAndDraw(
        context,
        lines.map((l) => ({
          ...l,
          font: context.fonts.englishBold,
          size: siddurConfig.fontSizes.service,
          lineHeight: siddurConfig.lineSpacing.service,
        })),
        serviceTitle,
      ));
      
      if (context.page !== beforePage) {
        const newPageIndex = pdfDoc.getPages().indexOf(context.page);
        pageServiceMap.set(newPageIndex, currentServiceName);
      }
      
      context.y -= siddurConfig.verticalSpacing.afterSiddurTitle;

      // Draw Reading Guide if instructions are enabled
      if (params.includeInstructions !== false) {
         context = drawReadingGuide(context, params);
         context = drawDividerLine(context); // Add a divider after the guide
      }

      for (const section of service.sections) {
        const estimatedSectionHeaderHeight = 100;
        const pageBreakThreshold =
          siddurConfig.pdfMargins.bottom +
          estimatedSectionHeaderHeight +
          siddurConfig.verticalSpacing.pageBuffer;
        if (context.y < pageBreakThreshold) {
          context.page = context.pdfDoc.addPage();
          context.y = context.height - siddurConfig.pdfMargins.top;
          
          const newPageIndex = pdfDoc.getPages().indexOf(context.page);
          pageServiceMap.set(newPageIndex, currentServiceName);
        }

        // Draw Section Title
        lines = calculateTextLines(
          section.sectionTitle,
          context.fonts.englishBold,
          siddurConfig.fontSizes.sectionTitle,
          context.width - context.margin * 2,
          siddurConfig.lineSpacing.sectionTitle,
        );
        ({ page: context.page, y: context.y } = ensureSpaceAndDraw(
          context,
          lines.map((l) => ({
            ...l,
            font: context.fonts.englishBold,
            size: siddurConfig.fontSizes.sectionTitle,
            color: rgb(
              ...(siddurConfig.colors.sectionTitle as [number, number, number]),
            ),
            lineHeight: siddurConfig.lineSpacing.sectionTitle,
          })),
          `Section Title: ${section.sectionTitle}`,
        ));
        context.y -= siddurConfig.verticalSpacing.afterSectionTitleText;

        // Draw Section Description
        lines = calculateTextLines(
          section.description,
          context.fonts.english,
          siddurConfig.fontSizes.sectionDescription,
          context.width - context.margin * 2,
          siddurConfig.lineSpacing.sectionDescription,
        );
        ({ page: context.page, y: context.y } = ensureSpaceAndDraw(
          context,
          lines.map((l) => ({
            ...l,
            font: context.fonts.english,
            size: siddurConfig.fontSizes.sectionDescription,
            color: rgb(
              ...(siddurConfig.colors.sectionDescription as [
                number,
                number,
                number,
              ]),
            ),
            lineHeight: siddurConfig.lineSpacing.sectionDescription,
          })),
          `Section Description: ${section.sectionTitle}`,
        ));
        context.y -= siddurConfig.verticalSpacing.afterSectionDescription;

        for (const prayer of section.prayers as Prayer[]) {
          context = drawPrayer(context, prayer, { ...params, style });
        }
      }

      if (serviceIndex < allServices.length - 1) {
        context = drawDividerLine(context);
      }
    }
  }

  return { page: context.page, y: context.y, pageServiceMap };
};
