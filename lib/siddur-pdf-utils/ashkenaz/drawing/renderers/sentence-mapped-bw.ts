import { rgb } from 'pdf-lib';

import {
  AshkenazContentGenerationParams,
  PdfDrawingContext,
  Prayer,
  WordMapping,
} from '../types';
import { drawSourceIfPresent } from '../drawing-helpers';
import siddurConfig from '../../siddur-formatting-config.json';
import { groupMappingsBySentence, toSubscript, toSuperscript } from '../helpers/sentence-mapping';

/**
 * Converts RGB color values to grayscale.
 * @param r - Red component (0-1)
 * @param g - Green component (0-1)
 * @param b - Blue component (0-1)
 * @returns Grayscale RGB color
 */
const toGrayscale = (r: number, g: number, b: number) => {
  const gray = 0.299 * r + 0.587 * g + 0.114 * b;
  return rgb(gray, gray, gray);
};

/**
 * Represents a segment of an underline for bracket notation.
 */
interface UnderlineSegment {
  /** Starting X coordinate of the segment */
  startX: number;
  /** Ending X coordinate of the segment */
  endX: number;
  /** Y coordinate of the segment */
  y: number;
  /** Whether this is the first segment in a series */
  isFirst: boolean;
  /** Whether this is the last segment in a series */
  isLast: boolean;
}

/**
 * Tracks the current position and column boundaries for text rendering.
 */
interface ColumnPositionState {
  /** Current X coordinate */
  x: number;
  /** Current Y coordinate */
  y: number;
  /** Starting X coordinate of the column */
  columnStart: number;
  /** Ending X coordinate of the column */
  columnEnd: number;
}

/**
 * Core rendering context with PDF document references.
 */
interface RenderContext {
  /** PDF page object */
  page: any;
  /** Font objects for different scripts */
  fonts: any;
  /** PDF document object */
  pdfDoc: any;
  /** Page height */
  height: number;
  /** Page margin */
  margin: number;
}

/**
 * Draws bracket-style underlines for phrase segments.
 * @param page - PDF page object
 * @param segments - Array of underline segments to draw
 * @param color - Color of the underlines
 */
const drawBracketUnderlines = (
  page: any,
  segments: UnderlineSegment[],
  color: any,
) => {
  const tickHeight = 3.36; // 3 * 1.12
  segments.forEach((seg) => {
    const underlineY = seg.y - 2;
    // Horizontal line
    page.drawLine({
      start: { x: seg.startX, y: underlineY },
      end: { x: seg.endX, y: underlineY },
      thickness: 1,
      color,
    });
    // Start tick (only if this is the first segment)
    if (seg.isFirst) {
      page.drawLine({
        start: { x: seg.startX, y: underlineY },
        end: { x: seg.startX, y: underlineY + tickHeight },
        thickness: 1,
        color,
      });
    }
    // End tick (only if this is the last segment)
    if (seg.isLast) {
      page.drawLine({
        start: { x: seg.endX, y: underlineY },
        end: { x: seg.endX, y: underlineY + tickHeight },
        thickness: 1,
        color,
      });
    }
  });
};

/**
 * Draws Hebrew line notation showing sentence and phrase indices.
 * @param page - PDF page object
 * @param lineIndices - Map of Y coordinates to phrase indices
 * @param sentenceNum - Current sentence number
 * @param x - X coordinate for the notation
 * @param fonts - Font objects
 * @param fontSize - Base font size
 */
const drawHebrewLineNotation = (
  page: any,
  lineIndices: Map<number, number[]>,
  sentenceNum: number,
  x: number,
  fonts: any,
  fontSize: number,
) => {
  const sortedYs = Array.from(lineIndices.keys()).sort((a, b) => b - a);
  sortedYs.forEach((y) => {
    const indices = lineIndices.get(y)!.sort((a, b) => a - b);
    if (indices.length === 0) return;
    
    const min = indices[0];
    const max = indices[indices.length - 1];
    const rangeStr = min === max ? toSubscript(min) : `${toSubscript(min)}-${toSubscript(max)}`;
    const notation = `ts${rangeStr}⁽${toSuperscript(sentenceNum)}⁾`;
    
    page.drawText(notation, {
      x,
      y: y + 2,
      font: fonts.english,
      size: fontSize * 0.6,
      color: rgb(0, 0, 0),
    });
  });
};

/**
 * Renders an English phrase with word wrapping and underline tracking.
 * @param context - Rendering context
 * @param positionState - Current position state
 * @param text - English text to render
 * @param fontSize - Font size
 * @param lineHeight - Line height
 * @param color - Text color
 * @param checkPageBreak - Callback to check if page break is needed
 * @returns Underline segments and updated position state
 */
