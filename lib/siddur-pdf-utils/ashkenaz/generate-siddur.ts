/**
 * @file Main entry point for Siddur PDF generation.
 * Refactored to use modular infrastructure from core/ and ashkenaz/.
 */
import * as Sentry from '@sentry/nextjs';
import { HDate } from '@hebcal/core';
import { SiddurDocument } from '../core';
import { drawPageHeader, drawHebrewDate } from './page-header';
import { applyPageFooters, fillPageServiceMapGaps } from './page-footer';
import { generateAshkenazContent } from './ashkenaz-content-generation';
import { calculateTextLines } from '../core/text-utils';
import type { SiddurConfig } from '../core/types';

// Use require for JSON to avoid TypeScript resolveJsonModule issues
const ashPrayerInfo = require('prayer/prayer-content/ashkenazi-prayer-info.json');
const siddurConfig = require('./siddur-formatting-config.json');

export enum SiddurFormat {
  NusachAshkenaz = 1,
  NusachSefard = 2,
}

export interface GenerateSiddurPDFParams {
  selectedDate: string;
  siddurFormat: SiddurFormat;
  userName?: string;
  style?: string;
  wordMappingInterval?: number;
  wordMappingStartIndex?: number;
  showWordMappingSubscripts?: boolean;
  includeIntroduction?: boolean;
  includeInstructions?: boolean;
  fontSizeMultiplier?: number;
  pageMargins?: 'tight' | 'normal' | 'wide';
  printBlackAndWhite?: boolean;
}

export const formatDate = (date: Date): string => {
  return date.toLocaleDateString('en-US', {
    month: '2-digit',
    day: '2-digit',
    year: 'numeric',
  });
};

/**
 * Generate a Siddur PDF document.
 * 
 * This is the main entry point for PDF generation. It:
 * 1. Creates a SiddurDocument with fonts and configuration
 * 2. Draws the page header (date, Shabbos edition)
 * 3. Delegates to format-specific content generator
 * 4. Applies page numbers and service headings
 */
