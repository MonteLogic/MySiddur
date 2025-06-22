// utils/siddur-pdf-utils/siddurMainFile.ts

import { PDFDocument, StandardFonts, rgb, PDFFont } from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';
import * as fs from 'fs/promises';
import * as path from 'path';
import ashPrayerInfo from 'prayer-content/ashkenazi-prayer-info.json';
import siddurConfig from './siddur-formatting-config.json'; // <-- IMPORT CONFIG FILE

/**
 * Enum representing the available Siddur formats.
 */
export enum SiddurFormat {
  /**
   * Represents the Nusach Ashkenaz format.
   */
  NusachAshkenaz = 1,
  /**
   * Represents the Nusach Sefard format.
   */
  NusachSefard = 2,
}

/**
 * Formats a given Date object into a 'MM/DD/YYYY' string.
 * @param date - The date to format.
 * @returns A string representing the formatted date.
 */
export const formatDate = (date: Date): string => {
  return date.toLocaleDateString('en-US', {
    month: '2-digit',
    day: '2-digit',
    year: 'numeric',
  });
};

/**
 * Interface defining the parameters for generating a Siddur PDF.
 */
interface GenerateSiddurPDFParams {
  /**
   * The selected date for the Siddur, as a string.
   */
  selectedDate: string;
  /**
   * The desired Siddur format (e.g., Nusach Ashkenaz).
   */
  siddurFormat: SiddurFormat;
  /**
   * Optional name of the user to be included in the Siddur.
   */
  userName?: string;
}

/**
 * Type alias for a single prayer object, inferred from the structure of `ashPrayerInfo`.
 */
type Prayer = (typeof ashPrayerInfo.sections)[0]['prayers'][0];

/**
 * Generates a PDF document for a Siddur based on the provided parameters.
 * The PDF will include prayers and blessings according to the specified `siddurFormat`.
 * Currently, only `NusachAshkenaz` is fully supported.
 * @param params - An object containing the parameters for PDF generation, including `selectedDate`, `siddurFormat`, and an optional `userName`.
 * @returns A Promise that resolves to a Uint8Array representing the generated PDF document.
 */