const renderEnglishPhrase = (
  context: RenderContext,
  positionState: ColumnPositionState,
  text: string,
  fontSize: number,
  lineHeight: number,
  color: any,
  checkPageBreak: () => void,
): { segments: UnderlineSegment[]; newState: ColumnPositionState } => {
  const { page, fonts } = context;
  let { x, y, columnStart, columnEnd } = positionState;
  const parts = text.split(/( )/);
  const segments: UnderlineSegment[] = [];
  let segmentStartX = x;
  let segmentY = y;
  let isFirst = true;

  parts.forEach((part: string) => {
    if (part === '') return;

    if (part === ' ') {
      const spaceWidth = fonts.english.widthOfTextAtSize(' ', fontSize);
      if (x + spaceWidth > columnEnd) {
        if (x > segmentStartX) {
          segments.push({ startX: segmentStartX, endX: x, y: segmentY, isFirst, isLast: false });
          isFirst = false;
        }
        x = columnStart;
        y -= lineHeight;
        checkPageBreak();
        segmentStartX = x;
        segmentY = y;
      }
      x += spaceWidth;
      return;
    }

    const wordWidth = fonts.english.widthOfTextAtSize(part, fontSize);
    if (x + wordWidth > columnEnd) {
      if (x > segmentStartX) {
        segments.push({ startX: segmentStartX, endX: x, y: segmentY, isFirst, isLast: false });
        isFirst = false;
      }
      x = columnStart;
      y -= lineHeight;
      checkPageBreak();
      segmentStartX = x;
      segmentY = y;
    }
    page.drawText(part, { x, y, font: fonts.english, size: fontSize, color });
    x += wordWidth;
  });

  if (x > segmentStartX) {
    segments.push({ startX: segmentStartX, endX: x, y: segmentY, isFirst, isLast: true });
  }

  return { segments, newState: { x, y, columnStart, columnEnd } };
};

/**
 * Renders a Hebrew phrase with right-to-left layout, word wrapping, and line index tracking.
 * @param context - Rendering context
 * @param positionState - Current position state
 * @param text - Hebrew text to render
 * @param fontSize - Font size
 * @param lineHeight - Line height
 * @param color - Text color
 * @param phraseIndex - Index of the current phrase
 * @param sentenceLineIndices - Map tracking which phrases appear on which lines
 * @param checkPageBreak - Callback to check if page break is needed
 * @returns Underline segments and updated position state
 */
const renderHebrewPhrase = (
  context: RenderContext,
  positionState: ColumnPositionState,
  text: string,
  fontSize: number,
  lineHeight: number,
  color: any,
  phraseIndex: number,
  sentenceLineIndices: Map<number, number[]>,
  checkPageBreak: () => void,
): { segments: UnderlineSegment[]; newState: ColumnPositionState } => {
  const { page, fonts } = context;
  let { x, y, columnStart, columnEnd } = positionState;
  const words = text.split(/( )/).filter((w: string) => w !== '');
  const segments: UnderlineSegment[] = [];
  let segmentStartX = x;
  let segmentY = y;
  let isFirst = true;

  const trackPhraseIndex = () => {
    if (!sentenceLineIndices.has(y)) {
      sentenceLineIndices.set(y, []);
    }
    if (!sentenceLineIndices.get(y)!.includes(phraseIndex)) {
      sentenceLineIndices.get(y)!.push(phraseIndex);
    }
  };

  words.forEach((word: string) => {
    if (word === '') return;
    
    trackPhraseIndex();
    
    const wordWidth = fonts.hebrew.widthOfTextAtSize(word, fontSize);
    if (x - wordWidth < columnStart) {
      if (x < segmentStartX) {
        segments.push({ startX: x, endX: segmentStartX, y: segmentY, isFirst, isLast: false });
        isFirst = false;
      }
      x = columnEnd;
      y -= lineHeight;
      checkPageBreak();
      segmentStartX = x;
      segmentY = y;
      trackPhraseIndex();
    }
    x -= wordWidth;
    page.drawText(word, { x, y, font: fonts.hebrew, size: fontSize, color });
  });

  if (x < segmentStartX) {
    segments.push({ startX: x, endX: segmentStartX, y: segmentY, isFirst, isLast: true });
  }

  return { segments, newState: { x, y, columnStart, columnEnd } };
};

/**
 * Renders phrase notation with subscript/superscript formatting.
 * @param context - Rendering context
 * @param positionState - Current position state
 * @param notationValue - Notation text to render
 * @param fontSize - Base font size
 * @param lineHeight - Line height
 * @param checkPageBreak - Callback to check if page break is needed
 * @returns Updated position state
 */
