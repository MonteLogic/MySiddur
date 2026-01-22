/**
 * @file Font loading utilities for Siddur PDF generation.
 * Handles loading and caching of Hebrew and English fonts.
 */
import { PDFDocument, StandardFonts } from 'pdf-lib';
import * as fontkit from '@pdf-lib/fontkit';
import * as fs from 'fs/promises';
import * as path from 'path';
import type { FontSet } from './types';

// Font cache to avoid reloading fonts on each PDF generation
let cachedFontBytes: {
  hebrew: Uint8Array | null;
  english: Uint8Array | null;
} = {
  hebrew: null,
  english: null,
};

/**
 * Load font bytes from disk, with caching.
 */
async function loadFontBytes(): Promise<{ hebrew: Uint8Array; english: Uint8Array }> {
  if (!cachedFontBytes.hebrew) {
    const hebrewPath = path.join(process.cwd(), 'fonts', 'NotoSansHebrew-Regular.ttf');
    cachedFontBytes.hebrew = new Uint8Array(await fs.readFile(hebrewPath));
  }
  
  if (!cachedFontBytes.english) {
    const englishPath = path.join(process.cwd(), 'fonts', 'NotoSans-Regular.ttf');
    cachedFontBytes.english = new Uint8Array(await fs.readFile(englishPath));
  }
  
  return {
    hebrew: cachedFontBytes.hebrew,
    english: cachedFontBytes.english,
  };
}

/**
 * Load and embed fonts into a PDF document.
 * Font bytes are cached in memory for subsequent calls.
 * 
 * @param doc - The PDF document to embed fonts into
 * @returns A FontSet with all required fonts
 */
export async function loadFonts(doc: PDFDocument): Promise<FontSet> {
  // Handle both default and namespace imports of fontkit
  const fontkitModule = (fontkit as any).default || fontkit;
  doc.registerFontkit(fontkitModule);
  
  const fontBytes = await loadFontBytes();
  
  const [hebrew, english, englishBold] = await Promise.all([
    doc.embedFont(fontBytes.hebrew),
    doc.embedFont(fontBytes.english),
    doc.embedFont(StandardFonts.HelveticaBold),
  ]);
  
  return { hebrew, english, englishBold };
}

/**
 * Clear the font cache. Useful for testing or when fonts are updated.
 */
export function clearFontCache(): void {
  cachedFontBytes = { hebrew: null, english: null };
}
