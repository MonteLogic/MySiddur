// utils/siddur-pdf-utils/siddurMainFile.ts

import { PDFDocument, StandardFonts, rgb, PDFFont } from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit'; // <-- 1. IMPORT FONTKIT
import * as fs from 'fs/promises';
import * as path from 'path';
import ashPrayerInfo from 'prayer-content/ashkenazi-prayer-info.json';

export enum SiddurFormat {
  NusachAshkenaz = 1,
  NusachSefard = 2,
}

export const formatDate = (date: Date): string => {
  return date.toLocaleDateString('en-US', {
    month: '2-digit',
    day: '2-digit',
    year: 'numeric',
  });
};

interface GenerateSiddurPDFParams {
  selectedDate: string;
  siddurFormat: SiddurFormat;
  userName?: string;
}

type Prayer = (typeof ashPrayerInfo.sections)[0]['prayers'][0];

export const generateSiddurPDF = async ({
  selectedDate,
  siddurFormat,
  userName,
}: GenerateSiddurPDFParams): Promise<Uint8Array> => {
  const dateForSiddur = new Date(selectedDate);
  const pdfDoc = await PDFDocument.create();

  // --- Register fontkit ---
  pdfDoc.registerFontkit(fontkit); // <-- 2. REGISTER FONTKIT

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
  const margin = 50;
  let y = height - margin;

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
        if (currentY < margin) {
            page = pdfDoc.addPage();
            currentY = height - margin;
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
  y = drawAndWrapText(ashPrayerInfo.siddurTitle, englishBoldFont, 24, margin, width - margin * 2, 30, y, rgb(0, 0.53, 0.71));
  y -= 10;
  
  y = drawAndWrapText(`Service: ${ashPrayerInfo.service}`, englishFont, 14, margin, width - margin * 2, 20, y);

  if (userName) {
    y = drawAndWrapText(`For: ${userName}`, englishFont, 12, margin, width - margin * 2, 18, y);
  }
  y -= 20;

  // --- Content Generation ---
  if (siddurFormat === SiddurFormat.NusachAshkenaz) {
    for (const section of ashPrayerInfo.sections) {
      if (y < margin + 60) {
        page = pdfDoc.addPage();
        y = height - margin;
      }
      y = drawAndWrapText(section.sectionTitle, englishBoldFont, 18, margin, width - margin * 2, 22, y, rgb(0.1, 0.1, 0.1));
      y = drawAndWrapText(section.description, englishFont, 10, margin, width - margin * 2, 14, y, rgb(0.3, 0.3, 0.3));
      y -= 10;

      for (const prayer of section.prayers as Prayer[]) {
        if (y < margin + 60) {
          page = pdfDoc.addPage();
          y = height - margin;
        }
        y = drawAndWrapText(prayer.title, englishBoldFont, 14, margin, width - margin * 2, 18, y);
        y -= 5;

        const columnStartY = y;
        let englishEndY = y;
        let hebrewEndY = y;
        const columnWidth = width / 2 - margin - 10;
        
        if ('blessings' in prayer && Array.isArray(prayer.blessings)) {
            let blessingY = columnStartY;
            for(const blessing of prayer.blessings) {
                const englishY = drawAndWrapText(blessing.english, englishFont, 12, margin, columnWidth, 15, blessingY);
                const hebrewY = drawAndWrapText(blessing.hebrew, hebrewFont, 14, width / 2 + 10, columnWidth, 18, blessingY);
                blessingY = Math.min(englishY, hebrewY) - 20;
            }
            y = blessingY;

        } else if ('parts' in prayer && Array.isArray(prayer.parts)) {
            let partY = columnStartY;
            for(const part of prayer.parts) {
                if (part.source) {
                    partY = drawAndWrapText(`Source: ${part.source}`, englishFont, 9, margin, columnWidth, 12, partY, rgb(0.5, 0.5, 0.5));
                }
                const englishY = drawAndWrapText(part.english, englishFont, 12, margin, columnWidth, 15, partY);
                const hebrewY = drawAndWrapText(part.hebrew, hebrewFont, 14, width / 2 + 10, columnWidth, 18, partY);
                partY = Math.min(englishY, hebrewY) - 20;
            }
            y = partY;

        } else if ('hebrew' in prayer && prayer.hebrew && 'english' in prayer && prayer.english) {
            englishEndY = drawAndWrapText(prayer.english, englishFont, 12, margin, columnWidth, 15, columnStartY);
            hebrewEndY = drawAndWrapText(prayer.hebrew, hebrewFont, 14, width / 2 + 10, columnWidth, 18, columnStartY);
            y = Math.min(englishEndY, hebrewEndY) - 25;
        }
      }
    }
  } else {
    y = drawAndWrapText("Content for other Nusachim (like Sefard) would be generated here.", englishFont, 12, margin, width - margin * 2, 15, y);
  }

  const pdfBytes = await pdfDoc.save();
  return pdfBytes;
};