const renderPhraseNotation = (
  context: RenderContext,
  positionState: ColumnPositionState,
  notationValue: string,
  fontSize: number,
  lineHeight: number,
  checkPageBreak: () => void,
): ColumnPositionState => {
  const { page, fonts } = context;
  let { x, y, columnStart, columnEnd } = positionState;
  const notationSize = fontSize * 0.6;
  const colorLetter = 'ts';
  const restOfNotation = notationValue.substring(2);

  const colorLetterWidth = fonts.english.widthOfTextAtSize(colorLetter, notationSize);
  if (x + colorLetterWidth > columnEnd) {
    x = columnStart;
    y -= lineHeight;
    checkPageBreak();
  }
  page.drawText(colorLetter, {
    x,
    y: y - (fontSize - notationSize) * 0.5,
    font: fonts.english,
    size: notationSize,
    color: rgb(0, 0, 0),
  });
  x += colorLetterWidth;

  const restWidth = fonts.english.widthOfTextAtSize(restOfNotation, notationSize);
  if (x + restWidth > columnEnd) {
    x = columnStart;
    y -= lineHeight;
    checkPageBreak();
  }
  page.drawText(restOfNotation, {
    x,
    y: y - (fontSize - notationSize) * 0.5,
    font: fonts.english,
    size: notationSize,
    color: rgb(0, 0, 0),
  });
  x += restWidth;

  return { x, y, columnStart, columnEnd };
};

/**
 * Renders a transliteration phrase with word wrapping and underline tracking.
 * @param context - Rendering context
 * @param positionState - Current position state
 * @param text - Transliteration text to render
 * @param fontSize - Font size
 * @param lineHeight - Line height
 * @param color - Text color
 * @param checkPageBreak - Callback to check if page break is needed
 * @returns Underline segments and updated position state
 */
const renderTransliterationPhrase = (
  context: RenderContext,
  positionState: ColumnPositionState,
  text: string,
  fontSize: number,
  lineHeight: number,
  color: any,
  checkPageBreak: () => void,
): { segments: UnderlineSegment[]; newState: ColumnPositionState } => {
  const { page, fonts } = context;
  let { x, y, columnStart, columnEnd } = positionState;
  const parts = text.split(/( )/);
  const segments: UnderlineSegment[] = [];
  let segmentStartX = x;
  let segmentY = y;
  let isFirst = true;

  parts.forEach((part: string) => {
    if (part === '') return;
    if (part === ' ') {
      const spaceWidth = fonts.english.widthOfTextAtSize(' ', fontSize);
      if (x + spaceWidth > columnEnd) {
        if (x > segmentStartX) {
          segments.push({ startX: segmentStartX, endX: x, y: segmentY, isFirst, isLast: false });
          isFirst = false;
        }
        x = columnStart;
        y -= lineHeight;
        checkPageBreak();
        segmentStartX = x;
        segmentY = y;
      }
      x += spaceWidth;
      return;
    }
    const wordWidth = fonts.english.widthOfTextAtSize(part, fontSize);
    if (x + wordWidth > columnEnd) {
      if (x > segmentStartX) {
        segments.push({ startX: segmentStartX, endX: x, y: segmentY, isFirst, isLast: false });
        isFirst = false;
      }
      x = columnStart;
      y -= lineHeight;
      checkPageBreak();
      segmentStartX = x;
      segmentY = y;
    }
    page.drawText(part, { x, y, font: fonts.english, size: fontSize, color });
    x += wordWidth;
  });

  if (x > segmentStartX) {
    segments.push({ startX: segmentStartX, endX: x, y: segmentY, isFirst, isLast: true });
  }

  return { segments, newState: { x, y, columnStart, columnEnd } };
};

/**
 * Processes a single phrase mapping in two-column layout (English + Hebrew).
 * @param mapping - Phrase mapping data
 * @param phraseIndex - Index of the current phrase
 * @param displaySentenceNum - Display number for the sentence
 * @param context - Rendering context with all formatting parameters
 * @param state - Current position state for both columns
 * @param sentenceLineIndices - Map tracking phrase positions
 * @param color - Color for rendering
 * @param checkPageBreak - Callback to check if page break is needed
 * @returns Updated positions for both columns
 */
