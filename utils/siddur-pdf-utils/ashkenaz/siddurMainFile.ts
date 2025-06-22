
// utils/siddur-pdf-utils/siddurMainFile.ts

import { PDFDocument, StandardFonts, rgb, PDFFont } from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';
import * as fs from 'fs/promises';
import * as path from 'path';
import ashPrayerInfo from 'prayer-content/ashkenazi-prayer-info.json';
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
type Prayer = (typeof ashPrayerInfo.sections)[0]['prayers'][0];

// NEW HELPER FUNCTION: Calculates text lines and their relative Y positions for a given block
const calculateTextLines = (
    textBlock: string,
    font: PDFFont,
    size: number,
    maxWidth: number,
    lineHeight: number // This lineHeight is used for calculating yOffset
): { text: string, yOffset: number }[] => {
    const lines: { text: string, yOffset: number }[] = [];
    const words = textBlock.split(' ');
    let line = '';
    let currentYOffset = 0; // Relative Y offset for this block, will be negative

    if (!textBlock) return []; // Handle empty text blocks

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
        page: any; // PDFPage
        y: number;
        width: number;
        height: number;
        margin: number;
        englishFont: PDFFont;
        englishBoldFont: PDFFont;
        hebrewFont: PDFFont;
    },
    textLines: { text: string, yOffset: number, font: PDFFont, size: number, color?: ReturnType<typeof rgb>, xOffset?: number, lineHeight: number }[]
): { page: any, y: number } => {
    let { pdfDoc, page, y, width, height, margin } = currentParams;

    // Calculate total height needed for these lines. The yOffset for the last line is the total height used downwards.
    const totalLinesHeight = textLines.length > 0 ? Math.abs(textLines[textLines.length - 1].yOffset) + textLines[0].lineHeight : 0; // Add initial line height for correct estimation

    // If the next block of text would go below the bottom margin
    if (y - totalLinesHeight < siddurConfig.pdfMargins.bottom) {
        page = pdfDoc.addPage();
        y = height - siddurConfig.pdfMargins.top;
    }

    // Draw the lines
    let currentBlockY = y; // The starting Y for the current block
    for (const lineInfo of textLines) {
        page.drawText(lineInfo.text, {
            x: margin + (lineInfo.xOffset || 0), // Apply relative xOffset
            y: currentBlockY + lineInfo.yOffset, // Add relative yOffset to block's starting Y
            font: lineInfo.font,
            size: lineInfo.size,
            color: lineInfo.color || rgb(0, 0, 0),
            lineHeight: lineInfo.lineHeight // Use the specific lineHeight for this line
        });
    }

    // Update the main 'y' coordinate by the total height consumed by this block
    y = currentBlockY + (textLines.length > 0 ? textLines[textLines.length - 1].yOffset : 0);

    return { page, y };
};


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
    const margin = siddurConfig.pdfMargins.left;
    let y = height - siddurConfig.pdfMargins.top;

    // Helper for passing common PDF generation parameters
    let commonPdfParams = { pdfDoc, page, y, width, height, margin, englishFont, englishBoldFont, hebrewFont };

    // --- PDF Header ---
    let lines = calculateTextLines(ashPrayerInfo.siddurTitle, englishBoldFont, 24, width - margin * 2, siddurConfig.lineSpacing.siddurTitle);
    ({ page, y } = ensureSpaceAndDraw({ ...commonPdfParams, page, y }, lines.map(l => ({ ...l, font: englishBoldFont, size: 24, color: rgb(0, 0.53, 0.71), lineHeight: siddurConfig.lineSpacing.siddurTitle }))));
    commonPdfParams = { ...commonPdfParams, page, y }; // Update common params after drawing
    y -= siddurConfig.verticalSpacing.afterSiddurTitle;


    lines = calculateTextLines(`Service: ${ashPrayerInfo.service}`, englishFont, 14, width - margin * 2, siddurConfig.lineSpacing.service);
    ({ page, y } = ensureSpaceAndDraw({ ...commonPdfParams, page, y }, lines.map(l => ({ ...l, font: englishFont, size: 14, lineHeight: siddurConfig.lineSpacing.service }))));
    commonPdfParams = { ...commonPdfParams, page, y }; // Update common params after drawing


    if (userName) {
        lines = calculateTextLines(`For: ${userName}`, englishFont, 12, width - margin * 2, siddurConfig.lineSpacing.userName);
        ({ page, y } = ensureSpaceAndDraw({ ...commonPdfParams, page, y }, lines.map(l => ({ ...l, font: englishFont, size: 12, lineHeight: siddurConfig.lineSpacing.userName }))));
        commonPdfParams = { ...commonPdfParams, page, y }; // Update common params after drawing
    }
    y -= siddurConfig.verticalSpacing.afterUserName;


    // --- Content Generation ---
    if (siddurFormat === SiddurFormat.NusachAshkenaz) {
        const { page: updatedPage, y: updatedY } = generateAshkenazContent({
            pdfDoc,
            page,
            y,
            width,
            height,
            margin,
            englishFont,
            englishBoldFont,
            hebrewFont,
            calculateTextLines, // Pass the new helper
            ensureSpaceAndDraw // Pass the new helper
        });
        page = updatedPage;
        y = updatedY;
    } else {
        lines = calculateTextLines("Content for other Nusachim (like Sefard) would be generated here.", englishFont, 12, width - margin * 2, 15);
        ({ page, y } = ensureSpaceAndDraw({ ...commonPdfParams, page, y }, lines.map(l => ({ ...l, font: englishFont, size: 12, lineHeight: 15 }))));
    }

    const pdfBytes = await pdfDoc.save();
    return pdfBytes;
};