export async function generateSiddurPDF(params: GenerateSiddurPDFParams): Promise<Uint8Array> {
  const startTime = Date.now();
  const config = siddurConfig as SiddurConfig;
  
  try {
    // Initialize prayer data for this date
    const { initializePrayerIndex } = await import('./drawing/helpers/prayer-data');
    const selectedDateObj = new Date(params.selectedDate);
    initializePrayerIndex(selectedDateObj);
    
    // Create document with options
    const siddur = await SiddurDocument.create({
      pageMargins: params.pageMargins,
      fontSizeMultiplier: params.fontSizeMultiplier,
      printBlackAndWhite: params.printBlackAndWhite,
    });
    
    const fonts = siddur.getFonts();
    const { width, height, margin } = siddur.getDimensions();
    const page = siddur.getCurrentPage();
    
    // Draw header on first page
    const hDate = new HDate(selectedDateObj);
    const isShabbos = hDate.getDay() === 6;
    
    drawPageHeader(page, fonts, config, margin, width, height, {
      selectedDate: selectedDateObj,
      isShabbos,
    });
    
    drawHebrewDate(page, fonts, margin, height, hDate.toString());
    
    // Generate content based on format
    let pageServiceMap = new Map<number, string>();
    
    if (params.siddurFormat === SiddurFormat.NusachAshkenaz) {
      const commonPdfParams = {
        pdfDoc: siddur.getDocument(),
        page: siddur.getCurrentPage(),
        y: siddur.getY(),
        width,
        height,
        margin,
        englishFont: fonts.english,
        englishBoldFont: fonts.englishBold,
        hebrewFont: fonts.hebrew,
      };
      
      const result = generateAshkenazContent({
        ...commonPdfParams,
        style: params.style,
        wordMappingInterval: params.wordMappingInterval,
        wordMappingStartIndex: params.wordMappingStartIndex,
        showWordMappingSubscripts: params.showWordMappingSubscripts,
        includeIntroduction: params.includeIntroduction,
        includeInstructions: params.includeInstructions,
        fontSizeMultiplier: params.fontSizeMultiplier,
        pageMargins: params.pageMargins,
        printBlackAndWhite: params.printBlackAndWhite,
        selectedDate: selectedDateObj,
        calculateTextLines: (text, font, fontSize, maxWidth, lineHeight) =>
          calculateTextLines(text, font, fontSize, maxWidth, lineHeight),
        ensureSpaceAndDraw: (drawingContext, textLines, label) => {
          const completeContext = { ...commonPdfParams, ...drawingContext };
          return ensureSpaceAndDrawLegacy(completeContext, textLines, label, config);
        },
      });
      
      siddur.setCurrentPage(result.page, result.y);
      pageServiceMap = result.pageServiceMap;
    } else {
      // Placeholder for NusachSefard or other formats
      Sentry.captureMessage('Unsupported siddur format requested', {
        level: 'warning',
        extra: { format: params.siddurFormat },
      });
    }
    
    // Apply page footers (page numbers, service headings)
    const pages = siddur.getPages();
    const totalPages = pages.length;
    
    // Ensure first page has a service mapped
    if (totalPages > 0 && !pageServiceMap.has(0)) {
      const firstService = (ashPrayerInfo as any).services?.['waking-prayers'];
      if (firstService?.['display-name']) {
        pageServiceMap.set(0, firstService['display-name']);
      }
    }
    
    const filledServiceMap = fillPageServiceMapGaps(pageServiceMap, totalPages);
    applyPageFooters(pages, fonts, config, margin, filledServiceMap);
    
    // Log performance
    const elapsed = Date.now() - startTime;
    console.log(`[generateSiddurPDF] Generated in ${elapsed}ms, ${totalPages} pages`);
    
    if (elapsed > 2000) {
      Sentry.captureMessage('Slow PDF generation', {
        level: 'warning',
        extra: {
          elapsedMs: elapsed,
          pageCount: totalPages,
          format: params.siddurFormat,
        },
      });
    }
    
    return siddur.save();
    
  } catch (error) {
    Sentry.captureException(error, {
      extra: {
        context: 'generateSiddurPDF',
        params: {
          selectedDate: params.selectedDate,
          siddurFormat: params.siddurFormat,
          style: params.style,
        },
      },
    });
    throw error;
  }
}

/**
 * Legacy wrapper for ensureSpaceAndDraw to maintain compatibility
 * with existing content generation code.
 */
function ensureSpaceAndDrawLegacy(
  currentParams: {
    pdfDoc: any;
    page: any;
    y: number;
    width: number;
    height: number;
    margin: number;
    englishFont: any;
    englishBoldFont: any;
    hebrewFont: any;
  },
  textLines: any[],
  contentLabel: string,
  config: SiddurConfig,
): { page: any; y: number } {
  const { rgb } = require('pdf-lib');
  let { pdfDoc, page, y, height, margin } = currentParams;
  
  const totalLinesHeight =
    textLines.length > 0
      ? Math.abs(textLines[textLines.length - 1].yOffset) + textLines[0].lineHeight
      : 0;

  if (y - totalLinesHeight < config.pdfMargins.bottom + config.verticalSpacing.pageBuffer) {
    page = pdfDoc.addPage();
    y = height - config.pdfMargins.top;
  }

  let currentBlockY = y;
  for (const lineInfo of textLines) {
    page.drawText(lineInfo.text, {
      x: margin + (lineInfo.xOffset || 0),
      y: currentBlockY + lineInfo.yOffset,
      font: lineInfo.font,
      size: lineInfo.size,
      color: lineInfo.color || rgb(
        config.colors.defaultText[0],
        config.colors.defaultText[1],
        config.colors.defaultText[2],
      ),
      lineHeight: lineInfo.lineHeight,
    });
  }
  
  y = currentBlockY + (textLines.length > 0 ? textLines[textLines.length - 1].yOffset : 0);
  return { page, y };
}

export default generateSiddurPDF;