const processPhraseMapping = (
  mapping: any,
  phraseIndex: number,
  displaySentenceNum: number,
  context: {
    page: any;
    fonts: any;
    pdfDoc: any;
    height: number;
    margin: number;
    englishFontSize: number;
    englishLineHeight: number;
    hebrewFontSize: number;
    hebrewLineHeight: number;
    englishColumnStart: number;
    englishColumnEnd: number;
    hebrewColumnStart: number;
    hebrewColumnEnd: number;
    showSubscripts: boolean;
  },
  state: {
    currentEnglishX: number;
    englishY: number;
    currentHebrewX: number;
    hebrewY: number;
  },
  sentenceLineIndices: Map<number, number[]>,
  color: any,
  checkPageBreak: () => void,
): { englishX: number; englishY: number; hebrewX: number; hebrewY: number } => {
  const renderContext = { page: context.page, fonts: context.fonts, pdfDoc: context.pdfDoc, height: context.height, margin: context.margin };
  
  const notationValue =
    context.showSubscripts && phraseIndex
      ? `ts${toSubscript(phraseIndex)}⁽${toSuperscript(displaySentenceNum)}⁾`
      : undefined;
  const englishNotation = phraseIndex === 1 ? notationValue : undefined;

  // English rendering
  const englishResult = renderEnglishPhrase(
    renderContext,
    { x: state.currentEnglishX, y: state.englishY, columnStart: context.englishColumnStart, columnEnd: context.englishColumnEnd },
    mapping.english,
    context.englishFontSize,
    context.englishLineHeight,
    color,
    checkPageBreak,
  );
  drawBracketUnderlines(context.page, englishResult.segments, color);
  let currentEnglishX = englishResult.newState.x;
  let englishY = englishResult.newState.y;

  // English notation
  if (englishNotation) {
    const notationState = renderPhraseNotation(
      renderContext,
      { x: currentEnglishX, y: englishY, columnStart: context.englishColumnStart, columnEnd: context.englishColumnEnd },
      notationValue!,
      context.englishFontSize,
      context.englishLineHeight,
      checkPageBreak,
    );
    currentEnglishX = notationState.x;
    englishY = notationState.y;
  }

  // Add space after English phrase
  const enSpaceWidth = context.fonts.english.widthOfTextAtSize(' ', context.englishFontSize);
  if (currentEnglishX + enSpaceWidth > context.englishColumnEnd) {
    currentEnglishX = context.englishColumnStart;
    englishY -= context.englishLineHeight;
    checkPageBreak();
  }
  currentEnglishX += enSpaceWidth;

  // Hebrew rendering
  const hebrewResult = renderHebrewPhrase(
    renderContext,
    { x: state.currentHebrewX, y: state.hebrewY, columnStart: context.hebrewColumnStart, columnEnd: context.hebrewColumnEnd },
    mapping.hebrew,
    context.hebrewFontSize,
    context.hebrewLineHeight,
    color,
    phraseIndex,
    sentenceLineIndices,
    checkPageBreak,
  );
  drawBracketUnderlines(context.page, hebrewResult.segments, color);
  let currentHebrewX = hebrewResult.newState.x;
  let hebrewY = hebrewResult.newState.y;

  // Add space after Hebrew phrase
  const heSpaceWidth = context.fonts.hebrew.widthOfTextAtSize(' ', context.hebrewFontSize);
  if (currentHebrewX - heSpaceWidth < context.hebrewColumnStart) {
    currentHebrewX = context.hebrewColumnEnd;
    hebrewY -= context.hebrewLineHeight;
    checkPageBreak();
  }
  currentHebrewX -= heSpaceWidth;

  return { englishX: currentEnglishX, englishY, hebrewX: currentHebrewX, hebrewY };
};

/**
 * Processes a single phrase mapping in three-column layout (English + Transliteration + Hebrew).
 * @param mapping - Phrase mapping data
 * @param phraseIndex - Index of the current phrase
 * @param displaySentenceNum - Display number for the sentence
 * @param context - Rendering context with all formatting parameters
 * @param state - Current position state for all three columns
 * @param sentenceLineIndices - Map tracking phrase positions
 * @param color - Color for rendering
 * @param checkPageBreak - Callback to check if page break is needed
 * @returns Updated positions for all three columns
 */
