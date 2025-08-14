import { PDFDocument, StandardFonts, rgb, PDFFont, PDFPage, Color } from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';
import * as fs from 'fs/promises';
import * as path from 'path';
import ashPrayerInfo from 'prayer/prayer-content/ashkenazi-prayer-info.json';
import siddurConfig from './siddur-formatting-config.json';
import { generateAshkenazContent } from './ashkenaz-content-generation';

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
type Prayer = typeof ashPrayerInfo.services.shacharis.sections[0]['prayers'][0];

// NEW HELPER FUNCTION: Calculates text lines and their relative Y positions for a given block
const calculateTextLines = (
  textBlock: string,
  font: PDFFont,
  size: number,
  maxWidth: number,
  lineHeight: number, // This lineHeight is used for calculating yOffset
): { text: string; yOffset: number }[] => {
  const lines: { text: string; yOffset: number }[] = [];
  const words = textBlock.split(' ');
  let line = '';
  let currentYOffset = 0; // Relative Y offset for this block, will be negative

  if (!textBlock) return [];

  for (const word of words) {
    const testLine = line + word + ' ';
    const textWidth = font.widthOfTextAtSize(testLine, size);

    if (textWidth > maxWidth) {
      lines.push({ text: line.trim(), yOffset: currentYOffset });
      currentYOffset -= lineHeight;
      line = word + ' ';
    } else {
      line = testLine;
    }
  }
  // Push the last line
  if (line.trim().length > 0) {
    lines.push({ text: line.trim(), yOffset: currentYOffset });
  }
  return lines;
};

/**
 * Ensures there's enough space on the current page for a given block of content.
 * If not, adds a new page and resets y. Then draws the provided text lines.
 * @param params Object containing pdfDoc, current page, current y, page dimensions, margins, fonts.
 * @param textLines Array of objects containing text, relative yOffset, font, size, color, xOffset, and specific lineHeight for drawing.
 * @returns An object with the updated page and y coordinate.
 */
const ensureSpaceAndDraw = (
  currentParams: {
    pdfDoc: PDFDocument;
    page: PDFPage;
    y: number;
    width: number;
    height: number;
    margin: number;
    englishFont: PDFFont;
    englishBoldFont: PDFFont;
    hebrewFont: PDFFont;
  },
  textLines: {
    text: string;
    yOffset: number;
    font: PDFFont;
    size: number;
    color?: Color;
    xOffset?: number;
    lineHeight: number;
  }[],
  // DEBUGGING: Added a label to identify the content being processed
  contentLabel: string
): { page: PDFPage; y: number } => {
  let { pdfDoc, page, y, width, height, margin } = currentParams;

  const totalLinesHeight =
    textLines.length > 0
      ? Math.abs(textLines[textLines.length - 1].yOffset) +
        textLines[0].lineHeight
      : 0;

  console.log(`[ensureSpaceAndDraw] Processing: "${contentLabel}"`);
  console.log(`[ensureSpaceAndDraw] Current Y: ${y.toFixed(2)}, Content Height: ${totalLinesHeight.toFixed(2)}, Bottom Margin: ${siddurConfig.pdfMargins.bottom}`);

  // If the next block of text would go below the bottom margin
  if (
    y - totalLinesHeight <
    siddurConfig.pdfMargins.bottom + siddurConfig.verticalSpacing.pageBuffer
  ) {
    const availableSpace = y - siddurConfig.pdfMargins.bottom;
    console.warn(`
      *************************************************
      *** CREATING NEW PAGE                         ***
      *************************************************
      Reason: Not enough space for "${contentLabel}".
      - Available Space: ${availableSpace.toFixed(2)}
      - Needed Space:    ${totalLinesHeight.toFixed(2)}
      - Current Y:       ${y.toFixed(2)}
      - Page Number:     ${pdfDoc.getPageCount()}
      *************************************************
    `);
    page = pdfDoc.addPage();
    y = height - siddurConfig.pdfMargins.top;
    console.log(`[ensureSpaceAndDraw] New page added. Y reset to ${y.toFixed(2)}.`);
  }

  // Draw the lines
  let currentBlockY = y;
  for (const lineInfo of textLines) {
    page.drawText(lineInfo.text, {
      x: margin + (lineInfo.xOffset || 0),
      y: currentBlockY + lineInfo.yOffset,
      font: lineInfo.font,
      size: lineInfo.size,
      color:
        lineInfo.color ||
        rgb(
          siddurConfig.colors.defaultText[0],
          siddurConfig.colors.defaultText[1],
          siddurConfig.colors.defaultText[2],
        ),
      lineHeight: lineInfo.lineHeight,
    });
  }

  const yAfterDraw = currentBlockY + (textLines.length > 0 ? textLines[textLines.length - 1].yOffset : 0);
  console.log(`[ensureSpaceAndDraw] Finished drawing "${contentLabel}". Y updated from ${y.toFixed(2)} to ${yAfterDraw.toFixed(2)}.`);
  y = yAfterDraw;

  return { page, y };
};

