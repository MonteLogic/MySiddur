// lib/siddur-pdf-utils/ashkenaz/ashkenaz-content-generation.ts
import { PDFPage, rgb } from 'pdf-lib';
import ashPrayerInfo from 'prayer/prayer-content/ashkenazi-prayer-info.json';
import siddurConfig from './siddur-formatting-config.json';
import { AshkenazContentGenerationParams, PdfDrawingContext, Prayer } from './drawing/types';
import { drawPrayer } from './drawing/prayer-drawing';
import { drawDividerLine } from './drawing/drawing-helpers';


export const generateAshkenazContent = (
  params: AshkenazContentGenerationParams,
): { page: PDFPage; y: number } => {
  const { pdfDoc, page, y, width, height, margin, englishFont, englishBoldFont, hebrewFont, calculateTextLines, ensureSpaceAndDraw } = params;

  let context: PdfDrawingContext = {
    pdfDoc, page, y, width, height, margin,
    fonts: { english: englishFont, englishBold: englishBoldFont, hebrew: hebrewFont },
  };

  const allServices = [
    ashPrayerInfo.services['waking-prayers'],
    ashPrayerInfo.services.shacharis,
  ];

  for (const [serviceIndex, service] of allServices.entries()) {
    if (!service || !Array.isArray(service.sections)) continue;

    // This line creates the title string.
    // It combines the text "Service: " with the value of "display-name" from your JSON file.
    const serviceTitle = `Service: ${service['display-name']}`;
    let lines = calculateTextLines(serviceTitle, context.fonts.englishBold, siddurConfig.fontSizes.service, context.width - context.margin * 2, siddurConfig.lineSpacing.service);
    
    ({ page: context.page, y: context.y } = ensureSpaceAndDraw(
      context,
      lines.map((l) => ({ ...l, font: context.fonts.englishBold, size: siddurConfig.fontSizes.service, lineHeight: siddurConfig.lineSpacing.service })),
      serviceTitle,
    ));
    context.y -= siddurConfig.verticalSpacing.afterSiddurTitle; // Re-use spacing

    for (const section of service.sections) {
      // Estimate header height and check for page break
      const estimatedSectionHeaderHeight = 100; // Simplified estimation
      const pageBreakThreshold = siddurConfig.pdfMargins.bottom + estimatedSectionHeaderHeight + siddurConfig.verticalSpacing.pageBuffer;
      if (context.y < pageBreakThreshold) {
        context.page = context.pdfDoc.addPage();
        context.y = context.height - siddurConfig.pdfMargins.top;
      }

      // Draw Section Title
      lines = calculateTextLines(section.sectionTitle, context.fonts.englishBold, siddurConfig.fontSizes.sectionTitle, context.width - context.margin * 2, siddurConfig.lineSpacing.sectionTitle);
      ({ page: context.page, y: context.y } = ensureSpaceAndDraw(
        context,
        lines.map((l) => ({ ...l, font: context.fonts.englishBold, size: siddurConfig.fontSizes.sectionTitle, color: rgb(...(siddurConfig.colors.sectionTitle as [number, number, number])), lineHeight: siddurConfig.lineSpacing.sectionTitle })),
        `Section Title: ${section.sectionTitle}`,
      ));
      context.y -= siddurConfig.verticalSpacing.afterSectionTitleText;

      // Draw Section Description
      lines = calculateTextLines(section.description, context.fonts.english, siddurConfig.fontSizes.sectionDescription, context.width - context.margin * 2, siddurConfig.lineSpacing.sectionDescription);
      ({ page: context.page, y: context.y } = ensureSpaceAndDraw(
        context,
        lines.map((l) => ({ ...l, font: context.fonts.english, size: siddurConfig.fontSizes.sectionDescription, color: rgb(...(siddurConfig.colors.sectionDescription as [number, number, number])), lineHeight: siddurConfig.lineSpacing.sectionDescription })),
        `Section Description: ${section.sectionTitle}`,
      ));
      context.y -= siddurConfig.verticalSpacing.afterSectionDescription;

      for (const prayer of section.prayers as Prayer[]) {
        context = drawPrayer(context, prayer, params);
      }
    }

    if (serviceIndex < allServices.length - 1) {
      context = drawDividerLine(context);
    }
  }

  return { page: context.page, y: context.y };
};