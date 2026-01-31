/**
 * @file Page footer drawing utilities.
 * Handles page numbers and service headings.
 */
import { PDFPage, rgb } from 'pdf-lib';
import type { FontSet, SiddurConfig } from '../core/types';

/**
 * Apply page numbers and service headings to all pages in the document.
 */
export function applyPageFooters(
  pages: PDFPage[],
  fonts: FontSet,
  config: SiddurConfig,
  margin: number,
  pageServiceMap: Map<number, string>,
): void {
  const totalPages = pages.length;
  
  for (let i = 0; i < totalPages; i++) {
    const page = pages[i];
    const { width: pageWidth, height: pageHeight } = page.getSize();
    
    // Draw page number (top right)
    const pageNumberText = `${i + 1} / ${totalPages}`;
    const fontSize = 10;
    const textWidth = fonts.english.widthOfTextAtSize(pageNumberText, fontSize);
    
    page.drawText(pageNumberText, {
      x: pageWidth - textWidth - margin,
      y: pageHeight - config.pdfMargins.top / 2,
      font: fonts.english,
      size: fontSize,
      color: rgb(0, 0, 0),
    });
    
    // Draw service heading (top center) if available
    const serviceName = pageServiceMap.get(i);
    if (serviceName) {
      const serviceHeadingText = 'Service: ' + serviceName;
      const serviceHeadingFontSize = config.fontSizes.serviceHeading;
      const serviceHeadingWidth = fonts.english.widthOfTextAtSize(
        serviceHeadingText,
        serviceHeadingFontSize,
      );
      
      page.drawText(serviceHeadingText, {
        x: (pageWidth - serviceHeadingWidth) / 2,
        y: pageHeight - config.pdfMargins.top / 2,
        font: fonts.english,
        size: serviceHeadingFontSize,
        color: rgb(
          config.colors.serviceHeading[0],
          config.colors.serviceHeading[1],
          config.colors.serviceHeading[2],
        ),
      });
    }
  }
}

/**
 * Fill gaps in the page service mapping.
 * If a page doesn't have a service mapped, inherit from the previous page.
 */
export function fillPageServiceMapGaps(
  pageServiceMap: Map<number, string>,
  totalPages: number,
  defaultService?: string,
): Map<number, string> {
  const filledMap = new Map(pageServiceMap);
  let lastKnownService = defaultService || '';
  
  for (let i = 0; i < totalPages; i++) {
    if (filledMap.has(i)) {
      lastKnownService = filledMap.get(i) || '';
    } else if (lastKnownService) {
      filledMap.set(i, lastKnownService);
    }
  }
  
  return filledMap;
}