const processPhraseMappingThreeColumn = (
  mapping: any,
  phraseIndex: number,
  displaySentenceNum: number,
  context: {
    page: any;
    fonts: any;
    pdfDoc: any;
    height: number;
    margin: number;
    englishFontSize: number;
    englishLineHeight: number;
    translitFontSize: number;
    translitLineHeight: number;
    hebrewFontSize: number;
    hebrewLineHeight: number;
    englishColumnStart: number;
    transliterationColumnStart: number;
    hebrewColumnStart: number;
    hebrewColumnEnd: number;
    columnWidth: number;
    showSubscripts: boolean;
  },
  state: {
    currentEnglishX: number;
    englishY: number;
    currentTranslitX: number;
    translitY: number;
    currentHebrewX: number;
    hebrewY: number;
  },
  sentenceLineIndices: Map<number, number[]>,
  color: any,
  checkPageBreak: () => void,
): { englishX: number; englishY: number; translitX: number; translitY: number; hebrewX: number; hebrewY: number } => {
  const renderContext = { page: context.page, fonts: context.fonts, pdfDoc: context.pdfDoc, height: context.height, margin: context.margin };
  
  const notationValue =
    context.showSubscripts && phraseIndex
      ? `ts${toSubscript(phraseIndex)}⁽${toSuperscript(displaySentenceNum)}⁾`
      : undefined;
  const englishNotation = phraseIndex === 1 ? notationValue : undefined;

  const englishColumnEnd = context.englishColumnStart + context.columnWidth;
  const translitColumnEnd = context.transliterationColumnStart + context.columnWidth;

  // English rendering
  const englishResult = renderEnglishPhrase(
    renderContext,
    { x: state.currentEnglishX, y: state.englishY, columnStart: context.englishColumnStart, columnEnd: englishColumnEnd },
    mapping.english,
    context.englishFontSize,
    context.englishLineHeight,
    color,
    checkPageBreak,
  );
  drawBracketUnderlines(context.page, englishResult.segments, color);
  let currentEnglishX = englishResult.newState.x;
  let englishY = englishResult.newState.y;

  // English notation
  if (englishNotation) {
    const notationState = renderPhraseNotation(
      renderContext,
      { x: currentEnglishX, y: englishY, columnStart: context.englishColumnStart, columnEnd: englishColumnEnd },
      notationValue!,
      context.englishFontSize,
      context.englishLineHeight,
      checkPageBreak,
    );
    currentEnglishX = notationState.x;
    englishY = notationState.y;
  }

  // Add space after English phrase
  const enSpaceWidth = context.fonts.english.widthOfTextAtSize(' ', context.englishFontSize);
  if (currentEnglishX + enSpaceWidth > englishColumnEnd) {
    currentEnglishX = context.englishColumnStart;
    englishY -= context.englishLineHeight;
    checkPageBreak();
  }
  currentEnglishX += enSpaceWidth;

  // Transliteration rendering
  const translitText = mapping.transliteration || mapping.Transliteration || '';
  const translitResult = renderTransliterationPhrase(
    renderContext,
    { x: state.currentTranslitX, y: state.translitY, columnStart: context.transliterationColumnStart, columnEnd: translitColumnEnd },
    translitText,
    context.translitFontSize,
    context.translitLineHeight,
    color,
    checkPageBreak,
  );
  drawBracketUnderlines(context.page, translitResult.segments, color);
  let currentTranslitX = translitResult.newState.x;
  let translitY = translitResult.newState.y;

  // Transliteration notation
  if (notationValue) {
    const notationState = renderPhraseNotation(
      renderContext,
      { x: currentTranslitX, y: translitY, columnStart: context.transliterationColumnStart, columnEnd: translitColumnEnd },
      notationValue,
      context.translitFontSize,
      context.translitLineHeight,
      checkPageBreak,
    );
    currentTranslitX = notationState.x;
    translitY = notationState.y;
  }

  // Add space after transliteration phrase
  const trSpaceWidth = context.fonts.english.widthOfTextAtSize(' ', context.translitFontSize);
  if (currentTranslitX + trSpaceWidth > translitColumnEnd) {
    currentTranslitX = context.transliterationColumnStart;
    translitY -= context.translitLineHeight;
    checkPageBreak();
  }
  currentTranslitX += trSpaceWidth;

  // Hebrew rendering (with warning for multi-word phrases)
  const hebrewWordCount =
    mapping.hebrew?.trim().split(/\s+/).filter(Boolean).length ?? 0;
  if (hebrewWordCount > 1) {
    console.warn(
      `[SentenceMapping Warning] Hebrew phrase contains multiple words: "${mapping.hebrew}"`,
    );
  }

  const hebrewResult = renderHebrewPhrase(
    renderContext,
    { x: state.currentHebrewX, y: state.hebrewY, columnStart: context.hebrewColumnStart, columnEnd: context.hebrewColumnEnd },
    mapping.hebrew,
    context.hebrewFontSize,
    context.hebrewLineHeight,
    color,
    phraseIndex,
    sentenceLineIndices,
    checkPageBreak,
  );
  drawBracketUnderlines(context.page, hebrewResult.segments, color);
  let currentHebrewX = hebrewResult.newState.x;
  let hebrewY = hebrewResult.newState.y;

  // Add space after Hebrew phrase
  const heSpaceWidth = context.fonts.hebrew.widthOfTextAtSize(' ', context.hebrewFontSize);
  if (currentHebrewX - heSpaceWidth < context.hebrewColumnStart) {
    currentHebrewX = context.hebrewColumnEnd;
/**
 * Retrieves the mapped colors for word mapping from the configuration.
 * @returns An array of objects containing the ID and RGB color for each mapping.
 */
const getMappedColors = () => {
  return Object.entries(siddurConfig.colors.wordMappingColors).map(
    ([key, value]) => ({
      id: key.charAt(0),
      color: rgb(value[0], value[1], value[2]),
    }),
  );
};

/**
 * Processes and draws a single sentence for the two-column layout.
 * @param context - The PDF drawing context.
 * @param sentenceNum - The index of the sentence being processed.
 * @param phrases - The list of phrases in the sentence.
 * @param mappedColors - The list of colors to use for mapping.
 * @param params - Generation parameters.
 * @param layout - Layout configuration including column boundaries.
 * @param state - Current drawing state (positions).
 * @returns The updated drawing state.
 */
const processSentenceBW = (
  context: {
    page: any;
    fonts: any;
    pdfDoc: any;
    height: number;
    margin: number;
    englishFontSize: number;
    englishLineHeight: number;
    hebrewFontSize: number;
    hebrewLineHeight: number;
    showSubscripts: boolean;
  },
  sentenceNum: number,
  phrases: { mapping: any; phraseIndex: number }[],
  mappedColors: { id: string; color: any }[],
  layout: {
    englishColumnStart: number;
    englishColumnEnd: number;
    hebrewColumnStart: number;
    hebrewColumnEnd: number;
  },
  state: {
    currentEnglishX: number;
    englishY: number;
    currentHebrewX: number;
    hebrewY: number;
  },
): {
  currentEnglishX: number;
  englishY: number;
  currentHebrewX: number;
  hebrewY: number;
  page: any;
} => {
  let { page } = context;
  let { currentEnglishX, englishY, currentHebrewX, hebrewY } = state;
  const displaySentenceNum = sentenceNum + 1;
  const sentenceLineIndices = new Map<number, number[]>();
  let colorIndex = 0;

  phrases.forEach(({ mapping, phraseIndex }) => {
    const colorData = mappedColors[colorIndex % mappedColors.length];
    const color = toGrayscale(
      colorData.color.red,
      colorData.color.green,
      colorData.color.blue,
    );
    colorIndex++;

    const checkAndHandlePageBreak = () => {
      if (
        englishY < siddurConfig.pdfMargins.bottom ||
        hebrewY < siddurConfig.pdfMargins.bottom
      ) {
        page = context.pdfDoc.addPage();
        const topY = context.height - siddurConfig.pdfMargins.top;
        englishY = topY;
        hebrewY = topY;
        currentEnglishX = layout.englishColumnStart;
        currentHebrewX = layout.hebrewColumnEnd;
      }
    };

    const result = processPhraseMapping(
      mapping,
      phraseIndex,
      displaySentenceNum,
      {
        ...context,
        page,
        englishColumnStart: layout.englishColumnStart,
        englishColumnEnd: layout.englishColumnEnd,
        hebrewColumnStart: layout.hebrewColumnStart,
        hebrewColumnEnd: layout.hebrewColumnEnd,
      },
      { currentEnglishX, englishY, currentHebrewX, hebrewY },
      sentenceLineIndices,
      color,
      checkAndHandlePageBreak,
    );

    currentEnglishX = result.englishX;
    englishY = result.englishY;
    currentHebrewX = result.hebrewX;
    hebrewY = result.hebrewY;
  });

  // Draw side notation for this sentence
  if (context.showSubscripts) {
    drawHebrewLineNotation(
      page,
      sentenceLineIndices,
      displaySentenceNum,
      layout.hebrewColumnEnd + 5,
      context.fonts,
      context.englishFontSize,
    );
  }

  return { currentEnglishX, englishY, currentHebrewX, hebrewY, page };
};

/**
 * Draws a prayer using sentence-based mapping in black and white (two columns).
 * @param context - The PDF drawing context.
 * @param prayer - The prayer data.
 * @param wordMappings - The word mappings for the prayer.
 * @param params - Generation parameters.
 * @param columnWidth - The width of the columns.
 * @returns The updated PDF drawing context.
 */
export const drawSentenceBasedMappingPrayerBW = (
  context: PdfDrawingContext,
  prayer: Prayer,
  wordMappings: WordMapping,
  params: AshkenazContentGenerationParams,
  columnWidth: number,
): PdfDrawingContext => {
  let { page, y, margin, fonts, width, pdfDoc, height } = context;

  const mappedColors = getMappedColors();

  const showSubscripts = (params as any).showWordMappingSubscripts !== false;
  const fontSizeMultiplier = (params as any).fontSizeMultiplier ?? 1.0;

  const hebrewFontSize =
    siddurConfig.fontSizes.blessingHebrew * fontSizeMultiplier;
  const hebrewLineHeight =
    siddurConfig.lineSpacing.defaultHebrewPrayer * fontSizeMultiplier;
  const englishFontSize =
    siddurConfig.fontSizes.blessingEnglish * fontSizeMultiplier;
  const englishLineHeight =
    siddurConfig.lineSpacing.defaultEnglishPrayer * fontSizeMultiplier;

  const hebrewColumnStart = width / 2 + siddurConfig.layout.hebrewColumnXOffset;
  const hebrewColumnEnd = width - margin;
  const englishColumnStart = margin;
  const englishColumnEnd = margin + columnWidth;

  let hebrewY = y;
  let englishY = y;
  let currentHebrewX = hebrewColumnEnd;
  let currentEnglishX = englishColumnStart;

  const sentenceMap = groupMappingsBySentence(wordMappings);
  const sortedSentences = Array.from(sentenceMap.keys()).sort((a, b) => a - b);

  sortedSentences.forEach((sentenceNum) => {
    const phrases = sentenceMap.get(sentenceNum)!;
    const result = processSentenceBW(
      {
        page,
        fonts,
        pdfDoc,
        height,
        margin,
        englishFontSize,
        englishLineHeight,
        hebrewFontSize,
        hebrewLineHeight,
        showSubscripts,
      },
      sentenceNum,
      phrases,
      mappedColors,
      {
        englishColumnStart,
        englishColumnEnd,
        hebrewColumnStart,
        hebrewColumnEnd,
      },
      { currentEnglishX, englishY, currentHebrewX, hebrewY },
    );

    currentEnglishX = result.currentEnglishX;
    englishY = result.englishY;
    currentHebrewX = result.currentHebrewX;
    hebrewY = result.hebrewY;
    page = result.page;
  });

  let updatedContext = {
    ...context,
    page,
    y: Math.min(englishY, hebrewY),
  };
  updatedContext = drawSourceIfPresent(
    updatedContext,
    prayer,
    params,
    width - margin * 2,
  );
  updatedContext.y -= siddurConfig.verticalSpacing.afterPrayerText;

  return updatedContext;
};

/**
 * Processes and draws a single sentence for the three-column layout.
 * @param context - The PDF drawing context.
 * @param sentenceNum - The index of the sentence being processed.
 * @param phrases - The list of phrases in the sentence.
 * @param mappedColors - The list of colors to use for mapping.
 * @param params - Generation parameters.
 * @param layout - Layout configuration including column boundaries.
 * @param state - Current drawing state (positions).
 * @returns The updated drawing state.
 */
const processSentenceThreeColumnBW = (
  context: {
    page: any;
    fonts: any;
    pdfDoc: any;
    height: number;
    margin: number;
    englishFontSize: number;
    englishLineHeight: number;
    translitFontSize: number;
    translitLineHeight: number;
    hebrewFontSize: number;
    hebrewLineHeight: number;
    showSubscripts: boolean;
  },
  sentenceNum: number,
  phrases: { mapping: any; phraseIndex: number }[],
  mappedColors: { id: string; color: any }[],
  layout: {
    englishColumnStart: number;
    transliterationColumnStart: number;
    hebrewColumnStart: number;
    hebrewColumnEnd: number;
    columnWidth: number;
  },
  state: {
    currentEnglishX: number;
    englishY: number;
    currentTranslitX: number;
    translitY: number;
    currentHebrewX: number;
    hebrewY: number;
  },
): {
  currentEnglishX: number;
  englishY: number;
  currentTranslitX: number;
  translitY: number;
  currentHebrewX: number;
  hebrewY: number;
  page: any;
} => {
  let { page } = context;
  let {
    currentEnglishX,
    englishY,
    currentTranslitX,
    translitY,
    currentHebrewX,
    hebrewY,
  } = state;
  const displaySentenceNum = sentenceNum + 1;
  const sentenceLineIndices = new Map<number, number[]>();
  let colorIndex = 0;

  phrases.forEach(({ mapping, phraseIndex }) => {
    const colorData = mappedColors[colorIndex % mappedColors.length];
    const color = toGrayscale(
      colorData.color.red,
      colorData.color.green,
      colorData.color.blue,
    );
    colorIndex++;

    const checkAndHandlePageBreak = () => {
      if (
        englishY < siddurConfig.pdfMargins.bottom ||
        translitY < siddurConfig.pdfMargins.bottom ||
        hebrewY < siddurConfig.pdfMargins.bottom
      ) {
        page = context.pdfDoc.addPage();
        const topY = context.height - siddurConfig.pdfMargins.top;
        englishY = topY;
        translitY = topY;
        hebrewY = topY;
        currentEnglishX = layout.englishColumnStart;
        currentTranslitX = layout.transliterationColumnStart;
        currentHebrewX = layout.hebrewColumnEnd;
      }
    };

    const result = processPhraseMappingThreeColumn(
      mapping,
      phraseIndex,
      displaySentenceNum,
      {
        ...context,
        page,
        englishColumnStart: layout.englishColumnStart,
        transliterationColumnStart: layout.transliterationColumnStart,
        hebrewColumnStart: layout.hebrewColumnStart,
        hebrewColumnEnd: layout.hebrewColumnEnd,
        columnWidth: layout.columnWidth,
      },
      {
        currentEnglishX,
        englishY,
        currentTranslitX,
        translitY,
        currentHebrewX,
        hebrewY,
      },
      sentenceLineIndices,
      color,
      checkAndHandlePageBreak,
    );

    currentEnglishX = result.englishX;
    englishY = result.englishY;
    currentTranslitX = result.translitX;
    translitY = result.translitY;
    currentHebrewX = result.hebrewX;
    hebrewY = result.hebrewY;
  });

  // Draw side notation for this sentence
  if (context.showSubscripts) {
    drawHebrewLineNotation(
      page,
      sentenceLineIndices,
      displaySentenceNum,
      layout.hebrewColumnEnd + 5,
      context.fonts,
      context.englishFontSize,
    );
  }

  return {
    currentEnglishX,
    englishY,
    currentTranslitX,
    translitY,
    currentHebrewX,
    hebrewY,
    page,
  };
};

/**
 * Draws a prayer using sentence-based mapping in black and white (three columns).
 * @param context - The PDF drawing context.
 * @param prayer - The prayer data.
 * @param wordMappings - The word mappings for the prayer.
 * @param params - Generation parameters.
 * @returns The updated PDF drawing context.
 */
export const drawSentenceBasedMappingPrayerThreeColumnBW = (
  context: PdfDrawingContext,
  prayer: Prayer,
  wordMappings: WordMapping,
  params: AshkenazContentGenerationParams,
): PdfDrawingContext => {
  let { page, y, margin, fonts, width, pdfDoc, height } = context;

  const mappedColors = getMappedColors();

  const showSubscripts = (params as any).showWordMappingSubscripts !== false;
  const fontSizeMultiplier = (params as any).fontSizeMultiplier ?? 1.0;

  const columnGutter = 15;
  const totalContentWidth = width - margin * 2;
  const columnWidth = (totalContentWidth - 2 * columnGutter) / 3;
  const englishColumnStart = margin;
  const transliterationColumnStart = margin + columnWidth + columnGutter;
  const hebrewColumnStart = margin + 2 * columnWidth + 2 * columnGutter;
  const hebrewColumnEnd = width - margin;

  const englishFontSize =
    siddurConfig.fontSizes.blessingEnglish * fontSizeMultiplier;
  const englishLineHeight =
    siddurConfig.lineSpacing.defaultEnglishPrayer * fontSizeMultiplier;
  const translitFontSize =
    siddurConfig.fontSizes.blessingEnglish * fontSizeMultiplier;
  const translitLineHeight =
    siddurConfig.lineSpacing.defaultEnglishPrayer * fontSizeMultiplier;
  const hebrewFontSize =
    siddurConfig.fontSizes.blessingHebrew * fontSizeMultiplier;
  const hebrewLineHeight =
    siddurConfig.lineSpacing.defaultHebrewPrayer * fontSizeMultiplier;

  let englishY = y;
  let translitY = y;
  let hebrewY = y;
  let currentEnglishX = englishColumnStart;
  let currentTranslitX = transliterationColumnStart;
  let currentHebrewX = hebrewColumnEnd;

  const sentenceMap = groupMappingsBySentence(wordMappings);
  const sortedSentences = Array.from(sentenceMap.keys()).sort((a, b) => a - b);

  sortedSentences.forEach((sentenceNum) => {
    const phrases = sentenceMap.get(sentenceNum)!;
    const result = processSentenceThreeColumnBW(
      {
        page,
        fonts,
        pdfDoc,
        height,
        margin,
        englishFontSize,
        englishLineHeight,
        translitFontSize,
        translitLineHeight,
        hebrewFontSize,
        hebrewLineHeight,
        showSubscripts,
      },
      sentenceNum,
      phrases,
      mappedColors,
      {
        englishColumnStart,
        transliterationColumnStart,
        hebrewColumnStart,
        hebrewColumnEnd,
        columnWidth,
      },
      {
        currentEnglishX,
        englishY,
        currentTranslitX,
        translitY,
        currentHebrewX,
        hebrewY,
      },
    );

    currentEnglishX = result.currentEnglishX;
    englishY = result.englishY;
    currentTranslitX = result.currentTranslitX;
    translitY = result.translitY;
    currentHebrewX = result.currentHebrewX;
    hebrewY = result.hebrewY;
    page = result.page;
  });

  let updatedContext = {
    ...context,
    page,
    y: Math.min(englishY, translitY, hebrewY),
  };
  updatedContext = drawSourceIfPresent(
    updatedContext,
    prayer,
    params,
    width - margin * 2,
  );
  updatedContext.y -= siddurConfig.verticalSpacing.afterPrayerText;

  return updatedContext;
};