/**
 * Generates a PDF document for a Siddur based on the provided parameters.
 */
export const generateSiddurPDF = async ({
  selectedDate,
  siddurFormat,
  userName,
}: GenerateSiddurPDFParams): Promise<Uint8Array> => {
  console.log('--- STARTING SIDDUR PDF GENERATION ---');
  console.log(`Date: ${selectedDate}, Format: ${SiddurFormat[siddurFormat]}, User: ${userName || 'N/A'}`);

  const dateForSiddur = new Date(selectedDate);
  const pdfDoc = await PDFDocument.create();

  pdfDoc.registerFontkit(fontkit);

  // --- Font Loading ---
  console.log('Loading fonts...');
  const hebrewFontPath = path.join(process.cwd(), 'fonts', 'NotoSansHebrew-Regular.ttf');
  const englishFontPath = path.join(process.cwd(), 'fonts', 'NotoSans-Regular.ttf');
  const hebrewFontFileBuffer = await fs.readFile(hebrewFontPath);
  const englishFontFileBuffer = await fs.readFile(englishFontPath);
  const hebrewFontBytes = new Uint8Array(hebrewFontFileBuffer).buffer;
  const englishFontBytes = new Uint8Array(englishFontFileBuffer).buffer;
  const hebrewFont = await pdfDoc.embedFont(hebrewFontBytes);
  const englishFont = await pdfDoc.embedFont(englishFontBytes);
  const englishBoldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  console.log('Fonts loaded successfully.');

  let page = pdfDoc.addPage();
  const { width, height } = page.getSize();
  const margin = siddurConfig.pdfMargins.left;
  let y = height - siddurConfig.pdfMargins.top;

  console.log(`Initial page created. Width: ${width}, Height: ${height}, Top Margin: ${siddurConfig.pdfMargins.top}, Initial Y: ${y}`);

  let commonPdfParams = {
    pdfDoc,
    page,
    y,
    width,
    height,
    margin,
    englishFont,
    englishBoldFont,
    hebrewFont,
  };

  // --- PDF Header ---
  console.log('--- Creating PDF Header ---');
  let lines = calculateTextLines(
    ashPrayerInfo.siddurTitle,
    englishBoldFont,
    siddurConfig.fontSizes.siddurTitle,
    width - margin * 2,
    siddurConfig.lineSpacing.siddurTitle,
  );
  ({ page, y } = ensureSpaceAndDraw(
    { ...commonPdfParams, page, y },
    lines.map((l) => ({
      ...l,
      font: englishBoldFont,
      size: siddurConfig.fontSizes.siddurTitle,
      color: rgb(
        siddurConfig.colors.siddurTitle[0],
        siddurConfig.colors.siddurTitle[1],
        siddurConfig.colors.siddurTitle[2],
      ),
      lineHeight: siddurConfig.lineSpacing.siddurTitle,
    })),
    'Siddur Title'
  ));
  commonPdfParams = { ...commonPdfParams, page, y };
  y -= siddurConfig.verticalSpacing.afterSiddurTitle;
  console.log(`Y after Siddur Title spacing: ${y.toFixed(2)}`);

  lines = calculateTextLines(
    `Service: ${ashPrayerInfo.services.shacharis.sections}`,
    englishFont,
    siddurConfig.fontSizes.service,
    width - margin * 2,
    siddurConfig.lineSpacing.service,
  );
  ({ page, y } = ensureSpaceAndDraw(
    { ...commonPdfParams, page, y },
    lines.map((l) => ({
      ...l,
      font: englishFont,
      size: siddurConfig.fontSizes.service,
      lineHeight: siddurConfig.lineSpacing.service,
    })),
    'Service Name'
  ));
  commonPdfParams = { ...commonPdfParams, page, y };

  if (userName) {
    lines = calculateTextLines(
      `For: ${userName}`,
      englishFont,
      siddurConfig.fontSizes.userName,
      width - margin * 2,
      siddurConfig.lineSpacing.userName,
    );
    ({ page, y } = ensureSpaceAndDraw(
      { ...commonPdfParams, page, y },
      lines.map((l) => ({
        ...l,
        font: englishFont,
        size: siddurConfig.fontSizes.userName,
        lineHeight: siddurConfig.lineSpacing.userName,
      })),
      'User Name'
    ));
    commonPdfParams = { ...commonPdfParams, page, y };
  }
  y -= siddurConfig.verticalSpacing.afterUserName;
  console.log(`Y after User Name spacing: ${y.toFixed(2)}`);
  console.log('--- Finished PDF Header ---');

  // --- Content Generation ---
  if (siddurFormat === SiddurFormat.NusachAshkenaz) {
    console.log('--- Starting Content Generation: Nusach Ashkenaz ---');
    const { page: updatedPage, y: updatedY } = generateAshkenazContent({
      ...commonPdfParams,
      page, // Pass the most recent page
      y,    // Pass the most recent y
      calculateTextLines,
      // FIX: Adapt the callback to ensure the full context is passed.
      // The `drawingContext` from `generateAshkenazContent` may be missing font properties.
      // This merges the static `commonPdfParams` (with fonts) with the dynamic `drawingContext` (with current page/y).
      ensureSpaceAndDraw: (drawingContext, textLines, label) => {
        const completeContext = {
          ...commonPdfParams,
          ...drawingContext,
        };
        return ensureSpaceAndDraw(completeContext, textLines, label);
      },
    });
    page = updatedPage;
    y = updatedY;
    console.log('--- Finished Content Generation: Nusach Ashkenaz ---');
  } else {
    console.log('--- Starting Content Generation: Other Nusach ---');
    lines = calculateTextLines(
      'Content for other Nusachim (like Sefard) would be generated here.',
      englishFont,
      siddurConfig.fontSizes.otherNusachContent,
      width - margin * 2,
      siddurConfig.lineSpacing.defaultEnglishPrayer,
    );
    ({ page, y } = ensureSpaceAndDraw(
      { ...commonPdfParams, page, y },
      lines.map((l) => ({
        ...l,
        font: englishFont,
        size: siddurConfig.fontSizes.otherNusachContent,
        lineHeight: siddurConfig.lineSpacing.defaultEnglishPrayer,
      })),
      'Other Nusach Placeholder'
    ));
    console.log('--- Finished Content Generation: Other Nusach ---');
  }

  console.log('--- PDF GENERATION COMPLETE. Saving document... ---');
  const pdfBytes = await pdfDoc.save();
  console.log(`PDF saved. Total pages: ${pdfDoc.getPageCount()}. Final size: ${pdfBytes.length} bytes.`);
  return pdfBytes;
};