export const generateSiddurPDF = async ({
  selectedDate,
  siddurFormat,
  userName,
}: GenerateSiddurPDFParams): Promise<Uint8Array> => {
  const dateForSiddur = new Date(selectedDate);
  const pdfDoc = await PDFDocument.create();

  // --- Register fontkit ---
  pdfDoc.registerFontkit(fontkit);

  // --- Font Loading ---
  const hebrewFontPath = path.join(process.cwd(), 'fonts', 'NotoSansHebrew-Regular.ttf');
  const englishFontPath = path.join(process.cwd(), 'fonts', 'NotoSans-Regular.ttf');

  const hebrewFontFileBuffer = await fs.readFile(hebrewFontPath);
  const englishFontFileBuffer = await fs.readFile(englishFontPath);
  
  const hebrewFontBytes = new Uint8Array(hebrewFontFileBuffer).buffer;
  const englishFontBytes = new Uint8Array(englishFontFileBuffer).buffer;

  const hebrewFont = await pdfDoc.embedFont(hebrewFontBytes);
  const englishFont = await pdfDoc.embedFont(englishFontBytes);
  const englishBoldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  let page = pdfDoc.addPage();
  const { width, height } = page.getSize();
  const margin = siddurConfig.pdfMargins.left; // Use left margin for all sides initially
  let y = height - siddurConfig.pdfMargins.top;

  // --- Helper function for text wrapping and Y-position management ---
  const drawAndWrapText = (
    textBlock: string,
    font: PDFFont,
    size: number,
    x: number,
    maxWidth: number,
    lineHeight: number,
    startY: number,
    color = rgb(0, 0, 0)
  ): number => {
    let currentY = startY;
    const words = textBlock.split(' ');
    let line = '';

    for (const word of words) {
        if (currentY < siddurConfig.pdfMargins.bottom + 20) { // Keep 20 as a minimum buffer
            page = pdfDoc.addPage();
            currentY = height - siddurConfig.pdfMargins.top;
        }
        const testLine = line + word + ' ';
        const textWidth = font.widthOfTextAtSize(testLine, size);
        if (textWidth > maxWidth) {
            page.drawText(line, { x, y: currentY, font, size, color, lineHeight });
            currentY -= lineHeight;
            line = word + ' ';
        } else {
            line = testLine;
        }
    }
    page.drawText(line, { x, y: currentY, font, size, color, lineHeight });
    currentY -= lineHeight;
    return currentY; // Return the final Y position
  };

  // --- PDF Header ---
  y = drawAndWrapText(ashPrayerInfo.siddurTitle, englishBoldFont, 24, margin, width - margin * 2, siddurConfig.lineSpacing.siddurTitle, y, rgb(0, 0.53, 0.71));
  y -= siddurConfig.verticalSpacing.afterSiddurTitle;
  
  y = drawAndWrapText(`Service: ${ashPrayerInfo.service}`, englishFont, 14, margin, width - margin * 2, siddurConfig.lineSpacing.service, y);

  if (userName) {
    y = drawAndWrapText(`For: ${userName}`, englishFont, 12, margin, width - margin * 2, siddurConfig.lineSpacing.userName, y);
  }
  y -= siddurConfig.verticalSpacing.afterUserName;

  // --- Content Generation ---
  if (siddurFormat === SiddurFormat.NusachAshkenaz) {
    for (const section of ashPrayerInfo.sections) {
      // Calculate approximate height needed for section title and description
      const sectionTitleTextHeight = englishBoldFont.heightAtSize(18) * (section.sectionTitle.length > 50 ? 2 : 1); // Simple estimation
      const sectionDescTextHeight = englishFont.heightAtSize(10) * (section.description.length > 100 ? 3 : 1); // Simple estimation
      const estimatedSectionHeaderHeight = sectionTitleTextHeight + siddurConfig.lineSpacing.sectionDescription + sectionDescTextHeight + siddurConfig.verticalSpacing.afterSectionDescription;

      if (y < siddurConfig.pdfMargins.bottom + estimatedSectionHeaderHeight) {
        page = pdfDoc.addPage();
        y = height - siddurConfig.pdfMargins.top;
      }

      y = drawAndWrapText(section.sectionTitle, englishBoldFont, 18, margin, width - margin * 2, siddurConfig.lineSpacing.sectionTitle, y, rgb(0.1, 0.1, 0.1));
      y = drawAndWrapText(section.description, englishFont, 10, margin, width - margin * 2, siddurConfig.lineSpacing.sectionDescription, y, rgb(0.3, 0.3, 0.3));
      y -= siddurConfig.verticalSpacing.afterSectionDescription;

      for (const prayer of section.prayers as Prayer[]) {
        // Estimate height for the prayer title and content
        const prayerTitleTextHeight = englishBoldFont.heightAtSize(14) + siddurConfig.verticalSpacing.beforePrayerTitle;
        let estimatedPrayerContentHeight = 0;

        const columnWidth = width / 2 - margin - 10;

        if ('blessings' in prayer && Array.isArray(prayer.blessings)) {
            // A more accurate estimation would involve iterating through blessings here
            // For now, a simplified estimate
            estimatedPrayerContentHeight = prayer.blessings.length * Math.max(siddurConfig.lineSpacing.blessingEnglish, siddurConfig.lineSpacing.blessingHebrew) + (prayer.blessings.length * siddurConfig.verticalSpacing.afterBlessingGroup);
        } else if ('parts' in prayer && Array.isArray(prayer.parts)) {
            estimatedPrayerContentHeight = prayer.parts.length * Math.max(siddurConfig.lineSpacing.prayerPartEnglish, siddurConfig.lineSpacing.prayerPartHebrew) + (prayer.parts.length * siddurConfig.verticalSpacing.afterPartGroup);
        } else if ('hebrew' in prayer && prayer.hebrew && 'english' in prayer && prayer.english) {
            // A more accurate estimation would involve actual text wrapping calculation
            const englishLines = Math.ceil(englishFont.widthOfTextAtSize(prayer.english, 12) / columnWidth);
            const hebrewLines = Math.ceil(hebrewFont.widthOfTextAtSize(prayer.hebrew, 14) / columnWidth);
            estimatedPrayerContentHeight = Math.max(englishLines * siddurConfig.lineSpacing.defaultEnglishPrayer, hebrewLines * siddurConfig.lineSpacing.defaultHebrewPrayer) + siddurConfig.verticalSpacing.afterSimplePrayer;
        }

        if (y < siddurConfig.pdfMargins.bottom + prayerTitleTextHeight + estimatedPrayerContentHeight) {
          page = pdfDoc.addPage();
          y = height - siddurConfig.pdfMargins.top;
        }

        y = drawAndWrapText(prayer.title, englishBoldFont, 14, margin, width - margin * 2, siddurConfig.lineSpacing.prayerTitle, y);
        y -= siddurConfig.verticalSpacing.beforePrayerTitle;

        const columnStartY = y;
        
        if ('blessings' in prayer && Array.isArray(prayer.blessings)) {
            let blessingY = columnStartY;
            for(const blessing of prayer.blessings) {
                const englishY = drawAndWrapText(blessing.english, englishFont, 12, margin, columnWidth, siddurConfig.lineSpacing.blessingEnglish, blessingY);
                const hebrewY = drawAndWrapText(blessing.hebrew, hebrewFont, 14, width / 2 + 10, columnWidth, siddurConfig.lineSpacing.blessingHebrew, blessingY);
                blessingY = Math.min(englishY, hebrewY) - siddurConfig.verticalSpacing.afterBlessingGroup;
            }
            y = blessingY;

        } else if ('parts' in prayer && Array.isArray(prayer.parts)) {
            let partY = columnStartY;
            for(const part of prayer.parts) {
                if (part.source) {
                    partY = drawAndWrapText(`Source: ${part.source}`, englishFont, 9, margin, columnWidth, siddurConfig.lineSpacing.prayerPartSource, partY, rgb(0.5, 0.5, 0.5));
                }
                const englishY = drawAndWrapText(part.english, englishFont, 12, margin, columnWidth, siddurConfig.lineSpacing.prayerPartEnglish, partY);
                const hebrewY = drawAndWrapText(part.hebrew, hebrewFont, 14, width / 2 + 10, columnWidth, siddurConfig.lineSpacing.prayerPartHebrew, partY);
                partY = Math.min(englishY, hebrewY) - siddurConfig.verticalSpacing.afterPartGroup;
            }
            y = partY;

        } else if ('hebrew' in prayer && prayer.hebrew && 'english' in prayer && prayer.english) {
            const englishEndY = drawAndWrapText(prayer.english, englishFont, 12, margin, columnWidth, siddurConfig.lineSpacing.defaultEnglishPrayer, columnStartY);
            const hebrewEndY = drawAndWrapText(prayer.hebrew, hebrewFont, 14, width / 2 + 10, columnWidth, siddurConfig.lineSpacing.defaultHebrewPrayer, columnStartY);
            y = Math.min(englishEndY, hebrewEndY) - siddurConfig.verticalSpacing.afterSimplePrayer;
        }
      }
    }
  } else {
    y = drawAndWrapText("Content for other Nusachim (like Sefard) would be generated here.", englishFont, 12, margin, width - margin * 2, 15, y);
  }

  const pdfBytes = await pdfDoc.save();
  return pdfBytes;
};